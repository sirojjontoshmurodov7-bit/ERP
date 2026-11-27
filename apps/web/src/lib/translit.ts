// O'zbek lotin -> kirill (ўзбек кирилл). Alohida lug'at yozilmaydi: kalit (lotin matn) shu funksiya bilan o'giriladi.
// Himoyalangan qismlar o'zgarmaydi: {o'zgaruvchi}, texnik so'zlar (PAID, branchId, attendance.edit_past, URL...).

const PROTECTED = /\{\w+\}|https?:\/\/\S*|\b[A-Za-z_]+\.[A-Za-z_.]+\b|\b[a-z]+[A-Z][A-Za-z]*\b|\b(?:PAID|CHARGED|PERCENT|TELEGRAM_BOT_TOKEN|TST_ERP|CSV|IP|IELTS|Payme|Click|Excel|Slug|slug|xlsx|csv|telegram|reports|UZS)\b/g;

// Oy va hafta kunlari: avtomatik qoida bermaydigan yoki rasmiy imlosi boshqacha so'zlar.
const OVERRIDES: Record<string, string> = {
  yanvar: 'январ', Yanvar: 'Январ', fevral: 'феврал', Fevral: 'Феврал', aprel: 'апрел', Aprel: 'Апрел',
  sentabr: 'сентябр', Sentabr: 'Сентябр', oktabr: 'октябр', Oktabr: 'Октябр', noyabr: 'ноябр', Noyabr: 'Ноябр', dekabr: 'декабр', Dekabr: 'Декабр',
  Ch: 'Чо', Sh: 'Ша', Ya: 'Як', Ju: 'Жу',
};

const LOWER: Record<string, string> = {
  a: 'а', b: 'б', d: 'д', f: 'ф', g: 'г', h: 'ҳ', i: 'и', j: 'ж', k: 'к', l: 'л', m: 'м', n: 'н', o: 'о', p: 'п', q: 'қ', r: 'р', s: 'с', t: 'т', u: 'у', v: 'в', x: 'х', y: 'й', z: 'з', c: 'ц', w: 'в', e: 'е',
};
const VOWELS = 'aeiouAEIOU';
const isLetter = (c: string | undefined) => !!c && /[A-Za-z]/.test(c);
const isApos = (c: string | undefined) => c === "'" || c === '’' || c === 'ʻ' || c === '`';
const isUpper = (c: string) => c !== c.toLowerCase();
const cased = (low: string, up: boolean) => (up ? low.toUpperCase() : low);

function word(s: string): string {
  let out = '';
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    const n = s[i + 1];
    const low = c.toLowerCase();
    const nl = n?.toLowerCase();
    const up = isUpper(c);
    const prev = s[i - 1];
    if ((low === 'o' || low === 'g') && isApos(n)) {
      out += cased(low === 'o' ? 'ў' : 'ғ', up);
      i += 1;
    } else if (low === 's' && nl === 'h') {
      out += cased('ш', up);
      i += 1;
    } else if (low === 'c' && nl === 'h') {
      out += cased('ч', up);
      i += 1;
    } else if (low === 'y' && nl === 'o' && !isApos(s[i + 2])) {
      out += cased('ё', up);
      i += 1;
    } else if (low === 'y' && nl === 'u') {
      out += cased('ю', up);
      i += 1;
    } else if (low === 'y' && nl === 'a') {
      out += cased('я', up);
      i += 1;
    } else if (low === 'y' && nl === 'e') {
      out += cased('е', up);
      i += 1;
    } else if (low === 'e' && (!isLetter(prev) || VOWELS.includes(prev ?? '')) && !isApos(prev)) {
      out += cased('э', up);
    } else if (isApos(c)) {
      out += 'ъ';
    } else if (LOWER[low]) {
      out += cased(LOWER[low], up);
    } else {
      out += c;
    }
  }
  return out;
}

const cache = new Map<string, string>();

export function toCyrillic(text: string): string {
  const hit = cache.get(text);
  if (hit !== undefined) return hit;
  let result = OVERRIDES[text];
  if (result === undefined) {
    // Telegram'ga kabi qo'shimchali chet so'zlari: apostrof tutuq belgisi emas
    const src = text.replace(/Telegram['’ʻ]/g, 'Telegram');
    let out = '';
    let last = 0;
    for (const m of src.matchAll(PROTECTED)) {
      out += word(src.slice(last, m.index)) + m[0];
      last = (m.index ?? 0) + m[0].length;
    }
    result = out + word(src.slice(last));
  }
  cache.set(text, result);
  return result;
}
