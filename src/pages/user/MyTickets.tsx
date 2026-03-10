import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { maskMobile, formatDate } from '../../utils/api';
import { QRCodeSVG } from 'qrcode.react';
import { useSearchParams } from 'react-router-dom';

export default function MyTickets() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<any[]>([]);
  const [txs, setTxs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchParams] = useSearchParams();
  const successTxId = searchParams.get('success');
  const token = localStorage.getItem('kartal_token');
  const isAdmin = user?.role === 'Admin';

  useEffect(() => {
    if (!user) return;
    const h = { 'Authorization': `Bearer ${token}` };
    Promise.all([
      fetch(`/api/tickets/user/${user.email}`, { headers: h }).then(r => r.json()).catch(() => []),
      fetch(`/api/transactions/user/${user.email}`, { headers: h }).then(r => r.json()).catch(() => []),
    ]).then(([t, tx]) => {
      setTickets(Array.isArray(t) ? t : []);
      setTxs(Array.isArray(tx) ? tx : []);
    }).finally(() => setLoading(false));
  }, [user]);

  const filtered = tickets.filter(t =>
    !search || t.ticket_id?.toLowerCase().includes(search.toLowerCase()) || t.name?.toLowerCase().includes(search.toLowerCase())
  );

  const printTicket = async (ticket: any) => {
    await fetch(`/api/tickets/${ticket.id}/print`, {
      method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_email: user?.email, role: user?.role })
    });
    window.print();
  };

  return (
    <div>
      <div className="page-header">
        <h1>My Tickets</h1>
        <p>{tickets.length} total tickets generated</p>
      </div>

      {successTxId && (
        <div className="alert alert-success" style={{ marginBottom: '24px' }}>
          ✓ Transaction <strong>{successTxId}</strong> completed successfully. Tickets generated below.
        </div>
      )}

      {/* Pending transactions notice */}
      {txs.filter(t => t.status === 'Pending').length > 0 && (
        <div className="card" style={{ padding: '20px', marginBottom: '24px', borderColor: 'rgba(245,158,11,0.3)' }}>
          <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--warning)', marginBottom: '12px' }}>Pending Approval</div>
          {txs.filter(t => t.status === 'Pending').map(tx => (
            <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: '13px' }}>
              <span style={{ fontFamily: 'monospace', color: 'var(--text-primary)' }}>{tx.tx_id}</span>
              <span className="badge badge-pending">Pending</span>
            </div>
          ))}
          {txs.filter(t => t.status === 'Rejected').map(tx => (
            <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: '13px' }}>
              <span style={{ fontFamily: 'monospace', color: 'var(--text-primary)' }}>{tx.tx_id}</span>
              <span className="badge badge-rejected">Rejected</span>
            </div>
          ))}
        </div>
      )}

      <input className="input" placeholder="Search by ticket ID or name..." value={search} onChange={e => setSearch(e.target.value)} style={{ marginBottom: '20px' }} />

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>No tickets found</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {filtered.map(ticket => (
            <div key={ticket.id} className="card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontFamily: 'Syne', fontWeight: '800', fontSize: '20px', color: 'var(--accent)', letterSpacing: '0.04em' }}>{ticket.ticket_id}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{formatDate(ticket.date)}</div>
                </div>
                <QRCodeSVG value={ticket.ticket_id} size={56} bgColor="transparent" fgColor="var(--text-primary)" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
                <div style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{ticket.name}</div>
                <div style={{ color: 'var(--text-secondary)' }}>{maskMobile(ticket.mobile, isAdmin)}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{ticket.address}</div>
              </div>
              <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: ticket.printed_count > 0 ? 'var(--success)' : 'var(--text-muted)' }}>
                  {ticket.printed_count > 0 ? `Printed ${ticket.printed_count}×` : 'Not printed'}
                </span>
                <button className="btn btn-ghost btn-sm" onClick={() => printTicket(ticket)} disabled={ticket.printed_count > 0 && !isAdmin}>
                  Print
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
