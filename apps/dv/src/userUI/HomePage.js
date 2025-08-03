import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { QRCodeSVG } from "qrcode.react";
import ParticleBackground from "../../../../libs/animations/ParticleBackground";
import {
  vapeAvatars,
  getAvatarById,
  getRandomAvatar,
} from "../assets/avatars/vape-avatars";
import AvatarSelector from "../shared/components/AvatarSelector";
import "./HomePage.css";

export default function Home() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("progress");
  const [qrCode, setQrCode] = useState("");
  const [selectedAvatarId, setSelectedAvatarId] = useState("cloud-wizard");
  const [isAvatarSelectorOpen, setIsAvatarSelectorOpen] = useState(false);
  const [loyaltyData, setLoyaltyData] = useState({
    points: 2847,
    level: 7,
    progress: 75,
    visits: 23,
    nextReward: 500,
  });

  // Generate QR code data
  useEffect(() => {
    if (user) {
      const qrData = JSON.stringify({
        userId: user.id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        timestamp: Date.now(),
      });
      setQrCode(qrData);
    }
  }, [user]);

  // Get current avatar
  const currentAvatar = getAvatarById(selectedAvatarId);

  const handleAvatarSelect = (avatarId) => {
    setSelectedAvatarId(avatarId);
    // Here you could save the avatar selection to the user's profile
    // For now, we'll just update the local state
  };

  const handleAvatarClick = () => {
    setIsAvatarSelectorOpen(true);
  };

  const renderQRCode = () => {
    return (
      <div className="qr-code-container">
        <div className="qr-code">
          <QRCodeSVG
            value={qrCode}
            size={200}
            level="H"
            marginSize={1}
            bgColor="#ffffff"
            fgColor="#000000"
          />
          <div className="qr-center-logo">
            <div className="logo-circle">
              <span>DV</span>
            </div>
          </div>
        </div>
        <p className="qr-instruction">
          Show this to the business owner to scan
        </p>
      </div>
    );
  };

  const renderProgress = () => {
    return (
      <div className="progress-container">
        <div className="progress-circle">
          <div className="progress-ring">
            <svg className="progress-svg" viewBox="0 0 120 120">
              <circle
                className="progress-bg"
                cx="60"
                cy="60"
                r="50"
                fill="none"
                stroke="#2a2a2a"
                strokeWidth="8"
              />
              <circle
                className="progress-fill"
                cx="60"
                cy="60"
                r="50"
                fill="none"
                stroke="url(#gradient)"
                strokeWidth="8"
                strokeDasharray={`${2 * Math.PI * 50}`}
                strokeDashoffset={`${
                  2 * Math.PI * 50 * (1 - loyaltyData.progress / 100)
                }`}
                transform="rotate(-90 60 60)"
              />
              <defs>
                <linearGradient
                  id="gradient"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="var(--loyalty-accent-purple)" />
                  <stop offset="100%" stopColor="var(--loyalty-accent-blue)" />
                </linearGradient>
              </defs>
            </svg>
            <div className="progress-center">
              <div className="progress-number">{loyaltyData.progress}%</div>
              <div className="progress-label">Complete</div>
            </div>
          </div>
        </div>

        <div className="progress-stats">
          <div className="stat-row">
            <div className="stat-item">
              <div className="stat-value">{loyaltyData.points}</div>
              <div className="stat-label">Total Points</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{loyaltyData.level}</div>
              <div className="stat-label">Current Level</div>
            </div>
          </div>
          <div className="stat-row">
            <div className="stat-item">
              <div className="stat-value">{loyaltyData.visits}</div>
              <div className="stat-label">Total Visits</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{loyaltyData.nextReward}</div>
              <div className="stat-label">Next Reward</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="home-page">
      <ParticleBackground />
      <div className="loyalty-hero">
        <div className="container">
          {/* Animated Background Elements */}
          <div className="loyalty-background">
            <div className="floating-card card-1"></div>
            <div className="floating-card card-2"></div>
            <div className="floating-card card-3"></div>
            <div className="neural-grid"></div>
          </div>

          {/* Main Content */}
          <div className="loyalty-content">
            {/* User Info Card */}
            <div className="user-card">
              <div className="user-avatar">
                <div className="avatar-circle" onClick={handleAvatarClick}>
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={`${user.firstName} ${user.lastName}`}
                      className="avatar-image"
                      onError={(e) => {
                        e.target.style.display = "none";
                        e.target.nextSibling.style.display = "flex";
                      }}
                    />
                  ) : null}
                  <div className="avatar-fallback">
                    <div
                      className="avatar-svg-container"
                      dangerouslySetInnerHTML={{ __html: currentAvatar.svg }}
                    />
                  </div>
                  <div className="avatar-edit-overlay">
                    <span className="edit-icon">✏️</span>
                  </div>
                </div>
              </div>
              <div className="user-info">
                <h3 className="user-name">
                  {user ? `${user.firstName} ${user.lastName}` : "Welcome Back"}
                </h3>
                <p className="user-email">
                  {user?.email || "user@example.com"}
                </p>
                <div className="user-level">
                  <span className="level-badge">Level {loyaltyData.level}</span>
                </div>
              </div>
            </div>

            {/* Main Card with Tabs */}
            <div className="main-card">
              <div className="card-tabs">
                <button
                  className={`tab-button ${
                    activeTab === "progress" ? "active" : ""
                  }`}
                  onClick={() => setActiveTab("progress")}
                >
                  <span className="tab-icon">📊</span>
                  Progress
                </button>
                <button
                  className={`tab-button ${activeTab === "qr" ? "active" : ""}`}
                  onClick={() => setActiveTab("qr")}
                >
                  <span className="tab-icon">📱</span>
                  QR Code
                </button>
              </div>

              <div className="tab-content">
                {activeTab === "progress" && renderProgress()}
                {activeTab === "qr" && renderQRCode()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Avatar Selector Modal */}
      <AvatarSelector
        selectedAvatarId={selectedAvatarId}
        onAvatarSelect={handleAvatarSelect}
        isOpen={isAvatarSelectorOpen}
        onClose={() => setIsAvatarSelectorOpen(false)}
      />
    </div>
  );
}
