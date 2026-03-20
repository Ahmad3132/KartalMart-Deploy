import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Ticket, Clock, CheckCircle, XCircle, Eye, ArrowRight } from 'lucide-react';

export default function MyTickets() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    if (!user) return;
    const headers = { 'Authorization': `Bearer ${localStorage.getItem('kartal_token')}` };
    setLoading(true);
    Promise.all([
      fetch(`/api/tickets/user/${user.email}`, { headers }).then(r => r.json()).catch(() => []),
      fetch(`/api/transactions/user/${user.email}`, { headers }).then(r => r.json()).catch(() => []),
    ]).then(([t, tx]) => {
      setTickets(Array.isArray(t) ? t : []);
      setTransactions(Array.isArray(tx) ? tx : []);
      setLoading(false);
    });
  };

  useEffect(() => { fetchData(); }, [user]);

  const statusIcon = (status: string) => {
    if (status === 'Pending') return <Clock className="h-5 w-5 text-orange-500" />;
    if (status === 'Generated') return <CheckCircle className="h-5 w-5 text-green-500" />;
    if (status === 'Rejected') return <XCircle className="h-5 w-5 text-red-500" />;
    return <CheckCircle className="h-5 w-5 text-blue-500" />;
  };

  const statusColor = (status: string) => {
    if (status === 'Pending') return 'bg-orange-100 text-orange-700';
    if (status === 'Generated') return 'bg-green-100 text-green-700';
    if (status === 'Rejected') return 'bg-red-100 text-red-700';
    return 'bg-blue-100 text-blue-700';
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[300px]">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Activity</h1>
        <p className="mt-1 text-sm text-gray-500">Your transactions and generated tickets.</p>
      </div>

      {/* Transactions */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-900">Transactions</h3>
          <span className="text-xs text-gray-400">{transactions.length} total</span>
        </div>
        {transactions.length === 0 ? (
          <div className="px-6 py-10 text-center text-gray-400 text-sm">No transactions yet.</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {transactions.map((tx) => (
              <div key={tx.id} className="px-6 py-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  {statusIcon(tx.status)}
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 font-mono truncate">{tx.tx_id}</p>
                    <p className="text-xs text-gray-500">{tx.ticket_count} ticket{tx.ticket_count !== 1 ? 's' : ''} · PKR {Number(tx.amount).toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${statusColor(tx.status)}`}>
                    {tx.status}
                  </span>
                  {tx.status === 'Generated' && (
                    <button
                      onClick={() => {
                        const base = user?.role === 'Admin' ? '/admin' : '/user';
                        navigate(`${base}/success/${tx.tx_id}`);
                      }}
                      className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                    >
                      View <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tickets Grid */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-900">Generated Tickets</h3>
          <span className="text-xs text-gray-400">{tickets.length} total</span>
        </div>
        {tickets.length === 0 ? (
          <div className="px-6 py-10 text-center text-gray-400 text-sm">No tickets generated yet.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 p-4">
            {tickets.map((ticket) => (
              <div key={ticket.id} className="border border-gray-100 rounded-xl p-3 bg-gray-50 hover:border-indigo-200 hover:bg-indigo-50 transition-colors cursor-pointer group">
                <div className="flex items-center gap-2 mb-2">
                  <div className="bg-indigo-100 p-1.5 rounded-lg group-hover:bg-indigo-200 transition-colors">
                    <Ticket className="h-4 w-4 text-indigo-600" />
                  </div>
                </div>
                <p className="text-sm font-black text-gray-900 tracking-wider font-mono">{ticket.ticket_id}</p>
                <p className="text-xs text-gray-500 mt-0.5 truncate">{ticket.name}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{new Date(ticket.date).toLocaleDateString()}</p>
                {ticket.printed_count > 0 && (
                  <span className="mt-1.5 inline-block text-[9px] font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">
                    Printed {ticket.printed_count}×
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
