'use client';
// Interaktiv 3D globus (canvas, kutubxonasiz): sudrab aylantiriladi, nuqtalar bosiladi, tanlangan nuqta oldinga burilib keladi.
// Ranglar CSS tokenlardan (--globe-*) o'qiladi. Dekorativ: klaviatura uchun yonida alohida tugmalar bo'ladi.
import { useEffect, useRef } from 'react';

export interface GlobeNode {
  label: string;
  lat?: number; // daraja
  lon?: number;
}

interface Props {
  nodes?: GlobeNode[];
  active?: number;
  onSelect?: (index: number) => void;
  className?: string;
  spin?: number;
}

const TAU = Math.PI * 2;
const DEG = Math.PI / 180;

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const hash3 = (x: number, y: number, z: number) => {
  const h = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453;
  return h - Math.floor(h);
};
const smooth = (t: number) => t * t * (3 - 2 * t);
function vnoise(x: number, y: number, z: number) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const xf = smooth(x - xi), yf = smooth(y - yi), zf = smooth(z - zi);
  const l = (a: number, b: number, t: number) => a + (b - a) * t;
  const c = (dx: number, dy: number, dz: number) => hash3(xi + dx, yi + dy, zi + dz);
  return l(
    l(l(c(0, 0, 0), c(1, 0, 0), xf), l(c(0, 1, 0), c(1, 1, 0), xf), yf),
    l(l(c(0, 0, 1), c(1, 0, 1), xf), l(c(0, 1, 1), c(1, 1, 1), xf), yf),
    zf,
  );
}
const fbm = (x: number, y: number, z: number) => vnoise(x, y, z) * 0.55 + vnoise(x * 2.1, y * 2.1, z * 2.1) * 0.3 + vnoise(x * 4.3, y * 4.3, z * 4.3) * 0.15;

// Qit'a o'xshash dog'lar: shovqin bo'yicha quruqlik, quruqlikda "shahar chiroqlari"
function buildPoints(count: number) {
  const px = new Float32Array(count), py = new Float32Array(count), pz = new Float32Array(count), kind = new Uint8Array(count);
  const rnd = mulberry32(11);
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const th = golden * i;
    const x = Math.cos(th) * r, z = Math.sin(th) * r;
    px[i] = x; py[i] = y; pz[i] = z;
    const land = fbm(x * 2.3 + 3, y * 2.3 + 1, z * 2.3 + 7);
    if (land > 0.5) kind[i] = rnd() > 0.93 && fbm(x * 7, y * 7, z * 7) > 0.46 ? 2 : 1;
    else kind[i] = 0;
  }
  return { px, py, pz, kind, count };
}

function nodeVec(n: GlobeNode, i: number, total: number) {
  const lat = (n.lat ?? ((((i * 0.618) % 1) - 0.5) * 100)) * DEG;
  const lon = (n.lon ?? (i * (360 / Math.max(total, 1)) + 20)) * DEG;
  return { x: Math.cos(lat) * Math.sin(lon), y: Math.sin(lat), z: Math.cos(lat) * Math.cos(lon), lat, lon };
}

export function Globe({ nodes = [], active = -1, onSelect, className, spin = 0.0016 }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const live = useRef({ nodes, active, onSelect, spin });
  const kick = useRef<() => void>(() => {});

  useEffect(() => {
    live.current = { nodes, active, onSelect, spin };
    kick.current();
  }, [nodes, active, onSelect, spin]);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const c2d = canvas.getContext('2d');
    if (!c2d) return;
    const ctx: CanvasRenderingContext2D = c2d;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const pts = buildPoints(3400);

    let w = 0, h = 0, dpr = 1;
    let rotY = 0.6, rotX = 0.32;
    let velY = 0, velX = 0;
    let dragging = false, moved = 0, lastX = 0, lastY = 0;
    let hover = -1;
    let visible = true;
    let raf = 0;
    let time = 0;
    let lastActive = -2;
    let target: { y: number; x: number } | null = null;
    let colors = { land: '', city: '', line: '', glow: '', body: '', body2: '', ink: '', font: '' };

    const readColors = () => {
      const cs = getComputedStyle(canvas);
      const g = (n: string) => cs.getPropertyValue(n).trim();
      colors = { land: g('--globe-land'), city: g('--globe-city'), line: g('--globe-line'), glow: g('--globe-glow'), body: g('--globe-body'), body2: g('--globe-body-2'), ink: g('--color-ink'), font: cs.fontFamily };
    };

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = Math.max(1, r.width); h = Math.max(1, r.height);
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      readColors();
      draw();
    };

    const rot = (x: number, y: number, z: number) => {
      const cy = Math.cos(rotY), sy = Math.sin(rotY), cx = Math.cos(rotX), sx = Math.sin(rotX);
      const x1 = x * cy + z * sy, z1 = -x * sy + z * cy;
      return { x: x1, y: y * cx - z1 * sx, z: y * sx + z1 * cx };
    };

    const ring = (tiltX: number, tiltZ: number, scale: number, alpha: number, phase: number, R: number, cx: number, cy: number) => {
      const steps = 120;
      ctx.lineWidth = 1;
      let prev: { sx: number; sy: number; z: number } | null = null;
      for (let i = 0; i <= steps; i++) {
        const a = (i / steps) * TAU + phase;
        let x = Math.cos(a) * scale, y = 0, z = Math.sin(a) * scale;
        const y1 = y * Math.cos(tiltX) - z * Math.sin(tiltX); const z1 = y * Math.sin(tiltX) + z * Math.cos(tiltX); y = y1; z = z1;
        const x2 = x * Math.cos(tiltZ) - y * Math.sin(tiltZ); const y2 = x * Math.sin(tiltZ) + y * Math.cos(tiltZ); x = x2; y = y2;
        const p = { sx: cx + x * R, sy: cy - y * R, z };
        if (prev) {
          ctx.globalAlpha = alpha * (0.25 + 0.75 * ((p.z + 1) / 2));
          ctx.beginPath(); ctx.moveTo(prev.sx, prev.sy); ctx.lineTo(p.sx, p.sy); ctx.stroke();
        }
        prev = p;
      }
    };

    const arcPoint = (a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }, t: number) => {
      const dot = Math.min(1, Math.max(-1, a.x * b.x + a.y * b.y + a.z * b.z));
      const om = Math.acos(dot) || 0.0001;
      const s = Math.sin(om);
      const k1 = Math.sin((1 - t) * om) / s, k2 = Math.sin(t * om) / s;
      let x = a.x * k1 + b.x * k2, y = a.y * k1 + b.y * k2, z = a.z * k1 + b.z * k2;
      const len = Math.hypot(x, y, z) || 1;
      const lift = 1 + Math.sin(Math.PI * t) * 0.2;
      x = (x / len) * lift; y = (y / len) * lift; z = (z / len) * lift;
      return rot(x, y, z);
    };

    function draw() {
      const { nodes: ns, active: act } = live.current;
      ctx.clearRect(0, 0, w, h);
      const R = Math.min(w, h) * 0.34;
      const cx = w / 2, cy = h / 2;

      // atmosfera
      const glow = ctx.createRadialGradient(cx, cy, R * 0.85, cx, cy, R * 1.55);
      glow.addColorStop(0, colors.glow); glow.addColorStop(1, 'transparent');
      ctx.globalAlpha = 0.34; ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(cx, cy, R * 1.55, 0, TAU); ctx.fill();

      // globus tanasi
      const body = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.1, cx, cy, R);
      body.addColorStop(0, colors.body); body.addColorStop(1, colors.body2);
      ctx.globalAlpha = 1; ctx.fillStyle = body; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fill();

      // orbita chiziqlari (orqada)
      ctx.strokeStyle = colors.line;
      const rp = reduced ? 0 : time * 0.12;
      ring(1.15, 0.35, 1.22, 0.5, rp, R, cx, cy);
      ring(0.55, -0.5, 1.4, 0.32, -rp * 0.7, R, cx, cy);

      // nuqtalar: avval orqa yarim shar, keyin old
      for (let pass = 0; pass < 2; pass++) {
        for (let i = 0; i < pts.count; i++) {
          const p = rot(pts.px[i]!, pts.py[i]!, pts.pz[i]!);
          const front = p.z > 0;
          if ((pass === 0) === front) continue;
          const k = pts.kind[i]!;
          const depth = (p.z + 1) / 2;
          const sx = cx + p.x * R, sy = cy - p.y * R;
          if (k === 0) {
            if (!front || i % 4) continue;
            ctx.globalAlpha = 0.14 + depth * 0.14; ctx.fillStyle = colors.line;
            ctx.fillRect(sx - 0.5, sy - 0.5, 1, 1);
          } else if (k === 1) {
            ctx.globalAlpha = front ? 0.45 + depth * 0.55 : 0.08; ctx.fillStyle = colors.land;
            const s = front ? 1.3 + depth * 1.2 : 0.8;
            ctx.fillRect(sx - s / 2, sy - s / 2, s, s);
          } else {
            ctx.globalAlpha = front ? 0.55 + depth * 0.45 : 0.08; ctx.fillStyle = colors.city;
            const s = front ? 1.6 + depth * 1.6 : 1;
            ctx.beginPath(); ctx.arc(sx, sy, s, 0, TAU); ctx.fill();
          }
        }
      }

      // yorug'lik qirrasi
      ctx.globalAlpha = 0.5; ctx.strokeStyle = colors.line; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.stroke();

      // oldingi orbita
      ctx.strokeStyle = colors.line;
      ring(0.9, 1.1, 1.12, 0.4, rp * 1.4, R, cx, cy);

      // tugunlar va yoylar
      const vecs = ns.map((n, i) => nodeVec(n, i, ns.length));
      if (vecs.length > 1) {
        ctx.lineWidth = 1.2; ctx.strokeStyle = colors.land;
        for (let i = 0; i < vecs.length; i++) {
          const a = vecs[i]!, b = vecs[(i + 1) % vecs.length]!;
          let prev = arcPoint(a, b, 0);
          for (let s = 1; s <= 28; s++) {
            const p = arcPoint(a, b, s / 28);
            const front = (p.z + prev.z) / 2 > -0.1;
            ctx.globalAlpha = front ? 0.38 : 0.05;
            ctx.beginPath(); ctx.moveTo(cx + prev.x * R, cy - prev.y * R); ctx.lineTo(cx + p.x * R, cy - p.y * R); ctx.stroke();
            prev = p;
          }
          if (!reduced) {
            const t = (time * 0.22 + i * 0.37) % 1;
            const p = arcPoint(a, b, t);
            if (p.z > -0.1) {
              ctx.globalAlpha = 0.95; ctx.fillStyle = colors.city;
              ctx.beginPath(); ctx.arc(cx + p.x * R, cy - p.y * R, 2.2, 0, TAU); ctx.fill();
            }
          }
        }
      }

      ctx.font = `600 13px ${colors.font}`; ctx.textBaseline = 'middle';
      vecs.forEach((v, i) => {
        const p = rot(v.x, v.y, v.z);
        const sx = cx + p.x * R, sy = cy - p.y * R;
        const on = i === act, hot = i === hover;
        const vis = p.z > 0.05;
        if (!vis) { ctx.globalAlpha = 0.15; ctx.fillStyle = colors.land; ctx.beginPath(); ctx.arc(sx, sy, 2, 0, TAU); ctx.fill(); return; }
        const pulse = reduced ? 0 : (time * 0.9 + i * 0.3) % 1;
        ctx.globalAlpha = (1 - pulse) * 0.55; ctx.strokeStyle = colors.city; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.arc(sx, sy, 5 + pulse * (on ? 26 : 16), 0, TAU); ctx.stroke();
        ctx.globalAlpha = 1; ctx.fillStyle = on || hot ? colors.city : colors.land;
        ctx.beginPath(); ctx.arc(sx, sy, on ? 6.5 : hot ? 6 : 4.2, 0, TAU); ctx.fill();
        ctx.globalAlpha = 0.9; ctx.fillStyle = colors.body2; ctx.beginPath(); ctx.arc(sx, sy, on ? 2.4 : 1.6, 0, TAU); ctx.fill();
        const label = ns[i]!.label;
        const tw = ctx.measureText(label).width;
        const right = sx < cx;
        const lx = right ? sx + 14 : sx - 14 - tw;
        ctx.globalAlpha = on || hot ? 1 : 0.78;
        ctx.fillStyle = colors.body2; ctx.globalAlpha *= 0.7;
        ctx.beginPath(); ctx.roundRect(lx - 8, sy - 12, tw + 16, 24, 12); ctx.fill();
        ctx.globalAlpha = on || hot ? 1 : 0.82; ctx.fillStyle = on || hot ? colors.city : colors.ink;
        ctx.fillText(label, lx, sy + 0.5);
      });
      ctx.globalAlpha = 1;
    }

    const hit = (mx: number, my: number) => {
      const R = Math.min(w, h) * 0.34;
      const ns = live.current.nodes;
      let best = -1, bd = 22 * 22;
      ns.forEach((n, i) => {
        const v = nodeVec(n, i, ns.length);
        const p = rot(v.x, v.y, v.z);
        if (p.z < 0.05) return;
        const dx = w / 2 + p.x * R - mx, dy = h / 2 - p.y * R - my;
        const d = dx * dx + dy * dy;
        if (d < bd) { bd = d; best = i; }
      });
      return best;
    };

    const step = () => {
      raf = 0;
      if (!visible) return;
      time += 0.016;
      const { active: act, nodes: ns, spin: sp } = live.current;
      if (act !== lastActive) {
        lastActive = act;
        if (act >= 0 && ns[act]) {
          const v = nodeVec(ns[act]!, act, ns.length);
          target = { y: -v.lon, x: Math.max(-0.7, Math.min(0.7, v.lat * 0.8)) };
        }
      }
      if (dragging) { target = null; }
      else if (target) {
        let dy = (target.y - rotY) % TAU; if (dy > Math.PI) dy -= TAU; if (dy < -Math.PI) dy += TAU;
        const dx = target.x - rotX;
        rotY += dy * 0.09; rotX += dx * 0.09;
        velY = 0; velX = 0;
        if (Math.abs(dy) < 0.003 && Math.abs(dx) < 0.003) target = null;
      } else {
        rotY += velY + (hover >= 0 || act >= 0 ? 0 : sp);
        rotX += velX; velY *= 0.94; velX *= 0.94;
        rotX = Math.max(-0.9, Math.min(0.9, rotX));
      }
      draw();
      if (!reduced) raf = requestAnimationFrame(step);
    };
    const kickFrame = () => {
      if (reduced) { lastActive = -2; step(); } else if (!raf) raf = requestAnimationFrame(step);
    };
    kick.current = () => { lastActive = -2; kickFrame(); };

    const onDown = (e: PointerEvent) => {
      dragging = true; moved = 0; lastX = e.clientX; lastY = e.clientY; velX = 0; velY = 0;
      canvas.setPointerCapture(e.pointerId); canvas.style.cursor = 'grabbing';
    };
    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      if (dragging) {
        const dx = e.clientX - lastX, dy = e.clientY - lastY;
        lastX = e.clientX; lastY = e.clientY; moved += Math.abs(dx) + Math.abs(dy);
        velY = dx * 0.006; velX = dy * 0.004; rotY += dx * 0.006; rotX = Math.max(-0.9, Math.min(0.9, rotX + dy * 0.004));
      } else {
        const hv = hit(e.clientX - r.left, e.clientY - r.top);
        if (hv !== hover) { hover = hv; canvas.style.cursor = hv >= 0 ? 'pointer' : 'grab'; }
      }
      kickFrame();
    };
    const onUp = (e: PointerEvent) => {
      dragging = false; canvas.style.cursor = hover >= 0 ? 'pointer' : 'grab';
      if (moved < 6) {
        const r = canvas.getBoundingClientRect();
        const i = hit(e.clientX - r.left, e.clientY - r.top);
        if (i >= 0) live.current.onSelect?.(i);
      }
      kickFrame();
    };
    const onLeave = () => { hover = -1; kickFrame(); };

    canvas.style.cursor = 'grab';
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onUp);
    canvas.addEventListener('pointerleave', onLeave);
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const io = new IntersectionObserver(([en]) => { visible = !!en?.isIntersecting; if (visible) kickFrame(); });
    io.observe(canvas);
    const mo = new MutationObserver(() => { readColors(); kickFrame(); });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class'] });
    resize();
    kickFrame();
    return () => {
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect(); io.disconnect(); mo.disconnect();
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onUp);
      canvas.removeEventListener('pointerleave', onLeave);
      kick.current = () => {};
    };
  }, []);

  return <canvas ref={ref} className={`globe ${className ?? ''}`} aria-hidden="true" />;
}
