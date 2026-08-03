import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
} from "../../../main_assets/js/variables.js";

export const eyeIcons = document.querySelectorAll('.eye-icon');
export const resetPasswordBtn = document.getElementById('reset-password-btn');
export const main = document.querySelector('main');
export const passwordField = document.getElementById('password');
export const confirmPasswordField = document.getElementById('confirm-password');

if (passwordField) {
  passwordField.maxLength = PASSWORD_MAX_LENGTH;
  passwordField.minLength = PASSWORD_MIN_LENGTH;
}
if (confirmPasswordField) {
  confirmPasswordField.maxLength = PASSWORD_MAX_LENGTH;
  confirmPasswordField.minLength = PASSWORD_MIN_LENGTH;
}
