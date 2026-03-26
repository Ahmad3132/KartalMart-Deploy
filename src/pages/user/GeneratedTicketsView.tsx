import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Printer, Send, PlusCircle, AlertCircle, FileDown, MessageSquare, CheckCircle } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ThermalTicket } from '../../components/ThermalTicket';
import { formatWANumber } from '../../utils/api';
import { openTicketPrintWindow } from '../../utils/printTicket';

interface PrintSettings {
  watermarkEnabled: boolean;
  qrEnabled: boolean;
  colorMode: 'color' | 'bw';
  companyPhone: string;
  companyEmail: string;
  companyWebsite: string;
}

// Generate thermal PDF (80mm width) — captures ThermalTicket component which already has QR, watermark, contact
async function generateThermalPDF(tickets: any[], thermalRefs: { [key: string]: HTMLDivElement | null }) {
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

    pdf.internal.pageSize.height = imgH + currentY + 3;
    pdf.addImage(imgData, 'PNG', 3, currentY, imgW, imgH);

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
  const [userMe, setUserMe] = useState<any>(null);
  const canReprint = isAdmin || userMe?.reprint_enabled === 1;

  // Derived settings
  const printSettings: PrintSettings = {
    watermarkEnabled: appSettings.pdf_watermark_enabled === 'true',
    qrEnabled: appSettings.pdf_qr_verification_enabled !== 'false',
    colorMode: (appSettings.pdf_color_mode === 'bw' ? 'bw' : 'color') as 'color' | 'bw',
    companyPhone: appSettings.company_phone || '',
    companyEmail: appSettings.company_email || '',
    companyWebsite: appSettings.company_website || '',
  };

  useEffect(() => {
    const headers = { 'Authorization': `Bearer ${localStorage.getItem('kartal_token')}` };
    Promise.all([
      fetch(`/api/tickets?limit=1000`, { headers }).then(r => r.json()).catch(()=>({tickets:[]})),
      fetch('/api/settings', { headers }).then(r => r.json()).catch(()=>({})),
      fetch('/api/users/me', { headers }).then(r => r.json()).catch(()=>null),
    ]).then(([d, s, me]) => {
      setTickets((d.tickets || []).filter((t: any) => t.tx_id === txId));
      setAppSettings(s?.error ? {} : s);
      setUserMe(me);
    });
  }, [txId]);

  const showMsg = (type: 'success' | 'error' | 'info', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  // ── PRINT ──────────────────────────────────
  const handlePrint = async (ticketId: number) => {
    const ticket = tickets.find(t => t.id === ticketId);
    if (!canReprint && ticket?.printed_count > 0) {
      showMsg('error', 'Reprinting is restricted. Contact admin for reprint permission.');
      return;
    }
    try {
      const res = await fetch(`/api/tickets/${ticketId}/print`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('kartal_token')}` },
        body: JSON.stringify({}),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      setTickets(ts => ts.map(t => t.id === ticketId ? { ...t, printed_count: t.printed_count + 1 } : t));
      await openTicketPrintWindow([ticket], printSettings);
    } catch (err: any) {
      showMsg('error', err.message || 'Print failed');
    }
  };

  const handlePrintAll = async () => {
    const toPrint = canReprint ? tickets : tickets.filter(t => t.printed_count === 0);
    if (!toPrint.length) { showMsg('error', 'No unprinted tickets.'); return; }

    for (const t of toPrint) {
      await fetch(`/api/tickets/${t.id}/print`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('kartal_token')}` },
        body: JSON.stringify({}),
      }).catch(() => {});
    }
    setTickets(ts => ts.map(t => toPrint.find(p => p.id === t.id) ? { ...t, printed_count: t.printed_count + 1 } : t));
    await openTicketPrintWindow(toPrint, printSettings);
  };

  // ── WHATSAPP ────────────────────────────────
  const handleWhatsApp = (ticket: any) => {
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
    const seen = new Set<string>();
    tickets.forEach(t => {
      const waNum = formatWANumber(t.mobile);
      if (seen.has(waNum)) return;
      seen.add(waNum);

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
      }, seen.size * 500);
    });
  };

  // ── PDF ─────────────────────────────────────
  // PDF captures the ThermalTicket component which already renders QR, watermark, contact info
  const handleDownloadPDF = async (ticketId?: number) => {
    const key = ticketId ? `pdf-${ticketId}` : 'pdf-all';
    setLoadingPDF(key);
    try {
      const list = ticketId ? tickets.filter(t => t.id === ticketId) : tickets;
      const pdf = await generateThermalPDF(list, thermalRefs.current);
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
      const pdf = await generateThermalPDF([ticket], thermalRefs.current);
      const fname = `Ticket-${ticket.ticket_id}.pdf`;
      const blob = pdf.output('blob');
      const file = new File([blob], fname, { type: 'application/pdf' });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: `Kartal Ticket ${ticket.ticket_id}` });
      } else {
        pdf.save(fname);
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
            {/* Thermal preview — renders with ALL settings (QR, watermark, company info, color mode) */}
            <div className="flex justify-center py-4 bg-gray-50 border-b border-gray-100">
              <div style={{ transform: 'scale(1)', transformOrigin: 'top center' }}>
                <ThermalTicket
                  ticket={ticket}
                  showFullMobile={false}
                  showQR={ticket.template_qr_enabled != null ? ticket.template_qr_enabled !== 'false' : printSettings.qrEnabled}
                  showWatermark={ticket.template_watermark_enabled != null ? ticket.template_watermark_enabled === 'true' : printSettings.watermarkEnabled}
                  colorMode={(ticket.template_color_mode || printSettings.colorMode) as 'color' | 'bw'}
                  companyPhone={ticket.template_company_phone ?? printSettings.companyPhone}
                  companyEmail={ticket.template_company_email ?? printSettings.companyEmail}
                  companyWebsite={ticket.template_company_website ?? printSettings.companyWebsite}
                  ref={el => { thermalRefs.current[ticket.id] = el; }}
                />
              </div>
            </div>

            {/* Lifecycle status */}
            {ticket.lifecycle_status && ticket.lifecycle_status !== 'generated' && (
              <div className="px-4 py-2 border-b border-gray-100 bg-gray-50">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  ticket.lifecycle_status === 'confirmed' ? 'bg-green-100 text-green-700' :
                  ticket.lifecycle_status === 'sent' ? 'bg-blue-100 text-blue-700' :
                  ticket.lifecycle_status === 'video_uploaded' ? 'bg-purple-100 text-purple-700' :
                  ticket.lifecycle_status === 'scanned' ? 'bg-indigo-100 text-indigo-700' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {ticket.lifecycle_status.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
                </span>
              </div>
            )}

            {/* Action buttons */}
            <div className="px-4 py-3 flex flex-wrap gap-2 no-print">
              <button
                onClick={() => handlePrint(ticket.id)}
                disabled={!canReprint && ticket.printed_count > 0}
                className={`inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  !canReprint && ticket.printed_count > 0
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-900 text-white hover:bg-gray-700'
                }`}
              >
                <Printer className="w-3.5 h-3.5 mr-1" />
                {ticket.printed_count > 0 ? `Reprint (${ticket.printed_count}×)` : 'Print'}
              </button>

              <button
                onClick={() => handleDownloadPDF(ticket.id)}
                disabled={!!loadingPDF}
                className="inline-flex items-center px-3 py-1.5 text-xs font-semibold bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
              >
                <FileDown className="w-3.5 h-3.5 mr-1" />
                {loadingPDF === `pdf-${ticket.id}` ? 'Generating...' : 'PDF'}
              </button>

              <button
                onClick={() => handleWhatsApp(ticket)}
                className="inline-flex items-center px-3 py-1.5 text-xs font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5 mr-1" />
                WhatsApp
              </button>

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
