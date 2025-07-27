import React from "react";
import { Outlet } from "react-router-dom";

function AuthLayout() {
  return (
    <div className="auth-layout">
      <header className="auth-header">
        <h1>Authentication</h1>
        <nav>
          <a href="/auth/login">Login</a>
          <a href="/auth/signup">Sign Up</a>
          <a href="/">Back to Home</a>
        </nav>
      </header>
      <main className="auth-content">
        <Outlet />
      </main>
    </div>
  );
}

export default AuthLayout;
