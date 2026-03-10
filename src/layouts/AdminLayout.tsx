import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/admin', label: 'Dashboard', end: true, icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { to: '/admin/generate', label: 'Generate Ticket', icon: 'M12 4v16m8-8H4' },
  { to: '/admin/approvals', label: 'Approvals', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', badge: 'pending' },
  { to: '/admin/campaigns', label: 'Campaigns', icon: 'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z' },
  { to: '/admin/packages', label: 'Packages', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
  { to: '/admin/tickets', label: 'All Tickets', icon: 'M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z' },
  { to: '/admin/customers', label: 'Customers', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
  { to: '/admin/users', label: 'Users', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
  { to: '/admin/reports', label: 'Reports', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { to: '/admin/audit', label: 'Audit Logs', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
  { to: '/admin/scanner', label: 'Scanner', icon: 'M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z' },
  { to: '/admin/settings', label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
];

const Icon = ({ d }: { d: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
);

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [pendingCount, setPendingCount] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  useEffect(() => {
    const fetchPending = async () => {
      try {
        const res = await fetch('/api/transactions/pending', { headers: { 'Authorization': `Bearer ${localStorage.getItem('kartal_token')}` } });
        const data = await res.json();
        if (Array.isArray(data)) setPendingCount(data.length);
      } catch {}
    };
    fetchPending();
    const iv = setInterval(fetchPending, 30000);
    return () => clearInterval(iv);
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };

  const SidebarContent = () => (
    <>
      <div style={{ padding: '20px 14px 10px', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: '12px' }}>
        <div style={{ fontSize: '13px', fontWeight: '600', color: '#fff' }}>{user?.name || user?.nick_name || user?.email?.split('@')[0]}</div>
        <div style={{ fontSize: '11px', color: '#a78bfa', marginTop: '1px' }}>Administrator</div>
      </div>
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px', padding: '0 8px' }}>
        {navItems.map(item => (
          <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Icon d={item.icon} />
            <span>{item.label}</span>
            {item.badge === 'pending' && pendingCount > 0 && (
              <span style={{ marginLeft: 'auto', background: '#f59e0b', color: '#000', fontSize: '10px', fontWeight: '800', padding: '1px 7px', borderRadius: '10px' }}>{pendingCount}</span>
            )}
          </NavLink>
        ))}
      </nav>
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', padding: '12px 8px', marginTop: '8px' }}>
        <button onClick={handleLogout} className="nav-item" style={{ width: '100%', color: '#f87171', background: 'none', border: 'none', cursor: 'pointer' }}>
          <Icon d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          Sign Out
        </button>
      </div>
    </>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Desktop sidebar */}
      <div className="sidebar" style={{ display: 'flex', flexDirection: 'column' }}>
        {/* Logo */}
        <div style={{ padding: '20px 14px 0', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '34px', height: '34px', background: 'linear-gradient(135deg, #6c63ff, #a78bfa)', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>
          </div>
          <div>
            <div style={{ fontFamily: 'Syne', fontWeight: '800', fontSize: '14px', color: '#fff' }}>KARTAL</div>
            <div style={{ fontSize: '9px', color: '#a78bfa', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Admin Panel</div>
          </div>
        </div>
        <SidebarContent />
      </div>

      {/* Mobile topbar */}
      <div style={{ display: 'none', position: 'fixed', top: 0, left: 0, right: 0, height: '56px', background: '#1e1b3a', zIndex: 200, alignItems: 'center', padding: '0 16px', gap: '12px' }} className="mobile-topbar">
        <div style={{ width: '30px', height: '30px', background: 'linear-gradient(135deg, #6c63ff, #a78bfa)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>
        </div>
        <span style={{ fontFamily: 'Syne', fontWeight: '800', color: '#fff', fontSize: '15px', flex: 1 }}>KARTAL</span>
        {pendingCount > 0 && <span style={{ background: '#f59e0b', color: '#000', fontSize: '11px', fontWeight: '800', padding: '2px 8px', borderRadius: '10px' }}>{pendingCount}</span>}
        <button onClick={() => setMobileOpen(!mobileOpen)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', padding: '4px' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d={mobileOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} /></svg>
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 150 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} onClick={() => setMobileOpen(false)} />
          <div style={{ position: 'absolute', top: 56, left: 0, bottom: 0, width: '260px', background: '#1e1b3a', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            <SidebarContent />
          </div>
        </div>
      )}

      <div className="main-content fade-up"><Outlet /></div>

      <style>{`
        @media (max-width: 900px) {
          .sidebar { display: none !important; }
          .mobile-topbar { display: flex !important; }
          .main-content { margin-left: 0 !important; margin-top: 56px !important; }
        }
      `}</style>
    </div>
  );
}
