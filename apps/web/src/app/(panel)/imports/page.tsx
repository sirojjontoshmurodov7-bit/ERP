import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui';
import { ImportsPage } from './imports-page';

export const metadata: Metadata = { title: "Import" };
export const instant = false; // sessiyaga bog'liq mijoz sahifasi

export default function Page() {
  return (
    <Suspense fallback={<Skeleton />}>
      <ImportsPage />
    </Suspense>
  );
}
