import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithCredential,
  signInWithPopup,
  updateProfile,
  FacebookAuthProvider,
  signOut,
} from 'https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js';
import { checkError } from './authErrors.js';
import { sendData, getCookie, sendIdToken } from './fetch.js';
import { redirectTo } from '../../main_assets/js/domFunctions.js';

const googleProvider = new GoogleAuthProvider();
const fbProvider = new FacebookAuthProvider();

/**
 * Handle user sign in
 * @param {Auth} auth
 * @param {User} user
 */
const handleUserSignIn = async (auth, user) => {
  // Send the ID token to the server and get CSRF token
  await sendIdToken(auth, '/session-login');
  // Get CSRF token from the cookie
  const csrfToken = getCookie('csrfToken');
  const userInfo = {
    fullName: user.displayName,
    photoURL: user.photoURL,
    email: user.email,
    uid: user.uid,
  };
  if (!userInfo.photoURL) delete userInfo.photoURL;
  // send user data to the server to save it in Firestore
  await sendData('/insert-user-data', { userInfo, csrfToken });
  // Sign out the user because the session is handled by the server
  await signOut(auth);
  // Redirect to the main page
  redirectTo('/main_page');
};

/**
 * Sign In with a provider using a popup
 * @param {Auth} auth
 * @param {Provider} provider
 */
const signInWhithProvider = async function (auth, provider, callback) {
  const userCredential = await signInWithPopup(auth, provider);
  callback('Signed in successfully', false);
  const user = userCredential.user;
  await handleUserSignIn(auth, user);
};

/**
 * Initialize Google One Tap Sign-In API
 * @param {Auth} auth - The Auth instance.
 * @param {Callback} callback - The callback function that handles the result of the sign-in process. It takes two parameters:
 * first param: message string and
 * second param: boolean indicating if there was an error..
 */
const InitializeGoogleOneTap = function (auth, callback) {
  const handleCredentialResponse = async function (response) {
    try {
      // Convert Google credential to Firebase credential
      const credential = GoogleAuthProvider.credential(response.credential);
      const userCredential = await signInWithCredential(auth, credential);
      const user = userCredential.user;
      callback('Signed in successfully', false);
      await handleUserSignIn(auth, user);
    } catch (error) {
      checkError(error);
      callback(error.message, true);
    }
  };

  google.accounts.id.initialize({
    client_id:
      '944790274402-ggk3nn93362bqebjj2mfdvpr0mfhksgj.apps.googleusercontent.com', // Replace with your Client ID
    callback: handleCredentialResponse,
    cancel_on_tap_outside: false,
  });
};

const showGoogleOneTap = function () {
  google.accounts.id.prompt();
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
    callback(error.message, true);
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
    callback(error.message, true);
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
  password,
  callback
) {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    callback('User account created successfully', false);
    const user = userCredential.user;
    await updateProfile(user, {
      displayName: fullName,
    });
    await handleUserSignIn(auth, user);
  } catch (error) {
    checkError(error);
    callback(error.message, true);
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
  callback
) {
  try {
    await signInWithEmailAndPassword(auth, email, password);
    callback('Signed in successfully', false);
    await sendIdToken(auth, '/session-login');
    await signOut(auth);
    redirectTo('/main_page');
  } catch (error) {
    checkError(error);
    callback(error.message, true);
  }
};

export {
  InitializeGoogleOneTap,
  showGoogleOneTap,
  signInWithFacebookProviderWithPopUp,
  signInWithGoogleProviderWithPopUp,
  createAuserWithEmailAndPassword,
  signInAuserWithEmailAndPassword,
};
