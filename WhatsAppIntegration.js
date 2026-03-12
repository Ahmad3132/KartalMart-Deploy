/**
 * WhatsApp Integration Utility for Kartal Mart
 * Handles sending ticket details via WhatsApp with proper tab management
 */

export class WhatsAppIntegration {
  // Store reference to WhatsApp tab
  static whatsappTab = null;

  /**
   * Send ticket details to customer via WhatsApp
   * @param {Object} ticket - Ticket object with customer details
   * @param {boolean} reuseTab - Whether to reuse existing WhatsApp tab (default: true)
   */
  static sendTicketDetails(ticket, reuseTab = true) {
    const message = this.formatTicketMessage(ticket);
    const phoneNumber = this.formatPhoneNumber(ticket.phone);
    
    this.openWhatsApp(phoneNumber, message, reuseTab);
  }

  /**
   * Send multiple tickets in sequence
   * @param {Array} tickets - Array of ticket objects
   */
  static async sendMultipleTickets(tickets) {
    for (let i = 0; i < tickets.length; i++) {
      const ticket = tickets[i];
      this.sendTicketDetails(ticket, true);
      
      // Wait 2 seconds between messages to avoid rate limiting
      if (i < tickets.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }

  /**
   * Send verification message after scanning ticket
   * @param {Object} ticket - Ticket object
   * @param {string} videoLink - Optional link to verification video
   */
  static sendVerificationMessage(ticket, videoLink = '') {
    const message = this.formatVerificationMessage(ticket, videoLink);
    const phoneNumber = this.formatPhoneNumber(ticket.phone);
    
    this.openWhatsApp(phoneNumber, message, true);
  }

  /**
   * Format ticket details message
   */
  static formatTicketMessage(ticket) {
    return `*Kartal Mart Lucky Draw*

*Ticket(s):* ${ticket.ticket_number}
*Name:* ${ticket.customer_name}
*TX ID:* ${ticket.transaction_id}

_Please wait for verification and keep these ticket(s) safe._
_Kartal Group of Companies_`;
  }

  /**
   * Format verification message for scanned tickets
   */
  static formatVerificationMessage(ticket, videoLink) {
    let message = `*Kartal Mart - Ticket Verified*

Your ticket *${ticket.ticket_number}* has been verified and put in the box.`;

    if (videoLink) {
      message += `\n\n📹 Verification Video: ${videoLink}`;
    }

    message += `\n\n_Thank you for participating!_
_Kartal Group of Companies_`;

    return message;
  }

  /**
   * Format phone number for WhatsApp
   * Removes all non-numeric characters and ensures proper format
   */
  static formatPhoneNumber(phone) {
    if (!phone) return '';
    
    // Remove all non-numeric characters
    let cleaned = phone.replace(/[^0-9]/g, '');
    
    // Add country code if not present
    if (!cleaned.startsWith('92')) {
      // Remove leading zero if present
      if (cleaned.startsWith('0')) {
        cleaned = cleaned.substring(1);
      }
      // Add Pakistan country code
      cleaned = '92' + cleaned;
    }
    
    return cleaned;
  }

  /**
   * Open WhatsApp with message
   * Implements proper tab reuse to avoid multiple popups
   */
  static openWhatsApp(phoneNumber, message, reuseTab = true) {
    const encodedMessage = encodeURIComponent(message);
    const whatsappURL = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;

    if (reuseTab) {
      // Check if tab exists and is still open
      if (!this.whatsappTab || this.whatsappTab.closed) {
        // Create new tab
        this.whatsappTab = window.open(whatsappURL, 'kartal_whatsapp');
        
        if (!this.whatsappTab) {
          alert('Please allow popups to send WhatsApp messages');
          return false;
        }
      } else {
        // Reuse existing tab
        this.whatsappTab.location.href = whatsappURL;
        this.whatsappTab.focus();
      }
    } else {
      // Always open in new tab
      window.open(whatsappURL, '_blank');
    }

    return true;
  }

  /**
   * Send marketing campaign message to multiple recipients
   * @param {Array} recipients - Array of phone numbers
   * @param {string} message - Campaign message
   * @param {function} onProgress - Callback for progress updates
   */
  static async sendBulkMessages(recipients, message, onProgress) {
    const results = {
      sent: 0,
      failed: 0,
      total: recipients.length
    };

    for (let i = 0; i < recipients.length; i++) {
      const phoneNumber = this.formatPhoneNumber(recipients[i]);
      
      try {
        this.openWhatsApp(phoneNumber, message, true);
        results.sent++;
        
        if (onProgress) {
          onProgress({
            current: i + 1,
            total: recipients.length,
            sent: results.sent,
            failed: results.failed
          });
        }

        // Wait 3 seconds between messages to comply with WhatsApp limits
        if (i < recipients.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      } catch (error) {
        console.error('Failed to send to', phoneNumber, error);
        results.failed++;
      }
    }

    return results;
  }

  /**
   * Create WhatsApp button component (React)
   */
  static createButton(ticket, options = {}) {
    const {
      className = 'whatsapp-btn',
      icon = '📱',
      text = 'Send to WhatsApp',
      onClick = null
    } = options;

    return `
      <button 
        class="${className}"
        onclick="${onClick ? onClick.toString() : `WhatsAppIntegration.sendTicketDetails(${JSON.stringify(ticket)})`}"
      >
        <span class="icon">${icon}</span>
        <span class="text">${text}</span>
      </button>
    `;
  }

  /**
   * Test WhatsApp integration
   */
  static test() {
    const testTicket = {
      ticket_number: 'TEST-12345',
      customer_name: 'Test Customer',
      transaction_id: 'EP123456789',
      phone: '03001234567'
    };

    console.log('Testing WhatsApp integration...');
    console.log('Formatted message:', this.formatTicketMessage(testTicket));
    console.log('Formatted phone:', this.formatPhoneNumber(testTicket.phone));
    
    const confirm = window.confirm('Send test WhatsApp message?');
    if (confirm) {
      this.sendTicketDetails(testTicket);
    }
  }
}

/**
 * React Component for WhatsApp Button
 */
export const WhatsAppButton = ({ ticket, variant = 'primary', size = 'medium', onSent }) => {
  const handleClick = () => {
    const success = WhatsAppIntegration.sendTicketDetails(ticket);
    if (success && onSent) {
      onSent(ticket);
    }
  };

  const sizeClasses = {
    small: 'whatsapp-btn-sm',
    medium: 'whatsapp-btn-md',
    large: 'whatsapp-btn-lg'
  };

  const variantClasses = {
    primary: 'whatsapp-btn-primary',
    secondary: 'whatsapp-btn-secondary',
    success: 'whatsapp-btn-success'
  };

  return (
    <button
      className={`whatsapp-btn ${sizeClasses[size]} ${variantClasses[variant]}`}
      onClick={handleClick}
    >
      <svg 
        className="whatsapp-icon" 
        viewBox="0 0 24 24" 
        fill="currentColor"
      >
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
      <span>Send to WhatsApp</span>
    </button>
  );
};

// Export for use in components
export default WhatsAppIntegration;
