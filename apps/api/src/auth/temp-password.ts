import { randomInt } from 'node:crypto';

// O'xshash belgilarsiz (0/o, 1/l/i) alifbo: parol og'zaki yoki qog'ozda uzatilishi mumkin. 31^12 ≈ 2^59.
const ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789';

/** Vaqtinchalik parol, masalan `k7mq-x2hn-p9de`. Faqat bir marta ko'rsatiladi, saqlanmaydi, logga yozilmaydi. */
export function generateTempPassword(): string {
  const group = () => Array.from({ length: 4 }, () => ALPHABET[randomInt(ALPHABET.length)]).join('');
  return `${group()}-${group()}-${group()}`;
}
