/**
 * Geolocation Utility
 *
 * Provides geocoding functionality to convert addresses to coordinates
 * and calculate distances between locations.
 *
 * Uses OpenStreetMap Nominatim API (free, no API key required)
 * Rate limit: 1 request per second
 */

const https = require("https");

// Rate limiting for Nominatim API
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1100; // 1.1 seconds between requests

/**
 * Wait to respect rate limits
 */
const waitForRateLimit = async () => {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise((resolve) =>
      setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest)
    );
  }

  lastRequestTime = Date.now();
};

/**
 * Make HTTPS request to Nominatim API
 */
const nominatimRequest = (path) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "nominatim.openstreetmap.org",
      path: encodeURI(path),
      method: "GET",
      headers: {
        "User-Agent": "NemesisArtPlatform/1.0",
        "Accept": "application/json",
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error("Failed to parse geocoding response"));
        }
      });
    });

    req.on("error", reject);
    req.end();
  });
};

/**
 * Geocode an address to coordinates
 *
 * @param {Object} address - Address object with street, city, country, etc.
 * @returns {Object|null} - { lat, lng } or null if not found
 */
const geocodeAddress = async (address) => {
  try {
    if (!address || (!address.city && !address.country)) {
      return null;
    }

    await waitForRateLimit();

    // Build address query
    const parts = [];
    if (address.street) parts.push(address.street);
    if (address.streetNum) parts.push(address.streetNum);
    if (address.zipCode) parts.push(address.zipCode);
    if (address.city) parts.push(address.city);
    if (address.country) parts.push(address.country);

    const query = parts.join(", ");
    const path = `/search?q=${query}&format=json&limit=1`;

    const results = await nominatimRequest(path);

    if (results && results.length > 0) {
      return {
        lat: parseFloat(results[0].lat),
        lng: parseFloat(results[0].lon),
        displayName: results[0].display_name,
        boundingBox: results[0].boundingbox,
      };
    }

    return null;
  } catch (error) {
    console.error("Geocoding error:", error.message);
    return null;
  }
};

/**
 * Reverse geocode coordinates to address
 *
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Object|null} - Address details or null
 */
const reverseGeocode = async (lat, lng) => {
  try {
    await waitForRateLimit();

    const path = `/reverse?lat=${lat}&lon=${lng}&format=json`;
    const result = await nominatimRequest(path);

    if (result && result.address) {
      return {
        street: result.address.road || result.address.pedestrian,
        streetNum: result.address.house_number,
        city: result.address.city || result.address.town || result.address.village,
        zipCode: result.address.postcode,
        country: result.address.country,
        displayName: result.display_name,
      };
    }

    return null;
  } catch (error) {
    console.error("Reverse geocoding error:", error.message);
    return null;
  }
};

/**
 * Calculate distance between two coordinates using Haversine formula
 *
 * @param {Object} point1 - { lat, lng }
 * @param {Object} point2 - { lat, lng }
 * @param {string} unit - 'km' or 'miles'
 * @returns {number} - Distance in specified unit
 */
const calculateDistance = (point1, point2, unit = "km") => {
  const R = unit === "miles" ? 3959 : 6371; // Earth radius

  const dLat = toRadians(point2.lat - point1.lat);
  const dLng = toRadians(point2.lng - point1.lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(point1.lat)) *
    Math.cos(toRadians(point2.lat)) *
    Math.sin(dLng / 2) *
    Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c * 100) / 100; // Round to 2 decimal places
};

const toRadians = (degrees) => degrees * (Math.PI / 180);

/**
 * Find items within a radius of a point
 *
 * @param {Array} items - Array of items with location.coordinates [lng, lat]
 * @param {Object} center - { lat, lng }
 * @param {number} radiusKm - Radius in kilometers
 * @returns {Array} - Items within radius, sorted by distance
 */
const findWithinRadius = (items, center, radiusKm) => {
  return items
    .map((item) => {
      if (!item.location?.coordinates || item.location.coordinates.length !== 2) {
        return null;
      }

      const [lng, lat] = item.location.coordinates;
      const distance = calculateDistance(center, { lat, lng });

      if (distance <= radiusKm) {
        return { ...item.toObject ? item.toObject() : item, distance };
      }

      return null;
    })
    .filter(Boolean)
    .sort((a, b) => a.distance - b.distance);
};

/**
 * Create a MongoDB geospatial query for finding documents near a point
 *
 * @param {Object} center - { lat, lng }
 * @param {number} maxDistanceMeters - Maximum distance in meters
 * @returns {Object} - MongoDB $near query object
 */
const createNearQuery = (center, maxDistanceMeters) => {
  return {
    $near: {
      $geometry: {
        type: "Point",
        coordinates: [center.lng, center.lat],
      },
      $maxDistance: maxDistanceMeters,
    },
  };
};

/**
 * Create a MongoDB geospatial query for finding documents within a box
 *
 * @param {Object} southWest - { lat, lng } - Bottom-left corner
 * @param {Object} northEast - { lat, lng } - Top-right corner
 * @returns {Object} - MongoDB $geoWithin query object
 */
const createBoxQuery = (southWest, northEast) => {
  return {
    $geoWithin: {
      $box: [
        [southWest.lng, southWest.lat],
        [northEast.lng, northEast.lat],
      ],
    },
  };
};

/**
 * Format coordinates for GeoJSON Point
 *
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Object} - GeoJSON Point object
 */
const toGeoJSONPoint = (lat, lng) => {
  return {
    type: "Point",
    coordinates: [lng, lat], // GeoJSON uses [longitude, latitude] order
  };
};

/**
 * Parse coordinates from GeoJSON Point
 *
 * @param {Object} geoJSONPoint - GeoJSON Point object
 * @returns {Object|null} - { lat, lng } or null
 */
const fromGeoJSONPoint = (geoJSONPoint) => {
  if (!geoJSONPoint?.coordinates || geoJSONPoint.coordinates.length !== 2) {
    return null;
  }

  const [lng, lat] = geoJSONPoint.coordinates;
  return { lat, lng };
};

module.exports = {
  geocodeAddress,
  reverseGeocode,
  calculateDistance,
  findWithinRadius,
  createNearQuery,
  createBoxQuery,
  toGeoJSONPoint,
  fromGeoJSONPoint,
};
