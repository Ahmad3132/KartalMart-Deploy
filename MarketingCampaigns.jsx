import React, { useState } from 'react';
import { ArrowLeft, Send, Users, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './MarketingCampaigns.css';

function MarketingCampaigns({ user }) {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    message: '',
    recipientFilter: 'all',
    scheduledDate: ''
  });

  const handleCreateCampaign = async () => {
    if (!newCampaign.name || !newCampaign.message) {
      alert('Please fill in campaign name and message');
      return;
    }

    // Get recipients based on filter
    const tickets = JSON.parse(localStorage.getItem('tickets') || '[]');
    let recipients = [];

    if (newCampaign.recipientFilter === 'all') {
      recipients = tickets.map(t => ({
        name: t.customerName,
        phone: t.contactNumber
      }));
    } else if (newCampaign.recipientFilter === 'verified') {
      recipients = tickets
        .filter(t => t.status === 'verified')
        .map(t => ({
          name: t.customerName,
          phone: t.contactNumber
        }));
    }

    // Remove duplicates
    const uniqueRecipients = Array.from(
      new Map(recipients.map(r => [r.phone, r])).values()
    );

    const campaign = {
      id: Date.now(),
      ...newCampaign,
      recipients: uniqueRecipients,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    // Send messages
    await sendCampaignMessages(campaign);

    setCampaigns([...campaigns, campaign]);
    setNewCampaign({
      name: '',
      message: '',
      recipientFilter: 'all',
      scheduledDate: ''
    });
  };

  const sendCampaignMessages = async (campaign) => {
    // Option 1: Using WhatsApp Web API (requires WhatsApp Business API access)
    // This is a mock implementation - replace with actual API integration

    if (window.confirm(`Send campaign to ${campaign.recipients.length} recipients?`)) {
      for (let i = 0; i < campaign.recipients.length; i++) {
        const recipient = campaign.recipients[i];
        const phone = recipient.phone.replace(/\D/g, '');
        const message = campaign.message.replace('{name}', recipient.name);

        const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

        // Open in new tab - user needs to click send manually
        // For automated sending, you need WhatsApp Business API integration
        window.open(whatsappUrl, '_blank');

        // Delay to prevent rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      alert('Campaign messages sent! Please click "Send" in each WhatsApp window.');

      // Update campaign status
      campaign.status = 'sent';
      campaign.sentAt = new Date().toISOString();
    }
  };

  return (
    <div className="campaigns-page">
      <header className="page-header">
        <button className="back-btn" onClick={() => navigate('/dashboard')}>
          <ArrowLeft size={20} />
          Back
        </button>
        <h1>Marketing Campaigns</h1>
      </header>

      <div className="page-content">
        <div className="create-campaign-section">
          <h3>Create New Campaign</h3>

          <div className="form-group">
            <label>Campaign Name</label>
            <input
              type="text"
              value={newCampaign.name}
              onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
              placeholder="e.g., Monthly Lucky Draw Announcement"
            />
          </div>

          <div className="form-group">
            <label>Message Template</label>
            <textarea
              value={newCampaign.message}
              onChange={(e) => setNewCampaign({ ...newCampaign, message: e.target.value })}
              placeholder="Use {name} to personalize with customer name"
              rows="6"
            />
            <p className="help-text">
              Example: "Hi {'{name}'}, Kartal Mart Lucky Draw is happening this Friday! Make sure your ticket is verified."
            </p>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Recipient Filter</label>
              <select
                value={newCampaign.recipientFilter}
                onChange={(e) => setNewCampaign({ ...newCampaign, recipientFilter: e.target.value })}
              >
                <option value="all">All Customers</option>
                <option value="verified">Verified Tickets Only</option>
                <option value="pending">Pending Tickets Only</option>
              </select>
            </div>

            <div className="form-group">
              <label>Schedule Date (Optional)</label>
              <input
                type="datetime-local"
                value={newCampaign.scheduledDate}
                onChange={(e) => setNewCampaign({ ...newCampaign, scheduledDate: e.target.value })}
              />
            </div>
          </div>

          <button className="send-campaign-btn" onClick={handleCreateCampaign}>
            <Send size={20} />
            Send Campaign
          </button>
        </div>

        <div className="campaigns-list">
          <h3>Previous Campaigns</h3>
          {campaigns.length === 0 ? (
            <div className="no-campaigns">
              <p>No campaigns sent yet</p>
            </div>
          ) : (
            campaigns.map(campaign => (
              <div key={campaign.id} className="campaign-card">
                <div className="campaign-header">
                  <h4>{campaign.name}</h4>
                  <span className={`status-badge ${campaign.status}`}>
                    {campaign.status}
                  </span>
                </div>
                <div className="campaign-details">
                  <div className="detail-item">
                    <Users size={16} />
                    <span>{campaign.recipients.length} recipients</span>
                  </div>
                  <div className="detail-item">
                    <Calendar size={16} />
                    <span>{new Date(campaign.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="campaign-message">
                  <p>{campaign.message}</p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="integration-guide">
          <h3>WhatsApp Business API Integration</h3>
          <p>For automated bulk messaging without manual intervention, integrate with:</p>
          <ul>
            <li><strong>WATI.io</strong> - Easiest setup, affordable pricing</li>
            <li><strong>Twilio WhatsApp API</strong> - Enterprise solution, reliable</li>
            <li><strong>Official WhatsApp Business API</strong> - Requires approval</li>
          </ul>
          <p>Current implementation opens WhatsApp Web for each recipient. Upgrade to API for full automation.</p>
        </div>
      </div>
    </div>
  );
}

export default MarketingCampaigns;
