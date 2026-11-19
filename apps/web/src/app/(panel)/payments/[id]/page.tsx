import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui';
import { PaymentCard } from './payment-card';

export const metadata: Metadata = { title: "Kvitansiya" };
export const instant = false; // sessiyaga bog'liq mijoz sahifasi

export default function Page() {
  return (
    <Suspense fallback={<Skeleton />}>
      <PaymentCard />
    </Suspense>
  );
}
