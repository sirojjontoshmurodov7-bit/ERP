import { type Attachment, type EngineRule, type GroupBase, monthEndOf, planPayroll, ruleActiveIn } from './payroll-engine.js';

const MONTH = '2026-03-01';
const rule = (o: Partial<EngineRule> & Pick<EngineRule, 'id' | 'type'>): EngineRule => ({
  employeeId: 'e1',
  groupId: null,
  amount: null,
  percent: null,
  percentBase: null,
  teacherKind: null,
  validFrom: '2026-01-01',
  validTo: null,
  ...o,
});
const att = (groupId: string, kind: 'MAIN' | 'ASSISTANT' = 'MAIN', from = '2026-01-01', to: string | null = null): Attachment => ({ employeeId: 'e1', groupId, kind, from, to });
const bases = (o: Record<string, GroupBase>) => new Map(Object.entries(o));
const plan = (rules: EngineRule[], extra: Partial<Parameters<typeof planPayroll>[0]> = {}) =>
  planPayroll({ month: MONTH, rules, attachments: [], lessons: [], bases: new Map(), ...extra });

describe('maosh motori (planPayroll)', () => {
  it('oy chegaralari va qoida muddati', () => {
    expect(monthEndOf('2026-02-01')).toBe('2026-02-28');
    expect(monthEndOf('2028-02-01')).toBe('2028-02-29');
    expect(monthEndOf('2026-03-15')).toBe('2026-03-31');
    expect(ruleActiveIn({ validFrom: '2026-03-31', validTo: null }, MONTH)).toBe(true);
    expect(ruleActiveIn({ validFrom: '2026-04-01', validTo: null }, MONTH)).toBe(false);
    expect(ruleActiveIn({ validFrom: '2026-01-01', validTo: '2026-03-01' }, MONTH)).toBe(true);
    expect(ruleActiveIn({ validFrom: '2026-01-01', validTo: '2026-02-28' }, MONTH)).toBe(false);
  });

  it("FIXED: davr uchun qat'iy summa; muddati tashqarida qoida hisobga olinmaydi", () => {
    const r = plan([rule({ id: 'r1', type: 'FIXED', amount: 3_000_000 }), rule({ id: 'r2', type: 'FIXED', amount: 1, validTo: '2026-02-28' })]);
    expect(r).toEqual([{ ruleId: 'r1', employeeId: 'e1', groupId: null, baseAmount: 3_000_000, amount: 3_000_000, description: "Qat'iy oylik" }]);
  });

  it('PER_GROUP: biriktirilgan har guruh uchun; aniq guruh berilsa faqat shu; ASSISTANT filtri; oy bilan kesishmaydigan biriktirish hisobga olinmaydi', () => {
    const attachments = [att('g1', 'MAIN'), att('g2', 'ASSISTANT'), att('g3', 'ASSISTANT', '2026-04-01'), att('g4', 'ASSISTANT', '2025-01-01', '2026-02-28'), att('g2', 'ASSISTANT', '2026-03-10')];
    const all = plan([rule({ id: 'r1', type: 'PER_GROUP', amount: 500_000 })], { attachments });
    expect(all.map((i) => i.groupId)).toEqual(['g1', 'g2']); // g2 takrorlanmaydi
    const assistants = plan([rule({ id: 'r1', type: 'PER_GROUP', amount: 500_000, teacherKind: 'ASSISTANT' })], { attachments });
    expect(assistants.map((i) => i.groupId)).toEqual(['g2']);
    const explicit = plan([rule({ id: 'r1', type: 'PER_GROUP', amount: 700_000, groupId: 'g9' })], { attachments });
    expect(explicit).toEqual([expect.objectContaining({ groupId: 'g9', amount: 700_000 })]);
  });

  it("PER_LESSON: o'tgan darslar soni x summa, guruh bo'yicha; nol dars qator bermaydi; boshqa xodim darsi hisobga olinmaydi", () => {
    const lessons = [
      { employeeId: 'e1', groupId: 'g1', count: 12 },
      { employeeId: 'e1', groupId: 'g2', count: 0 },
      { employeeId: 'e1', groupId: 'g3', count: 4 },
      { employeeId: 'e2', groupId: 'g1', count: 99 },
    ];
    const r = plan([rule({ id: 'r1', type: 'PER_LESSON', amount: 50_000 })], { lessons });
    expect(r.map((i) => [i.groupId, i.baseAmount, i.amount])).toEqual([['g1', 12, 600_000], ['g3', 4, 200_000]]);
    expect(r[0]!.description).toBe('12 dars x 50 000');
    expect(plan([rule({ id: 'r1', type: 'PER_LESSON', amount: 50_000, groupId: 'g3' })], { lessons }).map((i) => i.amount)).toEqual([200_000]);
  });

  it("PERCENT: to'langan yoki hisoblangan asosdan foiz, yaxlitlanadi; manfiy asos 0; nol natija qator bermaydi", () => {
    const attachments = [att('g1'), att('g2'), att('g3')];
    const b = bases({ g1: { paid: 3_000_000, charged: 4_000_000 }, g2: { paid: -500_000, charged: 1 }, g3: { paid: 333, charged: 0 } });
    const paid = plan([rule({ id: 'r1', type: 'PERCENT', percent: 30, percentBase: 'PAID' })], { attachments, bases: b });
    expect(paid.map((i) => [i.groupId, i.baseAmount, i.amount])).toEqual([['g1', 3_000_000, 900_000], ['g3', 333, 100]]); // 99.9 -> 100; g2 manfiy -> qator yo'q
    expect(paid[0]!.description).toBe("To'langan 3 000 000 ning 30%");
    const charged = plan([rule({ id: 'r1', type: 'PERCENT', percent: 12.5, percentBase: 'CHARGED' })], { attachments, bases: b });
    expect(charged.map((i) => [i.groupId, i.amount])).toEqual([['g1', 500_000]]); // g2: 1 * 12.5% = 0.125 -> 0
    expect(charged[0]!.description).toBe('Hisoblangan 4 000 000 ning 12.5%');
  });

  it("aralash qoidalar bir xodimda qo'shiladi va tartib deterministik", () => {
    const attachments = [att('g1')];
    const r = plan(
      [rule({ id: 'b', type: 'PERCENT', percent: 10, percentBase: 'PAID' }), rule({ id: 'a', type: 'FIXED', amount: 1_000_000 })],
      { attachments, bases: bases({ g1: { paid: 2_000_000, charged: 0 } }) },
    );
    expect(r.map((i) => [i.ruleId, i.amount])).toEqual([['a', 1_000_000], ['b', 200_000]]);
  });

  it("boshqa xodimlar alohida; xodimning guruhi bo'lmasa PERCENT/PER_GROUP qator bermaydi", () => {
    const r = plan([rule({ id: 'r1', type: 'PERCENT', percent: 50, percentBase: 'PAID' }), rule({ id: 'r2', type: 'PER_GROUP', amount: 1 }), rule({ id: 'r3', employeeId: 'e2', type: 'FIXED', amount: 9 })], { bases: bases({ g1: { paid: 100, charged: 100 } }) });
    expect(r.map((i) => [i.employeeId, i.ruleId])).toEqual([['e2', 'r3']]);
  });
});
