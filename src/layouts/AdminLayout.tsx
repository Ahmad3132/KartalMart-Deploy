import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Ticket, Settings, Package, CheckCircle, FileText, LogOut, Printer, Menu, X, Scan, Users, UserPlus, Clock, BarChart2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { Logo } from '../components/Logo';

const navItems = [
  { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
  { name: 'Generate Ticket', path: '/admin/generate', icon: Ticket },
  { name: 'Customers', path: '/admin/customers', icon: Users },
  { name: 'Pending Approvals', path: '/admin/approvals', icon: CheckCircle, badge: true },
  { name: 'Campaign Setup', path: '/admin/campaigns', icon: Settings },
  { name: 'Package Setup', path: '/admin/packages', icon: Package },
  { name: 'Bulk Print', path: '/admin/bulk-print', icon: Printer },
  { name: 'Reports', path: '/admin/reports', icon: BarChart2 },
  { name: 'Audit Logs', path: '/admin/audit', icon: FileText },
  { name: 'Scanner', path: '/admin/scanner', icon: Scan },
  { name: 'Users', path: '/admin/users', icon: UserPlus },
  { name: 'Settings', path: '/admin/settings', icon: Settings },
];

export default function AdminLayout() {
  const { logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => { setIsMobileMenuOpen(false); }, [location.pathname]);

  useEffect(() => {
    const fetchPending = async () => {
      try {
        const res = await fetch('/api/transactions/pending', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('kartal_token')}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) setPendingCount(data.length);
        }
      } catch {}
    };
    fetchPending();
    const iv = setInterval(fetchPending, 30000);
    return () => clearInterval(iv);
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };

  const NavContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-4 border-b border-gray-100 flex items-center gap-3">
        <Logo size="md" className="h-10 w-10" />
        <div className="flex flex-col leading-tight">
          <span className="font-black text-lg tracking-wider text-[#1a2b4b]" style={{ fontFamily: 'serif' }}>KARTAL</span>
          <span className="text-[9px] font-semibold tracking-widest text-[#A48655] uppercase">Group of Companies</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              to={item.path}
              className={cn(
                'flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                isActive
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <div className="flex items-center gap-3">
                <Icon className={cn('w-4 h-4 flex-shrink-0', isActive ? 'text-indigo-600' : 'text-gray-400')} />
                <span>{item.name}</span>
              </div>
              {item.badge && pendingCount > 0 && (
                <span className="bg-orange-100 text-orange-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                  {pendingCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-gray-100">
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
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-2">
          <Logo className="h-9 w-9" />
          <span className="font-black text-base text-[#1a2b4b]" style={{ fontFamily: 'serif' }}>KARTAL</span>
        </div>
        <div className="flex items-center gap-2">
          {pendingCount > 0 && (
            <Link to="/admin/approvals" className="flex items-center gap-1 bg-orange-100 text-orange-700 text-xs font-bold px-2 py-1 rounded-full">
              <Clock className="w-3 h-3" /> {pendingCount}
            </Link>
          )}
          <button onClick={() => setIsMobileMenuOpen(v => !v)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/40" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="w-64 h-full bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
            <NavContent />
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-56 bg-white border-r border-gray-200 flex-col sticky top-0 h-screen shadow-sm">
        <NavContent />
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto min-w-0">
        <div className="p-4 md:p-6 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
