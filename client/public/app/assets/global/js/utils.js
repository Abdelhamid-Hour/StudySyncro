import {
  globalTooltip,
  hoverTooltip,
  mainContainer,
  topSideBarFooter,
  topSideBarHeader,
  topSideBarMiddle,
} from "./dom-variables.js";
import { fetchTemplate } from "../../../../main_assets/js/utils.js";
import { showMessageBlock } from "../../../../main_assets/js/utils.js";
import { initAndDiplayErrorTooltip } from "../../shared/chat/js/utils.js";

let isRouting = false;

export function getDebounceFunc(callback, TimeInterval) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      callback.apply(this, args);
    }, TimeInterval);
  };
}

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
export const millisecondsToHMFormat = (time) => {
  const hours = Math.floor(time / (1000 * 60 * 60));
  const minutes = Math.floor((time % (1000 * 60 * 60)) / (1000 * 60));

  return hours !== 0
    ? `${hours}h ${minutes.toString().padStart(2, "0")}m`
    : hours === 0 && minutes !== 0
    ? `${minutes}m`
    : "0m";
};

export const closeAndOpenLeftSideBar = () => {
  const shouldHideElements = document.querySelectorAll(".should-hide");

  shouldHideElements.forEach((element) => {
    element.classList.toggle("hidden");
  });
};
export const openOverlayHandler = (e) => {
  const button = e.target.closest(".open-drop-down-btn");
  if (button) {
    const overlay = button.parentElement.querySelector(".overlay");
    overlay.classList.toggle("open-overlay");
    document.body.style.pointerEvents = "none";
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

// this is for mouse down
export const handleOverlayClose = (event) => {
  const overlayToClose = document.querySelector(".open-overlay");
  const isOpenBtn = event.target.closest(".open-drop-down-btn");
  const isDropDownItem = event.target.closest(`.drop-down-item`);
  const isOnOverlay = event.target.closest(`.open-overlay`);
  if ((isDropDownItem || !isOnOverlay) && overlayToClose && !isOpenBtn) {
    overlayToClose.classList.remove("open-overlay");
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
  tooltip.classList.remove("show");
  tooltip.style.left = 0 + "px";
  tooltip.style.top = 0 + "px";
  tooltip.className = "tooltip";
  if (target) {
    target.dataset.tooltip = "";
    target.classList.remove("error-animation");
    target.classList.remove("error-input");
  }
};

export const showTooltip = (tooltipTarget, tooltip, message, error) => {
  if (message) {
    tooltipTarget.dataset.tooltip = message;
  }
  const positionInfo = tooltipTarget.getBoundingClientRect();
  tooltip.textContent = tooltipTarget.getAttribute("data-tooltip");
  tooltip.style.left = positionInfo.left + "px";
  tooltip.style.top = positionInfo.top + "px";
  // hadle if the tooltip is too clise to the right edge of the screen
  if (positionInfo.left + tooltip.offsetWidth > window.innerWidth) {
    tooltip.classList.add("from-left");
    tooltip.style.translate = `calc(-100% - 0.5rem) calc(50% - ${
      parseFloat(positionInfo.height) / 2
    }px)`;
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

  document.addEventListener("mouseover", (e) => {
    const tooltipTarget = e.target.closest(".has-tooltip");
    if (tooltipTarget && tooltipTarget !== currentTooltipTarget) {
      currentTooltipTarget = tooltipTarget;
      showTooltip(tooltipTarget, hoverTooltip);
    }
  });

  document.addEventListener("mouseout", (e) => {
    // Only reset if leaving the .has-tooltip element entirely
    if (
      currentTooltipTarget &&
      !currentTooltipTarget.contains(e.relatedTarget)
    ) {
      resetTooltip(hoverTooltip);
      currentTooltipTarget = null;
    }
  });
};

const SHARED_STYLES_MAP = {
  "/home/inactive": ["/tasks"],
  "/home/active": ["/tasks", "/chat", "/quiz-result"],
  "/quizzes": ["/quizzes-groups", "/fields", "/forms"],
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
    module.init?.();
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

const createGreetingMsg = () => {
  const greetingMsg = document.createElement("div");
  greetingMsg.className = "greeting-msg fade-in-template";

  const heading = document.createElement("h2");
  heading.textContent = "Hello Abdelhamid Hour 👋";

  const paragraph = document.createElement("p");
  paragraph.textContent = "Have a good day !";

  greetingMsg.appendChild(heading);
  greetingMsg.appendChild(paragraph);

  return greetingMsg;
};

const createSearchContainer = () => {
  const searchContainer = document.createElement("div");
  searchContainer.className = "search-container fade-in-template";

  const search = document.createElement("div");
  search.className = "main-search";

  const searchIconContainer = document.createElement("div");
  searchIconContainer.className = "search-icon-container";

  const searchIcon = document.createElement("i");
  searchIcon.className = "bi bi-search";

  const input = document.createElement("input");
  input.type = "search";
  input.placeholder = "Search By Group Name | UID | Subject";

  const filterContainer = document.createElement("div");
  filterContainer.className = "filter-container";

  const filterButton = document.createElement("button");
  filterButton.type = "button";
  filterButton.className =
    "exclude-btn filter-button open-drop-down-btn should-fill";

  const filterIcon = document.createElement("i");
  filterIcon.className = "bi bi-funnel";

  filterButton.appendChild(filterIcon);
  filterContainer.appendChild(filterButton);

  searchIconContainer.appendChild(searchIcon);
  search.appendChild(searchIconContainer);
  search.appendChild(input);
  searchContainer.appendChild(search);
  searchContainer.appendChild(filterContainer);

  return searchContainer;
};

const createGroupsTabs = () => {
  const navigationTabs = document.createElement("div");
  navigationTabs.className = "navigation-tabs";
  navigationTabs.style.opacity = 0;

  const myGroupsTab = document.createElement("a");
  myGroupsTab.href = "/app/groups/my";
  myGroupsTab.className = "tab route-link my-groups-tab active exclude-btn";
  myGroupsTab.textContent = "My Groups";

  const availableGroupsTab = document.createElement("a");
  availableGroupsTab.href = "/app/groups/available";
  availableGroupsTab.className =
    "tab route-link available-groups-tab exclude-btn";
  availableGroupsTab.textContent = "Available Groups";

  navigationTabs.appendChild(myGroupsTab);
  navigationTabs.appendChild(availableGroupsTab);

  return navigationTabs;
};

const setGroupTitle = () => {
  const groupName = document.createElement("h1");
  groupName.className = "fade-in-template";
  const groupLeftSideBarContent = document.querySelector(
    ".left-side-bar-content"
  );
  groupName.textContent = groupLeftSideBarContent?.dataset.groupName;
  return groupName;
};
const setQuizTitle = () => {
  const quizTitle = document.createElement("h1");
  quizTitle.className = "fade-in-template";
  const quizEditor = document.querySelector(".quiz-editor");
  quizTitle.textContent = quizEditor?.dataset.quizTitle;
  return quizTitle;
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
    middle: () => createGreetingMsg(),
  },
  "/groups/my": {
    title: "Groups",
    middle: () => createSearchContainer(),
    additional: () => {
      const createGroupBtn = createCreateBtn();
      topSideBarFooter.prepend(createGroupBtn);
    },
  },
  "/groups/available": {
    title: "Groups",
    middle: () => createSearchContainer(),
  },
  "/quizzes": {
    title: "Quizzes",
    middle: () => createSearchContainer(),
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
    middle: setGroupTitle,
  },
  "/quizzes/quiz-editor": {
    title:
      '<a href="/app/quizzes"><i class="bi bi-caret-left-fill"></i>Quiz Editor</a>',
    middle: setQuizTitle,
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

const updateTopSideBar = (pathName) => {
  const {
    title: headerTitle = "",
    middle: makeMiddle = () => document.createDocumentFragment(),
  } = pageConfig[pathName] || {};

  // 2) update header
  updateTopSideBarHeader(headerTitle);

  // 3) update middle content
  const middleContent = makeMiddle();

  topSideBarMiddle.replaceChildren(middleContent);

  // 4) add filter panel on quizzes OR groups
  const needsFilter = ["/quizzes", "/groups/my", "/groups/available"].includes(
    pathName
  );
  if (needsFilter) {
    const panel = createFilterPanel();
    const container = topSideBarMiddle.querySelector(".filter-container");
    if (container) container.appendChild(panel);
  }

  removeCreateBtns();

  removeSaveQuizBtn();

  // 5) ONLY groups get tabs
  const isGroups = ["/groups/my", "/groups/available"].includes(pathName);
  const existingTabs = document.querySelector(".navigation-tabs");
  if (isGroups && !existingTabs) {
    topSideBarHeader.appendChild(createGroupsTabs());
  } else if (!isGroups && existingTabs) {
    existingTabs.remove();
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

export const updateMain = async (path, isTabLinks) => {
  const thisNav = ++navCounter;
  try {
    if (thisNav !== navCounter) return;
    mainContainer.innerHTML = getLoader();
    const { pathName, htmlFragment } = await fetchTemplate(path);

    if (thisNav !== navCounter) return;
    clearOverlaysModals();
    mainContainer.innerHTML = htmlFragment;
    removePreviousRessources();
    setStyleRoute(pathName);
    setScriptRoute(pathName, thisNav);
    setSharedStylesResources(pathName);
    if (!isTabLinks)
      updateTopSideBar(pathName.includes("/home") ? "/home" : pathName);
    isRouting = false;
  } catch (error) {
    console.error(error);
    showMessageBlock(error.message, "error");
  }
};

const toggleActiveLink = (pathName) => {
  const activeLinks = document.querySelectorAll(".active");
  activeLinks.forEach((link) => {
    link.classList.remove("active");
    const icon = link.querySelector("i");
    const isSideBarLink = link.closest(".side-bar-icons");
    if (icon && isSideBarLink) {
      animateFillIcon(icon, false);
    }
  });
  let className = "";
  switch (true) {
    case pathName.includes("/app/home"):
      className = '[href="/app/home"]';
      break;
    case pathName.includes("/app/groups/my"):
      className = '[href="/app/groups/my"]';
      break;
    case pathName.includes("/app/groups/available"):
      className = '[href="/app/groups/available"]';
      break;
    case pathName.includes("/app/quizzes"):
      className = '[href="/app/quizzes"]';
      break;
    case pathName.includes("/app/settings"):
      className = '[href="/app/settings"]';
      break;
  }

  const links = document.querySelectorAll(className);
  if (links.length) {
    toggleClass(links, "active");
    links.forEach((link) => {
      const icon = link.querySelector("i");
      const isSideBarLink = link.closest(".side-bar-icons");
      if (icon && isSideBarLink) {
        animateFillIcon(icon, true);
      }
    });
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
  if (isRouting) {
    event.preventDefault(); // Prevent default action (like link navigation)
    event.stopPropagation(); // Optional: stop event from bubbling up
  }
};

const clearOverlaysModals = () => {
  const overlaysModals = document.querySelectorAll(".backdrop");
  overlaysModals.forEach((oM) => {
    oM.remove();
  });
};

export const navigateTo = (pathName) => {
  const link = document.createElement("a");
  link.href = `/app${pathName}`; // add the correct id or path
  link.className = "route-link";
  link.style.display = "none";
  console.log(mainContainer);
  mainContainer.appendChild(link);
  link.click();
};

export const handleNavigation = (e) => {
  const link = e.target.closest("a.route-link");
  const tabLink = e.target.closest(".navigation-tabs a");
  if (link) {
    e.preventDefault();
    const pathName = new URL(link.href).pathname;
    if (pathName !== location.pathname) {
      isRouting = true;
      toggleActiveLink(pathName);
      updateMain(pathName, Boolean(tabLink));
      resetTooltip(hoverTooltip);
      history.pushState(null, "", pathName);
    }

    if (tabLink) {
      toggleActiveLink(pathName);
      document.querySelector(".filter-panel").replaceWith(createFilterPanel());
      if (e.target.closest(".available-groups-tab")) {
        removeCreateBtns();
      } else {
        const groupCreateBtn = document.querySelector(".create-group-btn");
        if (!groupCreateBtn) {
          const createGroupBtn = createCreateBtn();
          topSideBarFooter.prepend(createGroupBtn);
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

  // Label for icon and text
  const labelElement = document.createElement("label");
  labelElement.htmlFor = id;

  const icon = document.createElement("i");
  icon.className = iconClass;

  labelElement.appendChild(icon);
  labelElement.appendChild(document.createTextNode(` ${label}`));

  option.appendChild(checkboxLabel);
  option.appendChild(labelElement);

  return option;
};

const createRadioOption = (name, id, label, iconClass) => {
  const option = document.createElement("div");
  option.className = "filter-option";

  const input = document.createElement("input");
  input.type = "radio";
  input.name = name;
  input.id = id;

  const labelElement = document.createElement("label");
  labelElement.htmlFor = id;

  const icon = document.createElement("i");
  icon.className = iconClass;

  labelElement.appendChild(icon);
  labelElement.appendChild(document.createTextNode(`${label}`));

  option.appendChild(input);
  option.appendChild(labelElement);

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

export const createFilterPanel = () => {
  const filterPanel = document.createElement("div");
  filterPanel.className = "filter-panel overlay group-filter-panel";
  const isGroupsPage = location.pathname.includes("/groups/");
  const isMyGroupsPage = location.pathname === "/app/groups/my";

  if (isGroupsPage) {
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
    console.log(error);
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
