import { lazy } from "react";

// Lazy load components for better performance (v7 optimization)
export const LazyHome = lazy(() =>
  import("../userUI").then((module) => ({ default: module.Home }))
);

export const LazyLoginTest = lazy(() =>
  import("../shared/login/LoginTest.js").then((module) => ({
    default: module.LoginTest,
  }))
);

// Loading component for Suspense fallback
export const RouteLoading = () => (
  <div className="loading-container">
    <div className="loading-spinner"></div>
    <p>Loading route...</p>
  </div>
);
