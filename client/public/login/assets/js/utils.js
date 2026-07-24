import { throttling, t } from "../../../main_assets/js/utils.js";
import {
  passwordRegex,
  userNameRegex,
  emailRegex,
  PASSWORD_MIN_LENGTH,
  PASSWORD_MAX_LENGTH,
  EMAIL_MIN_LENGTH,
  EMAIL_MAX_LENGTH,
  NAME_TITLE_MIN_LENGTH,
  NAME_TITLE_MAX_LENGTH,
} from "../../../main_assets/js/variables.js";
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
  animationDuration,
  avatarAside,
  fileinput,
  avatarSpaceReserver,
  updateSignFormHeights,
} from "./dom-variables.js";
let isSignUpFormInitialized = false;

/**
 * Generates the CSS rules for the swap animation.
 * @param {Number} targetFormHeight - The target height for the sign-up form.
 * @returns {Object} The initial rule and the class keyframe rule of the animation.
 */
const getSwapAnimationRule = (targetFormHeight) => {
  let delay, reverse;
  if (targetFormHeight === signInFormHeight) {
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
      ${reverse ? "reverse" : ""} forwards;
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
              ? ""
              : "animation-delay: calc(var(--login-swap-animation-duration)/2);"
          }
        }
        &.sign-in-swap-animation {
          height: ${targetFormHeight}px;
          }
        }`,
    initialRule: `
    .sign-in-container {
      height: ${signInFormHeight}px;
      z-index: 1;      
      transition: height calc(var(--login-swap-animation-duration)/2)
      ${delay ? "calc(var(--login-swap-animation-duration)/2)" : ""} linear;
        }`,
  };
};
/**
 * Initializes the sign-up form by creating and inserting animation rules.
 */
const initializeSignUpForm = () => {
  if (isSignUpFormInitialized) return;
  updateSignFormHeights();
  const signUpAnimationRules = getSwapAnimationRule(signUpFormHeight);
  stylsheet.insertRule(
    signUpAnimationRules.initialRule,
    stylsheet.cssRules.length,
  );
  stylsheet.insertRule(
    signUpAnimationRules.signUpClassAnimationRule,
    stylsheet.cssRules.length,
  );
  isSignUpFormInitialized = true;
};
const inputsEmptying = () => {
  signInFormContainer.style.height = "";
  signInemailField.value = "";
  signInPasswordField.value = "";
  signUpemailField.value = "";
  signUpPasswordField.value = "";
  signUpConfirmPasswordField.value = "";
  firstNameField.value = "";
  lastNameField.value = "";
};

/**
 * Executes the swap animation
 * @param {Number} targetFormHeight - The target height for the sign-up form.
 */
const swapAnimation = (targetFormHeight) => {
  if (!isSignUpFormInitialized) {
    initializeSignUpForm();
  }
  inputsEmptying();
  // add the z-index based on the signUp form height
  if (targetFormHeight === signInFormHeight) {
    hideErrors(
      signUpPasswordField,
      signUpConfirmPasswordField,
      firstNameField,
      lastNameField,
      signUpemailField,
    );
    signInFormContainer.classList.add("active-form");
    signInFormContainer.onanimationstart = () => {
      signUpFormContainer.style.zIndex = "1";
      signInFormContainer.onanimationstart = null;
    };
    signUpFormContainer.onanimationend = null;
    signInFormContainer.onanimationend = () => {
      signUpFormContainer.classList.remove("active-form");
    };
  } else {
    signUpFormContainer.classList.add("active-form");
    hideErrors(signInPasswordField, signInemailField);
    signUpFormContainer.onanimationstart = () => {
      signUpFormContainer.style.zIndex = "2";
      signUpFormContainer.onanimationstart = null;
    };
    signInFormContainer.onanimationend = null;
    signUpFormContainer.onanimationend = () => {
      signInFormContainer.classList.remove("active-form");
    };
  }
  // discharging inputs
  const signUpAnimationRules = getSwapAnimationRule(targetFormHeight);
  // delete the initial sign Up form height before removing the class animation
  // because it prevents the sign Up form to back to the initial animation height
  stylsheet.deleteRule(stylsheet.cssRules.length - 2);
  // add the new Initial sign Up form height
  stylsheet.insertRule(
    signUpAnimationRules.initialRule,
    stylsheet.cssRules.length - 1,
  );
  signUpFormContainer.classList.remove("sign-up-swap-animation");
  signInFormContainer.classList.remove("sign-in-swap-animation");
  // delete the sign Up form animation rule
  stylsheet.deleteRule(stylsheet.cssRules.length - 1);
  // add the new sign Up form animation rule to the stylesheet as a last style
  stylsheet.insertRule(
    signUpAnimationRules.signUpClassAnimationRule,
    stylsheet.cssRules.length,
  );
  // force re-layout and repaint to apply the new animation
  void signInFormContainer.offsetWidth;
  void signUpFormContainer.offsetWidth;
  signUpFormContainer.classList.add("sign-up-swap-animation");
  signInFormContainer.classList.add("sign-in-swap-animation");
};

export const swapAnimationThrottling = throttling(
  animationDuration,
  swapAnimation,
);
const hideErrors = (...elements) => {
  elements.forEach((element) => {
    const container = element.parentElement.parentElement;
    container.classList.remove("error-input");
    container.classList.remove("error-animation");
    void container.offsetWidth;
    if ([firstNameField, lastNameField].includes(element)) {
      signUpFormContainer.querySelector(
        ".user-name-container .error-container",
      ).firstElementChild.innerHTML = "";
    } else {
      container.nextElementSibling.firstElementChild.innerHTML = "";
    }
  });
};
const showError = (errorMessage, element) => {
  const container = element.parentElement.parentElement;
  const errorIcon = '<i class="bi bi-exclamation-circle"></i>';
  if ([firstNameField, lastNameField].includes(element)) {
    signUpFormContainer.querySelector(
      ".user-name-container .error-container",
    ).firstElementChild.innerHTML = `${errorIcon} ${errorMessage}`;
  } else {
    container.nextElementSibling.firstElementChild.innerHTML = `${errorIcon} ${errorMessage}`;
  }
  container.classList.add("error-input");
  container.classList.add("error-animation");
  element.focus();
};

const validatesSignInForm = () => {
  hideErrors(signInemailField, signInPasswordField);
  const email = signInemailField.value.trim();
  const password = signInPasswordField.value.trim();
  if (
    !emailRegex.test(email) ||
    email.length < EMAIL_MIN_LENGTH ||
    email.length > EMAIL_MAX_LENGTH
  ) {
    showError(
      t("login:errors.invalid_email", {
        min: EMAIL_MIN_LENGTH,
        max: EMAIL_MAX_LENGTH,
      }),
      signInemailField,
    );
    return false;
  }

  if (!password) {
    showError(t("login:errors.enter_password"), signInPasswordField);
    return false;
  }
  return true;
};

const verifyEmail = () => {
  hideErrors(signInemailField);
  const email = signInemailField.value.trim();
  if (
    !emailRegex.test(email) ||
    email.length < EMAIL_MIN_LENGTH ||
    email.length > EMAIL_MAX_LENGTH
  ) {
    showError(
      t("login:errors.invalid_email", {
        min: EMAIL_MIN_LENGTH,
        max: EMAIL_MAX_LENGTH,
      }),
      signInemailField,
    );
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
    lastNameField,
  );
  const email = signUpemailField.value.trim();
  const password = signUpPasswordField.value.trim();
  const confirmPassword = signUpConfirmPasswordField.value.trim();
  const firstName = firstNameField.value.trim();
  const lastName = lastNameField.value.trim();

  if (
    !userNameRegex.test(firstName) ||
    firstName.length < NAME_TITLE_MIN_LENGTH ||
    firstName.length > NAME_TITLE_MAX_LENGTH
  ) {
    showError(
      t("login:errors.first_name_format", {
        min: NAME_TITLE_MIN_LENGTH,
        max: NAME_TITLE_MAX_LENGTH,
      }),
      firstNameField,
    );
    return false;
  }

  if (
    !userNameRegex.test(lastName) ||
    lastName.length < NAME_TITLE_MIN_LENGTH ||
    lastName.length > NAME_TITLE_MAX_LENGTH
  ) {
    showError(
      t("login:errors.last_name_format", {
        min: NAME_TITLE_MIN_LENGTH,
        max: NAME_TITLE_MAX_LENGTH,
      }),
      lastNameField,
    );
    return false;
  }

  if (
    !emailRegex.test(email) ||
    email.length < EMAIL_MIN_LENGTH ||
    email.length > EMAIL_MAX_LENGTH
  ) {
    showError(
      t("login:errors.invalid_email", {
        min: EMAIL_MIN_LENGTH,
        max: EMAIL_MAX_LENGTH,
      }),
      signUpemailField,
    );
    return false;
  }

  if (!passwordRegex.test(password)) {
    showError(
      t("common:shared_terms.the_password_must_be_between_min_and_max_characters", {
        min: PASSWORD_MIN_LENGTH,
        max: PASSWORD_MAX_LENGTH,
      }),
      signUpPasswordField,
    );
    return false;
  }

  if (password !== confirmPassword) {
    showError(
      t("common:shared_terms.passwords_do_not_match"),
      signUpConfirmPasswordField,
    );
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
export const getLettersAnimation = () => {
  let animating = false;
  let originalWord = "";
  let wordTarget = "";
  let letterDuration = 0;
  let characters = [];
  const splitString = (string) =>
    [...new Intl.Segmenter().segment(string)].map((x) => x.segment);

  return function lettersAnimation(
    word,
    actionCallBack,
    animationDuration,
    letterAnimationDuration,
    charactersString,
  ) {
    if (word === wordTarget) {
      wordTarget = "";
      animating = false;
      return;
    }
    if (!animating) {
      letterDuration = animationDuration / word.length;
      originalWord = word;
      characters = charactersString
        ? splitString(charactersString)
        : "abcdefghijklmnopqrstuvwxyz".split("");
      animating = true;
      const intervalLitterAnimation = setInterval(() => {
        wordTarget += originalWord[0] || "";
        originalWord = originalWord.substring(1);
        if (originalWord === "") {
          clearInterval(intervalLitterAnimation);
        }
      }, letterDuration);
    }

    let wordArray = originalWord.split("");
    for (let index = 0; index < originalWord.length; index++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      wordArray[index] = characters[randomIndex];
    }
    const printedWord = wordTarget + wordArray.join("");
    actionCallBack(printedWord);
    setTimeout(() => {
      requestAnimationFrame(() => {
        arguments[0] = printedWord;
        lettersAnimation(...arguments);
      });
    }, letterAnimationDuration);
  };
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
const lettersAnimation = throttling(animationDuration, getLettersAnimation());

const userNameFormat = (name) => {
  name = name.toLowerCase();
  return name.charAt(0).toUpperCase() + name.slice(1);
};

const hideAvatarSide = () => {
  avatarAside.style.zIndex = "-1";
  avatarAside.classList.remove("shown");
  fileinput.value = "";
  fileinput.disabled = true;
  avatarSpaceReserver.classList.remove("shown");
  avatarAside.querySelector("img").src = "./assets/images/user.png";
  setTimeout(() => {
    avatarAside.querySelector("div").style.display = "none";
  }, animationDuration);
};

const showAvatarSide = () => {
  avatarAside.querySelector("div").style.display = "flex";
  avatarAside.classList.add("shown");
  fileinput.disabled = false;
  avatarSpaceReserver.classList.add("shown");
  setTimeout(() => {
    avatarAside.style.zIndex = "auto";
  }, animationDuration);
};

export {
  swapAnimation,
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
  verifyEmail,
};

// home page style
// main page style
