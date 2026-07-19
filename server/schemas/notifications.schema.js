const { z } = require("zod");
const { safeString, safeInt, safeOptionalString } = require("./common.schema");
const LIMITS = require("./limits");
const { INITIALE_LOADERS_COUNT } = require("../utils/global");

// Matches getUserNotificationsHandler query (controllers/notifications.js:14)
const getUserNotificationsQuerySchema = z.object({
  lastVisible: safeOptionalString(
    LIMITS.ID_MIN_LENGTH,
    LIMITS.ID_MAX_LENGTH,
    "Last Visible ID",
  ).default(""),
  count: safeInt(LIMITS.COUNT_MIN, LIMITS.COUNT_MAX, "Count")
    .optional()
    .default(INITIALE_LOADERS_COUNT),
  category: safeString(1, 50, "Category").optional(),
});

module.exports = {
  getUserNotificationsQuerySchema,
};
