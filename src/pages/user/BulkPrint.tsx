import React, { useState, useEffect } from 'react';
import { Printer, Search, Calendar, Filter, CheckCircle, AlertCircle, Ticket } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

// Format Pakistani mobile for WhatsApp
function formatWANumber(mobile: string): string {
  const clean = (mobile || '').replace(/\D/g, '');
  if (clean.startsWith('92')) return clean;
  if (clean.startsWith('0')) return '92' + clean.slice(1);
  if (clean.startsWith('3')) return '92' + clean;
  return clean;
}

// Open thermal print window
async function openThermalPrint(tickets: any[], isAdmin: boolean) {
  const win = window.open('', '_blank', 'width=420,height=700,menubar=no,toolbar=no');
  if (!win) { alert('Please allow popups to enable printing.'); return; }

  const ticketBlocks = tickets.map(ticket => {
    const mobile = isAdmin ? (ticket.mobile || '') : (ticket.mobile || '').slice(0, -3) + '***';
    const date = new Date(ticket.date).toLocaleDateString('en-PK', { day: '2-digit', month: '2-digit', year: '2-digit' });
    return `
<div style="width:72mm;page-break-inside:avoid;font-family:'Courier New',monospace;font-size:11px;color:#000;background:#fff;margin-bottom:4mm;padding-bottom:2mm;">
  <div style="text-align:center;border-bottom:2px solid #000;padding-bottom:2mm;margin-bottom:2mm;">
    <div style="font-size:15px;font-weight:900;letter-spacing:3px;font-family:Georgia,serif;">KARTAL</div>
    <div style="font-size:7px;letter-spacing:2px;">GROUP OF COMPANIES</div>
    <div style="font-size:7px;border-top:1px dashed #000;margin-top:1.5mm;padding-top:1.5mm;">*** KARTAL MART ***</div>
  </div>
  <div style="text-align:center;background:#000;color:#fff;padding:2mm;margin-bottom:2mm;">
    <div style="font-size:7px;letter-spacing:2px;">TICKET NUMBER</div>
    <div style="font-size:21px;font-weight:900;letter-spacing:3px;">${ticket.ticket_id}</div>
  </div>
  <div style="border-top:1px dashed #000;border-bottom:1px dashed #000;padding:1.5mm 0;margin-bottom:1.5mm;">
    <div style="display:flex;justify-content:space-between;"><span style="color:#555;font-size:9px;">Name:</span><span style="font-weight:900;">${ticket.name}</span></div>
    <div style="display:flex;justify-content:space-between;"><span style="color:#555;font-size:9px;">Mobile:</span><span>${mobile}</span></div>
  </div>
  <div style="padding:1mm 0;margin-bottom:1.5mm;font-size:9px;">
    <div style="display:flex;justify-content:space-between;"><span style="color:#555;">TX ID:</span><span style="font-family:monospace;">${ticket.tx_id}</span></div>
    <div style="display:flex;justify-content:space-between;"><span style="color:#555;">Date:</span><span>${date}</span></div>
  </div>
  <div style="border-top:2px solid #000;padding-top:1.5mm;text-align:center;font-size:8px;">*** KEEP THIS TICKET SAFE ***</div>
</div>`;
  }).join('<div style="height:1mm;"></div>');

  win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Bulk Print</title>
<style>* { margin:0;padding:0;box-sizing:border-box; } @page { size:80mm auto;margin:2mm; } html,body{width:80mm;background:#fff;} body{display:flex;flex-direction:column;align-items:center;padding:2mm;} @media screen{body{background:#ddd;padding:10px;}}</style>
</head><body>${ticketBlocks}
<script>window.onload=function(){setTimeout(function(){window.print();setTimeout(function(){window.close();},1500);},400);};</script>
</body></html>`);
  win.document.close();
}

export default function BulkPrint() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [filterType, setFilterType] = useState<'all' | 'unprinted' | 'approved_unprinted'>('all');
  const [selectedTickets, setSelectedTickets] = useState<number[]>([]);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/tickets?limit=1000', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('kartal_token')}` }
      });
      const data = await res.json();
      setTickets(Array.isArray(data.tickets) ? data.tickets : []);
    } catch (err) {
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredTickets = tickets.filter(t => {
    const ticketDate = new Date(t.date).toISOString().split('T')[0];
    const inDateRange = (!dateRange.start || ticketDate >= dateRange.start) && 
                        (!dateRange.end || ticketDate <= dateRange.end);
    
    let matchesFilter = true;
    if (filterType === 'unprinted') matchesFilter = t.printed_count === 0;
    // Note: 'approved_unprinted' logic depends on transaction status, which we might need to join or fetch
    // For now, let's treat unprinted as the primary filter
    
    return inDateRange && matchesFilter;
  });

  const handleSelectAll = () => {
    if (selectedTickets.length === filteredTickets.length) {
      setSelectedTickets([]);
    } else {
      setSelectedTickets(filteredTickets.map(t => t.id));
    }
  };

  const handleToggleSelect = (id: number) => {
    setSelectedTickets(prev => 
      prev.includes(id) ? prev.filter(tId => tId !== id) : [...prev, id]
    );
  };

  const handleBulkPrint = async () => {
    if (selectedTickets.length === 0) return;
    if (!window.confirm(`Print ${selectedTickets.length} ticket(s) on thermal printer?`)) return;

    try {
      const res = await fetch('/api/tickets/bulk-print', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('kartal_token')}`
        },
        body: JSON.stringify({
          ticketIds: selectedTickets,
          user_email: user?.email,
          role: user?.role
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Bulk print failed');

      // Get the full ticket data for selected tickets and open thermal print
      const toPrint = filteredTickets.filter(t => selectedTickets.includes(t.id));
      await openThermalPrint(toPrint, user?.role === 'Admin');

      fetchTickets();
      setSelectedTickets([]);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bulk Printing</h1>
        <p className="mt-1 text-sm text-gray-500">Print multiple tickets at once based on date range or status.</p>
      </div>

      <div className="bg-white shadow-sm rounded-xl border border-gray-200 p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input 
              type="date" 
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="w-full border rounded-lg p-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input 
              type="date" 
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="w-full border rounded-lg p-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter Type</label>
            <select 
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="w-full border rounded-lg p-2 text-sm"
            >
              <option value="all">All Tickets</option>
              <option value="unprinted">Unprinted Only</option>
            </select>
          </div>
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <p className="text-sm text-gray-500">
            Selected <span className="font-bold text-indigo-600">{selectedTickets.length}</span> of {filteredTickets.length} tickets
          </p>
          <button
            onClick={handleBulkPrint}
            disabled={selectedTickets.length === 0}
            className="inline-flex items-center px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            <Printer className="w-4 h-4 mr-2" />
            Print Selected Tickets
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>{error}</span>
          </div>
        </div>
      )}

      <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">
                <input 
                  type="checkbox" 
                  checked={selectedTickets.length === filteredTickets.length && filteredTickets.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ticket ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Printed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredTickets.map(t => (
              <tr key={t.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <input 
                    type="checkbox" 
                    checked={selectedTickets.includes(t.id)}
                    onChange={() => handleToggleSelect(t.id)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </td>
                <td className="px-6 py-4 text-sm font-bold text-indigo-600">{t.ticket_id}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{t.name}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{new Date(t.date).toLocaleDateString()}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{t.printed_count}x</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
