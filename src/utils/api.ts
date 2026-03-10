// Mask mobile number - show all digits except last 3
export function maskMobile(mobile: string, isAdmin: boolean): string {
  if (isAdmin) return mobile;
  if (!mobile || mobile.length <= 3) return mobile;
  const visible = mobile.slice(0, -3);
  return `${visible}***`;
}

export function formatPKR(amount: number): string {
  return `PKR ${Number(amount).toLocaleString('en-PK')}`;
}

export function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleString('en-PK', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  } catch { return dateStr; }
}

export function getToken(): string {
  return localStorage.getItem('kartal_token') || '';
}
