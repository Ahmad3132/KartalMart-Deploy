import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function GenerateTicket() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [packages, setPackages] = useState<any[]>([]);
  const [activeCampaign, setActiveCampaign] = useState<any>(null);
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [settings, setSettings] = useState<any>({});
  const [txId, setTxId] = useState('');
  const [paymentType, setPaymentType] = useState<'EASYPAISA' | 'CASH'>('EASYPAISA');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [isMultiPerson, setIsMultiPerson] = useState(false);
  const [sameMobileForAll, setSameMobileForAll] = useState(false);
  const [sameAddressForAll, setSameAddressForAll] = useState(false);
  const [participants, setParticipants] = useState<any[]>([{ name: '', mobile: '', address: '' }]);
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{type: string, text: string} | null>(null);
  const token = localStorage.getItem('kartal_token');

  useEffect(() => {
    if (selectedPackage && isMultiPerson) {
      const count = selectedPackage.ticket_count;
      const newP = Array.from({ length: count }, (_, i) => {
        const ex = participants[i] || { name: '', mobile: '', address: '' };
        return {
          ...ex,
          mobile: sameMobileForAll && i > 0 ? (participants[0]?.mobile || '') : ex.mobile,
          address: sameAddressForAll && i > 0 ? (participants[0]?.address || '') : ex.address,
        };
      });
      setParticipants(newP);
    }
  }, [selectedPackage, isMultiPerson, sameMobileForAll, sameAddressForAll]);

  const handleParticipantChange = (index: number, field: string, value: string) => {
    const newP = [...participants];
    newP[index] = { ...newP[index], [field]: value };
    if (index === 0) {
      if (sameMobileForAll && field === 'mobile') newP.forEach((p, i) => { if (i > 0) p.mobile = value; });
      if (sameAddressForAll && field === 'address') newP.forEach((p, i) => { if (i > 0) p.address = value; });
    }
    setParticipants(newP);
  };

  useEffect(() => {
    const h = { 'Authorization': `Bearer ${token}` };
    Promise.all([
      fetch('/api/campaigns/active', { headers: h }).then(r => r.json()).catch(() => null),
      fetch('/api/packages/active', { headers: h }).then(r => r.json()).catch(() => []),
      fetch('/api/settings', { headers: h }).then(r => r.json()).catch(() => ({})),
      fetch('/api/users/me', { headers: h }).then(r => r.json()).catch(() => null),
    ]).then(([campaign, pkgs, globalSettings, userData]) => {
      setActiveCampaign(campaign);
      setPackages(Array.isArray(pkgs) ? pkgs : []);
      setSettings({ ...globalSettings, user_multi_person_enabled: userData?.multi_person_logic_enabled === 1, receipt_required: userData?.receipt_required !== 0 });
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (!selectedPackage) { setMessage({ type: 'error', text: 'Please select a package' }); return; }
    if (paymentType === 'EASYPAISA' && settings.receipt_required !== false && !receiptFile) { setMessage({ type: 'error', text: 'Receipt is required for EasyPaisa payments' }); return; }
    
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('tx_id', txId);
      formData.append('payment_type', paymentType);
      formData.append('user_email', user?.email || '');
      formData.append('package_id', selectedPackage.id.toString());
      formData.append('is_multi_person', isMultiPerson.toString());
      formData.append('participants', JSON.stringify(isMultiPerson ? participants : null));
      formData.append('name', isMultiPerson ? '' : name);
      formData.append('mobile', isMultiPerson ? '' : mobile);
      formData.append('address', isMultiPerson ? '' : address);
      if (receiptFile) formData.append('receipt', receiptFile);

      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      
      if (data.status === 'Pending') {
        setMessage({ type: 'warning', text: '✓ Transaction submitted. Waiting for admin approval.' });
        setTxId(''); setName(''); setMobile(''); setAddress(''); setReceiptFile(null); setSelectedPackage(null);
      } else {
        navigate(`/user/tickets?success=${data.tx_id}`);
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally { setLoading(false); }
  };

  if (!activeCampaign) return (
    <div>
      <div className="page-header"><h1>Generate Ticket</h1></div>
      <div className="alert alert-warning">No active campaign. Please contact your administrator.</div>
    </div>
  );

  const multiPersonEnabled = settings.multi_person_enabled === 'true' && settings.user_multi_person_enabled;

  return (
    <div style={{ maxWidth: '720px' }}>
      <div className="page-header">
        <h1>Generate Ticket</h1>
        <p>Active Campaign: <strong style={{ color: 'var(--accent)' }}>{activeCampaign.name}</strong></p>
      </div>

      {message && (
        <div className={`alert alert-${message.type === 'error' ? 'error' : message.type === 'warning' ? 'warning' : 'success'}`} style={{ marginBottom: '24px' }}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Package Selection */}
        <div className="card" style={{ padding: '24px', marginBottom: '16px' }}>
          <label className="label">Select Package</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px', marginTop: '8px' }}>
            {packages.map(pkg => (
              <div key={pkg.id} onClick={() => setSelectedPackage(pkg)} style={{ cursor: 'pointer', padding: '16px', borderRadius: '12px', border: `2px solid ${selectedPackage?.id === pkg.id ? 'var(--accent)' : 'var(--border)'}`, background: selectedPackage?.id === pkg.id ? 'var(--accent-soft)' : 'var(--bg-elevated)', transition: 'all 0.2s' }}>
                <div style={{ fontFamily: 'Syne', fontWeight: '700', fontSize: '18px', color: 'var(--text-primary)' }}>PKR {pkg.amount.toLocaleString()}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{pkg.ticket_count} ticket{pkg.ticket_count > 1 ? 's' : ''}</div>
                <div style={{ fontSize: '11px', color: selectedPackage?.id === pkg.id ? 'var(--accent)' : 'var(--text-muted)', marginTop: '4px', fontWeight: '600' }}>{pkg.name}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment */}
        <div className="card" style={{ padding: '24px', marginBottom: '16px' }}>
          <div className="grid-2" style={{ marginBottom: '16px' }}>
            <div>
              <label className="label">Payment Type</label>
              <select className="input" value={paymentType} onChange={e => setPaymentType(e.target.value as any)}>
                <option value="EASYPAISA">EasyPaisa</option>
                <option value="CASH">Cash</option>
              </select>
            </div>
            <div>
              <label className="label">Transaction ID {paymentType === 'CASH' ? '(Optional)' : ''}</label>
              <input className="input" type="text" required={paymentType === 'EASYPAISA'} value={txId} onChange={e => setTxId(e.target.value)} placeholder={paymentType === 'EASYPAISA' ? 'EasyPaisa TX ID' : 'Auto-generated if empty'} />
            </div>
          </div>
          {paymentType === 'EASYPAISA' && (
            <div>
              <label className="label">Upload Receipt {settings.receipt_required !== false && <span style={{ color: 'var(--danger)' }}>*</span>} {settings.receipt_required === false && <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>(optional)</span>}</label>
              <div style={{ marginTop: '8px', padding: '20px', border: `2px dashed ${receiptFile ? 'var(--success)' : 'var(--border)'}`, borderRadius: '10px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s', background: receiptFile ? 'var(--success-soft)' : 'var(--bg-elevated)' }}>
                <input type="file" accept="image/*,application/pdf" onChange={e => setReceiptFile(e.target.files?.[0] || null)} style={{ display: 'none' }} id="receipt-upload" />
                <label htmlFor="receipt-upload" style={{ cursor: 'pointer' }}>
                  {receiptFile ? (
                    <div style={{ color: 'var(--success)' }}>
                      <div style={{ fontSize: '24px', marginBottom: '4px' }}>✓</div>
                      <div style={{ fontSize: '13px', fontWeight: '600' }}>{receiptFile.name}</div>
                    </div>
                  ) : (
                    <div style={{ color: 'var(--text-muted)' }}>
                      <div style={{ fontSize: '24px', marginBottom: '4px' }}>📎</div>
                      <div style={{ fontSize: '13px' }}>Click to upload EasyPaisa receipt</div>
                      <div style={{ fontSize: '11px', marginTop: '4px' }}>JPG, PNG or PDF</div>
                    </div>
                  )}
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Multi-person toggle */}
        {multiPersonEnabled && selectedPackage && selectedPackage.ticket_count > 1 && (
          <div className="card" style={{ padding: '20px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <input type="checkbox" id="multi" checked={isMultiPerson} onChange={e => setIsMultiPerson(e.target.checked)} style={{ width: '18px', height: '18px', accentColor: 'var(--accent)' }} />
              <label htmlFor="multi" style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', cursor: 'pointer' }}>
                Multiple people — different person per ticket
              </label>
            </div>
            {isMultiPerson && (
              <div style={{ marginTop: '12px', paddingLeft: '30px', display: 'flex', gap: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  <input type="checkbox" checked={sameMobileForAll} onChange={e => setSameMobileForAll(e.target.checked)} style={{ accentColor: 'var(--accent)' }} />
                  Same mobile for all
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  <input type="checkbox" checked={sameAddressForAll} onChange={e => setSameAddressForAll(e.target.checked)} style={{ accentColor: 'var(--accent)' }} />
                  Same address for all
                </label>
              </div>
            )}
          </div>
        )}

        {/* Customer Details */}
        <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
          {isMultiPerson ? (
            <div>
              <label className="label" style={{ marginBottom: '16px' }}>Participant Details</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {participants.map((p, idx) => (
                  <div key={idx} style={{ padding: '16px', background: 'var(--bg-elevated)', borderRadius: '10px', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>Ticket {idx + 1}</div>
                    <div className="grid-2" style={{ gap: '12px' }}>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label className="label">Full Name</label>
                        <input className="input" required value={p.name} onChange={e => handleParticipantChange(idx, 'name', e.target.value)} />
                      </div>
                      {(!sameMobileForAll || idx === 0) && (
                        <div>
                          <label className="label">Mobile</label>
                          <input className="input" required value={p.mobile} onChange={e => handleParticipantChange(idx, 'mobile', e.target.value)} placeholder="03XX-XXXXXXX" />
                        </div>
                      )}
                      {(!sameAddressForAll || idx === 0) && (
                        <div>
                          <label className="label">Address</label>
                          <input className="input" required value={p.address} onChange={e => handleParticipantChange(idx, 'address', e.target.value)} />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <label className="label">Customer Details</label>
              <div>
                <label className="label">Full Name</label>
                <input className="input" required value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="grid-2">
                <div>
                  <label className="label">Mobile Number</label>
                  <input className="input" required value={mobile} onChange={e => setMobile(e.target.value)} placeholder="03XX-XXXXXXX" />
                </div>
                <div>
                  <label className="label">Address</label>
                  <input className="input" required value={address} onChange={e => setAddress(e.target.value)} />
                </div>
              </div>
            </div>
          )}
        </div>

        <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading || !selectedPackage}>
          {loading ? <span className="spinner" /> : '→ Submit Transaction'}
        </button>
      </form>
    </div>
  );
}
