import {
  globalTooltip,
  hoverTooltip,
  mainContainer,
  PENDING_ONLINE_SYNC_OPS,
  timers,
  topSideBarFooter,
  topSideBarHeader,
  topSideBarMiddle,
} from "./variables.js";
import { fetchTemplate, sendData } from "../../../../main_assets/js/utils.js";
import { showMessageBlock } from "../../../../main_assets/js/utils.js";
import { initAndDiplayErrorTooltip } from "../../shared/chat/js/utils.js";

let isRouting = false;

window.__activeEventSources = window.__activeEventSources || [];
const OriginalEventSource = window.EventSource;
if (OriginalEventSource && !window.__esWrapped) {
  window.__esWrapped = true;
  window.EventSource = class extends OriginalEventSource {
    constructor(url, options) {
      super(url, options);
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

// IndexedDB setup for storing chat files
export let db = null;
let dbReady = false;
const pendingOps = [];
const request = indexedDB.open("chatDB", 1);

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

export const handleOnlineSync = () => {
  PENDING_ONLINE_SYNC_OPS.forEach((f) => f());
  PENDING_ONLINE_SYNC_OPS.length = 0;
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
  } = {}
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
    console.error("Error:", error);
    showMessageBlock(error.message || "An error occurred.", "error");
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
  if (typeof ms !== "number" || ms < 0) return "0m";
  const hours = Math.floor(ms / 3_600_000);
  const minutes = Math.floor((ms % 3_600_000) / 60_000);

  if (hours && minutes)
    return `${hours}h ${minutes.toString().padStart(2, "0")}m`;
  if (hours) return `${hours}h`;
  if (minutes) return `${minutes}m`;
  return "0m";
};

export const closeAndOpenLeftSideBar = () => {
  const shouldHideElements = document.querySelectorAll(".should-hide");

  shouldHideElements.forEach((element) => {
    element.classList.toggle("hidden");
  });
};

export const adjustMenuDirection = (button, menu) => {
  // Reset previous positioning
  menu.style.left = "";
  menu.style.right = "";
  menu.style.top = "";
  menu.style.bottom = "";
  menu.style.translate = "";

  const buttonRect = button.getBoundingClientRect();
  const menuWidth = menu.offsetWidth;
  const menuHeight = menu.offsetHeight;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  // Check right overflow
  if (buttonRect.left + menuWidth > viewportWidth) {
    menu.style.left = "auto";
    menu.style.right = "0";
  }

  // Check bottom overflow
  if (buttonRect.bottom + menuHeight + 8 > viewportHeight) {
    menu.style.top = "auto";
    menu.style.bottom = "100%";
    menu.style.translate = "0 calc(-0.5rem)";
  }
};

export const openOverlayHandler = (e) => {
  const button = e.target.closest(".open-drop-down-btn");
  if (button) {
    const overlay = button.parentElement.querySelector(".overlay");
    overlay.classList.add("open-overlay");
    document.body.style.pointerEvents = "none";
    adjustMenuDirection(button, overlay);
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
  const isDropDownItem = event.target.closest(`.drop-down-item`);
  const isOnOverlay = event.target.closest(`.open-overlay`);
  if ((isDropDownItem || !isOnOverlay) && overlayToClose && !isOpenBtn) {
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
    tooltip.className = "tooltip";
  }, 300);
};

export const showTooltip = (tooltipTarget, tooltip, message, error) => {
  if (tooltipTimer) clearTimeout(tooltipTimer);

  if (message) tooltipTarget.dataset.tooltip = message;

  const positionInfo = tooltipTarget.getBoundingClientRect();
  tooltip.textContent = tooltipTarget.getAttribute("data-tooltip");
  tooltip.style.left = positionInfo.left + "px";
  tooltip.style.top = positionInfo.top + "px";
  // handle if the tooltip is too close to the right edge of the screen
  if (positionInfo.left + tooltip.offsetWidth > window.innerWidth) {
    tooltip.classList.add("from-left");
    tooltip.style.translate = `calc(-100% - 0.5rem) calc(${
      parseFloat(positionInfo.height) / 2
    }px - 50%)`;
  } else {
    tooltip.style.translate = `calc(-50% + ${
      parseFloat(positionInfo.width) / 2
    }px) -130%`;
  }
  tooltip.classList.add("show");
  if (error) {
    tooltip.classList.add("error-tooltip");
  }
};
export const tooltipSetup = () => {
  let currentTooltipTarget = null;
  let tooltipTimer = null;

  document.addEventListener("mouseover", (e) => {
    const tooltipTarget = e.target.closest(".has-tooltip");
    if (tooltipTarget && tooltipTarget !== currentTooltipTarget) {
      clearTimeout(tooltipTimer);
      currentTooltipTarget = tooltipTarget;
      tooltipTimer = setTimeout(
        () => showTooltip(tooltipTarget, hoverTooltip),
        1000
      );
    }
  });

  document.addEventListener("mouseout", (e) => {
    // Only reset if leaving the .has-tooltip element entirely
    if (
      (currentTooltipTarget &&
        !currentTooltipTarget.contains(e.relatedTarget)) ||
      tooltipTimer
    ) {
      resetTooltip(hoverTooltip);
      currentTooltipTarget = null;
      clearTimeout(tooltipTimer);
      tooltipTimer = null;
    }
  });
};

const SHARED_STYLES_MAP = {
  "/home/inactive": ["/tasks"],
  "/home/active": ["/tasks", "/chat", "/quiz-result"],
  "/quizzes/my": ["/quizzes-groups", "/fields", "/forms", "/quizzes-my-groups"],
  "/quizzes/passed": [
    "/quizzes-groups",
    "/fields",
    "/forms",
    "quizzes-my-groups",
    "/quiz-result"
  ],
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

const setSharedStylesResources = (pathName) => {
  const sharedStylesRoutes = SHARED_STYLES_MAP[pathName];
  if (sharedStylesRoutes) {
    const sharedStylesLinks = document.querySelectorAll(
      'link[data-dynamic][rel="stylesheet"][href*="shared"]'
    );
    const sharedPreloadLinks = document.querySelectorAll(
      'link[data-dynamic][rel="preload"][href*="shared"]'
    );
    // add new shared resources if not already in Use
    sharedStylesRoutes.forEach((styleRoute) => {
      if (
        !Array.from(sharedStylesLinks).find((l) => l.href.includes(styleRoute))
      ) {
        setStyleRoute(`/shared${styleRoute}`);
      }
    });

    // Remove previous shared resources that new ones are not using
    sharedStylesLinks.forEach((l) => {
      const prevStyleRoute = sharedStylesRoutes.find((route) =>
        l.href.includes(route)
      );
      if (!prevStyleRoute) {
        l.remove();
      }
    });
    sharedPreloadLinks.forEach((l) => {
      const prevStyleRoute = sharedStylesRoutes.find((route) =>
        l.href.includes(route)
      );
      if (!prevStyleRoute) {
        l.remove();
      }
    });
  }
};

const createPreloadLink = (href) => {
  const type = href.split(".")[1] === "css" ? "style" : "script";
  const preloadLink = document.createElement("link");
  preloadLink.rel = type === "style" ? "preload" : "modulepreload";
  preloadLink.href = href;
  preloadLink.as = type;
  preloadLink.setAttribute("data-dynamic", "");
  if (type === "script") {
    preloadLink.crossOrigin = "anonymous";
  }
  return preloadLink;
};

const setScriptRoute = async (pathName, thisNav) => {
  try {
    const modulePath = `/app/assets${pathName}/js/main.js`;
    const module = await import(modulePath);
    if (thisNav !== navCounter) return;
    module.init?.(true);
    console.log(`Module loaded: ${modulePath}`);
  } catch (error) {
    console.error(error);
    showMessageBlock(error.message, "error");
  }
};

const setStyleRoute = (pathName) => {
  const stylesLink = document.createElement("link");
  const href = `/app/assets${pathName}/css/styles.css`;
  stylesLink.rel = "stylesheet";
  stylesLink.href = href;
  stylesLink.as = "style";
  stylesLink.setAttribute("data-dynamic", "");
  const preloadLink = createPreloadLink(href);
  document.head.appendChild(stylesLink);
  document.head.appendChild(preloadLink);
};

const removePreviousRessources = () => {
  const stylesLinks = document.querySelectorAll(
    'link[data-dynamic][rel="stylesheet"]:not([href*="shared"])'
  );
  const preloadLinks = document.querySelectorAll(
    'link[data-dynamic][rel="preload"]:not([href*="shared"]), link[data-dynamic][rel="modulepreload"]'
  );
  const script = document.querySelector("script[data-dynamic]");

  script?.remove();
  stylesLinks.forEach((l) => l.remove());
  preloadLinks.forEach((l) => l.remove());
};

const createGreetingMsg = (fullName) => {
  const greetingMsg = document.createElement("div");
  greetingMsg.className = "greeting-msg fade-in-template";
  const heading = document.createElement("h2");
  // Use a more robust greeting and fallback for missing name
  const displayName = fullName && fullName.trim() ? fullName : "there";
  const greetings = [
    "Hello",
    "Welcome",
    "Hi",
    "Greetings",
    "Good to see you",
    "Hey",
  ];
  // Pick a random greeting
  const greeting = greetings[Math.floor(Math.random() * greetings.length)];
  heading.textContent = `${greeting} ${displayName} 👋`;

  const paragraph = document.createElement("p");
  // Add a more personalized or dynamic message
  const dayMessages = [
    "Hope you have a fantastic day!",
    "Wishing you a productive session!",
    "Let's achieve something great today!",
    "Ready to make progress?",
    "Have a wonderful day ahead!",
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
    ? "Search By Quiz Title or Subject"
    : "Search By Group Name or Subject";
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
  groupNameEl.textContent = groupName;
  return groupNameEl;
};

const setQuizTitle = (quizTitle) => {
  const quizTitleEl = document.createElement("h1");
  quizTitleEl.className = "fade-in-template";
  quizTitleEl.textContent = quizTitle;
  return quizTitleEl;
};

const createCreateBtn = (quiz) => {
  const createGroupBtn = document.createElement("button");
  createGroupBtn.type = "button";
  createGroupBtn.className = quiz ? "create-quiz-btn" : "create-group-btn";

  createGroupBtn.innerHTML = `
    <i class="bi bi-plus-circle"></i>
    <span>Create ${quiz ? "Quiz" : "Group"}</span>
  `;
  return createGroupBtn;
};

const createSaveQuizBtn = () => {
  const saveQuizBtn = document.createElement("button");
  saveQuizBtn.className = "save-quiz-btn should-fill blue-btn";
  saveQuizBtn.type = "button";
  saveQuizBtn.innerHTML = `
  <i class="bi bi-floppy"></i>
  <span>Save</span>
  `;
  return saveQuizBtn;
};

const pageConfig = {
  "/home": {
    title: "Home",
    middle: (extraData) => createGreetingMsg(extraData.fullName),
  },
  "/groups/my": {
    title: "Groups",
    middle: () => createSearchContainer(),
    additional: () => {
      const createGroupBtn = createCreateBtn();
      topSideBarFooter.prepend(createGroupBtn);
    },
  },
  "/quizzes/my": {
    title: "Quizzes",
    middle: () => createSearchContainer(true),
    additional: () => {
      const createQuizBtn = createCreateBtn(true);
      topSideBarFooter.prepend(createQuizBtn);
    },
  },
  "/settings": {
    title: "Settings",
    middle: () => document.createDocumentFragment(),
  },
  "/groups/my/group-chat": {
    title:
      '<a href="/app/groups/my"><i class="bi bi-caret-left-fill"></i>Group Chat</a>',
    middle: (extraData) => setGroupName(extraData.groupName),
  },
  "/quizzes/my/quiz-editor": {
    title:
      '<a href="/app/quizzes"><i class="bi bi-caret-left-fill"></i>Quiz Editor</a>',
    middle: (extraData) => setQuizTitle(extraData.quizTitle),
    additional: () => {
      const saveQuizBtn = createSaveQuizBtn();
      topSideBarFooter.prepend(saveQuizBtn);
    },
  },
};

const removeCreateBtns = () => {
  const createBtns = document.querySelectorAll(
    ".create-quiz-btn, .create-group-btn"
  );
  createBtns.forEach((btn) => {
    btn.remove();
  });
};

const removeSaveQuizBtn = () => {
  const saveQuizBtn = document.querySelector(".save-quiz-btn");
  saveQuizBtn?.remove();
};

const updateTopSideBar = (pathName, extraData) => {
  const {
    title: headerTitle = "",
    middle: makeMiddle = () => document.createDocumentFragment(),
  } = pageConfig[pathName] || {};

  // 2) update header
  updateTopSideBarHeader(headerTitle);

  // 3) update middle content
  const middleContent = makeMiddle(extraData);

  topSideBarMiddle.replaceChildren(middleContent);

  removeCreateBtns();

  removeSaveQuizBtn();
  // 5) ONLY groups get tabs
  const isGroups = ["/groups/my", "/groups/available"].includes(pathName);
  const isQuizzes = ["/quizzes/my", "/quizzes/passed"].includes(pathName);
  const existingTabs = document.querySelector(".navigation-tabs");
  if (existingTabs) {
    existingTabs.remove();
  }
  if (isGroups) {
    const tabContent = [
      {
        route: "/app/groups/my",
        textContent: "My Groups",
        active: true,
      },
      {
        route: "/app/groups/available",
        className: "available-groups-tab",
        textContent: "Available Groups",
        active: false,
      },
    ];
    topSideBarHeader.appendChild(createTabs(tabContent, "groups-tabs"));
  }
  if (isQuizzes) {
    const tabContent = [
      {
        route: "/app/quizzes/my",
        textContent: "My Quizzes",
        active: true,
      },
      {
        route: "/app/quizzes/passed",
        className: "groups-quizzes-tab",
        textContent: "Passed",
        active: false,
      },
    ];
    topSideBarHeader.appendChild(createTabs(tabContent, "quizzes-tabs"));
  }

  // 6) add additional content if needed
  const { additional } = pageConfig[pathName] || {};
  if (additional) {
    additional();
  }
};

const updateTopSideBarHeader = (Title) => {
  topSideBarHeader.querySelector("h2").innerHTML = Title;
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

export const updateMain = async (path, isTabLinks) => {
  const thisNav = ++navCounter;
  try {
    if (thisNav !== navCounter) {
      isRouting = false;
      return;
    }
    clearAllTimeOuts();
    closeAllEventSources();
    mainContainer.innerHTML = getLoader();
    clearOverlaysModals();
    const { pathName, htmlFragment, extraData } = await fetchTemplate(path);

    if (thisNav !== navCounter) {
      isRouting = false;
      return;
    }
    
    clearAllTimeOuts();
    closeAllEventSources();
    mainContainer.innerHTML = htmlFragment;
    removePreviousRessources();
    setStyleRoute(pathName);
    setScriptRoute(pathName, thisNav);
    setSharedStylesResources(pathName);
    if (!isTabLinks)
      updateTopSideBar(
        pathName.includes("/home") ? "/home" : pathName,
        extraData
      );
  } catch (error) {
    console.error(error);
    showMessageBlock(error.message, "error");
  } finally {
    isRouting = false;
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
  const activePageLink = document.querySelector(".active");
  if (activePageLink) {
    const activeIcon = activePageLink.querySelector("i");
    activeIcon ? animateFillIcon(activeIcon, false) : null;
    activePageLink?.classList.remove("active");
  }
  const pageLink = document.querySelector(
    `.side-bar-icons [href="${pathName}"]`
  );
  if (pageLink) {
    pageLink.classList.add("active");
    const icon = pageLink.querySelector("i");
    icon ? animateFillIcon(icon, true) : null;
  }
};

export const showErrorTooltip = (error, input, parentClassName) => {
  let inputContainer = null;
  if (parentClassName) {
    inputContainer = input.closest(`.${parentClassName}`);
  } else {
    inputContainer = input.closest(".field-container, .choice");
  }
  initAndDiplayErrorTooltip(inputContainer, error);
};

export const clearTooltipWithTimeOut = getDebounceFunc((input) => {
  resetTooltip(globalTooltip, input);
}, 2000);

export const handleRoutingClick = (event) => {
  console.log("isRouuting: ", isRouting);
  
  if (isRouting) {
    event.preventDefault(); // Prevent default action (like link navigation)
    event.stopPropagation(); // Optional: stop event from bubbling up
  }
};

const clearOverlaysModals = () => {
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
  dateLabel.dataset.tooltip = "Filter By Date";
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
      isRouting = true;
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
          topSideBarMiddle
            .querySelector(".filter-panel")
            .replaceWith(createFilterPanel(true));
        }
        const searchContainer =
          topSideBarMiddle.querySelector(".search-container");
        if (isUserQuizzesPage) {
          topSideBarMiddle.querySelector(".date-label").remove();
          searchContainer.appendChild(createFilterContainer());
          searchContainer.querySelector("input").placeholder =
            "Search By Quiz Title or Subject";
        }
        if (!isUserQuizzesPage && !isGroupsTabs) {
          document.querySelector(".filter-container").remove();
          searchContainer.querySelector("input").placeholder =
            "Search By Quiz Title, Subject or Group Name";
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
    "M 0 16 V 56 A 8 8 90 0 0 8 64 H 56 A 8 8 90 0 0 64 56 V 8 A 8 8 90 0 0 56 0 H 8 A 8 8 90 0 0 0 8 V 16 L 32 48 L 64 16 V 8 A 8 8 90 0 0 56 0 H 8 A 8 8 90 0 0 0 8 V 56 A 8 8 90 0 0 8 64 H 56 A 8 8 90 0 0 64 56 V 16"
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
      option.icon
    );
    section.appendChild(filterOption);
  });

  return section;
};

export const createFilterPanel = (groups = false) => {
  const filterPanel = document.createElement("div");
  filterPanel.className = "filter-panel overlay";

  if (groups) {
    const isMyGroupsPage = location.pathname === "/app/groups/my";

    if (isMyGroupsPage) {
      const roleSection = createSection("Role", [
        { id: "admin", label: "Admin", icon: "bi bi-person-gear" },
        { id: "member", label: "Member", icon: "bi bi-person" },
      ]);
      filterPanel.appendChild(roleSection);
    }

    // Visibility Section
    const visibilitySection = createSection("Visibility", [
      { id: "private", label: "Private", icon: "bi bi-lock" },
      { id: "public", label: "Public", icon: "bi bi-eye" },
    ]);
    filterPanel.appendChild(visibilitySection);

    // Level Section
    const levelSection = createSection("Level", [
      { id: "advanced", label: "Advanced", icon: "bi bi-graph-up" },
      { id: "intermediate", label: "Intermediate", icon: "bi bi-bar-chart" },
      { id: "beginner", label: "Beginner", icon: "bi bi-lightbulb" },
    ]);
    filterPanel.appendChild(levelSection);

    if (!isMyGroupsPage) {
      const roleSection = createSection("View Options", [
        { id: "joinable-only", label: "Joinable Only", icon: "bi bi-people" },
      ]);
      filterPanel.appendChild(roleSection);
    }
  } else {
    // Status Section
    const statusSection = createSection("Status", [
      { id: "published", label: "Published", icon: "bi bi-check-circle" },
      { id: "draft", label: "Draft", icon: "bi bi-pencil" },
    ]);
    filterPanel.appendChild(statusSection);
  }

  return filterPanel;
};

export const openOverlayModal = async (
  overlayModalCustomClassName,
  closeBtnClasses = [],
  loadContentCallback,
  afterLoadCallback
) => {
  const backdrop = document.createElement("div");
  backdrop.className = "backdrop";
  backdrop.innerHTML = getLoader();
  document.body.appendChild(backdrop);

  try {
    const overlayContent = await loadContentCallback();
    if (overlayContent) {
      backdrop.innerHTML = overlayContent;
      closeBtnClasses.forEach((c) => {
        backdrop
          .querySelector(c)
          .addEventListener("click", () =>
            closeOverlayModal(overlayModalCustomClassName)
          );
      });

      if (afterLoadCallback) {
        afterLoadCallback(backdrop);
      }
    }
  } catch (error) {
    console.error(error);
    backdrop.innerHTML = "<h2>Error loading content</h2>";
    showMessageBlock(error.message, "error");
  }
};

export const closeOverlayModal = (overlayModalClassName) => {
  const backdrop = document.querySelector(
    `.backdrop:has(.${overlayModalClassName})`
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

const createConfirmationBox = (
  type = "exclamation",
  title,
  message,
  cancelButtonText,
  confirmButtonText
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
  cancelButtonText,
  confirmButtonText
) => {
  const promise = new Promise((res, rej) => {
    openOverlayModal(
      "confirmation-box",
      [".confirmation-box-btn-cancel", ".confirmation-box-btn-confirm"],
      () => {
        const confirmationBox = createConfirmationBox(
          type ? type : "exclamation",
          title,
          message,
          cancelButtonText,
          confirmButtonText
        );
        return confirmationBox;
      },
      () => {
        const canselBtn = document.querySelector(
          ".confirmation-box-btn-cancel"
        );
        const confirmBtn = document.querySelector(
          ".confirmation-box-btn-confirm"
        );

        canselBtn.addEventListener("click", () => {
          res(false);
        });

        confirmBtn.addEventListener("click", () => {
          res(true);
        });
      }
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

  if (type === "short") {
    return date.toLocaleString([], {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  }

  return date.toLocaleString([], {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};
