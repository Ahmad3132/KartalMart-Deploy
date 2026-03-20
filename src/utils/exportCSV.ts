// Export data as CSV file that opens in Excel
export function exportCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const BOM = '\uFEFF'; // UTF-8 BOM for Excel to handle special characters
  const csvContent = BOM + [
    headers.join(','),
    ...rows.map(row => row.map(cell => {
      const str = String(cell ?? '');
      // Escape quotes and wrap in quotes if contains comma, quote, or newline
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    }).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
