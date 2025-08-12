import React from "react";
import "./StampCards.css";

const StampCards = () => {
  return (
    <div className="stamp-cards fade-in">
      <div className="stamp-cards-header glass-card">
        <div className="header-content">
          <h2>Stamp Cards</h2>
          <p>Manage digital stamp collection programs</p>
        </div>
        <button className="create-btn">
          <span>🎫</span>
          <span>Add Stamp Card</span>
        </button>
      </div>

      <div className="stamp-cards-content glass-card">
        <div className="coming-soon">
          <div className="coming-soon-icon">🚧</div>
          <h3>Coming Soon</h3>
          <p>Stamp card management features are being developed</p>
        </div>
      </div>
    </div>
  );
};

export default StampCards;
