import React, { useState, useEffect } from 'react';
import { Plus, Package, Edit2, Trash2, X } from 'lucide-react';

export default function PackageSetup() {
  const [packages, setPackages] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [ticketCount, setTicketCount] = useState('');
  const [status, setStatus] = useState('Active');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; err?: boolean } | null>(null);

  // Edit modal state
  const [editModal, setEditModal] = useState(false);
  const [editPkg, setEditPkg] = useState<any>(null);
  const [editName, setEditName] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editTicketCount, setEditTicketCount] = useState('');
  const [editStatus, setEditStatus] = useState('Active');
  const [editSubmitting, setEditSubmitting] = useState(false);

  const showToast = (msg: string, err = false) => {
    setToast({ msg, err });
    setTimeout(() => setToast(null), 3000);
  };

  const token = localStorage.getItem('kartal_token');

  const fetchPackages = () => {
    fetch('/api/packages', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(async res => {
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to fetch packages');
        }
        return res.json().catch(() => []);
      })
      .then(data => setPackages(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.error('Packages fetch error:', err);
        setPackages([]);
      });
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name, amount: parseFloat(amount), ticket_count: parseInt(ticketCount), status }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        showToast(d.error || 'Failed to create package', true);
        return;
      }
      showToast('Package created successfully');
      setName(''); setAmount(''); setTicketCount('');
      fetchPackages();
    } catch { showToast('Network error', true); }
    finally { setSubmitting(false); }
  };

  const updateStatus = async (id: number, newStatus: string) => {
    try {
      const res = await fetch(`/api/packages/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) { showToast('Failed to update status', true); return; }
      showToast(`Package ${newStatus === 'Active' ? 'activated' : 'deactivated'}`);
      fetchPackages();
    } catch { showToast('Network error', true); }
  };

  const handleDelete = async (pkg: any) => {
    if (!window.confirm(`Delete package "${pkg.name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/packages/${pkg.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) { showToast('Failed to delete package', true); return; }
      showToast('Package deleted');
      fetchPackages();
    } catch { showToast('Network error', true); }
  };

  const openEdit = (pkg: any) => {
    setEditPkg(pkg);
    setEditName(pkg.name);
    setEditAmount(String(pkg.amount));
    setEditTicketCount(String(pkg.ticket_count));
    setEditStatus(pkg.status);
    setEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editSubmitting || !editPkg) return;
    setEditSubmitting(true);
    try {
      const res = await fetch(`/api/packages/${editPkg.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          name: editName,
          amount: parseFloat(editAmount),
          ticket_count: parseInt(editTicketCount),
          status: editStatus,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        showToast(d.error || 'Failed to update package', true);
        return;
      }
      showToast('Package updated successfully');
      setEditModal(false);
      setEditPkg(null);
      fetchPackages();
    } catch { showToast('Network error', true); }
    finally { setEditSubmitting(false); }
  };

  return (
    <div className="space-y-8">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium ${toast.err ? 'bg-red-600' : 'bg-green-600'}`}>
          {toast.msg}
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Package Setup</h1>
        <p className="mt-1 text-sm text-gray-500">Manage pricing packages for ticket generation.</p>
      </div>

      {/* Create Form */}
      <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Create New Package</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <div className="sm:col-span-3">
              <label className="block text-sm font-medium text-gray-700">Package Name</label>
              <input type="text" required value={name} onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border" />
            </div>
            <div className="sm:col-span-3">
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border">
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            <div className="sm:col-span-3">
              <label className="block text-sm font-medium text-gray-700">Amount (PKR)</label>
              <input type="number" step="0.01" required value={amount} onChange={(e) => setAmount(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border" />
            </div>
            <div className="sm:col-span-3">
              <label className="block text-sm font-medium text-gray-700">Ticket Count</label>
              <input type="number" required value={ticketCount} onChange={(e) => setTicketCount(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border" />
            </div>
            <div className="sm:col-span-6">
              <button type="submit" disabled={submitting}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50">
                <Plus className="w-5 h-5 mr-2" />
                {submitting ? 'Creating...' : 'Create Package'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Package List */}
      <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">All Packages</h3>
        </div>
        <ul className="divide-y divide-gray-200">
          {packages.map((pkg) => (
            <li key={pkg.id} className="px-4 py-4 sm:px-6 flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Package className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-indigo-600 truncate">{pkg.name}</p>
                  <p className="mt-1 text-sm text-gray-500">
                    Amount: PKR {pkg.amount} &middot; Tickets: {pkg.ticket_count}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  pkg.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {pkg.status}
                </span>
                <button onClick={() => openEdit(pkg)} className="text-indigo-600 hover:text-indigo-900 p-1" title="Edit">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(pkg)} className="text-red-600 hover:text-red-900 p-1" title="Delete">
                  <Trash2 className="w-4 h-4" />
                </button>
                {pkg.status !== 'Active' ? (
                  <button onClick={() => updateStatus(pkg.id, 'Active')}
                    className="text-green-600 hover:text-green-900 text-sm font-medium">Activate</button>
                ) : (
                  <button onClick={() => updateStatus(pkg.id, 'Inactive')}
                    className="text-red-600 hover:text-red-900 text-sm font-medium">Deactivate</button>
                )}
              </div>
            </li>
          ))}
          {packages.length === 0 && (
            <li className="px-4 py-4 sm:px-6 text-sm text-gray-500 text-center">No packages found.</li>
          )}
        </ul>
      </div>

      {/* Edit Modal */}
      {editModal && editPkg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">Edit Package</h3>
              <button onClick={() => setEditModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Package Name</label>
                <input type="text" required value={editName} onChange={(e) => setEditName(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount (PKR)</label>
                  <input type="number" step="0.01" required value={editAmount} onChange={(e) => setEditAmount(e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ticket Count</label>
                  <input type="number" required value={editTicketCount} onChange={(e) => setEditTicketCount(e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border">
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => setEditModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={editSubmitting}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
                  {editSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
