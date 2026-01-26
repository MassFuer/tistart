import { useState, useEffect, useCallback } from "react";
import { adminAPI, apiOrders, platformAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import UserDetailModal from "../components/admin/UserDetailModal";
import OrderDetailModal from "../components/admin/OrderDetailModal";
import toast from "react-hot-toast";
import { useListing } from "../hooks/useListing";
import Pagination from "../components/common/Pagination";
import Loading from "../components/common/Loading";
import "./AdminPage.css";

const AdminPage = () => {
  const { user: currentUser } = useAuth();

  // Stats State
  const [stats, setStats] = useState(null);
  const [statsPeriod, setStatsPeriod] = useState("all");
  const [statsLoading, setStatsLoading] = useState(true);

  const [activeTab, setActiveTab] = useState("stats");
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  const isSuperAdmin = currentUser?.role === "superAdmin";
  const artistStatuses = ["none", "pending", "incomplete", "verified", "suspended"];
  const roles = isSuperAdmin ? ["user", "artist", "admin", "superAdmin"] : ["user", "artist", "admin"];

  // --- STATS LOGIC ---
  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const response = await platformAPI.getStats(statsPeriod);
      setStats(response.data.data);
    } catch (error) {
      console.error("Failed to load stats:", error);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "stats") {
      fetchStats();
    }
  }, [statsPeriod, activeTab]);

  // --- USERS LISTING ---
  const fetchUsersWrapper = useCallback((params) => {
    const p = { ...params };
    if (p.artistStatus === "all") delete p.artistStatus;
    return adminAPI.getAllUsers(p);
  }, []);

  const {
    data: users,
    loading: usersLoading,
    pagination: usersPagination,
    filters: usersFilters,
    updateFilter: updateUserFilter,
    setPage: setUsersPage,
    refresh: refreshUsers
  } = useListing({
    apiFetcher: fetchUsersWrapper,
    initialFilters: { artistStatus: "all", limit: 50 },
    enabled: activeTab === "users",
  });

  const handleStatusChange = async (userId, newStatus) => {
    try {
      await adminAPI.updateArtistStatus(userId, newStatus);
      toast.success("Artist status updated");
      refreshUsers();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await adminAPI.updateUserRole(userId, newRole);
      toast.success("User role updated");
      refreshUsers();
    } catch (error) {
      toast.error("Failed to update role");
    }
  };

  // --- ORDERS LISTING ---
  const fetchOrdersWrapper = useCallback((params) => {
      const p = { ...params };
      if (p.status === "all") delete p.status;
      return apiOrders.getAll(p);
  }, []);

  const {
      data: orders,
      loading: ordersLoading,
      pagination: ordersPagination,
      filters: ordersFilters,
      updateFilter: updateOrderFilter,
      setPage: setOrdersPage,
      refresh: refreshOrders
  } = useListing({
      apiFetcher: fetchOrdersWrapper,
      initialFilters: { status: "all", limit: 50 },
      enabled: activeTab === "orders",
  });

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "EUR",
    }).format(amount || 0);
  };

  // Format bytes to human readable
  const formatBytes = (bytes) => {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getStatusBadgeClass = (status) => {
    const classes = {
      none: "status-none",
      pending: "status-pending",
      incomplete: "status-incomplete",
      verified: "status-verified",
      suspended: "status-suspended",
      paid: "status-verified", // Reuse for orders
      shipped: "status-verified",
      delivered: "status-verified",
      cancelled: "status-suspended",
    };
    return classes[status] || "status-none";
  };

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>Admin Dashboard</h1>
        <div className="admin-tabs">
            <button
                className={`tab-btn ${activeTab === "stats" ? "active" : ""}`}
                onClick={() => setActiveTab("stats")}
            >
                Dashboard
            </button>
            <button
                className={`tab-btn ${activeTab === "users" ? "active" : ""}`}
                onClick={() => setActiveTab("users")}
            >
                Users & Artists
            </button>
            <button
                className={`tab-btn ${activeTab === "orders" ? "active" : ""}`}
                onClick={() => setActiveTab("orders")}
            >
                Orders
            </button>
        </div>
      </div>

      {activeTab === "stats" && (
        <div className="stats-dashboard">
          {/* Period Selector */}
          <div className="stats-period-selector">
            <label>Time Period:</label>
            <select
              value={statsPeriod}
              onChange={(e) => setStatsPeriod(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="year">Last Year</option>
            </select>
          </div>

          {statsLoading ? (
            <Loading message="Loading stats..." />
          ) : stats ? (
            <>
              {/* KPI Cards Row */}
              <div className="kpi-grid">
                <div className="kpi-card kpi-revenue">
                  <div className="kpi-icon">💰</div>
                  <div className="kpi-content">
                    <span className="kpi-label">Total Revenue</span>
                    <span className="kpi-value">{formatCurrency(stats.commission?.totalRevenue)}</span>
                  </div>
                </div>

                <div className="kpi-card kpi-commission">
                  <div className="kpi-icon">📊</div>
                  <div className="kpi-content">
                    <span className="kpi-label">Platform Fees (20%)</span>
                    <span className="kpi-value">{formatCurrency(stats.commission?.totalPlatformFees)}</span>
                  </div>
                </div>

                <div className="kpi-card kpi-artists">
                  <div className="kpi-icon">🎨</div>
                  <div className="kpi-content">
                    <span className="kpi-label">Artist Earnings</span>
                    <span className="kpi-value">{formatCurrency(stats.commission?.totalArtistEarnings)}</span>
                  </div>
                </div>

                <div className="kpi-card kpi-orders">
                  <div className="kpi-icon">📦</div>
                  <div className="kpi-content">
                    <span className="kpi-label">Total Orders</span>
                    <span className="kpi-value">{stats.orders?.total || 0}</span>
                  </div>
                </div>
              </div>

              {/* Secondary Stats */}
              <div className="stats-grid">
                {/* Users Stats */}
                <div className="stats-card">
                  <h3>👥 Users</h3>
                  <div className="stats-card-content">
                    <div className="stat-row">
                      <span>Total Users</span>
                      <strong>{stats.users?.total || 0}</strong>
                    </div>
                    <div className="stat-row">
                      <span>New Signups ({statsPeriod})</span>
                      <strong>{stats.users?.recentSignups || 0}</strong>
                    </div>
                    <div className="stat-row-divider" />
                    {stats.users?.byRole?.map((r) => (
                      <div className="stat-row" key={r._id}>
                        <span>{r._id}</span>
                        <span className="stat-badge">{r.count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Artworks Stats */}
                <div className="stats-card">
                  <h3>🖼️ Artworks</h3>
                  <div className="stats-card-content">
                    <div className="stat-row">
                      <span>Total Artworks</span>
                      <strong>{stats.artworks?.total || 0}</strong>
                    </div>
                    <div className="stat-row">
                      <span>For Sale</span>
                      <strong>{stats.artworks?.forSale || 0}</strong>
                    </div>
                    <div className="stat-row">
                      <span>Total Value</span>
                      <strong>{formatCurrency(stats.artworks?.totalValue)}</strong>
                    </div>
                    <div className="stat-row-divider" />
                    {stats.artworks?.byCategory?.slice(0, 5).map((c) => (
                      <div className="stat-row" key={c._id}>
                        <span>{c._id}</span>
                        <span className="stat-badge">{c.count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Events Stats */}
                <div className="stats-card">
                  <h3>📅 Events</h3>
                  <div className="stats-card-content">
                    <div className="stat-row">
                      <span>Total Events</span>
                      <strong>{stats.events?.total || 0}</strong>
                    </div>
                    <div className="stat-row">
                      <span>Upcoming</span>
                      <strong>{stats.events?.upcoming || 0}</strong>
                    </div>
                    <div className="stat-row">
                      <span>Total Attendees</span>
                      <strong>{stats.events?.totalAttendees || 0}</strong>
                    </div>
                  </div>
                </div>

                {/* Storage Stats */}
                <div className="stats-card">
                  <h3>💾 Storage</h3>
                  <div className="stats-card-content">
                    <div className="stat-row">
                      <span>Total Used</span>
                      <strong>{formatBytes(stats.storage?.totalStorageUsed)}</strong>
                    </div>
                    <div className="stat-row">
                      <span>Images</span>
                      <strong>{formatBytes(stats.storage?.totalImageBytes)}</strong>
                    </div>
                    <div className="stat-row">
                      <span>Videos</span>
                      <strong>{formatBytes(stats.storage?.totalVideoBytes)}</strong>
                    </div>
                    <div className="stat-row">
                      <span>Total Files</span>
                      <strong>{stats.storage?.totalFiles || 0}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Top Performers Section */}
              <div className="top-performers">
                {/* Top Artists */}
                <div className="top-card">
                  <h3>🏆 Top Selling Artists</h3>
                  {stats.topArtists?.length > 0 ? (
                    <table className="top-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Artist</th>
                          <th>Sales</th>
                          <th>Orders</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.topArtists.map((artist, index) => (
                          <tr key={artist.artistId}>
                            <td>{index + 1}</td>
                            <td>{artist.companyName || artist.artistName}</td>
                            <td>{formatCurrency(artist.totalSales)}</td>
                            <td>{artist.orderCount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="no-data">No sales data yet</p>
                  )}
                </div>

                {/* Top Artworks */}
                <div className="top-card">
                  <h3>🎯 Top Selling Artworks</h3>
                  {stats.topArtworks?.length > 0 ? (
                    <table className="top-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Artwork</th>
                          <th>Artist</th>
                          <th>Units</th>
                          <th>Revenue</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.topArtworks.map((artwork, index) => (
                          <tr key={artwork.artworkId}>
                            <td>{index + 1}</td>
                            <td className="artwork-title">{artwork.title}</td>
                            <td>{artwork.artistName}</td>
                            <td>{artwork.unitsSold}</td>
                            <td>{formatCurrency(artwork.totalSales)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="no-data">No sales data yet</p>
                  )}
                </div>
              </div>

              {/* Revenue by Month */}
              {stats.revenueByMonth?.length > 0 && (
                <div className="revenue-history">
                  <h3>📈 Revenue History (Last 12 Months)</h3>
                  <table className="revenue-table">
                    <thead>
                      <tr>
                        <th>Month</th>
                        <th>Orders</th>
                        <th>Revenue</th>
                        <th>Platform Fees</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.revenueByMonth.map((month) => (
                        <tr key={`${month._id.year}-${month._id.month}`}>
                          <td>
                            {new Date(month._id.year, month._id.month - 1).toLocaleDateString("en-US", {
                              month: "short",
                              year: "numeric",
                            })}
                          </td>
                          <td>{month.orderCount}</td>
                          <td>{formatCurrency(month.revenue)}</td>
                          <td>{formatCurrency(month.platformFees)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : (
            <div className="no-data">Failed to load statistics</div>
          )}
        </div>
      )}

      {activeTab === "users" && (
      <>
      {usersLoading ? (
        <Loading message="Loading users..." />
      ) : (
      <>
      <div className="admin-filters">
        <label>Filter by artist status:</label>
        <select
          value={usersFilters.artistStatus}
          onChange={(e) => updateUserFilter("artistStatus", e.target.value)}
          className="filter-select"
        >
          <option value="all">All Users</option>
          {artistStatuses.map((status) => (
            <option key={status} value={status}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div className="stats-bar">
        <span>Total: {users.length} users</span>
        <span>Pending: {users.filter((u) => u.artistStatus === "pending").length}</span>
        <span>Verified: {users.filter((u) => u.artistStatus === "verified").length}</span>
      </div>

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Role</th>
              <th>Artist Status</th>
              <th>Company</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id}>
                <td>
                  <button
                    className="user-cell user-cell-link"
                    onClick={() => setSelectedUserId(user._id)}
                    title="Click to view/edit user details"
                  >
                    <div className="user-avatar-small">
                      {user.profilePicture ? (
                        <img src={user.profilePicture} alt={user.firstName} />
                      ) : (
                        <span>
                          {user.firstName?.[0]}
                          {user.lastName?.[0]}
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="user-name">
                        {user.firstName} {user.lastName}
                      </span>
                      <span className="user-username">@{user.userName}</span>
                    </div>
                  </button>
                </td>
                <td>{user.email}</td>
                <td>
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user._id, e.target.value)}
                    className="role-select"
                  >
                    {roles.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <span className={`status-badge ${getStatusBadgeClass(user.artistStatus)}`}>
                    {user.artistStatus}
                  </span>
                </td>
                <td>{user.artistInfo?.companyName || "-"}</td>
                <td>
                  {user.role === "artist" || user.artistStatus !== "none" ? (
                    <select
                      value={user.artistStatus}
                      onChange={(e) => handleStatusChange(user._id, e.target.value)}
                      className="status-select"
                    >
                      {artistStatuses.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="no-action">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {users.length === 0 && (
        <div className="empty-state">
          <p>No users found</p>
        </div>
      )}
      <Pagination
        currentPage={usersPagination.page}
        totalPages={usersPagination.pages}
        onPageChange={setUsersPage}
      />
      </>
      )}
      </>
      )}

      {activeTab === "orders" && (
        <>
        {ordersLoading ? (
            <Loading message="Loading orders..." />
        ) : (
        <>
            <div className="admin-filters">
                <label>Filter by order status:</label>
                <select
                  value={ordersFilters.status}
                  onChange={(e) => updateOrderFilter("status", e.target.value)}
                  className="filter-select"
                >
                    <option value="all">All Orders</option>
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                </select>
            </div>
            
            <div className="users-table-container">
            <table className="users-table">
                <thead>
                    <tr>
                        <th>Order ID</th>
                        <th>Customer</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Total</th>
                        <th>Items</th>
                    </tr>
                </thead>
                <tbody>
                    {orders.map(order => (
                        <tr
                          key={order._id}
                          className="order-row-clickable"
                          onClick={() => setSelectedOrderId(order._id)}
                          title="Click to view order details"
                        >
                            <td className="font-mono">{order._id.slice(-6).toUpperCase()}</td>
                            <td>
                                <div>{order.user?.firstName} {order.user?.lastName}</div>
                                <div className="text-sm text-gray-500">{order.user?.email}</div>
                            </td>
                            <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                            <td>
                                <span className={`status-badge ${getStatusBadgeClass(order.status)}`}>
                                    {order.status}
                                </span>
                            </td>
                            <td>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR' }).format(order.totalAmount)}</td>
                            <td>{order.items.reduce((acc, item) => acc + item.quantity, 0)} items</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            </div>
             {orders.length === 0 && (
                <div className="empty-state">
                <p>No orders found</p>
                </div>
            )}
            <Pagination
                currentPage={ordersPagination.page}
                totalPages={ordersPagination.pages}
                onPageChange={setOrdersPage}
            />
        </>
        )}
        </>
      )}

      {/* User Detail Modal */}
      {selectedUserId && (
        <UserDetailModal
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
          onUpdate={() => refreshUsers()}
          onDelete={() => refreshUsers()}
        />
      )}

      {/* Order Detail Modal */}
      {selectedOrderId && (
        <OrderDetailModal
          orderId={selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
          onUpdate={() => refreshOrders()}
        />
      )}
    </div>
  );
};

export default AdminPage;
