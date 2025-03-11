import { handlEyeIconsClick } from '../../../main_assets/js/domFunctions.js';
import {
  hideAvatarSide,
  initializeSignUpForm,
  lettersAnimation,
  showAvatarSide,
  swapAnimationThrottling,
  handleFileAndvisuallyShowAvatar,
  showAvatarError,
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
  avatarAside,
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
    20
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
  if (
    !(file && file.type.includes('image') && avatarAside.className === 'shown')
  )
    return showAvatarError(
      'Invalid file type. Please select a valid image file.'
    );
  handleFileAndvisuallyShowAvatar(file, this);
});

document.addEventListener('dragenter', (e) => {
  if (e.relatedTarget === null)
    avatarContainer.classList.add('file-drag-start');
});
document.addEventListener('dragleave', (e) => {
  if (e.relatedTarget === null)
    avatarContainer.classList.remove('file-drag-start');
});
document.addEventListener('drop', (e) => {
  e.preventDefault();
  const file = e.dataTransfer.files[0];
  avatarContainer.classList.remove('file-drag-start');
  if (
    !(file && file.type.includes('image') && avatarAside.className === 'shown')
  )
    return showAvatarError(
      'Invalid file type. Please select a valid image file.'
    );
  handleFileAndvisuallyShowAvatar(e.dataTransfer.files[0]);
});

document.addEventListener('dragover', (e) => {
  e.preventDefault();
});



// todo: add event listener for inputs blur
// adjust the avatare side on mobile