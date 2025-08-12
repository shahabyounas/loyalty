import React from "react";
import "./Roles.css";

const Roles = () => {
  return (
    <div className="roles fade-in">
      <div className="roles-header glass-card">
        <div className="header-content">
          <h2>Role Management</h2>
          <p>Manage user roles and permissions</p>
        </div>
        <button className="create-btn">
          <span>🔐</span>
          <span>Add Role</span>
        </button>
      </div>

      <div className="roles-content glass-card">
        <div className="coming-soon">
          <div className="coming-soon-icon">🚧</div>
          <h3>Coming Soon</h3>
          <p>Role management features are being developed</p>
        </div>
      </div>
    </div>
  );
};

export default Roles;
