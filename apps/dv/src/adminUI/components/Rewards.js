import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { rewardAPI } from "../../utils/api";
import { apiErrorHandler } from "../../utils/api";
import "./Rewards.css";

const Rewards = () => {
  const { user, token } = useAuth();
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingReward, setEditingReward] = useState(null);
  const [deletingReward, setDeletingReward] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // DOM-driven refs for search and filters
  const searchInputRef = useRef(null);
  const typeSelectRef = useRef(null);
  const statusSelectRef = useRef(null);
  const lastFetchedRewardsRef = useRef([]);
  const searchDebounceRef = useRef(null);

  // Modal refs
  const createModalRef = useRef(null);
  const editModalRef = useRef(null);
  const deleteModalRef = useRef(null);
  const createFormRef = useRef(null);

  // Default expiry (5 years from now)
  const fiveYearsFromNow = (() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 5);
    return d.toISOString().slice(0, 10);
  })();

  // Helper function to format date for HTML date input
  const formatDateForInput = (dateString) => {
    if (!dateString) {
      return fiveYearsFromNow;
    }
    try {
      const date = new Date(dateString);
      const formatted = date.toISOString().slice(0, 10);
      return formatted;
    } catch (error) {
      console.error("Error formatting date:", error);
      return fiveYearsFromNow;
    }
  };

  const rewardTypes = [
    { value: "discount", label: "Discount" },
    { value: "free_item", label: "Free Item" },
    { value: "cashback", label: "Cashback" },
  ];

  useEffect(() => {
    fetchRewards();
  }, []);

  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const dialog = createModalRef.current;
    if (!dialog) return;
    if (showCreateForm) {
      if (typeof dialog.showModal === "function") {
        try {
          dialog.showModal();
        } catch (_) {}
      }
      if (createFormRef.current) {
        createFormRef.current.reset();
      }
    } else if (dialog.open) {
      dialog.close();
    }
  }, [showCreateForm]);

  useEffect(() => {
    const dialog = editModalRef.current;
    if (!dialog) return;
    if (showEditForm) {
      if (typeof dialog.showModal === "function") {
        try {
          dialog.showModal();
        } catch (_) {}
      }
    } else if (dialog.open) {
      dialog.close();
    }
  }, [showEditForm]);

  useEffect(() => {
    const dialog = deleteModalRef.current;
    if (!dialog) return;
    if (showDeleteConfirm) {
      if (typeof dialog.showModal === "function") {
        try {
          dialog.showModal();
        } catch (_) {}
      }
    } else if (dialog.open) {
      dialog.close();
    }
  }, [showDeleteConfirm]);

  const applyFilters = (list) => {
    let result = Array.isArray(list) ? [...list] : [];
    const term = (searchInputRef.current?.value || "").trim().toLowerCase();
    const typeFilter = typeSelectRef.current?.value || "all";
    const statusFilter = statusSelectRef.current?.value || "all";

    if (term) {
      result = result.filter(
        (reward) =>
          reward.name.toLowerCase().includes(term) ||
          reward.description.toLowerCase().includes(term)
      );
    }

    if (typeFilter !== "all") {
      result = result.filter((reward) => reward.type === typeFilter);
    }

    if (statusFilter !== "all") {
      const isActive = statusFilter === "active";
      result = result.filter((reward) => reward.is_active === isActive);
    }

    return result;
  };

  const fetchRewards = async () => {
    try {
      const response = await rewardAPI.getAllRewards({
        page: currentPage,
        limit: 10,
        search: searchInputRef.current?.value || "",
        type:
          (typeSelectRef.current?.value || "all") !== "all"
            ? typeSelectRef.current?.value
            : "",
        status:
          (statusSelectRef.current?.value || "all") !== "all"
            ? statusSelectRef.current?.value
            : "",
      });
      lastFetchedRewardsRef.current = Array.isArray(response.data)
        ? response.data
        : [];
      setRewards(applyFilters(lastFetchedRewardsRef.current));
    } catch (error) {
      console.error("Error fetching rewards:", error);
      alert(apiErrorHandler.handleError(error));

      // Set mock data for development
      const mockRewards = [
        {
          id: -1, // Use negative IDs for mock data
          name: "Free Coffee",
          description: "Get a free coffee with any purchase",
          type: "free_item",
          value: "1",
          points_required: 100,
          is_active: true,
          expiry_date: "2024-12-31",
          created_at: "2024-01-15",
        },
        {
          id: -2, // Use negative IDs for mock data
          name: "20% Off",
          description: "20% discount on all items",
          type: "discount",
          value: "20",
          points_required: 200,
          is_active: true,
          expiry_date: "2024-11-30",
          created_at: "2024-01-10",
        },
        {
          id: -3, // Use negative IDs for mock data
          name: "Double Points",
          description: "Earn double points on your next purchase",
          type: "points",
          value: "2x",
          points_required: 50,
          is_active: false,
          expiry_date: "2024-10-15",
          created_at: "2024-01-05",
        },
      ];
      lastFetchedRewardsRef.current = mockRewards;
      setRewards(applyFilters(lastFetchedRewardsRef.current));
    } finally {
      setLoading(false);
    }
  };

  const handleFiltersChange = () => {
    // Re-fetch to respect server search/type/status, then apply client filters
    fetchRewards();
  };

  const handleSearchInput = () => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    searchDebounceRef.current = setTimeout(() => {
      fetchRewards();
    }, 300);
  };

  const openCreateModal = () => {
    setShowCreateForm(true);
  };

  const closeCreateModal = () => {
    setShowCreateForm(false);
  };

  const openEditModal = (reward) => {
    setEditingReward(reward);
    setShowEditForm(true);
  };

  const closeEditModal = () => {
    setShowEditForm(false);
    setEditingReward(null);
  };

  const openDeleteModal = (reward) => {
    setDeletingReward(reward);
    setShowDeleteConfirm(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteConfirm(false);
    setDeletingReward(null);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = Object.fromEntries(fd.entries());

    // Minimal validation for visibility and correctness
    if (!data.name) {
      alert("Reward name is required.");
      return;
    }
    if (!data.description) {
      alert("Description is required.");
      return;
    }
    if (!data.type) {
      alert("Type is required.");
      return;
    }
    if (!data.value) {
      alert("Value is required.");
      return;
    }
    if (!data.points_required) {
      alert("Stamps required is required.");
      return;
    }
    if (!data.expiry_date) {
      alert("Expiry date is required.");
      return;
    }

    const submitBtn = e.nativeEvent && e.nativeEvent.submitter;
    const originalText = submitBtn ? submitBtn.textContent : null;
    if (submitBtn) submitBtn.disabled = true;
    if (submitBtn) submitBtn.textContent = "Creating...";

    try {
      // Convert value to proper discount fields based on reward type
      const rewardData = {
        name: data.name,
        description: data.description,
        type: data.type,
        points_required: parseInt(data.points_required),
        is_active: data.is_active === "true",
        expiry_date: data.expiry_date,
      };

      // Parse the value based on reward type
      const value = parseFloat(data.value);

      switch (data.type) {
        case "discount":
          rewardData.discount_percentage = value;
          console.log("Discount reward data:", rewardData);
          break;
        case "free_item":
          // No monetary value needed for free items
          console.log("Free item reward data:", rewardData);
          break;
        case "cashback":
          rewardData.discount_amount = value;
          console.log("Cashback reward data:", rewardData);
          break;
      }

      console.log("Final reward payload:", rewardData);
      await rewardAPI.createReward(rewardData);
      // Refresh list
      await fetchRewards();
      // Close and reset form
      closeCreateModal();
    } catch (error) {
      alert(apiErrorHandler.handleError(error));
    } finally {
      if (submitBtn) submitBtn.disabled = false;
      if (submitBtn && originalText != null)
        submitBtn.textContent = originalText;
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingReward) return;
    const fd = new FormData(e.currentTarget);
    const data = Object.fromEntries(fd.entries());

    if (!data.name) {
      alert("Reward name is required.");
      return;
    }
    if (!data.description) {
      alert("Description is required.");
      return;
    }
    if (!data.type) {
      alert("Type is required.");
      return;
    }
    if (!data.value) {
      alert("Value is required.");
      return;
    }
    if (!data.points_required) {
      alert("Stamps required is required.");
      return;
    }
    if (!data.expiry_date) {
      alert("Expiry date is required.");
      return;
    }

    const submitBtn = e.nativeEvent && e.nativeEvent.submitter;
    const originalText = submitBtn ? submitBtn.textContent : null;
    if (submitBtn) submitBtn.disabled = true;
    if (submitBtn) submitBtn.textContent = "Saving...";

    try {
      console.log("Updating reward with ID:", editingReward.id);

      // Check if this is mock data (negative ID)
      if (editingReward.id < 0) {
        alert(
          "Cannot update mock data. Please ensure the server is running and try again."
        );
        return;
      }

      // Convert value to proper discount fields based on reward type
      const rewardData = {
        name: data.name,
        description: data.description,
        type: data.type,
        points_required: parseInt(data.points_required),
        is_active: data.is_active === "true",
        expiry_date: data.expiry_date,
      };

      // Parse the value based on reward type
      const value = parseFloat(data.value);

      switch (data.type) {
        case "discount":
          rewardData.discount_percentage = value;
          console.log("Discount update data:", rewardData);
          break;
        case "free_item":
          // No monetary value needed for free items
          console.log("Free item update data:", rewardData);
          break;
        case "cashback":
          rewardData.discount_amount = value;
          console.log("Cashback update data:", rewardData);
          break;
      }

      console.log("Final update payload:", rewardData);

      await rewardAPI.updateReward(editingReward.id, rewardData);
      await fetchRewards();
      closeEditModal();
    } catch (error) {
      console.error("Update error:", error);
      alert(apiErrorHandler.handleError(error));
    } finally {
      if (submitBtn) submitBtn.disabled = false;
      if (submitBtn && originalText != null)
        submitBtn.textContent = originalText;
    }
  };

  const handleDeleteConfirm = async (e) => {
    if (!deletingReward) return;
    const btn = e.currentTarget;
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = "Deleting...";
    try {
      await rewardAPI.deleteReward(deletingReward.id);
      await fetchRewards();
      closeDeleteModal();
    } catch (error) {
      alert(apiErrorHandler.handleError(error));
    } finally {
      btn.disabled = false;
      btn.textContent = originalText;
    }
  };

  const getTypeBadgeColor = (type) => {
    const colors = {
      discount: "bg-blue-100 text-blue-800",
      free_item: "bg-green-100 text-green-800",
      cashback: "bg-orange-100 text-orange-800",
    };
    return colors[type] || colors.discount;
  };

  const getTypeIcon = (type) => {
    const icons = {
      discount: "💰",
      free_item: "🎁",
      cashback: "💳",
    };
    return icons[type] || "🎁";
  };

  if (loading) {
    return (
      <div className="rewards-loading">
        <div className="rewards-loading-spinner"></div>
        <p>Loading rewards...</p>
      </div>
    );
  }

  return (
    <div className="rewards">
      {/* Header with search, filter, and create button */}
      <div className="rewards-search-filter-section">
        <input
          type="text"
          placeholder="Search rewards..."
          ref={searchInputRef}
          onInput={handleSearchInput}
          className="rewards-search-input"
        />
        <select
          ref={typeSelectRef}
          defaultValue="all"
          onChange={handleFiltersChange}
          className="rewards-filter-select"
        >
          <option value="all">All Types</option>
          {rewardTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
        <select
          ref={statusSelectRef}
          defaultValue="all"
          onChange={handleFiltersChange}
          className="rewards-filter-select"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        <button className="rewards-create-btn" onClick={openCreateModal}>
          Create Reward
        </button>
      </div>

      {/* Create Reward Modal */}
      {showCreateForm && (
        <dialog
          ref={createModalRef}
          className="rewards-modal create-reward-modal"
          onCancel={closeCreateModal}
          onClose={closeCreateModal}
          onClick={(e) => {
            if (e.target === createModalRef.current) closeCreateModal();
          }}
          aria-label="Create reward dialog"
        >
          <div className="rewards-panel-header">
            <h3 className="rewards-panel-title">Create Reward</h3>
            <button
              type="button"
              className="rewards-panel-close"
              onClick={closeCreateModal}
              aria-label="Close create reward form"
            >
              ✕
            </button>
          </div>
          <form
            className="rewards-form"
            ref={createFormRef}
            onSubmit={handleCreateSubmit}
            autoComplete="off"
          >
            <div className="rewards-form-grid">
              <div className="rewards-form-field">
                <label className="rewards-form-label" htmlFor="rewardName">
                  Reward Name
                </label>
                <input
                  id="rewardName"
                  name="name"
                  type="text"
                  className="rewards-form-input"
                  autoComplete="off"
                  required
                />
              </div>
              <div className="rewards-form-field">
                <label
                  className="rewards-form-label"
                  htmlFor="rewardDescription"
                >
                  Description
                </label>
                <textarea
                  id="rewardDescription"
                  name="description"
                  className="rewards-form-textarea"
                  autoComplete="off"
                  rows="3"
                  required
                />
              </div>
              <div className="rewards-form-field">
                <label className="rewards-form-label" htmlFor="rewardType">
                  Type
                </label>
                <select
                  id="rewardType"
                  name="type"
                  className="rewards-form-select"
                  autoComplete="off"
                  required
                >
                  <option value="">Select Type</option>
                  {rewardTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="rewards-form-field">
                <label className="rewards-form-label" htmlFor="rewardStamps">
                  Stamps Required
                </label>
                <input
                  id="rewardStamps"
                  name="points_required"
                  type="number"
                  className="rewards-form-input"
                  autoComplete="off"
                  min="0"
                  placeholder="e.g., 10"
                  required
                />
              </div>
              <div className="rewards-form-field">
                <label className="rewards-form-label" htmlFor="rewardValue">
                  Value
                </label>
                <input
                  id="rewardValue"
                  name="value"
                  type="text"
                  className="rewards-form-input"
                  autoComplete="off"
                  placeholder="e.g., 20, 1, 2x"
                  required
                />
              </div>
              <div className="rewards-form-field">
                <label className="rewards-form-label" htmlFor="rewardStatus">
                  Status
                </label>
                <select
                  id="rewardStatus"
                  name="is_active"
                  className="rewards-form-select"
                  autoComplete="off"
                  defaultValue="true"
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
              <div className="rewards-form-field">
                <label className="rewards-form-label" htmlFor="rewardExpiry">
                  Expiry Date
                </label>
                <input
                  id="rewardExpiry"
                  name="expiry_date"
                  type="date"
                  className="rewards-form-input"
                  autoComplete="off"
                  defaultValue={fiveYearsFromNow}
                  required
                />
              </div>
            </div>
            <div className="rewards-form-actions">
              <button
                type="button"
                className="rewards-button-secondary"
                onClick={closeCreateModal}
              >
                Cancel
              </button>
              <button type="submit" className="rewards-create-btn">
                Create Reward
              </button>
            </div>
          </form>
        </dialog>
      )}

      {/* Edit Reward Modal */}
      {showEditForm && (
        <dialog
          ref={editModalRef}
          className="rewards-modal edit-reward-modal"
          onCancel={closeEditModal}
          onClose={closeEditModal}
          onClick={(e) => {
            if (e.target === editModalRef.current) closeEditModal();
          }}
          aria-label="Edit reward dialog"
        >
          <div className="rewards-panel-header">
            <h3 className="rewards-panel-title">Edit Reward</h3>
            <button
              type="button"
              className="rewards-panel-close"
              onClick={closeEditModal}
              aria-label="Close edit reward form"
            >
              ✕
            </button>
          </div>
          <form className="rewards-form" onSubmit={handleEditSubmit}>
            <div className="rewards-form-grid">
              <div className="rewards-form-field">
                <label className="rewards-form-label" htmlFor="edit-rewardName">
                  Reward Name
                </label>
                <input
                  id="edit-rewardName"
                  name="name"
                  type="text"
                  className="rewards-form-input"
                  defaultValue={editingReward?.name || ""}
                  required
                />
              </div>
              <div className="rewards-form-field">
                <label
                  className="rewards-form-label"
                  htmlFor="edit-rewardDescription"
                >
                  Description
                </label>
                <textarea
                  id="edit-rewardDescription"
                  name="description"
                  className="rewards-form-textarea"
                  rows="3"
                  defaultValue={editingReward?.description || ""}
                  required
                />
              </div>
              <div className="rewards-form-field">
                <label className="rewards-form-label" htmlFor="edit-rewardType">
                  Type
                </label>
                <select
                  id="edit-rewardType"
                  name="type"
                  className="rewards-form-select"
                  defaultValue={editingReward?.type || ""}
                  required
                >
                  <option value="">Select Type</option>
                  {rewardTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="rewards-form-field">
                <label
                  className="rewards-form-label"
                  htmlFor="edit-rewardStamps"
                >
                  Stamps Required
                </label>
                <input
                  id="edit-rewardStamps"
                  name="points_required"
                  type="number"
                  className="rewards-form-input"
                  defaultValue={editingReward?.points_required || ""}
                  min="0"
                  required
                />
              </div>
              <div className="rewards-form-field">
                <label
                  className="rewards-form-label"
                  htmlFor="edit-rewardValue"
                >
                  Value
                </label>
                <input
                  id="edit-rewardValue"
                  name="value"
                  type="text"
                  className="rewards-form-input"
                  defaultValue={
                    editingReward?.type === "discount" &&
                    editingReward?.discount_percentage
                      ? editingReward.discount_percentage.toString()
                      : editingReward?.type === "cashback" &&
                        editingReward?.discount_amount
                      ? editingReward.discount_amount.toString()
                      : editingReward?.type === "free_item"
                      ? "Free"
                      : ""
                  }
                  placeholder="e.g., 20, 1, 2x"
                  required
                />
              </div>
              <div className="rewards-form-field">
                <label
                  className="rewards-form-label"
                  htmlFor="edit-rewardStatus"
                >
                  Status
                </label>
                <select
                  id="edit-rewardStatus"
                  name="is_active"
                  className="rewards-form-select"
                  defaultValue={editingReward?.is_active ? "true" : "false"}
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
              <div className="rewards-form-field">
                <label
                  className="rewards-form-label"
                  htmlFor="edit-rewardExpiry"
                >
                  Expiry Date
                </label>
                <input
                  id="edit-rewardExpiry"
                  name="expiry_date"
                  type="date"
                  className="rewards-form-input"
                  defaultValue={formatDateForInput(editingReward?.expiry_date)}
                  required
                />
              </div>
            </div>
            <div className="rewards-form-actions">
              <button
                type="button"
                className="rewards-button-secondary"
                onClick={closeEditModal}
              >
                Cancel
              </button>
              <button type="submit" className="rewards-create-btn">
                Save Changes
              </button>
            </div>
          </form>
        </dialog>
      )}

      {/* Delete Reward Modal */}
      {showDeleteConfirm && (
        <dialog
          ref={deleteModalRef}
          className="rewards-modal delete-reward-modal"
          onCancel={closeDeleteModal}
          onClose={closeDeleteModal}
          onClick={(e) => {
            if (e.target === deleteModalRef.current) closeDeleteModal();
          }}
          aria-label="Delete reward confirmation dialog"
        >
          <div className="rewards-panel-header">
            <h3 className="rewards-panel-title">Delete Reward</h3>
            <button
              type="button"
              className="rewards-panel-close"
              onClick={closeDeleteModal}
              aria-label="Close delete confirmation"
            >
              ✕
            </button>
          </div>
          <div className="rewards-form" role="document">
            <p className="rewards-confirm-text">
              Are you sure you want to delete this reward
              {deletingReward
                ? `: ${deletingReward.name} (${deletingReward.type})`
                : ""}
              ?
            </p>
            <div className="rewards-form-actions">
              <button
                type="button"
                className="rewards-button-secondary"
                onClick={closeDeleteModal}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rewards-button-danger"
                onClick={handleDeleteConfirm}
              >
                Delete
              </button>
            </div>
          </div>
        </dialog>
      )}

      {/* Rewards Grid */}
      <div className="rewards-grid">
        {rewards.map((reward) => (
          <div key={reward.id} className="rewards-reward-card">
            <div className="rewards-reward-header">
              <div className="rewards-reward-icon">
                {getTypeIcon(reward.type)}
              </div>
              <div className="rewards-reward-info">
                <h3 className="rewards-reward-name">{reward.name}</h3>
                <p className="rewards-reward-description">
                  {reward.description}
                </p>
              </div>
              <div className="rewards-reward-actions">
                <button
                  className="rewards-action-btn edit"
                  onClick={() => openEditModal(reward)}
                  title="Edit reward"
                >
                  ✏️
                </button>
                <button
                  className="rewards-action-btn delete"
                  onClick={() => openDeleteModal(reward)}
                  title="Delete reward"
                >
                  🗑️
                </button>
              </div>
            </div>

            <div className="rewards-reward-details">
              <div className="rewards-reward-type">
                <span
                  className={`rewards-type-badge ${getTypeBadgeColor(
                    reward.type
                  )}`}
                >
                  {reward.type.replace("_", " ")}
                </span>
              </div>

              <div className="rewards-reward-value">
                <span className="rewards-value-label">Value:</span>
                <span className="rewards-value-amount">
                  {reward.type === "discount" &&
                  reward.discount_percentage !== null &&
                  reward.discount_percentage !== undefined
                    ? `${reward.discount_percentage}%`
                    : reward.type === "free_item"
                    ? "Free"
                    : reward.type === "cashback" &&
                      reward.discount_amount !== null &&
                      reward.discount_amount !== undefined
                    ? `£${reward.discount_amount}`
                    : reward.type === "discount" &&
                      reward.discount_percentage === 0
                    ? "0%"
                    : "N/A"}
                </span>
              </div>

              <div className="rewards-reward-points">
                <span className="rewards-points-label">Stamps Required:</span>
                <span className="rewards-points-amount">
                  {reward.points_required}
                </span>
              </div>

              <div className="rewards-reward-status">
                <span
                  className={`rewards-status-badge ${
                    reward.is_active ? "active" : "inactive"
                  }`}
                >
                  {reward.is_active ? "Active" : "Inactive"}
                </span>
              </div>

              <div className="rewards-reward-expiry">
                <span className="rewards-expiry-label">Expires:</span>
                <span className="rewards-expiry-date">
                  {new Date(reward.expiry_date).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        ))}

        {rewards.length === 0 && (
          <div className="rewards-no-rewards">
            <div className="rewards-no-rewards-icon">🎁</div>
            <p>No rewards found</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="pagination-btn"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            ← Previous
          </button>

          <div className="page-numbers">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                className={`page-btn ${currentPage === page ? "active" : ""}`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ))}
          </div>

          <button
            className="pagination-btn"
            onClick={() =>
              setCurrentPage((prev) => Math.min(totalPages, prev + 1))
            }
            disabled={currentPage === totalPages}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
};

export default Rewards;
