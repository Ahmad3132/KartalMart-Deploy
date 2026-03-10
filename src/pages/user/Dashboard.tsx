import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Ticket, CheckCircle, Clock } from 'lucide-react';

export default function UserDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    if (user) {
      fetch(`/api/stats/user/${user.email}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('kartal_token')}` }
      })
        .then(async res => {
          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.message || 'Failed to fetch stats');
          }
          return res.json();
        })
        .then(data => setStats(data))
        .catch(err => {
          console.error('Failed to fetch user stats:', err);
          setStats({
            ticketsToday: 0,
            ticketsMonth: 0,
            pendingTxs: 0,
            approvedTxs: 0
          });
        });
    }
  }, [user]);

  if (!stats) return <div className="animate-pulse flex space-x-4"><div className="flex-1 space-y-4 py-1"><div className="h-4 bg-gray-200 rounded w-3/4"></div></div></div>;

  const statCards = [
    { name: 'Tickets Today', value: stats.ticketsToday, icon: Ticket, color: 'text-green-600', bg: 'bg-green-100' },
    { name: 'Tickets This Month', value: stats.ticketsMonth, icon: Ticket, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { name: 'Pending Transactions', value: stats.pendingTxs, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-100' },
    { name: 'Approved Transactions', value: stats.approvedTxs, icon: CheckCircle, color: 'text-blue-600', bg: 'bg-blue-100' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Kartal Group Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="bg-white overflow-hidden shadow-sm rounded-xl border border-gray-100">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`p-3 rounded-lg ${stat.bg}`}>
                      <Icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">{stat.name}</dt>
                      <dd>
                        <div className="text-2xl font-semibold text-gray-900">{stat.value}</div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
