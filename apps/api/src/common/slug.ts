const CYRILLIC: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'j', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm',
  н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'x', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sh',
  ъ: '', ы: 'i', ь: '', э: 'e', ю: 'yu', я: 'ya', ў: 'o', қ: 'q', ғ: 'g', ҳ: 'h',
};

/** "Najot Ta'lim", "Нажот Таълим", "O‘quv markazi №1" -> "najot-talim", "najot-talim", "oquv-markazi-1". */
export function slugify(input: string, maxLength = 40): string {
  let latin = '';
  for (const ch of input.toLowerCase()) latin += CYRILLIC[ch] ?? ch;
  return latin
    .replace(/№/g, '') // NFKD uni "No" ga aylantirib yuboradi
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[ʻʼ'’‘`´]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, maxLength)
    .replace(/-+$/, '');
}
