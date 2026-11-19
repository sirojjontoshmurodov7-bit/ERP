import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui';
import { ProfilePage } from './profile-page';

export const metadata: Metadata = { title: "Profil" };
export const instant = false; // sessiyaga bog'liq mijoz sahifasi

export default function Page() {
  return (
    <Suspense fallback={<Skeleton />}>
      <ProfilePage />
    </Suspense>
  );
}
