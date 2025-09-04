import React, { Suspense } from "react";
import { Routes, Route } from "react-router";

// Import user types
import * as EndUser from "../userUI";
import * as Admin from "../adminUI";
import { PublicLayout, RouteWrapper, AdminRoute, MainRoute } from "../shared";

// Import password reset components
import ForgotPassword from "../shared/forgot-password/forgot-password.js";
import ResetPassword from "../shared/reset-password/reset-password.js";

// Import 404 component
import NotFound from "../shared/404/NotFound.js";

// Import lazy components
import {
  LazyHome,
  LazyLoginTest,
  LazyAdminDashboard,
  RouteLoading,
} from "./lazyComponents";

export const AppRoutes = () => {
  return (
    <Suspense fallback={<RouteLoading />}>
      <Routes>
        {/* ===== END-USER FRONTEND ===== */}

        {/* Main Route - Shows home page if logged in, landing page if not */}
        <Route
          path="/"
          element={
            <PublicLayout>
              <MainRoute />
            </PublicLayout>
          }
        />

        {/* End User Home Page - Protected route */}
        <Route
          path="/home"
          element={
            <RouteWrapper requireAuth={true} redirectTo="/">
              <PublicLayout>
                <Suspense fallback={<RouteLoading />}>
                  <LazyHome />
                </Suspense>
              </PublicLayout>
            </RouteWrapper>
          }
        />

        {/* ===== AUTHENTICATION ROUTES ===== */}

        {/* Forgot Password - Public route */}
        <Route
          path="/auth/forgot-password"
          element={
            <PublicLayout>
              <ForgotPassword />
            </PublicLayout>
          }
        />

        {/* Reset Password - Public route */}
        <Route
          path="/auth/reset-password"
          element={
            <PublicLayout>
              <ResetPassword />
            </PublicLayout>
          }
        />

        {/* ===== ADMIN FRONTEND ROUTES ===== */}

        {/* Admin Dashboard Sub-routes - All at root level for admin users */}
        <Route
          path="/users"
          element={
            <AdminRoute>
              <Suspense fallback={<RouteLoading />}>
                <LazyAdminDashboard />
              </Suspense>
            </AdminRoute>
          }
        />
        <Route
          path="/stores"
          element={
            <AdminRoute>
              <Suspense fallback={<RouteLoading />}>
                <LazyAdminDashboard />
              </Suspense>
            </AdminRoute>
          }
        />
        <Route
          path="/rewards"
          element={
            <AdminRoute>
              <Suspense fallback={<RouteLoading />}>
                <LazyAdminDashboard />
              </Suspense>
            </AdminRoute>
          }
        />
        <Route
          path="/qr-scanner"
          element={
            <AdminRoute>
              <Suspense fallback={<RouteLoading />}>
                <LazyAdminDashboard />
              </Suspense>
            </AdminRoute>
          }
        />
        <Route
          path="/stamp-transactions"
          element={
            <AdminRoute>
              <Suspense fallback={<RouteLoading />}>
                <LazyAdminDashboard />
              </Suspense>
            </AdminRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <AdminRoute>
              <Suspense fallback={<RouteLoading />}>
                <LazyAdminDashboard />
              </Suspense>
            </AdminRoute>
          }
        />

        {/* ===== LEGACY ADMIN ROUTES (for backward compatibility) ===== */}

        {/* Admin Dashboard - Protected route with strict admin permissions */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <Suspense fallback={<RouteLoading />}>
                <LazyAdminDashboard />
              </Suspense>
            </AdminRoute>
          }
        />

        {/* Admin sub-routes - All protected with admin permissions */}
        <Route
          path="/admin/*"
          element={
            <AdminRoute>
              <Suspense fallback={<RouteLoading />}>
                <LazyAdminDashboard />
              </Suspense>
            </AdminRoute>
          }
        />

        {/* Auth Test Route - Public */}
        <Route
          path="/auth-test"
          element={
            <PublicLayout>
              <Suspense fallback={<RouteLoading />}>
                <LazyLoginTest />
              </Suspense>
            </PublicLayout>
          }
        />

        {/* Catch all route - 404 Page */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};
