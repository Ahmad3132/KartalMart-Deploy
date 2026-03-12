import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Package, Users, TrendingUp, DollarSign, Ticket, Menu, X } from 'lucide-react';
import './Dashboard.css';

function Dashboard({ user, onLogout }) {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    totalSales: 0,
    totalTickets: 0,
    totalCustomers: 0,
    pendingApprovals: 0,
    salesTrend: [],
    ticketsByStatus: [],
    topProducts: []
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = () => {
    // Mock data - replace with actual API calls
    const salesTrend = [
      { date: 'Mon', sales: 4200, tickets: 42 },
      { date: 'Tue', sales: 3800, tickets: 38 },
      { date: 'Wed', sales: 5200, tickets: 52 },
      { date: 'Thu', sales: 4500, tickets: 45 },
      { date: 'Fri', sales: 6100, tickets: 61 },
      { date: 'Sat', sales: 7800, tickets: 78 },
      { date: 'Sun', sales: 5600, tickets: 56 }
    ];

    const ticketsByStatus = [
      { name: 'Verified', value: 245, color: '#4caf50' },
      { name: 'Pending', value: 67, color: '#ff9800' },
      { name: 'Rejected', value: 12, color: '#f44336' }
    ];

    const topProducts = [
      { name: 'Premium Package', sales: 145 },
      { name: 'Standard Package', sales: 98 },
      { name: 'Basic Package', sales: 67 },
      { name: 'Special Offer', sales: 45 }
    ];

    setDashboardData({
      totalSales: 32400,
      totalTickets: 324,
      totalCustomers: 289,
      pendingApprovals: 67,
      salesTrend,
      ticketsByStatus,
      topProducts
    });
  };

  const StatCard = ({ icon: Icon, title, value, color, trend }) => (
    <div className="stat-card" style={{ borderTopColor: color }}>
      <div className="stat-icon" style={{ backgroundColor: `${color}15` }}>
        <Icon size={28} color={color} />
      </div>
      <div className="stat-content">
        <div className="stat-title">{title}</div>
        <div className="stat-value">{value}</div>
        {trend && <div className="stat-trend" style={{ color }}>{trend}</div>}
      </div>
    </div>
  );

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className={`dashboard-sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo-container">
            <img 
              src="/kartal-logo.png" 
              alt="Kartal Mart" 
              className="sidebar-logo"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            <div className="sidebar-logo-fallback" style={{display: 'none'}}>KM</div>
          </div>
          {isSidebarOpen && (
            <div className="sidebar-brand">
              <h2>KARTAL MART</h2>
              <p>{user.role === 'admin' ? 'Admin Panel' : 'Sales Portal'}</p>
            </div>
          )}
        </div>

        <nav className="sidebar-nav">
          <Link to="/dashboard" className="nav-item active">
            <TrendingUp size={20} />
            {isSidebarOpen && <span>Dashboard</span>}
          </Link>
          <Link to="/tickets/new" className="nav-item">
            <Ticket size={20} />
            {isSidebarOpen && <span>New Ticket</span>}
          </Link>
          <Link to="/tickets" className="nav-item">
            <Package size={20} />
            {isSidebarOpen && <span>Tickets</span>}
          </Link>
          {user.role === 'admin' && (
            <>
              <Link to="/user-management" className="nav-item">
                <Users size={20} />
                {isSidebarOpen && <span>User Management</span>}
              </Link>
              <Link to="/marketing" className="nav-item">
                <DollarSign size={20} />
                {isSidebarOpen && <span>Marketing</span>}
              </Link>
            </>
          )}
          {user.permissions?.allowScanner && (
            <Link to="/scanner" className="nav-item">
              <Package size={20} />
              {isSidebarOpen && <span>Scanner</span>}
            </Link>
          )}
          <Link to="/ticket-template" className="nav-item">
            <Ticket size={20} />
            {isSidebarOpen && <span>Ticket Template</span>}
          </Link>
          <Link to="/settings" className="nav-item">
            <Users size={20} />
            {isSidebarOpen && <span>Settings</span>}
          </Link>
        </nav>

        <div className="sidebar-footer">
          <button onClick={onLogout} className="logout-btn">
            {isSidebarOpen ? 'Logout' : '→'}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">
        <header className="dashboard-header">
          <button 
            className="sidebar-toggle"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <h1>Dashboard</h1>
          <div className="user-info">
            <span className="user-name">{user.username}</span>
            <span className="user-role">{user.role}</span>
          </div>
        </header>

        <div className="dashboard-content">
          {/* Stats Cards */}
          <div className="stats-grid">
            <StatCard 
              icon={DollarSign}
              title="Total Sales"
              value={`Rs ${dashboardData.totalSales.toLocaleString()}`}
              color="#4caf50"
              trend="+12% from last week"
            />
            <StatCard 
              icon={Ticket}
              title="Total Tickets"
              value={dashboardData.totalTickets}
              color="#2196f3"
              trend="+8% from last week"
            />
            <StatCard 
              icon={Users}
              title="Total Customers"
              value={dashboardData.totalCustomers}
              color="#ff9800"
              trend="+15% from last week"
            />
            <StatCard 
              icon={Package}
              title="Pending Approvals"
              value={dashboardData.pendingApprovals}
              color="#f44336"
              trend="Needs attention"
            />
          </div>

          {/* Charts */}
          <div className="charts-grid">
            {/* Sales Trend */}
            <div className="chart-card">
              <h3>Sales & Tickets Trend (Last 7 Days)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dashboardData.salesTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis dataKey="date" stroke="#666" />
                  <YAxis yAxisId="left" stroke="#4caf50" />
                  <YAxis yAxisId="right" orientation="right" stroke="#2196f3" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #ddd',
                      borderRadius: '8px'
                    }} 
                  />
                  <Legend />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="sales" 
                    stroke="#4caf50" 
                    strokeWidth={3}
                    name="Sales (Rs)"
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="tickets" 
                    stroke="#2196f3" 
                    strokeWidth={3}
                    name="Tickets"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Tickets by Status */}
            <div className="chart-card">
              <h3>Tickets by Status</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={dashboardData.ticketsByStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {dashboardData.ticketsByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Top Products */}
            <div className="chart-card full-width">
              <h3>Top Selling Products</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dashboardData.topProducts}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis dataKey="name" stroke="#666" />
                  <YAxis stroke="#666" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #ddd',
                      borderRadius: '8px'
                    }} 
                  />
                  <Bar dataKey="sales" fill="#ffbb00" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="quick-actions">
            <h3>Quick Actions</h3>
            <div className="actions-grid">
              <button 
                className="action-btn"
                onClick={() => navigate('/tickets/new')}
              >
                <Ticket size={24} />
                <span>Generate New Ticket</span>
              </button>
              <button 
                className="action-btn"
                onClick={() => navigate('/tickets')}
              >
                <Package size={24} />
                <span>View All Tickets</span>
              </button>
              {user.permissions?.allowScanner && (
                <button 
                  className="action-btn"
                  onClick={() => navigate('/scanner')}
                >
                  <Package size={24} />
                  <span>Scan Ticket</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
