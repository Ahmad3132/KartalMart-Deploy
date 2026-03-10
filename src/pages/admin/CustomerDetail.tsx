import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { maskMobile, formatDate, formatPKR } from '../../utils/api';
import { QRCodeSVG } from 'qrcode.react';

export default function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<any>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('kartal_token');
  const h = { 'Authorization': `Bearer ${token}` };

  useEffect(() => {
    Promise.all([
      fetch(`/api/customers/${id}`, { headers: h }).then(r => r.json()),
      fetch(`/api/customers/${id}/tickets`, { headers: h }).then(r => r.json()),
      fetch(`/api/customers/${id}/transactions`, { headers: h }).then(r => r.json()),
    ]).then(([c, t, tx]) => {
      setCustomer(c);
      setTickets(Array.isArray(t) ? t : []);
      setTransactions(Array.isArray(tx) ? tx : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><div className="spinner" /></div>;
  if (!customer) return <div className="alert alert-error">Customer not found.</div>;

  return (
    <div>
      <button className="btn btn-ghost btn-sm" onClick={() => navigate('/admin/customers')} style={{ marginBottom: '20px' }}>← Back to Customers</button>

      <div className="grid-2" style={{ marginBottom: '24px' }}>
        <div className="card" style={{ padding: '28px' }}>
          <h2 style={{ fontFamily: 'Syne', fontSize: '22px', fontWeight: '800', marginBottom: '16px' }}>{customer.name}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', width: '80px' }}>Mobile</span>
              <span style={{ fontFamily: 'monospace' }}>{customer.mobile}</span>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', width: '80px' }}>Address</span>
              <span>{customer.address || '—'}</span>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', width: '80px' }}>Tickets</span>
              <span style={{ color: 'var(--accent)', fontWeight: '700' }}>{tickets.length}</span>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '28px' }}>
          <h3 style={{ fontFamily: 'Syne', fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>Transaction History</h3>
          {transactions.length === 0 ? <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No transactions.</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {transactions.map(tx => (
                <div key={tx.id} style={{ padding: '10px', background: 'var(--bg-elevated)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--text-muted)' }}>{tx.tx_id}</div>
                    <div style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{formatPKR(tx.amount)}</div>
                  </div>
                  <span className={`badge badge-${tx.status?.toLowerCase()}`}>{tx.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card" style={{ padding: '24px' }}>
        <h3 style={{ fontFamily: 'Syne', fontSize: '15px', fontWeight: '700', marginBottom: '20px' }}>Tickets ({tickets.length})</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '16px' }}>
          {tickets.map(t => (
            <div key={t.id} style={{ background: 'var(--bg-elevated)', borderRadius: '12px', padding: '16px', textAlign: 'center', border: '1px solid var(--border)' }}>
              <QRCodeSVG value={t.ticket_id} size={80} style={{ marginBottom: '8px' }} />
              <div style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: '700', color: 'var(--accent)' }}>{t.ticket_id}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{formatDate(t.created_at)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
