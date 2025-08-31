import React, { useState, useEffect } from "react";
import { adminProgressAPI } from "../../utils/api";
import "./ProgressDetailsModal.css";

const ProgressDetailsModal = ({ progress, onClose }) => {
  const [scanHistory, setScanHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });

  useEffect(() => {
    if (progress?.id) {
      fetchScanHistory();
    }
  }, [progress?.id, pagination.page]);

  const fetchScanHistory = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await adminProgressAPI.getProgressScanHistory(
        progress.id
      );

      if (response.success) {
        setScanHistory(response.data.scan_history || []);
        // Since our simplified API doesn't return pagination, we'll just show all results
      } else {
        setError(response.message || "Failed to load scan history");
      }
    } catch (err) {
      console.error("Error fetching scan history:", err);
      setError("Failed to load scan history");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      in_progress: { color: "#3b82f6", bg: "#dbeafe", text: "In Progress" },
      ready_to_redeem: { color: "#f59e0b", bg: "#fef3c7", text: "Ready to Redeem" },
      redeemed: { color: "#10b981", bg: "#d1fae5", text: "Redeemed" },
    };

    const config = statusConfig[status] || statusConfig.in_progress;
    
    return (
      <span
        className="progress-status-badge"
        style={{
          color: config.color,
          backgroundColor: config.bg,
        }}
      >
        {config.text}
      </span>
    );
  };

  const changePage = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  if (!progress) return null;

  return (
    <div className="progress-modal-overlay" onClick={onClose}>
      <div className="progress-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="progress-modal-header">
          <div className="progress-modal-title">
            <span className="progress-modal-icon">🎯</span>
            <h2>Progress Details</h2>
          </div>
          <button className="progress-modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Progress Overview */}
        <div className="progress-overview">
          <div className="progress-overview-card">
            <div className="progress-overview-header">
              <h3>📋 Progress Overview</h3>
              {getStatusBadge(progress.status)}
            </div>
            
            <div className="progress-overview-grid">
              <div className="progress-overview-item">
                <span className="progress-label">Customer:</span>
                <span className="progress-value">{progress.customer_name}</span>
              </div>
              
              <div className="progress-overview-item">
                <span className="progress-label">Email:</span>
                <span className="progress-value">{progress.customer_email || 'Not provided'}</span>
              </div>
              
              <div className="progress-overview-item">
                <span className="progress-label">Reward:</span>
                <span className="progress-value">{progress.reward_name}</span>
              </div>
              
              <div className="progress-overview-item">
                <span className="progress-label">Progress:</span>
                <span className="progress-value">
                  {progress.stamps_collected}/{progress.stamps_required} stamps
                  ({progress.completion_percentage?.toFixed(1)}%)
                </span>
              </div>
              
              <div className="progress-overview-item">
                <span className="progress-label">Remaining:</span>
                <span className="progress-value">{progress.remaining_stamps} stamps</span>
              </div>
              
              <div className="progress-overview-item">
                <span className="progress-label">Total Scans:</span>
                <span className="progress-value">{progress.total_scans}</span>
              </div>
              
              <div className="progress-overview-item">
                <span className="progress-label">Started:</span>
                <span className="progress-value">{formatDate(progress.created_at)}</span>
              </div>
              
              <div className="progress-overview-item">
                <span className="progress-label">Last Updated:</span>
                <span className="progress-value">{formatDate(progress.updated_at)}</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="progress-bar-container">
              <div className="progress-bar-label">
                Completion Progress
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-bar-fill"
                  style={{ width: `${progress.completion_percentage || 0}%` }}
                ></div>
              </div>
              <div className="progress-bar-text">
                {progress.completion_percentage?.toFixed(1)}% Complete
              </div>
            </div>
          </div>
        </div>

        {/* Scan History */}
        <div className="scan-history-section">
          <div className="scan-history-header">
            <h3>📊 Scan History</h3>
            <div className="scan-history-count">
              {pagination.total} total scans
            </div>
          </div>

          {loading ? (
            <div className="scan-history-loading">
              <div className="scan-loading-spinner"></div>
              <p>Loading scan history...</p>
            </div>
          ) : error ? (
            <div className="scan-history-error">
              <span className="scan-error-icon">⚠️</span>
              <p>{error}</p>
            </div>
          ) : scanHistory.length === 0 ? (
            <div className="scan-history-empty">
              <div className="scan-empty-icon">📭</div>
              <h4>No scan history</h4>
              <p>This progress doesn't have any scan records yet</p>
            </div>
          ) : (
            <>
              <div className="scan-history-table">
                <div className="scan-history-table-header">
                  <div className="scan-table-cell">Date & Time</div>
                  <div className="scan-table-cell">Staff Member</div>
                  <div className="scan-table-cell">Store</div>
                  <div className="scan-table-cell">Before</div>
                  <div className="scan-table-cell">Added</div>
                  <div className="scan-table-cell">After</div>
                  <div className="scan-table-cell">Method</div>
                </div>

                <div className="scan-history-table-body">
                  {scanHistory.map((scan, index) => (
                    <div key={scan.id || index} className="scan-history-table-row">
                      <div className="scan-table-cell">
                        <div className="scan-date">
                          {formatDate(scan.created_at)}
                        </div>
                      </div>

                      <div className="scan-table-cell">
                        <div className="scan-staff">
                          <div className="scan-staff-name">
                            {scan.scanned_by_name}
                          </div>
                          {scan.scanned_by_email && (
                            <div className="scan-staff-email">
                              {scan.scanned_by_email}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="scan-table-cell">
                        <div className="scan-store">
                          <div className="scan-store-name">
                            {scan.store_name}
                          </div>
                          {scan.store_address && (
                            <div className="scan-store-address">
                              {scan.store_address}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="scan-table-cell">
                        <div className="scan-stamps before">
                          {scan.stamps_before_scan}
                        </div>
                      </div>

                      <div className="scan-table-cell">
                        <div className="scan-stamps added">
                          +{scan.stamps_added}
                        </div>
                      </div>

                      <div className="scan-table-cell">
                        <div className="scan-stamps after">
                          {scan.stamps_after_scan}
                        </div>
                      </div>

                      <div className="scan-table-cell">
                        <div className="scan-method">
                          {scan.scan_method === 'qr_code' ? '📱 QR Code' : '⌨️ Manual'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="scan-history-pagination">
                  <button
                    className="pagination-btn"
                    disabled={!pagination.hasPrev}
                    onClick={() => changePage(pagination.page - 1)}
                  >
                    ‹ Previous
                  </button>
                  
                  <span className="pagination-info">
                    Page {pagination.page} of {pagination.pages}
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
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProgressDetailsModal;
