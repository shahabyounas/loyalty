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
  const [qrCode, setQrCode] = useState("");
  const [selectedAvatarId, setSelectedAvatarId] = useState("neural-cloud");
  const [isAvatarSelectorOpen, setIsAvatarSelectorOpen] = useState(false);
  const [isQrGenerated, setIsQrGenerated] = useState(false);
  const [loyaltyData, setLoyaltyData] = useState({
    points: 2847,
    level: 7,
    progress: 75,
    visits: 23,
    nextReward: 500,
    totalSpent: 1247.5,
    savings: 89.25,
    availableVapes: 1,
    storeCredit: 0,
    vapesRedeemed: 3,
    creditUsed: 20,
  });

  // Generate QR code data
  useEffect(() => {
    if (user && isQrGenerated) {
      const qrData = JSON.stringify({
        userId: user.id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        timestamp: Date.now(),
      });
      setQrCode(qrData);
    }
  }, [user, isQrGenerated]);

  // Get current avatar
  const currentAvatar = getAvatarById(selectedAvatarId);

  const handleAvatarSelect = (avatarId) => {
    setSelectedAvatarId(avatarId);
  };

  const handleAvatarClick = () => {
    setIsAvatarSelectorOpen(true);
  };

  const handleGenerateQR = () => {
    setIsQrGenerated(true);
  };

  const renderHeader = () => {
    return (
      <div className="home-loyalty-header">
        <div className="home-brand-section">
          <div className="home-brand-logo">
            <div className="home-diamond-icon">💎</div>
          </div>
          <div className="home-brand-info">
            <h1 className="home-brand-name">Diamond Vapes</h1>
            <p className="home-brand-tagline">Premium Loyalty Experience</p>
          </div>
        </div>
      </div>
    );
  };

  const renderUserProfile = () => {
    return (
      <div className="home-user-profile-card">
        <div className="home-user-info-section">
          <div className="home-user-avatar-section">
            <div className="home-user-avatar" onClick={handleAvatarClick}>
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={`${user.firstName} ${user.lastName}`}
                  className="home-avatar-image"
                  onError={(e) => {
                    e.target.style.display = "none";
                    e.target.nextSibling.style.display = "flex";
                  }}
                />
              ) : null}
              <div className="home-avatar-fallback">
                <div
                  className="home-avatar-svg-container"
                  dangerouslySetInnerHTML={{ __html: currentAvatar.svg }}
                />
              </div>
              <div className="home-level-indicator">{loyaltyData.level}</div>
              <div className="home-premium-star">⭐</div>
            </div>
          </div>

          <div className="home-user-details">
            <strong className="home-user-name">
              {user ? `${user.firstName} ${user.lastName}` : "Alex Johnson"}
            </strong>
            <div className="home-user-tags">
              <span className="home-tag date">📅 Since Jan 2024</span>
            </div>
            <div className="home-visits-info">
              <span className="home-visits-icon">↗️</span>
              <span className="home-visits-text">
                {loyaltyData.visits} lifetime visits
              </span>
            </div>
          </div>
        </div>

        <div className="home-progress-section">
          <div className="home-progress-circle">
            <div className="home-progress-ring">
              <svg className="home-progress-svg" viewBox="0 0 120 120">
                <circle
                  className="home-progress-bg"
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  stroke="#2a2a2a"
                  strokeWidth="8"
                />
                <circle
                  className="home-progress-fill"
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
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="home-progress-center">
                <div className="home-progress-number">{loyaltyData.level}</div>
                <div className="home-progress-label">visits</div>
              </div>
            </div>
          </div>
          <div className="home-progress-text">
            {loyaltyData.nextReward - loyaltyData.points} visits to next reward
          </div>
        </div>

        <div className="home-background-diamond">💎</div>
      </div>
    );
  };

  const renderStampCollection = () => {
    const stamps = Array.from({ length: 10 }, (_, i) => i + 1);
    const activeStamps = 7; // Based on the screenshot

    return (
      <div className="home-stamp-collection-section">
        <div className="home-section-header">
          <strong className="home-section-title">Stamp Collection</strong>
        </div>

        <div className="home-stamps-grid">
          {stamps.map((stamp) => (
            <div
              key={stamp}
              className={`home-stamp-item ${
                stamp <= activeStamps ? "active" : "inactive"
              }`}
            >
              <div className="home-stamp-circle">
                {stamp <= activeStamps ? (
                  <svg
                    className="home-stamp-diamond"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 1L22 12L12 23L2 12L12 1Z"
                      fill="currentColor"
                      className="home-diamond-fill"
                    />
                    <path
                      d="M12 1L22 12L12 23L2 12L12 1Z"
                      stroke="currentColor"
                      strokeWidth="0.5"
                      className="home-diamond-outline"
                    />
                  </svg>
                ) : (
                  <svg
                    className="home-stamp-diamond inactive"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 1L22 12L12 23L2 12L12 1Z"
                      fill="currentColor"
                      className="home-diamond-fill"
                    />
                  </svg>
                )}
                {(stamp === 5 || stamp === 10) && (
                  <div className="home-reward-indicator">🎁</div>
                )}
              </div>
              <div className="home-stamp-number">{stamp}</div>
            </div>
          ))}
        </div>

        <div className="home-rewards-info">
          <div className="home-reward-pill">
            <div className="home-reward-visit">5th visit</div>
            <div className="home-reward-name">Free Vape</div>
          </div>
          <div className="home-reward-pill">
            <div className="home-reward-visit">10th visit</div>
            <div className="home-reward-name">£10 Credit</div>
          </div>
        </div>
      </div>
    );
  };

  const renderSummaryCards = () => {
    return (
      <div className="home-summary-cards">
        <div className="home-summary-card vapes">
          <div className="home-card-icon">🎁</div>
          <div className="home-card-value">{loyaltyData.availableVapes}</div>
          <div className="home-card-label">Available Vapes</div>
        </div>

        <div className="home-summary-card credit">
          <div className="home-card-icon">🏆</div>
          <div className="home-card-value">£{loyaltyData.storeCredit}</div>
          <div className="home-card-label">Store Credit</div>
        </div>
      </div>
    );
  };

  const renderQRCode = () => {
    return (
      <div className="home-qr-code-section">
        <div className="home-section-header">
          <span className="home-section-icon">📱</span>
          <h3 className="home-section-title">Your Loyalty QR Code</h3>
        </div>

        <div className="home-qr-content">
          {isQrGenerated ? (
            <div className="home-qr-code-display">
              <QRCodeSVG
                value={qrCode}
                size={200}
                level="H"
                marginSize={1}
                bgColor="#ffffff"
                fgColor="#000000"
              />
            </div>
          ) : (
            <div className="home-qr-placeholder">
              <div className="home-qr-frame">
                <div className="home-qr-corner top-left"></div>
                <div className="home-qr-corner top-right"></div>
                <div className="home-qr-corner bottom-left"></div>
                <div className="home-qr-corner bottom-right"></div>
              </div>
            </div>
          )}

          <p className="home-qr-instruction">
            {isQrGenerated
              ? "Show this QR code to the store for quick scanning"
              : "Generate your QR code for quick store scanning"}
          </p>

          {!isQrGenerated && (
            <button className="home-generate-qr-btn" onClick={handleGenerateQR}>
              Generate QR Code
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderLoyaltyHistory = () => {
    return (
      <div className="home-loyalty-history-section">
        <div className="home-section-header">
          <h3 className="home-section-title">Loyalty History</h3>
        </div>

        <div className="home-history-stats">
          <div className="home-history-stat">
            <div className="home-stat-value">{loyaltyData.vapesRedeemed}</div>
            <div className="home-stat-label">Vapes Redeemed</div>
          </div>

          <div className="home-history-stat">
            <div className="home-stat-value">£{loyaltyData.creditUsed}</div>
            <div className="home-stat-label">Credit Used</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="home-page">
      <ParticleBackground />
      <div className="home-loyalty-container">
        {renderHeader()}
        {renderUserProfile()}
        {renderStampCollection()}
        {renderSummaryCards()}
        {renderQRCode()}
        {renderLoyaltyHistory()}
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
