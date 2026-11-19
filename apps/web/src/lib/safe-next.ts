/** Faqat o'z ilovamizdagi nisbiy yo'lga qaytaramiz (ochiq redirect yo'q). `/` landing sahifa, shuning uchun panel bosh sahifasi `/dashboard`. */
export function safeNext(v: string | null): string {
  if (!v || v === '/' || !v.startsWith('/') || v.startsWith('//') || v.startsWith('/\\') || v.startsWith('/api')) return '/dashboard';
  return v;
}
