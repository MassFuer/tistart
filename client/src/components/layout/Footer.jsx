import { Link } from "react-router-dom";
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from 'leaflet';

// Fix for default marker icon in Leaflet with React/Vite
// We need to ensure these images are handled correctly by bundler
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const position = [43.2965, 5.3698]; // Marseille

  return (
    <footer className="bg-muted/30 border-t pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          
          {/* BRAND */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold tracking-tight">Nemesis</h3>
            <p className="text-muted-foreground leading-relaxed">
              The premier platform for discovering and collecting extraordinary artworks from talented artists worldwide.
            </p>
          </div>

          {/* LINKS */}
          <div className="space-y-4">
            <h4 className="font-semibold text-lg">Quick Links</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li>
                <Link to="/gallery" className="hover:text-primary transition-colors">Gallery</Link>
              </li>
              <li>
                <Link to="/events" className="hover:text-primary transition-colors">Events</Link>
              </li>
              <li>
                <Link to="/apply-artist" className="hover:text-primary transition-colors">Become an Artist</Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-primary transition-colors">About Us</Link>
              </li>
            </ul>
          </div>

          {/* CONTACT */}
          <div className="space-y-4">
            <h4 className="font-semibold text-lg">Contact Us</h4>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-primary" />
                <span>mass@fuer.fr</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-primary" />
                <span>+33 (6) 03 77 41 72</span>
              </li>
              <li className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-primary" />
                <span>13000 Marseille, France</span>
              </li>
            </ul>
          </div>

          {/* MAP */}
          <div className="space-y-4 h-[250px] rounded-lg overflow-hidden border shadow-sm">
             <MapContainer center={position} zoom={13} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }}>
                <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={position}>
                <Popup>
                    Nemesis Studio <br /> 13000 Marseille
                </Popup>
                </Marker>
            </MapContainer>
          </div>
        </div>

        {/* BOTTOM */}
        <div className="border-t pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            &copy; {currentYear} Nemesis. All rights reserved.
          </p>
          
          <div className="flex gap-6 text-muted-foreground">
             <Link to="/terms" className="text-sm hover:text-primary transition-colors">Terms</Link>
             <Link to="/privacy" className="text-sm hover:text-primary transition-colors">Privacy</Link>
             <Link to="/cookies" className="text-sm hover:text-primary transition-colors">Cookies</Link>
          </div>

          <div className="flex gap-4">
            <a href="#" className="h-10 w-10 rounded-full bg-background border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-all">
                <Facebook className="h-5 w-5" />
            </a>
            <a href="#" className="h-10 w-10 rounded-full bg-background border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-all">
                <Instagram className="h-5 w-5" />
            </a>
            <a href="#" className="h-10 w-10 rounded-full bg-background border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-all">
                <Twitter className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
