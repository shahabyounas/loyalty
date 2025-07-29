import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const ProtectedRoute = ({
  children,
  requireAuth = true,
  adminOnly = false,
}) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary-50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-primary-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If authentication is required but user is not authenticated
  if (requireAuth && !isAuthenticated) {
    // Redirect to login page with return URL
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // If admin access is required but user is not admin
  if (adminOnly && (!user || !user.isAdmin)) {
    // Redirect to dashboard or show access denied
    return <Navigate to="/dashboard" replace />;
  }

  // If user is authenticated but trying to access login/signup pages
  if (!requireAuth && isAuthenticated) {
    // Redirect to dashboard
    return <Navigate to="/dashboard" replace />;
  }

  // Render the protected content
  return children;
};

export default ProtectedRoute;
