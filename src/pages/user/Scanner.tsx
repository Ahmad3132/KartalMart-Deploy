import React, { useState } from 'react';
import { formatDate } from '../../utils/api';

export default function Scanner() {
  const [ticketId, setTicketId] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const token = localStorage.getItem('kartal_token');

  const lookup = async () => {
    if (!ticketId.trim()) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await fetch(`/api/tickets/lookup/${ticketId.trim()}`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (!res.ok) { setError('Ticket not found.'); } else { setResult(await res.json()); }
    } catch { setError('Error looking up ticket.'); }
    setLoading(false);
  };

  return (
    <div>
      <div className="page-header"><h1>Scanner</h1><p>Look up a ticket by ID or scan a QR code.</p></div>

      <div className="card" style={{ padding: '32px', maxWidth: '480px' }}>
        <label className="label">Ticket ID</label>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input className="input" value={ticketId} onChange={e => setTicketId(e.target.value)} placeholder="e.g. KRT-00001" onKeyDown={e => e.key === 'Enter' && lookup()} />
          <button className="btn btn-primary" onClick={lookup} disabled={loading}>
            {loading ? <span className="spinner" /> : 'Search'}
          </button>
        </div>

        {error && <div className="alert alert-error" style={{ marginTop: '16px' }}>{error}</div>}

        {result && (
          <div style={{ marginTop: '20px', background: 'var(--bg-elevated)', borderRadius: '12px', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontFamily: 'monospace', fontSize: '18px', fontWeight: '800', color: 'var(--accent)' }}>{result.ticket_id}</span>
              <span className="badge badge-approved">Valid</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <span style={{ color: 'var(--text-muted)', width: '80px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Name</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{result.name}</span>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <span style={{ color: 'var(--text-muted)', width: '80px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Mobile</span>
                <span style={{ fontFamily: 'monospace' }}>{result.mobile}</span>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <span style={{ color: 'var(--text-muted)', width: '80px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Created</span>
                <span>{formatDate(result.created_at)}</span>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <span style={{ color: 'var(--text-muted)', width: '80px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Printed</span>
                <span>{result.printed_count > 0 ? `${result.printed_count} time(s)` : 'Not yet'}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
