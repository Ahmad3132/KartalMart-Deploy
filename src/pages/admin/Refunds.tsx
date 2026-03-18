import React, { useState, useEffect } from 'react';
import { RotateCcw, Plus, CheckCircle, XCircle, Search, X, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const h = () => ({ 'Authorization': `Bearer ${localStorage.getItem('kartal_token')}`, 'Content-Type': 'application/json' });

function toast(msg: string, isError = false) {
  const d = document.createElement('div');
  d.className = `fixed top-4 right-4 z-[9999] px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium ${isError ? 'bg-red-500' : 'bg-emerald-500'}`;
  d.textContent = msg; document.body.appendChild(d); setTimeout(() => d.remove(), 3000);
}

export default function Refunds() {
  const { user } = useAuth();
  const [refunds, setRefunds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [ticketId, setTicketId] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/refunds', { headers: h() });
      if (r.ok) setRefunds(await r.json());
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const r = await fetch('/api/refunds', { method: 'POST', headers: h(), body: JSON.stringify({ ticket_id: ticketId.trim(), reason }) });
      const d = await r.json();
      if (r.ok) { toast(`Refund ${d.status === 'Approved' ? 'processed' : 'submitted for approval'}!`); setShowCreate(false); setTicketId(''); setReason(''); load(); }
      else toast(d.error || 'Failed', true);
    } catch { toast('Failed', true); }
    setSubmitting(false);
  };

  const handleApprove = async (id: number) => {
    const r = await fetch(`/api/refunds/${id}/approve`, { method: 'PUT', headers: h() });
    if (r.ok) { toast('Refund approved!'); load(); }
    else { const d = await r.json(); toast(d.error || 'Failed', true); }
  };

  const handleReject = async (id: number) => {
    const r = await fetch(`/api/refunds/${id}/reject`, { method: 'PUT', headers: h() });
    if (r.ok) { toast('Refund rejected'); load(); }
    else { const d = await r.json(); toast(d.error || 'Failed', true); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Refunds & Cancellations</h1>
          <p className="text-sm text-gray-500">Manage ticket refunds and cancellations</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-700 text-sm font-medium">
          <Plus className="w-4 h-4" /> Request Refund
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Pending', count: refunds.filter(r => r.status === 'Pending').length, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Approved', count: refunds.filter(r => r.status === 'Approved').length, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Rejected', count: refunds.filter(r => r.status === 'Rejected').length, color: 'text-red-600', bg: 'bg-red-50' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-xl p-4 text-center`}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.count}</p>
            <p className="text-xs font-medium text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase">
              <th className="px-4 py-3">ID</th><th className="px-4 py-3">Ticket</th><th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Amount</th><th className="px-4 py-3">Reason</th><th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Date</th>
              {user?.role === 'Admin' && <th className="px-4 py-3 text-center">Actions</th>}
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">Loading...</td></tr> :
               refunds.length === 0 ? <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No refunds</td></tr> :
               refunds.map(r => (
                <tr key={r.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-mono text-xs">#{r.id}</td>
                  <td className="px-4 py-3 font-medium font-mono">{r.display_ticket_id || r.ticket_id}</td>
                  <td className="px-4 py-3 text-gray-600">{r.customer_name || '-'}</td>
                  <td className="px-4 py-3 font-semibold text-red-600">PKR {(r.amount || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-500 max-w-[200px] truncate">{r.reason}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      r.status === 'Approved' ? 'bg-green-50 text-green-700' :
                      r.status === 'Rejected' ? 'bg-red-50 text-red-700' :
                      'bg-orange-50 text-orange-700'}`}>{r.status}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{new Date(r.created_at).toLocaleDateString('en-PK')}</td>
                  {user?.role === 'Admin' && (
                    <td className="px-4 py-3">
                      {r.status === 'Pending' && (
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => handleApprove(r.id)} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg" title="Approve">
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleReject(r.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg" title="Reject">
                            <XCircle className="w-4 h-4" />
                          </button>
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

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-red-500" /> Request Refund</h3>
              <button onClick={() => setShowCreate(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Ticket Number</label>
                <input type="text" value={ticketId} onChange={e => setTicketId(e.target.value)} required
                  placeholder="e.g. 2603-0001" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-mono" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Reason for Refund</label>
                <textarea value={reason} onChange={e => setReason(e.target.value)} required rows={3}
                  placeholder="Why is this refund being requested?" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none" />
              </div>
              <p className="text-xs text-gray-400">
                {user?.role === 'Admin' ? 'As admin, refund will be auto-approved.' : 'Refund will be sent for admin approval.'}
              </p>
              <button type="submit" disabled={submitting}
                className="w-full bg-red-600 text-white py-2.5 rounded-xl font-medium hover:bg-red-700 disabled:opacity-50">
                {submitting ? 'Submitting...' : 'Submit Refund Request'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
