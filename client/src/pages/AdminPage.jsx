import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { adminAPI, platformAPI, ordersAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import UserDetailModal from "../components/admin/UserDetailModal";
import CreateUserModal from "../components/admin/CreateUserModal";
import OrderDetailModal from "../components/admin/OrderDetailModal";
import AdminSystemTab from "../components/admin/AdminSystemTab";
import AdminAppearanceTab from "../components/admin/AdminAppearanceTab";
import AdminStorageTab from "../components/admin/AdminStorageTab";
import { toast } from "sonner";
import { useListing } from "../hooks/useListing";
import Pagination from "../components/common/Pagination";
import Loading from "../components/common/Loading";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, ArrowRight } from "lucide-react";

// UI Components
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  DollarSign,
  Users,
  Package,
  Palette,
  HardDrive,
  Settings,
  LayoutDashboard,
  BarChart3,
  Search,
  Filter,
  Film,
  Eye,
} from "lucide-react";

const AdminPage = () => {
  const { user: currentUser, isSuperAdmin } = useAuth();
  const navigate = useNavigate();

  // Stats State
  const [stats, setStats] = useState(null);
  const [statsPeriod, setStatsPeriod] = useState("all");
  const [statsLoading, setStatsLoading] = useState(true);

  // Tab State - synced with Shadcn Tabs & URL
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(tabParam || "stats");

  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Update active tab when URL changes
  useEffect(() => {
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [tabParam, activeTab]);

  // Check for pending applications on mount
  useEffect(() => {
    adminAPI
      .getAllUsers({ artistStatus: "pending", limit: 1 })
      .then((res) => setPendingCount(res.data.pagination?.total || 0))
      .catch((err) => console.error("Failed to check pending apps", err));
  }, []);

  // Auto-open modals based on URL params
  useEffect(() => {
    const userIdParam = searchParams.get("userId");
    if (userIdParam) {
      setSelectedUserId(userIdParam);
      // Remove from URL to avoid re-opening
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete("userId");
          return next;
        },
        { replace: true },
      );
    }

    const orderIdParam = searchParams.get("orderId");
    if (orderIdParam) {
      setSelectedOrderId(orderIdParam);
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete("orderId");
          return next;
        },
        { replace: true },
      );
    }
  }, [searchParams]);

  const handleTabChange = (val, filterUpdates = null) => {
    setActiveTab(val);
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      newParams.set("tab", val);
      if (filterUpdates) {
        // If we are switching with specific filters, we might want to pass them
        // But useListing handles its own state.
        // We'll rely on updateUserFilter being called after.
      }
      return newParams;
    });

    if (filterUpdates && val === "users") {
      Object.entries(filterUpdates).forEach(([k, v]) => {
        updateUserFilter(k, v);
      });
    }
  };

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
    if (activeTab === "stats" || activeTab === "analytics") {
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
    refresh: refreshUsers,
  } = useListing({
    apiFetcher: fetchUsersWrapper,
    initialFilters: { artistStatus: "all", limit: 20, search: "" },
    initialSort: "-createdAt",
    enabled: activeTab === "users",
  });

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
    refresh: refreshOrders,
  } = useListing({
    apiFetcher: fetchOrdersWrapper,
    initialFilters: { status: "all", limit: 20 },
    enabled: activeTab === "orders",
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "EUR",
    }).format(amount || 0);
  };

  const formatBytes = (bytes) => {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getStatusColorClass = (status) => {
    switch (status) {
      case "verified":
      case "delivered":
      case "paid":
        return "bg-green-100 text-green-800 hover:bg-green-200 border-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200";
      case "suspended":
      case "cancelled":
        return "bg-red-100 text-red-800 hover:bg-red-200 border-red-200";
      case "shipped":
        return "bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200";
      default:
        return "";
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 space-y-8 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Platform-wide management for users, content, and system settings.
          </p>
        </div>
      </div>

      {pendingCount > 0 && (
        <div
          className="group relative overflow-hidden bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/50 rounded-xl p-4 cursor-pointer hover:shadow-md transition-all duration-300"
          onClick={() => handleTabChange("users", { artistStatus: "pending" })}
        >
          {/* Background Accent */}
          <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 bg-orange-200/20 dark:bg-orange-500/10 rounded-full blur-2xl group-hover:bg-orange-300/30 transition-colors" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center shrink-0">
                <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-orange-900 dark:text-orange-300">
                    Attention Needed
                  </h3>
                  <Badge className="bg-orange-500 hover:bg-orange-600 text-white border-0 h-4 px-1.5 text-[10px] animate-pulse">
                    {pendingCount} Pending
                  </Badge>
                </div>
                <p className="text-xs text-orange-800/70 dark:text-orange-400/70 mt-0.5">
                  New profile verification requests awaiting your review.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-orange-700 dark:text-orange-400 font-bold group-hover:translate-x-1 transition-transform">
              <span>Manage Applications</span>
              <ArrowRight className="h-4 w-4" />
            </div>
          </div>
        </div>
      )}

      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full space-y-6"
      >
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-7 h-auto p-1 bg-muted/30">
          <TabsTrigger value="stats" className="gap-2">
            <LayoutDashboard className="h-4 w-4" /> Stats
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" /> Users
            {pendingCount > 0 && (
              <Badge
                variant="destructive"
                className="ml-1 h-4 px-1 text-[10px]"
              >
                {pendingCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="orders" className="gap-2">
            <Package className="h-4 w-4" /> Orders
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-2">
            <Palette className="h-4 w-4" /> Appearance
          </TabsTrigger>
          <TabsTrigger value="storage" className="gap-2">
            <HardDrive className="h-4 w-4" /> Storage
          </TabsTrigger>
          {isSuperAdmin && (
            <TabsTrigger value="system" className="gap-2">
              <Settings className="h-4 w-4" /> System
            </TabsTrigger>
          )}
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="h-4 w-4" /> Analytics
          </TabsTrigger>
        </TabsList>

        {/* --- STATS TAB --- */}
        <TabsContent value="stats" className="space-y-6">
          <div className="flex items-center justify-end">
            <Select value={statsPeriod} onValueChange={setStatsPeriod}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {statsLoading ? (
            <div className="py-20 flex justify-center">
              <Loading />
            </div>
          ) : (
            stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                <Card className="bg-gradient-to-br from-background to-muted/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-bold">
                      Revenue
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold line-clamp-1">
                      {formatCurrency(stats.commission?.totalRevenue)}
                    </div>
                    <p className="text-[10px] text-muted-foreground flex items-center mt-1">
                      <DollarSign className="h-3 w-3 mr-1" /> Gross Sales
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-background to-muted/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-bold">
                      Users
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stats.users?.total || 0}
                    </div>
                    <p className="text-[10px] text-muted-foreground flex items-center mt-1">
                      <Users className="h-3 w-3 mr-1" /> Total Registered
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-background to-muted/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-bold">
                      Orders
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stats.orders?.total || 0}
                    </div>
                    <p className="text-[10px] text-muted-foreground flex items-center mt-1">
                      <Package className="h-3 w-3 mr-1" /> Transactions
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-background to-muted/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-bold">
                      Views
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stats.analytics?.totalViews || 0}
                    </div>
                    <p className="text-[10px] text-muted-foreground flex items-center mt-1">
                      <BarChart3 className="h-3 w-3 mr-1" /> Content Views
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-background to-muted/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-bold">
                      Plays
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stats.analytics?.totalPlays || 0}
                    </div>
                    <p className="text-[10px] text-muted-foreground flex items-center mt-1">
                      <Palette className="h-3 w-3 mr-1" /> Video Plays
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-background to-muted/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-bold">
                      Storage
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatBytes(stats.storage?.totalStorageUsed)}
                    </div>
                    <p className="text-[10px] text-muted-foreground flex items-center mt-1">
                      <HardDrive className="h-3 w-3 mr-1" /> Global usage
                    </p>
                  </CardContent>
                </Card>
              </div>
            )
          )}
        </TabsContent>

        {/* --- USERS TAB --- */}
        <TabsContent value="users" className="space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-muted/10 p-4 rounded-xl border border-muted/20">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, company..."
                className="pl-10 h-10"
                value={usersFilters.search}
                onChange={(e) => updateUserFilter("search", e.target.value)}
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <Select
                value={usersFilters.artistStatus || "all"}
                onValueChange={(val) => updateUserFilter("artistStatus", val)}
              >
                <SelectTrigger className="w-full md:w-40">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={() => setIsCreateModalOpen(true)}
                className="shrink-0 font-bold"
              >
                Add User
              </Button>
            </div>
          </div>

          {usersLoading ? (
            <div className="py-20 flex justify-center">
              <Loading />
            </div>
          ) : (
            <Card className="overflow-hidden border-muted/30">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/10">
                    <TableRow>
                      <TableHead>User / Artist</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Usage</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center py-10 text-muted-foreground"
                        >
                          No users found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      users.map((u) => (
                        <TableRow
                          key={u._id}
                          className="hover:bg-muted/30 cursor-pointer transition-colors"
                          onClick={() => setSelectedUserId(u._id)}
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center font-bold text-muted-foreground overflow-hidden">
                                {u.profilePicture ? (
                                  <img
                                    src={u.profilePicture}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  u.firstName?.[0]
                                )}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="font-semibold truncate">
                                  {u.firstName} {u.lastName}
                                </span>
                                <span className="text-xs text-muted-foreground truncate">
                                  {u.email}
                                </span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className="capitalize text-[10px] tracking-wide font-bold"
                            >
                              {u.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`${getStatusColorClass(u.artistStatus)} capitalize text-[10px] font-bold`}
                            >
                              {u.artistStatus}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-[10px] font-mono whitespace-nowrap">
                            {formatBytes(u.storage?.totalBytes || 0)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" className="h-8">
                              Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              {usersPagination.pages > 1 && (
                <div className="p-4 border-t bg-muted/5">
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

        {/* --- ORDERS TAB --- */}
        <TabsContent value="orders" className="space-y-4">
          <div className="flex border border-muted/20 rounded-xl p-4 bg-muted/5 mb-4">
            <Select
              value={ordersFilters.status || "all"}
              onValueChange={(val) => updateOrderFilter("status", val)}
            >
              <SelectTrigger className="w-48">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="All Orders" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Orders</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {ordersLoading ? (
            <div className="py-20 flex justify-center">
              <Loading />
            </div>
          ) : (
            <Card className="overflow-hidden border-muted/30">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/10">
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="text-center py-10 text-muted-foreground"
                        >
                          No orders found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      orders.map((o) => (
                        <TableRow
                          key={o._id}
                          className="hover:bg-muted/30 cursor-pointer transition-colors"
                          onClick={() => setSelectedOrderId(o._id)}
                        >
                          <TableCell className="font-mono text-xs uppercase font-bold text-primary">
                            {o._id.slice(-6)}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {o.user?.firstName} {o.user?.lastName}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                {o.user?.email}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`${getStatusColorClass(o.status)} text-[10px] font-bold uppercase`}
                            >
                              {o.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-bold tabular-nums">
                            {formatCurrency(o.totalAmount)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              {ordersPagination.pages > 1 && (
                <div className="p-4 border-t bg-muted/5">
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

        {/* --- MODULAR COMPONENTS --- */}
        <TabsContent
          value="appearance"
          className="animate-in fade-in slide-in-from-bottom-4 duration-300"
        >
          <AdminAppearanceTab />
        </TabsContent>
        <TabsContent
          value="storage"
          className="animate-in fade-in slide-in-from-bottom-4 duration-300"
        >
          <AdminStorageTab isSuperAdmin={isSuperAdmin} />
        </TabsContent>
        {isSuperAdmin && (
          <TabsContent
            value="system"
            className="animate-in fade-in slide-in-from-bottom-4 duration-300"
          >
            <AdminSystemTab />
          </TabsContent>
        )}

        {/* --- ANALYTICS --- */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Viewed Videos */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Film className="h-5 w-5" /> Top Viewed Videos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Video Title</TableHead>
                      <TableHead className="text-right">Views</TableHead>
                      <TableHead className="text-right">Plays</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats?.topViewedVideos?.length > 0 ? (
                      stats.topViewedVideos.map((v) => (
                        <TableRow key={v._id}>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium truncate max-w-[200px]">
                                {v.title}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                {v.artistName || v.companyName}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {v.views || 0}
                          </TableCell>
                          <TableCell className="text-right font-mono text-primary font-bold">
                            {v.plays || 0}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={3}
                          className="text-center py-6 text-muted-foreground"
                        >
                          No data available
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Top Viewed Artworks */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Palette className="h-5 w-5" /> Top Viewed Artworks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Artwork Title</TableHead>
                      <TableHead className="text-right">Views</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats?.topViewedOther?.length > 0 ? (
                      stats.topViewedOther.map((a) => (
                        <TableRow key={a._id}>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium truncate max-w-[200px]">
                                {a.title}
                              </span>
                              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                <Badge
                                  variant="outline"
                                  className="text-[8px] h-3 px-1 capitalize"
                                >
                                  {a.category}
                                </Badge>
                                {a.artistName}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {a.views || 0}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={2}
                          className="text-center py-6 text-muted-foreground"
                        >
                          No data available
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modals & Overlays */}
      {selectedUserId && (
        <UserDetailModal
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
          onUpdate={() => refreshUsers()}
        />
      )}

      {selectedOrderId && (
        <OrderDetailModal
          orderId={selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
        />
      )}

      <CreateUserModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onSuccess={refreshUsers}
        isSuperAdmin={isSuperAdmin}
      />

      <div className="h-12" />
    </div>
  );
};

export default AdminPage;
