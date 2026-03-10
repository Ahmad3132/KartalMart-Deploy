import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { formatPKR } from '../../utils/api';
import { Link } from 'react-router-dom';

export default function UserDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [campaign, setCampaign] = useState<any>(null);
  const [pending, setPending] = useState<any[]>([]);
  const token = localStorage.getItem('kartal_token');
  const h = { 'Authorization': `Bearer ${token}` };

  useEffect(() => {
    if (!user) return;
    Promise.all([
      fetch(`/api/stats/user/${user.email}`, { headers: h }).then(r => r.json()).catch(() => null),
      fetch('/api/campaigns/active', { headers: h }).then(r => r.json()).catch(() => null),
      fetch(`/api/transactions/user/${user.email}`, { headers: h }).then(r => r.json()).catch(() => []),
    ]).then(([s, c, txs]) => {
      setStats(s);
      setCampaign(c);
      setPending(Array.isArray(txs) ? txs.filter((t: any) => t.status === 'Pending') : []);
    });
  }, [user]);

  return (
    <div>
      <div className="page-header">
        <h1>Welcome, {user?.name || user?.nick_name || 'Staff'}</h1>
        <p>{campaign ? <>Active: <strong style={{ color: 'var(--accent)' }}>{campaign.name}</strong></> : 'No active campaign'}</p>
      </div>

      {pending.length > 0 && (
        <div className="alert alert-warning" style={{ marginBottom: '24px' }}>
          You have <strong>{pending.length}</strong> pending transaction(s) awaiting admin approval.
        </div>
      )}

      <div className="grid-2" style={{ marginBottom: '32px' }}>
        {[
          { label: 'Tickets Today', value: stats?.ticketsToday || 0, color: 'var(--info)' },
          { label: 'Tickets This Month', value: stats?.ticketsMonth || 0, color: 'var(--accent)' },
          { label: 'Pending Transactions', value: stats?.pendingTxs || 0, color: 'var(--warning)' },
          { label: 'Completed Transactions', value: stats?.approvedTxs || 0, color: 'var(--success)' },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>{s.label}</div>
            <div style={{ fontSize: '32px', fontFamily: 'Syne', fontWeight: '800', color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '16px' }}>
        <Link to="/user/generate" className="btn btn-primary btn-lg">+ Generate New Ticket</Link>
        <Link to="/user/tickets" className="btn btn-ghost btn-lg">View My Tickets</Link>
      </div>
    </div>
  );
}
