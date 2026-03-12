import React, { useState, useRef } from 'react';
import { Upload, CheckCircle, XCircle, AlertTriangle, Loader } from 'lucide-react';
import './ReceiptScanner.css';

const ReceiptScanner = ({ 
  transactionId, 
  ticketId, 
  onSuccess, 
  onError,
  mandatory = true 
}) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(selectedFile.type)) {
      setError('Please upload a valid image file (JPG, PNG, or WEBP)');
      return;
    }

    // Validate file size (max 5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setFile(selectedFile);
    setError(null);
    setResult(null);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(selectedFile);

    // Auto-scan if enabled
    scanReceipt(selectedFile);
  };

  const scanReceipt = async (fileToScan) => {
    const uploadFile = fileToScan || file;
    if (!uploadFile) return;

    setScanning(true);
    setError(null);

    const formData = new FormData();
    formData.append('receipt', uploadFile);
    formData.append('user_entered_tx_id', transactionId);
    formData.append('ticket_id', ticketId || '');

    try {
      const response = await fetch('/api/scan-receipt', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle different error types
        if (data.error === 'MISMATCH') {
          setError({
            type: 'mismatch',
            message: data.message,
            scannedId: data.scanned_tx_id
          });
          if (onError) onError(data);
        } else if (data.error === 'ALREADY_GENERATED') {
          setError({
            type: 'duplicate',
            message: data.message,
            existingTicket: data.existing_ticket
          });
          if (onError) onError(data);
        } else if (data.error === 'SCAN_FAILED') {
          setError({
            type: 'scan_failed',
            message: 'Could not read Transaction ID from receipt. Please ensure the image is clear.'
          });
          if (onError) onError(data);
        } else {
          setError({
            type: 'general',
            message: data.message || 'Failed to process receipt'
          });
          if (onError) onError(data);
        }
        setFile(null);
        setPreview(null);
      } else {
        // Success
        setResult({
          verified: true,
          scannedId: data.scanned_tx_id,
          fileName: uploadFile.name
        });
        if (onSuccess) onSuccess(data);
      }
    } catch (error) {
      console.error('Receipt scan error:', error);
      setError({
        type: 'network',
        message: 'Network error. Please check your connection and try again.'
      });
      if (onError) onError({ error: 'NETWORK_ERROR' });
    } finally {
      setScanning(false);
    }
  };

  const resetUpload = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getErrorIcon = () => {
    if (!error) return null;
    
    switch (error.type) {
      case 'mismatch':
        return <AlertTriangle size={24} className="error-icon warning" />;
      case 'duplicate':
        return <XCircle size={24} className="error-icon danger" />;
      default:
        return <XCircle size={24} className="error-icon danger" />;
    }
  };

  return (
    <div className="receipt-scanner">
      <div className="scanner-header">
        <h3>
          EasyPaisa Receipt Upload
          {mandatory && <span className="required">*</span>}
        </h3>
        <p className="scanner-subtitle">
          Upload your EasyPaisa payment receipt for verification
        </p>
      </div>

      {/* Upload Area */}
      {!file && !result && (
        <div 
          className="upload-area"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload size={48} className="upload-icon" />
          <p className="upload-text">Click to upload receipt</p>
          <p className="upload-hint">JPG, PNG or WEBP (max 5MB)</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
        </div>
      )}

      {/* Scanning State */}
      {scanning && (
        <div className="scanning-state">
          <Loader size={48} className="spinner" />
          <p>Scanning receipt...</p>
          <p className="scan-details">Verifying Transaction ID</p>
        </div>
      )}

      {/* Preview & Result */}
      {preview && !scanning && (
        <div className="receipt-preview">
          <img src={preview} alt="Receipt preview" />
          {!result && !error && (
            <button className="retry-btn" onClick={resetUpload}>
              Change Image
            </button>
          )}
        </div>
      )}

      {/* Success State */}
      {result && result.verified && (
        <div className="scan-result success">
          <CheckCircle size={48} className="result-icon success" />
          <h4>Receipt Verified Successfully!</h4>
          <div className="result-details">
            <p><strong>Transaction ID:</strong> {result.scannedId}</p>
            <p><strong>File:</strong> {result.fileName}</p>
          </div>
          <button className="change-btn" onClick={resetUpload}>
            Upload Different Receipt
          </button>
        </div>
      )}

      {/* Error States */}
      {error && (
        <div className={`scan-result error ${error.type}`}>
          {getErrorIcon()}
          <h4>Verification Failed</h4>
          <p className="error-message">{error.message}</p>
          
          {error.type === 'mismatch' && error.scannedId && (
            <div className="error-details">
              <p><strong>Receipt shows:</strong> {error.scannedId}</p>
              <p><strong>You entered:</strong> {transactionId}</p>
            </div>
          )}

          {error.type === 'duplicate' && error.existingTicket && (
            <div className="error-details">
              <p>This Transaction ID was already used for:</p>
              <p><strong>Ticket:</strong> {error.existingTicket}</p>
            </div>
          )}

          <button className="retry-btn" onClick={resetUpload}>
            Try Again
          </button>
        </div>
      )}

      {/* Help Text */}
      <div className="scanner-help">
        <h5>Tips for best results:</h5>
        <ul>
          <li>✓ Ensure the receipt is clear and well-lit</li>
          <li>✓ Transaction ID should be visible</li>
          <li>✓ Avoid blurry or cropped images</li>
          <li>✓ Make sure the entire receipt is in frame</li>
        </ul>
      </div>
    </div>
  );
};

export default ReceiptScanner;
