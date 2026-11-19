/** Faqat o'z ilovamizdagi nisbiy yo'lga qaytaramiz (ochiq redirect yo'q). */
export function safeNext(v: string | null): string {
  if (!v || !v.startsWith('/') || v.startsWith('//') || v.startsWith('/\\') || v.startsWith('/api')) return '/';
  return v;
}
