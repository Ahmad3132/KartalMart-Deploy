import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, UserPlus, Edit, Trash2, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './UserManagement.css';

function UserManagement({ user }) {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    role: 'salesman',
    permissions: {
      allowMultiPerson: false,
      allowDuplicateTxId: false,
      requireAdminApproval: true,
      easypaisaMandatory: true,
      easypaisaScanMandatory: true,
      allowScanner: false,
      allowReprint: false
    }
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = () => {
    // Mock data - replace with actual API call
    const mockUsers = [
      {
        id: 1,
        username: 'admin',
        role: 'admin',
        permissions: {
          allowMultiPerson: true,
          allowDuplicateTxId: true,
          requireAdminApproval: false,
          easypaisaMandatory: false,
          easypaisaScanMandatory: false,
          allowScanner: true,
          allowReprint: true
        }
      },
      {
        id: 2,
        username: 'salesman1',
        role: 'salesman',
        permissions: {
          allowMultiPerson: false,
          allowDuplicateTxId: false,
          requireAdminApproval: true,
          easypaisaMandatory: true,
          easypaisaScanMandatory: true,
          allowScanner: false,
          allowReprint: false
        }
      }
    ];
    setUsers(mockUsers);
  };

  const handlePermissionChange = (userId, permission, value) => {
    setUsers(users.map(u => 
      u.id === userId 
        ? { ...u, permissions: { ...u.permissions, [permission]: value } }
        : u
    ));
  };

  const handleSaveUser = (userId) => {
    // Save to API
    console.log('Saving user permissions:', users.find(u => u.id === userId));
    alert('User permissions updated successfully');
  };

  const handleAddUser = () => {
    if (!newUser.username || !newUser.password) {
      alert('Please fill in all required fields');
      return;
    }

    const userToAdd = {
      ...newUser,
      id: users.length + 1
    };

    setUsers([...users, userToAdd]);
    setShowAddUser(false);
    setNewUser({
      username: '',
      password: '',
      role: 'salesman',
      permissions: {
        allowMultiPerson: false,
        allowDuplicateTxId: false,
        requireAdminApproval: true,
        easypaisaMandatory: true,
        easypaisaScanMandatory: true,
        allowScanner: false,
        allowReprint: false
      }
    });
    alert('User added successfully');
  };

  const handleDeleteUser = (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      setUsers(users.filter(u => u.id !== userId));
      alert('User deleted successfully');
    }
  };

  const PermissionToggle = ({ label, description, checked, onChange }) => (
    <div className="permission-item">
      <div className="permission-info">
        <label className="permission-label">{label}</label>
        <p className="permission-description">{description}</p>
      </div>
      <label className="toggle-switch">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="toggle-slider"></span>
      </label>
    </div>
  );

  return (
    <div className="user-management-page">
      <header className="page-header">
        <button className="back-btn" onClick={() => navigate('/dashboard')}>
          <ArrowLeft size={20} />
          Back to Dashboard
        </button>
        <h1>User Management</h1>
        <button className="add-user-btn" onClick={() => setShowAddUser(true)}>
          <UserPlus size={20} />
          Add User
        </button>
      </header>

      <div className="page-content">
        {showAddUser && (
          <div className="add-user-modal">
            <div className="modal-content">
              <h2>Add New User</h2>
              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  placeholder="Enter username"
                />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="Enter password"
                />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                >
                  <option value="salesman">Salesman</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <h3>Permissions & Restrictions</h3>
              <div className="permissions-list">
                <PermissionToggle
                  label="Allow multi-person transactions"
                  description="User can submit one TX for multiple different people"
                  checked={newUser.permissions.allowMultiPerson}
                  onChange={(val) => setNewUser({
                    ...newUser,
                    permissions: { ...newUser.permissions, allowMultiPerson: val }
                  })}
                />
                <PermissionToggle
                  label="Allow duplicate transaction IDs"
                  description="Same TX ID can be submitted more than once. If disabled, shows duplicate TX ID error."
                  checked={newUser.permissions.allowDuplicateTxId}
                  onChange={(val) => setNewUser({
                    ...newUser,
                    permissions: { ...newUser.permissions, allowDuplicateTxId: val }
                  })}
                />
                <PermissionToggle
                  label="Require admin approval for every transaction"
                  description="All transactions go to Pending regardless of type"
                  checked={newUser.permissions.requireAdminApproval}
                  onChange={(val) => setNewUser({
                    ...newUser,
                    permissions: { ...newUser.permissions, requireAdminApproval: val }
                  })}
                />
                <PermissionToggle
                  label="EasyPaisa receipt is mandatory"
                  description="User must upload receipt when paying via EasyPaisa"
                  checked={newUser.permissions.easypaisaMandatory}
                  onChange={(val) => setNewUser({
                    ...newUser,
                    permissions: { ...newUser.permissions, easypaisaMandatory: val }
                  })}
                />
                <PermissionToggle
                  label="EasyPaisa receipt scan is mandatory"
                  description="System scans uploaded receipt for TX ID verification and duplicate checking"
                  checked={newUser.permissions.easypaisaScanMandatory}
                  onChange={(val) => setNewUser({
                    ...newUser,
                    permissions: { ...newUser.permissions, easypaisaScanMandatory: val }
                  })}
                />
                <PermissionToggle
                  label="Allow scanner access"
                  description="User can scan tickets and send WhatsApp verification messages"
                  checked={newUser.permissions.allowScanner}
                  onChange={(val) => setNewUser({
                    ...newUser,
                    permissions: { ...newUser.permissions, allowScanner: val }
                  })}
                />
                <PermissionToggle
                  label="Allow ticket reprint"
                  description="User can reprint tickets. If disabled, shows 'Already Printed' popup."
                  checked={newUser.permissions.allowReprint}
                  onChange={(val) => setNewUser({
                    ...newUser,
                    permissions: { ...newUser.permissions, allowReprint: val }
                  })}
                />
              </div>

              <div className="modal-actions">
                <button className="cancel-btn" onClick={() => setShowAddUser(false)}>
                  Cancel
                </button>
                <button className="save-btn" onClick={handleAddUser}>
                  <Save size={18} />
                  Add User
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="users-list">
          {users.map(u => (
            <div key={u.id} className="user-card">
              <div className="user-header">
                <div className="user-identity">
                  <Shield size={24} color={u.role === 'admin' ? '#ff9800' : '#2196f3'} />
                  <div>
                    <h3>{u.username}</h3>
                    <span className={`role-badge ${u.role}`}>{u.role}</span>
                  </div>
                </div>
                <div className="user-actions">
                  <button className="save-btn" onClick={() => handleSaveUser(u.id)}>
                    <Save size={18} />
                    Save
                  </button>
                  {u.id !== 1 && (
                    <button className="delete-btn" onClick={() => handleDeleteUser(u.id)}>
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </div>

              <div className="permissions-section">
                <h4>Permissions & Restrictions</h4>
                <div className="permissions-list">
                  <PermissionToggle
                    label="Allow multi-person transactions"
                    description="User can submit one TX for multiple different people"
                    checked={u.permissions.allowMultiPerson}
                    onChange={(val) => handlePermissionChange(u.id, 'allowMultiPerson', val)}
                  />
                  <PermissionToggle
                    label="Allow duplicate transaction IDs"
                    description="Same TX ID can be submitted more than once"
                    checked={u.permissions.allowDuplicateTxId}
                    onChange={(val) => handlePermissionChange(u.id, 'allowDuplicateTxId', val)}
                  />
                  <PermissionToggle
                    label="Require admin approval for every transaction"
                    description="All transactions go to Pending regardless of type"
                    checked={u.permissions.requireAdminApproval}
                    onChange={(val) => handlePermissionChange(u.id, 'requireAdminApproval', val)}
                  />
                  <PermissionToggle
                    label="EasyPaisa receipt is mandatory"
                    description="User must upload receipt when paying via EasyPaisa"
                    checked={u.permissions.easypaisaMandatory}
                    onChange={(val) => handlePermissionChange(u.id, 'easypaisaMandatory', val)}
                  />
                  <PermissionToggle
                    label="EasyPaisa receipt scan is mandatory"
                    description="System scans uploaded receipt for TX ID verification"
                    checked={u.permissions.easypaisaScanMandatory}
                    onChange={(val) => handlePermissionChange(u.id, 'easypaisaScanMandatory', val)}
                  />
                  <PermissionToggle
                    label="Allow scanner access"
                    description="User can scan tickets and send WhatsApp verification"
                    checked={u.permissions.allowScanner}
                    onChange={(val) => handlePermissionChange(u.id, 'allowScanner', val)}
                  />
                  <PermissionToggle
                    label="Allow ticket reprint"
                    description="User can reprint tickets. If disabled, shows 'Already Printed' popup."
                    checked={u.permissions.allowReprint}
                    onChange={(val) => handlePermissionChange(u.id, 'allowReprint', val)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default UserManagement;
