import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui';
import { AttendancePage } from './attendance-page';

export const metadata: Metadata = { title: "Davomat" };
export const instant = false; // sessiyaga bog'liq mijoz sahifasi

export default function Page() {
  return (
    <Suspense fallback={<Skeleton />}>
      <AttendancePage />
    </Suspense>
  );
}
