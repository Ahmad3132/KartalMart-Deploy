import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Camera, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import jsQR from 'jsqr';
import './Scanner.css';

function Scanner({ user, whatsappTab, setWhatsappTab }) {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedTicket, setScannedTicket] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user.permissions?.allowScanner) {
      alert('You do not have permission to access the scanner');
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      videoRef.current.srcObject = stream;
      videoRef.current.play();
      setIsScanning(true);
      setError('');
      scanQRCode();
    } catch (err) {
      setError('Could not access camera. Please grant camera permissions.');
      console.error(err);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  };

  const scanQRCode = () => {
    if (!isScanning) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.height = video.videoHeight;
      canvas.width = video.videoWidth;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code) {
        // Found QR code
        const ticketNumber = code.data;
        verifyTicket(ticketNumber);
        stopCamera();
        return;
      }
    }

    requestAnimationFrame(scanQRCode);
  };

  const verifyTicket = (ticketNumber) => {
    // Get ticket from database
    const tickets = JSON.parse(localStorage.getItem('tickets') || '[]');
    const ticket = tickets.find(t => t.ticketNumber === ticketNumber);

    if (ticket) {
      setScannedTicket(ticket);
    } else {
      setError('Ticket not found in the system');
    }
  };

  const sendVerificationWhatsApp = () => {
    if (!scannedTicket) return;

    const phone = scannedTicket.contactNumber.replace(/\D/g, '');
    const message = `Your ticket has been verified and put in the box and here is the video.`;

    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

    // Reuse existing tab or open new one
    if (whatsappTab && !whatsappTab.closed) {
      whatsappTab.location.href = whatsappUrl;
      whatsappTab.focus();
    } else {
      const newTab = window.open(whatsappUrl, 'whatsapp_tab');
      setWhatsappTab(newTab);
    }

    alert('Verification message sent to customer');
  };

  return (
    <div className="scanner-page">
      <header className="page-header">
        <button className="back-btn" onClick={() => navigate('/dashboard')}>
          <ArrowLeft size={20} />
          Back
        </button>
        <h1>Ticket Scanner</h1>
      </header>

      <div className="page-content">
        <div className="scanner-container">
          <div className="scanner-box">
            {!isScanning && !scannedTicket && (
              <div className="scanner-placeholder">
                <Camera size={80} color="#ccc" />
                <p>Click below to start scanning</p>
                <button className="start-scan-btn" onClick={startCamera}>
                  <Camera size={20} />
                  Start Camera
                </button>
              </div>
            )}

            {isScanning && (
              <div className="video-container">
                <video ref={videoRef} />
                <canvas ref={canvasRef} style={{ display: 'none' }} />
                <div className="scan-overlay">
                  <div className="scan-frame"></div>
                  <p>Position QR code within the frame</p>
                </div>
                <button className="stop-scan-btn" onClick={stopCamera}>
                  Stop Scanning
                </button>
              </div>
            )}

            {scannedTicket && (
              <div className="ticket-details">
                <div className="success-icon">✓</div>
                <h2>Ticket Verified</h2>
                <div className="detail-row">
                  <span className="label">Ticket Number:</span>
                  <span className="value">{scannedTicket.ticketNumber}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Customer Name:</span>
                  <span className="value">{scannedTicket.customerName}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Package:</span>
                  <span className="value">{scannedTicket.packageName}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Status:</span>
                  <span className={`status ${scannedTicket.status}`}>
                    {scannedTicket.status}
                  </span>
                </div>

                <div className="action-buttons">
                  <button className="whatsapp-btn" onClick={sendVerificationWhatsApp}>
                    <Send size={20} />
                    Send WhatsApp Verification
                  </button>
                  <button 
                    className="scan-another-btn" 
                    onClick={() => {
                      setScannedTicket(null);
                      startCamera();
                    }}
                  >
                    Scan Another Ticket
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="error-message">
                <p>{error}</p>
                <button onClick={() => setError('')}>Dismiss</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Scanner;
