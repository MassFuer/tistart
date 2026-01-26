import { useState, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import { platformAPI } from "../../services/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { RefreshCcw, Save } from "lucide-react";

const ThemeEditor = () => {
  const { updateThemePreview, themeSettings } = useTheme();
  const [primaryColor, setPrimaryColor] = useState("#000000");
  const [radius, setRadius] = useState(0.5);
  const [isLoading, setIsLoading] = useState(false);

  // Helper: HSL string to Hex
  const hslToHex = (hslString) => {
      if (!hslString) return "#000000";
      // Expect "h s% l%"
      const [h, sStr, lStr] = hslString.split(" ");
      if(!h || !sStr || !lStr) return "#000000";

      const s = parseInt(sStr) / 100;
      const l = parseInt(lStr) / 100;

      let c = (1 - Math.abs(2 * l - 1)) * s,
          x = c * (1 - Math.abs(((h / 60) % 2) - 1)),
          m = l - c / 2,
          r = 0,
          g = 0,
          b = 0;

      if (0 <= h && h < 60) { r = c; g = x; b = 0; }
      else if (60 <= h && h < 120) { r = x; g = c; b = 0; }
      else if (120 <= h && h < 180) { r = 0; g = c; b = x; }
      else if (180 <= h && h < 240) { r = 0; g = x; b = c; }
      else if (240 <= h && h < 300) { r = x; g = 0; b = c; }
      else if (300 <= h && h < 360) { r = c; g = 0; b = x; }

      r = Math.round((r + m) * 255).toString(16);
      g = Math.round((g + m) * 255).toString(16);
      b = Math.round((b + m) * 255).toString(16);

      if (r.length === 1) r = "0" + r;
      if (g.length === 1) g = "0" + g;
      if (b.length === 1) b = "0" + b;

      return "#" + r + g + b;
  };

  // Helper: Hex to HSL string
  const hexToHSL = (H) => {
    // Convert hex to RGB first
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
    // Then to HSL
    r /= 255;
    g /= 255;
    b /= 255;
    let cmin = Math.min(r,g,b),
        cmax = Math.max(r,g,b),
        delta = cmax - cmin,
        h = 0,
        s = 0,
        l = 0;

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

  // Initialize from context
  useEffect(() => {
    if (themeSettings?.primary) {
        try {
            setPrimaryColor(hslToHex(themeSettings.primary));
        } catch(e) {
            console.error("Error parsing primary color", e);
        }
    }
    if (themeSettings?.radius) {
        setRadius(parseFloat(themeSettings.radius) || 0.5);
    }
  }, [themeSettings]);

  // Handle changes (Live Preview)
  const handleColorChange = (e) => {
      const hex = e.target.value;
      setPrimaryColor(hex);
      const hsl = hexToHSL(hex);
      updateThemePreview({ ...themeSettings, primary: hsl, radius: `${radius}rem` });
  };

  const handleRadiusChange = (val) => {
      const r = val[0];
      setRadius(r);
      updateThemePreview({ ...themeSettings, primary: hexToHSL(primaryColor), radius: `${r}rem` });
  };

  const handleSave = async () => {
      setIsLoading(true);
      try {
          const payload = {
              theme: {
                  primary: hexToHSL(primaryColor),
                  radius: `${radius}rem`
              }
          };
          await platformAPI.updateSettings(payload);
          toast.success("Theme saved successfully!");
      } catch (error) {
          console.error("Failed to save theme", error);
          toast.error("Failed to save theme changes.");
      } finally {
          setIsLoading(false);
      }
  };

  const handleReset = () => {
     // Default Shadcn values
     const defaultPrimary = "#0f172a"; // approx for 240 5.9% 10%
     setPrimaryColor(defaultPrimary);
     setRadius(0.5);
     const hsl = hexToHSL(defaultPrimary);
     updateThemePreview({ primary: "240 5.9% 10%", radius: "0.5rem" });
  };

  return (
    <Card>
        <CardHeader>
            <CardTitle>Theme Customization</CardTitle>
            <CardDescription>Customize the look and feel of your platform. Changes apply live.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
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
                        className="font-mono"
                    />
                </div>
                <p className="text-xs text-muted-foreground">Sets the --primary color variable.</p>
            </div>

            <div className="space-y-4">
                <div className="flex justify-between">
                    <Label htmlFor="radius">Border Radius: {radius}rem</Label>
                </div>
                <Slider
                    id="radius"
                    min={0}
                    max={2}
                    step={0.1}
                    value={[radius]}
                    onValueChange={handleRadiusChange}
                />
            </div>

            <div className="p-4 border rounded-lg bg-muted/50">
                <h4 className="text-sm font-medium mb-3">Preview Elements</h4>
                <div className="flex flex-wrap gap-2">
                    <Button>Primary Button</Button>
                    <Button variant="secondary">Secondary</Button>
                    <Button variant="outline">Outline</Button>
                    <Button variant="destructive">Destructive</Button>
                </div>
            </div>
        </CardContent>
        <CardFooter className="flex justify-between">
            <Button variant="ghost" onClick={handleReset} disabled={isLoading}>
                <RefreshCcw className="mr-2 h-4 w-4" /> Reset
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
                <Save className="mr-2 h-4 w-4" /> Save Changes
            </Button>
        </CardFooter>
    </Card>
  );
};

export default ThemeEditor;
