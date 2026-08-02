import {
  closeAndOpenLeftSideBar,
  handleIconsHoverEnter,
  handleIconsHoverLeave,
  handleNavigation,
  handleOnlineSync,
  handleOffline,
  handleOverlayClose,
  handlePopState,
  handleRoutingClick,
  initMobileDrawer,
  initMobileSearch,
  initSidebarTitleSync,
  initTheme,
  initThemeToggle,
  openOverlayHandler,
  preventDragOver,
  tooltipSetup,
  initI18n,
  initEmailActionTriggers,
} from "./utils.js";
import { initPushNotifications } from "./push-manager.js";
import { closeLeftSideBarIcon } from "./variables.js";
import "../../../auth/auth.js";
import { initNotificationsManager } from "./notifications.js";

await initI18n(["common", "notifications", "shared"]);
tooltipSetup();
initNotificationsManager();

document.addEventListener("dragover", preventDragOver);

closeLeftSideBarIcon.addEventListener("click", closeAndOpenLeftSideBar);

window.addEventListener("online", handleOnlineSync);
window.addEventListener("offline", handleOffline);

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
