import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import "./AdminDashboard.css";

// Import permission configuration and component mapping
import {
  MENU_CONFIG,
  getVisibleMenuItems,
  getMenuItemById,
  renderComponentByName,
  MENU_PERMISSIONS,
} from "./config";

const AdminDashboard = () => {
  const { user, token } = useAuth();
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [userPermissions, setUserPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    fetchUserPermissions();
  }, [user, token]);

  const fetchUserPermissions = async () => {
    try {
      if (!user || !token) return;

      // const response = await fetch("/api/access-control/user-permissions", {
      //   headers: {
      //     Authorization: `Bearer ${token}`,
      //     "Content-Type": "application/json",
      //   },
      // });

      // if (response.ok) {
      //   const permissions = await response.json();
      //   setUserPermissions(permissions);
      // } else {
      // If API fails, check if user is super admin based on role
      if (user.role === "super_admin") {
        console.log("user.role", user.role);
        user.role = "super_admin";
        setUserPermissions([MENU_PERMISSIONS.SUPER_ADMIN]);
      } else {
        // Fallback to basic permissions
        setUserPermissions([MENU_PERMISSIONS.SYSTEM_ADMIN]);
      }
      // }
    } catch (error) {
      console.error("Error fetching permissions:", error);
      // Fallback: if user has super_admin role, give them super admin permissions
      if (user && user.role === "super_admin") {
        setUserPermissions([MENU_PERMISSIONS.SUPER_ADMIN]);
      } else {
        // Default fallback permissions
        setUserPermissions([MENU_PERMISSIONS.SYSTEM_ADMIN]);
      }
    } finally {
      setLoading(false);
    }
  };

  const getVisibleMenus = () => {
    return getVisibleMenuItems([MENU_PERMISSIONS.SUPER_ADMIN]);
  };

  const renderActiveComponent = () => {
    const activeItem = getMenuItemById(activeMenu);
    if (!activeItem) return renderComponentByName("Dashboard");

    console.log("activeItem", activeItem.component);

    return renderComponentByName(activeItem.component);
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner"></div>
        <p>Loading admin dashboard...</p>
      </div>
    );
  }

  const visibleMenus = getVisibleMenus();

  return (
    <div className="admin-dashboard">
      {/* Sidebar */}
      <div className={`admin-sidebar ${sidebarCollapsed ? "collapsed" : ""}`}>
        <div className="sidebar-header">
          <div className="logo">
            <span className="logo-icon">💎</span>
            {!sidebarCollapsed && (
              <span className="logo-text">Loyalty Admin</span>
            )}
          </div>
          <button
            className="collapse-btn"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            {sidebarCollapsed ? "→" : "←"}
          </button>
        </div>

        <nav className="sidebar-nav">
          {visibleMenus.map((item) => (
            <div key={item.id} className="menu-group">
              <button
                className={`menu-item ${
                  activeMenu === item.id ? "active" : ""
                }`}
                onClick={() => setActiveMenu(item.id)}
                title={sidebarCollapsed ? item.description : ""}
              >
                <span className="menu-icon">{item.icon}</span>
                {!sidebarCollapsed && (
                  <>
                    <span className="menu-label">{item.label}</span>
                  </>
                )}
              </button>
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">
              {user?.first_name?.charAt(0) || "U"}
            </div>
            {!sidebarCollapsed && (
              <div className="user-details">
                <div className="user-name">
                  {user?.first_name} {user?.last_name}
                </div>
                <div className="user-role">
                  {user?.role === "super_admin" ? "Super Admin" : user?.role}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="admin-main">
        <header className="admin-header">
          <div className="header-left">
            <h1>{getMenuItemById(activeMenu)?.label || "Dashboard"}</h1>
            <p>{getMenuItemById(activeMenu)?.description || ""}</p>
          </div>
          <div className="header-right">
            <div className="header-actions">
              <button className="notification-btn">🔔</button>
              <button className="profile-btn">👤</button>
            </div>
          </div>
        </header>

        <main className="admin-content">{renderActiveComponent()}</main>
      </div>
    </div>
  );
};

export default AdminDashboard;
