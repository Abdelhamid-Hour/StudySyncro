import { showMessageBlock } from '../../../../main_assets/js/utils.js';
import {
  emailRegex,
  passwordRegex,
  userNameRegex,
} from '../../../../main_assets/js/variables.js';
import {
  avatarMaxSize,
  globalTooltip,
  profileAllowedFileTypes,
} from '../../global/js/dom-variables.js';
import {
  getLoader,
  resetTooltip,
  showErrorTooltip,
} from '../../global/js/utils.js';
import {
  avatarCaption,
  avatarHover,
  avatarInput,
  currentEmailInput,
  emailBtnsCantainer,
  fullNameInput,
  newEmailInput,
  passwordCheckContainer,
  passwordEmailInput,
  emailModifyBtn,
  profileModifyBtn,
  confirmPasswordInput,
  currentPasswordInput,
  newPasswordInput,
  passwordModifyBtn,
  passwordDeleteInput,
  deleteAccountConfirmation,
} from './dom-variables.js';
let isEditMode = false;

export const handlEyeIconsClick = (eyeIcon) => {
  const isChecked = eyeIcon.querySelector('input').checked;
  const input = eyeIcon.previousElementSibling;
  if (isChecked) {
    input.setAttribute('type', 'text');
  } else {
    input.setAttribute('type', 'password');
  }
};

const enableProfilEditMode = () => {
  isEditMode = true;
  fullNameInput.readOnly = false;
  avatarInput.disabled = false;
  avatarHover.classList.remove('hidden');
  fullNameInput.focus();
  avatarCaption.classList.remove('hidden');
  profileModifyBtn.innerHTML = `
      <i class="bi bi-floppy"></i>
      Save Changes
    `;
};

const disableProfileMode = () => {
  fullNameInput.readOnly = true;
  isEditMode = false;
  avatarInput.disabled = true;
  avatarCaption.classList.add('hidden');
  avatarHover.classList.add('hidden');
  profileModifyBtn.innerHTML = `
      <i class="bi bi-pencil"></i >
      Modify Profile
    `;
  profileModifyBtn.disabled = false;
  resetTooltip(globalTooltip);
};

const checkValidation = () => {
  const fullName = fullNameInput.value.trim();
  const avatarFile = avatarInput.files[0];

  if (!fullName) {
    showErrorTooltip('Full name cannot be empty.', fullNameInput);
    return false;
  } else if (
    fullName.length < 6 ||
    fullName.length > 50 ||
    !userNameRegex.test(fullName)
  ) {
    showErrorTooltip(
      'Full name must be between 6 and 50 characters and can only contain letters, numbers, spaces, and underscores.',
      fullNameInput
    );
    return false;
  } else {
    resetTooltip(globalTooltip, fullNameInput.closest('.field-container'));
  }

  if (avatarFile && !profileAllowedFileTypes.includes(avatarFile.type)) {
    showErrorTooltip(
      'Invalid file type. Allowed types: JPEG, PNG, GIF, WEBP.',
      avatarInput,
      'avatar'
    );
    return false;
  } else if (avatarFile && avatarFile.size > avatarMaxSize) {
    showErrorTooltip(
      `File size exceeds ${avatarMaxSize / (1024 * 1024)} MB.`,
      avatarInput,
      'avatar'
    );
    return false;
  } else {
    resetTooltip(globalTooltip, avatarInput.closest('.avatar'));
  }

  return true;
};

const saveProfileChanges = async () => {
  if (!checkValidation()) return;
  const fullName = fullNameInput.value.trim();
  const avatarFile = avatarInput.files[0];

  profileModifyBtn.innerHTML = getLoader();
  profileModifyBtn.disabled = false;

  try {
    // Simulate a save operation (replace with real API call if needed)
    await new Promise((resolve) => setTimeout(resolve, 1000));
    disableProfileMode();
    showMessageBlock('Changes saved successfully!', 'success');
  } catch (error) {
    console.error('Error saving changes:', error);
    profileModifyBtn.innerHTML = `
        <i class="bi bi-floppy"></i>
        Save Changes
      `;
    showMessageBlock(
      'An error occurred while saving changes. Please try again.',
      'error'
    );
  }
};

const enableEmailEditMode = () => {
  currentEmailInput.readOnly = false;
  isEditMode = true;
  passwordCheckContainer.classList.remove('hidden');
  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'gray-btn cancel-btn';
  cancelBtn.innerHTML = `
        <i class="bi bi-x-lg"></i>
        Cancel
      `;
  emailModifyBtn.before(cancelBtn);
  cancelBtn.addEventListener('click', (e) => disableEmailEditMode());
  currentEmailInput.focus();
  emailModifyBtn.innerHTML = `
        <i class="bi bi-floppy"></i>
        Save Changes
      `;
};

const clearEmailInputs = () => {
  newEmailInput.value = '';
  passwordEmailInput.value = '';
};

const disableEmailEditMode = () => {
  isEditMode = false;
  currentEmailInput.readOnly = true;
  passwordCheckContainer.classList.add('hidden');
  emailModifyBtn.innerHTML = `
          <i class="bi bi-pencil"></i>
          Modify Email
        `;
  emailModifyBtn.disabled = false;
  emailBtnsCantainer.querySelector('.cancel-btn')?.remove();
  clearEmailInputs();
  resetTooltip(globalTooltip);
};

const checkEmailValidation = () => {
  const currentEmail = currentEmailInput.value.trim();
  const newEmail = newEmailInput.value.trim();
  const password = passwordEmailInput.value.trim();

  if (!currentEmail) {
    showErrorTooltip('Current email cannot be empty.', currentEmailInput);
    return false;
  } else if (!emailRegex.test(currentEmail)) {
    showErrorTooltip('Invalid current email format.', currentEmailInput);
    return false;
  } else {
    resetTooltip(globalTooltip, currentEmailInput.closest('.field-container'));
  }

  if (!newEmail) {
    showErrorTooltip('New email cannot be empty.', newEmailInput);
    return false;
  }
  if (!emailRegex.test(newEmail)) {
    showErrorTooltip('Invalid new email format.', newEmailInput);
    return false;
  } else {
    resetTooltip(globalTooltip, newEmailInput.closest('.field-container'));
  }

  if (!password) {
    showErrorTooltip('Password cannot be empty.', passwordEmailInput);
    return false;
  } else if (!passwordRegex.test(password)) {
    showErrorTooltip(
      'Password must be between 8 and 16 characters and can include letters, numbers, and special characters.',
      passwordEmailInput
    );
    return false;
  } else {
    resetTooltip(globalTooltip, passwordEmailInput.closest('.field-container'));
  }
  return true;
};

export const handleSettingsWrapperClick = (e) => {
  const tab = e.target.closest('.tab');
  if (tab) {
    isEditMode = false;
    disableEmailEditMode();
    disableProfileMode();
    clearPasswordFields();
  }

  const eyeIcon = e.target.closest('.eye-icon');
  if (eyeIcon) handlEyeIconsClick(eyeIcon);
};

export const handleProfileModifyClick = async (e) => {
  if (!isEditMode) {
    enableProfilEditMode();
  } else {
    await saveProfileChanges();
  }
};

export const handleEmailModifyClick = async (e) => {
  if (!isEditMode) {
    enableEmailEditMode();
  } else {
    await saveEmailChanges();
  }
};

const saveEmailChanges = async () => {
  if (!checkEmailValidation()) return;
  const currentEmail = currentEmailInput.value.trim();
  const newEmail = newEmailInput.value.trim();
  const password = passwordEmailInput.value.trim();

  emailModifyBtn.innerHTML = getLoader();
  emailModifyBtn.disabled = false;
  try {
    // Simulate a save operation (replace with real API call if needed)
    await new Promise((resolve) => setTimeout(resolve, 1000));
    disableEmailEditMode();
    showMessageBlock('Email updated successfully!', 'success');
  } catch (error) {
    console.error('Error updating email:', error);
    emailModifyBtn.innerHTML = `
        <i class="bi bi-floppy"></i>
        Save Changes
      `;
    showMessageBlock(
      'An error occurred while updating email. Please try again.',
      'error'
    );
  }
};

const checkPasswordFields = () => {
  const currentPassword = currentPasswordInput.value.trim();
  const newPassword = newPasswordInput.value.trim();
  const confirmPassword = confirmPasswordInput.value.trim();

  if (!currentPassword) {
    showErrorTooltip('Current password is required.', currentPasswordInput);
    return false;
  } else if (!passwordRegex.test(currentPassword)) {
    showErrorTooltip(
      'New password must be between 8 and 16 characters long.',
      currentPasswordInput
    );
    return false;
  } else {
    resetTooltip(
      globalTooltip,
      currentPasswordInput.closest('.field-container')
    );
  }

  if (!newPassword) {
    showErrorTooltip('New password is required.', newPasswordInput);
    return false;
  } else if (!passwordRegex.test(newPassword)) {
    showErrorTooltip(
      'New password must be between 8 and 16 characters long.',
      newPasswordInput
    );
    return false;
  } else {
    resetTooltip(globalTooltip, newPasswordInput.closest('.field-container'));
  }

  if (!confirmPassword) {
    showErrorTooltip('Confirm password is required.', confirmPasswordInput);
    return false;
  } else if (!passwordRegex.test(confirmPassword)) {
    showErrorTooltip(
      'Confirm password must be between 8 and 16 characters long.',
      confirmPasswordInput
    );
    return false;
  } else if (newPassword !== confirmPassword) {
    showErrorTooltip(
      'New password and confirm password do not match.',
      confirmPasswordInput
    );
    return false;
  } else {
    resetTooltip(
      globalTooltip,
      confirmPasswordInput.closest('.field-container')
    );
  }

  return true;
};

const clearPasswordFields = () => {
  currentPasswordInput.value = '';
  newPasswordInput.value = '';
  confirmPasswordInput.value = '';
};

const savePasswordChange = async (
  currentPassword,
  newPassword,
  confirmPassword
) => {
  passwordModifyBtn.innerHTML = getLoader();
  passwordModifyBtn.disabled = true;

  try {
    await simulatePasswordChange(currentPassword, newPassword, confirmPassword);
    clearPasswordFields();
    showMessageBlock('Password changed successfully!', 'success');
  } catch (error) {
    showMessageBlock(
      'Error changing password. Please try again later.',
      'error'
    );
    console.error('Error changing password:', error);
  } finally {
    resetPasswordModifyBtn();
    passwordModifyBtn.disabled = false;
  }
};

const simulatePasswordChange = (
  currentPassword,
  newPassword,
  confirmPassword
) => {
  // Simulate an API call to change the password
  return new Promise((resolve) => {
    setTimeout(resolve, 2000);
  });
};

const resetPasswordModifyBtn = () => {
  passwordModifyBtn.innerHTML = `
      <i class="bi bi-pencil"></i>
      Modify Password`;
};

export const handlePasswordModifyClick = async () => {
  if (!checkPasswordFields()) return;

  const currentPassword = currentPasswordInput.value.trim();
  const newPassword = newPasswordInput.value.trim();
  const confirmPassword = confirmPasswordInput.value.trim();

  await savePasswordChange(currentPassword, newPassword, confirmPassword);
};

const checkDeleteInputsValidity = () => {
  const passwordDelete = passwordDeleteInput.value.trim();
  const isConfirme = deleteAccountConfirmation.checked;

  if (!passwordDelete) {
    showErrorTooltip(
      'Password is required to delete account.',
      passwordDeleteInput
    );
    return false;
  } else if (!passwordRegex.test(passwordDelete)) {
    showErrorTooltip(
      'Password must be between 8 and 16 characters long.',
      passwordDeleteInput
    );
    return false;
  } else {
    resetTooltip(
      globalTooltip,
      passwordDeleteInput.closest('.field-container')
    );
  }

  if (!isConfirme) {
    showErrorTooltip(
      'You must confirm account deletion.',
      deleteAccountConfirmation,
      'confirmation-input'
    );
    return false;
  } else {
    resetTooltip(
      globalTooltip,
      deleteAccountConfirmation
    );
  }

  return true;
};

export const handleCloseAccountBtn = () => {
  debugger
  if (!checkDeleteInputsValidity()) return;

  const passwordDelete = passwordDeleteInput.value.trim();
  // simmulate password check
  if (passwordDelete !== 'correctPassword') {
    showErrorTooltip(
      'Incorrect password. Please try again.',
      passwordDeleteInput
    );
    return;
  }

  // Simulate account deletion
  try {
    // Simulate an API call to delete the account
    setTimeout(() => {
      showMessageBlock('Account deleted successfully!', 'success');
      // Redirect to home or login page
      window.location.href = '/login';
    }, 1000);
  } catch (error) {
    console.error('Error deleting account:', error);
    showMessageBlock(
      'An error occurred while deleting the account. Please try again.',
      'error'
    );
  }
};
