import React, { useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import * as EndUser from "../userUI";
import * as Admin from "../adminUI";
import LandingPage from "./landing/LandingPage";

// Main Route Component - Conditionally renders based on auth status
const MainRoute = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
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

  // If authenticated and is admin/staff user, show admin dashboard directly
  if (isAuthenticated && user && user.role && ['super_admin', 'admin', 'tenant_admin', 'store_manager', 'staff', 'manager'].includes(user.role)) {
    console.log('Rendering admin dashboard for admin/staff user on main route');
    return <Admin.AdminDashboard />;
  }

  // If authenticated and is regular customer, show customer home page
  if (isAuthenticated) {
    return <EndUser.Home />;
  }

  // If not authenticated, show landing page
  return <LandingPage />;
};

export default MainRoute;
