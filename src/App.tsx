import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import AdminLayout from './layouts/AdminLayout';
import UserLayout from './layouts/UserLayout';
import AdminDashboard from './pages/admin/Dashboard';
import CampaignSetup from './pages/admin/CampaignSetup';
import PackageSetup from './pages/admin/PackageSetup';
import PendingApprovals from './pages/admin/PendingApprovals';
import Reports from './pages/admin/Reports';
import AuditLogs from './pages/admin/AuditLogs';
import Settings from './pages/admin/Settings';
import Accounts from './pages/admin/Accounts';
import UserDashboard from './pages/user/Dashboard';
import GenerateTicket from './pages/user/GenerateTicket';
import MyTickets from './pages/user/MyTickets';
import GeneratedTicketsView from './pages/user/GeneratedTicketsView';
import BulkPrint from './pages/user/BulkPrint';
import UserReports from './pages/user/Reports';
import Scanner from './pages/Scanner';
import CustomerDetails from './pages/admin/CustomerDetails';
import Customers from './pages/admin/Customers';
import CustomerDetail from './pages/admin/CustomerDetail';
import Users from './pages/admin/Users';

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(user.role as string)) {
    return <Navigate to={user.role === 'Admin' ? '/admin' : '/user'} replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />

          {/* Admin Routes */}
          <Route path="/admin" element={<ProtectedRoute allowedRoles={['Admin']}><AdminLayout /></ProtectedRoute>}>
            <Route index element={<AdminDashboard />} />
            <Route path="generate" element={<GenerateTicket />} />
            <Route path="success/:txId" element={<GeneratedTicketsView />} />
            <Route path="campaigns" element={<CampaignSetup />} />
            <Route path="packages" element={<PackageSetup />} />
            <Route path="approvals" element={<PendingApprovals />} />
            <Route path="audit" element={<AuditLogs />} />
            <Route path="bulk-print" element={<BulkPrint />} />
            <Route path="reports" element={<Reports />} />
            <Route path="accounts" element={<Accounts />} />
            <Route path="scanner" element={<Scanner />} />
            <Route path="customers" element={<Customers />} />
            <Route path="customers/:mobile" element={<CustomerDetail />} />
            <Route path="tickets/:ticketId" element={<CustomerDetails />} />
            <Route path="users" element={<Users />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* User Routes */}
          <Route path="/user" element={<ProtectedRoute allowedRoles={['User']}><UserLayout /></ProtectedRoute>}>
            <Route index element={<UserDashboard />} />
            <Route path="generate" element={<GenerateTicket />} />
            <Route path="success/:txId" element={<GeneratedTicketsView />} />
            <Route path="bulk-print" element={<BulkPrint />} />
            <Route path="tickets" element={<MyTickets />} />
            <Route path="reports" element={<UserReports />} />
            <Route path="scanner" element={<Scanner />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
