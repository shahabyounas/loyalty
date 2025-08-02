import React from "react";
import { Navigate, useLocation, useNavigate } from "react-router";
import { useAuth } from "../contexts/AuthContext";

/**
 * RouteWrapper - Single component to handle both protected and public routes
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render
 * @param {boolean} props.requireAuth - Whether authentication is required (default: false)
 * @param {string} props.redirectTo - Path to redirect to if auth requirement not met
 * @param {string[]} props.allowedRoles - Array of allowed user roles (optional)
 * @param {boolean} props.preventAuth - Whether to prevent authenticated users from accessing (for public routes)
 * @param {string} props.authRedirectTo - Path to redirect authenticated users (for public routes)
 * @returns {React.ReactNode} Wrapped route component
 */
export const RouteWrapper = ({
  children,
  requireAuth = false,
  redirectTo = "/",
  allowedRoles = [],
  preventAuth = false,
  authRedirectTo = "/",
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  // Handle public routes that prevent authenticated users
  if (preventAuth && isAuthenticated) {
    // Check if there's a redirect parameter from login
    const searchParams = new URLSearchParams(location.search);
    const redirectPath = searchParams.get("redirect") || authRedirectTo;
    return <Navigate to={redirectPath} replace />;
  }

  // Handle protected routes that require authentication
  if (requireAuth && !isAuthenticated) {
    // Save the attempted URL for redirect after login
    const searchParams = new URLSearchParams();
    searchParams.set("redirect", location.pathname + location.search);
    return <Navigate to={`${redirectTo}?${searchParams.toString()}`} replace />;
  }

  // Check role-based access if roles are specified and user is authenticated
  if (requireAuth && allowedRoles.length > 0 && user) {
    const userRole = user.role || "user";
    if (!allowedRoles.includes(userRole)) {
      return (
        <div className="access-denied">
          <h2>Access Denied</h2>
          <p>You don't have permission to access this page.</p>
          <button onClick={() => navigate(-1)}>Go Back</button>
        </div>
      );
    }
  }

  // User meets all requirements, render children
  return children;
};

/**
 * Convenience components for common use cases
 */
export const ProtectedRoute = ({
  children,
  redirectTo = "/",
  allowedRoles = [],
}) => (
  <RouteWrapper
    requireAuth={true}
    redirectTo={redirectTo}
    allowedRoles={allowedRoles}
  >
    {children}
  </RouteWrapper>
);

export const PublicRoute = ({ children, redirectTo = "/" }) => (
  <RouteWrapper preventAuth={true} authRedirectTo={redirectTo}>
    {children}
  </RouteWrapper>
);

export const AdminRoute = ({ children }) => (
  <RouteWrapper
    requireAuth={true}
    redirectTo="/"
    allowedRoles={["admin", "superadmin"]}
  >
    {children}
  </RouteWrapper>
);

export const UserRoute = ({ children }) => (
  <RouteWrapper
    requireAuth={true}
    redirectTo="/"
    allowedRoles={["user", "admin", "superadmin"]}
  >
    {children}
  </RouteWrapper>
);

export default RouteWrapper;
