import React, { useState, useEffect } from 'react';
import { Printer, Send as SendIcon, Download, FileText, ArrowLeft } from 'lucide-react';
import './TicketGeneration.css';

const TicketGeneration = ({ user, whatsappTab, setWhatsappTab }) => {
  const [formData, setFormData] = useState({
    customerName: '',
    contactNumber: '',
    packageId: '',
    paymentMethod: 'cash',
    transactionId: '',
    amount: 0
  });

  const [packages, setPackages] = useState([
    { id: 1, name: 'Basic Package', price: 500, description: '1 ticket' },
    { id: 2, name: 'Standard Package', price: 1200, description: '3 tickets' },
    { id: 3, name: 'Premium Package', price: 2000, description: '5 tickets' },
    { id: 4, name: 'VIP Package', price: 3500, description: '10 tickets' }
  ]);

  const [generatedTicket, setGeneratedTicket] = useState(null);
  const [showTicketPreview, setShowTicketPreview] = useState(false);
  const [receiptFile, setReceiptFile] = useState(null);
  const [scanning, setScanning] = useState(false);

  // AUTO-GENERATE TRANSACTION ID FOR CASH PAYMENTS
  useEffect(() => {
    if (formData.paymentMethod === 'cash') {
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
      const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      const autoTxId = `CASH-${dateStr}-${randomNum}`;
      setFormData(prev => ({ ...prev, transactionId: autoTxId }));
    } else {
      setFormData(prev => ({ ...prev, transactionId: '' }));
    }
  }, [formData.paymentMethod]);

  // Update amount when package changes
  useEffect(() => {
    if (formData.packageId) {
      const selectedPackage = packages.find(p => p.id === parseInt(formData.packageId));
      if (selectedPackage) {
        setFormData(prev => ({ ...prev, amount: selectedPackage.price }));
      }
    }
  }, [formData.packageId, packages]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleReceiptUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setReceiptFile(file);

    // Only scan if EasyPaisa and user has scan permission
    if (formData.paymentMethod === 'easypaisa' && user.permissions?.easypaisa_scan_mandatory) {
      setScanning(true);
      
      // Simulate OCR scanning (in real app, call backend API)
      setTimeout(() => {
        const scannedTxId = `EP${Math.floor(Math.random() * 10000000000)}`;
        alert(`Receipt scanned! Transaction ID: ${scannedTxId}`);
        setFormData(prev => ({ ...prev, transactionId: scannedTxId }));
        setScanning(false);
      }, 2000);
    }
  };

  const generateTicketNumber = () => {
    const timestamp = Date.now().toString().slice(-8);
    return `KM${timestamp}`;
  };

  const handleGenerateTicket = (e) => {
    e.preventDefault();

    // Validation
    if (!formData.customerName.trim()) {
      alert('Please enter customer name');
      return;
    }

    if (!formData.contactNumber.trim()) {
      alert('Please enter contact number');
      return;
    }

    if (!formData.packageId) {
      alert('Please select a package');
      return;
    }

    if (!formData.transactionId.trim()) {
      alert('Please enter transaction ID');
      return;
    }

    // Check if EasyPaisa receipt is mandatory
    if (formData.paymentMethod === 'easypaisa' && user.permissions?.easypaisa_receipt_mandatory && !receiptFile) {
      alert('EasyPaisa receipt upload is mandatory');
      return;
    }

    // Generate ticket
    const selectedPackage = packages.find(p => p.id === parseInt(formData.packageId));
    
    const ticket = {
      ticketNumber: generateTicketNumber(),
      customerName: formData.customerName,
      contactNumber: formData.contactNumber,
      packageName: selectedPackage.name,
      packageDescription: selectedPackage.description,
      amount: formData.amount,
      paymentMethod: formData.paymentMethod,
      transactionId: formData.transactionId,
      createdBy: user.name,
      createdAt: new Date().toLocaleString(),
      status: user.permissions?.require_admin_approval ? 'pending' : 'verified'
    };

    setGeneratedTicket(ticket);
    setShowTicketPreview(true);
  };

  const handlePrintTicket = () => {
    const printWindow = window.open('', '', 'width=400,height=600');
    
    const ticketHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Print Ticket - ${generatedTicket.ticketNumber}</title>
        <style>
          @media print {
            @page {
              size: 80mm auto;
              margin: 0;
            }
          }
          body {
            width: 80mm;
            font-family: 'Courier New', monospace;
            padding: 5mm;
            margin: 0;
          }
          .ticket-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
            border-bottom: 2px dashed #000;
            padding-bottom: 10px;
          }
          .logo {
            font-size: 14px;
            font-weight: bold;
          }
          .brand {
            font-size: 20px;
            font-weight: bold;
            text-align: right;
          }
          .ticket-number {
            text-align: center;
            font-size: 24px;
            font-weight: bold;
            margin: 15px 0;
          }
          .ticket-details {
            margin: 10px 0;
          }
          .detail-row {
            margin: 5px 0;
            display: flex;
            justify-content: space-between;
          }
          .label {
            font-weight: bold;
          }
          .footer {
            text-align: center;
            margin-top: 15px;
            padding-top: 10px;
            border-top: 2px dashed #000;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="ticket-header">
          <div class="logo">KARTAL</div>
          <div class="brand">KARTAL MART</div>
        </div>
        
        <div class="ticket-number">${generatedTicket.ticketNumber}</div>
        
        <div class="ticket-details">
          <div class="detail-row">
            <span class="label">Name:</span>
            <span>${generatedTicket.customerName}</span>
          </div>
          <div class="detail-row">
            <span class="label">Contact:</span>
            <span>${generatedTicket.contactNumber.slice(0, -3)}***</span>
          </div>
          <div class="detail-row">
            <span class="label">Package:</span>
            <span>${generatedTicket.packageName}</span>
          </div>
          <div class="detail-row">
            <span class="label">Amount:</span>
            <span>Rs. ${generatedTicket.amount}</span>
          </div>
          <div class="detail-row">
            <span class="label">TX ID:</span>
            <span>${generatedTicket.transactionId}</span>
          </div>
          <div class="detail-row">
            <span class="label">Date:</span>
            <span>${generatedTicket.createdAt}</span>
          </div>
        </div>
        
        <div class="footer">
          <div>Kartal Group of Companies</div>
          <div>www.kartalmart.com</div>
          <div>0300-1234567</div>
        </div>
      </body>
      </html>
    `;
    
    printWindow.document.write(ticketHTML);
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const handleSendWhatsApp = () => {
    const phone = generatedTicket.contactNumber.replace(/\D/g, '');
    const message = `*Kartal Mart Lucky Draw*
*Ticket(s):* ${generatedTicket.ticketNumber}
*Name:* ${generatedTicket.customerName}
*TX ID:* ${generatedTicket.transactionId}
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

  const handleDownloadPDF = () => {
    alert('PDF download functionality - install jsPDF library to enable');
  };

  const handleGenerateNew = () => {
    setShowTicketPreview(false);
    setGeneratedTicket(null);
    setFormData({
      customerName: '',
      contactNumber: '',
      packageId: '',
      paymentMethod: 'cash',
      transactionId: '',
      amount: 0
    });
    setReceiptFile(null);
  };

  const handleGoToInbox = () => {
    window.location.href = '/tickets';
  };

  // TICKET PREVIEW MODAL
  if (showTicketPreview && generatedTicket) {
    return (
      <div className="ticket-preview-container">
        <div className="ticket-preview-card">
          <div className="preview-header">
            <h2>✓ Ticket Generated Successfully!</h2>
            <div className={`status-badge status-${generatedTicket.status}`}>
              {generatedTicket.status === 'pending' ? 'Pending Approval' : 'Verified'}
            </div>
          </div>

          <div className="ticket-display">
            <div className="ticket-header-display">
              <div className="logo-display">KARTAL</div>
              <div className="brand-display">KARTAL MART</div>
            </div>
            
            <div className="ticket-number-display">{generatedTicket.ticketNumber}</div>
            
            <div className="ticket-details-display">
              <div className="detail-row-display">
                <span className="label">Name:</span>
                <span>{generatedTicket.customerName}</span>
              </div>
              <div className="detail-row-display">
                <span className="label">Contact:</span>
                <span>{generatedTicket.contactNumber.slice(0, -3)}***</span>
              </div>
              <div className="detail-row-display">
                <span className="label">Package:</span>
                <span>{generatedTicket.packageName}</span>
              </div>
              <div className="detail-row-display">
                <span className="label">Amount:</span>
                <span>Rs. {generatedTicket.amount}</span>
              </div>
              <div className="detail-row-display">
                <span className="label">TX ID:</span>
                <span>{generatedTicket.transactionId}</span>
              </div>
              <div className="detail-row-display">
                <span className="label">Date:</span>
                <span>{generatedTicket.createdAt}</span>
              </div>
            </div>
          </div>

          <div className="action-buttons">
            <button onClick={handleGenerateNew} className="btn btn-secondary">
              <FileText size={18} /> Generate New
            </button>
            <button onClick={handleSendWhatsApp} className="btn btn-success">
              <SendIcon size={18} /> Send WhatsApp
            </button>
            <button onClick={handleDownloadPDF} className="btn btn-info">
              <Download size={18} /> Download PDF
            </button>
            <button onClick={handlePrintTicket} className="btn btn-warning">
              <Printer size={18} /> Print
            </button>
            <button onClick={handleGoToInbox} className="btn btn-primary">
              <ArrowLeft size={18} /> Go to Inbox
            </button>
          </div>
        </div>
      </div>
    );
  }

  // TICKET GENERATION FORM
  return (
    <div className="ticket-generation">
      <h1>Generate Ticket</h1>

      <form onSubmit={handleGenerateTicket} className="ticket-form">
        <div className="form-group">
          <label>Customer Name *</label>
          <input
            type="text"
            name="customerName"
            value={formData.customerName}
            onChange={handleInputChange}
            placeholder="Enter customer name"
            required
          />
        </div>

        <div className="form-group">
          <label>Contact Number *</label>
          <input
            type="tel"
            name="contactNumber"
            value={formData.contactNumber}
            onChange={handleInputChange}
            placeholder="03XX-XXXXXXX"
            required
          />
        </div>

        <div className="form-group">
          <label>Package *</label>
          <select
            name="packageId"
            value={formData.packageId}
            onChange={handleInputChange}
            required
          >
            <option value="">Select a package</option>
            {packages.map(pkg => (
              <option key={pkg.id} value={pkg.id}>
                {pkg.name} - Rs. {pkg.price} ({pkg.description})
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Amount</label>
          <input
            type="number"
            name="amount"
            value={formData.amount}
            readOnly
            className="readonly-field"
          />
        </div>

        <div className="form-group">
          <label>Payment Method *</label>
          <select
            name="paymentMethod"
            value={formData.paymentMethod}
            onChange={handleInputChange}
            required
          >
            <option value="cash">Cash</option>
            <option value="easypaisa">EasyPaisa</option>
            <option value="bank_transfer">Bank Transfer</option>
          </select>
        </div>

        <div className="form-group">
          <label>Transaction ID *</label>
          <input
            type="text"
            name="transactionId"
            value={formData.transactionId}
            onChange={handleInputChange}
            placeholder={formData.paymentMethod === 'cash' ? 'Auto-generated' : 'Enter transaction ID'}
            readOnly={formData.paymentMethod === 'cash'}
            className={formData.paymentMethod === 'cash' ? 'readonly-field' : ''}
            required
          />
          {formData.paymentMethod === 'cash' && (
            <small className="help-text">✓ Transaction ID auto-generated for cash payments</small>
          )}
        </div>

        {formData.paymentMethod === 'easypaisa' && (
          <div className="form-group">
            <label>
              EasyPaisa Receipt 
              {user.permissions?.easypaisa_receipt_mandatory && ' *'}
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleReceiptUpload}
              required={user.permissions?.easypaisa_receipt_mandatory}
            />
            {scanning && <div className="scanning-indicator">🔍 Scanning receipt...</div>}
            {receiptFile && <div className="file-selected">✓ Receipt uploaded</div>}
          </div>
        )}

        <button type="submit" className="btn btn-primary btn-large">
          Generate Ticket
        </button>
      </form>
    </div>
  );
};

export default TicketGeneration;
