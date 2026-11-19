import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui';
import { GroupCard } from './group-card';

export const metadata: Metadata = { title: 'Guruh' };
export const instant = false; // sessiyaga bog'liq mijoz sahifasi

export default function Page() {
  return (
    <Suspense fallback={<Skeleton />}>
      <GroupCard />
    </Suspense>
  );
}
