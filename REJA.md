# O'quv markazlari uchun ERP — yakuniy reja

> Holat: 1-versiya. Raqamlar "taxmin" deb belgilanganlari tekshirilmagan. Manbalar bozor tadqiqoti bo'limida.

## 1. Qisqa xulosa va qiymat taklifi

Ko'p markazli (multi-tenant) va ko'p filialli **o'quv markazlari ERP tizimi**: guruhlar, davomat, uyga vazifa/baho, reyting, to'lovlar, qarzdorlik, ustozlar maoshi, hisobotlar. Telegram bot orqali bildirishnomalar. Super admin (siz) markazlarni ochadi, bloklaydi va obunasini boshqaradi.

**Qiymat taklifi (farqlovchi tomonlar, tadqiqotda tasdiqlanishi kerak):**
1. **Ikki xil to'lov sikli:** guruh bo'yicha umumiy sana (Najot Ta'lim usuli) va o'quvchi kelgan sanadan shaxsiy sikl (Everest usuli). Qarz faqat sana o'tganda paydo bo'ladi.
2. **Moslashuvchan maosh motori:** qat'iy oylik, o'quvchi to'lovidan foiz, yordamchi ustozga guruh boshiga summa, aralash + bonus/jarima.
3. **Ruxsatlar asosidagi rollar:** kassir/admin bir kishi bo'lishi yoki ajratilishi rahbarning sozlamasi.
4. **Filiallar** boshidan arxitekturada.
5. **Telegram-first aloqa** (bepul), SMS va onlayn to'lov keyin.

## 2. Muammo va auditoriya

- **To'lovchi mijoz:** markaz rahbari/egasi. Og'riq: qarzdorlikni, kassani va maoshni daftar/Excelda yuritish, filiallar bo'yicha nazoratning yo'qligi, xodimlarning pul bilan ishlashidagi ishonchsizlik.
- **Foydalanuvchilar:** admin, kassir, ustoz, o'quvchi.
- **Maqsadli segment:** til markazlari, IT kurslar, maktab oldi/repetitor markazlari (universal). Hudud: O'zbekiston (o'zbek va rus tili interfeysi).
- Eslatma: muammoni shaxsan ko'rganingiz haqida javob "bozor imkoniyati" edi. **Birinchi vazifa 5–10 ta rahbar bilan suhbat.**

## 3. Bozor tahlili

| Mahsulot | Narx (sotuvchi sahifasidan) | Manba |
|---|---|---|
| SchoolupCRM | 7 200 000 so'm bir martalik | https://schoolup.uz/en |
| UstozCRM | 300 ming so'mdan/oy | https://ustozcrm.uz/ |
| ALFA CRM | 250 ming so'mdan/oy | https://biznestizim.uz/uz/kategoriyalar/crm/oquv-markaz |
| Umai CRM | $49 / $129 oyiga | https://www.umaicrm.com/ |
| Mycenter, WeWork, EduCRM | narx ko'rsatilmagan; 14 kun–1 oy sinov | https://mycenter.uz/ , https://we-work.uz/ , https://educrm.uz/ |

- **Xulosa:** bozor to'yingan; standart funksiyalar hammada bor. Narx taxminan 190–300 ming so'm/oy.
- **Bo'shliq (TAXMIN, tekshirilmagan):** murakkab to'lov sikllari, maosh qoidalari va ko'p filialli hisobotlar. Raqobatchi sharhlari/shikoyatlari topilmadi.
- **To'lov tizimlari:** Payme Subscribe/Merchant API eng pishgan; Click takroriy to'lovi haqida manbalar zid (rasmiy hujjatdan tekshirish); Uzum rasmiy hujjati topilmadi.
- **Qonun:** shaxsiy ma'lumotlar lokalizatsiyasi 2021-yilda kiritilgan, 2026-yil martda faqat biometrik/genetik va telekom ma'lumotlariga toraytirilgan ko'rinadi (https://kun.uz/en/news/2026/03/27/uzbekistan-amends-personal-data-law-to-facilitate-global-payment-systems). **Lex.uz yoki yurist orqali tekshiring.**
- **Bepul infra:** Neon/Supabase bepul Postgres; Render bepul bazasi 30 kunda o'chadi; Fly.io yangi akkauntlarga bepul emas (uchinchi tomon manbalari, rasmiy sahifalardan tekshiring).

## 4. Mahsulot

### Rollar va ruxsatlar
- **Super admin:** markaz yaratish/bloklash, rahbar va adminni ochish, tarif/sinov. O'quvchi va ustozni ko'rmaydi.
- **Rahbar:** markazdagi hamma narsa; barcha filiallar; xodim yaratish; kassir/admin ruxsatlarini sozlash; qarzdorlar, hisobotlar, maosh.
- **Admin:** ustoz/guruh/o'quvchi yaratish va tahrirlash, o'quvchini guruhlar orasida ko'chirish, davomatni ko'rish. Filialga bog'langan.
- **Kassir:** to'lov kirimi, qarzdorlik, maosh hisobotini ko'rish. Ixtiyoriy: ruxsatlar adminga berilishi mumkin.
- **Ustoz:** o'z guruhlari, davomat, uyga vazifa va baho.
- **O'quvchi:** o'z guruhi, vazifani bajarish/yuklash, reyting (guruh/markaz × oylik/umumiy).
- **Parol:** hisobni yaratgan kishi vaqtinchalik parol beradi; birinchi kirishda majburiy almashtirish. O'quvchini faqat admin/rahbar yaratadi.
- Texnik yondashuv: qattiq rollar o'rniga `role` + `permissions` (rahbar sozlaydi).

### Asosiy domen qoidalari
- **Tashkilot → filial → guruh → o'quvchi** ierarxiyasi.
- **To'lov rejimi:** markaz/guruh darajasida `GROUP_CYCLE` yoki `STUDENT_CYCLE`. Qarz = davr boshlanishi + imtiyoz kunlari o'tgan va to'lanmagan summa.
- **Narx:** guruhdan olinadi; o'quvchiga chegirma/imtiyoz (foiz, summa, grant, bepul).
- **Pul harakatlari append-only** (o'chirilmaydi, faqat qaytarish yozuvi). Bu moliyaviy ishonch va audit uchun.
- **Maosh qoidasi** ustoz va guruh bo'yicha: FIXED, PERCENT, PER_GROUP, MIXED + bonus/jarima.

### Bosqichlar
- **MVP (1-bosqich):** tenant/filial/rollar, guruh, o'quvchi, davomat, to'lov (2 sikl), qarzdorlik, chegirma, kassa, ustoz maoshi, asosiy hisobotlar, Excel import, audit, SaaS billing minimumi (markaz holati/sinov/bloklash).
- **2-bosqich:** uyga vazifa + baho, reyting, o'quvchi/ustoz paneli, Telegram bot.
- **3-bosqich:** Payme/Click avtomatik to'lov, SMS, AI hisobot (rahbarga xulosa/anomaliya).
- **4-bosqich:** ota-ona kabineti, sertifikatlar, lead voronkasi, mobil ilova (agar kerak).

## 5. Pul modeli va narxlash (taxmin)

- **Obuna (markaz uchun)**, narx raqobatchilarga yaqin: **taxminan 200–300 ming so'm/oy** asosiy tarif; ko'p filial va AI hisobot uchun yuqori tarif.
- Bepul sinov: 14–30 kun (raqobatchilar ham shunday).
- **Moliyaviy taxmin (tekshirilmagan):** 5 markaz × 250 000 so'm = ~1,25 mln so'm/oy. 20 markaz = ~5 mln so'm/oy. Birinchi xarajatlar: domen, keyin ~$5–20/oy server (pullik bosqichda).
- Maqsad: 6 oyda 3–5 ta pullik markaz.

## 6. Marketing va mijoz topish

1. **Tanish markazlar:** Najot, Everest, Qorako'l kabi sizga tanish markaz tuzilmalarini bilganingiz uchun bu tarmoqdan boshlang; 3 ta pilot markaz.
2. **Pilot shartlari:** bepul 2–3 oy, evaziga fikr va keyin pullik; mumkin bo'lsa oldindan kichik avans.
3. **Excel import** = ko'chib o'tish to'sig'ini olib tashlaydi (asosiy sotuv argumenti).
4. **Telegram kanal/guruhlar** (o'quv markazlari rahbarlari jamoalari), qisqa demo video.
5. Raqobatchilardan farq: "ikki xil to'lov sikli + maosh qoidalari + filial hisobotlari" demosi.

## 7. Texnik reja

**Stack (siz biladigan):** TypeScript; **NestJS** (modulli monolit), **PostgreSQL** (Neon yoki Supabase bepul), **Prisma/Drizzle**, **Next.js (React)**, Telegram bot (grammY yoki Telegraf), Redis keyinroq.

**Arxitektura qarorlari:**
- **Modulli monolit** (yolg'iz ishlash uchun mikroservis emas): modullar `auth`, `tenancy`, `org`, `groups`, `students`, `attendance`, `billing` (to'lov), `payroll`, `homework`, `ratings`, `reports`, `notifications`, `saas`.
- **Multi-tenant:** barcha jadvalda `center_id` (+ kerak joyda `branch_id`); **PostgreSQL Row Level Security** yoki majburiy repository filtri. Tenant izolyatsiyasi avtomatik testlanadi.
- **Auth:** parol (argon2), majburiy birinchi almashtirish, JWT qisqa muddat + refresh, rahbar/kassir uchun 2FA (Telegram/TOTP).
- **Audit jurnali:** kim, nima, qachon, oldingi/keyingi qiymat (to'lov va maosh uchun majburiy).
- **Pul:** summalar butun son (tiyin emas, so'm), `numeric`/integer; to'lov va maosh ledger shaklida (o'zgartirilmaydi, tuzatish yozuvi).
- **Zaxira:** kunlik avtomatik dump (bepul storage), tiklash testi.
- **Cheklov:** bepul tariflarda uxlash/hajm chegaralari bor; kod host-agnostik (Docker), keyin ko'chirish oson.
- Chuqurlashtirish uchun keyingi qadam: `system-design-skills` bilan ma'lumotlar modeli va API dizayni.

## 8. Yo'l xaritasi

**30 kun:**
- 5–10 rahbar bilan suhbat; to'lov sikllari va maosh qoidalari ro'yxati.
- Ma'lumotlar modeli (ERD), ruxsatlar matritsasi, API shartnomasi.
- Loyiha skeleti: NestJS + Postgres + Next.js, tenant/auth/rollar, audit.
- **Natija:** super admin markaz ochadi, rahbar kiradi, filial va xodim yaratadi.

**90 kun:**
- Guruh, o'quvchi, davomat, to'lov (2 sikl), qarzdorlik, chegirma, kassa, ustoz maoshi, hisobotlar, Excel import, SaaS holat/bloklash.
- 2–3 pilot markazda ishlatish.
- **Natija:** pilotda kamida 1 markaz real to'lovni tizimda yuritadi.

**180 kun:**
- Uyga vazifa + baho, reyting, o'quvchi/ustoz panellari, Telegram bot.
- Birinchi pullik markazlar; Payme/Click integratsiyasi boshlanishi.
- **Natija:** 3–5 pullik markaz (maqsad), oylik takroriy daromad.

## 9. Xavflar va kamaytirish

| Xavf | Kamaytirish |
|---|---|
| Yolg'iz uddalash (katta hajm) | Bosqichma-bosqich yoqish; arxitektura boshidan to'g'ri; Claude bilan birga; MVP chegarasini qat'iy saqlash |
| Ma'lumot xavfsizligi | RLS, audit, 2FA, zaxira, minimal shaxsiy ma'lumot, testlar; yurist tekshiruvi |
| Raqobat kuchli | Farq: ikki sikl, maosh, filial hisobotlari, Excel import; narx raqobatchilarga yaqin |
| Bepul infratuzilma cheklovlari | Host-agnostik kod; birinchi pullik mijozdan keyin $5–20 server |
| Mijoz ko'chishni xohlamaydi | Excel import, bepul pilot, o'rgatish videosi |
| Murakkab domen qoidalari xatosi | Pilotda real ma'lumot bilan parallel yuritish, hisob-kitob testlari |
| Qonuniy talablar o'zgarishi | Lex.uz tekshiruvi, ma'lumot joylashuvini sozlanadigan qilish |

## 10. Birinchi 7 kunda 5 amaliy qadam

1. 5 ta o'quv markazi rahbari bilan qo'ng'iroq (to'lov sikli, maosh, filial, hozirgi vosita va narxi).
2. Najot/Everest/Qorako'l tipidagi 3 ta real ssenariyni yozib chiqish (to'lov va maosh misollari).
3. Ma'lumotlar modeli (ERD) va ruxsatlar matritsasi chizmasi (birgalikda).
4. Neon yoki Supabase'da bepul baza, GitHub repo, NestJS + Next.js skeleti.
5. Super admin → markaz → rahbar yaratish oqimi (birinchi ishlaydigan vertikal bo'lak).

## 11. Ochiq savollar

- Til: faqat o'zbek yoki o'zbek + rus interfeysi?
- Valyuta: faqat so'mmi?
- Ustoz bir nechta filialda ishlashi mumkinmi? O'quvchi bir nechta guruhdami?
- Bir markazda bir nechta to'lov rejimi aralash bo'lishi mumkinmi (guruh bo'yicha)?
- Mahsulot nomi va domen.
- Narx/tarif tuzilmasi (o'quvchi soni yoki filial soni bo'yicha?).
- Qarz uchun imtiyoz kunlari (grace period) bormi?
- Hujjat/shartnoma, ofertalar va maxfiylik siyosati (yurist).
- Click takroriy to'lov va Uzum hujjatlarini tekshirish.
