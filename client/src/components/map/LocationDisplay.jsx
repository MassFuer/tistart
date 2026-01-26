import { MapPin } from "lucide-react";
import LocationMap from "./LocationMap";

const LocationDisplay = ({
  address = {},
  coordinates,
  showMap = true,
  height = "200px",
  layout = "horizontal", // 'horizontal' | 'vertical'
}) => {
  // Format address parts
  const formatAddress = () => {
    const parts = [];

    // Street line
    const streetLine = [address.streetNum, address.street].filter(Boolean).join(" ");
    if (streetLine) parts.push(streetLine);

    // City line
    const cityLine = [address.zipCode, address.city].filter(Boolean).join(" ");
    if (cityLine) parts.push(cityLine);

    // Country
    if (address.country) parts.push(address.country);

    return parts;
  };

  const addressLines = formatAddress();
  const hasAddress = addressLines.length > 0;
  const hasCoordinates = coordinates?.lat != null && coordinates?.lng != null;

  if (!hasAddress && !hasCoordinates) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground p-4 bg-muted/30 rounded-lg">
        <MapPin className="h-5 w-5" />
        <span>No location set</span>
      </div>
    );
  }

  return (
    <div className={`flex ${layout === "horizontal" ? "flex-col md:flex-row gap-6" : "flex-col gap-4"} w-full`}>
      {hasAddress && (
        <div className="flex items-start gap-3 min-w-[200px]">
          <MapPin className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
          <div className="flex flex-col gap-1">
            {address.venue && <span className="font-semibold text-lg">{address.venue}</span>}
            {addressLines.map((line, index) => (
              <span key={index} className="text-foreground">{line}</span>
            ))}
          </div>
        </div>
      )}

      {showMap && hasCoordinates && (
        <div className="flex-1 rounded-lg overflow-hidden border shadow-sm relative z-0" style={{ height }}>
          <LocationMap
            coordinates={coordinates}
            editable={false}
            height="100%"
            showSearch={false}
            zoom={15}
          />
        </div>
      )}
    </div>
  );
};

export default LocationDisplay;
