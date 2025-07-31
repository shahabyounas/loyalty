import React from "react";
import "./HomePage.css";

export default function Home() {
  return (
    <div className="home-page">
      <div className="vape-ai-hero">
        <div className="container">
          {/* Animated Background Elements */}
          <div className="ai-background">
            <div className="vapor-cloud cloud-1"></div>
            <div className="vapor-cloud cloud-2"></div>
            <div className="vapor-cloud cloud-3"></div>
            <div className="neural-grid"></div>
            <div className="floating-particles">
              <div className="particle"></div>
              <div className="particle"></div>
              <div className="particle"></div>
              <div className="particle"></div>
              <div className="particle"></div>
            </div>
          </div>

          {/* Main Content */}
          <div className="ai-content">
            <div className="ai-header">
              <div className="ai-status">
                <div className="status-dot pulse"></div>
                <span>VapeAI System Active</span>
              </div>
              <div className="level-indicator">
                <span className="level-text">Level 7 Vaper</span>
                <div className="level-bar">
                  <div
                    className="level-progress"
                    style={{ width: "75%" }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="ai-main">
              <h1 className="ai-title">
                <span className="ai-prefix">DV</span>
                <span className="ai-brand">Vape</span>
                <span className="ai-suffix">AI</span>
              </h1>

              <p className="ai-subtitle">
                Your intelligent vaping companion is ready to enhance your
                experience
              </p>

              <div className="ai-actions">
                <button className="ai-btn-primary">
                  <span className="btn-glow"></span>
                  <span className="btn-text">Enter VapeZone</span>
                </button>

                <div className="ai-quick-stats">
                  <div className="stat-item">
                    <div className="stat-value">2,847</div>
                    <div className="stat-label">Vape Points</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-value">12</div>
                    <div className="stat-label">Active Rewards</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-value">7</div>
                    <div className="stat-label">Vape Level</div>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Features Preview */}
            <div className="ai-features">
              <div className="feature-item">
                <div className="feature-icon">🧠</div>
                <span>Smart Flavor Recommendations</span>
              </div>
              <div className="feature-item">
                <div className="feature-icon">⚡</div>
                <span>Real-time Vape Tracking</span>
              </div>
              <div className="feature-item">
                <div className="feature-icon">🎯</div>
                <span>Personalized Vape Deals</span>
              </div>
              <div className="feature-item">
                <div className="feature-icon">🏆</div>
                <span>Vape Challenges</span>
              </div>
            </div>

            {/* Gamification Elements */}
            <div className="gamification-panel">
              <div className="achievement-badge">
                <div className="badge-icon">🔥</div>
                <span>Flavor Explorer</span>
              </div>
              <div className="next-reward">
                <span>Next Reward: 500 points</span>
                <div className="reward-progress">
                  <div className="progress-fill" style={{ width: "60%" }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
