import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { storeAPI } from "../../utils/api";
import { apiErrorHandler } from "../../utils/api";
import "./Stores.css";

const Stores = () => {
  const { user, token } = useAuth();
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingStore, setEditingStore] = useState(null);
  const [deletingStore, setDeletingStore] = useState(null);

  // DOM-driven refs for search and filters
  const searchInputRef = useRef(null);
  const citySelectRef = useRef(null);
  const statusSelectRef = useRef(null);
  const lastFetchedStoresRef = useRef([]);
  const searchDebounceRef = useRef(null);

  // Modal refs
  const createModalRef = useRef(null);
  const editModalRef = useRef(null);
  const deleteModalRef = useRef(null);
  const createFormRef = useRef(null);

  const cities = [
    { value: "London", label: "London" },
    { value: "Manchester", label: "Manchester" },
    { value: "Birmingham", label: "Birmingham" },
    { value: "Liverpool", label: "Liverpool" },
    { value: "Leeds", label: "Leeds" },
    { value: "Sheffield", label: "Sheffield" },
    { value: "Edinburgh", label: "Edinburgh" },
    { value: "Glasgow", label: "Glasgow" },
  ];

  useEffect(() => {
    fetchStores();
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
    if (term) {
      result = result.filter((s) => {
        const name = (s.name || "").toLowerCase();
        const address = (s.address || "").toLowerCase();
        const city = (s.city || "").toLowerCase();
        return (
          name.includes(term) || address.includes(term) || city.includes(term)
        );
      });
    }
    const currentCity = (citySelectRef.current?.value || "all").toLowerCase();
    if (currentCity !== "all") {
      result = result.filter(
        (s) => (s.city || "").toLowerCase() === currentCity
      );
    }
    const currentStatus = (
      statusSelectRef.current?.value || "all"
    ).toLowerCase();
    if (currentStatus !== "all") {
      const wantActive = currentStatus === "active";
      result = result.filter((s) => Boolean(s.is_active) === wantActive);
    }
    return result;
  };

  const fetchStores = async () => {
    try {
      const response = await storeAPI.getAllStores({
        search: searchInputRef.current?.value || "",
        city:
          (citySelectRef.current?.value || "all") !== "all"
            ? citySelectRef.current?.value
            : "",
      });

      lastFetchedStoresRef.current = Array.isArray(response.stores)
        ? response.stores
        : [];
      setStores(applyFilters(lastFetchedStoresRef.current));
    } catch (error) {
      console.error("Error fetching stores:", error);
      alert(apiErrorHandler.handleError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleFiltersChange = () => {
    fetchStores();
  };

  const handleSearchInput = () => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    searchDebounceRef.current = setTimeout(() => {
      fetchStores();
    }, 300);
  };

  const openCreateModal = () => {
    setShowEditForm(false);
    setShowDeleteConfirm(false);
    setShowCreateForm(true);
  };

  const closeCreateModal = () => {
    setShowCreateForm(false);
  };

  const openEditModal = (store) => {
    setEditingStore(store);
    setShowEditForm(true);
  };

  const closeEditModal = () => {
    setShowEditForm(false);
    setEditingStore(null);
  };

  const openDeleteModal = (store) => {
    setDeletingStore(store);
    setShowDeleteConfirm(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteConfirm(false);
    setDeletingStore(null);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = Object.fromEntries(fd.entries());

    if (!data.name) {
      alert("Store name is required.");
      return;
    }

    const submitBtn = e.nativeEvent && e.nativeEvent.submitter;
    const originalText = submitBtn ? submitBtn.textContent : null;
    if (submitBtn) submitBtn.disabled = true;
    if (submitBtn) submitBtn.textContent = "Creating...";

    try {
      await storeAPI.createStore({
        name: data.name,
        address: data.address,
        city: data.city,
        country: data.country || "UK",
        postal_code: data.postal_code,
        phone: data.phone,
        email: data.email,
        is_active: data.is_active === "true",
      });

      await fetchStores();
      closeCreateModal();
    } catch (error) {
      console.error("Error creating store:", error);
      alert(apiErrorHandler.handleError(error));
    } finally {
      if (submitBtn) submitBtn.disabled = false;
      if (submitBtn && originalText != null)
        submitBtn.textContent = originalText;
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingStore) return;

    const fd = new FormData(e.currentTarget);
    const data = Object.fromEntries(fd.entries());

    if (!data.name) {
      alert("Store name is required.");
      return;
    }

    const submitBtn = e.nativeEvent && e.nativeEvent.submitter;
    const originalText = submitBtn ? submitBtn.textContent : null;
    if (submitBtn) submitBtn.disabled = true;
    if (submitBtn) submitBtn.textContent = "Saving...";

    try {
      await storeAPI.updateStore(editingStore.id, {
        name: data.name,
        address: data.address,
        city: data.city,
        country: data.country,
        postal_code: data.postal_code,
        phone: data.phone,
        email: data.email,
        is_active: data.is_active === "true",
      });

      await fetchStores();
      closeEditModal();
    } catch (error) {
      console.error("Error updating store:", error);
      alert(apiErrorHandler.handleError(error));
    } finally {
      if (submitBtn) submitBtn.disabled = false;
      if (submitBtn && originalText != null)
        submitBtn.textContent = originalText;
    }
  };

  const handleDeleteConfirm = async (e) => {
    if (!deletingStore) return;

    const btn = e.currentTarget;
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = "Deleting...";

    try {
      await storeAPI.deleteStore(deletingStore.id);
      await fetchStores();
      closeDeleteModal();
    } catch (error) {
      console.error("Error deleting store:", error);
      alert(apiErrorHandler.handleError(error));
    } finally {
      btn.disabled = false;
      btn.textContent = originalText;
    }
  };

  const getStatusBadgeColor = (isActive) => {
    return isActive ? "active" : "inactive";
  };

  if (loading) {
    return (
      <div className="stores-loading">
        <div className="stores-loading-spinner"></div>
        <p>Loading stores...</p>
      </div>
    );
  }

  return (
    <div className="stores">
      {/* Header with search, filter, and create button */}
      <div className="stores-search-filter-section">
        <input
          type="text"
          placeholder="Search stores..."
          ref={searchInputRef}
          onInput={handleSearchInput}
          className="stores-search-input"
        />
        <select
          ref={citySelectRef}
          defaultValue="all"
          onChange={handleFiltersChange}
          className="stores-filter-select"
        >
          <option value="all">All Cities</option>
          {cities.map((city) => (
            <option key={city.value} value={city.value}>
              {city.label}
            </option>
          ))}
        </select>
        <select
          ref={statusSelectRef}
          defaultValue="all"
          onChange={handleFiltersChange}
          className="stores-filter-select"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <button className="stores-create-btn" onClick={openCreateModal}>
          Create Store
        </button>
      </div>

      {/* Create Store Modal */}
      {showCreateForm && (
        <dialog
          ref={createModalRef}
          className="stores-modal create-store-modal"
          onCancel={closeCreateModal}
          onClose={closeCreateModal}
          onClick={(e) => {
            if (e.target === createModalRef.current) closeCreateModal();
          }}
          aria-label="Create store dialog"
        >
          <div className="stores-panel-header">
            <h3 className="stores-panel-title">Create Store</h3>
            <button
              type="button"
              className="stores-panel-close"
              onClick={closeCreateModal}
              aria-label="Close create store form"
            >
              ✕
            </button>
          </div>
          <form
            className="stores-form"
            ref={createFormRef}
            onSubmit={handleCreateSubmit}
            autoComplete="off"
          >
            <div className="stores-form-grid">
              <div className="stores-form-field">
                <label className="stores-form-label" htmlFor="storeName">
                  Store Name
                </label>
                <input
                  id="storeName"
                  name="name"
                  type="text"
                  className="stores-form-input"
                  autoComplete="off"
                  required
                />
              </div>
              <div className="stores-form-field">
                <label className="stores-form-label" htmlFor="storeAddress">
                  Address
                </label>
                <textarea
                  id="storeAddress"
                  name="address"
                  className="stores-form-textarea"
                  autoComplete="off"
                  rows="3"
                />
              </div>
              <div className="stores-form-field">
                <label className="stores-form-label" htmlFor="storeCity">
                  City
                </label>
                <select
                  id="storeCity"
                  name="city"
                  className="stores-form-select"
                  autoComplete="off"
                >
                  <option value="">Select City</option>
                  {cities.map((city) => (
                    <option key={city.value} value={city.value}>
                      {city.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="stores-form-field">
                <label className="stores-form-label" htmlFor="storeCountry">
                  Country
                </label>
                <select
                  id="storeCountry"
                  name="country"
                  className="stores-form-select"
                  autoComplete="off"
                  defaultValue="UK"
                >
                  <option value="UK">United Kingdom</option>
                  <option value="US">United States</option>
                  <option value="CA">Canada</option>
                  <option value="AU">Australia</option>
                </select>
              </div>
              <div className="stores-form-field">
                <label className="stores-form-label" htmlFor="storePostalCode">
                  Postal Code
                </label>
                <input
                  id="storePostalCode"
                  name="postal_code"
                  type="text"
                  className="stores-form-input"
                  autoComplete="off"
                />
              </div>
              <div className="stores-form-field">
                <label className="stores-form-label" htmlFor="storePhone">
                  Phone
                </label>
                <input
                  id="storePhone"
                  name="phone"
                  type="tel"
                  className="stores-form-input"
                  autoComplete="off"
                />
              </div>
              <div className="stores-form-field">
                <label className="stores-form-label" htmlFor="storeEmail">
                  Email
                </label>
                <input
                  id="storeEmail"
                  name="email"
                  type="email"
                  className="stores-form-input"
                  autoComplete="off"
                />
              </div>
              <div className="stores-form-field">
                <label className="stores-form-label" htmlFor="storeStatus">
                  Status
                </label>
                <select
                  id="storeStatus"
                  name="is_active"
                  className="stores-form-select"
                  autoComplete="off"
                  defaultValue="true"
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
            </div>
            <div className="stores-form-actions">
              <button
                type="button"
                className="stores-button-secondary"
                onClick={closeCreateModal}
              >
                Cancel
              </button>
              <button type="submit" className="stores-create-btn">
                Create Store
              </button>
            </div>
          </form>
        </dialog>
      )}

      {/* Edit Store Modal */}
      {showEditForm && (
        <dialog
          ref={editModalRef}
          className="stores-modal edit-store-modal"
          onCancel={closeEditModal}
          onClose={closeEditModal}
          onClick={(e) => {
            if (e.target === editModalRef.current) closeEditModal();
          }}
          aria-label="Edit store dialog"
        >
          <div className="stores-panel-header">
            <h3 className="stores-panel-title">Edit Store</h3>
            <button
              type="button"
              className="stores-panel-close"
              onClick={closeEditModal}
              aria-label="Close edit store form"
            >
              ✕
            </button>
          </div>
          <form className="stores-form" onSubmit={handleEditSubmit}>
            <div className="stores-form-grid">
              <div className="stores-form-field">
                <label className="stores-form-label" htmlFor="edit-storeName">
                  Store Name
                </label>
                <input
                  id="edit-storeName"
                  name="name"
                  type="text"
                  className="stores-form-input"
                  defaultValue={editingStore?.name || ""}
                  required
                />
              </div>
              <div className="stores-form-field">
                <label
                  className="stores-form-label"
                  htmlFor="edit-storeAddress"
                >
                  Address
                </label>
                <textarea
                  id="edit-storeAddress"
                  name="address"
                  className="stores-form-textarea"
                  rows="3"
                  defaultValue={editingStore?.address || ""}
                />
              </div>
              <div className="stores-form-field">
                <label className="stores-form-label" htmlFor="edit-storeCity">
                  City
                </label>
                <select
                  id="edit-storeCity"
                  name="city"
                  className="stores-form-select"
                  defaultValue={editingStore?.city || ""}
                >
                  <option value="">Select City</option>
                  {cities.map((city) => (
                    <option key={city.value} value={city.value}>
                      {city.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="stores-form-field">
                <label
                  className="stores-form-label"
                  htmlFor="edit-storeCountry"
                >
                  Country
                </label>
                <select
                  id="edit-storeCountry"
                  name="country"
                  className="stores-form-select"
                  defaultValue={editingStore?.country || "UK"}
                >
                  <option value="UK">United Kingdom</option>
                  <option value="US">United States</option>
                  <option value="CA">Canada</option>
                  <option value="AU">Australia</option>
                </select>
              </div>
              <div className="stores-form-field">
                <label
                  className="stores-form-label"
                  htmlFor="edit-storePostalCode"
                >
                  Postal Code
                </label>
                <input
                  id="edit-storePostalCode"
                  name="postal_code"
                  type="text"
                  className="stores-form-input"
                  defaultValue={editingStore?.postal_code || ""}
                />
              </div>
              <div className="stores-form-field">
                <label className="stores-form-label" htmlFor="edit-storePhone">
                  Phone
                </label>
                <input
                  id="edit-storePhone"
                  name="phone"
                  type="tel"
                  className="stores-form-input"
                  defaultValue={editingStore?.phone || ""}
                />
              </div>
              <div className="stores-form-field">
                <label className="stores-form-label" htmlFor="edit-storeEmail">
                  Email
                </label>
                <input
                  id="edit-storeEmail"
                  name="email"
                  type="email"
                  className="stores-form-input"
                  defaultValue={editingStore?.email || ""}
                />
              </div>
              <div className="stores-form-field">
                <label className="stores-form-label" htmlFor="edit-storeStatus">
                  Status
                </label>
                <select
                  id="edit-storeStatus"
                  name="is_active"
                  className="stores-form-select"
                  defaultValue={editingStore?.is_active ? "true" : "false"}
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
            </div>
            <div className="stores-form-actions">
              <button
                type="button"
                className="stores-button-secondary"
                onClick={closeEditModal}
              >
                Cancel
              </button>
              <button type="submit" className="stores-create-btn">
                Save Changes
              </button>
            </div>
          </form>
        </dialog>
      )}

      {/* Delete Store Modal */}
      {showDeleteConfirm && (
        <dialog
          ref={deleteModalRef}
          className="stores-modal delete-store-modal"
          onCancel={closeDeleteModal}
          onClose={closeDeleteModal}
          onClick={(e) => {
            if (e.target === deleteModalRef.current) closeDeleteModal();
          }}
          aria-label="Delete store confirmation dialog"
        >
          <div className="stores-panel-header">
            <h3 className="stores-panel-title">Delete Store</h3>
            <button
              type="button"
              className="stores-panel-close"
              onClick={closeDeleteModal}
              aria-label="Close delete confirmation"
            >
              ✕
            </button>
          </div>
          <div className="stores-form" role="document">
            <p className="stores-confirm-text">
              Are you sure you want to delete this store
              {deletingStore
                ? `: ${deletingStore.name} (${deletingStore.city})`
                : ""}
              ?
            </p>
            <div className="stores-form-actions">
              <button
                type="button"
                className="stores-button-secondary"
                onClick={closeDeleteModal}
              >
                Cancel
              </button>
              <button
                type="button"
                className="stores-button-danger"
                onClick={handleDeleteConfirm}
              >
                Delete
              </button>
            </div>
          </div>
        </dialog>
      )}

      {/* Stores Table */}
      <div className="stores-table-container">
        <table className="stores-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Address</th>
              <th>City</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {stores.map((store) => (
              <tr key={store.id}>
                <td>
                  <div className="stores-store-info">
                    <div className="stores-store-name">{store.name}</div>
                  </div>
                </td>
                <td>{store.address || "--"}</td>
                <td>{store.city || "--"}</td>
                <td>{store.phone || "--"}</td>
                <td>{store.email || "--"}</td>
                <td>
                  <span
                    className={`stores-status-badge ${getStatusBadgeColor(
                      store.is_active
                    )}`}
                  >
                    {store.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td>
                  <div className="stores-actions">
                    <button
                      className="stores-action-btn edit"
                      title="Edit store"
                      onClick={() => openEditModal(store)}
                    >
                      ✏️
                    </button>
                    <button
                      className="stores-action-btn delete"
                      title="Delete store"
                      onClick={() => openDeleteModal(store)}
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {stores.length === 0 && (
          <div className="stores-no-stores">
            <p>No stores found</p>
          </div>
        )}
      </div>

      {/* Mobile Cards */}
      <div className="stores-mobile">
        {stores.map((store) => (
          <div key={store.id} className="stores-store-card">
            <div className="stores-store-card-header">
              <div className="stores-store-card-info">
                <div className="stores-store-card-details">
                  <div className="stores-store-card-name">{store.name}</div>
                  <div className="stores-store-card-address">
                    {store.address || "No address"}
                  </div>
                </div>
              </div>
              <div className="stores-store-card-actions">
                <button
                  className="stores-action-btn edit"
                  title="Edit store"
                  onClick={() => openEditModal(store)}
                >
                  ✏️
                </button>
                <button
                  className="stores-action-btn delete"
                  title="Delete store"
                  onClick={() => openDeleteModal(store)}
                >
                  🗑️
                </button>
              </div>
            </div>
            <div className="stores-store-card-content">
              <div className="stores-store-card-row">
                <span className="stores-store-card-label">City</span>
                <span className="stores-store-card-value">
                  {store.city || "No city"}
                </span>
              </div>
              <div className="stores-store-card-row">
                <span className="stores-store-card-label">Status</span>
                <span
                  className={`stores-status-badge ${getStatusBadgeColor(
                    store.is_active
                  )}`}
                >
                  {store.is_active ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="stores-store-card-row">
                <span className="stores-store-card-label">Phone</span>
                <span className="stores-store-card-value">
                  {store.phone || "No phone"}
                </span>
              </div>
              <div className="stores-store-card-row">
                <span className="stores-store-card-label">Email</span>
                <span className="stores-store-card-value">
                  {store.email || "No email"}
                </span>
              </div>
            </div>
          </div>
        ))}

        {stores.length === 0 && (
          <div className="stores-no-stores">
            <p>No stores found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Stores;
