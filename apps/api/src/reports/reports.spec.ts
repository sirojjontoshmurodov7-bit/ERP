import { attendanceStats } from './reports.service.js';

describe('attendanceStats', () => {
  it('kelgan + kech qolgan / (kelgan + kech qolgan + kelmagan), sababli hisobga olinmaydi, 1 xona', () => {
    expect(attendanceStats({ present: 2, late: 1, absent: 1, excused: 1 })).toEqual({ present: 2, late: 1, absent: 1, excused: 1, total: 5, rate: 75 });
    expect(attendanceStats({ present: 2, late: 0, absent: 1, excused: 0 }).rate).toBe(66.7);
    expect(attendanceStats({ present: 0, late: 0, absent: 3, excused: 0 }).rate).toBe(0);
  });

  it("maxraj 0 bo'lsa rate null (faqat sababli yoki bo'sh)", () => {
    expect(attendanceStats({ present: 0, late: 0, absent: 0, excused: 0 })).toMatchObject({ total: 0, rate: null });
    expect(attendanceStats({ present: 0, late: 0, absent: 0, excused: 4 })).toMatchObject({ total: 4, rate: null });
  });
});
