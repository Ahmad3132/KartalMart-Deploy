import React, { useState, useEffect } from 'react';
import { formatPKR, formatDate } from '../../utils/api';

export default function PendingApprovals() {
  const [pending, setPending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState<{[id: number]: string}>({});
  const [showRejectFor, setShowRejectFor] = useState<number | null>(null);
  const [message, setMessage] = useState<{type: string, text: string} | null>(null);

  const token = localStorage.getItem('kartal_token');
  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  const fetchPending = async () => {
    try {
      const res = await fetch('/api/transactions/pending', { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      setPending(Array.isArray(data) ? data : []);
    } catch { setPending([]); } finally { setLoading(false); }
  };

  useEffect(() => { fetchPending(); }, []);

  const approve = async (id: number) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/transactions/${id}/approve`, { method: 'PUT', headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage({ type: 'success', text: 'Transaction approved and tickets generated.' });
      fetchPending();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally { setActionLoading(null); }
  };

  const reject = async (id: number) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/transactions/${id}/reject`, {
        method: 'PUT', headers,
        body: JSON.stringify({ reason: rejectReason[id] || 'Rejected by admin' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage({ type: 'success', text: 'Transaction rejected.' });
      setShowRejectFor(null);
      fetchPending();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally { setActionLoading(null); }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Pending Approvals</h1>
        <p>Review, approve or reject transactions awaiting action.</p>
      </div>

      {message && (
        <div className={`alert alert-${message.type === 'success' ? 'success' : 'error'}`} style={{ marginBottom: '24px' }}>
          {message.text}
          <button onClick={() => setMessage(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>✕</button>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><div className="spinner" /></div>
      ) : pending.length === 0 ? (
        <div className="card" style={{ padding: '60px', textAlign: 'center' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>✓</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>All caught up — no pending approvals</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {pending.map(tx => (
            <div key={tx.id} className="card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <span className="badge badge-pending">Pending</span>
                    {tx.is_multi_person === 1 && <span className="badge" style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: '1px solid rgba(108,99,255,0.2)' }}>Multi-Person</span>}
                    <span style={{ fontFamily: 'monospace', fontSize: '13px', color: 'var(--text-primary)', fontWeight: '600' }}>{tx.tx_id}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '8px' }}>
                    {[
                      ['User', tx.user_email],
                      ['Amount', formatPKR(tx.amount)],
                      ['Tickets', tx.ticket_count],
                      ['Payment', tx.payment_type],
                      ['Date', formatDate(tx.date)],
                      tx.name && ['Customer', tx.name],
                    ].filter(Boolean).map(([k, v]: any) => (
                      <div key={k}>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{k}</span>
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>{v}</div>
                      </div>
                    ))}
                  </div>
                  {tx.receipt_url && (
                    <a href={tx.receipt_url} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '12px', fontSize: '12px', color: 'var(--accent)', textDecoration: 'none', fontWeight: '600' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                      View Receipt
                    </a>
                  )}
                  {showRejectFor === tx.id && (
                    <div style={{ marginTop: '16px', padding: '12px', background: 'var(--bg-elevated)', borderRadius: '10px', border: '1px solid var(--border)' }}>
                      <label className="label">Rejection Reason (optional)</label>
                      <input className="input" placeholder="e.g. Invalid receipt" value={rejectReason[tx.id] || ''} onChange={e => setRejectReason(r => ({ ...r, [tx.id]: e.target.value }))} />
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '160px' }}>
                  <button className="btn btn-success btn-sm" onClick={() => approve(tx.id)} disabled={actionLoading === tx.id}>
                    {actionLoading === tx.id ? <span className="spinner" style={{ width: '14px', height: '14px' }} /> : '✓ Approve'}
                  </button>
                  {showRejectFor === tx.id ? (
                    <button className="btn btn-danger btn-sm" onClick={() => reject(tx.id)} disabled={actionLoading === tx.id}>
                      Confirm Reject
                    </button>
                  ) : (
                    <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={() => setShowRejectFor(tx.id)}>
                      ✕ Reject
                    </button>
                  )}
                  {showRejectFor === tx.id && (
                    <button className="btn btn-ghost btn-sm" onClick={() => setShowRejectFor(null)}>Cancel</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
