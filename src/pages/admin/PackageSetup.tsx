import React, { useState, useEffect } from 'react';
import { Plus, Package } from 'lucide-react';

export default function PackageSetup() {
  const [packages, setPackages] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [ticketCount, setTicketCount] = useState('');
  const [status, setStatus] = useState('Active');

  const fetchPackages = () => {
    fetch('/api/packages', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('kartal_token')}` }
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
    await fetch('/api/packages', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('kartal_token')}`
      },
      body: JSON.stringify({ name, amount: parseFloat(amount), ticket_count: parseInt(ticketCount), status }),
    });
    setName('');
    setAmount('');
    setTicketCount('');
    fetchPackages();
  };

  const updateStatus = async (id: number, newStatus: string) => {
    await fetch(`/api/packages/${id}/status`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('kartal_token')}`
      },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchPackages();
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Package Setup</h1>
        <p className="mt-1 text-sm text-gray-500">Manage pricing packages for ticket generation.</p>
      </div>

      <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Create New Package</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <div className="sm:col-span-3">
              <label className="block text-sm font-medium text-gray-700">Package Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
              />
            </div>
            
            <div className="sm:col-span-3">
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            <div className="sm:col-span-3">
              <label className="block text-sm font-medium text-gray-700">Amount (PKR)</label>
              <input
                type="number"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-sm font-medium text-gray-700">Ticket Count</label>
              <input
                type="number"
                required
                value={ticketCount}
                onChange={(e) => setTicketCount(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
              />
            </div>

            <div className="sm:col-span-6">
              <button
                type="submit"
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Package
              </button>
            </div>
          </form>
        </div>
      </div>

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
              <div className="flex items-center space-x-4">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  pkg.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {pkg.status}
                </span>
                {pkg.status !== 'Active' && (
                  <button
                    onClick={() => updateStatus(pkg.id, 'Active')}
                    className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                  >
                    Activate
                  </button>
                )}
                {pkg.status === 'Active' && (
                  <button
                    onClick={() => updateStatus(pkg.id, 'Inactive')}
                    className="text-red-600 hover:text-red-900 text-sm font-medium"
                  >
                    Deactivate
                  </button>
                )}
              </div>
            </li>
          ))}
          {packages.length === 0 && (
            <li className="px-4 py-4 sm:px-6 text-sm text-gray-500 text-center">No packages found.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
