import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui';
import { NotificationsPage } from './notifications-page';

export const metadata: Metadata = { title: "Telegram xabarlar" };
export const instant = false; // sessiyaga bog'liq mijoz sahifasi

export default function Page() {
  return (
    <Suspense fallback={<Skeleton />}>
      <NotificationsPage />
    </Suspense>
  );
}
