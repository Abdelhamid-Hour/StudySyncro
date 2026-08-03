import { handlEyeIconsClick, initI18n } from "../../../main_assets/js/utils.js";
import "../../auth/auth.js";
import { eyeIcons } from "./dom-variables.js";

await initI18n(["shared", "reset_password"], { isStatic: true });

handlEyeIconsClick(eyeIcons);
const toggleBtn = document.getElementById("theme-toggle-btn");
const toggleIcon = document.getElementById("theme-toggle-icon");
const root = document.documentElement;

if (toggleBtn) {
  toggleBtn.addEventListener("click", () => {
    const isDark = root.getAttribute("data-theme") === "dark";
    applyTheme(!isDark, true);
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
