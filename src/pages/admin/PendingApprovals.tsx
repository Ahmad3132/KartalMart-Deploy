import React, { useState, useEffect } from 'react';
import { Check, X, AlertCircle, Eye, Clock, ArrowLeft, User, CreditCard, Ticket } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PendingApprovals() {
  const [pending, setPending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rejectModal, setRejectModal] = useState<{ id: number; txId: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const navigate = useNavigate();

  const headers = { 'Authorization': `Bearer ${localStorage.getItem('kartal_token')}` };

  const fetchPending = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/transactions/pending', { headers });
      const data = await res.json();
      setPending(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPending(); }, []);

  const handleApprove = async (id: number) => {
    if (!window.confirm('Approve this transaction and generate tickets?')) return;
    setActionLoading(id);
    try {
      const res = await fetch(`/api/transactions/${id}/approve`, { method: 'PUT', headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Approval failed');
      fetchPending();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    setActionLoading(rejectModal.id);
    try {
      const res = await fetch(`/api/transactions/${rejectModal.id}/reject`, {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Rejection failed');
      setRejectModal(null);
      setRejectReason('');
      fetchPending();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/admin')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pending Approvals</h1>
            <p className="text-sm text-gray-500">Review transactions before tickets are generated</p>
          </div>
        </div>
        <span className="bg-orange-100 text-orange-700 px-3 py-1.5 rounded-xl font-bold text-sm flex items-center gap-2">
          <Clock className="w-4 h-4" /> {pending.length} Pending
        </span>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
          <button onClick={() => setError('')} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-16 flex justify-center"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" /></div>
        ) : pending.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
            <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">All Caught Up!</h3>
            <p className="text-sm text-gray-500 mt-1">No pending transactions at this time.</p>
          </div>
        ) : pending.map((tx) => (
          <div key={tx.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Info */}
              <div className="flex-1 space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-0.5">Transaction ID</p>
                    <p className="font-black font-mono text-indigo-600 text-base">{tx.tx_id}</p>
                  </div>
                  <span className="bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">Pending</span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-300 flex-shrink-0" />
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-semibold">Agent</p>
                      <p className="text-gray-700 text-xs truncate">{tx.user_email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-gray-300 flex-shrink-0" />
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-semibold">Payment</p>
                      <p className="text-gray-700 text-xs">{tx.payment_type} · PKR {Number(tx.amount).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Ticket className="w-4 h-4 text-gray-300 flex-shrink-0" />
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-semibold">Tickets</p>
                      <p className="text-gray-700 text-xs">{tx.ticket_count} ticket{tx.ticket_count !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-semibold">Customer</p>
                    <p className="text-gray-700 text-xs">{tx.name || (tx.is_multi_person ? 'Multi-person' : '—')}</p>
                  </div>
                </div>

                {tx.is_multi_person === 1 && (
                  <span className="inline-flex items-center px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold">
                    Multi-Person Transaction
                  </span>
                )}

                <p className="text-[10px] text-gray-400">{new Date(tx.date).toLocaleString()}</p>
              </div>

              {/* Actions */}
              <div className="flex sm:flex-col gap-2 justify-end sm:justify-start sm:min-w-[120px]">
                {(tx.receipt_url || tx.receipt_filename) && (
                  <a
                    href={tx.receipt_url || `/uploads/${tx.receipt_filename}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" /> Receipt
                  </a>
                )}
                <button
                  onClick={() => handleApprove(tx.id)}
                  disabled={actionLoading === tx.id}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                  {actionLoading === tx.id ? 'Processing...' : 'Approve'}
                </button>
                <button
                  onClick={() => { setRejectModal({ id: tx.id, txId: tx.tx_id }); setRejectReason(''); }}
                  disabled={actionLoading === tx.id}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-red-50 text-red-600 border border-red-200 rounded-xl text-xs font-bold hover:bg-red-100 disabled:opacity-50 transition-colors"
                >
                  <X className="w-3.5 h-3.5" /> Reject
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Reject Transaction</h3>
            <p className="text-sm text-gray-500 mb-4">Transaction: <span className="font-mono text-indigo-600 font-semibold">{rejectModal.txId}</span></p>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Reason for rejection <span className="text-gray-400 font-normal">(optional)</span></label>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="e.g. Invalid receipt, duplicate payment, incorrect amount..."
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setRejectModal(null)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading !== null}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading ? 'Rejecting...' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
