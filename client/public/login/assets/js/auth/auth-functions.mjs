import {
  createUserWithEmailAndPassword,
  FacebookAuthProvider,
  GoogleAuthProvider,
  signInWithCredential,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
import {
  checkError,
  redirectTo,
  sendData,
  showMessageBlock,
  t,
} from "../../../../main_assets/js/utils.mjs";

const googleProvider = new GoogleAuthProvider();
const fbProvider = new FacebookAuthProvider();

export const getLoader = () => {
  return `<!-- From Uiverse.io by gustavofusco --> 
<svg xmlns="http://www.w3.org/2000/svg" height="200px" width="200px" viewBox="0 0 200 200" class="pencil">
	<defs>
		<clipPath id="pencil-eraser">
			<rect height="30" width="30" ry="5" rx="5"></rect>
		</clipPath>
	</defs>
	<circle transform="rotate(-113,100,100)" stroke-linecap="round" stroke-dashoffset="439.82" stroke-dasharray="439.82 439.82" stroke-width="2" stroke="currentColor" fill="none" r="70" class="pencil__stroke"></circle>
	<g transform="translate(100,100)" class="pencil__rotate">
		<g fill="none">
			<circle transform="rotate(-90)" stroke-dashoffset="402" stroke-dasharray="402.12 402.12" stroke-width="30" stroke="hsl(223,90%,50%)" r="64" class="pencil__body1"></circle>
			<circle transform="rotate(-90)" stroke-dashoffset="465" stroke-dasharray="464.96 464.96" stroke-width="10" stroke="hsl(223,90%,60%)" r="74" class="pencil__body2"></circle>
			<circle transform="rotate(-90)" stroke-dashoffset="339" stroke-dasharray="339.29 339.29" stroke-width="10" stroke="hsl(223,90%,40%)" r="54" class="pencil__body3"></circle>
		</g>
		<g transform="rotate(-90) translate(49,0)" class="pencil__eraser">
			<g class="pencil__eraser-skew">
				<rect height="30" width="30" ry="5" rx="5" fill="hsl(223,90%,70%)"></rect>
				<rect clip-path="url(#pencil-eraser)" height="30" width="5" fill="hsl(223,90%,60%)"></rect>
				<rect height="20" width="30" fill="hsl(223,10%,90%)"></rect>
				<rect height="20" width="15" fill="hsl(223,10%,70%)"></rect>
				<rect height="20" width="5" fill="hsl(223,10%,80%)"></rect>
				<rect height="2" width="30" y="6" fill="hsla(223,10%,10%,0.2)"></rect>
				<rect height="2" width="30" y="13" fill="hsla(223,10%,10%,0.2)"></rect>
			</g>
		</g>
		<g transform="rotate(-90) translate(49,-30)" class="pencil__point">
			<polygon points="15 0,30 30,0 30" fill="hsl(33,90%,70%)"></polygon>
			<polygon points="15 0,6 30,0 30" fill="hsl(33,90%,50%)"></polygon>
			<polygon points="15 0,20 10,10 10" fill="hsl(223,10%,10%)"></polygon>
		</g>
	</g>
</svg>`;
};

export const initVerifyMsgBlock = () => {
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
};

/**
 * Handle user sign in
 * @param {Auth} auth
 * @param {User} user
 */
const handleUserSignUp = async (auth, user) => {
  // Send the ID token to the server and get CSRF token
  await sendIdToken(auth, "/login");

  const formData = new FormData();
  formData.append("uid", user.uid);
  formData.append("fullName", user.displayName);
  formData.append("email", user.email);
  formData.append("photoURL", user.photoURL);
  if (user.avatar) formData.append("file", user.avatar);

  // send user data to the server to save it in Firestore
  await sendData("/api/insert-user-data", formData, "POST");

  // Log out the user In the frontend to avoid persistence
  signOut(auth);

  // Redirect to the main page
  redirectTo("/app/home");
};

/**
 * Sign In with a provider using a popup
 * @param {Auth} auth
 * @param {Provider} provider
 */
const signInWhithProvider = async function (auth, provider, callback) {
  const userCredential = await signInWithPopup(auth, provider);
  const user = userCredential.user;
  callback(t("login:messages.signed_in_redirecting"), "success");
  await handleUserSignUp(auth, user);
};

/**
 * Initialize Google One Tap Sign-In API
 * @param {Auth} auth - The Auth instance.
 * @param {Callback} callback - The callback function that handles the result of the sign-in process. It takes two parameters:
 * first param: message string and
 * second param: boolean indicating if there was an error..
 */

const showGoogleOneTap = function () {
  console.log("passssed");

  google.accounts.id.prompt();
};

const initializeGoogleOneTap = function (auth, callback) {
  const handleCredentialResponse = async function (response) {
    try {
      // Convert Google credential to Firebase credential
      const credential = GoogleAuthProvider.credential(response.credential);
      const userCredential = await signInWithCredential(auth, credential);
      callback(t("login:messages.signed_in_redirecting"), "success");
      const user = userCredential.user;
      await handleUserSignUp(auth, user);
    } catch (error) {
      checkError(error);
      callback(error.message, "error");
    }
  };

  google.accounts.id.initialize({
    client_id:
      "342899099971-6pfk7ej642mlt1qdgkuin0r37s1j0m96.apps.googleusercontent.com", // Replace with your Client ID
    callback: handleCredentialResponse,
    cancel_on_tap_outside: false,
  });
};

/**
 * Sign In with Facebook using a popup
 * @param {Auth} auth - The Auth instance.
 * @param {Callback} callback - The callback function that handles the result of the sign-in process. It takes two parameters:
 * first param: message string and
 * second param: boolean indicating if there was an error..
 */
const signInWithFacebookProviderWithPopUp = async function (auth, callback) {
  try {
    await signInWhithProvider(auth, fbProvider, callback);
  } catch (error) {
    checkError(error);
    callback(error.message, "error");
  }
};

/**
 * Sign In with Google using a popup
 * @param {Auth} auth - The Auth instance.
 * @param {Callback} callback - The callback function that handles the result of the sign-in process. It takes two parameters:
 * first param: message string and
 * second param: boolean indicating if there was an error..
 */
const signInWithGoogleProviderWithPopUp = async function (auth, callback) {
  try {
    await signInWhithProvider(auth, googleProvider, callback);
  } catch (error) {
    checkError(error);
    callback(error.message, "error");
  }
};

/**
 * Create user with createUserWithEmailAndPassword() firebase Methode
 * @param {Auth} auth - The Auth instance
 * @param {String} fullName - The full name of the user
 * @param {String} email - The email of the user
 * @param {String} password - The password of the user
 * @param {Callback} callback - The callback function that handles the result of the sign-in process. It takes two parameters:
 * first param: message string and
 * second param: boolean indicating if there was an error.
 */
const createAuserWithEmailAndPassword = async function (
  auth,
  fullName,
  email,
  avatar,
  password,
  callback,
) {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );
    const user = userCredential.user;
    await updateProfile(user, {
      displayName: fullName,
    });

    const idToken = await user.getIdToken();
    const formData = new FormData();
    formData.append("idToken", idToken);
    formData.append("uid", user.uid);
    formData.append("fullName", user.displayName);
    formData.append("email", user.email);
    formData.append("photoURL", user.photoURL);
    if (avatar) formData.append("file", avatar);

    // send user data to the server to save it in Firestore
    await sendData("/api/insert-user-data", formData, "POST");

    // Log out from server and frontend because email is unverified
    await fetch("/logout", { method: "POST" });
    signOut(auth);

    callback(t("login:messages.account_created_verify"), "success");
  } catch (error) {
    checkError(error);
    callback(error.message, "error");
  }
};

/**
 * Sign In a user with email and password
 * @param {Auth} auth - The Auth instance
 * @param {String} fullName - The full name
 * @param {String} email - The email
 * @param {String} password - The password
 * @param {Callback} callback - The callback function that handles the result of the sign-in process. It takes two parameters:
 * first param: message string and
 * second param: boolean indicating if there was an error.
 */
const signInAuserWithEmailAndPassword = async function (
  auth,
  email,
  password,
  callback,
) {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password,
    );
    const user = userCredential.user;
    if (!user.emailVerified) {
      await sendData("/api/resend-verification", { email: user.email });
      signOut(auth);
      callback(t("login:messages.email_unverified"), "info");
      return;
    }
    callback(t("login:messages.signed_in_redirecting"), "success");
    await sendIdToken(auth, "/login");
    // Log out the user In the frontend to avoid persistence
    signOut(auth);
    redirectTo("/app/home");
  } catch (error) {
    checkError(error);
    callback(error.message, "error");
  }
};

/**
 * Sends the ID token to the server
 * @param {Auth} auth
 * @param {String} url
 * @returns The response from the server
 */
const sendIdToken = async function (auth, url) {
  const idToken = await auth.currentUser.getIdToken();
  // Send the ID token to the server
  const response = await fetch(url, {
    method: "POST",
    body: JSON.stringify({ idToken }),
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) {
    const responseData = await response.json();
    const error = new Error(responseData.message);
    error.data = responseData;
    throw error;
  }
  return response.json();
};

export {
  createAuserWithEmailAndPassword,
  initializeGoogleOneTap,
  sendIdToken,
  showGoogleOneTap,
  signInAuserWithEmailAndPassword,
  signInWithFacebookProviderWithPopUp,
  signInWithGoogleProviderWithPopUp,
};
