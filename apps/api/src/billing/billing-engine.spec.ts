import { addDays, clampedDate, isoWeekday, todayLocal } from '../common/dates.js';
import { countLessons, discountFor, type EngineContext, type EngineEnrollment, type EngineGroup, planCharges } from './billing-engine.js';

const group = (over: Partial<EngineGroup> = {}): EngineGroup => ({
  priceMonthly: 400_000,
  billingMode: 'GROUP_CYCLE',
  billingDay: 5,
  startDate: null,
  endDate: null,
  status: 'ACTIVE',
  archived: false,
  scheduleWeekdays: [],
  ...over,
});
const enrollment = (joinedAt: string, over: Partial<EngineEnrollment> = {}): EngineEnrollment => ({ joinedAt, billingAnchor: null, priceOverride: null, ...over });
const ctx = (asOf: string, over: Partial<EngineContext> = {}): EngineContext => ({
  asOf,
  joinProration: 'FULL_MONTH',
  existingPeriodStarts: new Set(),
  freezes: [],
  discounts: [],
  ...over,
});
const starts = (d: { periodStart: string }[]) => d.map((x) => x.periodStart);

describe('sana yordamchilari', () => {
  it("clampedDate qisqa oyda oxirgi kunga siljiydi va yil o'tishini qo'llaydi", () => {
    expect(clampedDate(2026, 2, 31)).toBe('2026-02-28');
    expect(clampedDate(2028, 2, 31)).toBe('2028-02-29'); // kabisa yili
    expect(clampedDate(2026, 4, 31)).toBe('2026-04-30');
    expect(clampedDate(2026, 13, 15)).toBe('2027-01-15');
    expect(clampedDate(2026, 0, 15)).toBe('2025-12-15');
  });
  it('isoWeekday va addDays', () => {
    expect(isoWeekday('2026-03-05')).toBe(4); // payshanba
    expect(isoWeekday('2026-03-08')).toBe(7); // yakshanba
    expect(addDays('2026-02-28', 1)).toBe('2026-03-01');
  });
  it("todayLocal Toshkent (UTC+5) bo'yicha: UTC 19:00 dan keyin ertangi kun", () => {
    expect(todayLocal(new Date('2026-11-18T18:59:00Z'))).toBe('2026-11-18');
    expect(todayLocal(new Date('2026-11-18T19:00:00Z'))).toBe('2026-11-19');
  });
});

describe('GROUP_CYCLE', () => {
  it("davr boshida yozilgan: har oyning 5-kuni, to'lov muddati = davr boshi, hozirgacha", () => {
    const d = planCharges(enrollment('2026-03-05'), group(), ctx('2026-05-20'));
    expect(starts(d)).toEqual(['2026-03-05', '2026-04-05', '2026-05-05']);
    expect(d.map((x) => x.periodEnd)).toEqual(['2026-04-04', '2026-05-04', '2026-06-04']);
    expect(d.every((x) => x.kind === 'REGULAR' && x.dueDate === x.periodStart && x.amount === 400_000 && x.discountAmount === 0)).toBe(true);
  });

  it("kelajak davr oldindan hisoblanmaydi: davr boshi aynan bugun bo'lsa hisoblanadi", () => {
    expect(starts(planCharges(enrollment('2026-03-05'), group(), ctx('2026-04-04')))).toEqual(['2026-03-05']);
    expect(starts(planCharges(enrollment('2026-03-05'), group(), ctx('2026-04-05')))).toEqual(['2026-03-05', '2026-04-05']);
  });

  it("kech yozilgan: birinchi davr FIRST_PRORATED, to'lov muddati yozilgan kun, FULL_MONTH to'liq narx", () => {
    const d = planCharges(enrollment('2026-03-17'), group(), ctx('2026-04-10'));
    expect(d[0]).toMatchObject({ periodStart: '2026-03-05', periodEnd: '2026-04-04', dueDate: '2026-03-17', baseAmount: 400_000, kind: 'FIRST_PRORATED' });
    expect(d[1]).toMatchObject({ periodStart: '2026-04-05', dueDate: '2026-04-05', kind: 'REGULAR' });
  });

  it("REMAINING_LESSONS: jadvaldagi qolgan darslar nisbatida; jadval bo'sh bo'lsa to'liq narx", () => {
    const g = group({ scheduleWeekdays: [1, 3, 5] }); // du-chor-ju
    expect(countLessons([1, 3, 5], '2026-03-05', '2026-04-04')).toBe(13);
    expect(countLessons([1, 3, 5], '2026-03-17', '2026-04-04')).toBe(8);
    const d = planCharges(enrollment('2026-03-17'), g, ctx('2026-03-20', { joinProration: 'REMAINING_LESSONS' }));
    expect(d).toHaveLength(1);
    expect(d[0]).toMatchObject({ kind: 'FIRST_PRORATED', baseAmount: Math.round((400_000 * 8) / 13), amount: 246_154 });

    const noSchedule = planCharges(enrollment('2026-03-17'), group(), ctx('2026-03-20', { joinProration: 'REMAINING_LESSONS' }));
    expect(noSchedule[0]!.baseAmount).toBe(400_000);
    const exact = planCharges(enrollment('2026-03-05'), g, ctx('2026-03-20', { joinProration: 'REMAINING_LESSONS' }));
    expect(exact[0]).toMatchObject({ kind: 'REGULAR', baseAmount: 400_000 }); // davr boshida yozilganda proratsiya yo'q
  });

  it("qolgan dars yo'q bo'lsa nol summali birinchi charge; yil o'tishi", () => {
    // 2026-04-03 (juma) dan keyin davr oxirigacha dars yo'q: qolgan 0
    const d = planCharges(enrollment('2026-04-04'), group({ scheduleWeekdays: [1, 3, 5] }), ctx('2026-04-04', { joinProration: 'REMAINING_LESSONS' }));
    expect(d[0]).toMatchObject({ kind: 'FIRST_PRORATED', baseAmount: 0, amount: 0 });

    const y = planCharges(enrollment('2025-11-20'), group({ billingDay: 15 }), ctx('2026-02-20'));
    expect(starts(y)).toEqual(['2025-11-15', '2025-12-15', '2026-01-15', '2026-02-15']);
    expect(y[0]!.dueDate).toBe('2025-11-20');
  });

  it("takroriy chaqirish: mavjud davrlar o'tkazib yuboriladi (idempotent)", () => {
    const first = planCharges(enrollment('2026-03-05'), group(), ctx('2026-05-20'));
    const again = planCharges(enrollment('2026-03-05'), group(), ctx('2026-05-20', { existingPeriodStarts: new Set(starts(first)) }));
    expect(again).toEqual([]);
    const partial = planCharges(enrollment('2026-03-05'), group(), ctx('2026-05-20', { existingPeriodStarts: new Set(['2026-03-05', '2026-05-05']) }));
    expect(starts(partial)).toEqual(['2026-04-05']);
  });

  it("guruh boshlanish sanasi yozilishdan keyin bo'lsa hisob guruh boshlanganda boshlanadi", () => {
    const d = planCharges(enrollment('2026-03-01'), group({ startDate: '2026-04-01', status: 'ACTIVE' }), ctx('2026-04-20'));
    expect(d[0]).toMatchObject({ periodStart: '2026-03-05', dueDate: '2026-04-01', kind: 'FIRST_PRORATED' });
    expect(starts(d)).toEqual(['2026-03-05', '2026-04-05']);
  });
});

describe('STUDENT_CYCLE', () => {
  const sg = (over: Partial<EngineGroup> = {}) => group({ billingMode: 'STUDENT_CYCLE', billingDay: null, ...over });

  it("davr yozilgan (anchor) kunidan, to'liq oy, hech qachon FIRST_PRORATED emas", () => {
    const d = planCharges(enrollment('2026-03-17', { billingAnchor: '2026-03-17' }), sg(), ctx('2026-05-20'));
    expect(starts(d)).toEqual(['2026-03-17', '2026-04-17', '2026-05-17']);
    expect(d.map((x) => x.periodEnd)).toEqual(['2026-04-16', '2026-05-16', '2026-06-16']);
    expect(d.every((x) => x.kind === 'REGULAR' && x.dueDate === x.periodStart)).toBe(true);
  });

  it("29-31 kunlik anchor qisqa oyda oyning oxirgi kuniga siljiydi va keyin qaytadi", () => {
    const d = planCharges(enrollment('2026-01-31', { billingAnchor: '2026-01-31' }), sg(), ctx('2026-04-30'));
    expect(starts(d)).toEqual(['2026-01-31', '2026-02-28', '2026-03-31', '2026-04-30']);
    expect(d.map((x) => x.periodEnd)).toEqual(['2026-02-27', '2026-03-30', '2026-04-29', '2026-05-30']);
  });

  it("anchor yo'q bo'lsa yozilgan sana; guruh keyin boshlansa anchor guruh boshlanishiga suriladi", () => {
    expect(starts(planCharges(enrollment('2026-03-10'), sg(), ctx('2026-04-15')))).toEqual(['2026-03-10', '2026-04-10']);
    const late = planCharges(enrollment('2026-03-10', { billingAnchor: '2026-03-10' }), sg({ startDate: '2026-04-01' }), ctx('2026-05-02'));
    expect(starts(late)).toEqual(['2026-04-01', '2026-05-01']);
  });
});

describe('muzlatish va chiqish', () => {
  it("davr boshi [from, to) ga tushsa o'tkazib yuboriladi: oldingi va keyingilar hisoblanadi", () => {
    const e = enrollment('2026-03-05');
    const d = planCharges(e, group(), ctx('2026-07-10', { freezes: [{ from: '2026-04-10', to: '2026-06-05' }] }));
    expect(starts(d)).toEqual(['2026-03-05', '2026-04-05', '2026-06-05', '2026-07-05']); // 04-05 muzlatishdan oldin, 05-05 ichida (o'tkazildi), 06-05 (to) dan hisoblanadi
  });

  it("ochiq muzlatish (to = null): keyingi davrlar yaratilmaydi", () => {
    const d = planCharges(enrollment('2026-03-05'), group(), ctx('2026-07-10', { freezes: [{ from: '2026-04-10', to: null }] }));
    expect(starts(d)).toEqual(['2026-03-05', '2026-04-05']); // muzlatishdan oldin boshlangan davrlar hisoblanadi, keyingilari yo'q
  });

  it("chiqqan sana: to'lov muddati shu kunga teng yoki keyin bo'lgan davrlar yaratilmaydi", () => {
    const e = enrollment('2026-03-05');
    expect(starts(planCharges(e, group(), ctx('2026-07-10', { leftAt: '2026-04-05' })))).toEqual(['2026-03-05']);
    expect(starts(planCharges(e, group(), ctx('2026-07-10', { leftAt: '2026-04-06' })))).toEqual(['2026-03-05', '2026-04-05']);
  });

  it("hali yozilmagan (kelajak sanasi) o'quvchiga charge yo'q", () => {
    expect(planCharges(enrollment('2026-06-01'), group(), ctx('2026-05-20'))).toEqual([]);
  });
});

describe('guruh holati', () => {
  const e = enrollment('2026-03-05');
  it("arxivlangan va tugagan guruhga charge yo'q; PLANNED faqat boshlanish sanasiga yetgandan keyin", () => {
    expect(planCharges(e, group({ archived: true }), ctx('2026-05-20'))).toEqual([]);
    expect(planCharges(e, group({ status: 'FINISHED' }), ctx('2026-05-20'))).toEqual([]);
    expect(planCharges(e, group({ status: 'PLANNED' }), ctx('2026-05-20'))).toEqual([]);
    expect(planCharges(e, group({ status: 'PLANNED', startDate: '2026-06-01' }), ctx('2026-05-20'))).toEqual([]);
    expect(starts(planCharges(e, group({ status: 'PLANNED', startDate: '2026-03-01' }), ctx('2026-04-10')))).toEqual(['2026-03-05', '2026-04-05']);
  });

  it("tugash sanasidan keyingi davrlar yaratilmaydi", () => {
    expect(starts(planCharges(e, group({ endDate: '2026-04-20' }), ctx('2026-07-10')))).toEqual(['2026-03-05', '2026-04-05']);
  });
});

describe('narx va chegirma', () => {
  const e = enrollment('2026-03-05');
  it("individual narx guruh narxidan ustun", () => {
    expect(planCharges(enrollment('2026-03-05', { priceOverride: 300_000 }), group(), ctx('2026-03-10'))[0]).toMatchObject({ baseAmount: 300_000, amount: 300_000 });
    expect(planCharges(enrollment('2026-03-05', { priceOverride: 0 }), group(), ctx('2026-03-10'))[0]).toMatchObject({ baseAmount: 0, amount: 0 });
  });

  it("chegirmalar: foiz, summa, bepul; sana oralig'i; asosdan oshmaydi; charge yaratilganda qotiriladi", () => {
    expect(discountFor(400_000, [{ type: 'PERCENT', value: 10, fromDate: null, toDate: null }], '2026-03-05')).toBe(40_000);
    expect(discountFor(400_000, [{ type: 'PERCENT', value: 15, fromDate: null, toDate: null }], '2026-03-05')).toBe(60_000);
    expect(discountFor(333_333, [{ type: 'PERCENT', value: 10, fromDate: null, toDate: null }], '2026-03-05')).toBe(33_333); // pastga yaxlitlanadi
    expect(discountFor(400_000, [{ type: 'AMOUNT', value: 50_000, fromDate: null, toDate: null }, { type: 'PERCENT', value: 10, fromDate: null, toDate: null }], '2026-03-05')).toBe(90_000);
    expect(discountFor(400_000, [{ type: 'FREE', value: null, fromDate: null, toDate: null }], '2026-03-05')).toBe(400_000);
    expect(discountFor(400_000, [{ type: 'AMOUNT', value: 900_000, fromDate: null, toDate: null }], '2026-03-05')).toBe(400_000);
    expect(discountFor(400_000, [{ type: 'AMOUNT', value: 50_000, fromDate: '2026-04-01', toDate: null }], '2026-03-05')).toBe(0);
    expect(discountFor(400_000, [{ type: 'AMOUNT', value: 50_000, fromDate: null, toDate: '2026-03-31' }], '2026-04-05')).toBe(0);

    const d = planCharges(e, group(), ctx('2026-05-10', { discounts: [{ type: 'PERCENT', value: 25, fromDate: '2026-04-01', toDate: '2026-04-30' }] }));
    expect(d.map((x) => [x.baseAmount, x.discountAmount, x.amount])).toEqual([
      [400_000, 0, 400_000],
      [400_000, 100_000, 300_000], // faqat aprel davriga
      [400_000, 0, 400_000],
    ]);
  });

  it("bepul chegirma: summa nol", () => {
    const d = planCharges(e, group(), ctx('2026-03-10', { discounts: [{ type: 'FREE', value: null, fromDate: null, toDate: null }] }));
    expect(d[0]).toMatchObject({ baseAmount: 400_000, discountAmount: 400_000, amount: 0 });
  });
});
