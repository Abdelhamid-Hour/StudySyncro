import {
  closeAndOpenLeftSideBar,
  handelIconsHover,
  handleNavigation,
  handleOverlayClose,
  handleRoutingClick,
  openOverlayHandler,
  toggleActiveLink,
  handleOnlineSync,
  tooltipSetup,
  updateMain,
} from "./utils.js";
import { closeLeftSideBarIcon, toggleModeBtn } from "./variables.js";
import "../../../auth/auth.js";

tooltipSetup();

document.addEventListener("dragover", (e) => e.preventDefault());

closeLeftSideBarIcon.addEventListener("click", closeAndOpenLeftSideBar);

window.addEventListener("online", handleOnlineSync);

document.addEventListener("mouseover", (e) => handelIconsHover(e, true));

document.addEventListener("mouseout", (e) => handelIconsHover(e, false));

document.addEventListener("click", openOverlayHandler);

document.addEventListener("click", handleOverlayClose);

document.addEventListener("click", handleRoutingClick, true);

document.addEventListener("click", handleNavigation);

// Load saved theme from localStorage
const savedAppTheme = localStorage.getItem("theme") || localStorage.getItem("mode") || localStorage.getItem("studyhype_theme");
if (savedAppTheme === "dark") {
  const root = document.documentElement;
  root.style.setProperty("--background-color", "#1a1a1a");
  root.style.setProperty("--container-background-color", "#242424");
  root.style.setProperty("--container-border-color", "#818181");
  root.style.setProperty("--primary-text-color", "#dbdbdb");
  root.style.setProperty("--btn-background-color", "#2c2c2c");
  root.style.setProperty("--secondary-text-color", "#c8c8c8");
  root.style.setProperty("--primary-shadow-color", "transparent");
  root.style.setProperty("--active-tab-bg", "var(--btn-background-color)");
  root.style.setProperty("--tab-hover-bg", "var(--btn-background-color)");
}

toggleModeBtn.addEventListener("click", () => {
  const root = document.documentElement;
  const isDark =
    root.style.getPropertyValue("--background-color") === "#1a1a1a";

  if (isDark) {
    // Switch to light mode
    root.style.setProperty("--background-color", "#ebebeb");
    root.style.setProperty("--container-background-color", "#fafafa");
    root.style.setProperty("--container-border-color", "#cbced5");
    root.style.setProperty("--primary-text-color", "black");
    root.style.setProperty("--btn-background-color", "#fdfdfd");
    root.style.setProperty("--secondary-text-color", "#575757");
    root.style.setProperty(
      "--primary-shadow-color",
      "rgba(195, 195, 195, 0.58)"
    );
    root.style.setProperty("--active-tab-bg", "var(--btn-background-color)");
    root.style.setProperty("--tab-hover-bg", "var(--background-color)");
    localStorage.setItem("theme", "light");
    localStorage.setItem("mode", "light");
    localStorage.setItem("studyhype_theme", "light");
  } else {
    // Switch to dark mode
    root.style.setProperty("--background-color", "#1a1a1a");
    root.style.setProperty("--container-background-color", "#242424");
    root.style.setProperty("--container-border-color", "#818181");
    root.style.setProperty("--primary-text-color", "#dbdbdb");
    root.style.setProperty("--btn-background-color", "#2c2c2c");
    root.style.setProperty("--secondary-text-color", "#c8c8c8");
    root.style.setProperty("--primary-shadow-color", "transparent");
    root.style.setProperty("--active-tab-bg", "var(--btn-background-color)");
    root.style.setProperty("--tab-hover-bg", "var(--btn-background-color)");
    localStorage.setItem("theme", "dark");
    localStorage.setItem("mode", "dark");
    localStorage.setItem("studyhype_theme", "dark");
  }
});

window.addEventListener("popstate", () => {
  toggleActiveLink(location.pathname);
  updateMain(location.pathname);
});
