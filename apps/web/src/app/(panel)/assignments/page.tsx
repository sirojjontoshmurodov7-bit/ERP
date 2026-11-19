import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui';
import { AssignmentsPage } from './assignments-page';

export const metadata: Metadata = { title: "Vazifalar" };
export const instant = false; // sessiyaga bog'liq mijoz sahifasi

export default function Page() {
  return (
    <Suspense fallback={<Skeleton />}>
      <AssignmentsPage />
    </Suspense>
  );
}
