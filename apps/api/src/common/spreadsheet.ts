// Excel (.xlsx) va CSV o'qish: tashqi kutubxonasiz (byudjet $0 va ta'minot zanjiri xavfini kamaytirish uchun).
// Faqat birinchi varaq, faqat qiymatlar (formula natijasi), sodda jadval. Yuklangan fayl ishonchsiz: hamma o'lchamlar cheklangan.
import { inflateRawSync } from 'node:zlib';

export const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_ENTRY_BYTES = 20 * 1024 * 1024; // bitta ichki fayl ochilgandagi chegara (ZIP-bomba)
const MAX_TOTAL_BYTES = 40 * 1024 * 1024;
const MAX_ENTRIES = 500;
const MAX_ROWS = 20_000;
const MAX_COLS = 100;

export class SpreadsheetError extends Error {
  constructor(
    readonly code: 'UNSUPPORTED_FILE' | 'CORRUPT_FILE' | 'FILE_TOO_LARGE' | 'EMPTY_FILE',
    message: string,
  ) {
    super(message);
  }
}

export interface SheetRow {
  /** Faylning 1-asosli qator raqami (foydalanuvchi Excel'da ko'radigan). */
  row: number;
  cells: string[];
}

const corrupt = (message = "Fayl buzilgan yoki qo'llab-quvvatlanmaydigan tuzilishda") => new SpreadsheetError('CORRUPT_FILE', message);

/** Fayl nomi va tarkibiga qarab `.xlsx` yoki `.csv` ni o'qiydi; to'liq bo'sh qatorlar o'tkazib yuboriladi (raqamlash saqlanadi). */
export function readSpreadsheet(buf: Buffer, fileName: string): SheetRow[] {
  if (buf.length === 0) throw new SpreadsheetError('EMPTY_FILE', "Fayl bo'sh");
  if (buf.length > MAX_FILE_BYTES) throw new SpreadsheetError('FILE_TOO_LARGE', `Fayl ${MAX_FILE_BYTES / 1024 / 1024} MB dan oshmasligi kerak`);
  const ext = fileName.toLowerCase().split('.').pop() ?? '';
  const isZip = buf.length > 4 && buf.readUInt32LE(0) === 0x04034b50;
  let rows: SheetRow[];
  if (ext === 'xlsx' || (isZip && ext !== 'csv')) {
    if (!isZip) throw corrupt();
    rows = parseXlsx(buf);
  } else if (ext === 'csv' || ext === 'txt') {
    rows = parseCsv(buf.toString('utf8'));
  } else {
    throw new SpreadsheetError('UNSUPPORTED_FILE', "Faqat .xlsx yoki .csv fayl qabul qilinadi");
  }
  const out = rows.filter((r) => r.cells.some((c) => c !== ''));
  if (!out.length) throw new SpreadsheetError('EMPTY_FILE', "Faylda ma'lumot yo'q");
  return out;
}

// ---------------------------------------------------------------------- CSV

export function parseCsv(text: string): SheetRow[] {
  const src = text.replace(/^﻿/, '');
  const firstLine = src.split(/\r?\n/, 1)[0] ?? '';
  const delim = [';', '\t', ','].map((d) => ({ d, n: firstLine.split(d).length })).sort((a, b) => b.n - a.n)[0]!.d;
  const rows: SheetRow[] = [];
  let cells: string[] = [];
  let cell = '';
  let quoted = false;
  let line = 1;
  const endCell = () => {
    cells.push(cell.trim());
    cell = '';
  };
  const endRow = () => {
    endCell();
    if (cells.length > MAX_COLS) throw corrupt('Ustunlar soni juda ko\'p');
    rows.push({ row: line, cells });
    if (rows.length > MAX_ROWS) throw corrupt('Qatorlar soni juda ko\'p');
    cells = [];
  };
  for (let i = 0; i < src.length; i++) {
    const ch = src[i]!;
    if (quoted) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          cell += '"';
          i++;
        } else quoted = false;
      } else cell += ch;
    } else if (ch === '"' && cell === '') quoted = true;
    else if (ch === delim) endCell();
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i++;
      endRow();
      line++;
    } else cell += ch;
  }
  if (cell !== '' || cells.length) endRow();
  return rows;
}

// ---------------------------------------------------------------------- ZIP

interface ZipEntry {
  method: number;
  compSize: number;
  size: number;
  offset: number;
}

function readZip(buf: Buffer): Map<string, ZipEntry> {
  const min = Math.max(0, buf.length - 65557);
  let eocd = -1;
  for (let i = buf.length - 22; i >= min; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw corrupt();
  const total = buf.readUInt16LE(eocd + 10);
  const cdOffset = buf.readUInt32LE(eocd + 16);
  if (total === 0xffff || cdOffset === 0xffffffff) throw corrupt('ZIP64 qo\'llab-quvvatlanmaydi');
  if (total > MAX_ENTRIES) throw corrupt('Faylda ichki fayllar juda ko\'p');
  const entries = new Map<string, ZipEntry>();
  let p = cdOffset;
  for (let n = 0; n < total; n++) {
    if (p + 46 > buf.length || buf.readUInt32LE(p) !== 0x02014b50) throw corrupt();
    const flags = buf.readUInt16LE(p + 8);
    if (flags & 1) throw corrupt('Parolli fayl qo\'llab-quvvatlanmaydi');
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    if (p + 46 + nameLen > buf.length) throw corrupt();
    const name = buf.toString('utf8', p + 46, p + 46 + nameLen);
    entries.set(name, { method: buf.readUInt16LE(p + 10), compSize: buf.readUInt32LE(p + 20), size: buf.readUInt32LE(p + 24), offset: buf.readUInt32LE(p + 42) });
    p += 46 + nameLen + extraLen + commentLen;
  }
  return entries;
}

function makeUnzip(buf: Buffer) {
  const entries = readZip(buf);
  let total = 0;
  return {
    has: (name: string) => entries.has(name),
    names: () => [...entries.keys()],
    read(name: string): string | null {
      const e = entries.get(name);
      if (!e) return null;
      if (e.size > MAX_ENTRY_BYTES) throw corrupt('Ichki fayl juda katta');
      if (e.offset + 30 > buf.length || buf.readUInt32LE(e.offset) !== 0x04034b50) throw corrupt();
      const start = e.offset + 30 + buf.readUInt16LE(e.offset + 26) + buf.readUInt16LE(e.offset + 28);
      if (start + e.compSize > buf.length) throw corrupt();
      const data = buf.subarray(start, start + e.compSize);
      let out: Buffer;
      if (e.method === 0) out = data;
      else if (e.method === 8) {
        try {
          out = inflateRawSync(data, { maxOutputLength: MAX_ENTRY_BYTES });
        } catch {
          throw corrupt();
        }
      } else throw corrupt();
      total += out.length;
      if (total > MAX_TOTAL_BYTES) throw corrupt('Fayl ochilganda juda katta');
      return out.toString('utf8');
    },
  };
}

// ---------------------------------------------------------------------- XLSX

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
const decode = (s: string): string =>
  s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, g: string) => {
    if (g[0] === '#') {
      const code = g[1]!.toLowerCase() === 'x' ? parseInt(g.slice(2), 16) : parseInt(g.slice(1), 10);
      return Number.isFinite(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : '';
    }
    return ENTITIES[g.toLowerCase()] ?? m;
  });

const attrs = (tag: string): Record<string, string> => {
  const out: Record<string, string> = {};
  for (const m of tag.matchAll(/([\w:.-]+)\s*=\s*"([^"]*)"/g)) out[m[1]!] = decode(m[2]!);
  return out;
};

const colIndex = (ref: string): number => {
  const letters = /^[A-Za-z]+/.exec(ref)?.[0].toUpperCase() ?? '';
  let n = 0;
  for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
};

const BUILTIN_DATE_FMTS = new Set([14, 15, 16, 17, 18, 19, 20, 21, 22, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 45, 46, 47, 50, 51, 52, 53, 54, 55, 56, 57, 58]);

function dateStyles(styles: string | null): Set<number> {
  const out = new Set<number>();
  if (!styles) return out;
  const custom = new Map<number, string>();
  for (const m of styles.matchAll(/<numFmt\b[^>]*>/g)) {
    const a = attrs(m[0]);
    if (a.numFmtId && a.formatCode) custom.set(Number(a.numFmtId), a.formatCode);
  }
  const block = /<cellXfs\b[^>]*>([\s\S]*?)<\/cellXfs>/.exec(styles)?.[1] ?? '';
  let i = 0;
  for (const m of block.matchAll(/<xf\b[^>]*>/g)) {
    const id = Number(attrs(m[0]).numFmtId ?? 0);
    const code = custom.get(id);
    const isDate = code !== undefined ? /[dy]/i.test(code.replace(/"[^"]*"|\[[^\]]*\]|\\./g, '')) : BUILTIN_DATE_FMTS.has(id);
    if (isDate) out.add(i);
    i++;
  }
  return out;
}

/** Excel seriya raqami (1900 tizimi) -> YYYY-MM-DD; vaqt qismi tashlanadi. */
export function excelSerialToIso(serial: number): string {
  let days = Math.floor(serial);
  if (days < 1) return '';
  if (days >= 61) days -= 1; // 1900-yil 29-fevral xatosi
  const d = new Date(Date.UTC(1899, 11, 31) + days * 86_400_000);
  return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
}

const plainNumber = (v: string): string => {
  if (/e/i.test(v)) {
    const n = Number(v);
    if (Number.isFinite(n) && Math.abs(n) < 1e21 && Number.isInteger(n)) return BigInt(n).toString();
  }
  return v;
};

function parseXlsx(buf: Buffer): SheetRow[] {
  const zip = makeUnzip(buf);
  const workbook = zip.read('xl/workbook.xml');
  if (workbook === null) throw corrupt("Bu Excel (.xlsx) fayl emas");

  // Birinchi varaq yo'li: workbook.xml -> rels; topilmasa eng kichik raqamli worksheets/sheetN.xml
  let sheetPath: string | undefined;
  const firstSheet = /<sheet\b[^>]*>/.exec(workbook)?.[0];
  const rid = firstSheet ? attrs(firstSheet)['r:id'] : undefined;
  const rels = zip.read('xl/_rels/workbook.xml.rels');
  if (rid && rels) {
    for (const m of rels.matchAll(/<Relationship\b[^>]*>/g)) {
      const a = attrs(m[0]);
      if (a.Id === rid && a.Target) sheetPath = a.Target.startsWith('/') ? a.Target.slice(1) : `xl/${a.Target.replace(/^\.\//, '')}`;
    }
  }
  if (!sheetPath || !zip.has(sheetPath)) {
    sheetPath = zip.names().filter((n) => /^xl\/worksheets\/sheet\d+\.xml$/.test(n)).sort((a, b) => a.length - b.length || a.localeCompare(b))[0];
  }
  const sheet = sheetPath ? zip.read(sheetPath) : null;
  if (sheet === null) throw corrupt('Varaq topilmadi');

  const shared: string[] = [];
  const ss = zip.read('xl/sharedStrings.xml');
  if (ss) {
    for (const m of ss.matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/g)) {
      const body = m[1]!.replace(/<rPh\b[\s\S]*?<\/rPh>/g, '');
      shared.push(decode([...body.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)].map((t) => t[1]!).join('')));
    }
  }
  const dates = dateStyles(zip.read('xl/styles.xml'));

  const rows: SheetRow[] = [];
  let seq = 0;
  for (const rm of sheet.matchAll(/<row\b([^>]*?)(?:\/>|>([\s\S]*?)<\/row>)/g)) {
    seq++;
    const rowNo = Number(attrs(rm[1]!).r) || seq;
    if (rowNo > MAX_ROWS) throw corrupt("Qatorlar soni juda ko'p");
    const cells: string[] = [];
    let auto = 0;
    for (const cm of (rm[2] ?? '').matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const a = attrs(cm[1]!);
      const idx = a.r ? colIndex(a.r) : auto;
      auto = idx + 1;
      if (idx < 0 || idx >= MAX_COLS) continue;
      const inner = cm[2] ?? '';
      const raw = /<v\b[^>]*>([\s\S]*?)<\/v>/.exec(inner)?.[1];
      let value = '';
      if (a.t === 'inlineStr') value = decode([...inner.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)].map((t) => t[1]!).join(''));
      else if (raw !== undefined) {
        if (a.t === 's') value = shared[Number(raw)] ?? '';
        else if (a.t === 'str') value = decode(raw);
        else if (a.t === 'b') value = raw === '1' ? 'TRUE' : 'FALSE';
        else if (a.t === 'e') value = '';
        else if (a.s !== undefined && dates.has(Number(a.s)) && Number.isFinite(Number(raw))) value = excelSerialToIso(Number(raw));
        else value = plainNumber(decode(raw));
      }
      while (cells.length <= idx) cells.push('');
      cells[idx] = value.trim();
    }
    rows.push({ row: rowNo, cells });
  }
  return rows;
}
