// Birinchi chizishdan oldin ishlaydigan skript (root layout <head> ichida): saqlangan mavzuni miltillashsiz qo'yadi. Sukut qorong'i.
export const THEME_KEY = 'tst-theme';
export const THEME_INIT = `try{var t=localStorage.getItem('${THEME_KEY}');document.documentElement.dataset.theme=t==='light'?'light':'dark'}catch(e){}`;
