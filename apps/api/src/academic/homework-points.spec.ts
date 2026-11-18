import { homeworkPoints } from './assignments.service.js';

describe('homeworkPoints (10 ballik shkala)', () => {
  it('baho maksimalga nisbatan 0..10 ballga o\'tadi va yaxlitlanadi', () => {
    expect(homeworkPoints(100, 100)).toBe(10);
    expect(homeworkPoints(80, 100)).toBe(8);
    expect(homeworkPoints(50, 100)).toBe(5);
    expect(homeworkPoints(15, 20)).toBe(8); // 7.5 -> 8
    expect(homeworkPoints(0, 100)).toBe(0);
    expect(homeworkPoints(4, 100)).toBe(0); // 0.4 -> 0
    expect(homeworkPoints(1, 3)).toBe(3); // 3.33 -> 3
  });
});
