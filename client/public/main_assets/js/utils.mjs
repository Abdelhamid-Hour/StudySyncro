import {
  changeLanguage,
  getLang,
  initI18n,
  initLanguageSwitcher,
  loadNamespace,
  loadNamespaces,
  setLang,
  t,
} from "./i18n.mjs";
import { AUTH_ERRORS, toggleIcon } from "./variables.mjs";

export {
  changeLanguage,
  getLang,
  initI18n,
  initLanguageSwitcher,
  loadNamespace,
  loadNamespaces,
  setLang,
  t,
};

export const initThemeToggleBtn = (toggleBtn) => {  
  if (toggleBtn) {
    const root = document.documentElement;
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
};

export const applyTheme = (toDark, save) => {
  const root = document.documentElement;

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
};

// Add Event listener for eye icon click to toggle password visibility
export const handlEyeIconsClick = (eyeIcons) => {
  eyeIcons.forEach((e) => {
    e.addEventListener("click", () => {
      e.lastElementChild.classList.toggle("show");
      if (e.previousElementSibling.getAttribute("type") === "password") {
        e.previousElementSibling.setAttribute("type", "text");
      } else {
        e.previousElementSibling.setAttribute("type", "password");
      }
    });
  });
};

/**
 * Throttles a function to prevent it from being called too frequently.
 * @param {Number} TimeInterval - The time interval in milliseconds to wait before executing the callback function again.
 * @param {Function} callback - The function to be executed after the specified time interval.
 * @returns {Function} - The throttled function.
 */
export const throttling = function (TimeInterval, callback, notFireFirstTime) {
  let inAction = false;
  return function (...args) {
    if (!inAction) {
      inAction = true;
      if (!notFireFirstTime) callback.apply(this, args);
      setTimeout(() => {
        if (notFireFirstTime) callback.apply(this, args);
        inAction = false;
      }, TimeInterval);
    }
  };
};

export const redirectTo = (url) => {
  location.href = url;
};

export const removeBlock = function () {
  this.parentElement.remove();
};

/**
 * Shows a message block in the DOM.
 * @param {String} message - The message to show in the DOM.
 * @param {Boolean} error - Indicates if the message is an error (true) or success (false).
 */
export const showMessageBlock = (message, type) => {
  let messagesBlocksWrapper = document.querySelector(
    ".messages-blocks-wrapper",
  );
  if (!messagesBlocksWrapper) {
    messagesBlocksWrapper = document.createElement("div");
    messagesBlocksWrapper.className = "messages-blocks-wrapper";
    document.body.appendChild(messagesBlocksWrapper);
  }
  const msgBlock = document.createElement("div");
  msgBlock.className = `${type}-block`;
  const iconClass =
    type === "error"
      ? "exclamation-circle-fill"
      : type === "warning"
        ? "exclamation-triangle-fill"
        : type === "info"
          ? "info-circle-fill"
          : "check-circle-fill";
  msgBlock.innerHTML = `
    <p>
      <i class="bi bi-${iconClass}"></i>
      <span>${message}</span>
    </p>
    <i class="bi bi-x"></i>
    <div>
      <hr>
    </div>
  `;
  msgBlock.querySelector(".bi-x").addEventListener("click", removeBlock);
  const firstMsgBlockChild = messagesBlocksWrapper.firstElementChild;
  messagesBlocksWrapper.insertBefore(msgBlock, firstMsgBlockChild);
  setTimeout(() => {
    msgBlock.remove();
  }, 11200);
};

// ── Route-level AbortController ──────────────────────────────────────
// Every SPA page gets its own AbortController. When the user navigates
// away, the router calls resetRouteController(), which:
//   1. Aborts every in-flight fetch tied to the dying page.
//   2. Creates a fresh controller for the incoming page.
// If a fetch is aborted, fetchStructure returns FROZEN_PROMISE — a
// promise that never settles — so the caller's async chain silently
// suspends and is garbage-collected, preventing DOM-after-navigation errors.
let currentRouteController = new AbortController();
const FROZEN_PROMISE = new Promise(() => {});

export const getRouteSignal = () => currentRouteController.signal;
export const getFrozenPromise = () => FROZEN_PROMISE;

export const resetRouteController = () => {
  currentRouteController.abort();
  currentRouteController = new AbortController();
};

const fetchStructure = async (url, method, options, extraHeaders) => {
  const csrfToken = getCookie("csrfToken");

  let response;
  try {
    response = await fetch(url, {
      method: method,
      headers: {
        ...extraHeaders,
        csrfToken: csrfToken,
      },
      credentials: "include",
      // Only abort GET requests on navigation.
      // POST/PUT/DELETE (saving data) must complete on the server.
      ...(method === "GET" && { signal: currentRouteController.signal }),
      ...options,
    });
  } catch (err) {
    // If the fetch was aborted due to navigation, freeze the caller forever
    if (err.name === "AbortError") return FROZEN_PROMISE;
    throw err;
  }

  console.log(response);

  if (!response.ok) {
    if (response.status === 429) {
      const error = new Error(t("shared:auth_errors.TOO_MANY_REQUESTS"));
      error.isNative = true;
      error.type = "warning";
      throw error;
    }

    if (response.status === 401) {
      // Handle unauthorized access
      showMessageBlock(t("shared:alerts.unauthorized"), "warning");
      setTimeout(() => {
        redirectTo("/login");
      }, 2000);
      return;
    }

    // if the responce is for redirection
    if (response.status === 301) {
      history.back();
    }

    const responseData = await response
      .json()
      .catch(() => ({ message: t("shared:alerts.error_occurred") }));
    const error = new Error(
      responseData.message || t("shared:alerts.error_occurred"),
    );
    error.data = responseData;
    error.status = response.status;
    error.isNative = responseData.isNative;
    error.type = responseData.type || (isNative ? "info" : "error");
    throw error;
  }
  return response.json();
};

/**
 * Sends data to the server
 * @param {Auth} auth - The Auth instance
 * @param {String} url - The URL to send data to
 * @param {Object} data - The data to send
 */
export const sendData = async (url, data, method = "POST") => {
  const options = {};
  if (data) {
    options.body = data instanceof FormData ? data : JSON.stringify(data);
  }
  const contentType =
    data instanceof FormData ? {} : { "Content-Type": "application/json" };
  const response = await fetchStructure(url, method, options, contentType);
  return response;
};

export const fetchTemplate = async (url) => {
  const response = await fetchStructure(
    url,
    "GET",
    {},
    { "x-requested-with": "fetch" },
  );
  return response;
};

export const fetchData = async (url) => {
  const response = await fetchStructure(`/api${url}`, "GET", {}, {});
  return response;
};
/**
 * Get CSRF token
 * @param {String} name
 * @returns Cookie value
 */
export const getCookie = (name) => {
  const cookies = document.cookie.split("; ");
  const cookie = cookies.find((c) => c.startsWith(name));
  return cookie ? cookie.split("=")[1] : null;
};

export const checkError = function (error) {
  if (!error.code) {
    return;
  }
  for (const key in AUTH_ERRORS) {
    if (AUTH_ERRORS[key].code === error.code) {
      error.message = t(`shared:auth_errors.${key}`, {
        defaultValue: AUTH_ERRORS[key].message,
      });
      return;
    }
  }
  const code = error.code.split("/")[1];
  const message = code.split("-").join(" ");
  error.message = message;
  return;
};
