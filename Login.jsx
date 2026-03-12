import React, { useState } from 'react';
import './Login.css';

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Mock authentication - replace with actual API call
    if (username && password) {
      const user = {
        id: 1,
        username: username,
        role: username === 'admin' ? 'admin' : 'salesman',
        permissions: {
          allowMultiPerson: true,
          allowDuplicateTxId: false,
          requireAdminApproval: true,
          easypaisaMandatory: true,
          easypaisaScanMandatory: true,
          allowScanner: true,
          allowReprint: false
        }
      };
      onLogin(user);
    } else {
      setError('Please enter username and password');
    }
  };

  return (
    <div className="login-container">
      <div className="login-decorative-bg"></div>
      <div className="login-box">
        <div className="login-header">
          <div className="logo-container">
            <img 
              src="/kartal-logo.png" 
              alt="Kartal Mart Logo" 
              className="login-logo"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'block';
              }}
            />
            <div className="logo-fallback" style={{display: 'none'}}>
              <div className="logo-circle">KM</div>
            </div>
          </div>
          <h1 className="mart-title">KARTAL MART</h1>
          <p className="mart-subtitle">Smart Shopping, Lucky Rewards</p>
        </div>
        
        <div className="login-description">
          <p>Welcome to Kartal Mart's Sales Management System. Browse products, process transactions, and give customers a chance to win exciting prizes with every purchase.</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          <button type="submit" className="login-button">
            Sign In
          </button>
        </form>

        <div className="login-footer">
          <p>Kartal Group of Companies</p>
        </div>
      </div>
    </div>
  );
}

export default Login;
