import React, { useState, useEffect } from 'react';
import { maskMobile, formatDate } from '../../utils/api';
import { QRCodeSVG } from 'qrcode.react';

export default function MyTickets() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const token = localStorage.getItem('kartal_token');

  useEffect(() => {
    fetch('/api/tickets?limit=200', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(r => r.json()).then(d => setTickets(Array.isArray(d.tickets) ? d.tickets : [])).catch(() => setTickets([])).finally(() => setLoading(false));
  }, []);

  const filtered = tickets.filter(t =>
    !search || t.ticket_id?.toLowerCase().includes(search.toLowerCase()) || t.name?.toLowerCase().includes(search.toLowerCase())
  );

  const printTicket = (t: any) => {
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<html><body style="font-family:monospace;text-align:center;padding:20px">
      <h2 style="font-size:14px">KARTAL Lucky Draw</h2>
      <p style="font-size:24px;font-weight:bold">${t.ticket_id}</p>
      <p>${t.name}</p>
      <p>${maskMobile(t.mobile, false)}</p>
      <script>window.print();window.close();</script>
    </body></html>`);
    w.document.close();
  };

  return (
    <div>
      <div className="page-header"><h1>My Tickets</h1><p>All tickets you have generated.</p></div>
      <input className="input" placeholder="Search by ticket ID or customer name..." value={search} onChange={e => setSearch(e.target.value)} style={{ marginBottom: '20px' }} />

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><div className="spinner" /></div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Ticket ID</th><th>Customer</th><th>Mobile</th><th>Date</th><th>Printed</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.map(t => (
                <tr key={t.id}>
                  <td><span style={{ fontFamily: 'monospace', color: 'var(--accent)', fontWeight: '700', fontSize: '13px' }}>{t.ticket_id}</span></td>
                  <td style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{t.name}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{maskMobile(t.mobile, false)}</td>
                  <td style={{ fontSize: '12px' }}>{formatDate(t.created_at)}</td>
                  <td>{t.printed_count > 0 ? <span className="badge badge-approved">{t.printed_count}×</span> : <span className="badge badge-inactive">No</span>}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => setSelected(t)}>QR</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => printTicket(t)}>Print</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={() => setSelected(null)}>
          <div className="card" style={{ padding: '32px', textAlign: 'center', maxWidth: '280px' }} onClick={e => e.stopPropagation()}>
            <QRCodeSVG value={selected.ticket_id} size={180} />
            <div style={{ fontFamily: 'monospace', fontSize: '18px', fontWeight: '800', color: 'var(--accent)', marginTop: '16px' }}>{selected.ticket_id}</div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>{selected.name}</div>
            <button className="btn btn-ghost btn-sm" style={{ marginTop: '16px' }} onClick={() => setSelected(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
