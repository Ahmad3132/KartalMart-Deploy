import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import UserManagement from './components/UserManagement';
import TicketGeneration from './components/TicketGeneration';
import TicketList from './components/TicketList';
import MarketingCampaigns from './components/MarketingCampaigns';
import Scanner from './components/Scanner';
import TicketTemplateEditor from './components/TicketTemplateEditor';
//import SystemSettings from './components/SystemSettings';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [whatsappTab, setWhatsappTab] = useState(null);

  useEffect(() => {
    // Check authentication on mount
    const user = localStorage.getItem('currentUser');
    if (user) {
      setIsAuthenticated(true);
      setCurrentUser(JSON.parse(user));
    }
  }, []);

  const handleLogin = (user) => {
    setIsAuthenticated(true);
    setCurrentUser(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
  };

  return (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={
            isAuthenticated ? 
            <Navigate to="/dashboard" /> : 
            <Login onLogin={handleLogin} />
          } 
        />
        <Route 
          path="/dashboard" 
          element={
            isAuthenticated ? 
            <Dashboard user={currentUser} onLogout={handleLogout} /> : 
            <Navigate to="/login" />
          } 
        />
        <Route 
          path="/user-management" 
          element={
            isAuthenticated ? 
            <UserManagement user={currentUser} /> : 
            <Navigate to="/login" />
          } 
        />
        <Route 
          path="/tickets/new" 
          element={
            isAuthenticated ? 
            <TicketGeneration 
              user={currentUser} 
              whatsappTab={whatsappTab}
              setWhatsappTab={setWhatsappTab}
            /> : 
            <Navigate to="/login" />
          } 
        />
        <Route 
          path="/tickets" 
          element={
            isAuthenticated ? 
            <TicketList 
              user={currentUser}
              whatsappTab={whatsappTab}
              setWhatsappTab={setWhatsappTab}
            /> : 
            <Navigate to="/login" />
          } 
        />
        <Route 
          path="/marketing" 
          element={
            isAuthenticated ? 
            <MarketingCampaigns user={currentUser} /> : 
            <Navigate to="/login" />
          } 
        />
        <Route 
          path="/scanner" 
          element={
            isAuthenticated ? 
            <Scanner 
              user={currentUser}
              whatsappTab={whatsappTab}
              setWhatsappTab={setWhatsappTab}
            /> : 
            <Navigate to="/login" />
          } 
        />
        <Route 
          path="/ticket-template" 
          element={
            isAuthenticated ? 
            <TicketTemplateEditor user={currentUser} /> : 
            <Navigate to="/login" />
          } 
        />
	{/*
        <Route 
          path="/settings" 
          element={
            isAuthenticated ? 
            <SystemSettings user={currentUser} /> : 
            <Navigate to="/login" />
          } 
        />
	*/}
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  );
}

export default App;
