import React from "react";
import { useLocation, Link } from "react-router";
import styles from "./AdminRoutesUI.module.css";
import {
  HomeIcon,
  RoutesIcon,
  LoginIcon,
  SignupIcon,
  DashboardIcon,
  AdminIcon,
  UsersIcon,
  SettingsIcon,
  PublicIcon,
  AuthIcon,
  ProtectedIcon,
  AdminCategoryIcon,
  FolderIcon,
  LocationIcon,
  ArrowRightIcon,
  CheckIcon,
} from "../assets/icons";

function AdminRoutesUI() {
  const location = useLocation();

  // Define all routes with their metadata and icons
  const routes = [
    {
      path: "/",
      name: "Landing Page",
      description: "Welcome page for end users",
      category: "End-User",
      icon: <HomeIcon />,
    },
    {
      path: "/auth/login",
      name: "Login",
      description: "End-user authentication page",
      category: "End-User",
      icon: <LoginIcon />,
    },
    {
      path: "/auth/signup",
      name: "Signup",
      description: "End-user registration page",
      category: "End-User",
      icon: <SignupIcon />,
    },
    {
      path: "/dashboard",
      name: "User Dashboard",
      description: "End-user dashboard and main interface",
      category: "End-User",
      icon: <DashboardIcon />,
    },
    {
      path: "/admin",
      name: "Admin Dashboard",
      description: "Administrator main dashboard",
      category: "Admin",
      icon: <AdminIcon />,
    },
    {
      path: "/admin/users",
      name: "User Management",
      description: "Manage all end users and their accounts",
      category: "Admin",
      icon: <UsersIcon />,
    },
    {
      path: "/admin/settings",
      name: "System Settings",
      description: "System configuration and settings",
      category: "Admin",
      icon: <SettingsIcon />,
    },
    {
      path: "/admin/routes",
      name: "Routes Management",
      description: "Overview and management of all application routes",
      category: "Admin",
      icon: <RoutesIcon />,
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
      "End-User": <PublicIcon />,
      Admin: <AdminCategoryIcon />,
    };
    return icons[category] || <FolderIcon />;
  };

  return (
    <div className={styles["admin-routes-ui"]}>
      <div className={styles["routes-header"]}>
        <h1>Application Routes Management</h1>
        <p>
          Admin interface for managing and monitoring all application routes
        </p>
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
              {routes.filter((route) => route.category === "End-User").length}
            </div>
            <div className={styles["stat-label"]}>End-User Routes</div>
          </div>
          <div className={styles["stat-card"]}>
            <div className={styles["stat-number"]}>
              {routes.filter((route) => route.category === "Admin").length}
            </div>
            <div className={styles["stat-label"]}>Admin Routes</div>
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
                        {isActiveRoute(route.path) ? (
                          <>
                            <LocationIcon />
                            Current Page
                          </>
                        ) : (
                          <>
                            <ArrowRightIcon />
                            Navigate
                          </>
                        )}
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
            <CheckIcon style={{ display: "inline", marginRight: "0.5em" }} />
            This admin interface provides complete oversight of all application
            routes.
          </p>
        </div>
      </div>
    </div>
  );
}

export default AdminRoutesUI;
