import React from "react";
import "./InProgressRewardsModal.css";

const InProgressRewardsModal = ({
  isOpen,
  onClose,
  inProgressRewards,
  userProgress,
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

  const handleRedeemReward = (rewardId) => {
    if (onRedeemReward) {
      onRedeemReward(rewardId);
    }
  };

  return (
    <div className="in-progress-modal-overlay" onClick={handleBackdropClick}>
      <div className="in-progress-modal">
        <div className="in-progress-modal-header">
          <h2 className="in-progress-modal-title">
            <span className="in-progress-modal-icon">⏳</span>
            Rewards In Progress
          </h2>
          <button className="in-progress-modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="in-progress-modal-content">
          {inProgressRewards.length === 0 ? (
            <div className="in-progress-empty-state">
              <div className="in-progress-empty-icon">🎯</div>
              <h3>No Rewards In Progress</h3>
              <p>
                Start collecting stamps for any available reward to see your
                progress here!
              </p>
            </div>
          ) : (
            <div className="in-progress-rewards-list">
              {inProgressRewards.map((reward) => {
                const progress = userProgress[reward.id];
                const stampsCollected = progress?.stamps_collected || 0;
                const stampsRequired =
                  reward.points_required || reward.stamps_required || 10;
                const isCompleted = progress?.is_completed || false;
                const status = progress?.status || "in_progress";
                const completionPercentage = progress
                  ? (stampsCollected / stampsRequired) * 100
                  : 0;

                // Determine reward state
                let rewardState = "in_progress";
                if (isCompleted && status === "ready_to_redeem") {
                  rewardState = "ready";
                } else if (isCompleted && status === "redeemed") {
                  rewardState = "redeemed";
                }

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
                        {rewardState === "ready" ? (
                          <button
                            className="in-progress-redeem-button"
                            onClick={() => handleRedeemReward(reward.id)}
                          >
                            🎉 Redeem Now
                          </button>
                        ) : rewardState === "redeemed" ? (
                          <div className="in-progress-redeemed-badge">
                            <span className="in-progress-redeemed-icon">
                              ✅
                            </span>
                            <span className="in-progress-redeemed-text">
                              Reward Redeemed
                            </span>
                          </div>
                        ) : (
                          <button
                            className="in-progress-add-stamp-button"
                            onClick={() =>
                              handleAddStamp(reward.id, reward.name)
                            }
                          >
                            + Add Stamp
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
