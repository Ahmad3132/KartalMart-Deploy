import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { formatPKR } from '../../utils/api';
import { useNavigate } from 'react-router-dom';

export default function UserDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>({});
  const [recent, setRecent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('kartal_token');

  useEffect(() => {
    Promise.all([
      fetch('/api/dashboard/user-stats', { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json()).catch(() => ({})),
      fetch('/api/tickets?limit=5', { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json()).catch(() => ({ tickets: [] })),
    ]).then(([s, t]) => {
      setStats(s);
      setRecent(Array.isArray(t.tickets) ? t.tickets.slice(0, 5) : []);
      setLoading(false);
    });
  }, []);

  const cards = [
    { label: 'My Tickets Today', value: stats.todayTickets || 0, icon: '🎟️' },
    { label: 'My Tickets This Month', value: stats.monthTickets || 0, icon: '📅' },
    { label: "Today's Revenue", value: formatPKR(stats.todayRevenue || 0), icon: '💰', isText: true },
    { label: "Month's Revenue", value: formatPKR(stats.monthRevenue || 0), icon: '📈', isText: true },
  ];

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}><div className="spinner" style={{ width: '36px', height: '36px', borderWidth: '3px' }} /></div>;

  return (
    <div>
      <div className="page-header">
        <h1>Hello, {user?.name || user?.nick_name || 'there'} 👋</h1>
        <p>Your activity summary for today.</p>
      </div>

      <div className="grid-4" style={{ marginBottom: '32px' }}>
        {cards.map((c, i) => (
          <div key={i} className="stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px' }}>{c.label}</div>
                <div style={{ fontSize: c.isText ? '18px' : '32px', fontFamily: 'Syne', fontWeight: '800', color: 'var(--text-primary)' }}>{c.value}</div>
              </div>
              <div style={{ fontSize: '24px', opacity: 0.7 }}>{c.icon}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid-2">
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontFamily: 'Syne', fontSize: '15px', fontWeight: '700' }}>Recent Tickets</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/user/tickets')}>View all →</button>
          </div>
          {recent.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)', fontSize: '13px' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>🎟️</div>
              No tickets yet. Generate your first one!
            </div>
          ) : recent.map((t, i) => (
            <div key={i} style={{ padding: '12px', background: 'var(--bg-elevated)', borderRadius: '8px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: '700', fontSize: '13px', color: 'var(--accent)', fontFamily: 'monospace' }}>{t.ticket_id}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{t.name}</div>
              </div>
              <span className={`badge ${t.printed_count > 0 ? 'badge-approved' : 'badge-inactive'}`}>{t.printed_count > 0 ? 'Printed' : 'New'}</span>
            </div>
          ))}
        </div>

        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontFamily: 'Syne', fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>Quick Actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button className="btn btn-primary btn-full" onClick={() => navigate('/user/generate')}>+ Generate New Ticket</button>
            <button className="btn btn-ghost btn-full" onClick={() => navigate('/user/bulk-print')}>🖨 Bulk Print Tickets</button>
            <button className="btn btn-ghost btn-full" onClick={() => navigate('/user/scanner')}>📷 Scan QR Code</button>
          </div>
        </div>
      </div>
    </div>
  );
}
