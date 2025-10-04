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
    ".confirmation-input"
  );
};
