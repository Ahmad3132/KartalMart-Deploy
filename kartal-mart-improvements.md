# Kartal Mart Lucky Draw System - Implementation Guide

## Overview
This document provides a complete implementation plan for transforming the Lucky Draw Management System into a professional Kartal Mart application with enhanced features for salesman and admin users.

---

## 1. Dashboard Logo Improvements

### Requirements
- Remove background from logo (transparent PNG)
- Increase size for better readability
- Ensure clarity

### Implementation
```jsx
// Update Dashboard.jsx or similar component
<div className="dashboard-header">
  <img 
    src="/assets/logo-transparent.png" 
    alt="Kartal Mart Logo" 
    className="dashboard-logo"
    style={{
      width: '180px',  // Increased from typical 120px
      height: 'auto',
      objectFit: 'contain'
    }}
  />
</div>
```

**CSS Update:**
```css
.dashboard-logo {
  width: 180px;
  height: auto;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
  background: transparent;
}
```

---

## 2. Login Page Branding Update

### Current Text (Remove):
> "Lucky Draw Management System — Manage campaigns, generate tickets, and track all sales in one place."

### New Text (Add):
```jsx
<div className="login-branding">
  <h1>Kartal Mart</h1>
  <p className="tagline">Your Complete Retail Solution</p>
  <p className="description">
    Browse products, manage packages, and serve customers efficiently. 
    Purchase packages and generate instant tickets for our exclusive lucky draw program.
  </p>
  <div className="features">
    <span>📦 Product Management</span>
    <span>🎟️ Ticket Generation</span>
    <span>📊 Sales Tracking</span>
  </div>
</div>
```

**Alternative Descriptions:**
- "Streamline your retail operations with package management, instant ticket generation, and comprehensive sales tracking."
- "Modern retail management for salesmen. Sell packages, generate tickets, track performance - all in one platform."

---

## 3. Functional Dashboard Graphs

### Implementation with Recharts

```jsx
import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const DashboardGraphs = () => {
  const [salesData, setSalesData] = useState([]);
  const [ticketStats, setTicketStats] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch from your API
      const response = await fetch('/api/dashboard/statistics');
      const data = await response.json();
      
      setSalesData(data.salesByDate);
      setTicketStats(data.ticketsByStatus);
      setPaymentMethods(data.paymentMethodDistribution);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="dashboard-graphs">
      {/* Sales Trend Graph */}
      <div className="graph-card">
        <h3>Sales Trend (Last 30 Days)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={salesData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="sales" stroke="#8884d8" strokeWidth={2} />
            <Line type="monotone" dataKey="tickets" stroke="#82ca9d" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Ticket Status Distribution */}
      <div className="graph-card">
        <h3>Ticket Status</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={ticketStats}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="status" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Payment Methods Pie Chart */}
      <div className="graph-card">
        <h3>Payment Methods Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={paymentMethods}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {paymentMethods.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DashboardGraphs;
```

**Backend API Endpoint:**
```javascript
// api/dashboard/statistics.js
app.get('/api/dashboard/statistics', async (req, res) => {
  try {
    // Sales by date
    const salesByDate = await db.query(`
      SELECT DATE(created_at) as date, 
             COUNT(*) as tickets, 
             SUM(amount) as sales
      FROM tickets
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date
    `);

    // Tickets by status
    const ticketsByStatus = await db.query(`
      SELECT status, COUNT(*) as count
      FROM tickets
      GROUP BY status
    `);

    // Payment method distribution
    const paymentMethodDistribution = await db.query(`
      SELECT payment_method as name, COUNT(*) as value
      FROM tickets
      GROUP BY payment_method
    `);

    res.json({
      salesByDate,
      ticketsByStatus,
      paymentMethodDistribution
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});
```

---

## 4. User Management Page - Frontend Improvements

### Modern User Management UI

```jsx
import React, { useState, useEffect } from 'react';
import { Search, Filter, Edit, Trash2, UserPlus } from 'lucide-react';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="user-management-page">
      <div className="page-header">
        <h1>User Management</h1>
        <button className="btn-primary">
          <UserPlus size={20} />
          Add New User
        </button>
      </div>

      <div className="filters-bar">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select 
          value={filterRole} 
          onChange={(e) => setFilterRole(e.target.value)}
          className="role-filter"
        >
          <option value="all">All Roles</option>
          <option value="admin">Admin</option>
          <option value="salesman">Salesman</option>
          <option value="manager">Manager</option>
        </select>
      </div>

      <div className="users-table">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Permissions</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(user => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>
                  <span className={`badge badge-${user.role}`}>
                    {user.role}
                  </span>
                </td>
                <td>
                  <span className={`status-badge ${user.active ? 'active' : 'inactive'}`}>
                    {user.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <button className="btn-link" onClick={() => openPermissions(user)}>
                    Configure
                  </button>
                </td>
                <td>
                  <button className="btn-icon" onClick={() => editUser(user)}>
                    <Edit size={18} />
                  </button>
                  <button className="btn-icon btn-danger" onClick={() => deleteUser(user)}>
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
```

**CSS Styles:**
```css
.user-management-page {
  padding: 24px;
  background: #f8f9fa;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.filters-bar {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  background: white;
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.search-box {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 8px 12px;
}

.search-box input {
  border: none;
  outline: none;
  flex: 1;
  font-size: 14px;
}

.users-table {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  overflow: hidden;
}

.users-table table {
  width: 100%;
  border-collapse: collapse;
}

.users-table th {
  background: #f8f9fa;
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  font-size: 14px;
  color: #495057;
  border-bottom: 2px solid #e9ecef;
}

.users-table td {
  padding: 12px 16px;
  border-bottom: 1px solid #f1f3f5;
  font-size: 14px;
}

.badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.badge-admin {
  background: #e3f2fd;
  color: #1976d2;
}

.badge-salesman {
  background: #f3e5f5;
  color: #7b1fa2;
}

.status-badge.active {
  color: #2e7d32;
  font-weight: 600;
}

.status-badge.inactive {
  color: #d32f2f;
  font-weight: 600;
}
```

---

## 5. Remove Duplicate User Page & Add Permissions System

### Database Schema for Permissions

```sql
CREATE TABLE user_permissions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  allow_multi_person_tx BOOLEAN DEFAULT FALSE,
  allow_duplicate_tx_ids BOOLEAN DEFAULT FALSE,
  require_admin_approval BOOLEAN DEFAULT TRUE,
  easypaisa_receipt_mandatory BOOLEAN DEFAULT TRUE,
  easypaisa_scan_mandatory BOOLEAN DEFAULT TRUE,
  scanner_enabled BOOLEAN DEFAULT FALSE,
  allow_reprint BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Permissions & Restrictions Component

```jsx
import React, { useState, useEffect } from 'react';
import { Save, Shield } from 'lucide-react';

const UserPermissions = ({ userId, onClose }) => {
  const [permissions, setPermissions] = useState({
    allow_multi_person_tx: false,
    allow_duplicate_tx_ids: false,
    require_admin_approval: true,
    easypaisa_receipt_mandatory: true,
    easypaisa_scan_mandatory: true,
    scanner_enabled: false,
    allow_reprint: false
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPermissions();
  }, [userId]);

  const fetchPermissions = async () => {
    try {
      const response = await fetch(`/api/users/${userId}/permissions`);
      const data = await response.json();
      setPermissions(data);
    } catch (error) {
      console.error('Error fetching permissions:', error);
    }
  };

  const handleToggle = (key) => {
    setPermissions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const savePermissions = async () => {
    setLoading(true);
    try {
      await fetch(`/api/users/${userId}/permissions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(permissions)
      });
      alert('Permissions updated successfully');
      onClose();
    } catch (error) {
      alert('Failed to update permissions');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="permissions-modal">
      <div className="modal-content">
        <div className="modal-header">
          <h2>
            <Shield size={24} />
            Permissions & Restrictions
          </h2>
        </div>

        <div className="permissions-list">
          <div className="permission-item">
            <div className="permission-info">
              <h4>Allow Multi-Person Transactions</h4>
              <p>User can submit one transaction for multiple different people</p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={permissions.allow_multi_person_tx}
                onChange={() => handleToggle('allow_multi_person_tx')}
              />
              <span className="slider"></span>
            </label>
          </div>

          <div className="permission-item">
            <div className="permission-info">
              <h4>Allow Duplicate Transaction IDs</h4>
              <p>Same TX ID can be submitted more than once. If disabled, shows "Duplicate Transaction ID" error.</p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={permissions.allow_duplicate_tx_ids}
                onChange={() => handleToggle('allow_duplicate_tx_ids')}
              />
              <span className="slider"></span>
            </label>
          </div>

          <div className="permission-item">
            <div className="permission-info">
              <h4>Require Admin Approval</h4>
              <p>All transactions go to "Pending" status regardless of type</p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={permissions.require_admin_approval}
                onChange={() => handleToggle('require_admin_approval')}
              />
              <span className="slider"></span>
            </label>
          </div>

          <div className="permission-item">
            <div className="permission-info">
              <h4>EasyPaisa Receipt Mandatory</h4>
              <p>User must upload receipt when paying via EasyPaisa</p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={permissions.easypaisa_receipt_mandatory}
                onChange={() => handleToggle('easypaisa_receipt_mandatory')}
              />
              <span className="slider"></span>
            </label>
          </div>

          <div className="permission-item">
            <div className="permission-info">
              <h4>EasyPaisa Receipt Scan Mandatory</h4>
              <p>System scans uploaded file for TX ID verification and database check</p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={permissions.easypaisa_scan_mandatory}
                onChange={() => handleToggle('easypaisa_scan_mandatory')}
              />
              <span className="slider"></span>
            </label>
          </div>

          <div className="permission-item">
            <div className="permission-info">
              <h4>Scanner Enabled</h4>
              <p>User can scan tickets and send WhatsApp verification with video</p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={permissions.scanner_enabled}
                onChange={() => handleToggle('scanner_enabled')}
              />
              <span className="slider"></span>
            </label>
          </div>

          <div className="permission-item">
            <div className="permission-info">
              <h4>Allow Ticket Reprint</h4>
              <p>If disabled, shows "Already Printed" popup for previously printed tickets</p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={permissions.allow_reprint}
                onChange={() => handleToggle('allow_reprint')}
              />
              <span className="slider"></span>
            </label>
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={savePermissions} disabled={loading}>
            <Save size={20} />
            {loading ? 'Saving...' : 'Save Permissions'}
          </button>
        </div>
      </div>
    </div>
  );
};
```

---

## 6. EasyPaisa Receipt OCR Scanner

### Implementation using Tesseract.js

```javascript
// Backend: api/scan-receipt.js
const Tesseract = require('tesseract.js');
const multer = require('multer');

const upload = multer({ dest: 'uploads/' });

app.post('/api/scan-receipt', upload.single('receipt'), async (req, res) => {
  try {
    const { user_entered_tx_id, ticket_id } = req.body;
    const receiptPath = req.file.path;

    // OCR the receipt
    const { data: { text } } = await Tesseract.recognize(receiptPath, 'eng');
    
    // Extract transaction ID from text
    const txIdMatch = text.match(/Transaction\s*ID[:\s]*([A-Z0-9]+)/i) ||
                      text.match(/TID[:\s]*([A-Z0-9]+)/i) ||
                      text.match(/Ref[:\s]*([A-Z0-9]+)/i);
    
    if (!txIdMatch) {
      return res.status(400).json({
        error: 'SCAN_FAILED',
        message: 'Could not extract Transaction ID from receipt'
      });
    }

    const scanned_tx_id = txIdMatch[1];

    // Check if scanned TX ID matches user-entered TX ID
    if (scanned_tx_id !== user_entered_tx_id) {
      return res.status(400).json({
        error: 'MISMATCH',
        message: `Transaction ID mismatch. Receipt shows ${scanned_tx_id} but you entered ${user_entered_tx_id}`
      });
    }

    // Check if TX ID already exists in database
    const existingTicket = await db.query(
      'SELECT id, ticket_number FROM tickets WHERE transaction_id = ? AND id != ?',
      [scanned_tx_id, ticket_id]
    );

    if (existingTicket.length > 0) {
      return res.status(400).json({
        error: 'ALREADY_GENERATED',
        message: `This transaction ID was already used for ticket ${existingTicket[0].ticket_number}`
      });
    }

    res.json({
      success: true,
      scanned_tx_id,
      verified: true
    });

  } catch (error) {
    res.status(500).json({
      error: 'SCAN_ERROR',
      message: 'Failed to process receipt'
    });
  }
});
```

### Frontend Receipt Upload with Validation

```jsx
const ReceiptUpload = ({ onUpload, transactionId }) => {
  const [file, setFile] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setScanning(true);

    const formData = new FormData();
    formData.append('receipt', selectedFile);
    formData.append('user_entered_tx_id', transactionId);

    try {
      const response = await fetch('/api/scan-receipt', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error === 'MISMATCH') {
          alert(data.message);
          setFile(null);
        } else if (data.error === 'ALREADY_GENERATED') {
          alert(data.message);
          setFile(null);
        } else {
          alert('Receipt scan failed. Please try again.');
        }
      } else {
        setResult(data);
        onUpload(selectedFile, data);
      }
    } catch (error) {
      alert('Error scanning receipt');
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="receipt-upload">
      <label className="upload-label">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={scanning}
        />
        {scanning ? 'Scanning receipt...' : 'Upload EasyPaisa Receipt'}
      </label>
      
      {result && result.verified && (
        <div className="verification-success">
          ✓ Receipt verified. TX ID: {result.scanned_tx_id}
        </div>
      )}
    </div>
  );
};
```

---

## 7. Scanner Feature with WhatsApp Integration

### QR Code Scanner

```jsx
import React, { useState } from 'react';
import QrScanner from 'react-qr-scanner';

const TicketScanner = () => {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);

  const handleScan = async (data) => {
    if (data) {
      setScanning(false);
      
      try {
        // Verify ticket
        const response = await fetch(`/api/tickets/verify/${data.text}`);
        const ticket = await response.json();
        
        setResult(ticket);
        
        // Send WhatsApp message
        const message = encodeURIComponent(
          `Your ticket has been verified and put in the box. Here is the video: [video_link]`
        );
        
        // Open WhatsApp in same tab
        if (!window.whatsappTab || window.whatsappTab.closed) {
          window.whatsappTab = window.open(
            `https://wa.me/${ticket.phone}?text=${message}`,
            'whatsapp'
          );
        } else {
          window.whatsappTab.location.href = `https://wa.me/${ticket.phone}?text=${message}`;
          window.whatsappTab.focus();
        }
        
      } catch (error) {
        alert('Failed to verify ticket');
      }
    }
  };

  return (
    <div className="scanner-page">
      <h2>Scan Ticket</h2>
      
      {scanning ? (
        <QrScanner
          delay={300}
          onError={(err) => console.error(err)}
          onScan={handleScan}
          style={{ width: '100%' }}
        />
      ) : (
        <button onClick={() => setScanning(true)}>
          Start Scanning
        </button>
      )}
      
      {result && (
        <div className="scan-result">
          <h3>Ticket Verified</h3>
          <p>Ticket: {result.ticket_number}</p>
          <p>Customer: {result.customer_name}</p>
          <p>Status: {result.status}</p>
        </div>
      )}
    </div>
  );
};
```

---

## 8. Reprint Prevention Logic

### Implementation

```javascript
// Backend: api/print-ticket.js
app.post('/api/tickets/print/:id', async (req, res) => {
  const { id } = req.params;
  const { user_id } = req.session;

  try {
    // Get user permissions
    const permissions = await db.query(
      'SELECT allow_reprint FROM user_permissions WHERE user_id = ?',
      [user_id]
    );

    // Check if ticket was already printed
    const ticket = await db.query(
      'SELECT print_count FROM tickets WHERE id = ?',
      [id]
    );

    if (ticket[0].print_count > 0 && !permissions[0].allow_reprint) {
      return res.status(403).json({
        error: 'ALREADY_PRINTED',
        message: 'This ticket has already been printed. Reprint is not allowed.'
      });
    }

    // Update print count
    await db.query(
      'UPDATE tickets SET print_count = print_count + 1 WHERE id = ?',
      [id]
    );

    res.json({ success: true });

  } catch (error) {
    res.status(500).json({ error: 'Print failed' });
  }
});
```

### Frontend Print Handler

```jsx
const handlePrint = async (ticketId) => {
  try {
    const response = await fetch(`/api/tickets/print/${ticketId}`, {
      method: 'POST'
    });

    const data = await response.json();

    if (!response.ok && data.error === 'ALREADY_PRINTED') {
      alert('Already Printed\n\nThis ticket cannot be reprinted.');
      return;
    }

    // Proceed with thermal print
    printToThermalPrinter(ticketId);

  } catch (error) {
    alert('Print failed');
  }
};
```

---

## 9. WhatsApp Direct Integration

### Send Ticket Details via WhatsApp

```javascript
const sendTicketToWhatsApp = (ticket) => {
  const message = `*Kartal Mart Lucky Draw*

*Ticket(s):* ${ticket.ticket_number}
*Name:* ${ticket.customer_name}
*TX ID:* ${ticket.transaction_id}

_Please wait for verification and keep these ticket(s) safe._
_Kartal Group of Companies_`;

  const encodedMessage = encodeURIComponent(message);
  const phoneNumber = ticket.phone.replace(/[^0-9]/g, '');
  
  // Reuse same WhatsApp tab
  if (!window.whatsappTab || window.whatsappTab.closed) {
    window.whatsappTab = window.open(
      `https://wa.me/${phoneNumber}?text=${encodedMessage}`,
      'whatsapp'
    );
  } else {
    window.whatsappTab.location.href = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    window.whatsappTab.focus();
  }
};
```

---

## 10. Thermal Printer Integration

### Correct Print Logic

```javascript
const printToThermalPrinter = async (ticketIds) => {
  // ticketIds can be single ID or array of IDs
  const ids = Array.isArray(ticketIds) ? ticketIds : [ticketIds];
  
  // Fetch ticket data
  const tickets = await Promise.all(
    ids.map(id => fetch(`/api/tickets/${id}`).then(r => r.json()))
  );

  // Generate print content
  const printContent = tickets.map(ticket => generateTicketHTML(ticket)).join('\n\n');

  // Print using thermal printer
  const printWindow = window.open('', '', 'width=300,height=600');
  printWindow.document.write(`
    <html>
      <head>
        <style>
          @media print {
            body { 
              width: 58mm;  /* Standard thermal paper width */
              font-family: monospace;
              font-size: 12px;
            }
            .ticket {
              page-break-after: always;
            }
          }
        </style>
      </head>
      <body>
        ${printContent}
      </body>
    </html>
  `);
  
  printWindow.document.close();
  printWindow.print();
  printWindow.close();
};

const generateTicketHTML = (ticket) => {
  return `
    <div class="ticket">
      <div style="display: flex; justify-content: space-between;">
        <img src="/logo.png" style="width: 40px;" />
        <h2 style="margin: 0; font-size: 16px;">KARTAL MART</h2>
      </div>
      
      <div style="text-align: center; margin: 10px 0;">
        <h1 style="font-size: 24px; margin: 5px 0;">${ticket.ticket_number}</h1>
      </div>
      
      <div style="font-size: 11px;">
        <p><strong>Name:</strong> ${ticket.customer_name}</p>
        <p><strong>Package:</strong> ${ticket.package_name}</p>
        <p><strong>Contact:</strong> ${maskPhone(ticket.phone)}</p>
        <p><strong>TX ID:</strong> ${ticket.transaction_id}</p>
        <p><strong>Date:</strong> ${formatDate(ticket.created_at)}</p>
      </div>
      
      ${ticket.show_contact ? `<p style="font-size: 10px;">📞 ${ticket.contact_number}</p>` : ''}
      ${ticket.show_website ? `<p style="font-size: 10px;">🌐 ${ticket.website_url}</p>` : ''}
      
      <div style="text-align: center; margin-top: 10px; font-size: 10px;">
        <p>Thank you for your purchase!</p>
      </div>
    </div>
  `;
};

const maskPhone = (phone) => {
  if (!phone || phone.length < 3) return phone;
  return phone.slice(0, -3) + 'XXX';
};
```

---

## 11. Ticket Template Editor

### Database Schema

```sql
CREATE TABLE ticket_templates (
  id INT PRIMARY KEY AUTO_INCREMENT,
  template_name VARCHAR(100),
  show_date BOOLEAN DEFAULT TRUE,
  show_contact_number BOOLEAN DEFAULT TRUE,
  show_website BOOLEAN DEFAULT TRUE,
  show_package_name BOOLEAN DEFAULT TRUE,
  contact_number VARCHAR(20),
  website_url VARCHAR(100),
  logo_size ENUM('small', 'medium', 'large') DEFAULT 'medium',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Template Editor Component

```jsx
const TicketTemplateEditor = () => {
  const [template, setTemplate] = useState({
    show_date: true,
    show_contact_number: true,
    show_website: true,
    show_package_name: true,
    contact_number: '+92 300 1234567',
    website_url: 'www.kartalmart.com',
    logo_size: 'medium'
  });

  const handleSave = async () => {
    await fetch('/api/settings/ticket-template', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(template)
    });
    alert('Template saved successfully');
  };

  return (
    <div className="template-editor">
      <h2>Ticket Template Settings</h2>

      <div className="setting-item">
        <label>
          <input
            type="checkbox"
            checked={template.show_date}
            onChange={(e) => setTemplate({...template, show_date: e.target.checked})}
          />
          Show Date on Ticket
        </label>
      </div>

      <div className="setting-item">
        <label>
          <input
            type="checkbox"
            checked={template.show_package_name}
            onChange={(e) => setTemplate({...template, show_package_name: e.target.checked})}
          />
          Show Package Name
        </label>
      </div>

      <div className="setting-item">
        <label>
          <input
            type="checkbox"
            checked={template.show_contact_number}
            onChange={(e) => setTemplate({...template, show_contact_number: e.target.checked})}
          />
          Show Contact Number
        </label>
        {template.show_contact_number && (
          <input
            type="text"
            value={template.contact_number}
            onChange={(e) => setTemplate({...template, contact_number: e.target.value})}
            placeholder="Contact number"
          />
        )}
      </div>

      <div className="setting-item">
        <label>
          <input
            type="checkbox"
            checked={template.show_website}
            onChange={(e) => setTemplate({...template, show_website: e.target.checked})}
          />
          Show Website URL
        </label>
        {template.show_website && (
          <input
            type="text"
            value={template.website_url}
            onChange={(e) => setTemplate({...template, website_url: e.target.value})}
            placeholder="Website URL"
          />
        )}
      </div>

      <div className="setting-item">
        <label>Logo Size:</label>
        <select
          value={template.logo_size}
          onChange={(e) => setTemplate({...template, logo_size: e.target.value})}
        >
          <option value="small">Small</option>
          <option value="medium">Medium</option>
          <option value="large">Large</option>
        </select>
      </div>

      <button onClick={handleSave} className="btn-primary">
        Save Template
      </button>

      <div className="preview">
        <h3>Preview</h3>
        <TicketPreview template={template} />
      </div>
    </div>
  );
};
```

---

## 12. Marketing Campaigns (WhatsApp Bulk Messaging)

### Implementation

```javascript
// Backend: api/marketing/send-campaign.js
const axios = require('axios');

app.post('/api/marketing/send-campaign', async (req, res) => {
  const { campaign_name, message, target_audience } = req.body;

  try {
    // Get recipients based on target audience
    let recipients;
    if (target_audience === 'all_customers') {
      recipients = await db.query('SELECT phone FROM customers');
    } else if (target_audience === 'active_tickets') {
      recipients = await db.query('SELECT DISTINCT phone FROM tickets WHERE status = "active"');
    }

    // Use WhatsApp Business API
    const whatsappAPIKey = process.env.WHATSAPP_API_KEY;
    const results = [];

    for (const recipient of recipients) {
      try {
        await axios.post('https://api.whatsapp.com/send', {
          phone: recipient.phone,
          message: message
        }, {
          headers: {
            'Authorization': `Bearer ${whatsappAPIKey}`
          }
        });

        results.push({ phone: recipient.phone, status: 'sent' });
      } catch (error) {
        results.push({ phone: recipient.phone, status: 'failed' });
      }

      // Rate limiting - wait 1 second between messages
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Save campaign log
    await db.query(
      'INSERT INTO campaign_logs (campaign_name, total_sent, total_failed) VALUES (?, ?, ?)',
      [campaign_name, results.filter(r => r.status === 'sent').length, 
       results.filter(r => r.status === 'failed').length]
    );

    res.json({ success: true, results });

  } catch (error) {
    res.status(500).json({ error: 'Campaign failed' });
  }
});
```

**Alternative: Using Twilio**
```javascript
const twilio = require('twilio');
const client = new twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Send WhatsApp via Twilio
await client.messages.create({
  from: 'whatsapp:+14155238886',  // Twilio Sandbox number
  to: `whatsapp:${recipient.phone}`,
  body: message
});
```

---

## 13. Fix Scanner Page (Blank Page Issue)

### Router Configuration

```javascript
// App.js or routes.js
import TicketScanner from './components/TicketScanner';

<Route path="/scanner" element={<TicketScanner />} />
```

### Complete Scanner Page

```jsx
import React, { useState, useEffect } from 'react';
import { QrReader } from 'react-qr-reader';

const ScannerPage = () => {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(null);

  useEffect(() => {
    // Check camera permission
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(() => setHasPermission(true))
      .catch(() => setHasPermission(false));
  }, []);

  const handleScan = (result, error) => {
    if (result) {
      setScanned(result?.text);
      verifyTicket(result?.text);
    }
  };

  const verifyTicket = async (ticketNumber) => {
    try {
      const response = await fetch(`/api/tickets/verify/${ticketNumber}`);
      const data = await response.json();
      
      if (data.success) {
        alert(`Ticket ${ticketNumber} verified!`);
        sendWhatsAppConfirmation(data.ticket);
      } else {
        alert('Invalid ticket');
      }
    } catch (error) {
      alert('Verification failed');
    }
  };

  const sendWhatsAppConfirmation = (ticket) => {
    const message = `Your ticket has been verified and put in the box. Here is the video: [video_link]`;
    const encodedMessage = encodeURIComponent(message);
    
    if (!window.whatsappTab || window.whatsappTab.closed) {
      window.whatsappTab = window.open(
        `https://wa.me/${ticket.phone}?text=${encodedMessage}`,
        'whatsapp'
      );
    } else {
      window.whatsappTab.location.href = `https://wa.me/${ticket.phone}?text=${encodedMessage}`;
      window.whatsappTab.focus();
    }
  };

  if (hasPermission === null) {
    return <div>Requesting camera permission...</div>;
  }

  if (hasPermission === false) {
    return <div>No access to camera. Please enable camera permissions.</div>;
  }

  return (
    <div className="scanner-page">
      <h1>Scan Ticket</h1>
      
      <div className="scanner-container">
        <QrReader
          onResult={handleScan}
          constraints={{ facingMode: 'environment' }}
          style={{ width: '100%' }}
        />
      </div>

      {scanned && (
        <div className="scanned-result">
          <p>Last scanned: {scanned}</p>
        </div>
      )}
    </div>
  );
};

export default ScannerPage;
```

---

## 14. Convert to Mobile APK

### Method 1: Using Capacitor (Recommended)

```bash
# Install Capacitor
npm install @capacitor/core @capacitor/cli
npx cap init

# Add Android platform
npm install @capacitor/android
npx cap add android

# Build your web app
npm run build

# Copy web assets to native project
npx cap copy

# Open Android Studio
npx cap open android
```

**capacitor.config.json:**
```json
{
  "appId": "com.kartalmart.app",
  "appName": "Kartal Mart",
  "webDir": "build",
  "bundledWebRuntime": false,
  "plugins": {
    "Camera": {
      "permissions": ["camera"]
    }
  }
}
```

### Method 2: Using Cordova

```bash
# Install Cordova
npm install -g cordova

# Create Cordova project
cordova create kartalmart-mobile com.kartalmart.app KartalMart

# Add Android platform
cd kartalmart-mobile
cordova platform add android

# Copy your build files to www/

# Build APK
cordova build android
```

### Method 3: Using PWA + TWA (Trusted Web Activity)

```bash
# Install Bubblewrap
npm install -g @bubblewrap/cli

# Initialize TWA
bubblewrap init --manifest https://your-app.com/manifest.json

# Build APK
bubblewrap build
```

**manifest.json for PWA:**
```json
{
  "name": "Kartal Mart",
  "short_name": "Kartal Mart",
  "description": "Lucky Draw Management System",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#4CAF50",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

---

## 15. Complete File Structure

```
kartal-mart/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard/
│   │   │   │   ├── Dashboard.jsx
│   │   │   │   ├── DashboardGraphs.jsx
│   │   │   │   └── Logo.jsx
│   │   │   ├── Auth/
│   │   │   │   └── Login.jsx
│   │   │   ├── Users/
│   │   │   │   ├── UserManagement.jsx
│   │   │   │   ├── UserPermissions.jsx
│   │   │   │   └── AddUserModal.jsx
│   │   │   ├── Tickets/
│   │   │   │   ├── TicketList.jsx
│   │   │   │   ├── CreateTicket.jsx
│   │   │   │   ├── TicketTemplateEditor.jsx
│   │   │   │   └── PrintTicket.jsx
│   │   │   ├── Scanner/
│   │   │   │   └── ScannerPage.jsx
│   │   │   ├── Marketing/
│   │   │   │   └── CampaignManager.jsx
│   │   │   └── shared/
│   │   │       ├── ReceiptUpload.jsx
│   │   │       └── WhatsAppButton.jsx
│   │   ├── App.jsx
│   │   └── index.js
│   └── public/
│       ├── logo-transparent.png
│       └── manifest.json
├── backend/
│   ├── api/
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── tickets.js
│   │   ├── dashboard.js
│   │   ├── scan-receipt.js
│   │   └── marketing.js
│   ├── middleware/
│   │   ├── permissions.js
│   │   └── auth.js
│   ├── database/
│   │   └── schema.sql
│   └── server.js
└── mobile/
    └── android/
        └── app/
```

---

## 16. Deployment Checklist

### Backend (Railway)
- [ ] Set environment variables
- [ ] Configure database connection
- [ ] Enable CORS for mobile app
- [ ] Set up file upload storage
- [ ] Configure WhatsApp API credentials

### Frontend
- [ ] Update logo to transparent PNG
- [ ] Change all branding from "Lucky Draw" to "Kartal Mart"
- [ ] Test all graphs with real data
- [ ] Verify thermal printer compatibility
- [ ] Test WhatsApp tab reuse

### Mobile App
- [ ] Build APK using Capacitor
- [ ] Test camera permissions
- [ ] Test offline functionality
- [ ] Configure deep linking
- [ ] Test WhatsApp integration from mobile

### Security
- [ ] Implement JWT authentication
- [ ] Add rate limiting for API
- [ ] Validate all user inputs
- [ ] Sanitize file uploads
- [ ] Enable HTTPS only

---

## 17. Testing Guide

### User Permissions Testing
1. Create test users with different permission sets
2. Verify duplicate TX ID blocking works
3. Test admin approval workflow
4. Verify reprint blocking

### Receipt Scanning Testing
1. Upload valid EasyPaisa receipt
2. Test with mismatched TX ID
3. Test with duplicate TX ID
4. Verify error messages

### Printing Testing
1. Print single ticket
2. Print multiple tickets
3. Verify thermal printer output
4. Test reprint blocking

### WhatsApp Testing
1. Send single ticket
2. Send multiple tickets in sequence
3. Verify tab reuse
4. Test message formatting

---

## Support & Maintenance

### Common Issues

**Issue: Scanner page is blank**
- Check camera permissions in browser
- Verify QR reader library is installed
- Check console for errors

**Issue: Thermal printer not working**
- Verify printer driver is installed
- Check page width settings (58mm)
- Test with different browsers

**Issue: WhatsApp not sending**
- Check phone number format (international)
- Verify WhatsApp is installed
- Test with different numbers

**Issue: Receipt OCR not working**
- Ensure image is clear and high resolution
- Check Tesseract.js installation
- Verify regex patterns for TX ID extraction

---

This completes the comprehensive implementation guide for all requested features!
