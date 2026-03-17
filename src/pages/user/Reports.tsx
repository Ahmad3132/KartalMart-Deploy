import React, { useState, useEffect } from 'react';
import { maskMobile, formatDate, formatPKR } from '../../utils/api';

export default function UserReports() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const token = localStorage.getItem('kartal_token');

  useEffect(() => {
    fetch('/api/tickets?limit=200', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(r => r.json()).then(d => setTickets(Array.isArray(d.tickets) ? d.tickets : [])).catch(() => setTickets([])).finally(() => setLoading(false));
  }, []);

  const filtered = tickets.filter(t => !search || t.ticket_id?.toLowerCase().includes(search.toLowerCase()) || t.name?.toLowerCase().includes(search.toLowerCase()));

  const stats = [
    { label: 'Total Tickets', value: tickets.length },
    { label: 'Printed', value: tickets.filter(t => t.printed_count > 0).length },
    { label: 'Not Printed', value: tickets.filter(t => t.printed_count === 0).length },
  ];

  return (
    <div>
      <div className="page-header"><h1>My Reports</h1><p>Your ticket generation history.</p></div>

      <div className="grid-3" style={{ marginBottom: '24px' }}>
        {stats.map((s, i) => (
          <div key={i} className="stat-card">
            <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px' }}>{s.label}</div>
            <div style={{ fontSize: '32px', fontFamily: 'Syne', fontWeight: '800', color: 'var(--text-primary)' }}>{s.value}</div>
          </div>
        ))}
      </div>

      <input className="input" placeholder="Search ticket ID or customer..." value={search} onChange={e => setSearch(e.target.value)} style={{ marginBottom: '20px' }} />

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><div className="spinner" /></div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Ticket ID</th><th>Customer</th><th>Mobile</th><th>Date</th><th>Printed</th></tr></thead>
            <tbody>
              {filtered.map(t => (
                <tr key={t.id}>
                  <td><span style={{ fontFamily: 'monospace', color: 'var(--accent)', fontWeight: '700' }}>{t.ticket_id}</span></td>
                  <td style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{t.name}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{maskMobile(t.mobile, false)}</td>
                  <td style={{ fontSize: '12px' }}>{formatDate(t.created_at)}</td>
                  <td>{t.printed_count > 0 ? <span className="badge badge-approved">{t.printed_count}×</span> : <span className="badge badge-inactive">No</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
