import React, { useState, useEffect } from 'react';

export default function Settings() {
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);
  const token = localStorage.getItem('kartal_token');

  useEffect(() => {
    fetch('/api/settings', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(r => r.json()).then(setSettings).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const updateSetting = async (key: string, value: string) => {
    setSaving(key);
    try {
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value })
      });
      setSettings((s: any) => ({ ...s, [key]: value }));
      setMessage({ type: 'success', text: 'Setting saved.' });
      setTimeout(() => setMessage(null), 2000);
    } catch { setMessage({ type: 'error', text: 'Failed to save.' }); }
    setSaving(null);
  };

  const toggles = [
    { key: 'require_all_approvals', label: 'Require Admin Approval for All Transactions', desc: 'Every transaction goes to Pending regardless of user settings' },
    { key: 'multi_person_enabled', label: 'Allow Multi-Person Transactions', desc: 'Users can submit one transaction for multiple different people' },
    { key: 'duplicate_tx_enabled', label: 'Allow Duplicate Transaction IDs', desc: 'Same TX ID can be used more than once globally' },
    { key: 'whatsapp_enabled', label: 'WhatsApp Notifications', desc: 'Send ticket confirmation via WhatsApp after generation' },
  ];

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header"><h1>Settings</h1><p>Global system configuration.</p></div>

      {message && <div className={`alert alert-${message.type}`} style={{ marginBottom: '20px' }}>{message.text}</div>}

      <div className="card" style={{ padding: '24px', maxWidth: '600px' }}>
        <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '16px' }}>Global Toggles</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          {toggles.map((t, i) => (
            <div key={t.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: i % 2 === 0 ? 'var(--bg-elevated)' : 'transparent', borderRadius: '8px' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>{t.label}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{t.desc}</div>
              </div>
              <button
                onClick={() => updateSetting(t.key, settings[t.key] === 'true' ? 'false' : 'true')}
                disabled={saving === t.key}
                style={{
                  width: '44px', height: '24px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                  background: settings[t.key] === 'true' ? 'var(--accent)' : 'var(--border)',
                  transition: 'background 0.2s', position: 'relative', flexShrink: 0, marginLeft: '16px'
                }}
              >
                <span style={{
                  position: 'absolute', top: '2px',
                  left: settings[t.key] === 'true' ? '22px' : '2px',
                  width: '20px', height: '20px', borderRadius: '50%', background: '#fff',
                  transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                }} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
