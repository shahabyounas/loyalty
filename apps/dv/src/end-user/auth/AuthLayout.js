import React from "react";

function AuthLayout({ children }) {
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
      <main className="auth-content">{children}</main>
    </div>
  );
}

export default AuthLayout;
