import { passwordRegex } from '../../../main_assets/js/variables.js';
import {
  stylsheet,
  signInemailField,
  signInPasswordField,
  signUpemailField,
  signUpPasswordField,
  signUpConfirmPasswordField,
  firstNameField,
  lastNameField,
  signInFormHeight,
  signUpFormHeight,
  signUpFormContainer,
  signInFormContainer,
  emailRegex,
  userNameRegex,
  animationDuration,
  avatarAside,
  avartarSpaceReserver,
  MAX_FILE_SIZE,
} from './NodesAndVariables.js';

let cssRulesLength = stylsheet.cssRules.length;

/**
 * Generates the CSS rules for the swap animation.
 * @param {Number} targetSignUpFormHeight - The target height for the sign-up form.
 * @returns {Object} The initial rule and the class keyframe rule of the animation.
 */
const getSwapAnimationRule = (targetSignUpFormHeight) => {
  let delay, reverse;
  if (targetSignUpFormHeight === signInFormHeight) {
    delay = false;
    reverse = true;
  } else {
    delay = true;
    reverse = false;
  }

  return {
    signUpClassAnimationRule: `
    .sign-up-swap-animation, 
    .sign-in-swap-animation {
      --mask-animation-start: 90%;
      --mask-animation-end: 100%;
      mask-image: linear-gradient(
      black var(--mask-animation-start),
      transparent var(--mask-animation-end)
      );
      animation: signUpMaskAnimation var(--login-swap-animation-duration) linear
      ${reverse ? 'reverse' : ''} forwards;
      animation-duration: calc(var(--login-swap-animation-duration)*0.1/2);
      animation-delay: calc(var(--login-swap-animation-duration) * 0.95);
        &.sign-in-swap-animation {
          animation-delay: 0s;
          --mask-animation-start: -10%;
          --mask-animation-end: 0%;
          mask-image: linear-gradient(
          transparent var(--mask-animation-start),
          black var(--mask-animation-end)
          );
          animation-duration: calc(var(--login-swap-animation-duration)/2);
          ${
            delay
              ? ''
              : 'animation-delay: calc(var(--login-swap-animation-duration)/2);'
          }
        }
        &.sign-up-swap-animation {
          height: ${targetSignUpFormHeight}px;
          }
        }`,
    initialRule: `
    .sign-up-container{
      height: ${
        targetSignUpFormHeight === signInFormHeight
          ? signUpFormHeight
          : signInFormHeight
      }px;
      z-index: 1;      
      transition: height calc(var(--login-swap-animation-duration)/2) 
      ${delay ? 'calc(var(--login-swap-animation-duration)/2)' : ''} linear;
        }`,
  };
};
/**
 * Initializes the sign-up form by creating and inserting animation rules.
 */
const initializeSignUpForm = () => {
  // create a new rule to animate the sign-up form from its signInFormHeight height to its original height
  const signUpAnimationRules = getSwapAnimationRule(signUpFormHeight);
  stylsheet.insertRule(signUpAnimationRules.initialRule, cssRulesLength);
  stylsheet.insertRule(
    signUpAnimationRules.signUpClassAnimationRule,
    ++cssRulesLength
  );
};
const inputsEmptying = () => {
  signInemailField.value = '';
  signInPasswordField.value = '';
  signUpemailField.value = '';
  signUpPasswordField.value = '';
  signUpConfirmPasswordField.value = '';
  firstNameField.value = '';
  lastNameField.value = '';
};

/**
 * Executes the swap animation
 * @param {Number} targetSignUpFormHeight - The target height for the sign-up form.
 */
const swapAnimation = (targetSignUpFormHeight) => {
  // add the z-index based on the signUp form height
  if (targetSignUpFormHeight === signInFormHeight) {
    hideErrors(
      signUpPasswordField,
      signUpConfirmPasswordField,
      firstNameField,
      lastNameField,
      signUpemailField
    );
    signInFormContainer.classList.add('active');
    signInFormContainer.onanimationstart = () => {
      signUpFormContainer.style.zIndex = '1';
      signInFormContainer.onanimationstart = null;
    };
  } else {
    hideErrors(signInPasswordField, signInemailField);
    signUpFormContainer.onanimationstart = () => {
      signUpFormContainer.style.zIndex = '2';
      signUpFormContainer.onanimationstart = null;
    };
  }
  // discharging inputs
  inputsEmptying();
  const signUpAnimationRules = getSwapAnimationRule(targetSignUpFormHeight);
  // delete the initial sign Up form height before removing the class animation
  // because it prevents the sign Up form to back to the initial animation height
  stylsheet.deleteRule(--cssRulesLength);
  // add the new Initial sign Up form height
  stylsheet.insertRule(signUpAnimationRules.initialRule, ++cssRulesLength);
  signUpFormContainer.classList.remove('sign-up-swap-animation');
  signInFormContainer.classList.remove('sign-in-swap-animation');
  // delete the sign Up form animation rule
  stylsheet.deleteRule(--cssRulesLength);
  // add the new sign Up form animation rule to the stylesheet as a last style
  stylsheet.insertRule(
    signUpAnimationRules.signUpClassAnimationRule,
    ++cssRulesLength
  );
  // force re-layout and repaint to apply the new animation
  void signInFormContainer.offsetWidth;
  void signUpFormContainer.offsetWidth;
  signUpFormContainer.classList.add('sign-up-swap-animation');
  signInFormContainer.classList.add('sign-in-swap-animation');
};

/**
 * Throttles a function to prevent it from being called too frequently.
 * @param {Number} TimeInterval - The time interval in milliseconds to wait before executing the callback function again.
 * @param {Function} callback - The function to be executed after the specified time interval.
 * @returns {Function} - The throttled function.
 */
const throttling = function (TimeInterval, callback) {
  let inAction = false;
  return function (...args) {
    if (!inAction) {
      inAction = true;
      callback.apply(this, args);
      setTimeout(() => {
        inAction = false;
      }, TimeInterval);
    }
  };
};

export const swapAnimationThrottling = throttling(
  animationDuration,
  swapAnimation
);
const hideErrors = (...elements) => {
  elements.forEach((element) => {
    const container = element.parentElement.parentElement;
    container.classList.remove('error');
    container.classList.remove('error-animation');
    void container.offsetWidth;
    if ([firstNameField, lastNameField].includes(element)) {
      signUpFormContainer.querySelector(
        '.user-name-container .error-container'
      ).firstElementChild.innerHTML = '';
    } else {
      container.nextElementSibling.firstElementChild.innerHTML = '';
    }
  });
};
const showError = (errorMessage, element) => {
  const container = element.parentElement.parentElement;
  const errorIcon = '<i class="bi bi-exclamation-circle"></i>';
  if ([firstNameField, lastNameField].includes(element)) {
    signUpFormContainer.querySelector(
      '.user-name-container .error-container'
    ).firstElementChild.innerHTML = `${errorIcon} ${errorMessage}`;
  } else {
    container.nextElementSibling.firstElementChild.innerHTML = `${errorIcon} ${errorMessage}`;
  }
  container.classList.add('error');
  container.classList.add('error-animation');
  element.focus();
};

const validatesSignInForm = () => {
  hideErrors(signInemailField, signInPasswordField);
  const email = signInemailField.value.trim();
  const password = signInPasswordField.value.trim();
  if (!passwordRegex.test(password)) {
    showError(
      'The password must be at least 8 characters',
      signInPasswordField
    );
  }
  if (!emailRegex.test(email)) {
    showError('Please enter a valid email', signInemailField);
  }
  if (!emailRegex.test(email) || !passwordRegex.test(password)) {
    return false;
  }
  return true;
};

const verifyEmail = () => {
  hideErrors(signInemailField);
  const email = signInemailField.value.trim();
  if (!emailRegex.test(email)) {
    showError('Please enter a valid email', signInemailField);
    return false;
  }
  return true;
};

const validatesSignUpForm = () => {
  hideErrors(
    signUpemailField,
    signUpPasswordField,
    signUpConfirmPasswordField,
    firstNameField,
    lastNameField
  );
  const email = signUpemailField.value.trim();
  const password = signUpPasswordField.value.trim();
  const confirmPassword = signUpConfirmPasswordField.value.trim();
  const firstName = firstNameField.value.trim();
  const lastName = lastNameField.value.trim();
  if (password !== confirmPassword) {
    showError('Passwords do not match', signUpConfirmPasswordField);
  }

  if (!passwordRegex.test(password)) {
    showError(
      'The password must be at least 8 characters',
      signUpPasswordField
    );
  }

  if (!emailRegex.test(email)) {
    showError('Please enter a valid email', signUpemailField);
  }

  if (!userNameRegex.test(lastName)) {
    showError('Last name must be 3-15 characters only letters', lastNameField);
  }

  if (!userNameRegex.test(firstName)) {
    showError(
      'First name must be 3-15 characters only letters',
      firstNameField
    );
  }

  if (
    !emailRegex.test(email) ||
    !passwordRegex.test(password) ||
    !userNameRegex.test(firstName) ||
    !userNameRegex.test(lastName) ||
    password !== confirmPassword
  ) {
    return false;
  }
  return true;
};

/**
 * Generates a function to animate the letters of a word, creating a random letter animation effect.
 *
 * This function returns another function that, when called, will animate the letters of a given word.
 * The animation involves replacing each letter of the word with random characters from a specified set,
 * creating a dynamic and visually appealing effect. The animation progresses letter by letter until the
 * entire word is displayed.
 *
 * @returns {(word: string, actionCallBack: Function, animationDuration: number, letterAnimationDuration: number, charactersString: string) => void} A function that animates the letters of a word.
 *
 * The returned function has the following parameters:
 *
 * @param {String} word - The word to animate.
 * @param {Function} actionCallBack - A callback function that receives the current state of the animated word.
 * @param {Number} animationDuration - The total duration of the animation in milliseconds.
 * @param {Number} letterAnimationDuration - The duration between each letter's animation in milliseconds.
 * @param {String} charactersString - A string of characters to be used in the animation. If not provided, defaults to the alphabet.
 */
const getLettersAnimation = () => {
  let animating = false;
  let originalWord = '';
  let wordTarget = '';
  let letterDuration = 0;
  let characters = [];
  const splitString = (string) =>
    [...new Intl.Segmenter().segment(string)].map((x) => x.segment);

  return function lettersAnimation(
    word,
    actionCallBack,
    animationDuration,
    letterAnimationDuration,
    charactersString
  ) {
    if (word === wordTarget) {
      wordTarget = '';
      animating = false;
      return;
    }
    if (!animating) {
      letterDuration = animationDuration / word.length;
      originalWord = word;
      characters = charactersString
        ? splitString(charactersString)
        : 'abcdefghijklmnopqrstuvwxyz'.split('');
      animating = true;
      const intervalLitterAnimation = setInterval(() => {
        wordTarget += originalWord[0] || '';
        originalWord = originalWord.substring(1);
        if (originalWord === '') {
          clearInterval(intervalLitterAnimation);
        }
      }, letterDuration);
    }

    let wordArray = originalWord.split('');
    for (let index = 0; index < originalWord.length; index++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      wordArray[index] = characters[randomIndex];
    }
    const printedWord = wordTarget + wordArray.join('');
    actionCallBack(printedWord);
    setTimeout(() => {
      requestAnimationFrame(() => {
        arguments[0] = printedWord;
        lettersAnimation(...arguments);
      });
    }, letterAnimationDuration);
  };
};

const lettersAnimation = throttling(animationDuration, getLettersAnimation());

const userNameFormat = (name) => {
  name = name.toLowerCase();
  return name.charAt(0).toUpperCase() + name.slice(1);
};

const hideAvatarSide = () => {
  avatarAside.style.zIndex = '-1';
  avatarAside.classList.remove('shown');
  avartarSpaceReserver.classList.remove('shown');
  avatarAside.querySelector('img').src = './assets/images/user.png';
  setTimeout(() => {
    avatarAside.querySelector('div').style.display = 'none';
  }, animationDuration);
};

const showAvatarSide = () => {
  avatarAside.querySelector('div').style.display = 'flex';
  avatarAside.classList.add('shown');
  avartarSpaceReserver.classList.add('shown');
  setTimeout(() => {
    avatarAside.style.zIndex = 'auto';
  }, animationDuration);
};

const showAvatarError = (message) => {
  avatarAside.querySelector(
    '.error'
  ).innerHTML = `<i class="bi bi-exclamation-circle"></i>${message}`;
};
const handleFileAndvisuallyShowAvatar = (file, inputFile) => {
  if (file) {
    const sizeKB = file.size / 1024;
    if (sizeKB > MAX_FILE_SIZE) {
      showAvatarError(`File size exceeds the limit of ${MAX_FILE_SIZE}.`);
      return;
    }
    const reader = new FileReader();
    avatarAside.querySelector('.error').innerHTML = '';
    reader.readAsDataURL(file);
    reader.onloadend = function () {
      avatarAside.querySelector('img').src = reader.result;
    };
  }
};

export {
  swapAnimation,
  throttling,
  inputsEmptying,
  getSwapAnimationRule,
  initializeSignUpForm,
  showError,
  validatesSignInForm,
  validatesSignUpForm,
  lettersAnimation,
  userNameFormat,
  hideAvatarSide,
  showAvatarSide,
  handleFileAndvisuallyShowAvatar,
  verifyEmail,
  showAvatarError,
};

// home page style
// main page style
