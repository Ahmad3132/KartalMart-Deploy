import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Ticket, Printer, Send, PlusCircle, CheckCircle, AlertCircle, FileDown, MessageSquare } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { TicketCard } from '../../components/TicketCard';

export default function GeneratedTicketsView() {
  const { txId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [error, setError] = useState('');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const ticketRefs = useRef<{[key: string]: HTMLDivElement | null}>({});

  useEffect(() => {
    const headers = { 'Authorization': `Bearer ${localStorage.getItem('kartal_token')}` };
    fetch(`/api/tickets?limit=1000`, { headers })
      .then(res => res.json())
      .then(data => {
        const ticketsList = Array.isArray(data.tickets) ? data.tickets : [];
        const filtered = ticketsList.filter((t: any) => t.tx_id === txId);
        setTickets(filtered);
      })
      .catch(() => setTickets([]));

    fetch('/api/settings', { headers })
      .then(res => res.json())
      .then(data => setSettings(data))
      .catch(() => setSettings({}));
  }, [txId]);

  const handlePrint = async (ticketId: number) => {
    const ticket = tickets.find(t => t.id === ticketId);
    if (user?.role !== 'Admin' && ticket?.printed_count > 0) {
      setError('Reprinting is restricted to Admins only.');
      setTimeout(() => setError(''), 3000);
      return;
    }

    try {
      const res = await fetch(`/api/tickets/${ticketId}/print`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('kartal_token')}`
        },
        body: JSON.stringify({ user_email: user?.email, role: user?.role }),
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Print failed');
      }

      // Update local state
      setTickets(tickets.map(t => t.id === ticketId ? { ...t, printed_count: t.printed_count + 1 } : t));
      
      // Trigger actual browser print
      window.print();
    } catch (err: any) {
      setError(err.message);
      setTimeout(() => setError(''), 3000);
    }
  };

  const formatWhatsAppUrl = (mobile: string, message: string) => {
    // Ensure mobile number is in correct format (remove any non-digits)
    const cleanMobile = mobile.replace(/\D/g, '');
    // Add country code if missing (assuming Pakistan +92 if it starts with 0 or 3)
    let formattedMobile = cleanMobile;
    if (formattedMobile.startsWith('0')) {
      formattedMobile = '92' + formattedMobile.substring(1);
    } else if (formattedMobile.startsWith('3')) {
      formattedMobile = '92' + formattedMobile;
    }
    return `https://wa.me/${formattedMobile}?text=${encodeURIComponent(message)}`;
  };

  const handleWhatsApp = (ticket: any) => {
    const message = `*Kartal Group Ticket*\n\n*Ticket ID:* ${ticket.ticket_id}\n*Customer:* ${ticket.name}\n*Transaction ID:* ${ticket.tx_id}\n*Date:* ${new Date(ticket.date).toLocaleString()}\n\n_Please keep this ticket safe for verification._`;
    const url = formatWhatsAppUrl(ticket.mobile, message);
    window.open(url, 'whatsapp');
  };

  const handleWhatsAppAll = () => {
    if (tickets.length === 0) return;
    const firstTicket = tickets[0];
    const ticketIds = tickets.map(t => t.ticket_id).join(', ');
    const message = `*Kartal Group Tickets Batch*\n\n*Tickets:* ${ticketIds}\n*Customer:* ${firstTicket.name}\n*Transaction ID:* ${txId}\n\n_Your tickets have been generated successfully._`;
    const url = formatWhatsAppUrl(firstTicket.mobile, message);
    window.open(url, 'whatsapp');
  };

  const handleSendPDF = async (ticketId?: number) => {
    setIsGeneratingPDF(true);
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const ticketsToGen = ticketId 
        ? tickets.filter(t => t.id === ticketId)
        : tickets;

      // Parallelize canvas generation for speed
      const canvasPromises = ticketsToGen.map(async (ticket) => {
        const element = ticketRefs.current[ticket.id];
        if (!element) return null;

        // Temporarily hide buttons for capture
        const buttons = element.querySelector('.print-hidden');
        if (buttons) (buttons as HTMLElement).style.display = 'none';

        const canvas = await html2canvas(element, {
          scale: 1.2, // Reduced scale for speed while maintaining decent quality
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          imageTimeout: 0,
        });

        if (buttons) (buttons as HTMLElement).style.display = '';
        return canvas;
      });

      const canvases = await Promise.all(canvasPromises);

      let currentY = 10;
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      for (let i = 0; i < canvases.length; i++) {
        const canvas = canvases[i];
        if (!canvas) continue;

        // Use JPEG with 0.6 quality for much faster PDF generation and smaller file size
        const imgData = canvas.toDataURL('image/jpeg', 0.6);
        const imgWidth = pageWidth - 20;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        if (currentY + imgHeight > pageHeight - 10 && i > 0) {
          pdf.addPage();
          currentY = 10;
        }

        pdf.addImage(imgData, 'JPEG', 10, currentY, imgWidth, imgHeight, undefined, 'FAST');
        currentY += imgHeight + 5;
      }

      const fileName = ticketId 
        ? `Ticket-${ticketsToGen[0].ticket_id}.pdf`
        : `Tickets-Batch-${txId}.pdf`;
      
      // Log the action
      if (ticketId) {
        fetch(`/api/tickets/${ticketId}/share/pdf`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('kartal_token')}` }
        });
      } else {
        fetch(`/api/transactions/${txId}/share/pdf`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('kartal_token')}` }
        });
      }

      const pdfBlob = pdf.output('blob');
      const file = new File([pdfBlob], fileName, { type: 'application/pdf' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: 'Kartal Group Tickets',
            text: 'Please find the generated tickets attached.',
          });
        } catch (shareErr) {
          console.error('Share failed:', shareErr);
          pdf.save(fileName);
          if (ticketId && ticketsToGen.length === 1) {
            handleWhatsApp(ticketsToGen[0]);
          } else {
            setError('PDF downloaded. Please share it manually via WhatsApp.');
            setTimeout(() => setError(''), 5000);
          }
        }
      } else {
        pdf.save(fileName);
        // If it's a single ticket, we can also open WhatsApp as a courtesy
        if (ticketId && ticketsToGen.length === 1) {
          handleWhatsApp(ticketsToGen[0]);
        } else {
          setError('PDF downloaded. Please share it manually via WhatsApp.');
          setTimeout(() => setError(''), 5000);
        }
      }
    } catch (err) {
      console.error('PDF generation error:', err);
      setError('Failed to generate/share PDF');
      setTimeout(() => setError(''), 3000);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleDownloadPDF = async (ticketId?: number) => {
    setIsGeneratingPDF(true);
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const ticketsToGen = ticketId 
        ? tickets.filter(t => t.id === ticketId)
        : tickets;

      // Parallelize canvas generation for speed
      const canvasPromises = ticketsToGen.map(async (ticket) => {
        const element = ticketRefs.current[ticket.id];
        if (!element) return null;

        // Temporarily hide buttons for capture
        const buttons = element.querySelector('.print-hidden');
        if (buttons) (buttons as HTMLElement).style.display = 'none';

        const canvas = await html2canvas(element, {
          scale: 1.2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          imageTimeout: 0,
        });

        if (buttons) (buttons as HTMLElement).style.display = '';
        return canvas;
      });

      const canvases = await Promise.all(canvasPromises);

      let currentY = 10;
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      for (let i = 0; i < canvases.length; i++) {
        const canvas = canvases[i];
        if (!canvas) continue;

        const imgData = canvas.toDataURL('image/jpeg', 0.6);
        const imgWidth = pageWidth - 20;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        if (currentY + imgHeight > pageHeight - 10 && i > 0) {
          pdf.addPage();
          currentY = 10;
        }

        pdf.addImage(imgData, 'JPEG', 10, currentY, imgWidth, imgHeight, undefined, 'FAST');
        currentY += imgHeight + 5;
      }

      const fileName = ticketId 
        ? `Ticket-${ticketsToGen[0].ticket_id}.pdf`
        : `Tickets-Batch-${txId}.pdf`;
      
      pdf.save(fileName);
    } catch (err) {
      console.error('PDF generation error:', err);
      setError('Failed to generate PDF');
      setTimeout(() => setError(''), 3000);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleSendAndPrint = async (ticket: any) => {
    if (user?.role !== 'Admin' && ticket.printed_count > 0) {
      setError('Reprinting is restricted to Admins only.');
      setTimeout(() => setError(''), 3000);
      return;
    }
    await handlePrint(ticket.id);
    handleSendPDF(ticket.id);
  };

  const handleSendSMS = async (ticketId: number) => {
    try {
      const res = await fetch(`/api/tickets/${ticketId}/share/sms`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('kartal_token')}`
        },
        body: JSON.stringify({ user_email: user?.email }),
      });
      
      if (!res.ok) throw new Error('Failed to send SMS');
      
      setError('SMS simulated successfully. Audit log updated.');
      setTimeout(() => setError(''), 3000);
    } catch (err: any) {
      setError(err.message);
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleGenerateNew = () => {
    const base = user?.role === 'Admin' ? '/admin' : '/user';
    navigate(`${base}/generate`);
  };

  const handlePrintAll = async () => {
    const toPrint = tickets.filter(t => user?.role === 'Admin' || t.printed_count === 0);
    
    if (toPrint.length === 0) {
      setError('All tickets in this batch have already been printed.');
      setTimeout(() => setError(''), 3000);
      return;
    }

    for (const ticket of toPrint) {
      await handlePrint(ticket.id);
    }
  };

  const handleSendAndPrintAll = async () => {
    const toPrint = tickets.filter(t => user?.role === 'Admin' || t.printed_count === 0);
    
    if (toPrint.length === 0) {
      setError('All tickets in this batch have already been printed.');
      setTimeout(() => setError(''), 3000);
      return;
    }

    for (const ticket of toPrint) {
      await handlePrint(ticket.id);
    }
    handleSendPDF();
  };

  const maskMobile = (mobile: string) => {
    if (!mobile) return '';
    return mobile.slice(0, -3) + '***';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 print:p-0">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { 
            position: absolute; 
            left: 0; 
            top: 0; 
            width: 100%;
            padding: 0 !important;
            margin: 0 !important;
          }
          .ticket-card {
            page-break-inside: avoid;
            border: 1px solid #000 !important;
            margin-bottom: 10px !important;
            padding: 10px !important;
            width: 300px !important; /* Minimum size for print */
            height: auto !important;
          }
          .no-print { display: none !important; }
        }
      `}} />
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tickets Generated</h1>
          <p className="mt-1 text-sm text-gray-500">Transaction ID: <span className="font-mono font-semibold">{txId}</span></p>
        </div>
        <div className="flex flex-wrap gap-2">
          {tickets.length > 1 && (
            <>
              <button
                onClick={() => handleDownloadPDF()}
                disabled={isGeneratingPDF}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                <FileDown className="w-4 h-4 mr-2" />
                {isGeneratingPDF ? 'Generating...' : 'Download All PDF'}
              </button>
              <button
                onClick={handlePrintAll}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
              >
                <Printer className="w-4 h-4 mr-2" />
                Print All
              </button>
              <button
                onClick={handleWhatsAppAll}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                WhatsApp All
              </button>
              <button
                onClick={() => handleSendPDF()}
                disabled={isGeneratingPDF}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                <Send className="w-4 h-4 mr-2" />
                {isGeneratingPDF ? 'Generating...' : 'Send All PDF'}
              </button>
              <button
                onClick={handleSendAndPrintAll}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
              >
                <Send className="w-4 h-4 mr-2" />
                Send & Print All
              </button>
            </>
          )}
          <button
            onClick={handleGenerateNew}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            Generate New
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative print:hidden">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>{error}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 print-area">
        {tickets.map((ticket) => (
          <div key={ticket.id} className="relative group">
            <TicketCard 
              ticket={ticket} 
              ref={el => ticketRefs.current[ticket.id] = el}
            />
            
            <div className="absolute bottom-6 right-6 flex flex-wrap gap-2 print:hidden opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => handleDownloadPDF(ticket.id)}
                disabled={isGeneratingPDF}
                className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-all disabled:opacity-50"
              >
                <FileDown className="w-4 h-4 mr-2" />
                PDF
              </button>
              <button
                onClick={() => handlePrint(ticket.id)}
                disabled={user?.role !== 'Admin' && ticket.printed_count > 0}
                className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  user?.role !== 'Admin' && ticket.printed_count > 0
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-900 text-white hover:bg-gray-800'
                }`}
              >
                <Printer className="w-4 h-4 mr-2" />
                {ticket.printed_count > 0 ? 'Reprint' : 'Print'}
              </button>

              {settings.whatsapp_enabled === 'true' && (
                <>
                  <button
                    onClick={() => handleWhatsApp(ticket)}
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-all"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    WhatsApp
                  </button>
                  <button
                    onClick={() => handleSendPDF(ticket.id)}
                    disabled={isGeneratingPDF}
                    className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-all disabled:opacity-50"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Send PDF
                  </button>
                  <button
                    onClick={() => handleSendAndPrint(ticket)}
                    disabled={user?.role !== 'Admin' && ticket.printed_count > 0}
                    className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      user?.role !== 'Admin' && ticket.printed_count > 0
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Send & Print
                  </button>
                  <button
                    onClick={() => handleSendSMS(ticket.id)}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-all"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Send SMS
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
