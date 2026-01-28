import { useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import { Link } from "react-router-dom";
import L from "leaflet";
import { format } from "date-fns";
import { useTheme } from "../../context/ThemeContext";

// Category colors for markers
const categoryColors = {
  exhibition: "#9b59b6", // Purple
  concert: "#e74c3c", // Red
  workshop: "#3498db", // Blue
  meetup: "#27ae60", // Green
  other: "#95a5a6", // Gray
};

// Create custom colored marker icon
const createMarkerIcon = (category) => {
  const color = categoryColors[category] || categoryColors.other;

  return L.divIcon({
    className: "custom-marker",
    html: `
      <div class="marker-pin" style="background-color: ${color};">
        <span class="marker-inner"></span>
      </div>
    `,
    iconSize: [30, 42],
    iconAnchor: [15, 42],
    popupAnchor: [0, -42],
  });
};

// Custom cluster icon
const createClusterCustomIcon = (cluster) => {
  const count = cluster.getChildCount();
  let size = "small";
  if (count >= 10) size = "medium";
  if (count >= 50) size = "large";

  return L.divIcon({
    html: `<div class="cluster-marker cluster-${size}"><span>${count}</span></div>`,
    className: "custom-cluster-icon",
    iconSize: L.point(40, 40, true),
  });
};

const EventsMap = ({ events = [], height = "500px", onEventClick }) => {
  const { isDarkMode } = useTheme();

  // Filter events with valid coordinates
  const eventsWithCoordinates = useMemo(() => {
    return events.filter(
      (event) =>
        event.location?.coordinates?.coordinates?.length === 2 &&
        !event.location?.isOnline
    );
  }, [events]);

  // Calculate center based on events or default to Europe
  const center = useMemo(() => {
    if (eventsWithCoordinates.length === 0) {
      return [48.8566, 2.3522]; // Paris as default
    }

    const avgLat =
      eventsWithCoordinates.reduce(
        (sum, e) => sum + e.location.coordinates.coordinates[1],
        0
      ) / eventsWithCoordinates.length;
    const avgLng =
      eventsWithCoordinates.reduce(
        (sum, e) => sum + e.location.coordinates.coordinates[0],
        0
      ) / eventsWithCoordinates.length;

    return [avgLat, avgLng];
  }, [eventsWithCoordinates]);

  const formatDate = (dateString) => {
    return format(new Date(dateString), "MMM d, yyyy");
  };

  const formatTime = (dateString) => {
    return format(new Date(dateString), "h:mm a");
  };

  if (eventsWithCoordinates.length === 0) {
    return (
      <div className="events-map-empty" style={{ height }}>
        <p>No events with locations to display on the map.</p>
        <p className="hint">Events need addresses with coordinates to appear here.</p>
      </div>
    );
  }

  const tileLayerUrl = isDarkMode 
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

  const attribution = isDarkMode
    ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

  return (
    <div className="events-map-container" style={{ height }}>
      {/* Legend */}
      <div className="map-legend">
        <span className="legend-title">Categories:</span>
        {Object.entries(categoryColors).map(([category, color]) => (
          <span key={category} className="legend-item">
            <span className="legend-dot" style={{ backgroundColor: color }} />
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </span>
        ))}
      </div>

      <MapContainer
        center={center}
        zoom={5}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution={attribution}
          url={tileLayerUrl}
        />

        <MarkerClusterGroup
          chunkedLoading
          iconCreateFunction={createClusterCustomIcon}
          maxClusterRadius={60}
          spiderfyOnMaxZoom={true}
          showCoverageOnHover={false}
        >
          {eventsWithCoordinates.map((event) => {
            const [lng, lat] = event.location.coordinates.coordinates;

            return (
              <Marker
                key={event._id}
                position={[lat, lng]}
                icon={createMarkerIcon(event.category)}
              >
                <Popup>
                  <div className="event-popup">
                    {event.image && (
                      <div className="popup-image">
                        <img src={event.image} alt={event.title} />
                      </div>
                    )}
                    <div className="popup-content">
                      <span className={`popup-category ${event.category}`}>
                        {event.category}
                      </span>
                      <h3>{event.title}</h3>
                      <p className="popup-date">
                        {formatDate(event.startDateTime)} at {formatTime(event.startDateTime)}
                      </p>
                      {event.location?.venue && (
                        <p className="popup-venue">{event.location.venue}</p>
                      )}
                      <p className="popup-location">
                        {event.location?.city}, {event.location?.country}
                      </p>
                      <Link to={`/events/${event._id}`} className="popup-link">
                        View Details
                      </Link>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
};

export default EventsMap;
