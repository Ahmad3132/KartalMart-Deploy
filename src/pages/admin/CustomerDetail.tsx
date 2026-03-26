import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Phone, MapPin, CreditCard, Calendar, Shield, Printer, MessageSquare, Share2, Send, FileDown, History, TrendingUp, Ticket, Eye, Search, Tag, Plus, X, Trash2, PhoneCall, Mail, MessageCircle } from 'lucide-react';
import { formatPKTDateTime } from '../../utils/date';

const AUTH_HEADERS = () => ({
  'Authorization': `Bearer ${localStorage.getItem('kartal_token')}`,
  'Content-Type': 'application/json',
});

type Tab = 'transactions' | 'notes' | 'communications';

interface Note {
  id: number;
  note: string;
  created_by?: string;
  created_at: string;
}

interface Communication {
  id: number;
  type: string;
  content: string;
  direction: string;
  status?: string;
  created_at: string;
}

export default function CustomerDetail() {
  const { mobile } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({ key: 'date', direction: 'desc' });
  const [historyFilter, setHistoryFilter] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);

  // Tab state
  const [activeTab, setActiveTab] = useState<Tab>('transactions');

  // Notes state
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState('');
  const [notesLoading, setNotesLoading] = useState(false);

  // Communications state
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [commsLoading, setCommsLoading] = useState(false);
  const [commForm, setCommForm] = useState({ type: 'whatsapp', content: '', direction: 'outbound' });

  // Segments state
  const [segments, setSegments] = useState<string[]>([]);

  const fetchTags = async () => {
    try {
      const r = await fetch(`/api/customers/${mobile}/tags`, { headers: AUTH_HEADERS() });
      if (r.ok) { const d = await r.json(); setTags(Array.isArray(d) ? d.map((t: any) => t.tag || t) : []); }
    } catch {}
  };

  const addTag = async () => {
    if (!newTag.trim()) return;
    try {
      await fetch(`/api/customers/${mobile}/tags`, {
        method: 'POST', headers: AUTH_HEADERS(),
        body: JSON.stringify({ tag: newTag.trim() })
      });
      setNewTag(''); setShowTagInput(false); fetchTags();
    } catch {}
  };

  const removeTag = async (tag: string) => {
    try {
      await fetch(`/api/customers/${mobile}/tags/${encodeURIComponent(tag)}`, {
        method: 'DELETE', headers: AUTH_HEADERS()
      });
      fetchTags();
    } catch {}
  };

  const fetchNotes = async () => {
    setNotesLoading(true);
    try {
      const r = await fetch(`/api/customers/${mobile}/notes`, { headers: AUTH_HEADERS() });
      if (r.ok) { const d = await r.json(); setNotes(Array.isArray(d) ? d : []); }
    } catch {} finally { setNotesLoading(false); }
  };

  const addNote = async () => {
    if (!newNote.trim()) return;
    try {
      await fetch(`/api/customers/${mobile}/notes`, {
        method: 'POST', headers: AUTH_HEADERS(),
        body: JSON.stringify({ note: newNote.trim() })
      });
      setNewNote('');
      fetchNotes();
    } catch {}
  };

  const deleteNote = async (id: number) => {
    try {
      await fetch(`/api/customers/${mobile}/notes/${id}`, {
        method: 'DELETE', headers: AUTH_HEADERS()
      });
      fetchNotes();
    } catch {}
  };

  const fetchCommunications = async () => {
    setCommsLoading(true);
    try {
      const r = await fetch(`/api/customers/${mobile}/communications`, { headers: AUTH_HEADERS() });
      if (r.ok) { const d = await r.json(); setCommunications(Array.isArray(d) ? d : []); }
    } catch {} finally { setCommsLoading(false); }
  };

  const addCommunication = async () => {
    if (!commForm.content.trim()) return;
    try {
      await fetch(`/api/customers/${mobile}/communications`, {
        method: 'POST', headers: AUTH_HEADERS(),
        body: JSON.stringify({ type: commForm.type, content: commForm.content.trim(), direction: commForm.direction, status: 'completed' })
      });
      setCommForm({ type: 'whatsapp', content: '', direction: 'outbound' });
      fetchCommunications();
    } catch {}
  };

  const fetchSegments = async () => {
    try {
      const r = await fetch(`/api/customers/segments`, { headers: AUTH_HEADERS() });
      if (r.ok) {
        const d = await r.json();
        // d might be an array of segment objects; find which ones this customer belongs to
        if (Array.isArray(d)) {
          const customerSegments = d
            .filter((seg: any) => {
              if (seg.customers && Array.isArray(seg.customers)) {
                return seg.customers.some((c: any) => c.mobile === mobile || c === mobile);
              }
              return false;
            })
            .map((seg: any) => seg.name || seg.segment);
          setSegments(customerSegments);
        }
      }
    } catch {}
  };

  useEffect(() => {
    fetchCustomerData();
    fetchTags();
    fetchSegments();
  }, [mobile]);

  // Fetch tab-specific data when tab changes
  useEffect(() => {
    if (activeTab === 'notes') fetchNotes();
    if (activeTab === 'communications') fetchCommunications();
  }, [activeTab, mobile]);

  const fetchCustomerData = async () => {
    try {
      const res = await fetch(`/api/admin/customers/${mobile}`, {
        headers: AUTH_HEADERS()
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

  // Compute local segments from customer data as fallback
  const computedSegments = React.useMemo(() => {
    if (!data?.customer) return [];
    const c = data.customer;
    const result: { label: string; color: string }[] = [];
    if (c.total_spent > 10000) result.push({ label: 'VIP', color: 'bg-yellow-100 text-yellow-800' });
    else if (c.total_spent > 5000) result.push({ label: 'High Value', color: 'bg-indigo-100 text-indigo-800' });
    if (c.total_transactions > 20) result.push({ label: 'Frequent', color: 'bg-green-100 text-green-800' });
    if (c.total_transactions === 1) result.push({ label: 'New', color: 'bg-blue-100 text-blue-800' });
    return result;
  }, [data?.customer]);

  const commTypeIcon = (type: string) => {
    switch (type) {
      case 'whatsapp': return <MessageCircle className="w-4 h-4" />;
      case 'sms': return <MessageSquare className="w-4 h-4" />;
      case 'call': return <PhoneCall className="w-4 h-4" />;
      case 'visit': return <User className="w-4 h-4" />;
      default: return <Mail className="w-4 h-4" />;
    }
  };

  const commTypeColor = (type: string) => {
    switch (type) {
      case 'whatsapp': return 'bg-green-100 text-green-700';
      case 'sms': return 'bg-blue-100 text-blue-700';
      case 'call': return 'bg-purple-100 text-purple-700';
      case 'visit': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
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
              {/* Segment Badges */}
              {(segments.length > 0 || computedSegments.length > 0) && (
                <div className="flex flex-wrap justify-center gap-2 mt-3">
                  {segments.map(seg => (
                    <span key={seg} className="px-2.5 py-0.5 bg-white/20 text-white rounded-full text-[10px] font-bold uppercase tracking-wide">
                      {seg}
                    </span>
                  ))}
                  {segments.length === 0 && computedSegments.map(seg => (
                    <span key={seg.label} className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${seg.color}`}>
                      {seg.label}
                    </span>
                  ))}
                </div>
              )}
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

          {/* Customer Tags */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-3 flex items-center">
              <Tag className="w-4 h-4 mr-2 text-indigo-500" /> Customer Tags
            </h3>
            <div className="flex flex-wrap gap-2 mb-3">
              {tags.length === 0 && <p className="text-xs text-gray-400">No tags yet</p>}
              {tags.map(tag => (
                <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium">
                  {tag}
                  <button onClick={() => removeTag(tag)} className="hover:text-red-600 ml-0.5"><X className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
            {showTagInput ? (
              <div className="flex gap-2">
                <input value={newTag} onChange={e => setNewTag(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTag()}
                  placeholder="e.g. VIP, Repeat, Corporate" className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm" autoFocus />
                <button onClick={addTag} className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium">Add</button>
                <button onClick={() => { setShowTagInput(false); setNewTag(''); }} className="px-2 py-1.5 text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
              </div>
            ) : (
              <button onClick={() => setShowTagInput(true)} className="flex items-center gap-1 text-xs text-indigo-600 font-medium hover:text-indigo-800">
                <Plus className="w-3 h-3" /> Add Tag
              </button>
            )}
          </div>
        </div>

        {/* Right Side — Tabbed Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tab Navigation */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex border-b border-gray-200">
              {([
                { key: 'transactions' as Tab, label: 'Transactions', icon: <History className="w-4 h-4" /> },
                { key: 'notes' as Tab, label: 'Notes', icon: <MessageSquare className="w-4 h-4" /> },
                { key: 'communications' as Tab, label: 'Communications', icon: <PhoneCall className="w-4 h-4" /> },
              ]).map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold transition-colors border-b-2 ${
                    activeTab === tab.key
                      ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Transactions Tab */}
            {activeTab === 'transactions' && (
              <>
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
                            {formatPKTDateTime(item.date)}
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
              </>
            )}

            {/* Notes Tab */}
            {activeTab === 'notes' && (
              <div className="p-6 space-y-4">
                {/* Add Note Form */}
                <div className="space-y-3">
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Add an internal note about this customer..."
                    rows={3}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={addNote}
                      disabled={!newNote.trim()}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" /> Add Note
                    </button>
                  </div>
                </div>

                {/* Notes List */}
                {notesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  </div>
                ) : notes.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-40" />
                    <p className="text-sm font-medium">No notes yet</p>
                    <p className="text-xs mt-1">Add a note above to start tracking interactions</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notes.map((note) => (
                      <div key={note.id} className="bg-gray-50 rounded-xl p-4 border border-gray-100 group">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-800 whitespace-pre-wrap">{note.note}</p>
                            <div className="flex items-center gap-3 mt-2 text-[11px] text-gray-400">
                              <span>{formatPKTDateTime(note.created_at)}</span>
                              {note.created_by && <span className="font-medium text-gray-500">{note.created_by}</span>}
                            </div>
                          </div>
                          <button
                            onClick={() => deleteNote(note.id)}
                            className="p-1.5 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                            title="Delete note"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Communications Tab */}
            {activeTab === 'communications' && (
              <div className="p-6 space-y-4">
                {/* Add Communication Form */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">Log Communication</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Type</label>
                      <select
                        value={commForm.type}
                        onChange={(e) => setCommForm(f => ({ ...f, type: e.target.value }))}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                      >
                        <option value="whatsapp">WhatsApp</option>
                        <option value="sms">SMS</option>
                        <option value="call">Call</option>
                        <option value="visit">Visit</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Direction</label>
                      <select
                        value={commForm.direction}
                        onChange={(e) => setCommForm(f => ({ ...f, direction: e.target.value }))}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                      >
                        <option value="outbound">Outbound</option>
                        <option value="inbound">Inbound</option>
                      </select>
                    </div>
                  </div>
                  <textarea
                    value={commForm.content}
                    onChange={(e) => setCommForm(f => ({ ...f, content: e.target.value }))}
                    placeholder="Describe the communication..."
                    rows={2}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={addCommunication}
                      disabled={!commForm.content.trim()}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <Send className="w-4 h-4" /> Log Communication
                    </button>
                  </div>
                </div>

                {/* Communications Timeline */}
                {commsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  </div>
                ) : communications.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <PhoneCall className="w-10 h-10 mx-auto mb-3 opacity-40" />
                    <p className="text-sm font-medium">No communications logged</p>
                    <p className="text-xs mt-1">Log a communication above to build the timeline</p>
                  </div>
                ) : (
                  <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200" />
                    <div className="space-y-4">
                      {communications.map((comm) => (
                        <div key={comm.id} className="relative flex items-start gap-4 pl-2">
                          {/* Timeline dot */}
                          <div className={`relative z-10 flex items-center justify-center w-7 h-7 rounded-full border-2 border-white shadow-sm ${commTypeColor(comm.type)}`}>
                            {commTypeIcon(comm.type)}
                          </div>
                          {/* Content */}
                          <div className="flex-1 bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${commTypeColor(comm.type)}`}>
                                {comm.type}
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                comm.direction === 'inbound' ? 'bg-cyan-100 text-cyan-700' : 'bg-gray-100 text-gray-600'
                              }`}>
                                {comm.direction}
                              </span>
                              {comm.status && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-green-100 text-green-700">
                                  {comm.status}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-800 whitespace-pre-wrap">{comm.content}</p>
                            <p className="text-[11px] text-gray-400 mt-2">{formatPKTDateTime(comm.created_at)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
