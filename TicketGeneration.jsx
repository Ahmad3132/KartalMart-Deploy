import React, { useState, useRef } from 'react';
import { ArrowLeft, Upload, Send, Printer, AlertCircle, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Tesseract from 'tesseract.js';
import './TicketGeneration.css';

function TicketGeneration({ user, whatsappTab, setWhatsappTab }) {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    customerName: '',
    contactNumber: '',
    packageName: '',
    transactionId: '',
    paymentMethod: 'cash',
    receipt: null
  });
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [errors, setErrors] = useState({});
  const [multiPersonData, setMultiPersonData] = useState([]);

  const packages = [
    { id: 1, name: 'Premium Package', price: 2000 },
    { id: 2, name: 'Standard Package', price: 1500 },
    { id: 3, name: 'Basic Package', price: 1000 },
    { id: 4, name: 'Special Offer', price: 500 }
  ];

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFormData({ ...formData, receipt: file });
    
    if (user.permissions.easypaisaScanMandatory && formData.paymentMethod === 'easypaisa') {
      await scanReceipt(file);
    }
  };

  const scanReceipt = async (file) => {
    setIsScanning(true);
    setScanResult(null);
    
    try {
      const result = await Tesseract.recognize(file, 'eng', {
        logger: info => console.log(info)
      });

      const text = result.data.text;
      console.log('Scanned text:', text);

      // Extract transaction ID from scanned text
      // This regex looks for common transaction ID patterns
      const txIdPatterns = [
        /Transaction\s*ID:?\s*([A-Z0-9]+)/i,
        /TX\s*ID:?\s*([A-Z0-9]+)/i,
        /Reference:?\s*([A-Z0-9]+)/i,
        /\b([A-Z0-9]{10,})\b/i
      ];

      let extractedTxId = null;
      for (const pattern of txIdPatterns) {
        const match = text.match(pattern);
        if (match) {
          extractedTxId = match[1];
          break;
        }
      }

      if (extractedTxId) {
        setScanResult({
          success: true,
          txId: extractedTxId,
          message: 'Transaction ID extracted successfully'
        });

        // Verify TX ID matches user input if already entered
        if (formData.transactionId && formData.transactionId !== extractedTxId) {
          setErrors({
            ...errors,
            transactionId: 'Transaction ID mismatch! Scanned ID does not match your input.'
          });
          setScanResult({
            success: false,
            message: `Mismatch Error: You entered "${formData.transactionId}" but scanned receipt shows "${extractedTxId}"`
          });
        } else {
          setFormData({ ...formData, transactionId: extractedTxId });
        }

        // Check if TX ID already exists in database
        await checkDuplicateTxId(extractedTxId);
      } else {
        setScanResult({
          success: false,
          message: 'Could not extract Transaction ID from receipt. Please verify image quality.'
        });
      }
    } catch (error) {
      console.error('OCR Error:', error);
      setScanResult({
        success: false,
        message: 'Error scanning receipt. Please try again with a clearer image.'
      });
    } finally {
      setIsScanning(false);
    }
  };

  const checkDuplicateTxId = async (txId) => {
    // Mock API call - replace with actual database check
    const existingTickets = JSON.parse(localStorage.getItem('tickets') || '[]');
    const duplicate = existingTickets.find(ticket => ticket.transactionId === txId);

    if (duplicate && !user.permissions.allowDuplicateTxId) {
      setErrors({
        ...errors,
        transactionId: 'Duplicate Transaction ID! This transaction has already been used for a ticket.'
      });
      setScanResult({
        success: false,
        message: `Duplicate Transaction: TX ID "${txId}" already exists in the system (Ticket #${duplicate.ticketNumber})`
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    // Validation
    if (!formData.customerName) newErrors.customerName = 'Customer name is required';
    if (!formData.contactNumber) newErrors.contactNumber = 'Contact number is required';
    if (!formData.packageName) newErrors.packageName = 'Please select a package';
    if (!formData.transactionId) newErrors.transactionId = 'Transaction ID is required';

    // EasyPaisa validation
    if (formData.paymentMethod === 'easypaisa') {
      if (user.permissions.easypaisaMandatory && !formData.receipt) {
        newErrors.receipt = 'Receipt upload is mandatory for EasyPaisa payments';
      }
      if (user.permissions.easypaisaScanMandatory && !scanResult?.success) {
        newErrors.receipt = 'Receipt must be scanned and verified before submission';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Check duplicate TX ID
    if (!user.permissions.allowDuplicateTxId) {
      const existingTickets = JSON.parse(localStorage.getItem('tickets') || '[]');
      const duplicate = existingTickets.find(ticket => ticket.transactionId === formData.transactionId);
      if (duplicate) {
        alert('Duplicate Transaction ID Error: This transaction ID has already been used.');
        return;
      }
    }

    // Create ticket
    const ticket = {
      id: Date.now(),
      ticketNumber: `KM${Date.now().toString().slice(-8)}`,
      ...formData,
      status: user.permissions.requireAdminApproval ? 'pending' : 'verified',
      createdBy: user.username,
      createdAt: new Date().toISOString(),
      printed: false
    };

    // Save ticket
    const tickets = JSON.parse(localStorage.getItem('tickets') || '[]');
    tickets.push(ticket);
    localStorage.setItem('tickets', JSON.stringify(tickets));

    // Send to WhatsApp
    await sendWhatsAppMessage(ticket);

    // Print ticket
    printTicket(ticket);

    alert('Ticket generated successfully!');
    
    // Reset form
    setFormData({
      customerName: '',
      contactNumber: '',
      packageName: '',
      transactionId: '',
      paymentMethod: 'cash',
      receipt: null
    });
    setScanResult(null);
    setErrors({});
  };

  const sendWhatsAppMessage = async (ticket) => {
    const phone = ticket.contactNumber.replace(/\D/g, '');
    const message = `*Kartal Mart Lucky Draw*
*Ticket(s):* ${ticket.ticketNumber}
*Name:* ${ticket.customerName}
*TX ID:* ${ticket.transactionId}
_Please wait for verification and keep these ticket(s) safe._
_Kartal Group of Companies_`;

    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

    // Reuse existing tab or open new one
    if (whatsappTab && !whatsappTab.closed) {
      whatsappTab.location.href = whatsappUrl;
      whatsappTab.focus();
    } else {
      const newTab = window.open(whatsappUrl, 'whatsapp_tab');
      setWhatsappTab(newTab);
    }
  };

  const printTicket = (ticket) => {
    // Get ticket template settings
    const settings = JSON.parse(localStorage.getItem('ticketSettings') || '{}');
    
    // Create print content
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
      const tickets = JSON.parse(localStorage.getItem('tickets') || '[]');
      const index = tickets.findIndex(t => t.id === ticket.id);
      if (index !== -1) {
        tickets[index].printed = true;
        localStorage.setItem('tickets', JSON.stringify(tickets));
      }
    }, 500);
  };

  return (
    <div className="ticket-generation-page">
      <header className="page-header">
        <button className="back-btn" onClick={() => navigate('/dashboard')}>
          <ArrowLeft size={20} />
          Back
        </button>
        <h1>Generate New Ticket</h1>
      </header>

      <div className="page-content">
        <form onSubmit={handleSubmit} className="ticket-form">
          <div className="form-section">
            <h3>Customer Information</h3>
            
            <div className="form-group">
              <label>Customer Name *</label>
              <input
                type="text"
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                placeholder="Enter customer name"
              />
              {errors.customerName && <span className="error">{errors.customerName}</span>}
            </div>

            <div className="form-group">
              <label>Contact Number *</label>
              <input
                type="text"
                value={formData.contactNumber}
                onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                placeholder="03XX-XXXXXXX"
              />
              {errors.contactNumber && <span className="error">{errors.contactNumber}</span>}
            </div>

            <div className="form-group">
              <label>Package *</label>
              <select
                value={formData.packageName}
                onChange={(e) => setFormData({ ...formData, packageName: e.target.value })}
              >
                <option value="">Select a package</option>
                {packages.map(pkg => (
                  <option key={pkg.id} value={pkg.name}>
                    {pkg.name} - Rs {pkg.price}
                  </option>
                ))}
              </select>
              {errors.packageName && <span className="error">{errors.packageName}</span>}
            </div>
          </div>

          <div className="form-section">
            <h3>Payment Information</h3>

            <div className="form-group">
              <label>Payment Method *</label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
              >
                <option value="cash">Cash</option>
                <option value="easypaisa">EasyPaisa</option>
              </select>
            </div>

            <div className="form-group">
              <label>Transaction ID *</label>
              <input
                type="text"
                value={formData.transactionId}
                onChange={(e) => setFormData({ ...formData, transactionId: e.target.value })}
                placeholder="Enter transaction ID"
              />
              {errors.transactionId && <span className="error">{errors.transactionId}</span>}
            </div>

            {formData.paymentMethod === 'easypaisa' && (
              <div className="form-group">
                <label>
                  EasyPaisa Receipt {user.permissions.easypaisaMandatory && '*'}
                </label>
                <div className="file-upload-area">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    className="upload-btn"
                    onClick={() => fileInputRef.current.click()}
                  >
                    <Upload size={20} />
                    {formData.receipt ? formData.receipt.name : 'Upload Receipt'}
                  </button>
                </div>
                {errors.receipt && <span className="error">{errors.receipt}</span>}

                {isScanning && (
                  <div className="scanning-indicator">
                    <div className="spinner"></div>
                    <span>Scanning receipt...</span>
                  </div>
                )}

                {scanResult && (
                  <div className={`scan-result ${scanResult.success ? 'success' : 'error'}`}>
                    {scanResult.success ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                    <span>{scanResult.message}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <button type="submit" className="submit-btn">
            <Printer size={20} />
            Generate & Print Ticket
          </button>
        </form>
      </div>
    </div>
  );
}

export default TicketGeneration;
