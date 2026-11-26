// Tarjima qilinmagan o'zbekcha satrlarni topadi: t()/tr() ichida bo'lmagan, foydalanuvchiga ko'rinadigan satr literal va shablonlar.
//   node scripts/i18n-scan.mjs [fayl...]   (berilmasa src/ dagi hamma .tsx)
// Texnik satrlar (className, href, key, type, kodlar, URL, CSS) e'tiborsiz. Natija: fayl:qator  satr.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';

const require = createRequire(import.meta.url);
const ts = require('typescript');
let files = process.argv.slice(2);
if (!files.length) {
  const walk = (d) => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : /\.tsx?$/.test(f) && !f.startsWith('i18n') ? [join(d, f)] : []));
  files = walk('src');
}
const SKIP_ATTR = new Set(['className', 'href', 'key', 'type', 'id', 'name', 'role', 'variant', 'size', 'kind', 'tone', 'data-tone', 'autoComplete', 'inputMode', 'method', 'form', 'htmlFor', 'rel', 'target', 'src', 'value', 'pattern', 'lang', 'mode', 'icon', 'fieldClass', 'aria-haspopup', 'aria-current', 'aria-live', 'accept', 'encType', 'step', 'min', 'max', 'd', 'viewBox', 'fill', 'stroke']);
const SKIP_CALL = new Set(['t', 'tr', 'translate', 'useApi', 'api.get', 'api.post', 'api.put', 'api.patch', 'api.del', 'fetch', 'router.push', 'router.replace', 'useUrlState', 'URLSearchParams', 'Error', 'console.log', 'console.error', 'set', 'setF', 'cookies', 'headers', 'matchMedia', 'querySelector', 'querySelectorAll', 'getPropertyValue', 'setProperty', 'removeProperty', 'addEventListener', 'removeEventListener', 'localStorage.getItem', 'localStorage.setItem', 'require', 'Intl.NumberFormat', 'toLocaleString', 'toLocaleDateString']);
const looksText = (s) => {
  const v = s.trim();
  if (!/[a-z]/i.test(v) || v.length < 2) return false;
  if (/^[A-Z0-9_]+$/.test(v)) return false; // kodlar
  if (/^[a-z0-9._-]+$/.test(v) && !/['ʻ]/.test(v)) return false; // texnik kalit
  if (/^(\/|https?:|#|\.|--|var\(|calc\(|[0-9])/.test(v)) return false;
  if (/^[a-z]+(-[a-z]+)+$/.test(v)) return false; // css/kebab
  if (/^[\w.]+\.[a-z]{2,4}$/.test(v)) return false;
  return /\s/.test(v) || /^[A-ZА-Я]/.test(v) || /'/.test(v) || /[a-z]{4,}/.test(v);
};
let total = 0;
for (const file of files) {
  const src = readFileSync(file, 'utf8');
  const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const hits = [];
  const callName = (n) => n.expression.getText(sf);
  const inSkipped = (node) => {
    for (let p = node.parent; p; p = p.parent) {
      if (ts.isCallExpression(p) && (SKIP_CALL.has(callName(p)) || /^api\./.test(callName(p)))) return true;
      if (ts.isJsxAttribute(p) && SKIP_ATTR.has(p.name.getText(sf))) return true;
      if (ts.isImportDeclaration(p) || ts.isExportDeclaration(p)) return true;
      if (ts.isBinaryExpression(p) && [ts.SyntaxKind.EqualsEqualsEqualsToken, ts.SyntaxKind.ExclamationEqualsEqualsToken].includes(p.operatorToken.kind)) return true;
      if (ts.isCaseClause(p) || ts.isElementAccessExpression(p) || ts.isLiteralTypeNode(p)) return true;
      if (ts.isPropertyAssignment(p) && ['value', 'href', 'icon', 'tone', 'span', 'kind', 'code', 'v', 'short', 'method'].includes(p.name.getText(sf)) && p.initializer === node) return true;
      if (ts.isJsxExpression(p) || ts.isFunctionLike(p)) break;
    }
    return false;
  };
  // Komponent o'zi tarjima qiladigan prop'lar (ui.tsx, dash.tsx) va <Tag> ichidagi satr: o'ralmasa ham bo'ladi
  const HANDLED = new Set(['label', 'hint', 'placeholder', 'title', 'sub', 'text', 'confirmLabel', 'eyebrow', 'caption', 'aria-label']);
  const handledProp = (node) => {
    const p = node.parent;
    const a = p && ts.isJsxAttribute(p) ? p : p && ts.isJsxExpression(p) && p.parent && ts.isJsxAttribute(p.parent) ? p.parent : null;
    if (!a) return false;
    const tag = a.parent.parent.tagName?.getText(sf) ?? '';
    return /^[A-Z]/.test(tag) && HANDLED.has(a.name.getText(sf));
  };
  const labelProp = (node) => ts.isPropertyAssignment(node.parent) && ['label', 'title', 'text'].includes(node.parent.name.getText(sf));
  const tagChild = (node) => ts.isJsxExpression(node.parent) && ts.isJsxElement(node.parent.parent) && node.parent.parent.openingElement.tagName.getText(sf) === 'Tag';
  const quiet = (node) => ts.isStringLiteral(node) && (handledProp(node) || tagChild(node) || (process.env.SCAN_LABELS !== '1' && labelProp(node)));
  const visit = (node) => {
    let text = null;
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) text = node.text;
    else if (ts.isTemplateExpression(node)) text = node.head.text + node.templateSpans.map((s) => '${}' + s.literal.text).join('');
    if (text !== null && looksText(text.replace(/\$\{\}/g, ' ')) && !inSkipped(node) && !quiet(node)) {
      if (!(ts.isJsxAttribute(node.parent) && /^[a-z]/.test(node.parent.parent.parent.tagName?.getText(sf) ?? '') === false && false)) {
        hits.push(`${file.replace(/\\/g, '/')}:${sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1}  ${text.slice(0, 90)}`);
      }
    }
    if (!ts.isTemplateExpression(node)) ts.forEachChild(node, visit);
    else node.templateSpans.forEach((s) => visit(s.expression));
  };
  visit(sf);
  total += hits.length;
  for (const h of hits) console.log(h);
}
console.log(`\nJami: ${total}`);
