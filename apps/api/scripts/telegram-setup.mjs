// Telegram botini sozlash (tokenni ekranga chiqarmaydi).
//   node scripts/telegram-setup.mjs info               bot nomi va webhook holati
//   node scripts/telegram-setup.mjs webhook <API_URL>  webhook'ni <API_URL>/telegram/webhook ga o'rnatadi (TELEGRAM_WEBHOOK_SECRET bilan) + buyruqlar menyusi
//   node scripts/telegram-setup.mjs polling            webhook'ni o'chiradi (TELEGRAM_POLLING=true rejimi uchun) + buyruqlar menyusi
// O'zgaruvchilar muhitdan yoki ildizdagi .env dan: TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET.
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const envFile = fileURLToPath(new URL('../../../.env', import.meta.url));
if (existsSync(envFile)) process.loadEnvFile(envFile);

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error('TELEGRAM_BOT_TOKEN berilmagan (.env yoki muhit)');
  process.exit(1);
}
const COMMANDS = [
  { command: 'start', description: 'Akkauntni ulash: /start KOD' },
  { command: 'stop', description: "Bildirishnomalarni o'chirish" },
  { command: 'help', description: 'Yordam' },
];

async function call(method, body = {}) {
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15_000),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.ok) throw new Error(`${method}: HTTP ${res.status} ${json.description ?? ''}`.trim());
  return json.result;
}

const [cmd = 'info', arg] = process.argv.slice(2);
try {
  const me = await call('getMe');
  console.log(`Bot: @${me.username} (${me.first_name})`);
  if (cmd === 'webhook') {
    const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
    if (!arg || !/^https:\/\//.test(arg)) throw new Error('API manzili kerak: https://api.example.uz');
    if (!secret) throw new Error('TELEGRAM_WEBHOOK_SECRET berilmagan');
    await call('setWebhook', { url: `${arg.replace(/\/+$/, '')}/telegram/webhook`, secret_token: secret, allowed_updates: ['message'], drop_pending_updates: false });
    await call('setMyCommands', { commands: COMMANDS });
    console.log('Webhook va buyruqlar o\'rnatildi');
  } else if (cmd === 'polling') {
    await call('deleteWebhook', { drop_pending_updates: false });
    await call('setMyCommands', { commands: COMMANDS });
    console.log("Webhook o'chirildi: API'da TELEGRAM_POLLING=true qiling");
  } else if (cmd !== 'info') {
    throw new Error(`Noma'lum buyruq: ${cmd} (info | webhook <API_URL> | polling)`);
  }
  const info = await call('getWebhookInfo');
  console.log(`Webhook: ${info.url || "yo'q (polling)"}; kutayotgan yangilanishlar: ${info.pending_update_count}${info.last_error_message ? `; oxirgi xato: ${info.last_error_message}` : ''}`);
  if (process.env.TELEGRAM_BOT_USERNAME && process.env.TELEGRAM_BOT_USERNAME.replace(/^@/, '') !== me.username) {
    console.warn(`Diqqat: TELEGRAM_BOT_USERNAME (${process.env.TELEGRAM_BOT_USERNAME}) botning haqiqiy nomiga (@${me.username}) mos emas`);
  }
} catch (e) {
  console.error(e instanceof Error ? e.message : String(e));
  process.exit(1);
}
