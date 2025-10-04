export const passwordRegex = /^[\w.-]{8,16}$/;
export const emailRegex = /^[a-z0-9]+@[a-z0-9]+\.[a-z0-9]+$/;
export const userNameRegex = /^[A-Za-z]+( [A-Za-z]+)*$/;
export const AUTH_ERRORS = {
  INVALID_LOGIN_CREDENTIALS: {
    code: "auth/invalid-credential",
    message: "Invalid email or password. Please try again.",
  },
  CANCELLED_POPUP_REQUEST: {
    code: "auth/canceled-popup-request",
    message:
      "It looks like you closed the popup before completing the action. Please try again.",
  },
  EMAIL_ALREADY_IN_USE: {
    code: "auth/email-already-in-use",
    message:
      "The email address you entered is already associated with an account. Try logging in or use a different email.",
  },
  WRONG_PASSWORD: {
    code: "auth/wrong-password",
    message:
      "Oops! The password you entered is incorrect. Please double-check and try again.",
  },
  POPUP_BLOCKED: {
    code: "auth/popup-blocked",
    message:
      "It seems like the popup was blocked by your browser. Please allow popups and try again.",
  },
  POPUP_CLOSED_BY_USER: {
    code: "auth/popup-closed-by-user",
    message:
      "It looks like you closed the popup before completing the action. Please open it again and try.",
  },
  REDIRECT_CANCELLED_BY_USER: {
    code: "auth/redirect-canceled-by-user",
    message:
      "It seems you canceled the redirect action. Please try again to complete the process.",
  },
  USER_NOT_FOUND: {
    code: "auth/user-not-found",
    message:
      "We couldn't find an account with that email address. Please check your email or create a new account.",
  },
  TOO_MANY_REQUESTS: {
    code: "auth/too-many-requests",
    message:
      "Too many requests have been made from this device. Please wait a while before trying again.",
  },
};
export const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5MB
export const PROFILE_ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];
