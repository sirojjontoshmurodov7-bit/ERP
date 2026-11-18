import type { Metadata, Viewport } from 'next';
import { Geist_Mono, Onest } from 'next/font/google';
import './globals.css';

// Shriftlar build vaqtida o'zimizga joylanadi (brauzer Google'ga murojaat qilmaydi)
const onest = Onest({ variable: '--font-onest', subsets: ['latin', 'cyrillic'], display: 'swap' });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'], display: 'swap' });

export const metadata: Metadata = {
  title: { default: "O'quv markazi", template: "%s | O'quv markazi" },
  description: "O'quv markazlari uchun boshqaruv tizimi",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="uz" className={`${onest.variable} ${geistMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
