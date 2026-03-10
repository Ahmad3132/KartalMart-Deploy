import React, { useState, useEffect } from 'react';
import { Plus, Check, X } from 'lucide-react';

export default function CampaignSetup() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState('Active');

  const fetchCampaigns = () => {
    fetch('/api/campaigns', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('kartal_token')}` }
    })
      .then(async res => {
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to fetch campaigns');
        }
        return res.json().catch(() => []);
      })
      .then(data => setCampaigns(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.error('Campaigns fetch error:', err);
        setCampaigns([]);
      });
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/campaigns', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('kartal_token')}`
      },
      body: JSON.stringify({ name, start_date: startDate, end_date: endDate, status }),
    });
    setName('');
    setStartDate('');
    setEndDate('');
    fetchCampaigns();
  };

  const updateStatus = async (id: number, newStatus: string) => {
    await fetch(`/api/campaigns/${id}/status`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('kartal_token')}`
      },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchCampaigns();
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Campaign Setup</h1>
        <p className="mt-1 text-sm text-gray-500">Create and manage lucky draw campaigns.</p>
      </div>

      <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Create New Campaign</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <div className="sm:col-span-3">
              <label className="block text-sm font-medium text-gray-700">Campaign Name</label>
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
                <option value="Closed">Closed</option>
              </select>
            </div>

            <div className="sm:col-span-3">
              <label className="block text-sm font-medium text-gray-700">Start Date</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-sm font-medium text-gray-700">End Date</label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
              />
            </div>

            <div className="sm:col-span-6">
              <button
                type="submit"
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Campaign
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">All Campaigns</h3>
        </div>
        <ul className="divide-y divide-gray-200">
          {campaigns.map((campaign) => (
            <li key={campaign.id} className="px-4 py-4 sm:px-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-indigo-600 truncate">{campaign.name}</p>
                <p className="mt-1 text-sm text-gray-500">
                  {campaign.start_date} to {campaign.end_date} &middot; Counter: {campaign.counter}
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  campaign.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {campaign.status}
                </span>
                {campaign.status !== 'Active' && (
                  <button
                    onClick={() => updateStatus(campaign.id, 'Active')}
                    className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                  >
                    Activate
                  </button>
                )}
                {campaign.status === 'Active' && (
                  <button
                    onClick={() => updateStatus(campaign.id, 'Closed')}
                    className="text-red-600 hover:text-red-900 text-sm font-medium"
                  >
                    Close
                  </button>
                )}
              </div>
            </li>
          ))}
          {campaigns.length === 0 && (
            <li className="px-4 py-4 sm:px-6 text-sm text-gray-500 text-center">No campaigns found.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
