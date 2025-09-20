import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  FacebookAuthProvider,
} from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
import { auth } from "../../../../firebase/firebaseConfig.js";
import {
  checkError,
  fetchData,
  showMessageBlock,
} from "../../../../main_assets/js/utils.js";
import { AUTH_ERRORS } from "../../../../main_assets/js/variables.js";

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
        showMessageBlock(
          "To Verify, please login with your Facebook account.",
          "info"
        );
        const fbProvider = new FacebookAuthProvider();
        credentials = await signInWithPopup(auth, fbProvider);
        return { idToken: await credentials.user.getIdToken(true) };

      default:
        showMessageBlock(
          "To Verify, please login with your Google account.",
          "info"
        );
        const googleProvider = new GoogleAuthProvider();
        credentials = await signInWithPopup(auth, googleProvider);
        return { idToken: await credentials.user.getIdToken(true) };
    }
  } catch (error) {
    // if the error is auth/invalid-credential show a specific message
    if (error.code === AUTH_ERRORS.INVALID_CREDENTIAL)
      showMessageBlock("Incorrect password.", "error");
    checkError(error);
    console.error("Error fetching fresh token ID:", error);
    showMessageBlock(error.message, "error");
    return null;
  }
};
