'use client';
// O'quvchi portali: salomlashish banneri (bugungi darslar va vazifalar), shaxsiy ko'rsatkichlar, bugungi jadval, vazifalar, guruh reytingi va oxirgi baholar.
import { useT } from '@/lib/i18n';
import Link from 'next/link';
import { Card, Kpi, KpiSkeleton } from '@/components/dash';
import { Icon } from '@/components/icons';
import { ButtonLink, DataView, Empty, Skeleton, Tag } from '@/components/ui';
import { date, dateLong, dateTime, todayLocal, tsDate } from '@/lib/format';
import { useSession } from '@/lib/session';
import { useApi } from '@/lib/use-api';
import type { Assignment } from '../assignments/types';
import { type Group, mainTeacher } from '../groups/types';

interface Summary {
  totals: { present: number; absent: number; late: number; excused: number; total: number; rate: number | null };
}
interface Ranking {
  my: { rank: number; points: number } | null;
  total: number;
  items: { rank: number; studentId: string; studentName: string; total: number }[];
}

export const todaysWeekday = () => ((new Date(`${todayLocal()}T00:00:00Z`).getUTCDay() + 6) % 7) + 1;
const nowHm = () => new Date(Date.now() + 5 * 3_600_000).toISOString().slice(11, 16);

export function StudentView() {
  const t = useT();
  const { me } = useSession();
  const groups = useApi<{ items: Group[] }>('/groups');
  const open = useApi<{ items: Assignment[] }>('/assignments', { status: 'open', limit: 20 });
  const all = useApi<{ items: Assignment[] }>('/assignments', { limit: 50 });
  const att = useApi<Summary>('/attendance/summary');
  const firstGroup = groups.data?.items[0]?.id;
  const rating = useApi<Ranking>(firstGroup ? '/ratings' : null, { scope: 'group', groupId: firstGroup, period: 'month', limit: 3 });

  const first = me.fullName.split(' ')[0] ?? me.fullName;
  const wd = todaysWeekday();
  const today = (groups.data?.items ?? [])
    .flatMap((g) => g.schedule.filter((s) => s.weekday === wd).map((s) => ({ g, s })))
    .sort((a, b) => a.s.startTime.localeCompare(b.s.startTime));
  const now = nowHm();
  const next = today.find((x) => x.s.endTime > now);
  const dueToday = (open.data?.items ?? []).filter((a) => a.dueAt && tsDate(a.dueAt) === date(todayLocal()) && !a.mySubmission).length;
  const todo = (open.data?.items ?? []).filter((a) => !a.mySubmission).length;
  const graded = (all.data?.items ?? [])
    .filter((a) => a.mySubmission?.graded && a.mySubmission.score !== null)
    .sort((a, b) => (b.mySubmission!.submittedAt ?? '').localeCompare(a.mySubmission!.submittedAt ?? ''));
  const avg = graded.length ? Math.round(graded.reduce((s, a) => s + (a.mySubmission!.score! / Math.max(1, a.maxScore)) * 100, 0) / graded.length) : null;

  const headline = !(groups.data && open.data)
    ? t('Bugungi kuningiz')
    : today.length
      ? dueToday
        ? t('Bugun {n} ta darsingiz va {m} ta vazifa muddati bor', { n: today.length, m: dueToday })
        : t('Bugun {n} ta darsingiz', { n: today.length })
      : dueToday
        ? t("Bugun darsingiz yo'q va {m} ta vazifa muddati bor", { m: dueToday })
        : t("Bugun darsingiz yo'q");

  return (
    <>
      <section className="panel hero" aria-labelledby="hello-h">
        <div className="hero-text">
          <span className="eyebrow">{t('Xush kelibsiz, {name}', { name: first })}</span>
          <h1 id="hello-h">{headline}</h1>
          <p className="page-head-sub">
            {next ? t('Keyingi dars soat {time} da: {place}.', { time: next.s.startTime, place: [next.g.name, next.s.room, next.g.branchName].filter(Boolean).join(', ') }) : today.length ? t('Bugungi darslar tugadi.') : t("{date}: jadvalingizda dars yo'q.", { date: dateLong(todayLocal()) })}
          </p>
        </div>
        <div className="actions">
          <ButtonLink href="/groups" icon={<Icon.calendar />}>
            {t("Jadval")}
          </ButtonLink>
          <ButtonLink href="/assignments" variant="primary" icon={<Icon.upload />}>
            {t("Vazifa topshirish")}
          </ButtonLink>
        </div>
      </section>

      {att.data || all.data ? (
        <section className="kpis" aria-label={t("Shaxsiy ko'rsatkichlar")}>
          <Kpi title="O'rtacha baho" icon="star" tone="emerald" value={avg === null ? t("yo'q") : <>{avg}<small>/ 100</small></>} note={graded.length ? t('{n} ta baho', { n: graded.length }) : undefined} />
          <Kpi
            title="Davomat"
            icon="check"
            tone="cyan"
            value={att.data?.totals.rate === null || !att.data ? t("yo'q") : `${att.data.totals.rate}%`}
            note={att.data ? t('{a}/{b} dars', { a: att.data.totals.present + att.data.totals.late, b: att.data.totals.present + att.data.totals.late + att.data.totals.absent }) : undefined}
          />
          <Kpi title="Faol vazifalar" icon="task" tone="amber" value={t('{n} ta', { n: todo })} note={dueToday ? t('{n} ta bugun', { n: dueToday }) : undefined} />
          <Kpi title="Guruh reytingi" icon="trophy" tone="violet" value={rating.data?.my ? `#${rating.data.my.rank}` : t("yo'q")} note={rating.data?.my ? t('{n} ball, shu oy', { n: rating.data.my.points }) : undefined} />
        </section>
      ) : (
        <KpiSkeleton />
      )}

      <div className="dash">
        <Card className="c-5" title="Bugungi dars jadvali" aside={<span className="small tone-text" data-tone="cyan">{dateLong(todayLocal())}</span>}>
          <DataView state={groups} skeleton={<Skeleton rows={2} cols={2} />}>
            {() =>
              today.length ? (
                <ul className="items">
                  {today.map(({ g, s }) => {
                    const hot = next && next.g.id === g.id && next.s.startTime === s.startTime;
                    const teacher = mainTeacher(g);
                    return (
                      <li key={g.id + s.startTime} className={hot ? 'item item--hot' : 'item'}>
                        <span className="item-text">
                          <span className="item-title">{g.name}</span>
                          <span className="item-sub">{[teacher ? t('Ustoz: {name}', { name: teacher }) : null, s.room, g.branchName].filter(Boolean).join(' · ')}</span>
                        </span>
                        {hot ? <Tag kind="info">{s.startTime}–{s.endTime}</Tag> : <span className="fig muted small">{s.startTime}–{s.endTime}</span>}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <Empty title="Bugun dars yo'q" text="Haftalik jadval guruhlar bo'limida." />
              )
            }
          </DataView>
        </Card>

        <Card className="c-7" title="Uyga vazifalar" aside={<Link className="link" href="/assignments">{t("Barchasi")}</Link>}>
          <DataView state={all} skeleton={<Skeleton rows={3} cols={2} />} empty={(d) => (d.items.length ? null : <Empty title="Vazifa yo'q" text="Ustoz vazifa berganda shu yerda ko'rinadi." />)}>
            {(d) => (
              <ul className="items">
                {d.items.slice(0, 4).map((a) => {
                  const s = a.mySubmission;
                  return (
                    <li key={a.id} className="item">
                      <span className="item-text">
                        <Link className="item-title" href={`/assignments/${a.id}`}>
                          {a.title}
                        </Link>
                        <span className="item-sub">
                          {a.groupName} · {s?.graded && s.score !== null ? t('Baho: {score} / {max}', { score: s.score, max: a.maxScore }) : a.dueAt ? t('Muddat: {date}', { date: dateTime(a.dueAt) }) : t('Muddatsiz')}
                        </span>
                      </span>
                      {!s ? <Tag kind="warn">{t("Topshirish kerak")}</Tag> : s.graded ? <Tag kind="ok">{t("Baholangan")}</Tag> : <Tag kind="violet">{t("Yuborilgan")}</Tag>}
                    </li>
                  );
                })}
              </ul>
            )}
          </DataView>
        </Card>

        <Card className="c-5" title="Guruh reytingi (Top 3)" sub={groups.data?.items[0] ? t('{name}, shu oy', { name: groups.data.items[0].name }) : undefined}>
          {!firstGroup && groups.data ? (
            <Empty title="Guruhga yozilmagansiz" />
          ) : (
            <DataView state={rating} skeleton={<Skeleton rows={1} cols={3} />} empty={(r) => (r.items.length ? null : <Empty title="Hali ball yo'q" text="Vazifa va davomatdan ball yig'ilgach reyting chiqadi." />)}>
              {(r) => <Podium items={r.items} me={me.id} />}
            </DataView>
          )}
        </Card>

        <section className="col c-7" aria-labelledby="grades-h">
          <h2 id="grades-h">{t("Oxirgi baholar")}</h2>
          <DataView state={all} skeleton={<div className="table-wrap"><Skeleton rows={3} cols={3} /></div>}>
            {() =>
              graded.length ? (
                <div className="table-wrap">
                  <table className="table table--compact">
                    <thead>
                      <tr>
                        <th>{t("Vazifa")}</th>
                        <th>{t("Topshirilgan")}</th>
                        <th className="num">{t("Natija")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {graded.slice(0, 5).map((a) => {
                        const p = (a.mySubmission!.score! / Math.max(1, a.maxScore)) * 100;
                        return (
                          <tr key={a.id}>
                            <td>
                              <Link className="cell-main" href={`/assignments/${a.id}`}>
                                {a.title}
                              </Link>
                              <div className="cell-sub">{a.groupName}</div>
                            </td>
                            <td className="fig">{tsDate(a.mySubmission!.submittedAt)}</td>
                            <td className="num tone-text" data-tone={p >= 80 ? 'emerald' : p >= 50 ? 'cyan' : 'coral'}>
                              {a.mySubmission!.score} / {a.maxScore}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <section className="panel">
                  <Empty title="Hali baho yo'q" text="Topshirgan vazifangiz baholangach shu yerda ko'rinadi." />
                </section>
              )
            }
          </DataView>
        </section>
      </div>
    </>
  );
}

function Podium({ items, me }: { items: Ranking['items']; me: string }) {
  const t = useT();
  const [a, b, c] = items;
  const order = [b && { p: b, place: 2 }, a && { p: a, place: 1 }, c && { p: c, place: 3 }].filter(Boolean) as { p: Ranking['items'][number]; place: number }[];
  return (
    <div className="podium">
      {order.map(({ p, place }) => (
        <div key={p.studentId} className="podium-place" data-place={place} data-me={p.studentId === me ? '' : undefined} data-tone={place === 1 ? 'amber' : p.studentId === me ? 'cyan' : undefined}>
          <span className="podium-rank">
            #{p.rank}
            {p.studentId === me ? ` ${t('(Siz)')}` : ''}
          </span>
          <span className="podium-name">{p.studentName.split(' ')[0]}</span>
          <span className="podium-pts" data-tone={place === 1 ? 'emerald' : undefined}>
            {t('{n} ball', { n: p.total })}
          </span>
        </div>
      ))}
    </div>
  );
}


