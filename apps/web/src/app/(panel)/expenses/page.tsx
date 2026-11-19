import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui';
import { ExpensesPage } from './expenses-page';

export const metadata: Metadata = { title: "Xarajatlar" };
export const instant = false; // sessiyaga bog'liq mijoz sahifasi

export default function Page() {
  return (
    <Suspense fallback={<Skeleton />}>
      <ExpensesPage />
    </Suspense>
  );
}
