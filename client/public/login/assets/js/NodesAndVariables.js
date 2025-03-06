export const eyeIcons = document.querySelectorAll('.eye-icon');
export const passwordsFields = document.querySelectorAll('.password');
export const formsContainer = document.getElementById('forms');
export const signInLink = document.getElementById('sign-in-link');
export const signUpLink = document.getElementById('sign-up-link');
export const signInFormContainer = document.getElementById('sign-in-container');
export const signUpFormContainer = document.getElementById('sign-up-container');
export const signInBtn = document.getElementById('sign-in-btn');
export const signUpBtn = document.getElementById('sign-up-btn');
export const signInemailField = document.getElementById('sign-in-email');
export const signUpemailField = document.getElementById('sign-up-email');
export const signInPasswordField = document.getElementById('sign-in-password');
export const signUpPasswordField = document.getElementById('sign-up-password');
export const signUpConfirmPasswordField = document.getElementById('confirm-password');
export const firstNameField = document.getElementById('first-name');
export const lastNameField = document.getElementById('last-name');
export const googleBtn = document.getElementById('google-sign-in');
export const fbBtn = document.getElementById('fb-sign-in');
export const avatarAside = document.querySelector('aside');
export const avartarSpaceReserver = document.getElementById('space-reserver');
export const avatarContainer = document.getElementById('avatar-container');
export const fileinput = avatarContainer.querySelector('input');
export const forgotPasswordLink = signInFormContainer.querySelector('#forgot-password');
export const MAX_FILE_SIZE = 200;


export const emailRegex = /^[a-z0-9]+@[a-z0-9]+\.[a-z0-9]+$/;
export const userNameRegex = /^[A-Za-z]+( [A-Za-z]+)*$/;

export const signInFormHeight = signInFormContainer.getBoundingClientRect().height;
export const signUpFormHeight = signUpFormContainer.getBoundingClientRect().height;
// get the first external styles
export const stylsheet = document.styleSheets[4];

// get the Login swap animation duration from the stylesheet
export const animationDuration = parseInt(
  stylsheet.cssRules[0].cssText
  .match(/--login-swap-animation-duration: \d{1,10}ms;/i)[0]
  .split(':')[1]
);