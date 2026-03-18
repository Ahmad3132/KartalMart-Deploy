import React from 'react';
import { CheckCircle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import kartalLogo from '../assets/kartal-logo.png';

interface TicketCardProps {
  ticket: any;
  maskMobile?: (mobile: string) => string;
  showPrintedBadge?: boolean;
}

export const TicketCard = React.forwardRef<HTMLDivElement, TicketCardProps>(
  ({ ticket, maskMobile, showPrintedBadge = true }, ref) => {
    const defaultMask = (mobile: string) => {
      if (!mobile) return '';
      return mobile.slice(0, -3) + '***';
    };
    const mobileDisplay = maskMobile ? maskMobile(ticket.mobile) : defaultMask(ticket.mobile);

    return (
      <div
        ref={ref}
        className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-200 ticket-card"
        style={{ fontFamily: 'sans-serif' }}
      >
        {/* Header bar */}
        <div className="bg-[#1a2b4b] px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={kartalLogo} alt="Kartal" className="h-10 w-10 object-contain" />
            <div>
              <p className="text-white font-black text-base tracking-widest" style={{ fontFamily: 'serif' }}>KARTAL MART</p>
              <p className="text-[#A48655] text-[9px] tracking-widest uppercase font-semibold">Group of Companies</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[#A48655] text-[10px] uppercase tracking-wider font-bold">KARTAL MART</p>
            <p className="text-white font-mono font-black text-lg">{ticket.ticket_id}</p>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 flex flex-col sm:flex-row gap-5">
          {/* Info */}
          <div className="flex-1 space-y-2">
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Customer Name</p>
                <p className="font-bold text-gray-900">{ticket.name}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Mobile</p>
                <p className="font-semibold text-gray-700">{mobileDisplay}</p>
              </div>
              <div className="col-span-2">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Address</p>
                <p className="font-semibold text-gray-700">{ticket.address || 'N/A'}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Transaction ID</p>
                <p className="font-mono text-indigo-600 font-bold text-xs">{ticket.tx_id}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Date</p>
                <p className="text-gray-700 text-xs">{new Date(ticket.date).toLocaleDateString('en-PK')}</p>
              </div>
            </div>

            {/* Urdu instruction */}
            <div className="pt-2 border-t border-gray-100">
              <p className="text-[11px] text-gray-500 text-right font-urdu leading-relaxed">
                اس ٹکٹ کی تصدیق کے لیے، اس کیو آر کوڈ کو اسکین کریں۔
              </p>
            </div>

            {/* Meta */}
            <div className="flex gap-4 text-[10px] text-gray-400 font-mono">
              <span>Ticket {ticket.person_ticket_index}/{ticket.total_tickets_in_tx}</span>
              <span>By: {ticket.generated_by_nick || ticket.generated_by}</span>
            </div>
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-center justify-center gap-2 shrink-0">
            <div className="bg-white p-2 border-2 border-gray-100 rounded-xl shadow-inner">
              <QRCodeSVG
                value={JSON.stringify({
                  id: ticket.ticket_id,
                  name: ticket.name,
                  tx: ticket.tx_id,
                  gen: ticket.generation_id,
                })}
                size={90}
                level="H"
                includeMargin={false}
              />
            </div>
            <p className="text-[9px] text-gray-400 text-center">Scan to verify</p>
          </div>
        </div>

        {/* Printed badge */}
        {showPrintedBadge && ticket.printed_count > 0 && (
          <div className="px-5 pb-3 print:hidden">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-orange-600 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full">
              <CheckCircle className="h-3 w-3" />
              Printed {ticket.printed_count}×
            </span>
          </div>
        )}
      </div>
    );
  }
);

TicketCard.displayName = 'TicketCard';
