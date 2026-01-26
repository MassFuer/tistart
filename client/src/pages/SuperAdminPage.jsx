import { useState, useEffect } from "react";
import { platformAPI, adminAPI } from "../services/api";
import { toast } from "sonner";
import Loading from "../components/common/Loading";
import { 
  Settings, Database, Users, Wrench, Save, RefreshCw, 
  Search, AlertTriangle, Check, X, ChevronDown, ChevronUp 
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";

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
  const [userFilter, setUserFilter] = useState({ role: "all", search: "" }); // "all" instead of "" for Select compatibility
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
        ...(userFilter.role && userFilter.role !== "all" && { role: userFilter.role }),
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
    <div className="container mx-auto px-4 py-8 min-h-screen">
      <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">SuperAdmin Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage platform settings, storage, and user roles</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full md:w-auto md:inline-grid grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="settings" className="flex items-center gap-2"><Settings className="h-4 w-4"/> Settings</TabsTrigger>
          <TabsTrigger value="storage" className="flex items-center gap-2"><Database className="h-4 w-4"/> Storage</TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2"><Users className="h-4 w-4"/> Users</TabsTrigger>
          <TabsTrigger value="maintenance" className="flex items-center gap-2"><Wrench className="h-4 w-4"/> Maintenance</TabsTrigger>
        </TabsList>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Commission Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle>Commission Rate</CardTitle>
                        <CardDescription>Percentage taken from each order</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                             <Label>Platform Commission (%)</Label>
                             <Input 
                                type="number" 
                                min="0" 
                                max="100" 
                                value={settingsForm.platformCommission}
                                onChange={(e) => handleSettingsChange("platformCommission", null, Number(e.target.value))}
                             />
                        </div>
                    </CardContent>
                </Card>

                {/* Storage Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle>Storage Limits</CardTitle>
                        <CardDescription>Default limits for new users</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <div className="space-y-2">
                             <Label>Default Storage Quota (GB)</Label>
                             <Input 
                                type="number"
                                min="1"
                                value={Math.round(settingsForm.storage.defaultQuotaBytes / (1024 * 1024 * 1024))}
                                onChange={(e) => handleSettingsChange("storage", "defaultQuotaBytes", Number(e.target.value) * 1024 * 1024 * 1024)}
                             />
                         </div>
                         <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-2">
                                <Label>Max Image MB</Label>
                                <Input 
                                    type="number"
                                    min="1"
                                    value={settingsForm.storage.maxImageSizeMB}
                                    onChange={(e) => handleSettingsChange("storage", "maxImageSizeMB", Number(e.target.value))}
                                />
                             </div>
                             <div className="space-y-2">
                                <Label>Max Video MB</Label>
                                <Input 
                                    type="number"
                                    min="1"
                                    value={settingsForm.storage.maxVideoSizeMB}
                                    onChange={(e) => handleSettingsChange("storage", "maxVideoSizeMB", Number(e.target.value))}
                                />
                             </div>
                         </div>
                    </CardContent>
                </Card>
            
                 {/* Feature Toggles */}
                 <Card>
                    <CardHeader>
                        <CardTitle>Feature Toggles</CardTitle>
                        <CardDescription>Enable or disable platform features</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         {Object.entries(settingsForm.features).map(([key, value]) => (
                            <div key={key} className="flex items-center justify-between">
                                <Label className="capitalize">{key.replace(/([A-Z])/g, " $1").replace(/enabled/i, "").trim()}</Label>
                                <Switch 
                                    checked={value}
                                    onCheckedChange={(checked) => handleSettingsChange("features", key, checked)}
                                />
                            </div>
                         ))}
                    </CardContent>
                 </Card>

                 {/* Rate Limits */}
                 <Card>
                    <CardHeader>
                        <CardTitle>Rate Limits</CardTitle>
                        <CardDescription>Security and API usage limits</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-2">
                                  <Label>Auth Attempts</Label>
                                  <Input 
                                    type="number" min="1"
                                    value={settingsForm.rateLimits.authMaxAttempts}
                                    onChange={(e) => handleSettingsChange("rateLimits", "authMaxAttempts", Number(e.target.value))}
                                  />
                             </div>
                             <div className="space-y-2">
                                  <Label>Auth Window (min)</Label>
                                  <Input 
                                    type="number" min="1"
                                    value={settingsForm.rateLimits.authWindowMinutes}
                                    onChange={(e) => handleSettingsChange("rateLimits", "authWindowMinutes", Number(e.target.value))}
                                  />
                             </div>
                             <div className="col-span-2 space-y-2">
                                  <Label>API Max Requests (per window)</Label>
                                  <Input 
                                    type="number" min="1"
                                    value={settingsForm.rateLimits.apiMaxRequests}
                                    onChange={(e) => handleSettingsChange("rateLimits", "apiMaxRequests", Number(e.target.value))}
                                  />
                             </div>
                         </div>
                    </CardContent>
                 </Card>

                 {/* Email Settings */}
                 <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Email Settings</CardTitle>
                        <CardDescription>Configuration for outgoing emails</CardDescription>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-3 gap-6">
                         <div className="space-y-2">
                             <Label>Sender Name</Label>
                             <Input 
                                value={settingsForm.email.fromName}
                                onChange={(e) => handleSettingsChange("email", "fromName", e.target.value)}
                             />
                         </div>
                         <div className="space-y-2">
                             <Label>Sender Email</Label>
                             <Input 
                                value={settingsForm.email.fromEmail}
                                onChange={(e) => handleSettingsChange("email", "fromEmail", e.target.value)}
                             />
                         </div>
                         <div className="space-y-2">
                             <Label>Support Email</Label>
                             <Input 
                                value={settingsForm.email.supportEmail}
                                onChange={(e) => handleSettingsChange("email", "supportEmail", e.target.value)}
                             />
                         </div>
                    </CardContent>
                 </Card>
            </div>

            <div className="flex justify-end gap-4 py-4 sticky bottom-0 bg-background/80 backdrop-blur-sm p-4 border-t">
                  <Button variant="outline" onClick={fetchSettings}>
                      <RefreshCw className="mr-2 h-4 w-4" /> Reset
                  </Button>
                  <Button onClick={handleSaveSettings} disabled={saving}>
                      <Save className="mr-2 h-4 w-4" /> {saving ? "Saving..." : "Save Changes"}
                  </Button>
            </div>
        </TabsContent>

        {/* Storage Tab */}
        <TabsContent value="storage" className="space-y-6">
             <div className="flex justify-between items-center">
                  <div>
                      <h2 className="text-xl font-semibold">Artist Storage Usage</h2>
                      <p className="text-muted-foreground">Manage storage quotas and tiers</p>
                  </div>
             </div>

             <div className="border rounded-md">
                 <Table>
                     <TableHeader>
                         <TableRow>
                             <TableHead>Artist</TableHead>
                             <TableHead>Tier</TableHead>
                             <TableHead>Used / Quota</TableHead>
                             <TableHead className="w-[200px]">Usage</TableHead>
                             <TableHead>Actions</TableHead>
                         </TableRow>
                     </TableHeader>
                     <TableBody>
                         {storageData.map((artist) => {
                             const used = artist.storage?.totalBytes || 0;
                             const quota = artist.storage?.quotaBytes || settings?.storage?.defaultQuotaBytes || 5368709120;
                             const percentage = getStoragePercentage(used, quota);
                             
                             return (
                                 <TableRow key={artist._id}>
                                     <TableCell>
                                         <div className="flex flex-col">
                                             <span className="font-medium">{artist.firstName} {artist.lastName}</span>
                                             <span className="text-xs text-muted-foreground">{artist.email}</span>
                                         </div>
                                     </TableCell>
                                     <TableCell>
                                         <Badge variant="outline" className="uppercase text-xs">{artist.subscriptionTier || "free"}</Badge>
                                     </TableCell>
                                     <TableCell className="text-sm">
                                         {formatBytes(used)} / {formatBytes(quota)}
                                     </TableCell>
                                     <TableCell>
                                         <div className="flex items-center gap-2">
                                             <Progress value={percentage} className={`h-2 ${percentage > 90 ? "bg-red-200" : ""}`} />
                                             <span className="text-xs w-8 text-right">{percentage.toFixed(0)}%</span>
                                         </div>
                                     </TableCell>
                                     <TableCell>
                                          <Select 
                                            value={artist.subscriptionTier || "free"}
                                            onValueChange={(val) => handleUpdateUserTier(artist._id, val)}
                                          >
                                              <SelectTrigger className="w-[120px] h-8">
                                                  <SelectValue />
                                              </SelectTrigger>
                                              <SelectContent>
                                                  <SelectItem value="free">Free</SelectItem>
                                                  <SelectItem value="pro">Pro</SelectItem>
                                                  <SelectItem value="enterprise">Enterprise</SelectItem>
                                              </SelectContent>
                                          </Select>
                                     </TableCell>
                                 </TableRow>
                             );
                         })}
                     </TableBody>
                 </Table>
             </div>

             <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Page {storagePagination.page} of {storagePagination.pages}</span>
                  <div className="flex gap-2">
                      <Button variant="outline" size="sm" 
                        disabled={storagePagination.page === 1}
                        onClick={() => setStoragePagination(p => ({ ...p, page: p.page - 1 }))}
                      >
                          Previous
                      </Button>
                      <Button variant="outline" size="sm" 
                        disabled={storagePagination.page === storagePagination.pages}
                        onClick={() => setStoragePagination(p => ({ ...p, page: p.page + 1 }))}
                      >
                          Next
                      </Button>
                  </div>
             </div>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between gap-4">
                 <div>
                     <h2 className="text-xl font-semibold">User Management</h2>
                     <p className="text-muted-foreground">View and manage all platform users</p>
                 </div>
                 <div className="flex gap-4">
                      <Select 
                        value={userFilter.role}
                        onValueChange={(val) => setUserFilter({ ...userFilter, role: val })}
                      >
                          <SelectTrigger className="w-[150px]">
                               <SelectValue placeholder="All Roles" />
                          </SelectTrigger>
                          <SelectContent>
                              <SelectItem value="all">All Roles</SelectItem>
                              <SelectItem value="user">User</SelectItem>
                              <SelectItem value="artist">Artist</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="superAdmin">SuperAdmin</SelectItem>
                          </SelectContent>
                      </Select>
                      
                      <div className="relative">
                           <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                           <Input 
                                className="pl-9 w-[200px] md:w-[300px]" 
                                placeholder="Search users..." 
                                value={userFilter.search}
                                onChange={(e) => setUserFilter({ ...userFilter, search: e.target.value })}
                           />
                      </div>
                 </div>
            </div>

            <div className="border rounded-md">
                 <Table>
                     <TableHeader>
                         <TableRow>
                             <TableHead>User</TableHead>
                             <TableHead>Role</TableHead>
                             <TableHead>Artist Status</TableHead>
                             <TableHead>Actions</TableHead>
                         </TableRow>
                     </TableHeader>
                     <TableBody>
                         {users.map((user) => (
                             <TableRow key={user._id}>
                                 <TableCell>
                                     <div className="flex items-center gap-3">
                                         <Avatar>
                                             <AvatarImage src={user.profilePicture} />
                                             <AvatarFallback>{user.firstName?.[0]}</AvatarFallback>
                                         </Avatar>
                                         <div className="flex flex-col">
                                             <span className="font-medium">{user.firstName} {user.lastName}</span>
                                             <span className="text-xs text-muted-foreground">{user.email}</span>
                                         </div>
                                     </div>
                                 </TableCell>
                                 <TableCell>
                                     <Badge variant={user.role === "admin" || user.role === "superAdmin" ? "default" : "secondary"}>
                                         {user.role}
                                     </Badge>
                                 </TableCell>
                                 <TableCell>
                                     {user.role === "artist" && (
                                         <Badge variant={user.artistStatus === "verified" ? "success" : "outline"} className="capitalize">
                                             {user.artistStatus}
                                         </Badge>
                                     )}
                                 </TableCell>
                                 <TableCell>
                                     <Select 
                                        value={user.role}
                                        onValueChange={(val) => handleUpdateUserRole(user._id, val)}
                                      >
                                          <SelectTrigger className="w-[130px] h-8">
                                              <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                              <SelectItem value="user">User</SelectItem>
                                              <SelectItem value="artist">Artist</SelectItem>
                                              <SelectItem value="admin">Admin</SelectItem>
                                              <SelectItem value="superAdmin">SuperAdmin</SelectItem>
                                          </SelectContent>
                                      </Select>
                                 </TableCell>
                             </TableRow>
                         ))}
                     </TableBody>
                 </Table>
            </div>
             
             <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Page {userPagination.page} of {userPagination.pages}</span>
                  <div className="flex gap-2">
                      <Button variant="outline" size="sm" 
                        disabled={userPagination.page === 1}
                        onClick={() => setUserPagination(p => ({ ...p, page: p.page - 1 }))}
                      >
                          Previous
                      </Button>
                      <Button variant="outline" size="sm" 
                        disabled={userPagination.page === userPagination.pages}
                        onClick={() => setUserPagination(p => ({ ...p, page: p.page + 1 }))}
                      >
                          Next
                      </Button>
                  </div>
             </div>
        </TabsContent>
        {/* Maintenance Tab */}
        <TabsContent value="maintenance" className="space-y-6">
             <Card className="border-destructive/20 bg-destructive/5">
                 <CardHeader>
                     <CardTitle className="flex items-center gap-2 text-destructive">
                         <AlertTriangle className="h-5 w-5" /> Maintenance Mode
                     </CardTitle>
                     <CardDescription>
                         Enable this to lock out non-admin users for system updates.
                     </CardDescription>
                 </CardHeader>
                 <CardContent className="space-y-6">
                     <div className="flex items-center justify-between p-4 bg-background rounded-lg border">
                          <div className="flex items-center gap-2">
                               <div className={`h-3 w-3 rounded-full ${settingsForm.maintenance.enabled ? "bg-red-500 animate-pulse" : "bg-green-500"}`} />
                               <span className="font-semibold">{settingsForm.maintenance.enabled ? "Maintenance Active" : "System Operational"}</span>
                          </div>
                          <Switch 
                                checked={settingsForm.maintenance.enabled}
                                onCheckedChange={handleToggleMaintenance}
                          />
                     </div>

                     <div className="space-y-2">
                         <Label>Maintenance Message</Label>
                         <Textarea 
                            value={settingsForm.maintenance.message}
                            onChange={(e) => handleSettingsChange("maintenance", "message", e.target.value)}
                            placeholder="We are currently undergoing maintenance..."
                            rows={3}
                         />
                     </div>
                     
                     <div className="flex justify-end">
                         <Button onClick={handleSaveSettings} disabled={saving}>Save Message</Button>
                     </div>
                 </CardContent>
             </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
};

export default SuperAdminPage;