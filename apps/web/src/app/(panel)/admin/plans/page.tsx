import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui';
import { PlansPage } from './plans-page';

export const metadata: Metadata = { title: "Tariflar" };
export const instant = false; // sessiyaga bog'liq mijoz sahifasi

export default function Page() {
  return (
    <Suspense fallback={<Skeleton />}>
      <PlansPage />
    </Suspense>
  );
}
