import { useState, useEffect } from "react";
import { platformAPI } from "../../services/api";
import { toast } from "sonner";
import {
  Loader2,
  Palette,
  Monitor,
  Image,
  Coins,
  CalendarDays,
  CheckCircle2,
  Save,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ThemeEditor from "./ThemeEditor";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const AdminAppearanceTab = () => {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      // Regular admins can't access /settings, use public /config instead
      const res = await platformAPI.getConfig();
      setSettings(res.data.data);
    } catch (error) {
      toast.error("Failed to fetch appearance settings");
    } finally {
      setLoading(false);
    }
  };

  const handleDisplayChange = (field, value) => {
    setSettings((prev) => ({
      ...prev,
      display: { ...prev.display, [field]: value },
    }));
  };

  const handleColorChange = (section, key, value) => {
    setSettings((prev) => ({
      ...prev,
      display: {
        ...prev.display,
        [section]: { ...prev.display[section], [key]: value },
      },
    }));
  };

  const handleSaveDisplay = async () => {
    try {
      setSaving(true);
      await platformAPI.updateSettings({ display: settings.display });
      toast.success("Display settings saved");
    } catch (error) {
      toast.error("Failed to save display settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading appearance settings...</p>
      </div>
    );

  return (
    <div className="space-y-6">
      <Tabs defaultValue="branding" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 h-auto">
          <TabsTrigger value="branding" className="gap-2">
            <Palette className="h-4 w-4" /> Branding
          </TabsTrigger>
          <TabsTrigger value="display" className="gap-2">
            <Monitor className="h-4 w-4" /> Display & Colors
          </TabsTrigger>
        </TabsList>

        <TabsContent value="branding" className="pt-4">
          <ThemeEditor />
        </TabsContent>

        <TabsContent value="display" className="space-y-6 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Display Defaults */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Coins className="h-5 w-5" /> Currency & Pagination
                </CardTitle>
                <CardDescription>
                  Behavioral defaults for the storefront.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Default Currency</Label>
                  <Select
                    value={settings.display?.defaultCurrency || "EUR"}
                    onValueChange={(val) =>
                      handleDisplayChange("defaultCurrency", val)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Default Page Size</Label>
                  <Input
                    type="number"
                    value={settings.display?.defaultPageSize || 12}
                    onChange={(e) =>
                      handleDisplayChange(
                        "defaultPageSize",
                        Number(e.target.value),
                      )
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Calendar Colors */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5" /> Calendar Event Colors
                </CardTitle>
                <CardDescription>
                  Categorization colors for the event calendar.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-3">
                {Object.entries(settings.display?.calendarColors || {}).map(
                  ([key, value]) => (
                    <div key={key} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded border overflow-hidden shrink-0">
                        <Input
                          type="color"
                          value={value}
                          onChange={(e) =>
                            handleColorChange(
                              "calendarColors",
                              key,
                              e.target.value,
                            )
                          }
                          className="w-12 h-12 p-0 border-0 cursor-pointer -translate-x-2 -translate-y-2"
                        />
                      </div>
                      <Label className="capitalize flex-1">{key}</Label>
                      <Input
                        value={value}
                        onChange={(e) =>
                          handleColorChange(
                            "calendarColors",
                            key,
                            e.target.value,
                          )
                        }
                        className="w-24 h-8 text-xs font-mono"
                      />
                    </div>
                  ),
                )}
              </CardContent>
            </Card>

            {/* Status Colors */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" /> Artist Status Colors
                </CardTitle>
                <CardDescription>
                  Visual indicators for different verification and application
                  states.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {Object.entries(settings.display?.artistStatusColors || {}).map(
                  ([key, value]) => (
                    <div key={key} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded border overflow-hidden shrink-0">
                        <Input
                          type="color"
                          value={value}
                          onChange={(e) =>
                            handleColorChange(
                              "artistStatusColors",
                              key,
                              e.target.value,
                            )
                          }
                          className="w-12 h-12 p-0 border-0 cursor-pointer -translate-x-2 -translate-y-2"
                        />
                      </div>
                      <Label className="capitalize flex-1 text-xs">
                        {key.replace(/([A-Z])/g, " $1")}
                      </Label>
                      <Input
                        value={value}
                        onChange={(e) =>
                          handleColorChange(
                            "artistStatusColors",
                            key,
                            e.target.value,
                          )
                        }
                        className="w-20 h-8 text-[10px] font-mono"
                      />
                    </div>
                  ),
                )}
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={handleSaveDisplay} disabled={saving}>
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Display Settings
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminAppearanceTab;
