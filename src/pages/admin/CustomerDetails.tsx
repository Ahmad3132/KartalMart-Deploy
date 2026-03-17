import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Phone, MapPin, Ticket, CreditCard, Calendar, Shield, Printer, MessageSquare, Share2, Send, FileDown } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { TicketCard } from '../../components/TicketCard';
import { formatWANumber } from '../../utils/api';

export default function CustomerDetails() {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const ticketRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchTicket();
  }, [ticketId]);

  const fetchTicket = async () => {
    try {
      const res = await fetch(`/api/tickets/search?id=${ticketId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('kartal_token')}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch ticket details');
      setTicket(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = async () => {
    try {
      const res = await fetch(`/api/tickets/${ticket.id}/print`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('kartal_token')}`
        },
        body: JSON.stringify({ user_email: ticket.user_email, role: 'Admin' }),
      });
      
      if (!res.ok) throw new Error('Print failed');
      
      setTicket({ ...ticket, printed_count: ticket.printed_count + 1 });
      // Thermal print
      const t = ticket;
      const w = window.open("","_blank","width=420,height=600,menubar=no");
      if(w){w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Print</title><style>*{margin:0;padding:0;box-sizing:border-box;}@page{size:80mm auto;margin:2mm;}html,body{width:80mm;background:#fff;}body{display:flex;align-items:center;justify-content:center;padding:2mm;}</style></head><body><div style="width:72mm;font-family:Courier New,monospace;font-size:11px;color:#000;"><div style="text-align:center;border-bottom:2px solid #000;padding-bottom:2mm;margin-bottom:2mm;"><div style="font-size:15px;font-weight:900;letter-spacing:3px;">KARTAL</div><div style="font-size:7px;">GROUP OF COMPANIES</div></div><div style="text-align:center;background:#000;color:#fff;padding:2mm;margin-bottom:2mm;"><div style="font-size:7px;">TICKET NUMBER</div><div style="font-size:21px;font-weight:900;">${t.ticket_id}</div></div><div style="padding:1mm 0;font-size:10px;"><div>Name: ${t.name}</div><div>TX: ${t.tx_id}</div></div><div style="border-top:2px solid #000;margin-top:2mm;padding-top:1mm;text-align:center;font-size:8px;">KEEP THIS TICKET SAFE</div></div><script>window.onload=function(){setTimeout(function(){window.print();setTimeout(function(){window.close();},1500);},300);};</script></body></html>`);w.document.close();}
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleWhatsApp = async () => {
    const message = `*Kartal Group Ticket*\n\n*Ticket ID:* ${ticket.ticket_id}\n*Customer:* ${ticket.name}\n*Transaction ID:* ${ticket.tx_id}\n*Date:* ${new Date(ticket.date).toLocaleString()}\n\n_Please keep this ticket safe for verification._`;
    
    const url = `https://wa.me/${formatWANumber(ticket.mobile)}?text=${encodeURIComponent(message)}`;
    window.open(url, 'whatsapp');
  };

  const handleSendPDF = async () => {
    if (!ticket || !ticketRef.current) return;
    setIsGeneratingPDF(true);
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const canvas = await html2canvas(ticketRef.current, {
        scale: 1.1, // Reduced for speed
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        imageTimeout: 0,
      });

      // Use JPEG with 0.5 quality for significant size reduction and speed
      const imgData = canvas.toDataURL('image/jpeg', 0.5);
      
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const maxWidth = pageWidth - (margin * 2);
      
      let imgWidth = maxWidth;
      let imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'JPEG', 10, margin, imgWidth, imgHeight, undefined, 'FAST');
      
      const fileName = `Ticket-${ticket.ticket_id}.pdf`;

      // Log the action
      fetch(`/api/tickets/${ticket.id}/share/pdf`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('kartal_token')}` }
      });

      const pdfBlob = pdf.output('blob');
      const file = new File([pdfBlob], fileName, { type: 'application/pdf' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: 'Kartal Group Ticket',
            text: 'Please find your ticket attached.',
          });
        } catch (shareErr) {
          console.error('Share failed:', shareErr);
          pdf.save(fileName);
          handleWhatsApp();
        }
      } else {
        pdf.save(fileName);
        handleWhatsApp();
      }
    } catch (err) {
      console.error('PDF generation error:', err);
      alert('Failed to generate/share PDF');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleSMS = async () => {
    try {
      const res = await fetch(`/api/tickets/${ticket.id}/share/sms`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('kartal_token')}` }
      });
      if (res.ok) {
        alert('SMS sent successfully (simulated)');
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );

  if (error) return (
    <div className="bg-red-50 p-6 rounded-xl border border-red-100 text-center">
      <p className="text-red-700">{error}</p>
      <button onClick={() => navigate(-1)} className="mt-4 text-indigo-600 font-medium flex items-center justify-center mx-auto">
        <ArrowLeft className="w-4 h-4 mr-1" /> Go Back
      </button>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="flex items-center text-gray-600 hover:text-gray-900 transition-colors">
          <ArrowLeft className="w-5 h-5 mr-1" />
          Back to list
        </button>
        <div className="flex space-x-2">
          <button 
            onClick={handlePrint}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center"
          >
            <Printer className="w-4 h-4 mr-2" /> Print
          </button>
          <button 
            onClick={handleSendPDF}
            disabled={isGeneratingPDF}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center disabled:opacity-50"
          >
            <Send className="w-4 h-4 mr-2" /> {isGeneratingPDF ? 'Generating...' : 'Send PDF'}
          </button>
        </div>
      </div>

      {/* Hidden TicketCard for PDF capture */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        <div className="p-10 bg-white" style={{ width: '800px' }}>
          {ticket && <TicketCard ticket={ticket} ref={ticketRef} showPrintedBadge={false} />}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Customer Info Card */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 flex items-center">
                <User className="w-5 h-5 mr-2 text-indigo-600" />
                Customer Information
              </h3>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${ticket.printed_count > 0 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                {ticket.printed_count > 0 ? 'Printed' : 'Unprinted'}
              </span>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Full Name</label>
                <p className="text-gray-900 font-medium text-lg">{ticket.name}</p>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Mobile Number</label>
                <p className="text-gray-900 font-medium text-lg">{ticket.mobile}</p>
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Address</label>
                <p className="text-gray-900 font-medium">{ticket.address || 'No address provided'}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-50">
              <h3 className="text-lg font-bold text-gray-900 flex items-center">
                <CreditCard className="w-5 h-5 mr-2 text-indigo-600" />
                Transaction & Payment
              </h3>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Transaction ID</label>
                <p className="text-indigo-600 font-mono font-bold">{ticket.tx_id}</p>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Payment Method</label>
                <p className="text-gray-900 font-medium">{ticket.payment_type || 'ONLINE'}</p>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Amount Paid</label>
                <p className="text-gray-900 font-bold text-xl">Rs. {ticket.amount || '0'}</p>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Status</label>
                <p className="text-green-600 font-bold uppercase">{ticket.status || 'Generated'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* System Data Card */}
        <div className="space-y-6">
          <div className="bg-gray-900 rounded-2xl shadow-sm overflow-hidden text-white">
            <div className="p-6 border-b border-white/10">
              <h3 className="text-lg font-bold flex items-center">
                <Shield className="w-5 h-5 mr-2 text-indigo-400" />
                System Audit
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Ticket ID</label>
                <p className="text-indigo-400 font-black text-2xl">{ticket.ticket_id}</p>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Generation ID</label>
                <p className="text-gray-300 font-mono text-xs">{ticket.generation_id}</p>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Created By</label>
                <p className="text-gray-300">{ticket.generated_by_nick || ticket.generated_by}</p>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Created At</label>
                <p className="text-gray-300">{new Date(ticket.date).toLocaleString()}</p>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Print History</label>
                <p className="text-gray-300">{ticket.printed_count} prints</p>
                {ticket.last_printed_at && (
                  <p className="text-[10px] text-gray-500 mt-1">Last: {new Date(ticket.last_printed_at).toLocaleString()}</p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100">
            <h4 className="font-bold text-indigo-900 mb-2 flex items-center">
              <MessageSquare className="w-4 h-4 mr-2" />
              Quick Actions
            </h4>
            <div className="space-y-2">
              <button 
                onClick={handleSendPDF}
                disabled={isGeneratingPDF}
                className="w-full py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center disabled:opacity-50"
              >
                <Send className="w-4 h-4 mr-2" />
                {isGeneratingPDF ? 'Generating...' : 'Send PDF'}
              </button>
              <button 
                onClick={handleSMS}
                className="w-full py-2 bg-white text-indigo-700 text-sm font-bold rounded-lg border border-indigo-200 hover:bg-indigo-100 transition-colors"
              >
                Send SMS
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
