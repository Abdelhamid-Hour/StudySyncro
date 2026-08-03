import {
  EMAIL_MAX_LENGTH,
  EMAIL_MIN_LENGTH,
  NAME_TITLE_MAX_LENGTH,
  NAME_TITLE_MIN_LENGTH,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
} from "../../../main_assets/js/variables.js";

export const loginForm = document.getElementById("login-form");
export const eyeIcons = document.querySelectorAll(".eye-icon");
export const passwordsFields = document.querySelectorAll(".password");
export const formsContainer = document.getElementById("forms");
export const signInLink = document.getElementById("sign-in-link");
export const signUpLink = document.getElementById("sign-up-link");
export const signInFormContainer = document.querySelector(".sign-in-container");
export const signUpFormContainer = document.querySelector(".sign-up-container");
export const signInBtn = document.getElementById("sign-in-btn");
export const signUpBtn = document.getElementById("sign-up-btn");
export const signInemailField = document.getElementById("sign-in-email");
export const signUpemailField = document.getElementById("sign-up-email");
export const signInPasswordField = document.getElementById("sign-in-password");
export const signUpPasswordField = document.getElementById("sign-up-password");
export const signUpConfirmPasswordField =
  document.getElementById("confirm-password");
export const firstNameField = document.getElementById("first-name");
export const lastNameField = document.getElementById("last-name");

if (signInemailField) {
  signInemailField.maxLength = EMAIL_MAX_LENGTH;
  signInemailField.minLength = EMAIL_MIN_LENGTH;
}
if (signUpemailField) {
  signUpemailField.maxLength = EMAIL_MAX_LENGTH;
  signUpemailField.minLength = EMAIL_MIN_LENGTH;
}
if (signInPasswordField) {
  signInPasswordField.maxLength = PASSWORD_MAX_LENGTH;
  signInPasswordField.minLength = PASSWORD_MIN_LENGTH;
}
if (signUpPasswordField) {
  signUpPasswordField.maxLength = PASSWORD_MAX_LENGTH;
  signUpPasswordField.minLength = PASSWORD_MIN_LENGTH;
}
if (signUpConfirmPasswordField) {
  signUpConfirmPasswordField.maxLength = PASSWORD_MAX_LENGTH;
  signUpConfirmPasswordField.minLength = PASSWORD_MIN_LENGTH;
}
if (firstNameField) {
  firstNameField.maxLength = NAME_TITLE_MAX_LENGTH;
  firstNameField.minLength = NAME_TITLE_MIN_LENGTH;
}
if (lastNameField) {
  lastNameField.maxLength = NAME_TITLE_MAX_LENGTH;
  lastNameField.minLength = NAME_TITLE_MIN_LENGTH;
}
export const googleBtn = document.getElementById("google-sign-in");
export const fbBtn = document.getElementById("fb-sign-in");
export const avatarAside = document.querySelector("aside");
export const avatarSpaceReserver = document.getElementById("space-reserver");
export const avatarContainer = document.getElementById("avatar-container");
export const fileinput = avatarContainer.querySelector("input");
export const clearAvatarBtn = document.getElementById("clear-avatar-btn");
export const forgotPasswordLink =
  signInFormContainer.querySelector("#forgot-password");

export let signInFormHeight = 0;
export let signUpFormHeight = 0;
// get the first external styles
export const stylsheet = document.getElementById("stylesheet").sheet;

// get the Login swap animation duration from the stylesheet
export const animationDuration = parseInt(
  stylsheet.cssRules[0].cssText
    .match(/--login-swap-animation-duration: \d{1,10}ms;/i)[0]
    .split(":")[1],
);

export const updateSignFormHeights = () => {
  signUpFormHeight = signUpFormContainer.offsetHeight;
  signInFormContainer.style.height = "auto";
  signInFormHeight = signInFormContainer.offsetHeight;
  signInFormContainer.style.height = signInFormContainer.classList.contains(
    "active-form",
  )
    ? signInFormHeight + "px"
    : signUpFormHeight + "px";
};
