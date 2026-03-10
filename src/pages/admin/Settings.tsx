import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, MessageSquare, Users, Package, Activity, Plus, Edit2, Trash2, X, CreditCard, Search, CheckCircle, AlertCircle, Calendar } from 'lucide-react';

export default function Settings() {
  const [activeTab, setActiveTab] = useState<'profile' | 'system' | 'inventory' | 'marketing'>('profile');
  const [subTab, setSubTab] = useState<'users' | 'roles' | 'global' | 'packages' | 'campaigns'>('users');
  const [settings, setSettings] = useState<any>({});
  const [users, setUsers] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [smsCampaigns, setSmsCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Modal states
  const [showUserModal, setShowUserModal] = useState(false);
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showSmsModal, setShowSmsModal] = useState(false);
  
  const [editingItem, setEditingItem] = useState<any>(null);

  const [userSearch, setUserSearch] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = { 'Authorization': `Bearer ${localStorage.getItem('kartal_token')}` };
      const [sRes, uRes, pRes, cRes, rRes, smsRes, meRes] = await Promise.all([
        fetch('/api/settings', { headers }),
        fetch('/api/users', { headers }),
        fetch('/api/packages', { headers }),
        fetch('/api/campaigns', { headers }),
        fetch('/api/roles', { headers }),
        fetch('/api/sms-campaigns', { headers }),
        fetch('/api/users/me', { headers })
      ]);
      
      const settingsData = await sRes.json().catch(() => ({}));
      const usersData = await uRes.json().catch(() => []);
      const packagesData = await pRes.json().catch(() => []);
      const campaignsData = await cRes.json().catch(() => []);
      const rolesData = await rRes.json().catch(() => []);
      const smsData = await smsRes.json().catch(() => []);
      const meData = await meRes.json().catch(() => null);

      setSettings(settingsData && !settingsData.error ? settingsData : {});
      setUsers(Array.isArray(usersData) ? usersData : []);
      setPackages(Array.isArray(packagesData) ? packagesData : []);
      setCampaigns(Array.isArray(campaignsData) ? campaignsData : []);
      setRoles(Array.isArray(rolesData) ? rolesData : []);
      setSmsCampaigns(Array.isArray(smsData) ? smsData : []);
      setCurrentUser(meData);
    } catch (err: any) {
      console.error('Failed to fetch settings data:', err);
      setError(err.message || 'Failed to load settings data.');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setSaving(true);
    try {
      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('kartal_token')}`
        },
        body: formData,
      });
      if (!res.ok) throw new Error('Failed to update profile');
      fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const filteredUsers = users.filter(u => 
    (u.name || '').toLowerCase().includes(userSearch.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(userSearch.toLowerCase()) ||
    (u.role || '').toLowerCase().includes(userSearch.toLowerCase())
  );

  const handleToggle = async (key: string) => {
    setSaving(true);
    const newValue = settings[key] === 'true' ? 'false' : 'true';
    try {
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('kartal_token')}`
        },
        body: JSON.stringify({ key, value: newValue }),
      });
      setSettings({ ...settings, [key]: newValue });
    } finally {
      setSaving(false);
    }
  };

  const handleUserSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: any = Object.fromEntries(formData);
    
    // Handle checkboxes
    data.whatsapp_redirect_enabled = !!formData.get('whatsapp_redirect_enabled');
    data.whatsapp_integration_enabled = !!formData.get('whatsapp_integration_enabled');
    data.multi_person_logic_enabled = !!formData.get('multi_person_logic_enabled');
    data.duplicate_tx_enabled = !!formData.get('duplicate_tx_enabled');
    data.require_all_approvals = !!formData.get('require_all_approvals');
    data.whatsapp_redirect_after_scan = !!formData.get('whatsapp_redirect_after_scan');
    
    const method = editingItem ? 'PUT' : 'POST';
    const url = editingItem ? `/api/users/${editingItem.email}` : '/api/users';
    
    await fetch(url, {
      method,
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('kartal_token')}`
      },
      body: JSON.stringify(data),
    });
    
    setShowUserModal(false);
    setEditingItem(null);
    fetchData();
  };

  const handlePackageSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData);
    
    const method = editingItem ? 'PUT' : 'POST';
    const url = editingItem ? `/api/packages/${editingItem.id}/status` : '/api/packages';
    
    await fetch(url, {
      method,
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('kartal_token')}`
      },
      body: JSON.stringify(data),
    });
    
    setShowPackageModal(false);
    setEditingItem(null);
    fetchData();
  };

  const handleCampaignSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData);
    
    const method = editingItem ? 'PUT' : 'POST';
    const url = editingItem ? `/api/campaigns/${editingItem.id}/status` : '/api/campaigns';
    
    await fetch(url, {
      method,
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('kartal_token')}`
      },
      body: JSON.stringify(data),
    });
    
    setShowCampaignModal(false);
    setEditingItem(null);
    fetchData();
  };

  const handleRoleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const permissions = {
      view_reports: !!formData.get('perm_view_reports'),
      generate_tickets: !!formData.get('perm_generate_tickets'),
      manage_users: !!formData.get('perm_manage_users'),
      manage_settings: !!formData.get('perm_manage_settings'),
    };
    
    const method = editingItem ? 'PUT' : 'POST';
    const url = editingItem ? `/api/roles/${editingItem.id}` : '/api/roles';
    
    await fetch(url, {
      method,
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('kartal_token')}`
      },
      body: JSON.stringify({ name, permissions }),
    });
    
    setShowRoleModal(false);
    setEditingItem(null);
    fetchData();
  };

  const handleSmsSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name'),
      message: formData.get('message'),
      criteria: {
        campaignId: formData.get('campaignId')
      }
    };
    
    setSaving(true);
    try {
      const res = await fetch('/api/sms-marketing/send', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('kartal_token')}`
        },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setShowSmsModal(false);
        fetchData();
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8">Loading settings...</div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Management</h1>
          <p className="mt-1 text-sm text-gray-500">Configure users, packages, campaigns and global settings.</p>
        </div>
      </div>

      <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl w-fit">
        {[
          { id: 'profile', name: 'My Profile', icon: Users },
          { id: 'system', name: 'System Management', icon: SettingsIcon },
          { id: 'inventory', name: 'Inventory', icon: Package },
          { id: 'marketing', name: 'Marketing', icon: MessageSquare },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.name}</span>
          </button>
        ))}
      </div>

      <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
        {error && (
          <div className="p-4 bg-red-50 border-b border-red-100 flex items-center text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 mr-2" />
            {error}
            <button onClick={fetchData} className="ml-auto underline font-bold">Retry</button>
          </div>
        )}

        {activeTab === 'profile' && currentUser && (
          <div className="p-6 max-w-2xl">
            <form onSubmit={handleProfileSubmit} className="space-y-6">
              <div className="flex items-center space-x-6">
                <div className="relative">
                  <img 
                    src={currentUser.profile_picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name || currentUser.email)}&background=random`} 
                    alt="Profile" 
                    className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                  />
                  <label className="absolute bottom-0 right-0 bg-indigo-600 p-2 rounded-full text-white cursor-pointer hover:bg-indigo-700 shadow-md">
                    <Edit2 className="w-4 h-4" />
                    <input type="file" className="hidden" onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = async () => {
                          const base64 = reader.result as string;
                          await fetch('/api/users/profile', {
                            method: 'PUT',
                            headers: { 
                              'Content-Type': 'application/json',
                              'Authorization': `Bearer ${localStorage.getItem('kartal_token')}`
                            },
                            body: JSON.stringify({ profile_picture: base64 }),
                          });
                          fetchData();
                        };
                        reader.readAsDataURL(file);
                      }
                    }} />
                  </label>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{currentUser.name || 'Set your name'}</h3>
                  <p className="text-sm text-gray-500">{currentUser.email}</p>
                  <span className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                    {currentUser.role}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Full Name</label>
                  <input name="name" defaultValue={currentUser.name} className="mt-1 block w-full border rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nick Name</label>
                  <input name="nick_name" defaultValue={currentUser.nick_name} className="mt-1 block w-full border rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Short Bio</label>
                <textarea name="bio" defaultValue={currentUser.bio} rows={3} className="mt-1 block w-full border rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Tell us about yourself..." />
              </div>

              <div className="flex justify-end">
                <button type="submit" disabled={saving} className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'system' && (
          <div className="p-0">
            <div className="flex border-b border-gray-200">
              {['users', 'roles', 'global'].map(st => (
                <button
                  key={st}
                  onClick={() => setSubTab(st as any)}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-all ${
                    subTab === st ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {st.charAt(0).toUpperCase() + st.slice(1)}
                </button>
              ))}
            </div>
            
            {subTab === 'users' && (
              <div className="p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                  <h3 className="text-lg font-bold text-gray-900">Manage Users</h3>
                  <div className="flex w-full sm:w-auto space-x-2">
                    <div className="relative flex-1 sm:w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search users..."
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                      />
                    </div>
                    <button 
                      onClick={() => { setEditingItem(null); setShowUserModal(true); }}
                      className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 whitespace-nowrap"
                    >
                      <Plus className="w-4 h-4 mr-2" /> Add User
                    </button>
                  </div>
                </div>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nick Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {Array.isArray(filteredUsers) && filteredUsers.map(u => (
                      <tr key={u.email}>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <img src={u.profile_picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || u.email)}&background=random`} className="w-8 h-8 rounded-full" alt="" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">{u.name || 'No Name'}</div>
                              <div className="text-xs text-gray-500">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">{u.nick_name || '-'}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{u.role}</td>
                        <td className="px-6 py-4">
                          <button
                            onClick={async () => {
                              const newStatus = u.status === 'Active' ? 'Disabled' : 'Active';
                              await fetch(`/api/users/${u.email}`, {
                                method: 'PUT',
                                headers: { 
                                  'Content-Type': 'application/json',
                                  'Authorization': `Bearer ${localStorage.getItem('kartal_token')}`
                                },
                                body: JSON.stringify({ ...u, status: newStatus }),
                              });
                              fetchData();
                            }}
                            className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              u.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {u.status}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button onClick={() => { setEditingItem(u); setShowUserModal(true); }} className="text-indigo-600 hover:text-indigo-900"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={async () => { if(window.confirm(`Are you sure?`)) { await fetch(`/api/users/${u.email}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${localStorage.getItem('kartal_token')}` } }); fetchData(); } }} className="text-red-600 hover:text-red-900"><Trash2 className="w-4 h-4" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {subTab === 'global' && (
              <div className="p-6 space-y-6">
                <h3 className="text-lg font-bold text-gray-900">Global System Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center justify-between p-4 border rounded-xl bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className={`w-5 h-5 ${settings.require_all_approvals === 'true' ? 'text-green-500' : 'text-gray-400'}`} />
                      <div>
                        <p className="text-sm font-bold text-gray-900">Require Admin Approval</p>
                        <p className="text-xs text-gray-500">Force all transactions to be approved by admin.</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleToggle('require_all_approvals')}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.require_all_approvals === 'true' ? 'bg-indigo-600' : 'bg-gray-200'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.require_all_approvals === 'true' ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-xl bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <Users className={`w-5 h-5 ${settings.multi_person_enabled === 'true' ? 'text-indigo-500' : 'text-gray-400'}`} />
                      <div>
                        <p className="text-sm font-bold text-gray-900">Global Multi-Person Logic</p>
                        <p className="text-xs text-gray-500">Enable/Disable multi-person tickets globally.</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleToggle('multi_person_enabled')}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.multi_person_enabled === 'true' ? 'bg-indigo-600' : 'bg-gray-200'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.multi_person_enabled === 'true' ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-xl bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <Activity className={`w-5 h-5 ${settings.duplicate_tx_enabled === 'true' ? 'text-orange-500' : 'text-gray-400'}`} />
                      <div>
                        <p className="text-sm font-bold text-gray-900">Allow Duplicate Tx IDs</p>
                        <p className="text-xs text-gray-500">Allow users to reuse transaction IDs.</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleToggle('duplicate_tx_enabled')}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.duplicate_tx_enabled === 'true' ? 'bg-indigo-600' : 'bg-gray-200'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.duplicate_tx_enabled === 'true' ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                </div>
              </div>
            )}
            {subTab === 'roles' && (
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-gray-900">Custom Roles</h3>
                  <button 
                    onClick={() => { setEditingItem(null); setShowRoleModal(true); }}
                    className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
                  >
                    <Plus className="w-4 h-4 mr-2" /> Add Role
                  </button>
                </div>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Permissions</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {roles.map(r => {
                      let perms = {};
                      try {
                        perms = typeof r.permissions === 'string' ? JSON.parse(r.permissions) : (r.permissions || {});
                      } catch (e) {
                        console.error('Failed to parse permissions for role:', r.name, e);
                      }
                      return (
                        <tr key={r.id}>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">{r.name}</td>
                          <td className="px-6 py-4 text-xs text-gray-500">
                            {Object.entries(perms).filter(([_, v]) => v).map(([k]) => k.replace('_', ' ')).join(', ') || 'None'}
                          </td>
                          <td className="px-6 py-4 text-right space-x-2">
                            <button onClick={() => { setEditingItem(r); setShowRoleModal(true); }} className="text-indigo-600 hover:text-indigo-900"><Edit2 className="w-4 h-4" /></button>
                            <button onClick={async () => { if(window.confirm(`Delete role ${r.name}?`)) { await fetch(`/api/roles/${r.id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${localStorage.getItem('kartal_token')}` } }); fetchData(); } }} className="text-red-600 hover:text-red-900"><Trash2 className="w-4 h-4" /></button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="p-0">
            <div className="flex border-b border-gray-200">
              {['packages', 'campaigns'].map(st => (
                <button
                  key={st}
                  onClick={() => setSubTab(st as any)}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-all ${
                    subTab === st ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {st.charAt(0).toUpperCase() + st.slice(1)}
                </button>
              ))}
            </div>
            
            {subTab === 'packages' && (
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-gray-900">Manage Packages</h3>
                  <button 
                    onClick={() => { setEditingItem(null); setShowPackageModal(true); }}
                    className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
                  >
                    <Plus className="w-4 h-4 mr-2" /> Add Package
                  </button>
                </div>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tickets</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {Array.isArray(packages) && packages.map(p => (
                      <tr key={p.id}>
                        <td className="px-6 py-4 text-sm text-gray-900">{p.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">PKR {p.amount}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{p.ticket_count}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{p.status}</td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button onClick={() => { setEditingItem(p); setShowPackageModal(true); }} className="text-indigo-600 hover:text-indigo-900"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={async () => { if(window.confirm(`Delete package?`)) { await fetch(`/api/packages/${p.id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${localStorage.getItem('kartal_token')}` } }); fetchData(); } }} className="text-red-600 hover:text-red-900"><Trash2 className="w-4 h-4" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {subTab === 'campaigns' && (
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-gray-900">Manage Campaigns</h3>
                  <button 
                    onClick={() => { setEditingItem(null); setShowCampaignModal(true); }}
                    className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
                  >
                    <Plus className="w-4 h-4 mr-2" /> Add Campaign
                  </button>
                </div>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {Array.isArray(campaigns) && campaigns.map(c => (
                      <tr key={c.id}>
                        <td className="px-6 py-4 text-sm text-gray-900">{c.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{c.status}</td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button onClick={() => { setEditingItem(c); setShowCampaignModal(true); }} className="text-indigo-600 hover:text-indigo-900"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={async () => { if(window.confirm(`Delete campaign?`)) { await fetch(`/api/campaigns/${c.id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${localStorage.getItem('kartal_token')}` } }); fetchData(); } }} className="text-red-600 hover:text-red-900"><Trash2 className="w-4 h-4" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'marketing' && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900">Marketing Campaigns</h3>
              <button 
                onClick={() => { setEditingItem(null); setShowSmsModal(true); }}
                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
              >
                <Plus className="w-4 h-4 mr-2" /> New Campaign
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {smsCampaigns.map(sms => (
                <div key={sms.id} className="p-4 border rounded-xl bg-gray-50 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-gray-900">{sms.name}</h4>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{sms.message}</p>
                      <div className="flex items-center gap-4 mt-3">
                        <span className="text-[10px] text-gray-400 flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {new Date(sms.created_at).toLocaleDateString()}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          sms.status === 'Sent' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {sms.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {smsCampaigns.length === 0 && (
                <div className="col-span-full text-center py-12 text-gray-500">No marketing campaigns yet.</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <form onSubmit={handleUserSubmit} className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold">{editingItem ? 'Edit User' : 'Add User'}</h3>
              <button type="button" onClick={() => setShowUserModal(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Full Name</label>
                  <input name="name" required defaultValue={editingItem?.name} className="mt-1 block w-full border rounded-md p-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nick Name</label>
                  <input name="nick_name" required defaultValue={editingItem?.nick_name} className="mt-1 block w-full border rounded-md p-2" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input name="email" type="email" required defaultValue={editingItem?.email} disabled={!!editingItem} className="mt-1 block w-full border rounded-md p-2" />
              </div>
              {!editingItem && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <input name="password" type="password" required className="mt-1 block w-full border rounded-md p-2" />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700">Role</label>
                <select name="role" defaultValue={editingItem?.role || 'User'} className="mt-1 block w-full border rounded-md p-2">
                  <option value="Admin">Admin</option>
                  <option value="User">User</option>
                  {roles.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select name="status" defaultValue={editingItem?.status || 'Active'} className="mt-1 block w-full border rounded-md p-2">
                  <option value="Active">Active</option>
                  <option value="Disabled">Disabled</option>
                </select>
              </div>
              
              <div className="border-t pt-4 space-y-3">
                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Individual Permissions</h4>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { id: 'whatsapp_integration_enabled', label: 'WhatsApp Integration' },
                    { id: 'multi_person_logic_enabled', label: 'Multi-Person Logic' },
                    { id: 'duplicate_tx_enabled', label: 'Duplicate Transaction IDs' },
                    { id: 'require_all_approvals', label: 'Require All Approvals' },
                    { id: 'whatsapp_redirect_after_scan', label: 'Enable WhatsApp Redirect after Scan' },
                  ].map(opt => (
                    <div key={opt.id} className="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        name={opt.id} 
                        id={opt.id}
                        defaultChecked={editingItem ? editingItem[opt.id] === 1 : true}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" 
                      />
                      <label htmlFor={opt.id} className="text-sm text-gray-700">{opt.label}</label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded-lg font-medium">Save User</button>
          </form>
        </div>
      )}

      {showRoleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <form onSubmit={handleRoleSubmit} className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold">{editingItem ? 'Edit Role' : 'Add Custom Role'}</h3>
              <button type="button" onClick={() => setShowRoleModal(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Role Name</label>
                <input name="name" required defaultValue={editingItem?.name} className="mt-1 block w-full border rounded-md p-2" placeholder="e.g. Report Viewer" />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Permissions</label>
                {['view_reports', 'generate_tickets', 'manage_users', 'manage_settings'].map(p => {
                  let perms: any = {};
                  try {
                    perms = (editingItem && typeof editingItem.permissions === 'string') 
                      ? JSON.parse(editingItem.permissions) 
                      : (editingItem?.permissions || {});
                  } catch (e) {
                    console.error('Failed to parse permissions in modal:', e);
                  }
                  return (
                    <div key={p} className="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        name={`perm_${p}`} 
                        id={`perm_${p}`}
                        defaultChecked={perms[p]}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" 
                      />
                      <label htmlFor={`perm_${p}`} className="text-sm text-gray-700 uppercase">{p.replace('_', ' ')}</label>
                    </div>
                  );
                })}
              </div>
            </div>
            <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded-lg font-medium">Save Role</button>
          </form>
        </div>
      )}

      {showSmsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <form onSubmit={handleSmsSubmit} className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold">New SMS Marketing Campaign</h3>
              <button type="button" onClick={() => setShowSmsModal(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Campaign Name</label>
                <input name="name" required className="mt-1 block w-full border rounded-md p-2" placeholder="e.g. Eid Mubarak Promo" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Target Campaign</label>
                <select name="campaignId" className="mt-1 block w-full border rounded-md p-2">
                  <option value="">All Customers</option>
                  {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Message</label>
                <textarea name="message" required rows={4} className="mt-1 block w-full border rounded-md p-2" placeholder="Enter your SMS message here..."></textarea>
              </div>
            </div>
            <button type="submit" disabled={saving} className="w-full bg-indigo-600 text-white py-2 rounded-lg font-medium disabled:bg-gray-400">
              {saving ? 'Sending...' : 'Send Bulk SMS'}
            </button>
          </form>
        </div>
      )}

      {showPackageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <form onSubmit={handlePackageSubmit} className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold">{editingItem ? 'Edit Package' : 'Add Package'}</h3>
              <button type="button" onClick={() => setShowPackageModal(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input name="name" required defaultValue={editingItem?.name} className="mt-1 block w-full border rounded-md p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Amount (PKR)</label>
                <input name="amount" type="number" required defaultValue={editingItem?.amount} className="mt-1 block w-full border rounded-md p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Ticket Count</label>
                <input name="ticket_count" type="number" required defaultValue={editingItem?.ticket_count} className="mt-1 block w-full border rounded-md p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select name="status" defaultValue={editingItem?.status || 'Active'} className="mt-1 block w-full border rounded-md p-2">
                  <option value="Active">Active</option>
                  <option value="Disabled">Disabled</option>
                </select>
              </div>
            </div>
            <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded-lg font-medium">Save Package</button>
          </form>
        </div>
      )}

      {showCampaignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <form onSubmit={handleCampaignSubmit} className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold">{editingItem ? 'Edit Campaign' : 'Add Campaign'}</h3>
              <button type="button" onClick={() => setShowCampaignModal(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input name="name" required defaultValue={editingItem?.name} className="mt-1 block w-full border rounded-md p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select name="status" defaultValue={editingItem?.status || 'Active'} className="mt-1 block w-full border rounded-md p-2">
                  <option value="Active">Active</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
            </div>
            <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded-lg font-medium">Save Campaign</button>
          </form>
        </div>
      )}
    </div>
  );
}
