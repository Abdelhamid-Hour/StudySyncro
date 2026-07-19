const { z } = require("zod");
const LIMITS = require("./limits");

/**
 * Reusable safe string validator that blocks NoSQL type spoofing, trims whitespace, and enforces length boundaries.
 */
const safeString = (min, max, fieldName) =>
  z
    .string({
      required_error: `${fieldName} is required.`,
      invalid_type_error: `${fieldName} must be a valid string.`,
    })
    .trim()
    .min(min, `${fieldName} must be at least ${min} characters.`)
    .max(max, `${fieldName} cannot exceed ${max} characters.`);

/**
 * Reusable safe integer validator that accepts numbers or string numbers ("50") and enforces range limits.
 */
const safeInt = (min, max, fieldName) =>
  z
    .union([z.number().int(), z.string().transform((val) => parseInt(val, 10))])
    .pipe(
      z
        .number()
        .int()
        .min(min, `${fieldName} must be at least ${min}`)
        .max(max, `${fieldName} cannot exceed ${max}`),
    );

/**
 * Reusable safe optional string validator that converts empty/whitespace strings ("") to undefined
 * so they don't trigger .min() errors on optional query parameters.
 */
const safeOptionalString = (min, max, fieldName) =>
  z.preprocess(
    (val) => (typeof val === "string" && val.trim() === "" ? undefined : val),
    safeString(min, max, fieldName).optional(),
  );

/**
 * Reusable safe boolean validator that accepts true/false as well as HTML form strings ("true", "false", "on", "off").
 */
const safeBool = () =>
  z.union([
    z.boolean(),
    z
      .enum(["true", "false", "on", "off"])
      .transform((val) => val === "true" || val === "on"),
  ]);

/**
 * Reusable safe date validator that accepts ISO strings, date strings (YYYY-MM-DD), timestamps (numbers), or Date objects and validates they produce a valid date.
 */
const safeDate = (fieldName = "Date") =>
  z.union([z.string().trim(), z.number(), z.date()]).refine(
    (val) => {
      if (!val) return true;
      const parsed = new Date(Number(val));
      return !isNaN(parsed.getTime());
    },
    { message: `${fieldName} must be a valid date string or timestamp.` },
  );

/**
 * Reusable safe sort query validator ('asc' or 'desc').
 */
const safeSortQuery = () =>
  z
    .string()
    .trim()
    .refine((val) => ["asc", "desc"].includes(val.toLowerCase()), {
      message: "Sort must be 'asc' or 'desc'.",
    });

/**
 * Reusable safe password validator enforcing limits and character rules.
 */
const safePassword = (fieldName = "Password") =>
  safeString(
    LIMITS.PASSWORD_MIN_LENGTH || 6,
    LIMITS.PASSWORD_MAX_LENGTH || 128,
    fieldName,
  ).regex(
    LIMITS.PASSWORD_REGEX,
    `${fieldName} must be between ${LIMITS.PASSWORD_MIN_LENGTH} and ${LIMITS.PASSWORD_MAX_LENGTH} characters and only contain letters, numbers, spaces, dots, underscores, or hyphens.`,
  );

/**
 * Reusable safe email validator enforcing limits and standard format check.
 */
const safeEmail = (fieldName = "Email") =>
  z
    .string({
      required_error: `${fieldName} is required.`,
      invalid_type_error: `${fieldName} must be a valid string.`,
    })
    .trim()
    .email({ message: "Must be a valid email address." })
    .min(
      LIMITS.EMAIL_MIN_LENGTH || 5,
      `${fieldName} must be at least ${LIMITS.EMAIL_MIN_LENGTH} characters.`,
    )
    .max(
      LIMITS.EMAIL_MAX_LENGTH,
      `${fieldName} cannot exceed ${LIMITS.EMAIL_MAX_LENGTH} characters.`,
    );

module.exports = {
  safeString,
  safeInt,
  safeBool,
  safeDate,
  safeSortQuery,
  safePassword,
  safeEmail,
  safeOptionalString,
};
