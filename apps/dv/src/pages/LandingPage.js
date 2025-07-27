import React from "react";
import { Link } from "react-router-dom";

function LandingPage() {
  const stats = [
    { label: "Total Users", value: "1,234", change: "+12%", trend: "up" },
    { label: "Active Sessions", value: "567", change: "+8%", trend: "up" },
    { label: "System Health", value: "99.9%", change: "+0.1%", trend: "up" },
    { label: "Response Time", value: "45ms", change: "-5ms", trend: "down" },
  ];

  const recentActivities = [
    {
      id: 1,
      action: "User login",
      user: "john.doe@example.com",
      time: "2 minutes ago",
      status: "success",
    },
    {
      id: 2,
      action: "Route created",
      user: "admin@example.com",
      time: "5 minutes ago",
      status: "info",
    },
    {
      id: 3,
      action: "System backup",
      user: "system",
      time: "10 minutes ago",
      status: "success",
    },
    {
      id: 4,
      action: "Error detected",
      user: "monitoring",
      time: "15 minutes ago",
      status: "warning",
    },
  ];

  const quickActions = [
    { label: "Create Route", icon: "🗺️", path: "/routes", color: "primary" },
    {
      label: "User Management",
      icon: "👥",
      path: "/admin/users",
      color: "success",
    },
    {
      label: "System Settings",
      icon: "⚙️",
      path: "/admin/settings",
      color: "warning",
    },
    { label: "View Analytics", icon: "📊", path: "/dashboard", color: "info" },
  ];

  const getStatusColor = (status) => {
    const colors = {
      success: "text-success",
      warning: "text-warning",
      error: "text-error",
      info: "text-info",
    };
    return colors[status] || "text-muted";
  };

  const getActionColor = (color) => {
    const colors = {
      primary: "bg-primary-100 text-primary-700",
      success: "bg-success-100 text-success-700",
      warning: "bg-warning-100 text-warning-700",
      info: "bg-primary-100 text-primary-700",
    };
    return colors[color] || "bg-neutral-100 text-neutral-700";
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="card">
        <div className="card-header">
          <h1 className="text-2xl font-bold text-primary">
            Welcome to DevConsole
          </h1>
          <p className="text-muted">
            Your comprehensive development platform dashboard
          </p>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="text-center p-4 bg-console-surface rounded-lg border border-console-border"
              >
                <div className="text-2xl font-bold text-primary">
                  {stat.value}
                </div>
                <div className="text-sm text-muted">{stat.label}</div>
                <div
                  className={`text-xs ${
                    stat.trend === "up" ? "text-success" : "text-error"
                  }`}
                >
                  {stat.change} from last week
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-xl font-semibold">Quick Actions</h2>
          <p className="text-muted">Common tasks and shortcuts</p>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <Link
                key={index}
                to={action.path}
                className="group block p-4 bg-console-surface border border-console-border rounded-lg hover:border-primary-300 hover:shadow-lg transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${getActionColor(
                      action.color
                    )}`}
                  >
                    {action.icon}
                  </div>
                  <div>
                    <div className="font-medium text-primary group-hover:text-primary-600 transition-colors">
                      {action.label}
                    </div>
                    <div className="text-xs text-muted">Click to navigate</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-xl font-semibold">Recent Activity</h2>
          <p className="text-muted">Latest system events and user actions</p>
        </div>
        <div className="card-body">
          <div className="space-y-3">
            {recentActivities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between p-3 bg-console-surface rounded-lg border border-console-border"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2 h-2 rounded-full ${getStatusColor(
                      activity.status
                    )}`}
                  ></div>
                  <div>
                    <div className="font-medium">{activity.action}</div>
                    <div className="text-sm text-muted">{activity.user}</div>
                  </div>
                </div>
                <div className="text-sm text-muted">{activity.time}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold">System Status</h3>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">API Server</span>
                <span className="badge badge-success">Online</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Database</span>
                <span className="badge badge-success">Connected</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Cache</span>
                <span className="badge badge-success">Active</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">File Storage</span>
                <span className="badge badge-warning">Maintenance</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold">Performance Metrics</h3>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>CPU Usage</span>
                  <span>45%</span>
                </div>
                <div className="w-full bg-console-border rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full"
                    style={{ width: "45%" }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Memory Usage</span>
                  <span>67%</span>
                </div>
                <div className="w-full bg-console-border rounded-full h-2">
                  <div
                    className="bg-warning-500 h-2 rounded-full"
                    style={{ width: "67%" }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Disk Usage</span>
                  <span>23%</span>
                </div>
                <div className="w-full bg-console-border rounded-full h-2">
                  <div
                    className="bg-success-500 h-2 rounded-full"
                    style={{ width: "23%" }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="card bg-gradient-to-r from-primary-50 to-primary-100 border-primary-200">
        <div className="card-body text-center">
          <h3 className="text-xl font-semibold text-primary-800 mb-2">
            Ready to get started?
          </h3>
          <p className="text-primary-700 mb-4">
            Explore the platform and discover all the features available to you.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link to="/routes" className="btn btn-primary">
              View Routes
            </Link>
            <Link to="/auth/login" className="btn btn-secondary">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LandingPage;
