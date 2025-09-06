import React, { useState, useEffect, useRef } from "react";
import { adminProgressAPI } from "../../utils/api";
import ProgressDetailsModal from "./ProgressDetailsModal";
import "./StampTransactions.css";

const StampTransactions = () => {
  const [progressRewards, setProgressRewards] = useState([]);
  const [filteredProgressRewards, setFilteredProgressRewards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedProgress, setSelectedProgress] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  // Filter and search refs
  const searchInputRef = useRef(null);
  const statusSelectRef = useRef(null);
  const searchDebounceRef = useRef(null);

  useEffect(() => {
    fetchProgressRewards();
  }, []);

  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, []);

  const applyFilters = (list) => {
    let result = Array.isArray(list) ? [...list] : [];
    
    // Apply search filter
    const searchTerm = (searchInputRef.current?.value || "").trim().toLowerCase();
    if (searchTerm) {
      result = result.filter((progress) => {
        const customerName = (progress.customer_name || "").toLowerCase();
        const customerEmail = (progress.customer_email || "").toLowerCase();
        const rewardName = (progress.reward_name || "").toLowerCase();
        return (
          customerName.includes(searchTerm) ||
          customerEmail.includes(searchTerm) ||
          rewardName.includes(searchTerm)
        );
      });
    }

    // Apply status filter
    const statusFilter = (statusSelectRef.current?.value || "all").toLowerCase();
    if (statusFilter !== "all") {
      result = result.filter((progress) => {
        const status = getStatusLabel(progress.status, progress.is_completed).toLowerCase();
        return status === statusFilter;
      });
    }

    return result;
  };

  const handleSearchInput = () => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    
    searchDebounceRef.current = setTimeout(() => {
      const filtered = applyFilters(progressRewards);
      setFilteredProgressRewards(filtered);
    }, 300);
  };

  const handleFiltersChange = () => {
    const filtered = applyFilters(progressRewards);
    setFilteredProgressRewards(filtered);
  };

  const fetchProgressRewards = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await adminProgressAPI.getAllProgressRewards();

      if (response && response.success) {
        const data = response.data || [];
        setProgressRewards(data);
        setFilteredProgressRewards(data);
      } else {
        // Silently handle API errors, show empty list
        console.warn("API response unsuccessful:", response?.message || "Unknown error");
        setProgressRewards([]);
        setFilteredProgressRewards([]);
        setError(response?.message || "Unable to load data at the moment");
      }
    } catch (error) {
      // Silently handle network/API errors, show empty list
      console.warn("Failed to fetch progress rewards:", error);
      setProgressRewards([]);
      setFilteredProgressRewards([]);
      setError("Network error - showing cached data");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusIcon = (status, isCompleted) => {
    if (status === "redeemed") return "🎉";
    if (status === "availed") return "🎉";
    if (isCompleted && status === "ready_to_redeem") return "✅";
    return "🔄";
  };

  const getStatusLabel = (status, isCompleted) => {
    if (status === "redeemed") return "Redeemed";
    if (status === "availed") return "Redeemed";
    if (isCompleted && status === "ready_to_redeem") return "Ready to Redeem";
    return "In Progress";
  };

  const getStatusClass = (status, isCompleted) => {
    if (status === "redeemed") return "redeemed";
    if (status === "availed") return "redeemed";
    if (isCompleted && status === "ready_to_redeem") return "ready";
    return "in-progress";
  };

  const openDetailsModal = (progress) => {
    setSelectedProgress(progress);
    setShowDetailsModal(true);
  };

  const closeDetailsModal = () => {
    setSelectedProgress(null);
    setShowDetailsModal(false);
  };

  if (loading) {
    return (
      <div className="stamp-transactions-container">
        <div className="stamp-transactions-header">
          <h2 className="stamp-transactions-title">
            <span className="stamp-transactions-icon">🎯</span>
            User Progress Rewards
          </h2>
          <p className="stamp-transactions-subtitle">
            Manage and track customer reward progress across all stamps and redemptions
          </p>
        </div>
        <div className="stamp-transactions-loading">
          <div className="stamp-transactions-spinner"></div>
          <p>Loading progress rewards...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="stamp-transactions-container">

      {/* Search and Filter Section */}
      <div className="stamp-transactions-search-filter-section">
        <input
          type="text"
          placeholder="Search by customer name, email, or reward..."
          ref={searchInputRef}
          onInput={handleSearchInput}
          className="stamp-transactions-search-input"
        />
        <select
          ref={statusSelectRef}
          defaultValue="all"
          onChange={handleFiltersChange}
          className="stamp-transactions-filter-select"
        >
          <option value="all">All Status</option>
          <option value="in progress">In Progress</option>
          <option value="ready to redeem">Ready to Redeem</option>
          <option value="redeemed">Redeemed</option>
        </select>
        <button onClick={fetchProgressRewards} className="stamp-transactions-refresh-btn">
          🔄 Refresh
        </button>
        {error && (
          <span className="stamp-transactions-error-indicator" title={error}>
            ⚠️ Connection Issue
          </span>
        )}
      </div>

      {/* Summary Cards */}
      <div className="stamp-transactions-summary">
        <div className="stamp-transactions-summary-card">
          <div className="stamp-transactions-summary-number">{filteredProgressRewards.length}</div>
          <div className="stamp-transactions-summary-label">Filtered Results</div>
        </div>
        <div className="stamp-transactions-summary-card">
          <div className="stamp-transactions-summary-number">{progressRewards.length}</div>
          <div className="stamp-transactions-summary-label">Total Customer Rewards</div>
        </div>
        <div className="stamp-transactions-summary-card">
          <div className="stamp-transactions-summary-number">
            {progressRewards.filter(p => !p.is_completed).length}
          </div>
          <div className="stamp-transactions-summary-label">In Progress</div>
        </div>
        <div className="stamp-transactions-summary-card">
          <div className="stamp-transactions-summary-number">
            {progressRewards.filter(p => p.is_completed && p.status === 'ready_to_redeem').length}
          </div>
          <div className="stamp-transactions-summary-label">Ready to Redeem</div>
        </div>
        <div className="stamp-transactions-summary-card">
          <div className="stamp-transactions-summary-number">
            {progressRewards.filter(p => p.status === 'availed').length}
          </div>
          <div className="stamp-transactions-summary-label">Redeemed</div>
        </div>
      </div>

      {/* Progress Table */}
      <div className="stamp-transactions-table-container">
        {filteredProgressRewards.length === 0 ? (
          <div className="stamp-transactions-empty">
            <div className="stamp-transactions-empty-icon">📋</div>
            {progressRewards.length === 0 ? (
              <>
                <h3>No Progress Rewards Found</h3>
                {error ? (
                  <div>
                    <p>Unable to load data at the moment. Please try refreshing.</p>
                    <button onClick={fetchProgressRewards} className="stamp-transactions-retry-btn">
                      🔄 Try Again
                    </button>
                  </div>
                ) : (
                  <p>There are no customer progress rewards to display at the moment.</p>
                )}
              </>
            ) : (
              <>
                <h3>No Results Found</h3>
                <p>No progress rewards match your current search and filter criteria.</p>
                <button 
                  onClick={() => {
                    if (searchInputRef.current) searchInputRef.current.value = '';
                    if (statusSelectRef.current) statusSelectRef.current.value = 'all';
                    setFilteredProgressRewards(progressRewards);
                  }}
                  className="stamp-transactions-clear-filters-btn"
                >
                  Clear Filters
                </button>
              </>
            )}
          </div>
        ) : (
          <table className="stamp-transactions-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Reward</th>
                <th>Progress</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProgressRewards.map((progress) => (
                <tr key={progress.id} className="stamp-transactions-row">
                  <td className="stamp-transactions-customer">
                    <div className="stamp-transactions-customer-info">
                      <div className="stamp-transactions-customer-name">
                        {progress.customer_name}
                      </div>
                      <div className="stamp-transactions-customer-email">
                        {progress.customer_email}
                      </div>
                    </div>
                  </td>
                  <td className="stamp-transactions-reward">
                    <div className="stamp-transactions-reward-info">
                      <div className="stamp-transactions-reward-name">
                        {progress.reward_name}
                      </div>
                      {progress.reward_description && (
                        <div className="stamp-transactions-reward-desc">
                          {progress.reward_description}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="stamp-transactions-progress">
                    <div className="stamp-transactions-progress-info">
                      <div className="stamp-transactions-progress-text">
                        {progress.stamps_collected} / {progress.stamps_required} stamps
                      </div>
                      <div className="stamp-transactions-progress-percentage">
                        {Math.round(progress.completion_percentage)}%
                      </div>
                    </div>
                  </td>
                  <td className="stamp-transactions-status">
                    <span className={`stamp-transactions-status-badge ${getStatusClass(progress.status, progress.is_completed)}`}>
                      {getStatusIcon(progress.status, progress.is_completed)} {getStatusLabel(progress.status, progress.is_completed)}
                    </span>
                  </td>
                  <td className="stamp-transactions-date">
                    {formatDate(progress.created_at)}
                  </td>
                  <td className="stamp-transactions-actions">
                    <button
                      className="stamp-transactions-view-btn"
                      onClick={() => openDetailsModal(progress)}
                      title="View Details"
                    >
                      👁️ View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedProgress && (
        <ProgressDetailsModal
          progress={selectedProgress}
          onClose={closeDetailsModal}
        />
      )}
    </div>
  );
};

export default StampTransactions;
