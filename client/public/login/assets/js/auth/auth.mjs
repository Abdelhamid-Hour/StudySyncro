import { sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.mjs";
import { auth } from "../../../../firebase/firebaseConfig.mjs";
import {
  checkError,
  showMessageBlock,
  t,
} from "../../../../main_assets/js/utils.mjs";
import {
  fbBtn,
  fileinput,
  firstNameField as firstName,
  forgotPasswordLink,
  formsContainer,
  googleBtn,
  lastNameField as lastName,
  signInBtn,
  signInemailField,
  signInPasswordField,
  signUpBtn,
  signUpemailField,
  signUpPasswordField,
} from "../dom-variables.mjs";
import {
  inputsEmptying,
  userNameFormat,
  validatesSignInForm,
  validatesSignUpForm,
  verifyEmail,
} from "../utils.mjs";
import {
  createAuserWithEmailAndPassword,
  getLoader,
  initializeGoogleOneTap,
  signInAuserWithEmailAndPassword,
  signInWithFacebookProviderWithPopUp,
  signInWithGoogleProviderWithPopUp,
} from "./auth-functions.mjs";

initializeGoogleOneTap(auth, showMessageBlock);

const urlParams = new URLSearchParams(window.location.search);
const errorParam = urlParams.get("error");
if (errorParam) {
  const errorMap = {
    expired: t("login:messages.verification_expired"),
    invalid: t("login:messages.verification_invalid"),
    used: t("login:messages.verification_used"),
    failed: t("login:messages.verification_failed"),
  };

  if (errorMap[errorParam]) {
    showMessageBlock(errorMap[errorParam], "error");
    window.history.replaceState({}, document.title, window.location.pathname);
  }
}

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

  const originalText = signInBtn.innerHTML;
  signInBtn.disabled = true;
  signInBtn.innerHTML = getLoader();

  await signInAuserWithEmailAndPassword(
    auth,
    signInemailField.value,
    signInPasswordField.value,
    showMessageBlock,
  );

  signInBtn.innerHTML = originalText;
  signInBtn.disabled = false;
  inputsEmptying();
});

signUpBtn.addEventListener("click", async () => {
  if (!validatesSignUpForm()) return;

  const fullName = `${userNameFormat(firstName.value)} ${userNameFormat(
    lastName.value,
  )}`;

  const originalText = signUpBtn.innerHTML;
  signUpBtn.disabled = true;
  signUpBtn.innerHTML = getLoader();

  await createAuserWithEmailAndPassword(
    auth,
    fullName,
    signUpemailField.value,
    fileinput.files[0],
    signUpPasswordField.value,
    showMessageBlock,
  );

  signUpBtn.innerHTML = originalText;
  signUpBtn.disabled = false;
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
    showMessageBlock(t("common:alerts.password_reset_sent"), "success");
    signInPasswordField.value = "";
  } catch (error) {
    checkError(error);
    showMessageBlock(error.message, "error");
  }
});
