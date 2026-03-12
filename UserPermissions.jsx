import React, { useState, useEffect } from 'react';
import { Save, Shield, X } from 'lucide-react';
import './UserPermissions.css';

const UserPermissions = ({ userId, userName, onClose, onSave }) => {
  const [permissions, setPermissions] = useState({
    allow_multi_person_tx: false,
    allow_duplicate_tx_ids: false,
    require_admin_approval: true,
    easypaisa_receipt_mandatory: true,
    easypaisa_scan_mandatory: true,
    scanner_enabled: false,
    allow_reprint: false
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPermissions();
  }, [userId]);

  const fetchPermissions = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/users/${userId}/permissions`);
      if (response.ok) {
        const data = await response.json();
        setPermissions(data);
      }
    } catch (error) {
      console.error('Error fetching permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (key) => {
    setPermissions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const savePermissions = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/users/${userId}/permissions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(permissions)
      });

      if (response.ok) {
        alert('Permissions updated successfully!');
        if (onSave) onSave(permissions);
        if (onClose) onClose();
      } else {
        alert('Failed to update permissions');
      }
    } catch (error) {
      console.error('Error saving permissions:', error);
      alert('Error saving permissions');
    } finally {
      setSaving(false);
    }
  };

  const permissionsList = [
    {
      key: 'allow_multi_person_tx',
      title: 'Allow Multi-Person Transactions',
      description: 'User can submit one transaction for multiple different people',
      icon: '👥'
    },
    {
      key: 'allow_duplicate_tx_ids',
      title: 'Allow Duplicate Transaction IDs',
      description: 'Same TX ID can be submitted more than once. If disabled, shows "Duplicate Transaction ID" error.',
      icon: '🔄'
    },
    {
      key: 'require_admin_approval',
      title: 'Require Admin Approval',
      description: 'All transactions go to "Pending" status regardless of type',
      icon: '✋'
    },
    {
      key: 'easypaisa_receipt_mandatory',
      title: 'EasyPaisa Receipt Mandatory',
      description: 'User must upload receipt when paying via EasyPaisa',
      icon: '📄'
    },
    {
      key: 'easypaisa_scan_mandatory',
      title: 'EasyPaisa Receipt Scan Mandatory',
      description: 'System scans uploaded file for TX ID verification and database check',
      icon: '🔍'
    },
    {
      key: 'scanner_enabled',
      title: 'Scanner Enabled',
      description: 'User can scan tickets and send WhatsApp verification with video',
      icon: '📷'
    },
    {
      key: 'allow_reprint',
      title: 'Allow Ticket Reprint',
      description: 'If disabled, shows "Already Printed" popup for previously printed tickets',
      icon: '🖨️'
    }
  ];

  if (loading) {
    return (
      <div className="permissions-modal">
        <div className="modal-content">
          <div className="loading">Loading permissions...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="permissions-modal-overlay" onClick={onClose}>
      <div className="permissions-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="header-left">
            <Shield size={28} className="header-icon" />
            <div>
              <h2>Permissions & Restrictions</h2>
              <p className="user-name">User: {userName}</p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="permissions-list">
          {permissionsList.map((permission) => (
            <div key={permission.key} className="permission-item">
              <div className="permission-info">
                <div className="permission-header">
                  <span className="permission-icon">{permission.icon}</span>
                  <h4>{permission.title}</h4>
                </div>
                <p className="permission-description">{permission.description}</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={permissions[permission.key]}
                  onChange={() => handleToggle(permission.key)}
                />
                <span className="slider"></span>
              </label>
            </div>
          ))}
        </div>

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button 
            className="btn-primary" 
            onClick={savePermissions} 
            disabled={saving}
          >
            <Save size={20} />
            {saving ? 'Saving...' : 'Save Permissions'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserPermissions;
