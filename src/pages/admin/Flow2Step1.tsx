import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, Upload, CheckCircle, AlertCircle } from 'lucide-react';

export default function Flow2Step1() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [packages, setPackages] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [paymentType, setPaymentType] = useState<'ONLINE'|'CASH'>('CASH');
  const [txId, setTxId] = useState('');
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [address, setAddress] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [receiptFile, setReceiptFile] = useState<File|null>(null);
  const [message, setMessage] = useState<{type:string;text:string}|null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const headers = { 'Authorization': `Bearer ${localStorage.getItem('kartal_token')}` };
    Promise.all([
      fetch('/api/packages/active', { headers }).then(r=>r.json()).catch(()=>[]),
      fetch('/api/campaigns', { headers }).then(r=>r.json()).catch(()=>[]),
    ]).then(([p, c]) => {
      setPackages(Array.isArray(p) ? p : []);
      setCampaigns(Array.isArray(c) ? c.filter((x:any)=>x.status==='Active') : []);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPackage) { setMessage({type:'error',text:'Please select a package'}); return; }
    setSubmitting(true); setMessage(null);

    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('mobile', mobile);
      formData.append('address', address);
      formData.append('package_id', selectedPackage.id.toString());
      formData.append('payment_type', paymentType);
      formData.append('tx_id', txId);
      formData.append('receipt_url', receiptUrl);
      if (campaigns.length > 0) formData.append('campaign_id', campaigns[0].id.toString());
      if (receiptFile) formData.append('receipt', receiptFile);

      const res = await fetch('/api/transactions/flow2/step1', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('kartal_token')}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setMessage({type:'success', text:`Entry created! TX: ${data.tx_id}. An operator can now complete Step 2.`});
      // Reset form
      setName(''); setMobile(''); setAddress(''); setTxId(''); setReceiptUrl('');
      setReceiptFile(null); setSelectedPackage(null);
    } catch (err: any) {
      setMessage({type:'error', text: err.message});
    } finally { setSubmitting(false); }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <button onClick={() => navigate(-1)} className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-2 gap-1">
          <ArrowLeft className="w-4 h-4"/> Back
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Flow 2 — Step 1: Create Entry</h1>
        <p className="text-sm text-gray-500 mt-1">Admin enters customer details and payment info. Operator completes in Step 2.</p>
      </div>

      {message && (
        <div className={`p-4 rounded-xl flex items-start gap-2 ${message.type==='success'?'bg-green-50 text-green-800 border border-green-200':'bg-red-50 text-red-800 border border-red-200'}`}>
          {message.type==='success' ? <CheckCircle className="w-5 h-5 flex-shrink-0"/> : <AlertCircle className="w-5 h-5 flex-shrink-0"/>}
          <p className="text-sm font-medium">{message.text}</p>
        </div>
      )}

      <div className="bg-white shadow-sm rounded-xl border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Package Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Package</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {packages.map(pkg => (
                <div key={pkg.id} onClick={() => setSelectedPackage(pkg)}
                  className={`cursor-pointer rounded-lg border p-4 transition-all ${selectedPackage?.id===pkg.id ? 'border-indigo-600 ring-2 ring-indigo-600 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300'}`}>
                  <h3 className="text-sm font-medium text-gray-900">{pkg.name}</h3>
                  <p className="text-xl font-bold text-gray-900 mt-1">PKR {pkg.amount}</p>
                  <p className="text-xs text-gray-500">{pkg.ticket_count} Tickets</p>
                </div>
              ))}
            </div>
          </div>

          {/* Customer Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Customer Name</label>
              <input type="text" required value={name} onChange={e=>setName(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Mobile Number</label>
              <input type="tel" required value={mobile} onChange={e=>setMobile(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Payment Type</label>
              <select value={paymentType} onChange={e=>setPaymentType(e.target.value as any)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border">
                <option value="CASH">Cash</option>
                <option value="ONLINE">Online Transfer</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Address</label>
            <textarea rows={2} value={address} onChange={e=>setAddress(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"/>
          </div>

          {/* Payment Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Transaction ID {paymentType==='CASH' && '(Auto if empty)'}</label>
              <input type="text" value={txId} onChange={e=>setTxId(e.target.value)}
                required={paymentType==='ONLINE'} placeholder={paymentType==='CASH' ? 'Auto-generated' : 'Enter TX ID'}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"/>
            </div>
            {paymentType==='ONLINE' && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Receipt URL (optional)</label>
                <input type="url" value={receiptUrl} onChange={e=>setReceiptUrl(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"/>
              </div>
            )}
          </div>

          {paymentType==='ONLINE' && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Upload Receipt (optional)</label>
              <input type="file" accept="image/*,application/pdf" onChange={e=>setReceiptFile(e.target.files?.[0]||null)}
                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700"/>
            </div>
          )}

          <button type="submit" disabled={submitting || !selectedPackage}
            className="w-full flex justify-center items-center py-3 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400">
            <Upload className="w-5 h-5 mr-2"/>
            {submitting ? 'Creating...' : 'Create Entry (Step 1)'}
          </button>
        </form>
      </div>
    </div>
  );
}
