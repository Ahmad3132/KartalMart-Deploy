import React, { useState, useEffect } from 'react';
import { Save, Eye, Settings } from 'lucide-react';
import './TicketTemplateEditor.css';

const TicketTemplateEditor = () => {
  const [template, setTemplate] = useState({
    show_date: true,
    show_contact_number: true,
    show_website: true,
    show_package_name: true,
    contact_number: '+92 300 1234567',
    website_url: 'www.kartalmart.com',
    logo_size: 'medium'
  });

  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    loadTemplate();
  }, []);

  const loadTemplate = async () => {
    try {
      const response = await fetch('/api/settings/ticket-template');
      if (response.ok) {
        const data = await response.json();
        setTemplate(data);
      }
    } catch (error) {
      console.error('Error loading template:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/settings/ticket-template', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template)
      });

      if (response.ok) {
        alert('Template settings saved successfully!');
      } else {
        alert('Failed to save template settings');
      }
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Error saving template settings');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (field) => {
    setTemplate(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleInputChange = (field, value) => {
    setTemplate(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="template-editor-page">
      <div className="page-header">
        <div className="header-left">
          <Settings size={32} className="header-icon" />
          <div>
            <h1>Ticket Template Editor</h1>
            <p className="subtitle">Customize what appears on printed tickets</p>
          </div>
        </div>
        <div className="header-actions">
          <button 
            className="btn-secondary"
            onClick={() => setShowPreview(!showPreview)}
          >
            <Eye size={20} />
            {showPreview ? 'Hide' : 'Show'} Preview
          </button>
          <button 
            className="btn-primary" 
            onClick={handleSave}
            disabled={saving}
          >
            <Save size={20} />
            {saving ? 'Saving...' : 'Save Template'}
          </button>
        </div>
      </div>

      <div className="editor-layout">
        {/* Settings Panel */}
        <div className="settings-panel">
          <div className="settings-section">
            <h3>Display Options</h3>
            <p className="section-description">
              Choose which information to show on tickets
            </p>

            <div className="setting-item">
              <div className="setting-info">
                <label>Show Date & Time</label>
                <p>Display when the ticket was generated</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={template.show_date}
                  onChange={() => handleToggle('show_date')}
                />
                <span className="slider"></span>
              </label>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <label>Show Package Name</label>
                <p>Display the purchased package on ticket</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={template.show_package_name}
                  onChange={() => handleToggle('show_package_name')}
                />
                <span className="slider"></span>
              </label>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <label>Show Contact Number</label>
                <p>Display your business phone number</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={template.show_contact_number}
                  onChange={() => handleToggle('show_contact_number')}
                />
                <span className="slider"></span>
              </label>
            </div>

            {template.show_contact_number && (
              <div className="nested-input">
                <label>Contact Number</label>
                <input
                  type="text"
                  value={template.contact_number}
                  onChange={(e) => handleInputChange('contact_number', e.target.value)}
                  placeholder="+92 300 1234567"
                />
              </div>
            )}

            <div className="setting-item">
              <div className="setting-info">
                <label>Show Website URL</label>
                <p>Display your website address</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={template.show_website}
                  onChange={() => handleToggle('show_website')}
                />
                <span className="slider"></span>
              </label>
            </div>

            {template.show_website && (
              <div className="nested-input">
                <label>Website URL</label>
                <input
                  type="text"
                  value={template.website_url}
                  onChange={(e) => handleInputChange('website_url', e.target.value)}
                  placeholder="www.kartalmart.com"
                />
              </div>
            )}
          </div>

          <div className="settings-section">
            <h3>Logo & Branding</h3>
            <p className="section-description">
              Adjust logo size and branding appearance
            </p>

            <div className="setting-item">
              <div className="setting-info">
                <label>Logo Size</label>
                <p>Choose the size of the logo on tickets</p>
              </div>
              <select
                value={template.logo_size}
                onChange={(e) => handleInputChange('logo_size', e.target.value)}
                className="logo-size-select"
              >
                <option value="small">Small (30px)</option>
                <option value="medium">Medium (40px)</option>
                <option value="large">Large (50px)</option>
              </select>
            </div>
          </div>

          <div className="settings-section">
            <h3>Privacy</h3>
            <p className="section-description">
              Customer data protection settings
            </p>

            <div className="info-box">
              <p>
                <strong>Note:</strong> Last 3 digits of customer phone numbers 
                are automatically masked on printed tickets for privacy protection.
              </p>
            </div>
          </div>
        </div>

        {/* Preview Panel */}
        {showPreview && (
          <div className="preview-panel">
            <div className="preview-header">
              <h3>Live Preview</h3>
              <p>This is how your ticket will look when printed</p>
            </div>

            <div className="ticket-preview">
              <div className="preview-ticket">
                {/* Header */}
                <div className="ticket-header">
                  <img 
                    src="/logo-transparent.png" 
                    alt="Logo" 
                    className={`ticket-logo logo-${template.logo_size}`}
                  />
                  <div className="brand-name">
                    KARTAL<br/>MART
                  </div>
                </div>

                {/* Ticket Number */}
                <div className="ticket-number">ABC-12345</div>

                {/* Details */}
                <div className="ticket-details">
                  <div className="detail-row">
                    <span className="label">Name:</span>
                    <span className="value">John Doe</span>
                  </div>

                  {template.show_package_name && (
                    <div className="detail-row">
                      <span className="label">Package:</span>
                      <span className="value">Premium Package</span>
                    </div>
                  )}

                  <div className="detail-row">
                    <span className="label">Contact:</span>
                    <span className="value">03001234XXX</span>
                  </div>

                  <div className="detail-row">
                    <span className="label">TX ID:</span>
                    <span className="value">EP1234567890</span>
                  </div>

                  {template.show_date && (
                    <div className="detail-row">
                      <span className="label">Date:</span>
                      <span className="value">Mar 11, 2026 2:30 PM</span>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="ticket-footer">
                  {template.show_contact_number && template.contact_number && (
                    <div className="footer-item">📞 {template.contact_number}</div>
                  )}
                  
                  {template.show_website && template.website_url && (
                    <div className="footer-item">🌐 {template.website_url}</div>
                  )}

                  <div className="thank-you">Thank you for your purchase!</div>
                  <div className="company">Kartal Group of Companies</div>
                </div>
              </div>

              <div className="preview-note">
                <strong>Note:</strong> Actual printed ticket will be optimized for 58mm thermal paper.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TicketTemplateEditor;
