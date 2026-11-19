// Holat yorliqlari: bir nechta sahifada ishlatiladi.
export type AttStatus = 'PRESENT' | 'LATE' | 'ABSENT' | 'EXCUSED';
export const ATT_LABEL: Record<AttStatus, { label: string; kind: 'ok' | 'warn' | 'bad' | 'mute' }> = {
  PRESENT: { label: 'Keldi', kind: 'ok' },
  LATE: { label: 'Kechikdi', kind: 'warn' },
  ABSENT: { label: 'Kelmadi', kind: 'bad' },
  EXCUSED: { label: 'Sababli', kind: 'mute' },
};
