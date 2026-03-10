import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/user', label: 'Dashboard', end: true, icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { to: '/user/generate', label: 'Generate Ticket', icon: 'M12 4v16m8-8H4' },
  { to: '/user/tickets', label: 'My Tickets', icon: 'M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z' },
  { to: '/user/bulk-print', label: 'Bulk Print', icon: 'M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z' },
  { to: '/user/scanner', label: 'Scanner', icon: 'M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z' },
  { to: '/user/reports', label: 'Reports', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
];

const Icon = ({ d }: { d: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
);

export default function UserLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  React.useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const handleLogout = () => { logout(); navigate('/login'); };

  const SidebarContent = () => (
    <>
      <div style={{ padding: '20px 14px 10px', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: '12px' }}>
        <div style={{ fontSize: '13px', fontWeight: '600', color: '#fff' }}>{user?.name || user?.nick_name || user?.email?.split('@')[0]}</div>
        <div style={{ fontSize: '11px', color: '#86efac', marginTop: '1px' }}>Staff Member</div>
      </div>
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px', padding: '0 8px' }}>
        {navItems.map(item => (
          <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Icon d={item.icon} />
            <span>{item.label}</span>
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
      <div className="sidebar" style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px 14px 0', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '34px', height: '34px', background: 'linear-gradient(135deg, #22c55e, #86efac)', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>
          </div>
          <div>
            <div style={{ fontFamily: 'Syne', fontWeight: '800', fontSize: '14px', color: '#fff' }}>KARTAL</div>
            <div style={{ fontSize: '9px', color: '#86efac', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Staff Panel</div>
          </div>
        </div>
        <SidebarContent />
      </div>

      <div style={{ display: 'none', position: 'fixed', top: 0, left: 0, right: 0, height: '56px', background: '#1e1b3a', zIndex: 200, alignItems: 'center', padding: '0 16px', gap: '12px' }} className="mobile-topbar">
        <div style={{ width: '30px', height: '30px', background: 'linear-gradient(135deg, #22c55e, #86efac)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4V7a2 2 0 00-2-2H5z" /></svg>
        </div>
        <span style={{ fontFamily: 'Syne', fontWeight: '800', color: '#fff', fontSize: '15px', flex: 1 }}>KARTAL</span>
        <button onClick={() => setMobileOpen(!mobileOpen)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', padding: '4px' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d={mobileOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} /></svg>
        </button>
      </div>

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
