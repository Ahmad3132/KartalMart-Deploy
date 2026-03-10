import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Ticket, Clock, CheckCircle } from 'lucide-react';

export default function MyTickets() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);

  const fetchData = () => {
    if (user) {
      const headers = { 'Authorization': `Bearer ${localStorage.getItem('kartal_token')}` };
      fetch(`/api/tickets/user/${user.email}`, { headers })
        .then(res => res.json())
        .then(data => setTickets(Array.isArray(data) ? data : []))
        .catch(() => setTickets([]));
        
      fetch(`/api/transactions/user/${user.email}`, { headers })
        .then(res => res.json())
        .then(data => setTransactions(Array.isArray(data) ? data : []))
        .catch(() => setTransactions([]));
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleGenerateNow = async (txId: number) => {
    const name = prompt("Enter Customer Name:");
    if (!name) return;
    const mobile = prompt("Enter Mobile Number:");
    if (!mobile) return;
    const address = prompt("Enter Address:");
    if (!address) return;

    try {
      const res = await fetch(`/api/transactions/${txId}/generate`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('kartal_token')}`
        },
        body: JSON.stringify({ name, mobile, address, user_email: user?.email })
      });
      
      if (res.ok) {
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to generate');
      }
    } catch (err) {
      alert('Error generating tickets');
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Activity</h1>
        <p className="mt-1 text-sm text-gray-500">View your generated tickets and pending transactions.</p>
      </div>

      <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Transactions</h3>
        </div>
        <ul className="divide-y divide-gray-200">
          {transactions.map((tx) => (
            <li key={tx.id} className="px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {tx.status === 'Pending' ? (
                    <Clock className="h-5 w-5 text-orange-500 mr-3" />
                  ) : tx.status === 'Approved' ? (
                    <CheckCircle className="h-5 w-5 text-blue-500 mr-3" />
                  ) : (
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      TxID: <span className="font-mono">{tx.tx_id}</span>
                    </p>
                    <p className="text-sm text-gray-500">
                      {tx.ticket_count} Tickets &middot; PKR {tx.amount}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    tx.status === 'Pending' ? 'bg-orange-100 text-orange-800' :
                    tx.status === 'Approved' ? 'bg-blue-100 text-blue-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {tx.status}
                  </span>
                  
                  {tx.status === 'Approved' && (
                    <button
                      onClick={() => handleGenerateNow(tx.id)}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                      Generate Now
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
          {transactions.length === 0 && (
            <li className="px-4 py-6 text-center text-sm text-gray-500">No transactions found.</li>
          )}
        </ul>
      </div>

      <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Generated Tickets</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
          {tickets.map((ticket) => (
            <div key={ticket.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50 flex items-start space-x-4">
              <div className="bg-indigo-100 p-2 rounded-md">
                <Ticket className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900 tracking-wider">{ticket.ticket_id}</p>
                <p className="text-xs text-gray-500 mt-1">TxID: {ticket.tx_id}</p>
                <p className="text-xs text-gray-500">{new Date(ticket.date).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
          {tickets.length === 0 && (
            <div className="col-span-full text-center py-6 text-sm text-gray-500">
              No tickets generated yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
