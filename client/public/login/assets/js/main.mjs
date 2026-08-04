import { setUpFileInputListeners } from "../../../app/assets/shared/avatar/js/utils.mjs";
import {
  getLang,
  handlEyeIconsClick,
  initI18n,
  initThemeToggleBtn,
  t,
} from "../../../main_assets/js/utils.mjs";
await initI18n(["shared", "login"]);
import {
  initVerifyMsgBlock,
  showGoogleOneTap,
} from "./auth/auth-functions.mjs";
import "./auth/auth.mjs";
import {
  animationDuration,
  avatarAside,
  avatarContainer,
  eyeIcons,
  signInFormHeight,
  signInLink,
  signUpFormHeight,
  signUpLink,
  toggleBtn,
  updateSignFormHeights,
} from "./dom-variables.mjs";
import {
  hideAvatarSide,
  initializeSignUpForm,
  lettersAnimation,
  showAvatarSide,
  swapAnimationThrottling,
} from "./utils.mjs";

showGoogleOneTap();
initVerifyMsgBlock();

// prevets browser default validation rules
document.getElementById("sign-in-form").setAttribute("novalidate", true);
document.getElementById("sign-up-form").setAttribute("novalidate", true);

if (document.readyState === "complete") {
  initializeSignUpForm();
} else {
  window.addEventListener("load", () => {
    initializeSignUpForm();
  });
}

// Event listener for sign-up link click
signUpLink.addEventListener("click", function () {
  showAvatarSide();
  lettersAnimation(
    t("shared:header.create", { defaultValue: "Create" }),
    (word) => {
      document.querySelector("h1 > span").textContent = `${word}`;
    },
    animationDuration,
    20,
    getLang() === "ar" ? "أبثجحخدرزسشصضطظعغفقكلمنهوي" : "", // '' -> for the english fallback in the function
  );
  swapAnimationThrottling(signUpFormHeight);
});

// Event listener for sign-in link click
signInLink.addEventListener("click", function () {
  hideAvatarSide();
  lettersAnimation(
    t("shared:header.login_to", { defaultValue: "Login to" }),
    (word) => {
      document.querySelector("h1 > span").textContent = `${word}`;
    },
    animationDuration,
    20,
    getLang() === "ar" ? "أبثجحخدرزسشصضطظعغفقكلمنهوي" : "", // '' -> for the english fallback in the function
  );
  swapAnimationThrottling(signInFormHeight);
});

window.addEventListener("resize", () => {
  setTimeout(() => {
    updateSignFormHeights();
  }, 300);
});
// Add EventListener for eye icons click
handlEyeIconsClick(eyeIcons);

setUpFileInputListeners(avatarContainer, avatarAside);

// Clear avatar button logic
import { clearAvatarBtn, fileinput } from "./dom-variables.mjs";

// Let's hook up the clear button click event:
clearAvatarBtn.addEventListener("click", () => {
  // Clear the file input
  fileinput.value = "";

  // Reset the image to default
  const img = avatarContainer.querySelector("img");
  img.src = "/login/assets/images/user.webp";

  // Hide the button
  clearAvatarBtn.style.display = "none";

  // Clear any errors
  avatarContainer.querySelector(".error").innerHTML = "";
});

initThemeToggleBtn(toggleBtn);
