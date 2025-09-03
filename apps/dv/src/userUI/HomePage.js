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
} from "../utils/api";
import QRCodeModal from "../shared/components/QRCodeModal";
import InProgressRewardsModal from "./components/InProgressRewardsModal";
import "./HomePage.css";

export default function Home() {
  const { user, authErrors, clearAuthErrors } = useAuth();
  const [qrCode, setQrCode] = useState("");
  const [selectedAvatarId, setSelectedAvatarId] = useState("neural-cloud");
  const [isAvatarSelectorOpen, setIsAvatarSelectorOpen] = useState(false);
  const [isQrGenerated, setIsQrGenerated] = useState(false);
  const [availableRewards, setAvailableRewards] = useState([]);
  const [rewardsLoading, setRewardsLoading] = useState(false);
  const [userProgress, setUserProgress] = useState({});
  const [userProgressByReward, setUserProgressByReward] = useState({}); // New: grouped by reward_id
  const [progressLoading, setProgressLoading] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState(null);
  const [currentReward, setCurrentReward] = useState(null);
  const [inProgressModalOpen, setInProgressModalOpen] = useState(false);
  const [modalType, setModalType] = useState("in-progress"); // "in-progress", "ready-to-redeem", "availed"
  const [modalTitle, setModalTitle] = useState("");
  const [notification, setNotification] = useState(null); // For showing stamp notifications
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
      
      // Group progress records by reward_id, allowing multiple records per reward
      const progressByReward = {};
      const progressMap = {}; // Keep this for backward compatibility
      
      (response.data || []).forEach((progress) => {
        if (!progressByReward[progress.reward_id]) {
          progressByReward[progress.reward_id] = [];
        }
        progressByReward[progress.reward_id].push(progress);
        
        // For backward compatibility, keep the latest in_progress or latest record
        if (!progressMap[progress.reward_id] || 
            (progress.status === 'in_progress' && progressMap[progress.reward_id].status !== 'in_progress')) {
          progressMap[progress.reward_id] = progress;
        }
      });

      // Use backend-calculated statistics if available, otherwise calculate manually
      let stats;
      if (response.statistics) {
        stats = {
          totalStamps: response.statistics.total_stamps_collected,
          totalRewards: response.statistics.total_rewards_completed,
          rewardsInProgress: response.statistics.rewards_in_progress,
          rewardsReadyToRedeem: response.statistics.rewards_ready_to_redeem,
        };
        console.log("Using backend statistics:", stats);
      } else {
        // Fallback to manual calculation (for backwards compatibility)
        let totalStamps = 0;
        let totalRewards = 0;
        let rewardsInProgress = 0;
        let rewardsReadyToRedeem = 0;

        (response.data || []).forEach((progress) => {
          totalStamps += progress.stamps_collected || 0;

          if (progress.status === "ready_to_redeem") {
            rewardsReadyToRedeem++;
          } else if (progress.status === "redeemed" || progress.status === "availed") {
            totalRewards++;
          } else if (progress.status === "in_progress" && progress.stamps_collected > 0) {
            rewardsInProgress++;
          }
        });

        stats = {
          totalStamps,
          totalRewards,
          rewardsInProgress,
          rewardsReadyToRedeem,
        };
        console.log("Using manual calculation:", stats);
      }

      setUserProgress(progressMap); // For backward compatibility
      setUserProgressByReward(progressByReward); // New grouped structure
      setLifetimeStats(stats);
    } catch (error) {
      console.error("Failed to fetch user progress:", error);
      setUserProgress({});
      setUserProgressByReward({});
    } finally {
      setProgressLoading(false);
    }
  }

  // Fetch data on component mount
  useEffect(() => {
    if (user) {
      fetchAvailableRewards();
      fetchUserProgress();
    }
  }, [user]);

  // Auto-refresh user progress every 30 seconds when component is active
  useEffect(() => {
    let intervalId;
    
    if (user) {
      intervalId = setInterval(() => {
        fetchUserProgress();
      }, 30000); // Refresh every 30 seconds
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [user]);

  // Show notifications for authentication errors
  useEffect(() => {
    if (authErrors && authErrors.length > 0) {
      const latestError = authErrors[authErrors.length - 1];
      showNotification(latestError.message, "error");
      // Clear the errors after showing
      setTimeout(() => {
        clearAuthErrors();
      }, 1000);
    }
  }, [authErrors, clearAuthErrors]);

  // Manual refresh function
  const handleRefresh = async () => {
    setProgressLoading(true);
    
    // Store current stamps count to detect changes
    const previousTotalStamps = lifetimeStats.totalStamps;
    
    await Promise.all([
      fetchAvailableRewards(),
      fetchUserProgress()
    ]);

    // Show notification if stamps increased
    const newTotalStamps = lifetimeStats.totalStamps;
    if (newTotalStamps > previousTotalStamps) {
      showNotification("🎉 Your stamps have been updated!", "success");
    }
  };

  // Show notification function
  const showNotification = (message, type = "info") => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // Generate QR code data
  useEffect(() => {
    if (user && isQrGenerated) {
      console.log("Generating QR code...", user);
      const qrData = JSON.stringify({
        userId: user.id, // This is the Supabase auth user ID
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
   
              </div>
            )}
            <div className="home-user-tags">
              <span className="home-tag date">
                📅 Joined{" "}
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
          <div className="home-stats-header">
            <h3>Your Progress</h3>
            <button 
              className="home-refresh-button" 
              onClick={handleRefresh}
              disabled={progressLoading}
              title="Refresh progress"
            >
              {progressLoading ? "🔄" : "↻"}
            </button>
          </div>
          <div className="home-stats-grid">
            <div
              className="home-stat-card home-stat-clickable"
              onClick={() => openRewardsModal("in-progress", "In Progress Rewards")}
            >
              <div className="home-stat-icon">⏳</div>
              <div className="home-stat-value">
                {lifetimeStats.rewardsInProgress}
              </div>
              <div className="home-stat-label">In Progress</div>
            </div>

            <div 
              className="home-stat-card home-stat-clickable"
              onClick={() => openRewardsModal("ready-to-redeem", "Ready to Redeem")}
            >
              <div className="home-stat-icon">✅</div>
              <div className="home-stat-value">
                {lifetimeStats.rewardsReadyToRedeem}
              </div>
              <div className="home-stat-label">Ready to Redeem</div>
            </div>

            <div 
              className="home-stat-card home-stat-clickable"
              onClick={() => openRewardsModal("availed", "Availed Rewards")}
            >
              <div className="home-stat-icon">🎁</div>
              <div className="home-stat-value">
                {lifetimeStats.totalRewards}
              </div>
              <div className="home-stat-label">Rewards Availed</div>
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
            <h3 className="home-section-title">Your Rewards</h3>
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
            <h3 className="home-section-title">Your Rewards</h3>
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
          <h3 className="home-section-title">Your Rewards</h3>
        </div>

        <div className="home-rewards-grid">
          {availableRewards.map((reward) => {
            const progress = userProgress[reward.id];
            const stampsCollected = progress?.stamps_collected || 0;
            
            // Get required stamps from points_required field (this is the actual stamps requirement)
            const stampsRequired = reward.points_required || 10; // points_required contains the required stamps count
            
            const isCompleted = progress?.is_completed || false;
            const status = progress?.status || "new";
            const completionPercentage = progress
              ? (stampsCollected / stampsRequired) * 100
              : 0;

            // Debug logging to see the actual values
            if (reward.id && progress) {
              console.log(`Reward ${reward.name}:`, {
                reward_points_required: reward.points_required, // This is the actual stamps requirement
                calculated_stampsRequired: stampsRequired,
                progress_stamps_collected: progress.stamps_collected,
                progress_is_completed: progress.is_completed,
                progress_status: progress.status,
                reward_object: reward
              });
            }

            // Determine reward state based on UserRewardProgress
            // Rewards are business entities - they only show Available or In Progress
            let rewardState = "new";
            let rewardDescription = "Available";
            
            if (progress) {
              if (progress.stamps_collected > 0 && stampsCollected < stampsRequired) {
                // User has started collecting stamps but hasn't reached the requirement yet
                rewardState = "in-progress";
                rewardDescription = "In Progress";
              }
              // Note: We don't show "Ready to Redeem" on reward cards
              // Users redeem UserRewardProgress items, not Reward cards directly
              // Completed rewards automatically become "Available" again for new cycles
            }

            return (
              <div
                key={reward.id}
                className={`home-reward-card home-reward-${rewardState}`}
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
                  <div className="home-reward-type">
                    {rewardDescription}
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
                          Progress
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

                  <div className="home-reward-details">
                    <div className="home-reward-points">
                      <span className="home-points-label">
                        Stamps Needed:
                      </span>
                      <span className="home-points-value">
                        {stampsRequired}
                      </span>
                    </div>

                    <div className="home-reward-value">
                      <span className="home-value-label">Reward:</span>
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
                          : "Special Reward"}
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
                    {progress ? 
                      (progress.is_completed ? 
                        "🔄 Start New Collection" : 
                        `📱 Add Stamp (${stampsCollected}/${stampsRequired})`
                      ) : 
                      "🌟 Start Collecting"
                    }
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
    // Check if this is a completed reward that user wants to collect again
    const progress = userProgress[rewardId];
    const isCompletedReward = progress && progress.is_completed;
    
    // Generate QR code data for admin scanning
    const qrData = {
      user_id: user?.id, // This is the Supabase auth user ID
      reward_id: rewardId,
      timestamp: Date.now(),
      expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes from now
      reset_progress: isCompletedReward, // Flag to indicate this should reset progress if already completed
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
    
    // Refresh user progress after closing QR modal to reflect any changes
    fetchUserProgress();
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

  function handleInProgressRedeemReward(rewardId, rewardName) {
    // Close the modal and generate redemption QR code
    setInProgressModalOpen(false);
    
    // Find the reward to get its name
    const reward = availableRewards.find(r => r.id === rewardId);
    const displayName = rewardName || reward?.name || 'Unknown Reward';
    
    // Generate QR code data for redemption
    const qrData = {
      user_id: user?.id, // Supabase auth user ID
      reward_id: rewardId,
      action_type: "redemption", // Distinguish from stamp collection
      timestamp: Date.now(),
      expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes expiry
    };

    setCurrentTransaction({
      transaction_code: `REDEEM_${user?.id}_${rewardId}_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)
        .toUpperCase()}`,
      user_id: user?.id,
      reward_id: rewardId,
      action_type: "redemption",
      expires_at: qrData.expires_at,
      qr_data: JSON.stringify(qrData),
    });
    setCurrentReward({ id: rewardId, name: displayName });
    setQrModalOpen(true);
  }

  function openRewardsModal(type, title) {
    try {
      setModalType(type || "in-progress");
      setModalTitle(title || "Rewards");
      setInProgressModalOpen(true);
    } catch (error) {
      console.error("Error opening rewards modal:", error);
    }
  }

  // Get rewards by status for the modal (legacy - for in-progress type modals)
  function getRewardsByStatus(status) {
    if (!Array.isArray(availableRewards)) {
      return [];
    }
    
    return availableRewards.filter((reward) => {
      console.log("Filtering reward for status:", status, reward);
      if (!reward || !reward.id) {
        return false; // Skip invalid reward objects
      }
      
      const progressRecords = userProgressByReward[reward.id] || [];
      if (progressRecords.length === 0) {
        return false; // No progress means not in any status
      }
      
      // Get required stamps from points_required field (this is the actual stamps requirement)
      const stampsRequired = reward.points_required || 10; // points_required contains the required stamps count
      
      switch (status) {
        case "in-progress":
          // Has at least one in_progress record
          return progressRecords.some(progress => 
            progress.status === 'in_progress' && progress.stamps_collected > 0
          );
        case "ready-to-redeem":
          // Has at least one ready_to_redeem record
          return progressRecords.some(progress => 
            progress.status === 'ready_to_redeem'
          );
        case "availed":
          // Has at least one redeemed/availed record
          return progressRecords.some(progress => 
            progress.status === 'redeemed' || progress.status === 'availed'
          );
        default:
          return false;
      }
    });
  }

  // Get UserRewardProgress records by status (new - shows individual records)
  function getProgressRecordsByStatus(status) {
    if (!Array.isArray(availableRewards)) {
      return [];
    }
    
    const progressRecords = [];
    
    // Go through each reward and find matching progress records
    availableRewards.forEach((reward) => {
      if (!reward || !reward.id) return;
      
      const rewardProgressRecords = userProgressByReward[reward.id] || [];
      
      rewardProgressRecords.forEach((progress) => {
        let shouldInclude = false;
        
        switch (status) {
          case "in-progress":
            shouldInclude = progress.status === 'in_progress' && progress.stamps_collected > 0;
            break;
          case "ready-to-redeem":
            shouldInclude = progress.status === 'ready_to_redeem';
            break;
          case "availed":
            shouldInclude = progress.status === 'redeemed' || progress.status === 'availed';
            break;
        }
        
        if (shouldInclude) {
          // Combine progress record with reward info
          progressRecords.push({
            ...progress,
            reward: reward, // Include full reward object
            reward_name: reward.name,
            reward_description: reward.description,
            reward_points_required: reward.points_required,
            reward_type: reward.type,
            reward_discount_percentage: reward.discount_percentage,
            reward_discount_amount: reward.discount_amount,
          });
        }
      });
    });
    
    console.log(`Found ${progressRecords.length} progress records for status: ${status}`, progressRecords);
    return progressRecords;
  }

  return (
    <div className="home-page">
      <ParticleBackground />
      <div className="home-loyalty-container">
        {renderHeader()}
        {renderUserProfile()}
        {renderAllRewards()}
      </div>

      {/* Notification */}
      {notification && (
        <div className={`home-notification home-notification-${notification.type}`}>
          <span className="home-notification-message">{notification.message}</span>
          <button 
            className="home-notification-close"
            onClick={() => setNotification(null)}
          >
            ✕
          </button>
        </div>
      )}

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

      {/* Unified Rewards Modal */}
      <InProgressRewardsModal
        isOpen={inProgressModalOpen}
        onClose={() => setInProgressModalOpen(false)}
        modalType={modalType}
        modalTitle={modalTitle}
        inProgressRewards={modalType === 'in-progress' ? getRewardsByStatus(modalType) : getProgressRecordsByStatus(modalType)}
        userProgress={userProgress}
        userProgressByReward={userProgressByReward}
        onAddStamp={handleInProgressAddStamp}
        onRedeemReward={handleInProgressRedeemReward}
        showProgressRecords={modalType !== 'in-progress'} // Flag to indicate we're showing progress records, not rewards
      />
    </div>
  );
}
