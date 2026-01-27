import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { usersAPI, artworksAPI, eventsAPI, ordersAPI } from "../services/api";
import { toast } from "sonner";
import { Link, useSearchParams } from "react-router-dom";
import {
  LayoutDashboard,
  Palette,
  Calendar,
  ShoppingBag,
  Settings,
  Plus,
  TrendingUp,
  CreditCard,
  Users,
  Eye,
  Star,
  Box,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// Components
import StatCard from "../components/dashboard/StatCard";
import ProfileSettings from "../components/dashboard/ProfileSettings";
import EventsMap from "../components/map/EventsMap"; // Reuse existing map for user view
import ArtworkManager from "../components/dashboard/ArtworkManager";
import EventManagement from "../components/dashboard/EventManagement";

const DashboardPage = () => {
  const { user, isArtist, isAdmin } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "overview");
  
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [recentSales, setRecentSales] = useState([]);
  const [recentAttending, setRecentAttending] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Sync tab with URL
  useEffect(() => {
    const tabFromUrl = searchParams.get("tab");
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  const handleTabChange = (value) => {
    setActiveTab(value);
    setSearchParams({ tab: value });
  };

  // Fetch Dashboard Data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // 1. Fetch Stats
        const statsRes = await usersAPI.getStats();
        setStats(statsRes.data.data);

        // 2. Fetch Recent Sales (if artist)
        if (isArtist) {
           const salesRes = await ordersAPI.getSales();
           setRecentSales(salesRes.data.data.slice(0, 5));
        }

        // 3. Fetch Recent Orders (if user/artist)
        const ordersRes = await ordersAPI.getMine();
        setRecentOrders(ordersRes.data.data.slice(0, 5));

        // 4. Fetch Attending Events
        // (This might need a specific endpoint or filter, for now leaving empty or mocking)
        // const eventsRes = await eventsAPI.getAttending(); 
        
      } catch (error) {
        console.error("Dashboard fetch error:", error);
        // toast.error("Failed to load some dashboard data");
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user, isArtist]);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading dashboard...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user.firstName}! Here's what's happening.
          </p>
        </div>
        <div className="flex items-center gap-2">
           {isArtist && (
             <>
               <Button asChild variant="outline">
                 <Link to="/artworks/new"><Plus className="mr-2 h-4 w-4" /> New Artwork</Link>
               </Button>
               <Button asChild>
                 <Link to="/events/new"><Plus className="mr-2 h-4 w-4" /> New Event</Link>
               </Button>
             </>
           )}
           {!isArtist && (
              <Button asChild>
                 <Link to="/gallery">Browse Art</Link>
              </Button>
           )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 lg:w-[700px]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activity">{isArtist ? "Sales" : "Orders"}</TabsTrigger>
          {(isArtist || isAdmin) && <TabsTrigger value="artworks">Artworks</TabsTrigger>}
          {(isArtist || isAdmin) && <TabsTrigger value="events">Events</TabsTrigger>}
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-6">
          {/* KPI Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {isArtist ? (
              <>
                 <StatCard 
                    title="Total Revenue" 
                    value={stats?.revenue ? new Intl.NumberFormat("en-US", { style: "currency", currency: "EUR" }).format(stats.revenue) : "€0.00"} 
                    icon={TrendingUp} 
                    description={`${stats?.sales || 0} orders completed`} 
                 />
                 <StatCard 
                    title="Artworks" 
                    value={stats?.artworks || 0} 
                    icon={Palette} 
                    description="Published artworks" 
                 />
                 <StatCard 
                    title="Avg Rating" 
                    value={stats?.avgRating || "N/A"} 
                    icon={Star} 
                    description={`From ${stats?.reviewCount || 0} reviews`} 
                 />
                 <StatCard 
                    title="Events" 
                    value={stats?.events || 0} 
                    icon={Calendar} 
                    description="Hosted events" 
                 />
                 <StatCard 
                    title="Storage Used" 
                    value={stats?.storageQuota ? `${Math.round((stats.storageUsage / stats.storageQuota) * 100)}%` : "0%"} 
                    icon={Box} 
                    description={`${(stats?.storageUsage / (1024*1024)).toFixed(0)}MB / ${(stats?.storageQuota / (1024*1024*1024)).toFixed(0)}GB`} 
                 />
                 <StatCard 
                    title="Plan" 
                    value={stats?.plan ? stats.plan.toUpperCase() : "FREE"} 
                    icon={CreditCard} 
                    description={<Link to="/pricing" className="text-primary hover:underline">Upgrade Plan</Link>} 
                 />
              </>
            ) : (
              <>
                 <StatCard 
                    title="Orders Placed" 
                    value={stats?.orders || 0} 
                    icon={ShoppingBag} 
                    description="Total purchases" 
                 />
                 <StatCard 
                    title="Favorites" 
                    value={stats?.favorites || 0} 
                    icon={Star} 
                    description="Saved artworks" 
                 />
                 <StatCard 
                    title="Events Attending" 
                    value={stats?.attending || 0} 
                    icon={Calendar} 
                    description="Upcoming events" 
                 />
                 <StatCard 
                    title="Community" 
                    value="Active" 
                    icon={Users} 
                    description="Member status" 
                 />
              </>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              {/* Recent Sales / Orders Chart Area (Placeholder) */}
              <Card className="col-span-4">
                  <CardHeader>
                      <CardTitle>{isArtist ? "Recent Sales" : "Recent Orders"}</CardTitle>
                      <CardDescription>
                          {isArtist ? "Your latest sales from the marketplace." : "Your recent purchases."}
                      </CardDescription>
                  </CardHeader>
                  <CardContent>
                      {/* Simple List for now */}
                      <div className="space-y-4">
                          {(isArtist ? recentSales : recentOrders).length === 0 ? (
                              <p className="text-center text-muted-foreground py-8">No activity yet.</p>
                          ) : (
                              (isArtist ? recentSales : recentOrders).map((order) => (
                                  <div key={order._id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                                      <div className="space-y-1">
                                          <p className="text-sm font-medium leading-none">
                                              Order #{order._id.slice(-6).toUpperCase()}
                                          </p>
                                          <p className="text-xs text-muted-foreground">
                                              {new Date(order.createdAt).toLocaleDateString()}
                                          </p>
                                      </div>
                                      <div className="text-right">
                                           <p className="text-sm font-medium">€{order.totalAmount}</p>
                                           <Badge variant={order.status === "paid" ? "default" : "secondary"} className="text-[10px] h-5">
                                               {order.status}
                                           </Badge>
                                      </div>
                                  </div>
                              ))
                          )}
                      </div>
                  </CardContent>
              </Card>

              {/* Quick Actions / Notifications */}
              <Card className="col-span-3">
                  <CardHeader>
                      <CardTitle>Notifications</CardTitle>
                      <CardDescription>Recent updates and alerts.</CardDescription>
                  </CardHeader>
                  <CardContent>
                      <div className="space-y-4 text-sm text-muted-foreground">
                          <p>Welcome to your new dashboard!</p>
                          {isArtist && user?.artistStatus !== "verified" && (
                              <Link to="/apply-artist">
                                  <div className="flex items-center gap-2 p-3 bg-muted rounded-md hover:bg-muted/80 transition-colors cursor-pointer">
                                      <Star className="h-4 w-4 text-primary" />
                                      <span>
                                          {user?.artistStatus === "pending" 
                                            ? "Application pending review." 
                                            : "Complete your artist profile to get verified."}
                                      </span>
                                  </div>
                              </Link>
                          )}
                      </div>
                  </CardContent>
              </Card>
          </div>
        </TabsContent>

        {/* ACTIVITY TAB (Sales/Orders) */}
        <TabsContent value="activity" className="space-y-6">
            <h2 className="text-xl font-semibold">{isArtist ? "Sales History" : "Order History"}</h2>
             <Card>
                <CardContent className="p-0">
                   {/* We can reuse OrderList component here if we extract it, for now simple list */}
                   <div className="divide-y">
                        {(isArtist ? recentSales : recentOrders).map((order) => (
                            <div key={order._id} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                                <div className="flex flex-col gap-1">
                                    <span className="font-medium">Order #{order._id.slice(-6).toUpperCase()}</span>
                                    <span className="text-sm text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="font-semibold">€{order.totalAmount}</span>
                                    <Badge variant={order.status === "paid" ? "default" : "outline"}>{order.status}</Badge>
                                    <Button variant="ghost" size="sm" asChild>
                                        <Link to={`/orders/${order._id}`}>Details</Link>
                                    </Button>
                                </div>
                            </div>
                        ))}
                        {(isArtist ? recentSales : recentOrders).length === 0 && (
                            <div className="p-8 text-center text-muted-foreground">No records found.</div>
                        )}
                   </div>
                </CardContent>
             </Card>
        </TabsContent>

        {/* CONTENT TAB (Artworks/Events) */}
        {/* ARTWORKS TAB */}
        {(isArtist || isAdmin) && (
            <TabsContent value="artworks" className="space-y-6">
                 <div className="flex items-center gap-3">
                     <div>
                         <h2 className="text-xl font-semibold tracking-tight">Artworks</h2>
                         <p className="text-sm text-muted-foreground">
                             {isAdmin ? "Manage all platform artworks." : "Manage your portfolio, update pricing, and track inventory."}
                         </p>
                     </div>
                     {isAdmin && <Badge variant="secondary">Admin View</Badge>}
                 </div>
                <ArtworkManager isAdmin={isAdmin} />
            </TabsContent>
        )}

        {/* EVENTS TAB */}
        {(isArtist || isAdmin) && (
            <TabsContent value="events" className="space-y-6">
                <div className="flex items-center gap-3">
                    <div>
                        <h2 className="text-xl font-semibold tracking-tight">Events</h2>
                        <p className="text-sm text-muted-foreground">
                            {isAdmin ? "Manage all platform events." : "Manage your exhibitions and track attendees."}
                        </p>
                    </div>
                    {isAdmin && <Badge variant="secondary">Admin View</Badge>}
                </div>
                <EventManagement isAdmin={isAdmin} />
            </TabsContent>
        )}

        {/* SETTINGS TAB */}
        <TabsContent value="settings">
           <ProfileSettings />
        </TabsContent>

      </Tabs>
    </div>
  );
};

export default DashboardPage;
