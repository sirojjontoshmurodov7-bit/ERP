import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui';
import { AuditPage } from './audit-page';

export const metadata: Metadata = { title: "Audit jurnali" };
export const instant = false; // sessiyaga bog'liq mijoz sahifasi

export default function Page() {
  return (
    <Suspense fallback={<Skeleton />}>
      <AuditPage />
    </Suspense>
  );
}
