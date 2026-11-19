import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui';
import { CentersPage } from './centers-page';

export const metadata: Metadata = { title: "Markazlar" };
export const instant = false; // sessiyaga bog'liq mijoz sahifasi

export default function Page() {
  return (
    <Suspense fallback={<Skeleton />}>
      <CentersPage />
    </Suspense>
  );
}
