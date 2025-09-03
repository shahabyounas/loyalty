import React from "react";
import "./InProgressRewardsModal.css";

const InProgressRewardsModal = ({
  isOpen,
  onClose,
  modalType = "in-progress", // "in-progress", "ready-to-redeem", "availed"
  modalTitle = "Rewards",
  inProgressRewards = [],
  userProgress = {},
  userProgressByReward = {}, // New: multiple records per reward
  onAddStamp,
  onRedeemReward,
}) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleAddStamp = (rewardId, rewardName) => {
    if (onAddStamp) {
      onAddStamp(rewardId, rewardName);
    }
  };

  // Get the appropriate icon and title based on modal type
  const getModalConfig = () => {
    switch (modalType) {
      case "ready-to-redeem":
        return {
          icon: "✅",
          title: modalTitle || "Ready to Redeem",
          emptyIcon: "🎯",
          emptyTitle: "No Rewards Ready",
          emptyMessage: "Complete collecting stamps to see rewards ready for redemption!"
        };
      case "availed":
        return {
          icon: "🎁",
          title: modalTitle || "Availed Rewards",
          emptyIcon: "🏆",
          emptyTitle: "No Rewards Availed Yet",
          emptyMessage: "Redeem your completed rewards to see them here!"
        };
      default: // in-progress
        return {
          icon: "⏳",
          title: modalTitle || "Rewards In Progress",
          emptyIcon: "🎯",
          emptyTitle: "No Rewards In Progress",
          emptyMessage: "Start collecting stamps for any available reward to see your progress here!"
        };
    }
  };

  const handleRedeemReward = (rewardId, rewardName) => {
    if (onRedeemReward) {
      onRedeemReward(rewardId, rewardName);
    }
  };

  const modalConfig = getModalConfig();

  return (
    <div className="in-progress-modal-overlay" onClick={handleBackdropClick}>
      <div className="in-progress-modal">
        <div className="in-progress-modal-header">
          <h2 className="in-progress-modal-title">
            <span className="in-progress-modal-icon">{modalConfig.icon}</span>
            {modalConfig.title}
          </h2>
          <button className="in-progress-modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="in-progress-modal-content">
          {inProgressRewards.length === 0 ? (
            <div className="in-progress-empty-state">
              <div className="in-progress-empty-icon">{modalConfig.emptyIcon}</div>
              <h3>{modalConfig.emptyTitle}</h3>
              <p>{modalConfig.emptyMessage}</p>
            </div>
          ) : (
            <div className="in-progress-rewards-list">
              {inProgressRewards.map((reward) => {
                if (!reward || !reward.id) {
                  return null; // Skip invalid reward objects
                }
                
                const progress = userProgress[reward.id];
                const stampsCollected = progress?.stamps_collected || 0;
                
                // Get required stamps from points_required field (this is the actual stamps requirement)
                const stampsRequired = reward.points_required || 10; // points_required contains the required stamps count
                
                const status = progress?.status || "in_progress";
                const completionPercentage = progress
                  ? (stampsCollected / stampsRequired) * 100
                  : 0;

                // Determine reward state based on UserRewardProgress - stamps collected vs required
                let rewardState = "in_progress";
                if (stampsCollected >= stampsRequired) {
                  if (status === "redeemed" || status === "availed") {
                    rewardState = "redeemed";
                  } else {
                    rewardState = "ready";
                  }
                }

                // Debug logging for UserRewardProgress state
                console.log(`UserRewardProgress - ${reward.name}:`, {
                  stampsCollected,
                  stampsRequired,
                  status,
                  calculatedState: rewardState,
                  completionPercentage: Math.round(completionPercentage)
                });

                return (
                  <div
                    key={reward.id}
                    className={`in-progress-reward-card in-progress-reward-${rewardState}`}
                  >
                    <div className="in-progress-reward-header">
                      <div className="in-progress-reward-icon">
                        {rewardState === "ready"
                          ? "🎉"
                          : rewardState === "redeemed"
                          ? "✅"
                          : reward.type === "discount"
                          ? "💰"
                          : reward.type === "free_item"
                          ? "🎁"
                          : reward.type === "cashback"
                          ? "💳"
                          : "🏆"}
                      </div>
                      <div className="in-progress-reward-info">
                        <h4 className="in-progress-reward-name">
                          {reward.name}
                        </h4>
                        <p className="in-progress-reward-description">
                          {reward.description}
                        </p>
                      </div>
                      <div className="in-progress-reward-status">
                        <span
                          className={`in-progress-status-badge in-progress-status-${rewardState}`}
                        >
                          {rewardState === "ready"
                            ? "Ready!"
                            : rewardState === "redeemed"
                            ? "Redeemed"
                            : "In Progress"}
                        </span>
                      </div>
                    </div>

                    <div className="in-progress-reward-content">
                      {/* Progress Section */}
                      <div className="in-progress-progress-section">
                        <div className="in-progress-progress-header">
                          <span className="in-progress-progress-label">
                            Stamp Progress
                          </span>
                          <span className="in-progress-progress-count">
                            {stampsCollected}/{stampsRequired}
                          </span>
                        </div>

                        <div className="in-progress-progress-bar">
                          <div
                            className="in-progress-progress-fill"
                            style={{ width: `${completionPercentage}%` }}
                          ></div>
                        </div>

                        <div className="in-progress-progress-percentage">
                          {Math.round(completionPercentage)}% Complete
                        </div>
                      </div>

                      {/* Reward Details */}
                      <div className="in-progress-reward-details">
                        <div className="in-progress-reward-value">
                          <span className="in-progress-value-label">
                            Value:
                          </span>
                          <span className="in-progress-value-amount">
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

                        {reward.expiry_date && (
                          <div className="in-progress-reward-expiry">
                            <span className="in-progress-expiry-label">
                              Expires:
                            </span>
                            <span className="in-progress-expiry-date">
                              {new Date(
                                reward.expiry_date
                              ).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="in-progress-reward-actions">
                        {modalType === "availed" ? (
                          <div className="in-progress-redeemed-badge">
                            <span className="in-progress-redeemed-icon">✅</span>
                            <span className="in-progress-redeemed-text">
                              Reward Redeemed
                            </span>
                          </div>
                        ) : rewardState === "ready" ? (
                          <button
                            className="in-progress-redeem-button"
                            onClick={() => handleRedeemReward(reward.id, reward.name)}
                          >
                            🎉 Redeem Now
                          </button>
                        ) : rewardState === "redeemed" ? (
                          <div className="in-progress-redeemed-badge">
                            <span className="in-progress-redeemed-icon">✅</span>
                            <span className="in-progress-redeemed-text">
                              Reward Redeemed
                            </span>
                          </div>
                        ) : modalType === "ready-to-redeem" ? (
                          <button
                            className="in-progress-redeem-button"
                            onClick={() => handleRedeemReward(reward.id, reward.name)}
                          >
                            🎉 Redeem Now
                          </button>
                        ) : (
                          <button
                            className="in-progress-add-stamp-button"
                            onClick={() =>
                              handleAddStamp(reward.id, reward.name)
                            }
                          >
                            📱 Add Stamp
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InProgressRewardsModal;
