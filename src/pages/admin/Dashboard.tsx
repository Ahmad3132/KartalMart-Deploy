import React, { useEffect, useState, useRef } from 'react';
import { Users, Ticket, CheckCircle, Activity, Printer, Eye, Search, AlertCircle, Edit2, Send, FileDown, TrendingUp, DollarSign, UserPlus, PieChart as PieChartIcon, BarChart as BarChartIcon, MessageSquare, ArrowRight, Clock, ShieldCheck } from 'lucide-react';
import { handleResponse, formatWANumber } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { QRCodeSVG } from 'qrcode.react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { TicketCard } from '../../components/TicketCard';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend, AreaChart, Area } from 'recharts';
import { Link, useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
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
        // Map server field names to chart field names
        const revenue = (data.revenue || []).map((r: any) => ({ date: r.day, amount: r.total || 0 }));
        const onlineVsOffline = (data.onlineVsOffline || []).map((r: any) => ({ name: r.payment_type || 'Unknown', value: r.count || 0 }));
        setGraphData({ revenue, onlineVsOffline, sales: data.sales || [], growth: data.growth || [] });
      } else {
        // Set empty data so UI shows "No data" instead of "Loading..."
        setGraphData({ revenue: [], onlineVsOffline: [], sales: [], growth: [] });
      }
    } catch (err) {
      console.error('Failed to fetch graph data:', err);
      setGraphData({ revenue: [], onlineVsOffline: [], sales: [], growth: [] });
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
          const url = `https://wa.me/${formatWANumber(ticket.mobile)}?text=${encodeURIComponent(message)}`;
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

      // Open thermal print window
      const win = window.open('', '_blank', 'width=420,height=700,menubar=no,toolbar=no');
      if (!win) { window.print(); return; }
      const date = new Date(ticket.date).toLocaleDateString('en-PK', { day: '2-digit', month: '2-digit', year: '2-digit' });
      win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Print Ticket</title>
<style>* { margin:0;padding:0;box-sizing:border-box; } @page { size:80mm auto;margin:2mm; } html,body{width:80mm;background:#fff;} body{display:flex;flex-direction:column;align-items:center;padding:2mm;}</style>
</head><body>
<div style="width:72mm;font-family:'Courier New',monospace;font-size:11px;color:#000;padding:3mm;">
  <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:2px solid #000;padding-bottom:2mm;margin-bottom:2mm;">
    <div style="text-align:right;margin-left:auto;">
      <div style="font-size:13px;font-weight:900;letter-spacing:1.5px;font-family:Georgia,serif;line-height:1.1;">KARTAL MART</div>
      <div style="font-size:7px;letter-spacing:1.5px;margin-top:1px;">GROUP OF COMPANIES</div>
    </div>
  </div>
  <div style="text-align:center;background:#000;color:#fff;padding:1.5mm;margin-bottom:1.5mm;">
    <div style="font-size:7px;letter-spacing:2px;">TICKET NUMBER</div>
    <div style="font-size:20px;font-weight:900;letter-spacing:3px;">${ticket.ticket_id}</div>
  </div>
  <div style="border-top:1px dashed #000;border-bottom:1px dashed #000;padding:1.5mm 0;margin-bottom:1.5mm;">
    <div style="display:flex;justify-content:space-between;margin-bottom:0.5mm;"><span style="color:#555;font-size:8px;">Name:</span><span style="font-weight:900;font-size:10px;">${ticket.name}</span></div>
    <div style="display:flex;justify-content:space-between;"><span style="color:#555;font-size:8px;">Mobile:</span><span style="font-size:10px;">${ticket.mobile ? ticket.mobile.slice(0, -3) + '***' : ''}</span></div>
  </div>
  <div style="padding:1mm 0;font-size:8px;">
    <div style="display:flex;justify-content:space-between;margin-bottom:0.5mm;"><span style="color:#555;">TX ID:</span><span style="font-family:monospace;">${ticket.tx_id}</span></div>
    <div style="display:flex;justify-content:space-between;"><span style="color:#555;">Date:</span><span>${date}</span></div>
  </div>
</div>
<script>window.onload=function(){setTimeout(function(){window.print();setTimeout(function(){window.close();},1500);},300);};</script>
</body></html>`);
      win.document.close();
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

  if (!stats) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );

  const statCards = [
    { name: 'Active Campaign', value: stats.activeCampaign, icon: Activity, color: 'text-blue-600', bg: 'bg-blue-50' },
    { name: 'Tickets Today', value: stats.ticketsToday, icon: Ticket, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { name: 'Tickets This Month', value: stats.ticketsMonth, icon: Ticket, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { name: 'Pending Approvals', value: stats.pendingApprovals, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
    { name: 'Total Revenue', value: `PKR ${stats.totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-purple-600', bg: 'bg-purple-50' },
    { name: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  ];

  const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-1 text-gray-500">System overview and real-time analytics for Kartal Group.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => navigate('/admin/campaigns')}
            className="inline-flex items-center px-4 py-2 border border-gray-200 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 transition-all"
          >
            <Activity className="w-4 h-4 mr-2" />
            Campaigns
          </button>
          <button
            onClick={() => navigate('/admin/users')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-xl shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 transition-all"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Manage Users
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="bg-white overflow-hidden shadow-sm rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
              <div className="flex flex-col">
                <div className={`p-2 rounded-lg ${stat.bg} w-fit mb-3`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{stat.name}</p>
                <p className="text-xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue/Sales Chart */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-indigo-600" />
              Revenue Trends
            </h3>
            <select className="text-sm border-gray-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          <div className="h-80">
            {graphData ? (
              graphData.revenue.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={graphData.revenue}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9CA3AF'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9CA3AF'}} />
                    <Tooltip
                      contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'}}
                      itemStyle={{fontSize: '12px', fontWeight: 'bold'}}
                    />
                    <Area type="monotone" dataKey="amount" stroke="#4F46E5" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No revenue data yet</p>
                    <p className="text-sm mt-1">Revenue trends will appear here once tickets are sold</p>
                  </div>
                </div>
              )
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 italic">Loading chart data...</div>
            )}
          </div>
        </div>

        {/* Distribution Chart */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900 flex items-center">
              <PieChartIcon className="w-5 h-5 mr-2 text-indigo-600" />
              Payment Distribution
            </h3>
          </div>
          <div className="h-80">
            {graphData ? (
              graphData.onlineVsOffline.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={graphData.onlineVsOffline}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {graphData.onlineVsOffline.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'}}
                    />
                    <Legend verticalAlign="bottom" height={36}/>
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <PieChartIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No payment data yet</p>
                    <p className="text-sm mt-1">Payment distribution will appear here once transactions are processed</p>
                  </div>
                </div>
              )
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 italic">Loading chart data...</div>
            )}
          </div>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Tickets */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900 flex items-center">
              <Ticket className="w-5 h-5 mr-2 text-indigo-600" />
              Recent Tickets
            </h3>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search tickets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-indigo-500 focus:border-indigo-500 w-48 md:w-64"
                />
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Ticket ID</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Agent</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-50">
                {tickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-mono font-bold text-indigo-600">{ticket.ticket_id}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{ticket.name}</div>
                      <div className="text-xs text-gray-500">{maskMobile(ticket.mobile)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{ticket.generated_by_nick || ticket.user_email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-3">
                        <button onClick={() => setSelectedTicket(ticket)} className="text-indigo-600 hover:text-indigo-900">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => setEditingTicket(ticket)} className="text-blue-600 hover:text-blue-900">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handlePrint(ticket)} className="text-gray-600 hover:text-gray-900">
                          <Printer className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleSendPDF(ticket)} className="text-emerald-600 hover:text-emerald-900">
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          <div className="p-4 border-t border-gray-50 flex items-center justify-between">
            <p className="text-sm text-gray-500">Showing {tickets.length} of {totalTickets} tickets</p>
            <div className="flex gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
                className="px-3 py-1 border border-gray-200 rounded-lg text-sm disabled:opacity-50"
              >
                Prev
              </button>
              <button
                disabled={currentPage * 10 >= totalTickets}
                onClick={() => setCurrentPage(p => p + 1)}
                className="px-3 py-1 border border-gray-200 rounded-lg text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-orange-500" />
              Pending Approvals
            </h3>
            <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-1 rounded-full">
              {pendingTxs.length}
            </span>
          </div>
          <div className="divide-y divide-gray-50 max-h-[600px] overflow-y-auto">
            {pendingTxs.length > 0 ? (
              pendingTxs.map((tx) => (
                <div key={tx.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-sm font-bold text-gray-900">{tx.name || 'Unknown'}</p>
                      <p className="text-xs text-gray-500 font-mono">{tx.tx_id}</p>
                    </div>
                    <p className="text-sm font-bold text-indigo-600">PKR {tx.amount}</p>
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-xs text-gray-400">{new Date(tx.date).toLocaleDateString()}</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate(`/admin/approvals`)}
                        className="p-2 text-gray-400 hover:text-gray-600"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleApprove(tx.id)}
                        className="px-3 py-1 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-all"
                      >
                        Approve
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-10 text-center text-gray-400 italic">
                No pending approvals.
              </div>
            )}
          </div>
          <div className="p-4 border-t border-gray-50">
            <button
              onClick={() => navigate('/admin/approvals')}
              className="w-full py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center justify-center"
            >
              View All Approvals <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </div>
        </div>
      </div>

      {editingTicket && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-8 shadow-2xl">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Edit Ticket Information</h3>
            <form onSubmit={handleEditTicket} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1 uppercase tracking-wider">Customer Name</label>
                <input
                  name="name"
                  defaultValue={editingTicket.name}
                  required
                  className="w-full border-gray-200 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 p-3"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1 uppercase tracking-wider">Mobile Number</label>
                <input
                  name="mobile"
                  defaultValue={editingTicket.mobile}
                  required
                  className="w-full border-gray-200 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 p-3"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1 uppercase tracking-wider">Address</label>
                <textarea
                  name="address"
                  defaultValue={editingTicket.address}
                  className="w-full border-gray-200 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 p-3"
                  rows={3}
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingTicket(null)}
                  className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modals & Hidden Elements */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-8 shadow-2xl relative">
            <button onClick={() => setSelectedTicket(null)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600">
              <AlertCircle className="w-6 h-6" />
            </button>
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Ticket className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Ticket Details</h3>
              <p className="text-gray-500">ID: {selectedTicket.ticket_id}</p>
            </div>
            <div className="space-y-4 bg-gray-50 rounded-2xl p-6 mb-8">
              <div className="flex justify-between border-b border-gray-200 pb-2">
                <span className="text-gray-500">Customer</span>
                <span className="font-bold text-gray-900">{selectedTicket.name}</span>
              </div>
              <div className="flex justify-between border-b border-gray-200 pb-2">
                <span className="text-gray-500">Mobile</span>
                <span className="font-bold text-gray-900">{selectedTicket.mobile}</span>
              </div>
              <div className="flex justify-between border-b border-gray-200 pb-2">
                <span className="text-gray-500">Transaction ID</span>
                <span className="font-bold text-indigo-600 font-mono">{selectedTicket.tx_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Generated By</span>
                <span className="font-bold text-gray-900">{selectedTicket.generated_by_nick || selectedTicket.user_email}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => { handlePrint(selectedTicket); setSelectedTicket(null); }}
                className="flex items-center justify-center py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-all"
              >
                <Printer className="w-4 h-4 mr-2" /> Print
              </button>
              <button
                onClick={() => { handleSendPDF(selectedTicket); setSelectedTicket(null); }}
                className="flex items-center justify-center py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all"
              >
                <Send className="w-4 h-4 mr-2" /> Send PDF
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
