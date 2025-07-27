import React from "react";
import { Outlet } from "react-router-dom";

function AdminLayout() {
  return (
    <div className="admin-layout">
      <header className="admin-header">
        <h1>Admin Panel</h1>
        <nav>
          <a href="/admin">Dashboard</a>
          <a href="/admin/users">Users</a>
          <a href="/admin/settings">Settings</a>
          <a href="/">Back to Main</a>
        </nav>
      </header>
      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
}

export default AdminLayout;
