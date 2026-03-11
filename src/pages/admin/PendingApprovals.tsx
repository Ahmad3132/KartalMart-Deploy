import React, { useState, useEffect } from 'react';
import { Check, AlertCircle, Eye, Clock, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { handleResponse } from '../../utils/api';

export default function PendingApprovals() {
  const [pending, setPending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchPending = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/transactions/pending', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('kartal_token')}`
        }
      });
      const data = await handleResponse(res);
      setPending(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Pending fetch error:', err);
      setError(err.message);
      setPending([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const approveTransaction = async (id: number) => {
    if (!window.confirm('Are you sure you want to approve this transaction?')) return;
    try {
      const res = await fetch(`/api/transactions/${id}/approve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('kartal_token')}`
        }
      });
      await handleResponse(res);
      fetchPending();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/admin')}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Pending Approvals</h1>
            <p className="mt-1 text-gray-500">Review and approve transactions requiring manual verification.</p>
          </div>
        </div>
        <div className="bg-orange-100 text-orange-700 px-4 py-2 rounded-xl font-bold flex items-center">
          <Clock className="w-5 h-5 mr-2" />
          {pending.length} Pending
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      <div className="bg-white shadow-sm rounded-3xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-20 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-500 font-medium">Loading transactions...</p>
          </div>
        ) : pending.length > 0 ? (
          <div className="divide-y divide-gray-50">
            {pending.map((tx) => (
              <div key={tx.id} className="p-6 hover:bg-gray-50 transition-all">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-50 rounded-lg">
                        <AlertCircle className="w-5 h-5 text-orange-500" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">
                          Transaction ID: <span className="font-mono text-indigo-600">{tx.tx_id}</span>
                        </p>
                        <p className="text-xs text-gray-400">{new Date(tx.date).toLocaleString()}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-2xl">
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">User Email</p>
                        <p className="text-sm font-medium text-gray-700">{tx.user_email}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Amount & Tickets</p>
                        <p className="text-sm font-bold text-gray-900">PKR {tx.amount} &middot; {tx.ticket_count} Tickets</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Payment Method</p>
                        <p className="text-sm font-medium text-gray-700">{tx.payment_type}</p>
                      </div>
                    </div>

                    {tx.is_multi_person === 1 && (
                      <div className="inline-flex items-center px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold">
                        Multi-Person Transaction
                      </div>
                    )}
                  </div>

                  <div className="flex flex-row md:flex-col gap-3">
                    {tx.receipt_url && (
                      <a
                        href={tx.receipt_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 md:flex-none inline-flex items-center justify-center px-4 py-2 border border-gray-200 text-sm font-bold rounded-xl text-gray-700 bg-white hover:bg-gray-50 transition-all"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Receipt
                      </a>
                    )}
                    <button
                      onClick={() => approveTransaction(tx.id)}
                      className="flex-1 md:flex-none inline-flex items-center justify-center px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 shadow-sm transition-all"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Approve
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-20 text-center">
            <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-emerald-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">All Caught Up!</h3>
            <p className="mt-2 text-gray-500">No pending transactions require approval at this time.</p>
            <button 
              onClick={() => navigate('/admin')}
              className="mt-8 text-indigo-600 font-bold hover:text-indigo-700"
            >
              Back to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
