import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import "./Dashboard.css";

const Dashboard = () => {
  const { user, token } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStores: 0,
    totalCustomers: 0,
    totalRewards: 0,
    totalRevenue: 0,
    activeStampCards: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [token]);

  const fetchDashboardData = async () => {
    try {
      // const response = await fetch("/api/admin/dashboard", {
      //   headers: {
      //     Authorization: `Bearer ${token}`,
      //     "Content-Type": "application/json",
      //   },
      // });
      // if (response.ok) {
      //   const data = await response.json();
      //   setStats(data.stats);
      //   setRecentActivity(data.recentActivity);
      // }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      // Set mock data for development
      setStats({
        totalUsers: 1247,
        totalStores: 89,
        totalCustomers: 5678,
        totalRewards: 156,
        totalRevenue: 125430,
        activeStampCards: 2341,
      });
      setRecentActivity([
        {
          icon: "👤",
          title: "New user registered: John Smith",
          time: "2 minutes ago",
        },
        {
          icon: "🏪",
          title: "Store 'Downtown Coffee' added",
          time: "15 minutes ago",
        },
        {
          icon: "🎁",
          title: "Reward 'Free Coffee' created",
          time: "1 hour ago",
        },
        {
          icon: "💎",
          title: "Customer loyalty tier upgraded",
          time: "2 hours ago",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon, color, change, trend }) => (
    <div className="stat-card enterprise-stat-card">
      <div className="stat-icon" style={{ background: color }}>
        {icon}
      </div>
      <div className="stat-content">
        <h3 className="stat-title">{title}</h3>
        <div className="stat-value">{value}</div>
        {change && (
          <div className="stat-change">
            <span
              className={`trend-indicator ${change > 0 ? "up" : "down"}`}
            ></span>
            {change > 0 ? "↗" : "↘"} {Math.abs(change)}%
            <span className="stat-trend">vs last month</span>
          </div>
        )}
      </div>
    </div>
  );

  const ActivityItem = ({ activity }) => (
    <div className="activity-item">
      <div className="activity-icon">{activity.icon}</div>
      <div className="activity-content">
        <div className="activity-title">{activity.title}</div>
        <div className="activity-time">{activity.time}</div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading dashboard data...</p>
      </div>
    );
  }

  return (
    <div className="dashboard fade-in">
      {/* Welcome Section */}
      <div className="welcome-section">
        <div className="welcome-content">
          <h2>Welcome back, {user?.first_name || "Admin"}! 👋</h2>
          <p>Here's an overview of your loyalty program performance today.</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <StatCard
          title="Total Users"
          value={stats.totalUsers.toLocaleString()}
          icon="👥"
          color="linear-gradient(135deg, #6366f1, #8b5cf6)"
          change={12}
        />
        <StatCard
          title="Active Stores"
          value={stats.totalStores.toLocaleString()}
          icon="🏪"
          color="linear-gradient(135deg, #f59e0b, #d97706)"
          change={8}
        />
        <StatCard
          title="Loyal Customers"
          value={stats.totalCustomers.toLocaleString()}
          icon="💎"
          color="linear-gradient(135deg, #10b981, #059669)"
          change={15}
        />
        <StatCard
          title="Available Rewards"
          value={stats.totalRewards.toLocaleString()}
          icon="🎁"
          color="linear-gradient(135deg, #ef4444, #dc2626)"
          change={-3}
        />
        <StatCard
          title="Total Revenue"
          value={`$${stats.totalRevenue.toLocaleString()}`}
          icon="💰"
          color="linear-gradient(135deg, #06b6d4, #0891b2)"
          change={23}
        />
        <StatCard
          title="Active Stamp Cards"
          value={stats.activeStampCards.toLocaleString()}
          icon="🎫"
          color="linear-gradient(135deg, #8b5cf6, #7c3aed)"
          change={7}
        />
      </div>

      {/* Charts and Activity Section */}
      <div className="dashboard-content">
        <div className="content-grid">
          {/* Quick Actions */}
          <div className="quick-actions">
            <h3>Quick Actions</h3>
            <div className="action-buttons">
              <button className="action-btn">
                <span className="action-icon">➕</span>
                <span>Add User</span>
              </button>
              <button className="action-btn">
                <span className="action-icon">🏪</span>
                <span>New Store</span>
              </button>
              <button className="action-btn">
                <span className="action-icon">🎁</span>
                <span>Create Reward</span>
              </button>
              <button className="action-btn">
                <span className="action-icon">📊</span>
                <span>View Reports</span>
              </button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="recent-activity">
            <h3>Recent Activity</h3>
            <div className="activity-list">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity, index) => (
                  <ActivityItem key={index} activity={activity} />
                ))
              ) : (
                <div className="no-activity">
                  <div className="no-activity-icon">📝</div>
                  <p>No recent activity</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Performance Chart */}
        <div className="performance-chart">
          <h3>Weekly Performance Overview</h3>
          <div className="chart-placeholder">
            <div className="chart-illustration">
              <div className="chart-bar" style={{ height: "60%" }}></div>
              <div className="chart-bar" style={{ height: "80%" }}></div>
              <div className="chart-bar" style={{ height: "45%" }}></div>
              <div className="chart-bar" style={{ height: "90%" }}></div>
              <div className="chart-bar" style={{ height: "70%" }}></div>
              <div className="chart-bar" style={{ height: "85%" }}></div>
              <div className="chart-bar" style={{ height: "55%" }}></div>
            </div>
            <div className="chart-labels">
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
              <span>Sun</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
