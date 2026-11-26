// Bir martalik codemod: JSX matnlarini t('...') ga o'raydi va komponentga `const t = useT();` qo'shadi.
//   node scripts/i18n-wrap.mjs <fayl...>      o'zgartiradi
//   node scripts/i18n-wrap.mjs --dry <fayl...> faqat hisobot
// O'raladi: JSX matn tugunlari (faqat matn bo'lgan bola; matn+ifoda aralashmasi hisobotga chiqadi), oddiy HTML teglaridagi
// placeholder/title/aria-label/alt satrlari. Komponent prop'lari (label, hint, title, sub, text...) komponentning o'zida tarjima qilinadi.
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const args = process.argv.slice(2);
const dry = args.includes('--dry');
const server = args.includes('--server'); // server komponentlari: <T>{"..."}</T>, hook'siz (atributlar o'zgarmaydi)
const files = args.filter((a) => !a.startsWith('--'));

const ATTRS = new Set(['placeholder', 'title', 'aria-label', 'alt']);
const hasWords = (s) => /[A-Za-zЁёА-я]/.test(s) && /[a-z]/i.test(s);
const decode = (s) => s.replace(/&apos;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ');
const lit = (s) => JSON.stringify(s);

function componentOf(node) {
  // Eng yaqin "komponent" funksiyasi: nomi katta harf bilan boshlanadi (function X, const X = () =>, whenOpen(function X ...)).
  for (let n = node.parent; n; n = n.parent) {
    if (ts.isFunctionDeclaration(n) || ts.isFunctionExpression(n) || ts.isArrowFunction(n)) {
      let name = n.name?.text;
      if (!name && ts.isVariableDeclaration(n.parent) && ts.isIdentifier(n.parent.name)) name = n.parent.name.text;
      if (name && /^[A-Z]/.test(name)) return n;
    }
  }
  return null;
}

for (const file of files) {
  const src = readFileSync(file, 'utf8');
  const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const edits = [];
  const comps = new Set();
  const report = [];
  let serverUsed = false;

  const visit = (node) => {
    if (ts.isJsxText(node)) {
      const raw = node.getText(sf);
      const text = decode(raw).replace(/\s+/g, ' ').trim();
      if (text && hasWords(text)) {
        const parent = node.parent;
        const kids = parent.children ?? [];
        const mixed = kids.some((k) => ts.isJsxExpression(k) && k.expression && !ts.isStringLiteral(k.expression)) && kids.filter((k) => ts.isJsxText(k) && k.getText(sf).trim()).length >= 1 && kids.length > 1;
        const comp = server ? sf : componentOf(node);
        if (mixed || !comp) {
          report.push(`${mixed ? 'ARALASH' : 'KOMPONENTSIZ'} ${sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1}: ${text.slice(0, 70)}`);
        } else {
          const lead = raw.match(/^\s*/)[0];
          const trail = raw.match(/\s*$/)[0];
          const keepLead = lead && !lead.includes('\n') ? ' ' : '';
          const keepTrail = trail && !trail.includes('\n') ? ' ' : '';
          const inner = server ? `<T>{${lit(text)}}</T>` : `{t(${lit(text)})}`;
          edits.push({ start: node.getStart(sf), end: node.getEnd(), text: `${lead.includes('\n') ? lead : ''}${keepLead ? "{' '}" : ''}${inner}${keepTrail ? "{' '}" : ''}${trail.includes('\n') ? trail : ''}` });
          if (server) serverUsed = true;
          else comps.add(comp);
        }
      }
    } else if (!server && ts.isJsxAttribute(node) && node.initializer && ts.isStringLiteral(node.initializer)) {
      const tag = node.parent.parent.tagName?.getText(sf) ?? '';
      const name = node.name.getText(sf);
      const value = node.initializer.text;
      if (/^[a-z]/.test(tag) && ATTRS.has(name) && hasWords(value)) {
        const comp = componentOf(node);
        if (comp) {
          edits.push({ start: node.initializer.getStart(sf), end: node.initializer.getEnd(), text: `{t(${lit(value)})}` });
          comps.add(comp);
        } else report.push(`KOMPONENTSIZ attr ${name}: ${value}`);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);

  for (const c of comps) {
    const body = c.body;
    if (!body || !ts.isBlock(body)) {
      report.push(`BLOKSIZ komponent: ${(c.name?.text ?? c.parent?.name?.text) || '?'} (qo'lda useT qo'shing)`);
      continue;
    }
    if (/\bconst t = useT\(\)/.test(body.getText(sf))) continue;
    const pos = body.getStart(sf) + 1;
    edits.push({ start: pos, end: pos, text: '\n  const t = useT();' });
  }
  if (server && serverUsed && !src.includes("from '@/components/t'")) edits.push({ start: 0, end: 0, text: "import { T } from '@/components/t';\n" });
  let out = src;
  for (const e of edits.sort((a, b) => b.start - a.start)) out = out.slice(0, e.start) + e.text + out.slice(e.end);
  if (comps.size && !/from '@\/lib\/i18n'/.test(out)) {
    const m = out.match(/^(?:'use client';\s*\n)?(?:\/\/.*\n)*/);
    const at = m ? m[0].length : 0;
    out = `${out.slice(0, at)}import { useT } from '@/lib/i18n';\n${out.slice(at)}`;
  }
  console.log(`${file}: ${edits.length} o'zgarish${report.length ? `\n  ${report.join('\n  ')}` : ''}`);
  if (!dry && out !== src) writeFileSync(file, out);
}
