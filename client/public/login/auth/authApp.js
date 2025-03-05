import { auth } from '../../firebase/firebaseConfig.js';
import { sendPasswordResetEmail } from 'https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js';
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
  userNameFormat,
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
  formsContainer,
} from '../assets/js/NodesAndVariables.js';

InitializeGoogleOneTap(auth, showExternalError);

formsContainer.addEventListener('keyup', (e) => {
  if (e.key === 'Enter') {
    if (e.target.matches('#sign-in-form input')) {
      signInBtn.click();
    } else {
      signUpBtn.click();
    }
  }
});
signInBtn.addEventListener('click', async () => {
  const p = await sendPasswordResetEmail(auth, signInemailField.value);
    console.log(p);
  // if (!validatesSignInForm()) return;
  // signInAuserWithEmailAndPassword(
  //   auth,
  //   signInemailField.value,
  //   signInPasswordField.value,
  //   showExternalError
  // );
  // inputsEmptying();
});
signUpBtn.addEventListener('click', () => {
  if (!validatesSignUpForm()) return;
  const fullName = `${userNameFormat(firstName.value)} ${userNameFormat(
    firstName.value
  )}`;
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
