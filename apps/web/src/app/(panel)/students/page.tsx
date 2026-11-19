import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui';
import { StudentsList } from './students-list';

export const metadata: Metadata = { title: "O'quvchilar" };
export const instant = false; // sessiyaga bog'liq mijoz sahifasi

export default function Page() {
  return (
    <Suspense fallback={<Skeleton />}>
      <StudentsList />
    </Suspense>
  );
}
