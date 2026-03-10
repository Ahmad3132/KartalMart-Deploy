import React, { useState, useEffect } from 'react';
import { formatDate } from '../../utils/api';

export default function CampaignSetup() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState({ name: '', start_date: '', end_date: '', status: 'Active' });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);
  const token = localStorage.getItem('kartal_token');
  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  const fetch_ = async () => {
    const res = await fetch('/api/campaigns', { headers: { 'Authorization': `Bearer ${token}` } });
    const data = await res.json();
    setCampaigns(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => { fetch_(); }, []);

  const save = async () => {
    setSaving(true);
    try {
      if (editItem) {
        await fetch(`/api/campaigns/${editItem.id}/status`, { method: 'PUT', headers, body: JSON.stringify(form) });
      } else {
        await fetch('/api/campaigns', { method: 'POST', headers, body: JSON.stringify(form) });
      }
      setMessage({ type: 'success', text: `Campaign ${editItem ? 'updated' : 'created'}.` });
      setShowForm(false); setEditItem(null); setForm({ name: '', start_date: '', end_date: '', status: 'Active' });
      fetch_();
    } catch (err: any) { setMessage({ type: 'error', text: err.message }); }
    setSaving(false);
  };

  const del = async (id: number) => {
    if (!confirm('Delete this campaign?')) return;
    await fetch(`/api/campaigns/${id}`, { method: 'DELETE', headers });
    fetch_();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
        <div><h1 style={{ fontFamily: 'Syne', fontSize: '26px', fontWeight: '800' }}>Campaigns</h1><p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '3px' }}>Manage lucky draw campaigns.</p></div>
        <button className="btn btn-primary" onClick={() => { setShowForm(true); setEditItem(null); }}>+ New Campaign</button>
      </div>

      {message && <div className={`alert alert-${message.type}`} style={{ marginBottom: '20px' }}>{message.text}<button onClick={() => setMessage(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>✕</button></div>}

      {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><div className="spinner" /></div> : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Start</th><th>End</th><th>Tickets</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {campaigns.map(c => (
                <tr key={c.id}>
                  <td style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{c.name}</td>
                  <td>{c.start_date || '—'}</td>
                  <td>{c.end_date || '—'}</td>
                  <td style={{ color: 'var(--accent)', fontWeight: '700' }}>{c.counter}</td>
                  <td><span className={`badge badge-${c.status === 'Active' ? 'active' : 'closed'}`}>{c.status}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => { setEditItem(c); setForm({ name: c.name, start_date: c.start_date || '', end_date: c.end_date || '', status: c.status }); setShowForm(true); }}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => del(c.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '24px' }}>
          <div className="card" style={{ padding: '32px', maxWidth: '440px', width: '100%' }}>
            <h3 style={{ fontFamily: 'Syne', fontSize: '18px', fontWeight: '700', marginBottom: '24px' }}>{editItem ? 'Edit Campaign' : 'New Campaign'}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div><label className="label">Campaign Name</label><input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
              <div className="grid-2">
                <div><label className="label">Start Date</label><input className="input" type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} /></div>
                <div><label className="label">End Date</label><input className="input" type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} /></div>
              </div>
              <div><label className="label">Status</label>
                <select className="input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  <option value="Active">Active</option><option value="Closed">Closed</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? <span className="spinner" /> : 'Save'}</button>
              <button className="btn btn-ghost" onClick={() => { setShowForm(false); setEditItem(null); }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
