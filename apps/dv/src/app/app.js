import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "../contexts/AuthContext";
import "./app.module.css";

// Import user types
import * as EndUser from "../end-user";
import * as Admin from "../admin";
import { NotFoundPage } from "../shared";

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="app">
          <Routes>
            {/* Public Landing Page - No sidebar */}
            <Route
              path="/"
              element={
                <EndUser.PublicLayout>
                  <EndUser.LandingPage />
                </EndUser.PublicLayout>
              }
            />

            {/* Authentication Routes - Auth layout */}
            <Route
              path="/auth/login"
              element={
                <EndUser.AuthLayout>
                  <EndUser.LoginPage />
                </EndUser.AuthLayout>
              }
            />
            <Route
              path="/auth/signup"
              element={
                <EndUser.AuthLayout>
                  <EndUser.SignupPage />
                </EndUser.AuthLayout>
              }
            />

            {/* User Dashboard - With sidebar */}
            <Route
              path="/dashboard"
              element={
                <EndUser.MainLayout>
                  <EndUser.DashboardPage />
                </EndUser.MainLayout>
              }
            />

            {/* User Routes - With sidebar */}
            <Route
              path="/routes"
              element={
                <EndUser.MainLayout>
                  <EndUser.RoutesPage />
                </EndUser.MainLayout>
              }
            />

            {/* Admin Dashboard - Admin layout */}
            <Route
              path="/admin"
              element={
                <Admin.AdminLayout>
                  <Admin.AdminDashboardPage />
                </Admin.AdminLayout>
              }
            />

            {/* Admin Users - Admin layout */}
            <Route
              path="/admin/users"
              element={
                <Admin.AdminLayout>
                  <Admin.AdminUsersPage />
                </Admin.AdminLayout>
              }
            />

            {/* Admin Settings - Admin layout */}
            <Route
              path="/admin/settings"
              element={
                <Admin.AdminLayout>
                  <Admin.AdminSettingsPage />
                </Admin.AdminLayout>
              }
            />

            {/* Catch all route */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
