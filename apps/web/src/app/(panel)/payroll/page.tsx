import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui';
import { PayrollPage } from './payroll-page';

export const metadata: Metadata = { title: "Maosh" };
export const instant = false; // sessiyaga bog'liq mijoz sahifasi

export default function Page() {
  return (
    <Suspense fallback={<Skeleton />}>
      <PayrollPage />
    </Suspense>
  );
}
