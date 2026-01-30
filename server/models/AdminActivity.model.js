const { Schema, model } = require("mongoose");

const adminActivitySchema = new Schema(
  {
    admin: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: ["CREATE", "UPDATE", "DELETE", "SUSPEND", "UNSUSPEND", "SETTINGS_UPDATE"],
    },
    targetType: {
      type: String,
      required: true,
      enum: ["User", "Artwork", "Event", "Order", "PlatformSettings"],
    },
    targetId: {
      type: String, // Can be ObjectId or string (e.g. "global")
      required: true,
    },
    details: {
      type: Object, // Store diff or reason
      default: {},
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

adminActivitySchema.index({ admin: 1 });
adminActivitySchema.index({ action: 1 });
adminActivitySchema.index({ createdAt: -1 });

const AdminActivity = model("AdminActivity", adminActivitySchema);

module.exports = AdminActivity;
