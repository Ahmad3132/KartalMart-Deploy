import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Phone, MapPin, CreditCard, Calendar, Shield, Printer, MessageSquare, Share2, Send, FileDown, History, TrendingUp, Ticket, Eye, Search } from 'lucide-react';

export default function CustomerDetail() {
  const { mobile } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({ key: 'date', direction: 'desc' });
  const [historyFilter, setHistoryFilter] = useState('');

  useEffect(() => {
    fetchCustomerData();
  }, [mobile]);

  const fetchCustomerData = async () => {
    try {
      const res = await fetch(`/api/admin/customers/${mobile}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('kartal_token')}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch customer details');
      setData(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const sortedHistory = React.useMemo(() => {
    if (!data?.history) return [];
    let items = [...data.history];
    if (historyFilter) {
      items = items.filter(item => 
        item.ticket_id.toString().includes(historyFilter) || 
        item.tx_id.toLowerCase().includes(historyFilter.toLowerCase())
      );
    }
    items.sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
      if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return items;
  }, [data?.history, sortConfig, historyFilter]);

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );

  if (error || !data) return (
    <div className="bg-red-50 p-6 rounded-xl border border-red-100 text-center">
      <p className="text-red-700">{error || 'Customer not found'}</p>
      <button onClick={() => navigate(-1)} className="mt-4 text-indigo-600 font-medium flex items-center justify-center mx-auto">
        <ArrowLeft className="w-4 h-4 mr-1" /> Go Back
      </button>
    </div>
  );

  const { customer, history } = data;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="flex items-center text-gray-600 hover:text-gray-900 transition-colors">
          <ArrowLeft className="w-5 h-5 mr-1" />
          Back to directory
        </button>
        <div className="flex space-x-2">
          <button 
            onClick={() => window.print()}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center"
          >
            <Printer className="w-4 h-4 mr-2" /> Print Summary
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-8 text-center bg-indigo-600 text-white">
              <div className="h-24 w-24 rounded-full bg-white/20 flex items-center justify-center text-white font-black text-4xl mx-auto mb-4 border-4 border-white/30">
                {customer.name.charAt(0)}
              </div>
              <h2 className="text-2xl font-black">{customer.name}</h2>
              <p className="text-indigo-100 flex items-center justify-center mt-1">
                <Phone className="w-4 h-4 mr-2" /> {customer.mobile}
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-start">
                <MapPin className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Address</label>
                  <p className="text-gray-900 font-medium">{customer.address || 'No address provided'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50">
                <div className="bg-gray-50 p-3 rounded-xl">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Total Spent</label>
                  <p className="text-indigo-700 font-black text-lg">Rs. {customer.total_spent.toLocaleString()}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Transactions</label>
                  <p className="text-gray-900 font-black text-lg">{customer.total_transactions}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 rounded-2xl p-6 text-white shadow-lg">
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4 flex items-center">
              <TrendingUp className="w-4 h-4 mr-2 text-indigo-400" />
              Marketing Insights
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-xs">Customer Value</span>
                <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded text-[10px] font-bold uppercase">
                  {customer.total_spent > 5000 ? 'High Value' : 'Standard'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-xs">Total Tickets</span>
                <span className="font-bold text-indigo-400">{customer.total_tickets}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-xs">Average Ticket Value</span>
                <span className="font-bold text-indigo-400">Rs. {(customer.total_spent / customer.total_transactions).toFixed(0)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex flex-col sm:flex-row sm:items-center justify-between bg-gray-50/50 gap-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center">
                <History className="w-5 h-5 mr-2 text-indigo-600" />
                Full Transaction History
              </h3>
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Search history..." 
                    value={historyFilter}
                    onChange={(e) => setHistoryFilter(e.target.value)}
                    className="pl-9 pr-4 py-1.5 border border-gray-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <span className="text-xs text-gray-500 font-medium whitespace-nowrap">
                  {sortedHistory.length} records
                </span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th onClick={() => requestSort('date')} className="px-6 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">Date</th>
                    <th onClick={() => requestSort('ticket_id')} className="px-6 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">Ticket ID</th>
                    <th onClick={() => requestSort('tx_id')} className="px-6 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">Tx ID</th>
                    <th onClick={() => requestSort('amount')} className="px-6 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">Amount</th>
                    <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-right text-[10px] font-bold text-gray-500 uppercase tracking-wider">Details</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedHistory.map((item: any) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                        {new Date(item.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-black text-gray-900">{item.ticket_id}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-xs font-mono text-indigo-600">{item.tx_id}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-bold text-gray-900">
                          {item.person_ticket_index === 1 ? `Rs. ${item.amount}` : '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          item.status === 'Approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {item.status || 'Generated'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button 
                          onClick={() => navigate(`/admin/tickets/${item.ticket_id}`)}
                          className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
