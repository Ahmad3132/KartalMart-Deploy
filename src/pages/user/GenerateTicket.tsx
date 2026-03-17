import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Ticket, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';

export default function GenerateTicket() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [packages, setPackages] = useState<any[]>([]);
  const [activeCampaign, setActiveCampaign] = useState<any>(null);
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  
  const [settings, setSettings] = useState<any>({});
  
  const [txId, setTxId] = useState('');
  const [paymentType, setPaymentType] = useState<'ONLINE' | 'CASH'>('ONLINE');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [isMultiPerson, setIsMultiPerson] = useState(false);
  const [sameMobileForAll, setSameMobileForAll] = useState(false);
  const [sameAddressForAll, setSameAddressForAll] = useState(false);
  const [participants, setParticipants] = useState<any[]>([{ name: '', mobile: '', address: '' }]);
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [address, setAddress] = useState('');
  
  const [message, setMessage] = useState<{type: 'success' | 'error' | 'warning', text: string} | null>(null);

  useEffect(() => {
    if (selectedPackage && isMultiPerson) {
      const newParticipants = Array.from({ length: selectedPackage.ticket_count }, (_, i) => {
        const existing = participants[i] || { name: '', mobile: '', address: '' };
        let updated = { ...existing };
        if (sameMobileForAll && i > 0) {
          updated.mobile = participants[0].mobile;
        }
        if (sameAddressForAll && i > 0) {
          updated.address = participants[0].address;
        }
        return updated;
      });
      setParticipants(newParticipants);
    }
  }, [selectedPackage, isMultiPerson, sameMobileForAll, sameAddressForAll]);

  const handleParticipantChange = (index: number, field: string, value: string) => {
    const newParticipants = [...participants];
    newParticipants[index] = { ...newParticipants[index], [field]: value };
    
    if (index === 0) {
      if (sameMobileForAll && field === 'mobile') {
        for (let i = 1; i < newParticipants.length; i++) {
          newParticipants[i].mobile = value;
        }
      }
      if (sameAddressForAll && field === 'address') {
        for (let i = 1; i < newParticipants.length; i++) {
          newParticipants[i].address = value;
        }
      }
    }
    
    setParticipants(newParticipants);
  };

  useEffect(() => {
    const headers = { 'Authorization': `Bearer ${localStorage.getItem('kartal_token')}` };
    
    const loadData = async () => {
      try {
        const [campaignRes, packagesRes, settingsRes, meRes] = await Promise.all([
          fetch('/api/campaigns/active', { headers }),
          fetch('/api/packages/active', { headers }),
          fetch('/api/settings', { headers }),
          fetch('/api/users/me', { headers })
        ]);

        const campaignData = await campaignRes.json().catch(() => null);
        const packagesData = await packagesRes.json().catch(() => []);
        const globalSettings = await settingsRes.json().catch(() => ({}));
        const userData = await meRes.json().catch(() => null);

        setActiveCampaign(campaignData);
        setPackages(Array.isArray(packagesData) ? packagesData : []);
        
        setSettings({
          ...globalSettings,
          user_multi_person_enabled: userData?.multi_person_logic_enabled === 1
        });
      } catch (err) {
        console.error('Error loading ticket generation data:', err);
      }
    };

    loadData();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    
    if (!selectedPackage) {
      setMessage({ type: 'error', text: 'Please select a package' });
      return;
    }

    try {
      const formData = new FormData();
      formData.append('tx_id', txId);
      formData.append('payment_type', paymentType);
      formData.append('receipt_url', receiptUrl);
      formData.append('user_email', user?.email || '');
      formData.append('package_id', selectedPackage.id.toString());
      formData.append('is_multi_person', isMultiPerson.toString());
      formData.append('participants', JSON.stringify(isMultiPerson ? participants : null));
      formData.append('name', isMultiPerson ? '' : name);
      formData.append('mobile', isMultiPerson ? '' : mobile);
      formData.append('address', isMultiPerson ? '' : address);
      
      if (receiptFile) {
        formData.append('receipt', receiptFile);
      }

      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('kartal_token')}`
        },
        body: formData,
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate tickets');
      }
      
      if (data.status === 'Pending') {
        setMessage({ type: 'warning', text: data.message });
      } else {
        const base = user?.role === 'Admin' ? '/admin' : '/user';
        navigate(`${base}/success/${data.tx_id}`);
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  if (!activeCampaign) {
    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-yellow-400" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              There is currently no active campaign. You cannot generate tickets at this time.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <button onClick={() => navigate(-1)} className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-2 gap-1">
          <ArrowLeft className="w-4 h-4"/> Back
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Generate Tickets</h1>
        <p className="mt-1 text-sm text-gray-500">
          Active Campaign: <span className="font-semibold text-indigo-600">{activeCampaign.name}</span>
        </p>
      </div>

      {message && (
        <div className={`p-4 rounded-md ${
          message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
          message.type === 'warning' ? 'bg-orange-50 text-orange-800 border border-orange-200' :
          'bg-red-50 text-red-800 border border-red-200'
        }`}>
          <div className="flex">
            {message.type === 'success' && <CheckCircle className="h-5 w-5 mr-2 text-green-500" />}
            {message.type === 'warning' && <AlertCircle className="h-5 w-5 mr-2 text-orange-500" />}
            {message.type === 'error' && <AlertCircle className="h-5 w-5 mr-2 text-red-500" />}
            <p className="text-sm font-medium">{message.text}</p>
          </div>
        </div>
      )}

      <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Package</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {packages.map((pkg) => (
                    <div
                      key={pkg.id}
                      onClick={() => setSelectedPackage(pkg)}
                      className={`cursor-pointer rounded-lg border p-4 transition-all ${
                        selectedPackage?.id === pkg.id
                          ? 'border-indigo-600 ring-2 ring-indigo-600 bg-indigo-50'
                          : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-sm font-medium text-gray-900">{pkg.name}</h3>
                        {selectedPackage?.id === pkg.id && <CheckCircle className="h-4 w-4 text-indigo-600" />}
                      </div>
                      <p className="text-2xl font-bold text-gray-900">PKR {pkg.amount}</p>
                      <p className="text-sm text-gray-500 mt-1">{pkg.ticket_count} Tickets</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Payment Type</label>
                  <select
                    value={paymentType}
                    onChange={(e) => setPaymentType(e.target.value as any)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                  >
                    <option value="ONLINE">Online Transfer</option>
                    <option value="CASH">Cash Payment</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Transaction ID {paymentType === 'CASH' && '(Optional)'}</label>
                  <input
                    type="text"
                    required={paymentType === 'ONLINE'}
                    value={txId}
                    onChange={(e) => setTxId(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                    placeholder={paymentType === 'ONLINE' ? "Enter payment transaction ID" : "Auto-generated if empty"}
                  />
                </div>
              </div>

              {paymentType === 'ONLINE' && (
                <div className="sm:col-span-2 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Receipt URL (Optional)</label>
                    <input
                      type="url"
                      value={receiptUrl}
                      onChange={(e) => setReceiptUrl(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                      placeholder="https://example.com/receipt.jpg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Upload Receipt (Optional)</label>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                      className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                    />
                  </div>
                </div>
              )}

              <div className="sm:col-span-2 space-y-2">
                <div className="flex items-center">
                  {settings.multi_person_enabled === 'true' && settings.user_multi_person_enabled && (
                    <>
                      <input
                        id="multi-person"
                        type="checkbox"
                        checked={isMultiPerson}
                        onChange={(e) => setIsMultiPerson(e.target.checked)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label htmlFor="multi-person" className="ml-2 block text-sm text-gray-700">
                        Same Transaction multiple person
                      </label>
                    </>
                  )}
                </div>
                {isMultiPerson && (
                  <div className="flex flex-col space-y-2 ml-6">
                    <div className="flex items-center">
                      <input
                        id="same-mobile"
                        type="checkbox"
                        checked={sameMobileForAll}
                        onChange={(e) => setSameMobileForAll(e.target.checked)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label htmlFor="same-mobile" className="ml-2 block text-xs text-gray-500">
                        Keep contact number same for all tickets
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        id="same-address"
                        type="checkbox"
                        checked={sameAddressForAll}
                        onChange={(e) => setSameAddressForAll(e.target.checked)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label htmlFor="same-address" className="ml-2 block text-xs text-gray-500">
                        Keep address same for all tickets
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {isMultiPerson ? (
                <div className="sm:col-span-2 space-y-6">
                  <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Participant Details</h3>
                  {participants.map((p, idx) => (
                    <div key={idx} className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-4">
                      <h4 className="text-sm font-bold text-indigo-600 uppercase tracking-wider">Ticket {idx + 1}</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-medium text-gray-500 uppercase">Full Name</label>
                          <input
                            type="text"
                            required
                            value={p.name}
                            onChange={(e) => handleParticipantChange(idx, 'name', e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border bg-white"
                          />
                        </div>
                        {(!sameMobileForAll || idx === 0) && (
                          <div>
                            <label className="block text-xs font-medium text-gray-500 uppercase">Mobile</label>
                            <input
                              type="tel"
                              required
                              value={p.mobile}
                              onChange={(e) => handleParticipantChange(idx, 'mobile', e.target.value)}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border bg-white"
                            />
                          </div>
                        )}
                        {(!sameAddressForAll || idx === 0) && (
                          <div className="sm:col-span-2">
                            <label className="block text-xs font-medium text-gray-500 uppercase">Address</label>
                            <textarea
                              required
                              rows={2}
                              value={p.address}
                              onChange={(e) => handleParticipantChange(idx, 'address', e.target.value)}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border bg-white"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Customer Name</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                    />
                  </div>

                  <div className="sm:col-span-1">
                    <label className="block text-sm font-medium text-gray-700">Mobile Number</label>
                    <input
                      type="tel"
                      required
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Address</label>
                    <textarea
                      required
                      rows={3}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="pt-4 border-t border-gray-200">
              <button
                type="submit"
                disabled={!selectedPackage}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                <Ticket className="w-5 h-5 mr-2" />
                Submit Transaction
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
