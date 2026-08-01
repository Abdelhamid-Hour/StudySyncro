import {
  closeAndOpenLeftSideBar,
  handleNavigation,
  handleOverlayClose,
  handleRoutingClick,
  openOverlayHandler,
  handleOnlineSync,
  tooltipSetup,
  initI18n,
  initEmailActionTriggers,
  preventDragOver,
  handleIconsHoverEnter,
  handleIconsHoverLeave,
  initTheme,
  initThemeToggle,
  initMobileDrawer,
  handlePopState,
  initSidebarTitleSync,
  initMobileSearch,
} from "./utils.js";
import { initPushNotifications } from "./push-manager.js";
import { closeLeftSideBarIcon } from "./variables.js";
import "../../../auth/auth.js";
import { initNotificationsManager } from "./notifications.js";

await initI18n(["common", "notifications"]);
tooltipSetup();
initNotificationsManager();

document.addEventListener("dragover", preventDragOver);

closeLeftSideBarIcon.addEventListener("click", closeAndOpenLeftSideBar);

window.addEventListener("online", handleOnlineSync);

document.addEventListener("mouseover", handleIconsHoverEnter);
document.addEventListener("mouseout", handleIconsHoverLeave);

document.addEventListener("click", openOverlayHandler);
document.addEventListener("click", handleOverlayClose);
document.addEventListener("click", handleRoutingClick, true);
document.addEventListener("click", handleNavigation);

initTheme();
initThemeToggle();
initMobileDrawer();

window.addEventListener("popstate", handlePopState);

initSidebarTitleSync();
initMobileSearch();

initEmailActionTriggers();

// Initialize Push Notifications
initPushNotifications();
