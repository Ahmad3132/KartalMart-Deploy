import React, { useState, useEffect } from 'react';
import { Search, FileText, Printer } from 'lucide-react';
import { maskMobile, formatDate } from '../../utils/api';

export default function UserReports() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const token = localStorage.getItem('kartal_token');

  useEffect(() => {
    fetch('/api/tickets?limit=200', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(r => r.json()).then(d => setTickets(Array.isArray(d.tickets) ? d.tickets : [])).catch(() => setTickets([])).finally(() => setLoading(false));
  }, []);

  const filtered = tickets.filter(t => !search || t.ticket_id?.toLowerCase().includes(search.toLowerCase()) || t.name?.toLowerCase().includes(search.toLowerCase()));

  const stats = [
    { label: 'Total Tickets', value: tickets.length, icon: FileText, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Printed', value: tickets.filter(t => t.printed_count > 0).length, icon: Printer, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Not Printed', value: tickets.filter(t => t.printed_count === 0).length, icon: FileText, color: 'text-orange-600', bg: 'bg-orange-50' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Reports</h1>
        <p className="text-sm text-gray-500 mt-1">Your ticket generation history.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${s.bg}`}>
                  <Icon className={`w-5 h-5 ${s.color}`} />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{s.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          placeholder="Search ticket ID or customer..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Ticket ID</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Mobile</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Printed</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-50">
                {filtered.map(t => (
                  <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3 whitespace-nowrap">
                      <span className="text-sm font-mono font-bold text-indigo-600">{t.ticket_id}</span>
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{t.name}</td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500 font-mono">{maskMobile(t.mobile, false)}</td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">{formatDate(t.created_at)}</td>
                    <td className="px-6 py-3 whitespace-nowrap">
                      {t.printed_count > 0
                        ? <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700">{t.printed_count}×</span>
                        : <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-500">No</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
