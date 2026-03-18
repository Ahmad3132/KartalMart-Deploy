import React, { useEffect, useState } from 'react';
import { UserPlus, Edit2, Trash2, Shield, ShieldOff, Search, X } from 'lucide-react';

export default function Users() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    email: '', password: '', name: '', nick_name: '',
    role: 'User', status: 'Active',
    multi_person_logic_enabled: true,
    duplicate_tx_enabled: true,
    require_all_approvals: false,
    receipt_required: true,
    pdf_download_enabled: true,
    generate_ticket_enabled: true,
    scanner_enabled: true,
    bulk_print_enabled: true,
    reports_enabled: true,
    accounts_enabled: false,
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
    pdf_download_enabled: true,
    generate_ticket_enabled: true,
    scanner_enabled: true,
    bulk_print_enabled: true,
    reports_enabled: true,
    accounts_enabled: false,
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
      receipt_required: u.receipt_required !== 0,
      pdf_download_enabled: u.pdf_download_enabled !== 0,
      generate_ticket_enabled: u.generate_ticket_enabled !== 0,
      scanner_enabled: u.scanner_enabled !== 0,
      bulk_print_enabled: u.bulk_print_enabled !== 0,
      reports_enabled: u.reports_enabled !== 0,
      accounts_enabled: u.accounts_enabled === 1,
    });
    setShowForm(true);
  };

  const toggleUserField = async (u: any, field: string, currentValue: boolean) => {
    try {
      const res = await fetch(`/api/users/${u.email}`, {
        method: 'PUT', headers,
        body: JSON.stringify({ [field]: !currentValue }),
      });
      if (!res.ok) throw new Error('Failed to update');
      fetchUsers();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const permissions = [
    { key: 'multi_person_logic_enabled', label: 'Multi-person transactions', desc: 'Can submit one TX for multiple people' },
    { key: 'duplicate_tx_enabled', label: 'Duplicate transaction IDs', desc: 'Same TX ID can be reused' },
    { key: 'require_all_approvals', label: 'Require approval for all', desc: 'All transactions need admin approval' },
    { key: 'receipt_required', label: 'EasyPaisa receipt mandatory', desc: 'Must upload receipt for online payments' },
  ];

  const featureToggles = [
    { key: 'pdf_download_enabled', label: 'PDF Download' },
    { key: 'generate_ticket_enabled', label: 'Generate Ticket' },
    { key: 'scanner_enabled', label: 'Scanner' },
    { key: 'bulk_print_enabled', label: 'Bulk Print' },
    { key: 'reports_enabled', label: 'Reports' },
    { key: 'accounts_enabled', label: 'Accounts' },
  ];

  const filtered = users.filter(u =>
    !search || u.email?.toLowerCase().includes(search.toLowerCase()) || u.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage staff accounts, roles, and per-user feature controls.</p>
        </div>
        <button
          onClick={() => { resetForm(); setEditUser(null); setShowForm(true); }}
          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
        >
          <UserPlus className="w-4 h-4 mr-2" /> Add User
        </button>
      </div>

      {message && (
        <div className={`flex items-center justify-between p-3 rounded-xl text-sm font-medium ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="ml-2 text-inherit hover:opacity-70"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          placeholder="Search users..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map(u => (
            <div key={u.email} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                      u.role === 'Admin' ? 'bg-indigo-600' : u.role === 'Accountant' ? 'bg-blue-500' : 'bg-gray-400'
                    }`}>
                      {(u.name || u.email)[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900">{u.name || u.email}</span>
                        {u.nick_name && <span className="text-xs text-gray-400">@{u.nick_name}</span>}
                      </div>
                      <p className="text-xs text-gray-500 font-mono">{u.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                      u.role === 'Admin' ? 'bg-indigo-100 text-indigo-700' : u.role === 'Accountant' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                    }`}>{u.role}</span>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                      u.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>{u.status}</span>
                  </div>
                </div>

                {/* Feature Toggles */}
                {u.role !== 'Admin' && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Feature Access</p>
                    <div className="flex flex-wrap gap-2">
                      {featureToggles.map(ft => {
                        const enabled = u[ft.key] !== 0;
                        return (
                          <button
                            key={ft.key}
                            onClick={() => toggleUserField(u, ft.key, enabled)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                              enabled
                                ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
                                : 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
                            }`}
                          >
                            {enabled ? <Shield className="w-3 h-3" /> : <ShieldOff className="w-3 h-3" />}
                            {ft.label}
                          </button>
                        );
                      })}
                    </div>

                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 mt-3">Restrictions</p>
                    <div className="flex flex-wrap gap-2">
                      {permissions.map(p => {
                        const enabled = u[p.key] === 1;
                        return (
                          <button
                            key={p.key}
                            onClick={() => toggleUserField(u, p.key, enabled)}
                            title={p.desc}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                              enabled
                                ? 'bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100'
                                : 'bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100'
                            }`}
                          >
                            {p.label}: {enabled ? 'ON' : 'OFF'}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="mt-4 flex gap-2 justify-end">
                  <button
                    onClick={() => startEdit(u)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <Edit2 className="w-3 h-3" /> Edit
                  </button>
                  <button
                    onClick={() => deleteUser(u.email)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* User Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900">
                {editUser ? `Edit — ${editUser.email}` : 'New User'}
              </h3>
            </div>

            <div className="p-6 space-y-5">
              {/* Account Info */}
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider pb-1 border-b border-gray-100">Account Info</p>

              {!editUser && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email" required
                    className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="user@example.com"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password {editUser && <span className="text-xs text-gray-400 font-normal">(leave blank to keep current)</span>}
                </label>
                <input
                  type="password"
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder={editUser ? '••••••••' : 'Set password'}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Muhammad Ahmad"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nickname</label>
                  <input
                    className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    value={form.nick_name} onChange={e => setForm(f => ({ ...f, nick_name: e.target.value }))} placeholder="Ahmad"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                  >
                    <option value="User">User (Staff)</option>
                    <option value="Accountant">Accountant</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive (Blocked)</option>
                  </select>
                </div>
              </div>

              {/* Feature Toggles */}
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider pb-1 border-b border-gray-100 mt-4">Feature Access</p>
              <div className="space-y-0">
                {featureToggles.map((ft, i) => (
                  <label key={ft.key} className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer ${i % 2 === 0 ? 'bg-gray-50' : ''}`}>
                    <input
                      type="checkbox"
                      checked={(form as any)[ft.key]}
                      onChange={e => setForm(f => ({ ...f, [ft.key]: e.target.checked }))}
                      className="rounded border-gray-300 text-indigo-600 w-4 h-4"
                    />
                    <span className="text-sm font-medium text-gray-700">{ft.label}</span>
                  </label>
                ))}
              </div>

              {/* Permissions */}
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider pb-1 border-b border-gray-100 mt-4">Permissions & Restrictions</p>
              <div className="space-y-0">
                {permissions.map((p, i) => (
                  <label key={p.key} className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer ${i % 2 === 0 ? 'bg-gray-50' : ''}`}>
                    <input
                      type="checkbox"
                      checked={(form as any)[p.key]}
                      onChange={e => setForm(f => ({ ...f, [p.key]: e.target.checked }))}
                      className="rounded border-gray-300 text-indigo-600 w-4 h-4 mt-0.5"
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-700">{p.label}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{p.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex gap-3">
              <button
                onClick={save} disabled={saving}
                className="flex-1 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Saving...' : (editUser ? 'Save Changes' : 'Create User')}
              </button>
              <button
                onClick={() => { setShowForm(false); setEditUser(null); resetForm(); }}
                className="py-2.5 px-6 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
