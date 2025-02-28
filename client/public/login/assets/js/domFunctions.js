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
  passwordRegex,
  emailRegex,
  userNameRegex,
  animationDuration
} from './NodesAndVariables.js';

let cssRulesLength = stylsheet.cssRules.length;

/**
 * Adds two numbers together.
 * @param {string} message - The message to show in the DOM.
 */
const showExternalError = (message) => {
  const errorContainer = document.createElement('div');
  errorContainer.className = 'external-error';
  errorContainer.innerHTML = `
    <p>
      <i class="bi bi-exclamation-circle-fill"></i>
      ${message}
    </p>
    <i onclick="removeErrorBlock(this)" class="bi bi-x"></i>
    <div>
      <hr>
    </div>
  `;
  document.body.appendChild(errorContainer);
  setTimeout(() => {
    errorContainer.remove();
  }, 11200);
};
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
  // add the z-index based on the signUp form height
  if (targetSignUpFormHeight === signInFormHeight) {
    signInFormContainer.classList.add('active');
    signInFormContainer.onanimationstart = () => {
      signUpFormContainer.style.zIndex = '1';
      signInFormContainer.onanimationstart = null;
    };
  } else {
    signUpFormContainer.onanimationstart = () => {
      signUpFormContainer.style.zIndex = '2';
      signUpFormContainer.onanimationstart = null;
    };
  }
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

export const swapAnimationThrottling = throttling(animationDuration, swapAnimation);
const showError = (errorMessage, element) => {
  const container = element.parentElement.parentElement;
  container.nextElementSibling.innerText = errorMessage;
  element.parentElement.parentElement.classList.add('error');
  element.focus();
};
const hideError = (element) => {
  const container = element.parentElement.parentElement;
  container.classList.remove('error');
  container.nextElementSibling.innerText = '';
};
const validatesSignInForm = () => {
  const email = signInemailField.value.trim();
  const password = signInPasswordField.value.trim();
  if (!passwordRegex.test(password)) {
    showError(
      'The password must be at least 8 characters',
      signInPasswordField
    );
  } else {
    hideError(signInPasswordField);
  }
  if (!emailRegex.test(email)) {
    showError('Please enter a valid email', signInemailField);
  } else {
    hideError(signInemailField);
  }
  if (!emailRegex.test(email) || !passwordRegex.test(password)) {
    return false;
  }
  return true;
};
const validatesSignUpForm = () => {
  const email = signUpemailField.value.trim();
  const password = signUpPasswordField.value.trim();
  const confirmPassword = signUpConfirmPasswordField.value.trim();
  const firstName = firstNameField.value.trim();
  const lastName = lastNameField.value.trim();
  if (password !== confirmPassword) {
    showError('Passwords do not match', signUpConfirmPasswordField);
  } else {
    hideError(signUpConfirmPasswordField);
  }

  if (!passwordRegex.test(password)) {
    showError(
      'The password must be at least 8 characters',
      signUpPasswordField
    );
  } else {
    hideError(signUpPasswordField);
  }

  if (!emailRegex.test(email)) {
    showError('Please enter a valid email', signUpemailField);
  } else {
    hideError(signUpemailField);
  }

  if (!userNameRegex.test(lastName)) {
    showError('Last name must be 3-15 characters only letters', lastNameField);
  } else {
    hideError(lastNameField);
  }

  if (!userNameRegex.test(firstName)) {
    showError(
      'First name must be 3-15 characters only letters',
      firstNameField
    );
  } else {
    hideError(firstNameField);
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
const removeErrorBlock = (element) => {
  element.parentElement.remove();
};

export {
  swapAnimation,
  throttling,
  inputsEmptying,
  removeErrorBlock,
  getSwapAnimationRule,
  hideError,
  initializeSignUpForm,
  showError,
  validatesSignInForm,
  validatesSignUpForm,
  showExternalError,
};
