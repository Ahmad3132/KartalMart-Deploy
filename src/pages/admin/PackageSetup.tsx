import React, { useState, useEffect } from 'react';

export default function PackageSetup() {
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState({ name: '', amount: '', ticket_count: '', status: 'Active' });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);
  const token = localStorage.getItem('kartal_token');
  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  const fetch_ = async () => {
    const res = await fetch('/api/packages', { headers: { 'Authorization': `Bearer ${token}` } });
    const data = await res.json();
    setPackages(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => { fetch_(); }, []);

  const save = async () => {
    setSaving(true);
    try {
      const body = { ...form, amount: Number(form.amount), ticket_count: Number(form.ticket_count) };
      if (editItem) {
        await fetch(`/api/packages/${editItem.id}/status`, { method: 'PUT', headers, body: JSON.stringify(body) });
      } else {
        await fetch('/api/packages', { method: 'POST', headers, body: JSON.stringify(body) });
      }
      setMessage({ type: 'success', text: `Package ${editItem ? 'updated' : 'created'}.` });
      setShowForm(false); setEditItem(null); setForm({ name: '', amount: '', ticket_count: '', status: 'Active' });
      fetch_();
    } catch (err: any) { setMessage({ type: 'error', text: err.message }); }
    setSaving(false);
  };

  const del = async (id: number) => {
    if (!confirm('Delete this package?')) return;
    await fetch(`/api/packages/${id}`, { method: 'DELETE', headers });
    fetch_();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
        <div><h1 style={{ fontFamily: 'Syne', fontSize: '26px', fontWeight: '800' }}>Packages</h1><p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '3px' }}>Set the purchase tiers customers can choose from.</p></div>
        <button className="btn btn-primary" onClick={() => { setShowForm(true); setEditItem(null); }}>+ New Package</button>
      </div>

      {message && <div className={`alert alert-${message.type}`} style={{ marginBottom: '20px' }}>{message.text}<button onClick={() => setMessage(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>✕</button></div>}

      {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><div className="spinner" /></div> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
          {packages.map(p => (
            <div key={p.id} className="card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <span className={`badge badge-${p.status === 'Active' ? 'active' : 'closed'}`}>{p.status}</span>
              </div>
              <div style={{ fontFamily: 'Syne', fontSize: '28px', fontWeight: '800', color: 'var(--accent)' }}>PKR {Number(p.amount).toLocaleString()}</div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', margin: '4px 0' }}>{p.name}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{p.ticket_count} ticket{p.ticket_count > 1 ? 's' : ''}</div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                <button className="btn btn-ghost btn-sm" onClick={() => { setEditItem(p); setForm({ name: p.name, amount: String(p.amount), ticket_count: String(p.ticket_count), status: p.status }); setShowForm(true); }}>Edit</button>
                <button className="btn btn-danger btn-sm" onClick={() => del(p.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '24px' }}>
          <div className="card" style={{ padding: '32px', maxWidth: '400px', width: '100%' }}>
            <h3 style={{ fontFamily: 'Syne', fontSize: '18px', fontWeight: '700', marginBottom: '24px' }}>{editItem ? 'Edit Package' : 'New Package'}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div><label className="label">Package Name</label><input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Premium Package" /></div>
              <div className="grid-2">
                <div><label className="label">Amount (PKR)</label><input className="input" type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="500" /></div>
                <div><label className="label">Tickets</label><input className="input" type="number" value={form.ticket_count} onChange={e => setForm(f => ({ ...f, ticket_count: e.target.value }))} placeholder="1" /></div>
              </div>
              <div><label className="label">Status</label>
                <select className="input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  <option value="Active">Active</option><option value="Inactive">Inactive</option>
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
