import {
  confirmPasswordReset,
  verifyPasswordResetCode,
} from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
import { auth } from "../../firebase/firebaseConfig.mjs";
import { t } from "../../main_assets/js/i18n.mjs";
import {
  checkError,
  redirectTo,
  showMessageBlock,
} from "../../main_assets/js/utils.mjs";
import {
  clearInputFields,
  showErrorMsg,
  splitUrlParams,
  verifyPasswordFields,
} from "../assets/js/utils.mjs";
import { passwordField } from "../assets/js/dom-variables.mjs";

const oobCode = splitUrlParams("oobCode");

export const verifyOobCode = async () => {
  debugger;
  try {
    await verifyPasswordResetCode(auth, oobCode);
  } catch (error) {
    const title = t("shared:alerts.try_resetting_again");
    const message = t("shared:alerts.reset_link_expired");
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
    showMessageBlock(t("shared:alerts.password_reset_success"), "success");
    setTimeout(() => {
      redirectTo("/login");
    }, 1500);
  } catch (error) {
    checkError(error);
    showMessageBlock(error.message, "error");
  }
};
