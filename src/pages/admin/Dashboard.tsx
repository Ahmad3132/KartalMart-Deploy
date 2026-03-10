import React, { useEffect, useState } from 'react';
import { formatPKR } from '../../utils/api';

interface Stats { activeCampaign: string; ticketsToday: number; ticketsMonth: number; pendingApprovals: number; totalRevenue: number; totalUsers: number; }

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/stats/admin', { headers: { 'Authorization': `Bearer ${localStorage.getItem('kartal_token')}` } })
      .then(r => r.json()).then(setStats).catch(() => setError('Failed to load stats')).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}><div className="spinner" /></div>;
  if (error) return <div className="alert alert-error">{error}</div>;

  const statCards = [
    { label: 'Active Campaign', value: stats?.activeCampaign || 'None', accent: 'var(--accent)', icon: 'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z' },
    { label: 'Tickets Today', value: stats?.ticketsToday || 0, accent: 'var(--info)', icon: 'M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z' },
    { label: 'Tickets This Month', value: stats?.ticketsMonth || 0, accent: 'var(--success)', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { label: 'Pending Approvals', value: stats?.pendingApprovals || 0, accent: 'var(--warning)', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
    { label: 'Total Revenue', value: formatPKR(stats?.totalRevenue || 0), accent: 'var(--success)', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { label: 'Total Staff', value: stats?.totalUsers || 0, accent: 'var(--accent)', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
  ];

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Welcome back. Here's what's happening today.</p>
      </div>

      <div className="grid-3" style={{ marginBottom: '32px' }}>
        {statCards.map((s, i) => (
          <div key={i} className="stat-card" style={{ '--accent': s.accent } as any}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>{s.label}</div>
                <div style={{ fontSize: '28px', fontFamily: 'Syne', fontWeight: '800', color: 'var(--text-primary)' }}>{s.value}</div>
              </div>
              <div style={{ width: '40px', height: '40px', background: `${s.accent}20`, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={s.accent} strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d={s.icon}/>
                </svg>
              </div>
            </div>
          </div>
        ))}
      </div>

      {(stats?.pendingApprovals || 0) > 0 && (
        <div className="alert alert-warning" style={{ marginBottom: '24px' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
          <strong>{stats?.pendingApprovals} transaction(s)</strong> are waiting for your approval.
          <a href="/admin/approvals" style={{ color: 'var(--warning)', fontWeight: '600', marginLeft: '8px', textDecoration: 'underline' }}>Review now →</a>
        </div>
      )}
    </div>
  );
}
