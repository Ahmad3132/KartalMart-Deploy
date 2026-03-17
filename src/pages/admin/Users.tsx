import React, { useEffect, useState } from 'react';

export default function Users() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);
  const [form, setForm] = useState({
    email: '', password: '', name: '', nick_name: '',
    role: 'User', status: 'Active',
    multi_person_logic_enabled: true,
    duplicate_tx_enabled: true,
    require_all_approvals: false,
    receipt_required: true,
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);
  const token = localStorage.getItem('kartal_token');
  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users', { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch { setUsers([]); }
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const resetForm = () => setForm({
    email: '', password: '', name: '', nick_name: '',
    role: 'User', status: 'Active',
    multi_person_logic_enabled: true,
    duplicate_tx_enabled: true,
    require_all_approvals: false,
    receipt_required: true,
  });

  const save = async () => {
    setSaving(true);
    try {
      const url = editUser ? `/api/users/${editUser.email}` : '/api/users';
      const method = editUser ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage({ type: 'success', text: `User ${editUser ? 'updated' : 'created'} successfully.` });
      setShowForm(false);
      setEditUser(null);
      resetForm();
      fetchUsers();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally { setSaving(false); }
  };

  const deleteUser = async (email: string) => {
    if (!confirm(`Delete user ${email}? This cannot be undone.`)) return;
    await fetch(`/api/users/${email}`, { method: 'DELETE', headers });
    fetchUsers();
  };

  const startEdit = (u: any) => {
    setEditUser(u);
    setForm({
      email: u.email,
      password: '',
      name: u.name || '',
      nick_name: u.nick_name || '',
      role: u.role,
      status: u.status,
      multi_person_logic_enabled: u.multi_person_logic_enabled === 1,
      duplicate_tx_enabled: u.duplicate_tx_enabled === 1,
      require_all_approvals: u.require_all_approvals === 1,
      receipt_required: u.receipt_required !== 0, // default true
    });
    setShowForm(true);
  };

  const permissions = [
    { key: 'multi_person_logic_enabled', label: 'Allow multi-person transactions', desc: 'User can submit one TX for multiple different people' },
    { key: 'duplicate_tx_enabled', label: 'Allow duplicate transaction IDs', desc: 'Same TX ID can be submitted more than once' },
    { key: 'require_all_approvals', label: 'Require admin approval for every transaction', desc: 'All transactions go to Pending regardless of type' },
    { key: 'receipt_required', label: 'EasyPaisa receipt is mandatory', desc: 'User must upload receipt when paying via EasyPaisa' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontFamily: 'Syne', fontSize: '28px', fontWeight: '800', letterSpacing: '-0.02em' }}>Users</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>Manage staff accounts and per-user permissions.</p>
        </div>
        <button className="btn btn-primary" onClick={() => { resetForm(); setEditUser(null); setShowForm(true); }}>+ Add User</button>
      </div>

      {message && (
        <div className={`alert alert-${message.type}`} style={{ marginBottom: '20px' }}>
          {message.text}
          <button onClick={() => setMessage(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>✕</button>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><div className="spinner" /></div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Receipt Required</th>
                <th>Approval Required</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.email}>
                  <td>
                    <div style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{u.name || '—'}</div>
                    {u.nick_name && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>@{u.nick_name}</div>}
                  </td>
                  <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{u.email}</td>
                  <td>
                    <span className={`badge ${u.role === 'Admin' ? 'badge-generated' : 'badge-approved'}`}>{u.role}</span>
                  </td>
                  <td>
                    <span className={`badge ${u.status === 'Active' ? 'badge-active' : 'badge-rejected'}`}>{u.status}</span>
                  </td>
                  <td>
                    <span style={{ fontSize: '12px', color: u.receipt_required !== 0 ? 'var(--warning)' : 'var(--success)', fontWeight: '600' }}>
                      {u.receipt_required !== 0 ? '🔒 Mandatory' : '✓ Optional'}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '12px', color: u.require_all_approvals ? 'var(--warning)' : 'var(--text-muted)', fontWeight: '600' }}>
                      {u.require_all_approvals ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => startEdit(u)}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => deleteUser(u.email)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* User Form Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '24px', overflowY: 'auto' }}>
          <div className="card" style={{ padding: '32px', maxWidth: '540px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ fontFamily: 'Syne', fontSize: '20px', fontWeight: '700', marginBottom: '24px' }}>
              {editUser ? `Edit — ${editUser.email}` : 'New User'}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Account Info */}
              <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', paddingBottom: '6px', borderBottom: '1px solid var(--border)' }}>Account Info</div>

              {!editUser && (
                <div>
                  <label className="label">Email <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <input className="input" type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="user@example.com" />
                </div>
              )}

              <div>
                <label className="label">Password {editUser && <span style={{ color: 'var(--text-muted)', fontWeight: '400', textTransform: 'none' }}>(leave blank to keep current)</span>}</label>
                <input className="input" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder={editUser ? '••••••••' : 'Set password'} />
              </div>

              <div className="grid-2">
                <div>
                  <label className="label">Full Name</label>
                  <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Muhammad Ahmad" />
                </div>
                <div>
                  <label className="label">Nickname / Display</label>
                  <input className="input" value={form.nick_name} onChange={e => setForm(f => ({ ...f, nick_name: e.target.value }))} placeholder="Ahmad" />
                </div>
              </div>

              <div className="grid-2">
                <div>
                  <label className="label">Role</label>
                  <select className="input" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                    <option value="User">User (Staff)</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="label">Status</label>
                  <select className="input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive (Blocked)</option>
                  </select>
                </div>
              </div>

              {/* Permissions */}
              <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', paddingBottom: '6px', borderBottom: '1px solid var(--border)', marginTop: '8px' }}>Permissions & Restrictions</div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                {permissions.map((p, i) => (
                  <label key={p.key} style={{
                    display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px',
                    background: i % 2 === 0 ? 'var(--bg-elevated)' : 'transparent',
                    borderRadius: '8px', cursor: 'pointer'
                  }}>
                    <input
                      type="checkbox"
                      checked={(form as any)[p.key]}
                      onChange={e => setForm(f => ({ ...f, [p.key]: e.target.checked }))}
                      style={{ accentColor: 'var(--accent)', width: '16px', height: '16px', marginTop: '2px', flexShrink: 0 }}
                    />
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{p.label}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{p.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
              <button className="btn btn-primary" onClick={save} disabled={saving} style={{ flex: 1 }}>
                {saving ? <span className="spinner" /> : (editUser ? 'Save Changes' : 'Create User')}
              </button>
              <button className="btn btn-ghost" onClick={() => { setShowForm(false); setEditUser(null); resetForm(); }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
