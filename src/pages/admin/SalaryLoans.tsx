import React, { useEffect, useState, useCallback } from 'react';
import { DollarSign, Plus, Check, X, ChevronDown, Users, Banknote, CreditCard, FileText, Play } from 'lucide-react';
import { formatPKR } from '../../utils/api';

// Separate component to avoid useState inside map
const SalaryRow: React.FC<{ u: any; cfg: any; isAdmin: boolean; onSave: (email: string, salary: number) => Promise<void> | void }> = ({ u, cfg, isAdmin, onSave }) => {
  const [editVal, setEditVal] = useState(cfg?.monthly_salary?.toString() || '0');
  return (
    <tr className="border-t border-gray-50 hover:bg-gray-50">
      <td className="px-5 py-3">
        <div className="font-medium text-gray-900">{u.name || u.email}</div>
        <div className="text-xs text-gray-400">{u.email}</div>
      </td>
      <td className="px-5 py-3">
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${u.role === 'Admin' ? 'bg-indigo-100 text-indigo-700' : u.role === 'Accountant' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>{u.role}</span>
      </td>
      <td className="px-5 py-3">
        {isAdmin ? (
          <input type="number" value={editVal} onChange={e => setEditVal(e.target.value)}
            className="w-32 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
        ) : (
          <span className="font-semibold">{formatPKR(cfg?.monthly_salary || 0)}</span>
        )}
      </td>
      {isAdmin && (
        <td className="px-5 py-3">
          <button onClick={() => onSave(u.email, parseFloat(editVal) || 0)}
            className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700">
            Save
          </button>
        </td>
      )}
    </tr>
  );
};

type Tab = 'setup' | 'payroll' | 'advances' | 'loans' | 'summary';

export default function SalaryLoans() {
  const [tab, setTab] = useState<Tab>('setup');
  const [configs, setConfigs] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'Salary' | 'Advance' | 'Loan' | 'Loan Repayment'>('Advance');
  const [form, setForm] = useState({ user_email: '', amount: '', month: '', description: '' });
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ type: string; text: string } | null>(null);
  const [payrollMonth, setPayrollMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [userSummary, setUserSummary] = useState<any>(null);
  const token = localStorage.getItem('kartal_token');
  const headers: any = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
  const me = JSON.parse(atob(token!.split('.')[1]));
  const isAdmin = me.role === 'Admin';

  const toast = (text: string, err = false) => {
    setMsg({ type: err ? 'error' : 'success', text });
    setTimeout(() => setMsg(null), 4000);
  };

  const load = async () => {
    setLoading(true);
    try {
      const [cfgRes, txRes, usersRes] = await Promise.all([
        fetch('/api/salary/config', { headers }),
        fetch('/api/salary/transactions', { headers }),
        fetch('/api/users', { headers }),
      ]);
      if (cfgRes.ok) setConfigs(await cfgRes.json());
      if (txRes.ok) setTransactions(await txRes.json());
      if (usersRes.ok) setUsers((await usersRes.json()).filter((u: any) => u.status === 'Active'));
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const saveSalaryConfig = async (email: string, salary: number) => {
    const res = await fetch(`/api/salary/config/${email}`, {
      method: 'PUT', headers,
      body: JSON.stringify({ monthly_salary: salary }),
    });
    if (res.ok) { toast('Salary updated'); load(); }
    else toast('Failed to update', true);
  };

  const submitTransaction = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/salary/transactions', {
        method: 'POST', headers,
        body: JSON.stringify({ ...form, amount: parseFloat(form.amount), type: modalType }),
      });
      const data = await res.json();
      if (!res.ok) { toast(data.error || 'Failed', true); return; }
      toast(`${modalType} recorded successfully`);
      setShowModal(false);
      setForm({ user_email: '', amount: '', month: '', description: '' });
      load();
    } catch { toast('Error', true); }
    finally { setSubmitting(false); }
  };

  const approve = async (id: number) => {
    const res = await fetch(`/api/salary/transactions/${id}/approve`, { method: 'PUT', headers });
    if (res.ok) { toast('Approved'); load(); } else toast('Failed', true);
  };

  const reject = async (id: number) => {
    const res = await fetch(`/api/salary/transactions/${id}/reject`, { method: 'PUT', headers });
    if (res.ok) { toast('Rejected'); load(); } else toast('Failed', true);
  };

  const processPayroll = async () => {
    if (!payrollMonth) return;
    if (!confirm(`Process monthly salary for all configured users for ${payrollMonth}?`)) return;
    const res = await fetch('/api/salary/process-monthly', {
      method: 'POST', headers,
      body: JSON.stringify({ month: payrollMonth }),
    });
    const data = await res.json();
    if (res.ok) {
      toast(`Payroll processed: ${data.processed} paid, ${data.skipped} already paid`);
      load();
    } else toast(data.error || 'Failed', true);
  };

  const loadSummary = async (email: string) => {
    setSelectedUser(email);
    const res = await fetch(`/api/salary/summary/${email}`, { headers });
    if (res.ok) setUserSummary(await res.json());
  };

  const TABS: { key: Tab; label: string; icon: any }[] = [
    { key: 'setup', label: 'Salary Setup', icon: Users },
    { key: 'payroll', label: 'Payroll', icon: Banknote },
    { key: 'advances', label: 'Advances', icon: CreditCard },
    { key: 'loans', label: 'Loans', icon: DollarSign },
    { key: 'summary', label: 'Summary', icon: FileText },
  ];

  const advances = transactions.filter(t => t.type === 'Advance');
  const loans = transactions.filter(t => t.type === 'Loan' || t.type === 'Loan Repayment');
  const salaryTx = transactions.filter(t => t.type === 'Salary');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Salary & Loans</h1>
          <p className="text-sm text-gray-500 mt-1">Manage salaries, advances, and loan tracking for all staff.</p>
        </div>
      </div>

      {msg && (
        <div className={`flex items-center justify-between p-3 rounded-xl text-sm font-medium ${msg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          <span>{msg.text}</span>
          <button onClick={() => setMsg(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${tab === t.key ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            <t.icon className="w-3.5 h-3.5" /> {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div></div>
      ) : (
        <>
          {/* ═══════ SALARY SETUP TAB ═══════ */}
          {tab === 'setup' && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-gray-100">
                <h3 className="font-bold text-gray-900">Monthly Salary Configuration</h3>
                <p className="text-xs text-gray-500 mt-1">Set monthly salary for each staff member.</p>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-5 py-3 font-semibold text-gray-500 uppercase text-xs">User</th>
                    <th className="text-left px-5 py-3 font-semibold text-gray-500 uppercase text-xs">Role</th>
                    <th className="text-left px-5 py-3 font-semibold text-gray-500 uppercase text-xs">Monthly Salary</th>
                    {isAdmin && <th className="text-left px-5 py-3 font-semibold text-gray-500 uppercase text-xs">Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => {
                    const cfg = configs.find((c: any) => c.user_email === u.email);
                    return <SalaryRow key={u.email} u={u} cfg={cfg} isAdmin={isAdmin} onSave={saveSalaryConfig} />;
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* ═══════ PAYROLL TAB ═══════ */}
          {tab === 'payroll' && (
            <div className="space-y-4">
              {isAdmin && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <h3 className="font-bold text-gray-900 mb-3">Process Monthly Payroll</h3>
                  <div className="flex items-center gap-3">
                    <input type="month" value={payrollMonth} onChange={e => setPayrollMonth(e.target.value)}
                      className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                    <button onClick={processPayroll}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700">
                      <Play className="w-4 h-4" /> Process All Salaries
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">This will create salary payment entries for all users with configured salaries. Already-paid months are skipped.</p>
                </div>
              )}

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-100">
                  <h3 className="font-bold text-gray-900">Salary Payment History</h3>
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-5 py-3 font-semibold text-gray-500 uppercase text-xs">User</th>
                      <th className="text-left px-5 py-3 font-semibold text-gray-500 uppercase text-xs">Month</th>
                      <th className="text-left px-5 py-3 font-semibold text-gray-500 uppercase text-xs">Amount</th>
                      <th className="text-left px-5 py-3 font-semibold text-gray-500 uppercase text-xs">Status</th>
                      <th className="text-left px-5 py-3 font-semibold text-gray-500 uppercase text-xs">Date</th>
                      {isAdmin && <th className="text-left px-5 py-3 font-semibold text-gray-500 uppercase text-xs">Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {salaryTx.length === 0 && <tr><td colSpan={6} className="px-5 py-8 text-center text-gray-400">No salary payments yet</td></tr>}
                    {salaryTx.map(tx => (
                      <tr key={tx.id} className="border-t border-gray-50 hover:bg-gray-50">
                        <td className="px-5 py-3 font-medium">{tx.name || tx.user_email}</td>
                        <td className="px-5 py-3">{tx.month || '—'}</td>
                        <td className="px-5 py-3 font-semibold">{formatPKR(tx.amount)}</td>
                        <td className="px-5 py-3">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${tx.status === 'Approved' ? 'bg-green-100 text-green-700' : tx.status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{tx.status}</span>
                        </td>
                        <td className="px-5 py-3 text-gray-500 text-xs">{new Date(tx.created_at).toLocaleDateString()}</td>
                        {isAdmin && (
                          <td className="px-5 py-3">
                            {tx.status === 'Pending' && (
                              <div className="flex gap-1">
                                <button onClick={() => approve(tx.id)} className="p-1 bg-green-50 text-green-600 rounded hover:bg-green-100"><Check className="w-4 h-4" /></button>
                                <button onClick={() => reject(tx.id)} className="p-1 bg-red-50 text-red-600 rounded hover:bg-red-100"><X className="w-4 h-4" /></button>
                              </div>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ═══════ ADVANCES TAB ═══════ */}
          {tab === 'advances' && (
            <div className="space-y-4">
              {(isAdmin || me.role === 'Accountant') && (
                <div className="flex justify-end">
                  <button onClick={() => { setModalType('Advance'); setShowModal(true); }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700">
                    <Plus className="w-4 h-4" /> New Advance
                  </button>
                </div>
              )}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-5 py-3 font-semibold text-gray-500 uppercase text-xs">User</th>
                      <th className="text-left px-5 py-3 font-semibold text-gray-500 uppercase text-xs">Amount</th>
                      <th className="text-left px-5 py-3 font-semibold text-gray-500 uppercase text-xs">Description</th>
                      <th className="text-left px-5 py-3 font-semibold text-gray-500 uppercase text-xs">Status</th>
                      <th className="text-left px-5 py-3 font-semibold text-gray-500 uppercase text-xs">Date</th>
                      {isAdmin && <th className="text-left px-5 py-3 font-semibold text-gray-500 uppercase text-xs">Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {advances.length === 0 && <tr><td colSpan={6} className="px-5 py-8 text-center text-gray-400">No advances recorded</td></tr>}
                    {advances.map(tx => (
                      <tr key={tx.id} className="border-t border-gray-50 hover:bg-gray-50">
                        <td className="px-5 py-3 font-medium">{tx.name || tx.user_email}</td>
                        <td className="px-5 py-3 font-semibold text-orange-600">{formatPKR(tx.amount)}</td>
                        <td className="px-5 py-3 text-gray-500">{tx.description || '—'}</td>
                        <td className="px-5 py-3">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${tx.status === 'Approved' ? 'bg-green-100 text-green-700' : tx.status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{tx.status}</span>
                        </td>
                        <td className="px-5 py-3 text-gray-500 text-xs">{new Date(tx.created_at).toLocaleDateString()}</td>
                        {isAdmin && (
                          <td className="px-5 py-3">
                            {tx.status === 'Pending' && (
                              <div className="flex gap-1">
                                <button onClick={() => approve(tx.id)} className="p-1 bg-green-50 text-green-600 rounded hover:bg-green-100"><Check className="w-4 h-4" /></button>
                                <button onClick={() => reject(tx.id)} className="p-1 bg-red-50 text-red-600 rounded hover:bg-red-100"><X className="w-4 h-4" /></button>
                              </div>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ═══════ LOANS TAB ═══════ */}
          {tab === 'loans' && (
            <div className="space-y-4">
              {(isAdmin || me.role === 'Accountant') && (
                <div className="flex gap-2 justify-end">
                  <button onClick={() => { setModalType('Loan'); setShowModal(true); }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700">
                    <Plus className="w-4 h-4" /> New Loan
                  </button>
                  <button onClick={() => { setModalType('Loan Repayment'); setShowModal(true); }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700">
                    <Plus className="w-4 h-4" /> Record Repayment
                  </button>
                </div>
              )}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-5 py-3 font-semibold text-gray-500 uppercase text-xs">User</th>
                      <th className="text-left px-5 py-3 font-semibold text-gray-500 uppercase text-xs">Type</th>
                      <th className="text-left px-5 py-3 font-semibold text-gray-500 uppercase text-xs">Amount</th>
                      <th className="text-left px-5 py-3 font-semibold text-gray-500 uppercase text-xs">Description</th>
                      <th className="text-left px-5 py-3 font-semibold text-gray-500 uppercase text-xs">Status</th>
                      <th className="text-left px-5 py-3 font-semibold text-gray-500 uppercase text-xs">Date</th>
                      {isAdmin && <th className="text-left px-5 py-3 font-semibold text-gray-500 uppercase text-xs">Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {loans.length === 0 && <tr><td colSpan={7} className="px-5 py-8 text-center text-gray-400">No loans recorded</td></tr>}
                    {loans.map(tx => (
                      <tr key={tx.id} className="border-t border-gray-50 hover:bg-gray-50">
                        <td className="px-5 py-3 font-medium">{tx.name || tx.user_email}</td>
                        <td className="px-5 py-3">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${tx.type === 'Loan' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{tx.type}</span>
                        </td>
                        <td className={`px-5 py-3 font-semibold ${tx.type === 'Loan' ? 'text-red-600' : 'text-green-600'}`}>{formatPKR(tx.amount)}</td>
                        <td className="px-5 py-3 text-gray-500">{tx.description || '—'}</td>
                        <td className="px-5 py-3">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${tx.status === 'Approved' ? 'bg-green-100 text-green-700' : tx.status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{tx.status}</span>
                        </td>
                        <td className="px-5 py-3 text-gray-500 text-xs">{new Date(tx.created_at).toLocaleDateString()}</td>
                        {isAdmin && (
                          <td className="px-5 py-3">
                            {tx.status === 'Pending' && (
                              <div className="flex gap-1">
                                <button onClick={() => approve(tx.id)} className="p-1 bg-green-50 text-green-600 rounded hover:bg-green-100"><Check className="w-4 h-4" /></button>
                                <button onClick={() => reject(tx.id)} className="p-1 bg-red-50 text-red-600 rounded hover:bg-red-100"><X className="w-4 h-4" /></button>
                              </div>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ═══════ SUMMARY TAB ═══════ */}
          {tab === 'summary' && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-bold text-gray-900 mb-3">Select User</h3>
                <select value={selectedUser} onChange={e => { if (e.target.value) loadSummary(e.target.value); }}
                  className="w-full max-w-md border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                  <option value="">-- Select user --</option>
                  {users.map(u => <option key={u.email} value={u.email}>{u.name || u.email} ({u.role})</option>)}
                </select>
              </div>

              {userSummary && (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                      <p className="text-xs font-bold text-gray-400 uppercase">Monthly Salary</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{formatPKR(userSummary.monthly_salary)}</p>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                      <p className="text-xs font-bold text-gray-400 uppercase">Total Paid (YTD)</p>
                      <p className="text-2xl font-bold text-green-600 mt-1">{formatPKR(userSummary.total_salary_paid)}</p>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                      <p className="text-xs font-bold text-gray-400 uppercase">Total Advances</p>
                      <p className="text-2xl font-bold text-orange-600 mt-1">{formatPKR(userSummary.total_advance)}</p>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                      <p className="text-xs font-bold text-gray-400 uppercase">Loan Balance</p>
                      <p className={`text-2xl font-bold mt-1 ${userSummary.loan_balance > 0 ? 'text-red-600' : 'text-gray-400'}`}>{formatPKR(userSummary.loan_balance)}</p>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-gray-100">
                      <h3 className="font-bold text-gray-900">Recent Transactions</h3>
                    </div>
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left px-5 py-3 font-semibold text-gray-500 uppercase text-xs">Type</th>
                          <th className="text-left px-5 py-3 font-semibold text-gray-500 uppercase text-xs">Amount</th>
                          <th className="text-left px-5 py-3 font-semibold text-gray-500 uppercase text-xs">Month</th>
                          <th className="text-left px-5 py-3 font-semibold text-gray-500 uppercase text-xs">Description</th>
                          <th className="text-left px-5 py-3 font-semibold text-gray-500 uppercase text-xs">Status</th>
                          <th className="text-left px-5 py-3 font-semibold text-gray-500 uppercase text-xs">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(userSummary.recent_transactions || []).map((tx: any) => (
                          <tr key={tx.id} className="border-t border-gray-50">
                            <td className="px-5 py-3">
                              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${tx.type === 'Loan' ? 'bg-red-100 text-red-700' : tx.type === 'Loan Repayment' ? 'bg-green-100 text-green-700' : tx.type === 'Advance' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>{tx.type}</span>
                            </td>
                            <td className="px-5 py-3 font-semibold">{formatPKR(tx.amount)}</td>
                            <td className="px-5 py-3">{tx.month || '—'}</td>
                            <td className="px-5 py-3 text-gray-500">{tx.description || '—'}</td>
                            <td className="px-5 py-3">
                              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${tx.status === 'Approved' ? 'bg-green-100 text-green-700' : tx.status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{tx.status}</span>
                            </td>
                            <td className="px-5 py-3 text-gray-500 text-xs">{new Date(tx.created_at).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}

      {/* ═══════ MODAL ═══════ */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900">New {modalType}</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">User *</label>
                <select value={form.user_email} onChange={e => setForm(f => ({ ...f, user_email: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                  <option value="">-- Select user --</option>
                  {users.map(u => <option key={u.email} value={u.email}>{u.name || u.email}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (PKR) *</label>
                <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="0" />
              </div>
              {modalType === 'Salary' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Month *</label>
                  <input type="month" value={form.month} onChange={e => setForm(f => ({ ...f, month: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Optional note" />
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex gap-3">
              <button onClick={submitTransaction} disabled={submitting || !form.user_email || !form.amount}
                className="flex-1 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50">
                {submitting ? 'Submitting...' : `Submit ${modalType}`}
              </button>
              <button onClick={() => { setShowModal(false); setForm({ user_email: '', amount: '', month: '', description: '' }); }}
                className="py-2.5 px-6 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
