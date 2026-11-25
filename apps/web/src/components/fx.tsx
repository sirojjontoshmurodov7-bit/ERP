'use client';
// Butun sayt uchun 3D effektlar: yulduzli fon (kursor bilan siljiydi), shisha kartalarda yorug'lik dog'i va qiyalash, skroll bilan paydo bo'lish.
// Skriptsiz yoki "harakatni kamaytirish" yoqilganda hech narsa ishlamaydi: kontent baribir ko'rinadi.
import { useEffect, useRef } from 'react';

const SPOT = '[data-tilt]';
const TILT = '[data-tilt]';

export function Fx() {
  const stars = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const fine = window.matchMedia('(pointer: fine)').matches;
    const root = document.documentElement;

    // ---- yulduzlar
    const canvas = stars.current;
    const ctx = canvas?.getContext('2d');
    const drawStars = () => {
      if (!canvas || !ctx) return;
      const w = window.innerWidth, h = window.innerHeight, dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = getComputedStyle(canvas).color;
      let s = 7;
      const rnd = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
      const n = Math.round((w * h) / 9000);
      for (let i = 0; i < n; i++) {
        const r = rnd() * 1.1 + 0.2;
        ctx.globalAlpha = 0.15 + rnd() * 0.6;
        ctx.beginPath(); ctx.arc(rnd() * w, rnd() * h, r, 0, Math.PI * 2); ctx.fill();
      }
    };
    drawStars();
    window.addEventListener('resize', drawStars);

    if (reduced) return () => window.removeEventListener('resize', drawStars);
    root.dataset.fx = 'on';

    // ---- skroll bilan paydo bo'lish
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }),
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
    );
    const watch = (scope: ParentNode) => scope.querySelectorAll('[data-reveal]:not(.is-in)').forEach((el) => io.observe(el));
    watch(document);
    const mo = new MutationObserver(() => watch(document));
    mo.observe(document.body, { childList: true, subtree: true });

    // ---- kursor: yorug'lik dog'i, qiyalash, fon parallaksi
    let raf = 0;
    let ev: PointerEvent | null = null;
    let current: HTMLElement | null = null;
    let tiltEl: HTMLElement | null = null;
    const clear = (el: HTMLElement | null) => { if (el) { el.style.removeProperty('--rx'); el.style.removeProperty('--ry'); el.dataset.live = ''; } };
    const frame = () => {
      raf = 0;
      if (!ev) return;
      root.style.setProperty('--px', ((ev.clientX / window.innerWidth) - 0.5).toFixed(3));
      root.style.setProperty('--py', ((ev.clientY / window.innerHeight) - 0.5).toFixed(3));
      const target = (ev.target as Element | null)?.closest?.(SPOT) as HTMLElement | null;
      if (target) {
        const r = target.getBoundingClientRect();
        const x = ev.clientX - r.left, y = ev.clientY - r.top;
        target.style.setProperty('--mx', `${x}px`);
        target.style.setProperty('--my', `${y}px`);
        current = target;
      }
      const tt = (ev.target as Element | null)?.closest?.(TILT) as HTMLElement | null;
      if (tt !== tiltEl) { clear(tiltEl); tiltEl = tt; }
      if (tt) {
        const r = tt.getBoundingClientRect();
        const nx = (ev.clientX - r.left) / r.width - 0.5, ny = (ev.clientY - r.top) / r.height - 0.5;
        tt.style.setProperty('--ry', `${(nx * 14).toFixed(2)}deg`);
        tt.style.setProperty('--rx', `${(-ny * 14).toFixed(2)}deg`);
        tt.dataset.live = '1';
      }
    };
    const onMove = (e: PointerEvent) => {
      ev = e;
      if (!raf) raf = requestAnimationFrame(frame);
    };
    const onLeave = () => { clear(tiltEl); tiltEl = null; current = null; };
    if (fine) {
      window.addEventListener('pointermove', onMove, { passive: true });
      document.addEventListener('pointerleave', onLeave);
    }
    return () => {
      window.removeEventListener('resize', drawStars);
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerleave', onLeave);
      io.disconnect(); mo.disconnect();
      if (raf) cancelAnimationFrame(raf);
      delete root.dataset.fx;
      void current;
    };
  }, []);

  return (
    <div className="space" aria-hidden="true">
      <div className="space-aurora" />
      <canvas ref={stars} className="space-stars" />
    </div>
  );
}
