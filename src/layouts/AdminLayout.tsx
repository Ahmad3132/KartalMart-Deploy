import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Ticket, Settings, Package, CheckCircle, FileText, LogOut, Printer, Menu, X, Scan, Users, UserPlus, Clock } from 'lucide-react';
import { cn } from '../lib/utils';
import { Logo } from '../components/Logo';

const navItems = [
  { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
  { name: 'Generate Ticket', path: '/admin/generate', icon: Ticket },
  { name: 'Customers', path: '/admin/customers', icon: Users },
  { name: 'Campaign Setup', path: '/admin/campaigns', icon: Settings },
  { name: 'Package Setup', path: '/admin/packages', icon: Package },
  { name: 'Pending Approvals', path: '/admin/approvals', icon: CheckCircle, badge: true },
  { name: 'Audit Logs', path: '/admin/audit', icon: FileText },
  { name: 'Bulk Print', path: '/admin/bulk-print', icon: Printer },
  { name: 'Reports', path: '/admin/reports', icon: FileText },
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

  const NavContent = () => (
    <>
      <div className="p-4 border-b border-gray-200 flex items-center">
        <Logo className="w-full h-16" textSide="right" />
      </div>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              to={item.path}
              className={cn(
                "flex items-center justify-between px-4 py-3 rounded-lg font-medium transition-colors",
                isActive ? "bg-indigo-50 text-indigo-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <div className="flex items-center space-x-3">
                <Icon className={cn("w-5 h-5 flex-shrink-0", isActive ? "text-indigo-700" : "text-gray-400")} />
                <span>{item.name}</span>
              </div>
              {item.badge && pendingCount > 0 && (
                <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-0.5 rounded-full">{pendingCount}</span>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-gray-200">
        <button onClick={handleLogout} className="flex items-center space-x-3 px-4 py-3 w-full rounded-lg font-medium text-red-600 hover:bg-red-50 transition-colors">
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <Logo className="h-8 w-32" textSide="right" />
        <div className="flex items-center gap-3">
          {pendingCount > 0 && (
            <Link to="/admin/approvals" className="flex items-center gap-1 bg-orange-100 text-orange-700 text-xs font-bold px-2 py-1 rounded-full">
              <Clock className="w-3 h-3" /> {pendingCount}
            </Link>
          )}
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="w-72 h-full bg-white flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
            <NavContent />
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-white border-r border-gray-200 flex-col sticky top-0 h-screen">
        <NavContent />
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
