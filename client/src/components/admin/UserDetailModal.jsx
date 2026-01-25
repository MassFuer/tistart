import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { adminAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import "./UserDetailModal.css";

const UserDetailModal = ({ userId, onClose, onUpdate, onDelete }) => {
  const { user: currentUser } = useAuth();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formData, setFormData] = useState({});

  const isSuperAdmin = currentUser?.role === "superAdmin";
  const artistStatuses = ["none", "pending", "incomplete", "verified", "suspended"];
  const roles = isSuperAdmin
    ? ["user", "artist", "admin", "superAdmin"]
    : ["user", "artist", "admin"];

  useEffect(() => {
    fetchUser();
  }, [userId]);

  const fetchUser = async () => {
    setIsLoading(true);
    try {
      const response = await adminAPI.getUser(userId);
      setUser(response.data.data);
      setFormData({
        firstName: response.data.data.firstName || "",
        lastName: response.data.data.lastName || "",
        userName: response.data.data.userName || "",
        email: response.data.data.email || "",
        role: response.data.data.role || "user",
        artistStatus: response.data.data.artistStatus || "none",
      });
    } catch (error) {
      toast.error("Failed to load user details");
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await adminAPI.updateUser(userId, formData);
      toast.success("User updated successfully");
      setIsEditing(false);
      fetchUser();
      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to update user");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await adminAPI.deleteUser(userId);
      toast.success("User deleted successfully");
      if (onDelete) onDelete();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to delete user");
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const canEdit = () => {
    if (!user) return false;
    // SuperAdmin can edit anyone except other superAdmins
    if (isSuperAdmin) {
      return user.role !== "superAdmin" || user._id === currentUser._id;
    }
    // Admin can edit users and artists, not admins/superAdmins
    return user.role !== "admin" && user.role !== "superAdmin";
  };

  const canDelete = () => {
    if (!user) return false;
    // Can't delete yourself
    if (user._id === currentUser._id) return false;
    // SuperAdmin can delete admins and below
    if (isSuperAdmin) {
      return user.role !== "superAdmin";
    }
    // Admin can delete users and artists only
    return user.role !== "admin" && user.role !== "superAdmin";
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="modal-overlay">
        <div className="user-detail-modal">
          <div className="modal-loading">Loading user details...</div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="user-detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEditing ? "Edit User" : "User Details"}</h2>
          <button className="modal-close" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="modal-body">
          {/* User Avatar & Basic Info */}
          <div className="user-profile-section">
            <div className="user-avatar-large">
              {user.profilePicture ? (
                <img src={user.profilePicture} alt={user.firstName} />
              ) : (
                <span>
                  {user.firstName?.[0]}
                  {user.lastName?.[0]}
                </span>
              )}
            </div>
            {!isEditing && (
              <div className="user-basic-info">
                <h3>
                  {user.firstName} {user.lastName}
                </h3>
                <p className="user-username">@{user.userName}</p>
                <p className="user-email">{user.email}</p>
                <div className="user-badges">
                  <span className={`badge badge-role badge-${user.role}`}>{user.role}</span>
                  {user.artistStatus !== "none" && (
                    <span className={`badge badge-status badge-${user.artistStatus}`}>
                      {user.artistStatus}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Edit Form */}
          {isEditing ? (
            <div className="edit-form">
              <div className="form-row">
                <div className="form-group">
                  <label>First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Username</label>
                  <input
                    type="text"
                    name="userName"
                    value={formData.userName}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Role</label>
                  <select name="role" value={formData.role} onChange={handleChange}>
                    {roles.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Artist Status</label>
                  <select name="artistStatus" value={formData.artistStatus} onChange={handleChange}>
                    {artistStatuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* User Details */}
              <div className="user-details-grid">
                <div className="detail-item">
                  <label>User ID</label>
                  <span className="detail-value mono">{user._id}</span>
                </div>
                <div className="detail-item">
                  <label>Email Verified</label>
                  <span className={`detail-value ${user.isEmailVerified ? "verified" : "unverified"}`}>
                    {user.isEmailVerified ? "Yes" : "No"}
                  </span>
                </div>
                <div className="detail-item">
                  <label>Member Since</label>
                  <span className="detail-value">{formatDate(user.createdAt)}</span>
                </div>
                <div className="detail-item">
                  <label>Last Updated</label>
                  <span className="detail-value">{formatDate(user.updatedAt)}</span>
                </div>
              </div>

              {/* Artist Info */}
              {user.artistInfo && user.artistStatus !== "none" && (
                <div className="artist-info-section">
                  <h4>Artist Information</h4>
                  <div className="user-details-grid">
                    {user.artistInfo.companyName && (
                      <div className="detail-item">
                        <label>Company Name</label>
                        <span className="detail-value">{user.artistInfo.companyName}</span>
                      </div>
                    )}
                    {user.artistInfo.tagline && (
                      <div className="detail-item">
                        <label>Tagline</label>
                        <span className="detail-value">{user.artistInfo.tagline}</span>
                      </div>
                    )}
                    {user.artistInfo.type && (
                      <div className="detail-item">
                        <label>Type</label>
                        <span className="detail-value">{user.artistInfo.type}</span>
                      </div>
                    )}
                    {user.artistInfo.taxId && (
                      <div className="detail-item">
                        <label>Tax ID</label>
                        <span className="detail-value mono">{user.artistInfo.taxId}</span>
                      </div>
                    )}
                    {user.artistInfo.address?.city && (
                      <div className="detail-item">
                        <label>Location</label>
                        <span className="detail-value">
                          {user.artistInfo.address.city}, {user.artistInfo.address.country}
                        </span>
                      </div>
                    )}
                  </div>
                  {user.artistInfo.description && (
                    <div className="artist-description">
                      <label>Description</label>
                      <p>{user.artistInfo.description}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Storage Info (for artists) */}
              {user.storage && user.storage.totalBytes > 0 && (
                <div className="storage-section">
                  <h4>Storage Usage</h4>
                  <div className="user-details-grid">
                    <div className="detail-item">
                      <label>Total Used</label>
                      <span className="detail-value">
                        {(user.storage.totalBytes / (1024 * 1024)).toFixed(2)} MB
                      </span>
                    </div>
                    <div className="detail-item">
                      <label>Images</label>
                      <span className="detail-value">
                        {(user.storage.imageBytes / (1024 * 1024)).toFixed(2)} MB
                      </span>
                    </div>
                    <div className="detail-item">
                      <label>Videos</label>
                      <span className="detail-value">
                        {(user.storage.videoBytes / (1024 * 1024)).toFixed(2)} MB
                      </span>
                    </div>
                    <div className="detail-item">
                      <label>File Count</label>
                      <span className="detail-value">{user.storage.fileCount || 0}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Links */}
              {user.artistStatus === "verified" && (
                <div className="quick-links">
                  <Link to={`/artists/${user._id}`} className="btn btn-secondary" target="_blank">
                    View Public Profile
                  </Link>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          {isEditing ? (
            <>
              <button
                className="btn btn-secondary"
                onClick={() => setIsEditing(false)}
                disabled={isSaving}
              >
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSave} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </>
          ) : (
            <>
              {showDeleteConfirm ? (
                <div className="delete-confirm">
                  <span>Are you sure? This cannot be undone.</span>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isDeleting}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={handleDelete}
                    disabled={isDeleting}
                  >
                    {isDeleting ? "Deleting..." : "Confirm Delete"}
                  </button>
                </div>
              ) : (
                <>
                  {canDelete() && (
                    <button
                      className="btn btn-danger"
                      onClick={() => setShowDeleteConfirm(true)}
                    >
                      Delete User
                    </button>
                  )}
                  {canEdit() && (
                    <button className="btn btn-primary" onClick={() => setIsEditing(true)}>
                      Edit User
                    </button>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDetailModal;