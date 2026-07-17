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
import { initNotificationsManager } from "./notifications.js";

tooltipSetup();

initNotificationsManager();

document.addEventListener("dragover", (e) => e.preventDefault());

closeLeftSideBarIcon.addEventListener("click", closeAndOpenLeftSideBar);

window.addEventListener("online", handleOnlineSync);

document.addEventListener("mouseover", (e) => handelIconsHover(e, true));

document.addEventListener("mouseout", (e) => handelIconsHover(e, false));

document.addEventListener("click", openOverlayHandler);

document.addEventListener("click", handleOverlayClose);

document.addEventListener("click", handleRoutingClick, true);

document.addEventListener("click", handleNavigation);

const updateThemeToggleIcons = (theme) => {
  const icons = document.querySelectorAll(".theme-toggle-icon");
  icons.forEach((icon) => {
    if (theme === "dark") {
      icon.classList.remove("bi-moon", "bi-moon-fill");
      icon.classList.add("bi-sun");
    } else {
      icon.classList.remove("bi-sun", "bi-sun-fill");
      icon.classList.add("bi-moon");
    }
  });
};

// Sync theme with HTML data-theme attribute
const savedAppTheme = localStorage.getItem("theme") || "light";
document.documentElement.setAttribute("data-theme", savedAppTheme);
updateThemeToggleIcons(savedAppTheme);

const themeBtns = document.querySelectorAll(
  ".toggle-container, #mobile-theme-toggle-btn",
);
themeBtns.forEach((btn) => {
  btn?.addEventListener("click", () => {
    const currentTheme =
      document.documentElement.getAttribute("data-theme") || "dark";
    const newTheme = currentTheme === "dark" ? "light" : "dark";

    const rect = btn.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    document.documentElement.style.setProperty("--theme-toggle-x", `${x}px`);
    document.documentElement.style.setProperty("--theme-toggle-y", `${y}px`);

    const applyTheme = () => {
      document.documentElement.setAttribute("data-theme", newTheme);
      updateThemeToggleIcons(newTheme);
      try {
        localStorage.setItem("theme", newTheme);
        localStorage.setItem("mode", newTheme);
        localStorage.setItem("studyhype_theme", newTheme);
      } catch (e) {}
    };

    if (document.startViewTransition) {
      document.startViewTransition(applyTheme);
    } else {
      applyTheme();
    }
  });
});

// Mobile Shell Drawer Handlers
const mobileMasterMenuBtn = document.querySelector(".mobile-master-menu-btn");
const mobileMasterDrawer = document.querySelector(".mobile-master-drawer");
const mobileDrawerCloseBtn = document.querySelector(".mobile-drawer-close-btn");
const mobileDrawerBackdrop = document.querySelector(".mobile-drawer-backdrop");
const mobileLogoutBtn = document.getElementById("mobile-logout-button");
const mobileNotifBtn = document.querySelector(".mobile-notif-btn");

const openMobileDrawer = () => {
  mobileMasterDrawer?.classList.add("open");
  mobileDrawerBackdrop?.classList.add("open");
};

const closeMobileDrawer = () => {
  mobileMasterDrawer?.classList.remove("open");
  mobileDrawerBackdrop?.classList.remove("open");
};

mobileMasterMenuBtn?.addEventListener("click", openMobileDrawer);

mobileDrawerCloseBtn?.addEventListener("click", closeMobileDrawer);

mobileDrawerBackdrop?.addEventListener("click", closeMobileDrawer);

mobileLogoutBtn?.addEventListener("click", () => {
  document.getElementById("logout-button")?.click();
});

mobileNotifBtn?.addEventListener("click", closeMobileDrawer);

window.addEventListener("popstate", () => {
  toggleActiveLink(location.pathname);
  updateMain(location.pathname);
});

// Auto-sync any direct changes to .sidebar-title with .mobile-page-title and mobile return btn
const sidebarTitleEl = document.querySelector(".sidebar-title");
const mobilePageTitleEl = document.querySelector(".mobile-page-title");
const mobileBackBtn = document.querySelector(".mobile-back-btn");

if (sidebarTitleEl && mobilePageTitleEl) {
  const syncTitle = () => {
    const linkEl = sidebarTitleEl.querySelector("a");
    if (linkEl && mobileBackBtn) {
      const returnHref = linkEl.getAttribute("href") || "/app/home";
      mobileBackBtn.setAttribute("href", returnHref);
      mobileBackBtn.classList.remove("hidden");
      const titleText = linkEl.textContent.trim();
      if (titleText.toLowerCase().includes("group chat")) {
        mobilePageTitleEl.innerHTML = `
          <button
            type="button"
            class="exclude-btn show-info-btn"
          >
            <i class="bi bi-info-circle"></i>
            Group Chat
          </button>
        `;
      } else {
        mobilePageTitleEl.textContent = titleText;
      }
    } else {
      if (mobileBackBtn) mobileBackBtn.classList.add("hidden");
      mobilePageTitleEl.innerHTML = sidebarTitleEl.innerHTML;
    }
  };
  const observer = new MutationObserver(syncTitle);
  observer.observe(sidebarTitleEl, {
    childList: true,
    subtree: true,
    characterData: true,
  });
}

// Handle mobile topbar search button click to toggle horizontal search bar
const mobileSearchBtn = document.querySelector(".mobile-search-btn");
const mobileSearchBox = document.getElementById("mobile-search-box");
mobileSearchBtn?.addEventListener("click", (e) => {
  e.stopPropagation();
  const isHomeInactive = document.querySelector("main .active-sessions");
  const topSideBarMiddle = document.querySelector(".top-side-bar-middele");

  let searchContentEl = null;
  if (isHomeInactive) {
    searchContentEl =
      mobileSearchBox?.querySelector(".active-sessions-search.search") ||
      document.querySelector(".active-sessions-search.search");
  } else if (
    topSideBarMiddle &&
    topSideBarMiddle.querySelector(".search-container")
  ) {
    searchContentEl = topSideBarMiddle;
  }

  if (mobileSearchBox && searchContentEl) {
    if (!mobileSearchBox.contains(searchContentEl)) {
      mobileSearchBox.appendChild(searchContentEl);
    }
    mobileSearchBox.classList.toggle("hidden");
    if (!mobileSearchBox.classList.contains("hidden")) {
      const searchInput = mobileSearchBox.querySelector("input[type='search']");
      searchInput?.focus();
    }
  }
});

document.addEventListener("click", (e) => {
  console.log(e.target.tagName);

  if (
    mobileSearchBox &&
    !mobileSearchBox.classList.contains("hidden") &&
    !mobileSearchBox.contains(e.target) &&
    !mobileSearchBtn?.contains(e.target) &&
    e.target.tagName !== 'HTML'
  ) {
    mobileSearchBox.classList.add("hidden");
  }
});
