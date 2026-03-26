/**
 * Shared ticket printing utility.
 * Single source of truth for ALL ticket print HTML — ensures every print path
 * produces identical output with the logo, QR, watermark, contact info, etc.
 */
import kartalLogo from '../assets/kartal-logo.png';

// ── Logo preloading ────────────────────────────────────────────────────────
// Convert the bundled logo to a base64 data URL once at module load time.
// This avoids fragile DOM queries (`document.querySelector('img[alt=...]')`)
// that fail on mobile or when the element isn't rendered yet.
let _logoBase64 = '';
const _logoReady: Promise<void> = new Promise((resolve) => {
  if (typeof window === 'undefined') { resolve(); return; }
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.getContext('2d')?.drawImage(img, 0, 0);
      _logoBase64 = canvas.toDataURL('image/png');
    } catch { /* CORS or security error — fallback to empty */ }
    resolve();
  };
  img.onerror = () => resolve();
  img.src = kartalLogo;
});

/** Get the preloaded logo base64 string. Await this before using. */
export async function getLogoBase64(): Promise<string> {
  await _logoReady;
  return _logoBase64;
}

// ── Ticket HTML builder ────────────────────────────────────────────────────
interface TicketData {
  ticket_id: string;
  name: string;
  mobile: string;
  address?: string;
  tx_id: string;
  date: string;
  person_ticket_index: number;
  total_tickets_in_tx: number;
  generated_by_nick?: string;
  generated_by?: string;
  last_printed_by_nick?: string;
  generation_id?: string;
  // Template snapshot fields (saved at generation time)
  template_qr_enabled?: string | null;
  template_watermark_enabled?: string | null;
  template_color_mode?: string | null;
  template_company_phone?: string | null;
  template_company_email?: string | null;
  template_company_website?: string | null;
}

interface PrintDefaults {
  qrEnabled?: boolean;
  watermarkEnabled?: boolean;
  colorMode?: 'color' | 'bw';
  companyPhone?: string;
  companyEmail?: string;
  companyWebsite?: string;
}

function row(label: string, value: string, small = false): string {
  return `<div style="display:flex;justify-content:space-between;margin-bottom:0.5mm;gap:2mm;"><span style="color:#555;font-size:${small ? '8' : '8'}px;min-width:14mm;flex-shrink:0;">${label}:</span><span style="font-weight:600;font-size:${small ? '8' : '10'}px;text-align:right;word-break:break-all;">${value}</span></div>`;
}

/**
 * Build the HTML for a single thermal ticket.
 * Uses the ticket's saved template_* fields, falling back to `defaults`.
 */
export function buildTicketHTML(ticket: TicketData, logoB64: string, defaults: PrintDefaults = {}): string {
  // Resolve template settings: ticket snapshot > defaults > sensible fallback
  const tQR = ticket.template_qr_enabled != null ? ticket.template_qr_enabled !== 'false' : (defaults.qrEnabled ?? true);
  const tWatermark = ticket.template_watermark_enabled != null ? ticket.template_watermark_enabled === 'true' : (defaults.watermarkEnabled ?? false);
  const tColorMode = ticket.template_color_mode || defaults.colorMode || 'color';
  const tPhone = ticket.template_company_phone ?? defaults.companyPhone ?? '';
  const tEmail = ticket.template_company_email ?? defaults.companyEmail ?? '';
  const tWebsite = ticket.template_company_website ?? defaults.companyWebsite ?? '';
  const isBW = tColorMode === 'bw';
  const hasContact = tPhone || tEmail || tWebsite;

  const mobile = (ticket.mobile || '').slice(0, -3) + '***';
  const date = new Date(ticket.date).toLocaleDateString('en-PK', { day: '2-digit', month: '2-digit', year: '2-digit' });
  const time = new Date(ticket.date).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', hour12: true });

  const logoTag = logoB64
    ? `<img src="${logoB64}" style="height:14mm;object-fit:contain;${isBW ? 'filter:grayscale(100%);' : ''}">`
    : '';

  const qrData = JSON.stringify({ id: ticket.ticket_id, name: ticket.name, tx: ticket.tx_id, gen: ticket.generation_id });

  const watermarkSection = tWatermark
    ? `<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-45deg);font-size:10px;color:rgba(200,200,200,0.5);white-space:nowrap;pointer-events:none;z-index:10;">${new Date(ticket.date).toLocaleString('en-PK', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>`
    : '';

  const contactSection = hasContact
    ? `<div style="border-top:1px dashed #999;margin-top:1.5mm;padding-top:1.5mm;text-align:center;font-size:7px;color:#666;line-height:1.6;">${tPhone ? `<div>📞 ${tPhone}</div>` : ''}${tEmail ? `<div>✉ ${tEmail}</div>` : ''}${tWebsite ? `<div>🌐 ${tWebsite}</div>` : ''}</div>`
    : '';

  const qrSection = tQR
    ? `<div class="qr-container" style="text-align:center;margin:1.5mm 0;"><div style="display:inline-block;border:1px solid #000;padding:1.5mm;"><canvas class="qr-canvas" data-qr='${qrData.replace(/'/g, '&#39;')}' width="90" height="90"></canvas></div><div style="font-size:9px;margin-top:1.5mm;font-family:'Noto Nastaliq Urdu',serif;direction:rtl;line-height:1.6;">تصدیق کے لیے اسکین کریں</div></div>`
    : '';

  return `
<div style="position:relative;width:72mm;page-break-inside:avoid;font-family:'Courier New',Courier,monospace;font-size:11px;color:#000;background:#fff;padding:3mm;margin-bottom:3mm;overflow:hidden;">
  ${watermarkSection}
  <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:2px solid #000;padding-bottom:2mm;margin-bottom:2mm;">
    ${logoTag}
    <div style="text-align:right;">
      <div style="font-size:7px;letter-spacing:1.5px;">GROUP OF COMPANIES</div>
    </div>
  </div>
  <div style="text-align:center;background:#000;color:#fff;padding:1.5mm;margin-bottom:1.5mm;">
    <div style="font-size:7px;letter-spacing:2px;">TICKET NUMBER</div>
    <div style="font-size:20px;font-weight:900;letter-spacing:3px;line-height:1.1;">${ticket.ticket_id}</div>
  </div>
  <div style="border-top:1px dashed #000;border-bottom:1px dashed #000;padding:1.5mm 0;margin-bottom:1.5mm;">
    ${row('Name', ticket.name)}
    ${row('Mobile', mobile)}
    ${row('Address', ticket.address || 'N/A', true)}
  </div>
  <div style="padding:1mm 0;margin-bottom:1.5mm;">
    ${row('TX ID', ticket.tx_id, true)}
    ${row('Date', `${date} ${time}`, true)}
    ${row('Ticket', `${ticket.person_ticket_index} of ${ticket.total_tickets_in_tx}`, true)}
    ${row('Gen. by', ticket.generated_by_nick || ticket.generated_by || '', true)}
    ${row('Print by', ticket.last_printed_by_nick || ticket.generated_by_nick || '', true)}
  </div>
  ${qrSection}
  ${contactSection}
</div>`;
}

// ── Print window ───────────────────────────────────────────────────────────

/**
 * Open a print window with one or more tickets.
 * Handles logo preloading, QR code rendering, and auto-print.
 */
export async function openTicketPrintWindow(tickets: TicketData[], defaults: PrintDefaults = {}): Promise<void> {
  const logoB64 = await getLogoBase64();

  const ticketBlocks = tickets.map(t => buildTicketHTML(t, logoB64, defaults)).join('<div style="height:1mm;"></div>');

  const win = window.open('', '_blank', 'width=420,height=700,menubar=no,toolbar=no');
  if (!win) { alert('Please allow popups to enable printing.'); return; }

  win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>KARTAL MART Ticket</title>
<link href="https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;700&display=swap" rel="stylesheet">
<script src="https://cdn.jsdelivr.net/npm/qrcode/build/qrcode.min.js"><\/script>
<style>
  * { margin:0;padding:0;box-sizing:border-box; }
  @page { size:80mm auto;margin:2mm; }
  html,body { width:80mm;background:#fff; }
  body { display:flex;flex-direction:column;align-items:center;padding:2mm; }
  @media screen { body { background:#e0e0e0;padding:10px; } }
</style>
</head><body>
${ticketBlocks}
<script>
function renderAndPrint() {
  var canvases = document.querySelectorAll('.qr-canvas');
  var rendered = 0, total = canvases.length;
  function doPrint() {
    setTimeout(function() { window.focus(); window.print(); setTimeout(function() { window.close(); }, 1500); }, 600);
  }
  if (total === 0) { doPrint(); return; }
  canvases.forEach(function(canvas) {
    var data = canvas.getAttribute('data-qr');
    if (data && typeof QRCode !== 'undefined') {
      QRCode.toCanvas(canvas, data, { width: 90, margin: 0, errorCorrectionLevel: 'H' }, function() {
        rendered++;
        if (rendered >= total) doPrint();
      });
    } else {
      rendered++;
      if (rendered >= total) doPrint();
    }
  });
}
function waitForQR(a) {
  if (typeof QRCode !== 'undefined') { renderAndPrint(); return; }
  if (a > 50) { renderAndPrint(); return; }
  setTimeout(function() { waitForQR(a + 1); }, 100);
}
window.onload = function() { waitForQR(0); };
<\/script>
</body></html>`);
  win.document.close();
}
