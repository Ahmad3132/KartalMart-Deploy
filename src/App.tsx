import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import AdminLayout from './layouts/AdminLayout';
import UserLayout from './layouts/UserLayout';
import AdminDashboard from './pages/admin/Dashboard';
import PendingApprovals from './pages/admin/PendingApprovals';
import CampaignSetup from './pages/admin/CampaignSetup';
import PackageSetup from './pages/admin/PackageSetup';
import AllTickets from './pages/admin/AllTickets';
import Customers from './pages/admin/Customers';
import CustomerDetail from './pages/admin/CustomerDetail';
import Users from './pages/admin/Users';
import AdminReports from './pages/admin/Reports';
import AuditLogs from './pages/admin/AuditLogs';
import Settings from './pages/admin/Settings';
import Scanner from './pages/Scanner';
import UserDashboard from './pages/user/Dashboard';
import GenerateTicket from './pages/user/GenerateTicket';
import MyTickets from './pages/user/MyTickets';
import BulkPrint from './pages/user/BulkPrint';
import UserReports from './pages/user/Reports';

function ProtectedRoute({ children, role }: { children: React.ReactNode, role?: string }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg)' }}><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" />;
  if (role && user.role !== role) return <Navigate to={user.role === 'Admin' ? '/admin' : '/user'} />;
  return <>{children}</>;
}

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg)' }}><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" />;
  return <Navigate to={user.role === 'Admin' ? '/admin' : '/user'} />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<Login />} />
          
          {/* Admin routes */}
          <Route path="/admin" element={<ProtectedRoute role="Admin"><AdminLayout /></ProtectedRoute>}>
            <Route index element={<AdminDashboard />} />
            <Route path="approvals" element={<PendingApprovals />} />
            <Route path="campaigns" element={<CampaignSetup />} />
            <Route path="packages" element={<PackageSetup />} />
            <Route path="tickets" element={<AllTickets />} />
            <Route path="customers" element={<Customers />} />
            <Route path="customers/:mobile" element={<CustomerDetail />} />
            <Route path="users" element={<Users />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="audit" element={<AuditLogs />} />
            <Route path="scanner" element={<Scanner />} />
            <Route path="settings" element={<Settings />} />
            <Route path="generate" element={<GenerateTicket />} />
          </Route>

          {/* User routes */}
          <Route path="/user" element={<ProtectedRoute role="User"><UserLayout /></ProtectedRoute>}>
            <Route index element={<UserDashboard />} />
            <Route path="generate" element={<GenerateTicket />} />
            <Route path="tickets" element={<MyTickets />} />
            <Route path="bulk-print" element={<BulkPrint />} />
            <Route path="scanner" element={<Scanner />} />
            <Route path="reports" element={<UserReports />} />
          </Route>

          <Route path="*" element={<RootRedirect />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
