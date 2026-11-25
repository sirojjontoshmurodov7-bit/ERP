import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { Fx } from '@/components/fx';
import { THEME_INIT } from '@/lib/theme-init';
import './globals.css';
import '../styles/depth.css';

// Shriftlar build vaqtida o'zimizga joylanadi (brauzer Google'ga murojaat qilmaydi)
const inter = Inter({ variable: '--font-inter', subsets: ['latin', 'cyrillic'], display: 'swap' });
const mono = JetBrains_Mono({ variable: '--font-jetbrains', subsets: ['latin', 'cyrillic'], display: 'swap' });

export const metadata: Metadata = {
  title: { default: 'TST_ERP', template: '%s | TST_ERP' },
  description: "O'quv markazlari uchun boshqaruv tizimi",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#100D20' },
    { media: '(prefers-color-scheme: light)', color: '#F7F5FF' },
  ],
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    // data-theme birinchi chizishdan oldin skript bilan qo'yiladi, shuning uchun gidratsiya ogohlantirishi o'chirilgan
    <html lang="uz" className={`${inter.variable} ${mono.variable}`} data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
      </head>
      <body>
        <Fx />
        {children}
      </body>
    </html>
  );
}
