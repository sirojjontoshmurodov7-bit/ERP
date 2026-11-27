// Birinchi chizishdan oldin ishlaydigan skript (root layout <head> ichida): saqlangan mavzu va tilni miltillashsiz qo'yadi.
// Sukut: qorong'i mavzu, o'zbek tili (cookie `tst-lang` uz-cyrl/ru/en bo'lsa shu <html lang>).
export const THEME_KEY = 'tst-theme';
export const THEME_INIT = `try{var t=localStorage.getItem('${THEME_KEY}');document.documentElement.dataset.theme=t==='light'?'light':'dark'}catch(e){}try{var m=document.cookie.match(/(?:^|;\\s*)tst-lang=(uz-cyrl|ru|en)(?:;|$)/);if(m)document.documentElement.lang=m[1]==='uz-cyrl'?'uz-Cyrl':m[1]}catch(e){}`;
