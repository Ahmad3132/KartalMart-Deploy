import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Ticket, FileText, LogOut, Printer, Menu, X, Scan, PlusCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { Logo } from '../components/Logo';

const navItems = [
  { name: 'Dashboard', path: '/user', icon: LayoutDashboard },
  { name: 'Generate Ticket', path: '/user/generate', icon: PlusCircle },
  { name: 'My Tickets', path: '/user/tickets', icon: Ticket },
  { name: 'Bulk Print', path: '/user/bulk-print', icon: Printer },
  { name: 'Reports', path: '/user/reports', icon: FileText },
  { name: 'Scanner', path: '/user/scanner', icon: Scan },
];

export default function UserLayout() {
  const { logout, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  React.useEffect(() => { setIsMobileMenuOpen(false); }, [location.pathname]);

  const handleLogout = () => { logout(); navigate('/login'); };

  const NavContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-100 flex items-center gap-3">
        <Logo className="h-10 w-10" />
        <div className="flex flex-col leading-tight">
          <span className="font-black text-lg tracking-wider text-[#1a2b4b]" style={{ fontFamily: 'serif' }}>KARTAL</span>
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
          <span className="font-black text-base text-[#1a2b4b]" style={{ fontFamily: 'serif' }}>KARTAL</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(v => !v)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
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

      <main className="flex-1 overflow-auto min-w-0">
        <div className="p-4 md:p-6 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
