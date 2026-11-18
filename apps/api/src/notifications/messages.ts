import { createHmac, randomBytes } from 'node:crypto';

// Xabar matnlari (o'zbekcha, oddiy matn: parse_mode yo'q, shuning uchun belgilarni qochirish shart emas).
export const formatSom = (n: number): string => `${Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} so'm`;

export const debtMessage = (name: string, centerName: string, debt: number): string =>
  `${centerName}\nHurmatli ${name}, sizda ${formatSom(debt)} miqdorida to'lanmagan qarz bor. Iltimos, to'lovni amalga oshiring.`;

export const lessonMessage = (name: string, groupName: string, date: string, times: string, room: string | null): string =>
  `Eslatma, ${name}: ertaga (${date.slice(8, 10)}.${date.slice(5, 7)}) soat ${times} da "${groupName}" darsi${room ? `, xona: ${room}` : ''}.`;

export const homeworkMessage = (name: string, groupName: string, title: string, dueText: string): string =>
  `Eslatma, ${name}: "${groupName}" guruhi vazifasi "${title}" muddati yaqin: ${dueText}.`;

export const payrollMessage = (name: string, month: string, total: number): string => `Hurmatli ${name}, ${month} oyi uchun maosh hisoblandi: ${formatSom(total)}.`;

export const linkedMessage = (name: string): string => `Ulandi: ${name}. Endi bu yerga eslatmalar keladi. Uzish uchun /stop yuboring.`;
export const helpMessage = (): string => "Salom! Hisobingizni ulash uchun tizimdagi bir martalik kodni yuboring: /start KOD. Eslatmalarni to'xtatish uchun /stop.";
export const badCodeMessage = (): string => "Kod noto'g'ri yoki muddati tugagan. Tizimdan yangi kod oling.";
export const unlinkedMessage = (n: number): string => (n > 0 ? "Hisob uzildi. Eslatmalar endi kelmaydi." : "Bu chatga ulangan hisob topilmadi.");

// --- Bir martalik bog'lash kodi ---
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 32 belgi (0/O, 1/I farqsiz belgilarsiz): `byte & 31` bir tekis taqsimlanadi
export const LINK_CODE_LENGTH = 10;
export const LINK_CODE_TTL_MS = 15 * 60_000;

export function newLinkCode(): string {
  const bytes = randomBytes(LINK_CODE_LENGTH);
  return Array.from(bytes, (b) => ALPHABET[b & 31]).join('');
}

/** Foydalanuvchi yuborgan kodni tozalaydi (registr, bo'shliq, chiziqcha); yaroqsiz bo'lsa `null`. */
export function normalizeLinkCode(raw: string): string | null {
  const code = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
  return code.length === LINK_CODE_LENGTH && code.split('').every((ch) => ALPHABET.includes(ch)) ? code : null;
}

export const hashLinkCode = (code: string, secret: string): string => createHmac('sha256', secret).update(`tg-link:${code}`).digest('hex');
