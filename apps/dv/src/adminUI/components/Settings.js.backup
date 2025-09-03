import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import "./Settings.css";

const Settings = () => {
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("general");
  const [settings, setSettings] = useState({
    general: {
      company_name: "Loyalty System",
      company_email: "admin@loyalty.com",
      timezone: "UTC",
      date_format: "DD/MM/YYYY",
      currency: "USD",
    },
    notifications: {
      email_notifications: true,
      sms_notifications: false,
      push_notifications: true,
      daily_reports: true,
      weekly_reports: false,
    },
    security: {
      two_factor_auth: false,
      session_timeout: 30,
      password_expiry: 90,
      max_login_attempts: 5,
    },
    integrations: {
      email_provider: "smtp",
      sms_provider: "twilio",
      payment_gateway: "stripe",
      analytics: "google",
    },
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/admin/settings", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      // Keep default settings for development
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (category, key, value) => {
    setSettings((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value,
      },
    }));
  };

  const handleSave = async (category) => {
    try {
      const response = await fetch(`/api/admin/settings/${category}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings[category]),
      });

      if (response.ok) {
        // Show success message
        console.log(`${category} settings saved successfully`);
      }
    } catch (error) {
      console.error("Error saving settings:", error);
    }
  };

  const tabs = [
    { id: "general", label: "General", icon: "⚙️" },
    { id: "notifications", label: "Notifications", icon: "🔔" },
    { id: "security", label: "Security", icon: "🔒" },
    { id: "integrations", label: "Integrations", icon: "🔗" },
  ];

  if (loading) {
    return (
      <div className="settings-loading">
        <div className="loading-spinner"></div>
        <p>Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="settings fade-in">
      {/* Header */}
      <div className="settings-header">
        <div className="header-content">
          <h2>System Settings</h2>
          <p>Configure system preferences and integrations</p>
        </div>
      </div>

      <div className="settings-container">
        {/* Tabs */}
        <div className="settings-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="settings-content">
          {activeTab === "general" && (
            <div className="settings-section">
              <h3>General Settings</h3>
              <div className="settings-form">
                <div className="form-group">
                  <label>Company Name</label>
                  <input
                    type="text"
                    value={settings.general.company_name}
                    onChange={(e) =>
                      handleSettingChange(
                        "general",
                        "company_name",
                        e.target.value
                      )
                    }
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>Company Email</label>
                  <input
                    type="email"
                    value={settings.general.company_email}
                    onChange={(e) =>
                      handleSettingChange(
                        "general",
                        "company_email",
                        e.target.value
                      )
                    }
                    className="form-input"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Timezone</label>
                    <select
                      value={settings.general.timezone}
                      onChange={(e) =>
                        handleSettingChange(
                          "general",
                          "timezone",
                          e.target.value
                        )
                      }
                      className="form-select"
                    >
                      <option value="UTC">UTC</option>
                      <option value="EST">Eastern Time</option>
                      <option value="PST">Pacific Time</option>
                      <option value="GMT">GMT</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Date Format</label>
                    <select
                      value={settings.general.date_format}
                      onChange={(e) =>
                        handleSettingChange(
                          "general",
                          "date_format",
                          e.target.value
                        )
                      }
                      className="form-select"
                    >
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Currency</label>
                  <select
                    value={settings.general.currency}
                    onChange={(e) =>
                      handleSettingChange("general", "currency", e.target.value)
                    }
                    className="form-select"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="CAD">CAD (C$)</option>
                  </select>
                </div>

                <div className="form-actions">
                  <button
                    onClick={() => handleSave("general")}
                    className="btn-primary"
                  >
                    Save General Settings
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="settings-section">
              <h3>Notification Settings</h3>
              <div className="settings-form">
                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={settings.notifications.email_notifications}
                      onChange={(e) =>
                        handleSettingChange(
                          "notifications",
                          "email_notifications",
                          e.target.checked
                        )
                      }
                      className="form-checkbox"
                    />
                    <span>Email Notifications</span>
                  </label>
                </div>

                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={settings.notifications.sms_notifications}
                      onChange={(e) =>
                        handleSettingChange(
                          "notifications",
                          "sms_notifications",
                          e.target.checked
                        )
                      }
                      className="form-checkbox"
                    />
                    <span>SMS Notifications</span>
                  </label>
                </div>

                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={settings.notifications.push_notifications}
                      onChange={(e) =>
                        handleSettingChange(
                          "notifications",
                          "push_notifications",
                          e.target.checked
                        )
                      }
                      className="form-checkbox"
                    />
                    <span>Push Notifications</span>
                  </label>
                </div>

                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={settings.notifications.daily_reports}
                      onChange={(e) =>
                        handleSettingChange(
                          "notifications",
                          "daily_reports",
                          e.target.checked
                        )
                      }
                      className="form-checkbox"
                    />
                    <span>Daily Reports</span>
                  </label>
                </div>

                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={settings.notifications.weekly_reports}
                      onChange={(e) =>
                        handleSettingChange(
                          "notifications",
                          "weekly_reports",
                          e.target.checked
                        )
                      }
                      className="form-checkbox"
                    />
                    <span>Weekly Reports</span>
                  </label>
                </div>

                <div className="form-actions">
                  <button
                    onClick={() => handleSave("notifications")}
                    className="btn-primary"
                  >
                    Save Notification Settings
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="settings-section">
              <h3>Security Settings</h3>
              <div className="settings-form">
                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={settings.security.two_factor_auth}
                      onChange={(e) =>
                        handleSettingChange(
                          "security",
                          "two_factor_auth",
                          e.target.checked
                        )
                      }
                      className="form-checkbox"
                    />
                    <span>Two-Factor Authentication</span>
                  </label>
                </div>

                <div className="form-group">
                  <label>Session Timeout (minutes)</label>
                  <input
                    type="number"
                    value={settings.security.session_timeout}
                    onChange={(e) =>
                      handleSettingChange(
                        "security",
                        "session_timeout",
                        parseInt(e.target.value)
                      )
                    }
                    className="form-input"
                    min="5"
                    max="480"
                  />
                </div>

                <div className="form-group">
                  <label>Password Expiry (days)</label>
                  <input
                    type="number"
                    value={settings.security.password_expiry}
                    onChange={(e) =>
                      handleSettingChange(
                        "security",
                        "password_expiry",
                        parseInt(e.target.value)
                      )
                    }
                    className="form-input"
                    min="30"
                    max="365"
                  />
                </div>

                <div className="form-group">
                  <label>Max Login Attempts</label>
                  <input
                    type="number"
                    value={settings.security.max_login_attempts}
                    onChange={(e) =>
                      handleSettingChange(
                        "security",
                        "max_login_attempts",
                        parseInt(e.target.value)
                      )
                    }
                    className="form-input"
                    min="3"
                    max="10"
                  />
                </div>

                <div className="form-actions">
                  <button
                    onClick={() => handleSave("security")}
                    className="btn-primary"
                  >
                    Save Security Settings
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "integrations" && (
            <div className="settings-section">
              <h3>Integration Settings</h3>
              <div className="settings-form">
                <div className="form-group">
                  <label>Email Provider</label>
                  <select
                    value={settings.integrations.email_provider}
                    onChange={(e) =>
                      handleSettingChange(
                        "integrations",
                        "email_provider",
                        e.target.value
                      )
                    }
                    className="form-select"
                  >
                    <option value="smtp">SMTP</option>
                    <option value="sendgrid">SendGrid</option>
                    <option value="mailgun">Mailgun</option>
                    <option value="aws-ses">AWS SES</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>SMS Provider</label>
                  <select
                    value={settings.integrations.sms_provider}
                    onChange={(e) =>
                      handleSettingChange(
                        "integrations",
                        "sms_provider",
                        e.target.value
                      )
                    }
                    className="form-select"
                  >
                    <option value="twilio">Twilio</option>
                    <option value="aws-sns">AWS SNS</option>
                    <option value="nexmo">Nexmo</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Payment Gateway</label>
                  <select
                    value={settings.integrations.payment_gateway}
                    onChange={(e) =>
                      handleSettingChange(
                        "integrations",
                        "payment_gateway",
                        e.target.value
                      )
                    }
                    className="form-select"
                  >
                    <option value="stripe">Stripe</option>
                    <option value="paypal">PayPal</option>
                    <option value="square">Square</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Analytics</label>
                  <select
                    value={settings.integrations.analytics}
                    onChange={(e) =>
                      handleSettingChange(
                        "integrations",
                        "analytics",
                        e.target.value
                      )
                    }
                    className="form-select"
                  >
                    <option value="google">Google Analytics</option>
                    <option value="mixpanel">Mixpanel</option>
                    <option value="amplitude">Amplitude</option>
                  </select>
                </div>

                <div className="form-actions">
                  <button
                    onClick={() => handleSave("integrations")}
                    className="btn-primary"
                  >
                    Save Integration Settings
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
