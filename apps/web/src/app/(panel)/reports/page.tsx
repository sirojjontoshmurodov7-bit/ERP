import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui';
import { ReportsPage } from './reports-page';

export const metadata: Metadata = { title: "Hisobotlar" };
export const instant = false; // sessiyaga bog'liq mijoz sahifasi

export default function Page() {
  return (
    <Suspense fallback={<Skeleton />}>
      <ReportsPage />
    </Suspense>
  );
}
