import { auth } from '../../firebase/firebaseConfig.js';
import {
  InitializeGoogleOneTap,
  signInWithFacebookProviderWithPopUp,
  signInWithGoogleProviderWithPopUp,
  createAuserWithEmailAndPassword,
  signInAuserWithEmailAndPassword,
} from './loginFunctions.js';
import {
  showExternalError,
  inputsEmptying,
  validatesSignInForm,
  validatesSignUpForm,
  userNameFormat
} from '../assets/js/domFunctions.js';

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
} from '../assets/js/NodesAndVariables.js';

InitializeGoogleOneTap(auth, showExternalError);

signInBtn.addEventListener('click', (e) => {
  e.preventDefault();
  if (!validatesSignInForm()) return;
  signInAuserWithEmailAndPassword(
    auth,
    signInemailField.value,
    signInPasswordField.value,
    showExternalError
  );
  inputsEmptying();
});
signUpBtn.addEventListener('click', (e) => {
  e.preventDefault();
  if (!validatesSignUpForm()) return;
  const fullName = `${userNameFormat(firstName.value)} ${userNameFormat(firstName.value)}`;
  createAuserWithEmailAndPassword(
    auth,
    fullName,
    signUpemailField.value,
    signUpPasswordField.value,
    showExternalError
  );
  inputsEmptying();
});



googleBtn.addEventListener('click', () => {
  signInWithGoogleProviderWithPopUp(auth, showExternalError);
});

fbBtn.addEventListener('click', () => {
  signInWithFacebookProviderWithPopUp(auth, showExternalError);
});
