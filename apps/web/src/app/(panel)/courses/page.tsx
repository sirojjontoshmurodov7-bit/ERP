import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui';
import { CoursesPage } from './courses-page';

export const metadata: Metadata = { title: "Kurslar" };
export const instant = false; // sessiyaga bog'liq mijoz sahifasi

export default function Page() {
  return (
    <Suspense fallback={<Skeleton />}>
      <CoursesPage />
    </Suspense>
  );
}
