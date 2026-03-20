import React, { useEffect, useState } from 'react';
import { FileText, Plus, Search, Eye, Edit2, Trash2, CheckCircle, Download, X, Printer } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import jsPDF from 'jspdf';

const headers = () => ({ 'Authorization': `Bearer ${localStorage.getItem('kartal_token')}`, 'Content-Type': 'application/json' });

interface InvoiceItem { description: string; qty: number; rate: number; amount: number; }
interface Invoice {
  id: number; invoice_number: string; type: string; customer_name: string; customer_mobile: string;
  customer_address: string; items: string; subtotal: number; discount: number; tax: number;
  total: number; status: string; notes: string; due_date: string; paid_at: string;
  created_by: string; created_at: string;
}

const emptyItem: InvoiceItem = { description: '', qty: 1, rate: 0, amount: 0 };

function toast(msg: string, isError = false) {
  const d = document.createElement('div');
  d.className = `fixed top-4 right-4 z-[9999] px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium ${isError ? 'bg-red-500' : 'bg-emerald-500'}`;
  d.textContent = msg;
  document.body.appendChild(d);
  setTimeout(() => d.remove(), 3000);
}

export default function Invoices() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editInvoice, setEditInvoice] = useState<Invoice | null>(null);
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  // Form state
  const [formType, setFormType] = useState('Sale');
  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [items, setItems] = useState<InvoiceItem[]>([{ ...emptyItem }]);
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);
  const [notes, setNotes] = useState('');
  const [dueDate, setDueDate] = useState('');

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      const r = await fetch(`/api/invoices?${params}`, { headers: headers() });
      if (r.ok) {
        const d = await r.json();
        setInvoices(d.invoices || []);
        setTotal(d.total || 0);
      }
    } catch { }
    setLoading(false);
  };

  useEffect(() => { fetchInvoices(); }, [page, search, statusFilter]);

  const subtotal = items.reduce((s, i) => s + i.amount, 0);
  const grandTotal = subtotal - discount + tax;

  const updateItem = (idx: number, field: keyof InvoiceItem, val: string | number) => {
    const updated = [...items];
    (updated[idx] as any)[field] = val;
    if (field === 'qty' || field === 'rate') {
      updated[idx].amount = updated[idx].qty * updated[idx].rate;
    }
    setItems(updated);
  };

  const resetForm = () => {
    setFormType('Sale'); setCustomerName(''); setCustomerMobile(''); setCustomerAddress('');
    setItems([{ ...emptyItem }]); setDiscount(0); setTax(0); setNotes(''); setDueDate('');
    setEditInvoice(null);
  };

  const openEdit = (inv: Invoice) => {
    setEditInvoice(inv);
    setFormType(inv.type);
    setCustomerName(inv.customer_name);
    setCustomerMobile(inv.customer_mobile);
    setCustomerAddress(inv.customer_address);
    try { setItems(JSON.parse(inv.items)); } catch { setItems([{ ...emptyItem }]); }
    setDiscount(inv.discount);
    setTax(inv.tax);
    setNotes(inv.notes || '');
    setDueDate(inv.due_date || '');
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent, status: string = 'Draft') => {
    e.preventDefault();
    if (items.length === 0 || !items.some(i => i.description)) {
      toast('Add at least one item', true); return;
    }
    const body = {
      type: formType, customer_name: customerName, customer_mobile: customerMobile,
      customer_address: customerAddress, items: JSON.stringify(items),
      subtotal, discount, tax, total: grandTotal, notes, due_date: dueDate, status,
    };
    try {
      const url = editInvoice ? `/api/invoices/${editInvoice.id}` : '/api/invoices';
      const method = editInvoice ? 'PUT' : 'POST';
      const r = await fetch(url, { method, headers: headers(), body: JSON.stringify(body) });
      if (!r.ok) { const d = await r.json().catch(() => ({})); toast(d.error || 'Failed', true); return; }
      const d = await r.json();
      toast(editInvoice ? 'Invoice updated' : `Invoice ${d.invoice_number} created`);
      setShowForm(false); resetForm(); fetchInvoices();
    } catch (err: any) { toast(err.message, true); }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this draft invoice?')) return;
    const r = await fetch(`/api/invoices/${id}`, { method: 'DELETE', headers: headers() });
    if (r.ok) { toast('Invoice deleted'); fetchInvoices(); }
    else { const d = await r.json().catch(() => ({})); toast(d.error || 'Failed', true); }
  };

  const handleMarkPaid = async (id: number) => {
    if (!window.confirm('Mark this invoice as Paid?')) return;
    const r = await fetch(`/api/invoices/${id}/pay`, { method: 'PUT', headers: headers() });
    if (r.ok) { toast('Invoice marked as paid'); fetchInvoices(); setViewInvoice(null); }
    else { const d = await r.json().catch(() => ({})); toast(d.error || 'Failed', true); }
  };

  const generatePDF = (inv: Invoice) => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const w = 210;
    let y = 15;
    let lineItems: InvoiceItem[] = [];
    try { lineItems = JSON.parse(inv.items); } catch { }

    // Header
    pdf.setFontSize(20); pdf.setFont('helvetica', 'bold');
    pdf.text('KARTAL MART', 14, y);
    pdf.setFontSize(8); pdf.setFont('helvetica', 'normal');
    pdf.text('GROUP OF COMPANIES', 14, y + 5);

    pdf.setFontSize(22); pdf.setFont('helvetica', 'bold');
    pdf.text('INVOICE', w - 14, y, { align: 'right' });
    pdf.setFontSize(10); pdf.setFont('helvetica', 'normal');
    pdf.text(inv.invoice_number, w - 14, y + 6, { align: 'right' });
    y += 18;

    // Status badge
    pdf.setFontSize(9);
    const statusColor = inv.status === 'Paid' ? [16, 185, 129] : inv.status === 'Sent' ? [79, 70, 229] : [156, 163, 175];
    pdf.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
    pdf.text(`Status: ${inv.status}`, w - 14, y, { align: 'right' });
    pdf.setTextColor(0, 0, 0);
    y += 4;

    // Divider
    pdf.setDrawColor(200); pdf.line(14, y, w - 14, y); y += 8;

    // Customer info
    pdf.setFontSize(9); pdf.setFont('helvetica', 'bold'); pdf.text('Bill To:', 14, y);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Date: ${new Date(inv.created_at).toLocaleDateString('en-PK')}`, w - 14, y, { align: 'right' });
    y += 5;
    if (inv.customer_name) { pdf.text(inv.customer_name, 14, y); y += 4; }
    if (inv.customer_mobile) { pdf.text(inv.customer_mobile, 14, y); y += 4; }
    if (inv.customer_address) { pdf.text(inv.customer_address, 14, y); y += 4; }
    if (inv.due_date) { pdf.text(`Due Date: ${inv.due_date}`, w - 14, y - 8, { align: 'right' }); }
    y += 6;

    // Table header
    pdf.setFillColor(245, 245, 245);
    pdf.rect(14, y, w - 28, 7, 'F');
    pdf.setFontSize(8); pdf.setFont('helvetica', 'bold');
    pdf.text('#', 16, y + 5); pdf.text('Description', 24, y + 5);
    pdf.text('Qty', 130, y + 5); pdf.text('Rate', 150, y + 5); pdf.text('Amount', w - 16, y + 5, { align: 'right' });
    y += 10;

    // Table rows
    pdf.setFont('helvetica', 'normal');
    lineItems.forEach((item, i) => {
      pdf.text(String(i + 1), 16, y); pdf.text(item.description || '', 24, y);
      pdf.text(String(item.qty), 130, y); pdf.text(`PKR ${item.rate.toLocaleString()}`, 150, y);
      pdf.text(`PKR ${item.amount.toLocaleString()}`, w - 16, y, { align: 'right' });
      y += 6;
      if (y > 260) { pdf.addPage(); y = 20; }
    });

    // Totals
    y += 4;
    pdf.setDrawColor(200); pdf.line(120, y, w - 14, y); y += 6;
    pdf.setFontSize(9);
    pdf.text('Subtotal:', 130, y); pdf.text(`PKR ${inv.subtotal.toLocaleString()}`, w - 16, y, { align: 'right' }); y += 5;
    if (inv.discount > 0) { pdf.text('Discount:', 130, y); pdf.text(`- PKR ${inv.discount.toLocaleString()}`, w - 16, y, { align: 'right' }); y += 5; }
    if (inv.tax > 0) { pdf.text('Tax:', 130, y); pdf.text(`PKR ${inv.tax.toLocaleString()}`, w - 16, y, { align: 'right' }); y += 5; }
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(11);
    pdf.text('Total:', 130, y); pdf.text(`PKR ${inv.total.toLocaleString()}`, w - 16, y, { align: 'right' });

    // Notes
    if (inv.notes) {
      y += 12; pdf.setFontSize(8); pdf.setFont('helvetica', 'normal');
      pdf.text('Notes:', 14, y); y += 4;
      pdf.text(inv.notes, 14, y, { maxWidth: w - 28 });
    }

    // Footer
    pdf.setFontSize(7); pdf.setTextColor(150);
    pdf.text('Generated by KARTAL MART Management System', w / 2, 285, { align: 'center' });

    pdf.save(`${inv.invoice_number}.pdf`);
  };

  const printInvoice = (inv: Invoice) => {
    let lineItems: InvoiceItem[] = [];
    try { lineItems = JSON.parse(inv.items); } catch { }
    const win = window.open('', '_blank', 'width=800,height=600');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${inv.invoice_number}</title>
<style>*{margin:0;padding:0;box-sizing:border-box;font-family:Arial,sans-serif}body{padding:30px;max-width:800px;margin:auto}
.hdr{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #333;padding-bottom:15px;margin-bottom:20px}
.co{font-size:24px;font-weight:900;letter-spacing:2px}.sub{font-size:9px;letter-spacing:1.5px;color:#666}
.inv-title{font-size:28px;font-weight:900;text-align:right;color:#4F46E5}.inv-num{font-size:11px;color:#666;text-align:right}
.info{display:flex;justify-content:space-between;margin-bottom:20px}.info div{font-size:12px;line-height:1.8}
table{width:100%;border-collapse:collapse;margin:15px 0}th{background:#f5f5f5;text-align:left;padding:8px;font-size:10px;text-transform:uppercase;border-bottom:2px solid #ddd}
td{padding:8px;font-size:11px;border-bottom:1px solid #eee}.totals{text-align:right;margin-top:10px}
.totals div{display:flex;justify-content:flex-end;gap:30px;padding:3px 0;font-size:12px}
.totals .grand{font-size:16px;font-weight:900;border-top:2px solid #333;padding-top:8px;margin-top:5px}
.status{display:inline-block;padding:3px 12px;border-radius:12px;font-size:10px;font-weight:700;color:white;background:${inv.status === 'Paid' ? '#10B981' : inv.status === 'Sent' ? '#4F46E5' : '#9CA3AF'}}
.notes{margin-top:20px;padding:10px;background:#fafafa;border-radius:8px;font-size:11px}
.footer{margin-top:30px;text-align:center;font-size:9px;color:#999}
@media print{body{padding:15px}@page{margin:10mm}}
</style></head><body>
<div class="hdr"><div><div class="co">KARTAL MART</div><div class="sub">GROUP OF COMPANIES</div></div>
<div><div class="inv-title">INVOICE</div><div class="inv-num">${inv.invoice_number}</div><div style="text-align:right;margin-top:5px"><span class="status">${inv.status}</span></div></div></div>
<div class="info"><div><strong>Bill To:</strong><br>${inv.customer_name || '-'}<br>${inv.customer_mobile || ''}<br>${inv.customer_address || ''}</div>
<div style="text-align:right"><strong>Date:</strong> ${new Date(inv.created_at).toLocaleDateString('en-PK')}<br>${inv.due_date ? `<strong>Due:</strong> ${inv.due_date}` : ''}${inv.paid_at ? `<br><strong>Paid:</strong> ${new Date(inv.paid_at).toLocaleDateString('en-PK')}` : ''}</div></div>
<table><thead><tr><th>#</th><th>Description</th><th>Qty</th><th>Rate</th><th style="text-align:right">Amount</th></tr></thead><tbody>
${lineItems.map((item, i) => `<tr><td>${i + 1}</td><td>${item.description}</td><td>${item.qty}</td><td>PKR ${item.rate.toLocaleString()}</td><td style="text-align:right">PKR ${item.amount.toLocaleString()}</td></tr>`).join('')}
</tbody></table>
<div class="totals"><div><span>Subtotal:</span><span>PKR ${inv.subtotal.toLocaleString()}</span></div>
${inv.discount > 0 ? `<div><span>Discount:</span><span>- PKR ${inv.discount.toLocaleString()}</span></div>` : ''}
${inv.tax > 0 ? `<div><span>Tax:</span><span>PKR ${inv.tax.toLocaleString()}</span></div>` : ''}
<div class="grand"><span>Total:</span><span>PKR ${inv.total.toLocaleString()}</span></div></div>
${inv.notes ? `<div class="notes"><strong>Notes:</strong><br>${inv.notes}</div>` : ''}
<div class="footer">Generated by KARTAL MART Management System</div>
<script>window.onload=function(){setTimeout(function(){window.print();},500);}<\/script>
</body></html>`);
    win.document.close();
  };

  const statusBadge = (s: string) => {
    const colors: Record<string, string> = { Draft: 'bg-gray-100 text-gray-700', Sent: 'bg-indigo-100 text-indigo-700', Paid: 'bg-emerald-100 text-emerald-700', Cancelled: 'bg-red-100 text-red-700' };
    return <span className={`text-xs font-bold px-2 py-1 rounded-full ${colors[s] || colors.Draft}`}>{s}</span>;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="text-sm text-gray-500 mt-1">Create and manage invoices for sales and services.</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-sm">
          <Plus className="w-4 h-4 mr-2" /> New Invoice
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search invoices..." className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-indigo-500 focus:border-indigo-500" />
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500">
          <option value="">All Status</option>
          <option>Draft</option><option>Sent</option><option>Paid</option><option>Cancelled</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">Invoice #</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">Total</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400">Loading...</td></tr>
              ) : invoices.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400">No invoices found</td></tr>
              ) : invoices.map(inv => (
                <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-mono font-bold text-indigo-600">{inv.invoice_number}</td>
                  <td className="px-6 py-4"><div className="text-sm font-medium text-gray-900">{inv.customer_name || '-'}</div><div className="text-xs text-gray-500">{inv.customer_mobile}</div></td>
                  <td className="px-6 py-4 text-sm text-gray-500">{new Date(inv.created_at).toLocaleDateString('en-PK')}</td>
                  <td className="px-6 py-4 text-sm font-bold text-gray-900">PKR {inv.total.toLocaleString()}</td>
                  <td className="px-6 py-4">{statusBadge(inv.status)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setViewInvoice(inv)} className="text-indigo-600 hover:text-indigo-800" title="View"><Eye className="w-4 h-4" /></button>
                      {inv.status === 'Draft' && <button onClick={() => openEdit(inv)} className="text-blue-600 hover:text-blue-800" title="Edit"><Edit2 className="w-4 h-4" /></button>}
                      <button onClick={() => generatePDF(inv)} className="text-gray-600 hover:text-gray-800" title="Download PDF"><Download className="w-4 h-4" /></button>
                      <button onClick={() => printInvoice(inv)} className="text-gray-600 hover:text-gray-800" title="Print"><Printer className="w-4 h-4" /></button>
                      {inv.status === 'Draft' && <button onClick={() => handleDelete(inv.id)} className="text-red-500 hover:text-red-700" title="Delete"><Trash2 className="w-4 h-4" /></button>}
                      {inv.status !== 'Paid' && inv.status !== 'Cancelled' && <button onClick={() => handleMarkPaid(inv.id)} className="text-emerald-600 hover:text-emerald-800" title="Mark Paid"><CheckCircle className="w-4 h-4" /></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {total > 20 && (
          <div className="p-4 border-t border-gray-50 flex justify-between items-center">
            <span className="text-sm text-gray-500">{total} invoices</span>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 border rounded-lg text-sm disabled:opacity-50">Prev</button>
              <button disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)} className="px-3 py-1 border rounded-lg text-sm disabled:opacity-50">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* View Invoice Modal */}
      {viewInvoice && (() => {
        let lineItems: InvoiceItem[] = [];
        try { lineItems = JSON.parse(viewInvoice.items); } catch { }
        return (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8 shadow-2xl">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{viewInvoice.invoice_number}</h2>
                  <p className="text-sm text-gray-500 mt-1">{viewInvoice.type} Invoice</p>
                </div>
                <div className="flex items-center gap-3">
                  {statusBadge(viewInvoice.status)}
                  <button onClick={() => setViewInvoice(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase mb-1">Bill To</p>
                  <p className="text-sm font-medium">{viewInvoice.customer_name || '-'}</p>
                  <p className="text-sm text-gray-500">{viewInvoice.customer_mobile}</p>
                  <p className="text-sm text-gray-500">{viewInvoice.customer_address}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-gray-400 uppercase mb-1">Date</p>
                  <p className="text-sm">{new Date(viewInvoice.created_at).toLocaleDateString('en-PK')}</p>
                  {viewInvoice.due_date && <p className="text-sm text-gray-500">Due: {viewInvoice.due_date}</p>}
                  {viewInvoice.paid_at && <p className="text-sm text-emerald-600 font-medium">Paid: {new Date(viewInvoice.paid_at).toLocaleDateString('en-PK')}</p>}
                </div>
              </div>
              <table className="w-full mb-6">
                <thead><tr className="border-b-2 border-gray-200">
                  <th className="text-left text-xs font-bold text-gray-400 uppercase py-2">#</th>
                  <th className="text-left text-xs font-bold text-gray-400 uppercase py-2">Description</th>
                  <th className="text-left text-xs font-bold text-gray-400 uppercase py-2">Qty</th>
                  <th className="text-left text-xs font-bold text-gray-400 uppercase py-2">Rate</th>
                  <th className="text-right text-xs font-bold text-gray-400 uppercase py-2">Amount</th>
                </tr></thead>
                <tbody>{lineItems.map((item, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="py-2 text-sm">{i + 1}</td>
                    <td className="py-2 text-sm">{item.description}</td>
                    <td className="py-2 text-sm">{item.qty}</td>
                    <td className="py-2 text-sm">PKR {item.rate.toLocaleString()}</td>
                    <td className="py-2 text-sm text-right font-medium">PKR {item.amount.toLocaleString()}</td>
                  </tr>
                ))}</tbody>
              </table>
              <div className="flex justify-end">
                <div className="w-64 space-y-1">
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Subtotal</span><span>PKR {viewInvoice.subtotal.toLocaleString()}</span></div>
                  {viewInvoice.discount > 0 && <div className="flex justify-between text-sm"><span className="text-gray-500">Discount</span><span className="text-red-500">- PKR {viewInvoice.discount.toLocaleString()}</span></div>}
                  {viewInvoice.tax > 0 && <div className="flex justify-between text-sm"><span className="text-gray-500">Tax</span><span>PKR {viewInvoice.tax.toLocaleString()}</span></div>}
                  <div className="flex justify-between text-lg font-bold border-t-2 border-gray-900 pt-2 mt-2"><span>Total</span><span>PKR {viewInvoice.total.toLocaleString()}</span></div>
                </div>
              </div>
              {viewInvoice.notes && <div className="mt-4 bg-gray-50 rounded-xl p-4"><p className="text-xs font-bold text-gray-400 uppercase mb-1">Notes</p><p className="text-sm text-gray-600">{viewInvoice.notes}</p></div>}
              <div className="flex gap-3 mt-6">
                <button onClick={() => generatePDF(viewInvoice)} className="flex-1 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2"><Download className="w-4 h-4" /> PDF</button>
                <button onClick={() => printInvoice(viewInvoice)} className="flex-1 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2"><Printer className="w-4 h-4" /> Print</button>
                {viewInvoice.status !== 'Paid' && viewInvoice.status !== 'Cancelled' && (
                  <button onClick={() => handleMarkPaid(viewInvoice.id)} className="flex-1 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 flex items-center justify-center gap-2"><CheckCircle className="w-4 h-4" /> Mark Paid</button>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Create/Edit Invoice Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">{editInvoice ? 'Edit Invoice' : 'New Invoice'}</h2>
              <button onClick={() => { setShowForm(false); resetForm(); }} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={e => handleSubmit(e)} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Type</label>
                  <select value={formType} onChange={e => setFormType(e.target.value)} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-indigo-500 focus:border-indigo-500">
                    <option>Sale</option><option>Service</option><option>Expense</option><option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Due Date</label>
                  <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-indigo-500 focus:border-indigo-500" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Customer Name</label>
                  <input value={customerName} onChange={e => setCustomerName(e.target.value)} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-indigo-500 focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Mobile</label>
                  <input value={customerMobile} onChange={e => setCustomerMobile(e.target.value)} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-indigo-500 focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Address</label>
                  <input value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-indigo-500 focus:border-indigo-500" />
                </div>
              </div>

              {/* Line Items */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Items</label>
                <div className="space-y-2">
                  {items.map((item, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <input placeholder="Description" value={item.description} onChange={e => updateItem(i, 'description', e.target.value)} className="flex-1 border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-indigo-500 focus:border-indigo-500" />
                      <input type="number" placeholder="Qty" value={item.qty || ''} onChange={e => updateItem(i, 'qty', parseFloat(e.target.value) || 0)} className="w-20 border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-indigo-500 focus:border-indigo-500" />
                      <input type="number" placeholder="Rate" value={item.rate || ''} onChange={e => updateItem(i, 'rate', parseFloat(e.target.value) || 0)} className="w-28 border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-indigo-500 focus:border-indigo-500" />
                      <span className="w-28 text-sm font-bold text-right">PKR {item.amount.toLocaleString()}</span>
                      {items.length > 1 && <button type="button" onClick={() => setItems(items.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600"><X className="w-4 h-4" /></button>}
                    </div>
                  ))}
                </div>
                <button type="button" onClick={() => setItems([...items, { ...emptyItem }])} className="mt-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium">+ Add Item</button>
              </div>

              {/* Totals */}
              <div className="flex justify-end">
                <div className="w-72 space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Subtotal</span><span className="font-medium">PKR {subtotal.toLocaleString()}</span></div>
                  <div className="flex justify-between items-center text-sm gap-2">
                    <span className="text-gray-500">Discount</span>
                    <input type="number" value={discount || ''} onChange={e => setDiscount(parseFloat(e.target.value) || 0)} className="w-32 border border-gray-200 rounded-lg p-1.5 text-sm text-right" placeholder="0" />
                  </div>
                  <div className="flex justify-between items-center text-sm gap-2">
                    <span className="text-gray-500">Tax</span>
                    <input type="number" value={tax || ''} onChange={e => setTax(parseFloat(e.target.value) || 0)} className="w-32 border border-gray-200 rounded-lg p-1.5 text-sm text-right" placeholder="0" />
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t-2 border-gray-900 pt-2"><span>Total</span><span>PKR {grandTotal.toLocaleString()}</span></div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Notes</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-indigo-500 focus:border-indigo-500" placeholder="Optional notes..." />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowForm(false); resetForm(); }} className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800">Save as Draft</button>
                <button type="button" onClick={e => handleSubmit(e as any, 'Sent')} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700">Save & Send</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
