import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, CheckCircle, AlertCircle, Clock, Package } from 'lucide-react';

export default function Flow2Step2() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pending, setPending] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<number|null>(null);
  const [message, setMessage] = useState<{type:string;text:string}|null>(null);

  const load = async () => {
    const headers = { 'Authorization': `Bearer ${localStorage.getItem('kartal_token')}` };
    try {
      const [pRes, pkgRes] = await Promise.all([
        fetch('/api/transactions/flow2/pending-step2', { headers }),
        fetch('/api/packages', { headers }),
      ]);
      const pData = await pRes.json().catch(()=>[]);
      const pkgData = await pkgRes.json().catch(()=>[]);
      setPending(Array.isArray(pData) ? pData : []);
      setPackages(Array.isArray(pkgData) ? pkgData : []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const getPkgName = (id: number) => packages.find(p=>p.id===id)?.name || `Package #${id}`;

  const completeStep2 = async (txId: number) => {
    if (!window.confirm('Complete this entry and generate tickets?')) return;
    setProcessing(txId); setMessage(null);
    try {
      const res = await fetch(`/api/transactions/flow2/${txId}/step2`, {
        method: 'PUT',
        headers: { 'Content-Type':'application/json', 'Authorization': `Bearer ${localStorage.getItem('kartal_token')}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setMessage({type:'success', text:`Tickets generated for TX: ${data.tx_id}!`});
      const base = user?.role === 'Admin' ? '/admin' : '/user';
      navigate(`${base}/success/${data.tx_id}`);
    } catch (err: any) {
      setMessage({type:'error', text: err.message});
    } finally { setProcessing(null); }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[300px]">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"/>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <button onClick={() => navigate(-1)} className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-2 gap-1">
          <ArrowLeft className="w-4 h-4"/> Back
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Flow 2 — Step 2: Complete Entry</h1>
        <p className="text-sm text-gray-500 mt-1">Review and complete pending entries to generate tickets.</p>
      </div>

      {message && (
        <div className={`p-4 rounded-xl flex items-start gap-2 ${message.type==='success'?'bg-green-50 text-green-800 border border-green-200':'bg-red-50 text-red-800 border border-red-200'}`}>
          {message.type==='success' ? <CheckCircle className="w-5 h-5 flex-shrink-0"/> : <AlertCircle className="w-5 h-5 flex-shrink-0"/>}
          <p className="text-sm font-medium">{message.text}</p>
        </div>
      )}

      {pending.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4"/>
          <p className="text-gray-500 text-sm">No pending entries. Check back later.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pending.map(tx => (
            <div key={tx.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-mono text-sm font-bold text-indigo-600">{tx.tx_id}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">Pending Step 2</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-gray-500">
                    <div><Package className="w-3 h-3 inline mr-1"/>{getPkgName(tx.package_id)}</div>
                    <div>PKR {Number(tx.amount).toLocaleString()}</div>
                    <div>{tx.ticket_count} ticket{tx.ticket_count>1?'s':''}</div>
                    <div>{tx.payment_type}</div>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">Created by: {tx.step1_user?.split('@')[0]} · {new Date(tx.date).toLocaleDateString()}</p>
                </div>
                <button onClick={() => completeStep2(tx.id)} disabled={processing===tx.id}
                  className="ml-4 px-4 py-2 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-700 disabled:bg-gray-400 whitespace-nowrap">
                  {processing===tx.id ? 'Processing...' : 'Complete & Generate'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
