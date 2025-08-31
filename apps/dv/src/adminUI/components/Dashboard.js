import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { analyticsAPI } from "../../utils/api";
import "./Dashboard.css";

const Dashboard = () => {
  const { user, token } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, [token, selectedPeriod]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await analyticsAPI.getDashboardAnalytics(selectedPeriod);
      setDashboardData(data);
      setLastUpdated(new Date(data.lastUpdated));
      
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setError(error.message || "Failed to fetch dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    if (num === null || num === undefined) return "0";
    return new Intl.NumberFormat("en-GB").format(num);
  };

  const formatPercentage = (num) => {
    if (num === null || num === undefined) return "0.0";
    return Math.abs(num).toFixed(1);
  };

  const getGrowthColor = (growth) => {
    if (growth === null || growth === undefined) return "neutral";
    return growth >= 0 ? "positive" : "negative";
  };

  const getGrowthIcon = (growth) => {
    if (growth === null || growth === undefined) return "→";
    return growth >= 0 ? "↗️" : "↘️";
  };

  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "morning";
    if (hour < 17) return "afternoon";
    return "evening";
  };

  const getPeriodLabel = (period) => {
    const labels = {
      week: "Last 7 Days",
      month: "Last 30 Days", 
      quarter: "Last 3 Months",
      year: "Last Year"
    };
    return labels[period] || labels.month;
  };

  const getActivityDescription = (activity) => {
    switch (activity.type) {
      case 'scan':
        return `${activity.user} scanned at ${activity.store}`;
      case 'user_registration':
        return `${activity.user} joined the platform`;
      case 'reward_completion':
        return `${activity.user} completed ${activity.reward}`;
      default:
        return 'Unknown activity';
    }
  };

  const getActivityIcon = (type) => {
    const icons = {
      scan: '📱',
      user_registration: '👤',
      reward_completion: '🎁',
      store_activity: '🏪'
    };
    return icons[type] || '📊';
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="ai-loading-container">
          <div className="ai-loading-spinner">
            <div className="spinner-ring"></div>
            <div className="spinner-ring"></div>
            <div className="spinner-ring"></div>
          </div>
          <div className="loading-text">
            <h3>Loading Analytics Dashboard</h3>
            <p>Fetching real-time business data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h3>Unable to Load Dashboard</h3>
          <p>{error}</p>
          <button 
            onClick={fetchDashboardData}
            className="retry-button"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="dashboard-empty">
        <div className="empty-container">
          <div className="empty-icon">📊</div>
          <h3>No Data Available</h3>
          <p>Dashboard data is not available at the moment.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Header Section */}
      <div className="dashboard-header">
        <div className="ai-header-background">
          <div className="ai-particles"></div>
          <div className="ai-grid"></div>
        </div>
        <div className="dashboard-header-content">
          <div className="dashboard-title">
            <div className="ai-title-container">
              <div className="ai-subtitle">
                <p>
                  Good {getTimeOfDay()}, {user?.first_name}! Your business insights are ready.
                </p>
                <div className="ai-status">
                  <span className="status-dot"></span>
                  <span className="status-text">
                    Live Data • Updated {lastUpdated ? lastUpdated.toLocaleTimeString() : 'recently'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="dashboard-controls">
            <div className="ai-controls">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="ai-period-select"
              >
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
                <option value="quarter">Last 3 Months</option>
                <option value="year">Last Year</option>
              </select>
              <button 
                className="ai-refresh-btn"
                onClick={fetchDashboardData}
                title="Refresh Data"
              >
                <span className="refresh-icon">🔄</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="dashboard-metrics compact-metrics">
        <div className="metric-card ai-metric users-metric compact">
          <div className="metric-glow"></div>
          <div className="metric-content">
            <div className="metric-header">
              <div className="metric-icon">👥</div>
            </div>
            <div className="metric-value">
              {formatNumber(dashboardData.users?.total || 0)}
            </div>
            <div className="metric-label">Total Users</div>
            <div className={`metric-growth ${getGrowthColor(dashboardData.users?.growth)}`}>
              {getGrowthIcon(dashboardData.users?.growth)} {formatPercentage(dashboardData.users?.growth)}%
            </div>
          </div>
        </div>

        <div className="metric-card ai-metric stores-metric compact">
          <div className="metric-glow"></div>
          <div className="metric-content">
            <div className="metric-header">
              <div className="metric-icon">🏪</div>
            </div>
            <div className="metric-value">
              {formatNumber(dashboardData.stores?.total || 0)}
            </div>
            <div className="metric-label">Total Stores</div>
            <div className={`metric-growth ${getGrowthColor(dashboardData.stores?.growth)}`}>
              {getGrowthIcon(dashboardData.stores?.growth)} {formatPercentage(dashboardData.stores?.growth)}%
            </div>
          </div>
        </div>

        <div className="metric-card ai-metric rewards-metric compact">
          <div className="metric-glow"></div>
          <div className="metric-content">
            <div className="metric-header">
              <div className="metric-icon">🎁</div>
            </div>
            <div className="metric-value">
              {formatNumber(dashboardData.rewards?.total || 0)}
            </div>
            <div className="metric-label">Active Rewards</div>
            <div className={`metric-growth ${getGrowthColor(dashboardData.rewards?.growth)}`}>
              {getGrowthIcon(dashboardData.rewards?.growth)} {formatPercentage(dashboardData.rewards?.growth)}%
            </div>
          </div>
        </div>

        <div className="metric-card ai-metric activity-metric compact">
          <div className="metric-glow"></div>
          <div className="metric-content">
            <div className="metric-header">
              <div className="metric-icon">⚡</div>
            </div>
            <div className="metric-value">
              {formatNumber(dashboardData.business?.totalActivity || 0)}
            </div>
            <div className="metric-label">Total Activity</div>
            <div className={`metric-growth ${getGrowthColor(dashboardData.business?.activityGrowth)}`}>
              {getGrowthIcon(dashboardData.business?.activityGrowth)} {formatPercentage(dashboardData.business?.activityGrowth)}%
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Grid */}
      <div className="dashboard-analytics">
        {/* User Analytics */}
        <div className="analytics-card ai-analytics users-analytics">
          <div className="analytics-glow"></div>
          <div className="analytics-header">
            <h3>👥 User Intelligence</h3>
            <div className="analytics-actions">
              <button className="ai-btn">View Details</button>
            </div>
          </div>
          <div className="analytics-content">
            <div className="analytics-stats">
              <div className="stat-item">
                <div className="stat-value">
                  {formatNumber(dashboardData.users?.active || 0)}
                </div>
                <div className="stat-label">Active Users</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">
                  {formatNumber(dashboardData.users?.newThisPeriod || 0)}
                </div>
                <div className="stat-label">New This Period</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">
                  {formatNumber(dashboardData.users?.engagement?.activeScanners || 0)}
                </div>
                <div className="stat-label">Active Scanners</div>
              </div>
            </div>
            {dashboardData.users?.topRoles && dashboardData.users.topRoles.length > 0 && (
              <div className="analytics-chart">
                <div className="chart-title">User Distribution by Role</div>
                <div className="role-distribution">
                  {dashboardData.users.topRoles.map((role, index) => (
                    <div key={index} className="role-item">
                      <div className="role-info">
                        <span className="role-name">{role.role}</span>
                        <span className="role-count">{formatNumber(role.count)}</span>
                      </div>
                      <div className="role-bar">
                        <div
                          className="role-bar-fill"
                          style={{ width: `${Math.min(role.percentage, 100)}%` }}
                        ></div>
                      </div>
                      <span className="role-percentage">{formatPercentage(role.percentage)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Store Analytics */}
        <div className="analytics-card ai-analytics stores-analytics">
          <div className="analytics-glow"></div>
          <div className="analytics-header">
            <h3>🏪 Store Network</h3>
            <div className="analytics-actions">
              <button className="ai-btn">View Details</button>
            </div>
          </div>
          <div className="analytics-content">
            <div className="analytics-stats">
              <div className="stat-item">
                <div className="stat-value">
                  {formatNumber(dashboardData.stores?.active || 0)}
                </div>
                <div className="stat-label">Active Stores</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">
                  {formatNumber(dashboardData.stores?.newThisPeriod || 0)}
                </div>
                <div className="stat-label">New This Period</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">
                  {formatPercentage(dashboardData.business?.customerSatisfaction || 0)}/5
                </div>
                <div className="stat-label">Satisfaction</div>
              </div>
            </div>
            {dashboardData.stores?.topCities && dashboardData.stores.topCities.length > 0 && (
              <div className="analytics-chart">
                <div className="chart-title">Store Distribution by City</div>
                <div className="city-distribution">
                  {dashboardData.stores.topCities.map((city, index) => (
                    <div key={index} className="city-item">
                      <div className="city-info">
                        <span className="city-name">{city.city}</span>
                        <span className="city-count">{formatNumber(city.count)}</span>
                      </div>
                      <div className="city-bar">
                        <div
                          className="city-bar-fill"
                          style={{ width: `${Math.min(city.percentage, 100)}%` }}
                        ></div>
                      </div>
                      <span className="city-percentage">{formatPercentage(city.percentage)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Rewards Analytics */}
        <div className="analytics-card ai-analytics rewards-analytics">
          <div className="analytics-glow"></div>
          <div className="analytics-header">
            <h3>🎁 Reward Engine</h3>
            <div className="analytics-actions">
              <button className="ai-btn">View Details</button>
            </div>
          </div>
          <div className="analytics-content">
            <div className="analytics-stats">
              <div className="stat-item">
                <div className="stat-value">
                  {formatNumber(dashboardData.rewards?.active || 0)}
                </div>
                <div className="stat-label">Active Rewards</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">
                  {formatNumber(dashboardData.rewards?.completedThisPeriod || 0)}
                </div>
                <div className="stat-label">Completed</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">
                  {formatPercentage(dashboardData.rewards?.engagement?.avgCompletionRate || 0)}%
                </div>
                <div className="stat-label">Completion Rate</div>
              </div>
            </div>
            {dashboardData.rewards?.topTypes && dashboardData.rewards.topTypes.length > 0 && (
              <div className="analytics-chart">
                <div className="chart-title">Reward Distribution by Type</div>
                <div className="reward-distribution">
                  {dashboardData.rewards.topTypes.map((type, index) => (
                    <div key={index} className="reward-item">
                      <div className="reward-info">
                        <span className="reward-name">{type.type}</span>
                        <span className="reward-count">{formatNumber(type.count)}</span>
                      </div>
                      <div className="reward-bar">
                        <div
                          className="reward-bar-fill"
                          style={{ width: `${Math.min(type.percentage, 100)}%` }}
                        ></div>
                      </div>
                      <span className="reward-percentage">{formatPercentage(type.percentage)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="analytics-card ai-analytics quick-actions">
          <div className="analytics-glow"></div>
          <div className="analytics-header">
            <h3>⚡ Quick Actions</h3>
          </div>
          <div className="analytics-content">
            <div className="action-grid">
              <button className="ai-action-btn">
                <span className="action-icon">➕</span>
                <span className="action-text">Add User</span>
                <div className="action-glow"></div>
              </button>
              <button className="ai-action-btn">
                <span className="action-icon">🏪</span>
                <span className="action-text">Add Store</span>
                <div className="action-glow"></div>
              </button>
              <button className="ai-action-btn">
                <span className="action-icon">🎁</span>
                <span className="action-text">Create Reward</span>
                <div className="action-glow"></div>
              </button>
              <button className="ai-action-btn">
                <span className="action-icon">📊</span>
                <span className="action-text">View Reports</span>
                <div className="action-glow"></div>
              </button>
              <button className="ai-action-btn">
                <span className="action-icon">📱</span>
                <span className="action-text">QR Scanner</span>
                <div className="action-glow"></div>
              </button>
              <button className="ai-action-btn">
                <span className="action-icon">⚙️</span>
                <span className="action-text">Settings</span>
                <div className="action-glow"></div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      {dashboardData.activity && dashboardData.activity.length > 0 && (
        <div className="dashboard-activity">
          <div className="activity-header">
            <h3>🔮 Recent Activity</h3>
            <div className="activity-period">
              {getPeriodLabel(selectedPeriod)}
            </div>
          </div>
          <div className="activity-list">
            {dashboardData.activity.slice(0, 8).map((activity, index) => (
              <div key={index} className="activity-item ai-activity">
                <div className="activity-icon">{getActivityIcon(activity.type)}</div>
                <div className="activity-content">
                  <div className="activity-title">{getActivityDescription(activity)}</div>
                  <div className="activity-time">{activity.timeAgo}</div>
                </div>
                <div className="activity-glow"></div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
