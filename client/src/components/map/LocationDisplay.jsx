import { FaMapMarkerAlt } from "react-icons/fa";
import LocationMap from "./LocationMap";
import "./LocationDisplay.css";

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
  const hasCoordinates = coordinates?.lat && coordinates?.lng;

  if (!hasAddress && !hasCoordinates) {
    return (
      <div className="location-display empty">
        <FaMapMarkerAlt className="icon" />
        <span>No location set</span>
      </div>
    );
  }

  return (
    <div className={`location-display ${layout}`}>
      {hasAddress && (
        <div className="address-text">
          <FaMapMarkerAlt className="icon" />
          <div className="address-lines">
            {address.venue && <span className="venue">{address.venue}</span>}
            {addressLines.map((line, index) => (
              <span key={index} className="line">{line}</span>
            ))}
          </div>
        </div>
      )}

      {showMap && hasCoordinates && (
        <div className="map-wrapper" style={{ height }}>
          <LocationMap
            coordinates={coordinates}
            editable={false}
            height={height}
            showSearch={false}
            zoom={15}
          />
        </div>
      )}
    </div>
  );
};

export default LocationDisplay;
