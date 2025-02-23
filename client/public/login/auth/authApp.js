import { auth } from '../../firebase/firebaseConfig.js';
import {
  InitializeGoogleOneTap,
  signInWithFacebookProviderWithPopUp,
  signInWithGoogleProviderWithPopUp,
  createAuserWithEmailAndPassword,
  signInAuserWithEmailAndPassword,
} from './loginFunctions.js';
import { showErrorMsg } from '../assets/js/domFunctions.js';

import {
  email,
  password,
  firstName,
  lastName,
  signUpBtn,
  signInBtn,
  fbBtn,
  googleBtn,
} from '../assets/js/getNodes.js';

InitializeGoogleOneTap(auth, showErrorMsg);

signUpBtn.addEventListener('click', (e) => {
  e.preventDefault();
  const fullName = `${firstName.value} ${lastName.value}`;

  createAuserWithEmailAndPassword(
    auth,
    fullName,
    email.value,
    password.value,
    showErrorMsg
  );
});

signInBtn.addEventListener('click', (e) => {
  e.preventDefault();

  signInAuserWithEmailAndPassword(
    auth,
    email.value,
    password.value,
    showErrorMsg
  );
});

googleBtn.addEventListener('click', () => {
  signInWithGoogleProviderWithPopUp(auth, showErrorMsg);
});

fbBtn.addEventListener('click', () => {
  signInWithFacebookProviderWithPopUp(auth, showErrorMsg);
});
