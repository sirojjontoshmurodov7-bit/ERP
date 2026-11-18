// O'quvchilar importi: sarlavha moslashtirish va qator tekshiruvi (sof funksiyalar, DB'ga tegmaydi).
// Qoidalar `students.schemas.ts` bilan bir xil (telefon, sana, uzunliklar), shuning uchun import qo'lda kiritish bilan mos.
import { todayLocal } from '../common/dates.js';

export const MAX_IMPORT_ROWS = 300; // har qatorga argon2 xesh kerak: bitta so'rovda vaqtni cheklash

export type StudentField = 'fullName' | 'phone' | 'birthDate' | 'parentName' | 'parentPhone' | 'note' | 'branch' | 'group' | 'joinedAt';

/** Sarlavha nomi normallashtiriladi (kichik harf, faqat harf/raqam, apostrof va bo'shliqsiz) va shu jadval bo'yicha maydonga o'tadi. */
const ALIASES: Record<StudentField, string[]> = {
  fullName: ['ism', 'ismi', 'fish', 'fio', 'fullname', 'name', 'ismfamiliya', 'familiyaism', 'ismfamilya', 'oquvchi', 'talaba', 'student', 'имя', 'фио', 'фамилияимя', 'ученик'],
  phone: ['telefon', 'tel', 'telefonraqami', 'raqam', 'phone', 'телефон'],
  birthDate: ['tugilgansana', 'tugilgan', 'tugilganyil', 'tugilishsanasi', 'birthdate', 'birthday', 'dob', 'датарождения', 'рождения'],
  parentName: ['otaonaismi', 'otaona', 'ota-ona', 'ota-onaismi', 'parent', 'parentname', 'ota-onafish', 'otaonafish', 'родитель'],
  parentPhone: ['otaonatelefoni', 'otaonatel', 'otaonaraqami', 'parentphone', 'parenttel', 'телефонродителя'],
  note: ['izoh', 'izohlar', 'eslatma', 'note', 'notes', 'comment', 'комментарий', 'примечание'],
  branch: ['filial', 'filiali', 'branch', 'филиал'],
  group: ['guruh', 'guruhi', 'group', 'группа'],
  joinedAt: ['qoshilgansana', 'qoshilgan', 'guruhgaqoshilgansana', 'boshlanishsanasi', 'joined', 'joinedat', 'датаначала'],
};

export const norm = (s: string): string => s.toLowerCase().replace(/[ʻʼ'’‘`´\s._\-/()]+/g, '');

const LOOKUP = new Map<string, StudentField>();
for (const [field, names] of Object.entries(ALIASES) as [StudentField, string[]][]) for (const n of names) LOOKUP.set(norm(n), field);

export interface HeaderMap {
  columns: Partial<Record<StudentField, number>>;
  unknown: string[];
}

export function mapHeader(cells: readonly string[]): HeaderMap {
  const columns: Partial<Record<StudentField, number>> = {};
  const unknown: string[] = [];
  cells.forEach((c, i) => {
    if (c === '') return;
    const field = LOOKUP.get(norm(c));
    if (field && columns[field] === undefined) columns[field] = i;
    else unknown.push(c);
  });
  return { columns, unknown };
}

export interface RowError {
  row: number;
  field: StudentField | 'row';
  code: string;
  message: string;
}

export interface ParsedStudent {
  row: number;
  fullName: string;
  phone: string | null;
  birthDate: string | null;
  parentName: string | null;
  parentPhone: string | null;
  note: string | null;
  branchName: string | null;
  groupName: string | null;
  joinedAt: string | null;
}

const PHONE = /^\+?[0-9 ()-]{7,20}$/;

/** `DD.MM.YYYY`, `DD/MM/YYYY`, `DD-MM-YYYY` va `YYYY-MM-DD` -> ISO; haqiqiy sana bo'lmasa null. */
export function parseDate(raw: string): string | null {
  const m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(raw) ?? (() => {
    const d = /^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/.exec(raw);
    return d ? [d[0], d[3], d[2], d[1]] : null;
  })();
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const iso = `${String(y).padStart(4, '0')}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const dt = new Date(`${iso}T00:00:00Z`);
  return dt.getUTCFullYear() === y && dt.getUTCMonth() + 1 === mo && dt.getUTCDate() === d ? iso : null;
}

/** Raqamlardan iborat kalit: "+998 90 123-45-67" va "998901234567" bir xil. */
export const phoneKey = (p: string): string => p.replace(/\D/g, '');

export function parseRow(row: number, cells: readonly string[], map: HeaderMap): { value?: ParsedStudent; errors: RowError[] } {
  const errors: RowError[] = [];
  const get = (f: StudentField): string => {
    const i = map.columns[f];
    return i === undefined ? '' : (cells[i] ?? '').trim();
  };
  const err = (field: RowError['field'], code: string, message: string) => errors.push({ row, field, code, message });
  const text = (f: StudentField, max: number): string | null => {
    const v = get(f);
    if (v === '') return null;
    if (v.length > max) {
      err(f, 'TOO_LONG', `Eng ko'pi ${max} belgi`);
      return null;
    }
    return v;
  };
  const phone = (f: 'phone' | 'parentPhone'): string | null => {
    const v = get(f);
    if (v === '') return null;
    if (!PHONE.test(v)) {
      err(f, 'INVALID_PHONE', "Telefon raqami noto'g'ri");
      return null;
    }
    return v;
  };
  const date = (f: 'birthDate' | 'joinedAt', noFuture: boolean): string | null => {
    const v = get(f);
    if (v === '') return null;
    const iso = parseDate(v);
    if (!iso) {
      err(f, 'INVALID_DATE', "Sana noto'g'ri (kutilgan: KK.OO.YYYY yoki YYYY-OO-KK)");
      return null;
    }
    if (noFuture && iso > todayLocal()) {
      err(f, 'DATE_IN_FUTURE', "Sana kelajakda bo'lishi mumkin emas");
      return null;
    }
    return iso;
  };

  const fullName = get('fullName').replace(/\s+/g, ' ');
  if (fullName.length < 2) err('fullName', 'MISSING_NAME', "Ism kamida 2 belgi bo'lishi kerak");
  else if (fullName.length > 120) err('fullName', 'TOO_LONG', "Ism eng ko'pi 120 belgi");
  const value: ParsedStudent = {
    row,
    fullName,
    phone: phone('phone'),
    birthDate: date('birthDate', true),
    parentName: text('parentName', 120),
    parentPhone: phone('parentPhone'),
    note: text('note', 500),
    branchName: get('branch') || null,
    groupName: get('group') || null,
    joinedAt: date('joinedAt', true),
  };
  if (value.joinedAt && !value.groupName) err('joinedAt', 'JOINED_WITHOUT_GROUP', "Qo'shilgan sana faqat guruh ko'rsatilganda ma'noli");
  return errors.length ? { errors } : { value, errors };
}
