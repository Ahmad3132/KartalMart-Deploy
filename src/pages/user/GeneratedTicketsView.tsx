import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Printer, Send, PlusCircle, AlertCircle, FileDown, MessageSquare, CheckCircle } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { TicketCard } from '../../components/TicketCard';

export default function GeneratedTicketsView() {
  const { txId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [loadingPDF, setLoadingPDF] = useState<string | null>(null);
  const ticketRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  useEffect(() => {
    const headers = { 'Authorization': `Bearer ${localStorage.getItem('kartal_token')}` };
    fetch(`/api/tickets?limit=1000`, { headers })
      .then(r => r.json())
      .then(d => setTickets((d.tickets || []).filter((t: any) => t.tx_id === txId)))
      .catch(() => setTickets([]));
    fetch('/api/settings', { headers })
      .then(r => r.json())
      .then(d => setSettings(d))
      .catch(() => {});
  }, [txId]);

  const showMsg = (type: 'success' | 'error' | 'info', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const formatWA = (mobile: string) => {
    const clean = mobile.replace(/\D/g, '');
    const num = clean.startsWith('0') ? '92' + clean.slice(1) : clean.startsWith('3') ? '92' + clean : clean;
    return num;
  };

  const handlePrint = async (ticketId: number) => {
    const ticket = tickets.find(t => t.id === ticketId);
    if (user?.role !== 'Admin' && ticket?.printed_count > 0) {
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
      window.print();
    } catch (err: any) { showMsg('error', err.message || 'Print failed'); }
  };

  const handleWhatsApp = (ticket: any) => {
    const msg = `*Kartal Group Lucky Draw Ticket*\n\n*Ticket ID:* ${ticket.ticket_id}\n*Customer:* ${ticket.name}\n*Transaction ID:* ${ticket.tx_id}\n*Date:* ${new Date(ticket.date).toLocaleDateString()}\n\n_Please keep this ticket safe for verification._`;
    window.open(`https://wa.me/${formatWA(ticket.mobile)}?text=${encodeURIComponent(msg)}`, '_blank');
    fetch(`/api/tickets/${ticket.id}/share/whatsapp`, { method: 'POST', headers: { 'Authorization': `Bearer ${localStorage.getItem('kartal_token')}` } });
  };

  const handleWhatsAppAll = () => {
    if (!tickets.length) return;
    const first = tickets[0];
    const ids = tickets.map(t => t.ticket_id).join(', ');
    const msg = `*Kartal Group Lucky Draw Tickets*\n\n*Tickets:* ${ids}\n*Customer:* ${first.name}\n*Transaction ID:* ${txId}\n\n_Your tickets have been generated successfully._`;
    window.open(`https://wa.me/${formatWA(first.mobile)}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const generatePDF = async (ticketsToGen: any[]) => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    let currentY = 10;
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();

    for (let i = 0; i < ticketsToGen.length; i++) {
      const el = ticketRefs.current[ticketsToGen[i].id];
      if (!el) continue;
      const canvas = await html2canvas(el, { scale: 1.5, useCORS: true, logging: false, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/jpeg', 0.75);
      const imgW = pageW - 20;
      const imgH = (canvas.height * imgW) / canvas.width;
      if (currentY + imgH > pageH - 10 && i > 0) { pdf.addPage(); currentY = 10; }
      pdf.addImage(imgData, 'JPEG', 10, currentY, imgW, imgH, undefined, 'FAST');
      currentY += imgH + 8;
    }
    return pdf;
  };

  const handleDownloadPDF = async (ticketId?: number) => {
    const key = ticketId ? `pdf-${ticketId}` : 'pdf-all';
    setLoadingPDF(key);
    try {
      const list = ticketId ? tickets.filter(t => t.id === ticketId) : tickets;
      const pdf = await generatePDF(list);
      const fname = ticketId ? `Ticket-${list[0].ticket_id}.pdf` : `Tickets-${txId}.pdf`;
      pdf.save(fname);
      if (ticketId) fetch(`/api/tickets/${ticketId}/share/pdf`, { method: 'POST', headers: { 'Authorization': `Bearer ${localStorage.getItem('kartal_token')}` } });
      showMsg('success', 'PDF downloaded successfully!');
    } catch { showMsg('error', 'Failed to generate PDF'); }
    finally { setLoadingPDF(null); }
  };

  const handleSendPDF = async (ticket: any) => {
    setLoadingPDF(`send-${ticket.id}`);
    try {
      const pdf = await generatePDF([ticket]);
      const fname = `Ticket-${ticket.ticket_id}.pdf`;
      const blob = pdf.output('blob');
      const file = new File([blob], fname, { type: 'application/pdf' });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Kartal Group Ticket' });
      } else {
        pdf.save(fname);
        handleWhatsApp(ticket);
      }
      fetch(`/api/tickets/${ticket.id}/share/pdf`, { method: 'POST', headers: { 'Authorization': `Bearer ${localStorage.getItem('kartal_token')}` } });
    } catch { showMsg('error', 'Failed to share PDF'); }
    finally { setLoadingPDF(null); }
  };

  const handleSMS = async (ticketId: number) => {
    try {
      await fetch(`/api/tickets/${ticketId}/share/sms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('kartal_token')}` },
        body: JSON.stringify({ user_email: user?.email }),
      });
      showMsg('success', 'SMS logged successfully.');
    } catch { showMsg('error', 'SMS failed'); }
  };

  const base = user?.role === 'Admin' ? '/admin' : '/user';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <style>{`@media print { .no-print { display: none !important; } body * { visibility: hidden; } .print-area, .print-area * { visibility: visible; } .print-area { position: absolute; left: 0; top: 0; width: 100%; } }`}</style>

      {/* Header */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <h1 className="text-xl font-bold text-gray-900">Tickets Generated!</h1>
          </div>
          <p className="text-sm text-gray-500">Transaction: <span className="font-mono font-semibold text-indigo-600">{txId}</span> · {tickets.length} ticket{tickets.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {tickets.length > 1 && (
            <>
              <button onClick={() => handleDownloadPDF()} disabled={loadingPDF === 'pdf-all'} className="btn-secondary">
                <FileDown className="w-4 h-4 mr-1.5" />
                {loadingPDF === 'pdf-all' ? 'Generating...' : 'Download All PDF'}
              </button>
              <button onClick={handleWhatsAppAll} className="btn-green">
                <MessageSquare className="w-4 h-4 mr-1.5" />
                WhatsApp All
              </button>
            </>
          )}
          <button onClick={() => navigate(`${base}/generate`)} className="btn-primary">
            <PlusCircle className="w-4 h-4 mr-1.5" />
            New Ticket
          </button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`no-print flex items-center gap-2 p-3 rounded-lg text-sm font-medium ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' :
          message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
          'bg-blue-50 text-blue-700 border border-blue-200'
        }`}>
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {message.text}
        </div>
      )}

      {/* Tickets */}
      <div className="print-area space-y-6">
        {tickets.map((ticket) => (
          <div key={ticket.id}>
            <TicketCard
              ticket={ticket}
              ref={el => { ticketRefs.current[ticket.id] = el; }}
            />

            {/* Action buttons — always visible */}
            <div className="no-print mt-3 flex flex-wrap gap-2">
              <button
                onClick={() => handleDownloadPDF(ticket.id)}
                disabled={!!loadingPDF}
                className="inline-flex items-center px-3 py-1.5 text-xs font-semibold bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
              >
                <FileDown className="w-3.5 h-3.5 mr-1" />
                {loadingPDF === `pdf-${ticket.id}` ? 'Generating...' : 'Download PDF'}
              </button>

              <button
                onClick={() => handlePrint(ticket.id)}
                disabled={user?.role !== 'Admin' && ticket.printed_count > 0}
                className={`inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  user?.role !== 'Admin' && ticket.printed_count > 0
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-900 text-white hover:bg-gray-700'
                }`}
              >
                <Printer className="w-3.5 h-3.5 mr-1" />
                {ticket.printed_count > 0 ? `Reprint (${ticket.printed_count}×)` : 'Print'}
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

              <button
                onClick={() => handleSMS(ticket.id)}
                className="inline-flex items-center px-3 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5 mr-1" />
                SMS
              </button>
            </div>
          </div>
        ))}

        {tickets.length === 0 && (
          <div className="text-center py-16 text-gray-400 bg-white rounded-2xl border border-dashed">
            <p className="text-lg font-medium">No tickets found for this transaction.</p>
            <p className="text-sm mt-1">The transaction may still be pending approval.</p>
          </div>
        )}
      </div>
    </div>
  );
}
