import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui';
import { DebtorsPage } from './debtors-page';

export const metadata: Metadata = { title: "Qarzdorlar" };
export const instant = false; // sessiyaga bog'liq mijoz sahifasi

export default function Page() {
  return (
    <Suspense fallback={<Skeleton />}>
      <DebtorsPage />
    </Suspense>
  );
}
