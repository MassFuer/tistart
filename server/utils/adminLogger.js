const AdminActivity = require("../models/AdminActivity.model");
const logger = require("./logger");

/**
 * Log an admin action to the database
 * @param {Object} params
 * @param {string} params.adminId - ID of the admin performing the action
 * @param {string} params.action - Action type (CREATE, UPDATE, DELETE, etc.)
 * @param {string} params.targetType - Target model (User, Artwork, etc.)
 * @param {string} params.targetId - ID of the target
 * @param {Object} [params.details] - Additional details (e.g. changes)
 * @param {Object} [params.req] - Express request object (to extract IP/UA)
 */
const logAdminAction = async ({
  adminId,
  action,
  targetType,
  targetId,
  details = {},
  req = null,
}) => {
  try {
    const activityData = {
      admin: adminId,
      action,
      targetType,
      targetId,
      details,
    };

    if (req) {
      activityData.ipAddress = req.ip || req.connection.remoteAddress;
      activityData.userAgent = req.get("User-Agent");
    }

    await AdminActivity.create(activityData);
    logger.info(`Admin Action: ${action} on ${targetType} ${targetId} by ${adminId}`);
  } catch (error) {
    logger.error("Failed to log admin action", error);
    // Don't throw, we don't want to break the main flow if logging fails
  }
};

module.exports = { logAdminAction };
