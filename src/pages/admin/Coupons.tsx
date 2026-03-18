import React, { useState, useEffect } from 'react';
import { Tag, Plus, X, Trash2, ToggleLeft, ToggleRight, Percent, DollarSign } from 'lucide-react';

const h = () => ({ 'Authorization': `Bearer ${localStorage.getItem('kartal_token')}`, 'Content-Type': 'application/json' });

function toast(msg: string, isError = false) {
  const d = document.createElement('div');
  d.className = `fixed top-4 right-4 z-[9999] px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium ${isError ? 'bg-red-500' : 'bg-emerald-500'}`;
  d.textContent = msg; document.body.appendChild(d); setTimeout(() => d.remove(), 3000);
}

export default function Coupons() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxUses, setMaxUses] = useState('');
  const [validFrom, setValidFrom] = useState('');
  const [validUntil, setValidUntil] = useState('');

  const load = async () => {
    try {
      const r = await fetch('/api/coupons', { headers: h() });
      if (r.ok) setCoupons(await r.json());
    } catch {}
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = await fetch('/api/coupons', { method: 'POST', headers: h(), body: JSON.stringify({
      code, discount_type: discountType, discount_value: parseFloat(discountValue),
      min_amount: parseFloat(minAmount) || 0, max_uses: parseInt(maxUses) || 0,
      valid_from: validFrom || null, valid_until: validUntil || null
    })});
    if (r.ok) { toast('Coupon created!'); setShowCreate(false); resetForm(); load(); }
    else { const d = await r.json().catch(() => ({})); toast(d.error || 'Failed', true); }
  };

  const toggleStatus = async (id: number, current: string) => {
    await fetch(`/api/coupons/${id}`, { method: 'PUT', headers: h(), body: JSON.stringify({ status: current === 'Active' ? 'Inactive' : 'Active' }) });
    load();
  };

  const deleteCoupon = async (id: number) => {
    if (!confirm('Delete this coupon?')) return;
    await fetch(`/api/coupons/${id}`, { method: 'DELETE', headers: h() });
    load();
  };

  const resetForm = () => { setCode(''); setDiscountType('percentage'); setDiscountValue(''); setMinAmount(''); setMaxUses(''); setValidFrom(''); setValidUntil(''); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Coupons & Discounts</h1>
          <p className="text-sm text-gray-500">Create discount codes for ticket purchases</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700">
          <Plus className="w-4 h-4" /> New Coupon
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-green-50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{coupons.filter(c => c.status === 'Active').length}</p>
          <p className="text-xs text-gray-500">Active</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-gray-600">{coupons.filter(c => c.status === 'Inactive').length}</p>
          <p className="text-xs text-gray-500">Inactive</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{coupons.reduce((s, c) => s + (c.used_count || 0), 0)}</p>
          <p className="text-xs text-gray-500">Total Uses</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase">
              <th className="px-4 py-3">Code</th><th className="px-4 py-3">Discount</th><th className="px-4 py-3">Min Amount</th>
              <th className="px-4 py-3">Uses</th><th className="px-4 py-3">Valid Until</th><th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-center">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {coupons.length === 0 ? <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No coupons yet</td></tr> :
               coupons.map(c => (
                <tr key={c.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-mono font-bold text-indigo-600">{c.code}</td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1">
                      {c.discount_type === 'percentage' ? <Percent className="w-3 h-3" /> : <DollarSign className="w-3 h-3" />}
                      {c.discount_value}{c.discount_type === 'percentage' ? '%' : ' PKR'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{c.min_amount > 0 ? `PKR ${c.min_amount.toLocaleString()}` : '-'}</td>
                  <td className="px-4 py-3">{c.used_count}{c.max_uses > 0 ? ` / ${c.max_uses}` : ' / ∞'}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{c.valid_until ? new Date(c.valid_until).toLocaleDateString() : 'No expiry'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.status === 'Active' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{c.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => toggleStatus(c.id, c.status)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg" title="Toggle">
                        {c.status === 'Active' ? <ToggleRight className="w-4 h-4 text-green-600" /> : <ToggleLeft className="w-4 h-4" />}
                      </button>
                      <button onClick={() => deleteCoupon(c.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">New Coupon</h3>
              <button onClick={() => { setShowCreate(false); resetForm(); }} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Coupon Code</label>
                <input value={code} onChange={e => setCode(e.target.value.toUpperCase())} required placeholder="e.g. SAVE20"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-mono uppercase" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Discount Type</label>
                  <select value={discountType} onChange={e => setDiscountType(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm">
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (PKR)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Value</label>
                  <input type="number" value={discountValue} onChange={e => setDiscountValue(e.target.value)} required min="1"
                    placeholder={discountType === 'percentage' ? '20' : '500'} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Min Amount (optional)</label>
                  <input type="number" value={minAmount} onChange={e => setMinAmount(e.target.value)} placeholder="0"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Max Uses (0 = unlimited)</label>
                  <input type="number" value={maxUses} onChange={e => setMaxUses(e.target.value)} placeholder="0"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Valid From</label>
                  <input type="date" value={validFrom} onChange={e => setValidFrom(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Valid Until</label>
                  <input type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" />
                </div>
              </div>
              <button type="submit" className="w-full bg-indigo-600 text-white py-2.5 rounded-xl font-medium hover:bg-indigo-700">Create Coupon</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
