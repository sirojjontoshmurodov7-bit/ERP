import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui';
import { Dashboard } from './dashboard';

export const metadata: Metadata = { title: 'Bosh sahifa' };

export default function Page() {
  return (
    <Suspense fallback={<Skeleton />}>
      <Dashboard />
    </Suspense>
  );
}
