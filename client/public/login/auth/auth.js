import { auth } from "../../firebase/firebaseConfig.js";
import { sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
import {
  InitializeGoogleOneTap,
  signInWithFacebookProviderWithPopUp,
  signInWithGoogleProviderWithPopUp,
  createAuserWithEmailAndPassword,
  signInAuserWithEmailAndPassword,
} from "./auth-functions.js";
import {
  inputsEmptying,
  validatesSignInForm,
  validatesSignUpForm,
  userNameFormat,
  verifyEmail,
} from "../assets/js/utils.js";
import {
  firstNameField as firstName,
  lastNameField as lastName,
  signInemailField,
  signInPasswordField,
  signUpPasswordField,
  signUpemailField,
  signUpBtn,
  signInBtn,
  fbBtn,
  googleBtn,
  formsContainer,
  forgotPasswordLink,
  fileinput
} from "../assets/js/dom-variables.js";
import { showMessageBlock, checkError, t } from "../../main_assets/js/utils.js";

InitializeGoogleOneTap(auth, showMessageBlock);

formsContainer.addEventListener("keyup", (e) => {
  if (e.key === "Enter") {
    if (e.target.matches("#sign-in-form input")) {
      signInBtn.click();
    } else {
      signUpBtn.click();
    }
  }
});

signInBtn.addEventListener("click", async () => {
  if (!validatesSignInForm()) return;
  signInAuserWithEmailAndPassword(
    auth,
    signInemailField.value,
    signInPasswordField.value,
    showMessageBlock,
  );
  inputsEmptying();
});

signUpBtn.addEventListener("click", () => {
  if (!validatesSignUpForm()) return;

  const fullName = `${userNameFormat(firstName.value)} ${userNameFormat(
    lastName.value,
  )}`;

  createAuserWithEmailAndPassword(
    auth,
    fullName,
    signUpemailField.value,
    fileinput.files[0],
    signUpPasswordField.value,
    showMessageBlock,
  );
  inputsEmptying();
});

googleBtn.addEventListener("click", () => {
  signInWithGoogleProviderWithPopUp(auth, showMessageBlock);
});

fbBtn.addEventListener("click", () => {
  signInWithFacebookProviderWithPopUp(auth, showMessageBlock);
});

forgotPasswordLink.addEventListener("click", async () => {
  try {
    if (!verifyEmail()) {
      return;
    }
    await sendPasswordResetEmail(auth, signInemailField.value);
    showMessageBlock(
      t("common:alerts.password_reset_sent"),
      "success",
    );
    signInPasswordField.value = "";
  } catch (error) {
    checkError(error);
    showMessageBlock(error.message, "error");
  }
});
