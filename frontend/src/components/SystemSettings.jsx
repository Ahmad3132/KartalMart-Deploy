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
      // TODO: Save to backend API
      // const response = await fetch('/api/settings', {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(settings)
      // });
      
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

      {/* Company Information */}
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
              fontSize: '14px',
              transition: 'border 0.2s'
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

      {/* Feature Settings */}
      <div style={{ 
        background: 'white', 
        padding: '24px', 
        borderRadius: '12px', 
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        marginBottom: '24px'
      }}>
        <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: '600' }}>
          Feature Settings
        </h2>

        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '4px' }}>
              Enable Notifications
            </div>
            <div style={{ fontSize: '13px', color: '#718096' }}>
              Send notifications for ticket generation and updates
            </div>
          </div>
          <label style={{ position: 'relative', display: 'inline-block', width: '56px', height: '28px' }}>
            <input 
              type="checkbox"
              checked={settings.enableNotifications}
              onChange={(e) => handleChange('enableNotifications', e.target.checked)}
              style={{ opacity: 0, width: 0, height: 0 }}
            />
            <span style={{
              position: 'absolute',
              cursor: 'pointer',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: settings.enableNotifications ? '#667eea' : '#cbd5e0',
              transition: '0.4s',
              borderRadius: '28px'
            }}>
              <span style={{
                position: 'absolute',
                content: '',
                height: '20px',
                width: '20px',
                left: settings.enableNotifications ? '32px' : '4px',
                bottom: '4px',
                backgroundColor: 'white',
                transition: '0.4s',
                borderRadius: '50%'
              }}></span>
            </span>
          </label>
        </div>

        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '4px' }}>
              Enable WhatsApp Integration
            </div>
            <div style={{ fontSize: '13px', color: '#718096' }}>
              Send tickets and notifications via WhatsApp
            </div>
          </div>
          <label style={{ position: 'relative', display: 'inline-block', width: '56px', height: '28px' }}>
            <input 
              type="checkbox"
              checked={settings.enableWhatsApp}
              onChange={(e) => handleChange('enableWhatsApp', e.target.checked)}
              style={{ opacity: 0, width: 0, height: 0 }}
            />
            <span style={{
              position: 'absolute',
              cursor: 'pointer',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: settings.enableWhatsApp ? '#667eea' : '#cbd5e0',
              transition: '0.4s',
              borderRadius: '28px'
            }}>
              <span style={{
                position: 'absolute',
                content: '',
                height: '20px',
                width: '20px',
                left: settings.enableWhatsApp ? '32px' : '4px',
                bottom: '4px',
                backgroundColor: 'white',
                transition: '0.4s',
                borderRadius: '50%'
              }}></span>
            </span>
          </label>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '4px' }}>
              Require Receipt Scan
            </div>
            <div style={{ fontSize: '13px', color: '#718096' }}>
              Mandatory EasyPaisa receipt scanning for verification
            </div>
          </div>
          <label style={{ position: 'relative', display: 'inline-block', width: '56px', height: '28px' }}>
            <input 
              type="checkbox"
              checked={settings.requireReceiptScan}
              onChange={(e) => handleChange('requireReceiptScan', e.target.checked)}
              style={{ opacity: 0, width: 0, height: 0 }}
            />
            <span style={{
              position: 'absolute',
              cursor: 'pointer',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: settings.requireReceiptScan ? '#667eea' : '#cbd5e0',
              transition: '0.4s',
              borderRadius: '28px'
            }}>
              <span style={{
                position: 'absolute',
                content: '',
                height: '20px',
                width: '20px',
                left: settings.requireReceiptScan ? '32px' : '4px',
                bottom: '4px',
                backgroundColor: 'white',
                transition: '0.4s',
                borderRadius: '50%'
              }}></span>
            </span>
          </label>
        </div>
      </div>

      {/* Save Button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
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
            transition: 'all 0.2s',
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
