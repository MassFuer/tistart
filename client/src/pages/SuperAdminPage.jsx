import { useState, useEffect } from "react";
import { platformAPI, adminAPI } from "../services/api";
import toast from "react-hot-toast";
import Loading from "../components/common/Loading";
import { FaCog, FaDatabase, FaUsers, FaTools, FaSave, FaSync, FaToggleOn, FaToggleOff, FaChevronDown, FaChevronUp, FaSearch } from "react-icons/fa";
import "./SuperAdminPage.css";

const SuperAdminPage = () => {
  const [activeTab, setActiveTab] = useState("settings");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Platform Settings State
  const [settings, setSettings] = useState(null);
  const [settingsForm, setSettingsForm] = useState({
    platformCommission: 20,
    storage: {
      defaultQuotaBytes: 5368709120,
      maxImageSizeMB: 10,
      maxVideoSizeMB: 500,
    },
    features: {
      videoUploadsEnabled: true,
      eventsEnabled: true,
      reviewsEnabled: true,
      ordersEnabled: true,
      artistApplicationsEnabled: true,
    },
    rateLimits: {
      authMaxAttempts: 5,
      authWindowMinutes: 15,
      apiMaxRequests: 100,
      apiWindowMinutes: 1,
    },
    email: {
      fromName: "Nemesis Art Platform",
      fromEmail: "noreply@nemesis.art",
      supportEmail: "support@nemesis.art",
    },
    maintenance: {
      enabled: false,
      message: "",
    },
  });

  // Storage Reports State
  const [storageData, setStorageData] = useState([]);
  const [storagePagination, setStoragePagination] = useState({ page: 1, pages: 1 });

  // User Management State
  const [users, setUsers] = useState([]);
  const [userPagination, setUserPagination] = useState({ page: 1, pages: 1 });
  const [userFilter, setUserFilter] = useState({ role: "", search: "" });
  const [expandedTier, setExpandedTier] = useState(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (activeTab === "storage") {
      fetchStorageData();
    } else if (activeTab === "users") {
      fetchUsers();
    }
  }, [activeTab, storagePagination.page, userPagination.page, userFilter]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await platformAPI.getSettings();
      setSettings(response.data.data);
      setSettingsForm({
        platformCommission: response.data.data.platformCommission || 20,
        storage: response.data.data.storage || settingsForm.storage,
        features: response.data.data.features || settingsForm.features,
        rateLimits: response.data.data.rateLimits || settingsForm.rateLimits,
        email: response.data.data.email || settingsForm.email,
        maintenance: response.data.data.maintenance || settingsForm.maintenance,
      });
    } catch (error) {
      toast.error("Failed to load platform settings");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStorageData = async () => {
    try {
      const response = await platformAPI.getStorageUsage({
        page: storagePagination.page,
        limit: 10
      });
      setStorageData(response.data.data);
      setStoragePagination(response.data.pagination);
    } catch (error) {
      toast.error("Failed to load storage data");
    }
  };

  const fetchUsers = async () => {
    try {
      const params = {
        page: userPagination.page,
        limit: 15,
        ...(userFilter.role && { role: userFilter.role }),
        ...(userFilter.search && { search: userFilter.search }),
      };
      const response = await adminAPI.getAllUsers(params);
      setUsers(response.data.data);
      setUserPagination(response.data.pagination);
    } catch (error) {
      toast.error("Failed to load users");
    }
  };

  const handleSettingsChange = (section, field, value) => {
    setSettingsForm(prev => ({
      ...prev,
      [section]: typeof prev[section] === "object"
        ? { ...prev[section], [field]: value }
        : value,
    }));
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      await platformAPI.updateSettings(settingsForm);
      toast.success("Platform settings updated successfully");
      fetchSettings();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleMaintenance = async () => {
    try {
      const newState = !settingsForm.maintenance.enabled;
      await platformAPI.toggleMaintenance({
        enabled: newState,
        message: settingsForm.maintenance.message,
      });
      setSettingsForm(prev => ({
        ...prev,
        maintenance: { ...prev.maintenance, enabled: newState },
      }));
      toast.success(newState ? "Maintenance mode enabled" : "Maintenance mode disabled");
    } catch (error) {
      toast.error("Failed to toggle maintenance mode");
    }
  };

  const handleUpdateUserRole = async (userId, newRole) => {
    try {
      await adminAPI.updateUserRole(userId, newRole);
      toast.success("User role updated");
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to update role");
    }
  };

  const handleUpdateUserTier = async (userId, tier) => {
    try {
      await platformAPI.updateUserStorage(userId, { subscriptionTier: tier });
      toast.success("Subscription tier updated");
      fetchStorageData();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to update tier");
    }
  };

  const formatBytes = (bytes) => {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getStoragePercentage = (used, quota) => {
    if (!quota) return 0;
    return Math.min(100, (used / quota) * 100);
  };

  if (loading) return <Loading />;

  return (
    <div className="superadmin-page">
      <div className="superadmin-container">
        <header className="superadmin-header">
          <h1>SuperAdmin Dashboard</h1>
          <p>Manage platform settings, storage, and user roles</p>
        </header>

        {/* Tab Navigation */}
        <nav className="superadmin-tabs">
          <button
            className={`tab-btn ${activeTab === "settings" ? "active" : ""}`}
            onClick={() => setActiveTab("settings")}
          >
            <FaCog /> Settings
          </button>
          <button
            className={`tab-btn ${activeTab === "storage" ? "active" : ""}`}
            onClick={() => setActiveTab("storage")}
          >
            <FaDatabase /> Storage
          </button>
          <button
            className={`tab-btn ${activeTab === "users" ? "active" : ""}`}
            onClick={() => setActiveTab("users")}
          >
            <FaUsers /> Users
          </button>
          <button
            className={`tab-btn ${activeTab === "maintenance" ? "active" : ""}`}
            onClick={() => setActiveTab("maintenance")}
          >
            <FaTools /> Maintenance
          </button>
        </nav>

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <div className="tab-content">
            <div className="settings-grid">
              {/* Commission Settings */}
              <section className="settings-section">
                <h2>Commission Rate</h2>
                <div className="form-group">
                  <label>Platform Commission (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={settingsForm.platformCommission}
                    onChange={(e) => handleSettingsChange("platformCommission", null, Number(e.target.value))}
                  />
                  <small>Percentage taken from each sale</small>
                </div>
              </section>

              {/* Storage Settings */}
              <section className="settings-section">
                <h2>Storage Limits</h2>
                <div className="form-group">
                  <label>Default Storage Quota (GB)</label>
                  <input
                    type="number"
                    min="1"
                    value={Math.round(settingsForm.storage.defaultQuotaBytes / (1024 * 1024 * 1024))}
                    onChange={(e) => handleSettingsChange("storage", "defaultQuotaBytes", Number(e.target.value) * 1024 * 1024 * 1024)}
                  />
                </div>
                <div className="form-group">
                  <label>Max Image Size (MB)</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={settingsForm.storage.maxImageSizeMB}
                    onChange={(e) => handleSettingsChange("storage", "maxImageSizeMB", Number(e.target.value))}
                  />
                </div>
                <div className="form-group">
                  <label>Max Video Size (MB)</label>
                  <input
                    type="number"
                    min="1"
                    max="5000"
                    value={settingsForm.storage.maxVideoSizeMB}
                    onChange={(e) => handleSettingsChange("storage", "maxVideoSizeMB", Number(e.target.value))}
                  />
                </div>
              </section>

              {/* Feature Toggles */}
              <section className="settings-section">
                <h2>Feature Toggles</h2>
                <div className="toggle-list">
                  {Object.entries(settingsForm.features).map(([key, value]) => (
                    <div key={key} className="toggle-item">
                      <span>{key.replace(/([A-Z])/g, " $1").replace(/enabled/i, "").trim()}</span>
                      <button
                        className={`toggle-btn ${value ? "active" : ""}`}
                        onClick={() => handleSettingsChange("features", key, !value)}
                      >
                        {value ? <FaToggleOn /> : <FaToggleOff />}
                      </button>
                    </div>
                  ))}
                </div>
              </section>

              {/* Rate Limits */}
              <section className="settings-section">
                <h2>Rate Limits</h2>
                <div className="form-group">
                  <label>Auth Max Attempts</label>
                  <input
                    type="number"
                    min="1"
                    value={settingsForm.rateLimits.authMaxAttempts}
                    onChange={(e) => handleSettingsChange("rateLimits", "authMaxAttempts", Number(e.target.value))}
                  />
                </div>
                <div className="form-group">
                  <label>Auth Window (minutes)</label>
                  <input
                    type="number"
                    min="1"
                    value={settingsForm.rateLimits.authWindowMinutes}
                    onChange={(e) => handleSettingsChange("rateLimits", "authWindowMinutes", Number(e.target.value))}
                  />
                </div>
                <div className="form-group">
                  <label>API Max Requests</label>
                  <input
                    type="number"
                    min="1"
                    value={settingsForm.rateLimits.apiMaxRequests}
                    onChange={(e) => handleSettingsChange("rateLimits", "apiMaxRequests", Number(e.target.value))}
                  />
                </div>
              </section>

              {/* Email Settings */}
              <section className="settings-section">
                <h2>Email Settings</h2>
                <div className="form-group">
                  <label>From Name</label>
                  <input
                    type="text"
                    value={settingsForm.email.fromName}
                    onChange={(e) => handleSettingsChange("email", "fromName", e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>From Email</label>
                  <input
                    type="email"
                    value={settingsForm.email.fromEmail}
                    onChange={(e) => handleSettingsChange("email", "fromEmail", e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Support Email</label>
                  <input
                    type="email"
                    value={settingsForm.email.supportEmail}
                    onChange={(e) => handleSettingsChange("email", "supportEmail", e.target.value)}
                  />
                </div>
              </section>

              {/* Subscription Tiers (Read-only display) */}
              <section className="settings-section full-width">
                <h2>Subscription Tiers</h2>
                <div className="tiers-list">
                  {settings?.subscriptionTiers?.map((tier, idx) => (
                    <div key={idx} className="tier-card">
                      <div
                        className="tier-header"
                        onClick={() => setExpandedTier(expandedTier === idx ? null : idx)}
                      >
                        <h3>{tier.name}</h3>
                        <span className="tier-price">
                          {tier.monthlyPriceUSD === 0 ? "Free" : `$${tier.monthlyPriceUSD}/mo`}
                        </span>
                        {expandedTier === idx ? <FaChevronUp /> : <FaChevronDown />}
                      </div>
                      {expandedTier === idx && (
                        <div className="tier-details">
                          <p><strong>Storage:</strong> {formatBytes(tier.storageQuotaBytes)}</p>
                          <p><strong>Commission:</strong> {tier.commissionRate}%</p>
                          <ul>
                            {tier.features?.map((feature, i) => (
                              <li key={i}>{feature}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <div className="settings-actions">
              <button className="btn btn-secondary" onClick={fetchSettings}>
                <FaSync /> Reset
              </button>
              <button className="btn btn-primary" onClick={handleSaveSettings} disabled={saving}>
                <FaSave /> {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        )}

        {/* Storage Tab */}
        {activeTab === "storage" && (
          <div className="tab-content">
            <div className="storage-summary">
              <h2>Artist Storage Usage</h2>
              <p>Manage storage quotas and subscription tiers for artists</p>
            </div>

            <div className="storage-table-container">
              <table className="storage-table">
                <thead>
                  <tr>
                    <th>Artist</th>
                    <th>Tier</th>
                    <th>Storage Used</th>
                    <th>Quota</th>
                    <th>Usage</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {storageData.map((artist) => {
                    const used = artist.storage?.totalBytes || 0;
                    const quota = artist.storage?.quotaBytes || settings?.storage?.defaultQuotaBytes || 5368709120;
                    const percentage = getStoragePercentage(used, quota);

                    return (
                      <tr key={artist._id}>
                        <td>
                          <div className="artist-info">
                            <strong>{artist.firstName} {artist.lastName}</strong>
                            <span className="artist-email">{artist.email}</span>
                          </div>
                        </td>
                        <td>
                          <span className={`tier-badge tier-${artist.subscriptionTier || "free"}`}>
                            {artist.subscriptionTier || "Free"}
                          </span>
                        </td>
                        <td>{formatBytes(used)}</td>
                        <td>{formatBytes(quota)}</td>
                        <td>
                          <div className="usage-bar">
                            <div
                              className={`usage-fill ${percentage > 90 ? "critical" : percentage > 70 ? "warning" : ""}`}
                              style={{ width: `${percentage}%` }}
                            />
                            <span className="usage-text">{percentage.toFixed(1)}%</span>
                          </div>
                        </td>
                        <td>
                          <select
                            value={artist.subscriptionTier || "free"}
                            onChange={(e) => handleUpdateUserTier(artist._id, e.target.value)}
                            className="tier-select"
                          >
                            <option value="free">Free</option>
                            <option value="pro">Pro</option>
                            <option value="enterprise">Enterprise</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {storagePagination.pages > 1 && (
              <div className="pagination">
                <button
                  disabled={storagePagination.page === 1}
                  onClick={() => setStoragePagination(p => ({ ...p, page: p.page - 1 }))}
                >
                  Previous
                </button>
                <span>Page {storagePagination.page} of {storagePagination.pages}</span>
                <button
                  disabled={storagePagination.page === storagePagination.pages}
                  onClick={() => setStoragePagination(p => ({ ...p, page: p.page + 1 }))}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="tab-content">
            <div className="users-header">
              <h2>User Management</h2>
              <div className="users-filters">
                <select
                  value={userFilter.role}
                  onChange={(e) => setUserFilter({ ...userFilter, role: e.target.value })}
                >
                  <option value="">All Roles</option>
                  <option value="user">User</option>
                  <option value="artist">Artist</option>
                  <option value="admin">Admin</option>
                  <option value="superAdmin">SuperAdmin</option>
                </select>
                <div className="search-input-wrapper">
                  <FaSearch className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={userFilter.search}
                    onChange={(e) => setUserFilter({ ...userFilter, search: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="users-table-container">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Current Role</th>
                    <th>Artist Status</th>
                    <th>Change Role</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user._id}>
                      <td>
                        <div className="user-info">
                          {user.profilePicture ? (
                            <img src={user.profilePicture} alt={user.firstName} className="user-avatar" />
                          ) : (
                            <div className="user-avatar-placeholder">
                              {user.firstName?.[0]}{user.lastName?.[0]}
                            </div>
                          )}
                          <span>{user.firstName} {user.lastName}</span>
                        </div>
                      </td>
                      <td>{user.email}</td>
                      <td>
                        <span className={`role-badge role-${user.role}`}>
                          {user.role}
                        </span>
                      </td>
                      <td>
                        {user.role === "artist" && (
                          <span className={`status-badge status-${user.artistStatus}`}>
                            {user.artistStatus}
                          </span>
                        )}
                      </td>
                      <td>
                        <select
                          value={user.role}
                          onChange={(e) => handleUpdateUserRole(user._id, e.target.value)}
                          className="role-select"
                        >
                          <option value="user">User</option>
                          <option value="artist">Artist</option>
                          <option value="admin">Admin</option>
                          <option value="superAdmin">SuperAdmin</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {userPagination.pages > 1 && (
              <div className="pagination">
                <button
                  disabled={userPagination.page === 1}
                  onClick={() => setUserPagination(p => ({ ...p, page: p.page - 1 }))}
                >
                  Previous
                </button>
                <span>Page {userPagination.page} of {userPagination.pages}</span>
                <button
                  disabled={userPagination.page === userPagination.pages}
                  onClick={() => setUserPagination(p => ({ ...p, page: p.page + 1 }))}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}

        {/* Maintenance Tab */}
        {activeTab === "maintenance" && (
          <div className="tab-content">
            <div className="maintenance-section">
              <h2>Maintenance Mode</h2>
              <p>Enable maintenance mode to temporarily disable the platform for users.</p>

              <div className="maintenance-status">
                <div className={`status-indicator ${settingsForm.maintenance.enabled ? "enabled" : "disabled"}`}>
                  {settingsForm.maintenance.enabled ? "MAINTENANCE MODE ACTIVE" : "Platform Operational"}
                </div>
              </div>

              <div className="form-group">
                <label>Maintenance Message</label>
                <textarea
                  value={settingsForm.maintenance.message}
                  onChange={(e) => handleSettingsChange("maintenance", "message", e.target.value)}
                  placeholder="Message to display to users during maintenance..."
                  rows={4}
                />
              </div>

              <button
                className={`btn btn-lg ${settingsForm.maintenance.enabled ? "btn-success" : "btn-warning"}`}
                onClick={handleToggleMaintenance}
              >
                {settingsForm.maintenance.enabled ? "Disable Maintenance Mode" : "Enable Maintenance Mode"}
              </button>

              <div className="maintenance-warning">
                <strong>Warning:</strong> Enabling maintenance mode will prevent all users (except SuperAdmins) from accessing the platform.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperAdminPage;