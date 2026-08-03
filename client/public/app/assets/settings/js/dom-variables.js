import {
  EMAIL_MAX_LENGTH,
  EMAIL_MIN_LENGTH,
  NAME_TITLE_MAX_LENGTH,
  NAME_TITLE_MIN_LENGTH,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
} from "../../global/js/variables.js";

export let profileModifyBtn,
  emailModifyBtn,
  passwordModifyBtn,
  profileSaveBtn,
  emailSaveBtn,
  settingsWrapper,
  avatarCaption,
  fullNameInput,
  emailInput,
  passwordEmailInput,
  currentPasswordInput,
  newPasswordInput,
  confirmPasswordInput,
  passwordDeleteInput,
  avatarHover,
  avatarInput,
  avatarContainer,
  passwordCheckContainer,
  deleteAccountConfirmation,
  deleteAccountBtn;
export const initDomVariables = () => {
  deleteAccountBtn = document.querySelector(".delete-account-btn");
  settingsWrapper = document.querySelector(".settings-wrapper");
  avatarCaption = document.querySelector(".avatar-container .caption");
  avatarInput = document.getElementById("avatar-input");
  avatarHover = document.querySelector(".avatar-hover");
  avatarContainer = document.querySelector(".avatar-container");

  fullNameInput = document.getElementById("full-name");
  emailInput = document.getElementById("email");
  passwordEmailInput = document.getElementById("password-email");
  currentPasswordInput = document.getElementById("current-password");
  newPasswordInput = document.getElementById("new-password");
  confirmPasswordInput = document.getElementById("confirm-password");
  passwordDeleteInput = document.getElementById("password-delete");
  passwordCheckContainer = document.querySelector(".password-ckeck-field");
  deleteAccountConfirmation = settingsWrapper.querySelector(
    ".confirmation-input",
  );

  if (fullNameInput) {
    fullNameInput.maxLength = NAME_TITLE_MAX_LENGTH;
    fullNameInput.minLength = NAME_TITLE_MIN_LENGTH * 2;
  }
  if (emailInput) {
    emailInput.maxLength = EMAIL_MAX_LENGTH;
    emailInput.minLength = EMAIL_MIN_LENGTH;
  }
  if (passwordEmailInput) {
    passwordEmailInput.maxLength = PASSWORD_MAX_LENGTH;
    passwordEmailInput.minLength = PASSWORD_MIN_LENGTH;
  }
  if (currentPasswordInput) {
    currentPasswordInput.maxLength = PASSWORD_MAX_LENGTH;
    currentPasswordInput.minLength = PASSWORD_MIN_LENGTH;
  }
  if (newPasswordInput) {
    newPasswordInput.maxLength = PASSWORD_MAX_LENGTH;
    newPasswordInput.minLength = PASSWORD_MIN_LENGTH;
  }
  if (confirmPasswordInput) {
    confirmPasswordInput.maxLength = PASSWORD_MAX_LENGTH;
    confirmPasswordInput.minLength = PASSWORD_MIN_LENGTH;
  }
  if (passwordDeleteInput) {
    passwordDeleteInput.maxLength = PASSWORD_MAX_LENGTH;
    passwordDeleteInput.minLength = PASSWORD_MIN_LENGTH;
  }
};
