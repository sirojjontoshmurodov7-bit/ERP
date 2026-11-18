import { Suspense } from 'react';
import { Shell } from '@/components/shell';

// Panel butunlay mijoz tomonida (sessiya /api/auth/me dan); statik qobiq faqat yuklanish ko'rsatkichi.
export default function PanelLayout({ children }: LayoutProps<'/'>) {
  return (
    <Suspense
      fallback={
        <div className="auth" aria-busy="true">
          <span className="spinner" aria-label="Yuklanmoqda" />
        </div>
      }
    >
      <Shell>{children}</Shell>
    </Suspense>
  );
}
