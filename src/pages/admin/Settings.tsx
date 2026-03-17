import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, MessageSquare, Users, Package, Activity,
  Plus, Edit2, Trash2, X, Search, CheckCircle, AlertCircle, Calendar,
  ToggleLeft, ToggleRight, Shield, Globe } from 'lucide-react';

const h = () => ({ 'Authorization': `Bearer ${localStorage.getItem('kartal_token')}` });
const hj = () => ({ ...h(), 'Content-Type': 'application/json' });

export default function Settings() {
  const [tab, setTab] = useState<'profile'|'system'|'inventory'|'marketing'>('profile');
  const [subTab, setSubTab] = useState('');
  const [settings, setSettings] = useState<any>({});
  const [users, setUsers]     = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [roles, setRoles]     = useState<any[]>([]);
  const [smsCampaigns, setSms] = useState<any[]>([]);
  const [me, setMe]           = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch]   = useState('');

  // Modals
  const [userModal, setUserModal]     = useState(false);
  const [pkgModal, setPkgModal]       = useState(false);
  const [campModal, setCampModal]     = useState(false);
  const [roleModal, setRoleModal]     = useState(false);
  const [smsModal, setSmsModal]       = useState(false);
  const [editing, setEditing]         = useState<any>(null);

  useEffect(() => { load(); }, []);

  // Reset sub-tab when main tab changes
  useEffect(() => {
    if (tab === 'system') setSubTab('users');
    else if (tab === 'inventory') setSubTab('packages');
    else setSubTab('');
  }, [tab]);

  async function load() {
    setLoading(true); setError('');
    try {
      const [s,u,p,c,r,sms,me] = await Promise.all([
        fetch('/api/settings',      { headers: h() }).then(r=>r.json()).catch(()=>({})),
        fetch('/api/users',         { headers: h() }).then(r=>r.json()).catch(()=>[]),
        fetch('/api/packages',      { headers: h() }).then(r=>r.json()).catch(()=>[]),
        fetch('/api/campaigns',     { headers: h() }).then(r=>r.json()).catch(()=>[]),
        fetch('/api/roles',         { headers: h() }).then(r=>r.json()).catch(()=>[]),
        fetch('/api/sms-campaigns', { headers: h() }).then(r=>r.json()).catch(()=>[]),
        fetch('/api/users/me',      { headers: h() }).then(r=>r.json()).catch(()=>null),
      ]);
      setSettings(s?.error ? {} : s);
      setUsers(Array.isArray(u) ? u : []);
      setPackages(Array.isArray(p) ? p : []);
      setCampaigns(Array.isArray(c) ? c : []);
      setRoles(Array.isArray(r) ? r : []);
      setSms(Array.isArray(sms) ? sms : []);
      setMe(me);
    } catch(e:any) { setError(e.message); }
    finally { setLoading(false); }
  }

  function toast(msg: string) { setSuccess(msg); setTimeout(()=>setSuccess(''),3000); }

  async function toggle(key: string) {
    const val = settings[key]==='true' ? 'false' : 'true';
    await fetch('/api/settings', { method:'PUT', headers:hj(), body:JSON.stringify({key,value:val}) });
    setSettings((s:any)=>({...s,[key]:val}));
  }

  async function saveProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setSaving(true);
    const fd = new FormData(e.currentTarget);
    await fetch('/api/users/profile', { method:'PUT', headers:h(), body:fd });
    setSaving(false); load(); toast('Profile saved!');
  }

  async function saveUser(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const d:any = Object.fromEntries(fd);
    ['whatsapp_redirect_enabled','whatsapp_integration_enabled','multi_person_logic_enabled',
     'duplicate_tx_enabled','require_all_approvals','whatsapp_redirect_after_scan'].forEach(k=>{
      d[k] = !!fd.get(k);
    });
    const method = editing ? 'PUT' : 'POST';
    const url = editing ? `/api/users/${editing.email}` : '/api/users';
    await fetch(url, { method, headers:hj(), body:JSON.stringify(d) });
    setUserModal(false); setEditing(null); load(); toast('User saved!');
  }

  async function savePkg(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.currentTarget));
    const method = editing ? 'PUT' : 'POST';
    const url = editing ? `/api/packages/${editing.id}/status` : '/api/packages';
    await fetch(url, { method, headers:hj(), body:JSON.stringify(d) });
    setPkgModal(false); setEditing(null); load(); toast('Package saved!');
  }

  async function saveCamp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.currentTarget));
    const method = editing ? 'PUT' : 'POST';
    const url = editing ? `/api/campaigns/${editing.id}/status` : '/api/campaigns';
    await fetch(url, { method, headers:hj(), body:JSON.stringify(d) });
    setCampModal(false); setEditing(null); load(); toast('Campaign saved!');
  }

  async function saveRole(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = fd.get('name') as string;
    const permissions = {
      view_reports: !!fd.get('perm_view_reports'),
      generate_tickets: !!fd.get('perm_generate_tickets'),
      manage_users: !!fd.get('perm_manage_users'),
      manage_settings: !!fd.get('perm_manage_settings'),
    };
    const method = editing ? 'PUT' : 'POST';
    const url = editing ? `/api/roles/${editing.id}` : '/api/roles';
    await fetch(url, { method, headers:hj(), body:JSON.stringify({name, permissions}) });
    setRoleModal(false); setEditing(null); load(); toast('Role saved!');
  }

  async function sendSms(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setSaving(true);
    const fd = new FormData(e.currentTarget);
    await fetch('/api/sms-marketing/send', {
      method:'POST', headers:hj(),
      body:JSON.stringify({ name:fd.get('name'), message:fd.get('message'), criteria:{campaignId:fd.get('campaignId')} })
    });
    setSaving(false); setSmsModal(false); load(); toast('SMS sent!');
  }

  async function del(url: string) {
    await fetch(url, { method:'DELETE', headers:h() });
    load();
  }

  const filteredUsers = users.filter(u=>
    (u.name||'').toLowerCase().includes(search.toLowerCase()) ||
    (u.email||'').toLowerCase().includes(search.toLowerCase()) ||
    (u.role||'').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="flex items-center justify-center min-h-[300px]">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"/>
    </div>
  );

  const TABS = [
    { id:'profile',   label:'My Profile',         icon: Users },
    { id:'system',    label:'System',              icon: Shield },
    { id:'inventory', label:'Inventory',           icon: Package },
    { id:'marketing', label:'Marketing',           icon: MessageSquare },
  ] as const;

  const Toggle = ({ k, label, desc, icon:Icon }: { k:string; label:string; desc:string; icon:any }) => (
    <div className="flex items-center justify-between p-4 border border-gray-100 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
      <div className="flex items-center gap-3">
        <Icon className={`w-5 h-5 ${settings[k]==='true' ? 'text-indigo-500' : 'text-gray-300'}`}/>
        <div>
          <p className="text-sm font-semibold text-gray-900">{label}</p>
          <p className="text-xs text-gray-400">{desc}</p>
        </div>
      </div>
      <button onClick={()=>toggle(k)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings[k]==='true' ? 'bg-indigo-600':'bg-gray-200'}`}>
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${settings[k]==='true' ? 'translate-x-6':'translate-x-1'}`}/>
      </button>
    </div>
  );

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage users, system settings, inventory and marketing.</p>
      </div>

      {/* Toast messages */}
      {error   && <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm"><AlertCircle className="w-4 h-4"/>{error}<button onClick={load} className="ml-auto underline font-bold">Retry</button></div>}
      {success && <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm"><CheckCircle className="w-4 h-4"/>{success}</div>}

      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit flex-wrap">
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab===t.id ? 'bg-white text-indigo-600 shadow-sm':'text-gray-500 hover:text-gray-700'}`}>
            <t.icon className="w-4 h-4"/>{t.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

        {/* ── PROFILE ── */}
        {tab==='profile' && !me && (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"/>
            <p className="text-sm text-gray-500">Loading profile...</p>
            <button onClick={load} className="mt-3 text-xs text-indigo-600 hover:underline">Retry</button>
          </div>
        )}
        {tab==='profile' && me && (
          <div className="p-6 max-w-xl">
            <form onSubmit={saveProfile} className="space-y-5">
              <div className="flex items-center gap-5">
                <div className="relative">
                  <img src={me.profile_picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(me.name||me.email)}&background=random`}
                    className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md" alt=""/>
                  <label className="absolute bottom-0 right-0 bg-indigo-600 p-1.5 rounded-full text-white cursor-pointer hover:bg-indigo-700 shadow">
                    <Edit2 className="w-3.5 h-3.5"/>
                    <input type="file" className="hidden" onChange={async(e)=>{
                      const file=e.target.files?.[0]; if(!file) return;
                      const fd=new FormData(); fd.append('profile_picture',file);
                      await fetch('/api/users/profile',{method:'PUT',headers:h(),body:fd}); load();
                    }}/>
                  </label>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{me.name||'Set your name'}</h3>
                  <p className="text-sm text-gray-400">{me.email}</p>
                  <span className="mt-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">{me.role}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="field-label">Full Name</label><input name="name" defaultValue={me.name} className="field"/></div>
                <div><label className="field-label">Nick Name</label><input name="nick_name" defaultValue={me.nick_name} className="field"/></div>
              </div>
              <div><label className="field-label">Short Bio</label><textarea name="bio" defaultValue={me.bio} rows={3} className="field resize-none" placeholder="Tell us about yourself..."/></div>
              <button type="submit" disabled={saving} className="btn-primary w-full"><Save className="w-4 h-4 mr-2"/>{saving?'Saving...':'Save Profile'}</button>
            </form>
          </div>
        )}

        {/* ── SYSTEM ── */}
        {tab==='system' && (
          <div>
            <div className="flex border-b border-gray-100">
              {['users','roles','global'].map(s=>(
                <button key={s} onClick={()=>setSubTab(s)}
                  className={`px-5 py-3.5 text-sm font-medium border-b-2 transition-all capitalize ${subTab===s?'border-indigo-600 text-indigo-600':'border-transparent text-gray-400 hover:text-gray-700'}`}>
                  {s}
                </button>
              ))}
            </div>

            {subTab==='users' && (
              <div className="p-5">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 gap-3">
                  <h3 className="text-base font-bold text-gray-900">Users ({users.length})</h3>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-56">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"/>
                      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search..." className="field pl-9 py-2"/>
                    </div>
                    <button onClick={()=>{setEditing(null);setUserModal(true);}} className="btn-primary whitespace-nowrap"><Plus className="w-4 h-4 mr-1.5"/>Add User</button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50"><tr>
                      {['User','Nick','Role','Status','Actions'].map(h=>(
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr></thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredUsers.map(u=>(
                        <tr key={u.email} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <img src={u.profile_picture||`https://ui-avatars.com/api/?name=${encodeURIComponent(u.name||u.email)}&background=random`} className="w-8 h-8 rounded-full object-cover" alt=""/>
                              <div><p className="font-semibold text-gray-900 text-xs">{u.name||'—'}</p><p className="text-[10px] text-gray-400">{u.email}</p></div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500">{u.nick_name||'—'}</td>
                          <td className="px-4 py-3 text-xs text-gray-500">{u.role}</td>
                          <td className="px-4 py-3">
                            <button onClick={async()=>{
                              await fetch(`/api/users/${u.email}`,{method:'PUT',headers:hj(),body:JSON.stringify({...u,status:u.status==='Active'?'Disabled':'Active'})});
                              load();
                            }} className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${u.status==='Active'?'bg-green-100 text-green-700':'bg-red-100 text-red-700'}`}>
                              {u.status}
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <button onClick={()=>{setEditing(u);setUserModal(true);}} className="text-indigo-400 hover:text-indigo-600"><Edit2 className="w-4 h-4"/></button>
                              <button onClick={()=>{if(window.confirm(`Delete ${u.email}?`)) del(`/api/users/${u.email}`);}} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4"/></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {subTab==='global' && (
              <div className="p-5 space-y-6">
                <div>
                  <h3 className="text-base font-bold text-gray-900 mb-3">Global Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Toggle k="require_all_approvals" label="Require Admin Approval" desc="Force all transactions to be approved before tickets generate." icon={CheckCircle}/>
                    <Toggle k="multi_person_enabled"  label="Global Multi-Person Logic" desc="Allow multiple participants per transaction." icon={Users}/>
                    <Toggle k="duplicate_tx_enabled"  label="Allow Duplicate TX IDs" desc="Users can reuse the same transaction ID." icon={Activity}/>
                    <Toggle k="whatsapp_enabled"       label="WhatsApp Sharing" desc="Enable WhatsApp ticket sharing buttons." icon={MessageSquare}/>
                    <Toggle k="allow_multiple_active_campaigns" label="Multiple Active Campaigns" desc="Allow more than one campaign to be active simultaneously." icon={Activity}/>
                  </div>
                </div>
                <div className="border-t border-gray-100 pt-5">
                  <h3 className="text-base font-bold text-gray-900 mb-3">Ticket Template Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                    <Toggle k="pdf_watermark_enabled" label="PDF Watermark" desc="Add date/time watermark on ticket PDFs to prevent fraud." icon={Shield}/>
                    <Toggle k="pdf_qr_verification_enabled" label="QR Verification" desc="Generate verifiable QR codes on tickets." icon={Globe}/>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="field-label">Color Mode</label>
                      <select value={settings.pdf_color_mode||'color'} onChange={async(e)=>{
                        await fetch('/api/settings',{method:'PUT',headers:hj(),body:JSON.stringify({key:'pdf_color_mode',value:e.target.value})});
                        setSettings((s:any)=>({...s,pdf_color_mode:e.target.value}));
                      }} className="field">
                        <option value="color">Full Color</option>
                        <option value="bw">Black & White</option>
                      </select>
                    </div>
                    <div>
                      <label className="field-label">Company Phone</label>
                      <input defaultValue={settings.company_phone||''} onBlur={async(e)=>{
                        await fetch('/api/settings',{method:'PUT',headers:hj(),body:JSON.stringify({key:'company_phone',value:e.target.value})});
                        setSettings((s:any)=>({...s,company_phone:e.target.value}));
                      }} className="field" placeholder="+92-XXX-XXXXXXX"/>
                    </div>
                    <div>
                      <label className="field-label">Company Email</label>
                      <input defaultValue={settings.company_email||''} onBlur={async(e)=>{
                        await fetch('/api/settings',{method:'PUT',headers:hj(),body:JSON.stringify({key:'company_email',value:e.target.value})});
                        setSettings((s:any)=>({...s,company_email:e.target.value}));
                      }} className="field" placeholder="info@kartal.com.pk"/>
                    </div>
                    <div>
                      <label className="field-label">Company Website</label>
                      <input defaultValue={settings.company_website||''} onBlur={async(e)=>{
                        await fetch('/api/settings',{method:'PUT',headers:hj(),body:JSON.stringify({key:'company_website',value:e.target.value})});
                        setSettings((s:any)=>({...s,company_website:e.target.value}));
                      }} className="field" placeholder="kartal.com.pk"/>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {subTab==='roles' && (
              <div className="p-5">
                <div className="flex justify-between items-center mb-5">
                  <h3 className="text-base font-bold text-gray-900">Custom Roles</h3>
                  <button onClick={()=>{setEditing(null);setRoleModal(true);}} className="btn-primary"><Plus className="w-4 h-4 mr-1.5"/>Add Role</button>
                </div>
                <div className="space-y-2">
                  {roles.map(r=>{
                    let perms:any={};
                    try { perms = typeof r.permissions==='string' ? JSON.parse(r.permissions) : (r.permissions||{}); } catch{}
                    return (
                      <div key={r.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50">
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{r.name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {Object.entries(perms).filter(([_,v])=>v).map(([k])=>k.replace(/_/g,' ')).join(', ') || 'No permissions'}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={()=>{setEditing(r);setRoleModal(true);}} className="text-indigo-400 hover:text-indigo-600"><Edit2 className="w-4 h-4"/></button>
                          <button onClick={()=>{if(window.confirm(`Delete ${r.name}?`)) del(`/api/roles/${r.id}`);}} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4"/></button>
                        </div>
                      </div>
                    );
                  })}
                  {roles.length===0 && <p className="text-center py-10 text-gray-400 text-sm">No custom roles yet.</p>}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── INVENTORY ── */}
        {tab==='inventory' && (
          <div>
            <div className="flex border-b border-gray-100">
              {['packages','campaigns'].map(s=>(
                <button key={s} onClick={()=>setSubTab(s)}
                  className={`px-5 py-3.5 text-sm font-medium border-b-2 transition-all capitalize ${subTab===s?'border-indigo-600 text-indigo-600':'border-transparent text-gray-400 hover:text-gray-700'}`}>
                  {s}
                </button>
              ))}
            </div>

            {subTab==='packages' && (
              <div className="p-5">
                <div className="flex justify-between items-center mb-5">
                  <h3 className="text-base font-bold text-gray-900">Packages</h3>
                  <button onClick={()=>{setEditing(null);setPkgModal(true);}} className="btn-primary"><Plus className="w-4 h-4 mr-1.5"/>Add Package</button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {packages.map(p=>(
                    <div key={p.id} className="border border-gray-100 rounded-xl p-4 hover:shadow-sm transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-bold text-gray-900">{p.name}</p>
                          <p className="text-xl font-black text-indigo-600 mt-0.5">PKR {Number(p.amount).toLocaleString()}</p>
                          <p className="text-xs text-gray-400">{p.ticket_count} ticket{p.ticket_count!==1?'s':''}</p>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${p.status==='Active'?'bg-green-100 text-green-700':'bg-gray-100 text-gray-500'}`}>{p.status}</span>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button onClick={()=>{setEditing(p);setPkgModal(true);}} className="text-xs text-indigo-600 hover:underline flex items-center gap-1"><Edit2 className="w-3 h-3"/>Edit</button>
                        <button onClick={()=>{if(window.confirm('Delete?')) del(`/api/packages/${p.id}`);}} className="text-xs text-red-500 hover:underline flex items-center gap-1"><Trash2 className="w-3 h-3"/>Delete</button>
                      </div>
                    </div>
                  ))}
                  {packages.length===0 && <p className="col-span-full text-center py-10 text-gray-400 text-sm">No packages yet.</p>}
                </div>
              </div>
            )}

            {subTab==='campaigns' && (
              <div className="p-5">
                <div className="flex justify-between items-center mb-5">
                  <h3 className="text-base font-bold text-gray-900">Campaigns</h3>
                  <button onClick={()=>{setEditing(null);setCampModal(true);}} className="btn-primary"><Plus className="w-4 h-4 mr-1.5"/>Add Campaign</button>
                </div>
                <div className="space-y-2">
                  {campaigns.map(c=>(
                    <div key={c.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50">
                      <div>
                        <p className="font-semibold text-gray-900">{c.name}</p>
                        <p className="text-xs text-gray-400">{c.start_date||''}{c.end_date?` → ${c.end_date}`:''}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.status==='Active'?'bg-green-100 text-green-700':'bg-gray-100 text-gray-500'}`}>{c.status}</span>
                        <button onClick={()=>{setEditing(c);setCampModal(true);}} className="text-indigo-400 hover:text-indigo-600"><Edit2 className="w-4 h-4"/></button>
                        <button onClick={()=>{if(window.confirm('Delete?')) del(`/api/campaigns/${c.id}`);}} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4"/></button>
                      </div>
                    </div>
                  ))}
                  {campaigns.length===0 && <p className="text-center py-10 text-gray-400 text-sm">No campaigns yet.</p>}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── MARKETING ── */}
        {tab==='marketing' && (
          <div className="p-5">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-base font-bold text-gray-900">SMS / Marketing Campaigns</h3>
              <button onClick={()=>{setEditing(null);setSmsModal(true);}} className="btn-primary"><Plus className="w-4 h-4 mr-1.5"/>New Campaign</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {smsCampaigns.map(s=>(
                <div key={s.id} className="p-4 border border-gray-100 rounded-xl hover:shadow-sm transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900">{s.name}</p>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{s.message}</p>
                    </div>
                    <span className={`ml-3 shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${s.status==='Sent'?'bg-green-100 text-green-700':'bg-gray-100 text-gray-500'}`}>{s.status}</span>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-2 flex items-center gap-1"><Calendar className="w-3 h-3"/>{new Date(s.created_at).toLocaleDateString()}</p>
                </div>
              ))}
              {smsCampaigns.length===0 && <p className="col-span-full text-center py-10 text-gray-400 text-sm">No marketing campaigns yet.</p>}
            </div>
          </div>
        )}
      </div>

      {/* ══ MODALS ══ */}

      {userModal && (
        <Modal title={editing?'Edit User':'Add User'} onClose={()=>{setUserModal(false);setEditing(null);}}>
          <form onSubmit={saveUser} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="field-label">Full Name</label><input name="name" required defaultValue={editing?.name} className="field"/></div>
              <div><label className="field-label">Nick Name</label><input name="nick_name" defaultValue={editing?.nick_name} className="field"/></div>
            </div>
            <div><label className="field-label">Email</label><input name="email" type="email" required defaultValue={editing?.email} disabled={!!editing} className="field"/></div>
            {!editing && <div><label className="field-label">Password</label><input name="password" type="password" required className="field"/></div>}
            <div className="grid grid-cols-2 gap-3">
              <div><label className="field-label">Role</label>
                <select name="role" defaultValue={editing?.role||'User'} className="field">
                  <option value="Admin">Admin</option>
                  <option value="User">User</option>
                  <option value="Accountant">Accountant</option>
                  {roles.map(r=><option key={r.id} value={r.name}>{r.name}</option>)}
                </select>
              </div>
              <div><label className="field-label">Status</label>
                <select name="status" defaultValue={editing?.status||'Active'} className="field">
                  <option value="Active">Active</option>
                  <option value="Disabled">Disabled</option>
                </select>
              </div>
            </div>
            <div className="border-t pt-3 space-y-2">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Permissions</p>
              {[
                ['whatsapp_integration_enabled','WhatsApp Integration'],
                ['multi_person_logic_enabled','Multi-Person Transactions'],
                ['duplicate_tx_enabled','Allow Duplicate TX IDs'],
                ['require_all_approvals','Require All Approvals'],
                ['whatsapp_redirect_after_scan','WhatsApp Redirect After Scan'],
              ].map(([id,label])=>(
                <label key={id} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name={id} id={id} defaultChecked={editing ? editing[id]===1 : true} className="h-4 w-4 rounded text-indigo-600"/>
                  <span className="text-sm text-gray-700">{label}</span>
                </label>
              ))}
            </div>
            <button type="submit" className="btn-primary w-full mt-2">Save User</button>
          </form>
        </Modal>
      )}

      {roleModal && (
        <Modal title={editing?'Edit Role':'Add Role'} onClose={()=>{setRoleModal(false);setEditing(null);}}>
          <form onSubmit={saveRole} className="space-y-4">
            <div><label className="field-label">Role Name</label><input name="name" required defaultValue={editing?.name} className="field" placeholder="e.g. Report Viewer"/></div>
            <div className="space-y-2">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Permissions</p>
              {['view_reports','generate_tickets','manage_users','manage_settings'].map(p=>{
                let perms:any={};
                try { perms = (editing && typeof editing.permissions==='string') ? JSON.parse(editing.permissions) : (editing?.permissions||{}); } catch{}
                return (
                  <label key={p} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" name={`perm_${p}`} id={`perm_${p}`} defaultChecked={perms[p]} className="h-4 w-4 rounded text-indigo-600"/>
                    <span className="text-sm text-gray-700 capitalize">{p.replace(/_/g,' ')}</span>
                  </label>
                );
              })}
            </div>
            <button type="submit" className="btn-primary w-full mt-2">Save Role</button>
          </form>
        </Modal>
      )}

      {smsModal && (
        <Modal title="New SMS Campaign" onClose={()=>setSmsModal(false)}>
          <form onSubmit={sendSms} className="space-y-4">
            <div><label className="field-label">Campaign Name</label><input name="name" required className="field" placeholder="e.g. Eid Mubarak Promo"/></div>
            <div><label className="field-label">Target Campaign</label>
              <select name="campaignId" className="field">
                <option value="">All Customers</option>
                {campaigns.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div><label className="field-label">Message</label><textarea name="message" required rows={4} className="field resize-none" placeholder="Enter your SMS message..."/></div>
            <button type="submit" disabled={saving} className="btn-primary w-full">{saving?'Sending...':'Send Bulk SMS'}</button>
          </form>
        </Modal>
      )}

      {pkgModal && (
        <Modal title={editing?'Edit Package':'Add Package'} onClose={()=>{setPkgModal(false);setEditing(null);}}>
          <form onSubmit={savePkg} className="space-y-4">
            <div><label className="field-label">Name</label><input name="name" required defaultValue={editing?.name} className="field"/></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="field-label">Amount (PKR)</label><input name="amount" type="number" required defaultValue={editing?.amount} className="field"/></div>
              <div><label className="field-label">Tickets</label><input name="ticket_count" type="number" required defaultValue={editing?.ticket_count} className="field"/></div>
            </div>
            <div><label className="field-label">Status</label>
              <select name="status" defaultValue={editing?.status||'Active'} className="field">
                <option value="Active">Active</option>
                <option value="Disabled">Disabled</option>
              </select>
            </div>
            <button type="submit" className="btn-primary w-full">Save Package</button>
          </form>
        </Modal>
      )}

      {campModal && (
        <Modal title={editing?'Edit Campaign':'Add Campaign'} onClose={()=>{setCampModal(false);setEditing(null);}}>
          <form onSubmit={saveCamp} className="space-y-4">
            <div><label className="field-label">Campaign Name</label><input name="name" required defaultValue={editing?.name} className="field"/></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="field-label">Start Date</label><input name="start_date" type="date" defaultValue={editing?.start_date} className="field"/></div>
              <div><label className="field-label">End Date</label><input name="end_date" type="date" defaultValue={editing?.end_date} className="field"/></div>
            </div>
            <div><label className="field-label">Status</label>
              <select name="status" defaultValue={editing?.status||'Active'} className="field">
                <option value="Active">Active</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
            <button type="submit" className="btn-primary w-full">Save Campaign</button>
          </form>
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, children, onClose }: { title:string; children:React.ReactNode; onClose:()=>void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto" onClick={e=>e.stopPropagation()}>
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5"/></button>
        </div>
        {children}
      </div>
    </div>
  );
}
