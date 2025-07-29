import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

/**
 * ProtectedRoute component that requires authentication
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render if authenticated
 * @param {string} props.redirectTo - Path to redirect to if not authenticated (default: "/")
 * @param {boolean} props.requireAuth - Whether authentication is required (default: true)
 * @param {string[]} props.allowedRoles - Array of allowed user roles (optional)
 * @returns {React.ReactNode} Protected route component
 */
export const ProtectedRoute = ({
  children,
  redirectTo = "/",
  requireAuth = true,
  allowedRoles = [],
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  // If authentication is not required, render children
  if (!requireAuth) {
    return children;
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    // Save the attempted URL for redirect after login
    const searchParams = new URLSearchParams();
    searchParams.set("redirect", location.pathname + location.search);

    return <Navigate to={`${redirectTo}?${searchParams.toString()}`} replace />;
  }

  // Check role-based access if roles are specified
  if (allowedRoles.length > 0 && user) {
    const userRole = user.role || "user";
    if (!allowedRoles.includes(userRole)) {
      return (
        <div className="access-denied">
          <h2>Access Denied</h2>
          <p>You don't have permission to access this page.</p>
          <button onClick={() => window.history.back()}>Go Back</button>
        </div>
      );
    }
  }

  // User is authenticated and authorized, render children
  return children;
};

/**
 * PublicRoute component that redirects authenticated users
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render if not authenticated
 * @param {string} props.redirectTo - Path to redirect to if authenticated (default: "/dashboard")
 * @returns {React.ReactNode} Public route component
 */
export const PublicRoute = ({ children, redirectTo = "/dashboard" }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  // If authenticated, redirect to dashboard or specified path
  if (isAuthenticated) {
    // Check if there's a redirect parameter from login
    const searchParams = new URLSearchParams(location.search);
    const redirectPath = searchParams.get("redirect") || redirectTo;

    return <Navigate to={redirectPath} replace />;
  }

  // User is not authenticated, render children
  return children;
};

/**
 * AdminRoute component that requires admin authentication
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render if admin
 * @returns {React.ReactNode} Admin route component
 */
export const AdminRoute = ({ children }) => {
  return (
    <ProtectedRoute
      allowedRoles={["admin", "superadmin"]}
      redirectTo="/auth/login"
    >
      {children}
    </ProtectedRoute>
  );
};

/**
 * UserRoute component that requires user authentication
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render if user
 * @returns {React.ReactNode} User route component
 */
export const UserRoute = ({ children }) => {
  return (
    <ProtectedRoute
      allowedRoles={["user", "admin", "superadmin"]}
      redirectTo="/auth/login"
    >
      {children}
    </ProtectedRoute>
  );
};

export default ProtectedRoute;
