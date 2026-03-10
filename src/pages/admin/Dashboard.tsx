import React, { useEffect, useState, useRef } from 'react';
import { Users, Ticket, CheckCircle, Activity, Printer, Eye, Search, AlertCircle, Edit2, Send, FileDown, TrendingUp, DollarSign, UserPlus, PieChart as PieChartIcon, BarChart as BarChartIcon, MessageSquare } from 'lucide-react';
import { handleResponse } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { QRCodeSVG } from 'qrcode.react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { TicketCard } from '../../components/TicketCard';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [graphData, setGraphData] = useState<any>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [totalTickets, setTotalTickets] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [pendingTxs, setPendingTxs] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [editingTicket, setEditingTicket] = useState<any>(null);
  const [error, setError] = useState('');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const ticketRef = useRef<HTMLDivElement>(null);
  const [pdfTicket, setPdfTicket] = useState<any>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    fetchData();
    fetchGraphData();
  }, [currentPage, statusFilter, searchTerm, startDate, endDate]);

  const fetchData = async () => {
    try {
      const headers = { 'Authorization': `Bearer ${localStorage.getItem('kartal_token')}` };
      const [sRes, tRes, pRes] = await Promise.all([
        fetch('/api/stats/admin', { headers }),
        fetch(`/api/tickets?page=${currentPage}&status=${statusFilter}&search=${searchTerm}&startDate=${startDate}&endDate=${endDate}`, { headers }),
        fetch('/api/transactions/pending', { headers })
      ]);
      
      if (!sRes.ok) throw new Error('Failed to fetch stats');
      if (!tRes.ok) throw new Error('Failed to fetch tickets');
      if (!pRes.ok) throw new Error('Failed to fetch pending transactions');

      const statsData = await sRes.json();
      const ticketsRes = await tRes.json();
      const pendingData = await pRes.json();

      setStats(statsData);
      setTickets(ticketsRes.tickets || []);
      setTotalTickets(ticketsRes.totalCount || 0);
      setPendingTxs(pendingData || []);
    } catch (err: any) {
      console.error('Failed to fetch dashboard data:', err);
      setError(err.message);
    }
  };

  const fetchGraphData = async () => {
    try {
      const res = await fetch('/api/admin/stats/graphs', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('kartal_token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setGraphData(data);
      }
    } catch (err) {
      console.error('Failed to fetch graph data:', err);
    }
  };

  const handleSendPDF = async (ticket: any) => {
    setPdfTicket(ticket);
    setIsGeneratingPDF(true);
    
    // Small delay to allow React to render the hidden ticket component
    await new Promise(resolve => setTimeout(resolve, 50));

    try {
      if (!ticketRef.current) {
        throw new Error('Ticket element not found');
      }
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const canvas = await html2canvas(ticketRef.current, {
        scale: 1.1, // Slightly reduced for speed
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        imageTimeout: 0,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.5);
      const imgWidth = 190;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'JPEG', 10, 10, imgWidth, imgHeight, undefined, 'FAST');
      
      const fileName = `Ticket-${ticket.ticket_id}.pdf`;

      // Log the share attempt
      fetch(`/api/tickets/${ticket.id}/share/pdf`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('kartal_token')}` }
      }).catch(() => {}); // Ignore logging errors

      const pdfBlob = pdf.output('blob');
      const file = new File([pdfBlob], fileName, { type: 'application/pdf' });

      // Try to share using Web Share API
      let shared = false;
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: 'Kartal Group Ticket',
            text: 'Please find your ticket attached.',
          });
          shared = true;
        } catch (shareErr: any) {
          console.warn('Web Share failed, falling back to download:', shareErr);
          // If it's a gesture error, we'll fall back to download below
        }
      }

        if (!shared) {
          pdf.save(fileName);
          // Also try to open WhatsApp as a fallback if sharing failed
          const message = `Kartal Group Ticket\nID: ${ticket.ticket_id}\nName: ${ticket.name}\nTxID: ${ticket.tx_id}`;
          const url = `https://wa.me/${ticket.mobile.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
          window.open(url, 'whatsapp');
        }
    } catch (err) {
      console.error('PDF generation error:', err);
      setError('Failed to generate PDF. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
      setPdfTicket(null);
    }
  };

  const handleApprove = async (txId: number) => {
    if (!window.confirm('Are you sure you want to approve this transaction?')) return;
    try {
      const res = await fetch(`/api/transactions/${txId}/approve`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('kartal_token')}` }
      });
      await handleResponse(res);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handlePrint = async (ticket: any) => {
    try {
      const res = await fetch(`/api/tickets/${ticket.id}/print`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('kartal_token')}`
        },
        body: JSON.stringify({ user_email: user?.email, role: user?.role }),
      });
      
      await handleResponse(res);
      
      fetchData();
      window.print();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEditTicket = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData);
    
    try {
      const res = await fetch(`/api/tickets/${editingTicket.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('kartal_token')}`
        },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) throw new Error('Failed to update ticket');
      
      setEditingTicket(null);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const maskMobile = (mobile: string) => {
    if (!mobile) return '';
    return mobile.slice(0, -3) + '***';
  };

  if (!stats) return <div className="animate-pulse p-8">Loading...</div>;

  const statCards = [
    { name: 'Active Campaign', value: stats.activeCampaign, icon: Activity, color: 'text-blue-600', bg: 'bg-blue-100' },
    { name: 'Tickets Today', value: stats.ticketsToday, icon: Ticket, color: 'text-green-600', bg: 'bg-green-100' },
    { name: 'Tickets This Month', value: stats.ticketsMonth, icon: Ticket, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { name: 'Pending Approvals', value: stats.pendingApprovals, icon: CheckCircle, color: 'text-orange-600', bg: 'bg-orange-100' },
    { name: 'Total Revenue', value: `PKR ${stats.totalRevenue.toLocaleString()}`, icon: Activity, color: 'text-purple-600', bg: 'bg-purple-100' },
    { name: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-100' },
  ];

  const filteredTickets = tickets.filter(t => 
    (t.ticket_id?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (t.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (t.tx_id?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Kartal Group Admin Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
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

      {isMounted && graphData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-indigo-600" />
              Revenue Trend (Last 30 Days)
            </h3>
            <div className="min-h-[256px] relative">
              <ResponsiveContainer width="99%" height={256} minWidth={0} minHeight={0} debounce={100}>
                <LineChart data={graphData.revenue}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="day" fontSize={10} />
                  <YAxis fontSize={10} />
                  <Tooltip />
                  <Line type="monotone" dataKey="total" stroke="#4f46e5" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <BarChartIcon className="w-5 h-5 mr-2 text-emerald-600" />
              Ticket Sales Trend
            </h3>
            <div className="min-h-[256px] relative">
              <ResponsiveContainer width="99%" height={256} minWidth={0} minHeight={0} debounce={100}>
                <BarChart data={graphData.sales}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="day" fontSize={10} />
                  <YAxis fontSize={10} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <PieChartIcon className="w-5 h-5 mr-2 text-purple-600" />
              Online vs Offline Sales
            </h3>
            <div className="min-h-[256px] relative">
              <ResponsiveContainer width="99%" height={256} minWidth={0} minHeight={0} debounce={100}>
                <PieChart>
                  <Pie
                    data={graphData.onlineVsOffline.map((d: any) => ({
                      name: d.payment_type === 'ONLINE' ? 'Online' : 'Offline',
                      value: d.count
                    }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    <Cell fill="#8b5cf6" />
                    <Cell fill="#f43f5e" />
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <UserPlus className="w-5 h-5 mr-2 text-blue-600" />
              Customer Growth
            </h3>
            <div className="min-h-[256px] relative">
              <ResponsiveContainer width="99%" height={256} minWidth={0} minHeight={0} debounce={100}>
                <LineChart data={graphData.growth}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="day" fontSize={10} />
                  <YAxis fontSize={10} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {pendingTxs.length > 0 && (
        <div className="bg-orange-50 shadow-sm rounded-xl border border-orange-200 overflow-hidden">
          <div className="p-6 border-b border-orange-200 flex items-center justify-between">
            <h2 className="text-lg font-bold text-orange-900">Pending Approvals Required</h2>
            <span className="bg-orange-200 text-orange-800 text-xs font-bold px-2 py-1 rounded-full">{pendingTxs.length}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-orange-200">
              <thead className="bg-orange-100/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-orange-700 uppercase">Tx ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-orange-700 uppercase">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-orange-700 uppercase">Amount</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-orange-700 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-orange-100">
                {pendingTxs.map(tx => (
                  <tr key={tx.id}>
                    <td className="px-6 py-4 text-sm font-mono text-orange-900">{tx.tx_id}</td>
                    <td className="px-6 py-4 text-sm text-orange-800">{tx.user_email}</td>
                    <td className="px-6 py-4 text-sm text-orange-800">PKR {tx.amount}</td>
                    <td className="px-6 py-4 text-right space-x-2">
                      {tx.receipt_url && (
                        <a 
                          href={tx.receipt_url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="inline-flex items-center px-2 py-1 bg-white border border-orange-200 text-orange-700 rounded text-xs font-bold hover:bg-orange-50 transition-colors"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          View
                        </a>
                      )}
                      <button 
                        onClick={() => handleApprove(tx.id)}
                        className="bg-orange-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-orange-700 transition-colors"
                      >
                        Approve
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-gray-900">All Tickets</h2>
          <div className="flex flex-col lg:flex-row lg:items-center gap-4 w-full lg:w-auto">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">From</label>
                <input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
                  className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">To</label>
                <input 
                  type="date" 
                  value={endDate}
                  onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
                  className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mt-auto sm:mt-0 lg:mt-4">
              <select 
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none h-[38px]"
              >
                <option value="">All Status</option>
                <option value="Printed">Printed</option>
                <option value="Unprinted">Unprinted</option>
                <option value="Reprinted">Reprinted</option>
              </select>
              <div className="relative max-w-xs w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search tickets..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm h-[38px]"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ticket ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tx ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Generated By</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Array.isArray(tickets) && tickets.map((ticket) => {
                let printBtnClass = "bg-gray-100 text-gray-700 hover:bg-gray-200";
                if (ticket.printed_count === 1) printBtnClass = "bg-green-100 text-green-700 hover:bg-green-200";
                if (ticket.printed_count > 1) printBtnClass = "bg-red-100 text-red-700 hover:bg-red-200";

                return (
                  <tr key={ticket.id} className="hover:bg-gray-50 group relative">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-indigo-600">
                      {ticket.ticket_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{ticket.name}</div>
                      <div className="text-xs text-gray-500">{maskMobile(ticket.mobile)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                      {ticket.tx_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 relative">
                      {ticket.generated_by_nick || ticket.generated_by}
                      <div className="absolute z-10 hidden group-hover:block bg-gray-900 text-white text-[10px] p-2 rounded shadow-lg -top-8 left-0 whitespace-nowrap">
                        Email: {ticket.generated_by}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        ticket.printed_count > 0 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {ticket.printed_count > 0 ? 'Printed' : 'Unprinted'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button 
                        onClick={() => setEditingTicket(ticket)}
                        className="text-indigo-600 hover:text-indigo-900 p-2 rounded-lg hover:bg-indigo-50"
                        title="Edit Ticket"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setSelectedTicket(ticket)}
                        className="text-indigo-600 hover:text-indigo-900 p-2 rounded-lg hover:bg-indigo-50"
                        title="View Ticket"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleSendPDF(ticket)}
                        disabled={isGeneratingPDF}
                        className="text-green-600 hover:text-green-900 p-2 rounded-lg hover:bg-green-50 disabled:opacity-50"
                        title="Send PDF"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handlePrint(ticket)}
                        className={`p-2 rounded-lg transition-colors ${printBtnClass}`}
                        title="Print Ticket"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing <span className="font-medium">{(currentPage - 1) * 20 + 1}</span> to <span className="font-medium">{Math.min(currentPage * 20, totalTickets)}</span> of <span className="font-medium">{totalTickets}</span> tickets
          </div>
          <div className="flex space-x-2">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 bg-white"
            >
              Previous
            </button>
            <button 
              disabled={currentPage * 20 >= totalTickets}
              onClick={() => setCurrentPage(prev => prev + 1)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 bg-white"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Edit Ticket Modal */}
      {editingTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">Edit Ticket Details</h3>
              <button onClick={() => setEditingTicket(null)} className="text-gray-400 hover:text-gray-600">×</button>
            </div>
            <form onSubmit={handleEditTicket} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Customer Name</label>
                <input name="name" required defaultValue={editingTicket.name} className="mt-1 block w-full border rounded-md p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Mobile</label>
                <input name="mobile" required defaultValue={editingTicket.mobile} className="mt-1 block w-full border rounded-md p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <textarea name="address" required defaultValue={editingTicket.address} className="mt-1 block w-full border rounded-md p-2" rows={3} />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => setEditingTicket(null)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ticket View Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">Ticket Details</h3>
              <button onClick={() => setSelectedTicket(null)} className="text-gray-400 hover:text-gray-600">×</button>
            </div>
            <div className="p-8 flex flex-col items-center space-y-6">
              <div className="bg-white p-4 border-2 border-gray-100 rounded-2xl shadow-inner">
                <QRCodeSVG 
                  value={JSON.stringify({
                    id: selectedTicket.ticket_id,
                    name: selectedTicket.name,
                    tx: selectedTicket.tx_id,
                    gen: selectedTicket.generation_id
                  })}
                  size={160}
                />
              </div>
              <div className="text-center space-y-2">
                <h4 className="text-4xl font-black text-indigo-600 tracking-tighter">{selectedTicket.ticket_id}</h4>
                <p className="text-lg font-medium text-gray-900">{selectedTicket.name}</p>
                <p className="text-sm text-gray-500">{maskMobile(selectedTicket.mobile)}</p>
                <p className="text-xs text-gray-400 italic">{selectedTicket.address}</p>
                <div className="pt-4 grid grid-cols-2 gap-4 text-left w-full border-t border-gray-100">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-gray-400">Transaction ID</p>
                    <p className="text-xs font-mono text-gray-700">{selectedTicket.tx_id}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-gray-400">Generation ID</p>
                    <p className="text-xs font-mono text-gray-700">{selectedTicket.generation_id}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-gray-400">Ticket Info</p>
                    <p className="text-xs font-mono text-gray-700">{selectedTicket.person_ticket_index} of {selectedTicket.total_tickets_in_tx}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-gray-400">Generated By</p>
                    <p className="text-xs font-mono text-gray-700">{selectedTicket.generated_by_nick || selectedTicket.generated_by}</p>
                  </div>
                  {selectedTicket.last_printed_by_nick && (
                    <div className="col-span-2">
                      <p className="text-[10px] uppercase font-bold text-gray-400">Last Printed By</p>
                      <p className="text-xs font-mono text-gray-700">{selectedTicket.last_printed_by_nick}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50 flex flex-col space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => handleSendPDF(selectedTicket)}
                  disabled={isGeneratingPDF}
                  className="flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {isGeneratingPDF ? 'Generating...' : 'Share PDF'}
                </button>
                <button 
                  onClick={() => {
                    const message = `Kartal Group Ticket\nID: ${selectedTicket.ticket_id}\nName: ${selectedTicket.name}\nTxID: ${selectedTicket.tx_id}`;
                    const url = `https://wa.me/${selectedTicket.mobile.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
                    window.open(url, 'whatsapp');
                  }}
                  className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  WhatsApp
                </button>
              </div>
              <button 
                onClick={() => handlePrint(selectedTicket)}
                className="flex items-center justify-center px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <Printer className="w-4 h-4 mr-2" />
                Print Ticket
              </button>
              <button 
                onClick={() => setSelectedTicket(null)}
                className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Hidden TicketCard for PDF capture */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        <div className="p-10 bg-white" style={{ width: '800px' }}>
          {pdfTicket && <TicketCard ticket={pdfTicket} ref={ticketRef} showPrintedBadge={false} />}
        </div>
      </div>
    </div>
  );
}
