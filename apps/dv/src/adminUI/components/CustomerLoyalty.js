import React from "react";
import "./CustomerLoyalty.css";

const CustomerLoyalty = () => {
  return (
    <div className="customer-loyalty fade-in">
      <div className="loyalty-header glass-card">
        <div className="header-content">
          <h2>Customer Loyalty</h2>
          <p>Manage customer loyalty programs and points</p>
        </div>
        <button className="create-btn">
          <span>💎</span>
          <span>Add Customer</span>
        </button>
      </div>

      <div className="loyalty-content glass-card">
        <div className="coming-soon">
          <div className="coming-soon-icon">🚧</div>
          <h3>Coming Soon</h3>
          <p>Customer loyalty management features are being developed</p>
        </div>
      </div>
    </div>
  );
};

export default CustomerLoyalty;
