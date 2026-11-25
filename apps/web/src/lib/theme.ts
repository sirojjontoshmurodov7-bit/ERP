'use client';
// Yorug'/qorong'i mavzu: tanlov localStorage'da, sukut qorong'i. <html data-theme> CSS tokenlarni almashtiradi.
import { useCallback, useSyncExternalStore } from 'react';
import { THEME_KEY as KEY } from './theme-init';

export type Theme = 'dark' | 'light';

function read(): Theme {
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
}
function subscribe(cb: () => void) {
  const mo = new MutationObserver(cb);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  return () => mo.disconnect();
}

export function useTheme(): [Theme, () => void] {
  const theme = useSyncExternalStore(subscribe, read, () => 'dark' as Theme);
  const toggle = useCallback(() => {
    const next: Theme = read() === 'light' ? 'dark' : 'light';
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(KEY, next);
    } catch {
      // saqlab bo'lmasa (maxfiy oyna) faqat shu sahifada ishlaydi
    }
  }, []);
  return [theme, toggle];
}
