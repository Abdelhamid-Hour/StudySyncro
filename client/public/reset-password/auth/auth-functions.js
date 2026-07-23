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
import { showMessageBlock, redirectTo, checkError } from '../../main_assets/js/utils.js';
import { t } from '../../main_assets/js/i18n.js';
import { passwordField } from '../assets/js/variables.js';

const oobCode = splitUrlParams('oobCode');

export const verifyOobCode = async () => {
  try {
    await verifyPasswordResetCode(auth, oobCode);
  } catch (error) {
    const title = t('reset_password:errors.expired_title');
    const message = t('reset_password:errors.expired_message');
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
    showMessageBlock(t('reset_password:messages.reset_successful'), 'success');
    setTimeout(() => {
      redirectTo('/login');
    }, 1500);
  } catch (error) {
    checkError(error);
    showMessageBlock(error.message, 'error');
  }
};
