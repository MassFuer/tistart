import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { adminAPI, ordersAPI, platformAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import UserDetailModal from "../components/admin/UserDetailModal";
import OrderDetailModal from "../components/admin/OrderDetailModal";
import ThemeEditor from "../components/admin/ThemeEditor";
import { toast } from "sonner";
import { useListing } from "../hooks/useListing";
import Pagination from "../components/common/Pagination";
import Loading from "../components/common/Loading";

// UI Components
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Search, DollarSign, Users, Package, Palette, HardDrive, Filter } from "lucide-react";

const AdminPage = () => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  // Stats State
  const [stats, setStats] = useState(null);
  const [statsPeriod, setStatsPeriod] = useState("all");
  const [statsLoading, setStatsLoading] = useState(true);

  // Tab State - synced with Shadcn Tabs
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
      toast.error("Failed to load statistics");
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
    initialFilters: { artistStatus: "all", limit: 20 },
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
      return ordersAPI.getAll(p);
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
      initialFilters: { status: "all", limit: 20 },
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

  const getStatusBadgeVariant = (status) => {
    const variants = {
      none: "secondary",
      pending: "warning", // You might need to add warning variant or use default/secondary with classes
      incomplete: "secondary",
      verified: "success", // Need success variant or use default
      suspended: "destructive",
      paid: "default", 
      shipped: "default",
      delivered: "success",
      cancelled: "destructive",
    };
    // Map to standard shadcn badge variants: default, secondary, destructive, outline
    const mapToStandard = {
        pending: "secondary", // fallback
        verified: "default", // fallback
        paid: "default",
        shipped: "secondary",
        delivered: "default",
        success: "outline", // simplified
        warning: "secondary"
    };
    return mapToStandard[status] || variants[status] || "outline";
  };
  
  const getStatusColorClass = (status) => {
      // Helper for custom colors if Shadcn badge variants aren't enough
      switch(status) {
          case 'verified':
          case 'delivered':
          case 'paid':
              return "bg-green-100 text-green-800 hover:bg-green-200 border-green-200";
          case 'pending':
              return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200";
          case 'suspended':
          case 'cancelled':
              return "bg-red-100 text-red-800 hover:bg-red-200 border-red-200";
          case 'shipped':
              return "bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200";
          default:
              return "";
      }
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-1">
                Manage users, artists, orders, and platform statistics.
            </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
        <TabsList className="grid w-full grid-cols-4 max-w-[800px]">
          <TabsTrigger value="stats">Dashboard & Stats</TabsTrigger>
          <TabsTrigger value="users">Users & Artists</TabsTrigger>
          <TabsTrigger value="orders">Orders Management</TabsTrigger>
          <TabsTrigger value="theme">Appearance</TabsTrigger>
        </TabsList>

        {/* --- STATS TAB --- */}
        <TabsContent value="stats" className="space-y-6">
          <div className="flex items-center justify-end">
            <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Time Period:</span>
                <Select value={statsPeriod} onValueChange={setStatsPeriod}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Time</SelectItem>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="week">Last 7 Days</SelectItem>
                        <SelectItem value="month">Last 30 Days</SelectItem>
                        <SelectItem value="year">Last Year</SelectItem>
                    </SelectContent>
                </Select>
            </div>
          </div>

          {statsLoading ? (
             <div className="py-20 flex justify-center"><Loading message="Loading stats..." /></div>
          ) : stats ? (
            <>
              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(stats.commission?.totalRevenue)}</div>
                    <p className="text-xs text-muted-foreground">Gross volume</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Platform Fees</CardTitle>
                    <DollarSign className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(stats.commission?.totalPlatformFees)}</div>
                    <p className="text-xs text-muted-foreground">20% Commission</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Artist Earnings</CardTitle>
                    <Palette className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(stats.commission?.totalArtistEarnings)}</div>
                    <p className="text-xs text-muted-foreground">Paid to artists</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.orders?.total || 0}</div>
                    <p className="text-xs text-muted-foreground">Processed orders</p>
                  </CardContent>
                </Card>
              </div>

              {/* Detailed Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* Users Stats */}
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5"/> User Demographics</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center border-b pb-2">
                            <span>Total Users</span>
                            <span className="font-bold">{stats.users?.total || 0}</span>
                        </div>
                        <div className="flex justify-between items-center border-b pb-2">
                            <span>New Signups ({statsPeriod})</span>
                            <span className="font-bold">{stats.users?.recentSignups || 0}</span>
                        </div>
                        <div className="space-y-2 pt-2">
                            {stats.users?.byRole?.map((r) => (
                                <div key={r._id} className="flex justify-between items-center text-sm">
                                    <span className="capitalize">{r._id}s</span>
                                    <Badge variant="secondary">{r.count}</Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                 </Card>

                 {/* Storage Stats */}
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><HardDrive className="h-5 w-5"/> Storage Usage</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center border-b pb-2">
                            <span>Total Storage Used</span>
                            <span className="font-bold">{formatBytes(stats.storage?.totalStorageUsed)}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 pt-2">
                            <div className="space-y-1">
                                <span className="text-xs text-muted-foreground">Images</span>
                                <div className="font-medium">{formatBytes(stats.storage?.totalImageBytes)}</div>
                            </div>
                            <div className="space-y-1">
                                <span className="text-xs text-muted-foreground">Videos</span>
                                <div className="font-medium">{formatBytes(stats.storage?.totalVideoBytes)}</div>
                            </div>
                            <div className="space-y-1">
                                <span className="text-xs text-muted-foreground">Total Files</span>
                                <div className="font-medium">{stats.storage?.totalFiles || 0}</div>
                            </div>
                        </div>
                    </CardContent>
                 </Card>
              </div>
              
              {/* Top Performers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                      <CardHeader>
                          <CardTitle>Top Selling Artists</CardTitle>
                      </CardHeader>
                      <CardContent>
                          {stats.topArtists?.length > 0 ? (
                              <Table>
                                  <TableHeader>
                                      <TableRow>
                                          <TableHead>Artist</TableHead>
                                          <TableHead className="text-right">Sales</TableHead>
                                      </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                      {stats.topArtists.map((artist) => (
                                          <TableRow 
                                            key={artist.artistId}
                                            className="cursor-pointer hover:bg-muted/50"
                                            onClick={() => navigate(`/artists/${artist.artistId}`)}
                                          >
                                              <TableCell className="font-medium hover:underline hover:text-primary transition-colors">
                                                  {artist.companyName || artist.artistName}
                                              </TableCell>
                                              <TableCell className="text-right">{formatCurrency(artist.totalSales)}</TableCell>
                                          </TableRow>
                                      ))}
                                  </TableBody>
                              </Table>
                          ) : <p className="text-sm text-muted-foreground">No data available.</p>}
                      </CardContent>
                  </Card>
                   <Card>
                      <CardHeader>
                          <CardTitle>Top Artworks</CardTitle>
                      </CardHeader>
                      <CardContent>
                          {stats.topArtworks?.length > 0 ? (
                              <Table>
                                  <TableHeader>
                                      <TableRow>
                                          <TableHead>Title</TableHead>
                                          <TableHead className="text-right">Revenue</TableHead>
                                      </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                      {stats.topArtworks.map((artwork) => (
                                          <TableRow 
                                            key={artwork.artworkId}
                                            className="cursor-pointer hover:bg-muted/50"
                                            onClick={() => navigate(`/artworks/${artwork.artworkId}`)}
                                          >
                                              <TableCell className="font-medium truncate max-w-[150px] hover:underline hover:text-primary transition-colors">
                                                  {artwork.title}
                                              </TableCell>
                                              <TableCell className="text-right">{formatCurrency(artwork.totalSales)}</TableCell>
                                          </TableRow>
                                      ))}
                                  </TableBody>
                              </Table>
                          ) : <p className="text-sm text-muted-foreground">No data available.</p>}
                      </CardContent>
                  </Card>
              </div>

            </>
          ) : (
            <div className="text-center py-12 text-muted-foreground">Failed to load statistics</div>
          )}
        </TabsContent>

        {/* --- USERS TAB --- */}
        <TabsContent value="users" className="space-y-4">
             <div className="flex items-center gap-4 bg-background p-4 rounded-lg border">
                 <Filter className="h-4 w-4 text-muted-foreground" />
                 <span className="text-sm font-medium">Filter by Status:</span>
                 <Select 
                    value={usersFilters.artistStatus || "all"} 
                    onValueChange={(val) => updateUserFilter("artistStatus", val)}
                 >
                    <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="All Users" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Users</SelectItem>
                        {artistStatuses.map((status) => (
                            <SelectItem key={status} value={status}>
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                            </SelectItem>
                        ))}
                    </SelectContent>
                 </Select>
                 
                 {users && (
                     <div className="ml-auto text-sm text-muted-foreground">
                         Showing {users.length} of {usersPagination.total} users
                     </div>
                 )}
             </div>

             {usersLoading ? (
                 <div className="py-20 flex justify-center"><Loading message="Loading users..." /></div>
             ) : (
                 <Card>
                     <Table>
                         <TableHeader>
                             <TableRow>
                                 <TableHead>User</TableHead>
                                 <TableHead>Role</TableHead>
                                 <TableHead>Status</TableHead>
                                 <TableHead>Company</TableHead>
                                 <TableHead>Actions</TableHead>
                             </TableRow>
                         </TableHeader>
                         <TableBody>
                             {users.length === 0 ? (
                                 <TableRow>
                                     <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                         No users found.
                                     </TableCell>
                                 </TableRow>
                             ) : (
                                 users.map((user) => (
                                    <TableRow key={user._id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                                                    {user.profilePicture ? (
                                                        <img src={user.profilePicture} alt="" className="h-full w-full object-cover"/>
                                                    ) : (
                                                        <span className="text-xs font-bold">
                                                            {user.firstName?.[0]}{user.lastName?.[0]}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span 
                                                        className="font-medium hover:underline cursor-pointer"
                                                        onClick={() => setSelectedUserId(user._id)}
                                                    >
                                                        {user.firstName} {user.lastName}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">{user.email}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Select 
                                                value={user.role} 
                                                onValueChange={(val) => handleRoleChange(user._id, val)}
                                            >
                                                <SelectTrigger className="w-[110px] h-8">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {roles.map((role) => (
                                                        <SelectItem key={role} value={role}>{role}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={getStatusColorClass(user.artistStatus)}>
                                                {user.artistStatus}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {user.artistInfo?.companyName || <span className="text-muted-foreground">-</span>}
                                        </TableCell>
                                        <TableCell>
                                            {user.role === "artist" || user.artistStatus !== "none" ? (
                                                <Select 
                                                    value={user.artistStatus} 
                                                    onValueChange={(val) => handleStatusChange(user._id, val)}
                                                >
                                                    <SelectTrigger className="w-[120px] h-8">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {artistStatuses.map((status) => (
                                                            <SelectItem key={status} value={status}>{status}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            ) : (
                                                <span className="text-muted-foreground text-sm">-</span>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                 ))
                             )}
                         </TableBody>
                     </Table>
                     
                     {usersPagination.pages > 1 && (
                         <div className="p-4 border-t">
                            <Pagination
                                currentPage={usersPagination.page}
                                totalPages={usersPagination.pages}
                                onPageChange={setUsersPage}
                            />
                         </div>
                     )}
                 </Card>
             )}
        </TabsContent>

        {/* --- THEME TAB --- */}
        <TabsContent value="theme">
             <div className="max-w-2xl mx-auto">
                 <ThemeEditor />
             </div>
        </TabsContent>

        {/* --- ORDERS TAB --- */}
        <TabsContent value="orders" className="space-y-4">
             <div className="flex items-center gap-4 bg-background p-4 rounded-lg border">
                 <Filter className="h-4 w-4 text-muted-foreground" />
                 <span className="text-sm font-medium">Filter by Status:</span>
                 <Select 
                    value={ordersFilters.status || "all"} 
                    onValueChange={(val) => updateOrderFilter("status", val)}
                 >
                    <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="All Orders" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Orders</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="shipped">Shipped</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                 </Select>
             </div>

             {ordersLoading ? (
                 <div className="py-20 flex justify-center"><Loading message="Loading orders..." /></div>
             ) : (
                 <Card>
                     <Table>
                         <TableHeader>
                             <TableRow>
                                 <TableHead>Order ID</TableHead>
                                 <TableHead>Customer</TableHead>
                                 <TableHead>Date</TableHead>
                                 <TableHead>Status</TableHead>
                                 <TableHead className="text-right">Total</TableHead>
                             </TableRow>
                         </TableHeader>
                         <TableBody>
                             {orders.length === 0 ? (
                                 <TableRow>
                                     <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                         No orders found.
                                     </TableCell>
                                 </TableRow>
                             ) : (
                                 orders.map((order) => (
                                     <TableRow 
                                        key={order._id}
                                        className="cursor-pointer hover:bg-muted/50"
                                        onClick={() => setSelectedOrderId(order._id)}
                                     >
                                         <TableCell className="font-mono text-xs">{order._id.slice(-6).toUpperCase()}</TableCell>
                                         <TableCell>
                                             <div className="flex flex-col">
                                                 <span className="font-medium">{order.user?.firstName} {order.user?.lastName}</span>
                                                 <span className="text-xs text-muted-foreground">{order.user?.email}</span>
                                             </div>
                                         </TableCell>
                                         <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                                         <TableCell>
                                             <Badge variant="outline" className={getStatusColorClass(order.status)}>
                                                 {order.status}
                                             </Badge>
                                         </TableCell>
                                         <TableCell className="text-right font-medium">
                                             {formatCurrency(order.totalAmount)}
                                         </TableCell>
                                     </TableRow>
                                 ))
                             )}
                         </TableBody>
                     </Table>
                     
                     {ordersPagination.pages > 1 && (
                         <div className="p-4 border-t">
                            <Pagination
                                currentPage={ordersPagination.page}
                                totalPages={ordersPagination.pages}
                                onPageChange={setOrdersPage}
                            />
                         </div>
                     )}
                 </Card>
             )}
        </TabsContent>
      </Tabs>

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
