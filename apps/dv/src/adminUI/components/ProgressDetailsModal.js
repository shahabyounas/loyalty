import React, { useState, useEffect } from "react";
import { adminProgressAPI } from "../../utils/api";
import "./ProgressDetailsModal.css";

const ProgressDetailsModal = ({ progress, onClose }) => {
  const [scanHistory, setScanHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (progress?.id) {
      fetchScanHistory();
    }
  }, [progress?.id]);

  const fetchScanHistory = async () => {
    if (!progress?.id) return;

    setLoading(true);
    setError(null);

    try {
      const response = await adminProgressAPI.getProgressScanHistory(progress.id);
      if (response.success) {
        setScanHistory(response.data.scan_history || []);
      } else {
        setError(response.message || "Failed to load scan history");
      }
    } catch (err) {
      setError("An error occurred while loading scan history");
      console.error("Error fetching scan history:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return "Invalid date";
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { class: "status-active", icon: "🟢", text: "Active" },
      completed: { class: "status-completed", icon: "✅", text: "Completed" },
      paused: { class: "status-paused", icon: "⏸️", text: "Paused" },
      expired: { class: "status-expired", icon: "❌", text: "Expired" },
    };

    const config = statusConfig[status] || statusConfig.active;
    return (
      <span className={`status-badge ${config.class}`}>
        <span>{config.icon}</span>
        {config.text}
      </span>
    );
  };

  const calculateRemainingStamps = () => {
    const remaining = (progress?.stamps_required || 0) - (progress?.stamps_collected || 0);
    return Math.max(0, remaining);
  };

  if (!progress) return null;

  return (
    <div className="progress-modal-overlay" onClick={onClose}>
      <div className="progress-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Modern Header */}
        <div className="progress-modal-header">
          <h2 className="progress-modal-title">
            <span>📊</span>
            Progress Details
          </h2>
          <button className="progress-modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="progress-modal-body">
          {/* Customer & Reward Information */}
          <div className="customer-reward-section">
            <div className="info-card">
              <div className="info-card-header">
                <div className="info-card-icon customer-icon">👤</div>
                <h3 className="info-card-title">Customer Information</h3>
              </div>
              <div className="info-card-content">
                <div className="info-item">
                  <span className="info-label">Name</span>
                  <span className="info-value">{progress.customer_name || "N/A"}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Email</span>
                  <span className="info-value">{progress.customer_email || "Not provided"}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Status</span>
                  <span className="info-value">{getStatusBadge(progress.status)}</span>
                </div>
              </div>
            </div>

            <div className="info-card">
              <div className="info-card-header">
                <div className="info-card-icon reward-icon">🎁</div>
                <h3 className="info-card-title">Reward Program</h3>
              </div>
              <div className="info-card-content">
                <div className="info-item">
                  <span className="info-label">Reward</span>
                  <span className="info-value">{progress.reward_name || "N/A"}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Started</span>
                  <span className="info-value">{formatDate(progress.created_at)}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Last Update</span>
                  <span className="info-value">{formatDate(progress.updated_at)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Progress Section */}
          <div className="progress-section">
            <div className="progress-header">
              <h3 className="progress-title">🎯 Progress Tracking</h3>
              <p className="progress-subtitle">Track your customer's journey to earning rewards</p>
            </div>

            <div className="progress-stats">
              <div className="progress-stat">
                <span className="progress-stat-value">{progress.stamps_collected || 0}</span>
                <span className="progress-stat-label">Stamps Collected</span>
              </div>
              <div className="progress-stat">
                <span className="progress-stat-value">{progress.stamps_required || 0}</span>
                <span className="progress-stat-label">Stamps Required</span>
              </div>
              <div className="progress-stat">
                <span className="progress-stat-value">{calculateRemainingStamps()}</span>
                <span className="progress-stat-label">Stamps Remaining</span>
              </div>
              <div className="progress-stat">
                <span className="progress-stat-value">{progress.total_scans || 0}</span>
                <span className="progress-stat-label">Total Scans</span>
              </div>
            </div>

            <div className="progress-visual">
              <div className="progress-percentage">
                {progress.completion_percentage?.toFixed(1) || 0}%
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-bar-fill"
                  style={{ width: `${progress.completion_percentage || 0}%` }}
                ></div>
              </div>
              <div className="progress-bar-text">
                Journey to reward completion
              </div>
            </div>
          </div>

          {/* Scan History Section */}
          <div className="scan-history-section">
            <div className="scan-history-header">
              <h3 className="scan-history-title">
                <span>📱</span>
                Scan History
              </h3>
            </div>
            <div className="scan-history-content">
              {loading ? (
                <div className="loading-state">
                  <div className="loading-spinner"></div>
                  <p className="loading-text">Loading scan history...</p>
                </div>
              ) : error ? (
                <div className="error-state">
                  <div className="error-state-icon">⚠️</div>
                  <h4 className="error-state-title">Unable to Load Scan History</h4>
                  <p className="error-state-description">{error}</p>
                </div>
              ) : scanHistory.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">📱</div>
                  <h4 className="empty-state-title">No Scans Yet</h4>
                  <p className="empty-state-description">
                    This customer hasn't made any scans for this reward program yet.
                  </p>
                </div>
              ) : (
                <table className="scan-history-table">
                  <thead>
                    <tr>
                      <th>Date & Time</th>
                      <th>Stamps Added</th>
                      <th>Progress (Before → After)</th>
                      <th>Scanned By</th>
                      <th>Store</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scanHistory.map((scan, index) => (
                      <tr key={scan.id || index}>
                        <td>
                          <div className="scan-date">
                            <div className="date-primary">
                              {new Date(scan.created_at).toLocaleDateString()}
                            </div>
                            <div className="date-secondary">
                              {new Date(scan.created_at).toLocaleTimeString()}
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="stamps-badge">
                            +{scan.stamps_added || 1}
                          </span>
                        </td>
                        <td>
                          <div className="progress-change">
                            <span className="progress-before">{scan.stamps_before_scan || 0}</span>
                            <span className="progress-arrow">→</span>
                            <span className="progress-after">{scan.stamps_after_scan || 0}</span>
                          </div>
                        </td>
                        <td>
                          <div className="staff-info">
                            {scan.scanned_by_name ? (
                              <>
                                <div className="staff-name">{scan.scanned_by_name}</div>
                                <div className="staff-role">{scan.staff_role || 'Staff'}</div>
                              </>
                            ) : (
                              <span className="no-staff">Self-scan</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className="store-name">
                            {scan.store_name || "Diamond Store"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressDetailsModal;
