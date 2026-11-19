import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui';
import { PermissionsPage } from './permissions-page';

export const metadata: Metadata = { title: "Ruxsatlar" };
export const instant = false; // sessiyaga bog'liq mijoz sahifasi

export default function Page() {
  return (
    <Suspense fallback={<Skeleton />}>
      <PermissionsPage />
    </Suspense>
  );
}
