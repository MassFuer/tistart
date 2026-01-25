const express = require("express");
const router = express.Router();
const { geocodeAddress, reverseGeocode } = require("../utils/geolocation");
const { isAuthenticated } = require("../middleware/jwt.middleware");

// POST /api/geocode - Geocode an address to coordinates
router.post("/", isAuthenticated, async (req, res, next) => {
  try {
    const { street, streetNum, zipCode, city, country } = req.body;

    // Validate at least city or country is provided
    if (!city && !country) {
      return res.status(400).json({
        error: "At least city or country is required for geocoding.",
      });
    }

    const result = await geocodeAddress({
      street,
      streetNum,
      zipCode,
      city,
      country,
    });

    if (!result) {
      return res.status(404).json({
        error: "Could not find coordinates for this address. Try a more specific address.",
      });
    }

    res.status(200).json({
      data: {
        lat: result.lat,
        lng: result.lng,
        displayName: result.displayName,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/geocode/reverse - Reverse geocode coordinates to address
router.post("/reverse", isAuthenticated, async (req, res, next) => {
  try {
    const { lat, lng } = req.body;

    // Validate coordinates
    if (typeof lat !== "number" || typeof lng !== "number") {
      return res.status(400).json({
        error: "Valid lat and lng coordinates are required.",
      });
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({
        error: "Coordinates out of valid range.",
      });
    }

    const result = await reverseGeocode(lat, lng);

    if (!result) {
      return res.status(404).json({
        error: "Could not find address for these coordinates.",
      });
    }

    res.status(200).json({
      data: {
        street: result.street,
        streetNum: result.streetNum,
        city: result.city,
        zipCode: result.zipCode,
        country: result.country,
        displayName: result.displayName,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
