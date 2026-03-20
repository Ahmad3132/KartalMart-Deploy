import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Ticket, FileText, LogOut, Printer, Menu, X, Scan, PlusCircle, ListChecks, Wallet, Bell } from 'lucide-react';
import { cn } from '../lib/utils';
import { Logo } from '../components/Logo';

const allNavItems = [
  { name: 'Dashboard', path: '/user', icon: LayoutDashboard },
  { name: 'Generate Ticket', path: '/user/generate', icon: PlusCircle, feature: 'generate_ticket_enabled' },
  { name: 'My Tickets', path: '/user/tickets', icon: Ticket },
  { name: 'Bulk Print', path: '/user/bulk-print', icon: Printer, feature: 'bulk_print_enabled' },
  { name: 'Reports', path: '/user/reports', icon: FileText, feature: 'reports_enabled' },
  { name: 'Scanner', path: '/user/scanner', icon: Scan, feature: 'scanner_enabled' },
  { name: 'My Cash', path: '/user/accounts', icon: Wallet, feature: 'accounts_enabled' },
  { name: 'Flow2 - Complete', path: '/user/flow2/step2', icon: ListChecks },
];

export default function UserLayout() {
  const { logout, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  const [notifs, setNotifs] = useState<any[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [me, setMe] = useState<any>(null);

  useEffect(() => { setIsMobileMenuOpen(false); setShowNotifs(false); }, [location.pathname]);

  // Fetch user details for feature toggles
  useEffect(() => {
    fetch('/api/users/me', { headers: { 'Authorization': `Bearer ${localStorage.getItem('kartal_token')}` } })
      .then(r => r.ok ? r.json() : null).then(d => { if (d) setMe(d); }).catch(() => {});
  }, []);

  // Filter nav items based on admin-controlled feature toggles
  const navItems = allNavItems.filter(item => {
    if (!item.feature) return true; // No feature gate = always show
    if (!me) return true; // Still loading = show all
    return me[item.feature] !== 0; // Admin disabled = hide
  });

  // Fetch notifications
  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const r = await fetch('/api/notifications', { headers: { 'Authorization': `Bearer ${localStorage.getItem('kartal_token')}` } });
        if (r.ok) { const d = await r.json(); setNotifCount(d.unread || 0); setNotifs(d.notifications || []); }
      } catch {}
    };
    fetchNotifs();
    const iv = setInterval(fetchNotifs, 15000);
    return () => clearInterval(iv);
  }, []);

  const markAllRead = async () => {
    await fetch('/api/notifications/read-all', { method: 'PUT', headers: { 'Authorization': `Bearer ${localStorage.getItem('kartal_token')}` } });
    setNotifCount(0);
    setNotifs(n => n.map(x => ({ ...x, is_read: 1 })));
  };

  const markRead = async (id: number, link?: string) => {
    await fetch(`/api/notifications/${id}/read`, { method: 'PUT', headers: { 'Authorization': `Bearer ${localStorage.getItem('kartal_token')}` } });
    setNotifCount(c => Math.max(0, c - 1));
    setNotifs(n => n.map(x => x.id === id ? { ...x, is_read: 1 } : x));
    if (link) { setShowNotifs(false); navigate(link); }
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  const NavContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-100 flex items-center gap-3">
        <Logo className="h-10 w-10" />
        <div className="flex flex-col leading-tight">
          <span className="font-black text-lg tracking-wider text-[#1a2b4b]" style={{ fontFamily: 'serif' }}>KARTAL MART</span>
          <span className="text-[9px] font-semibold tracking-widest text-[#A48655] uppercase">Group of Companies</span>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                isActive ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <Icon className={cn('w-4 h-4 flex-shrink-0', isActive ? 'text-indigo-600' : 'text-gray-400')} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-gray-100">
        <div className="px-3 py-2 mb-1">
          <p className="text-xs text-gray-400 truncate">{user?.nick_name || user?.name || user?.email}</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-2">
          <Logo className="h-9 w-9" />
          <span className="font-black text-base text-[#1a2b4b]" style={{ fontFamily: 'serif' }}>KARTAL MART</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowNotifs(v => !v)} className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
            <Bell className="w-5 h-5" />
            {notifCount > 0 && <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{notifCount > 9 ? '9+' : notifCount}</span>}
          </button>
          <button onClick={() => setIsMobileMenuOpen(v => !v)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/40" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="w-64 h-full bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
            <NavContent />
          </div>
        </div>
      )}

      <aside className="hidden md:flex w-56 bg-white border-r border-gray-200 flex-col sticky top-0 h-screen shadow-sm">
        <NavContent />
      </aside>

      {/* Notification dropdown */}
      {showNotifs && (
        <div className="fixed inset-0 z-[60]" onClick={() => setShowNotifs(false)}>
          <div className="absolute right-4 top-14 md:right-6 md:top-4 w-80 max-h-96 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-3 border-b border-gray-100 flex items-center justify-between">
              <h4 className="font-bold text-sm text-gray-900">Notifications</h4>
              {notifCount > 0 && <button onClick={markAllRead} className="text-xs text-indigo-600 font-medium hover:text-indigo-800">Mark all read</button>}
            </div>
            <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
              {notifs.length === 0 ? (
                <div className="p-6 text-center text-gray-400 text-sm">No notifications</div>
              ) : notifs.slice(0, 20).map(n => (
                <div key={n.id} onClick={() => markRead(n.id, n.link)} className={cn('p-3 cursor-pointer hover:bg-gray-50 transition-colors', !n.is_read && 'bg-indigo-50/50')}>
                  <div className="flex items-start gap-2">
                    <div className={cn('w-2 h-2 rounded-full mt-1.5 flex-shrink-0', n.type === 'success' ? 'bg-emerald-500' : n.type === 'warning' ? 'bg-orange-500' : n.type === 'error' ? 'bg-red-500' : 'bg-indigo-500')} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{n.title}</p>
                      <p className="text-xs text-gray-500 line-clamp-2">{n.message}</p>
                      <p className="text-[10px] text-gray-400 mt-1">{new Date(n.created_at).toLocaleString('en-PK', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 overflow-auto min-w-0">
        {/* Desktop top bar with bell */}
        <div className="hidden md:flex items-center justify-end px-6 py-2 border-b border-gray-100 bg-white">
          <div className="flex items-center gap-3">
            <button onClick={() => setShowNotifs(v => !v)} className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell className="w-5 h-5" />
              {notifCount > 0 && <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{notifCount > 9 ? '9+' : notifCount}</span>}
            </button>
            <span className="text-sm text-gray-500">{user?.nick_name || user?.name || user?.email}</span>
          </div>
        </div>
        <div className="p-4 md:p-6 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
