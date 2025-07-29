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
import * as EndUser from "../userUI";
import * as Admin from "../adminUI";
import { NotFoundPage, LandingPage, PublicLayout } from "../shared";

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="app">
          <Routes>
            {/* ===== END-USER FRONTEND ===== */}

            {/* Public Landing Page - No sidebar */}
            <Route
              path="/"
              element={
                <PublicLayout>
                  <LandingPage />
                </PublicLayout>
              }
            />

            {/* ===== ADMIN BACKEND ===== */}

            {/* Admin Dashboard - Admin layout */}
            {/* <Route
              path="/admin"
              element={
                <Admin.AdminLayout>
                  <Admin.AdminDashboardPage />
                </Admin.AdminLayout>
              }
            /> */}

            {/* Admin Users Management - Admin layout */}
            {/* <Route
              path="/admin/users"
              element={
                <Admin.AdminLayout>
                  <Admin.AdminUsersPage />
                </Admin.AdminLayout>
              }
            /> */}

            {/* Admin Settings - Admin layout */}
            {/* <Route
              path="/admin/settings"
              element={
                <Admin.AdminLayout>
                  <Admin.AdminSettingsPage />
                </Admin.AdminLayout>
              }
            /> */}

            {/* Admin Routes Management - Admin layout */}
            {/* <Route
              path="/admin/routes"
              element={
                <Admin.AdminLayout>
                  <Admin.AdminRoutesPage />
                </Admin.AdminLayout>
              }
            /> */}

            {/* Catch all route */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
