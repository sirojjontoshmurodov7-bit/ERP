// Inglizcha lug'at: kalit = o'zbekcha matn (i18n-ru.ts bilan bir xil kalitlar). Tekshiruv: test/i18n.test.ts.
import { EN_1 } from './i18n-en-1';
import { EN_2 } from './i18n-en-2';

export const EN: Record<string, string> = { ...EN_1, ...EN_2 };
