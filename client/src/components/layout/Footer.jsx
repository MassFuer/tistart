import { Link } from "react-router-dom";
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin, Github } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from 'leaflet';
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

// Fix for default marker icon in Leaflet with React/Vite
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

import { useTheme } from "../../context/ThemeContext";

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const Footer = () => {
  const { isDarkMode } = useTheme();
  const currentYear = new Date().getFullYear();
  const position = [43.2965, 5.3698]; // Marseille

  return (
    <footer className="bg-muted/40 border-t mt-auto">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-3 md:grid-cols-4 gap-2 md:gap-8 text-center md:text-left">
          
          {/* BRAND */}
          <div className="col-span-1 space-y-4 flex flex-col items-center md:items-start">
            <Link to="/" className="inline-block" onClick={() => window.scrollTo(0, 0)}>
                <span className="text-xl md:text-2xl font-bold text-foreground">
                  Nemesis
                </span>
            </Link>
            <p className="text-muted-foreground text-xs md:text-sm leading-relaxed max-w-xs mx-auto md:mx-0">
              The premier platform for discovering and collecting extraordinary artworks from talented artists worldwide.
            </p>
          </div>

          {/* LINKS */}
          <div className="col-span-1 space-y-4">
            <h4 className="font-semibold text-foreground text-sm md:text-base">Quick Links</h4>
            <ul className="space-y-2 text-xs md:text-sm text-muted-foreground flex flex-col items-center md:items-start">
              <li>
                <Link to="/gallery" className="hover:text-primary transition-colors flex items-center gap-2">
                  Gallery
                </Link>
              </li>
              <li>
                <Link to="/events" className="hover:text-primary transition-colors flex items-center gap-2">
                  Events
                </Link>
              </li>
              <li>
                <Link to="/apply-artist" className="hover:text-primary transition-colors flex items-center gap-2">
                  For Artists
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-primary transition-colors flex items-center gap-2">
                  About Us
                </Link>
              </li>
            </ul>
          </div>

          {/* CONTACT */}
          <div className="col-span-1 space-y-4">
            <h4 className="font-semibold text-foreground text-sm md:text-base">Contact Us</h4>
            <ul className="space-y-3 text-xs md:text-sm text-muted-foreground flex flex-col items-center md:items-start">
              <li className="flex flex-col md:flex-row items-center gap-1 md:gap-3">
                <Mail className="h-4 w-4 text-foreground shrink-0" />
                <span className="break-all md:break-normal">mass@fuer.fr</span>
              </li>
              <li className="flex flex-col md:flex-row items-center gap-1 md:gap-3">
                <Phone className="h-4 w-4 text-foreground shrink-0" />
                <span>+33 (6) 03 77 41 72</span>
              </li>
              <li className="flex flex-col md:flex-row items-center gap-1 md:gap-3">
                <MapPin className="h-4 w-4 text-foreground shrink-0" />
                <span>Marseille, FR</span>
              </li>
            </ul>
          </div>

          {/* MAP */}
          <div className="col-span-3 md:col-span-1 h-[200px] w-full rounded-xl overflow-hidden border bg-background shadow-sm mb-4 md:mb-0 mt-4 md:mt-0">
             <MapContainer 
                center={position} 
                zoom={13} 
                scrollWheelZoom={false} 
                style={{ height: "100%", width: "100%" }}
                className="z-0"
             >
                <TileLayer
                    attribution={isDarkMode 
                        ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                        : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    }
                    url={isDarkMode 
                        ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                        : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    }
                />
                <Marker position={position}>
                <Popup>
                    <div className="text-center p-1 text-popover-foreground">
                        <b>Nemesis Studio</b><br />Marseille, FR
                    </div>
                </Popup>
                </Marker>
            </MapContainer>
          </div>
        </div>

        <Separator className="my-8" />

        {/* BOTTOM */}
        <div className="flex flex-col-reverse md:flex-row justify-between items-center gap-6 text-sm text-muted-foreground">
          <p className="text-center md:text-left">
            &copy; {currentYear} Nemesis. All rights reserved.
          </p>
          
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
             <div className="flex gap-6">
                <Link to="/terms" className="hover:text-primary transition-colors">Terms of Service</Link>
                <Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
             </div>

             <div className="flex gap-2">
                <Button variant="ghost" size="icon" className="hover:bg-primary hover:text-primary-foreground rounded-full h-9 w-9">
                    <Facebook className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="hover:bg-primary hover:text-primary-foreground rounded-full h-9 w-9">
                    <Instagram className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="hover:bg-primary hover:text-primary-foreground rounded-full h-9 w-9">
                    <Twitter className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="hover:bg-primary hover:text-primary-foreground rounded-full h-9 w-9">
                    <Github className="h-4 w-4" />
                </Button>
             </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
