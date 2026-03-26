const PKT_TIMEZONE = 'Asia/Karachi';
const PKT_LOCALE = 'en-PK';

export function formatPKT(date: string | Date, opts?: Intl.DateTimeFormatOptions): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  return d.toLocaleString(PKT_LOCALE, { timeZone: PKT_TIMEZONE, ...opts });
}

export function formatPKTDate(date: string | Date): string {
  return formatPKT(date, { day: '2-digit', month: '2-digit', year: '2-digit' });
}

export function formatPKTTime(date: string | Date): string {
  return formatPKT(date, { hour: '2-digit', minute: '2-digit', hour12: true });
}

export function formatPKTDateTime(date: string | Date): string {
  return formatPKT(date, {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  });
}

export function formatPKTWatermark(date: string | Date): string {
  return formatPKT(date, {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
}
