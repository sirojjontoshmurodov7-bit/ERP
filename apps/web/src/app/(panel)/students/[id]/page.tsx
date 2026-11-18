import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui';
import { StudentCard } from './student-card';

export const metadata: Metadata = { title: "O'quvchi" };

export default function Page() {
  return (
    <Suspense fallback={<Skeleton />}>
      <StudentCard />
    </Suspense>
  );
}
