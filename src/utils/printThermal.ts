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
    ? `<img src="${logoDataUrl}" alt="Kartal" style="width:14mm;height:14mm;object-fit:contain;display:block;margin:0 auto 1.5mm;">`
    : '';

  return `
<div style="width:72mm;font-family:'Courier New',Courier,monospace;font-size:11px;color:#000;background:#fff;">

  <!-- HEADER -->
  <div style="text-align:center;border-bottom:2px solid #000;padding-bottom:3mm;margin-bottom:3mm;">
    ${logoTag}
    <div style="font-size:16px;font-weight:900;letter-spacing:3px;font-family:serif;">KARTAL</div>
    <div style="font-size:8px;letter-spacing:2px;margin-top:1px;">GROUP OF COMPANIES</div>
    <div style="font-size:8px;margin-top:2mm;letter-spacing:1px;border-top:1px dashed #000;padding-top:2mm;">
      *** KARTAL MART ***
    </div>
  </div>

  <!-- TICKET ID -->
  <div style="text-align:center;margin:2mm 0;background:#000;color:#fff;padding:2mm;">
    <div style="font-size:8px;letter-spacing:2px;">TICKET NUMBER</div>
    <div style="font-size:22px;font-weight:900;letter-spacing:4px;line-height:1.1;">${ticket.ticket_id}</div>
  </div>

  <!-- CUSTOMER INFO -->
  <div style="border-top:1px dashed #000;border-bottom:1px dashed #000;padding:2.5mm 0;margin:2mm 0;">
    ${row('Name', ticket.name, true)}
    ${row('Mobile', mobile)}
    ${row('Address', ticket.address || 'N/A', false, false, true)}
  </div>

  <!-- TRANSACTION -->
  <div style="padding:1.5mm 0;margin-bottom:2mm;">
    ${row('TX ID', ticket.tx_id, false, true)}
    ${row('Date', `${date}  ${time}`)}
    ${row('Ticket', `${ticket.person_ticket_index} of ${ticket.total_tickets_in_tx}`)}
    ${row('Agent', ticket.generated_by_nick || ticket.generated_by, false, false, true)}
  </div>

  <!-- QR CODE placeholder (can't generate in HTML string easily) -->
  <div style="text-align:center;margin:2mm 0;font-size:9px;border:1px dashed #000;padding:2mm;">
    ID: ${ticket.ticket_id}<br>TX: ${ticket.tx_id}
  </div>

  <!-- Urdu -->
  <div style="text-align:center;font-family:'Noto Nastaliq Urdu',serif;font-size:10px;direction:rtl;margin:2mm 0;">
    تصدیق کے لیے کیو آر کوڈ اسکین کریں
  </div>

  <!-- FOOTER -->
  <div style="border-top:2px solid #000;padding-top:2mm;text-align:center;">
    <div style="font-size:8px;letter-spacing:1px;">*** KEEP THIS TICKET SAFE ***</div>
    <div style="font-size:8px;margin-top:1mm;">kartal.com.pk</div>
  </div>
</div>`;
}

function row(label: string, value: string, bold = false, mono = false, small = false): string {
  return `
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1mm;gap:2mm;">
    <span style="min-width:16mm;font-size:${small ? '9' : '10'}px;color:#555;flex-shrink:0;">${label}:</span>
    <span style="font-size:${small ? '9' : '11'}px;font-weight:${bold ? '900' : '600'};font-family:${mono ? "'Courier New',monospace" : 'inherit'};text-align:right;word-break:break-all;">${value}</span>
  </div>`;
}
