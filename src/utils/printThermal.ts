/**
 * Opens a new window and prints a single thermal ticket.
 * Designed for 80mm thermal receipt printers.
 */
export async function printThermal(ticketHtml: string): Promise<void> {
  return new Promise((resolve) => {
    const win = window.open('', '_blank', 'width=400,height=600');
    if (!win) { alert('Please allow popups for printing.'); resolve(); return; }

    win.document.write(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Kartal Ticket</title>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    @page {
      size: 80mm auto;
      margin: 0mm;
    }

    html, body {
      width: 80mm;
      background: #fff;
      color: #000;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    body {
      display: flex;
      justify-content: center;
      padding: 2mm;
    }

    .thermal-ticket {
      width: 72mm;
    }

    /* Screen preview styles */
    @media screen {
      body { background: #f0f0f0; padding: 10px; }
      .thermal-ticket { box-shadow: 0 2px 8px rgba(0,0,0,0.15); }
    }
  </style>
</head>
<body>
  ${ticketHtml}
  <script>
    // Wait for fonts/images to load, then print
    window.onload = function() {
      setTimeout(function() {
        window.focus();
        window.print();
        setTimeout(function() { window.close(); }, 1000);
      }, 300);
    };
  </script>
</body>
</html>`);
    win.document.close();
    resolve();
  });
}

/**
 * Renders a ticket as HTML string for thermal printing
 */
export function buildThermalHTML(ticket: any, showFullMobile = false, logoDataUrl?: string): string {
  const mobile = showFullMobile
    ? ticket.mobile || ''
    : (ticket.mobile || '').slice(0, -3) + '***';

  const date = new Date(ticket.date).toLocaleDateString('en-PK', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });
  const time = new Date(ticket.date).toLocaleTimeString('en-PK', {
    hour: '2-digit', minute: '2-digit', hour12: true
  });

  const logoTag = logoDataUrl
    ? `<img src="${logoDataUrl}" alt="Kartal" style="width:16mm;height:12mm;object-fit:contain;">`
    : '';

  return `
<div style="width:72mm;font-family:'Courier New',Courier,monospace;font-size:11px;color:#000;background:#fff;padding:3mm;">

  <!-- HEADER: Logo left, Company name right -->
  <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:2px solid #000;padding-bottom:2mm;margin-bottom:2mm;">
    ${logoTag}
    <div style="text-align:right;">
      <div style="font-size:14px;font-weight:900;letter-spacing:2px;font-family:Georgia,serif;line-height:1.1;">KARTAL</div>
      <div style="font-size:7px;letter-spacing:1.5px;margin-top:1px;">GROUP OF COMPANIES</div>
    </div>
  </div>

  <!-- TICKET ID -->
  <div style="text-align:center;margin:1.5mm 0;background:#000;color:#fff;padding:1.5mm;">
    <div style="font-size:7px;letter-spacing:2px;">TICKET NUMBER</div>
    <div style="font-size:20px;font-weight:900;letter-spacing:3px;line-height:1.1;">${ticket.ticket_id}</div>
  </div>

  <!-- CUSTOMER INFO -->
  <div style="border-top:1px dashed #000;border-bottom:1px dashed #000;padding:1.5mm 0;margin:1.5mm 0;">
    ${row('Name', ticket.name, true)}
    ${row('Mobile', mobile)}
    ${row('Address', ticket.address || 'N/A', false, false, true)}
  </div>

  <!-- TRANSACTION -->
  <div style="padding:1mm 0;margin-bottom:1.5mm;">
    ${row('TX ID', ticket.tx_id, false, true)}
    ${row('Date', `${date}  ${time}`)}
    ${row('Ticket', `${ticket.person_ticket_index} of ${ticket.total_tickets_in_tx}`)}
    ${row('Agent', ticket.generated_by_nick || ticket.generated_by, false, false, true)}
  </div>

  <!-- Urdu -->
  <div style="text-align:center;font-family:'Noto Nastaliq Urdu',serif;font-size:9px;direction:rtl;margin:1.5mm 0;">
    تصدیق کے لیے اسکین کریں
  </div>
</div>`;
}

function row(label: string, value: string, bold = false, mono = false, small = false): string {
  return `
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:0.5mm;gap:2mm;">
    <span style="min-width:14mm;font-size:${small ? '8' : '9'}px;color:#555;flex-shrink:0;">${label}:</span>
    <span style="font-size:${small ? '8' : '10'}px;font-weight:${bold ? '900' : '600'};font-family:${mono ? "'Courier New',monospace" : 'inherit'};text-align:right;word-break:break-all;">${value}</span>
  </div>`;
}
