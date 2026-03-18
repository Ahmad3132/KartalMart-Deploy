import React, { useState, useEffect, useCallback } from 'react';
import { Plus, X, Check, AlertCircle, TrendingUp, TrendingDown, DollarSign,
  Filter, Download, Edit2, Trash2, Clock, ChevronDown, BarChart2, Search, Users, ArrowLeftRight, Send } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { exportCSV } from '../../utils/exportCSV';

const h  = () => ({ 'Authorization': `Bearer ${localStorage.getItem('kartal_token')}` });
const hj = () => ({ ...h(), 'Content-Type': 'application/json' });
const PKR = (n:number) => `PKR ${Number(n||0).toLocaleString('en-PK')}`;
const fmt = (d:string) => new Date(d).toLocaleDateString('en-PK',{day:'2-digit',month:'short',year:'numeric'});

type Tx = { id:number; type:'Cash In'|'Cash Out'; amount:number; category:string; subcategory:string;
  description:string; date:string; created_by:string; status:'Pending'|'Approved'|'Rejected';
  source:'Manual'|'System'; approved_by?:string; rejection_reason?:string; tx_reference?:string; };
type Cat = { id:number; name:string; type:'Cash In'|'Cash Out'; subcategories:string[] };

export default function Accounts() {
  const { user } = useAuth();
  const role = user?.role || '';
  const isAdmin = role === 'Admin';
  const isAccountant = role === 'Accountant' || isAdmin;

  const [tab, setTab]               = useState<'dashboard'|'transactions'|'categories'|'reports'|'cash-in-hand'|'transfers'>('dashboard');
  const [txList, setTxList]         = useState<Tx[]>([]);
  const [cats, setCats]             = useState<Cat[]>([]);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState('');
  const [success, setSuccess]       = useState('');

  // Filters
  const [fSearch, setFSearch]       = useState('');
  const [fType, setFType]           = useState('');
  const [fStatus, setFStatus]       = useState('');
  const [fCat, setFCat]             = useState('');
  const [fDateFrom, setFDateFrom]   = useState('');
  const [fDateTo, setFDateTo]       = useState('');

  // Modals
  const [addModal, setAddModal]     = useState(false);
  const [catModal, setCatModal]     = useState(false);
  const [rejectModal, setRejectModal] = useState<Tx|null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [editTx, setEditTx]         = useState<Tx|null>(null);
  const [editCat, setEditCat]       = useState<Cat|null>(null);

  // Cash in hand & transfers
  const [cashInHand, setCashInHand] = useState<any[]>([]);
  const [transfers, setTransfers]   = useState<any[]>([]);
  const [transferModal, setTransferModal] = useState(false);
  const [transferSubmitting, setTransferSubmitting] = useState(false);
  const [usersList, setUsersList]   = useState<any[]>([]);
  // User report modal
  const [userReport, setUserReport] = useState<any>(null);
  const [userReportEmail, setUserReportEmail] = useState('');

  // Add form
  const [txType, setTxType]         = useState<'Cash In'|'Cash Out'>('Cash In');
  const [selCat, setSelCat]         = useState('');
  const [selSubcat, setSelSubcat]   = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [tRes, cRes, cihRes, trRes, uRes] = await Promise.all([
        fetch('/api/accounts/transactions', { headers: h() }),
        fetch('/api/accounts/categories',   { headers: h() }),
        fetch('/api/accounts/cash-in-hand', { headers: h() }).catch(()=>({json:async()=>[]})),
        fetch('/api/accounts/transfers',    { headers: h() }).catch(()=>({json:async()=>[]})),
        fetch('/api/users',                 { headers: h() }).catch(()=>({json:async()=>[]})),
      ]);
      const tData = await tRes.json().catch(()=>[]);
      const cData = await cRes.json().catch(()=>[]);
      const cihData = await cihRes.json().catch(()=>[]);
      const trData = await trRes.json().catch(()=>[]);
      const uData = await uRes.json().catch(()=>[]);
      setTxList(Array.isArray(tData) ? tData : []);
      setCats(Array.isArray(cData) ? cData : []);
      setCashInHand(Array.isArray(cihData) ? cihData : []);
      setTransfers(Array.isArray(trData) ? trData : []);
      setUsersList(Array.isArray(uData) ? uData : []);
    } catch(e:any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  function toast(msg:string, isErr=false) {
    if(isErr) { setError(msg); setTimeout(()=>setError(''),4000); }
    else { setSuccess(msg); setTimeout(()=>setSuccess(''),3000); }
  }

  // Derived stats
  const approved = txList.filter(t=>t.status==='Approved');
  const totalIn  = approved.filter(t=>t.type==='Cash In' ).reduce((s,t)=>s+t.amount,0);
  const totalOut = approved.filter(t=>t.type==='Cash Out').reduce((s,t)=>s+t.amount,0);
  const pending  = txList.filter(t=>t.status==='Pending').length;

  // Filtered list
  const filtered = txList.filter(t => {
    if(fSearch && !`${t.description} ${t.category} ${t.tx_reference||''} ${t.created_by}`.toLowerCase().includes(fSearch.toLowerCase())) return false;
    if(fType   && t.type!==fType) return false;
    if(fStatus && t.status!==fStatus) return false;
    if(fCat    && t.category!==fCat) return false;
    if(fDateFrom && t.date < fDateFrom) return false;
    if(fDateTo   && t.date > fDateTo+' 23:59') return false;
    return true;
  });

  const availCats = cats.filter(c=>c.type===txType);
  const selCatObj = cats.find(c=>c.name===selCat);

  async function submitTx(e:React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setSaving(true);
    const fd = new FormData(e.currentTarget);
    const body = {
      type: fd.get('type'), amount: Number(fd.get('amount')),
      category: fd.get('category'), subcategory: fd.get('subcategory'),
      description: fd.get('description'), date: fd.get('date'),
      tx_reference: fd.get('tx_reference'),
    };
    try {
      const url  = editTx ? `/api/accounts/transactions/${editTx.id}` : '/api/accounts/transactions';
      const meth = editTx ? 'PUT' : 'POST';
      const res  = await fetch(url, { method:meth, headers:hj(), body:JSON.stringify(body) });
      const d    = await res.json();
      if(!res.ok) throw new Error(d.error||'Failed');
      setAddModal(false); setEditTx(null); load(); toast(editTx?'Transaction updated!':'Transaction added!');
    } catch(e:any) { toast(e.message, true); }
    finally { setSaving(false); }
  }

  async function approveTx(id:number) {
    const res = await fetch(`/api/accounts/transactions/${id}/approve`, { method:'PUT', headers:hj() });
    const d = await res.json();
    if(!res.ok) { toast(d.error||'Failed', true); return; }
    load(); toast('Approved!');
  }

  async function rejectTx() {
    if(!rejectModal) return;
    const res = await fetch(`/api/accounts/transactions/${rejectModal.id}/reject`, {
      method:'PUT', headers:hj(), body:JSON.stringify({ reason:rejectReason })
    });
    const d = await res.json();
    if(!res.ok) { toast(d.error||'Failed', true); return; }
    setRejectModal(null); setRejectReason(''); load(); toast('Rejected.');
  }

  async function deleteTx(id:number) {
    if(!window.confirm('Delete this transaction?')) return;
    await fetch(`/api/accounts/transactions/${id}`, { method:'DELETE', headers:hj() });
    load(); toast('Deleted.');
  }

  async function submitCat(e:React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const body = { name:fd.get('name'), type:fd.get('type'), subcategories:(fd.get('subcategories') as string).split(',').map(s=>s.trim()).filter(Boolean) };
    const url  = editCat ? `/api/accounts/categories/${editCat.id}` : '/api/accounts/categories';
    const meth = editCat ? 'PUT' : 'POST';
    const res  = await fetch(url, { method:meth, headers:hj(), body:JSON.stringify(body) });
    if(!res.ok) { const d = await res.json().catch(()=>({})); toast(d.error || 'Failed to save category', true); return; }
    setCatModal(false); setEditCat(null); load(); toast('Category saved!');
  }

  function exportCSV() {
    const rows = [['Date','Type','Category','Subcategory','Amount','Description','Status','Created By','Source']];
    filtered.forEach(t=>rows.push([t.date,t.type,t.category,t.subcategory||'',String(t.amount),t.description,t.status,t.created_by,t.source]));
    const csv = rows.map(r=>r.map(v=>`"${v}"`).join(',')).join('\n');
    const a = document.createElement('a'); a.href='data:text/csv;charset=utf-8,'+encodeURIComponent(csv); a.download='accounts.csv'; a.click();
  }

  const statusBadge = (s:string) => {
    if(s==='Approved') return 'bg-green-100 text-green-700';
    if(s==='Rejected') return 'bg-red-100 text-red-700';
    return 'bg-orange-100 text-orange-700';
  };

  if(loading) return <div className="flex items-center justify-center min-h-[300px]"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"/></div>;

  const TABS = [
    {id:'dashboard',    label:'Dashboard',    icon:BarChart2},
    {id:'transactions', label:'Transactions', icon:DollarSign},
    {id:'cash-in-hand' as const, label: isAdmin ? 'Cash in Hand' : 'My Cash', icon:Users},
    {id:'transfers' as const, label:'Transfers', icon:ArrowLeftRight},
    {id:'categories',   label:'Categories',   icon:Filter},
    {id:'reports',      label:'Reports',      icon:TrendingUp},
  ] as const;

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Accounts</h1>
          <p className="text-sm text-gray-400 mt-0.5">Central financial ledger — all money in and out.</p>
          <button onClick={() => {
            if (tab === 'cash-in-hand') {
              exportCSV('cash-in-hand', ['User','Role','Cash In','Cash Out','Transfers Out','Transfers In','Net Balance'], cashInHand.map((u: any) => [u.email, u.role, u.cash_in, u.cash_out, u.transfers_out, u.transfers_in, u.balance]));
            } else if (tab === 'transfers') {
              exportCSV('transfers', ['From','To','Amount','Status','Description','Date'], transfers.map((t: any) => [t.from_user, t.to_user, t.amount, t.status, t.description || '', new Date(t.created_at).toLocaleDateString()]));
            } else {
              exportCSV('transactions', ['Date','Type','Category','Amount','Description','User','Status'], transactions.map((t: any) => [fmt(t.created_at), t.type, t.category, t.amount, t.description || '', t.user_email || '', t.status]));
            }
          }} className="mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700">
            <Download className="w-3 h-3" /> Export CSV
          </button>
        </div>
        {isAccountant && tab==='transactions' && (
          <button onClick={()=>{setEditTx(null);setTxType('Cash In');setSelCat('');setAddModal(true);}} className="btn-primary">
            <Plus className="w-4 h-4 mr-1.5"/>Add Transaction
          </button>
        )}
      </div>

      {error   && <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm"><AlertCircle className="w-4 h-4 flex-shrink-0"/>{error}</div>}
      {success && <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm"><Check className="w-4 h-4 flex-shrink-0"/>{success}</div>}

      {/* Tab Bar */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit flex-wrap">
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab===t.id?'bg-white text-indigo-600 shadow-sm':'text-gray-500 hover:text-gray-700'}`}>
            <t.icon className="w-4 h-4"/>{t.label}
          </button>
        ))}
      </div>

      {/* ── DASHBOARD ── */}
      {tab==='dashboard' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {label:'Total Income',  value:PKR(totalIn),          icon:TrendingUp,   color:'text-green-600', bg:'bg-green-50'},
              {label:'Total Expenses',value:PKR(totalOut),         icon:TrendingDown, color:'text-red-600',   bg:'bg-red-50'},
              {label:'Net Balance',   value:PKR(totalIn-totalOut), icon:DollarSign,   color:totalIn-totalOut>=0?'text-indigo-600':'text-red-600', bg:'bg-indigo-50'},
              {label:'Pending',       value:pending,               icon:Clock,        color:'text-orange-600',bg:'bg-orange-50'},
            ].map(s=>(
              <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
                <div className={`p-3 rounded-xl ${s.bg}`}><s.icon className={`w-6 h-6 ${s.color}`}/></div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{s.label}</p>
                  <p className={`text-xl font-black mt-0.5 ${typeof s.value==='string' && s.label==='Net Balance' ? (totalIn-totalOut>=0?'text-indigo-700':'text-red-600') : 'text-gray-900'}`}>{s.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Recent 10 transactions */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Recent Transactions</h3>
              <button onClick={()=>setTab('transactions')} className="text-xs text-indigo-600 hover:underline">View all</button>
            </div>
            <TxTable rows={txList.slice(0,10)} isAdmin={isAdmin} isAccountant={isAccountant}
              onApprove={approveTx} onReject={t=>{setRejectModal(t);setRejectReason('');}} onDelete={deleteTx}
              onEdit={t=>{setEditTx(t);setTxType(t.type);setSelCat(t.category);setAddModal(true);}} statusBadge={statusBadge}/>
          </div>

          {/* Category breakdown */}
          {isAdmin && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {['Cash In','Cash Out'].map(type=>{
                const grouped = approved.filter(t=>t.type===type).reduce((acc:any,t)=>{ acc[t.category]=(acc[t.category]||0)+t.amount; return acc; },{});
                const total   = Object.values(grouped).reduce((s:any,v:any)=>s+v,0) as number;
                return (
                  <div key={type} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <h4 className={`font-bold mb-3 ${type==='Cash In'?'text-green-700':'text-red-700'}`}>{type} by Category</h4>
                    {Object.entries(grouped).length===0 ? <p className="text-sm text-gray-400 italic">No data</p> : (
                      <div className="space-y-2">
                        {Object.entries(grouped).sort(([,a]:any,[,b]:any)=>b-a).map(([cat,amt]:any)=>(
                          <div key={cat}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-700 font-medium">{cat}</span>
                              <span className="font-bold text-gray-900">{PKR(amt)}</span>
                            </div>
                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${type==='Cash In'?'bg-green-500':'bg-red-500'}`}
                                style={{width:`${total>0?(amt/total*100):0}%`}}/>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TRANSACTIONS ── */}
      {tab==='transactions' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="relative col-span-2 sm:col-span-3 lg:col-span-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
                <input value={fSearch} onChange={e=>setFSearch(e.target.value)} placeholder="Search..." className="field pl-9 py-2 text-xs"/>
              </div>
              <select value={fType} onChange={e=>setFType(e.target.value)} className="field py-2 text-xs">
                <option value="">All Types</option>
                <option value="Cash In">Cash In</option>
                <option value="Cash Out">Cash Out</option>
              </select>
              <select value={fStatus} onChange={e=>setFStatus(e.target.value)} className="field py-2 text-xs">
                <option value="">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
              <select value={fCat} onChange={e=>setFCat(e.target.value)} className="field py-2 text-xs">
                <option value="">All Categories</option>
                {cats.map(c=><option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
              <input type="date" value={fDateFrom} onChange={e=>setFDateFrom(e.target.value)} className="field py-2 text-xs" placeholder="From"/>
              <div className="flex gap-2">
                <input type="date" value={fDateTo} onChange={e=>setFDateTo(e.target.value)} className="field py-2 text-xs flex-1" placeholder="To"/>
                {isAdmin && <button onClick={exportCSV} className="btn-secondary py-2 px-3 text-xs whitespace-nowrap"><Download className="w-4 h-4"/></button>}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-50 flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-700">{filtered.length} transaction{filtered.length!==1?'s':''}</p>
              {pending>0 && isAdmin && <span className="text-xs bg-orange-100 text-orange-700 font-bold px-2 py-0.5 rounded-full">{pending} pending approval</span>}
            </div>
            <TxTable rows={filtered} isAdmin={isAdmin} isAccountant={isAccountant}
              onApprove={approveTx} onReject={t=>{setRejectModal(t);setRejectReason('');}} onDelete={deleteTx}
              onEdit={t=>{setEditTx(t);setTxType(t.type);setSelCat(t.category);setAddModal(true);}} statusBadge={statusBadge}/>
          </div>
        </div>
      )}

      {/* ── CASH IN HAND ── */}
      {tab==='cash-in-hand' && (
        <div className="space-y-4">
          {/* Deposit Cash shortcut for non-admin users */}
          {!isAdmin && cashInHand.length > 0 && cashInHand[0]?.balance > 0 && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-5 flex items-center justify-between">
              <div>
                <p className="font-bold text-indigo-900">Your Cash Balance: {PKR(cashInHand[0].balance)}</p>
                <p className="text-xs text-indigo-600 mt-0.5">Transfer collected cash to admin for reconciliation</p>
              </div>
              <button onClick={()=>setTransferModal(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700">
                <Send className="w-4 h-4 inline mr-1.5"/>Deposit Cash
              </button>
            </div>
          )}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50">
              <h3 className="font-bold text-gray-900">{isAdmin ? 'Cash in Hand — Per User' : 'My Cash Balance'}</h3>
              <p className="text-xs text-gray-400 mt-0.5">Shows cash held based on approved transactions and transfers.</p>
            </div>
            {cashInHand.length===0 ? (
              <p className="px-5 py-10 text-center text-sm text-gray-400 italic">No cash data yet. Cash in hand will appear when ticket transactions are approved.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      {['User','Role','Cash In','Cash Out','Transfers Out','Transfers In','Pending Transfers','Net Balance'].map(h=>(
                        <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {cashInHand.map((u:any)=>(
                      <tr key={u.email} className={`hover:bg-gray-50 ${isAdmin ? 'cursor-pointer' : ''}`}
                        onClick={()=>{
                          if(!isAdmin) return;
                          setUserReportEmail(u.email);
                          fetch(`/api/accounts/user-report/${encodeURIComponent(u.email)}`, { headers: h() })
                            .then(r=>r.json()).then(d=>setUserReport({...d, userName: u.name||u.nick_name||u.email, email: u.email}))
                            .catch(()=>toast('Failed to load report', true));
                        }}>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-gray-900 text-xs">{u.name||u.nick_name||u.email}</p>
                          <p className="text-[10px] text-gray-400">{u.email}</p>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">{u.role}</td>
                        <td className="px-4 py-3 text-xs font-bold text-green-700">{PKR(u.cash_in)}</td>
                        <td className="px-4 py-3 text-xs font-bold text-red-700">{PKR(u.cash_out)}</td>
                        <td className="px-4 py-3 text-xs text-gray-500">{PKR(u.transfers_out)}</td>
                        <td className="px-4 py-3 text-xs text-gray-500">{PKR(u.transfers_in)}</td>
                        <td className="px-4 py-3 text-xs">{u.pending_transfers>0 ? <span className="bg-orange-100 text-orange-700 font-bold px-2 py-0.5 rounded-full">{PKR(u.pending_transfers)}</span> : '—'}</td>
                        <td className="px-4 py-3 font-bold text-sm">
                          <span className={u.balance>=0?'text-indigo-700':'text-red-600'}>{PKR(u.balance)}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TRANSFERS ── */}
      {tab==='transfers' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={()=>setTransferModal(true)} className="btn-primary"><Send className="w-4 h-4 mr-1.5"/>New Transfer</button>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50">
              <h3 className="font-bold text-gray-900">Cash Transfers</h3>
            </div>
            {transfers.length===0 ? (
              <p className="px-5 py-10 text-center text-sm text-gray-400 italic">No cash transfers yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      {['Date','From','To','Amount','Description','Status','Actions'].map(h=>(
                        <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {transfers.map((t:any)=>(
                      <tr key={t.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{fmt(t.created_at)}</td>
                        <td className="px-4 py-3 text-xs text-gray-700 font-medium">{t.from_user?.split('@')[0]}</td>
                        <td className="px-4 py-3 text-xs text-gray-700 font-medium">{t.to_user?.split('@')[0]}</td>
                        <td className="px-4 py-3 font-bold text-sm text-indigo-700">{PKR(t.amount)}</td>
                        <td className="px-4 py-3 text-xs text-gray-500 max-w-[160px] truncate">{t.description||'—'}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusBadge(t.status)}`}>{t.status}</span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {isAdmin && t.status==='Pending' && (
                            <div className="flex items-center gap-1.5">
                              <button onClick={async()=>{
                                const res=await fetch(`/api/accounts/transfers/${t.id}/approve`,{method:'PUT',headers:hj()});
                                if(res.ok){load();toast('Transfer approved!');}else{const d=await res.json();toast(d.error||'Failed',true);}
                              }} className="text-green-600 hover:text-green-700" title="Approve"><Check className="w-4 h-4"/></button>
                              <button onClick={async()=>{
                                const reason=window.prompt('Rejection reason (optional):');
                                if(reason===null)return;
                                const res=await fetch(`/api/accounts/transfers/${t.id}/reject`,{method:'PUT',headers:hj(),body:JSON.stringify({reason})});
                                if(res.ok){load();toast('Transfer rejected.');}else{const d=await res.json();toast(d.error||'Failed',true);}
                              }} className="text-red-500 hover:text-red-600" title="Reject"><X className="w-4 h-4"/></button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TRANSFER MODAL */}
      {transferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={()=>setTransferModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={e=>e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-gray-900">New Cash Transfer</h3>
              <button onClick={()=>setTransferModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={async(e)=>{
              e.preventDefault();
              if(transferSubmitting) return;
              setTransferSubmitting(true);
              try {
                const fd=new FormData(e.currentTarget);
                const body={to_user:fd.get('to_user'),amount:Number(fd.get('amount')),description:fd.get('description')};
                const res=await fetch('/api/accounts/transfers',{method:'POST',headers:hj(),body:JSON.stringify(body)});
                const d=await res.json();
                if(!res.ok){toast(d.error||'Failed',true);return;}
                setTransferModal(false);load();toast(d.status==='Approved'?'Transfer completed!':'Transfer submitted for approval.');
              } catch { toast('Network error', true); }
              finally { setTransferSubmitting(false); }
            }} className="space-y-4">
              <div>
                <label className="field-label">Transfer To</label>
                <select name="to_user" required className="field">
                  <option value="">Select user...</option>
                  {usersList.filter((u:any)=>u.email!==user?.email && u.status==='Active').map((u:any)=>(
                    <option key={u.email} value={u.email}>{u.name||u.nick_name||u.email} ({u.role})</option>
                  ))}
                </select>
              </div>
              <div><label className="field-label">Amount (PKR)</label><input name="amount" type="number" min="1" required className="field"/></div>
              <div><label className="field-label">Description (optional)</label><input name="description" className="field" placeholder="e.g. Daily cash collection"/></div>
              <button type="submit" disabled={transferSubmitting} className="btn-primary w-full disabled:opacity-50">
                {transferSubmitting ? 'Submitting...' : 'Submit Transfer'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── CATEGORIES ── */}
      {tab==='categories' && isAdmin && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={()=>{setEditCat(null);setCatModal(true);}} className="btn-primary"><Plus className="w-4 h-4 mr-1.5"/>Add Category</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {['Cash In','Cash Out'].map(type=>(
              <div key={type} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className={`px-5 py-3 border-b border-gray-50 flex items-center justify-between`}>
                  <h3 className={`font-bold text-sm ${type==='Cash In'?'text-green-700':'text-red-700'}`}>{type} Categories</h3>
                </div>
                <div className="divide-y divide-gray-50">
                  {cats.filter(c=>c.type===type).map(cat=>(
                    <div key={cat.id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{cat.name}</p>
                        {cat.subcategories?.length>0 && (
                          <p className="text-xs text-gray-400 mt-0.5">{cat.subcategories.join(', ')}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={()=>{setEditCat(cat);setCatModal(true);}} className="text-indigo-400 hover:text-indigo-600"><Edit2 className="w-4 h-4"/></button>
                        <button onClick={async()=>{if(window.confirm('Delete category?')){await fetch(`/api/accounts/categories/${cat.id}`,{method:'DELETE',headers:h()});load();}}} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4"/></button>
                      </div>
                    </div>
                  ))}
                  {cats.filter(c=>c.type===type).length===0 && <p className="px-5 py-6 text-sm text-gray-400 italic">No categories yet.</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── REPORTS ── */}
      {tab==='reports' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
              <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-1">Total Income</p>
              <p className="text-2xl font-black text-green-600">{PKR(totalIn)}</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
              <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-1">Total Expenses</p>
              <p className="text-2xl font-black text-red-600">{PKR(totalOut)}</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
              <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-1">Net Balance</p>
              <p className={`text-2xl font-black ${totalIn-totalOut>=0?'text-indigo-600':'text-red-600'}`}>{PKR(totalIn-totalOut)}</p>
            </div>
          </div>

          {isAdmin && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
                <h3 className="font-bold text-gray-900">Full Transaction History</h3>
                <button onClick={exportCSV} className="btn-secondary text-xs"><Download className="w-4 h-4 mr-1.5"/>Export CSV</button>
              </div>
              <TxTable rows={approved} isAdmin={isAdmin} isAccountant={isAccountant}
                onApprove={approveTx} onReject={t=>{setRejectModal(t);setRejectReason('');}} onDelete={deleteTx}
                onEdit={t=>{setEditTx(t);setTxType(t.type);setSelCat(t.category);setAddModal(true);}} statusBadge={statusBadge}/>
            </div>
          )}
        </div>
      )}

      {/* ── ADD/EDIT TX MODAL ── */}
      {addModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={()=>{setAddModal(false);setEditTx(null);}}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto" onClick={e=>e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-gray-900">{editTx?'Edit Transaction':'Add Transaction'}</h3>
              <button onClick={()=>{setAddModal(false);setEditTx(null);}} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={submitTx} className="space-y-4">
              <div>
                <label className="field-label">Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['Cash In','Cash Out'] as const).map(t=>(
                    <button type="button" key={t} onClick={()=>{setTxType(t);setSelCat('');setSelSubcat('');}}
                      className={`py-2.5 rounded-xl text-sm font-bold border-2 transition-colors ${txType===t ? (t==='Cash In'?'bg-green-50 border-green-500 text-green-700':'bg-red-50 border-red-500 text-red-700') : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                      {t==='Cash In'?'↑ Cash In':'↓ Cash Out'}
                    </button>
                  ))}
                </div>
                <input type="hidden" name="type" value={txType}/>
              </div>
              <div><label className="field-label">Amount (PKR)</label><input name="amount" type="number" min="1" required defaultValue={editTx?.amount} className="field"/></div>
              <div>
                <label className="field-label">Category</label>
                <select name="category" value={selCat} onChange={e=>{setSelCat(e.target.value);setSelSubcat('');}} required className="field">
                  <option value="">Select category...</option>
                  {availCats.map(c=><option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              {selCatObj?.subcategories?.length>0 && (
                <div>
                  <label className="field-label">Subcategory</label>
                  <select name="subcategory" value={selSubcat} onChange={e=>setSelSubcat(e.target.value)} className="field">
                    <option value="">None</option>
                    {selCatObj.subcategories.map(s=><option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              )}
              <div><label className="field-label">Description</label><textarea name="description" required rows={2} defaultValue={editTx?.description} className="field resize-none" placeholder="What is this transaction for?"/></div>
              <div><label className="field-label">Date</label><input name="date" type="date" required defaultValue={editTx?.date?.split('T')[0] || new Date().toISOString().split('T')[0]} className="field"/></div>
              <div><label className="field-label">Reference (optional)</label><input name="tx_reference" defaultValue={editTx?.tx_reference} className="field" placeholder="e.g. invoice number, receipt ID"/></div>
              <button type="submit" disabled={saving} className="btn-primary w-full mt-2">{saving?'Saving...':editTx?'Update':'Add Transaction'}</button>
            </form>
          </div>
        </div>
      )}

      {/* REJECT MODAL */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <h3 className="font-bold text-gray-900 mb-3">Reject Transaction</h3>
            <p className="text-sm text-gray-500 mb-3">Amount: <strong>{PKR(rejectModal.amount)}</strong> · {rejectModal.category}</p>
            <label className="field-label">Reason <span className="text-gray-400 normal-case">(optional)</span></label>
            <textarea value={rejectReason} onChange={e=>setRejectReason(e.target.value)} rows={3} className="field resize-none mt-1" placeholder="Why is this being rejected?"/>
            <div className="flex gap-3 mt-4">
              <button onClick={()=>setRejectModal(null)} className="flex-1 btn-secondary">Cancel</button>
              <button onClick={rejectTx} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700">Reject</button>
            </div>
          </div>
        </div>
      )}

      {/* USER REPORT MODAL */}
      {userReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={()=>setUserReport(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto" onClick={e=>e.stopPropagation()}>
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{userReport.userName}</h3>
                <p className="text-xs text-gray-400">{userReport.email}</p>
              </div>
              <button onClick={()=>setUserReport(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5"/></button>
            </div>
            <div className="p-6 space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-green-50 rounded-xl p-4 text-center">
                  <p className="text-xs text-green-600 font-semibold uppercase">Total Cash In</p>
                  <p className="text-xl font-black text-green-700 mt-1">{PKR(userReport.cashIn || 0)}</p>
                </div>
                <div className="bg-red-50 rounded-xl p-4 text-center">
                  <p className="text-xs text-red-600 font-semibold uppercase">Total Cash Out</p>
                  <p className="text-xl font-black text-red-700 mt-1">{PKR(userReport.cashOut || 0)}</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-4 text-center">
                  <p className="text-xs text-blue-600 font-semibold uppercase">Ticket Sales</p>
                  <p className="text-xl font-black text-blue-700 mt-1">{PKR(userReport.ticketSales?.total || 0)}</p>
                  <p className="text-[10px] text-blue-500 mt-0.5">{userReport.ticketSales?.count || 0} transactions</p>
                </div>
                <div className="bg-indigo-50 rounded-xl p-4 text-center">
                  <p className="text-xs text-indigo-600 font-semibold uppercase">Net Balance</p>
                  <p className={`text-xl font-black mt-1 ${(userReport.balance || 0) >= 0 ? 'text-indigo-700' : 'text-red-600'}`}>{PKR(userReport.balance || 0)}</p>
                </div>
              </div>

              {/* Category Breakdown */}
              {userReport.cashByCategory?.length > 0 && (
                <div>
                  <h4 className="font-bold text-gray-900 text-sm mb-3">Breakdown by Category</h4>
                  <div className="space-y-2">
                    {userReport.cashByCategory.map((c: any, i: number) => (
                      <div key={i} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.type === 'Cash In' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{c.type}</span>
                          <span className="text-sm text-gray-700">{c.category}</span>
                        </div>
                        <span className="font-bold text-sm text-gray-900">{PKR(c.total)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Transfers */}
              {userReport.transfers?.length > 0 && (
                <div>
                  <h4 className="font-bold text-gray-900 text-sm mb-3">Recent Transfers</h4>
                  <div className="space-y-2">
                    {userReport.transfers.slice(0, 10).map((t: any) => (
                      <div key={t.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg text-xs">
                        <div>
                          <span className="text-gray-500">{fmt(t.created_at)}</span>
                          <span className="mx-2 text-gray-300">·</span>
                          <span className="text-gray-700">{t.from_user === userReport.email ? `→ ${t.to_user?.split('@')[0]}` : `← ${t.from_user?.split('@')[0]}`}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${t.from_user === userReport.email ? 'text-red-600' : 'text-green-600'}`}>
                            {t.from_user === userReport.email ? '-' : '+'}{PKR(t.amount)}
                          </span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${statusBadge(t.status)}`}>{t.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CATEGORY MODAL */}
      {catModal && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={()=>{setCatModal(false);setEditCat(null);}}>
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl" onClick={e=>e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-bold text-gray-900">{editCat?'Edit Category':'Add Category'}</h3>
              <button onClick={()=>{setCatModal(false);setEditCat(null);}}><X className="w-5 h-5 text-gray-400"/></button>
            </div>
            <form onSubmit={submitCat} className="space-y-4">
              <div><label className="field-label">Name</label><input name="name" required defaultValue={editCat?.name} className="field" placeholder="e.g. Ticket Sales"/></div>
              <div><label className="field-label">Type</label>
                <select name="type" defaultValue={editCat?.type||'Cash In'} className="field">
                  <option value="Cash In">Cash In (Income)</option>
                  <option value="Cash Out">Cash Out (Expense)</option>
                </select>
              </div>
              <div><label className="field-label">Subcategories <span className="text-gray-400 normal-case">(comma separated)</span></label>
                <input name="subcategories" defaultValue={editCat?.subcategories?.join(', ')||''} className="field" placeholder="e.g. Online, Cash, Transfer"/>
              </div>
              <button type="submit" className="btn-primary w-full">Save</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Reusable transaction table
function TxTable({ rows, isAdmin, isAccountant, onApprove, onReject, onDelete, onEdit, statusBadge }:any) {
  if(!rows.length) return <p className="px-5 py-10 text-center text-sm text-gray-400 italic">No transactions found.</p>;
  const PKR = (n:number) => `PKR ${Number(n||0).toLocaleString('en-PK')}`;
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-100">
          <tr>
            {['Date','Type','Category','Amount','Description','Status','Source','By','Actions'].map(h=>(
              <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {rows.map((t:any)=>(
            <tr key={t.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{new Date(t.date).toLocaleDateString('en-PK',{day:'2-digit',month:'short'})}</td>
              <td className="px-4 py-3 whitespace-nowrap">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${t.type==='Cash In'?'bg-green-100 text-green-700':'bg-red-100 text-red-700'}`}>{t.type}</span>
              </td>
              <td className="px-4 py-3 text-xs text-gray-700 whitespace-nowrap">
                <span>{t.category}</span>
                {t.subcategory && <span className="text-gray-400 ml-1">· {t.subcategory}</span>}
              </td>
              <td className="px-4 py-3 font-bold whitespace-nowrap">
                <span className={t.type==='Cash In'?'text-green-700':'text-red-700'}>{PKR(t.amount)}</span>
              </td>
              <td className="px-4 py-3 text-xs text-gray-600 max-w-[160px] truncate" title={t.description}>{t.description}</td>
              <td className="px-4 py-3 whitespace-nowrap">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusBadge(t.status)}`}>{t.status}</span>
              </td>
              <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{t.source}</td>
              <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{t.created_by?.split('@')[0]}</td>
              <td className="px-4 py-3 whitespace-nowrap">
                <div className="flex items-center gap-1.5">
                  {isAdmin && t.status==='Pending' && (
                    <>
                      <button onClick={()=>onApprove(t.id)} className="text-green-600 hover:text-green-700" title="Approve"><Check className="w-4 h-4"/></button>
                      <button onClick={()=>onReject(t)} className="text-red-500 hover:text-red-600" title="Reject"><X className="w-4 h-4"/></button>
                    </>
                  )}
                  {isAccountant && t.status!=='Approved' && (
                    <button onClick={()=>onEdit(t)} className="text-indigo-400 hover:text-indigo-600" title="Edit"><Edit2 className="w-4 h-4"/></button>
                  )}
                  {isAdmin && t.status!=='Approved' && (
                    <button onClick={()=>onDelete(t.id)} className="text-gray-300 hover:text-red-500" title="Delete"><Trash2 className="w-4 h-4"/></button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
