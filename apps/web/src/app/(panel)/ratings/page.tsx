import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui';
import { RatingsPage } from './ratings-page';

export const metadata: Metadata = { title: "Reyting" };
export const instant = false; // sessiyaga bog'liq mijoz sahifasi

export default function Page() {
  return (
    <Suspense fallback={<Skeleton />}>
      <RatingsPage />
    </Suspense>
  );
}
