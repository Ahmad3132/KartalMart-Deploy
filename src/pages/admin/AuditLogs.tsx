import React, { useState, useEffect } from 'react';
import { formatDate } from '../../utils/api';

export default function AuditLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const token = localStorage.getItem('kartal_token');

  useEffect(() => {
    fetch('/api/audit-logs', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(r => r.json()).then(d => setLogs(Array.isArray(d) ? d : [])).catch(() => setLogs([])).finally(() => setLoading(false));
  }, []);

  const filtered = logs.filter(l => !search || l.action?.toLowerCase().includes(search.toLowerCase()) || l.user_email?.toLowerCase().includes(search.toLowerCase()) || l.details?.toLowerCase().includes(search.toLowerCase()));

  const actionColor = (action: string) => {
    if (action?.includes('Approve')) return 'var(--success)';
    if (action?.includes('Reject')) return 'var(--danger)';
    if (action?.includes('Print')) return 'var(--info)';
    if (action?.includes('Login')) return 'var(--accent)';
    return 'var(--text-muted)';
  };

  return (
    <div>
      <div className="page-header">
        <h1>Audit Logs</h1>
        <p>Every action taken in the system is recorded here.</p>
      </div>

      <input className="input" placeholder="Search by action, user or details..." value={search} onChange={e => setSearch(e.target.value)} style={{ marginBottom: '20px' }} />

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><div className="spinner" /></div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Action</th><th>User</th><th>Details</th><th>Time</th></tr>
            </thead>
            <tbody>
              {filtered.map(log => (
                <tr key={log.id}>
                  <td>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: actionColor(log.action), textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {log.action}
                    </span>
                  </td>
                  <td style={{ fontSize: '12px', fontFamily: 'monospace' }}>{log.nick_name || log.user_email}</td>
                  <td style={{ fontSize: '12px', color: 'var(--text-secondary)', maxWidth: '400px' }}>{log.details}</td>
                  <td style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>{formatDate(log.timestamp)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
