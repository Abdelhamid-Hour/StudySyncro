import { handlEyeIconsClick } from "../../../main_assets/js/utils.js";
import {
  hideAvatarSide,
  initializeSignUpForm,
  lettersAnimation,
  showAvatarSide,
  swapAnimationThrottling
} from "./utils.js";
import {
  eyeIcons,
  signUpLink,
  signInLink,
  signUpFormHeight,
  signInFormHeight,
  animationDuration,
  avatarContainer,
  avatarAside,
} from "./dom-variables.js";
import "../../auth/auth.js";
import { setUpFileInputListeners } from "../../../app/assets/shared/avatar/js/utils.js";

// prevets browser default validation rules
document.getElementById("sign-in-form").setAttribute("novalidate", true);
document.getElementById("sign-up-form").setAttribute("novalidate", true);

window.addEventListener("load", () => {
  initializeSignUpForm();
});

// Event listener for sign-up link click
signUpLink.addEventListener("click", function () {
  showAvatarSide();
  lettersAnimation(
    "Create",
    (word) => {
      document.querySelector("h1 > span").textContent = `${word}`;
    },
    animationDuration,
    20
  );
  swapAnimationThrottling(signUpFormHeight);
});

// Event listener for sign-in link click
signInLink.addEventListener("click", function () {
  hideAvatarSide();
  lettersAnimation(
    "Login to",
    (word) => {
      document.querySelector("h1 > span").textContent = `${word}`;
    },
    animationDuration,
    20
  );
  swapAnimationThrottling(signInFormHeight);
});

// Add EventListener for eye icons click
handlEyeIconsClick(eyeIcons);

setUpFileInputListeners(avatarContainer, avatarAside);
