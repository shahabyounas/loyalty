import React from "react";
import { useAuth } from "../contexts/AuthContext";
import * as EndUser from "../userUI";
import LandingPage from "./landing/LandingPage";

// Main Route Component - Conditionally renders based on auth status
const MainRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  // If authenticated, show home page
  if (isAuthenticated) {
    return <EndUser.Home />;
  }

  // If not authenticated, show landing page
  return <LandingPage />;
};

export default MainRoute;
