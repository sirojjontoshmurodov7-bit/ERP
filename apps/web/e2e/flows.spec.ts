// Asosiy foydalanuvchi oqimlari brauzerda (BFF, cookie, sahifalar). Ma'lumot: global-setup (e2e/.data.json).
import { readFileSync } from 'node:fs';
import { expect, type Page, test } from '@playwright/test';
import { DATA_FILE, type E2EData } from './global-setup';

const data = (): E2EData => JSON.parse(readFileSync(DATA_FILE, 'utf8')) as E2EData;

async function signIn(page: Page, login: string, password: string) {
  await page.goto('/login');
  await page.getByLabel('Login').fill(login);
  await page.getByLabel('Parol', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Kirish' }).click();
}

/** Kirib, panel ochilishini kutadi (keyingi goto sessiya cookie'si yozilgandan keyin bo'lsin). */
async function signedIn(page: Page, login: string, password: string) {
  await signIn(page, login, password);
  await expect(page).toHaveURL(/\/dashboard/);
}

/** Birinchi kirish: vaqtinchalik parol bilan kirib, yangisini o'rnatadi. */
async function firstSignIn(page: Page, login: string, temp: string): Promise<string> {
  await signIn(page, login, temp);
  await expect(page).toHaveURL(/\/change-password/);
  const next = `New-${Date.now().toString(36)}-pw`;
  await page.getByLabel('Joriy parol').fill(temp);
  await page.getByLabel('Yangi parol', { exact: true }).fill(next);
  await page.getByLabel('Yangi parolni takrorlang').fill(next);
  await page.getByRole('button', { name: 'Parolni saqlash' }).click();
  await expect(page).toHaveURL(/\/dashboard/);
  return next;
}

test('landing: kirish tugmasi va noto\'g\'ri parol xabari', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'TST_ERP' }).first()).toBeVisible();
  await page.getByRole('link', { name: 'Kirish' }).first().click();
  await expect(page).toHaveURL(/\/login/);
  await signIn(page, data().owner.login, 'notogri-parol-1');
  await expect(page.getByText("Login yoki parol noto'g'ri")).toBeVisible();
});

test('sessiyasiz panel sahifasi login\'ga yo\'naltiradi va keyin qaytaradi', async ({ page }) => {
  const d = data();
  await page.goto('/students');
  await expect(page).toHaveURL(/\/login\?next=%2Fstudents/);
  await page.getByLabel('Login').fill(d.owner.login);
  await page.getByLabel('Parol', { exact: true }).fill(d.owner.password);
  await page.getByRole('button', { name: 'Kirish' }).click();
  await expect(page).toHaveURL(/\/students$/);
  await expect(page.getByRole('heading', { name: "O'quvchilar" })).toBeVisible();
});

test('rahbar: bosh sahifa, yon panel, yorug\' mavzu saqlanadi', async ({ page }) => {
  const d = data();
  await signedIn(page, d.owner.login, d.owner.password);
  await expect(page.getByRole('heading', { name: 'Markaz boshqaruv paneli' })).toBeVisible();
  await expect(page.locator('.kpi')).toHaveCount(4);
  await expect(page.getByRole('heading', { name: 'Filiallar samaradorligi' })).toBeVisible();
  await expect(page.locator('.ctx-chip').first()).toContainText(d.center.name);

  await page.getByRole('button', { name: "Yorug' rejimga o'tish" }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.getByRole('button', { name: "Qorong'i rejimga o'tish" }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

  await page.getByRole('button', { name: "Yon panelni yig'ish" }).click();
  await expect(page.locator('.shell')).toHaveAttribute('data-collapsed', 'true');
  await page.getByRole('button', { name: 'Yon panelni ochish' }).click();
  await expect(page.locator('.shell')).toHaveAttribute('data-collapsed', 'false');
});

test("rahbar: o'quvchi qo'shadi va to'lov qabul qiladi", async ({ page }) => {
  const d = data();
  const name = `Yangi Talaba ${d.stamp}`;
  await signedIn(page, d.owner.login, d.owner.password);
  await page.goto('/students?new=1');
  const dlg = page.getByRole('dialog', { name: "Yangi o'quvchi" });
  await dlg.getByLabel('Ism familiya').fill(name);
  const branch = dlg.getByLabel('Filial');
  if ((await branch.inputValue()) === '') await branch.selectOption({ index: 1 });
  await dlg.getByLabel('Guruhga yozish').selectOption({ label: d.group.name });
  await dlg.getByRole('button', { name: "Qo'shish" }).click();

  const creds = page.getByRole('dialog', { name: "Kirish ma'lumotlari" });
  await expect(creds).toBeVisible();
  await creds.getByRole('button', { name: 'Tayyor' }).click();

  await page.getByRole('searchbox', { name: 'Qidirish', exact: true }).fill(name);
  await page.getByRole('row', { name: new RegExp(name) }).click();
  await expect(page.getByRole('heading', { name })).toBeVisible();

  await page.getByRole('button', { name: "To'lov qabul qilish" }).click();
  const pay = page.getByRole('dialog', { name: "To'lov qabul qilish" });
  await pay.getByLabel('Summa').fill('150000');
  await pay.getByRole('button', { name: 'Qabul qilish' }).click();
  await expect(page.getByLabel("To'langan")).toBeVisible();
  await expect(page.getByText('150 000').first()).toBeVisible();
});

test('ustoz: birinchi kirish, bugungi dars va davomat', async ({ page }) => {
  const d = data();
  await firstSignIn(page, d.teacher.login, d.teacher.temp);
  await expect(page.getByRole('heading', { name: /Salom, E2E/ })).toBeVisible();
  const lesson = page.locator('.item', { hasText: d.group.name });
  await expect(lesson).toBeVisible();
  await lesson.getByRole('link', { name: 'Davomat' }).click();
  await expect(page).toHaveURL(new RegExp(`/groups/${d.group.id}`));

  // bugungi darsni ochish (bo'lsa tanlanadi), o'quvchini "Keldi" deb belgilash
  const open = page.getByRole('button', { name: 'Ochish' });
  if (await open.isVisible()) await open.click();
  const row = page.getByRole('radiogroup', { name: `${d.student.fullName}: davomat` });
  await row.getByRole('radio', { name: 'Keldi' }).click();
  await page.getByRole('button', { name: /^Saqlash/ }).click();
  await expect(page.getByText(/1 keldi, 0 kelmadi/)).toBeVisible();
});

test("o'quvchi: birinchi kirish va portal", async ({ page }) => {
  const d = data();
  await firstSignIn(page, d.student.login, d.student.temp);
  await expect(page.getByText(/Xush kelibsiz, E2E/)).toBeVisible();
  await expect(page.locator('.item', { hasText: d.group.name }).first()).toBeVisible();
  await expect(page.getByText('Balansim')).toBeVisible();
});

test('super admin: platforma paneli va yangi sinov markazi ro\'yxatda', async ({ page }) => {
  const d = data();
  await signedIn(page, d.root.login, d.root.password);
  await expect(page.getByRole('heading', { name: 'Platforma boshqaruv markazi' })).toBeVisible();
  await expect(page.locator('.kpi')).toHaveCount(4);
  await page.getByRole('link', { name: 'Markazlar', exact: true }).click();
  await expect(page.getByRole('cell', { name: new RegExp(d.center.name) })).toBeVisible();
});

test('mobil: menyu ochiladi va bo\'limga o\'tadi @mobile', async ({ page }) => {
  const d = data();
  await signedIn(page, d.owner.login, d.owner.password);
  await expect(page.getByRole('heading', { name: 'Markaz boshqaruv paneli' })).toBeVisible();
  const width = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(width).toBeLessThanOrEqual(0);
  await page.getByRole('button', { name: 'Menyuni ochish' }).click();
  await page.getByRole('link', { name: 'Guruhlar' }).click();
  await expect(page).toHaveURL(/\/groups/);
});
