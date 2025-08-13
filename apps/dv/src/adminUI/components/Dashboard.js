import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import "./Dashboard.css";

const Dashboard = () => {
  const { user, token } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    users: {
      total: 0,
      active: 0,
      newThisMonth: 0,
      growth: 0,
      topRoles: [],
    },
    stores: {
      total: 0,
      active: 0,
      newThisMonth: 0,
      growth: 0,
      topCities: [],
    },
    rewards: {
      total: 0,
      active: 0,
      redeemed: 0,
      growth: 0,
      topTypes: [],
    },
    analytics: {
      totalRevenue: 0,
      monthlyGrowth: 0,
      customerSatisfaction: 0,
      retentionRate: 0,
    },
  });
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [animatedValues, setAnimatedValues] = useState({
    users: 0,
    stores: 0,
    rewards: 0,
    revenue: 0,
  });

  useEffect(() => {
    fetchDashboardData();
  }, [token, selectedPeriod]);

  useEffect(() => {
    if (!loading) {
      animateValues();
    }
  }, [loading, dashboardData]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Simulated API call - replace with actual API
      const mockData = {
        users: {
          total: 1247,
          active: 1189,
          newThisMonth: 89,
          growth: 12.5,
          topRoles: [
            { role: "Customer", count: 892, percentage: 71.5 },
            { role: "Store Manager", count: 234, percentage: 18.8 },
            { role: "Admin", count: 121, percentage: 9.7 },
          ],
        },
        stores: {
          total: 156,
          active: 142,
          newThisMonth: 12,
          growth: 8.3,
          topCities: [
            { city: "London", count: 45, percentage: 28.8 },
            { city: "Manchester", count: 32, percentage: 20.5 },
            { city: "Birmingham", count: 28, percentage: 17.9 },
            { city: "Liverpool", count: 23, percentage: 14.7 },
            { city: "Leeds", count: 18, percentage: 11.5 },
          ],
        },
        rewards: {
          total: 89,
          active: 76,
          redeemed: 2347,
          growth: 15.2,
          topTypes: [
            { type: "Discount", count: 34, percentage: 38.2 },
            { type: "Free Item", count: 23, percentage: 25.8 },
            { type: "Points Bonus", count: 18, percentage: 20.2 },
            { type: "Cashback", count: 14, percentage: 15.7 },
          ],
        },
        analytics: {
          totalRevenue: 284750,
          monthlyGrowth: 18.5,
          customerSatisfaction: 4.6,
          retentionRate: 87.3,
        },
      };

      setDashboardData(mockData);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const animateValues = () => {
    const duration = 2000;
    const steps = 60;
    const stepDuration = duration / steps;

    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      const easeOut = 1 - Math.pow(1 - progress, 3);

      setAnimatedValues({
        users: Math.floor(dashboardData.users.total * easeOut),
        stores: Math.floor(dashboardData.stores.total * easeOut),
        rewards: Math.floor(dashboardData.rewards.total * easeOut),
        revenue: Math.floor(dashboardData.analytics.totalRevenue * easeOut),
      });

      if (currentStep >= steps) {
        clearInterval(interval);
      }
    }, stepDuration);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
    }).format(amount);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat("en-GB").format(num);
  };

  const getGrowthColor = (growth) => {
    return growth >= 0 ? "positive" : "negative";
  };

  const getGrowthIcon = (growth) => {
    return growth >= 0 ? "↗️" : "↘️";
  };

  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "morning";
    if (hour < 17) return "afternoon";
    return "evening";
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
            <h3>Initializing AI Dashboard</h3>
            <p>Analyzing business metrics...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* AI Header Section */}
      <div className="dashboard-header">
        <div className="ai-header-background">
          <div className="ai-particles"></div>
          <div className="ai-grid"></div>
        </div>
        <div className="dashboard-header-content">
          <div className="dashboard-title">
            <div className="ai-title-container">
              <h1 className="ai-title">
                <span className="ai-icon">🤖</span>
                AI Analytics Dashboard
              </h1>
              <div className="ai-subtitle">
                <p>
                  Good {getTimeOfDay()}, {user?.first_name}! Your business
                  intelligence is ready.
                </p>
                <div className="ai-status">
                  <span className="status-dot"></span>
                  <span className="status-text">AI Analysis Complete</span>
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
              <div className="ai-refresh-btn">
                <span className="refresh-icon">🔄</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Metrics Cards */}
      <div className="dashboard-metrics">
        <div className="metric-card ai-metric users-metric">
          <div className="metric-glow"></div>
          <div className="metric-content">
            <div className="metric-header">
              <div className="metric-icon">👥</div>
              <div className="metric-badge">Live</div>
            </div>
            <div className="metric-value">
              {formatNumber(animatedValues.users)}
            </div>
            <div className="metric-label">Total Users</div>
            <div
              className={`metric-growth ${getGrowthColor(
                dashboardData.users.growth
              )}`}
            >
              {getGrowthIcon(dashboardData.users.growth)}{" "}
              {Math.abs(dashboardData.users.growth)}%
            </div>
          </div>
          <div className="metric-chart">
            <div className="ai-chart">
              <div className="chart-bar" style={{ height: "60%" }}></div>
              <div className="chart-bar" style={{ height: "80%" }}></div>
              <div className="chart-bar" style={{ height: "45%" }}></div>
              <div className="chart-bar" style={{ height: "90%" }}></div>
              <div className="chart-bar" style={{ height: "70%" }}></div>
              <div className="chart-bar" style={{ height: "85%" }}></div>
              <div className="chart-bar" style={{ height: "75%" }}></div>
            </div>
          </div>
        </div>

        <div className="metric-card ai-metric stores-metric">
          <div className="metric-glow"></div>
          <div className="metric-content">
            <div className="metric-header">
              <div className="metric-icon">🏪</div>
              <div className="metric-badge">Active</div>
            </div>
            <div className="metric-value">
              {formatNumber(animatedValues.stores)}
            </div>
            <div className="metric-label">Active Stores</div>
            <div
              className={`metric-growth ${getGrowthColor(
                dashboardData.stores.growth
              )}`}
            >
              {getGrowthIcon(dashboardData.stores.growth)}{" "}
              {Math.abs(dashboardData.stores.growth)}%
            </div>
          </div>
          <div className="metric-chart">
            <div className="ai-chart">
              <div className="chart-bar" style={{ height: "70%" }}></div>
              <div className="chart-bar" style={{ height: "85%" }}></div>
              <div className="chart-bar" style={{ height: "60%" }}></div>
              <div className="chart-bar" style={{ height: "90%" }}></div>
              <div className="chart-bar" style={{ height: "75%" }}></div>
              <div className="chart-bar" style={{ height: "80%" }}></div>
              <div className="chart-bar" style={{ height: "65%" }}></div>
            </div>
          </div>
        </div>

        <div className="metric-card ai-metric rewards-metric">
          <div className="metric-glow"></div>
          <div className="metric-content">
            <div className="metric-header">
              <div className="metric-icon">🎁</div>
              <div className="metric-badge">Hot</div>
            </div>
            <div className="metric-value">
              {formatNumber(animatedValues.rewards)}
            </div>
            <div className="metric-label">Active Rewards</div>
            <div
              className={`metric-growth ${getGrowthColor(
                dashboardData.rewards.growth
              )}`}
            >
              {getGrowthIcon(dashboardData.rewards.growth)}{" "}
              {Math.abs(dashboardData.rewards.growth)}%
            </div>
          </div>
          <div className="metric-chart">
            <div className="ai-chart">
              <div className="chart-bar" style={{ height: "80%" }}></div>
              <div className="chart-bar" style={{ height: "65%" }}></div>
              <div className="chart-bar" style={{ height: "90%" }}></div>
              <div className="chart-bar" style={{ height: "70%" }}></div>
              <div className="chart-bar" style={{ height: "85%" }}></div>
              <div className="chart-bar" style={{ height: "75%" }}></div>
              <div className="chart-bar" style={{ height: "80%" }}></div>
            </div>
          </div>
        </div>

        <div className="metric-card ai-metric revenue-metric">
          <div className="metric-glow"></div>
          <div className="metric-content">
            <div className="metric-header">
              <div className="metric-icon">💰</div>
              <div className="metric-badge">Trending</div>
            </div>
            <div className="metric-value">
              {formatCurrency(animatedValues.revenue)}
            </div>
            <div className="metric-label">Total Revenue</div>
            <div
              className={`metric-growth ${getGrowthColor(
                dashboardData.analytics.monthlyGrowth
              )}`}
            >
              {getGrowthIcon(dashboardData.analytics.monthlyGrowth)}{" "}
              {Math.abs(dashboardData.analytics.monthlyGrowth)}%
            </div>
          </div>
          <div className="metric-chart">
            <div className="ai-chart">
              <div className="chart-bar" style={{ height: "75%" }}></div>
              <div className="chart-bar" style={{ height: "85%" }}></div>
              <div className="chart-bar" style={{ height: "90%" }}></div>
              <div className="chart-bar" style={{ height: "80%" }}></div>
              <div className="chart-bar" style={{ height: "95%" }}></div>
              <div className="chart-bar" style={{ height: "88%" }}></div>
              <div className="chart-bar" style={{ height: "92%" }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Analytics Grid */}
      <div className="dashboard-analytics">
        {/* User Analytics */}
        <div className="analytics-card ai-analytics users-analytics">
          <div className="analytics-glow"></div>
          <div className="analytics-header">
            <h3>🤖 User Intelligence</h3>
            <div className="analytics-actions">
              <button className="ai-btn">View Details</button>
            </div>
          </div>
          <div className="analytics-content">
            <div className="analytics-stats">
              <div className="stat-item">
                <div className="stat-value">
                  {formatNumber(dashboardData.users.active)}
                </div>
                <div className="stat-label">Active Users</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">
                  {formatNumber(dashboardData.users.newThisMonth)}
                </div>
                <div className="stat-label">New This Month</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">
                  {dashboardData.analytics.retentionRate}%
                </div>
                <div className="stat-label">Retention Rate</div>
              </div>
            </div>
            <div className="analytics-chart">
              <div className="chart-title">User Distribution by Role</div>
              <div className="role-distribution">
                {dashboardData.users.topRoles.map((role, index) => (
                  <div key={index} className="role-item">
                    <div className="role-info">
                      <span className="role-name">{role.role}</span>
                      <span className="role-count">
                        {formatNumber(role.count)}
                      </span>
                    </div>
                    <div className="role-bar">
                      <div
                        className="role-bar-fill"
                        style={{ width: `${role.percentage}%` }}
                      ></div>
                    </div>
                    <span className="role-percentage">{role.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
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
                  {formatNumber(dashboardData.stores.active)}
                </div>
                <div className="stat-label">Active Stores</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">
                  {formatNumber(dashboardData.stores.newThisMonth)}
                </div>
                <div className="stat-label">New This Month</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">
                  {dashboardData.analytics.customerSatisfaction}/5
                </div>
                <div className="stat-label">Satisfaction</div>
              </div>
            </div>
            <div className="analytics-chart">
              <div className="chart-title">Store Distribution by City</div>
              <div className="city-distribution">
                {dashboardData.stores.topCities.map((city, index) => (
                  <div key={index} className="city-item">
                    <div className="city-info">
                      <span className="city-name">{city.city}</span>
                      <span className="city-count">
                        {formatNumber(city.count)}
                      </span>
                    </div>
                    <div className="city-bar">
                      <div
                        className="city-bar-fill"
                        style={{ width: `${city.percentage}%` }}
                      ></div>
                    </div>
                    <span className="city-percentage">{city.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
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
                  {formatNumber(dashboardData.rewards.active)}
                </div>
                <div className="stat-label">Active Rewards</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">
                  {formatNumber(dashboardData.rewards.redeemed)}
                </div>
                <div className="stat-label">Total Redeemed</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">
                  {dashboardData.analytics.customerSatisfaction}/5
                </div>
                <div className="stat-label">Satisfaction</div>
              </div>
            </div>
            <div className="analytics-chart">
              <div className="chart-title">Reward Distribution by Type</div>
              <div className="reward-distribution">
                {dashboardData.rewards.topTypes.map((type, index) => (
                  <div key={index} className="reward-item">
                    <div className="reward-info">
                      <span className="reward-name">{type.type}</span>
                      <span className="reward-count">
                        {formatNumber(type.count)}
                      </span>
                    </div>
                    <div className="reward-bar">
                      <div
                        className="reward-bar-fill"
                        style={{ width: `${type.percentage}%` }}
                      ></div>
                    </div>
                    <span className="reward-percentage">
                      {type.percentage}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* AI Quick Actions */}
        <div className="analytics-card ai-analytics quick-actions">
          <div className="analytics-glow"></div>
          <div className="analytics-header">
            <h3>⚡ AI Actions</h3>
          </div>
          <div className="analytics-content">
            <div className="action-grid">
              <button className="ai-action-btn">
                <span className="action-icon">➕</span>
                <span className="action-text">Add New User</span>
                <div className="action-glow"></div>
              </button>
              <button className="ai-action-btn">
                <span className="action-icon">🏪</span>
                <span className="action-text">Add New Store</span>
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
                <span className="action-icon">⚙️</span>
                <span className="action-text">Settings</span>
                <div className="action-glow"></div>
              </button>
              <button className="ai-action-btn">
                <span className="action-icon">📧</span>
                <span className="action-text">Send Notification</span>
                <div className="action-glow"></div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* AI Activity Feed */}
      <div className="dashboard-activity">
        <div className="activity-header">
          <h3>🔮 AI Activity Monitor</h3>
          <button className="ai-activity-btn">View All</button>
        </div>
        <div className="activity-list">
          <div className="activity-item ai-activity">
            <div className="activity-icon">👤</div>
            <div className="activity-content">
              <div className="activity-title">New user registered</div>
              <div className="activity-desc">John Doe joined the platform</div>
              <div className="activity-time">2 minutes ago</div>
            </div>
            <div className="activity-glow"></div>
          </div>
          <div className="activity-item ai-activity">
            <div className="activity-icon">🏪</div>
            <div className="activity-content">
              <div className="activity-title">Store activated</div>
              <div className="activity-desc">Coffee Corner in Manchester</div>
              <div className="activity-time">15 minutes ago</div>
            </div>
            <div className="activity-glow"></div>
          </div>
          <div className="activity-item ai-activity">
            <div className="activity-icon">🎁</div>
            <div className="activity-content">
              <div className="activity-title">Reward redeemed</div>
              <div className="activity-desc">20% discount at Pizza Place</div>
              <div className="activity-time">1 hour ago</div>
            </div>
            <div className="activity-glow"></div>
          </div>
          <div className="activity-item ai-activity">
            <div className="activity-icon">💰</div>
            <div className="activity-content">
              <div className="activity-title">Revenue milestone</div>
              <div className="activity-desc">
                £50,000 monthly revenue achieved
              </div>
              <div className="activity-time">3 hours ago</div>
            </div>
            <div className="activity-glow"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
