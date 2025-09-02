import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { userAPI } from "../../utils/api";
import { apiErrorHandler } from "../../utils/api";
import PhoneInput from "../../shared/components/PhoneInput";
import "./Users.css";

const Users = () => {
  const { user, token } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const searchInputRef = useRef(null);
  const roleSelectRef = useRef(null);
  const statusSelectRef = useRef(null);
  const lastFetchedUsersRef = useRef([]);
  const searchDebounceRef = useRef(null);
  const createFormRef = useRef(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  // Removed creating/updating/deleting React state; using DOM-based pending state on buttons instead
  const modalRef = useRef(null);
  const editModalRef = useRef(null);
  const deleteModalRef = useRef(null);
  const [editingUser, setEditingUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);
  const [createFormPhone, setCreateFormPhone] = useState("");
  const [editFormPhone, setEditFormPhone] = useState("");

  const roles = [
    { value: "super_admin", label: "Super Admin" },
    { value: "admin", label: "Admin" },
    { value: "manager", label: "Manager" },
    { value: "staff", label: "Staff" },
    { value: "customer", label: "Customer" },
  ];

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const dialog = modalRef.current;
    if (!dialog) return;
    if (showCreateForm) {
      if (typeof dialog.showModal === "function") {
        try {
          dialog.showModal();
        } catch (_) {
          // If already open, ignore
        }
      }
      // Reset the create form to ensure empty fields
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
      result = result.filter((u) => {
        const name = `${u.firstName || ""} ${u.lastName || ""}`
          .trim()
          .toLowerCase();
        const email = (u.email || "").toLowerCase();
        const phone = (u.phone || "").toLowerCase();
        return (
          name.includes(term) || email.includes(term) || phone.includes(term)
        );
      });
    }
    const currentRole = (roleSelectRef.current?.value || "all").toLowerCase();
    if (currentRole !== "all") {
      const roleVal = currentRole;
      result = result.filter((u) => (u.role || "").toLowerCase() === roleVal);
    }
    const currentStatus = (
      statusSelectRef.current?.value || "all"
    ).toLowerCase();
    if (currentStatus !== "all") {
      const wantActive = currentStatus === "active";
      result = result.filter((u) => Boolean(u.isActive) === wantActive);
    }
    return result;
  };

  const fetchUsers = async () => {
    try {
      const response = await userAPI.getAllUsers({
        page: 1,
        limit: 10,
        search: searchInputRef.current?.value || "",
        role:
          (roleSelectRef.current?.value || "all") !== "all"
            ? roleSelectRef.current?.value
            : "",
      });
      console.log("Fetched users:", response.data);
      lastFetchedUsersRef.current = Array.isArray(response.data)
        ? response.data
        : [];
      setUsers(applyFilters(lastFetchedUsersRef.current));
    } catch (error) {
      console.error("Error fetching users:", error);
      alert(apiErrorHandler.handleError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleFiltersChange = () => {
    // Re-fetch to respect server search/role, then apply client filters
    fetchUsers();
  };

  const handleSearchInput = () => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    searchDebounceRef.current = setTimeout(() => {
      fetchUsers();
    }, 300);
  };

  const openCreateModal = () => {
    // Ensure other modals are closed
    setShowEditForm(false);
    setShowDeleteConfirm(false);
    setCreateFormPhone(""); // Reset phone input
    setShowCreateForm(true);
  };

  const closeCreateModal = () => {
    setShowCreateForm(false);
  };

  const openEditModal = (u) => {
    setEditingUser(u);
    setEditFormPhone(u.phone || ""); // Set phone value for editing
    setShowEditForm(true);
  };

  const closeEditModal = () => {
    setShowEditForm(false);
    setEditingUser(null);
  };

  const openDeleteModal = (u) => {
    setDeletingUser(u);
    setShowDeleteConfirm(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteConfirm(false);
    setDeletingUser(null);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = Object.fromEntries(fd.entries());
    // Minimal validation for visibility and correctness
    if (!data.firstName || !data.lastName) {
      alert("First name and last name are required.");
      return;
    }
    if (!data.email) {
      alert("Email is required.");
      return;
    }
    if (!createFormPhone || createFormPhone.trim() === "") {
      alert("Phone number is required.");
      return;
    }
    if (!data.password) {
      alert("Password is required.");
      return;
    }

    const submitBtn = e.nativeEvent && e.nativeEvent.submitter;
    const originalText = submitBtn ? submitBtn.textContent : null;
    if (submitBtn) submitBtn.disabled = true;
    if (submitBtn) submitBtn.textContent = "Creating...";
    try {
      await userAPI.createUser({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: createFormPhone,
        role: data.role || "customer",
        password: data.password,
      });
      // Refresh list
      await fetchUsers();
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
    if (!editingUser) return;
    const fd = new FormData(e.currentTarget);
    const data = Object.fromEntries(fd.entries());
    if (!data.firstName || !data.lastName) {
      alert("First name and last name are required.");
      return;
    }
    if (!editFormPhone || editFormPhone.trim() === "") {
      alert("Phone number is required.");
      return;
    }
    const submitBtn = e.nativeEvent && e.nativeEvent.submitter;
    const originalText = submitBtn ? submitBtn.textContent : null;
    if (submitBtn) submitBtn.disabled = true;
    if (submitBtn) submitBtn.textContent = "Saving...";
    try {
      await userAPI.updateUser(editingUser.id, {
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        phone: editFormPhone,
      });
      await fetchUsers();
      closeEditModal();
    } catch (error) {
      alert(apiErrorHandler.handleError(error));
    } finally {
      if (submitBtn) submitBtn.disabled = false;
      if (submitBtn && originalText != null)
        submitBtn.textContent = originalText;
    }
  };

  const handleDeleteConfirm = async (e) => {
    if (!deletingUser) return;
    const btn = e.currentTarget;
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = "Deleting...";
    try {
      await userAPI.deleteUser(deletingUser.id);
      await fetchUsers();
      closeDeleteModal();
    } catch (error) {
      alert(apiErrorHandler.handleError(error));
    } finally {
      btn.disabled = false;
      btn.textContent = originalText;
    }
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      super_admin: "bg-red-100 text-red-800",
      admin: "bg-purple-100 text-purple-800",
      manager: "bg-blue-100 text-blue-800",
      staff: "bg-green-100 text-green-800",
      customer: "bg-gray-100 text-gray-800",
    };
    return colors[role] || colors.customer;
  };

  if (loading) {
    return (
      <div className="users-loading">
        <div className="users-loading-spinner"></div>
        <p>Loading users...</p>
      </div>
    );
  }

  return (
    <div className="users">
      {/* Header with search, filter, and create button */}
      <div className="users-search-filter-section">
        <input
          type="text"
          placeholder="Search users..."
          ref={searchInputRef}
          onInput={handleSearchInput}
          className="users-search-input"
        />
        <select
          ref={roleSelectRef}
          defaultValue="all"
          onChange={handleFiltersChange}
          className="users-filter-select"
        >
          <option value="all">All Roles</option>
          {roles.map((role) => (
            <option key={role.value} value={role.value}>
              {role.label}
            </option>
          ))}
        </select>
        <select
          ref={statusSelectRef}
          defaultValue="all"
          onChange={handleFiltersChange}
          className="users-filter-select"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <button className="users-create-btn" onClick={openCreateModal}>
          Create User
        </button>
      </div>

      {showCreateForm && (
        <dialog
          ref={modalRef}
          className="users-modal create-user-modal"
          onCancel={closeCreateModal}
          onClose={closeCreateModal}
          onClick={(e) => {
            if (e.target === modalRef.current) closeCreateModal();
          }}
          aria-label="Create user dialog"
        >
          <div className="users-panel-header">
            <h3 className="users-panel-title">Create User</h3>
            <button
              type="button"
              className="users-panel-close"
              onClick={closeCreateModal}
              aria-label="Close create user form"
            >
              ✕
            </button>
          </div>
          <form
            className="users-form"
            ref={createFormRef}
            onSubmit={handleCreateSubmit}
            autoComplete="off"
          >
            <div className="users-form-grid">
              <div className="users-form-field">
                <label className="users-form-label" htmlFor="firstName">
                  First Name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  className="users-form-input"
                  autoComplete="off"
                  required
                />
              </div>
              <div className="users-form-field">
                <label className="users-form-label" htmlFor="lastName">
                  Last Name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  className="users-form-input"
                  autoComplete="off"
                  required
                />
              </div>
              <div className="users-form-field">
                <label className="users-form-label" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  className="users-form-input"
                  autoComplete="off"
                  required
                />
              </div>
              <div className="users-form-field">
                <PhoneInput
                  value={createFormPhone}
                  onChange={setCreateFormPhone}
                  required={true}
                />
              </div>
              <div className="users-form-field">
                <label className="users-form-label" htmlFor="role">
                  Role
                </label>
                <select
                  id="role"
                  name="role"
                  className="users-form-select"
                  autoComplete="off"
                  defaultValue="customer"
                >
                  {roles.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="users-form-field">
                <label className="users-form-label" htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  className="users-form-input"
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>
            <div className="users-form-actions">
              <button
                type="button"
                className="users-button-secondary"
                onClick={closeCreateModal}
              >
                Cancel
              </button>
              <button type="submit" className="users-create-btn">
                Create User
              </button>
            </div>
          </form>
        </dialog>
      )}

      {showEditForm && (
        <dialog
          ref={editModalRef}
          className="users-modal edit-user-modal"
          onCancel={closeEditModal}
          onClose={closeEditModal}
          onClick={(e) => {
            if (e.target === editModalRef.current) closeEditModal();
          }}
          aria-label="Edit user dialog"
        >
          <div className="users-panel-header">
            <h3 className="users-panel-title">Edit User</h3>
            <button
              type="button"
              className="users-panel-close"
              onClick={closeEditModal}
              aria-label="Close edit user form"
            >
              ✕
            </button>
          </div>
          <form className="users-form" onSubmit={handleEditSubmit}>
            <div className="users-form-grid">
              <div className="users-form-field">
                <label className="users-form-label" htmlFor="edit-firstName">
                  First Name
                </label>
                <input
                  id="edit-firstName"
                  name="firstName"
                  type="text"
                  className="users-form-input"
                  defaultValue={editingUser?.firstName || ""}
                  required
                />
              </div>
              <div className="users-form-field">
                <label className="users-form-label" htmlFor="edit-lastName">
                  Last Name
                </label>
                <input
                  id="edit-lastName"
                  name="lastName"
                  type="text"
                  className="users-form-input"
                  defaultValue={editingUser?.lastName || ""}
                  required
                />
              </div>
              <div className="users-form-field">
                <label className="users-form-label" htmlFor="edit-email">
                  Email
                </label>
                <input
                  id="edit-email"
                  name="email"
                  type="email"
                  className="users-form-input"
                  defaultValue={editingUser?.email || ""}
                  disabled
                />
              </div>
              <div className="users-form-field">
                <PhoneInput
                  value={editFormPhone}
                  onChange={setEditFormPhone}
                  required={true}
                />
              </div>
              <div className="users-form-field">
                <label className="users-form-label" htmlFor="edit-role">
                  Role
                </label>
                <select
                  id="edit-role"
                  name="role"
                  className="users-form-select"
                  defaultValue={editingUser?.role || "customer"}
                >
                  {roles.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="users-form-actions">
              <button
                type="button"
                className="users-button-secondary"
                onClick={closeEditModal}
              >
                Cancel
              </button>
              <button type="submit" className="users-create-btn">
                Save Changes
              </button>
            </div>
          </form>
        </dialog>
      )}

      {showDeleteConfirm && (
        <dialog
          ref={deleteModalRef}
          className="users-modal delete-user-modal"
          onCancel={closeDeleteModal}
          onClose={closeDeleteModal}
          onClick={(e) => {
            if (e.target === deleteModalRef.current) closeDeleteModal();
          }}
          aria-label="Delete user confirmation dialog"
        >
          <div className="users-panel-header">
            <h3 className="users-panel-title">Delete User</h3>
            <button
              type="button"
              className="users-panel-close"
              onClick={closeDeleteModal}
              aria-label="Close delete confirmation"
            >
              ✕
            </button>
          </div>
          <div className="users-form" role="document">
            <p className="users-confirm-text">
              Are you sure you want to delete this user
              {deletingUser
                ? `: ${deletingUser.firstName} ${deletingUser.lastName} (${deletingUser.email})`
                : ""}
              ?
            </p>
            <div className="users-form-actions">
              <button
                type="button"
                className="users-button-secondary"
                onClick={closeDeleteModal}
              >
                Cancel
              </button>
              <button
                type="button"
                className="users-button-danger"
                onClick={handleDeleteConfirm}
              >
                Delete
              </button>
            </div>
          </div>
        </dialog>
      )}

      {/* Users Table */}
      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Role</th>
              <th>Status</th>
              <th>Last Login</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>
                  {user.firstName} {user.lastName}
                </td>
                <td>{user.email}</td>
                <td>{user.phone || "--"}</td>
                <td>
                  <span
                    className={`users-role-badge ${getRoleBadgeColor(
                      user.role
                    )}`}
                  >
                    {user.role.replace("_", " ")}
                  </span>
                </td>
                <td>
                  <span
                    className={`users-status-badge ${
                      user.isActive ? "active" : "inactive"
                    }`}
                  >
                    {user.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td>
                  {user.lastSignIn
                    ? new Date(user.lastSignIn).toLocaleDateString()
                    : "Never"}
                </td>
                <td>
                  <div className="users-actions">
                    <button
                      className="users-action-btn edit"
                      title="Edit user"
                      onClick={() => openEditModal(user)}
                    >
                      ✏️
                    </button>
                    <button
                      className="users-action-btn delete"
                      title="Delete user"
                      onClick={() => openDeleteModal(user)}
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && (
          <div className="users-no-users">
            <p>No users found</p>
          </div>
        )}
      </div>

      {/* Mobile Cards */}
      <div className="users-mobile">
        {users.map((user) => (
          <div key={user.id} className="users-user-card">
            <div className="users-user-card-header">
              <div className="users-user-card-info">
                <div className="users-user-card-details">
                  <div className="users-user-card-name">
                    {user.firstName} {user.lastName}
                  </div>
                  <div className="users-user-card-email">{user.email}</div>
                </div>
              </div>
              <div className="users-user-card-actions">
                <button
                  className="users-action-btn edit"
                  title="Edit user"
                  onClick={() => openEditModal(user)}
                >
                  ✏️
                </button>
                <button
                  className="users-action-btn delete"
                  title="Delete user"
                  onClick={() => openDeleteModal(user)}
                >
                  🗑️
                </button>
              </div>
            </div>
            <div className="users-user-card-content">
              <div className="users-user-card-row">
                <span className="users-user-card-label">Role</span>
                <span
                  className={`users-role-badge ${getRoleBadgeColor(user.role)}`}
                >
                  {user.role.replace("_", " ")}
                </span>
              </div>
              <div className="users-user-card-row">
                <span className="users-user-card-label">Status</span>
                <span
                  className={`users-status-badge ${
                    user.isActive ? "active" : "inactive"
                  }`}
                >
                  {user.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="users-user-card-row">
                <span className="users-user-card-label">Last Login</span>
                <span className="users-user-card-value">
                  {user.lastSignIn
                    ? new Date(user.lastSignIn).toLocaleDateString()
                    : "Never"}
                </span>
              </div>
              <div className="users-user-card-row">
                <span className="users-user-card-label">Phone</span>
                <span className="users-user-card-value">
                  {user.phone || "No phone"}
                </span>
              </div>
            </div>
          </div>
        ))}

        {users.length === 0 && (
          <div className="users-no-users">
            <p>No users found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Users;
