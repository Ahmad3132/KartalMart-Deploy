import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import kartalLogo from '../assets/kartal-logo.png';

interface ThermalTicketProps {
  ticket: any;
  showFullMobile?: boolean; // admin sees full, user sees masked
}

// 80mm thermal paper = ~302px at 96dpi, printable width ~72mm = ~272px
export const ThermalTicket = React.forwardRef<HTMLDivElement, ThermalTicketProps>(
  ({ ticket, showFullMobile = false }, ref) => {
    const mobile = showFullMobile
      ? ticket.mobile
      : ticket.mobile
      ? ticket.mobile.slice(0, -3) + '***'
      : '';

    const date = new Date(ticket.date).toLocaleDateString('en-PK', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
    const time = new Date(ticket.date).toLocaleTimeString('en-PK', {
      hour: '2-digit', minute: '2-digit', hour12: true
    });

    return (
      <div
        ref={ref}
        className="thermal-ticket"
        style={{
          width: '72mm',
          minWidth: '72mm',
          maxWidth: '72mm',
          background: '#fff',
          color: '#000',
          fontFamily: "'Courier New', Courier, monospace",
          fontSize: '11px',
          padding: '4mm 4mm 6mm 4mm',
          boxSizing: 'border-box',
          margin: '0 auto',
        }}
      >
        {/* ---- HEADER ---- */}
        <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: '3mm', marginBottom: '3mm' }}>
          <img
            src={kartalLogo}
            alt="Kartal"
            style={{ width: '14mm', height: '14mm', objectFit: 'contain', display: 'block', margin: '0 auto 1.5mm' }}
          />
          <div style={{ fontSize: '15px', fontWeight: 900, letterSpacing: '3px', fontFamily: 'serif' }}>
            KARTAL
          </div>
          <div style={{ fontSize: '8px', letterSpacing: '2px', marginTop: '1px' }}>
            GROUP OF COMPANIES
          </div>
          <div style={{ fontSize: '8px', marginTop: '2mm', letterSpacing: '1px', borderTop: '1px dashed #000', paddingTop: '2mm' }}>
            *** LUCKY DRAW TICKET ***
          </div>
        </div>

        {/* ---- TICKET ID (big) ---- */}
        <div style={{ textAlign: 'center', margin: '2mm 0', background: '#000', color: '#fff', padding: '2mm', borderRadius: '1mm' }}>
          <div style={{ fontSize: '8px', letterSpacing: '2px' }}>TICKET NUMBER</div>
          <div style={{ fontSize: '22px', fontWeight: 900, letterSpacing: '4px', lineHeight: 1.1 }}>
            {ticket.ticket_id}
          </div>
        </div>

        {/* ---- CUSTOMER INFO ---- */}
        <div style={{ borderTop: '1px dashed #000', borderBottom: '1px dashed #000', padding: '2.5mm 0', margin: '2mm 0' }}>
          <Row label="Name" value={ticket.name} bold />
          <Row label="Mobile" value={mobile} />
          <Row label="Address" value={ticket.address || 'N/A'} small />
        </div>

        {/* ---- TRANSACTION INFO ---- */}
        <div style={{ padding: '1.5mm 0', marginBottom: '2mm' }}>
          <Row label="TX ID" value={ticket.tx_id} mono />
          <Row label="Date" value={`${date}  ${time}`} />
          <Row label="Ticket" value={`${ticket.person_ticket_index} of ${ticket.total_tickets_in_tx}`} />
          <Row label="Agent" value={ticket.generated_by_nick || ticket.generated_by} small />
        </div>

        {/* ---- QR CODE ---- */}
        <div style={{ textAlign: 'center', margin: '2mm 0' }}>
          <div style={{ display: 'inline-block', border: '1px solid #000', padding: '2mm' }}>
            <QRCodeSVG
              value={JSON.stringify({
                id: ticket.ticket_id,
                name: ticket.name,
                tx: ticket.tx_id,
                gen: ticket.generation_id,
              })}
              size={110}
              level="H"
              includeMargin={false}
              fgColor="#000000"
              bgColor="#ffffff"
            />
          </div>
          {/* Urdu text */}
          <div style={{ fontSize: '10px', marginTop: '2mm', fontFamily: 'Noto Nastaliq Urdu, serif', direction: 'rtl', lineHeight: 1.6 }}>
            تصدیق کے لیے اسکین کریں
          </div>
        </div>

        {/* ---- FOOTER ---- */}
        <div style={{ borderTop: '2px solid #000', paddingTop: '2mm', textAlign: 'center' }}>
          <div style={{ fontSize: '8px', letterSpacing: '1px' }}>
            *** KEEP THIS TICKET SAFE ***
          </div>
          <div style={{ fontSize: '8px', marginTop: '1mm' }}>
            kartal.com.pk
          </div>
        </div>
      </div>
    );
  }
);

// Helper row component
function Row({ label, value, bold, mono, small }: {
  label: string; value: string; bold?: boolean; mono?: boolean; small?: boolean;
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1mm', gap: '2mm' }}>
      <span style={{ minWidth: '16mm', fontSize: small ? '9px' : '10px', color: '#555', flexShrink: 0 }}>
        {label}:
      </span>
      <span style={{
        fontSize: small ? '9px' : '11px',
        fontWeight: bold ? 900 : 600,
        fontFamily: mono ? "'Courier New', monospace" : 'inherit',
        textAlign: 'right',
        wordBreak: 'break-all',
      }}>
        {value}
      </span>
    </div>
  );
}

ThermalTicket.displayName = 'ThermalTicket';
