import React, { useEffect, useState } from 'react';
import { maskMobile, formatDate } from '../../utils/api';
import { QRCodeSVG } from 'qrcode.react';

export default function AllTickets() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [editTicket, setEditTicket] = useState<any>(null);
  const [editForm, setEditForm] = useState({ name: '', mobile: '', address: '' });
  const [saving, setSaving] = useState(false);
  const limit = 20;
  const token = localStorage.getItem('kartal_token');

  const fetchTickets = async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) params.append('search', search);
    if (statusFilter) params.append('status', statusFilter);
    try {
      const res = await fetch(`/api/tickets?${params}`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      setTickets(Array.isArray(data.tickets) ? data.tickets : []);
      setTotal(data.totalCount || 0);
    } catch { setTickets([]); } finally { setLoading(false); }
  };

  useEffect(() => { fetchTickets(); }, [page, search, statusFilter]);

  const saveEdit = async () => {
    if (!editTicket) return;
    setSaving(true);
    await fetch(`/api/tickets/${editTicket.id}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm)
    });
    setSaving(false);
    setEditTicket(null);
    fetchTickets();
  };

  return (
    <div>
      <div className="page-header">
        <h1>All Tickets</h1>
        <p>{total} total tickets in system</p>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <input className="input" placeholder="Search ticket ID, name, TX ID..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} style={{ flex: 1 }} />
        <select className="input" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} style={{ width: '160px' }}>
          <option value="">All Status</option>
          <option value="Printed">Printed</option>
          <option value="Unprinted">Unprinted</option>
          <option value="Reprinted">Reprinted</option>
        </select>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><div className="spinner" /></div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Ticket ID</th>
                <th>Customer</th>
                <th>Mobile</th>
                <th>TX ID</th>
                <th>Date</th>
                <th>Printed</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map(t => (
                <tr key={t.id}>
                  <td><span style={{ fontFamily: 'monospace', color: 'var(--accent)', fontWeight: '700' }}>{t.ticket_id}</span></td>
                  <td style={{ color: 'var(--text-primary)' }}>{t.name}</td>
                  <td>{maskMobile(t.mobile, true)}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '11px' }}>{t.tx_id}</td>
                  <td>{formatDate(t.date)}</td>
                  <td>
                    {t.printed_count > 0
                      ? <span className="badge badge-approved">{t.printed_count}× printed</span>
                      : <span className="badge badge-inactive">Not printed</span>
                    }
                  </td>
                  <td>
                    <button className="btn btn-ghost btn-sm" onClick={() => { setEditTicket(t); setEditForm({ name: t.name, mobile: t.mobile, address: t.address }); }}>
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Page {page} of {Math.ceil(total / limit)}</span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
          <button className="btn btn-ghost btn-sm" disabled={page >= Math.ceil(total / limit)} onClick={() => setPage(p => p + 1)}>Next →</button>
        </div>
      </div>

      {/* Edit Modal */}
      {editTicket && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '24px' }}>
          <div className="card" style={{ padding: '32px', maxWidth: '480px', width: '100%' }}>
            <h3 style={{ fontFamily: 'Syne', fontSize: '18px', fontWeight: '700', marginBottom: '24px' }}>Edit Ticket — {editTicket.ticket_id}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div><label className="label">Customer Name</label><input className="input" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} /></div>
              <div><label className="label">Mobile</label><input className="input" value={editForm.mobile} onChange={e => setEditForm(f => ({ ...f, mobile: e.target.value }))} /></div>
              <div><label className="label">Address</label><input className="input" value={editForm.address} onChange={e => setEditForm(f => ({ ...f, address: e.target.value }))} /></div>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button className="btn btn-primary" onClick={saveEdit} disabled={saving}>{saving ? <span className="spinner" /> : 'Save Changes'}</button>
              <button className="btn btn-ghost" onClick={() => setEditTicket(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
