import React from 'react';
import { CheckCircle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Logo } from './Logo';

interface TicketCardProps {
  ticket: any;
  maskMobile?: (mobile: string) => string;
  showPrintedBadge?: boolean;
}

export const TicketCard = React.forwardRef<HTMLDivElement, TicketCardProps>(({ ticket, maskMobile, showPrintedBadge = true }, ref) => {
  const defaultMask = (mobile: string) => {
    if (!mobile) return '';
    return mobile.slice(0, -3) + '***';
  };

  const mobileDisplay = maskMobile ? maskMobile(ticket.mobile) : defaultMask(ticket.mobile);

  return (
    <div 
      ref={ref}
      className="bg-white border-2 border-dashed border-[#d1d5db] rounded-2xl p-6 relative overflow-hidden shadow-sm hover:shadow-md transition-shadow ticket-card"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start space-x-4">
          <div className="bg-white p-2 rounded-xl border border-gray-100 shadow-sm">
            <Logo className="h-16 w-24" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-[#111827] tracking-tighter">{ticket.ticket_id}</h2>
            <div className="mt-1 space-y-0.5">
              <p className="text-sm font-medium text-[#374151]">Customer: {ticket.name}</p>
              <p className="text-xs text-[#6b7280]">Mobile: {mobileDisplay}</p>
              <p className="text-xs text-[#6b7280]">Address: {ticket.address || 'N/A'}</p>
              <p className="text-xs text-[#6b7280]">TxID: {ticket.tx_id}</p>
              <p className="text-xs text-[#6b7280]">Date: {new Date(ticket.date).toLocaleString()}</p>
              <div className="grid grid-cols-2 gap-x-4 mt-2 pt-2 border-t border-[#f3f4f6]">
                <p className="text-[10px] text-[#9ca3af] font-mono">GenID: {ticket.generation_id}</p>
                <p className="text-[10px] text-[#9ca3af] font-mono">Ticket: {ticket.person_ticket_index} of {ticket.total_tickets_in_tx}</p>
                <p className="text-[10px] text-[#9ca3af] font-mono">By: {ticket.generated_by_nick || ticket.generated_by}</p>
                {ticket.last_printed_by_nick && (
                  <p className="text-[10px] text-[#9ca3af] font-mono">Printed By: {ticket.last_printed_by_nick}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-6">
          <div className="flex flex-col items-center space-y-2">
            <p className="text-[10px] font-urdu text-[#374151] text-center leading-relaxed">
              اس ٹکٹ کی تصدیق کے لیے، اس کیو آر کوڈ کو اسکین کریں۔
            </p>
            <div className="bg-white p-2 border border-[#f3f4f6] rounded-lg shadow-sm">
              <QRCodeSVG 
                value={JSON.stringify({
                  id: ticket.ticket_id,
                  name: ticket.name,
                  tx: ticket.tx_id,
                  gen: ticket.generation_id
                })}
                size={80}
                level="H"
              />
            </div>
          </div>
        </div>
      </div>

      {showPrintedBadge && ticket.printed_count > 0 && (
        <div className="absolute top-2 right-2 flex items-center space-x-1 text-[10px] font-bold text-[#ea580c] uppercase tracking-widest bg-[#fff7ed] px-2 py-1 rounded border border-[#ffedd5] print:hidden">
          <CheckCircle className="h-3 w-3" />
          <span>Printed {ticket.printed_count}x</span>
        </div>
      )}
    </div>
  );
});

TicketCard.displayName = 'TicketCard';
