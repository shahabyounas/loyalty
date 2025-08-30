import React, { useState, useEffect } from "react";
import { adminProgressAPI } from "../../utils/api";
import ProgressDetailsModal from "./ProgressDetailsModal";
import "./StampTransactions.css";

const StampTransactions = () => {
  const [progressRewards, setProgressRewards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedProgress, setSelectedProgress] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [filters, setFilters] = useState({
    status: "",
    rewardId: "",
    search: "",
    dateFrom: "",
    dateTo: "",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
    pages: 0,
  });

  useEffect(() => {
    fetchProgressRewards();
  }, [pagination.page, filters]);

  const fetchProgressRewards = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await adminProgressAPI.getAllProgressRewards({
        page: pagination.page,
        limit: pagination.limit,
        ...filters,
      });

      if (response.success) {
        setProgressRewards(response.data || []);
        setPagination(prev => ({
          ...prev,
          ...response.pagination,
        }));
      } else {
        setError(response.message || "Failed to load progress rewards");
      }
    } catch (error) {
      console.error("Failed to fetch progress rewards:", error);
      setError("Failed to load progress rewards");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusIcon = (status, isCompleted) => {
    if (status === "redeemed") return "🎉";
    if (isCompleted && status === "ready_to_redeem") return "✅";
    return "�";
  };

  const getStatusLabel = (status, isCompleted) => {
    if (status === "redeemed") return "Redeemed";
    if (isCompleted && status === "ready_to_redeem") return "Ready to Redeem";
    return "In Progress";
  };

  const getStatusClass = (status, isCompleted) => {
    if (status === "redeemed") return "redeemed";
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

  const clearFilters = () => {
    setFilters({
      status: "",
      rewardId: "",
      search: "",
      dateFrom: "",
      dateTo: "",
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const changePage = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const filteredCounts = {
    total: progressRewards.length,
    inProgress: progressRewards.filter(p => !p.is_completed).length,
    readyToRedeem: progressRewards.filter(p => p.is_completed && p.status === 'ready_to_redeem').length,
    redeemed: progressRewards.filter(p => p.status === 'redeemed').length,
  };

  if (loading && progressRewards.length === 0) {
    return (
      <div className="stamp-transactions-container">
        <div className="stamp-transactions-loading">
          <div className="stamp-transactions-spinner"></div>
          <p>Loading progress rewards...</p>
        </div>
      </div>
    );
  }

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

      {/* Filters */}
      <div className="stamp-transactions-filters">
        <div className="stamp-transactions-filter-group">
          <label className="stamp-transactions-filter-label">Status:</label>
          <select
            className="stamp-transactions-filter-select"
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="in_progress">In Progress</option>
            <option value="ready_to_redeem">Ready to Redeem</option>
            <option value="redeemed">Redeemed</option>
          </select>
        </div>

        <div className="stamp-transactions-filter-group">
          <label className="stamp-transactions-filter-label">Search:</label>
          <input
            type="text"
            className="stamp-transactions-filter-input"
            placeholder="Customer name, email, or reward..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
          />
        </div>

        <div className="stamp-transactions-filter-group">
          <label className="stamp-transactions-filter-label">Date From:</label>
          <input
            type="date"
            className="stamp-transactions-filter-input"
            value={filters.dateFrom}
            onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
          />
        </div>

        <div className="stamp-transactions-filter-group">
          <label className="stamp-transactions-filter-label">Date To:</label>
          <input
            type="date"
            className="stamp-transactions-filter-input"
            value={filters.dateTo}
            onChange={(e) => handleFilterChange('dateTo', e.target.value)}
          />
        </div>

        <button
          className="stamp-transactions-clear-filters"
          onClick={clearFilters}
        >
          🔄 Clear Filters
        </button>
      </div>

      {/* Summary Stats */}
      <div className="stamp-transactions-summary">
        <div className="stamp-transactions-stat">
          <div className="stamp-transactions-stat-value">
            {pagination.total}
          </div>
          <div className="stamp-transactions-stat-label">
            Total Progress
          </div>
        </div>
        <div className="stamp-transactions-stat">
          <div className="stamp-transactions-stat-value">
            {filteredCounts.inProgress}
          </div>
          <div className="stamp-transactions-stat-label">In Progress</div>
        </div>
        <div className="stamp-transactions-stat">
          <div className="stamp-transactions-stat-value">
            {filteredCounts.readyToRedeem}
          </div>
          <div className="stamp-transactions-stat-label">Ready to Redeem</div>
        </div>
        <div className="stamp-transactions-stat">
          <div className="stamp-transactions-stat-value">
            {filteredCounts.redeemed}
          </div>
          <div className="stamp-transactions-stat-label">Redeemed</div>
        </div>
      </div>

      {/* Progress Rewards Table */}
      <div className="stamp-transactions-table-container">
        {error && (
          <div className="stamp-transactions-error">
            <span className="stamp-transactions-error-icon">⚠️</span>
            {error}
          </div>
        )}

        {progressRewards.length === 0 ? (
          <div className="stamp-transactions-empty">
            <div className="stamp-transactions-empty-icon">🎯</div>
            <h3>No progress rewards found</h3>
            <p>No customer progress data available with current filters</p>
          </div>
        ) : (
          <div className="stamp-transactions-table">
            <div className="stamp-transactions-table-header">
              <div className="stamp-transactions-table-cell">Status</div>
              <div className="stamp-transactions-table-cell">Customer</div>
              <div className="stamp-transactions-table-cell">Reward</div>
              <div className="stamp-transactions-table-cell">Progress</div>
              <div className="stamp-transactions-table-cell">Completion</div>
              <div className="stamp-transactions-table-cell">Total Scans</div>
              <div className="stamp-transactions-table-cell">Last Updated</div>
              <div className="stamp-transactions-table-cell">Actions</div>
            </div>

            <div className="stamp-transactions-table-body">
              {progressRewards.map((progress) => (
                <div
                  key={progress.id}
                  className="stamp-transactions-table-row"
                >
                  <div className="stamp-transactions-table-cell">
                    <div className={`stamp-transactions-status ${getStatusClass(progress.status, progress.is_completed)}`}>
                      <span className="stamp-transactions-status-icon">
                        {getStatusIcon(progress.status, progress.is_completed)}
                      </span>
                      <span className="stamp-transactions-status-label">
                        {getStatusLabel(progress.status, progress.is_completed)}
                      </span>
                    </div>
                  </div>

                  <div className="stamp-transactions-table-cell">
                    <div className="stamp-transactions-customer">
                      <div className="stamp-transactions-customer-name">
                        {progress.customer_name || "Unknown"}
                      </div>
                      <div className="stamp-transactions-customer-email">
                        {progress.customer_email || "No email"}
                      </div>
                    </div>
                  </div>

                  <div className="stamp-transactions-table-cell">
                    <div className="stamp-transactions-reward">
                      <div className="stamp-transactions-reward-name">
                        {progress.reward_name || "Unknown"}
                      </div>
                      <div className="stamp-transactions-reward-type">
                        {progress.reward_type || "N/A"}
                      </div>
                    </div>
                  </div>

                  <div className="stamp-transactions-table-cell">
                    <div className="stamp-transactions-progress">
                      <div className="stamp-transactions-progress-text">
                        {progress.stamps_collected}/{progress.stamps_required}
                      </div>
                      <div className="stamp-transactions-progress-bar">
                        <div 
                          className="stamp-transactions-progress-fill"
                          style={{ 
                            width: `${progress.completion_percentage || 0}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div className="stamp-transactions-table-cell">
                    <div className="stamp-transactions-completion">
                      {(progress.completion_percentage || 0).toFixed(1)}%
                    </div>
                  </div>

                  <div className="stamp-transactions-table-cell">
                    <div className="stamp-transactions-scans">
                      {progress.total_scans || 0}
                    </div>
                  </div>

                  <div className="stamp-transactions-table-cell">
                    <div className="stamp-transactions-date">
                      {formatDate(progress.updated_at)}
                    </div>
                  </div>

                  <div className="stamp-transactions-table-cell">
                    <button
                      className="stamp-transactions-view-btn"
                      onClick={() => openDetailsModal(progress)}
                      title="View details and scan history"
                    >
                      👁️ View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="stamp-transactions-pagination">
          <button
            className="pagination-btn"
            disabled={!pagination.hasPrev}
            onClick={() => changePage(pagination.page - 1)}
          >
            ‹ Previous
          </button>
          
          <span className="pagination-info">
            Page {pagination.page} of {pagination.pages} ({pagination.total} total)
          </span>
          
          <button
            className="pagination-btn"
            disabled={!pagination.hasNext}
            onClick={() => changePage(pagination.page + 1)}
          >
            Next ›
          </button>
        </div>
      )}

      {/* Export Options */}
      <div className="stamp-transactions-export">
        <button className="stamp-transactions-export-btn">
          📊 Export to CSV
        </button>
        <button className="stamp-transactions-export-btn">
          📄 Export to PDF
        </button>
      </div>

      {/* Progress Details Modal */}
      {showDetailsModal && selectedProgress && (
        <ProgressDetailsModal
          progressData={selectedProgress}
          onClose={closeDetailsModal}
        />
      )}
    </div>
  );
};

export default StampTransactions;
