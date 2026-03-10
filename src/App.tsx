import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AdminLayout from './layouts/AdminLayout';
import UserLayout from './layouts/UserLayout';
import Login from './pages/Login';

// Admin pages
import AdminDashboard from './pages/admin/Dashboard';
import GenerateTicket from './pages/user/GenerateTicket';
import PendingApprovals from './pages/admin/PendingApprovals';
import CampaignSetup from './pages/admin/CampaignSetup';
import PackageSetup from './pages/admin/PackageSetup';
import AllTickets from './pages/admin/AllTickets';
import Customers from './pages/admin/Customers';
import CustomerDetail from './pages/admin/CustomerDetail';
import Users from './pages/admin/Users';
import AdminReports from './pages/admin/Reports';
import AuditLogs from './pages/admin/AuditLogs';
import AdminScanner from './pages/admin/Scanner';
import Settings from './pages/admin/Settings';

// User pages
import UserDashboard from './pages/user/Dashboard';
import MyTickets from './pages/user/MyTickets';
import GeneratedTicketsView from './pages/user/GeneratedTicketsView';
import BulkPrint from './pages/user/BulkPrint';
import UserScanner from './pages/user/Scanner';
import UserReports from './pages/user/Reports';

function ProtectedRoute({ children, role }: { children: React.ReactNode; role?: string }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><div className="spinner" style={{ width: '36px', height: '36px', borderWidth: '3px' }} /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (role === 'Admin' && user.role !== 'Admin') return <Navigate to="/user" replace />;
  if (role === 'User' && user.role === 'Admin') return <Navigate to="/admin" replace />;
  return <>{children}</>;
}

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'Admin' ? '/admin' : '/user'} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<RootRedirect />} />

          <Route path="/admin" element={<ProtectedRoute role="Admin"><AdminLayout /></ProtectedRoute>}>
            <Route index element={<AdminDashboard />} />
            <Route path="generate" element={<GenerateTicket />} />
            <Route path="generate/tickets/:txId" element={<GeneratedTicketsView />} />
            <Route path="approvals" element={<PendingApprovals />} />
            <Route path="campaigns" element={<CampaignSetup />} />
            <Route path="packages" element={<PackageSetup />} />
            <Route path="tickets" element={<AllTickets />} />
            <Route path="customers" element={<Customers />} />
            <Route path="customers/:id" element={<CustomerDetail />} />
            <Route path="users" element={<Users />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="audit" element={<AuditLogs />} />
            <Route path="scanner" element={<AdminScanner />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          <Route path="/user" element={<ProtectedRoute role="User"><UserLayout /></ProtectedRoute>}>
            <Route index element={<UserDashboard />} />
            <Route path="generate" element={<GenerateTicket />} />
            <Route path="generate/tickets/:txId" element={<GeneratedTicketsView />} />
            <Route path="tickets" element={<MyTickets />} />
            <Route path="bulk-print" element={<BulkPrint />} />
            <Route path="scanner" element={<UserScanner />} />
            <Route path="reports" element={<UserReports />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
