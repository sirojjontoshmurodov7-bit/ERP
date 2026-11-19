import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui';
import { SettingsPage } from './settings-page';

export const metadata: Metadata = { title: "Markaz sozlamalari" };
export const instant = false; // sessiyaga bog'liq mijoz sahifasi

export default function Page() {
  return (
    <Suspense fallback={<Skeleton />}>
      <SettingsPage />
    </Suspense>
  );
}
