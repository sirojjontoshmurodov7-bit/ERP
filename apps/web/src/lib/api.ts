// Brauzer tomoni: hamma so'rov o'z hostimizdagi /api/* (BFF) orqali. Token yo'q, cookie avtomatik ketadi.
'use client';

export interface ApiErrorBody {
  code?: string;
  message?: string;
  issues?: { path: string; message: string }[];
  [key: string]: unknown;
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly body: ApiErrorBody,
  ) {
    super(body.message ?? `Xato (${status})`);
  }
  get code() {
    return this.body.code;
  }
  /** Maydon bo'yicha tekshiruv xatolari: { "fullName": "...", ... } */
  get fieldErrors(): Record<string, string> {
    const out: Record<string, string> = {};
    for (const i of this.body.issues ?? []) if (i.path && !out[i.path]) out[i.path] = i.message;
    return out;
  }
}

type Query = Record<string, string | number | boolean | null | undefined>;

export function qs(q?: Query): string {
  if (!q) return '';
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(q)) if (v !== undefined && v !== null && v !== '') p.set(k, String(v));
  const s = p.toString();
  return s ? `?${s}` : '';
}

let onUnauthorized: (() => void) | null = null;
/** Sessiya tugaganda (401) chaqiriladi: panel /login ga yo'naltiradi. */
export const setUnauthorizedHandler = (fn: (() => void) | null) => {
  onUnauthorized = fn;
};

async function request<T>(method: string, path: string, body?: unknown, init?: { signal?: AbortSignal; raw?: boolean }): Promise<T> {
  const isForm = typeof FormData !== 'undefined' && body instanceof FormData;
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      method,
      headers: { 'x-erp-request': '1', accept: 'application/json', ...(body !== undefined && !isForm ? { 'content-type': 'application/json' } : {}) },
      body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
      credentials: 'same-origin',
      cache: 'no-store',
      signal: init?.signal,
    });
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw e;
    throw new ApiError(0, { code: 'NETWORK', message: "Internet aloqasi yo'q yoki server javob bermadi" });
  }
  if (res.status === 401 && !path.startsWith('/auth/')) onUnauthorized?.();
  if (!res.ok) {
    const b = (await res.json().catch(() => ({}))) as ApiErrorBody;
    throw new ApiError(res.status, b);
  }
  if (init?.raw) return res as unknown as T;
  if (res.status === 204) return undefined as T;
  const type = res.headers.get('content-type') ?? '';
  return (type.includes('json') ? res.json() : res.text()) as Promise<T>;
}

export const api = {
  get: <T>(path: string, q?: Query, signal?: AbortSignal) => request<T>('GET', path + qs(q), undefined, { signal }),
  post: <T>(path: string, body: unknown = {}) => request<T>('POST', path, body),
  put: <T>(path: string, body: unknown) => request<T>('PUT', path, body),
  patch: <T>(path: string, body: unknown) => request<T>('PATCH', path, body),
  del: <T>(path: string) => request<T>('DELETE', path),
  upload: <T>(path: string, form: FormData) => request<T>('POST', path, form),
  /** Fayl yuklab olish (CSV shablon va h.k.). */
  async download(path: string, fallbackName: string) {
    const res = await request<Response>('GET', path, undefined, { raw: true });
    const blob = await res.blob();
    const cd = res.headers.get('content-disposition') ?? '';
    const name = /filename="?([^";]+)"?/.exec(cd)?.[1] ?? fallbackName;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  },
};

/** Login va chiqish BFF'ning o'z yo'llari. */
export const auth = {
  login: (login: string, password: string) => request<{ mustChangePassword: boolean }>('POST', '/auth/login', { login, password }),
  logout: () => request<void>('POST', '/auth/logout'),
};

/** Xatoni foydalanuvchiga ko'rsatiladigan matnga aylantirish. */
export function errorText(e: unknown): string {
  if (e instanceof ApiError) {
    if (e.status === 0) return e.message;
    if (e.status === 403 && e.code === 'FORBIDDEN') return e.body.message ?? "Bu amal uchun ruxsatingiz yo'q";
    if (e.status >= 500) return "Serverda xatolik yuz berdi. Birozdan keyin qayta urinib ko'ring";
    return e.message;
  }
  return "Kutilmagan xatolik";
}
