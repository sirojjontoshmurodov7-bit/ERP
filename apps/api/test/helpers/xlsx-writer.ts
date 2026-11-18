// Testlar uchun minimal .xlsx yozuvchi (ZIP + OOXML). Ishlab chiqarish kodida ishlatilmaydi.
import { crc32, deflateRawSync } from 'node:zlib';

export type Cell = string | number | null | { date: string };

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const colName = (i: number) => String.fromCharCode(65 + (i % 26)).padStart(i >= 26 ? 2 : 1, 'A');

const serialOf = (iso: string): number => Math.round((Date.parse(`${iso}T00:00:00Z`) - Date.UTC(1899, 11, 30)) / 86_400_000);

export interface ZipFile {
  name: string;
  data: Buffer | string;
  store?: boolean;
}

export function makeZip(files: ZipFile[]): Buffer {
  const parts: Buffer[] = [];
  const central: Buffer[] = [];
  let offset = 0;
  for (const f of files) {
    const raw = Buffer.from(f.data);
    const body = f.store ? raw : deflateRawSync(raw);
    const name = Buffer.from(f.name);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(f.store ? 0 : 8, 8);
    local.writeUInt32LE(crc32(raw), 14);
    local.writeUInt32LE(body.length, 18);
    local.writeUInt32LE(raw.length, 22);
    local.writeUInt16LE(name.length, 26);
    parts.push(local, name, body);
    const cd = Buffer.alloc(46);
    cd.writeUInt32LE(0x02014b50, 0);
    cd.writeUInt16LE(20, 4);
    cd.writeUInt16LE(20, 6);
    cd.writeUInt16LE(f.store ? 0 : 8, 10);
    cd.writeUInt32LE(crc32(raw), 16);
    cd.writeUInt32LE(body.length, 20);
    cd.writeUInt32LE(raw.length, 24);
    cd.writeUInt16LE(name.length, 28);
    cd.writeUInt32LE(offset, 42);
    central.push(cd, name);
    offset += 30 + name.length + body.length;
  }
  const cdBuf = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(cdBuf.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...parts, cdBuf, end]);
}

export interface XlsxOptions {
  /** Matnlarni sharedStrings.xml orqali yozish (Excel odatda shunday qiladi); aks holda inlineStr. */
  shared?: boolean;
  /** Ichki fayllarni siqmasdan (stored) yozish. */
  store?: boolean;
  /** Birinchi varaqdan oldin bo'sh "Eslatma" varag'i qo'shish (varaq tartibi tekshiruvi uchun emas, ikkinchi varaq e'tiborsiz qolishi uchun). */
  extraSheet?: boolean;
}

/** `rows`: har qator hujayralar ro'yxati. `{ date }` hujayra sana uslubi bilan raqam sifatida yoziladi. */
export function makeXlsx(rows: Cell[][], opts: XlsxOptions = {}): Buffer {
  const strings: string[] = [];
  const sstIndex = (s: string) => {
    let i = strings.indexOf(s);
    if (i < 0) i = strings.push(s) - 1;
    return i;
  };
  const sheetRows = rows
    .map((cells, r) => {
      const cs = cells
        .map((c, i) => {
          if (c === null || c === '') return '';
          const ref = `${colName(i)}${r + 1}`;
          if (typeof c === 'number') return `<c r="${ref}"><v>${c}</v></c>`;
          if (typeof c === 'object') return `<c r="${ref}" s="1"><v>${serialOf(c.date)}</v></c>`;
          return opts.shared ? `<c r="${ref}" t="s"><v>${sstIndex(c)}</v></c>` : `<c r="${ref}" t="inlineStr"><is><t>${esc(c)}</t></is></c>`;
        })
        .join('');
      return `<row r="${r + 1}">${cs}</row>`;
    })
    .join('');
  const files: ZipFile[] = [
    { name: '[Content_Types].xml', data: '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"/>', store: opts.store },
    {
      name: 'xl/workbook.xml',
      data: `<?xml version="1.0"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Talabalar" sheetId="1" r:id="rId1"/>${opts.extraSheet ? '<sheet name="Eslatma" sheetId="2" r:id="rId2"/>' : ''}</sheets></workbook>`,
      store: opts.store,
    },
    {
      name: 'xl/_rels/workbook.xml.rels',
      data: `<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="worksheet" Target="worksheets/sheet1.xml"/>${opts.extraSheet ? '<Relationship Id="rId2" Type="worksheet" Target="worksheets/sheet2.xml"/>' : ''}</Relationships>`,
      store: opts.store,
    },
    {
      name: 'xl/styles.xml',
      data: '<?xml version="1.0"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><cellXfs count="2"><xf numFmtId="0"/><xf numFmtId="14" applyNumberFormat="1"/></cellXfs></styleSheet>',
      store: opts.store,
    },
    { name: 'xl/worksheets/sheet1.xml', data: `<?xml version="1.0"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${sheetRows}</sheetData></worksheet>`, store: opts.store },
  ];
  if (opts.extraSheet) files.push({ name: 'xl/worksheets/sheet2.xml', data: '<?xml version="1.0"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData><row r="1"><c r="A1" t="inlineStr"><is><t>boshqa varaq</t></is></c></row></sheetData></worksheet>', store: opts.store });
  if (opts.shared) {
    files.push({
      name: 'xl/sharedStrings.xml',
      data: `<?xml version="1.0"?><sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="${strings.length}" uniqueCount="${strings.length}">${strings.map((s) => `<si><t>${esc(s)}</t></si>`).join('')}</sst>`,
      store: opts.store,
    });
  }
  return makeZip(files);
}
