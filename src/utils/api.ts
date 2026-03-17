export function maskMobile(mobile: string, full = false): string {
  if (!mobile) return '';
  if (full) return mobile;
  return mobile.slice(0, -3) + '***';
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatPKR(n: number): string {
  return `PKR ${Number(n || 0).toLocaleString('en-PK')}`;
}

export async function handleResponse(res: Response) {
  if (!res.ok) {
    let errorMessage = `Request failed with status ${res.status}`;
    try {
      const data = await res.json();
      errorMessage = data.error || errorMessage;
    } catch (e) {
      // Ignore JSON parsing errors
    }
    throw new Error(errorMessage);
  }
  return res.json();
}
