const { z } = require("zod");
const {
  safeString,
  safeInt,
  safeDate,
  safeOptionalString,
} = require("./common.schema");
const LIMITS = require("./limits");
const { INITIALE_LOADERS_COUNT } = require("../utils/global");

// Matches sendMessageHandler (controllers/chat.js:29-31)
const sendMessageSchema = z
  .object({
    sessionId: safeOptionalString(
      LIMITS.ID_MIN_LENGTH,
      LIMITS.ID_MAX_LENGTH,
      "Session ID",
    ).default(""),
    groupId: safeOptionalString(
      LIMITS.ID_MIN_LENGTH,
      LIMITS.ID_MAX_LENGTH,
      "Group ID",
    ).default(""),
    timestamp: safeDate("Timestamp"),
    localId: safeOptionalString(
      LIMITS.ID_MIN_LENGTH,
      LIMITS.ID_MAX_LENGTH,
      "Local Message ID",
    ).default(""),
    message: safeOptionalString(
      1,
      LIMITS.MESSAGE_MAX_LENGTH,
      `Message cannot exceed ${LIMITS.MESSAGE_MAX_LENGTH} characters`,
    ).default(""),
    messageId: safeOptionalString(
      LIMITS.ID_MIN_LENGTH,
      LIMITS.ID_MAX_LENGTH,
      "Message ID",
    ).default(""),
  })
  .refine((data) => data.groupId || data.sessionId, {
    message:
      "At least one of 'groupId' or 'sessionId' must be provided when sending a message.",
  });

// Matches markGroupAsReadHandler (controllers/chat.js:160)
const markGroupReadSchema = z.object({
  groupId: safeString(LIMITS.ID_MIN_LENGTH, LIMITS.ID_MAX_LENGTH, "Group ID"),
  messageId: safeOptionalString(
    LIMITS.ID_MIN_LENGTH,
    LIMITS.ID_MAX_LENGTH,
    "Message Id"
  ).default(""),
  timestamp: safeDate("Timestamp").optional(),
});

// Matches getMessagesHandler query (controllers/chat.js:118)
const chatMessagesQuerySchema = z
  .object({
    groupId: safeOptionalString(
      LIMITS.ID_MIN_LENGTH,
      LIMITS.ID_MAX_LENGTH,
      "Group ID",
    ).default(""),
    sessionId: safeOptionalString(
      LIMITS.ID_MIN_LENGTH,
      LIMITS.ID_MAX_LENGTH,
      "Session ID",
    ).default(""),
    count: safeInt(LIMITS.COUNT_MIN, LIMITS.COUNT_MAX, "Count")
      .optional()
      .default(INITIALE_LOADERS_COUNT),
    lastVisible: safeOptionalString(
      LIMITS.ID_MIN_LENGTH,
      LIMITS.ID_MAX_LENGTH,
      "Last Visible ID",
    ).default(""),
  })
  .refine((data) => data.groupId || data.sessionId, {
    message: "At least one of 'groupId' or 'sessionId' must be provided.",
  });

// Matches chatStreamHandler query (controllers/chat.js:56-57)
const chatStreamQuerySchema = z
  .object({
    groupId: safeOptionalString(
      LIMITS.ID_MIN_LENGTH,
      LIMITS.ID_MAX_LENGTH,
      "Group ID",
    ).default(""),
    sessionId: safeOptionalString(
      LIMITS.ID_MIN_LENGTH,
      LIMITS.ID_MAX_LENGTH,
      "Session ID",
    ).default(""),
  })
  .refine((data) => data.groupId || data.sessionId, {
    message: "At least one of 'groupId' or 'sessionId' must be provided.",
  });

// Matches getRecentMessagesHandler query (controllers/chat.js:190)
const recentMessagesQuerySchema = z.object({
  limit: safeInt(LIMITS.COUNT_MIN, LIMITS.COUNT_MAX, "Limit")
    .optional()
    .default(INITIALE_LOADERS_COUNT),
  lastVisible: safeOptionalString(
    LIMITS.ID_MIN_LENGTH,
    LIMITS.ID_MAX_LENGTH,
    "Last Visible ID",
  ).default(""),
});

module.exports = {
  sendMessageSchema,
  markGroupReadSchema,
  chatMessagesQuerySchema,
  chatStreamQuerySchema,
  recentMessagesQuerySchema,
};
