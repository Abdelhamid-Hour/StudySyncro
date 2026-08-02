await initI18n(["shared", "login"], { isStatic: true });
import {
  handlEyeIconsClick,
  getLang,
  initI18n,
  t,
} from "../../../main_assets/js/utils.js";
import {
  hideAvatarSide,
  initializeSignUpForm,
  lettersAnimation,
  showAvatarSide,
  swapAnimationThrottling,
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
  updateSignFormHeights,
} from "./dom-variables.js";
import "./auth/auth.js";
import { setUpFileInputListeners } from "../../../app/assets/shared/avatar/js/utils.js";
import { showGoogleOneTap } from "./auth/auth-functions.js";

showGoogleOneTap();
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
import { fileinput, clearAvatarBtn } from "./dom-variables.js";

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

// theme toggle
const toggleBtn = document.getElementById("theme-toggle-btn");
const toggleIcon = document.getElementById("theme-toggle-icon");
const root = document.documentElement;

if (toggleBtn) {
  toggleBtn.addEventListener("click", () => {
    const isDark = root.getAttribute("data-theme") === "dark";

    const rect = toggleBtn.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    root.style.setProperty("--theme-toggle-x", `${x}px`);
    root.style.setProperty("--theme-toggle-y", `${y}px`);

    const doSwitch = () => applyTheme(!isDark, true);

    if (document.startViewTransition) {
      document.startViewTransition(doSwitch);
    } else {
      doSwitch();
    }
  });
}

function applyTheme(toDark, save) {
  const theme = toDark ? "dark" : "light";
  root.setAttribute("data-theme", theme);
  if (toggleIcon)
    toggleIcon.className = toDark
      ? "bi bi-sun theme-toggle-icon"
      : "bi bi-moon theme-toggle-icon";
  if (save) {
    try {
      localStorage.setItem("theme", theme);
      localStorage.setItem("mode", theme);
      localStorage.setItem("studyhype_theme", theme);
    } catch (e) {}
  }
}
