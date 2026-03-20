import React, { useEffect, useState } from 'react';
import { Receipt, Plus, Search, Eye, Printer, Download, X, FileText } from 'lucide-react';
import jsPDF from 'jspdf';

const h = () => ({ 'Authorization': `Bearer ${localStorage.getItem('kartal_token')}`, 'Content-Type': 'application/json' });

function toast(msg: string, isError = false) {
  const d = document.createElement('div');
  d.className = `fixed top-4 right-4 z-[9999] px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium ${isError ? 'bg-red-500' : 'bg-emerald-500'}`;
  d.textContent = msg; document.body.appendChild(d); setTimeout(() => d.remove(), 3000);
}

interface ReceiptData {
  id: number; receipt_number: string; type: string; reference_type: string; reference_id: number;
  from_party: string; to_party: string; amount: number; description: string;
  payment_method: string; created_by: string; created_at: string;
}

export default function Receipts() {
  const [receipts, setReceipts] = useState<ReceiptData[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [viewReceipt, setViewReceipt] = useState<ReceiptData | null>(null);

  // Form
  const [formType, setFormType] = useState('Payment');
  const [fromParty, setFromParty] = useState('');
  const [toParty, setToParty] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');

  const fetchReceipts = async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (search) params.set('search', search);
    if (typeFilter) params.set('type', typeFilter);
    try {
      const r = await fetch(`/api/receipts?${params}`, { headers: h() });
      if (r.ok) { const d = await r.json(); setReceipts(d.receipts || []); setTotal(d.total || 0); }
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchReceipts(); }, [page, search, typeFilter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = await fetch('/api/receipts', { method: 'POST', headers: h(), body: JSON.stringify({
      type: formType, from_party: fromParty, to_party: toParty, amount: parseFloat(amount),
      description, payment_method: paymentMethod
    })});
    if (r.ok) {
      toast('Receipt created!'); setShowCreate(false); fetchReceipts();
      setFormType('Payment'); setFromParty(''); setToParty(''); setAmount(''); setDescription(''); setPaymentMethod('Cash');
    } else { const d = await r.json().catch(() => ({})); toast(d.error || 'Failed', true); }
  };

  const generatePDF = (receipt: ReceiptData) => {
    const doc = new jsPDF({ unit: 'mm', format: [80, 140] });
    const w = 80;
    let y = 8;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
    doc.text('KARTAL MART', w / 2, y, { align: 'center' }); y += 5;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7);
    doc.text('Group of Companies', w / 2, y, { align: 'center' }); y += 6;
    doc.setLineWidth(0.3); doc.line(4, y, w - 4, y); y += 4;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
    doc.text('RECEIPT', w / 2, y, { align: 'center' }); y += 6;
    doc.setFontSize(8); doc.setFont('helvetica', 'normal');
    const lines = [
      ['Receipt #', receipt.receipt_number],
      ['Date', new Date(receipt.created_at).toLocaleDateString('en-PK')],
      ['Type', receipt.type],
      ['From', receipt.from_party],
      ['To', receipt.to_party],
      ['Amount', `PKR ${receipt.amount.toLocaleString()}`],
      ['Payment', receipt.payment_method],
      ['Description', receipt.description || '-'],
    ];
    lines.forEach(([label, val]) => {
      doc.setFont('helvetica', 'bold'); doc.text(label + ':', 6, y);
      doc.setFont('helvetica', 'normal'); doc.text(String(val), 30, y, { maxWidth: 44 });
      y += 5;
    });
    y += 2; doc.line(4, y, w - 4, y); y += 5;
    doc.setFontSize(7); doc.text('Thank you for your business', w / 2, y, { align: 'center' });
    doc.save(`Receipt-${receipt.receipt_number}.pdf`);
  };

  const printReceipt = (receipt: ReceiptData) => {
    const win = window.open('', '_blank', 'width=320,height=500');
    if (!win) return;
    win.document.write(`<html><head><title>Receipt ${receipt.receipt_number}</title>
    <style>body{font-family:Arial,sans-serif;width:72mm;margin:0 auto;padding:8px;font-size:11px}
    h2{text-align:center;margin:4px 0;font-size:14px}h3{text-align:center;margin:2px 0;font-size:10px;font-weight:normal;color:#888}
    hr{border:none;border-top:1px dashed #999;margin:6px 0}.row{display:flex;justify-content:space-between;padding:2px 0}
    .label{font-weight:bold;color:#555}.val{text-align:right;max-width:55%}.total{font-size:14px;font-weight:bold}
    .footer{text-align:center;margin-top:10px;font-size:9px;color:#888}</style></head><body>
    <h2>KARTAL MART</h2><h3>Group of Companies</h3><hr>
    <h3 style="font-weight:bold;font-size:12px;color:#000">RECEIPT</h3>
    <div class="row"><span class="label">Receipt #</span><span class="val">${receipt.receipt_number}</span></div>
    <div class="row"><span class="label">Date</span><span class="val">${new Date(receipt.created_at).toLocaleDateString('en-PK')}</span></div>
    <div class="row"><span class="label">Type</span><span class="val">${receipt.type}</span></div>
    <hr>
    <div class="row"><span class="label">From</span><span class="val">${receipt.from_party}</span></div>
    <div class="row"><span class="label">To</span><span class="val">${receipt.to_party}</span></div>
    <div class="row"><span class="label">Payment</span><span class="val">${receipt.payment_method}</span></div>
    <hr>
    <div class="row"><span class="label total">Amount</span><span class="val total">PKR ${receipt.amount.toLocaleString()}</span></div>
    <hr>
    <div class="row"><span class="label">Description</span></div>
    <div style="padding:2px 0">${receipt.description || '-'}</div>
    <div class="footer"><p>Thank you for your business</p><p>Created by: ${receipt.created_by}</p></div>
    </body></html>`);
    win.document.close();
    setTimeout(() => { win.print(); }, 300);
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Receipts</h1>
          <p className="text-sm text-gray-500">Payment receipts for all transactions</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 text-sm font-medium">
          <Plus className="w-4 h-4" /> New Receipt
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search receipts..." className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm" />
        </div>
        <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm">
          <option value="">All Types</option>
          <option value="Payment">Payment</option>
          <option value="Salary Payment">Salary</option>
          <option value="Cash Transfer">Transfer</option>
          <option value="Cash In">Cash In</option>
          <option value="Cash Out">Cash Out</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase">
              <th className="px-4 py-3">Receipt #</th><th className="px-4 py-3">Date</th><th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">From</th><th className="px-4 py-3">To</th><th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3 text-center">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Loading...</td></tr> :
               receipts.length === 0 ? <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No receipts found</td></tr> :
               receipts.map(r => (
                <tr key={r.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-mono text-xs font-medium text-indigo-600">{r.receipt_number}</td>
                  <td className="px-4 py-3 text-gray-500">{new Date(r.created_at).toLocaleDateString('en-PK')}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    r.type === 'Cash In' ? 'bg-green-50 text-green-700' :
                    r.type === 'Cash Out' ? 'bg-red-50 text-red-700' :
                    r.type === 'Salary Payment' ? 'bg-blue-50 text-blue-700' :
                    r.type === 'Cash Transfer' ? 'bg-purple-50 text-purple-700' :
                    'bg-gray-50 text-gray-700'
                  }`}>{r.type}</span></td>
                  <td className="px-4 py-3 text-gray-600 truncate max-w-[120px]">{r.from_party}</td>
                  <td className="px-4 py-3 text-gray-600 truncate max-w-[120px]">{r.to_party}</td>
                  <td className="px-4 py-3 text-right font-semibold">PKR {r.amount.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => setViewReceipt(r)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg" title="View"><Eye className="w-4 h-4" /></button>
                      <button onClick={() => printReceipt(r)} className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg" title="Print"><Printer className="w-4 h-4" /></button>
                      <button onClick={() => generatePDF(r)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="Download PDF"><Download className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <span className="text-xs text-gray-500">{total} receipts</span>
            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => (
                <button key={i} onClick={() => setPage(i + 1)} className={`px-3 py-1 rounded-lg text-xs font-medium ${page === i + 1 ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>{i + 1}</button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">New Receipt</h3>
              <button onClick={() => setShowCreate(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div><label className="block text-xs font-semibold text-gray-500 mb-1">Type</label>
                <select value={formType} onChange={e => setFormType(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm">
                  <option>Payment</option><option>Cash In</option><option>Cash Out</option><option>Salary Payment</option><option>Cash Transfer</option><option>Expense</option><option>Other</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-semibold text-gray-500 mb-1">From</label>
                  <input value={fromParty} onChange={e => setFromParty(e.target.value)} required className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" />
                </div>
                <div><label className="block text-xs font-semibold text-gray-500 mb-1">To</label>
                  <input value={toParty} onChange={e => setToParty(e.target.value)} required className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-semibold text-gray-500 mb-1">Amount (PKR)</label>
                  <input type="number" value={amount} onChange={e => setAmount(e.target.value)} required min="1" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" />
                </div>
                <div><label className="block text-xs font-semibold text-gray-500 mb-1">Payment Method</label>
                  <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm">
                    <option>Cash</option><option>Online</option><option>Bank Transfer</option><option>Cheque</option>
                  </select>
                </div>
              </div>
              <div><label className="block text-xs font-semibold text-gray-500 mb-1">Description</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none" />
              </div>
              <button type="submit" className="w-full bg-indigo-600 text-white py-2.5 rounded-xl font-medium hover:bg-indigo-700">Create Receipt</button>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Receipt {viewReceipt.receipt_number}</h3>
              <button onClick={() => setViewReceipt(null)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3 text-sm">
              {[
                ['Receipt #', viewReceipt.receipt_number], ['Date', new Date(viewReceipt.created_at).toLocaleString('en-PK')],
                ['Type', viewReceipt.type], ['From', viewReceipt.from_party], ['To', viewReceipt.to_party],
                ['Amount', `PKR ${viewReceipt.amount.toLocaleString()}`], ['Payment', viewReceipt.payment_method],
                ['Description', viewReceipt.description || '-'], ['Created by', viewReceipt.created_by],
              ].map(([l, v]) => (
                <div key={l} className="flex justify-between"><span className="font-medium text-gray-500">{l}</span><span className="text-gray-900 text-right max-w-[60%]">{v}</span></div>
              ))}
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => printReceipt(viewReceipt)} className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-2 rounded-xl text-sm font-medium hover:bg-green-700">
                <Printer className="w-4 h-4" /> Print
              </button>
              <button onClick={() => generatePDF(viewReceipt)} className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-2 rounded-xl text-sm font-medium hover:bg-blue-700">
                <Download className="w-4 h-4" /> PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
