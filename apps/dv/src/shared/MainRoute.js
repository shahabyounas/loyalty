import React, { useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import * as EndUser from "../userUI";
import LandingPage from "./landing/LandingPage";

// Main Route Component - Conditionally renders based on auth status
const MainRoute = () => {
  const { isAuthenticated, isLoading, user, isAdmin } = useAuth();
  const navigate = useNavigate();

  // Redirect admin users to admin dashboard
  useEffect(() => {
    if (isAuthenticated && user && isAdmin(user)) {
      console.log('Redirecting admin user from main route to admin dashboard');
      navigate('/admin');
    }
  }, [isAuthenticated, user, isAdmin, navigate]);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  // If authenticated and is admin user, don't render anything (redirect will happen)
  if (isAuthenticated && user && isAdmin(user)) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Redirecting to admin dashboard...</p>
      </div>
    );
  }

  // If authenticated, show home page (for regular users)
  if (isAuthenticated) {
    return <EndUser.Home />;
  }

  // If not authenticated, show landing page
  return <LandingPage />;
};

export default MainRoute;
