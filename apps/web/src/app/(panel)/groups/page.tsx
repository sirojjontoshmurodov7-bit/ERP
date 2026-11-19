import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui';
import { GroupsList } from './groups-list';

export const metadata: Metadata = { title: 'Guruhlar' };
export const instant = false; // sessiyaga bog'liq mijoz sahifasi

export default function Page() {
  return (
    <Suspense fallback={<Skeleton />}>
      <GroupsList />
    </Suspense>
  );
}
