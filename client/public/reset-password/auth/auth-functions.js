import {
  verifyPasswordResetCode,
  confirmPasswordReset,
} from 'https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js';
import {
  splitUrlParams,
  showErrorMsg,
  verifyPasswordFields,
  clearInputFields,
} from '../assets/js/utils.js';
import { auth } from '../../firebase/firebaseConfig.js';
import { showMessageBlock, redirectTo } from '../../main_assets/js/utils.js';
import { passwordField } from '../assets/js/variables.js';

const oobCode = splitUrlParams('oobCode');

export const verifyOobCode = async () => {
  try {
    await verifyPasswordResetCode(auth, oobCode);
  } catch (error) {
    const title = 'Try resetting your password again';
    const message =
      'Your request to reset your password has expired or the link has already been used';
    showErrorMsg(title, message);
  }
};

export const resetPassword = async () => {
  if (!verifyPasswordFields()) {
    return;
  }
  try {
    await confirmPasswordReset(auth, oobCode, passwordField.value);
    clearInputFields();
    showMessageBlock('Password reset successful', 'success');
    setTimeout(() => {
      redirectTo('/login');
    }, 1500);
  } catch (error) {
    showMessageBlock(error.message, 'error');
  }
};
