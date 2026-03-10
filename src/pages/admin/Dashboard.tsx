import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { formatPKR } from '../../utils/api';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>({});
  const [pending, setPending] = useState<any[]>([]);
  const [recent, setRecent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('kartal_token');
  const h = { 'Authorization': `Bearer ${token}` };

  useEffect(() => {
    Promise.all([
      fetch('/api/dashboard/stats', { headers: h }).then(r => r.json()).catch(() => ({})),
      fetch('/api/transactions/pending', { headers: h }).then(r => r.json()).catch(() => []),
      fetch('/api/tickets?limit=5', { headers: h }).then(r => r.json()).catch(() => ({ tickets: [] })),
    ]).then(([s, p, t]) => {
      setStats(s);
      setPending(Array.isArray(p) ? p.slice(0, 3) : []);
      setRecent(Array.isArray(t.tickets) ? t.tickets.slice(0, 5) : []);
      setLoading(false);
    });
  }, []);

  const statCards = [
    { label: 'Total Tickets', value: stats.totalTickets || 0, icon: '🎟️', color: 'var(--accent)' },
    { label: 'Today Tickets', value: stats.todayTickets || 0, icon: '📅', color: 'var(--info)' },
    { label: 'Total Revenue', value: formatPKR(stats.totalRevenue || 0), icon: '💰', color: 'var(--success)' },
    { label: 'Today Revenue', value: formatPKR(stats.todayRevenue || 0), icon: '📈', color: 'var(--warning)' },
    { label: 'Pending Approvals', value: stats.pendingCount || 0, icon: '⏳', color: 'var(--danger)', alert: true },
    { label: 'Active Campaign', value: stats.activeCampaign || '—', icon: '🏆', color: 'var(--accent)', isText: true },
  ];

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
      <div className="spinner" style={{ width: '36px', height: '36px', borderWidth: '3px' }} />
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <h1>Welcome back, {user?.name || user?.nick_name || 'Admin'} 👋</h1>
        <p>Here's what's happening with your lucky draw today.</p>
      </div>

      {(stats.pendingCount > 0) && (
        <div className="alert alert-warning" style={{ marginBottom: '24px', cursor: 'pointer' }} onClick={() => navigate('/admin/approvals')}>
          <span>⚠️</span>
          <span><strong>{stats.pendingCount} transaction{stats.pendingCount > 1 ? 's' : ''}</strong> waiting for your approval.</span>
          <span style={{ marginLeft: 'auto', color: 'var(--warning)', fontWeight: '600' }}>Review →</span>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid-3" style={{ marginBottom: '32px' }}>
        {statCards.map((s, i) => (
          <div key={i} className="stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px' }}>{s.label}</div>
                <div style={{ fontSize: s.isText ? '18px' : '32px', fontFamily: 'Syne', fontWeight: '800', color: s.alert && s.value > 0 ? 'var(--danger)' : 'var(--text-primary)' }}>
                  {s.value}
                </div>
              </div>
              <div style={{ fontSize: '28px', opacity: 0.7 }}>{s.icon}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid-2">
        {/* Pending Approvals */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontFamily: 'Syne', fontSize: '15px', fontWeight: '700' }}>Pending Approvals</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/admin/approvals')}>View all →</button>
          </div>
          {pending.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)', fontSize: '13px' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>✅</div>
              All clear! No pending approvals.
            </div>
          ) : pending.map((tx, i) => (
            <div key={i} style={{ padding: '12px', background: 'var(--bg-elevated)', borderRadius: '8px', marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ fontWeight: '600', fontSize: '13px', color: 'var(--text-primary)' }}>{tx.customer_name}</div>
                <div style={{ fontWeight: '700', color: 'var(--accent)', fontSize: '13px' }}>PKR {Number(tx.amount).toLocaleString()}</div>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>TX: {tx.tx_id}</div>
            </div>
          ))}
        </div>

        {/* Recent Tickets */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontFamily: 'Syne', fontSize: '15px', fontWeight: '700' }}>Recent Tickets</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/admin/tickets')}>View all →</button>
          </div>
          {recent.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)', fontSize: '13px' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>🎟️</div>
              No tickets generated yet.
            </div>
          ) : recent.map((t, i) => (
            <div key={i} style={{ padding: '12px', background: 'var(--bg-elevated)', borderRadius: '8px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: '600', fontSize: '13px', color: 'var(--accent)', fontFamily: 'monospace' }}>{t.ticket_id}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{t.name}</div>
              </div>
              <span className={`badge ${t.printed_count > 0 ? 'badge-approved' : 'badge-inactive'}`}>
                {t.printed_count > 0 ? 'Printed' : 'New'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
