import { useCallback, useEffect, useMemo, useState } from "react";
import "./AdminUsers.css";
const API_BASE_URL = "http://localhost:5000/api";
function getAuthHeaders() {
  const token = localStorage.getItem("sih26002_token");

  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};
}

async function apiRequest(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.error || `Request failed (${response.status})`
    );
  }

  return data;
}

async function fetchUsers() {
  const data = await apiRequest("/users", {
    method: "GET",
  });

  return Array.isArray(data) ? data : data?.users || [];
}

export default function AdminUsers({ onBack, authUser, onLogout }) {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [selectedUser, setSelectedUser] = useState(null);

  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const [form, setForm] = useState({
    username: "",
    password: "",
    role: "AUTHORITY",
    full_name: "",
    is_active: true,
  });

  const isAdmin =
    String(authUser?.role || "").toUpperCase() === "ADMIN";

  const currentUserId = Number(authUser?.id);

  const isUserActive = (user) =>
    user.is_active === true ||
    user.is_active === 1 ||
    user.is_active === "true";

  /* =========================================================
     LOAD USERS
  ========================================================= */

  const loadUsers = useCallback(
    async (showRefresh = false) => {
      if (!isAdmin) {
        setLoading(false);
        setError("Administrator access is required.");
        return;
      }

      try {
        if (showRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const data = await fetchUsers();

        setUsers(data);
        setLastUpdated(new Date());
      } catch (err) {
        console.error("Admin users error:", err);

        const message = String(err.message || "").toLowerCase();

        if (
          message.includes("401") ||
          message.includes("token") ||
          message.includes("authentication")
        ) {
          setError(
            "Your session has expired. Please log in again."
          );
        } else if (
          message.includes("403") ||
          message.includes("administrator") ||
          message.includes("admin")
        ) {
          setError(
            "Administrator permission required."
          );
        } else {
          setError(
            err.message ||
              "Unable to connect to the user management API."
          );
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [isAdmin]
  );

  useEffect(() => {
    loadUsers();

    if (!isAdmin) {
      return undefined;
    }

    const interval = setInterval(() => {
      loadUsers(true);
    }, 15000);

    return () => clearInterval(interval);
  }, [loadUsers, isAdmin]);

  /* =========================================================
     STATISTICS
  ========================================================= */

  const statistics = useMemo(() => {
    const total = users.length;

    const admins = users.filter(
      (user) =>
        String(user.role || "").toUpperCase() === "ADMIN"
    ).length;

    const authorities = users.filter(
      (user) =>
        String(user.role || "").toUpperCase() === "AUTHORITY"
    ).length;

    const active = users.filter(isUserActive).length;

    const inactive = total - active;

    return {
      total,
      admins,
      authorities,
      active,
      inactive,
    };
  }, [users]);

  /* =========================================================
     FILTER USERS
  ========================================================= */

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return users.filter((user) => {
      const username = String(
        user.username || ""
      ).toLowerCase();

      const fullName = String(
        user.full_name || ""
      ).toLowerCase();

      const role = String(
        user.role || ""
      ).toUpperCase();

      const active = isUserActive(user);

      const matchesSearch =
        !query ||
        username.includes(query) ||
        fullName.includes(query) ||
        role.toLowerCase().includes(query);

      const matchesRole =
        roleFilter === "ALL" ||
        role === roleFilter;

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && active) ||
        (statusFilter === "INACTIVE" && !active);

      return (
        matchesSearch &&
        matchesRole &&
        matchesStatus
      );
    });
  }, [
    users,
    search,
    roleFilter,
    statusFilter,
  ]);

  /* =========================================================
     HELPERS
  ========================================================= */

  const formatDate = (value) => {
    if (!value) {
      return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getInitials = (name, username) => {
    const source = String(
      name || username || "U"
    ).trim();

    if (!source) {
      return "U";
    }

    const parts = source.split(/\s+/);

    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }

    return source
      .substring(0, 2)
      .toUpperCase();
  };

  const getRoleLabel = (role) => {
    const normalized = String(
      role || ""
    ).toUpperCase();

    if (normalized === "ADMIN") {
      return "SYSTEM ADMIN";
    }

    if (normalized === "AUTHORITY") {
      return "AUTHORITY";
    }

    return normalized || "UNKNOWN";
  };

  const getStatus = (user) =>
    isUserActive(user)
      ? "ACTIVE"
      : "INACTIVE";

  /* =========================================================
     OPEN CREATE MODAL
  ========================================================= */

  const openCreateModal = () => {
    setModalMode("create");
    setSelectedUser(null);

    setForm({
      username: "",
      password: "",
      role: "AUTHORITY",
      full_name: "",
      is_active: true,
    });

    setFormError("");
    setShowModal(true);
  };

  /* =========================================================
     OPEN EDIT MODAL
  ========================================================= */

  const openEditModal = (user) => {
    setModalMode("edit");
    setSelectedUser(user);

    setForm({
      username: user.username || "",
      password: "",
      role:
        String(user.role || "AUTHORITY").toUpperCase(),
      full_name: user.full_name || "",
      is_active: isUserActive(user),
    });

    setFormError("");
    setShowModal(true);
  };

  /* =========================================================
     CLOSE MODAL
  ========================================================= */

  const closeModal = () => {
    if (formLoading) {
      return;
    }

    setShowModal(false);
    setSelectedUser(null);
    setFormError("");
  };

  /* =========================================================
     FORM CHANGE
  ========================================================= */

  const handleFormChange = (event) => {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  };

  /* =========================================================
     CREATE / EDIT USER
  ========================================================= */

  const handleSubmit = async (event) => {
    event.preventDefault();

    setFormError("");

    const username = form.username.trim();
    const fullName = form.full_name.trim();
    const password = form.password;

    if (!username) {
      setFormError(
        "Username is required."
      );
      return;
    }

    if (!fullName) {
      setFormError(
        "Full name is required."
      );
      return;
    }

    if (
      modalMode === "create" &&
      password.length < 6
    ) {
      setFormError(
        "Password must contain at least 6 characters."
      );
      return;
    }

    if (
      modalMode === "edit" &&
      password &&
      password.length < 6
    ) {
      setFormError(
        "New password must contain at least 6 characters."
      );
      return;
    }

    try {
      setFormLoading(true);

      const payload = {
        username,
        role: form.role,
        full_name: fullName,
        is_active: form.is_active,
      };

      if (password) {
        payload.password = password;
      }

      if (modalMode === "create") {
        await apiRequest("/users", {
          method: "POST",
          body: JSON.stringify({
            ...payload,
            password,
          }),
        });
      } else {
        await apiRequest(
          `/users/${selectedUser.id}`,
          {
            method: "PUT",
            body: JSON.stringify(payload),
          }
        );
      }

      closeModal();
      await loadUsers(true);
    } catch (err) {
      console.error(
        "User save error:",
        err
      );

      setFormError(
        err.message ||
          "Unable to save user."
      );
    } finally {
      setFormLoading(false);
    }
  };

  /* =========================================================
     ACTIVATE / DEACTIVATE
  ========================================================= */

  const handleStatusChange = async (user) => {
    const active = isUserActive(user);

    if (
      Number(user.id) === currentUserId &&
      active
    ) {
      window.alert(
        "You cannot deactivate your own administrator account."
      );
      return;
    }

    const action = active
      ? "deactivate"
      : "activate";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} ${user.full_name || user.username}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      await apiRequest(
        `/users/${user.id}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({
            is_active: !active,
          }),
        }
      );

      await loadUsers(true);
    } catch (err) {
      console.error(
        "Status update error:",
        err
      );

      window.alert(
        err.message ||
          "Unable to update user status."
      );
    }
  };

  /* =========================================================
     DELETE USER
  ========================================================= */

  const handleDelete = async (user) => {
    if (
      Number(user.id) === currentUserId
    ) {
      window.alert(
        "You cannot delete your own administrator account."
      );
      return;
    }

    const confirmed = window.confirm(
      `DELETE USER?\n\n${user.full_name || user.username}\n@${user.username}\n\nThis action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    try {
      await apiRequest(
        `/users/${user.id}`,
        {
          method: "DELETE",
        }
      );

      await loadUsers(true);
    } catch (err) {
      console.error(
        "Delete user error:",
        err
      );

      window.alert(
        err.message ||
          "Unable to delete user."
      );
    }
  };

  /* =========================================================
     ACCESS DENIED
  ========================================================= */

  if (!isAdmin) {
    return (
      <div className="admin-users-page">
        <div className="admin-users-grid" />

        <div className="admin-access-denied">
          <div className="admin-denied-icon">
            !
          </div>

          <div className="admin-denied-label">
            ACCESS RESTRICTED
          </div>

          <h1>
            ADMINISTRATOR ACCESS REQUIRED
          </h1>

          <p>
            This control panel is restricted
            to authorized system administrators.
          </p>

          <button
            type="button"
            className="admin-secondary-button"
            onClick={onBack}
          >
            ← BACK TO COMMAND CENTRE
          </button>
        </div>
      </div>
    );
  }

  /* =========================================================
     MAIN ADMIN PANEL
  ========================================================= */

  return (
    <div className="admin-users-page">
      <div className="admin-users-grid" />

      <header className="admin-users-header">
        <div className="admin-header-left">
          <button
            type="button"
            className="admin-back-button"
            onClick={onBack}
          >
            ← COMMAND CENTRE
          </button>

          <div className="admin-title-block">
            <div className="admin-eyebrow">
              SIH26002 • SECURITY & ACCESS CONTROL
            </div>

            <h1>
              ADMIN CONTROL PANEL
            </h1>

            <p>
              User Management &amp; System
              Authorization
            </p>
          </div>
        </div>

        <div className="admin-header-right">
          <div className="admin-session">
            <span className="admin-session-dot" />

            <div>
              <strong>
                {authUser?.full_name ||
                  "System Administrator"}
              </strong>

              <span>
                {authUser?.username
                  ? `@${authUser.username}`
                  : "ADMIN"}
              </span>
            </div>
          </div>

          {onLogout && (
            <button
              type="button"
              className="admin-logout-button"
              onClick={onLogout}
            >
              LOGOUT
            </button>
          )}
        </div>
      </header>

      <main className="admin-users-content">
        {/* =====================================================
            SECURITY BANNER
        ===================================================== */}

        <section className="admin-security-banner">
          <div className="admin-security-icon">
            ◆
          </div>

          <div>
            <strong>
              SECURE ADMINISTRATOR SESSION
            </strong>

            <p>
              PostgreSQL-backed identity
              management with JWT-protected
              administrator access.
            </p>
          </div>

          <div className="admin-security-status">
            <span />
            AUTHENTICATED
          </div>
        </section>

        {/* =====================================================
            STATISTICS
        ===================================================== */}

        <section className="admin-stats-grid">
          <div className="admin-stat-card">
            <div className="admin-stat-icon">
              👥
            </div>

            <div>
              <span>TOTAL USERS</span>
              <strong>
                {statistics.total}
              </strong>
            </div>

            <small>
              REGISTERED ACCOUNTS
            </small>
          </div>

          <div className="admin-stat-card admin-stat-admin">
            <div className="admin-stat-icon">
              ◆
            </div>

            <div>
              <span>ADMINISTRATORS</span>
              <strong>
                {statistics.admins}
              </strong>
            </div>

            <small>
              SYSTEM CONTROL
            </small>
          </div>

          <div className="admin-stat-card admin-stat-authority">
            <div className="admin-stat-icon">
              ◈
            </div>

            <div>
              <span>AUTHORITY USERS</span>
              <strong>
                {statistics.authorities}
              </strong>
            </div>

            <small>
              OPERATIONS ACCESS
            </small>
          </div>

          <div className="admin-stat-card admin-stat-active">
            <div className="admin-stat-icon">
              ●
            </div>

            <div>
              <span>ACTIVE USERS</span>
              <strong>
                {statistics.active}
              </strong>
            </div>

            <small>
              AUTHORIZED NOW
            </small>
          </div>

          <div className="admin-stat-card admin-stat-inactive">
            <div className="admin-stat-icon">
              ○
            </div>

            <div>
              <span>INACTIVE USERS</span>
              <strong>
                {statistics.inactive}
              </strong>
            </div>

            <small>
              ACCESS DISABLED
            </small>
          </div>
        </section>

        {/* =====================================================
            USERS PANEL
        ===================================================== */}

        <section className="admin-users-panel">
          <div className="admin-panel-heading">
            <div>
              <div className="admin-panel-eyebrow">
                IDENTITY DATABASE
              </div>

              <h2>
                REGISTERED USERS
              </h2>

              <p>
                Manage and monitor authorized
                SIH26002 platform accounts.
              </p>
            </div>

            <div className="admin-panel-actions">
              <button
                type="button"
                className="admin-create-button"
                onClick={openCreateModal}
              >
                + CREATE USER
              </button>

              <button
                type="button"
                className="admin-refresh-button"
                onClick={() =>
                  loadUsers(true)
                }
                disabled={refreshing}
              >
                {refreshing
                  ? "SYNCING..."
                  : "↻ REFRESH"}
              </button>
            </div>
          </div>

          {/* ===================================================
              FILTER BAR
          =================================================== */}

          <div className="admin-filter-bar">
            <div className="admin-search-box">
              <span>⌕</span>

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search username, name or role..."
              />
            </div>

            <div className="admin-filter-group">
              <label>ROLE</label>

              <select
                value={roleFilter}
                onChange={(event) =>
                  setRoleFilter(
                    event.target.value
                  )
                }
              >
                <option value="ALL">
                  ALL ROLES
                </option>

                <option value="ADMIN">
                  ADMIN
                </option>

                <option value="AUTHORITY">
                  AUTHORITY
                </option>
              </select>
            </div>

            <div className="admin-filter-group">
              <label>STATUS</label>

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value
                  )
                }
              >
                <option value="ALL">
                  ALL STATUS
                </option>

                <option value="ACTIVE">
                  ACTIVE
                </option>

                <option value="INACTIVE">
                  INACTIVE
                </option>
              </select>
            </div>
          </div>

          {/* ===================================================
              ERROR
          =================================================== */}

          {error && (
            <div className="admin-error-box">
              <div className="admin-error-icon">
                !
              </div>

              <div>
                <strong>
                  USER DATABASE ERROR
                </strong>

                <p>{error}</p>
              </div>

              <button
                type="button"
                onClick={() =>
                  loadUsers(true)
                }
              >
                RETRY
              </button>
            </div>
          )}

          {/* ===================================================
              USER TABLE
          =================================================== */}

          <div className="admin-table-wrapper">
            {loading ? (
              <div className="admin-loading-state">
                <div className="admin-loader" />

                <strong>
                  LOADING USER DATABASE...
                </strong>

                <span>
                  Synchronizing with PostgreSQL
                </span>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="admin-empty-state">
                <div className="admin-empty-icon">
                  ◌
                </div>

                <strong>
                  NO USERS FOUND
                </strong>

                <span>
                  Try changing your search or
                  filters.
                </span>
              </div>
            ) : (
              <table className="admin-users-table">
                <thead>
                  <tr>
                    <th>USER</th>
                    <th>USERNAME</th>
                    <th>ROLE</th>
                    <th>STATUS</th>
                    <th>CREATED</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredUsers.map(
                    (user) => {
                      const status =
                        getStatus(user);

                      const role =
                        String(
                          user.role || ""
                        ).toUpperCase();

                      const isCurrentUser =
                        Number(user.id) ===
                        currentUserId;

                      return (
                        <tr
                          key={
                            user.id ||
                            user.username
                          }
                        >
                          {/* USER */}

                          <td>
                            <div className="admin-user-cell">
                              <div className="admin-avatar">
                                {getInitials(
                                  user.full_name,
                                  user.username
                                )}
                              </div>

                              <div>
                                <strong>
                                  {user.full_name ||
                                    "Unnamed User"}
                                </strong>

                                <span>
                                  ID #
                                  {user.id ??
                                    "—"}

                                  {isCurrentUser &&
                                    " • YOU"}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* USERNAME */}

                          <td>
                            <span className="admin-username">
                              @
                              {user.username ||
                                "unknown"}
                            </span>
                          </td>

                          {/* ROLE */}

                          <td>
                            <span
                              className={`admin-role-badge ${
                                role === "ADMIN"
                                  ? "role-admin"
                                  : role ===
                                    "AUTHORITY"
                                  ? "role-authority"
                                  : "role-unknown"
                              }`}
                            >
                              <span />
                              {getRoleLabel(
                                role
                              )}
                            </span>
                          </td>

                          {/* STATUS */}

                          <td>
                            <span
                              className={`admin-status-badge ${
                                status ===
                                "ACTIVE"
                                  ? "status-active"
                                  : "status-inactive"
                              }`}
                            >
                              <span />
                              {status}
                            </span>
                          </td>

                          {/* CREATED */}

                          <td>
                            <span className="admin-date">
                              {formatDate(
                                user.created_at
                              )}
                            </span>
                          </td>

                          {/* ACTIONS */}

                          <td>
                            <div
                              style={{
                                display: "flex",
                                gap: "6px",
                                flexWrap:
                                  "wrap",
                                alignItems:
                                  "center",
                              }}
                            >
                              <button
                                type="button"
                                className="admin-action-button"
                                onClick={() =>
                                  openEditModal(
                                    user
                                  )
                                }
                                title="Edit user"
                              >
                                ✏️
                              </button>

                              <button
                                type="button"
                                className="admin-action-button"
                                onClick={() =>
                                  handleStatusChange(
                                    user
                                  )
                                }
                                disabled={
                                  isCurrentUser &&
                                  isUserActive(
                                    user
                                  )
                                }
                                title={
                                  isUserActive(
                                    user
                                  )
                                    ? "Deactivate user"
                                    : "Activate user"
                                }
                              >
                                {isUserActive(
                                  user
                                )
                                  ? "🔴"
                                  : "🟢"}
                              </button>

                              <button
                                type="button"
                                className="admin-action-button"
                                onClick={() =>
                                  handleDelete(
                                    user
                                  )
                                }
                                disabled={
                                  isCurrentUser
                                }
                                title="Delete user"
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* ===================================================
              TABLE FOOTER
          =================================================== */}

          <div className="admin-table-footer">
            <span>
              DISPLAYING{" "}
              <strong>
                {filteredUsers.length}
              </strong>{" "}
              OF{" "}
              <strong>
                {users.length}
              </strong>{" "}
              USERS
            </span>

            <span className="admin-database-indicator">
              <span />
              POSTGRESQL • LIVE
            </span>
          </div>
        </section>

        {/* =====================================================
            PERMISSION MATRIX
        ===================================================== */}

        <section className="admin-permission-panel">
          <div>
            <div className="admin-panel-eyebrow">
              ACCESS CONTROL
            </div>

            <h2>
              ROLE PERMISSION MATRIX
            </h2>

            <p>
              Current platform authorization
              boundaries.
            </p>
          </div>

          <div className="admin-permission-grid">
            <div className="admin-permission-card">
              <div className="admin-permission-heading">
                <span className="permission-symbol">
                  ◆
                </span>

                <div>
                  <strong>
                    SYSTEM ADMIN
                  </strong>

                  <span>ADMIN</span>
                </div>
              </div>

              <ul>
                <li>
                  Full command centre access
                </li>

                <li>
                  User management
                </li>

                <li>
                  Fleet &amp; GIS monitoring
                </li>

                <li>
                  Analytics &amp;
                  intelligence
                </li>

                <li>
                  System administration
                </li>
              </ul>
            </div>

            <div className="admin-permission-card">
              <div className="admin-permission-heading">
                <span className="permission-symbol">
                  ◈
                </span>

                <div>
                  <strong>
                    AUTHORITY OPERATOR
                  </strong>

                  <span>
                    AUTHORITY
                  </span>
                </div>
              </div>

              <ul>
                <li>
                  Command centre access
                </li>

                <li>
                  Fleet &amp; GIS monitoring
                </li>

                <li>
                  Incident monitoring
                </li>

                <li>
                  Route intelligence
                </li>

                <li>
                  Analytics &amp;
                  intelligence
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* =====================================================
            FOOTER
        ===================================================== */}

        <footer className="admin-users-footer">
          <div>
            SIH26002 • NER LOGISTICS
            INTELLIGENCE PLATFORM
          </div>

          <div>
            {lastUpdated
              ? `LAST SYNC: ${formatDate(
                  lastUpdated
                )}`
              : "WAITING FOR DATABASE SYNC"}
          </div>
        </footer>
      </main>

      {/* =======================================================
          CREATE / EDIT USER MODAL
      ======================================================= */}

      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background:
              "rgba(0, 0, 0, 0.78)",
            backdropFilter:
              "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent:
              "center",
            padding: "20px",
            zIndex: 99999,
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "520px",
              maxHeight: "90vh",
              overflowY: "auto",
              background:
                "linear-gradient(145deg, #111827, #08111f)",
              border:
                "1px solid rgba(0, 220, 255, 0.35)",
              borderRadius: "18px",
              boxShadow:
                "0 25px 80px rgba(0,0,0,0.65), 0 0 40px rgba(0,200,255,0.08)",
              padding: "28px",
              color: "#ffffff",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems:
                  "flex-start",
                marginBottom:
                  "24px",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize:
                      "11px",
                    letterSpacing:
                      "2px",
                    opacity: 0.65,
                    marginBottom:
                      "6px",
                  }}
                >
                  SECURITY • IDENTITY
                  DATABASE
                </div>

                <h2
                  style={{
                    margin: 0,
                    fontSize:
                      "24px",
                    letterSpacing:
                      "1px",
                  }}
                >
                  {modalMode ===
                  "create"
                    ? "CREATE USER"
                    : "EDIT USER"}
                </h2>

                <p
                  style={{
                    margin:
                      "8px 0 0",
                    opacity:
                      0.65,
                    fontSize:
                      "13px",
                  }}
                >
                  PostgreSQL-backed
                  administrator
                  account management
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={
                  formLoading
                }
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius:
                    "50%",
                  border:
                    "1px solid rgba(255,255,255,0.15)",
                  background:
                    "rgba(255,255,255,0.05)",
                  color: "#fff",
                  cursor:
                    "pointer",
                  fontSize:
                    "18px",
                }}
              >
                ×
              </button>
            </div>

            {formError && (
              <div
                style={{
                  padding:
                    "12px 14px",
                  marginBottom:
                    "18px",
                  borderRadius:
                    "10px",
                  border:
                    "1px solid rgba(255,70,70,0.35)",
                  background:
                    "rgba(255,50,50,0.08)",
                  color:
                    "#ff9b9b",
                  fontSize:
                    "13px",
                }}
              >
                ⚠ {formError}
              </div>
            )}

            <form
              onSubmit={
                handleSubmit
              }
            >
              {/* FULL NAME */}

              <label
                style={{
                  display:
                    "block",
                  marginBottom:
                    "7px",
                  fontSize:
                    "11px",
                  letterSpacing:
                    "1.5px",
                  opacity: 0.7,
                }}
              >
                FULL NAME
              </label>

              <input
                name="full_name"
                value={
                  form.full_name
                }
                onChange={
                  handleFormChange
                }
                placeholder="Enter full name"
                disabled={
                  formLoading
                }
                style={{
                  width:
                    "100%",
                  boxSizing:
                    "border-box",
                  padding:
                    "13px 14px",
                  marginBottom:
                    "16px",
                  borderRadius:
                    "9px",
                  border:
                    "1px solid rgba(255,255,255,0.12)",
                  background:
                    "rgba(255,255,255,0.05)",
                  color:
                    "#ffffff",
                  outline:
                    "none",
                }}
              />

              {/* USERNAME */}

              <label
                style={{
                  display:
                    "block",
                  marginBottom:
                    "7px",
                  fontSize:
                    "11px",
                  letterSpacing:
                    "1.5px",
                  opacity: 0.7,
                }}
              >
                USERNAME
              </label>

              <input
                name="username"
                value={
                  form.username
                }
                onChange={
                  handleFormChange
                }
                placeholder="Enter username"
                disabled={
                  formLoading
                }
                autoComplete="off"
                style={{
                  width:
                    "100%",
                  boxSizing:
                    "border-box",
                  padding:
                    "13px 14px",
                  marginBottom:
                    "16px",
                  borderRadius:
                    "9px",
                  border:
                    "1px solid rgba(255,255,255,0.12)",
                  background:
                    "rgba(255,255,255,0.05)",
                  color:
                    "#ffffff",
                  outline:
                    "none",
                }}
              />

              {/* ROLE */}

              <label
                style={{
                  display:
                    "block",
                  marginBottom:
                    "7px",
                  fontSize:
                    "11px",
                  letterSpacing:
                    "1.5px",
                  opacity: 0.7,
                }}
              >
                ROLE
              </label>

              <select
                name="role"
                value={
                  form.role
                }
                onChange={
                  handleFormChange
                }
                disabled={
                  formLoading ||
                  Number(
                    selectedUser?.id
                  ) ===
                    currentUserId
                }
                style={{
                  width:
                    "100%",
                  boxSizing:
                    "border-box",
                  padding:
                    "13px 14px",
                  marginBottom:
                    "16px",
                  borderRadius:
                    "9px",
                  border:
                    "1px solid rgba(255,255,255,0.12)",
                  background:
                    "#111827",
                  color:
                    "#ffffff",
                  outline:
                    "none",
                }}
              >
                <option value="AUTHORITY">
                  AUTHORITY
                </option>

                <option value="ADMIN">
                  ADMIN
                </option>
              </select>

              {/* PASSWORD */}

              <label
                style={{
                  display:
                    "block",
                  marginBottom:
                    "7px",
                  fontSize:
                    "11px",
                  letterSpacing:
                    "1.5px",
                  opacity: 0.7,
                }}
              >
                {modalMode ===
                "create"
                  ? "PASSWORD"
                  : "NEW PASSWORD (OPTIONAL)"}
              </label>

              <input
                type="password"
                name="password"
                value={
                  form.password
                }
                onChange={
                  handleFormChange
                }
                placeholder={
                  modalMode ===
                  "create"
                    ? "Minimum 6 characters"
                    : "Leave blank to keep current password"
                }
                disabled={
                  formLoading
                }
                autoComplete="new-password"
                style={{
                  width:
                    "100%",
                  boxSizing:
                    "border-box",
                  padding:
                    "13px 14px",
                  marginBottom:
                    "16px",
                  borderRadius:
                    "9px",
                  border:
                    "1px solid rgba(255,255,255,0.12)",
                  background:
                    "rgba(255,255,255,0.05)",
                  color:
                    "#ffffff",
                  outline:
                    "none",
                }}
              />

              {/* STATUS */}

              <label
                style={{
                  display:
                    "flex",
                  alignItems:
                    "center",
                  gap: "10px",
                  marginBottom:
                    "22px",
                  cursor:
                    "pointer",
                  fontSize:
                    "13px",
                }}
              >
                <input
                  type="checkbox"
                  name="is_active"
                  checked={
                    form.is_active
                  }
                  onChange={
                    handleFormChange
                  }
                  disabled={
                    formLoading ||
                    Number(
                      selectedUser?.id
                    ) ===
                      currentUserId
                  }
                />

                ACCOUNT ACTIVE
              </label>

              {/* BUTTONS */}

              <div
                style={{
                  display:
                    "flex",
                  gap: "10px",
                  justifyContent:
                    "flex-end",
                }}
              >
                <button
                  type="button"
                  onClick={
                    closeModal
                  }
                  disabled={
                    formLoading
                  }
                  style={{
                    padding:
                      "12px 18px",
                    borderRadius:
                      "9px",
                    border:
                      "1px solid rgba(255,255,255,0.15)",
                    background:
                      "rgba(255,255,255,0.05)",
                    color:
                      "#ffffff",
                    cursor:
                      "pointer",
                  }}
                >
                  CANCEL
                </button>

                <button
                  type="submit"
                  disabled={
                    formLoading
                  }
                  style={{
                    padding:
                      "12px 20px",
                    borderRadius:
                      "9px",
                    border:
                      "1px solid rgba(0,220,255,0.35)",
                    background:
                      "rgba(0,180,255,0.12)",
                    color:
                      "#ffffff",
                    cursor:
                      "pointer",
                    fontWeight:
                      "700",
                    letterSpacing:
                      "1px",
                  }}
                >
                  {formLoading
                    ? "SAVING..."
                    : modalMode ===
                      "create"
                    ? "CREATE USER"
                    : "SAVE CHANGES"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}