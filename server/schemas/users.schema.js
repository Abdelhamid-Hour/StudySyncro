const { z } = require("zod");
const { safeString, safePassword, safeEmail } = require("./common.schema");
const LIMITS = require("./limits");

// Matches updateEmailHandler (controllers/user.js:22)
const updateEmailSchema = z.object({
  newEmail: safeEmail("New Email"),
  idToken: z
    .string({ required_error: "ID Token is required." })
    .trim()
    .min(10, "ID Token is invalid.")
    .max(5000, "ID Token is too long."),
});

// Matches addEmailHandler (controllers/user.js:35)
const addEmailSchema = z.object({
  email: safeEmail("Email"),
  idToken: z
    .string({ required_error: "ID Token is required." })
    .trim()
    .min(10, "ID Token is invalid.")
    .max(5000, "ID Token is too long."),
});

// Matches updatePofileHandler (controllers/user.js:47)
const updateProfileSchema = z.object({
  fullName: safeString(
    LIMITS.NAME_TITLE_MIN_LENGTH,
    LIMITS.NAME_TITLE_MAX_LENGTH,
    "Full Name",
  ).optional(),
});

// Matches updatePasswordHandler (controllers/user.js:61)
const updatePasswordSchema = z.object({
  newPassword: safePassword("New Password"),
  idToken: z
    .string({ required_error: "ID Token is required." })
    .trim()
    .min(10, "ID Token is invalid.")
    .max(5000, "ID Token is too long."),
});

// Matches addPasswordHandler (controllers/user.js:73)
const addPasswordSchema = z.object({
  password: safePassword("Password"),
  idToken: z
    .string({ required_error: "ID Token is required." })
    .trim()
    .min(10, "ID Token is invalid.")
    .max(5000, "ID Token is too long."),
});

// Matches closeAccountHandler (controllers/user.js:85)
const closeAccountSchema = z.object({
  idToken: z
    .string({ required_error: "ID Token is required." })
    .trim()
    .min(10, "ID Token is invalid.")
    .max(5000, "ID Token is too long."),
});

const insertUserDataSchema = z.object({
  uid: safeString(1, 128, "User ID"),
  fullName: safeString(
    LIMITS.NAME_TITLE_MIN_LENGTH,
    LIMITS.NAME_TITLE_MAX_LENGTH,
    "Full Name",
  ).regex(LIMITS.USERNAME_REGEX, "Full Name must only contain letters and spaces").optional(),
  email: safeEmail("Email").optional(),
  photoURL: z.string().optional(),
  idToken: z
    .string({ required_error: "ID Token is required." })
    .trim()
    .min(10, "ID Token is invalid.")
    .max(5000, "ID Token is too long.")
    .optional(),
});

module.exports = {
  updateEmailSchema,
  addEmailSchema,
  updateProfileSchema,
  updatePasswordSchema,
  addPasswordSchema,
  closeAccountSchema,
  insertUserDataSchema,
};
