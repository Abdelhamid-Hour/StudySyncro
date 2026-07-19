const { z } = require("zod");
const {
  safeString,
  safeInt,
  safeSortQuery,
  safeDate,
  safeOptionalString,
} = require("./common.schema");
const LIMITS = require("./limits");
const { INITIALE_LOADERS_COUNT } = require("../utils/global");

const demandeActionSchema = z.object({
  demandeId: safeString(
    LIMITS.ID_MIN_LENGTH,
    LIMITS.ID_MAX_LENGTH,
    "Demande ID",
  ),
  groupId: safeString(LIMITS.ID_MIN_LENGTH, LIMITS.ID_MAX_LENGTH, "Group ID"),
});

const groupDemandesQuerySchema = z.object({
  groupId: safeString(LIMITS.ID_MIN_LENGTH, LIMITS.ID_MAX_LENGTH, "Group ID"),
  search: safeOptionalString(
    0,
    LIMITS.SEARCH_MAX_LENGTH,
    "Search Term",
  ).default(""),
  sort: safeSortQuery(),
  date: safeDate("Date Filter").optional(),
  count: safeInt(LIMITS.COUNT_MIN, LIMITS.COUNT_MAX, "Count")
    .optional()
    .default(INITIALE_LOADERS_COUNT),
  lastVisible: safeOptionalString(
    LIMITS.ID_MIN_LENGTH,
    LIMITS.ID_MAX_LENGTH,
    "Last Visible ID",
  ).default(""),
});

module.exports = {
  demandeActionSchema,
  groupDemandesQuerySchema,
};
