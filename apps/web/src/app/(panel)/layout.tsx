import { Suspense } from 'react';
import { Shell } from '@/components/shell';

// Panel butunlay mijoz tomonida (sessiya /api/auth/me dan); statik qobiq faqat yuklanish ko'rsatkichi.
// Sahifalarni oldindan chizib bo'lmaydi (sessiyaga bog'liq), shuning uchun instant-navigation tekshiruvidan chiqariladi.
export const instant = false;
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
