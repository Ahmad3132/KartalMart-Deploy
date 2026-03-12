/**
 * EasyPaisa Receipt Scanner API
 * Backend endpoint for OCR and transaction validation
 */

const express = require('express');
const multer = require('multer');
const Tesseract = require('tesseract.js');
const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = 'uploads/receipts';
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'receipt-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only image files (JPG, PNG, WEBP) are allowed'));
  }
});

/**
 * POST /api/scan-receipt
 * Scan EasyPaisa receipt and verify transaction ID
 */
router.post('/scan-receipt', upload.single('receipt'), async (req, res) => {
  let processedImagePath = null;
  
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'NO_FILE',
        message: 'No receipt image uploaded'
      });
    }

    const { user_entered_tx_id, ticket_id } = req.body;
    
    if (!user_entered_tx_id) {
      return res.status(400).json({
        error: 'MISSING_TX_ID',
        message: 'Transaction ID is required'
      });
    }

    const receiptPath = req.file.path;

    // Preprocess image for better OCR results
    processedImagePath = await preprocessImage(receiptPath);

    // Perform OCR
    const extractedText = await performOCR(processedImagePath);
    
    // Extract transaction ID from text
    const scannedTxId = extractTransactionID(extractedText);
    
    if (!scannedTxId) {
      // Clean up files
      await cleanupFiles([receiptPath, processedImagePath]);
      
      return res.status(400).json({
        error: 'SCAN_FAILED',
        message: 'Could not extract Transaction ID from receipt. Please ensure the image is clear and the Transaction ID is visible.'
      });
    }

    // Compare scanned TX ID with user-entered TX ID
    if (!transactionIDsMatch(scannedTxId, user_entered_tx_id)) {
      // Clean up files
      await cleanupFiles([receiptPath, processedImagePath]);
      
      return res.status(400).json({
        error: 'MISMATCH',
        message: `Transaction ID mismatch. Receipt shows "${scannedTxId}" but you entered "${user_entered_tx_id}"`,
        scanned_tx_id: scannedTxId
      });
    }

    // Check if TX ID already exists in database
    const db = req.app.get('db'); // Assuming DB connection is attached to app
    const existingTicket = await db.query(
      `SELECT id, ticket_number, customer_name 
       FROM tickets 
       WHERE transaction_id = ? AND id != ?`,
      [scannedTxId, ticket_id || 0]
    );

    if (existingTicket.length > 0) {
      // Clean up files
      await cleanupFiles([receiptPath, processedImagePath]);
      
      return res.status(400).json({
        error: 'ALREADY_GENERATED',
        message: `This transaction ID was already used for ticket ${existingTicket[0].ticket_number}`,
        existing_ticket: existingTicket[0].ticket_number
      });
    }

    // Success - save receipt info
    const receiptRecord = await db.query(
      `INSERT INTO receipt_scans (ticket_id, transaction_id, receipt_path, scanned_at) 
       VALUES (?, ?, ?, NOW())`,
      [ticket_id, scannedTxId, receiptPath]
    );

    res.json({
      success: true,
      scanned_tx_id: scannedTxId,
      verified: true,
      receipt_id: receiptRecord.insertId
    });

  } catch (error) {
    console.error('Receipt scan error:', error);
    
    // Clean up files on error
    if (req.file) {
      await cleanupFiles([req.file.path, processedImagePath]);
    }
    
    res.status(500).json({
      error: 'SCAN_ERROR',
      message: 'Failed to process receipt. Please try again.'
    });
  }
});

/**
 * Preprocess image for better OCR accuracy
 */
async function preprocessImage(imagePath) {
  const processedPath = imagePath.replace(/(\.[^.]+)$/, '-processed$1');
  
  await sharp(imagePath)
    .resize(2000, null, { // Resize to width 2000px, maintain aspect ratio
      fit: 'inside',
      withoutEnlargement: true
    })
    .grayscale() // Convert to grayscale
    .normalize() // Normalize contrast
    .sharpen() // Sharpen text
    .toFile(processedPath);
  
  return processedPath;
}

/**
 * Perform OCR on image
 */
async function performOCR(imagePath) {
  const { data: { text } } = await Tesseract.recognize(imagePath, 'eng', {
    logger: info => console.log(info) // Optional: log progress
  });
  
  return text;
}

/**
 * Extract transaction ID from OCR text
 * Tries multiple patterns for EasyPaisa receipts
 */
function extractTransactionID(text) {
  // Common patterns for EasyPaisa transaction IDs
  const patterns = [
    /Transaction\s*ID[:\s]*([A-Z0-9]+)/i,
    /TID[:\s]*([A-Z0-9]+)/i,
    /Ref(?:erence)?[:\s]*([A-Z0-9]+)/i,
    /TXID[:\s]*([A-Z0-9]+)/i,
    /Transaction\s*Reference[:\s]*([A-Z0-9]+)/i,
    /EP[0-9]{10,}/i, // EasyPaisa format: EP followed by numbers
    /[0-9]{10,15}/, // Fallback: any 10-15 digit number
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1] || match[0];
    }
  }

  return null;
}

/**
 * Compare two transaction IDs (case-insensitive, ignore spaces/dashes)
 */
function transactionIDsMatch(id1, id2) {
  const normalize = (id) => id.replace(/[\s-]/g, '').toUpperCase();
  return normalize(id1) === normalize(id2);
}

/**
 * Clean up temporary files
 */
async function cleanupFiles(filePaths) {
  for (const filePath of filePaths) {
    if (filePath) {
      try {
        await fs.unlink(filePath);
      } catch (error) {
        console.error('Error deleting file:', filePath, error);
      }
    }
  }
}

/**
 * GET /api/receipts/:ticketId
 * Get receipt info for a ticket
 */
router.get('/receipts/:ticketId', async (req, res) => {
  try {
    const db = req.app.get('db');
    const { ticketId } = req.params;
    
    const receipts = await db.query(
      `SELECT id, transaction_id, receipt_path, scanned_at 
       FROM receipt_scans 
       WHERE ticket_id = ?`,
      [ticketId]
    );
    
    res.json(receipts);
  } catch (error) {
    console.error('Error fetching receipts:', error);
    res.status(500).json({ error: 'Failed to fetch receipts' });
  }
});

/**
 * DELETE /api/receipts/:receiptId
 * Delete a receipt scan
 */
router.delete('/receipts/:receiptId', async (req, res) => {
  try {
    const db = req.app.get('db');
    const { receiptId } = req.params;
    
    // Get receipt path before deleting
    const receipt = await db.query(
      'SELECT receipt_path FROM receipt_scans WHERE id = ?',
      [receiptId]
    );
    
    if (receipt.length > 0) {
      // Delete file
      await cleanupFiles([receipt[0].receipt_path]);
      
      // Delete database record
      await db.query('DELETE FROM receipt_scans WHERE id = ?', [receiptId]);
      
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Receipt not found' });
    }
  } catch (error) {
    console.error('Error deleting receipt:', error);
    res.status(500).json({ error: 'Failed to delete receipt' });
  }
});

module.exports = router;
