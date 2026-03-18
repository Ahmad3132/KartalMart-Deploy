import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Printer, Send, PlusCircle, AlertCircle, FileDown, MessageSquare, CheckCircle } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ThermalTicket } from '../../components/ThermalTicket';
import { formatWANumber } from '../../utils/api';

// Convert image URL to base64 for use in print window
async function imageToBase64(url: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.getContext('2d')?.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => resolve('');
    img.src = url;
  });
}

// Open thermal print window for one or many tickets
async function openThermalPrint(tickets: any[], isAdmin: boolean) {
  // Get logo as base64 so it works in the isolated print window
  const logoEl = document.querySelector('img[alt="Kartal"]') as HTMLImageElement | null;
  let logoB64 = '';
  if (logoEl?.src) {
    logoB64 = await imageToBase64(logoEl.src);
  }

  const win = window.open('', '_blank', 'width=420,height=700,menubar=no,toolbar=no');
  if (!win) { alert('Please allow popups to enable printing.'); return; }

  const ticketBlocks = tickets.map(ticket => {
    // Always mask mobile in printed tickets (even for admin)
    const mobile = (ticket.mobile || '').slice(0, -3) + '***';

    const date = new Date(ticket.date).toLocaleDateString('en-PK', {
      day: '2-digit', month: '2-digit', year: '2-digit'
    });
    const time = new Date(ticket.date).toLocaleTimeString('en-PK', {
      hour: '2-digit', minute: '2-digit', hour12: true
    });

    const logoTag = logoB64
      ? `<img src="${logoB64}" style="width:16mm;height:12mm;object-fit:contain;">`
      : '';

    return `
<div style="width:72mm;page-break-inside:avoid;font-family:'Courier New',Courier,monospace;font-size:11px;color:#000;background:#fff;padding:3mm;margin-bottom:3mm;">

  <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:2px solid #000;padding-bottom:2mm;margin-bottom:2mm;">
    ${logoTag}
    <div style="text-align:right;">
      <div style="font-size:14px;font-weight:900;letter-spacing:2px;font-family:Georgia,serif;line-height:1.1;">KARTAL</div>
      <div style="font-size:7px;letter-spacing:1.5px;margin-top:1px;">GROUP OF COMPANIES</div>
    </div>
  </div>

  <div style="text-align:center;background:#000;color:#fff;padding:1.5mm;margin-bottom:1.5mm;">
    <div style="font-size:7px;letter-spacing:2px;">TICKET NUMBER</div>
    <div style="font-size:20px;font-weight:900;letter-spacing:3px;line-height:1.1;">${ticket.ticket_id}</div>
  </div>

  <div style="border-top:1px dashed #000;border-bottom:1px dashed #000;padding:1.5mm 0;margin-bottom:1.5mm;">
    <div style="display:flex;justify-content:space-between;margin-bottom:0.5mm;"><span style="color:#555;font-size:8px;">Name:</span><span style="font-weight:900;font-size:10px;text-align:right;">${ticket.name}</span></div>
    <div style="display:flex;justify-content:space-between;margin-bottom:0.5mm;"><span style="color:#555;font-size:8px;">Mobile:</span><span style="font-weight:600;font-size:10px;">${mobile}</span></div>
    <div style="display:flex;justify-content:space-between;"><span style="color:#555;font-size:8px;">Address:</span><span style="font-size:8px;text-align:right;max-width:45mm;">${ticket.address || 'N/A'}</span></div>
  </div>

  <div style="padding:1mm 0;margin-bottom:1.5mm;">
    <div style="display:flex;justify-content:space-between;margin-bottom:0.5mm;"><span style="color:#555;font-size:8px;">TX ID:</span><span style="font-family:monospace;font-size:8px;">${ticket.tx_id}</span></div>
    <div style="display:flex;justify-content:space-between;margin-bottom:0.5mm;"><span style="color:#555;font-size:8px;">Date:</span><span style="font-size:8px;">${date} ${time}</span></div>
    <div style="display:flex;justify-content:space-between;margin-bottom:0.5mm;"><span style="color:#555;font-size:8px;">Ticket:</span><span style="font-size:8px;">${ticket.person_ticket_index} of ${ticket.total_tickets_in_tx}</span></div>
    <div style="display:flex;justify-content:space-between;"><span style="color:#555;font-size:8px;">Agent:</span><span style="font-size:8px;">${ticket.generated_by_nick || ticket.generated_by}</span></div>
  </div>

  <div style="text-align:center;font-family:serif;font-size:9px;direction:rtl;margin:1.5mm 0;line-height:1.6;">
    تصدیق کے لیے اسکین کریں
  </div>
</div>`;
  }).join('<div style="height:2mm;"></div>');

  win.document.write(`<!DOCTYPE html>
<html><head>
<meta charset="UTF-8">
<title>Kartal Ticket Print</title>
<link href="https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;700&display=swap" rel="stylesheet">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  @page { size: 80mm auto; margin: 2mm; }
  html, body { width: 80mm; background: #fff; }
  body { display: flex; flex-direction: column; align-items: center; padding: 2mm; }
  @media screen { body { background: #e0e0e0; padding: 10px; } }
</style>
</head><body>
${ticketBlocks}
<script>
window.onload = function() {
  setTimeout(function() {
    window.focus();
    window.print();
    setTimeout(function() { window.close(); }, 1500);
  }, 400);
};
</script>
</body></html>`);
  win.document.close();
}

// Generate thermal PDF (80mm width) with optional watermark
async function generateThermalPDF(tickets: any[], thermalRefs: { [key: string]: HTMLDivElement | null }, watermarkEnabled = false) {
  // 80mm = 226.77pt in jsPDF
  const pdf = new jsPDF({ unit: 'mm', format: [80, 297], orientation: 'portrait' });
  let currentY = 3;

  for (let i = 0; i < tickets.length; i++) {
    const el = thermalRefs[tickets[i].id];
    if (!el) continue;

    const canvas = await html2canvas(el, {
      scale: 3,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: el.scrollWidth,
    });

    const imgData = canvas.toDataURL('image/png');
    const pageW = 80;
    const imgW = pageW - 6;
    const imgH = (canvas.height * imgW) / canvas.width;

    if (i > 0) {
      pdf.addPage([80, imgH + 10]);
      currentY = 3;
    }

    // Resize page to match content height
    pdf.internal.pageSize.height = imgH + currentY + 3;

    pdf.addImage(imgData, 'PNG', 3, currentY, imgW, imgH);

    // Add watermark if enabled
    if (watermarkEnabled) {
      const now = new Date();
      const watermarkText = now.toLocaleString('en-PK', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
      pdf.setFontSize(8);
      pdf.setTextColor(200, 200, 200);
      // Save current state
      const pageHeight = pdf.internal.pageSize.height;
      // Diagonal watermark
      const centerX = pageW / 2;
      const centerY = (currentY + imgH) / 2;
      pdf.text(watermarkText, centerX, centerY, { angle: 45, align: 'center' });
      // Reset text color
      pdf.setTextColor(0, 0, 0);
    }

    currentY += imgH + 3;
  }

  return pdf;
}

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────
export default function GeneratedTicketsView() {
  const { txId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<any[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [loadingPDF, setLoadingPDF] = useState<string | null>(null);
  const thermalRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const [appSettings, setAppSettings] = useState<any>({});

  const isAdmin = user?.role === 'Admin';

  useEffect(() => {
    const headers = { 'Authorization': `Bearer ${localStorage.getItem('kartal_token')}` };
    Promise.all([
      fetch(`/api/tickets?limit=1000`, { headers }).then(r => r.json()).catch(()=>({tickets:[]})),
      fetch('/api/settings', { headers }).then(r => r.json()).catch(()=>({})),
    ]).then(([d, s]) => {
      setTickets((d.tickets || []).filter((t: any) => t.tx_id === txId));
      setAppSettings(s?.error ? {} : s);
    });
  }, [txId]);

  const showMsg = (type: 'success' | 'error' | 'info', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  // ── PRINT ──────────────────────────────────
  const handlePrint = async (ticketId: number) => {
    const ticket = tickets.find(t => t.id === ticketId);
    if (!isAdmin && ticket?.printed_count > 0) {
      showMsg('error', 'Reprinting is restricted to Admins only.');
      return;
    }
    try {
      const res = await fetch(`/api/tickets/${ticketId}/print`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('kartal_token')}` },
        body: JSON.stringify({ user_email: user?.email, role: user?.role }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      setTickets(ts => ts.map(t => t.id === ticketId ? { ...t, printed_count: t.printed_count + 1 } : t));
      await openThermalPrint([ticket], isAdmin);
    } catch (err: any) {
      showMsg('error', err.message || 'Print failed');
    }
  };

  const handlePrintAll = async () => {
    const toPrint = isAdmin ? tickets : tickets.filter(t => t.printed_count === 0);
    if (!toPrint.length) { showMsg('error', 'No unprinted tickets.'); return; }

    // Log all prints
    for (const t of toPrint) {
      await fetch(`/api/tickets/${t.id}/print`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('kartal_token')}` },
        body: JSON.stringify({ user_email: user?.email, role: user?.role }),
      }).catch(() => {});
    }
    setTickets(ts => ts.map(t => toPrint.find(p => p.id === t.id) ? { ...t, printed_count: t.printed_count + 1 } : t));
    await openThermalPrint(toPrint, isAdmin);
  };

  // ── WHATSAPP ────────────────────────────────
  const handleWhatsApp = (ticket: any) => {
    // Opens WhatsApp directly with the customer's number pre-filled
    const waNum = formatWANumber(ticket.mobile);
    const msg =
`🎟 *KARTAL MART*

*Ticket No:* ${ticket.ticket_id}
*Name:* ${ticket.name}
*TX ID:* ${ticket.tx_id}
*Date:* ${new Date(ticket.date).toLocaleDateString('en-PK')}
*Ticket:* ${ticket.person_ticket_index} of ${ticket.total_tickets_in_tx}

_Please keep this ticket safe. Present it on draw day._

_Kartal Group of Companies_`;

    window.open(`https://wa.me/${waNum}?text=${encodeURIComponent(msg)}`, '_blank');
    fetch(`/api/tickets/${ticket.id}/share/whatsapp`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('kartal_token')}` },
    });
  };

  const handleWhatsAppAll = () => {
    // Send to each unique mobile number
    const seen = new Set<string>();
    tickets.forEach(t => {
      const waNum = formatWANumber(t.mobile);
      if (seen.has(waNum)) return;
      seen.add(waNum);

      // Get all tickets for this number
      const theirTickets = tickets.filter(x => x.mobile === t.mobile);
      const ids = theirTickets.map(x => x.ticket_id).join(', ');
      const msg =
`🎟 *KARTAL MART*

*Ticket(s):* ${ids}
*Name:* ${t.name}
*TX ID:* ${txId}

_Please keep these tickets safe. Present on draw day._

_Kartal Group of Companies_`;

      setTimeout(() => {
        window.open(`https://wa.me/${waNum}?text=${encodeURIComponent(msg)}`, '_blank');
      }, seen.size * 500); // stagger multiple windows slightly
    });
  };

  // ── PDF ─────────────────────────────────────
  const handleDownloadPDF = async (ticketId?: number) => {
    const key = ticketId ? `pdf-${ticketId}` : 'pdf-all';
    setLoadingPDF(key);
    try {
      const list = ticketId ? tickets.filter(t => t.id === ticketId) : tickets;
      const pdf = await generateThermalPDF(list, thermalRefs.current, appSettings.pdf_watermark_enabled === 'true');
      const fname = ticketId ? `Ticket-${list[0].ticket_id}.pdf` : `Tickets-${txId}.pdf`;
      pdf.save(fname);
      showMsg('success', 'PDF downloaded!');
      if (ticketId) {
        fetch(`/api/tickets/${ticketId}/share/pdf`, { method: 'POST', headers: { 'Authorization': `Bearer ${localStorage.getItem('kartal_token')}` } });
      }
    } catch (e) {
      showMsg('error', 'Failed to generate PDF');
    } finally {
      setLoadingPDF(null);
    }
  };

  const handleSendPDF = async (ticket: any) => {
    setLoadingPDF(`send-${ticket.id}`);
    try {
      const pdf = await generateThermalPDF([ticket], thermalRefs.current, appSettings.pdf_watermark_enabled === 'true');
      const fname = `Ticket-${ticket.ticket_id}.pdf`;
      const blob = pdf.output('blob');
      const file = new File([blob], fname, { type: 'application/pdf' });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: `Kartal Ticket ${ticket.ticket_id}` });
      } else {
        pdf.save(fname);
        // Also open WhatsApp with the customer's number
        handleWhatsApp(ticket);
      }
      fetch(`/api/tickets/${ticket.id}/share/pdf`, { method: 'POST', headers: { 'Authorization': `Bearer ${localStorage.getItem('kartal_token')}` } });
    } catch {
      showMsg('error', 'Failed to send PDF');
    } finally {
      setLoadingPDF(null);
    }
  };

  const base = isAdmin ? '/admin' : '/user';

  return (
    <div className="max-w-xl mx-auto space-y-5">

      {/* Header */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <h1 className="text-xl font-bold text-gray-900">Tickets Generated!</h1>
          </div>
          <p className="text-sm text-gray-500">
            TX: <span className="font-mono font-semibold text-indigo-600">{txId}</span>
            <span className="mx-2 text-gray-300">·</span>
            {tickets.length} ticket{tickets.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 no-print">
          {tickets.length > 1 && (
            <>
              <button onClick={handlePrintAll} className="btn-secondary text-xs">
                <Printer className="w-3.5 h-3.5 mr-1" /> Print All
              </button>
              <button onClick={() => handleDownloadPDF()} disabled={loadingPDF === 'pdf-all'} className="btn-secondary text-xs">
                <FileDown className="w-3.5 h-3.5 mr-1" />
                {loadingPDF === 'pdf-all' ? 'Generating...' : 'PDF All'}
              </button>
              <button onClick={handleWhatsAppAll} className="btn-green text-xs">
                <MessageSquare className="w-3.5 h-3.5 mr-1" /> WhatsApp All
              </button>
            </>
          )}
          <button onClick={() => navigate(`${base}/generate`)} className="btn-primary text-xs">
            <PlusCircle className="w-3.5 h-3.5 mr-1" /> New Ticket
          </button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`no-print flex items-center gap-2 p-3 rounded-xl text-sm font-medium ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' :
          message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
          'bg-blue-50 text-blue-700 border border-blue-200'}`}>
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {message.text}
        </div>
      )}

      {/* Ticket cards */}
      {tickets.length === 0 ? (
        <div className="text-center py-16 text-gray-400 bg-white rounded-2xl border border-dashed">
          <p className="text-base font-medium">No tickets found for this transaction.</p>
          <p className="text-sm mt-1">Transaction may still be pending approval.</p>
        </div>
      ) : (
        tickets.map((ticket) => (
          <div key={ticket.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Thermal preview — this IS the ticket in all contexts */}
            <div className="flex justify-center py-4 bg-gray-50 border-b border-gray-100">
              <div style={{ transform: 'scale(1)', transformOrigin: 'top center' }}>
                <ThermalTicket
                  ticket={ticket}
                  showFullMobile={false}
                  ref={el => { thermalRefs.current[ticket.id] = el; }}
                />
              </div>
            </div>

            {/* Action buttons */}
            <div className="px-4 py-3 flex flex-wrap gap-2 no-print">
              {/* Print → thermal window */}
              <button
                onClick={() => handlePrint(ticket.id)}
                disabled={!isAdmin && ticket.printed_count > 0}
                className={`inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  !isAdmin && ticket.printed_count > 0
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-900 text-white hover:bg-gray-700'
                }`}
              >
                <Printer className="w-3.5 h-3.5 mr-1" />
                {ticket.printed_count > 0 ? `Reprint (${ticket.printed_count}×)` : 'Print'}
              </button>

              {/* Download PDF — thermal size */}
              <button
                onClick={() => handleDownloadPDF(ticket.id)}
                disabled={!!loadingPDF}
                className="inline-flex items-center px-3 py-1.5 text-xs font-semibold bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
              >
                <FileDown className="w-3.5 h-3.5 mr-1" />
                {loadingPDF === `pdf-${ticket.id}` ? 'Generating...' : 'PDF'}
              </button>

              {/* WhatsApp → directly to customer's number */}
              <button
                onClick={() => handleWhatsApp(ticket)}
                className="inline-flex items-center px-3 py-1.5 text-xs font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5 mr-1" />
                WhatsApp
              </button>

              {/* Send PDF → share sheet or download+WhatsApp */}
              <button
                onClick={() => handleSendPDF(ticket)}
                disabled={!!loadingPDF}
                className="inline-flex items-center px-3 py-1.5 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                <Send className="w-3.5 h-3.5 mr-1" />
                {loadingPDF === `send-${ticket.id}` ? 'Sending...' : 'Send PDF'}
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
