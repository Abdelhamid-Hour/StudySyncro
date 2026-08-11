import {
  fetchTemplate,
  initThemeToggleBtn,
  resetRouteController,
  sendData,
  showMessageBlock,
  t,
} from "../../../../main_assets/js/utils.mjs";
import { initAndDiplayErrorTooltip } from "../../shared/chat/js/utils.mjs";
import { syncMissedNotifications } from "./notifications.mjs";
import {
  globalTooltip,
  hoverTooltip,
  mainContainer,
  offlineStatusBtn,
  PENDING_ONLINE_SYNC_OPS,
  timers,
  topSideBarFooter,
  topSideBarHeader,
  topSideBarMiddle,
} from "./variables.mjs";
export * from "../../../../main_assets/js/i18n.mjs";
export * from "../../../../main_assets/js/utils.mjs";

export const getClippingRect = (element) => {
  let parent = element.parentElement;
  while (parent && parent.tagName !== "BODY" && parent.tagName !== "HTML") {
    const style = window.getComputedStyle(parent);
    if (
      style.overflow === "auto" ||
      style.overflow === "scroll" ||
      style.overflow === "hidden" ||
      style.overflowY === "auto" ||
      style.overflowY === "scroll" ||
      style.overflowY === "hidden" ||
      style.overflowX === "auto" ||
      style.overflowX === "scroll" ||
      style.overflowX === "hidden"
    ) {
      return parent.getBoundingClientRect();
    }
    parent = parent.parentElement;
  }
  return {
    top: 0,
    left: 0,
    bottom: window.innerHeight,
    right: window.innerWidth,
    width: window.innerWidth,
    height: window.innerHeight,
  };
};
export let _loadersCount = 4;
export const updateLoaderCountVar = (val) => {
  _loadersCount = val;
};

window.__activeEventSources = window.__activeEventSources || [];
const OriginalEventSource = window.EventSource;
if (OriginalEventSource && !window.__esWrapped) {
  window.__esWrapped = true;
  window.EventSource = class extends OriginalEventSource {
    constructor(url, options) {
      super(url, options);
      if (url.includes("/notifications/stream")) return;
      window.__activeEventSources.push(this);
    }
  };
}

export const closeAllEventSources = () => {
  if (window.__activeEventSources) {
    window.__activeEventSources.forEach((es) => {
      try {
        es.close();
      } catch (e) {}
    });
    window.__activeEventSources = [];
  }
};

export const registerPageListener = (target, event, handler, options) => {
  if (!window.__activePageListeners) window.__activePageListeners = [];
  target?.addEventListener(event, handler, options);
  window.__activePageListeners.push({ target, event, handler, options });
};

export const clearAllPageListeners = () => {
  if (window.__activePageListeners) {
    window.__activePageListeners.forEach(
      ({ target, event, handler, options }) => {
        try {
          target?.removeEventListener(event, handler, options);
        } catch (e) {}
      },
    );
    window.__activePageListeners = [];
  }
};

// IndexedDB setup for storing chat files
export let db = null;
let dbReady = false;
const pendingOps = [];
const request = indexedDB.open("chatDB", 2);

request.onupgradeneeded = (event) => {
  db = event.target.result;
  if (!db.objectStoreNames.contains("messages")) {
    const store = db.createObjectStore("messages", { keyPath: "id" });
    store.createIndex("timestamp", "timestamp", { unique: false });
  }
};

request.onsuccess = (event) => {
  db = event.target.result;
  dbReady = true;

  // Execute any pending operations
  pendingOps.forEach((f) => f());
  pendingOps.length = 0;
};

request.onerror = (event) => {
  console.error("IndexedDB error:", event.target.error);
};

export const updateOfflineStatusIndicator = (isOffline) => {
  if (!offlineStatusBtn) return;
  offlineStatusBtn.classList.toggle("online", !isOffline);
};

export const handleOnlineSync = () => {
  updateOfflineStatusIndicator(false);
  showMessageBlock(
    t("common:alerts.back_online", { defaultValue: "Connection restored!" }),
    "success",
  );
  PENDING_ONLINE_SYNC_OPS.forEach((f) => f());
  PENDING_ONLINE_SYNC_OPS.length = 0;

  // Sync missed notifications by completely resetting the loader
  syncMissedNotifications();

  // Virtual nav for Active Sessions & Chat to fetch missed data
  const path = window.location.pathname;
  if (path.includes("/home") || path.includes("/chat")) {
    window.dispatchEvent(new PopStateEvent("popstate", { state: {} }));
  }
};

export const handleOffline = () => {
  updateOfflineStatusIndicator(true);
  showMessageBlock(
    t("common:alerts.offline", { defaultValue: "You are offline!" }),
    "error",
  );
};

export const runWhenDbReady = (fn) => {
  if (dbReady) fn();
  else pendingOps.push(fn);
};

export const getUUID = () =>
  Date.now() + crypto.getRandomValues(new Uint32Array(1))[0];

export function getDebounceFunc(callback, TimeInterval) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      callback.apply(this, args);
    }, TimeInterval);
  };
}

export const isAsync = (fn) => {
  return Object.getPrototypeOf(fn).constructor.name === "AsyncFunction";
};

const toOrginalBtn = (btn, toOldBtn, originalHtml) => {
  btn.isCreating = false;
  btn.disabled = false;
  btn.style.width = "";
  btn.style.height = "";
  if (toOldBtn) btn.innerHTML = originalHtml;
};

export const handleApiAction = async (
  route,
  data,
  btn,
  {
    successMsg,
    onSuccess = () => {},
    method = "POST",
    toOldBtn = true,
    getExtraData = null,
  } = {},
) => {
  let btnRect = null;
  let originalHtml = null;
  if (btn) {
    btnRect = btn.getBoundingClientRect();
    if (btn.isCreating) return;
    originalHtml = btn.innerHTML;
  }
  try {
    if (btn) {
      btn.isCreating = true;
      btn.disabled = true;
      btn.style.width = btnRect.width + "px";
      btn.style.height = btnRect.height + "px";
      btn.innerHTML = getLoader();
    }
    let extraData = {};
    if (getExtraData) {
      extraData = isAsync(getExtraData) ? await getExtraData() : getExtraData();

      if (!extraData) return toOrginalBtn(btn, toOldBtn, originalHtml);
    }

    const body = data instanceof FormData ? data : { ...data, ...extraData };
    const response = await sendData(`/api${route}`, body, method || "POST");
    if (successMsg) showMessageBlock(successMsg, "success");
    if (typeof onSuccess === "function") onSuccess(response);
  } catch (error) {
    const isNative = error.isNative || error.data?.isNative;
    const notifType =
      error.type || error.data?.type || (isNative ? "info" : "error");

    if (!isNative) {
      console.error("Error:", error);
    }
    showMessageBlock(
      error.message || error.data?.message || t("shared:alerts.error_occurred"),
      notifType,
    );
  } finally {
    if (btn) toOrginalBtn(btn, toOldBtn, originalHtml);
  }
};

export const handelIconsHover = (e, addFill) => {
  const target = e.target.closest(".should-fill:not(.active)");
  if (target) {
    target.querySelectorAll("i:not(.exclude-icon)").forEach((icon) => {
      animateFillIcon(icon, addFill);
    });
  }
};

export const dashedToCamelCase = (value) => {
  return value.replace(/-([a-z])/g, (_, l) => l.toUpperCase());
};

export const millisecondsToHMFormat = (ms) => {
  if (typeof ms !== "number" || ms < 0) return `0${t("common:time.m")}`;
  const hours = Math.floor(ms / 3_600_000);
  const minutes = Math.floor((ms % 3_600_000) / 60_000);

  if (hours && minutes)
    return `${hours}${t("common:time.h")} ${minutes.toString().padStart(2, "0")}${t("common:time.m")}`;
  if (hours) return `${hours}${t("common:time.h")}`;
  if (minutes) return `${minutes}${t("common:time.m")}`;
  return `0${t("common:time.m")}`;
};

export const getLoadersCount = () => {
  const list = document.querySelector(".quizzes-list, .groups-list");
  if (!list) return _loadersCount;

  const computedStyles = window.getComputedStyle(list);
  const gridTemplateColumnsValue = computedStyles.getPropertyValue(
    "grid-template-columns",
  );
  const loadersCount = gridTemplateColumnsValue.includes("repeat")
    ? parseInt(gridTemplateColumnsValue.match(/\d+/)[0])
    : gridTemplateColumnsValue.split(" ").length;
  updateLoaderCountVar(loadersCount);

  return loadersCount;
};

export const updateSkletonCount = () => {
  const skeletonCards = document.querySelectorAll(
    ".quizzes-list .loading-card, .groups-list .loading-card",
  );

  if (!skeletonCards.length) return;
  const skeletonCount = getLoadersCount();

  if (skeletonCards.length == skeletonCount) return;

  if (skeletonCards.length > skeletonCount) {
    skeletonCards[0]?.remove();
    return;
  }

  skeletonCards[skeletonCards.length - 1].after(
    skeletonCards[0].cloneNode(true),
  );
};

export const closeAndOpenLeftSideBar = () => {
  const shouldHideElements = document.querySelectorAll(".should-hide");

  shouldHideElements.forEach((element) => {
    element.classList.toggle("hidden");
  });

  updateSkletonCount();
  const isHidden = shouldHideElements[0]?.classList.contains("hidden");
  localStorage.setItem("sidebar-collapsed", Boolean(isHidden));
};

export const adjustMenuDirection = (button, menu) => {
  if (menu.classList.contains("notifications-overlay")) return;
  // Reset previous positioning
  menu.style.left = "";
  menu.style.right = "";
  menu.style.top = "";
  menu.style.bottom = "";
  menu.style.translate = "";

  const buttonRect = button.getBoundingClientRect();
  const menuWidth = menu.offsetWidth;
  const menuHeight = menu.offsetHeight;
  const gap = 8; // 0.5rem

  const clipRect = getClippingRect(button);
  const spaceBelow = clipRect.bottom - buttonRect.bottom;
  const spaceAbove = buttonRect.top - clipRect.top;

  // Assuming left: 0 aligns menu's left edge with button's left edge, extending to the right.
  // Assuming right: 0 aligns menu's right edge with button's right edge, extending to the left.
  const fitsExtendingRight = buttonRect.left + menuWidth <= clipRect.right;
  const fitsExtendingLeft = buttonRect.right - menuWidth >= clipRect.left;

  const fitsBelow = spaceBelow >= menuHeight + gap;
  const fitsAbove = spaceAbove >= menuHeight + gap;

  if (fitsBelow && fitsExtendingRight) {
    // 1. Below, Extending Right (Default)
    menu.style.left = "0";
    menu.style.right = "auto";
    menu.style.top = "auto";
    menu.style.bottom = "0";
    menu.style.translate = "0 calc(100% + 0.5rem)";
  } else if (fitsBelow && fitsExtendingLeft) {
    // 2. Below, Extending Left
    menu.style.left = "auto";
    menu.style.right = "0";
    menu.style.top = "auto";
    menu.style.bottom = "0";
    menu.style.translate = "0 calc(100% + 0.5rem)";
  } else if (fitsAbove && fitsExtendingRight) {
    // 3. Above, Extending Right
    menu.style.left = "0";
    menu.style.right = "auto";
    menu.style.top = "auto";
    menu.style.bottom = "100%";
    menu.style.translate = "0 calc(-0.5rem)";
  } else if (fitsAbove && fitsExtendingLeft) {
    // 4. Above, Extending Left
    menu.style.left = "auto";
    menu.style.right = "0";
    menu.style.top = "auto";
    menu.style.bottom = "100%";
    menu.style.translate = "0 calc(-0.5rem)";
  } else {
    // Ultimate fallback if screen is cramped: Pick side with more space
    if (spaceAbove > spaceBelow) {
      menu.style.top = "auto";
      menu.style.bottom = "100%";
      menu.style.translate = "0 calc(-0.5rem)";
    } else {
      menu.style.top = "auto";
      menu.style.bottom = "0";
      menu.style.translate = "0 calc(100% + 0.5rem)";
    }

    const midPoint = clipRect.left + (clipRect.right - clipRect.left) / 2;
    if (buttonRect.left > midPoint) {
      menu.style.left = "auto";
      menu.style.right = "0";
    } else {
      menu.style.left = "0";
      menu.style.right = "auto";
    }
  }
};

export const openDropDownMenu = (button) => {
  if (!button) return;
  let overlay =
    button.parentElement?.querySelector(".overlay") ||
    button
      .closest(".select-trigger, .quiz-card-header, div")
      ?.querySelector(".overlay");

  if (
    !overlay &&
    (button.classList.contains("mobile-notif-btn") ||
      button.classList.contains("notification-btn"))
  ) {
    overlay = document.querySelector(".notifications-overlay");
  }

  if (overlay) {
    if (overlay.classList.contains("open-overlay")) {
      if (
        overlay.classList.contains("notifications-overlay") &&
        window.clearAllNotifCardsUnreadState
      ) {
        window.clearAllNotifCardsUnreadState();
      }
      overlay.classList.remove("open-overlay");
      document.body.style.pointerEvents = "auto";
      return;
    }
    const existingOverlay = document.querySelector(".open-overlay");
    if (existingOverlay && existingOverlay !== overlay) {
      if (
        existingOverlay.classList.contains("notifications-overlay") &&
        window.clearAllNotifCardsUnreadState
      ) {
        window.clearAllNotifCardsUnreadState();
      }
      existingOverlay.classList.remove("open-overlay");
    }
    overlay.classList.add("open-overlay");
    document.body.style.pointerEvents = "none";
    adjustMenuDirection(button, overlay);
  }
};

export const openOverlayHandler = (e) => {
  const button = e.target.closest(".open-drop-down-btn");
  if (button) {
    openDropDownMenu(button);
  }
};

export const toggleClass = (array, className) => {
  array.forEach((e) => {
    e.classList.toggle(className);
  });
};

const animateFillIcon = (icon, addFill) => {
  const IconClass = getIconClassName(icon);
  if (addFill) {
    icon.classList.remove(`${IconClass}`);
    icon.classList.add(`${IconClass}-fill`);
  } else {
    icon.classList.remove(`${IconClass}-fill`);
    icon.classList.add(`${IconClass}`);
  }
};

const getIconClassName = (icon) => {
  const IconClass = Object.values(icon.classList)
    .find((e) => e.includes("bi-"))
    .split("-")
    .filter((e) => !e.includes("fill"))
    .join("-");
  return IconClass;
};

export const handleOverlayClose = (event) => {
  const overlayToClose = document.querySelector(".open-overlay");
  const isOpenBtn = event.target.closest(".open-drop-down-btn");
  const isCloseBtn = event.target.closest(".close-overlay-btn");
  const isDropDownItem = event.target.closest(`.drop-down-item`);
  const isOnOverlay = event.target.closest(`.open-overlay`);
  if (
    (isDropDownItem || !isOnOverlay || isCloseBtn) &&
    overlayToClose &&
    !isOpenBtn
  ) {
    if (
      overlayToClose.classList.contains("notifications-overlay") &&
      window.clearAllNotifCardsUnreadState
    ) {
      window.clearAllNotifCardsUnreadState();
    }
    overlayToClose.classList.remove("open-overlay");
    document.body.style.pointerEvents = "auto";
    // Reset positioning
    setTimeout(() => {
      overlayToClose.style.left = "";
      overlayToClose.style.right = "";
      overlayToClose.style.top = "";
      overlayToClose.style.bottom = "";
      overlayToClose.style.translate = "";
    }, 300); // Wait for transition
  }
  if (!overlayToClose) {
    document.body.style.pointerEvents = "auto";
  }
};

export const formatHoursMinutes = (TimeOrDate) => {
  const date = new Date(TimeOrDate);
  // Use toLocaleTimeString for local time, 2-digit hour/minute, 24-hour format
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

let tooltipTimer = null;

export const resetTooltip = (tooltip, target) => {
  if (target && !target.dataset.tooltip) return;

  tooltip.classList.remove("show");
  if (target) {
    target.dataset.tooltip = "";
    target.classList.remove("error-animation");
    target.classList.remove("error-input");
  }
  tooltipTimer = setTimeout(() => {
    tooltip.style.left = 0 + "px";
    tooltip.style.top = 0 + "px";
    tooltip.style.translate = "";
    tooltip.className = "tooltip";
  }, 300);
};

export const showTooltip = (tooltipTarget, tooltip, message, error) => {
  if (tooltipTimer) clearTimeout(tooltipTimer);

  if (message) tooltipTarget.dataset.tooltip = message;

  // Reset any old directional or state classes before calculating position
  tooltip.className = "tooltip";
  tooltip.style.translate = "none";

  const positionInfo = tooltipTarget.getBoundingClientRect();
  tooltip.textContent = tooltipTarget.getAttribute("data-tooltip");
  tooltip.dir = document.documentElement.dir || "ltr";

  // Ensure dimensions can be measured accurately
  const tooltipWidth = tooltip.offsetWidth;
  const tooltipHeight = tooltip.offsetHeight;
  const gap = 8; // 0.5rem gap

  const targetCenterX = positionInfo.left + positionInfo.width / 2;
  const targetCenterY = positionInfo.top + positionInfo.height / 2;

  // Check available viewport space across all boundaries
  const spaceAbove = positionInfo.top;
  const spaceBelow = window.innerHeight - positionInfo.bottom;
  const spaceRight = window.innerWidth - positionInfo.right;
  const spaceLeft = positionInfo.left;

  // Decision logic for direction so tooltip is never hidden or cut outside viewport bounds
  const halfWidth = tooltipWidth / 2;
  const halfHeight = tooltipHeight / 2;

  const fitsAbove =
    spaceAbove >= tooltipHeight + gap &&
    targetCenterX - halfWidth >= 0 &&
    targetCenterX + halfWidth <= window.innerWidth;

  const fitsBelow =
    spaceBelow >= tooltipHeight + gap &&
    targetCenterX - halfWidth >= 0 &&
    targetCenterX + halfWidth <= window.innerWidth;

  const fitsLeft =
    spaceLeft >= tooltipWidth + gap &&
    targetCenterY - halfHeight >= 0 &&
    targetCenterY + halfHeight <= window.innerHeight;

  const fitsRight =
    spaceRight >= tooltipWidth + gap &&
    targetCenterY - halfHeight >= 0 &&
    targetCenterY + halfHeight <= window.innerHeight;

  // For corner placements: Align tooltip box flush with target edge, center arrow over target
  const arrowOffset = positionInfo.width / 2;
  const fitsExtendingRight =
    positionInfo.left + tooltipWidth <= window.innerWidth;
  const fitsExtendingLeft = positionInfo.right - tooltipWidth >= 0;

  if (fitsAbove) {
    // 1. Place ABOVE (`from-bottom` arrow / default) cleanly centered
    tooltip.style.left = `${targetCenterX}px`;
    tooltip.style.top = `${positionInfo.top - gap}px`;
    tooltip.style.translate = "-50% -100%";
  } else if (fitsBelow) {
    // 2. Place BELOW (`from-top` arrow pointing up) cleanly centered
    tooltip.classList.add("from-top");
    tooltip.style.left = `${targetCenterX}px`;
    tooltip.style.top = `${positionInfo.bottom + gap}px`;
    tooltip.style.translate = "-50% 0";
  } else if (fitsLeft) {
    // 3. Place to the LEFT (`from-left` arrow pointing right) cleanly centered
    tooltip.classList.add("from-left");
    tooltip.style.left = `${positionInfo.left - gap}px`;
    tooltip.style.top = `${targetCenterY}px`;
    tooltip.style.translate = "-100% -50%";
  } else if (fitsRight) {
    // 4. Place to the RIGHT (`from-right` arrow pointing left) cleanly centered
    tooltip.classList.add("from-right");
    tooltip.style.left = `${positionInfo.right + gap}px`;
    tooltip.style.top = `${targetCenterY}px`;
    tooltip.style.translate = "0 -50%";
  } else if (spaceAbove >= tooltipHeight + gap && fitsExtendingRight) {
    // 5. Target at Bottom-Left: Place ABOVE, aligned to left edge, extending RIGHT
    tooltip.classList.add("above-right");
    tooltip.style.setProperty("--arrow-offset", `${arrowOffset}px`);
    tooltip.style.left = `${positionInfo.left}px`;
    tooltip.style.top = `${positionInfo.top - gap}px`;
    tooltip.style.translate = "0 -100%";
  } else if (spaceAbove >= tooltipHeight + gap && fitsExtendingLeft) {
    // 6. Target at Bottom-Right: Place ABOVE, aligned to right edge, extending LEFT
    tooltip.classList.add("above-left");
    tooltip.style.setProperty("--arrow-offset", `${arrowOffset}px`);
    tooltip.style.left = `${positionInfo.right}px`;
    tooltip.style.top = `${positionInfo.top - gap}px`;
    tooltip.style.translate = "-100% -100%";
  } else if (spaceBelow >= tooltipHeight + gap && fitsExtendingRight) {
    // 7. Target at Top-Left: Place BELOW, aligned to left edge, extending RIGHT
    tooltip.classList.add("below-right");
    tooltip.style.setProperty("--arrow-offset", `${arrowOffset}px`);
    tooltip.style.left = `${positionInfo.left}px`;
    tooltip.style.top = `${positionInfo.bottom + gap}px`;
    tooltip.style.translate = "0 0";
  } else if (spaceBelow >= tooltipHeight + gap && fitsExtendingLeft) {
    // 8. Target at Top-Right: Place BELOW, aligned to right edge, extending LEFT
    tooltip.classList.add("below-left");
    tooltip.style.setProperty("--arrow-offset", `${arrowOffset}px`);
    tooltip.style.left = `${positionInfo.right}px`;
    tooltip.style.top = `${positionInfo.bottom + gap}px`;
    tooltip.style.translate = "-100% 0";
  } else {
    // Ultimate fallback if window is completely tiny: clamp above
    const clampedLeft = Math.max(
      halfWidth + gap,
      Math.min(window.innerWidth - halfWidth - gap, targetCenterX),
    );
    if (spaceAbove >= spaceBelow) {
      tooltip.style.left = `${clampedLeft}px`;
      tooltip.style.top = `${positionInfo.top - gap}px`;
      tooltip.style.translate = "-50% -100%";
    } else {
      tooltip.classList.add("from-top");
      tooltip.style.left = `${clampedLeft}px`;
      tooltip.style.top = `${positionInfo.bottom + gap}px`;
      tooltip.style.translate = "-50% 0";
    }
  }

  tooltip.classList.add("show");
  if (error) {
    tooltip.classList.add("error-tooltip");
  }
};
export const tooltipSetup = () => {
  let currentTooltipTarget = null;
  let tooltipTimer = null;

  const clearAndHideTooltip = () => {
    if (currentTooltipTarget || tooltipTimer) {
      resetTooltip(hoverTooltip);
      currentTooltipTarget = null;
      clearTimeout(tooltipTimer);
      tooltipTimer = null;
    }
  };

  document.addEventListener("mouseover", (e) => {
    const tooltipTarget = e.target.closest(".has-tooltip");
    if (tooltipTarget && tooltipTarget !== currentTooltipTarget) {
      clearAndHideTooltip();
      currentTooltipTarget = tooltipTarget;
      tooltipTimer = setTimeout(
        () => showTooltip(tooltipTarget, hoverTooltip),
        1000,
      );
    }
  });

  document.addEventListener("mouseout", (e) => {
    // Only reset if leaving the .has-tooltip element entirely.
    // Ignoring internal mouse movements prevents the timer from cancelling incorrectly.
    if (
      currentTooltipTarget &&
      !currentTooltipTarget.contains(e.relatedTarget)
    ) {
      clearAndHideTooltip();
    }
  });

  // Hide tooltip when the target is clicked (prevents lingering over modals/dropdowns)
  document.addEventListener("click", (e) => {
    if (currentTooltipTarget && currentTooltipTarget.contains(e.target)) {
      clearAndHideTooltip();
    }
  });

  // Hide tooltips on scroll to prevent them from floating off-target
  document.addEventListener("scroll", clearAndHideTooltip, { passive: true });

  // Hide tooltips on Escape key for accessibility
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") clearAndHideTooltip();
  });
};

const SHARED_STYLES_MAP = {
  "/home/inactive": ["/tasks", "/chat"],
  "/home/active": ["/tasks", "/chat", "/quiz-result"],
  "/quizzes/my": ["/quizzes-groups", "/fields", "/forms"],
  "/quizzes/passed": ["/quizzes-groups", "/fields", "/forms", "/quiz-result"],
  "/groups/my": [
    "/groups-my-available",
    "/quizzes-groups",
    "/fields",
    "/tasks",
    "/forms",
  ],
  "/groups/my/group-chat": [
    "/chat",
    "/tasks",
    "/fields",
    "/forms",
    "/quiz-result",
  ],
  "/groups/available": ["/groups-my-available", "/quizzes-groups"],
  "/quiz-play": ["/quiz-result"],
  "/settings": ["/fields"],
};

const setSharedStylesResources = async (pathName, removeOld = true) => {
  const sharedStylesRoutes = SHARED_STYLES_MAP[pathName];
  if (sharedStylesRoutes) {
    const sharedStylesLinks = document.querySelectorAll(
      'link[data-dynamic][rel="stylesheet"][href*="shared"]',
    );
    // add new shared resources and wait for their load
    await Promise.all(
      sharedStylesRoutes.map((styleRoute) => {
        if (
          !Array.from(sharedStylesLinks).find((l) =>
            l.href.includes(styleRoute),
          )
        ) {
          return setStyleRoute(`/shared${styleRoute}`);
        }
        return Promise.resolve();
      }),
    );

    if (removeOld) {
      // Remove previous shared resources that new ones are not using
      sharedStylesLinks.forEach((l) => {
        const prevStyleRoute = sharedStylesRoutes.find((route) =>
          l.href.includes(route),
        );
        if (!prevStyleRoute) {
          l.remove();
        }
      });
    }
  }
};

const setScriptRoute = async (pathName, thisNav) => {
  try {
    const modulePath = `/app/assets${pathName}/js/main.mjs`;
    const module = await import(modulePath);
    if (thisNav !== navCounter) return;
    module.init?.();
  } catch (error) {
    const isNative = error.isNative || error.data?.isNative;
    const notifType =
      error.type || error.data?.type || (isNative ? "info" : "error");
    if (!isNative) console.error(error);
    showMessageBlock(
      error.message || t("shared:alerts.error_occurred"),
      notifType,
    );
  }
};

const setStyleRoute = (pathName) => {
  return new Promise((resolve) => {
    const href = `/app/assets/${pathName}/css/styles.css`;
    if (document.querySelector(`link[rel="stylesheet"][href="${href}"]`)) {
      return resolve();
    }
    const stylesLink = document.createElement("link");
    stylesLink.rel = "stylesheet";
    stylesLink.href = href;
    stylesLink.as = "style";
    stylesLink.setAttribute("data-dynamic", "");
    stylesLink.onload = () => resolve();
    stylesLink.onerror = () => resolve();
    document.head.appendChild(stylesLink);
  });
};

const removePreviousRessources = (keepPathName = null) => {
  const stylesLinks = document.querySelectorAll(
    'link[data-dynamic][rel="stylesheet"]:not([href*="shared"])',
  );
  const script = document.querySelector("script[data-dynamic]");

  script?.remove();
  stylesLinks.forEach((l) => {
    if (!keepPathName || !l.href.includes(keepPathName)) {
      l.remove();
    }
  });
};

const createGreetingMsg = (fullName) => {
  const greetingMsg = document.createElement("div");
  greetingMsg.className = "greeting-msg fade-in-template";
  const heading = document.createElement("h2");
  // Use a more robust greeting and fallback for missing name
  const displayName =
    fullName && fullName.trim() ? fullName : t("common:greetings.there");
  const greetings = [
    t("common:greetings.hello"),
    t("common:greetings.welcome"),
    t("common:greetings.hi"),
    t("common:greetings.greetings"),
    t("common:greetings.good_to_see_you"),
    t("common:greetings.hey"),
  ];
  // Pick a random greeting
  const greeting = greetings[Math.floor(Math.random() * greetings.length)];
  heading.textContent = `${greeting} ${displayName} 👋`;

  const paragraph = document.createElement("p");
  // Add a more personalized or dynamic message
  const dayMessages = [
    t("common:greetings.messages.fantastic_day"),
    t("common:greetings.messages.productive_session"),
    t("common:greetings.messages.great_today"),
    t("common:greetings.messages.make_progress"),
    t("common:greetings.messages.wonderful_day"),
  ];
  paragraph.textContent =
    dayMessages[Math.floor(Math.random() * dayMessages.length)];

  greetingMsg.appendChild(heading);
  greetingMsg.appendChild(paragraph);

  return greetingMsg;
};

const createSearchContainer = (isQuizPage = false) => {
  const searchContainer = document.createElement("div");
  searchContainer.className = "search-container fade-in-template";

  const search = document.createElement("div");
  search.className = "main-search search";

  const searchIconContainer = document.createElement("div");
  searchIconContainer.className = "search-icon-container";

  const searchIcon = document.createElement("i");
  searchIcon.className = "bi bi-search";

  const input = document.createElement("input");
  input.type = "search";
  input.id = "search-input";
  input.placeholder = isQuizPage
    ? t("common:placeholders.search_quizzes", {
        defaultValue: "Search By Quiz Title or Subject",
      })
    : t("common:placeholders.search_groups", {
        defaultValue: "Search By Group Name or Subject",
      });
  // Create sort label as a button with checkbox
  const sortLabel = document.createElement("label");
  sortLabel.type = "button";
  sortLabel.className = "exclude-btn sort-button button";

  const sortIcon = document.createElement("i");
  sortIcon.className = "bi bi-sort-down";

  const sortCheckbox = document.createElement("input");
  sortCheckbox.type = "checkbox";
  sortCheckbox.id = "sort-checkbox";
  sortCheckbox.className = "sort-checkbox";

  sortLabel.appendChild(sortIcon);
  sortLabel.appendChild(sortCheckbox);

  searchIconContainer.appendChild(searchIcon);
  search.appendChild(searchIconContainer);
  search.appendChild(input);
  searchContainer.appendChild(search);
  searchContainer.appendChild(sortLabel);
  searchContainer.appendChild(createFilterContainer(!isQuizPage));

  return searchContainer;
};

const createFilterContainer = (groups) => {
  const filterContainer = document.createElement("div");
  filterContainer.className = "filter-container";

  const filterButton = document.createElement("button");
  filterButton.type = "button";
  filterButton.className =
    "exclude-btn filter-button open-drop-down-btn should-fill";

  const filterIcon = document.createElement("i");
  filterIcon.className = "bi bi-funnel";

  const filterPanel = createFilterPanel(groups);

  filterButton.appendChild(filterIcon);
  filterContainer.appendChild(filterButton);
  filterContainer.appendChild(filterPanel);

  return filterContainer;
};

const createTabs = (tabContent, tabsClassName) => {
  const navigationTabs = document.createElement("div");
  navigationTabs.className = `navigation-tabs ${
    tabsClassName || ""
  } fade-in-template`;
  navigationTabs.style.opacity = 0;

  tabContent.forEach((tab) => {
    const tabLink = document.createElement("a");
    tabLink.href = tab.route;
    tabLink.className = `tab route-link exclude-btn ${
      tab.className || ""
    }`.trim();
    tabLink.textContent = tab.textContent;
    if (tab.active) {
      tabLink.classList.add("active-tab");
    }
    navigationTabs.appendChild(tabLink);
  });

  return navigationTabs;
};

const setGroupName = (groupName) => {
  const groupNameEl = document.createElement("h1");
  groupNameEl.className = "fade-in-template";
  if (groupName) {
    groupNameEl.textContent = groupName;
  } else {
    groupNameEl.innerHTML =
      '<span class="loading-opacity-animation" style="width: 10rem; height: 1.5rem; display: inline-block; border-radius: 0.3rem;"></span>';
  }
  return groupNameEl;
};

const setQuizTitle = (quizTitle) => {
  const quizTitleEl = document.createElement("h1");
  quizTitleEl.className = "fade-in-template";
  if (quizTitle) {
    quizTitleEl.textContent = quizTitle;
  } else {
    quizTitleEl.innerHTML =
      '<span class="loading-opacity-animation" style="width: 12rem; height: 1.5rem; display: inline-block; border-radius: 0.3rem;"></span>';
  }
  return quizTitleEl;
};

const createCreateBtn = (quiz) => {
  const createGroupBtn = document.createElement("button");
  createGroupBtn.type = "button";
  createGroupBtn.className = quiz ? "create-quiz-btn" : "create-group-btn";

  createGroupBtn.innerHTML = `
    <i class="bi bi-plus-circle"></i>
    <span>${quiz ? t("common:buttons.create_quiz") : t("common:buttons.create_group")}</span>
  `;
  return createGroupBtn;
};

const createSaveQuizBtn = (isMobile = false) => {
  const saveQuizBtn = document.createElement("button");
  saveQuizBtn.type = "button";
  if (isMobile) {
    saveQuizBtn.className =
      "save-quiz-btn exclude-btn mobile-icon-btn should-fill";
    saveQuizBtn.title = t("common:actions.save");
    saveQuizBtn.style.color = "var(--color-blue)";
    saveQuizBtn.style.fontSize = "1.25rem";
    saveQuizBtn.style.width = "fit-content";
    saveQuizBtn.style.aspectRatio = "1/1";
    saveQuizBtn.innerHTML = `<i class="bi bi-floppy"></i>`;
  } else {
    saveQuizBtn.className = "save-quiz-btn should-fill blue-btn";
    saveQuizBtn.innerHTML = `
      <i class="bi bi-floppy"></i>
      <span>${t("common:modals.save")}</span>
    `;
  }
  return saveQuizBtn;
};

const pageConfig = (key) => {
  const pageConf = {
    "/home": {
      title: t("common:titles.home"),
      middle: (extraData) => createGreetingMsg(extraData.fullName),
    },
    "/groups/my": {
      title: t("common:titles.groups"),
      middle: () => createSearchContainer(),
      additional: () => {
        const createGroupBtn = createCreateBtn();
        topSideBarFooter.prepend(createGroupBtn);
      },
    },
    "/quizzes/my": {
      title: t("common:titles.quizzes"),
      middle: () => createSearchContainer(true),
      additional: () => {
        const createQuizBtn = createCreateBtn(true);
        topSideBarFooter.prepend(createQuizBtn);
      },
    },
    "/settings": {
      title: t("common:titles.settings"),
      middle: () => document.createDocumentFragment(),
    },
    "/groups/my/group-chat": {
      title: `<a href="/app/groups/my"><i class="bi bi-caret-left-fill"></i>${t("common:group_chat")}</a>`,
      middle: (extraData) => setGroupName(extraData.groupName),
    },
    "/quizzes/my/quiz-editor": {
      title: `<a href="/app/quizzes/my"><i class="bi bi-caret-left-fill"></i>${t("common:titles.quiz_editor")}</a>`,
      middle: (extraData) => setQuizTitle(extraData.quizTitle),
      additional: () => {
        const saveQuizBtn = createSaveQuizBtn();
        topSideBarFooter.prepend(saveQuizBtn);

        const mobileTopbarRight = document.querySelector(
          ".mobile-topbar-right",
        );
        if (
          mobileTopbarRight &&
          !mobileTopbarRight.querySelector(".save-quiz-btn")
        ) {
          const mobileSaveQuizBtn = createSaveQuizBtn(true);
          mobileTopbarRight.prepend(mobileSaveQuizBtn);
        }
      },
    },
  };
  return pageConf[key];
};

const removeCreateBtns = () => {
  const createBtns = document.querySelectorAll(
    ".create-quiz-btn, .create-group-btn",
  );
  createBtns.forEach((btn) => {
    btn.remove();
  });
};

const removeSaveQuizBtn = () => {
  const saveQuizBtns = document.querySelectorAll(".save-quiz-btn");
  saveQuizBtns.forEach((btn) => btn.remove());
};

const updateTopSideBar = (pathName, extraData) => {
  let normalizedPath = pathName;
  if (
    normalizedPath.includes("/chat") ||
    normalizedPath.includes("/group-chat")
  ) {
    normalizedPath = "/groups/my/group-chat";
  } else if (
    normalizedPath.includes("/edit") ||
    normalizedPath.includes("/quiz-editor")
  ) {
    normalizedPath = "/quizzes/my/quiz-editor";
  } else if (
    normalizedPath.includes("/home") ||
    normalizedPath === "/" ||
    normalizedPath === "/app"
  ) {
    normalizedPath = "/home";
  }
  const {
    title: headerTitle = "",
    middle: makeMiddle = () => document.createDocumentFragment(),
  } = pageConfig(normalizedPath) || {};

  // 2) update header
  updateTopSideBarHeader(headerTitle);

  // 3) update middle content
  const topSideBar = document.querySelector("aside.top-side-bar");
  if (topSideBar && !topSideBar.contains(topSideBarMiddle)) {
    topSideBar.appendChild(topSideBarMiddle);
  }
  const activeSessionsHeader = document.querySelector(
    ".active-sessions header",
  );
  const activeSearchEl = document.querySelector(
    ".active-sessions-search.search",
  );
  if (
    activeSessionsHeader &&
    activeSearchEl &&
    !activeSessionsHeader.contains(activeSearchEl)
  ) {
    activeSessionsHeader.appendChild(activeSearchEl);
  }

  const middleContent = makeMiddle(extraData || {});

  topSideBarMiddle.replaceChildren(middleContent);

  const mobileSearchBtn = document.querySelector(".mobile-search-btn");
  const mobileSearchBox = document.getElementById("mobile-search-box");
  const mobileTabsContainer = document.getElementById("mobile-tabs-container");
  if (
    mobileTabsContainer &&
    (normalizedPath.startsWith("/settings") ||
      normalizedPath.includes("/chat") ||
      normalizedPath.includes("/group-chat"))
  ) {
    mobileTabsContainer.classList.add("hidden");
    mobileTabsContainer.innerHTML = "";
  }
  if (mobileSearchBox) {
    mobileSearchBox.classList.add("hidden");
    mobileSearchBox.innerHTML = "";
  }
  if (mobileSearchBtn) {
    const hasSearch =
      topSideBarMiddle.querySelector(".search-container") ||
      document.querySelector(".active-sessions-search.search");
    if (hasSearch) {
      mobileSearchBtn.classList.remove("hidden");
    } else {
      mobileSearchBtn.classList.add("hidden");
    }
  }

  removeCreateBtns();

  removeSaveQuizBtn();

  const mobileGroupActionsSection = document.querySelector(
    ".mobile-group-chat-actions",
  );
  if (mobileGroupActionsSection && normalizedPath !== "/groups/my/group-chat") {
    mobileGroupActionsSection.classList.add("hidden");
    const actionsList = document.getElementById(
      "mobile-drawer-group-actions-list",
    );
    if (actionsList) actionsList.innerHTML = "";
  }

  // 5) ONLY groups get tabs
  const isGroups = ["/groups/my", "/groups/available"].includes(normalizedPath);
  const isQuizzes = ["/quizzes/my", "/quizzes/passed"].includes(normalizedPath);
  const existingTabs = topSideBarHeader?.querySelector(".navigation-tabs");
  if (existingTabs) {
    existingTabs.remove();
  }
  if (isGroups) {
    const tabContent = [
      {
        route: "/app/groups/my",
        textContent: t("common:tabs.my_groups"),
        active: true,
      },
      {
        route: "/app/groups/available",
        className: "available-groups-tab",
        textContent: t("common:tabs.available_groups"),
        active: false,
      },
    ];
    topSideBarHeader.appendChild(createTabs(tabContent, "groups-tabs"));
  }
  if (isQuizzes) {
    const tabContent = [
      {
        route: "/app/quizzes/my",
        textContent: t("common:tabs.my_quizzes"),
        active: true,
      },
      {
        route: "/app/quizzes/passed",
        className: "groups-quizzes-tab",
        textContent: t("common:tabs.passed"),
        active: false,
      },
    ];
    topSideBarHeader.appendChild(createTabs(tabContent, "quizzes-tabs"));
  }

  // 6) add additional content if needed
  const { additional } = pageConfig(normalizedPath) || {};
  if (additional) {
    additional();
  }
};

const updateTopSideBarHeader = (Title) => {
  const topH2 = topSideBarHeader?.querySelector("h2");
  if (topH2) topH2.innerHTML = Title;

  const mobileTitleEl = document.querySelector(".mobile-page-title");
  const mobileBackBtn = document.querySelector(".mobile-back-btn");
  if (!mobileTitleEl) return;

  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = Title;
  const linkEl = tempDiv.querySelector("a");

  if (linkEl && mobileBackBtn) {
    const returnHref = linkEl.getAttribute("href") || "/app/home";
    mobileBackBtn.setAttribute("href", returnHref);
    mobileBackBtn.classList.remove("hidden");
    if (
      Title.toLowerCase().includes(
        t("common:group_chat", { defaultValue: "group chat" }),
      )
    ) {
      mobileTitleEl.innerHTML = `
        <button
          type="button"
          class="exclude-btn show-info-btn"
        >
          <i class="bi bi-info-circle"></i>
          Group Chat
        </button>
      `;
    } else {
      mobileTitleEl.textContent =
        linkEl.textContent.trim() || tempDiv.textContent.trim();
    }
  } else {
    if (mobileBackBtn) mobileBackBtn.classList.add("hidden");
    mobileTitleEl.innerHTML = Title;
  }
};

let navCounter = 0;

export const clearAllTimeOuts = () => {
  // Clear all timeouts in timers object
  Object.entries(timers).forEach(([key, value]) => {
    if (value) {
      clearTimeout(value);
      delete timers[key]; // Remove the timer reference
    }
  });
};

export const updateDocumentTitle = (path) => {
  if (!path) return;
  let cleanPath = path;
  if (cleanPath.startsWith("http")) {
    try {
      cleanPath = new URL(cleanPath).pathname;
    } catch (e) {}
  }
  if (
    cleanPath.includes("/home") ||
    cleanPath === "/" ||
    cleanPath === "/app"
  ) {
    document.title = `StudySyncro — ${t("common:titles.home", { defaultValue: "Home" })}`;
  } else if (cleanPath.includes("/groups/my/group-chat")) {
    document.title = `StudySyncro — ${t("common:group_chat", { defaultValue: "Group Chat" })}`;
  } else if (cleanPath.includes("/groups/available")) {
    document.title = `StudySyncro — ${t("common:tabs.available_groups", { defaultValue: "Available Groups" })}`;
  } else if (
    cleanPath.includes("/groups/my") ||
    cleanPath.includes("/groups")
  ) {
    document.title = `StudySyncro — ${t("common:titles.groups", { defaultValue: "Groups" })}`;
  } else if (cleanPath.includes("/quizzes/my/quiz-editor")) {
    document.title = `StudySyncro — ${t("common:titles.quiz_editor", { defaultValue: "Quiz Editor" })}`;
  } else if (cleanPath.includes("/quizzes/passed")) {
    document.title = `StudySyncro — ${t("common:titles.passed_quizzes", { defaultValue: "Passed Quizzes" })}`;
  } else if (
    cleanPath.includes("/quizzes/my") ||
    cleanPath.includes("/quizzes")
  ) {
    document.title = `StudySyncro — ${t("common:titles.quizzes", { defaultValue: "Quizzes" })}`;
  } else if (cleanPath.includes("/settings")) {
    document.title = `StudySyncro — ${t("common:titles.settings", { defaultValue: "Settings" })}`;
  }
};

export const updateMain = async (path, isTabLinks) => {
  const thisNav = ++navCounter;
  try {
    if (thisNav !== navCounter) {
      return;
    }
    resetRouteController();
    clearAllTimeOuts();
    closeAllEventSources();
    clearAllPageListeners();
    clearOverlaysModals();
    updateDocumentTitle(path);

    let predRoute = path;
    try {
      if (predRoute.startsWith("http")) predRoute = new URL(predRoute).pathname;
      if (predRoute.startsWith("/app")) predRoute = predRoute.slice(4);
      if (predRoute === "/" || predRoute === "" || predRoute === "/home")
        predRoute = "/home/inactive";
      predRoute = predRoute.split("?")[0].replace(/\/$/, "");
      if (!predRoute.startsWith("/")) predRoute = "/" + predRoute;
      if (predRoute.includes("/chat") || predRoute.includes("/group-chat")) {
        predRoute = "/groups/my/group-chat";
      } else if (
        predRoute.includes("/edit") ||
        predRoute.includes("/quiz-editor")
      ) {
        predRoute = "/quizzes/my/quiz-editor";
      } else if (predRoute.includes("/quiz-play")) {
        predRoute = "/quiz-play";
      }
      await Promise.all([
        setStyleRoute(predRoute),
        setSharedStylesResources(predRoute, false),
      ]);
      setSharedStylesResources(predRoute, true);
    } catch (e) {}

    mainContainer.innerHTML = getPageSkeleton(path);
    clearOverlaysModals();
    if (!isTabLinks) {
      updateTopSideBar(
        predRoute.includes("/home") ? "/home" : predRoute,
        window.lastExtraData || {},
      );
    }
    const { pathName, htmlFragment, extraData } = await fetchTemplate(
      location.href,
    );

    if (thisNav !== navCounter) {
      return;
    }

    clearAllTimeOuts();
    closeAllEventSources();
    clearAllPageListeners();
    const cleanFragment =
      typeof htmlFragment === "string"
        ? htmlFragment.replace(/\bfade-in-template\b/g, "")
        : htmlFragment;

    await Promise.all([
      setStyleRoute(pathName),
      setSharedStylesResources(pathName, false),
    ]);

    if (thisNav !== navCounter) {
      return;
    }

    mainContainer.innerHTML = cleanFragment;
    removePreviousRessources(pathName);
    setSharedStylesResources(pathName, true);
    setScriptRoute(pathName, thisNav);
    if (extraData)
      window.lastExtraData = { ...window.lastExtraData, ...extraData };
    const isDynamicTitleRoute =
      pathName.includes("/chat") ||
      pathName.includes("/group-chat") ||
      pathName.includes("/edit") ||
      pathName.includes("/quiz-editor");
    const isFirstTimeHome =
      pathName.includes("/home") && !window.lastExtraData?.fullName;
    if (!isTabLinks && (isDynamicTitleRoute || isFirstTimeHome)) {
      updateTopSideBar(
        pathName.includes("/home") ? "/home" : pathName,
        window.lastExtraData || extraData,
      );
    }
    topSideBarMiddle?.querySelector(".loading-opacity-animation")?.remove();
  } catch (error) {
    const isNative = error.isNative || error.data?.isNative;
    const notifType =
      error.type || error.data?.type || (isNative ? "info" : "error");
    if (!isNative) console.error(error);
    showMessageBlock(
      error.message || t("shared:alerts.error_occurred"),
      notifType,
    );
  }
};

export const toggleActiveLink = (pathName, tabLink) => {
  const activeTabLink = document.querySelector(".active-tab");
  if (tabLink) {
    activeTabLink?.classList.remove("active-tab");
    const pageLink = document.querySelector(`.tab[href="${pathName}"]`);
    pageLink.classList.add("active-tab");
    return;
  }
  const tabLinkPathName = activeTabLink?.href
    ? new URL(activeTabLink?.href).pathname
    : "";
  // Allow tab to remain active if pathName starts with tabLinkPathName (for subpages)
  if (tabLinkPathName && pathName.startsWith(tabLinkPathName + "/")) return;
  document
    .querySelectorAll(
      ".side-bar-icons a.active, .mobile-bottomnav a.active, .nav-link.active, .route-link.active",
    )
    .forEach((activePageLink) => {
      const activeIcon = activePageLink.querySelector("i");
      activeIcon ? animateFillIcon(activeIcon, false) : null;
      activePageLink.classList.remove("active");
    });
  const pageLinks = document.querySelectorAll(
    `.side-bar-icons [href="${pathName}"], .mobile-bottomnav [href="${pathName}"]`,
  );
  if (pageLinks.length > 0) {
    pageLinks.forEach((pageLink) => {
      pageLink.classList.add("active");
      const icon = pageLink.querySelector("i");
      icon ? animateFillIcon(icon, true) : null;
    });
  } else {
    const allLinks = document.querySelectorAll(
      ".side-bar-icons a[href], .mobile-bottomnav a[href]",
    );
    allLinks.forEach((link) => {
      const href = link.getAttribute("href");
      if (
        (href.includes("/home") && pathName.includes("/home")) ||
        (href.includes("/groups") && pathName.includes("/groups")) ||
        (href.includes("/quizzes") && pathName.includes("/quizzes")) ||
        (href.includes("/settings") && pathName.includes("/settings"))
      ) {
        link.classList.add("active");
        const icon = link.querySelector("i");
        icon ? animateFillIcon(icon, true) : null;
      }
    });
  }
};

export const showErrorTooltip = (error, input, parentClassName) => {
  const inputContainer = parentClassName
    ? input.closest(`.${parentClassName}`)
    : input.closest(".field-container, .choice");

  initAndDiplayErrorTooltip(inputContainer, error);
};

export const clearTooltipWithTimeOut = getDebounceFunc((input) => {
  resetTooltip(globalTooltip, input);
}, 2000);

export const clearOverlaysModals = () => {
  const overlaysModals = document.querySelectorAll(".backdrop");
  overlaysModals.forEach((oM) => {
    const className = oM
      .querySelector(".overlay-model")
      .className.split(" ")
      .join(".");
    closeOverlayModal(className);
  });
};

export const navigateTo = (pathName) => {
  history.pushState({}, "", `/app${pathName}`);
  window.dispatchEvent(new PopStateEvent("popstate", { state: {} }));
  resetTooltip(hoverTooltip);
  resetTooltip(globalTooltip);
};

const getDateInput = () => {
  const dateLabel = document.createElement("label");
  dateLabel.className = "date-label should-fill has-tooltip";
  dateLabel.dataset.tooltip = t("common:tooltips.filter_by_date");
  dateLabel.innerHTML = `<i class="bi bi-calendar"></i>
    <input type="date" id="date-input">`;
  return dateLabel;
};

export const handleNavigation = (e) => {
  const link = e.target.closest("a.route-link");
  const tabLink = Boolean(e.target.closest(".navigation-tabs a"));
  if (link) {
    e.preventDefault();
    const pathName = new URL(link.href).pathname;
    if (pathName !== location.pathname) {
      toggleActiveLink(pathName, tabLink);
      updateMain(pathName, tabLink);
      resetTooltip(hoverTooltip);
      history.pushState(null, "", pathName);
      clearAllTimeOuts();

      if (tabLink) {
        topSideBarMiddle.querySelector("#sort-checkbox").checked = false;
        const isGroupsTabs = e.target.closest(".groups-tabs");
        const isUserQuizzesPage = location.pathname === "/app/quizzes/my";
        if (isGroupsTabs) {
          const filterPanel = topSideBarMiddle.querySelector(".filter-panel");
          if (filterPanel) {
            filterPanel.replaceWith(createFilterPanel(true));
          }
        }
        const searchContainer =
          topSideBarMiddle.querySelector(".search-container");
        if (isUserQuizzesPage) {
          topSideBarMiddle.querySelector(".date-label").remove();
          searchContainer.appendChild(createFilterContainer());
          searchContainer.querySelector("input").placeholder = t(
            "common:placeholders.search_quizzes",
            { defaultValue: "Search By Quiz Title or Subject" },
          );
        }
        if (!isUserQuizzesPage && !isGroupsTabs) {
          document.querySelector(".filter-container").remove();
          searchContainer.querySelector("input").placeholder = t(
            "common:placeholders.search_quizzes_groups",
            { defaultValue: "Search By Quiz Title, Subject or Group Name" },
          );
          searchContainer
            .querySelector(".main-search")
            .appendChild(getDateInput());
        }
        if (
          e.target.closest(".available-groups-tab") ||
          e.target.closest(".groups-quizzes-tab")
        ) {
          removeCreateBtns();
        } else {
          const groupCreateBtn = document.querySelector(".create-group-btn");
          const quizCreateBtn = document.querySelector(".create-quiz-btn");
          if (!groupCreateBtn && isGroupsTabs) {
            const createGroupBtn = createCreateBtn();
            topSideBarFooter.prepend(createGroupBtn);
          }
          if (!quizCreateBtn && !isGroupsTabs) {
            const createQuizBtn = createCreateBtn(true);
            topSideBarFooter.prepend(createQuizBtn);
          }
        }
      }
    }
  }
};

const createFilterOption = (id, label, iconClass) => {
  const option = document.createElement("div");
  option.className = "filter-option";

  // Custom checkbox container
  const checkboxLabel = document.createElement("label");
  checkboxLabel.className = "container";

  const input = document.createElement("input");
  input.type = "checkbox";
  input.id = id;
  input.value = label;

  // SVG checkmark
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 64 64");
  svg.setAttribute("height", "2em");
  svg.setAttribute("width", "2em");

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute(
    "d",
    "M 0 16 V 56 A 8 8 90 0 0 8 64 H 56 A 8 8 90 0 0 64 56 V 8 A 8 8 90 0 0 56 0 H 8 A 8 8 90 0 0 0 8 V 16 L 32 48 L 64 16 V 8 A 8 8 90 0 0 56 0 H 8 A 8 8 90 0 0 0 8 V 56 A 8 8 90 0 0 8 64 H 56 A 8 8 90 0 0 64 56 V 16",
  );
  path.setAttribute("pathLength", "575.0541381835938");
  path.setAttribute("class", "path");

  svg.appendChild(path);
  checkboxLabel.appendChild(input);
  checkboxLabel.appendChild(svg);

  checkboxLabel.htmlFor = id;

  const icon = document.createElement("i");
  icon.className = iconClass;

  checkboxLabel.appendChild(icon);
  checkboxLabel.appendChild(document.createTextNode(` ${label}`));

  option.appendChild(checkboxLabel);

  return option;
};

const createSection = (title, options) => {
  const section = document.createElement("section");
  section.className = "filter-section";

  const sectionTitle = document.createElement("h4");
  sectionTitle.className = "filter-title";
  sectionTitle.textContent = title;
  section.appendChild(sectionTitle);

  options.forEach((option) => {
    const filterOption = createFilterOption(
      option.id,
      option.label,
      option.icon,
    );
    section.appendChild(filterOption);
  });

  return section;
};

export const createFilterPanel = (groups = false) => {
  const filterPanel = document.createElement("div");
  filterPanel.className = "filter-panel overlay";

  if (groups) {
    const isMyGroupsPage = location.pathname.includes("/groups/my");

    if (isMyGroupsPage) {
      const roleSection = createSection(t("common:filters.role"), [
        {
          id: "admin",
          label: t("common:filters.admin"),
          icon: "bi bi-person-gear",
        },
        {
          id: "member",
          label: t("common:filters.member"),
          icon: "bi bi-person",
        },
      ]);
      filterPanel.appendChild(roleSection);
    }

    // Visibility Section
    const visibilitySection = createSection(t("common:filters.visibility"), [
      {
        id: "private",
        label: t("common:forms.visibility.Private"),
        icon: "bi bi-lock",
      },
      {
        id: "public",
        label: t("common:forms.visibility.Public"),
        icon: "bi bi-eye",
      },
    ]);
    filterPanel.appendChild(visibilitySection);

    // Level Section
    const levelSection = createSection(t("common:filters.level"), [
      {
        id: "advanced",
        label: t("common:forms.levels.Advanced"),
        icon: "bi bi-graph-up",
      },
      {
        id: "intermediate",
        label: t("common:forms.levels.Intermediate"),
        icon: "bi bi-bar-chart",
      },
      {
        id: "beginner",
        label: t("common:forms.levels.Beginner"),
        icon: "bi bi-lightbulb",
      },
    ]);
    filterPanel.appendChild(levelSection);

    if (!isMyGroupsPage) {
      const roleSection = createSection(t("common:filters.view_options"), [
        {
          id: "joinable-only",
          label: t("common:filters.joinable_only"),
          icon: "bi bi-people",
        },
      ]);
      filterPanel.appendChild(roleSection);
    }
  } else {
    // Status Section
    const statusSection = createSection(t("common:filters.status"), [
      {
        id: "published",
        label: t("common:filters.published"),
        icon: "bi bi-check-circle",
      },
      { id: "draft", label: t("common:filters.draft"), icon: "bi bi-pencil" },
    ]);
    filterPanel.appendChild(statusSection);
  }

  return filterPanel;
};

export const openOverlayModal = async (
  overlayModalCustomClassName,
  closeBtnClasses = [],
  loadContentCallback,
  afterLoadCallback,
  skeleton = getLoader(),
) => {
  const backdrop = document.createElement("div");
  backdrop.className = "backdrop";
  backdrop.innerHTML = skeleton;
  document.body.appendChild(backdrop);

  try {
    const overlayContent = await loadContentCallback();
    if (overlayContent) {
      backdrop.innerHTML = overlayContent;
      closeBtnClasses.forEach((c) => {
        backdrop
          .querySelector(c)
          ?.addEventListener("click", () =>
            closeOverlayModal(overlayModalCustomClassName),
          );
      });

      if (afterLoadCallback) {
        afterLoadCallback(backdrop);
      }
    }
  } catch (error) {
    const isNative = error.isNative || error.data?.isNative;
    const notifType =
      error.type || error.data?.type || (isNative ? "info" : "error");
    if (!isNative) console.error(error);
    if (!isNative)
      backdrop.innerHTML = `<h2>${t("common:skeletons.error_loading")}</h2>`;
    showMessageBlock(
      error.message || t("shared:alerts.error_occurred"),
      notifType,
    );
  }
};

export const closeOverlayModal = (overlayModalClassName) => {
  const backdrop = document.querySelector(
    `.backdrop:has(.${overlayModalClassName})`,
  );
  if (backdrop) {
    backdrop.classList.add("fade-out");
    backdrop.firstElementChild.classList.add("fade-out");
    setTimeout(() => {
      backdrop.remove();
    }, 300);
  }
};

export const getLoader = () => {
  return `<!-- From Uiverse.io by gustavofusco --> 
<svg xmlns="http://www.w3.org/2000/svg" height="200px" width="200px" viewBox="0 0 200 200" class="pencil">
	<defs>
		<clipPath id="pencil-eraser">
			<rect height="30" width="30" ry="5" rx="5"></rect>
		</clipPath>
	</defs>
	<circle transform="rotate(-113,100,100)" stroke-linecap="round" stroke-dashoffset="439.82" stroke-dasharray="439.82 439.82" stroke-width="2" stroke="currentColor" fill="none" r="70" class="pencil__stroke"></circle>
	<g transform="translate(100,100)" class="pencil__rotate">
		<g fill="none">
			<circle transform="rotate(-90)" stroke-dashoffset="402" stroke-dasharray="402.12 402.12" stroke-width="30" stroke="hsl(223,90%,50%)" r="64" class="pencil__body1"></circle>
			<circle transform="rotate(-90)" stroke-dashoffset="465" stroke-dasharray="464.96 464.96" stroke-width="10" stroke="hsl(223,90%,60%)" r="74" class="pencil__body2"></circle>
			<circle transform="rotate(-90)" stroke-dashoffset="339" stroke-dasharray="339.29 339.29" stroke-width="10" stroke="hsl(223,90%,40%)" r="54" class="pencil__body3"></circle>
		</g>
		<g transform="rotate(-90) translate(49,0)" class="pencil__eraser">
			<g class="pencil__eraser-skew">
				<rect height="30" width="30" ry="5" rx="5" fill="hsl(223,90%,70%)"></rect>
				<rect clip-path="url(#pencil-eraser)" height="30" width="5" fill="hsl(223,90%,60%)"></rect>
				<rect height="20" width="30" fill="hsl(223,10%,90%)"></rect>
				<rect height="20" width="15" fill="hsl(223,10%,70%)"></rect>
				<rect height="20" width="5" fill="hsl(223,10%,80%)"></rect>
				<rect height="2" width="30" y="6" fill="hsla(223,10%,10%,0.2)"></rect>
				<rect height="2" width="30" y="13" fill="hsla(223,10%,10%,0.2)"></rect>
			</g>
		</g>
		<g transform="rotate(-90) translate(49,-30)" class="pencil__point">
			<polygon points="15 0,30 30,0 30" fill="hsl(33,90%,70%)"></polygon>
			<polygon points="15 0,6 30,0 30" fill="hsl(33,90%,50%)"></polygon>
			<polygon points="15 0,20 10,10 10" fill="hsl(223,10%,10%)"></polygon>
		</g>
	</g>
</svg>`;
};

export const enableMobileTabs = () => {
  const tabs = document.querySelectorAll("#mobile-tabs-container .tab");
  tabs.forEach((tab) => tab.style.removeProperty("pointer-events"));
};

export const getHomeSkeleton = () => {
  if (
    typeof window !== "undefined" &&
    window.matchMedia("(max-width: 48rem)").matches
  ) {
    const headerContainer = document.getElementById("mobile-tabs-container");
    if (headerContainer) {
      headerContainer.classList.remove("hidden");
      headerContainer.innerHTML = `
        <div class="mobile-inactive-tabs navigation-tabs" style="width: 100%;">
          <button type="button" class="tab active-tab exclude-btn" data-target="active-sessions" style="pointer-events: none;">${t("common:skeletons.home.active_sessions_heading")}</button>
          <button type="button" class="tab exclude-btn" data-target="recent-messages" style="pointer-events: none;">${t("common:skeletons.home.recent_messages_heading")}</button>
        </div>
      `;
    }
  }
  const sessionCard = `
  <div class="active-session loading-animation loading-card">
    <header>
      <div class="session-info" style="width: 50%">
        <h3 class="session-name" style="">
          <span
            class="loading-opacity-animation"
            style="height: 1.4rem; width: 50%"
          ></span>
          <span
            class="joined-count badge simple-badge loading-opacity-animation"
            style="height: 1.3rem; width: 30%; border-radius: 5rem"
          ></span>
        </h3>
        <span
          class="group badge loading-opacity-animation"
          style="width: 30%; margin-top: 0.2rem; justify-content: left"
        ></span>
      </div>
      <div class="meta-info" style="width: 50%">
        <span
          class="badge simple-badge loading-opacity-animation"
          style="height: 1.3rem; width: 30%; border-radius: 5rem"
        ></span>
        <span
          class="badge simple-badge loading-opacity-animation"
          style="height: 1.3rem; width: 20%; border-radius: 5rem"
        ></span>
      </div>
    </header>
    <p
      class="session-description loading-opacity-animation"
      style="width: 80%; height: 1rem"
    ></p>
    <p
      class="session-description loading-opacity-animation"
      style="width: 30%; height: 1rem"
    ></p>
    <footer class="footer">
      <div class="footer-meta-info" style="width: 50%">
        <span
          class="badge simple-badge loading-opacity-animation"
          style="height: 1.3rem; width: 30%; border-radius: 5rem"
        ></span>
        <span
          class="badge simple-badge loading-opacity-animation"
          style="height: 1.3rem; width: 30%; border-radius: 5rem"
        ></span>
      </div>
      <div
        class="action-buttons"
        data-session-id="IniGoJHQ1eLAVpUcux0D"
      >
        <div
          class="loading-opacity-animation"
          style="width: 50%; height: 2.3rem; border-radius: 0.4rem;"
        ></div>
        <div
          class="should-fill loading-opacity-animation"
          style="width: 50%; height: 2.3rem; border-radius: 0.4rem;"
        ></div>
      </div>
    </footer>
  </div>`;
  const messageCard = `<div class="recent-message card-item loading-animation loading-card">
    <header>
      <div class="profile-info" >
        <span class="icon loading-opacity-animation" style="width: 2.5rem; height: 2.5rem; border-radius: 50%;"></span>
        <div class="details" style="min-height: 100%; height: 100%; gap: calc(var(--primary-gap) / 2); ">
          <span class="user loading-opacity-animation" style="width: 120px; height: 1.1em; border-radius: 0.5em;"></span>
          <span class="group loading-opacity-animation" style="width: 80px; height: 0.9em; border-radius: 0.5em;"></span>
        </div>
      </div>
      <div class="meta-info">
        <span class="timestamp loading-opacity-animation" style="width: 60px; height: 0.9em; border-radius: 0.5em;"></span>
      </div>
    </header>
    <p class="text-message loading-opacity-animation" style="width: 100%;height: 1.2em;border-radius: 0.5em;"></p>
    <p class="text-message loading-opacity-animation" style="width: 50%;height: 1.2em;border-radius: 0.5em;"></p>
    <div class="action-buttons">
      <button type="button" class="should-fill reply-group loading-opacity-animation" style="height: 2rem; width: 130px;border-color: transparent;"></button>
      <button type="button" class="should-fill reply loading-opacity-animation" style="height: 2rem; width: 80px; border-color: transparent;"></button>
    </div>
  </div>`;
  return `
    <div class="overview-session-inactive" style="width: 100%; height: 100%; box-sizing: border-box; overflow-y: auto;">
      <div class="ready-message-container">
        <div class="ready-message">
          <h2>${t("common:skeletons.home.ready_heading")}</h2>
          <p>${t("common:skeletons.home.ready_desc")}</p>
        </div>
      </div>
      <div class="content-blocks">
        <section class="recent-messages">
          <header>
            <h2>${t("common:skeletons.home.recent_messages_heading")}</h2>
            <p>${t("common:skeletons.home.recent_messages_sub")}</p>
          </header>
          <div class="messages-container">
            ${messageCard.repeat(3)}
          </div>
        </section>
        <section class="active-sessions">
          <header>
            <div class="header-text">
              <h2>${t("common:skeletons.home.active_sessions_heading")}</h2>
              <p>${t("common:skeletons.home.active_sessions_sub")}</p>
            </div>
            <div class="active-sessions-search search">
              <div class="search-icon-container">
                <i class="bi bi-search"></i>
              </div>
              <input type="search" placeholder="${t("common:skeletons.home.search_placeholder")}" disabled />
            </div>
          </header>
          <div class="sessions-container">
            ${sessionCard.repeat(3)}
          </div>
        </section>
      </div>
    </div>
  `;
};

export const getGroupsSkeleton = (path = "") => {
  const userGroup = path.includes("/groups/my");
  if (
    typeof window !== "undefined" &&
    window.matchMedia("(max-width: 48rem)").matches
  ) {
    const headerContainer = document.getElementById("mobile-tabs-container");
    if (headerContainer) {
      headerContainer.classList.remove("hidden");
      headerContainer.innerHTML = `
        <div class="mobile-groups-tabs navigation-tabs groups-tabs" style="width: 100%;">
          <a href="/app/groups/my" class="tab route-link ${userGroup ? "active-tab" : ""} exclude-btn" style="pointer-events: none;">${t("common:tabs.my_groups")}</a>
          <a href="/app/groups/available" class="tab route-link ${!userGroup ? "active-tab" : ""} exclude-btn" style="pointer-events: none;">${t("common:tabs.available_groups")}</a>
        </div>
      `;
    }
  }
  const groupCard = `
    <div class="group-card loading-animation loading-card" style="pointer-events: none;">
      <header>
        <span class="badge loading-opacity-animation" style="width: 5rem; height: 1.5rem;"></span>
        <span class="badge loading-opacity-animation" style="width: 5rem; height: 1.5rem;"></span>
      </header>
      <div class="group-meta">
        <h3 class="group-name loading-opacity-animation" style="width: 60%; height: 1.4rem; border-radius: 0.4rem;"></h3>
        <span class="subject-value badge simple-badge loading-opacity-animation" style="width: 4rem; height: 1.4rem;"></span>
      </div>
      <div class="group-description">
        <div class="loading-opacity-animation" style="width: 100%; height: 0.9rem; margin-bottom: 0.4rem; border-radius: 0.3rem;"></div>
        <div class="loading-opacity-animation" style="width: 80%; height: 0.9rem; border-radius: 0.3rem;"></div>
      </div>
      <footer class="group-footer">
        ${
          userGroup
            ? '<span class="level-value badge loading-opacity-animation" style="width: 6rem; height: 1.5rem;"></span>'
            : ""
        }
        <div class="avatars">
          <div class="avatar loading-opacity-animation"></div>
          <div class="avatar loading-opacity-animation"></div>
          <div class="avatar loading-opacity-animation"></div>
        </div>
        ${
          !userGroup
            ? '<button class="btn-join loading-btn loading-opacity-animation" disabled style="width: 7rem; height: 2.2rem; border: none;"></button>'
            : ""
        }
      </footer>
    </div>
  `;
  return `
    <div class="main-content groups-list" style="width: 100%; height: 100%; box-sizing: border-box; overflow-y: auto;">
      ${groupCard.repeat(getLoadersCount())}
    </div>
    ${
      userGroup
        ? `<button type="button" class="mobile-create-group-btn create-group-btn exclude-btn" title="${t("common:buttons.create_group")}" aria-label="${t("common:buttons.create_group")}"><i class="bi bi-plus-lg"></i></button>`
        : ""
    }
  `;
};

export const getQuizzesSkeleton = (path = "") => {
  const isPassed = path.includes("/quizzes/passed") || path.includes("/passed");
  if (
    typeof window !== "undefined" &&
    window.matchMedia("(max-width: 48rem)").matches
  ) {
    const headerContainer = document.getElementById("mobile-tabs-container");
    if (headerContainer) {
      headerContainer.classList.remove("hidden");
      headerContainer.innerHTML = `
        <div class="mobile-quizzes-tabs navigation-tabs quizzes-tabs" style="width: 100%;">
          <a href="/app/quizzes/my" class="tab route-link ${!isPassed ? "active-tab" : ""} exclude-btn" style="pointer-events: none;">${t("common:tabs.my_quizzes")}</a>
          <a href="/app/quizzes/passed" class="tab route-link ${isPassed ? "active-tab" : ""} exclude-btn" style="pointer-events: none;">${t("common:tabs.passed")}</a>
        </div>
      `;
    }
  }
  const quizCard = isPassed
    ? `
    <div class="quiz-card loading-animation loading-card" style="pointer-events: none;">
        <div class="quiz-title-container info-container">
            <label class="quiz-title-label">
                <span class="icon-box"><i class="bi bi-card-text"></i></span>
                ${t("common:quiz_card.quiz_title")}
            </label>
            <div class="quiz-title content loading-opacity-animation"></div>
        </div>
        <div class="group-name-container info-container">
            <label class="group-name-label">
                <span class="icon-box">
                    <i class="bi bi-people"></i>
                </span>
                ${t("common:quiz_card.group_name")}
            </label>
            <div class="group-name content loading-opacity-animation"></div>
        </div>
        <div class="session-name-container info-container">
        <label class="session-name-label">
        <span class="icon-box">
        <i class="bi bi-journal-bookmark"></i>
        </span>
        ${t("common:quiz_card.session_name")}
        </label>
        <div class="session-name content loading-opacity-animation"></div>
        </div>
        <div class="submitted-at-container info-container">
            <label class="submitted-at-label">
                <span class="icon-box">
                    <i class="bi bi-calendar-check"></i>
                </span>
                ${t("common:quiz_card.submitted_at")}
            </label>
            <div class="submitted-at content loading-opacity-animation"></div>
        </div>
        <div class="score-container info-container">
            <label class="score-label">
                <span class="icon-box">
                    <i class="bi bi-trophy"></i>
                </span>
                ${t("common:quiz_card.score")}
            </label>
            <div class="score content loading-opacity-animation"></div>
        </div>
        <div class="action-btns">
            <button style="pointer-events: none; height: 2.2rem; width: 7rem;" disabled class="loading-btn loading-opacity-animation">
            </button>
            <button style="pointer-events: none; height: 2.2rem; width: 7rem;" disabled class="loading-btn loading-opacity-animation" >
            </button>
        </div>
    </div>`
    : `
    <div class="quiz-card loading-animation loading-card" style="pointer-events: none;">
      <header class="quiz-card-header">
        <span class="badge gray-badge loading-opacity-animation" style="width: 5rem; height: 1.5rem;"></span>
        <button type="button" class="exclude-btn quiz-card-menu-btn" disabled>
          <i class="bi bi-three-dots-vertical"></i>
        </button>
      </header>
      <div class="quiz-title-container info-container">
        <label class="quiz-title-label">
          <span class="icon-box"><i class="bi bi-card-text"></i></span>
          ${t("common:quiz_card.quiz_title")}
        </label>
        <div class="quiz-title content loading-opacity-animation"></div>
      </div>
      <div class="questions-count-container info-container small-container">
        <label class="questions-count-label">
          <span class="icon-box"><i class="bi bi-question-circle"></i></span>
          ${t("common:quiz_card.questions")}
        </label>
        <span class="count content loading-opacity-animation"></span>
      </div>
      <div class="shared-in-container info-container">
        <label class="shared-in-label">
          <span class="icon-box"><i class="bi bi-people"></i></span>
          ${t("common:quiz_card.shared_in")}
        </label>
        <div class="content">
          <span class="count content loading-opacity-animation"></span>
        </div>
      </div>
      <div class="subject-container info-container small-container">
        <label class="subject-label">
          <span class="icon-box"><i class="bi bi-book"></i></span>
          ${t("common:quiz_card.subject")}
        </label>
        <span class="subject content loading-opacity-animation"></span>
      </div>
    </div>`;
  return `
    <div class="quizzes-list" style="width: 100%; height: 100%; box-sizing: border-box; overflow-y: auto;">
      ${quizCard.repeat(getLoadersCount())}
    </div>
        ${
          !isPassed
            ? `<button type="button" class="mobile-create-quiz-btn create-quiz-btn exclude-btn" title="${t("common:buttons.create_quiz")}" aria-label="${t("common:buttons.create_quiz")}"><i class="bi bi-plus-lg"></i></button>`
            : ""
        }
  `;
};

export const getSettingsSkeleton = () => {
  return `
    <div class="settings-wrapper">
      <div class="settings-content">
        <header class="settings-header">
          <h2>${t("common:skeletons.settings.my_account")}</h2>
          <div class="tabs" style="pointer-events: none;">
            <label class="exclude-btn active tab profile-tab">
              <input type="radio" name="tab" class="profile" checked disabled />
              ${t("common:skeletons.settings.tabs.profile")}
            </label>
            <label class="exclude-btn tab email-tab">
              <input type="radio" name="tab" class="email" disabled />
              ${t("common:skeletons.settings.tabs.email")}
            </label>
            <label class="exclude-btn tab password-tab">
              <input type="radio" name="tab" class="password" disabled />
              ${t("common:shared_terms.password")}
            </label>
            <label class="exclude-btn tab delete-account-tab">
              <input type="radio" name="tab" class="delete-account" disabled />
              ${t("common:shared_terms.close_account")}
            </label>
          </div>
        </header>

        <div class="content">
          <!-- Personal Info -->
          <div class="profile-tab-content tab-content" style="pointer-events: none;">
            <header>
              <h3>${t("common:skeletons.settings.profile_title")}</h3>
              <span>${t("common:skeletons.settings.profile_subtitle")}</span>
            </header>
            <form class="profile-form">
              <div class="avatar-container">
                <label class="avatar">
                  <div class="loading-opacity-animation" style="width: 100%; height: 100%; border-radius: 0.5rem;"></div>
                </label>
                <span class="caption hidden" style="visibility: hidden;">
                  ${t("common:skeletons.settings.profile_caption")}
                </span>
                <span class="error"></span>
              </div>
              <div class="info-fields">
                <div class="fields">
                  <label for="full-name">${t("common:shared_terms.full_name")}</label>
                  <div class="field-container full-name-field">
                    <div class="field-icon-container">
                      <span class="icon-box">
                        <i class="bi bi-person"></i>
                      </span>
                    </div>
                    <div class="input">
                      <span class="loading-opacity-animation" style="width: 60%; height: 1.2rem; border-radius: 0.3rem;"></span>
                    </div>
                  </div>

                  <label for="uid">${t("common:skeletons.settings.uid")}</label>
                  <div class="field-container uid-field">
                    <div class="field-icon-container">
                      <span class="icon-box">
                        <i class="bi bi-fingerprint"></i>
                      </span>
                    </div>
                    <div class="input">
                      <span class="loading-opacity-animation" style="width: 40%; height: 1.2rem; border-radius: 0.3rem;"></span>
                    </div>
                  </div>
                </div>

                <div class="action-btns">
                  <button type="button" class="blue-btn modify-btn" disabled>
                    <i class="bi bi-pencil"></i>
                    ${t("common:skeletons.settings.modify_btn")}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `;
};

export const getMainSkeleton = () => {
  return `
    <div class="main-skeleton-container" style="display: flex; flex-direction: column; gap: var(--primary-gap, 1.5rem); padding: var(--primary-gap, 1.5rem); width: 100%; height: 100%; box-sizing: border-box; overflow: hidden;">
      <!-- Top banner / header skeleton -->
      <div class="loading-animation" style="width: 100%; height: 5rem; border-radius: 0.75rem; border: 1px solid var(--container-border-color); flex-shrink: 0;"></div>
      
      <!-- Divided content skeleton (2 column layout) -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: var(--primary-gap, 1.5rem); flex: 1;">
        <!-- Left block -->
        <div style="display: flex; flex-direction: column; gap: 1rem; padding: 1.25rem; border-radius: 0.75rem; border: 1px solid var(--container-border-color);">
          <div class="loading-animation" style="width: 35%; height: 1.5rem; border-radius: 0.4rem;"></div>
          <div style="display: flex; flex-direction: column; gap: 0.75rem; margin-top: 0.5rem;">
            <div class="loading-animation" style="width: 100%; height: 4.5rem; border-radius: 0.5rem;"></div>
            <div class="loading-animation" style="width: 100%; height: 4.5rem; border-radius: 0.5rem;"></div>
            <div class="loading-animation" style="width: 85%; height: 4.5rem; border-radius: 0.5rem;"></div>
          </div>
        </div>
        
        <!-- Right block -->
        <div style="display: flex; flex-direction: column; gap: 1rem; padding: 1.25rem; border-radius: 0.75rem; border: 1px solid var(--container-border-color);">
          <div class="loading-animation" style="width: 45%; height: 1.5rem; border-radius: 0.4rem;"></div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 0.5rem;">
            <div class="loading-animation" style="height: 6rem; border-radius: 0.5rem;"></div>
            <div class="loading-animation" style="height: 6rem; border-radius: 0.5rem;"></div>
          </div>
          <div class="loading-animation" style="width: 100%; height: 5.5rem; border-radius: 0.5rem; margin-top: 0.5rem;"></div>
          <div class="loading-animation" style="width: 75%; height: 4rem; border-radius: 0.5rem;"></div>
        </div>
      </div>
    </div>
  `;
};

export const getGroupChatSkeleton = () => {
  return `
    <div class="group-container" style="pointer-events: none;">
      <aside class="group-left-side-bar close">
        <aside class="top-bar">
          <h2 class="side-bar-title">
            <span class="badge simple-badge"></span>
          </h2>
        </aside>
        <div class="left-side-bar-content"></div>
      </aside>
      <div class="chat">
        <div class="top-bar">
          <button
            type="button"
            class="exclude-btn show-info-btn"
            disabled
          >
            <i class="bi bi-info-circle"></i>
          </button>
          <h2 class="title"><span class="loading-opacity-animation" style="width: 12rem; height: 1.5rem; display: inline-block; border-radius: 0.3rem;"></span></h2>
          <div>
            <button
              type="button"
              class="exclude-btn group-chat-menu-btn"
              disabled
            >
              <i class="bi bi-three-dots-vertical"></i>
            </button>
          </div>
        </div>
        <div class="chat-messages skeleton" style="padding-block: var(--primary-gap); padding-inline: 15%;">
          <div>
            <div style="display: flex; flex-direction: column">
              <div class="message-sent">
                <div class="messages">
                  <div class="first-message-sent-text loading-animation">
                    <p class="loading-opacity-animation" style="width: 5rem"></p>

                    <span class="message-info loading-opacity-animation" style="width: 2rem"></span>
                  </div>
                </div>
              </div>
              <div class="message-received">
                <div class="avatar loading-opacity-animation"></div>

                <div class="messages">
                  <div class="first-message-received-text loading-animation">
                    <span class="username loading-opacity-animation" style="width: 60%"></span>

                    <div class="media-message message-media-preview">
                      <div class="media-div loading-opacity-animation" style="width: 100%; height: auto; aspect-ratio: 16/9">
                      </div>

                      <button type="button" class="expand-btn loading-opacity-animation" style="width: 2rem" disabled></button>
                      <a class="download-btn button loading-opacity-animation" style="width: 2rem" disabled></a>
                    </div>

                    <span class="message-info loading-opacity-animation" style="width: 10%"></span>
                  </div>

                  <div class="message-received-text card-item">
                    <p class="loading-opacity-animation" style="width: 5rem"></p>
                    <span class="message-info loading-opacity-animation" style="width: 2rem"></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="input-message-container">
          <div class="icons">
            <label class="should-fill">
              <i class="bi bi-image"></i>
            </label>
            <label>
              <i class="bi bi-paperclip"></i>
            </label>
            <div class="emoji-picker">
              <button
                type="button"
                class="exclude-btn should-fill emoji-button"
                disabled
              >
                <i class="bi bi-emoji-smile"></i>
              </button>
            </div>
          </div>
          <textarea placeholder="${t("common:shared_terms.type_a_message")}" id="input-message" class="input-message"></textarea>
          <button type="button" class="send-btn exclude-btn should-fill" disabled>
            <i class="bi bi-send"></i>
          </button>
        </div>
      </div>
    </div>
  `;
};

export const getQuizEditorSkeleton = () => {
  if (
    typeof window !== "undefined" &&
    window.matchMedia("(max-width: 48rem)").matches
  ) {
    const headerContainer = document.getElementById("mobile-tabs-container");
    if (headerContainer) {
      headerContainer.classList.remove("hidden");
      headerContainer.innerHTML = `
        <div class="mobile-quiz-editor-tabs navigation-tabs" style="width: 100%;">
          <button type="button" class="tab active-tab exclude-btn" data-target="quiz-editor">${t("common:titles.quiz_editor")}</button>
          <button type="button" class="tab exclude-btn" data-target="questions-list">${t("common:quizzes_tabs.questions_list")}</button>
        </div>
      `;
    }
  }
  return `
    <div class="quiz-editor" style="pointer-events: none;">
      <section class="questions-panel">
        <header class="questions-header">
          <h4 class="panel-title">
            ${t("common:quiz_card.questions")}
            <span class="count badge simple-badge">0</span>
          </h4>
          <button
            type="button"
            class="add-question-btn exclude-btn should-fill"
            disabled
          >
            <i class="bi bi-plus-circle"></i>
          </button>
        </header>
        <div class="questions-list">
          ${[1, 2, 3]
            .map(
              (idx) => `
            <div class="question">
              ${idx === 1 ? '<div class="drop-target"></div>' : ""}
              <a class="question-card" style="pointer-events: none;">
                <header class="question-card-header">
                  <h4>
                    <span class="icon-box">
                      <i class="bi bi-patch-question"></i>
                    </span>
                    <span class="question-count counter">${t("common:shared_quizzes.question_num", { num: idx })}</span>
                  </h4>
                  <button
                    type="button"
                    class="exclude-btn drag-handle"
                    disabled
                  >
                    <i class="drag-icon"></i>
                  </button>
                </header>
                <div class="loading-opacity-animation" style="width: 90%; height: 0.9rem; margin: 0.5rem 0; border-radius: 0.3rem;"></div>
                <footer class="question-card-footer">
                  <span class="choices-count">${t("common:shared_quizzes.choices_count", { count: 4 })}</span>
                  <button
                    type="button"
                    class="delete-question-btn exclude-btn"
                    disabled
                  >
                    <i class="bi bi-trash3"></i>
                  </button>
                </footer>
              </a>
              <div class="drop-target"></div>
            </div>
          `,
            )
            .join("")}
        </div>
      </section>
      <section class="question-editor-panel">
        <header class="editor-header">
          <div class="subject">
            <div class="container">
              <span class="subject-label label">
                <span class="icon-box">
                  <i class="bi bi-book"></i>
                </span>
                ${t("common:skeletons.quiz_editor.subject_label")}
              </span>
              <span class="loading-opacity-animation" style="width: 6rem; height: 1.2rem; border-radius: 0.3rem;"></span>
              <button
                class="exclude-btn edit-subject-btn"
                type="button"
                disabled
              >
                <i class="bi bi-pencil-square"></i>
              </button>
            </div>
          </div>
          <div class="title">
            <div class="container">
              <div class="loading-opacity-animation" style="width: 12rem; height: 1.4rem; border-radius: 0.3rem;"></div>
              <button
                class="exclude-btn edit-title-btn"
                type="button"
                disabled
              >
                <i class="bi bi-pencil-square"></i>
              </button>
            </div>
          </div>
          <span class="shared-in">
            <span class="shared-in-label label">
              <span class="icon-box">
                <i class="bi bi-people"></i>
              </span>
              ${t("common:skeletons.quiz_editor.shared_in_label")}
            </span>
            <span class="loading-opacity-animation" style="width: 5rem; height: 1.2rem; border-radius: 0.3rem;"></span>
          </span>
        </header>
        <div class="questions-list">
          ${[1, 2]
            .map(
              (idx) => `
            <div class="question-editor-box">
              <header class="question-header">
                <h4>
                  <span class="icon-box">
                    <i class="bi bi-patch-question"></i>
                  </span>
                  <span class="question-count counter">${t("common:shared_quizzes.question_num", { num: idx })}</span>
                </h4>
                <button
                  type="button"
                  class="delete-question-btn exclude-btn"
                  disabled
                >
                  <i class="bi bi-trash3"></i>
                </button>
              </header>
              <div class="loading-opacity-animation" style="width: 100%; height: 45px; border-radius: 0.4rem; margin-bottom: 1rem;"></div>
              <div class="choices-section">
                <h5 class="choices-title section-title">
                  <span class="icon-box">
                    <i class="bi bi-list-ol"></i>
                  </span>
                  ${t("common:skeletons.quiz_editor.choices_title")}
                </h5>
                <div class="choices-list">
                  ${[0, 1]
                    .map(
                      (cidx) => `
                    <div class="choice">
                      <span class="choice-label">${String.fromCharCode(65 + cidx)}</span>
                      <div class="choice-input input" style="display: flex; align-items: center;">
                        <span class="loading-opacity-animation" style="width: ${cidx === 0 ? "55%" : "40%"}; height: 1.2rem; border-radius: 0.3rem;"></span>
                      </div>
                      <button
                        type="button"
                        class="delete-choice-btn exclude-btn"
                        disabled
                      >
                        <i class="bi bi-trash3"></i>
                      </button>
                    </div>
                  `,
                    )
                    .join("")}
                </div>
                <button type="button" class="add-choice-btn small-btn" disabled>
                  <i class="bi bi-plus-circle"></i>
                  ${t("common:skeletons.quiz_editor.add_choice")}
                </button>
                <hr />
                <h5 class="correct-answer-title section-title">
                  <span class="icon-box">
                    <i class="bi bi-check-circle"></i>
                  </span>
                  ${t("common:skeletons.quiz_editor.correct_answer_title")}
                </h5>
                <div class="correct-answer-select">
                  <div class="icon-box">
                    <i class="bi bi-check-circle"></i>
                  </div>
                  <div class="select-trigger input" style="display: flex; align-items: center;">
                    <button type="button" class="exclude-btn open-drop-down-btn" disabled style="display: flex; align-items: center; gap: 0.5rem;">
                      <span class="loading-opacity-animation" style="width: 1.5rem; height: 1.2rem; border-radius: 0.2rem;"></span>
                      <i class="bi bi-chevron-down"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          `,
            )
            .join("")}
          <button type="button" class="exclude-btn add-question-btn" disabled>
            <i class="bi bi-plus-circle"></i>
            <hr />
          </button>
        </div>
      </section>
    </div>
  `;
};

export const getPageSkeleton = (path = "") => {
  const isHome =
    path.includes("/home") ||
    path === "/" ||
    path === "/app" ||
    path === "/app/";
  const isGroups = path.includes("/groups");
  const isQuizzes = path.includes("/quizzes");
  if (!isHome && !isGroups && !isQuizzes && typeof document !== "undefined") {
    const headerContainer = document.getElementById("mobile-tabs-container");
    if (headerContainer) {
      headerContainer.classList.add("hidden");
      headerContainer.innerHTML = "";
    }
  }
  if (isHome) {
    return getHomeSkeleton();
  }
  if (path.includes("/chat")) {
    return getGroupChatSkeleton();
  }
  if (path.includes("/edit")) {
    return getQuizEditorSkeleton();
  }
  if (path.includes("/quiz-play")) {
    return getQuizPlaySkeleton();
  }
  if (path.includes("/groups")) {
    return getGroupsSkeleton(path);
  }
  if (path.includes("/quizzes")) {
    return getQuizzesSkeleton(path);
  }
  if (path.includes("/settings")) {
    return getSettingsSkeleton();
  }
  return getMainSkeleton();
};

export const getQuizPlaySkeleton = () => {
  return `
    <div class="quiz-view" style="pointer-events: none;">
      <a class="button close-btn exclude-btn">
        <i class="bi bi-x-lg"></i>
      </a>
      <div class="questions-view">
        <header class="quiz-header">
          <div class="timer">
            <span class="time-left">
              <span class="icon-box"><i class="bi bi-stopwatch-fill"></i></span>
              ${t("common:skeletons.quiz_play.time_left")}
            </span>
            <div class="timer-digits">
              <span class="loading-opacity-animation" style="width: 4rem; height: 1.2rem; border-radius: 0.2rem; display: inline-block;"></span>
            </div>
          </div>
          <h3 class="quiz-title"><span class="loading-opacity-animation" style="width: 15rem; height: 1.5rem; border-radius: 0.3rem; display: inline-block;"></span></h3>
        </header>
        <div class="question-view">
          <header class="question-view-header">
            <h4>
              <span class="icon-box">
                <i class="bi bi-patch-question"></i>
              </span>
              <span class="loading-opacity-animation" style="width: 8rem; height: 1.2rem; border-radius: 0.3rem; display: inline-block; margin-inline-start: 0.5rem;"></span>
            </h4>
            <button type="button" class="gray-btn skip-btn" disabled>${t("common:skeletons.quiz_play.skip")}</button>
          </header>
          <div class="question-body">
            <h4><span class="loading-opacity-animation" style="width: 80%; height: 1.4rem; border-radius: 0.3rem; display: inline-block; margin-bottom: 1rem;"></span></h4>
            <div class="question-choices">
              <span class="select-answer-label">${t("common:skeletons.quiz_play.select_answer")}</span>
              <div class="choices-list">
                ${[0, 1, 2, 3]
                  .map(
                    (idx) => `
                  <label class="choice" style="pointer-events: none;">
                    <input type="radio" disabled />
                    <span class="choice-label">${String.fromCharCode(65 + idx)}</span>
                    <span class="choice-text loading-opacity-animation" style="width: ${60 - idx * 10}%; height: 1.2rem; border-radius: 0.3rem; display: inline-block; margin-left: .8rem;"></span>
                  </label>
                `,
                  )
                  .join("")}
              </div>
            </div>
          </div>
          <footer class="question-actions-row">
            <div class="prev action">
              <button class="prev-btn gray-btn" disabled>${t("common:skeletons.quiz_play.prev")}</button>
            </div>
            <div class="next action">
              <button class="next-btn blue-btn" disabled>${t("common:skeletons.quiz_play.next")}</button>
            </div>
          </footer>
        </div>
      </div>
    </div>
  `;
};

const createConfirmationBox = (
  type = "exclamation",
  title,
  message,
  cancelButtonText = t("common:modals.cancel"),
  confirmButtonText = t("common:modals.confirm"),
) => {
  return `<div class="overlay-model confirmation-box ${type}">
        <i class="bi bi-${
          type === "confirmation" ? "check-circle" : "exclamation-triangle"
        }-fill"></i>
        <h4>${title}</h4>
        <p>${message}</p>
        <div class="buttons">
          <button type="button" class="confirmation-box-btn-cancel should-fill">
            ${cancelButtonText}
          </button>
          <button type="button" class="confirmation-box-btn-confirm should-fill">
            ${confirmButtonText}
          </button>
        </div>
      </div>`;
};

export const showConfirmationBox = async (
  type,
  title,
  message,
  cancelButtonText = t("common:modals.cancel"),
  confirmButtonText = t("common:modals.confirm"),
) => {
  const promise = new Promise((res) => {
    openOverlayModal(
      "confirmation-box",
      [".confirmation-box-btn-cancel", ".confirmation-box-btn-confirm"],
      () => {
        const confirmationBox = createConfirmationBox(
          type ? type : "exclamation",
          title,
          message,
          cancelButtonText,
          confirmButtonText,
        );
        return confirmationBox;
      },
      () => {
        const canselBtn = document.querySelector(
          ".confirmation-box-btn-cancel",
        );
        const confirmBtn = document.querySelector(
          ".confirmation-box-btn-confirm",
        );

        canselBtn.addEventListener("click", () => {
          res(false);
        });

        confirmBtn.addEventListener("click", () => {
          res(true);
        });
      },
    );
  });

  return promise;
};

export const scrollToView = (e, questionLink) => {
  e.preventDefault();
  const target = document.getElementById(`${questionLink.href.split("#")[1]}`);
  if (target) {
    target.scrollIntoView({
      behavior: "smooth",
    });
    // Use a more descriptive property and class name
    if (target.scrollHighlightTimer) {
      clearTimeout(target.scrollHighlightTimer);
    }
    target.classList.add("highlighted-in-view");
    target.scrollHighlightTimer = setTimeout(() => {
      target.classList.remove("highlighted-in-view");
      clearTimeout(target.scrollHighlightTimer);
    }, 1000);
  }
};

export const formatNumber = (number) => {
  if (number === null || number === undefined || isNaN(number)) return "0";
  const absNum = Math.abs(number);
  if (absNum >= 1e9) return (number / 1e9).toFixed(1).replace(/\.0$/, "") + "B";
  if (absNum >= 1e6) return (number / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
  if (absNum >= 1e3) return (number / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
  return number.toString();
};

export const toReadableDate = (TimeOrDate, type) => {
  const date = new Date(TimeOrDate);
  const locale = t("common:locale", { defaultValue: "en-US" });

  if (type === "short") {
    return date.toLocaleString(locale, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  }

  return date.toLocaleString(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

export const initEmailActionTriggers = async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const inviteId = urlParams.get("inviteId");
  const sessionId = urlParams.get("sessionId");
  const groupName = urlParams.get("groupName") || "the group";
  const sessionName = urlParams.get("sessionName") || "a live session";

  if (inviteId) {
    window.history.replaceState({}, document.title, window.location.pathname);
    const res = await showConfirmationBox(
      "confirmation",
      t("notifications:alerts.group_invitation", {
        defaultValue: "Group Invitation",
      }),
      t("notifications:alerts.accept_invite_desc", {
        groupName,
        defaultValue: `You have been invited to join "${groupName}". Would you like to accept this invitation?`,
      }),
      t("common:shared_terms.cancel", { defaultValue: "Cancel" }),
      t("common:shared_terms.accept", { defaultValue: "Accept" }),
    );

    if (res) {
      handleApiAction(
        "/join-group",
        { groupId: inviteId, isInvite: true },
        null,
        {
          successMsg: t("notifications:alerts.joined_group_success", {
            defaultValue: "Successfully joined the group!",
          }),
          onSuccess: () => {
            window.location.href = `/app/groups/my/${inviteId}/chat`;
          },
        },
      );
    }
  }

  if (sessionId) {
    const match = window.location.pathname.match(
      /\/app\/groups\/my\/([^/]+)\/chat/,
    );
    const groupId = match ? match[1] : null;

    if (groupId) {
      window.history.replaceState({}, document.title, window.location.pathname);
      const res = await showConfirmationBox(
        "confirmation",
        t("common:shared_terms.live_session", { defaultValue: "Live Session" }),
        t("common:shared_terms.join_session_desc", {
          sessionName,
          groupName,
          defaultValue: `A live session "${sessionName}" is happening right now in "${groupName}". Would you like to join?`,
        }),
        t("common:shared_terms.cancel", { defaultValue: "Cancel" }),
        t("common:shared_terms.join", { defaultValue: "Join Session" }),
      );

      if (res) {
        handleApiAction("/join-session", { sessionId }, null, {
          onSuccess: () => {
            window.location.reload();
          },
        });
      }
    }
  }
};

// --- Refactored from main.js ---
export const preventDragOver = (e) => e.preventDefault();

export const handleIconsHoverEnter = (e) => handelIconsHover(e, true);
export const handleIconsHoverLeave = (e) => handelIconsHover(e, false);

export const initThemeToggle = () => {
  const themeBtns = document.querySelectorAll(
    ".toggle-container, #mobile-theme-toggle-btn",
  );
  themeBtns.forEach((btn) => {
    initThemeToggleBtn(btn);
  });
};

export const initMobileDrawer = () => {
  const mobileMasterMenuBtn = document.querySelector(".mobile-master-menu-btn");
  const mobileMasterDrawer = document.querySelector(".mobile-master-drawer");
  const mobileDrawerCloseBtn = document.querySelector(
    ".mobile-drawer-close-btn",
  );
  const mobileDrawerBackdrop = document.querySelector(
    ".mobile-drawer-backdrop",
  );
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
};

export const handlePopState = () => {
  toggleActiveLink(location.pathname);
  updateMain(location.href);
};

export const initSidebarTitleSync = () => {
  const sidebarTitleEl = document.querySelector(".sidebar-title");
  const mobilePageTitleEl = document.querySelector(".mobile-page-title");
  const mobileBackBtn = document.querySelector(".mobile-back-btn");

  if (sidebarTitleEl && mobilePageTitleEl) {
    const syncTitle = () => {
      const linkEl = sidebarTitleEl?.querySelector("a");
      if (linkEl && mobileBackBtn) {
        const returnHref = linkEl.getAttribute("href") || "/app/home";
        mobileBackBtn.setAttribute("href", returnHref);
        mobileBackBtn.classList.remove("hidden");
        const titleText = linkEl.textContent.trim();
        if (
          titleText
            .toLowerCase()
            .includes(t("common:group_chat", { defaultValue: "group chat" }))
        ) {
          mobilePageTitleEl.innerHTML = `
            <button
              type="button"
              class="exclude-btn show-info-btn"
            >
              <i class="bi bi-info-circle"></i>
              ${t("common:group_chat", { defaultValue: "Group Chat" })}
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
};

export const initMobileSearch = () => {
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
      topSideBarMiddle?.querySelector(".search-container")
    ) {
      searchContentEl = topSideBarMiddle;
    }

    if (mobileSearchBox && searchContentEl) {
      if (!mobileSearchBox.contains(searchContentEl)) {
        mobileSearchBox.appendChild(searchContentEl);
      }
      mobileSearchBox.classList.toggle("hidden");
      if (!mobileSearchBox.classList.contains("hidden")) {
        const searchInput = mobileSearchBox?.querySelector(
          "input[type='search']",
        );
        searchInput?.focus();
      }
    }
  });

  document.addEventListener("click", (e) => {
    if (
      mobileSearchBox &&
      !mobileSearchBox.classList.contains("hidden") &&
      !mobileSearchBox.contains(e.target) &&
      !mobileSearchBtn?.contains(e.target) &&
      e.target.tagName !== "HTML"
    ) {
      mobileSearchBox.classList.add("hidden");
    }
  });
};

export const getSidebarSkeleton = (route) => {
  switch (route) {
    case "/group-info":
      return `
        <div class="group-info fade-in-template">
          <div class="group-name-info-box info-box loading-animation">
            <div class="group-name-container info-container">
              <span class="label">
                <span class="group-info-icon icon-box">
                  <i class="bi bi-people"></i>
                  <i class="bi bi-info-circle"></i>
                </span>
                ${t("common:quiz_card.group_name")}
              </span>
              <span class="group-name-value value content loading-opacity-animation" style="width: 60%; height: 1.2rem; display: inline-block; margin-inline: auto;"></span>
            </div>
          </div>
          <div class="group-description-info-box info-box loading-animation">
            <div class="group-description-container info-container">
              <span class="label">
                <span class="group-description-icon icon-box">
                  <i class="bi bi-people"></i>
                  <i class="bi bi-info-circle"></i>
                </span>
                ${t("group-chat:info.group_description")}
              </span>
              <div class="loading-opacity-animation" style="width: 100%; height: 1rem; margin-bottom: 0.5rem; border-radius: 0.3rem;"></div>
              <div class="loading-opacity-animation" style="width: 70%; height: 1rem; border-radius: 0.3rem;"></div>
            </div>
          </div>
          <div class="subject-level dual-box">
            <div class="subject-info-box info-box loading-animation">
              <div class="subject-container info-container">
                <span class="label">
                  <span class="subject-icon icon-box">
                    <i class="bi bi-journal-text"></i>
                  </span>
                  ${t("common:quiz_card.subject")}
                </span>
                <span class="subject-value value content loading-opacity-animation" style="width: 50%; height: 1.2rem; display: inline-block; margin-inline: auto;"></span>
              </div>
            </div>
            <div class="level-info-box info-box loading-animation">
              <div class="level-container info-container">
                <span class="label">
                  <span class="level-icon icon-box">
                    <i class="bi bi-graph-up"></i>
                  </span>
                  ${t("common:filters.level")}
                </span>
                <span class="level-value value content loading-opacity-animation" style="width: 50%; height: 1.2rem; display: inline-block; margin-inline: auto;"></span>
              </div>
            </div>
          </div>
          <div class="visibility-max-members dual-box">
            <div class="visibility-info-box info-box loading-animation">
              <div class="visibility-container info-container">
                <span class="label">
                  <span class="visibility-icon icon-box">
                    <i class="bi bi-eye"></i>
                  </span>
                  ${t("common:filters.visibility")}
                </span>
                <span class="visibility-value value content loading-opacity-animation" style="width: 50%; height: 1.2rem; display: inline-block; margin-inline: auto;"></span>
              </div>
            </div>
            <div class="max-members-info-box info-box loading-animation">
              <div class="max-members-container info-container">
                <span class="label">
                  <span class="max-members-icon icon-box">
                    <i class="bi bi-person-plus"></i>
                  </span>
                  ${t("common:shared_terms.max_members")}
                </span>
                <span class="max-members-value value content loading-opacity-animation" style="width: 30%; height: 1.2rem; display: inline-block; margin-inline: auto;"></span>
              </div>
            </div>
          </div>
          <div class="creation-date-admin dual-box">
            <div class="creation-date-info-box info-box loading-animation">
              <div class="creation-date-container info-container">
                <span class="label">
                  <span class="creation-date-icon icon-box">
                    <i class="bi bi-calendar"></i>
                  </span>
                  ${t("group-chat:sidebar_info.creation_date")}
                </span>
                <span class="creation-date-value value content loading-opacity-animation" style="width: 70%; height: 1.2rem; display: inline-block; margin-inline: auto;"></span>
              </div>
            </div>
            <div class="admin-info-box info-box loading-animation">
              <div class="admin-container info-container">
                <span class="label">
                  <span class="admin-icon icon-box">
                    <i class="bi bi-person-gear"></i>
                  </span>
                  ${t("common:filters.admin")}
                </span>
                <span class="admin-value value content" style="display: flex; align-items: center;">
                  <div class="avatar loading-opacity-animation" style="width: 2rem; height: 2rem; border-radius: 50%;"></div>
                  <span class="loading-opacity-animation" style="width: 60%; height: 1.2rem; display: inline-block; margin-inline-start: 10px;"></span>
                </span>
              </div>
            </div>
          </div>
          <div class="members info-box loading-animation">
            <div class="members-container info-container">
              <span class="label">
                <span class="members-icon icon-box">
                  <i class="bi bi-people"></i>
                </span>
                ${t("common:shared_terms.members")}
                <span class="count badge simple-badge loading-opacity-animation" style="width: 2rem; height: 1.2rem;"></span>
              </span>
              <div class="members-list">
                ${Array(4)
                  .fill(0)
                  .map(
                    () => `
                <div class="member">
                  <div class="avatar loading-opacity-animation" style="width: 2.5rem; height: 2.5rem; border-radius: 50%;"></div>
                  <span class="loading-opacity-animation" style="width: 60px; height: 1rem; border-radius: 0.3rem;"></span>
                </div>
                `,
                  )
                  .join("")}
              </div>
            </div>
          </div>
          <div class="action-btns loading-animation" style="margin-top: 1rem; width: 50%; margin-inline: auto;">
            <button class="red-btn leave-group-btn loading-opacity-animation" style="pointer-events: none; width: 100%; border: none; height: 2.5rem;"></button>
          </div>
        </div>
      `;
    case "/session-info":
      return `
        <div class="session-info fade-in-template">
          <div class="session-name-info-box info-box loading-animation">
            <div class="session-name-container info-container">
              <span class="label">
                <span class="session-info-icon icon-box">
                  <i class="bi bi-clock-history"></i>
                </span>
                ${t("common:quiz_card.session_name")}
              </span>
              <span class="session-name-value value content loading-opacity-animation" style="width: 60%; height: 1.2rem; display: inline-block; margin-inline: auto;"></span>
            </div>
          </div>
          <div class="session-description-info-box info-box loading-animation">
            <div class="session-description-container info-container">
              <span class="label">
                <span class="session-description-icon icon-box">
                  <i class="bi bi-journal-text"></i>
                </span>
                ${t("group-chat:modals.session_description_placeholder")}
              </span>
              <div class="loading-opacity-animation" style="width: 100%; height: 1rem; margin-bottom: 0.5rem; border-radius: 0.3rem; margin-inline: auto;"></div>
              <div class="loading-opacity-animation" style="width: 70%; height: 1rem; border-radius: 0.3rem; margin-inline: auto;"></div>
            </div>
          </div>
          <div class="quiz-info-box info-box loading-animation">
            <div class="quiz-container info-container">
              <span class="label">
                <span class="quiz-icon icon-box">
                  <i class="bi bi-question-circle"></i>
                </span>
                ${t("common:shared_terms.quiz")}
              </span>
              <span class="quiz-value value content loading-opacity-animation" style="width: 50%; height: 1.2rem; display: inline-block; margin-inline: auto;"></span>
            </div>
          </div>
          <div class="timing-metrics dual-box">
            <div class="start-info-box info-box loading-animation">
              <div class="start-container info-container">
                <span class="label">
                  <span class="start-icon icon-box">
                    <i class="bi bi-play-circle"></i>
                  </span>
                  ${t("common:shared_terms.start")}
                </span>
                <span class="start-value value content loading-opacity-animation" style="width: 70%; height: 1.2rem; display: inline-block; margin-inline: auto;"></span>
              </div>
            </div>
            <div class="end-info-box info-box loading-animation">
              <div class="end-container info-container">
                <span class="label">
                  <span class="end-icon icon-box">
                    <i class="bi bi-stopwatch"></i>
                  </span>
                  ${t("common:shared_terms.end")}
                </span>
                <span class="end-value value content loading-opacity-animation" style="width: 70%; height: 1.2rem; display: inline-block; margin-inline: auto;"></span>
              </div>
            </div>
          </div>
          <div class="timing-metrics dual-box">
            <div class="duration-info-box info-box loading-animation">
              <div class="duration-container info-container">
                <span class="label">
                  <span class="duration-icon icon-box">
                    <i class="bi bi-clock"></i>
                  </span>
                  ${t("common:shared_terms.duration")}
                </span>
                <span class="duration-value value content loading-opacity-animation" style="width: 50%; height: 1.2rem; display: inline-block; margin-inline: auto;"></span>
              </div>
            </div>
            <div class="joined-count-info-box info-box loading-animation">
              <div class="joined-count-container info-container">
                <span class="label">
                  <span class="joined-count-icon icon-box">
                    <i class="bi bi-people-fill"></i>
                  </span>
                  ${t("common:shared_terms.joined_count")}
                </span>
                <span class="joined-count-value value content loading-opacity-animation" style="width: 40%; height: 1.2rem; display: inline-block; margin-inline: auto;"></span>
              </div>
            </div>
          </div>
        </div>
      `;
    case "/members-list":
    case "/demandes-list": {
      const isAdmin = document.querySelector(
        ".top-bar .create-session, .top-bar .end-session",
      );
      return `
        <div class="${route === "/members-list" ? "members-view" : "demandes-view"} fade-in-template">
          <header class="loading-animation">
            <div class="${route === "/members-list" ? "members-search" : "demandes-search"} users-search">
              <div class="search-icon-container">
                <i class="bi bi-person-fill"></i>
              </div>
              <input type="search" placeholder="${route === "/members-list" ? t("group-chat:sidebar_info.search_members_placeholder") : t("group-chat:sidebar_info.search_members_placeholder")}" disabled style="background-color: transparent;" />
            </div>
          </header>
          <div class="${route === "/members-list" ? "members-list" : "demandes-list"}">
            ${Array(3)
              .fill(0)
              .map(
                () => `
            <div class="member card-item loading-animation" style="pointer-events: none;">
              <div class="avatar loading-opacity-animation" style="border-radius: 50%;"></div>
              <span class="username loading-opacity-animation" style="width: 150px; height: 1.2rem; border-radius: 0.3rem;"></span>
              ${
                isAdmin
                  ? `
              <div class="action-btns">
                <button class="red-btn small-btn loading-opacity-animation" style="width: 4rem; height: 1.8rem; border: none;"></button>
                <button class="orange-btn small-btn loading-opacity-animation" style="width: 6rem; height: 1.8rem; border: none;"></button>
              </div>`
                  : ""
              }
            </div>
            `,
              )
              .join("")}
          </div>
        </div>
      `;
    }
    case "/quizzes-list":
      return `
        <div class="quizzes-view fade-in-template">
          <header class="loading-animation">
            <div class="quizzes-search search">
              <div class="search-icon-container">
                <i class="bi bi-clipboard-check-fill"></i>
              </div>
              <label class="date-label should-fill">
                <i class="bi bi-calendar"></i>
                <input type="date" disabled style="background-color: transparent;" />
              </label>
              <input type="search" placeholder="${t("group-chat:sidebar_info.search_quizzes_placeholder")}" disabled style="background-color: transparent;" />
            </div>
            <label class="sort-button button exclude-btn">
              <i class="bi bi-sort-down"></i>
            </label>
          </header>
          <div class="quizzes-list">
            ${Array(getLoadersCount())
              .fill(0)
              .map(
                () => `
            <div class="quiz-card card-item loading-animation" style="pointer-events: none;">
              <div class="quiz-title-container info-container">
                <label class="quiz-title-label">
                  <span class="icon-box"><i class="bi bi-question-circle"></i></span>
                  ${t("common:shared_terms.quiz_title")}
                </label>
                <div class="quiz-title content loading-opacity-animation" style="width: 60%; height: 1.2rem; border-radius: 0.3rem; margin-inline: auto;"></div>
              </div>
              <div class="session-name-container info-container">
                <label class="session-name-label">
                  <span class="icon-box"><i class="bi bi-clock-history"></i><i class="bi bi-info-circle"></i></span>
                  ${t("common:quiz_card.session_name")}
                </label>
                <div class="session-name content loading-opacity-animation" style="width: 50%; height: 1.2rem; border-radius: 0.3rem; margin-inline: auto;"></div>
              </div>
              <div class="questions-container info-container small-container">
                <label class="questions-label">
                  <span class="icon-box"><i class="bi bi-question-circle"></i></span>
                  ${t("common:quiz_card.questions")}
                </label>
                <div class="questions content loading-opacity-animation" style="width: 2rem; height: 1.2rem; border-radius: 0.3rem; margin-inline: auto;"></div>
              </div>
              <div class="quiz-date-container info-container small-container">
                <label class="quiz-date-label">
                  <span class="icon-box"><i class="bi bi-calendar-event"></i></span>
                  ${t("common:quiz_card.submitted_at")}
                </label>
                <div class="quiz-date content loading-opacity-animation" style="width: 6rem; height: 1.2rem; border-radius: 0.3rem; margin-inline: auto;"></div>
              </div>
              <div class="action-btns">
                <button class="view-results-btn should-fill loading-opacity-animation" style="width: 8rem; height: 2rem; border: none;"></button>
              </div>
            </div>
            `,
              )
              .join("")}
          </div>
        </div>
      `;
    default:
      return getLoader();
  }
};

export const getQuizResultsOverlaySkeleton = () => {
  return `
    <div class="results-list-overlay overlay-model fade-in-template" style="pointer-events: none;">
      <header class="list-header loading-animation">
        <h3 class="label">
          <i class="bi bi-people-fill"></i>
          ${t("common:results_overlay.title")}
        </h3>
        <div class="quiz-title">
          <span class="title-label">${t("common:quiz_card.quiz_title")}</span>
          <h3 class="quiz-title loading-opacity-animation" style="width: 10rem; height: 1.5rem; display: inline-block; margin-inline-start: 10px;"></h3>
        </div>
        <button type="button" class="close-results-overlay-btn exclude-btn">
          <i class="bi bi-x-lg"></i>
        </button>
      </header>
      <div class="header-container loading-animation" style="padding: 0 var(--primary-gap) var(--primary-gap) var(--primary-gap);">
        <div class="search">
          <i class="bi bi-search"></i>
          <input type="text" class="results-search-input" placeholder="${t("common:actions.search")}" disabled style="background-color: transparent;" />
        </div>
      </div>
      <div class="table-div">
        <table>
          <thead>
            <tr>
              <th><div><i class="bi bi-person-circle"></i> ${t("common:results_overlay.table.profile")}</div></th>
              <th><div><i class="bi bi-person"></i> ${t("common:shared_terms.full_name")}</div></th>
              <th><div><i class="bi bi-calendar-event"></i> ${t("common:quiz_card.submitted_at")}</div></th>
              <th><div><i class="bi bi-list-ol"></i> ${t("common:results_overlay.table.answered_questions")}</div></th>
              <th><div><i class="bi bi-bar-chart-line"></i> ${t("common:quiz_card.score")}</div></th>
              <th><div><i class="bi bi-gear"></i> ${t("common:results_overlay.table.actions")}</div></th>
            </tr>
          </thead>
          <tbody class="results-list">
            ${Array(5)
              .fill(0)
              .map(
                () => `
            <tr class="card-item loading-animation">
              <td data-label="${t("common:results_overlay.table.profile")}">
                <div class="avatar-cover loading-opacity-animation" style="width: 32px; height: 32px; border-radius: 50%; margin: auto;"></div>
              </td>
              <td data-label="${t("common:shared_terms.full_name")}">
                <div class="loading-opacity-animation" style="width: 100px; height: 1.2rem; margin: auto; border-radius: 0.3rem;"></div>
              </td>
              <td data-label="${t("common:quiz_card.submitted_at")}">
                <div class="loading-opacity-animation" style="width: 80px; height: 1.2rem; margin: auto; border-radius: 0.3rem;"></div>
              </td>
              <td data-label="${t("common:results_overlay.table.answered_questions")}">
                <div class="loading-opacity-animation" style="width: 40px; height: 1.2rem; margin: auto; border-radius: 0.3rem;"></div>
              </td>
              <td data-label="${t("common:quiz_card.score")}">
                <div class="loading-opacity-animation" style="width: 50px; height: 1.2rem; margin: auto; border-radius: 0.3rem;"></div>
              </td>
              <td data-label="${t("common:results_overlay.table.actions")}">
                <button class="small-btn show-result-btn loading-opacity-animation" style="width: 80px; height: 2rem; border: none; margin: auto;"></button>
              </td>
            </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
};

export const handleBackErrBtn = (e) => {
  const errBackBtn = e.target.closest(".back-err-btn");
  if (errBackBtn) history.back();
};
