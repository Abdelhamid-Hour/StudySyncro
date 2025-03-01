import {
  initializeSignUpForm,
  lettersAnimation,
  swapAnimationThrottling,
} from './domFunctions.js';
import {
  eyeIcon,
  signUpLink,
  signInLink,
  signUpFormHeight,
  signInFormHeight,
  animationDuration,
} from './NodesAndVariables.js';

// prevets browser default validation rules
document.getElementById('sign-in-form').setAttribute('novalidate', true);
document.getElementById('sign-up-form').setAttribute('novalidate', true);

window.addEventListener('load', () => {
  initializeSignUpForm();
});

// Event listener for sign-up link click
signUpLink.addEventListener('click', function () {
  lettersAnimation(
    'Create',
    (word) => {
      document.querySelector('h1 > span').innerText = `${word}`;
    },
    animationDuration,
    50
  );
  swapAnimationThrottling(signUpFormHeight);
});

// Event listener for sign-in link click
signInLink.addEventListener('click', function () {
  lettersAnimation(
    'Login to',
    (word) => {
      document.querySelector('h1 > span').innerText = `${word}`;
    },
    animationDuration,
    20
  );
  swapAnimationThrottling(signInFormHeight);
});

// Event listener for eye icon click to toggle password visibility
eyeIcon.forEach((e) => {
  e.addEventListener('click', () => {
    e.lastElementChild.classList.toggle('show');
    if (e.previousElementSibling.getAttribute('type') === 'password') {
      e.previousElementSibling.setAttribute('type', 'text');
    } else {
      e.previousElementSibling.setAttribute('type', 'password');
    }
  });
});
