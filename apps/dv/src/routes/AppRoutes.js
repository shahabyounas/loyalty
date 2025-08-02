import React, { Suspense } from "react";
import { Routes, Route } from "react-router";

// Import user types
import * as EndUser from "../userUI";
import * as Admin from "../adminUI";
import { NotFoundPage, PublicLayout, RouteWrapper, MainRoute } from "../shared";

// Import lazy components
import { LazyHome, LazyLoginTest, RouteLoading } from "./lazyComponents";

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

        {/* Catch all route */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
};
