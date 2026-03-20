import React, { useState, useEffect } from 'react';
import { FileText, Search, User, Clock, Activity, LogIn, Shield } from 'lucide-react';

const h = () => ({ 'Authorization': `Bearer ${localStorage.getItem('kartal_token')}` });

export default function AuditLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loginLogs, setLoginLogs] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [tab, setTab] = useState<'activity' | 'logins'>('activity');

  useEffect(() => {
    fetch('/api/audit-logs', { headers: h() })
      .then(async res => {
        if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || 'Failed'); }
        return res.json().catch(() => []);
      })
      .then(data => setLogs(Array.isArray(data) ? data : []))
      .catch(() => setLogs([]));

    fetch('/api/audit/login-logs', { headers: h() })
      .then(async res => res.ok ? res.json() : [])
      .then(data => setLoginLogs(Array.isArray(data) ? data : []))
      .catch(() => setLoginLogs([]));
  }, []);

  const filteredLogs = logs.filter(log =>
    (log.action?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (log.details?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (log.user_email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const filteredLoginLogs = loginLogs.filter(log =>
    (log.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (log.ip_address?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
        <p className="mt-1 text-sm text-gray-500">Trace all system activities, logins, and security events.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {[
          { id: 'activity' as const, label: 'Activity Logs', icon: Activity },
          { id: 'logins' as const, label: 'Login History', icon: LogIn },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Search logs..." value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
        </div>

        {tab === 'activity' && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center"><Clock className="h-4 w-4 mr-2 text-gray-400" />{new Date(log.timestamp).toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center"><User className="h-4 w-4 mr-2 text-gray-400" />
                        <div><div className="font-medium">{log.nick_name || log.user_email}</div>
                          {log.nick_name && <div className="text-[10px] text-gray-400">{log.user_email}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        log.action === 'Create Ticket' ? 'bg-green-100 text-green-800' :
                        log.action === 'Print Ticket' ? 'bg-blue-100 text-blue-800' :
                        log.action === 'Send PDF' || log.action === 'Send PDF Batch' ? 'bg-purple-100 text-purple-800' :
                        log.action === 'Password Changed' ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>{log.action}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{log.details}</td>
                  </tr>
                ))}
                {filteredLogs.length === 0 && (
                  <tr><td colSpan={4} className="px-6 py-12 text-center text-sm text-gray-500">
                    <Activity className="mx-auto h-12 w-12 text-gray-300 mb-2" />No logs found.
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'logins' && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP Address</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User Agent</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLoginLogs.map((log, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center"><Clock className="h-4 w-4 mr-2 text-gray-400" />{new Date(log.timestamp || log.created_at).toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{log.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        log.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>{log.success ? 'Success' : 'Failed'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.ip_address || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-[200px] truncate">{log.user_agent || '-'}</td>
                  </tr>
                ))}
                {filteredLoginLogs.length === 0 && (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500">
                    <Shield className="mx-auto h-12 w-12 text-gray-300 mb-2" />No login logs found.
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
