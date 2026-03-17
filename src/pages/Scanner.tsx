import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Search, Ticket, User, Phone, MapPin, Calendar, CheckCircle, XCircle, MessageSquare } from 'lucide-react';
import { formatWANumber } from '../utils/api';

export default function Scanner() {
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [ticketData, setTicketData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [scannerReady, setScannerReady] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    // Small delay to ensure DOM element exists
    const timer = setTimeout(() => {
      try {
        const scanner = new Html5QrcodeScanner('reader', {
          qrbox: { width: 250, height: 250 },
          fps: 5,
          rememberLastUsedCamera: true,
          showTorchButtonIfSupported: true,
        }, false);

        scannerRef.current = scanner;

        scanner.render(onScanSuccess, onScanError);
        setScannerReady(true);

        function onScanSuccess(result: string) {
          scanner.clear().catch(() => {});
          // Parse QR code - could be JSON or plain ticket ID
          let ticketId = result;
          try {
            const parsed = JSON.parse(result);
            if (parsed.id) ticketId = parsed.id;
          } catch {
            // Plain text ticket ID, use as-is
          }
          setScanResult(ticketId);
          fetchTicketDetails(ticketId);
        }

        function onScanError(_err: any) {
          // Silently ignore scan errors (camera adjusting, no QR visible, etc.)
        }
      } catch (err) {
        console.error('Failed to initialize scanner:', err);
        setError('Camera scanner could not be initialized. Please use manual search below.');
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {});
      }
    };
  }, []);

  const fetchTicketDetails = async (ticketId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/tickets/verify/${encodeURIComponent(ticketId)}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('kartal_token')}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ticket not found');

      // Handle both authenticated and public endpoints
      const ticket = data.ticket;
      setTicketData(ticket);

    } catch (err: any) {
      setError(err.message);
      setTicketData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const id = formData.get('ticketId') as string;
    if (id?.trim()) {
      setScanResult(id.trim());
      fetchTicketDetails(id.trim());
    }
  };

  const handleSendWhatsApp = () => {
    if (!ticketData?.mobile) return;
    const waNum = formatWANumber(ticketData.mobile);
    const message = `Assalam-o-Alaikum! Your ticket ${ticketData.ticket_id} has been verified. Here are the details:\n\nTicket ID: ${ticketData.ticket_id}\nName: ${ticketData.name}\nDate: ${new Date(ticketData.date).toLocaleDateString('en-PK')}`;
    window.open(`https://wa.me/${waNum}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleScanAnother = () => {
    setTicketData(null);
    setScanResult(null);
    setError(null);
    window.location.reload();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <Ticket className="w-6 h-6 mr-2 text-indigo-600" />
          Ticket Scanner & Verification
        </h2>

        {/* QR Scanner */}
        <div id="reader" className="overflow-hidden rounded-lg border-2 border-dashed border-gray-200" style={{ minHeight: '200px' }}></div>

        {/* Manual search */}
        <div className="mt-6">
          <div className="relative flex items-center">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="flex-shrink mx-4 text-gray-400 text-sm">OR SEARCH MANUALLY</span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>

          <form onSubmit={handleManualSearch} className="mt-4 flex space-x-2">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                name="ticketId"
                type="text"
                placeholder="Enter Ticket ID (e.g. 26030001)"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Verify
            </button>
          </form>
        </div>
      </div>

      {loading && (
        <div className="bg-white p-12 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-500">Verifying ticket...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 p-6 rounded-xl border border-red-100 flex items-start space-x-3">
          <XCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
          <div>
            <h3 className="text-red-800 font-bold">Verification Failed</h3>
            <p className="text-red-700 text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      {ticketData && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className={`p-4 ${ticketData.printed_count > 0 ? 'bg-green-600' : 'bg-indigo-600'} text-white flex justify-between items-center`}>
            <div>
              <p className="text-xs opacity-80 uppercase tracking-wider font-bold">Ticket Verified</p>
              <h3 className="text-2xl font-black">{ticketData.ticket_id}</h3>
            </div>
            <div className="text-right">
              <CheckCircle className="w-8 h-8 opacity-80" />
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <User className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-bold">Customer Name</p>
                    <p className="text-gray-900 font-medium">{ticketData.name}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-bold">Mobile Number</p>
                    <p className="text-gray-900 font-medium">{ticketData.mobile}</p>
                  </div>
                </div>
                {ticketData.address && (
                  <div className="flex items-start space-x-3">
                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-bold">Address</p>
                      <p className="text-gray-900 font-medium">{ticketData.address}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-bold">Generated Date</p>
                    <p className="text-gray-900 font-medium">{ticketData.date ? new Date(ticketData.date).toLocaleString() : 'N/A'}</p>
                  </div>
                </div>
                {ticketData.generated_by_nick && (
                  <div className="flex items-start space-x-3">
                    <User className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-bold">Generated By</p>
                      <p className="text-gray-900 font-medium">{ticketData.generated_by_nick}</p>
                    </div>
                  </div>
                )}
                {ticketData.printed_count !== undefined && (
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-bold">Print Count</p>
                      <p className="text-gray-900 font-medium">{ticketData.printed_count} times</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center gap-3">
              {ticketData.mobile && (
                <button
                  onClick={handleSendWhatsApp}
                  className="w-full sm:w-auto px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  Send via WhatsApp
                </button>
              )}
              <button
                onClick={handleScanAnother}
                className="w-full sm:w-auto px-8 py-3 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 transition-colors"
              >
                Scan Another Ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
