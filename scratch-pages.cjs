// Har bo'lim uchun page.tsx: metadata + Suspense ichida mijoz komponenti (Next 16 instant navigation talabi).
const fs = require('fs');
const path = require('path');
const base = 'apps/web/src/app/(panel)';
const pages = JSON.parse(process.argv[2]);
for (const [dir, title, file, comp] of pages) {
  const p = path.join(base, dir, 'page.tsx');
  if (!fs.existsSync(path.join(base, dir, `${file}.tsx`))) throw new Error(`komponent yo'q: ${dir}/${file}.tsx`);
  fs.writeFileSync(
    p,
    `import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui';
import { ${comp} } from './${file}';

export const metadata: Metadata = { title: ${JSON.stringify(title)} };
export const instant = false; // sessiyaga bog'liq mijoz sahifasi

export default function Page() {
  return (
    <Suspense fallback={<Skeleton />}>
      <${comp} />
    </Suspense>
  );
}
`,
  );
  console.log('yozildi', p);
}
