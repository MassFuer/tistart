import { useState, useEffect } from "react";
import { platformAPI } from "../../services/api";
import { toast } from "sonner";
import {
  Loader2,
  Save,
  RefreshCw,
  Wrench,
  Shield,
  Mail,
  Zap,
  Layout,
  Percent,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const AdminSystemTab = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
    hero: {
      text: "",
      videoUrl: "",
      mobileVideoUrl: "",
      backgroundSoundUrl: "",
    },
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await platformAPI.getSettings();
      const data = response.data.data;
      setSettings(data);
      setSettingsForm({
        platformCommission: data.platformCommission || 20,
        storage: data.storage || settingsForm.storage,
        features: data.features || settingsForm.features,
        rateLimits: data.rateLimits || settingsForm.rateLimits,
        email: data.email || settingsForm.email,
        maintenance: data.maintenance || settingsForm.maintenance,
        hero: data.hero || settingsForm.hero,
      });
    } catch (error) {
      toast.error("Failed to load platform settings");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (section, field, value) => {
    setSettingsForm((prev) => ({
      ...prev,
      [section]:
        typeof prev[section] === "object"
          ? { ...prev[section], [field]: value }
          : value,
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await platformAPI.updateSettings(settingsForm);
      toast.success("System settings updated");
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
        message:
          settingsForm.maintenance.message || "Platform is under maintenance.",
      });
      setSettingsForm((prev) => ({
        ...prev,
        maintenance: { ...prev.maintenance, enabled: newState },
      }));
      toast.success(
        newState ? "Maintenance mode enabled" : "Maintenance mode disabled",
      );
    } catch (error) {
      toast.error("Failed to toggle maintenance mode");
    }
  };

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading system configuration...</p>
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            System Configuration
          </h2>
          <p className="text-muted-foreground text-sm">
            Manage core platform behavior, security, and limits.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchSettings}>
            <RefreshCw className="mr-2 h-4 w-4" /> Reload
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Changes
          </Button>
        </div>
      </div>
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid grid-cols-2 md:grid-cols-5 h-auto">
          <TabsTrigger value="general" className="gap-2">
            <Percent className="h-4 w-4" /> Billing
          </TabsTrigger>
          <TabsTrigger value="features" className="gap-2">
            <Zap className="h-4 w-4" /> Features
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="h-4 w-4" /> Security
          </TabsTrigger>
          <TabsTrigger value="email" className="gap-2">
            <Mail className="h-4 w-4" /> Email
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="gap-2">
            <Wrench className="h-4 w-4" /> Maintenance
          </TabsTrigger>
        </TabsList>

        {/* General / Billing */}
        <TabsContent value="general" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Commission & Billing</CardTitle>
              <CardDescription>
                Configure platform fees and default storage.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Default Platform Commission (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={settingsForm.platformCommission}
                    onChange={(e) =>
                      handleChange(
                        "platformCommission",
                        null,
                        Number(e.target.value),
                      )
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Baseline fee applied to all orders unless overridden by
                    subscription.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Default Storage Quota (GB)</Label>
                  <Input
                    type="number"
                    min="1"
                    value={Math.round(
                      settingsForm.storage.defaultQuotaBytes /
                        (1024 * 1024 * 1024),
                    )}
                    onChange={(e) =>
                      handleChange(
                        "storage",
                        "defaultQuotaBytes",
                        Number(e.target.value) * 1024 * 1024 * 1024,
                      )
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Initial storage limit for new artists.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Features */}
        <TabsContent value="features" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Feature Toggles</CardTitle>
              <CardDescription>
                Enable or disable major platform modules.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(settingsForm.features).map(([key, value]) => (
                <div
                  key={key}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div className="space-y-0.5">
                    <Label className="capitalize text-base">
                      {key
                        .replace(/([A-Z])/g, " $1")
                        .replace(/enabled/i, "")
                        .trim()}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Control visibility and access to this feature.
                    </p>
                  </div>
                  <Switch
                    checked={value}
                    onCheckedChange={(checked) =>
                      handleChange("features", key, checked)
                    }
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security */}
        <TabsContent value="security" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Security & Rate Limiting</CardTitle>
              <CardDescription>
                Configure anti-abuse mechanisms.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold">Authentication</h4>
                  <div className="space-y-2">
                    <Label>Max Login Attempts</Label>
                    <Input
                      type="number"
                      min="1"
                      value={settingsForm.rateLimits.authMaxAttempts}
                      onChange={(e) =>
                        handleChange(
                          "rateLimits",
                          "authMaxAttempts",
                          Number(e.target.value),
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Lockout Window (Minutes)</Label>
                    <Input
                      type="number"
                      min="1"
                      value={settingsForm.rateLimits.authWindowMinutes}
                      onChange={(e) =>
                        handleChange(
                          "rateLimits",
                          "authWindowMinutes",
                          Number(e.target.value),
                        )
                      }
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold">API Usage</h4>
                  <div className="space-y-2">
                    <Label>Global Request Limit (per minute)</Label>
                    <Input
                      type="number"
                      min="1"
                      value={settingsForm.rateLimits.apiMaxRequests}
                      onChange={(e) =>
                        handleChange(
                          "rateLimits",
                          "apiMaxRequests",
                          Number(e.target.value),
                        )
                      }
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email */}
        <TabsContent value="email" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Communications</CardTitle>
              <CardDescription>
                Settings for platform-generated emails.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Sender Name</Label>
                  <Input
                    value={settingsForm.email.fromName}
                    onChange={(e) =>
                      handleChange("email", "fromName", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Sender Address</Label>
                  <Input
                    value={settingsForm.email.fromEmail}
                    onChange={(e) =>
                      handleChange("email", "fromEmail", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Support Email Address</Label>
                  <Input
                    value={settingsForm.email.supportEmail}
                    onChange={(e) =>
                      handleChange("email", "supportEmail", e.target.value)
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Maintenance */}
        <TabsContent value="maintenance" className="space-y-4 pt-4">
          <Card
            className={
              settingsForm.maintenance.enabled
                ? "border-red-200 bg-red-50/10"
                : ""
            }
          >
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5" /> Maintenance Mode
                </CardTitle>
                <Switch
                  checked={settingsForm.maintenance.enabled}
                  onCheckedChange={handleToggleMaintenance}
                />
              </div>
              <CardDescription>
                When enabled, only SuperAdmins can access the platform.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Maintenance Message</Label>
                <Input
                  value={settingsForm.maintenance.message}
                  onChange={(e) =>
                    handleChange("maintenance", "message", e.target.value)
                  }
                  placeholder="Platform is under maintenance. Please check back soon."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <div className="h-10" /> {/* Spacer */}
    </div>
  );
};

export default AdminSystemTab;
