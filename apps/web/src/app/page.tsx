import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { Suspense } from 'react';
import './landing.css';

export const metadata: Metadata = {
  title: "O'quv markazlari uchun boshqaruv tizimi",
  description: "Guruh, davomat, to'lov, maosh va Telegram bildirishnomalari bitta tizimda. Ko'p markazli va ko'p filialli.",
  robots: { index: true, follow: true },
};

const FEATURES = [
  { title: 'Davomat', text: "Ustoz darsni ochib, o'quvchilarni belgilaydi. Bir necha kundan keyin dars qulflanadi, o'tgan sanani faqat ruxsati borlar tuzatadi va har tuzatish yoziladi." },
  { title: "To'lov va qarz", text: "Qarz alohida saqlanmaydi, hisoblardan chiqariladi. To'lov guruh sikli yoki o'quvchi sikli bo'yicha, xato esa teskari yozuv bilan tuzatiladi." },
  { title: 'Maosh', text: "Ustozning maoshi davomat va qoidalardan hisoblanadi, tasdiqlanadi, bonus va jarima qo'shiladi. Ustoz faqat o'z maoshini ko'radi." },
  { title: 'Vazifa va reyting', text: "Ustoz vazifa beradi va baholaydi, o'quvchi topshiradi. Reyting shu ballardan tuziladi." },
  { title: 'Telegram bot', text: "Qarz, dars va vazifa haqida eslatma o'quvchining o'z Telegramiga boradi. Bir marta ulash kodi yetadi." },
  { title: 'Excel va CSV', text: "Eski o'quvchilar ro'yxatini jadvaldan yuklang: avval sinab ko'rasiz, keyin saqlaysiz." },
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
      {has ? "Panelga o'tish" : 'Kirish'}
    </Link>
  );
}

function Action({ variant }: { variant: 'primary' | 'plain' }) {
  return (
    <Suspense
      fallback={
        <Link className={variant === 'primary' ? 'lp-btn lp-btn--primary' : 'lp-link'} href="/login">
          Kirish
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
        Asosiy qismga o&apos;tish
      </a>
      <header className="lp-nav">
        <div className="lp-container lp-nav-row">
          <Link className="lp-brand" href="/">
            <span className="lp-mark" aria-hidden />
            O&apos;quv markazi
          </Link>
          <nav className="lp-nav-links" aria-label="Bo'limlar">
            <a href="#imkoniyatlar">Imkoniyatlar</a>
            <a href="#rollar">Rollar</a>
            <a href="#xavfsizlik">Xavfsizlik</a>
          </nav>
          <Action variant="primary" />
        </div>
      </header>

      <main id="asosiy">
        <section className="lp-hero">
          <div className="lp-container lp-hero-grid">
            <div className="lp-hero-text">
              <h1>O&apos;quv markazingiz hisobi bir joyda</h1>
              <p className="lp-lead">Guruh, davomat, to&apos;lov va maosh: hammasi bitta tizimda.</p>
              <div className="lp-actions">
                <Action variant="primary" />
                <a className="lp-link" href="#imkoniyatlar">
                  Imkoniyatlar
                </a>
              </div>
            </div>
            <div className="lp-shot" data-slot>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/screens/dashboard.png" alt="Rahbarning bosh sahifasi: oy ko'rsatkichlari va qarzdorlar" width={1440} height={900} fetchPriority="high" />
            </div>
          </div>
        </section>

        <section className="lp-section" id="imkoniyatlar">
          <div className="lp-container lp-split">
            <h2>Kundalik ish uchun kerak narsalar</h2>
            <ul className="lp-rows">
              {FEATURES.map((f) => (
                <li key={f.title}>
                  <h3>{f.title}</h3>
                  <p>{f.text}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="lp-section lp-section--tint" id="rollar">
          <div className="lp-container lp-split">
            <h2>Har kim o&apos;ziga kerakligini ko&apos;radi</h2>
            <dl className="lp-roles">
              {ROLES.map((r) => (
                <div key={r.role}>
                  <dt>{r.role}</dt>
                  <dd>{r.text}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="lp-section lp-dark" id="xavfsizlik">
          <div className="lp-container lp-secure">
            <h2>Har markazning ma&apos;lumoti o&apos;z qulfi ostida</h2>
            <ul className="lp-points">
              <li>Bir markaz boshqasining yozuvini ko&apos;ra olmaydi, buni bazaning o&apos;zi ta&apos;minlaydi.</li>
              <li>To&apos;lov, maosh va audit jurnali o&apos;chirilmaydi, tuzatish alohida yozuv bo&apos;ladi.</li>
              <li>Birinchi kirishda parol almashtiriladi.</li>
            </ul>
          </div>
        </section>

        <section className="lp-section lp-cta">
          <div className="lp-container lp-cta-row">
            <div>
              <h2>Tizimga kiring</h2>
              <p className="lp-lead">Login va parolni markaz rahbari yoki administrator beradi.</p>
            </div>
            <Action variant="primary" />
          </div>
        </section>
      </main>

      <footer className="lp-foot">
        <div className="lp-container lp-foot-row">
          <span className="lp-brand">
            <span className="lp-mark" aria-hidden />
            O&apos;quv markazi
          </span>
          <Action variant="plain" />
        </div>
      </footer>
    </div>
  );
}
