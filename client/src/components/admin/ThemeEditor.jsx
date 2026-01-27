import { useState, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import { platformAPI } from "../../services/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCcw, Save } from "lucide-react";

const ThemeEditor = () => {
  const { updateThemePreview, themeSettings } = useTheme();
  
  const [primaryColor, setPrimaryColor] = useState("#0f172a");
  const [radius, setRadius] = useState(0.5);
  const [fontFamily, setFontFamily] = useState("Inter");
  const [isLoading, setIsLoading] = useState(false);

  const fontOptions = [
      { label: "Inter (Default)", value: "Inter" },
      { label: "Manrope", value: "Manrope" },
      { label: "Poppins", value: "Poppins" },
      { label: "Roboto", value: "Roboto" },
      { label: "System UI", value: "system-ui" },
  ];

  // Helper: HSL string to Hex
  const hslToHex = (hslString) => {
      if (!hslString) return "#000000";
      const parts = hslString.replace(/,/g, "").split(" ").filter(Boolean);
      if (parts.length < 3) return "#000000";

      const h = parseFloat(parts[0]);
      const s = parseFloat(parts[1]) / 100;
      const l = parseFloat(parts[2]) / 100;

      let c = (1 - Math.abs(2 * l - 1)) * s,
          x = c * (1 - Math.abs(((h / 60) % 2) - 1)),
          m = l - c / 2,
          r = 0, g = 0, b = 0;

      if (0 <= h && h < 60) { r = c; g = x; b = 0; }
      else if (60 <= h && h < 120) { r = x; g = c; b = 0; }
      else if (120 <= h && h < 180) { r = 0; g = c; b = x; }
      else if (180 <= h && h < 240) { r = 0; g = x; b = c; }
      else if (240 <= h && h < 300) { r = x; g = 0; b = c; }
      else if (300 <= h && h < 360) { r = c; g = 0; b = x; }

      r = Math.round((r + m) * 255).toString(16);
      g = Math.round((g + m) * 255).toString(16);
      b = Math.round((b + m) * 255).toString(16);

      return "#" + (r.length===1?"0"+r:r) + (g.length===1?"0"+g:g) + (b.length===1?"0"+b:b);
  };

  // Helper: Hex to HSL string
  const hexToHSL = (H) => {
    let r = 0, g = 0, b = 0;
    if (H.length === 4) {
      r = "0x" + H[1] + H[1];
      g = "0x" + H[2] + H[2];
      b = "0x" + H[3] + H[3];
    } else if (H.length === 7) {
      r = "0x" + H[1] + H[2];
      g = "0x" + H[3] + H[4];
      b = "0x" + H[5] + H[6];
    }
    r /= 255; g /= 255; b /= 255;
    let cmin = Math.min(r,g,b),
        cmax = Math.max(r,g,b),
        delta = cmax - cmin,
        h = 0, s = 0, l = 0;

    if (delta === 0) h = 0;
    else if (cmax === r) h = ((g - b) / delta) % 6;
    else if (cmax === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;

    h = Math.round(h * 60);
    if (h < 0) h += 360;

    l = (cmax + cmin) / 2;
    s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
    s = +(s * 100).toFixed(1);
    l = +(l * 100).toFixed(1);

    return `${h} ${s}% ${l}%`;
  };

  // Helper: Calculate foreground (Black/White)
  const calculateForeground = (h, s, l) => {
      if (l > 60) return "222.2 84% 4.9%";
      return "210 40% 98%";
  };
  const parseHSL = (hslString) => {
     if (!hslString) return { h: 0, s: 0, l: 0 };
     const parts = hslString.replace(/,/g, "").split(" ").filter(Boolean);
     if (parts.length < 3) return { h: 0, s: 0, l: 0 };
     return { h: parseFloat(parts[0]), s: parseFloat(parts[1]), l: parseFloat(parts[2]) };
  };

  // Initialize
  useEffect(() => {
    if (themeSettings) {
        if (themeSettings.primary) {
            setPrimaryColor(hslToHex(themeSettings.primary));
        }
        if (themeSettings.radius) setRadius(parseFloat(themeSettings.radius) || 0.5);
        if (themeSettings.fontFamily) setFontFamily(themeSettings.fontFamily);
    }
  }, [themeSettings]);

  // Handle changes
  const handleColorChange = (e) => {
      const hex = e.target.value;
      setPrimaryColor(hex);
      
      const hsl = hexToHSL(hex);
      const p = parseHSL(hsl);
      const fg = calculateForeground(p.h, p.s, p.l);

      // We ONLY update primary/radius/font preview
      // We explicitly send empty cssVars to clear any previous clutter in preview
      updateThemePreview({ 
          ...themeSettings, 
          primary: hsl, 
          radius: `${radius}rem`, 
          fontFamily,
          cssVars: { "--primary-foreground": fg } 
      });
  };

  const handleRadiusChange = (val) => {
      const r = val[0];
      setRadius(r);
      
      const hsl = hexToHSL(primaryColor);
      const p = parseHSL(hsl);
      const fg = calculateForeground(p.h, p.s, p.l);

      updateThemePreview({ 
          ...themeSettings, 
          primary: hsl,
          radius: `${r}rem`, 
          fontFamily,
          cssVars: { "--primary-foreground": fg }
      });
  };

  const handleFontChange = (val) => {
      setFontFamily(val);
      
      const hsl = hexToHSL(primaryColor);
      const p = parseHSL(hsl);
      const fg = calculateForeground(p.h, p.s, p.l);

      updateThemePreview({ 
          ...themeSettings, 
          primary: hsl,
          radius: `${radius}rem`, 
          fontFamily: val,
          cssVars: { "--primary-foreground": fg }
      });
  };

  const handleSave = async () => {
      setIsLoading(true);
      try {
          const primaryHSL = hexToHSL(primaryColor);
          const p = parseHSL(primaryHSL);
          const fg = calculateForeground(p.h, p.s, p.l);

          const payload = {
              theme: {
                  primary: primaryHSL,
                  radius: `${radius}rem`,
                  fontFamily,
                  // AGGRESSIVE CLEANUP: Explicitly set all known variable keys to null 
                  // to force the backend/frontend to fallback to system defaults.
                  // This assumes the backend supports partial updates or we are replacing the whole map.
                  // If the backend merges, setting to null should delete the key in Mongoose Map.
                  cssVars: {
                      "--primary-foreground": fg,
                      "--secondary": null, "--secondary-foreground": null,
                      "--accent": null, "--accent-foreground": null,
                      "--muted": null, "--muted-foreground": null,
                      "--destructive": null, "--destructive-foreground": null,
                      "--card": null, "--card-foreground": null,
                      "--popover": null, "--popover-foreground": null,
                      "--background": null, "--foreground": null,
                      "--border": null, "--input": null, "--ring": null
                  }
              }
          };
          await platformAPI.updateSettings(payload);
          toast.success("Theme restored significantly! Please reload.");
      } catch (error) {
          console.error("Failed to save theme", error);
          toast.error("Failed to save theme changes.");
      } finally {
          setIsLoading(false);
      }
  };

  const handleReset = () => {
     const defaultPrimary = "#0f172a";
     setPrimaryColor(defaultPrimary);
     setRadius(0.5);
     setFontFamily("Inter");
     
     const hsl = hexToHSL(defaultPrimary);
     // Resetting sends clean state
     updateThemePreview({ 
         primary: hsl, 
         radius: "0.5rem", 
         fontFamily: "Inter",
         cssVars: { "--primary-foreground": "210 40% 98%" }
     });
  };

  return (
    <Card className="w-full">
        <CardHeader>
            <CardTitle>Theme Customization</CardTitle>
            <CardDescription>Customize the primary brand color and typography.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
            
            {/* Primary Color */}
            <div className="space-y-2">
                <Label htmlFor="primary-color">Primary Brand Color</Label>
                <div className="flex items-center gap-4">
                    <Input
                        id="primary-color"
                        type="color"
                        value={primaryColor}
                        onChange={handleColorChange}
                        className="w-16 h-10 p-1 cursor-pointer"
                    />
                    <Input
                        value={primaryColor}
                        onChange={handleColorChange}
                        className="font-mono text-sm w-32"
                    />
                </div>
                <p className="text-sm text-muted-foreground">
                    This color will be used for main buttons, active states, and highlights.
                </p>
            </div>

            <div className="h-px bg-border" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <Label htmlFor="radius">Border Radius: {radius}rem</Label>
                    <Slider
                        id="radius"
                        min={0}
                        max={2}
                        step={0.1}
                        value={[radius]}
                        onValueChange={handleRadiusChange}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="font-family">Font Family</Label>
                    <Select value={fontFamily} onValueChange={handleFontChange}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a font" />
                        </SelectTrigger>
                        <SelectContent>
                            {fontOptions.map((font) => (
                                <SelectItem key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                                    {font.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="p-6 border rounded-lg bg-card text-card-foreground shadow-sm">
                <h4 className="text-sm font-medium mb-4">Preview Elements</h4>
                <div className="flex flex-col gap-4">
                    <div className="flex flex-wrap gap-3">
                        <Button>Primary Action</Button>
                        <Button variant="secondary">Secondary</Button>
                        <Button variant="outline">Outline</Button>
                        <Button variant="destructive">Destructive</Button>
                        <Button variant="ghost">Ghost</Button>
                    </div>
                </div>
            </div>

        </CardContent>
        <CardFooter className="flex justify-between">
            <Button variant="ghost" onClick={handleReset} disabled={isLoading}>
                <RefreshCcw className="mr-2 h-4 w-4" /> Reset to Defaults
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
                <Save className="mr-2 h-4 w-4" /> Save Changes
            </Button>
        </CardFooter>
    </Card>
  );
};

export default ThemeEditor;
