const { z } = require("zod");
const {
  safeString,
  safeInt,
  safeBool,
  safeOptionalString,
} = require("./common.schema");
const LIMITS = require("./limits");
const { INITIALE_LOADERS_COUNT } = require("../utils/global");

// Matches exact task attributes accessed in session.js (lines 138-142, 634, 642, 748)
const taskSchema = z
  .object({
    title: safeString(
      LIMITS.TASK_TITLE_MIN_LENGTH,
      LIMITS.TASK_TITLE_MAX_LENGTH,
      "Task Title",
    ).optional(),
    description: safeString(
      LIMITS.TASK_DESCRIPTION_MIN_LENGTH,
      LIMITS.TASK_DESCRIPTION_MAX_LENGTH,
      "Task Description",
    ).optional(),
    durationInMins: safeInt(
      LIMITS.TASK_MIN_DURATION,
      LIMITS.TASK_MAX_DURATION,
      "Task Duration",
    ),
    isBreak: safeBool().optional().default(false),
    isQuiz: safeBool().optional().default(false),
    status: z
      .enum(["active", "pending", "completed"])
      .optional()
      .default("pending"),
  })
  .superRefine((data, ctx) => {
    // 1. Missing description for a regular task
    if (!data.isBreak && !data.description) {
      ctx.addIssue({
        code: "custom", // Just use the string directly
        message: "Description is required for non-break tasks.",
        path: ["description"],
      });
    }

    // 2. Unwanted description for a break
    if (data.isBreak && data.description) {
      ctx.addIssue({
        code: "custom",
        message: "Breaks cannot have a description.",
        path: ["description"],
      });
    }

    // 3. Unwanted quiz for a break
    if (data.isBreak && data.isQuiz) {
      ctx.addIssue({
        code: "custom",
        message: "A task cannot be both a break and a quiz.",
        path: ["isBreak", "isQuiz"],
      });
    }
  });

// Matches exact sessionData attributes accessed in createGroupSession (session.js:24 & 58)
const createSessionSchema = z.object({
  sessionData: z.object({
    name: safeString(
      LIMITS.NAME_TITLE_MIN_LENGTH,
      LIMITS.NAME_TITLE_MAX_LENGTH,
      "Session Name",
    ),
    description: safeString(
      LIMITS.SESSION_DESCRIPTION_MIN_LENGTH,
      LIMITS.SESSION_DESCRIPTION_MAX_LENGTH,
      "Session Description",
    ),
    duration: safeInt(
      LIMITS.SESSION_MIN_DURATION,
      LIMITS.SESSION_MAX_DURATION,
      "Duration",
    ),
    groupId: safeString(LIMITS.ID_MIN_LENGTH, LIMITS.ID_MAX_LENGTH, "Group ID"),
    sessionQuiz: z
      .object({
        UID: safeString(
          LIMITS.ID_MIN_LENGTH,
          LIMITS.ID_MAX_LENGTH,
          "Session Quiz ID",
        ),
      })
      .optional(),
    tasks: z.array(taskSchema).min(1, "At least one task is required"),
  }),
});

// Matches controllers/session.js handlers
const sessionIdBodySchema = z.object({
  sessionId: safeString(
    LIMITS.ID_MIN_LENGTH,
    LIMITS.ID_MAX_LENGTH,
    "Session ID",
  ),
});

const updateTaskStatusSchema = z.object({
  taskId: safeString(LIMITS.ID_MIN_LENGTH, LIMITS.ID_MAX_LENGTH, "Task ID"),
  status: z.enum(["active", "pending", "completed"]),
});

// Matches getActiveSessionsHandler query (controllers/session.js:75)
const activeSessionsQuerySchema = z.object({
  lastVisible: safeOptionalString(
    LIMITS.ID_MIN_LENGTH,
    LIMITS.ID_MAX_LENGTH,
    "Last Visible ID",
  ).default(""),
  count: safeInt(LIMITS.COUNT_MIN, LIMITS.COUNT_MAX, "Count")
    .optional()
    .default(INITIALE_LOADERS_COUNT),
  search: safeOptionalString(
    1,
    LIMITS.SEARCH_MAX_LENGTH || 200,
    "Search Query",
  ).default(""),
});

// Matches streamSingleSessionHandler query (controllers/session.js:183)
const streamSingleSessionQuerySchema = z.object({
  sessionId: safeString(
    LIMITS.ID_MIN_LENGTH,
    LIMITS.ID_MAX_LENGTH,
    "Session ID",
  ),
});

module.exports = {
  createSessionSchema,
  sessionIdBodySchema,
  updateTaskStatusSchema,
  activeSessionsQuerySchema,
  streamSingleSessionQuerySchema,
};
