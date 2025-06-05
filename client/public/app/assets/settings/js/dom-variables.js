export let profileModifyBtn,
  emailModifyBtn,
  passwordModifyBtn,
  settingsWrapper,
  avatarCaption,
  fullNameInput,
  currentEmailInput,
  newEmailInput,
  passwordEmailInput,
  currentPasswordInput,
  newPasswordInput,
  confirmPasswordInput,
  passwordDeleteInput,
  avatarHover,
  avatarInput,
  passwordCheckContainer,
  emailBtnsCantainer,
  deleteAccountConfirmation,
  deleteAccountBtn;
export const initDomVariables = () => {
  profileModifyBtn = document.querySelector('.profile-tab-content .modify-btn');
  emailModifyBtn = document.querySelector('.email-tab-content .modify-btn');
  passwordModifyBtn = document.querySelector(
    '.password-tab-content .modify-btn'
  );
  deleteAccountBtn = document.querySelector('.delete-account-btn');
  settingsWrapper = document.querySelector('.settings-wrapper');
  avatarCaption = document.querySelector('.avatar-wrapper .caption');
  avatarInput = document.getElementById('avatar-input');
  avatarHover = document.querySelector('.avatar-hover');

  fullNameInput = document.getElementById('full-name');
  currentEmailInput = document.getElementById('current-email');
  newEmailInput = document.getElementById('new-email');
  passwordEmailInput = document.getElementById('password-email');
  currentPasswordInput = document.getElementById('current-password');
  newPasswordInput = document.getElementById('new-password');
  confirmPasswordInput = document.getElementById('confirm-password');
  passwordDeleteInput = document.getElementById('password-delete');
  passwordCheckContainer = document.querySelector('.password-ckeck-fields');
  emailBtnsCantainer = document.querySelector('.email-action-btns');
  deleteAccountConfirmation = settingsWrapper.querySelector('.confirmation-input');
};
