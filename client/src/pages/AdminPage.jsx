import { useState, useEffect, useCallback, Fragment } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  adminAPI,
  ordersAPI,
  platformAPI,
  messagingAPI,
} from "../services/api";
import { useAuth } from "../context/AuthContext";
import UserDetailModal from "../components/admin/UserDetailModal";
import CreateUserModal from "../components/admin/CreateUserModal";
import OrderDetailModal from "../components/admin/OrderDetailModal";
import ThemeEditor from "../components/admin/ThemeEditor";
import { toast } from "sonner";
import { useListing } from "../hooks/useListing";
import Pagination from "../components/common/Pagination";
import Loading from "../components/common/Loading";

// UI Components
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  Search,
  DollarSign,
  Users,
  Package,
  Palette,
  HardDrive,
  Filter,
  Eye,
  AlertTriangle,
  CheckCircle,
  XCircle,
  MessageCircle,
  Plus,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Layers,
  ChevronRight,
  ChevronDown,
  Maximize2,
  Minimize2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useTableGrouping } from "../hooks/useTableGrouping";
import TableGroupingControls from "../components/common/TableGroupingControls";

const AdminPage = () => {
  const { user: currentUser } = useAuth();
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

  const isSuperAdmin = currentUser?.role === "superAdmin";
  const artistStatuses = [
    "none",
    "pending",
    "incomplete",
    "verified",
    "suspended",
  ];
  const roles = isSuperAdmin
    ? ["user", "artist", "admin", "superAdmin"]
    : ["user", "artist", "admin"];

  // Update active tab when URL changes
  useEffect(() => {
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // Auto-open user detail modal if userId is in URL
  useEffect(() => {
    const userIdParam = searchParams.get("userId");
    if (userIdParam && activeTab === "users") {
      setSelectedUserId(userIdParam);
      // Remove userId from URL after opening modal
      setSearchParams((prev) => {
        const newParams = new URLSearchParams(prev);
        newParams.delete("userId");
        return newParams;
      });
    }
  }, [searchParams, activeTab]);

  // Check for pending applications
  useEffect(() => {
    // We check this periodically or when users tab is active to show the alert
    if (activeTab === "users" || activeTab === "stats") {
      adminAPI
        .getAllUsers({ artistStatus: "pending", limit: 1 })
        .then((res) => setPendingCount(res.data.pagination?.total || 0))
        .catch((err) => console.error("Failed to check pending apps", err));
    }
  }, [activeTab, stats]); // Re-check when stats refresh or tab changes

  // Update URL when active tab changes
  const handleTabChange = (val) => {
    // Save current scroll position
    const scrollY = window.scrollY;

    setActiveTab(val);
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      newParams.set("tab", val);
      return newParams;
    });

    // Restore scroll position after URL update
    // Use requestAnimationFrame to ensure DOM has updated
    requestAnimationFrame(() => {
      window.scrollTo(0, scrollY);
    });
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
    sort: userSort,
    setSort: setUserSort,
  } = useListing({
    apiFetcher: fetchUsersWrapper,
    initialFilters: { artistStatus: "all", limit: 20, search: "" },
    initialSort: "-createdAt",
    enabled: activeTab === "users",
  });

  const handleUserSort = (column) => {
    if (userSort === column) {
      setUserSort(`-${column}`);
    } else if (userSort === `-${column}`) {
      setUserSort(column);
    } else {
      setUserSort(`-${column}`); // Default to desc
    }
  };

  const getSortIcon = (currentSort, column) => {
    if (currentSort === column) return <ArrowUp className="ml-1 h-3 w-3" />;
    if (currentSort === `-${column}`)
      return <ArrowDown className="ml-1 h-3 w-3" />;
    return <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />;
  };

  const {
    groupBy,
    setGroupBy,
    groupedData: groupedUsers,
    expandedGroups,
    toggleGroup,
    expandAll,
    collapseAll,
  } = useTableGrouping(users);

  const groupOptions = [
    { label: "None", value: null },
    { label: "Role", value: "role" },
    { label: "Status", value: "artistStatus" },
    { label: "Company", value: "artistInfo.companyName" },
    { label: "City", value: "artistInfo.address.city" },
    { label: "Country", value: "artistInfo.address.country" },
  ];

  const renderUserRow = (user) => (
    <TableRow key={user._id} className="border-b-0 hover:bg-muted/30">
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
            {user.profilePicture ? (
              <img
                src={user.profilePicture}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-xs font-bold">
                {user.firstName?.[0]}
                {user.lastName?.[0]}
              </span>
            )}
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span
                className="font-medium hover:underline cursor-pointer"
                onClick={() => setSelectedUserId(user._id)}
              >
                {user.firstName} {user.lastName}
              </span>
              {["admin", "superAdmin"].includes(user.role) && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 text-muted-foreground hover:text-primary"
                  asChild
                >
                  <Link to={`/artist/${user._id}`} title="View Public Profile">
                    <Eye className="h-3 w-3" />
                  </Link>
                </Button>
              )}
            </div>
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
              <SelectItem key={role} value={role}>
                {role}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        <Badge
          variant="outline"
          className={getStatusColorClass(user.artistStatus)}
        >
          {user.artistStatus}
        </Badge>
      </TableCell>
      <TableCell>
        <span className="text-xs text-muted-foreground">
          {formatBytes(user.storage?.totalBytes || 0)}
        </span>
      </TableCell>
      <TableCell>
        {user.artistInfo?.companyName || (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>
      <TableCell>
        {user.artistStatus === "pending" ? (
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              className="h-8 w-8 bg-green-600 hover:bg-green-700 text-white border-0"
              onClick={() => handleStatusChange(user._id, "verified")}
              title="Approve"
            >
              <CheckCircle className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="destructive"
              className="h-8 w-8"
              onClick={() => handleStatusChange(user._id, "incomplete")}
              title="Reject"
            >
              <XCircle className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              className="h-8 w-8 bg-amber-500 hover:bg-amber-600 text-white border-0"
              onClick={() => handleContact(user._id)}
              title="Request Info"
            >
              <AlertTriangle className="h-4 w-4" />
            </Button>
          </div>
        ) : user.role === "artist" || user.artistStatus !== "none" ? (
          <Select
            value={user.artistStatus}
            onValueChange={(val) => handleStatusChange(user._id, val)}
          >
            <SelectTrigger className="w-[120px] h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {artistStatuses.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        )}
      </TableCell>
    </TableRow>
  );

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
    refresh: refreshOrders,
  } = useListing({
    apiFetcher: fetchOrdersWrapper,
    initialFilters: { status: "all", limit: 20 },
    enabled: activeTab === "orders",
  });

  // --- STORAGE LISTING (SuperAdmin) ---
  const fetchStorageWrapper = useCallback((params) => {
    return platformAPI.getStorageUsage(params);
  }, []);

  const {
    data: storageUsers,
    loading: storageLoading,
    pagination: storagePagination,
    filters: storageFilters,
    updateFilter: updateStorageFilter,
    setPage: setStoragePage,
  } = useListing({
    apiFetcher: fetchStorageWrapper,
    initialFilters: { limit: 20, sort: "storage.totalBytes", order: "desc" },
    enabled: activeTab === "storage" && isSuperAdmin,
  });

  const handleStorageSort = (column) => {
    const currentSort = storageFilters.sort;
    const currentOrder = storageFilters.order || "desc";
    const newOrder =
      currentSort === column && currentOrder === "desc" ? "asc" : "desc";

    updateStorageFilter({ sort: column, order: newOrder });
  };

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
      warning: "secondary",
    };
    return mapToStandard[status] || variants[status] || "outline";
  };

  const getStatusColorClass = (status) => {
    // Helper for custom colors if Shadcn badge variants aren't enough
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

  const handleContact = async (userId) => {
    try {
      const res = await messagingAPI.createConversation({
        participants: [userId],
      });
      navigate(`/messages?conversation=${res.data.data._id}`);
    } catch (error) {
      console.error("Start chat error", error);
      toast.error("Failed to start conversation");
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Panel</h1>
          <p className="text-muted-foreground mt-1">
            Manage users, artists, orders, and platform statistics.
          </p>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full space-y-6"
      >
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-6 h-auto">
          <TabsTrigger value="stats">Dashboard & Stats</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="users">
            <span className="flex items-center gap-2">
              Users & Artists
              {pendingCount > 0 && (
                <Badge variant="destructive" className="h-5 px-1.5 text-xs">
                  {pendingCount}
                </Badge>
              )}
            </span>
          </TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="theme">Appearance</TabsTrigger>
          {isSuperAdmin && <TabsTrigger value="storage">Storage</TabsTrigger>}
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
            <div className="py-20 flex justify-center">
              <Loading message="Loading stats..." />
            </div>
          ) : stats ? (
            <>
              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Revenue
                    </CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(stats.commission?.totalRevenue)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Gross volume
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Platform Fees
                    </CardTitle>
                    <DollarSign className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(stats.commission?.totalPlatformFees)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      20% Commission
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Artist Earnings
                    </CardTitle>
                    <Palette className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(stats.commission?.totalArtistEarnings)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Paid to artists
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Orders
                    </CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stats.orders?.total || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Processed orders
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Detailed Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Users Stats */}
                <Card
                  className="cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => handleTabChange("users")}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" /> User Demographics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center border-b pb-2">
                      <span>Total Users</span>
                      <span className="font-bold">
                        {stats.users?.total || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center border-b pb-2">
                      <span>New Signups ({statsPeriod})</span>
                      <span className="font-bold">
                        {stats.users?.recentSignups || 0}
                      </span>
                    </div>
                    <div className="space-y-2 pt-2">
                      {stats.users?.byRole?.map((r) => (
                        <div
                          key={r._id}
                          className="flex justify-between items-center text-sm"
                        >
                          <span className="capitalize">{r._id}s</span>
                          <Badge variant="secondary">{r.count}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Storage Stats */}
                <Card
                  className={
                    isSuperAdmin
                      ? "cursor-pointer hover:border-primary/50 transition-colors"
                      : ""
                  }
                  onClick={() => isSuperAdmin && handleTabChange("storage")}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <HardDrive className="h-5 w-5" /> Storage Usage
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center border-b pb-2">
                      <span>Total Storage Used</span>
                      <span className="font-bold">
                        {formatBytes(stats.storage?.totalStorageUsed)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div className="space-y-1">
                        <span className="text-xs text-muted-foreground">
                          Images
                        </span>
                        <div className="font-medium">
                          {formatBytes(stats.storage?.totalImageBytes)}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-muted-foreground">
                          Videos
                        </span>
                        <div className="font-medium">
                          {formatBytes(stats.storage?.totalVideoBytes)}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-muted-foreground">
                          Total Files
                        </span>
                        <div className="font-medium">
                          {stats.storage?.totalFiles || 0}
                        </div>
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
                              onClick={() =>
                                navigate(`/artists/${artist.artistId}`)
                              }
                            >
                              <TableCell className="font-medium hover:underline hover:text-primary transition-colors">
                                {artist.companyName || artist.artistName}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(artist.totalSales)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No data available.
                      </p>
                    )}
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
                            <TableHead className="text-right">
                              Revenue
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {stats.topArtworks.map((artwork) => (
                            <TableRow
                              key={artwork.artworkId}
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() =>
                                navigate(`/artworks/${artwork.artworkId}`)
                              }
                            >
                              <TableCell className="font-medium truncate max-w-[150px] hover:underline hover:text-primary transition-colors">
                                {artwork.title}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(artwork.totalSales)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No data available.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              Failed to load statistics
            </div>
          )}
        </TabsContent>

        {/* --- USERS TAB --- */}
        <TabsContent value="users" className="space-y-4">
          {pendingCount > 0 && usersFilters.artistStatus !== "pending" && (
            <div
              className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-900 dark:text-yellow-200 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg flex items-center gap-3 cursor-pointer hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors mb-4"
              onClick={() => updateUserFilter("artistStatus", "pending")}
            >
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              <div>
                <p className="font-semibold">Action Required</p>
                <p className="text-sm">
                  You have {pendingCount} pending artist application
                  {pendingCount !== 1 ? "s" : ""}. Click here to review them.
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 bg-background p-4 rounded-lg border">
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Create User
            </Button>

            <TableGroupingControls
              groupBy={groupBy}
              setGroupBy={setGroupBy}
              options={groupOptions}
              onExpandAll={expandAll}
              onCollapseAll={collapseAll}
            />

            <div className="relative w-full md:w-auto">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={usersFilters.search || ""}
                onChange={(e) => updateUserFilter("search", e.target.value)}
                className="pl-8 w-full md:w-[300px]"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Status:</span>
              <Select
                value={usersFilters.artistStatus || "all"}
                onValueChange={(val) => updateUserFilter("artistStatus", val)}
              >
                <SelectTrigger className="w-[150px]">
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
            </div>

            {users && (
              <div className="ml-auto text-sm text-muted-foreground">
                Showing {users.length} of {usersPagination.total} users
              </div>
            )}
          </div>

          {usersLoading ? (
            <div className="py-20 flex justify-center">
              <Loading message="Loading users..." />
            </div>
          ) : (
            <Card>
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow className="border-b-0 hover:bg-transparent">
                    <TableHead
                      className="cursor-pointer hover:text-foreground dark:hover:text-white transition-colors"
                      onClick={() => handleUserSort("lastName")}
                    >
                      <div className="flex items-center">
                        User {getSortIcon(userSort, "lastName")}
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:text-foreground dark:hover:text-white transition-colors"
                      onClick={() => handleUserSort("role")}
                    >
                      <div className="flex items-center">
                        Role {getSortIcon(userSort, "role")}
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:text-foreground dark:hover:text-white transition-colors"
                      onClick={() => handleUserSort("artistStatus")}
                    >
                      <div className="flex items-center">
                        Status {getSortIcon(userSort, "artistStatus")}
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:text-foreground dark:hover:text-white transition-colors"
                      onClick={() => handleUserSort("storage.totalBytes")}
                    >
                      <div className="flex items-center">
                        Storage {getSortIcon(userSort, "storage.totalBytes")}
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:text-foreground dark:hover:text-white transition-colors"
                      onClick={() => handleUserSort("artistInfo.companyName")}
                    >
                      <div className="flex items-center">
                        Company{" "}
                        {getSortIcon(userSort, "artistInfo.companyName")}
                      </div>
                    </TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center py-8 text-muted-foreground"
                      >
                        No users found.
                      </TableCell>
                    </TableRow>
                  ) : groupBy ? (
                    Object.entries(groupedUsers).map(
                      ([groupName, groupItems]) => {
                        const isExpanded = expandedGroups[groupName];
                        return (
                          <Fragment key={groupName}>
                            <TableRow
                              className="bg-muted/10 hover:bg-muted/20 border-y cursor-pointer transition-colors"
                              onClick={() => toggleGroup(groupName)}
                            >
                              <TableCell
                                colSpan={6}
                                className="py-2 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground bg-muted/5"
                              >
                                <div className="flex items-center gap-2">
                                  {isExpanded ? (
                                    <ChevronDown className="h-3.5 w-3.5" />
                                  ) : (
                                    <ChevronRight className="h-3.5 w-3.5" />
                                  )}
                                  {groupName} ({groupItems.length})
                                </div>
                              </TableCell>
                            </TableRow>
                            {isExpanded &&
                              groupItems.map((u) => renderUserRow(u))}
                          </Fragment>
                        );
                      },
                    )
                  ) : (
                    users.map((user) => renderUserRow(user))
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
          <div className="w-full">
            <ThemeEditor />
          </div>
        </TabsContent>

        {/* --- ANALYTICS TAB --- */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="flex items-center justify-end">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Time Period:</span>
              <Select value={statsPeriod} onValueChange={setStatsPeriod}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today (Filtered)</SelectItem>
                  <SelectItem value="week">Last 7 Days (Filtered)</SelectItem>
                  <SelectItem value="month">Last 30 Days (Filtered)</SelectItem>
                  <SelectItem value="year">Last Year (Filtered)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <p className="text-sm text-muted-foreground -mt-4 italic">
            * Note: Currently view counts are all-time cumulative. Date filters
            apply to other stats.
          </p>

          {statsLoading ? (
            <div className="py-20 flex justify-center">
              <Loading message="Loading analytics..." />
            </div>
          ) : stats ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Viewed Videos */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" /> Top Viewed Videos
                  </CardTitle>
                  <CardDescription>Most watched video content</CardDescription>
                </CardHeader>
                <CardContent>
                  {stats.topViewedVideos?.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Video Title</TableHead>
                          <TableHead>Artist</TableHead>
                          <TableHead className="text-right">Views</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {stats.topViewedVideos.map((video) => (
                          <TableRow
                            key={video._id}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => navigate(`/videos/${video._id}`)}
                          >
                            <TableCell className="font-medium truncate max-w-[200px]">
                              {video.title}
                            </TableCell>
                            <TableCell>
                              {video.companyName || video.artistName}
                            </TableCell>
                            <TableCell className="text-right font-bold">
                              {video.views.toLocaleString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="py-8 text-center text-muted-foreground">
                      No video views yet
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Top Viewed Artworks */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5" /> Top Viewed Artworks
                  </CardTitle>
                  <CardDescription>
                    Most viewed images and other media
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {stats.topViewedOther?.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead className="text-right">Views</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {stats.topViewedOther.map((artwork) => (
                          <TableRow
                            key={artwork._id}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => navigate(`/artworks/${artwork._id}`)}
                          >
                            <TableCell className="font-medium truncate max-w-[200px]">
                              {artwork.title}
                            </TableCell>
                            <TableCell className="capitalize">
                              {artwork.category}
                            </TableCell>
                            <TableCell className="text-right font-bold">
                              {artwork.views.toLocaleString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="py-8 text-center text-muted-foreground">
                      No artwork views yet
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              Failed to load analytics
            </div>
          )}
        </TabsContent>

        {isSuperAdmin && (
          <TabsContent value="storage" className="space-y-4">
            <div className="flex justify-between items-center bg-background p-4 rounded-lg border">
              <h3 className="text-lg font-medium">Storage Usage by Artist</h3>
              <div className="text-sm text-muted-foreground">
                Showing {storageUsers?.length || 0} of {storagePagination.total}{" "}
                artists
              </div>
            </div>

            {storageLoading ? (
              <div className="py-20 flex justify-center">
                <Loading message="Loading storage data..." />
              </div>
            ) : (
              <Card>
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow className="border-b-0 hover:bg-transparent">
                      <TableHead
                        className="w-[250px] cursor-pointer"
                        onClick={() => handleStorageSort("firstName")}
                      >
                        Artist / User
                      </TableHead>
                      <TableHead
                        className="cursor-pointer"
                        onClick={() =>
                          handleStorageSort("artistInfo.companyName")
                        }
                      >
                        Company
                      </TableHead>
                      <TableHead
                        className="cursor-pointer"
                        onClick={() => handleStorageSort("subscriptionTier")}
                      >
                        Tier
                      </TableHead>
                      <TableHead
                        className="w-[300px] cursor-pointer"
                        onClick={() => handleStorageSort("storage.totalBytes")}
                      >
                        Storage Usage
                      </TableHead>
                      <TableHead className="text-right">Content</TableHead>
                      <TableHead
                        className="text-right cursor-pointer"
                        onClick={() => handleStorageSort("updatedAt")}
                      >
                        Last Update
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {storageUsers?.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center py-8 text-muted-foreground"
                        >
                          No data found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      storageUsers?.map((u) => {
                        const usage = u.storage?.totalBytes || 0;
                        const limit =
                          u.storage?.quotaBytes || 5 * 1024 * 1024 * 1024;
                        const percent = Math.min((usage / limit) * 100, 100);

                        return (
                          <TableRow
                            key={u._id}
                            className="cursor-pointer hover:bg-muted/30"
                            onClick={() => setSelectedUserId(u._id)}
                          >
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                                  {u.profilePicture ? (
                                    <img
                                      src={u.profilePicture}
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    u.firstName?.[0]
                                  )}
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-medium">
                                    {u.firstName} {u.lastName}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {u.email}
                                  </span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {u.artistInfo?.companyName || "-"}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="uppercase">
                                {u.subscriptionTier}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="flex justify-between text-xs">
                                  <span>{formatBytes(usage)}</span>
                                  <span className="text-muted-foreground">
                                    of {formatBytes(limit)}
                                  </span>
                                </div>
                                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                  <div
                                    className={`h-full ${percent > 90 ? "bg-destructive" : percent > 75 ? "bg-yellow-500" : "bg-primary"}`}
                                    style={{ width: `${percent}%` }}
                                  />
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-right text-xs">
                              <div title={formatBytes(u.storage?.videoBytes)}>
                                {u.videoCount || 0} Videos{" "}
                                <span className="text-muted-foreground">
                                  ({formatBytes(u.storage?.videoBytes)})
                                </span>
                              </div>
                              <div title={formatBytes(u.storage?.imageBytes)}>
                                {u.imageCount || 0} Images{" "}
                                <span className="text-muted-foreground">
                                  ({formatBytes(u.storage?.imageBytes)})
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right text-xs text-muted-foreground">
                              {new Date(u.updatedAt).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
                {storagePagination.pages > 1 && (
                  <div className="p-4 border-t">
                    <Pagination
                      currentPage={storagePagination.page}
                      totalPages={storagePagination.pages}
                      onPageChange={setStoragePage}
                    />
                  </div>
                )}
              </Card>
            )}
          </TabsContent>
        )}

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
            <div className="py-20 flex justify-center">
              <Loading message="Loading orders..." />
            </div>
          ) : (
            <Card>
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow className="border-b-0 hover:bg-transparent">
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
                      <TableCell
                        colSpan={5}
                        className="text-center py-8 text-muted-foreground"
                      >
                        No orders found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    orders.map((order) => (
                      <TableRow
                        key={order._id}
                        className="cursor-pointer border-b-0 hover:bg-muted/30"
                        onClick={() => setSelectedOrderId(order._id)}
                      >
                        <TableCell className="font-mono text-xs">
                          {order._id.slice(-6).toUpperCase()}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {order.user?.firstName} {order.user?.lastName}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {order.user?.email}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(order.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={getStatusColorClass(order.status)}
                          >
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

      <CreateUserModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onSuccess={refreshUsers}
        isSuperAdmin={isSuperAdmin}
      />
    </div>
  );
};

export default AdminPage;
