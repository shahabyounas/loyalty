import React, { useState, useEffect } from "react";
import { stampTransactionAPI } from "../../utils/api";
import "./StampTransactions.css";

const StampTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    store: "",
    dateFrom: "",
    dateTo: "",
    transactionType: "",
  });

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const response = await stampTransactionAPI.getAllTransactions();
      setTransactions(response.data || []);
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
      setError("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getTransactionTypeIcon = (type) => {
    switch (type) {
      case "stamp_added":
        return "➕";
      case "stamp_removed":
        return "➖";
      case "reward_redeemed":
        return "🎉";
      default:
        return "📝";
    }
  };

  const getTransactionTypeLabel = (type) => {
    switch (type) {
      case "stamp_added":
        return "Stamp Added";
      case "stamp_removed":
        return "Stamp Removed";
      case "reward_redeemed":
        return "Reward Redeemed";
      default:
        return type;
    }
  };

  const filteredTransactions = transactions.filter((transaction) => {
    if (filters.store && transaction.store_id !== filters.store) return false;
    if (
      filters.transactionType &&
      transaction.transaction_type !== filters.transactionType
    )
      return false;

    if (filters.dateFrom || filters.dateTo) {
      const transactionDate = new Date(transaction.created_at);
      if (filters.dateFrom && transactionDate < new Date(filters.dateFrom))
        return false;
      if (filters.dateTo && transactionDate > new Date(filters.dateTo))
        return false;
    }

    return true;
  });

  const clearFilters = () => {
    setFilters({
      store: "",
      dateFrom: "",
      dateTo: "",
      transactionType: "",
    });
  };

  if (loading) {
    return (
      <div className="stamp-transactions-container">
        <div className="stamp-transactions-loading">
          <div className="stamp-transactions-spinner"></div>
          <p>Loading transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="stamp-transactions-container">
      <div className="stamp-transactions-header">
        <h2 className="stamp-transactions-title">
          <span className="stamp-transactions-icon">📊</span>
          Stamp Transaction History
        </h2>
        <p className="stamp-transactions-subtitle">
          Complete audit trail of all stamp transactions across all stores
        </p>
      </div>

      {/* Filters */}
      <div className="stamp-transactions-filters">
        <div className="stamp-transactions-filter-group">
          <label className="stamp-transactions-filter-label">Store:</label>
          <select
            className="stamp-transactions-filter-select"
            value={filters.store}
            onChange={(e) => setFilters({ ...filters, store: e.target.value })}
          >
            <option value="">All Stores</option>
            <option value="1">Downtown Store</option>
            <option value="2">Mall Location</option>
            <option value="3">Airport Store</option>
            <option value="4">Suburban Branch</option>
          </select>
        </div>

        <div className="stamp-transactions-filter-group">
          <label className="stamp-transactions-filter-label">
            Transaction Type:
          </label>
          <select
            className="stamp-transactions-filter-select"
            value={filters.transactionType}
            onChange={(e) =>
              setFilters({ ...filters, transactionType: e.target.value })
            }
          >
            <option value="">All Types</option>
            <option value="stamp_added">Stamp Added</option>
            <option value="stamp_removed">Stamp Removed</option>
            <option value="reward_redeemed">Reward Redeemed</option>
          </select>
        </div>

        <div className="stamp-transactions-filter-group">
          <label className="stamp-transactions-filter-label">Date From:</label>
          <input
            type="date"
            className="stamp-transactions-filter-input"
            value={filters.dateFrom}
            onChange={(e) =>
              setFilters({ ...filters, dateFrom: e.target.value })
            }
          />
        </div>

        <div className="stamp-transactions-filter-group">
          <label className="stamp-transactions-filter-label">Date To:</label>
          <input
            type="date"
            className="stamp-transactions-filter-input"
            value={filters.dateTo}
            onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
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
            {filteredTransactions.length}
          </div>
          <div className="stamp-transactions-stat-label">
            Total Transactions
          </div>
        </div>
        <div className="stamp-transactions-stat">
          <div className="stamp-transactions-stat-value">
            {
              filteredTransactions.filter(
                (t) => t.transaction_type === "stamp_added"
              ).length
            }
          </div>
          <div className="stamp-transactions-stat-label">Stamps Added</div>
        </div>
        <div className="stamp-transactions-stat">
          <div className="stamp-transactions-stat-value">
            {
              filteredTransactions.filter(
                (t) => t.transaction_type === "reward_redeemed"
              ).length
            }
          </div>
          <div className="stamp-transactions-stat-label">Rewards Redeemed</div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="stamp-transactions-table-container">
        {error && (
          <div className="stamp-transactions-error">
            <span className="stamp-transactions-error-icon">⚠️</span>
            {error}
          </div>
        )}

        {filteredTransactions.length === 0 ? (
          <div className="stamp-transactions-empty">
            <div className="stamp-transactions-empty-icon">📭</div>
            <h3>No transactions found</h3>
            <p>Try adjusting your filters or check back later</p>
          </div>
        ) : (
          <div className="stamp-transactions-table">
            <div className="stamp-transactions-table-header">
              <div className="stamp-transactions-table-cell">Type</div>
              <div className="stamp-transactions-table-cell">Customer</div>
              <div className="stamp-transactions-table-cell">Reward</div>
              <div className="stamp-transactions-table-cell">Staff Member</div>
              <div className="stamp-transactions-table-cell">Store</div>
              <div className="stamp-transactions-table-cell">Stamps</div>
              <div className="stamp-transactions-table-cell">Date & Time</div>
              <div className="stamp-transactions-table-cell">
                Transaction ID
              </div>
            </div>

            <div className="stamp-transactions-table-body">
              {filteredTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="stamp-transactions-table-row"
                >
                  <div className="stamp-transactions-table-cell">
                    <div className="stamp-transactions-type">
                      <span className="stamp-transactions-type-icon">
                        {getTransactionTypeIcon(transaction.transaction_type)}
                      </span>
                      <span className="stamp-transactions-type-label">
                        {getTransactionTypeLabel(transaction.transaction_type)}
                      </span>
                    </div>
                  </div>

                  <div className="stamp-transactions-table-cell">
                    <div className="stamp-transactions-customer">
                      <div className="stamp-transactions-customer-name">
                        {transaction.customer_name || "Unknown"}
                      </div>
                      <div className="stamp-transactions-customer-id">
                        ID: {transaction.user_id}
                      </div>
                    </div>
                  </div>

                  <div className="stamp-transactions-table-cell">
                    <div className="stamp-transactions-reward">
                      <div className="stamp-transactions-reward-name">
                        {transaction.reward_name || "Unknown"}
                      </div>
                      <div className="stamp-transactions-reward-id">
                        ID: {transaction.reward_id}
                      </div>
                    </div>
                  </div>

                  <div className="stamp-transactions-table-cell">
                    <div className="stamp-transactions-staff">
                      {transaction.scanned_by_name || "Unknown"}
                    </div>
                  </div>

                  <div className="stamp-transactions-table-cell">
                    <div className="stamp-transactions-store">
                      {transaction.store_name || "Unknown"}
                    </div>
                  </div>

                  <div className="stamp-transactions-table-cell">
                    <div className="stamp-transactions-stamps">
                      {transaction.stamps_added > 0
                        ? `+${transaction.stamps_added}`
                        : transaction.stamps_added}
                    </div>
                  </div>

                  <div className="stamp-transactions-table-cell">
                    <div className="stamp-transactions-date">
                      {formatDate(transaction.created_at)}
                    </div>
                  </div>

                  <div className="stamp-transactions-table-cell">
                    <div className="stamp-transactions-id">
                      {transaction.id}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Export Options */}
      <div className="stamp-transactions-export">
        <button className="stamp-transactions-export-btn">
          📊 Export to CSV
        </button>
        <button className="stamp-transactions-export-btn">
          📄 Export to PDF
        </button>
      </div>
    </div>
  );
};

export default StampTransactions;
