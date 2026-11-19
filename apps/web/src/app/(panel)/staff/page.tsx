import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui';
import { StaffPage } from './staff-page';

export const metadata: Metadata = { title: "Xodimlar" };
export const instant = false; // sessiyaga bog'liq mijoz sahifasi

export default function Page() {
  return (
    <Suspense fallback={<Skeleton />}>
      <StaffPage />
    </Suspense>
  );
}
