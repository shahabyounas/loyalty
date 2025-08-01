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
import {
  NotFoundPage,
  LandingPage,
  PublicLayout,
  Login,
  Signup,
} from "../shared";
import { LoginTest } from "../shared/login/LoginTest.js";

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

            {/* End User Home Page - User layout */}
            <Route
              path="/home"
              element={
                <PublicLayout>
                  <EndUser.Home />
                </PublicLayout>
              }
            />

            {/* Loyalty Dashboard */}
            <Route
              path="/loyalty"
              element={
                <PublicLayout>
                  <EndUser.Home />
                </PublicLayout>
              }
            />

            {/* Auth Routes */}
            <Route
              path="/auth/login"
              element={
                <PublicLayout>
                  <Login />
                </PublicLayout>
              }
            />
            <Route
              path="/auth/signup"
              element={
                <PublicLayout>
                  <Signup />
                </PublicLayout>
              }
            />

            {/* Dashboard Route */}
            <Route
              path="/dashboard"
              element={
                <PublicLayout>
                  <div style={{ padding: "2em", textAlign: "center" }}>
                    <h1>🎉 Welcome to Dashboard!</h1>
                    <p>You have successfully logged in.</p>
                    <button
                      onClick={() => (window.location.href = "/")}
                      style={{
                        padding: "0.5em 1em",
                        background: "#667eea",
                        color: "white",
                        border: "none",
                        borderRadius: "0.5em",
                        cursor: "pointer",
                      }}
                    >
                      Go Home
                    </button>
                  </div>
                </PublicLayout>
              }
            />

            {/* Test Route for Custom Domain */}
            <Route
              path="/test"
              element={
                <PublicLayout>
                  <div
                    style={{
                      padding: "2em",
                      textAlign: "center",
                      background:
                        "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      minHeight: "50vh",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                    }}
                  >
                    <div>
                      <h1>🎉 Test Route Working!</h1>
                      <p>Custom domain routing is functioning correctly.</p>
                      <p>Current URL: {window.location.href}</p>
                    </div>
                  </div>
                </PublicLayout>
              }
            />

            {/* Auth Test Route */}
            <Route
              path="/auth-test"
              element={
                <PublicLayout>
                  <LoginTest />
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
