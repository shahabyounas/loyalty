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
import {
  rewardAPI,
  userRewardProgressAPI,
  stampTransactionAPI,
} from "../utils/api";
import QRCodeModal from "../shared/components/QRCodeModal";
import InProgressRewardsModal from "./components/InProgressRewardsModal";
import "./HomePage.css";

export default function Home() {
  const { user } = useAuth();
  const [qrCode, setQrCode] = useState("");
  const [selectedAvatarId, setSelectedAvatarId] = useState("neural-cloud");
  const [isAvatarSelectorOpen, setIsAvatarSelectorOpen] = useState(false);
  const [isQrGenerated, setIsQrGenerated] = useState(false);
  const [availableRewards, setAvailableRewards] = useState([]);
  const [rewardsLoading, setRewardsLoading] = useState(false);
  const [userProgress, setUserProgress] = useState({});
  const [progressLoading, setProgressLoading] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState(null);
  const [currentReward, setCurrentReward] = useState(null);
  const [inProgressModalOpen, setInProgressModalOpen] = useState(false);
  const [lifetimeStats, setLifetimeStats] = useState({
    totalStamps: 0,
    totalRewards: 0,
    rewardsInProgress: 0,
    rewardsReadyToRedeem: 0,
  });

  // Fetch available rewards
  async function fetchAvailableRewards() {
    if (!user) return;

    setRewardsLoading(true);
    try {
      const response = await rewardAPI.getAllRewards({
        status: "active",
        limit: 10,
      });
      setAvailableRewards(response.data || []);
    } catch (error) {
      console.error("Failed to fetch rewards:", error);
      setAvailableRewards([]);
    } finally {
      setRewardsLoading(false);
    }
  }

  // Fetch user reward progress
  async function fetchUserProgress() {
    if (!user) return;

    setProgressLoading(true);
    try {
      const response = await userRewardProgressAPI.getUserProgress();
      const progressMap = {};
      let totalStamps = 0;
      let totalRewards = 0;
      let rewardsInProgress = 0;
      let rewardsReadyToRedeem = 0;

      (response.data || []).forEach((progress) => {
        progressMap[progress.reward_id] = progress;
        totalStamps += progress.stamps_collected || 0;

        if (progress.is_completed && progress.status === "ready_to_redeem") {
          rewardsReadyToRedeem++;
        } else if (progress.is_completed && progress.status === "redeemed") {
          totalRewards++;
        } else if (progress.stamps_collected > 0) {
          rewardsInProgress++;
        }
      });

      setUserProgress(progressMap);
      setLifetimeStats({
        totalStamps,
        totalRewards,
        rewardsInProgress,
        rewardsReadyToRedeem,
      });
    } catch (error) {
      console.error("Failed to fetch user progress:", error);
      setUserProgress({});
    } finally {
      setProgressLoading(false);
    }
  }

  // Fetch data on component mount
  useEffect(() => {
    fetchAvailableRewards();
    fetchUserProgress();
  }, [user]);

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

  // Calculate loyalty status based on join date
  function getLoyaltyStatus() {
    if (!user?.createdAt) return { level: 1, title: "New Member", icon: "🆕" };

    const joinDate = new Date(user.createdAt);
    const now = new Date();
    const yearsDiff = now.getFullYear() - joinDate.getFullYear();
    const monthsDiff = now.getMonth() - joinDate.getMonth();
    const totalMonths = yearsDiff * 12 + monthsDiff;

    if (totalMonths < 12) {
      return { level: 1, title: "Bronze Member", icon: "🥉" };
    } else if (totalMonths < 24) {
      return { level: 2, title: "Silver Member", icon: "🥈" };
    } else if (totalMonths < 36) {
      return { level: 3, title: "Gold Member", icon: "🥇" };
    } else if (totalMonths < 48) {
      return { level: 4, title: "Platinum Member", icon: "💎" };
    } else if (totalMonths < 60) {
      return { level: 5, title: "Diamond Member", icon: "💠" };
    } else {
      return { level: 6, title: "Legendary Member", icon: "👑" };
    }
  }

  const loyaltyStatus = getLoyaltyStatus();

  function handleAvatarSelect(avatarId) {
    setSelectedAvatarId(avatarId);
  }

  function handleAvatarClick() {
    setIsAvatarSelectorOpen(true);
  }

  function handleGenerateQR() {
    setIsQrGenerated(true);
  }

  function renderHeader() {
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
  }

  function renderUserProfile() {
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
              <div className="home-level-indicator">
                {lifetimeStats.totalStamps}
              </div>
              <div className="home-premium-star">⭐</div>
            </div>
          </div>

          <div className="home-user-details">
            <strong className="home-user-name">
              {user ? `${user.firstName} ${user.lastName}` : "Hello"}
            </strong>
            {user?.createdAt && (
              <div className="home-member-since">
                <span className="home-loyalty-status">
                  {loyaltyStatus.icon} {loyaltyStatus.title}
                </span>
                {" • "}
                Member since{" "}
                {new Date(user.createdAt).toLocaleString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </div>
            )}
            <div className="home-user-tags">
              <span className="home-tag date">
                📅 Since{" "}
                {new Date(user.createdAt).toLocaleString("en-US", {
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
            <div className="home-visits-info">
              <span className="home-visits-icon">↗️</span>
              <span className="home-visits-text">
                {lifetimeStats.totalStamps} lifetime stamps
              </span>
            </div>
          </div>
        </div>

        <div className="home-loyalty-stats-section">
          <div className="home-stats-grid">
            <div className="home-stat-card">
              <div className="home-stat-icon">🎁</div>
              <div className="home-stat-value">
                {lifetimeStats.totalRewards}
              </div>
              <div className="home-stat-label">Rewards Availed</div>
            </div>

            <div
              className="home-stat-card home-stat-clickable"
              onClick={() => setInProgressModalOpen(true)}
            >
              <div className="home-stat-icon">⏳</div>
              <div className="home-stat-value">
                {lifetimeStats.rewardsInProgress}
              </div>
              <div className="home-stat-label">In Progress</div>
            </div>

            <div className="home-stat-card">
              <div className="home-stat-icon">✅</div>
              <div className="home-stat-value">
                {lifetimeStats.rewardsReadyToRedeem}
              </div>
              <div className="home-stat-label">Ready to Redeem</div>
            </div>
          </div>
        </div>

        <div className="home-background-diamond">💎</div>
      </div>
    );
  }

  function renderAllRewards() {
    if (rewardsLoading) {
      return (
        <div className="home-available-rewards-section">
          <div className="home-section-header">
            <span className="home-section-icon">🎁</span>
            <h3 className="home-section-title">Available Rewards</h3>
          </div>
          <div className="home-rewards-loading">
            <div className="home-loading-spinner"></div>
            <p>Loading rewards...</p>
          </div>
        </div>
      );
    }

    if (availableRewards.length === 0) {
      return (
        <div className="home-available-rewards-section">
          <div className="home-section-header">
            <span className="home-section-icon">🎁</span>
            <h3 className="home-section-title">Available Rewards</h3>
          </div>
          <div className="home-no-rewards">
            <p>No rewards available at the moment</p>
          </div>
        </div>
      );
    }

    return (
      <div className="home-available-rewards-section">
        <div className="home-section-header">
          <span className="home-section-icon">🎁</span>
          <h3 className="home-section-title">Available Rewards</h3>
        </div>

        <div className="home-rewards-grid">
          {availableRewards.map((reward) => {
            const progress = userProgress[reward.id];
            const stampsCollected = progress?.stamps_collected || 0;
            const stampsRequired = reward.stamps_required || 10;
            const isCompleted = progress?.is_completed || false;
            const status = progress?.status || "new";
            const completionPercentage = progress
              ? (stampsCollected / stampsRequired) * 100
              : 0;

            // Determine reward state for styling
            let rewardState = "new";
            if (isCompleted && status === "ready_to_redeem") {
              rewardState = "ready";
            } else if (stampsCollected > 0 && !isCompleted) {
              rewardState = "in-progress";
            }

            return (
              <div
                key={reward.id}
                className={`home-reward-card home-reward-${rewardState}`}
              >
                <div className="home-reward-header">
                  <div className="home-reward-icon">
                    {rewardState === "ready"
                      ? "🎉"
                      : reward.type === "discount"
                      ? "💰"
                      : reward.type === "free_item"
                      ? "🎁"
                      : reward.type === "points"
                      ? "⭐"
                      : "🏆"}
                  </div>
                  <div className="home-reward-type">
                    {rewardState === "ready" ? "Ready!" : reward.type}
                  </div>
                </div>

                <div className="home-reward-content">
                  <h4 className="home-reward-name">{reward.name}</h4>
                  <p className="home-reward-description">
                    {reward.description}
                  </p>

                  {/* Show progress for in-progress rewards */}
                  {rewardState === "in-progress" && (
                    <div className="home-stamp-progress-section">
                      <div className="home-stamp-progress-header">
                        <span className="home-stamp-progress-label">
                          Stamp Progress
                        </span>
                        <span className="home-stamp-progress-count">
                          {stampsCollected}/{stampsRequired}
                        </span>
                      </div>

                      <div className="home-stamp-progress-bar">
                        <div
                          className="home-stamp-progress-fill"
                          style={{ width: `${completionPercentage}%` }}
                        ></div>
                      </div>

                      <div className="home-stamp-progress-percentage">
                        {Math.round(completionPercentage)}% Complete
                      </div>
                    </div>
                  )}

                  {/* Show completion badge for ready rewards */}
                  {rewardState === "ready" && (
                    <div className="home-reward-completion">
                      <div className="home-completion-badge">
                        <span className="home-completion-icon">✅</span>
                        <span className="home-completion-text">
                          {stampsCollected}/{stampsRequired} stamps collected
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="home-reward-details">
                    <div className="home-reward-points">
                      <span className="home-points-label">
                        Stamps Required:
                      </span>
                      <span className="home-points-value">
                        {reward.points_required || reward.stamps_required || 10}
                      </span>
                    </div>

                    <div className="home-reward-value">
                      <span className="home-value-label">Value:</span>
                      <span className="home-value-amount">
                        {reward.type === "discount" &&
                        reward.discount_percentage !== null &&
                        reward.discount_percentage !== undefined
                          ? `${reward.discount_percentage}% off`
                          : reward.type === "free_item"
                          ? "Free Item"
                          : reward.type === "cashback" &&
                            reward.discount_amount !== null &&
                            reward.discount_amount !== undefined
                          ? `£${reward.discount_amount} cashback`
                          : "N/A"}
                      </span>
                    </div>
                  </div>

                  {reward.expiry_date && (
                    <div className="home-reward-expiry">
                      <span className="home-expiry-label">Expires:</span>
                      <span className="home-expiry-date">
                        {new Date(reward.expiry_date).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                <div className="home-reward-actions">
                  {rewardState === "ready" ? (
                    <button
                      className="home-redeem-button home-redeem-ready"
                      onClick={() => handleRedeemReward(reward.id)}
                    >
                      🎉 Redeem Now
                    </button>
                  ) : (
                    <button
                      className="home-add-stamp-button"
                      onClick={() => handleAddStamp(reward.id, reward.name)}
                    >
                      {rewardState === "new"
                        ? "+ Start Collecting"
                        : "+ Add Stamp"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  function renderRewardsInProgress() {
    const inProgressRewards = availableRewards.filter((reward) => {
      const progress = userProgress[reward.id];
      return (
        progress && progress.stamps_collected > 0 && !progress.is_completed
      );
    });

    if (inProgressRewards.length === 0) {
      return null;
    }

    return (
      <div className="home-rewards-in-progress-section">
        <div className="home-section-header">
          <span className="home-section-icon">⏳</span>
          <h3 className="home-section-title">Rewards In Progress</h3>
        </div>

        <div className="home-rewards-grid">
          {inProgressRewards.map((reward) => {
            const progress = userProgress[reward.id];
            const stampsCollected = progress?.stamps_collected || 0;
            const stampsRequired = reward.stamps_required || 10;
            const completionPercentage =
              (stampsCollected / stampsRequired) * 100;

            return (
              <div
                key={reward.id}
                className="home-reward-card home-reward-in-progress"
              >
                <div className="home-reward-header">
                  <div className="home-reward-icon">
                    {reward.type === "discount"
                      ? "💰"
                      : reward.type === "free_item"
                      ? "🎁"
                      : reward.type === "points"
                      ? "⭐"
                      : "🏆"}
                  </div>
                  <div className="home-reward-type">{reward.type}</div>
                </div>

                <div className="home-reward-content">
                  <h4 className="home-reward-name">{reward.name}</h4>
                  <p className="home-reward-description">
                    {reward.description}
                  </p>

                  {/* Stamp Progress */}
                  <div className="home-stamp-progress-section">
                    <div className="home-stamp-progress-header">
                      <span className="home-stamp-progress-label">
                        Stamp Progress
                      </span>
                      <span className="home-stamp-progress-count">
                        {stampsCollected}/{stampsRequired}
                      </span>
                    </div>

                    <div className="home-stamp-progress-bar">
                      <div
                        className="home-stamp-progress-fill"
                        style={{ width: `${completionPercentage}%` }}
                      ></div>
                    </div>

                    <div className="home-stamp-progress-percentage">
                      {Math.round(completionPercentage)}% Complete
                    </div>
                  </div>
                </div>

                <div className="home-reward-actions">
                  <button
                    className="home-add-stamp-button"
                    onClick={() => handleAddStamp(reward.id, reward.name)}
                  >
                    + Add Stamp
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  function renderRewardsReadyToRedeem() {
    const readyToRedeemRewards = availableRewards.filter((reward) => {
      const progress = userProgress[reward.id];
      return (
        progress &&
        progress.is_completed &&
        progress.status === "ready_to_redeem"
      );
    });

    if (readyToRedeemRewards.length === 0) {
      return null;
    }

    return (
      <div className="home-rewards-ready-section">
        <div className="home-section-header">
          <span className="home-section-icon">✅</span>
          <h3 className="home-section-title">Ready to Redeem</h3>
        </div>

        <div className="home-rewards-grid">
          {readyToRedeemRewards.map((reward) => {
            const progress = userProgress[reward.id];
            const stampsCollected = progress?.stamps_collected || 0;
            const stampsRequired = reward.stamps_required || 10;

            return (
              <div
                key={reward.id}
                className="home-reward-card home-reward-ready"
              >
                <div className="home-reward-header">
                  <div className="home-reward-icon">🎉</div>
                  <div className="home-reward-type">Ready!</div>
                </div>

                <div className="home-reward-content">
                  <h4 className="home-reward-name">{reward.name}</h4>
                  <p className="home-reward-description">
                    {reward.description}
                  </p>

                  <div className="home-reward-completion">
                    <div className="home-completion-badge">
                      <span className="home-completion-icon">✅</span>
                      <span className="home-completion-text">
                        {stampsCollected}/{stampsRequired} stamps collected
                      </span>
                    </div>
                  </div>

                  <div className="home-reward-details">
                    <div className="home-reward-points">
                      <span className="home-points-label">
                        Stamps Required:
                      </span>
                      <span className="home-points-value">
                        {reward.points_required || reward.stamps_required || 10}
                      </span>
                    </div>

                    <div className="home-reward-value">
                      <span className="home-value-label">Value:</span>
                      <span className="home-value-amount">
                        {reward.type === "discount" &&
                        reward.discount_percentage !== null &&
                        reward.discount_percentage !== undefined
                          ? `${reward.discount_percentage}% off`
                          : reward.type === "free_item"
                          ? "Free Item"
                          : reward.type === "cashback" &&
                            reward.discount_amount !== null &&
                            reward.discount_amount !== undefined
                          ? `£${reward.discount_amount} cashback`
                          : "N/A"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="home-reward-actions">
                  <button
                    className="home-redeem-button home-redeem-ready"
                    onClick={() => handleRedeemReward(reward.id)}
                  >
                    🎉 Redeem Now
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  function renderAvailableRewards() {
    const newRewards = availableRewards.filter((reward) => {
      const progress = userProgress[reward.id];
      return !progress || progress.stamps_collected === 0;
    });

    if (rewardsLoading) {
      return (
        <div className="home-available-rewards-section">
          <div className="home-section-header">
            <span className="home-section-icon">🎁</span>
            <h3 className="home-section-title">Available Rewards</h3>
          </div>
          <div className="home-rewards-loading">
            <div className="home-loading-spinner"></div>
            <p>Loading rewards...</p>
          </div>
        </div>
      );
    }

    if (newRewards.length === 0) {
      return (
        <div className="home-available-rewards-section">
          <div className="home-section-header">
            <span className="home-section-icon">🎁</span>
            <h3 className="home-section-title">Available Rewards</h3>
          </div>
          <div className="home-no-rewards">
            <p>No new rewards available at the moment</p>
          </div>
        </div>
      );
    }

    return (
      <div className="home-available-rewards-section">
        <div className="home-section-header">
          <span className="home-section-icon">🎁</span>
          <h3 className="home-section-title">Available Rewards</h3>
        </div>

        <div className="home-rewards-grid">
          {newRewards.map((reward) => {
            return (
              <div key={reward.id} className="home-reward-card home-reward-new">
                <div className="home-reward-header">
                  <div className="home-reward-icon">
                    {reward.type === "discount"
                      ? "💰"
                      : reward.type === "free_item"
                      ? "🎁"
                      : reward.type === "points"
                      ? "⭐"
                      : "🏆"}
                  </div>
                  <div className="home-reward-type">{reward.type}</div>
                </div>

                <div className="home-reward-content">
                  <h4 className="home-reward-name">{reward.name}</h4>
                  <p className="home-reward-description">
                    {reward.description}
                  </p>

                  <div className="home-reward-requirements">
                    <div className="home-requirements-badge">
                      <span className="home-requirements-icon">📋</span>
                      <span className="home-requirements-text">
                        {reward.stamps_required || 10} stamps required
                      </span>
                    </div>
                  </div>

                  <div className="home-reward-details">
                    <div className="home-reward-points">
                      <span className="home-points-label">
                        Stamps Required:
                      </span>
                      <span className="home-points-value">
                        {reward.points_required || reward.stamps_required || 10}
                      </span>
                    </div>

                    <div className="home-reward-value">
                      <span className="home-value-label">Value:</span>
                      <span className="home-value-amount">
                        {reward.type === "discount" &&
                        reward.discount_percentage !== null &&
                        reward.discount_percentage !== undefined
                          ? `${reward.discount_percentage}% off`
                          : reward.type === "free_item"
                          ? "Free Item"
                          : reward.type === "cashback" &&
                            reward.discount_amount !== null &&
                            reward.discount_amount !== undefined
                          ? `£${reward.discount_amount} cashback`
                          : "N/A"}
                      </span>
                    </div>
                  </div>

                  {reward.expiry_date && (
                    <div className="home-reward-expiry">
                      <span className="home-expiry-label">Expires:</span>
                      <span className="home-expiry-date">
                        {new Date(reward.expiry_date).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                <div className="home-reward-actions">
                  <button
                    className="home-add-stamp-button"
                    onClick={() => handleAddStamp(reward.id, reward.name)}
                  >
                    + Start Collecting
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  function handleAddStamp(rewardId, rewardName) {
    // Generate QR code data locally without API call
    const qrData = {
      user_id: user?.id,
      reward_id: rewardId,
      timestamp: Date.now(),
      expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes from now
    };

    setCurrentTransaction({
      transaction_code: `STAMP_${
        user?.id
      }_${rewardId}_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)
        .toUpperCase()}`,
      user_id: user?.id,
      reward_id: rewardId,
      expires_at: qrData.expires_at,
      qr_data: JSON.stringify(qrData),
    });
    setCurrentReward({ id: rewardId, name: rewardName });
    setQrModalOpen(true);
  }

  function handleCloseQRModal() {
    setQrModalOpen(false);
    setCurrentTransaction(null);
    setCurrentReward(null);
  }

  function handleCancelTransaction() {
    // No need to cancel anything since no transaction was created
    handleCloseQRModal();
  }

  function handleRedeemReward(rewardId) {
    // TODO: Implement reward redemption
    console.log("Redeeming reward:", rewardId);
    // This would typically call an API to redeem the reward
    // and update the user's points/status
  }

  function handleInProgressAddStamp(rewardId, rewardName) {
    // Close the modal and open QR modal for this reward
    setInProgressModalOpen(false);
    handleAddStamp(rewardId, rewardName);
  }

  function handleInProgressRedeemReward(rewardId) {
    // Close the modal and redeem the reward
    setInProgressModalOpen(false);
    handleRedeemReward(rewardId);
  }

  // Get in-progress rewards for the modal
  function getInProgressRewards() {
    return availableRewards.filter((reward) => {
      const progress = userProgress[reward.id];
      return progress && progress.stamps_collected > 0;
    });
  }

  return (
    <div className="home-page">
      <ParticleBackground />
      <div className="home-loyalty-container">
        {renderHeader()}
        {renderUserProfile()}
        {renderAllRewards()}
      </div>

      {/* Avatar Selector Modal */}
      <AvatarSelector
        selectedAvatarId={selectedAvatarId}
        onAvatarSelect={handleAvatarSelect}
        isOpen={isAvatarSelectorOpen}
        onClose={() => setIsAvatarSelectorOpen(false)}
      />

      {/* QR Code Modal */}
      <QRCodeModal
        isOpen={qrModalOpen}
        onClose={handleCloseQRModal}
        transactionData={currentTransaction}
        rewardName={currentReward?.name}
      />

      {/* In Progress Rewards Modal */}
      <InProgressRewardsModal
        isOpen={inProgressModalOpen}
        onClose={() => setInProgressModalOpen(false)}
        inProgressRewards={getInProgressRewards()}
        userProgress={userProgress}
        onAddStamp={handleInProgressAddStamp}
        onRedeemReward={handleInProgressRedeemReward}
      />
    </div>
  );
}
