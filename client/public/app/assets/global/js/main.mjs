import "../../../auth/auth.mjs";
import { initNotificationsManager } from "./notifications.mjs";
import { initPushNotifications } from "./push-manager.mjs";
import {
  closeAndOpenLeftSideBar,
  handleIconsHoverEnter,
  handleIconsHoverLeave,
  handleNavigation,
  handleOffline,
  handleOnlineSync,
  handleOverlayClose,
  handlePopState,
  initEmailActionTriggers,
  initI18n,
  initMobileDrawer,
  initMobileSearch,
  initSidebarTitleSync,
  initThemeToggle,
  openOverlayHandler,
  preventDragOver,
  tooltipSetup,
  updateOfflineStatusIndicator,
} from "./utils.mjs";
import { closeLeftSideBarIcon } from "./variables.mjs";

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
document.addEventListener("click", handleNavigation);

initThemeToggle();
initMobileDrawer();

updateOfflineStatusIndicator(!navigator.onLine);

window.addEventListener("popstate", handlePopState);

initSidebarTitleSync();
initMobileSearch();

initEmailActionTriggers();

// Initialize Push Notifications
initPushNotifications();
