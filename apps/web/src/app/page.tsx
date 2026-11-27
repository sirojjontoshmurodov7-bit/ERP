import { T } from '@/components/t';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { Suspense } from 'react';
import { Icon } from '@/components/icons';
import { LangDropdown } from '@/components/lang-dropdown';
import { LandingStage } from './landing-stage';
import { RoleDeck } from './role-deck';
import './landing.css';

export const metadata: Metadata = {
  title: { absolute: "TST_ERP: o'quv markazlari uchun boshqaruv tizimi" },
  description: "Guruh, davomat, to'lov, maosh va Telegram bildirishnomalari bitta tizimda. Ko'p markazli va ko'p filialli.",
  robots: { index: true, follow: true },
};

const FEATURES: { title: string; text: string; icon: keyof typeof Icon; tone: string; span: string }[] = [
  { title: 'Davomat', icon: 'calendar', tone: 'blue', span: 'a', text: "Ustoz darsni ochib, o'quvchilarni belgilaydi. Bir necha kundan keyin dars qulflanadi, o'tgan sanani faqat ruxsati borlar tuzatadi va har tuzatish yoziladi." },
  { title: "To'lov va qarz", icon: 'cash', tone: 'green', span: 'b', text: "Qarz alohida saqlanmaydi, hisoblardan chiqariladi. To'lov guruh sikli yoki o'quvchi sikli bo'yicha, xato esa teskari yozuv bilan tuzatiladi." },
  { title: 'Maosh', icon: 'wallet', tone: 'amber', span: 'c', text: "Ustozning maoshi davomat va qoidalardan hisoblanadi, tasdiqlanadi, bonus va jarima qo'shiladi. Ustoz faqat o'z maoshini ko'radi." },
  { title: 'Vazifa va reyting', icon: 'trophy', tone: 'blue', span: 'c', text: "Ustoz vazifa beradi va baholaydi, o'quvchi topshiradi. Reyting shu ballardan tuziladi." },
  { title: 'Telegram bot', icon: 'send', tone: 'green', span: 'c', text: "Qarz, dars va vazifa haqida eslatma o'quvchining o'z Telegramiga boradi. Bir marta ulash kodi yetadi." },
  { title: 'Excel va CSV', icon: 'upload', tone: 'amber', span: 'd', text: "Eski o'quvchilar ro'yxatini jadvaldan yuklang: avval sinab ko'rasiz, keyin saqlaysiz." },
];

const ROLES = [
  { role: 'Rahbar', text: "Hamma filial, moliya, hisobotlar, xodimlar va ruxsatlar." },
  { role: 'Administrator', text: "O'z filialida o'quvchi, guruh va yozilishlar." },
  { role: 'Kassir', text: "To'lov qabul qilish va qarzdorlar ro'yxati." },
  { role: 'Ustoz', text: "O'z guruhlari, davomat, vazifalar va o'z maoshi." },
  { role: "O'quvchi", text: "O'z balansi, davomati va vazifalari." },
];

async function SessionAction({ variant }: { variant: 'primary' | 'plain' }) {
  const has = (await cookies()).has('erp_rt');
  return (
    <Link className={variant === 'primary' ? 'lp-btn lp-btn--primary' : 'lp-link'} href={has ? '/dashboard' : '/login'}>
      <T>{has ? "Panelga o'tish" : 'Kirish'}</T>
    </Link>
  );
}

function Action({ variant }: { variant: 'primary' | 'plain' }) {
  return (
    <Suspense
      fallback={
        <Link className={variant === 'primary' ? 'lp-btn lp-btn--primary' : 'lp-link'} href="/login">
          <T>{"Kirish"}</T>
        </Link>
      }
    >
      <SessionAction variant={variant} />
    </Suspense>
  );
}

export default function Landing() {
  return (
    <div className="lp">
      <a className="lp-skip" href="#asosiy">
        <T>{"Asosiy qismga o'tish"}</T>
      </a>
      <header className="lp-nav">
        <div className="lp-container lp-nav-row">
          <Link className="lp-brand" href="/">
            <span className="brand-mark" aria-hidden>
              <Icon.cube />
            </span>
            <T>{"TST_ERP"}</T>
          </Link>
          <nav className="lp-nav-links" aria-label="Bo'limlar">
            <a href="#imkoniyatlar"><T>{"Imkoniyatlar"}</T></a>
            <a href="#rollar"><T>{"Rollar"}</T></a>
            <a href="#xavfsizlik"><T>{"Xavfsizlik"}</T></a>
          </nav>
          <span className="lp-lang"><LangDropdown /></span>
          <Action variant="primary" />
        </div>
      </header>

      <main id="asosiy">
        <section className="lp-hero">
          <div className="lp-container lp-hero-grid">
            <div className="lp-hero-text">
              <h1><T>{"O'quv markazingiz hisobi bir joyda"}</T></h1>
              <p className="lp-lead"><T>{"Guruh, davomat, to'lov va maosh: hammasi bitta tizimda."}</T></p>
              <div className="lp-actions">
                <Action variant="primary" />
                <a className="lp-link" href="#imkoniyatlar">
                  <T>{"Imkoniyatlar"}</T>
                </a>
              </div>
            </div>
            <div className="lp-stage">
              <LandingStage />
            </div>
          </div>
        </section>

        <section className="lp-section" id="imkoniyatlar">
          <div className="lp-container lp-split">
            <h2><T>{"Kundalik ish uchun kerak narsalar"}</T></h2>
            <ul className="lp-bento">
              {FEATURES.map((f) => {
                const I = Icon[f.icon];
                return (
                  <li key={f.title} className={`lp-tile lp-tile--${f.span}`} data-tilt data-reveal>
                    <span className={`lp-ico lp-ico--${f.tone}`}>
                      <I />
                    </span>
                    <h3>
                      <T>{f.title}</T>
                    </h3>
                    <p>
                      <T>{f.text}</T>
                    </p>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        <section className="lp-section" id="rollar">
          <div className="lp-container lp-split">
            <h2><T>{"Har kim o'ziga kerakligini ko'radi"}</T></h2>
            <RoleDeck roles={ROLES} />
          </div>
        </section>

        <section className="lp-section lp-dark" id="xavfsizlik">
          <div className="lp-container lp-secure">
            <h2><T>{"Har markazning ma'lumoti o'z qulfi ostida"}</T></h2>
            <ul className="lp-vault" data-tilt>
              <li className="lp-plate"><T>{"Bir markaz boshqasining yozuvini ko'ra olmaydi, buni bazaning o'zi ta'minlaydi."}</T></li>
              <li className="lp-plate"><T>{"To'lov, maosh va audit jurnali o'chirilmaydi, tuzatish alohida yozuv bo'ladi."}</T></li>
              <li className="lp-plate"><T>{"Birinchi kirishda parol almashtiriladi."}</T></li>
            </ul>
          </div>
        </section>

        <section className="lp-section lp-cta">
          <div className="lp-container lp-cta-row">
            <div>
              <h2><T>{"Tizimga kiring"}</T></h2>
              <p className="lp-lead"><T>{"Login va parolni markaz rahbari yoki administrator beradi."}</T></p>
            </div>
            <Action variant="primary" />
          </div>
        </section>
      </main>

      <footer className="lp-foot">
        <div className="lp-container lp-foot-row">
          <span className="lp-brand">
            <span className="brand-mark" aria-hidden>
              <Icon.cube />
            </span>
            <T>{"TST_ERP"}</T>
          </span>
          <Action variant="plain" />
        </div>
      </footer>
    </div>
  );
}
