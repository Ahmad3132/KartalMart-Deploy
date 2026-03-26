export interface ReceiptData {
  txId: string;
  date: string;
  amount: string;
  sendTo: string;
  sentBy: string;
  accountDetails: string;
  rawText: string;
}

/**
 * Extract receipt data from an EasyPaisa receipt image using Tesseract.js (browser-side OCR).
 * Tesseract WASM (~3MB) is lazy-loaded and cached by the browser after first use.
 */
export async function extractReceiptData(
  imageFile: File,
  onProgress?: (progress: number) => void
): Promise<ReceiptData> {
  const { createWorker } = await import('tesseract.js');
  const worker = await createWorker('eng', undefined, {
    logger: (m: any) => {
      if (m.status === 'recognizing text' && onProgress) {
        onProgress(m.progress);
      }
    },
  });

  const { data: { text } } = await worker.recognize(imageFile);
  await worker.terminate();

  return parseReceiptText(text);
}

function parseReceiptText(text: string): ReceiptData {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const joined = lines.join(' ');

  // Transaction ID patterns
  const txIdPatterns = [
    /(?:Transaction\s*(?:ID|Id|id)|Trans(?:action)?\s*#|TX\s*ID|TID)[:\s]*([A-Za-z0-9]+)/i,
    /(?:ID)[:\s]*(\d{8,})/i,
    /(\d{10,14})/,
  ];
  let txId = '';
  for (const p of txIdPatterns) {
    const m = joined.match(p);
    if (m) { txId = m[1].trim(); break; }
  }

  // Amount
  const amountMatch = joined.match(/(?:Rs\.?|PKR|Amount)[:\s]*([\d,]+(?:\.\d{1,2})?)/i);
  const amount = amountMatch ? amountMatch[1].replace(/,/g, '') : '';

  // Date
  const dateMatch = joined.match(/(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}(?:\s+\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM)?)?)/i);
  const date = dateMatch ? dateMatch[1] : '';

  // Send to / Sent by
  const sendToMatch = joined.match(/(?:Send\s*(?:to|To)|Receiver|Recipient|To)[:\s]*([A-Za-z\s]+?)(?:\d|$|Send|Sent|Amount|Rs)/i);
  const sendTo = sendToMatch ? sendToMatch[1].trim() : '';

  const sentByMatch = joined.match(/(?:Sent?\s*(?:by|By|from)|Sender|From)[:\s]*([A-Za-z\s]+?)(?:\d|$|Send|Amount|Rs)/i);
  const sentBy = sentByMatch ? sentByMatch[1].trim() : '';

  // Account details
  const accountMatch = joined.match(/(?:Account|A\/C|Acct)[:\s]*([0-9*X]+(?:[-\s][0-9*X]+)*)/i);
  const accountDetails = accountMatch ? accountMatch[1].trim() : '';

  return { txId, date, amount, sendTo, sentBy, accountDetails, rawText: text };
}

/**
 * Compare a user-entered TX ID with the OCR-extracted one.
 * Returns 'match', 'mismatch', or 'no_ocr'.
 */
export function compareTransactionIds(
  userTxId: string,
  ocrTxId: string
): 'match' | 'mismatch' | 'no_ocr' {
  if (!ocrTxId) return 'no_ocr';
  const clean = (s: string) => s.replace(/[\s\-]/g, '').toLowerCase();
  return clean(userTxId) === clean(ocrTxId) ? 'match' : 'mismatch';
}
