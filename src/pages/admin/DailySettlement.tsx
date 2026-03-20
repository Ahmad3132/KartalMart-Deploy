import React, { useState, useEffect } from 'react';
import { Calendar, Lock, TrendingUp, TrendingDown, DollarSign, Ticket, Wifi, Banknote, CheckCircle } from 'lucide-react';

const h = () => ({ 'Authorization': `Bearer ${localStorage.getItem('kartal_token')}`, 'Content-Type': 'application/json' });

function toast(msg: string, isError = false) {
  const d = document.createElement('div');
  d.className = `fixed top-4 right-4 z-[9999] px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium ${isError ? 'bg-red-500' : 'bg-emerald-500'}`;
  d.textContent = msg; document.body.appendChild(d); setTimeout(() => d.remove(), 3000);
}

export default function DailySettlement() {
  const [today, setToday] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [notes, setNotes] = useState('');
  const [closing, setClosing] = useState(false);

  const load = async () => {
    try {
      const [tRes, hRes] = await Promise.all([
        fetch('/api/settlements/today', { headers: h() }),
        fetch('/api/settlements', { headers: h() })
      ]);
      if (tRes.ok) setToday(await tRes.json());
      if (hRes.ok) setHistory(await hRes.json());
    } catch {}
  };

  useEffect(() => { load(); }, []);

  const closeDay = async () => {
    if (!confirm('Are you sure you want to close today? This cannot be undone.')) return;
    setClosing(true);
    try {
      const r = await fetch('/api/settlements/close', { method: 'POST', headers: h(), body: JSON.stringify({ notes }) });
      if (r.ok) { toast('Day closed successfully!'); load(); }
      else { const d = await r.json(); toast(d.error || 'Failed', true); }
    } catch { toast('Failed', true); }
    setClosing(false);
  };

  const fmt = (n: number) => `PKR ${(n || 0).toLocaleString()}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Daily Settlement</h1>
        <p className="text-sm text-gray-500">End-of-day summary and closing</p>
      </div>

      {/* Today's Summary */}
      {today && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600" />
              {today.date} {today.closed && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Closed</span>}
            </h2>
            {!today.closed && (
              <button onClick={closeDay} disabled={closing}
                className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-red-700 disabled:opacity-50">
                <Lock className="w-4 h-4" /> {closing ? 'Closing...' : 'Close Day'}
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: 'Cash In', value: fmt(today.total_cash_in), icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
              { label: 'Cash Out', value: fmt(today.total_cash_out), icon: TrendingDown, color: 'text-red-600', bg: 'bg-red-50' },
              { label: 'Ticket Sales', value: fmt(today.total_ticket_sales), icon: Ticket, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Online', value: fmt(today.total_online), icon: Wifi, color: 'text-purple-600', bg: 'bg-purple-50' },
              { label: 'Cash Sales', value: fmt(today.total_cash), icon: Banknote, color: 'text-amber-600', bg: 'bg-amber-50' },
              { label: 'Net Balance', value: fmt(today.net_balance), icon: DollarSign, color: today.net_balance >= 0 ? 'text-green-600' : 'text-red-600', bg: today.net_balance >= 0 ? 'bg-green-50' : 'bg-red-50' },
            ].map((s, i) => (
              <div key={i} className={`${s.bg} rounded-xl p-4`}>
                <s.icon className={`w-5 h-5 ${s.color} mb-2`} />
                <p className="text-[10px] font-bold text-gray-400 uppercase">{s.label}</p>
                <p className={`font-bold text-sm ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {!today.closed && (
            <div className="mt-4">
              <label className="text-xs font-semibold text-gray-500">Closing Notes</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                placeholder="Add notes for today's closing..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm mt-1 resize-none" />
            </div>
          )}
        </div>
      )}

      {/* History */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">Settlement History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase">
              <th className="px-4 py-3">Date</th><th className="px-4 py-3">Cash In</th><th className="px-4 py-3">Cash Out</th>
              <th className="px-4 py-3">Ticket Sales</th><th className="px-4 py-3">Net</th><th className="px-4 py-3">Closed By</th>
              <th className="px-4 py-3">Notes</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {history.length === 0 ? <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No settlements yet</td></tr> :
               history.map(s => (
                <tr key={s.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-medium">{s.date}</td>
                  <td className="px-4 py-3 text-green-600 font-medium">{fmt(s.total_cash_in)}</td>
                  <td className="px-4 py-3 text-red-600 font-medium">{fmt(s.total_cash_out)}</td>
                  <td className="px-4 py-3">{fmt(s.total_ticket_sales)}</td>
                  <td className={`px-4 py-3 font-bold ${s.net_balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fmt(s.net_balance)}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{s.closed_by}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs max-w-[150px] truncate">{s.notes || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
