import { hash, verify } from '@node-rs/argon2';

// Argon2id (kutubxona sukuti), OWASP tavsiyasi: 19 MiB, 2 iteratsiya, 1 parallel.
const PARAMS = { memoryCost: 19456, timeCost: 2, parallelism: 1 } as const;

export function hashPassword(password: string): Promise<string> {
  return hash(password, PARAMS);
}

export async function verifyPassword(passwordHash: string, password: string): Promise<boolean> {
  try {
    return await verify(passwordHash, password);
  } catch {
    return false;
  }
}

let dummyHash: Promise<string> | undefined;

/** Mavjud bo'lmagan login uchun ham bir xil vaqt sarflash (login enumeratsiyasiga qarshi). */
export async function verifyAgainstDummy(password: string): Promise<void> {
  dummyHash ??= hashPassword('dummy-password-for-timing');
  await verifyPassword(await dummyHash, password);
}
