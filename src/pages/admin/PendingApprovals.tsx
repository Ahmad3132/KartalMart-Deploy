import React, { useState, useEffect } from 'react';
import { Check, AlertCircle, Eye } from 'lucide-react';

export default function PendingApprovals() {
  const [pending, setPending] = useState<any[]>([]);

  const fetchPending = () => {
    fetch('/api/transactions/pending', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('kartal_token')}`
      }
    })
      .then(async res => {
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to fetch pending transactions');
        }
        return res.json().catch(() => []);
      })
      .then(data => setPending(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.error('Pending fetch error:', err);
        setPending([]);
      });
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const approveTransaction = async (id: number) => {
    await fetch(`/api/transactions/${id}/approve`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('kartal_token')}`
      }
    });
    fetchPending();
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pending Approvals</h1>
        <p className="mt-1 text-sm text-gray-500">Review and approve duplicate transactions.</p>
      </div>

      <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Duplicate Transactions</h3>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
            {pending.length} Pending
          </span>
        </div>
        
        {pending.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {pending.map((tx) => (
              <li key={tx.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 mt-1">
                      <AlertCircle className="h-6 w-6 text-orange-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Transaction ID: <span className="font-mono">{tx.tx_id}</span>
                      </p>
                      <div className="mt-1 text-sm text-gray-500 space-y-1">
                        <p>User: {tx.user_email}</p>
                        <p>Amount: PKR {tx.amount} &middot; Tickets: {tx.ticket_count}</p>
                        <p>Payment: {tx.payment_type} {tx.receipt_url && <a href={tx.receipt_url} target="_blank" rel="noreferrer" className="text-indigo-600 underline ml-1">View Receipt</a>}</p>
                        <p>Date: {new Date(tx.date).toLocaleString()}</p>
                        {tx.is_multi_person === 1 && (
                          <div className="mt-2 p-2 bg-indigo-50 rounded border border-indigo-100">
                            <p className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-1">Multi-Person Transaction</p>
                            <p className="text-xs text-indigo-600 italic">Tickets will be generated for each participant upon approval.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-orange-100 text-orange-800">
                      Pending
                    </span>
                    {tx.receipt_url && (
                      <a
                        href={tx.receipt_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded shadow-sm text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View Receipt
                      </a>
                    )}
                    <button
                      onClick={() => approveTransaction(tx.id)}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Approve
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="px-4 py-12 text-center">
            <Check className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">All caught up</h3>
            <p className="mt-1 text-sm text-gray-500">No pending transactions require approval.</p>
          </div>
        )}
      </div>
    </div>
  );
}
