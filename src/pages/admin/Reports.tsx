import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { maskMobile, formatDate, formatPKR } from '../../utils/api';

export default function Reports() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [userStats, setUserStats] = useState<any[]>([]);
  const [activeView, setActiveView] = useState<'all' | 'user-stats'>('all');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('kartal_token');
  const limit = 20;

  const fetchTickets = async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) params.append('search', search);
    if (dateFrom) params.append('startDate', dateFrom);
    if (dateTo) params.append('endDate', dateTo);
    try {
      const res = await fetch(`/api/tickets?${params}`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      setTickets(Array.isArray(data.tickets) ? data.tickets : []);
      setTotalCount(data.totalCount || 0);
    } catch { setTickets([]); }
    setLoading(false);
  };

  const fetchUserStats = async () => {
    try {
      const res = await fetch('/api/reports/user-stats', { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      setUserStats(Array.isArray(data.stats) ? data.stats : []);
    } catch { setUserStats([]); }
  };

  useEffect(() => { fetchTickets(); }, [page, search, dateFrom, dateTo]);
  useEffect(() => { fetchUserStats(); }, []);

  const exportCSV = () => {
    const rows = [['Ticket ID', 'Customer', 'Mobile', 'TX ID', 'Date', 'Printed'].join(',')];
    tickets.forEach(t => rows.push([t.ticket_id, t.name, t.mobile, t.tx_id, t.date, t.printed_count].join(',')));
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'kartal-report.csv'; a.click();
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Reports</h1>
          <p>View all tickets and user performance stats.</p>
        </div>
        <button className="btn btn-ghost" onClick={exportCSV}>↓ Export CSV</button>
      </div>

      {/* View Toggle */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {[['all', 'All Tickets'], ['user-stats', 'User Stats']].map(([v, label]) => (
          <button key={v} className={`btn ${activeView === v ? 'btn-primary' : 'btn-ghost'} btn-sm`} onClick={() => setActiveView(v as any)}>
            {label}
          </button>
        ))}
      </div>

      {activeView === 'all' && (
        <>
          {/* Filters */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <input className="input" placeholder="Search ticket ID, name, TX ID..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} style={{ flex: 1, minWidth: '200px' }} />
            <input className="input" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ width: '160px' }} />
            <input className="input" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ width: '160px' }} />
          </div>

          {/* Stats row */}
          <div className="grid-4" style={{ marginBottom: '24px' }}>
            {[
              { label: 'Total Tickets', value: totalCount },
              { label: 'Printed', value: tickets.filter(t => t.printed_count > 0).length },
              { label: 'Unprinted', value: tickets.filter(t => t.printed_count === 0).length },
              { label: 'Reprinted', value: tickets.filter(t => t.printed_count > 1).length },
            ].map((s, i) => (
              <div key={i} className="stat-card">
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>{s.label}</div>
                <div style={{ fontSize: '28px', fontFamily: 'Syne', fontWeight: '800', color: 'var(--text-primary)' }}>{s.value}</div>
              </div>
            ))}
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><div className="spinner" /></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Ticket ID</th><th>Customer</th><th>Mobile</th><th>TX ID</th><th>Date</th><th>Printed</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map(t => (
                    <tr key={t.id}>
                      <td><span style={{ fontFamily: 'monospace', color: 'var(--accent)', fontWeight: '700' }}>{t.ticket_id}</span></td>
                      <td style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{t.name}</td>
                      <td>{maskMobile(t.mobile, true)}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: '11px' }}>{t.tx_id}</td>
                      <td>{formatDate(t.date)}</td>
                      <td>{t.printed_count > 0 ? <span className="badge badge-approved">{t.printed_count}×</span> : <span className="badge badge-inactive">No</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Showing {tickets.length} of {totalCount}</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
              <button className="btn btn-ghost btn-sm" disabled={page >= Math.ceil(totalCount / limit)} onClick={() => setPage(p => p + 1)}>Next →</button>
            </div>
          </div>
        </>
      )}

      {activeView === 'user-stats' && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>User</th><th>Today Tickets</th><th>Month Tickets</th><th>Today Revenue</th><th>Month Revenue</th></tr>
            </thead>
            <tbody>
              {userStats.map(u => (
                <tr key={u.email}>
                  <td>
                    <div style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{u.name || u.nick_name || '—'}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{u.email}</div>
                  </td>
                  <td style={{ color: 'var(--info)', fontWeight: '700' }}>{u.today_count || 0}</td>
                  <td style={{ color: 'var(--accent)', fontWeight: '700' }}>{u.month_count || 0}</td>
                  <td>{formatPKR(u.today_revenue || 0)}</td>
                  <td>{formatPKR(u.month_revenue || 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
