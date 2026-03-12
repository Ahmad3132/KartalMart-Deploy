import React, { useState, useEffect } from 'react';
import { ArrowLeft, Printer, Send, Search, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './TicketList.css';

function TicketList({ user, whatsappTab, setWhatsappTab }) {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadTickets();
  }, []);

  useEffect(() => {
    filterTickets();
  }, [searchTerm, statusFilter, tickets]);

  const loadTickets = () => {
    const savedTickets = JSON.parse(localStorage.getItem('tickets') || '[]');
    setTickets(savedTickets);
    setFilteredTickets(savedTickets);
  };

  const filterTickets = () => {
    let filtered = tickets;

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(t => t.status === statusFilter);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(t =>
        t.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.transactionId.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredTickets(filtered);
  };

  const handleReprint = (ticket) => {
    if (!user.permissions.allowReprint && ticket.printed) {
      alert('Already Printed - This ticket cannot be reprinted. Please contact administrator if you need to reprint.');
      return;
    }

    printTicket(ticket);
  };

  const printTicket = (ticket) => {
    const settings = JSON.parse(localStorage.getItem('ticketSettings') || '{}');
    const printWindow = window.open('', '', 'width=300,height=600');
    const maskedPhone = ticket.contactNumber.slice(0, -3) + '***';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Print Ticket</title>
        <style>
          @media print {
            @page {
              size: 80mm auto;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 10mm;
            }
          }
          body {
            font-family: 'Courier New', monospace;
            width: 80mm;
            padding: 10mm;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 15px;
          }
          .logo {
            max-width: 30mm;
            height: auto;
          }
          .brand {
            font-size: 20px;
            font-weight: bold;
            letter-spacing: 1px;
          }
          .ticket-number {
            font-size: 24px;
            font-weight: bold;
            text-align: center;
            border: 2px solid black;
            padding: 8px;
            margin: 15px 0;
          }
          .info {
            margin: 8px 0;
            font-size: 12px;
          }
          .label {
            font-weight: bold;
          }
          .divider {
            border-top: 1px dashed black;
            margin: 10px 0;
          }
          .footer {
            text-align: center;
            font-size: 10px;
            margin-top: 15px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          ${settings.showLogo !== false ? '<img src="/kartal-logo.png" class="logo" />' : ''}
          <div class="brand">KARTAL MART</div>
        </div>

        <div class="ticket-number">${ticket.ticketNumber}</div>

        <div class="info">
          <span class="label">Name:</span> ${ticket.customerName}
        </div>
        <div class="info">
          <span class="label">Package:</span> ${ticket.packageName}
        </div>
        <div class="info">
          <span class="label">Contact:</span> ${maskedPhone}
        </div>
        <div class="info">
          <span class="label">TX ID:</span> ${ticket.transactionId}
        </div>
        ${settings.showDate !== false ? `<div class="info"><span class="label">Date:</span> ${new Date(ticket.createdAt).toLocaleDateString()}</div>` : ''}

        <div class="divider"></div>

        <div class="footer">
          ${settings.showContact !== false ? `Contact: ${settings.contactNumber || '0300-1234567'}` : ''}
          ${settings.showWebsite !== false ? `<br/>${settings.websiteUrl || 'www.kartalmart.com'}` : ''}
          <br/>Kartal Group of Companies
        </div>
      </body>
      </html>
    `);

    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();

      // Mark as printed
      const updatedTickets = tickets.map(t =>
        t.id === ticket.id ? { ...t, printed: true } : t
      );
      setTickets(updatedTickets);
      localStorage.setItem('tickets', JSON.stringify(updatedTickets));
    }, 500);
  };

  const sendWhatsApp = (ticket) => {
    const phone = ticket.contactNumber.replace(/\D/g, '');
    const message = `*Kartal Mart Lucky Draw*
*Ticket(s):* ${ticket.ticketNumber}
*Name:* ${ticket.customerName}
*TX ID:* ${ticket.transactionId}
_Please wait for verification and keep these ticket(s) safe._
_Kartal Group of Companies_`;

    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

    // Reuse existing tab
    if (whatsappTab && !whatsappTab.closed) {
      whatsappTab.location.href = whatsappUrl;
      whatsappTab.focus();
    } else {
      const newTab = window.open(whatsappUrl, 'whatsapp_tab');
      setWhatsappTab(newTab);
    }
  };

  const updateTicketStatus = (ticketId, newStatus) => {
    const updatedTickets = tickets.map(t =>
      t.id === ticketId ? { ...t, status: newStatus } : t
    );
    setTickets(updatedTickets);
    localStorage.setItem('tickets', JSON.stringify(updatedTickets));
  };

  return (
    <div className="ticket-list-page">
      <header className="page-header">
        <button className="back-btn" onClick={() => navigate('/dashboard')}>
          <ArrowLeft size={20} />
          Back
        </button>
        <h1>Tickets</h1>
      </header>

      <div className="page-content">
        <div className="filters-bar">
          <div className="search-box">
            <Search size={20} />
            <input
              type="text"
              placeholder="Search by ticket number, name, or TX ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <Filter size={20} />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All Status</option>
              <option value="verified">Verified</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        <div className="tickets-grid">
          {filteredTickets.length === 0 ? (
            <div className="no-tickets">
              <p>No tickets found</p>
            </div>
          ) : (
            filteredTickets.map(ticket => (
              <div key={ticket.id} className="ticket-card">
                <div className="ticket-header">
                  <h3>{ticket.ticketNumber}</h3>
                  <span className={`status-badge ${ticket.status}`}>
                    {ticket.status}
                  </span>
                </div>

                <div className="ticket-details">
                  <div className="detail-row">
                    <span className="label">Customer:</span>
                    <span className="value">{ticket.customerName}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Package:</span>
                    <span className="value">{ticket.packageName}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Contact:</span>
                    <span className="value">{ticket.contactNumber}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">TX ID:</span>
                    <span className="value">{ticket.transactionId}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Date:</span>
                    <span className="value">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                  </div>
                  {ticket.printed && (
                    <div className="detail-row">
                      <span className="label">Printed:</span>
                      <span className="value">Yes</span>
                    </div>
                  )}
                </div>

                <div className="ticket-actions">
                  <button
                    className="print-btn"
                    onClick={() => handleReprint(ticket)}
                    title={ticket.printed && !user.permissions.allowReprint ? 'Already Printed' : 'Print Ticket'}
                  >
                    <Printer size={18} />
                    {ticket.printed ? 'Reprint' : 'Print'}
                  </button>
                  <button
                    className="whatsapp-btn"
                    onClick={() => sendWhatsApp(ticket)}
                  >
                    <Send size={18} />
                    WhatsApp
                  </button>
                </div>

                {user.role === 'admin' && ticket.status === 'pending' && (
                  <div className="admin-actions">
                    <button
                      className="approve-btn"
                      onClick={() => updateTicketStatus(ticket.id, 'verified')}
                    >
                      Approve
                    </button>
                    <button
                      className="reject-btn"
                      onClick={() => updateTicketStatus(ticket.id, 'rejected')}
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default TicketList;
