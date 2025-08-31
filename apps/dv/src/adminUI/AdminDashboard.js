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

// Error Boundary Component
class AdminErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('AdminDashboard Error:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="admin-error-boundary">
          <div className="error-content">
            <h2>🚨 Something went wrong</h2>
            <p>The admin dashboard encountered an error. Please refresh the page or contact support.</p>
            <button 
              onClick={() => {
                this.setState({ hasError: false, error: null, errorInfo: null });
                window.location.reload();
              }}
              className="error-refresh-btn"
            >
              Refresh Page
            </button>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="error-details">
                <summary>Error Details (Development)</summary>
                <pre>{this.state.error.toString()}</pre>
                <pre>{this.state.errorInfo.componentStack}</pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const AdminDashboard = () => {
  const { user, token } = useAuth();
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [userPermissions, setUserPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    // Safety check for auth context
    if (!user && !loading) {
      console.warn('User not available in AdminDashboard');
      setError('Authentication required');
      setLoading(false);
      return;
    }

    fetchUserPermissions();
  }, [user, token]);

  const fetchUserPermissions = async () => {
    const maxRetries = 3;
    
    try {
      setError(null);
      
      if (!user) {
        console.warn('No user available for permission fetch');
        setLoading(false);
        return;
      }

      if (!token) {
        console.warn('No token available for permission fetch');
        setLoading(false);
        return;
      }

      // Check if user is super admin based on role with safety checks
      const userRole = user?.role || '';
      if (userRole === "super_admin") {
        console.log("user.role", userRole);
        setUserPermissions([MENU_PERMISSIONS.SUPER_ADMIN]);
      } else {
        // Fallback to basic permissions
        setUserPermissions([MENU_PERMISSIONS.SYSTEM_ADMIN]);
      }
      
    } catch (error) {
      console.error("Error fetching permissions:", error);
      setError(`Failed to fetch permissions: ${error.message}`);
      
      // Retry logic
      if (retryCount < maxRetries) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          fetchUserPermissions();
        }, 1000 * (retryCount + 1)); // Exponential backoff
        return;
      }
      
      // Fallback: if user has super_admin role, give them super admin permissions
      try {
        if (user?.role === "super_admin") {
          setUserPermissions([MENU_PERMISSIONS.SUPER_ADMIN]);
        } else {
          // Default fallback permissions
          setUserPermissions([MENU_PERMISSIONS.SYSTEM_ADMIN]);
        }
        setError(null);
      } catch (fallbackError) {
        console.error("Fallback permission assignment failed:", fallbackError);
        setError('Unable to assign permissions');
      }
      
    } finally {
      setLoading(false);
    }
  };

  const getVisibleMenus = () => {
    try {
      // Safety check for permissions
      if (!Array.isArray(userPermissions) || userPermissions.length === 0) {
        console.warn('No valid permissions available, using default');
        return getVisibleMenuItems([MENU_PERMISSIONS.SYSTEM_ADMIN]) || [];
      }
      
      const visibleItems = getVisibleMenuItems([MENU_PERMISSIONS.SUPER_ADMIN]);
      return Array.isArray(visibleItems) ? visibleItems : [];
    } catch (error) {
      console.error('Error getting visible menus:', error);
      return []; // Return empty array to prevent crashes
    }
  };

  const renderActiveComponent = () => {
    try {
      const activeItem = getMenuItemById(activeMenu);
      if (!activeItem || !activeItem.component) {
        console.warn(`No component found for menu: ${activeMenu}, using Dashboard`);
        return renderComponentByName("Dashboard");
      }

      console.log("activeItem", activeItem.component);
      return renderComponentByName(activeItem.component);
    } catch (error) {
      console.error('Error rendering active component:', error);
      // Fallback to dashboard component
      try {
        return renderComponentByName("Dashboard");
      } catch (fallbackError) {
        console.error('Fallback component render failed:', fallbackError);
        return (
          <div className="component-error">
            <h3>⚠️ Component Error</h3>
            <p>Unable to load the requested component. Please try refreshing the page.</p>
            <button onClick={() => window.location.reload()}>Refresh</button>
          </div>
        );
      }
    }
  };

  const handleMenuClick = (menuId) => {
    try {
      if (!menuId || typeof menuId !== 'string') {
        console.warn('Invalid menu ID provided:', menuId);
        return;
      }
      
      const menuItem = getMenuItemById(menuId);
      if (!menuItem) {
        console.warn(`Menu item not found: ${menuId}`);
        return;
      }
      
      setActiveMenu(menuId);
      setError(null); // Clear any previous errors
    } catch (error) {
      console.error('Error handling menu click:', error);
      setError(`Failed to navigate to ${menuId}`);
    }
  };

  const handleSidebarToggle = () => {
    try {
      setSidebarCollapsed(prev => !prev);
    } catch (error) {
      console.error('Error toggling sidebar:', error);
    }
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner"></div>
        <p>Loading admin dashboard...</p>
        {retryCount > 0 && (
          <p className="retry-info">Retry attempt {retryCount}/3...</p>
        )}
      </div>
    );
  }

  // Error state handling
  if (error && !user) {
    return (
      <div className="admin-error">
        <div className="error-content">
          <h3>🚨 Authentication Error</h3>
          <p>{error}</p>
          <p>Please log in again to access the admin dashboard.</p>
          <button onClick={() => window.location.href = '/login'}>
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Safety check for required data
  if (!user) {
    return (
      <div className="admin-error">
        <div className="error-content">
          <h3>⚠️ User Data Missing</h3>
          <p>Unable to load user information. Please refresh the page.</p>
          <button onClick={() => window.location.reload()}>
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  const visibleMenus = getVisibleMenus();

  return (
    <AdminErrorBoundary>
      <div className="admin-dashboard">
        {/* Error Banner */}
        {error && (
          <div className="admin-error-banner">
            <span>⚠️ {error}</span>
            <button onClick={() => setError(null)}>×</button>
          </div>
        )}

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
              onClick={handleSidebarToggle}
              aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {sidebarCollapsed ? "→" : "←"}
            </button>
          </div>

          <nav className="sidebar-nav">
            {Array.isArray(visibleMenus) && visibleMenus.length > 0 ? (
              visibleMenus.map((item) => {
                // Safety check for menu item
                if (!item || !item.id) {
                  console.warn('Invalid menu item:', item);
                  return null;
                }

                return (
                  <div key={item.id} className="menu-group">
                    <button
                      className={`menu-item ${
                        activeMenu === item.id ? "active" : ""
                      }`}
                      onClick={() => handleMenuClick(item.id)}
                      title={sidebarCollapsed ? (item.description || item.label) : ""}
                      aria-label={`Navigate to ${item.label || item.id}`}
                    >
                      <span className="menu-icon">{item.icon || "📋"}</span>
                      {!sidebarCollapsed && (
                        <span className="menu-label">{item.label || item.id}</span>
                      )}
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="no-menu-items">
                <p>No menu items available</p>
              </div>
            )}
          </nav>

          <div className="sidebar-footer">
            <div className="user-info">
              <div className="user-avatar">
                {user?.first_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || "U"}
              </div>
              {!sidebarCollapsed && (
                <div className="user-details">
                  <div className="user-name">
                    {user?.first_name || ''} {user?.last_name || ''}
                    {(!user?.first_name && !user?.last_name) && (user?.email || 'User')}
                  </div>
                  <div className="user-role">
                    {user?.role === "super_admin" ? "Super Admin" : (user?.role || "User")}
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
                <button 
                  className="notification-btn"
                  aria-label="Notifications"
                  title="Notifications"
                >
                  🔔
                </button>
                <button 
                  className="profile-btn"
                  aria-label="User Profile"
                  title="User Profile"
                >
                  👤
                </button>
              </div>
            </div>
          </header>

          <main className="admin-content">
            <AdminErrorBoundary>
              {renderActiveComponent()}
            </AdminErrorBoundary>
          </main>
        </div>
      </div>
    </AdminErrorBoundary>
  );
};

export default AdminDashboard;
