import React, { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";

function MainLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();

  const navigationItems = [
    { path: "/", label: "Dashboard", icon: "📊" },
    { path: "/routes", label: "Routes", icon: "🗺️" },
    { path: "/auth/login", label: "Login", icon: "🔐" },
    { path: "/auth/signup", label: "Signup", icon: "📝" },
    { path: "/admin", label: "Admin", icon: "⚙️" },
  ];

  const isActiveRoute = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="console-layout">
      {/* Sidebar */}
      <aside
        className={`console-sidebar ${sidebarCollapsed ? "collapsed" : ""}`}
      >
        <div className="p-6 border-b border-console-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">D</span>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-primary">DevConsole</h1>
              <p className="text-xs text-muted">Development Platform</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4">
          <div className="nav">
            {navigationItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${
                  isActiveRoute(item.path) ? "active" : ""
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        </nav>

        <div className="p-4 border-t border-console-border">
          <div className="flex items-center gap-3 p-3 bg-console-surface-hover rounded-lg">
            <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-primary-600 font-semibold">U</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">User</p>
              <p className="text-xs text-muted">user@example.com</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="console-main">
        {/* Header */}
        <header className="console-header">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="btn btn-ghost btn-sm"
              >
                <span className="text-lg">☰</span>
              </button>

              <div className="breadcrumb">
                <div className="breadcrumb-item">
                  <span className="text-muted">Home</span>
                </div>
                {location.pathname !== "/" && (
                  <div className="breadcrumb-item">
                    <span className="text-primary">
                      {location.pathname.split("/").pop() || "Page"}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button className="btn btn-ghost btn-sm">
                <span className="text-lg">🔔</span>
              </button>
              <button className="btn btn-ghost btn-sm">
                <span className="text-lg">⚙️</span>
              </button>
              <div className="w-px h-6 bg-console-border"></div>
              <button className="btn btn-primary btn-sm">
                <span className="text-sm">+ New</span>
              </button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="console-content">
          <Outlet />
        </div>

        {/* Footer */}
        <footer className="console-footer">
          <div className="flex items-center justify-between w-full px-6">
            <div className="flex items-center gap-4">
              <span className="text-xs text-muted">© 2024 DevConsole</span>
              <span className="text-xs text-muted">•</span>
              <span className="text-xs text-muted">v1.0.0</span>
            </div>
            <div className="flex items-center gap-4">
              <a href="#" className="text-xs text-link hover:underline">
                Help
              </a>
              <a href="#" className="text-xs text-link hover:underline">
                Support
              </a>
              <a href="#" className="text-xs text-link hover:underline">
                Privacy
              </a>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}

export default MainLayout;
