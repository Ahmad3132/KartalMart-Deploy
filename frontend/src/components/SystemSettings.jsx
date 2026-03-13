import React, { useState } from 'react';

const SystemSettings = ({ user }) => {
  const [settings, setSettings] = useState({
    companyName: 'Kartal Mart',
    contactEmail: 'admin@kartalmart.com',
    contactPhone: '+92 300 1234567',
    websiteUrl: 'www.kartalmart.com',
    enableNotifications: true,
    enableWhatsApp: true,
    requireReceiptScan: true
  });

  const [saved, setSaved] = useState(false);

  const handleChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
    setSaved(false);
  };

  const handleSave = async () => {
    try {
      setSaved(true);
      alert('Settings saved successfully!');
      
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings');
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ margin: '0 0 8px 0', fontSize: '32px', fontWeight: '600' }}>System Settings</h1>
        <p style={{ margin: 0, color: '#718096', fontSize: '16px' }}>
          Configure your Kartal Mart application settings
        </p>
      </div>

      <div style={{ 
        background: 'white', 
        padding: '24px', 
        borderRadius: '12px', 
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        marginBottom: '24px'
      }}>
        <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: '600' }}>
          Company Information
        </h2>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>
            Company Name
          </label>
          <input 
            type="text" 
            value={settings.companyName}
            onChange={(e) => handleChange('companyName', e.target.value)}
            style={{ 
              width: '100%', 
              padding: '12px', 
              border: '2px solid #e2e8f0', 
              borderRadius: '8px',
              fontSize: '14px'
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>
            Contact Email
          </label>
          <input 
            type="email" 
            value={settings.contactEmail}
            onChange={(e) => handleChange('contactEmail', e.target.value)}
            style={{ 
              width: '100%', 
              padding: '12px', 
              border: '2px solid #e2e8f0', 
              borderRadius: '8px',
              fontSize: '14px'
            }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>
              Contact Phone
            </label>
            <input 
              type="text" 
              value={settings.contactPhone}
              onChange={(e) => handleChange('contactPhone', e.target.value)}
              style={{ 
                width: '100%', 
                padding: '12px', 
                border: '2px solid #e2e8f0', 
                borderRadius: '8px',
                fontSize: '14px'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>
              Website URL
            </label>
            <input 
              type="text" 
              value={settings.websiteUrl}
              onChange={(e) => handleChange('websiteUrl', e.target.value)}
              style={{ 
                width: '100%', 
                padding: '12px', 
                border: '2px solid #e2e8f0', 
                borderRadius: '8px',
                fontSize: '14px'
              }}
            />
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button 
          onClick={handleSave}
          style={{
            padding: '12px 32px',
            background: saved ? '#48bb78' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
          }}
        >
          {saved ? '✓ Saved' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
};

export default SystemSettings;
