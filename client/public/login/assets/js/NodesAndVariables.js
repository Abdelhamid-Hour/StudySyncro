export const eyeIcon = document.querySelectorAll('.eye-icon');
export const passwordsFields = document.querySelectorAll('.password');
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

export const emailRegex = /^[a-z0-9]+@[a-z0-9]+\.[a-z0-9]+$/;
export const passwordRegex = /\w{8,}/;
export const userNameRegex = /^[A-Za-z]{3,15}$/;

export const signInFormHeight = signInFormContainer.getBoundingClientRect().height;
export const signUpFormHeight = signUpFormContainer.getBoundingClientRect().height;
// get the first external styles
export const stylsheet = document.styleSheets[1];

// get the Login swap animation duration from the stylesheet
export const animationDuration = parseInt(
    stylsheet.cssRules[1].cssText
      .match(/--login-swap-animation-duration: \d{1,10}ms;/i)[0]
      .split(':')[1]
  );
