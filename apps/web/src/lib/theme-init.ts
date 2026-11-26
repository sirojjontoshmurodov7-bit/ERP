// Birinchi chizishdan oldin ishlaydigan skript (root layout <head> ichida): saqlangan mavzu va tilni miltillashsiz qo'yadi.
// Sukut: qorong'i mavzu, o'zbek tili (cookie `tst-lang=ru` bo'lsa <html lang="ru">).
export const THEME_KEY = 'tst-theme';
export const THEME_INIT = `try{var t=localStorage.getItem('${THEME_KEY}');document.documentElement.dataset.theme=t==='light'?'light':'dark'}catch(e){}try{if(/(?:^|;\\s*)tst-lang=ru(?:;|$)/.test(document.cookie))document.documentElement.lang='ru'}catch(e){}`;
