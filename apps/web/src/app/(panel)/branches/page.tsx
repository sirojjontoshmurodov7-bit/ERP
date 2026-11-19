import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui';
import { BranchesPage } from './branches-page';

export const metadata: Metadata = { title: "Filiallar" };
export const instant = false; // sessiyaga bog'liq mijoz sahifasi

export default function Page() {
  return (
    <Suspense fallback={<Skeleton />}>
      <BranchesPage />
    </Suspense>
  );
}
