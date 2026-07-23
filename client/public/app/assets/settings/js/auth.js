import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  FacebookAuthProvider,
} from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
import { auth } from "../../../../firebase/firebaseConfig.js";
import {
  t,
  checkError,
  fetchData,
  showMessageBlock,
  isNativeDomainCondition,
} from "../../global/js/utils.js";
import { AUTH_ERRORS } from "../../global/js/variables.js";

export const getFreshTokenId = async (password) => {
  try {
    const { provider, email } = await fetchData("/user-info");

    let credentials = null;
    if (password && email) {
      credentials = await signInWithEmailAndPassword(auth, email, password);
      return { idToken: await credentials.user.getIdToken(true) };
    }
    switch (provider) {
      case "facebook":
        showMessageBlock(t("settings:alerts.fb_login_info"), "info");
        const fbProvider = new FacebookAuthProvider();
        credentials = await signInWithPopup(auth, fbProvider);
        return { idToken: await credentials.user.getIdToken(true) };

      default:
        showMessageBlock(t("settings:alerts.google_login_info"), "info");
        const googleProvider = new GoogleAuthProvider();
        credentials = await signInWithPopup(auth, googleProvider);
        return { idToken: await credentials.user.getIdToken(true) };
    }
  } catch (error) {
    // if the error is auth/invalid-credential show a specific message
    if (error.code === AUTH_ERRORS.INVALID_CREDENTIAL) {
      showMessageBlock(t("settings:alerts.incorrect_password"), "warning");
      return null;
    }
    const isNative =
      error.isNative || error.data?.isNative || isNativeDomainCondition(error);
    const notifType =
      error.type || error.data?.type || (isNative ? "info" : "error");
    if (!isNative) checkError(error);
    if (!isNative) console.error("Error fetching fresh token ID:", error);
    showMessageBlock(error.message, notifType);
    return null;
  }
};
