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

  // Structural Colors State - LIGHT
  const [bgColorLight, setBgColorLight] = useState("#ffffff");
  const [textColorLight, setTextColorLight] = useState("#000000");
  const [cardColorLight, setCardColorLight] = useState("#ffffff");
  const [cardTextColorLight, setCardTextColorLight] = useState("#000000");
  const [primaryForegroundLight, setPrimaryForegroundLight] = useState("#fafafa");
  const [secondaryColorLight, setSecondaryColorLight] = useState("#f4f4f5");
  const [secondaryForegroundLight, setSecondaryForegroundLight] = useState("#18181b");

  // Structural Colors State - DARK
  const [bgColorDark, setBgColorDark] = useState("#0a0a0b"); // Default dark
  const [textColorDark, setTextColorDark] = useState("#fafafa");
  const [cardColorDark, setCardColorDark] = useState("#18181b");
  const [cardTextColorDark, setCardTextColorDark] = useState("#fafafa");
  const [primaryForegroundDark, setPrimaryForegroundDark] = useState("#fafafa");
  const [secondaryColorDark, setSecondaryColorDark] = useState("#27272a");
  const [secondaryForegroundDark, setSecondaryForegroundDark] = useState("#fafafa");

  const [activeMode, setActiveMode] = useState("light"); // 'light' or 'dark'

  const fontOptions = [
      { label: "Inter (Default)", value: "Inter" },
      { label: "Geist Sans", value: "Geist Sans" },
      { label: "Segoe UI", value: "Segoe UI" },
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

  // Video Hero State
  const [heroConfig, setHeroConfig] = useState({
      text: "VIDEO ARTWORKS",
      textSize: "12vw",
      videoUrl: "",
      backgroundSoundUrl: ""
  });
  const [uploadingHero, setUploadingHero] = useState(false);
  const [availableVideos, setAvailableVideos] = useState([]);
  const [availableSounds, setAvailableSounds] = useState([]);

  // Initialize
  useEffect(() => {
    const init = async () => {
        try {
            // Fetch platform settings for Hero
            const settingsRes = await platformAPI.getSettings();
            if (settingsRes.data.data.hero) {
                setHeroConfig(prev => ({ ...prev, ...settingsRes.data.data.hero }));
            }

            // Fetch available assets
            const assetsRes = await platformAPI.listAssets("platform/hero");
            if (assetsRes.data.data) {
                const videos = assetsRes.data.data.filter(a => 
                    a.key.endsWith('.mp4') || a.key.endsWith('.webm') || a.key.endsWith('.mov')
                );
                const sounds = assetsRes.data.data.filter(a => 
                    a.key.endsWith('.mp3') || a.key.endsWith('.wav') || a.key.endsWith('.aac')
                );
                setAvailableVideos(videos);
                setAvailableSounds(sounds);
            }

        } catch (error) {
            console.error("Failed to fetch settings or assets", error);
        }

        if (themeSettings) {
            if (themeSettings.primary) {
                setPrimaryColor(hslToHex(themeSettings.primary));
            }
            if (themeSettings.radius) setRadius(parseFloat(themeSettings.radius) || 0.5);
            if (themeSettings.fontFamily) setFontFamily(themeSettings.fontFamily);
            
            // Initialize Light Mode Colors
            if (themeSettings.cssVarsLight) {
                if (themeSettings.cssVarsLight["--background"]) setBgColorLight(hslToHex(themeSettings.cssVarsLight["--background"]));
                if (themeSettings.cssVarsLight["--foreground"]) setTextColorLight(hslToHex(themeSettings.cssVarsLight["--foreground"]));
                if (themeSettings.cssVarsLight["--card"]) setCardColorLight(hslToHex(themeSettings.cssVarsLight["--card"]));
                if (themeSettings.cssVarsLight["--card-foreground"]) setCardTextColorLight(hslToHex(themeSettings.cssVarsLight["--card-foreground"]));
                
                if (themeSettings.cssVarsLight["--primary-foreground"]) setPrimaryForegroundLight(hslToHex(themeSettings.cssVarsLight["--primary-foreground"]));
                if (themeSettings.cssVarsLight["--secondary"]) setSecondaryColorLight(hslToHex(themeSettings.cssVarsLight["--secondary"]));
                if (themeSettings.cssVarsLight["--secondary-foreground"]) setSecondaryForegroundLight(hslToHex(themeSettings.cssVarsLight["--secondary-foreground"]));
            }

            // Initialize Dark Mode Colors
            if (themeSettings.cssVarsDark) {
                if (themeSettings.cssVarsDark["--background"]) setBgColorDark(hslToHex(themeSettings.cssVarsDark["--background"]));
                if (themeSettings.cssVarsDark["--foreground"]) setTextColorDark(hslToHex(themeSettings.cssVarsDark["--foreground"]));
                if (themeSettings.cssVarsDark["--card"]) setCardColorDark(hslToHex(themeSettings.cssVarsDark["--card"]));
                if (themeSettings.cssVarsDark["--card-foreground"]) setCardTextColorDark(hslToHex(themeSettings.cssVarsDark["--card-foreground"]));
                
                if (themeSettings.cssVarsDark["--primary-foreground"]) setPrimaryForegroundDark(hslToHex(themeSettings.cssVarsDark["--primary-foreground"]));
                if (themeSettings.cssVarsDark["--secondary"]) setSecondaryColorDark(hslToHex(themeSettings.cssVarsDark["--secondary"]));
                if (themeSettings.cssVarsDark["--secondary-foreground"]) setSecondaryForegroundDark(hslToHex(themeSettings.cssVarsDark["--secondary-foreground"]));
            }
        }
    };
    init();
  }, [themeSettings]);

  // Handle changes
  const handleColorChange = (e) => {
      const hex = e.target.value;
      setPrimaryColor(hex);
      
      const hsl = hexToHSL(hex);
      const p = parseHSL(hsl);
      const fg = calculateForeground(p.h, p.s, p.l);
      
      // Update both foregrounds if they haven't been customized? 
      // Or just let user manage it. We'll leave them as is.

      updateThemePreview({ 
          ...themeSettings, 
          primary: hsl, 
          radius: `${radius}rem`, 
          fontFamily,
          // We need to send both maps for preview to work fully if context switches
          cssVarsLight: generateCssVars("light"),
          cssVarsDark: generateCssVars("dark")
      });
  };

  const generateCssVars = (mode) => {
      const isLight = mode === "light";
      return {
          "--background": hexToHSL(isLight ? bgColorLight : bgColorDark),
          "--foreground": hexToHSL(isLight ? textColorLight : textColorDark),
          "--card": hexToHSL(isLight ? cardColorLight : cardColorDark),
          "--card-foreground": hexToHSL(isLight ? cardTextColorLight : cardTextColorDark),
          "--popover": hexToHSL(isLight ? cardColorLight : cardColorDark),
          "--popover-foreground": hexToHSL(isLight ? cardTextColorLight : cardTextColorDark),
          "--primary-foreground": hexToHSL(isLight ? primaryForegroundLight : primaryForegroundDark),
          "--secondary": hexToHSL(isLight ? secondaryColorLight : secondaryColorDark),
          "--secondary-foreground": hexToHSL(isLight ? secondaryForegroundLight : secondaryForegroundDark),
      };
  }

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
      updateThemePreview({ ...themeSettings, fontFamily: val });
  };

  // Generic handler for structural colors
  const handleModeColorChange = (mode, key, val) => {
      // mode: 'light' or 'dark', key: 'bgColor', val: hex
      
      // Update State
      if (mode === "light") {
          if (key === "bgColor") setBgColorLight(val);
          if (key === "textColor") setTextColorLight(val);
          if (key === "cardColor") setCardColorLight(val);
          if (key === "cardTextColor") setCardTextColorLight(val);
          if (key === "primaryFg") setPrimaryForegroundLight(val);
          if (key === "secColor") setSecondaryColorLight(val);
          if (key === "secFg") setSecondaryForegroundLight(val);
      } else {
          if (key === "bgColor") setBgColorDark(val);
          if (key === "textColor") setTextColorDark(val);
          if (key === "cardColor") setCardColorDark(val);
          if (key === "cardTextColor") setCardTextColorDark(val);
          if (key === "primaryFg") setPrimaryForegroundDark(val);
          if (key === "secColor") setSecondaryColorDark(val);
          if (key === "secFg") setSecondaryForegroundDark(val);
      }

      // PREVIEW UPDATE
      // We construct the NEW state just for the preview call
      // Since state update is async, we use 'val' for the changed property
      const currentLight = generateCssVars("light");
      const currentDark = generateCssVars("dark");
      
      // Map state key to CSS var
      const keyMap = {
          "bgColor": "--background",
          "textColor": "--foreground",
          "cardColor": "--card",
          "cardTextColor": "--card-foreground",
          "primaryFg": "--primary-foreground",
          "secColor": "--secondary",
          "secFg": "--secondary-foreground"
      };

      const cssVarKey = keyMap[key];
      const newHSL = hexToHSL(val);

      if (mode === "light") {
          currentLight[cssVarKey] = newHSL;
          currentLight["--popover"] = currentLight["--card"]; // sync
          currentLight["--popover-foreground"] = currentLight["--card-foreground"];
      } else {
          currentDark[cssVarKey] = newHSL;
          currentDark["--popover"] = currentDark["--card"];
          currentDark["--popover-foreground"] = currentDark["--card-foreground"];
      }

      const primaryHSL = hexToHSL(primaryColor);
      
      updateThemePreview({ 
          ...themeSettings, 
          primary: primaryHSL,
          radius: `${radius}rem`, 
          fontFamily,
          cssVarsLight: currentLight,
          cssVarsDark: currentDark
      });
  };

  // Handle Asset Upload
  const handleAssetUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    // Basic validation
    if (type === "videoUrl" && !file.type.startsWith("video/")) {
        toast.error("Please upload a valid video file.");
        return;
    }
    if (type === "backgroundSoundUrl" && !file.type.startsWith("audio/")) {
        toast.error("Please upload a valid audio file.");
        return;
    }

    setUploadingHero(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
        const response = await platformAPI.uploadAsset(formData);
        const { url } = response.data.data;
        
        setHeroConfig(prev => ({
            ...prev,
            [type]: url
        }));
        toast.success(`${type === "videoUrl" ? "Video" : "Audio"} uploaded successfully!`);
    } catch (error) {
        console.error("Asset upload failed", error);
        toast.error("Failed to upload file.");
    } finally {
        setUploadingHero(false);
    }
  };

  const handleSave = async () => {
      setIsLoading(true);
      try {
          const primaryHSL = hexToHSL(primaryColor);
          
          const payload = {
              theme: {
                  primary: primaryHSL,
                  radius: `${radius}rem`,
                  fontFamily,
                  cssVarsLight: generateCssVars("light"),
                  cssVarsDark: generateCssVars("dark")
              },
              hero: heroConfig
          };
          await platformAPI.updateSettings(payload);
          toast.success("Theme & Hero saved! Reloading...", {
            action: {
              label: "Reload Now",
              onClick: () => window.location.reload(),
            },
            onDismiss: () => window.location.reload(),
            onAutoClose: () => window.location.reload(),
          });
          setTimeout(() => window.location.reload(), 2000); 
      } catch (error) {
          console.error("Failed to save theme", error);
          toast.error("Failed to save theme changes.");
      } finally {
          setIsLoading(false);
      }
  };

  const handleReset = () => {
     // Default Beige Theme Values
     const defPrimary = "#1a1a1c"; 
     const defRadius = 0.5;
     
     // Light
     const l_Bg = "#f8f7f5"; 
     const l_Fg = "#0a0a0b"; 
     const l_Card = "#fcfbf7"; 
     const l_CardFg = "#0a0a0b"; 
     const l_Sec = "#f4f4f5"; 
     const l_SecFg = "#18181b"; 
     const l_PrimFg = "#fafafa";

     // Dark
     const d_Bg = "#0c0a09"; // Very dark warm gray
     const d_Fg = "#fafafa"; 
     const d_Card = "#1c1917"; 
     const d_CardFg = "#fafafa"; 
     const d_Sec = "#292524"; 
     const d_SecFg = "#fafafa";
     const d_PrimFg = "#fafafa";

     setPrimaryColor(defPrimary);
     setRadius(defRadius);
     setFontFamily("Inter");

     // Reset Light State
     setBgColorLight(l_Bg); setTextColorLight(l_Fg); setCardColorLight(l_Card); setCardTextColorLight(l_CardFg); 
     setSecondaryColorLight(l_Sec); setSecondaryForegroundLight(l_SecFg); setPrimaryForegroundLight(l_PrimFg);

     // Reset Dark State
     setBgColorDark(d_Bg); setTextColorDark(d_Fg); setCardColorDark(d_Card); setCardTextColorDark(d_CardFg); 
     setSecondaryColorDark(d_Sec); setSecondaryForegroundDark(d_SecFg); setPrimaryForegroundDark(d_PrimFg);
     
     const hsl = hexToHSL(defPrimary);
     // Resetting sends clean state
     updateThemePreview({ 
         primary: hsl, 
         radius: `${defRadius}rem`, 
         fontFamily: "Inter",
         cssVarsLight: {
            "--background": hexToHSL(l_Bg), "--foreground": hexToHSL(l_Fg),
            "--card": hexToHSL(l_Card), "--card-foreground": hexToHSL(l_CardFg),
            "--secondary": hexToHSL(l_Sec), "--secondary-foreground": hexToHSL(l_SecFg),
            "--primary-foreground": hexToHSL(l_PrimFg),
         },
         cssVarsDark: {
            "--background": hexToHSL(d_Bg), "--foreground": hexToHSL(d_Fg),
            "--card": hexToHSL(d_Card), "--card-foreground": hexToHSL(d_CardFg),
            "--secondary": hexToHSL(d_Sec), "--secondary-foreground": hexToHSL(d_SecFg),
            "--primary-foreground": hexToHSL(d_PrimFg),
         }
     });
     
     toast.success("Reset to factory defaults");
  };

  return (
    <div className="space-y-6">
        {/* --- HERO CUSTOMIZATION --- */}
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Video Page Hero</CardTitle>
                <CardDescription>Customize the background video, overlay text, and ambient sound for the /videos page.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2 md:col-span-3">
                        <Label htmlFor="hero-text">Overlay Text</Label>
                        <Input 
                            id="hero-text" 
                            value={heroConfig.text} 
                            onChange={(e) => setHeroConfig(prev => ({ ...prev, text: e.target.value }))}
                            placeholder="e.g. VIDEO ARTWORKS"
                        />
                    </div>
                    <div className="space-y-2 md:col-span-1">
                        <Label htmlFor="hero-text-size">Text Size</Label>
                        <Input 
                            id="hero-text-size" 
                            value={heroConfig.textSize || "12vw"} 
                            onChange={(e) => setHeroConfig(prev => ({ ...prev, textSize: e.target.value }))}
                            placeholder="e.g. 12vw"
                        />
                        <p className="text-[10px] text-muted-foreground">Use vw, rem, or px</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label>Background Video</Label>
                        <div className="flex flex-col gap-3">
                            <div className="flex gap-2">
                                <Input 
                                    type="file" 
                                    accept="video/*" 
                                    onChange={(e) => handleAssetUpload(e, "videoUrl")}
                                    disabled={uploadingHero}
                                    className="cursor-pointer flex-1"
                                />
                                 <Select 
                                    onValueChange={(val) => setHeroConfig(prev => ({ ...prev, videoUrl: val }))} 
                                    value={availableVideos.find(v => v.url === heroConfig.videoUrl) ? heroConfig.videoUrl : ""}
                                 >
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="Select existing" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableVideos.map((vid) => (
                                            <SelectItem key={vid.key} value={vid.url}>
                                                {vid.key.split('/').pop()}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {heroConfig.videoUrl && (
                                <div className="space-y-2 p-2 border rounded-md">
                                    <p className="text-xs text-muted-foreground break-all">
                                        Current: {heroConfig.videoUrl.split('/').pop()}
                                    </p>
                                    <video 
                                        src={heroConfig.videoUrl} 
                                        className="w-full h-auto max-h-[200px] rounded" 
                                        controls 
                                        muted
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Ambient Sound (Loop)</Label>
                        <div className="flex flex-col gap-3">
                             <div className="flex gap-2">
                                <Input 
                                    type="file" 
                                    accept="audio/*" 
                                    onChange={(e) => handleAssetUpload(e, "backgroundSoundUrl")}
                                    disabled={uploadingHero}
                                    className="cursor-pointer flex-1"
                                />
                                <Select 
                                    onValueChange={(val) => setHeroConfig(prev => ({ ...prev, backgroundSoundUrl: val }))}
                                    value={availableSounds.find(s => s.url === heroConfig.backgroundSoundUrl) ? heroConfig.backgroundSoundUrl : ""}
                                >
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="Select existing" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableSounds.map((snd) => (
                                            <SelectItem key={snd.key} value={snd.url}>
                                                {snd.key.split('/').pop()}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {heroConfig.backgroundSoundUrl && (
                                <div className="space-y-2 p-2 border rounded-md">
                                    <p className="text-xs text-muted-foreground break-all">
                                        Current: {heroConfig.backgroundSoundUrl.split('/').pop()}
                                    </p>
                                    <audio 
                                        src={heroConfig.backgroundSoundUrl} 
                                        className="w-full h-8" 
                                        controls 
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>

        {/* --- THEME CUSTOMIZATION --- */}
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Theme Customization</CardTitle>
                <CardDescription>Customize the primary brand color and typography.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
                
                <div className="h-px bg-border" />

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-end">
                    <div className="space-y-2 col-span-2 md:col-span-1">
                        <Label htmlFor="radius">Radius: {radius}rem</Label>
                        <Slider
                            id="radius"
                            min={0}
                            max={2}
                            step={0.1}
                            value={[radius]}
                            onValueChange={handleRadiusChange}
                            className="py-2"
                        />
                    </div>

                    <div className="space-y-2 col-span-2 md:col-span-1">
                        <Label htmlFor="font-family">Font Family</Label>
                        <Select value={fontFamily} onValueChange={handleFontChange}>
                            <SelectTrigger className="w-full h-9">
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
                    
                     <div className="space-y-2 col-span-2 md:col-span-2">
                         <Label>Primary Brand Color</Label>
                        <div className="flex items-center gap-2">
                            <Input
                                id="primary-color"
                                type="color"
                                value={primaryColor}
                                onChange={handleColorChange}
                                className="w-12 h-9 p-0.5 cursor-pointer"
                            />
                            <Input
                                value={primaryColor}
                                onChange={handleColorChange}
                                className="font-mono text-xs w-24 h-9"
                            />
                            <p className="text-xs text-muted-foreground ml-2">
                                 Used for main buttons & active states.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="h-px bg-border" />

                {/* Mode Switcher */}
                <div className="flex justify-center pb-2">
                    <div className="flex items-center gap-2 bg-muted p-1 rounded-lg">
                        <Button 
                            variant={activeMode === "light" ? "default" : "ghost"} 
                            size="sm"
                            onClick={() => setActiveMode("light")}
                            className="w-32 h-8"
                        >
                            ☀ Light Mode
                        </Button>
                        <Button 
                            variant={activeMode === "dark" ? "default" : "ghost"} 
                            size="sm"
                            onClick={() => setActiveMode("dark")}
                             className="w-32 h-8"
                        >
                            🌙 Dark Mode
                        </Button>
                    </div>
                </div>

                <div className="p-4 border rounded-lg bg-card/50">
                    <div className="text-center pb-4">
                        <h3 className="font-semibold text-lg">
                            {activeMode === "light" ? "Light Mode Palette" : "Dark Mode Palette"}
                        </h3>
                        <p className="text-muted-foreground text-xs">
                            {activeMode === "light" ? "Light" : "Dark"} mode specific overrides.
                        </p>
                    </div>
                    
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Background Color */}
                        <div className="space-y-1.5">
                            <Label className="text-xs">App Background</Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    type="color"
                                    value={activeMode === "light" ? bgColorLight : bgColorDark}
                                    onChange={(e) => handleModeColorChange(activeMode, "bgColor", e.target.value)}
                                    className="w-full h-8 p-1 cursor-pointer"
                                />
                            </div>
                        </div>

                        {/* Text Color */}
                        <div className="space-y-1.5">
                            <Label className="text-xs">App Text</Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    type="color"
                                    value={activeMode === "light" ? textColorLight : textColorDark}
                                    onChange={(e) => handleModeColorChange(activeMode, "textColor", e.target.value)}
                                    className="w-full h-8 p-1 cursor-pointer"
                                />
                            </div>
                        </div>

                        {/* Card Background */}
                        <div className="space-y-1.5">
                            <Label className="text-xs">Card Background</Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    type="color"
                                    value={activeMode === "light" ? cardColorLight : cardColorDark}
                                    onChange={(e) => handleModeColorChange(activeMode, "cardColor", e.target.value)}
                                    className="w-full h-8 p-1 cursor-pointer"
                                />
                            </div>
                        </div>

                        {/* Card Text */}
                        <div className="space-y-1.5">
                            <Label className="text-xs">Card Text</Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    type="color"
                                    value={activeMode === "light" ? cardTextColorLight : cardTextColorDark}
                                    onChange={(e) => handleModeColorChange(activeMode, "cardTextColor", e.target.value)}
                                    className="w-full h-8 p-1 cursor-pointer"
                                />
                            </div>
                        </div>
                        
                        {/* Secondary Button */}
                        <div className="space-y-1.5">
                            <Label className="text-xs">Secondary Btn</Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    type="color"
                                    value={activeMode === "light" ? secondaryColorLight : secondaryColorDark}
                                    onChange={(e) => handleModeColorChange(activeMode, "secColor", e.target.value)}
                                    className="w-full h-8 p-1 cursor-pointer"
                                />
                            </div>
                        </div>

                        {/* Secondary Text */}
                        <div className="space-y-1.5">
                            <Label className="text-xs">Secondary Text</Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    type="color"
                                    value={activeMode === "light" ? secondaryForegroundLight : secondaryForegroundDark}
                                    onChange={(e) => handleModeColorChange(activeMode, "secFg", e.target.value)}
                                    className="w-full h-8 p-1 cursor-pointer"
                                />
                            </div>
                        </div>

                        {/* Primary Text */}
                        <div className="space-y-1.5">
                            <Label className="text-xs">Primary Btn Text</Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    type="color"
                                    value={activeMode === "light" ? primaryForegroundLight : primaryForegroundDark}
                                    onChange={(e) => handleModeColorChange(activeMode, "primaryFg", e.target.value)}
                                    className="w-full h-8 p-1 cursor-pointer"
                                />
                            </div>
                        </div>
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
                <Button onClick={handleSave} disabled={isLoading || uploadingHero}>
                    {uploadingHero ? (
                        <>Uploading...</>
                    ) : (
                        <><Save className="mr-2 h-4 w-4" /> Save Changes</>
                    )}
                </Button>
            </CardFooter>
        </Card>
    </div>
  );
};

export default ThemeEditor;
