import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import { GeoSearchControl, OpenStreetMapProvider } from "leaflet-geosearch";
import L from "leaflet";
import "./LocationMap.css";

// Fix for default marker icon in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Component to handle map clicks
const MapClickHandler = ({ onLocationChange, editable }) => {
  useMapEvents({
    click: (e) => {
      if (editable && onLocationChange) {
        onLocationChange({
          lat: e.latlng.lat,
          lng: e.latlng.lng,
        });
      }
    },
  });
  return null;
};

// Component to add search control
const SearchControl = ({ onLocationChange }) => {
  const map = useMap();
  const searchControlRef = useRef(null);

  useEffect(() => {
    if (searchControlRef.current) return;

    const provider = new OpenStreetMapProvider();

    const searchControl = new GeoSearchControl({
      provider,
      style: "bar",
      showMarker: false,
      showPopup: false,
      autoClose: true,
      retainZoomLevel: false,
      animateZoom: true,
      keepResult: true,
      searchLabel: "Search address...",
    });

    map.addControl(searchControl);
    searchControlRef.current = searchControl;

    // Listen for search results
    map.on("geosearch/showlocation", (result) => {
      if (onLocationChange && result.location) {
        onLocationChange({
          lat: result.location.y,
          lng: result.location.x,
          address: result.location.label,
        });
      }
    });

    return () => {
      if (searchControlRef.current) {
        map.removeControl(searchControlRef.current);
        searchControlRef.current = null;
      }
    };
  }, [map, onLocationChange]);

  return null;
};

// Component to update map view when coordinates change
const MapUpdater = ({ coordinates }) => {
  const map = useMap();

  useEffect(() => {
    if (coordinates?.lat && coordinates?.lng) {
      map.setView([coordinates.lat, coordinates.lng], 15);
    }
  }, [coordinates, map]);

  return null;
};

const LocationMap = ({
  coordinates,
  onLocationChange,
  editable = false,
  height = "300px",
  showSearch = true,
  zoom = 13,
}) => {
  // Default center (Paris)
  const defaultCenter = [48.8566, 2.3522];

  const center = coordinates?.lat && coordinates?.lng
    ? [coordinates.lat, coordinates.lng]
    : defaultCenter;

  const hasValidCoordinates = coordinates?.lat && coordinates?.lng;

  return (
    <div className="location-map-container" style={{ height }}>
      <MapContainer
        center={center}
        zoom={hasValidCoordinates ? zoom : 4}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {hasValidCoordinates && (
          <Marker position={[coordinates.lat, coordinates.lng]} />
        )}

        {editable && (
          <MapClickHandler onLocationChange={onLocationChange} editable={editable} />
        )}

        {editable && showSearch && (
          <SearchControl onLocationChange={onLocationChange} />
        )}

        <MapUpdater coordinates={coordinates} />
      </MapContainer>

      {editable && (
        <p className="map-hint">
          Click on the map or use the search bar to set the location
        </p>
      )}
    </div>
  );
};

export default LocationMap;
