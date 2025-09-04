import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { settingsAPI } from "../../utils/api";
import "./Settings.css";

const Settings = () => {
  const { user, token } = useAuth();
  const [settings, setSettings] = useState({
    // General Settings
    businessName: "",
    businessEmail: "",
    businessPhone: "",
    businessAddress: "",
    
    // Loyalty Program Settings
    pointsPerPound: 1,
    pointsExpiry: 365,
    defaultLevel: "Bronze",
    levelThresholds: {
      bronze: 0,
      silver: 500,
      gold: 1000,
      platinum: 2500
    },
    
    // Stamp Card Settings
    maxStampsPerCard: 10,
    stampCardExpiry: 30,
    stampsPerPurchase: 1,
    
    // Notification Settings
    emailNotifications: true,
    smsNotifications: false,
    customerWelcomeEmail: true,
    loyaltyUpdates: true,
    
    // System Settings
    timezone: "UTC",
    currency: "GBP",
    dateFormat: "DD/MM/YYYY",
    
    // Security Settings
    sessionTimeout: 168, // 7 days (24h * 7) to match JWT access token
    passwordExpiry: 90,
    twoFactorAuth: false
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState("general");

  useEffect(() => {
    fetchSettings();
  }, [token]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // In a real implementation, this would fetch from the API
      // For now, we'll use default values
      const response = await settingsAPI.getSettings();
      if (response.data) {
        setSettings(prev => ({ ...prev, ...response.data }));
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      setError("Failed to load settings. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLevelThresholdChange = (level, value) => {
    setSettings(prev => ({
      ...prev,
      levelThresholds: {
        ...prev.levelThresholds,
        [level]: parseInt(value) || 0
      }
    }));
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      // In a real implementation, this would save to the API
      await settingsAPI.updateSettings(settings);
      
      setSuccess("Settings saved successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error("Error saving settings:", error);
      setError("Failed to save settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: "general", label: "General", icon: "🏢" },
    { id: "loyalty", label: "Loyalty Program", icon: "🎁" },
    { id: "stamps", label: "Stamp Cards", icon: "📱" },
    { id: "notifications", label: "Notifications", icon: "🔔" },
    { id: "system", label: "System", icon: "⚙️" },
    { id: "security", label: "Security", icon: "🔒" }
  ];

  if (loading) {
    return (
      <div className="settings">
        <div className="settings-header">
          <h1>Settings</h1>
          <p>Configure your loyalty system</p>
        </div>
        <div className="settings-loading">
          <div className="loading-spinner"></div>
          <p>Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="settings">
      <div className="settings-header">
        <h1>Settings</h1>
        <p>Configure your loyalty system settings</p>
        <div className="settings-user-info">
          <span className="user-role">{user?.role?.replace('_', ' ').toUpperCase()}</span>
          <span className="user-name">{user?.first_name} {user?.last_name}</span>
        </div>
      </div>

      {error && (
        <div className="settings-alert settings-alert-error">
          <span className="alert-icon">⚠️</span>
          {error}
        </div>
      )}

      {success && (
        <div className="settings-alert settings-alert-success">
          <span className="alert-icon">✅</span>
          {success}
        </div>
      )}

      <div className="settings-container">
        <div className="settings-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="settings-content">
          {activeTab === "general" && (
            <div className="settings-section">
              <h2>General Settings</h2>
              <div className="settings-grid">
                <div className="settings-field">
                  <label>Business Name</label>
                  <input
                    type="text"
                    value={settings.businessName}
                    onChange={(e) => handleInputChange('businessName', e.target.value)}
                    placeholder="Enter business name"
                  />
                </div>
                <div className="settings-field">
                  <label>Business Email</label>
                  <input
                    type="email"
                    value={settings.businessEmail}
                    onChange={(e) => handleInputChange('businessEmail', e.target.value)}
                    placeholder="Enter business email"
                  />
                </div>
                <div className="settings-field">
                  <label>Business Phone</label>
                  <input
                    type="tel"
                    value={settings.businessPhone}
                    onChange={(e) => handleInputChange('businessPhone', e.target.value)}
                    placeholder="Enter business phone"
                  />
                </div>
                <div className="settings-field full-width">
                  <label>Business Address</label>
                  <textarea
                    value={settings.businessAddress}
                    onChange={(e) => handleInputChange('businessAddress', e.target.value)}
                    placeholder="Enter business address"
                    rows="3"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "loyalty" && (
            <div className="settings-section">
              <h2>Loyalty Program Settings</h2>
              <div className="settings-grid">
                <div className="settings-field">
                  <label>Points per £1 Spent</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={settings.pointsPerPound}
                    onChange={(e) => handleInputChange('pointsPerPound', parseInt(e.target.value))}
                  />
                </div>
                <div className="settings-field">
                  <label>Points Expiry (days)</label>
                  <input
                    type="number"
                    min="30"
                    max="730"
                    value={settings.pointsExpiry}
                    onChange={(e) => handleInputChange('pointsExpiry', parseInt(e.target.value))}
                  />
                </div>
                <div className="settings-field">
                  <label>Default Level</label>
                  <select
                    value={settings.defaultLevel}
                    onChange={(e) => handleInputChange('defaultLevel', e.target.value)}
                  >
                    <option value="Bronze">Bronze</option>
                    <option value="Silver">Silver</option>
                    <option value="Gold">Gold</option>
                    <option value="Platinum">Platinum</option>
                  </select>
                </div>
              </div>
              
              <h3>Level Thresholds (Points Required)</h3>
              <div className="settings-grid">
                <div className="settings-field">
                  <label>Bronze Level</label>
                  <input
                    type="number"
                    min="0"
                    value={settings.levelThresholds.bronze}
                    onChange={(e) => handleLevelThresholdChange('bronze', e.target.value)}
                  />
                </div>
                <div className="settings-field">
                  <label>Silver Level</label>
                  <input
                    type="number"
                    min="1"
                    value={settings.levelThresholds.silver}
                    onChange={(e) => handleLevelThresholdChange('silver', e.target.value)}
                  />
                </div>
                <div className="settings-field">
                  <label>Gold Level</label>
                  <input
                    type="number"
                    min="1"
                    value={settings.levelThresholds.gold}
                    onChange={(e) => handleLevelThresholdChange('gold', e.target.value)}
                  />
                </div>
                <div className="settings-field">
                  <label>Platinum Level</label>
                  <input
                    type="number"
                    min="1"
                    value={settings.levelThresholds.platinum}
                    onChange={(e) => handleLevelThresholdChange('platinum', e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "stamps" && (
            <div className="settings-section">
              <h2>Stamp Card Settings</h2>
              <div className="settings-grid">
                <div className="settings-field">
                  <label>Max Stamps per Card</label>
                  <input
                    type="number"
                    min="5"
                    max="20"
                    value={settings.maxStampsPerCard}
                    onChange={(e) => handleInputChange('maxStampsPerCard', parseInt(e.target.value))}
                  />
                </div>
                <div className="settings-field">
                  <label>Stamp Card Expiry (days)</label>
                  <input
                    type="number"
                    min="7"
                    max="365"
                    value={settings.stampCardExpiry}
                    onChange={(e) => handleInputChange('stampCardExpiry', parseInt(e.target.value))}
                  />
                </div>
                <div className="settings-field">
                  <label>Stamps per Purchase</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={settings.stampsPerPurchase}
                    onChange={(e) => handleInputChange('stampsPerPurchase', parseInt(e.target.value))}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="settings-section">
              <h2>Notification Settings</h2>
              <div className="settings-toggles">
                <div className="settings-toggle">
                  <label>
                    <input
                      type="checkbox"
                      checked={settings.emailNotifications}
                      onChange={(e) => handleInputChange('emailNotifications', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                    Email Notifications
                  </label>
                  <p>Send email notifications to customers</p>
                </div>
                <div className="settings-toggle">
                  <label>
                    <input
                      type="checkbox"
                      checked={settings.smsNotifications}
                      onChange={(e) => handleInputChange('smsNotifications', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                    SMS Notifications
                  </label>
                  <p>Send SMS notifications to customers</p>
                </div>
                <div className="settings-toggle">
                  <label>
                    <input
                      type="checkbox"
                      checked={settings.customerWelcomeEmail}
                      onChange={(e) => handleInputChange('customerWelcomeEmail', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                    Customer Welcome Email
                  </label>
                  <p>Send welcome email to new customers</p>
                </div>
                <div className="settings-toggle">
                  <label>
                    <input
                      type="checkbox"
                      checked={settings.loyaltyUpdates}
                      onChange={(e) => handleInputChange('loyaltyUpdates', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                    Loyalty Updates
                  </label>
                  <p>Send notifications about points and rewards</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "system" && (
            <div className="settings-section">
              <h2>System Settings</h2>
              <div className="settings-grid">
                <div className="settings-field">
                  <label>Timezone</label>
                  <select
                    value={settings.timezone}
                    onChange={(e) => handleInputChange('timezone', e.target.value)}
                  >
                    <option value="UTC">UTC</option>
                    <option value="Europe/London">London (GMT/BST)</option>
                    <option value="America/New_York">New York (EST/EDT)</option>
                    <option value="America/Los_Angeles">Los Angeles (PST/PDT)</option>
                    <option value="Asia/Tokyo">Tokyo (JST)</option>
                    <option value="Australia/Sydney">Sydney (AEST/AEDT)</option>
                  </select>
                </div>
                <div className="settings-field">
                  <label>Currency</label>
                  <select
                    value={settings.currency}
                    onChange={(e) => handleInputChange('currency', e.target.value)}
                  >
                    <option value="GBP">GBP (£)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="JPY">JPY (¥)</option>
                    <option value="AUD">AUD (A$)</option>
                  </select>
                </div>
                <div className="settings-field">
                  <label>Date Format</label>
                  <select
                    value={settings.dateFormat}
                    onChange={(e) => handleInputChange('dateFormat', e.target.value)}
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="settings-section">
              <h2>Security Settings</h2>
              <div className="settings-grid">
                <div className="settings-field">
                  <label>Session Timeout (hours)</label>
                  <input
                    type="number"
                    min="1"
                    max="168"
                    value={settings.sessionTimeout}
                    onChange={(e) => handleInputChange('sessionTimeout', parseInt(e.target.value))}
                  />
                </div>
                <div className="settings-field">
                  <label>Password Expiry (days)</label>
                  <input
                    type="number"
                    min="30"
                    max="365"
                    value={settings.passwordExpiry}
                    onChange={(e) => handleInputChange('passwordExpiry', parseInt(e.target.value))}
                  />
                </div>
              </div>
              <div className="settings-toggles">
                <div className="settings-toggle">
                  <label>
                    <input
                      type="checkbox"
                      checked={settings.twoFactorAuth}
                      onChange={(e) => handleInputChange('twoFactorAuth', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                    Two-Factor Authentication
                  </label>
                  <p>Require 2FA for admin users</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="settings-actions">
        <button
          className="settings-save-btn"
          onClick={handleSaveSettings}
          disabled={saving}
        >
          {saving ? (
            <>
              <span className="btn-spinner"></span>
              Saving...
            </>
          ) : (
            <>
              <span className="btn-icon">💾</span>
              Save Settings
            </>
          )}
        </button>
        
        <button
          className="settings-reset-btn"
          onClick={fetchSettings}
          disabled={saving}
        >
          <span className="btn-icon">🔄</span>
          Reset
        </button>
      </div>
    </div>
  );
};

export default Settings;
