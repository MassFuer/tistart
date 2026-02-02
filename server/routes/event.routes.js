const express = require("express");
const router = express.Router();

const Event = require("../models/Event.model");
const User = require("../models/User.model"); // Import User model for company filtering
const { isAuthenticated } = require("../middleware/jwt.middleware");
const { isVerifiedArtist, isAdminRole } = require("../middleware/role.middleware");
const {
  uploadEvent,
  processAndUploadEvent,
  checkStorageQuota,
  updateUserStorage,
  deleteFile,
} = require("../utils/r2");
const { body } = require("express-validator");
const { validate } = require("../middleware/validation.middleware");
const crypto = require("crypto");
const { sendEventAttendanceEmail } = require("../utils/email");

// GET /api/events/filters-meta - Get metadata for filters (cities, companies, artists)
router.get("/filters-meta", async (req, res, next) => {
  try {
    const [cities, companies, artists] = await Promise.all([
      Event.distinct("location.city", { isPublic: true }),
      User.distinct("artistInfo.companyName", { role: "artist" }), // Only artists have company names relevant here
      User.find({ role: "artist", artistStatus: "verified" })
        .select("firstName lastName artistInfo.companyName _id")
        .lean(),
    ]);

    // Filter out null/empty values
    const cleanCities = cities.filter((c) => c);
    const cleanCompanies = companies.filter((c) => c);

    res.status(200).json({
      cities: cleanCities.sort(),
      companies: cleanCompanies.sort(),
      artists: artists.map((a) => ({
        _id: a._id,
        name: `${a.firstName} ${a.lastName}`,
        companyName: a.artistInfo?.companyName,
      })),
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/events - Get all events (public)
router.get("/", async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      artist,
      startDate,
      endDate,
      isPublic = "true",
      upcoming = "false",
      sort = "startDateTime",
      search,
      city,
      company,
      attendee,
    } = req.query;

    // Build filter object
    const filter = {};

    if (category) {
      filter.category = category;
    }

    if (city) {
      filter["location.city"] = { $regex: city, $options: "i" };
    }

    if (company) {
      // Find artists with this company name
      const artists = await User.find({
        "artistInfo.companyName": { $regex: company, $options: "i" },
        role: "artist", // Optional: ensure they are artists
      }).select("_id");

      const artistIds = artists.map((a) => a._id);

      // If artist filter is also present, intersect?
      // Current logic: If artist param exists, it overrides specific company search or intersects?
      // Mongoose doesn't allow duplicate keys.
      // If 'artist' param is set, it's specific ID. 'company' finds multiple IDs.
      // If both present, maybe intersect. But frontend usually picks one.
      // We'll prioritize 'artist' param if set, else use company list.
      if (!artist) {
        filter.artist = { $in: artistIds };
      }
    }

    if (artist) {
      filter.artist = artist;
    }

    if (attendee) {
      filter["attendees.user"] = attendee;
    }

    // Only show public events by default
    if (isPublic === "true") {
      filter.isPublic = true;
    }

    // Filter by date range
    if (startDate || endDate) {
      filter.startDateTime = {};
      if (startDate) filter.startDateTime.$gte = new Date(startDate);
      if (endDate) filter.startDateTime.$lte = new Date(endDate);
    }
    // Search filter on title (case-insensitive)
    if (search) {
      filter.title = { $regex: search, $options: "i" };
    }

    // Show only upcoming events
    if (upcoming === "true") {
      filter.startDateTime = { $gte: new Date() };
    }

    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Execute query
    const [events, total] = await Promise.all([
      Event.find(filter)
        .populate("artist", "firstName lastName userName artistInfo.companyName profilePicture")
        .sort(sort)
        .skip(skip)
        .limit(Number(limit)),
      Event.countDocuments(filter),
    ]);

    res.status(200).json({
      data: events,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/events/calendar - Get events for calendar view (public)
router.get("/calendar", async (req, res, next) => {
  try {
    const { start, end, artist, search, category } = req.query;

    if (!start || !end) {
      return res.status(400).json({ error: "Start and end dates are required." });
    }

    const filter = {
      isPublic: true,
      startDateTime: { $lt: new Date(end) },
      endDateTime: { $gt: new Date(start) },
    };

    if (category) {
      filter.category = category;
    }

    if (artist) {
      filter.artist = artist;
    }

    if (search) {
      filter.title = { $regex: search, $options: "i" };
    }

    const events = await Event.find(filter)
      .populate("artist", "firstName lastName userName artistInfo.companyName")
      .select("title startDateTime endDateTime category location.isOnline")
      .lean();

    // Format for FullCalendar
    const calendarEvents = events.map((event) => ({
      id: event._id,
      title: event.title,
      start: event.startDateTime,
      end: event.endDateTime,
      extendedProps: {
        category: event.category,
        artist: event.artist,
        isOnline: event.location?.isOnline,
      },
    }));

    res.status(200).json({ data: calendarEvents });
  } catch (error) {
    next(error);
  }
});

// GET /api/events/artist/:artistId - Get events by artist (public)
// IMPORTANT: This route must be before /:id to prevent "artist" being matched as an ID
router.get("/artist/:artistId", async (req, res, next) => {
  try {
    const { page = 1, limit = 12, upcoming = "false" } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter = {
      artist: req.params.artistId,
      isPublic: true,
    };

    if (upcoming === "true") {
      filter.startDateTime = { $gte: new Date() };
    }

    const [events, total] = await Promise.all([
      Event.find(filter).sort("startDateTime").skip(skip).limit(Number(limit)).lean(),
      Event.countDocuments(filter),
    ]);

    res.status(200).json({
      data: events,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/events/:id - Get single event (public)
router.get("/:id", async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id).populate(
      "artist",
      "firstName lastName userName artistInfo profilePicture"
    );

    if (!event) {
      return res.status(404).json({ error: "Event not found." });
    }

    // Check if event is public or user is the owner
    if (!event.isPublic) {
      // Could add authentication check here for private events
      return res.status(404).json({ error: "Event not found." });
    }

    res.status(200).json({ data: event });
  } catch (error) {
    next(error);
  }
});

// POST /api/events - Create event (verified artists only)
router.post(
  "/",
  isAuthenticated,
  isVerifiedArtist,
  [
    body("title").notEmpty().withMessage("Title is required"),
    body("startDateTime").isISO8601().withMessage("Start date must be a valid date"),
    body("endDateTime").isISO8601().withMessage("End date must be a valid date"),
    body("category").notEmpty().withMessage("Category is required"),
    validate,
  ],
  async (req, res, next) => {
    try {
      const {
        title,
        description,
        startDateTime,
        endDateTime,
        location,
        price,
        maxCapacity,
        category,
        isPublic,
      } = req.body;

      // Determine artist ID
      let artistId = req.payload._id;
      if (isAdminRole(req.payload.role) && req.body.artist) {
        artistId = req.body.artist;
      }

      // Prepare location object
      let eventLocation = {};
      if (location) {
        eventLocation = {
          venue: location.venue,
          street: location.street,
          streetNum: location.streetNum,
          zipCode: location.zipCode,
          city: location.city,
          country: location.country,
          isOnline: location.isOnline || false,
          onlineUrl: location.onlineUrl,
        };

        // If coordinates are explicitly provided (from map), use them
        if (location.coordinates?.coordinates?.length === 2) {
          eventLocation.coordinates = {
            type: "Point",
            coordinates: location.coordinates.coordinates,
          };
        }
      }

      const event = await Event.create({
        title,
        description,
        artist: artistId,
        startDateTime: new Date(startDateTime),
        endDateTime: new Date(endDateTime),
        location: eventLocation,
        price: price || 0,
        maxCapacity: maxCapacity || 0,
        category,
        isPublic: isPublic !== undefined ? isPublic : true,
      });

      res.status(201).json({ data: event });
    } catch (error) {
      next(error);
    }
  }
);

// PATCH /api/events/:id - Update event (owner only)
router.patch("/:id", isAuthenticated, isVerifiedArtist, async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ error: "Event not found." });
    }

    // Check if user is the owner OR admin/superAdmin
    if (!isAdminRole(req.payload.role) && event.artist.toString() !== req.payload._id.toString()) {
      return res.status(403).json({ error: "You can only update your own events." });
    }

    const allowedFields = [
      "title",
      "description",
      "startDateTime",
      "endDateTime",
      "price",
      "maxCapacity",
      "category",
      "isPublic",
    ];

    // Update simple fields
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        if (field === "startDateTime" || field === "endDateTime") {
          event[field] = new Date(req.body[field]);
        } else {
          event[field] = req.body[field];
        }
      }
    }

    // Handle location separately to support both address and coordinates
    if (req.body.location) {
      const loc = req.body.location;

      // Update address fields
      if (loc.venue !== undefined) event.location.venue = loc.venue;
      if (loc.street !== undefined) event.location.street = loc.street;
      if (loc.streetNum !== undefined) event.location.streetNum = loc.streetNum;
      if (loc.zipCode !== undefined) event.location.zipCode = loc.zipCode;
      if (loc.city !== undefined) event.location.city = loc.city;
      if (loc.country !== undefined) event.location.country = loc.country;
      if (loc.isOnline !== undefined) event.location.isOnline = loc.isOnline;
      if (loc.onlineUrl !== undefined) event.location.onlineUrl = loc.onlineUrl;

      // If coordinates are explicitly provided (from map click), use them
      // Otherwise, the pre-save hook will geocode the address
      if (loc.coordinates?.coordinates?.length === 2) {
        event.location.coordinates = {
          type: "Point",
          coordinates: loc.coordinates.coordinates,
        };
      }
    }

    // Save to trigger pre-save hooks (auto-geocoding if address changed)
    await event.save();

    // Populate artist for response
    await event.populate("artist", "firstName lastName userName artistInfo.companyName");

    res.status(200).json({ data: event });
  } catch (error) {
    console.error("Error updating event:", error);
    console.error(error.stack);
    next(error);
  }
});

// DELETE /api/events/:id - Delete event (owner only)
router.delete("/:id", isAuthenticated, isVerifiedArtist, async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ error: "Event not found." });
    }

    // Check if user is the owner OR admin/superAdmin
    if (!isAdminRole(req.payload.role) && event.artist.toString() !== req.payload._id.toString()) {
      return res.status(403).json({ error: "You can only delete your own events." });
    }

    // Delete associated image from R2 and update storage
    if (event.image) {
      await deleteFile(event.image, event.artist.toString());
    }

    await Event.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: "Event deleted successfully." });
  } catch (error) {
    next(error);
  }
});

// POST /api/events/:id/image - Upload event image (owner only)
router.post(
  "/:id/image",
  isAuthenticated,
  isVerifiedArtist,
  uploadEvent.single("image"),
  checkStorageQuota,
  processAndUploadEvent,
  async (req, res, next) => {
    try {
      const event = await Event.findById(req.params.id);

      if (!event) {
        return res.status(404).json({ error: "Event not found." });
      }

      // Check if user is the owner OR admin/superAdmin
      if (
        !isAdminRole(req.payload.role) &&
        event.artist.toString() !== req.payload._id.toString()
      ) {
        return res.status(403).json({ error: "You can only upload images to your own events." });
      }

      if (!req.uploadedFile) {
        return res.status(400).json({ error: "No image provided." });
      }

      // Delete old image if exists
      if (event.image) {
        await deleteFile(event.image, event.artist.toString());
      }

      event.image = req.uploadedFile.url;
      await event.save();

      // Update storage tracking
      await updateUserStorage(event.artist.toString(), req.uploadedFile.size, "image");

      res.status(200).json({ data: event });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/events/:id/attend - Join event (authenticated users)
// Uses atomic operation to prevent race conditions with capacity
router.post("/:id/attend", isAuthenticated, async (req, res, next) => {
  try {
    const userId = req.payload._id;

    // First, check basic event info
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ error: "Event not found." });
    }

    // Check if past event
    if (new Date(event.endDateTime) < new Date()) {
      return res.status(400).json({ error: "Cannot join past events." });
    }

    // Check if user already joined
    const isAttending = event.attendees?.some((a) => a.user?.toString() === userId.toString());

    if (isAttending) {
      return res.status(400).json({ error: "You have already joined this event." });
    }

    // Use atomic update with capacity check to prevent race conditions
    // This ensures only maxCapacity users can join even with concurrent requests
    const query = {
      _id: req.params.id,
      "attendees.user": { $ne: userId }, // User not already in attendees
    };

    // Add capacity check to query if maxCapacity is set
    if (event.maxCapacity > 0) {
      query.$expr = { $lt: [{ $size: "$attendees" }, event.maxCapacity] };
    }

    // Generate confirmation token
    const confirmationToken = crypto.randomBytes(32).toString("hex");
    const confirmationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    console.log("Adding user to attendees:", userId);

    const updatedEvent = await Event.findOneAndUpdate(
      query,
      {
        $addToSet: {
          attendees: {
            user: userId,
            status: "notConfirmed",
            confirmationToken,
            confirmationTokenExpires,
          },
        },
      },
      { new: true }
    ).populate("artist", "firstName lastName userName artistInfo.companyName profilePicture");

    if (!updatedEvent) {
      console.log("Failed to update event. Checking reasons...");
      // Check why it failed
      const currentEvent = await Event.findById(req.params.id);
      if (
        currentEvent.maxCapacity > 0 &&
        currentEvent.attendees.length >= currentEvent.maxCapacity
      ) {
        return res.status(400).json({ error: "Event is full." });
      }
      if (currentEvent.attendees.some((a) => a.user?.toString() === userId.toString())) {
        return res.status(400).json({ error: "You have already joined this event." });
      }
      return res.status(400).json({ error: "Could not join event. Please try again." });
    }

    console.log("Event updated successfully, sending email...");

    // Send confirmation email (non-blocking)
    const user = await User.findById(userId).select("email firstName").lean();
    if (user?.email) {
      console.log(
        `[EVENT-JOIN] Sending confirmation email for event "${updatedEvent.title}" to user: ${user.email} (${user.firstName})`
      );
      const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
      const confirmationLink = `${clientUrl}/events/${updatedEvent._id}/confirm-attendance/${confirmationToken}`;

      sendEventAttendanceEmail(user.email, user.firstName, {
        eventTitle: updatedEvent.title,
        eventDate: updatedEvent.startDateTime,
        eventLocation:
          updatedEvent.formattedAddress ||
          updatedEvent.location?.venue ||
          updatedEvent.location?.city ||
          "TBA",
        confirmationLink: confirmationLink,
      })
        .then(() => {
          console.log(`[EVENT-JOIN] Confirmation email sent successfully to ${user.email}`);
        })
        .catch((err) => {
          console.error(`[EVENT-JOIN] Confirmation email failed for ${user.email}:`, err);
        });
    } else {
      console.warn(
        `[EVENT-JOIN] User ${userId} has no email or not found, skipping confirmation email`
      );
    }

    res.status(200).json({
      message: "Successfully registered. Check your email to confirm attendance.",
      data: updatedEvent,
    });
  } catch (error) {
    console.error("Error joining event:", error);
    console.error(error.stack);
    next(error);
  }
});

// POST /api/events/:id/resend-confirmation - Resend confirmation email
router.post("/:id/resend-confirmation", isAuthenticated, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.payload._id;

    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({ error: "Event not found." });
    }

    const attendee = event.attendees.find((a) => a.user?.toString() === userId.toString());

    if (!attendee) {
      return res.status(400).json({ error: "You are not registered for this event." });
    }

    if (attendee.status !== "notConfirmed") {
      return res.status(400).json({ error: "Attendance already confirmed or cancelled." });
    }

    // Generate new token and expiration
    const newToken = crypto.randomBytes(32).toString("hex");
    const newExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Update attendee
    attendee.confirmationToken = newToken;
    attendee.confirmationTokenExpires = newExpiry;

    event.markModified("attendees");
    await event.save();

    // Send confirmation email
    const user = await User.findById(userId).select("email firstName").lean();
    if (user?.email) {
      const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
      const confirmationLink = `${clientUrl}/events/${event._id}/confirm-attendance/${newToken}`;

      sendEventAttendanceEmail(user.email, user.firstName, {
        eventTitle: event.title,
        eventDate: event.startDateTime,
        eventLocation:
          event.formattedAddress || event.location?.venue || event.location?.city || "TBA",
        confirmationLink,
      })
        .then(() => console.log(`[EVENT-RESEND] Email sent to ${user.email}`))
        .catch((err) => console.error(`[EVENT-RESEND] Email failed for ${user.email}:`, err));
    }

    res.status(200).json({
      message: "Confirmation email resent successfully. Please check your inbox.",
      data: event,
    });
  } catch (error) {
    console.error("Error resending confirmation:", error);
    next(error);
  }
});

// DELETE /api/events/:id/attend - Leave event (authenticated users)
router.delete("/:id/attend", isAuthenticated, async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ error: "Event not found." });
    }

    // Ensure attendees array exists
    if (!event.attendees) {
      event.attendees = [];
    }

    // Check if user is in attendees (robust comparison)
    const isAttending = event.attendees.some(
      (a) => a?.user?.toString() === req.payload._id.toString()
    );

    if (!isAttending) {
      return res.status(400).json({ error: "You are not registered for this event." });
    }

    // Remove user
    event.attendees = event.attendees.filter(
      (a) => a?.user?.toString() !== req.payload._id.toString()
    );
    await event.save();

    // Populate artist before sending response
    await event.populate(
      "artist",
      "firstName lastName userName artistInfo.companyName profilePicture"
    );

    res.status(200).json({ message: "Successfully left event.", data: event });
  } catch (error) {
    console.error("Error leaving event:", error);
    console.error(error.stack);
    next(error);
  }
});

// GET /api/events/:id/confirm-attendance/:token - Confirm attendance via email link
router.get("/:id/confirm-attendance/:token", async (req, res, next) => {
  try {
    const { id, token } = req.params;
    const now = new Date();

    console.log(
      `[EVENT-CONFIRM] Attempting to confirm event ${id} with token ${token.substring(0, 8)}`
    );

    const event = await Event.findOneAndUpdate(
      {
        _id: id,
        attendees: {
          $elemMatch: {
            confirmationToken: token,
            confirmationTokenExpires: { $gt: now },
          },
        },
      },
      {
        $set: {
          "attendees.$.status": "registered",
          "attendees.$.confirmedAt": now,
        },
        $unset: {
          "attendees.$.confirmationToken": "",
          "attendees.$.confirmationTokenExpires": "",
        },
      },
      { new: true }
    );

    if (!event) {
      console.warn(
        `[EVENT-CONFIRM] Failed to confirm. Token may be invalid, expired, or already used.`
      );
      return res.status(404).json({ error: "Invalid or expired confirmation link." });
    }

    console.log(`[EVENT-CONFIRM] Attendance confirmed for event ${id}`);

    res.status(200).json({ message: "Attendance confirmed successfully." });
  } catch (error) {
    next(error);
  }
});

// GET /api/events/:id/attendees - Get attendees list (Owner, Admin, SuperAdmin only)
router.get("/:id/attendees", isAuthenticated, async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const event = await Event.findById(req.params.id).select("artist attendees");

    if (!event) {
      return res.status(404).json({ error: "Event not found." });
    }

    // Check permissions
    const isOwner = event.artist.toString() === req.payload._id.toString();
    const hasAdminAccess = isAdminRole(req.payload.role);

    if (!isOwner && !hasAdminAccess) {
      return res.status(403).json({ error: "Unauthorized access to attendee list." });
    }

    const total = event.attendees?.length || 0;

    // Paginate in-memory (attendees are subdocuments)
    const paginatedIds = (event.attendees || [])
      .sort((a, b) => (b.registeredAt || 0) - (a.registeredAt || 0))
      .slice(skip, skip + Number(limit));

    // Populate user details for the page
    const userIds = paginatedIds.map((a) => a.user).filter((id) => id); // Filter out null/undefined IDs

    const users = await User.find({ _id: { $in: userIds } })
      .select("firstName lastName userName email profilePicture")
      .lean();

    const userMap = {};
    users.forEach((u) => {
      userMap[u._id.toString()] = u;
    });

    const attendees = paginatedIds.map((a) => ({
      user: userMap[a.user?.toString()] || null,
      status: a.status,
      registeredAt: a.registeredAt,
      confirmedAt: a.confirmedAt,
    }));

    res.status(200).json({
      data: attendees,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
