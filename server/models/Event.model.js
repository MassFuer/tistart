const { Schema, model } = require("mongoose");

const locationSchema = new Schema(
  {
    venue: { type: String, trim: true },
    // Address fields (consistent with User addressSchema)
    street: { type: String, trim: true },
    streetNum: { type: String, trim: true },
    zipCode: { type: String, trim: true },
    city: { type: String, trim: true },
    country: { type: String, trim: true },
    // Online event fields
    isOnline: { type: Boolean, default: false },
    onlineUrl: { type: String, trim: true },
    // GeoJSON Point for geolocation queries (optional)
    // NOTE: Only set this field when you have valid coordinates
    // If empty/invalid, do NOT include this field at all (2dsphere index requires valid GeoJSON)
    coordinates: {
      type: {
        type: String,
        enum: ["Point"],
        required: function () {
          // Only required if coordinates array exists and has values
          return this.coordinates?.coordinates?.length > 0;
        },
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
      },
    },
  },
  { _id: false }
);

const eventSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required."],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters."],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, "Description cannot exceed 2000 characters."],
    },
    artist: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Artist is required."],
    },
    startDateTime: {
      type: Date,
      required: [true, "Start date and time is required."],
    },
    endDateTime: {
      type: Date,
      required: [true, "End date and time is required."],
    },
    location: {
      type: locationSchema,
      default: () => ({}),
    },
    price: {
      type: Number,
      default: 0, // 0 for free events
      min: [0, "Price cannot be negative."],
    },
    maxCapacity: {
      type: Number,
      default: 0, // 0 means unlimited
      min: [0, "Capacity cannot be negative."],
    },
    attendees: [
      {
        user: {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
        status: {
          type: String,
          enum: ["pending", "confirmed", "cancelled"],
          default: "confirmed",
        },
        ticketCode: {
          type: String,
        },
        purchasedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    category: {
      type: String,
      required: [true, "Category is required."],
      enum: ["exhibition", "concert", "workshop", "meetup", "other"],
    },
    image: {
      type: String, // R2 URL
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Validation: endDateTime must be after startDateTime
eventSchema.pre("validate", function () {
  if (this.endDateTime && this.startDateTime && this.endDateTime <= this.startDateTime) {
    this.invalidate("endDateTime", "End date must be after start date.");
  }
});

// Auto-geocode address when location fields change
eventSchema.pre("save", async function () {
  // Skip if online-only event
  if (this.location?.isOnline && !this.location?.city) {
    return;
  }

  // Check if address fields were modified
  const addressModified =
    this.isModified("location.street") ||
    this.isModified("location.streetNum") ||
    this.isModified("location.city") ||
    this.isModified("location.country") ||
    this.isModified("location.zipCode");

  if (addressModified && (this.location?.city || this.location?.country)) {
    try {
      const { geocodeAddress, toGeoJSONPoint } = require("../utils/geolocation");
      const coords = await geocodeAddress({
        street: this.location.street,
        streetNum: this.location.streetNum,
        zipCode: this.location.zipCode,
        city: this.location.city,
        country: this.location.country,
      });

      if (coords) {
        this.location.coordinates = toGeoJSONPoint(coords.lat, coords.lng);
      }
    } catch (error) {
      console.error("Auto-geocoding failed:", error.message);
      // Don't block save if geocoding fails
    }
  }
});

// Clean up invalid coordinates before saving (prevents 2dsphere index errors)
eventSchema.pre("save", function () {
  if (this.location && this.location.coordinates) {
    const coords = this.location.coordinates;
    // Check if coordinates are valid GeoJSON
    const isValid =
      coords.type === "Point" &&
      Array.isArray(coords.coordinates) &&
      coords.coordinates.length === 2 &&
      typeof coords.coordinates[0] === "number" &&
      typeof coords.coordinates[1] === "number" &&
      !isNaN(coords.coordinates[0]) &&
      !isNaN(coords.coordinates[1]);

    if (!isValid) {
      // Remove invalid coordinates entirely
      this.location.coordinates = undefined;
    }
  }
});

// Virtual for checking if event is free
eventSchema.virtual("isFree").get(function () {
  return this.price === 0;
});

// Virtual for checking if event is full
eventSchema.virtual("isFull").get(function () {
  const current = this.attendees ? this.attendees.length : 0;
  return this.maxCapacity > 0 && current >= this.maxCapacity;
});

// Virtual for currentAttendees
eventSchema.virtual("currentAttendees").get(function () {
  return this.attendees ? this.attendees.length : 0;
});

// Virtual for available spots
eventSchema.virtual("availableSpots").get(function () {
  if (this.maxCapacity === 0) return null; // unlimited
  // Access the virtual property or calculate directly
  const current = this.attendees ? this.attendees.length : 0;
  return Math.max(0, this.maxCapacity - current);
});

// Virtual for formatted address
eventSchema.virtual("formattedAddress").get(function () {
  if (!this.location) return null;
  const parts = [];
  if (this.location.streetNum) parts.push(this.location.streetNum);
  if (this.location.street) parts.push(this.location.street);
  if (this.location.zipCode) parts.push(this.location.zipCode);
  if (this.location.city) parts.push(this.location.city);
  if (this.location.country) parts.push(this.location.country);
  return parts.length > 0 ? parts.join(", ") : null;
});

// Ensure virtuals are included in JSON output
eventSchema.set("toJSON", { virtuals: true });
eventSchema.set("toObject", { virtuals: true });

// Indexes for efficient queries
eventSchema.index({ artist: 1 });
eventSchema.index({ startDateTime: 1 });
eventSchema.index({ category: 1 });
eventSchema.index({ isPublic: 1 });
eventSchema.index({ "location.coordinates": "2dsphere" }); // Geospatial index

// Flag new document for post-save hook
eventSchema.pre("save", function (next) {
  this.wasNew = this.isNew;
  next();
});

eventSchema.post("save", async function (doc) {
  try {
    if (this.wasNew) {
      const User = model("User");
      const PlatformStats = require("./PlatformStats.model");

      // Update Artist Stats
      await User.findByIdAndUpdate(doc.artist, { $inc: { "stats.events": 1 } });

      // Update Platform Stats
      await PlatformStats.updateOne(
        { _id: "global" },
        { $inc: { "events.total": 1 } },
        { upsert: true }
      );
    }
  } catch (err) {
    console.error("Error updating stats in Event post-save hook:", err);
  }
});

eventSchema.post("findOneAndDelete", async function (doc) {
  if (doc) {
    try {
      const User = model("User");
      const PlatformStats = require("./PlatformStats.model");

      // Update Artist Stats
      await User.findByIdAndUpdate(doc.artist, { $inc: { "stats.events": -1 } });

      // Update Platform Stats
      await PlatformStats.updateOne(
        { _id: "global" },
        { $inc: { "events.total": -1 } }
      );
    } catch (err) {
      console.error("Error updating stats in Event post-delete hook:", err);
    }
  }
});

const Event = model("Event", eventSchema);

module.exports = Event;
