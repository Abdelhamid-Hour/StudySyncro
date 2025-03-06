import { handlEyeIconsClick } from '../../../main_assets/js/domFunctions.js';
import {
  hideAvatarSide,
  initializeSignUpForm,
  lettersAnimation,
  showAvatarSide,
  swapAnimationThrottling,
  handleFileAndvisuallyShowAvatar,
} from './domFunctions.js';
import {
  eyeIcons,
  signUpLink,
  signInLink,
  signUpFormHeight,
  signInFormHeight,
  animationDuration,
  avatarContainer,
  fileinput,
} from './NodesAndVariables.js';

// prevets browser default validation rules
document.getElementById('sign-in-form').setAttribute('novalidate', true);
document.getElementById('sign-up-form').setAttribute('novalidate', true);

window.addEventListener('load', () => {
  initializeSignUpForm();
});

// Event listener for sign-up link click
signUpLink.addEventListener('click', function () {
  showAvatarSide();
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
  hideAvatarSide();
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

// Add EventListener for eye icons click
handlEyeIconsClick(eyeIcons);

avatarContainer.addEventListener('click', () => {
  fileinput.click();
});

fileinput.addEventListener('change', function () {
  const file = this.files[0];
  handleFileAndvisuallyShowAvatar(file, this);
});

document.addEventListener('dragenter', () => {
  avatarContainer.classList.add('file-drag-start');
});
// document.addEventListener('dragleave', () => {
//   avatarContainer.classList.remove('file-drag-start');
// })
document.addEventListener('drop', (e) => {
  e.preventDefault();
  avatarContainer.classList.remove('file-drag-start');
  handleFileAndvisuallyShowAvatar(e.dataTransfer.files[0]);
});
document.addEventListener('dragover', (e) => {
  e.preventDefault();
});
