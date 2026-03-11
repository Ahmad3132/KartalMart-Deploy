import React, { useState, useEffect } from 'react';
import { Search, Phone, ArrowRight, Download, User, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { handleResponse } from '../../utils/api';

export default function Customers() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchCustomers();
  }, [searchTerm]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/customers?search=${searchTerm}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('kartal_token')}` }
      });
      const data = await handleResponse(res);
      setCustomers(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    try {
      const headers = ['Name', 'Mobile', 'Address', 'Total Transactions', 'Total Tickets', 'Total Spent', 'Last Visit'];
      const rows = customers.map(c => [
        `"${(c.name || '').replace(/"/g, '""')}"`,
        `"${(c.mobile || '').replace(/"/g, '""')}"`,
        `"${(c.address || 'N/A').replace(/"/g, '""')}"`,
        c.total_transactions,
        c.total_tickets,
        c.total_spent,
        `"${new Date(c.last_visit).toLocaleDateString()}"`
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(r => r.join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `customers_export_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customer Directory</h1>
          <p className="mt-1 text-gray-500">Manage and track customer spending and history</p>
        </div>
        <div className="flex items-center gap-3">
          {user?.role === 'Admin' && (
            <button
              onClick={exportToCSV}
              className="inline-flex items-center px-6 py-3 bg-white border border-gray-200 shadow-sm text-sm font-bold rounded-xl text-gray-700 hover:bg-gray-50 transition-all"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-50 bg-gray-50/30">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, mobile or address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Activity</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Total Spent</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Last Visit</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-500 font-medium">Loading customers...</p>
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <User className="w-8 h-8 text-gray-300" />
                    </div>
                    <p className="text-gray-500 font-medium">No customers found</p>
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr key={customer.mobile} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-lg">
                          {customer.name.charAt(0)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-bold text-gray-900">{customer.name}</div>
                          <div className="flex gap-2 mt-1">
                            {customer.total_spent > 5000 && (
                              <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-lg uppercase tracking-wider">VIP</span>
                            )}
                            {customer.total_transactions > 5 && (
                              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-lg uppercase tracking-wider">Loyal</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600 flex items-center">
                        <Phone className="w-4 h-4 mr-2 text-gray-400" />
                        {customer.mobile}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-xs text-gray-900">
                        <span className="font-bold text-indigo-600">{customer.total_transactions}</span> Transactions
                      </div>
                      <div className="text-xs text-gray-400">
                        <span className="font-bold">{customer.total_tickets}</span> Tickets
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-black text-gray-900">
                        PKR {customer.total_spent.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(customer.last_visit).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => navigate(`/admin/customers/${customer.mobile}`)}
                        className="inline-flex items-center px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-bold hover:bg-indigo-100 transition-all"
                      >
                        Details <ArrowRight className="w-4 h-4 ml-2" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
