const { z } = require("zod");
const {
  safeString,
  safeInt,
  safeBool,
  safeSortQuery,
  safeOptionalString,
} = require("./common.schema");
const LIMITS = require("./limits");
const { INITIALE_LOADERS_COUNT } = require("../utils/global");

// Reusable exact enum validators for query strings using clean toLowerCase() checks
const safeLevelQuery = () =>
  z
    .string()
    .trim()
    .max(100, "Level query is too long")
    .refine(
      (val) => {
        if (!val) return true;
        const items = val.split(",").map((item) => item.trim().toLowerCase());
        const allowedLevels = ["beginner", "intermediate", "advanced"];
        return items.every((item) => allowedLevels.includes(item));
      },
      {
        message:
          "Level query must only contain 'Beginner', 'Intermediate', and/or 'Advanced'.",
      },
    );

const safeRoleQuery = () =>
  z
    .string()
    .trim()
    .max(100, "Role query is too long")
    .refine(
      (val) => {
        if (!val) return true;
        const items = val.split(",").map((item) => item.trim().toLowerCase());
        const allowedRoles = ["admin", "member", "creator"];
        return items.every((item) => allowedRoles.includes(item));
      },
      {
        message:
          "Role query must only contain 'admin', 'member', and/or 'creator'.",
      },
    );

const safeVisibilityQuery = () =>
  z
    .string()
    .trim()
    .max(50, "Visibility query is too long")
    .refine(
      (val) => {
        if (!val) return true;
        const items = val.split(",").map((item) => item.trim().toLowerCase());
        const allowedVisibility = ["public", "private"];
        return items.every((item) => allowedVisibility.includes(item));
      },
      {
        message:
          "Visibility query must only contain 'Public' and/or 'Private'.",
      },
    );

// Matches exact groupData attributes accessed in createGroup (group.js:18-38)
const createGroupSchema = z.object({
  groupData: z.object({
    "group-name": safeString(
      LIMITS.NAME_TITLE_MIN_LENGTH,
      LIMITS.NAME_TITLE_MAX_LENGTH,
      "Group Name",
    ),
    "group-description": safeString(
      LIMITS.DESCRIPTION_MIN_LENGTH,
      LIMITS.DESCRIPTION_MAX_LENGTH,
      "Group Description",
    ),
    subject: safeString(
      LIMITS.SUBJECT_MIN_LENGTH,
      LIMITS.SUBJECT_MAX_LENGTH,
      "Subject",
    ),
    level: z.enum([
      "Beginner",
      "Intermediate",
      "Advanced",
      "beginner",
      "intermediate",
      "advanced",
    ]),
    "max-members": safeInt(
      LIMITS.MIN_MEMBERS,
      LIMITS.MAX_MEMBERS,
      "Max members",
    ),
    visibility: z
      .enum(["Public", "Private", "public", "private"])
      .default("Public"),
    "show-in-search": safeBool().optional(),
  }),
});

// Matches joinGroupHandler (controllers/groups.js:166)
const joinGroupSchema = z.object({
  groupId: safeString(LIMITS.ID_MIN_LENGTH, LIMITS.ID_MAX_LENGTH, "Group ID"),
  isInvite: safeBool().optional(),
});

// Matches patchGroupHandler (controllers/groups.js:178) & modifyGroup / updateGroupProperty (group.js:421-580)
const patchGroupSchema = z.object({
  updatedData: z.discriminatedUnion("fieldName", [
    z.object({
      fieldName: z.literal("name"),
      value: safeString(
        LIMITS.NAME_TITLE_MIN_LENGTH,
        LIMITS.NAME_TITLE_MAX_LENGTH,
        "Group Name",
      ),
    }),
    z.object({
      fieldName: z.literal("description"),
      value: safeString(
        LIMITS.DESCRIPTION_MIN_LENGTH,
        LIMITS.DESCRIPTION_MAX_LENGTH,
        "Group Description",
      ),
    }),
    z.object({
      fieldName: z.literal("subject"),
      value: safeString(
        LIMITS.SUBJECT_MIN_LENGTH,
        LIMITS.SUBJECT_MAX_LENGTH,
        "Subject",
      ),
    }),
    z.object({
      fieldName: z.literal("level"),
      value: z.enum([
        "Beginner",
        "Intermediate",
        "Advanced",
        "beginner",
        "intermediate",
        "advanced",
      ]),
    }),
    z.object({
      fieldName: z.literal("max-members"),
      value: safeInt(LIMITS.MIN_MEMBERS, LIMITS.MAX_MEMBERS, "Max members"),
    }),
    z.object({
      fieldName: z.literal("creator"),
      value: safeString(
        LIMITS.ID_MIN_LENGTH,
        LIMITS.ID_MAX_LENGTH,
        "Creator ID",
      ),
    }),
    z.object({
      fieldName: z.literal("showInSearch"),
      value: safeBool(),
    }),
    z.object({
      fieldName: z.literal("visibility"),
      value: z.object({
        visibility: z
          .enum(["Public", "Private", "public", "private"])
          .optional(),
        showInSearch: safeBool().optional(),
      }),
    }),
  ]),
}); // check here

// Matches group handlers taking groupId in body
const groupIdBodySchema = z.object({
  groupId: safeString(LIMITS.ID_MIN_LENGTH, LIMITS.ID_MAX_LENGTH, "Group ID"),
});

// Matches routes with :groupId in URL params (/update-group/:groupId, /remove-group/:groupId)
const groupIdParamSchema = z.object({
  groupId: safeString(LIMITS.ID_MIN_LENGTH, LIMITS.ID_MAX_LENGTH, "Group ID"),
});

// Matches fragment routes with :id in URL params
const idParamSchema = z.object({
  id: safeString(LIMITS.ID_MIN_LENGTH, LIMITS.ID_MAX_LENGTH, "ID"),
});

// Matches transferRoleHandler & kickMemberHandler (controllers/groups.js:198, 210)
const memberActionSchema = z.object({
  groupId: safeString(LIMITS.ID_MIN_LENGTH, LIMITS.ID_MAX_LENGTH, "Group ID"),
  memberId: safeString(LIMITS.ID_MIN_LENGTH, LIMITS.ID_MAX_LENGTH, "Member ID"),
});

// Matches inviteMembersHandler (controllers/groups.js:259)
const inviteMembersSchema = z.object({
  groupId: safeString(LIMITS.ID_MIN_LENGTH, LIMITS.ID_MAX_LENGTH, "Group ID"),
  users: z
    .array(safeString(LIMITS.ID_MIN_LENGTH, LIMITS.ID_MAX_LENGTH, "User ID"))
    .min(1, "At least one user is required"),
});

// Matches GET /user-groups query
const userGroupsQuerySchema = z.object({
  lastVisible: safeOptionalString(
    LIMITS.ID_MIN_LENGTH,
    LIMITS.ID_MAX_LENGTH,
    "Last Visible ID",
  ).default(""),
  count: safeInt(LIMITS.COUNT_MIN, LIMITS.COUNT_MAX, "Count")
    .optional()
    .default(INITIALE_LOADERS_COUNT),
  level: safeLevelQuery().optional(),
  visibility: safeVisibilityQuery().optional(),
  searchTerm: safeOptionalString(
    1,
    LIMITS.SEARCH_MAX_LENGTH,
    "Search Term",
  ).default(""),
  sort: safeSortQuery().optional(),
  role: safeRoleQuery().optional(),
});

// Matches GET /available-groups query
const availableGroupsQuerySchema = z.object({
  lastVisible: safeOptionalString(
    0,
    LIMITS.ID_MAX_LENGTH,
    "Last Visible ID",
  ).default(""),
  count: safeInt(LIMITS.COUNT_MIN, LIMITS.COUNT_MAX, "Count")
    .optional()
    .default(INITIALE_LOADERS_COUNT),
  level: safeLevelQuery().optional(),
  visibility: safeVisibilityQuery().optional(),
  searchTerm: safeOptionalString(
    1,
    LIMITS.SEARCH_MAX_LENGTH,
    "Search Term",
  ).default(""),
  sort: safeSortQuery().optional(),
  joinableOnly: safeBool().optional(),
});

// Matches GET /group-members query
const groupMembersQuerySchema = z.object({
  groupId: safeString(LIMITS.ID_MIN_LENGTH, LIMITS.ID_MAX_LENGTH, "Group ID"),
  search: safeOptionalString(
    1,
    LIMITS.SEARCH_MAX_LENGTH,
    "Search Term",
  ).default(""),
  count: safeInt(LIMITS.COUNT_MIN, LIMITS.COUNT_MAX, "Count")
    .optional()
    .default(INITIALE_LOADERS_COUNT),
  lastVisible: safeOptionalString(
    LIMITS.ID_MIN_LENGTH,
    LIMITS.ID_MAX_LENGTH,
    "Last Visible ID",
  ).default(""),
});

// Matches GET /users query
const usersQuerySchema = z.object({
  search: safeOptionalString(
    0,
    LIMITS.SEARCH_MAX_LENGTH,
    "Search Term",
  ).default(""),
  count: safeInt(LIMITS.COUNT_MIN, LIMITS.COUNT_MAX, "Count")
    .optional()
    .default(INITIALE_LOADERS_COUNT),
  lastVisible: safeOptionalString(
    LIMITS.ID_MIN_LENGTH,
    LIMITS.ID_MAX_LENGTH,
    "Last Visible ID",
  ).default(""),
  groupId: safeString(LIMITS.ID_MIN_LENGTH, LIMITS.ID_MAX_LENGTH, "Group ID"),
});

module.exports = {
  createGroupSchema,
  joinGroupSchema,
  patchGroupSchema,
  groupIdBodySchema,
  groupIdParamSchema,
  idParamSchema,
  memberActionSchema,
  inviteMembersSchema,
  userGroupsQuerySchema,
  availableGroupsQuerySchema,
  groupMembersQuerySchema,
  usersQuerySchema,
};
