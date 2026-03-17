import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Ticket, CheckCircle, Clock, PlusCircle, History, ArrowRight, Printer, Send, Search } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

export default function UserDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [recentTickets, setRecentTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      const headers = { 'Authorization': `Bearer ${localStorage.getItem('kartal_token')}` };
      
      Promise.all([
        fetch(`/api/stats/user/${user.email}`, { headers }),
        fetch(`/api/tickets/user/${user.email}`, { headers })
      ])
        .then(async ([statsRes, ticketsRes]) => {
          if (!statsRes.ok || !ticketsRes.ok) throw new Error('Failed to fetch data');
          const statsData = await statsRes.json();
          const ticketsData = await ticketsRes.json();
          setStats(statsData);
          setRecentTickets(ticketsData.slice(0, 5));
          setLoading(false);
        })
        .catch(err => {
          console.error('Dashboard data fetch error:', err);
          setLoading(false);
        });
    }
  }, [user]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );

  const statCards = [
    { name: 'Tickets Today', value: stats?.ticketsToday || 0, icon: Ticket, color: 'text-blue-600', bg: 'bg-blue-50' },
    { name: 'Tickets This Month', value: stats?.ticketsMonth || 0, icon: Ticket, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { name: 'Pending Approvals', value: stats?.pendingTxs || 0, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
    { name: 'Approved Transactions', value: stats?.approvedTxs || 0, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Welcome Section */}
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.name || user?.email}!</h1>
          <p className="mt-2 text-gray-500 max-w-xl">
            Track your ticket sales, manage transactions, and generate new tickets for the Kartal Group campaign.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => navigate('/user/generate')}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 transition-all transform hover:scale-105"
          >
            <PlusCircle className="w-5 h-5 mr-2" />
            Generate Ticket
          </button>
          <button
            onClick={() => navigate('/user/tickets')}
            className="inline-flex items-center px-6 py-3 border border-gray-200 text-base font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 transition-all"
          >
            <History className="w-5 h-5 mr-2" />
            My History
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="bg-white overflow-hidden shadow-sm rounded-2xl border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className={`p-3 rounded-xl ${stat.bg}`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Tickets Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900 flex items-center">
              <Ticket className="w-5 h-5 mr-2 text-indigo-600" />
              Recent Tickets
            </h3>
            <Link to="/user/tickets" className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center">
              View All <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Ticket ID</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-50">
                {recentTickets.length > 0 ? (
                  recentTickets.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-bold text-indigo-600">
                        {ticket.ticket_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{ticket.name}</div>
                        <div className="text-xs text-gray-500">{ticket.mobile}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(ticket.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                          ticket.printed_count > 0 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {ticket.printed_count > 0 ? 'Printed' : 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-gray-500 italic">
                      No tickets generated yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions & Info */}
        <div className="space-y-6">
          <div className="bg-indigo-900 rounded-2xl p-6 text-white shadow-lg">
            <h3 className="text-lg font-bold mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/user/generate')}
                className="w-full flex items-center justify-between p-4 bg-white/10 hover:bg-white/20 rounded-xl transition-colors group"
              >
                <div className="flex items-center">
                  <PlusCircle className="w-5 h-5 mr-3 text-indigo-300" />
                  <span className="font-medium">New Ticket</span>
                </div>
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all transform translate-x-0 group-hover:translate-x-1" />
              </button>
              <button
                onClick={() => navigate('/scanner')}
                className="w-full flex items-center justify-between p-4 bg-white/10 hover:bg-white/20 rounded-xl transition-colors group"
              >
                <div className="flex items-center">
                  <Search className="w-5 h-5 mr-3 text-indigo-300" />
                  <span className="font-medium">Verify Ticket</span>
                </div>
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all transform translate-x-0 group-hover:translate-x-1" />
              </button>
              <button
                onClick={() => navigate('/user/bulk-print')}
                className="w-full flex items-center justify-between p-4 bg-white/10 hover:bg-white/20 rounded-xl transition-colors group"
              >
                <div className="flex items-center">
                  <Printer className="w-5 h-5 mr-3 text-indigo-300" />
                  <span className="font-medium">Bulk Print</span>
                </div>
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all transform translate-x-0 group-hover:translate-x-1" />
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Campaign Info</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Status</span>
                <span className="font-bold text-green-600 uppercase">Active</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Total Sales</span>
                <span className="font-bold text-gray-900">{stats?.approvedTxs || 0}</span>
              </div>
              <div className="pt-4 border-t border-gray-50">
                <p className="text-xs text-gray-400 italic">
                  Need help? Contact your administrator for support.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
