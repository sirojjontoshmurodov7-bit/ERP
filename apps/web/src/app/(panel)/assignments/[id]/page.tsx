import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui';
import { AssignmentCard } from './assignment-card';

export const metadata: Metadata = { title: "Vazifa" };
export const instant = false; // sessiyaga bog'liq mijoz sahifasi

export default function Page() {
  return (
    <Suspense fallback={<Skeleton />}>
      <AssignmentCard />
    </Suspense>
  );
}
