/**
 * Thermal Printer Utility for Kartal Mart
 * Handles ticket printing with proper formatting for 58mm thermal printers
 */

export class ThermalPrinter {
  /**
   * Print single or multiple tickets
   * @param {Array|Object} tickets - Single ticket object or array of tickets
   * @param {Object} template - Template settings from database
   */
  static async printTickets(tickets, template = {}) {
    const ticketArray = Array.isArray(tickets) ? tickets : [tickets];
    
    // Check reprint permissions for each ticket
    const printableTickets = await this.checkReprintPermissions(ticketArray);
    
    if (printableTickets.length === 0) {
      alert('No tickets can be printed. All tickets have already been printed and reprint is disabled.');
      return;
    }

    // Generate HTML for all tickets
    const printHTML = this.generatePrintHTML(printableTickets, template);
    
    // Open print window
    const printWindow = window.open('', 'Thermal Print', 'width=300,height=600');
    if (!printWindow) {
      alert('Please allow popups to print tickets');
      return;
    }

    printWindow.document.write(printHTML);
    printWindow.document.close();
    
    // Wait for content to load then print
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
      
      // Update print count in database
      this.updatePrintCount(printableTickets);
      
      // Close window after printing
      setTimeout(() => {
        printWindow.close();
      }, 500);
    };
  }

  /**
   * Check if tickets can be reprinted based on permissions
   */
  static async checkReprintPermissions(tickets) {
    const printable = [];
    
    for (const ticket of tickets) {
      try {
        const response = await fetch(`/api/tickets/can-print/${ticket.id}`);
        const data = await response.json();
        
        if (data.can_print) {
          printable.push(ticket);
        } else if (data.error === 'ALREADY_PRINTED') {
          alert(`Ticket ${ticket.ticket_number}: Already Printed\n\nThis ticket has already been printed. Reprint is not allowed.`);
        }
      } catch (error) {
        console.error('Error checking print permission:', error);
      }
    }
    
    return printable;
  }

  /**
   * Update print count for tickets
   */
  static async updatePrintCount(tickets) {
    const ticketIds = tickets.map(t => t.id);
    
    try {
      await fetch('/api/tickets/update-print-count', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticket_ids: ticketIds })
      });
    } catch (error) {
      console.error('Error updating print count:', error);
    }
  }

  /**
   * Generate complete HTML for printing
   */
  static generatePrintHTML(tickets, template) {
    const ticketsHTML = tickets.map(ticket => this.generateTicketHTML(ticket, template)).join('');
    
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Print Tickets</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    @page {
      size: 58mm auto;
      margin: 0;
    }

    body {
      width: 58mm;
      font-family: 'Courier New', monospace;
      font-size: 11px;
      line-height: 1.4;
    }

    .ticket {
      padding: 8mm 3mm;
      page-break-after: always;
    }

    .ticket:last-child {
      page-break-after: auto;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 8px;
      padding-bottom: 6px;
      border-bottom: 1px dashed #000;
    }

    .logo {
      width: 35px;
      height: auto;
    }

    .logo-large {
      width: 45px;
    }

    .brand-name {
      font-size: ${template.logo_size === 'large' ? '16px' : '14px'};
      font-weight: bold;
      text-align: right;
      line-height: 1.2;
    }

    .ticket-number {
      text-align: center;
      font-size: 20px;
      font-weight: bold;
      margin: 12px 0;
      padding: 8px;
      border: 2px solid #000;
      letter-spacing: 2px;
    }

    .details {
      margin: 10px 0;
      font-size: 10px;
    }

    .detail-row {
      display: flex;
      margin: 5px 0;
      line-height: 1.5;
    }

    .detail-label {
      font-weight: bold;
      width: 60px;
      flex-shrink: 0;
    }

    .detail-value {
      flex: 1;
      word-break: break-word;
    }

    .footer {
      margin-top: 10px;
      padding-top: 8px;
      border-top: 1px dashed #000;
      text-align: center;
      font-size: 9px;
    }

    .contact-info {
      margin: 4px 0;
    }

    .thank-you {
      margin-top: 8px;
      font-style: italic;
    }

    @media print {
      body {
        width: 58mm;
      }
      
      .ticket {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  ${ticketsHTML}
</body>
</html>`;
  }

  /**
   * Generate HTML for a single ticket
   */
  static generateTicketHTML(ticket, template) {
    const {
      show_date = true,
      show_contact_number = true,
      show_website = true,
      show_package_name = true,
      contact_number = '',
      website_url = '',
      logo_size = 'medium'
    } = template;

    const logoClass = logo_size === 'large' ? 'logo-large' : '';

    return `
  <div class="ticket">
    <!-- Header with Logo and Brand Name -->
    <div class="header">
      <img src="/logo-transparent.png" alt="Logo" class="logo ${logoClass}" />
      <div class="brand-name">KARTAL<br/>MART</div>
    </div>

    <!-- Ticket Number (Prominent) -->
    <div class="ticket-number">${ticket.ticket_number}</div>

    <!-- Customer Details -->
    <div class="details">
      <div class="detail-row">
        <span class="detail-label">Name:</span>
        <span class="detail-value">${ticket.customer_name}</span>
      </div>

      ${show_package_name ? `
      <div class="detail-row">
        <span class="detail-label">Package:</span>
        <span class="detail-value">${ticket.package_name || 'N/A'}</span>
      </div>
      ` : ''}

      <div class="detail-row">
        <span class="detail-label">Contact:</span>
        <span class="detail-value">${this.maskPhone(ticket.phone)}</span>
      </div>

      <div class="detail-row">
        <span class="detail-label">TX ID:</span>
        <span class="detail-value">${ticket.transaction_id}</span>
      </div>

      ${show_date ? `
      <div class="detail-row">
        <span class="detail-label">Date:</span>
        <span class="detail-value">${this.formatDate(ticket.created_at)}</span>
      </div>
      ` : ''}
    </div>

    <!-- Footer -->
    <div class="footer">
      ${show_contact_number && contact_number ? `
      <div class="contact-info">📞 ${contact_number}</div>
      ` : ''}
      
      ${show_website && website_url ? `
      <div class="contact-info">🌐 ${website_url}</div>
      ` : ''}

      <div class="thank-you">Thank you for your purchase!</div>
      <div>Kartal Group of Companies</div>
    </div>
  </div>`;
  }

  /**
   * Mask last 3 digits of phone number
   */
  static maskPhone(phone) {
    if (!phone || phone.length < 3) return phone || 'N/A';
    return phone.slice(0, -3) + 'XXX';
  }

  /**
   * Format date for display
   */
  static formatDate(dateString) {
    const date = new Date(dateString);
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return date.toLocaleDateString('en-US', options);
  }

  /**
   * Print a test page to verify printer settings
   */
  static printTestPage() {
    const testTicket = {
      id: 'test',
      ticket_number: 'TEST-12345',
      customer_name: 'Test Customer',
      package_name: 'Sample Package',
      phone: '03001234567',
      transaction_id: 'EP123456789',
      created_at: new Date().toISOString()
    };

    const template = {
      show_date: true,
      show_contact_number: true,
      show_website: true,
      show_package_name: true,
      contact_number: '+92 300 1234567',
      website_url: 'www.kartalmart.com',
      logo_size: 'medium'
    };

    this.printTickets(testTicket, template);
  }
}

// Export for use in components
export default ThermalPrinter;
