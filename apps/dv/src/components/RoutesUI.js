import React from "react";
import { useLocation, Link } from "react-router-dom";
import styles from "./RoutesUI.module.css";

function RoutesUI() {
  const location = useLocation();

  // Define all routes with their metadata and icons
  const routes = [
    {
      path: "/",
      name: "Landing Page",
      description: "Welcome page for the application",
      category: "Public",
      icon: "🏠",
    },
    {
      path: "/routes",
      name: "Routes Overview",
      description: "Dynamic overview of all application routes",
      category: "Public",
      icon: "🗺️",
    },
    {
      path: "/auth/login",
      name: "Login",
      description: "User authentication page",
      category: "Authentication",
      icon: "🔐",
    },
    {
      path: "/auth/signup",
      name: "Signup",
      description: "User registration page",
      category: "Authentication",
      icon: "📝",
    },
    {
      path: "/dashboard",
      name: "Dashboard",
      description: "User dashboard and main interface",
      category: "Protected",
      icon: "📊",
    },
    {
      path: "/admin",
      name: "Admin Dashboard",
      description: "Administrator main dashboard",
      category: "Admin",
      icon: "⚙️",
    },
    {
      path: "/admin/users",
      name: "Admin Users",
      description: "User management interface",
      category: "Admin",
      icon: "👥",
    },
    {
      path: "/admin/settings",
      name: "Admin Settings",
      description: "System configuration and settings",
      category: "Admin",
      icon: "🔧",
    },
  ];

  // Group routes by category
  const groupedRoutes = routes.reduce((acc, route) => {
    if (!acc[route.category]) {
      acc[route.category] = [];
    }
    acc[route.category].push(route);
    return acc;
  }, {});

  const isActiveRoute = (path) => {
    return location.pathname === path;
  };

  const getCategoryIcon = (category) => {
    const icons = {
      Public: "🌐",
      Authentication: "🔐",
      Protected: "🛡️",
      Admin: "👑",
    };
    return icons[category] || "📁";
  };

  return (
    <div className={styles["routes-ui"]}>
      <div className={styles["routes-header"]}>
        <h1>Application Routes</h1>
        <p>Manage and explore all available routes in your application</p>
        <div className={styles["current-route"]}>
          <strong>Current Route:</strong> {location.pathname}
        </div>
      </div>

      <div className={styles["routes-content"]}>
        {/* Statistics Cards */}
        <div className={styles["routes-stats"]}>
          <div className={styles["stat-card"]}>
            <div className={styles["stat-number"]}>{routes.length}</div>
            <div className={styles["stat-label"]}>Total Routes</div>
          </div>
          <div className={styles["stat-card"]}>
            <div className={styles["stat-number"]}>
              {Object.keys(groupedRoutes).length}
            </div>
            <div className={styles["stat-label"]}>Categories</div>
          </div>
          <div className={styles["stat-card"]}>
            <div className={styles["stat-number"]}>
              {routes.filter((route) => isActiveRoute(route.path)).length}
            </div>
            <div className={styles["stat-label"]}>Active Routes</div>
          </div>
          <div className={styles["stat-card"]}>
            <div className={styles["stat-number"]}>
              {routes.filter((route) => route.category === "Public").length}
            </div>
            <div className={styles["stat-label"]}>Public Routes</div>
          </div>
        </div>

        {/* Route Categories Grid */}
        <div className={styles["routes-grid"]}>
          {Object.entries(groupedRoutes).map(([category, categoryRoutes]) => (
            <div key={category} className={styles["route-category"]}>
              <div className={styles["category-header"]}>
                <div className={styles["category-icon"]}>
                  {getCategoryIcon(category)}
                </div>
                <h2 className={styles["category-title"]}>{category}</h2>
              </div>
              <div className={styles["category-routes"]}>
                {categoryRoutes.map((route) => (
                  <div
                    key={route.path}
                    className={`${styles["route-card"]} ${
                      isActiveRoute(route.path) ? styles.active : ""
                    }`}
                  >
                    <div className={styles["route-header"]}>
                      <div className={styles["route-name-section"]}>
                        <div className={styles["route-icon"]}>{route.icon}</div>
                        <h3 className={styles["route-name"]}>{route.name}</h3>
                      </div>
                      <span className={styles["route-path"]}>{route.path}</span>
                    </div>
                    <p className={styles["route-description"]}>
                      {route.description}
                    </p>
                    <div className={styles["route-actions"]}>
                      <Link
                        to={route.path}
                        className={`${styles["route-link"]} ${
                          isActiveRoute(route.path) ? styles.active : ""
                        }`}
                      >
                        {isActiveRoute(route.path)
                          ? "📍 Current Page"
                          : "🚀 Navigate"}
                      </Link>
                      {isActiveRoute(route.path) && (
                        <span className={styles["current-indicator"]}>
                          ✓ Active
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className={styles["routes-footer"]}>
          <p>
            <strong>Total Routes:</strong> {routes.length} |
            <strong>Categories:</strong> {Object.keys(groupedRoutes).length}
          </p>
          <p className={styles["routes-note"]}>
            💡 This page automatically updates when new routes are added to the
            application.
          </p>
        </div>
      </div>
    </div>
  );
}

export default RoutesUI;
