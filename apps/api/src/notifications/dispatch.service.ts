import { Injectable, Logger } from '@nestjs/common';
import { eq, inArray, sql } from 'drizzle-orm';
import { BillingService } from '../billing/billing.service.js';
import { addDays, isoWeekday, todayLocal } from '../common/dates.js';
import { DbService, type TenantContext, type Tx } from '../db/db.service.js';
import { centers, notificationLog } from '../db/schema.js';
import { rowsOf } from '../db/rows.js';
import { debtMessage, homeworkMessage, lessonMessage, payrollMessage } from './messages.js';
import { RUN_TYPES, type RunInput, type RunType } from './notifications.schemas.js';
import { TelegramSender } from './telegram.sender.js';

type Row = Record<string, unknown>;

interface Candidate {
  userId: string;
  chatId: number;
  type: RunType;
  dedupeKey: string;
  text: string;
  payload: Record<string, unknown>;
}

export type RunSummary = Record<RunType, { sent: number; failed: number }>;
const emptySummary = (): RunSummary => ({ DEBT: { sent: 0, failed: 0 }, LESSON: { sent: 0, failed: 0 }, HOMEWORK: { sent: 0, failed: 0 }, PAYROLL: { sent: 0, failed: 0 } });

const HOUR_MS = 3_600_000;
const DAY_MS = 24 * HOUR_MS;

/**
 * Avtomatik eslatmalar (cron yo'q: tashqi trigger yoki rahbar `POST /notifications/run` chaqiradi).
 * Faqat Telegram ulangan faol foydalanuvchilar uchun nomzod tuziladi; takror yuborish `dedupe_key` bilan to'siladi
 * (qarz uchun: oxirgi `debtGapDays` kunda yuborilgan bo'lsa yuborilmaydi). Yuborish tranzaksiyadan tashqarida.
 */
@Injectable()
export class DispatchService {
  private readonly log = new Logger(DispatchService.name);
  private readonly running = new Set<string>();

  constructor(
    private readonly db: DbService,
    private readonly billing: BillingService,
    private readonly sender: TelegramSender,
  ) {}

  isConfigured(): boolean {
    return this.sender.isConfigured();
  }

  /** Bitta markaz uchun. Bir vaqtda ikki marta ishga tushirilsa, ikkinchisi bo'sh natija qaytaradi. */
  async runForCenter(centerId: string, opts: Partial<Pick<RunInput, 'types' | 'debtGapDays'>> = {}, now: Date = new Date()): Promise<RunSummary> {
    const summary = emptySummary();
    if (this.running.has(centerId)) return summary;
    this.running.add(centerId);
    try {
      const types = opts.types ?? [...RUN_TYPES];
      const ctx: TenantContext = { centerId, isSuperAdmin: false };
      const candidates = await this.db.withContext(ctx, (tx) => this.collect(tx, centerId, types, opts.debtGapDays ?? 7, now));
      for (const c of candidates) {
        const res = await this.sender.send(c.chatId, c.text);
        await this.db.withContext(ctx, async (tx) => {
          await tx
            .insert(notificationLog)
            .values({ centerId, userId: c.userId, type: c.type, dedupeKey: c.dedupeKey, payload: c.payload, status: res.ok ? 'SENT' : 'FAILED', error: res.ok ? null : res.code })
            .onConflictDoNothing();
          if (!res.ok && res.blocked) await tx.execute(sql`select app_telegram_unlink(${c.chatId}::bigint)`); // bot to'silgan: keyingi urinishlar yo'q
        });
        summary[c.type][res.ok ? 'sent' : 'failed']++;
      }
    } finally {
      this.running.delete(centerId);
    }
    return summary;
  }

  /** Hamma faol (TRIAL/ACTIVE) markaz uchun, ketma-ket; bitta markaz xatosi qolganini to'xtatmaydi. */
  async runAll(opts: Partial<Pick<RunInput, 'types' | 'debtGapDays'>> = {}, now: Date = new Date()) {
    const ids = await this.db.withContext({ centerId: null, isSuperAdmin: true }, async (tx) =>
      (await tx.select({ id: centers.id }).from(centers).where(inArray(centers.status, ['TRIAL', 'ACTIVE']))).map((c) => c.id),
    );
    const totals = emptySummary();
    let failedCenters = 0;
    for (const id of ids) {
      try {
        const s = await this.runForCenter(id, opts, now);
        for (const t of RUN_TYPES) {
          totals[t].sent += s[t].sent;
          totals[t].failed += s[t].failed;
        }
      } catch (e) {
        failedCenters++;
        this.log.error(`Markaz bo'yicha yuborish xatosi: ${e instanceof Error ? e.message : 'noma\'lum'}`); // o'quvchi/moliya ma'lumoti logga tushmaydi
      }
    }
    return { centers: ids.length, failedCenters, totals };
  }

  // --- nomzodlar ---
  private async collect(tx: Tx, centerId: string, types: RunType[], debtGapDays: number, now: Date): Promise<Candidate[]> {
    const out: Candidate[] = [];
    const today = todayLocal(now);
    const tomorrow = addDays(today, 1);
    const [center] = await tx.select({ name: centers.name }).from(centers).where(eq(centers.id, centerId));
    const centerName = center?.name ?? '';
    const dedupe = (type: string, key: SQLText) => sql`not exists (select 1 from notification_log n where n.user_id = ${key.userCol} and n.type = ${type} and n.status = 'SENT' and n.dedupe_key = ${key.expr})`;

    if (types.includes('DEBT')) {
      await this.billing.generate(tx, centerId);
      const since = new Date(now.getTime() - debtGapDays * DAY_MS).toISOString();
      const rows = rowsOf<Row>(
        await tx.execute(sql`
          select c.student_id as "userId", u.full_name as "name", u.telegram_chat_id as "chatId",
                 sum(c.amount - coalesce(p.paid, 0)) as debt
          from charges c
          join groups g on g.id = c.group_id
          join users u on u.id = c.student_id
          left join (select charge_id, sum(amount) as paid from payment_allocations group by charge_id) p on p.charge_id = c.id
          where c.status in ('OPEN','PARTIAL') and ${today}::date > c.due_date + g.grace_days
            and u.status = 'ACTIVE' and u.telegram_chat_id is not null
            and not exists (select 1 from notification_log n where n.user_id = c.student_id and n.type = 'DEBT' and n.status = 'SENT' and n.created_at > ${since}::timestamptz)
          group by c.student_id, u.full_name, u.telegram_chat_id
          order by c.student_id`),
      );
      for (const r of rows) {
        const debt = Number(r.debt);
        if (debt > 0) out.push({ userId: String(r.userId), chatId: Number(r.chatId), type: 'DEBT', dedupeKey: `DEBT:${today}`, text: debtMessage(String(r.name), centerName, debt), payload: { debt } });
      }
    }

    if (types.includes('LESSON')) {
      const wd = isoWeekday(tomorrow);
      const base = sql`
        g.status = 'ACTIVE' and g.archived_at is null
        and (g.start_date is null or g.start_date <= ${tomorrow}::date) and (g.end_date is null or g.end_date >= ${tomorrow}::date)
        and not exists (select 1 from lessons l where l.group_id = g.id and l.lesson_date = ${tomorrow}::date and l.status = 'CANCELLED')`;
      const times = sql`string_agg(substr(gs.start_time::text, 1, 5), ', ' order by gs.start_time)`;
      const students = rowsOf<Row>(
        await tx.execute(sql`
          select u.id as "userId", u.full_name as "name", u.telegram_chat_id as "chatId", g.id as "groupId", g.name as "groupName", ${times} as times, max(gs.room) as room
          from group_schedules gs
          join groups g on g.id = gs.group_id
          join enrollments e on e.group_id = g.id and e.status = 'ACTIVE'
          join users u on u.id = e.student_id
          where gs.weekday = ${wd} and ${base} and u.status = 'ACTIVE' and u.telegram_chat_id is not null
            and ${dedupe('LESSON', { userCol: sql`u.id`, expr: sql`'LESSON:' || g.id::text || ':' || ${tomorrow}::text` })}
          group by u.id, u.full_name, u.telegram_chat_id, g.id, g.name
          order by u.id, g.id`),
      );
      const teachers = rowsOf<Row>(
        await tx.execute(sql`
          select u.id as "userId", u.full_name as "name", u.telegram_chat_id as "chatId", g.id as "groupId", g.name as "groupName", ${times} as times, max(gs.room) as room
          from group_schedules gs
          join groups g on g.id = gs.group_id
          join group_teachers gt on gt.group_id = g.id and gt.from_date <= ${tomorrow}::date and (gt.to_date is null or gt.to_date >= ${tomorrow}::date)
          join users u on u.id = gt.teacher_id
          where gs.weekday = ${wd} and ${base} and u.status = 'ACTIVE' and u.telegram_chat_id is not null
            and ${dedupe('LESSON', { userCol: sql`u.id`, expr: sql`'LESSON:' || g.id::text || ':' || ${tomorrow}::text` })}
          group by u.id, u.full_name, u.telegram_chat_id, g.id, g.name
          order by u.id, g.id`),
      );
      for (const r of [...students, ...teachers]) {
        out.push({
          userId: String(r.userId),
          chatId: Number(r.chatId),
          type: 'LESSON',
          dedupeKey: `LESSON:${String(r.groupId)}:${tomorrow}`,
          text: lessonMessage(String(r.name), String(r.groupName), tomorrow, String(r.times), typeof r.room === 'string' ? r.room : null),
          payload: { groupId: r.groupId, date: tomorrow },
        });
      }
    }

    if (types.includes('HOMEWORK')) {
      const from = now.toISOString();
      const to = new Date(now.getTime() + DAY_MS).toISOString();
      const rows = rowsOf<Row>(
        await tx.execute(sql`
          select a.id as "assignmentId", a.title as "title", to_char(a.due_at at time zone 'Asia/Tashkent', 'DD.MM HH24:MI') as "dueText",
                 g.name as "groupName", u.id as "userId", u.full_name as "name", u.telegram_chat_id as "chatId"
          from assignments a
          join groups g on g.id = a.group_id
          join enrollments e on e.group_id = g.id and e.status = 'ACTIVE'
          join users u on u.id = e.student_id
          where a.archived_at is null and a.due_at > ${from}::timestamptz and a.due_at <= ${to}::timestamptz
            and not exists (select 1 from submissions s where s.assignment_id = a.id and s.student_id = e.student_id)
            and u.status = 'ACTIVE' and u.telegram_chat_id is not null
            and ${dedupe('HOMEWORK', { userCol: sql`u.id`, expr: sql`'HW:' || a.id::text` })}
          order by u.id, a.id`),
      );
      for (const r of rows) {
        out.push({
          userId: String(r.userId),
          chatId: Number(r.chatId),
          type: 'HOMEWORK',
          dedupeKey: `HW:${String(r.assignmentId)}`,
          text: homeworkMessage(String(r.name), String(r.groupName), String(r.title), String(r.dueText)),
          payload: { assignmentId: r.assignmentId },
        });
      }
    }

    if (types.includes('PAYROLL')) {
      const since = new Date(now.getTime() - 14 * DAY_MS).toISOString();
      const rows = rowsOf<Row>(
        await tx.execute(sql`
          select e.employee_id as "userId", u.full_name as "name", u.telegram_chat_id as "chatId", pp.id as "periodId", to_char(pp.month, 'YYYY-MM') as "month",
                 coalesce((select sum(i.amount) from payroll_items i where i.period_id = pp.id and i.employee_id = e.employee_id), 0)
                 + coalesce((select sum(a.amount) from payroll_adjustments a where a.period_id = pp.id and a.employee_id = e.employee_id), 0) as total
          from payroll_periods pp
          join (select distinct period_id, employee_id from payroll_items) e on e.period_id = pp.id
          join users u on u.id = e.employee_id
          where pp.status in ('APPROVED','PAID') and pp.approved_at > ${since}::timestamptz
            and u.status = 'ACTIVE' and u.telegram_chat_id is not null
            and ${dedupe('PAYROLL', { userCol: sql`u.id`, expr: sql`'PAYROLL:' || pp.id::text` })}
          order by u.id, pp.id`),
      );
      for (const r of rows) {
        const total = Number(r.total);
        if (total > 0) out.push({ userId: String(r.userId), chatId: Number(r.chatId), type: 'PAYROLL', dedupeKey: `PAYROLL:${String(r.periodId)}`, text: payrollMessage(String(r.name), String(r.month), total), payload: { periodId: r.periodId, total } });
      }
    }
    return out;
  }
}

interface SQLText {
  userCol: ReturnType<typeof sql>;
  expr: ReturnType<typeof sql>;
}
