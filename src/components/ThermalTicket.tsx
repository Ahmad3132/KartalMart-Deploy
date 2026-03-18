import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import kartalLogo from '../assets/kartal-logo.png';

interface ThermalTicketProps {
  ticket: any;
  showFullMobile?: boolean; // admin sees full, user sees masked
  showQR?: boolean; // whether to show QR code section
}

// 80mm thermal paper = ~302px at 96dpi, printable width ~72mm = ~272px
export const ThermalTicket = React.forwardRef<HTMLDivElement, ThermalTicketProps>(
  ({ ticket, showFullMobile = false, showQR = true }, ref) => {
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
          padding: '3mm 3mm 4mm 3mm',
          boxSizing: 'border-box',
          margin: '0 auto',
        }}
      >
        {/* ---- HEADER: Logo left, Company name right ---- */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #000', paddingBottom: '2mm', marginBottom: '2mm' }}>
          <img
            src={kartalLogo}
            alt="Kartal"
            style={{ width: '16mm', height: '12mm', objectFit: 'contain' }}
          />
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '14px', fontWeight: 900, letterSpacing: '2px', fontFamily: 'serif', lineHeight: 1.1 }}>
              KARTAL
            </div>
            <div style={{ fontSize: '7px', letterSpacing: '1.5px', marginTop: '1px' }}>
              GROUP OF COMPANIES
            </div>
          </div>
        </div>

        {/* ---- TICKET ID (big) ---- */}
        <div style={{ textAlign: 'center', margin: '1.5mm 0', background: '#000', color: '#fff', padding: '1.5mm', borderRadius: '1mm' }}>
          <div style={{ fontSize: '7px', letterSpacing: '2px' }}>TICKET NUMBER</div>
          <div style={{ fontSize: '20px', fontWeight: 900, letterSpacing: '3px', lineHeight: 1.1 }}>
            {ticket.ticket_id}
          </div>
        </div>

        {/* ---- CUSTOMER INFO ---- */}
        <div style={{ borderTop: '1px dashed #000', borderBottom: '1px dashed #000', padding: '1.5mm 0', margin: '1.5mm 0' }}>
          <Row label="Name" value={ticket.name} bold />
          <Row label="Mobile" value={mobile} />
          <Row label="Address" value={ticket.address || 'N/A'} small />
        </div>

        {/* ---- TRANSACTION INFO ---- */}
        <div style={{ padding: '1mm 0', marginBottom: '1.5mm' }}>
          <Row label="TX ID" value={ticket.tx_id} mono />
          <Row label="Date" value={`${date}  ${time}`} />
          <Row label="Ticket" value={`${ticket.person_ticket_index} of ${ticket.total_tickets_in_tx}`} />
          <Row label="Agent" value={ticket.generated_by_nick || ticket.generated_by} small />
        </div>

        {/* ---- QR CODE (conditional) ---- */}
        {showQR && (
          <div style={{ textAlign: 'center', margin: '1.5mm 0' }}>
            <div style={{ display: 'inline-block', border: '1px solid #000', padding: '1.5mm' }}>
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
                fgColor="#000000"
                bgColor="#ffffff"
              />
            </div>
            {/* Urdu text */}
            <div style={{ fontSize: '9px', marginTop: '1.5mm', fontFamily: 'Noto Nastaliq Urdu, serif', direction: 'rtl', lineHeight: 1.6 }}>
              تصدیق کے لیے اسکین کریں
            </div>
          </div>
        )}
      </div>
    );
  }
);

// Helper row component
function Row({ label, value, bold, mono, small }: {
  label: string; value: string; bold?: boolean; mono?: boolean; small?: boolean;
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5mm', gap: '2mm' }}>
      <span style={{ minWidth: '14mm', fontSize: small ? '8px' : '9px', color: '#555', flexShrink: 0 }}>
        {label}:
      </span>
      <span style={{
        fontSize: small ? '8px' : '10px',
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
