// Chiziqli ikonlar (1.5px, currentColor). Faqat navigatsiya va tugmalarda; bezak uchun emas.
import type { SVGProps } from 'react';

type P = SVGProps<SVGSVGElement>;
const base = (p: P) => ({ viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, ...p });

export const Icon = {
  home: (p: P) => (<svg {...base(p)} aria-hidden={p['aria-label'] ? undefined : true}><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /><path d="M10 21v-6h4v6" /></svg>),
  students: (p: P) => (<svg {...base(p)} aria-hidden={p['aria-label'] ? undefined : true}><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5" /><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8" /><path d="M18.5 14.8c1.6.8 2.6 2.5 3 5.2" /></svg>),
  groups: (p: P) => (<svg {...base(p)} aria-hidden={p['aria-label'] ? undefined : true}><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 9h18" /><path d="M8 4v16" /></svg>),
  book: (p: P) => (<svg {...base(p)} aria-hidden={p['aria-label'] ? undefined : true}><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z" /><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5" /></svg>),
  check: (p: P) => (<svg {...base(p)} aria-hidden={p['aria-label'] ? undefined : true}><path d="m4 12.5 5 5L20 6.5" /></svg>),
  calendar: (p: P) => (<svg {...base(p)} aria-hidden={p['aria-label'] ? undefined : true}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>),
  task: (p: P) => (<svg {...base(p)} aria-hidden={p['aria-label'] ? undefined : true}><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 8h8M8 12h8M8 16h5" /></svg>),
  trophy: (p: P) => (<svg {...base(p)} aria-hidden={p['aria-label'] ? undefined : true}><path d="M8 4h8v5a4 4 0 0 1-8 0z" /><path d="M8 6H4.5a3 3 0 0 0 3.5 4M16 6h3.5a3 3 0 0 1-3.5 4" /><path d="M12 13v4M8.5 21h7M10 17h4v4h-4z" /></svg>),
  cash: (p: P) => (<svg {...base(p)} aria-hidden={p['aria-label'] ? undefined : true}><rect x="2.5" y="6" width="19" height="12" rx="2" /><circle cx="12" cy="12" r="2.5" /><path d="M6 9.5v5M18 9.5v5" /></svg>),
  alert: (p: P) => (<svg {...base(p)} aria-hidden={p['aria-label'] ? undefined : true}><path d="M12 3 2.5 20h19z" /><path d="M12 10v4.5M12 17.5v.01" /></svg>),
  receipt: (p: P) => (<svg {...base(p)} aria-hidden={p['aria-label'] ? undefined : true}><path d="M6 2.5h12v19l-3-2-3 2-3-2-3 2z" /><path d="M9 7.5h6M9 11h6M9 14.5h4" /></svg>),
  chart: (p: P) => (<svg {...base(p)} aria-hidden={p['aria-label'] ? undefined : true}><path d="M4 20V4M4 20h16" /><path d="M8 16v-4M12 16V8M16 16v-6" /></svg>),
  wallet: (p: P) => (<svg {...base(p)} aria-hidden={p['aria-label'] ? undefined : true}><path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H19v14H5.5A2.5 2.5 0 0 1 3 16.5z" /><path d="M15 12h6v4h-6a2 2 0 0 1 0-4z" /></svg>),
  building: (p: P) => (<svg {...base(p)} aria-hidden={p['aria-label'] ? undefined : true}><path d="M4 21V5l8-2v18M12 8l8 2v11M3 21h18" /><path d="M7 9h2M7 13h2M7 17h2M15 13h2M15 17h2" /></svg>),
  staff: (p: P) => (<svg {...base(p)} aria-hidden={p['aria-label'] ? undefined : true}><circle cx="12" cy="7.5" r="3.5" /><path d="M5 21c.9-4.2 3.6-6.5 7-6.5s6.1 2.3 7 6.5" /><path d="M12 14.5v3" /></svg>),
  key: (p: P) => (<svg {...base(p)} aria-hidden={p['aria-label'] ? undefined : true}><circle cx="8" cy="15" r="4" /><path d="m11 12 9-9M16 7l2.5 2.5M18.5 4.5 21 7" /></svg>),
  upload: (p: P) => (<svg {...base(p)} aria-hidden={p['aria-label'] ? undefined : true}><path d="M12 16V4M7 9l5-5 5 5" /><path d="M4 16v4h16v-4" /></svg>),
  send: (p: P) => (<svg {...base(p)} aria-hidden={p['aria-label'] ? undefined : true}><path d="M21 3 3 10.5l7 3 3 7z" /><path d="m10 13.5 4-4" /></svg>),
  log: (p: P) => (<svg {...base(p)} aria-hidden={p['aria-label'] ? undefined : true}><path d="M5 3h10l4 4v14H5z" /><path d="M15 3v4h4M8 12h8M8 16h8" /></svg>),
  settings: (p: P) => (<svg {...base(p)} aria-hidden={p['aria-label'] ? undefined : true}><circle cx="12" cy="12" r="3" /><path d="M12 2.5v3M12 18.5v3M4.2 6.2l2.1 2.1M17.7 15.7l2.1 2.1M2.5 12h3M18.5 12h3M4.2 17.8l2.1-2.1M17.7 8.3l2.1-2.1" /></svg>),
  user: (p: P) => (<svg {...base(p)} aria-hidden={p['aria-label'] ? undefined : true}><circle cx="12" cy="8" r="4" /><path d="M4 21c1-4.5 4.2-7 8-7s7 2.5 8 7" /></svg>),
  layers: (p: P) => (<svg {...base(p)} aria-hidden={p['aria-label'] ? undefined : true}><path d="m12 3 9 5-9 5-9-5z" /><path d="m3 13 9 5 9-5" /></svg>),
  menu: (p: P) => (<svg {...base(p)} aria-hidden={p['aria-label'] ? undefined : true}><path d="M4 7h16M4 12h16M4 17h16" /></svg>),
  close: (p: P) => (<svg {...base(p)} aria-hidden={p['aria-label'] ? undefined : true}><path d="M6 6l12 12M18 6 6 18" /></svg>),
  plus: (p: P) => (<svg {...base(p)} aria-hidden={p['aria-label'] ? undefined : true}><path d="M12 5v14M5 12h14" /></svg>),
  logout: (p: P) => (<svg {...base(p)} aria-hidden={p['aria-label'] ? undefined : true}><path d="M15 4h4v16h-4" /><path d="M10 8l-4 4 4 4M6 12h10" /></svg>),
  download: (p: P) => (<svg {...base(p)} aria-hidden={p['aria-label'] ? undefined : true}><path d="M12 4v12M7 11l5 5 5-5" /><path d="M4 20h16" /></svg>),
  search: (p: P) => (<svg {...base(p)} aria-hidden={p['aria-label'] ? undefined : true}><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" /></svg>),
  lock: (p: P) => (<svg {...base(p)} aria-hidden={p['aria-label'] ? undefined : true}><rect x="5" y="10.5" width="14" height="10" rx="2" /><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" /></svg>),
};
