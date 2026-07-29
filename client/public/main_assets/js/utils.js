import { AUTH_ERRORS } from "./variables.js";
import {
  t,
  getLang,
  setLang,
  loadNamespace,
  loadNamespaces,
  initI18n,
  changeLanguage,
  initLanguageSwitcher,
} from "./i18n.js";

export {
  t,
  getLang,
  setLang,
  loadNamespace,
  loadNamespaces,
  initI18n,
  changeLanguage,
  initLanguageSwitcher,
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
    ".messages-blocks-wrapper"
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

export const isNativeDomainCondition = (errorOrMsg) => {
  if (!errorOrMsg) return false;
  const isObj = typeof errorOrMsg === "object";
  if (isObj && (errorOrMsg.isNative || errorOrMsg.data?.isNative)) return true;
  if (isObj && (errorOrMsg.type === "info" || errorOrMsg.type === "warning" || errorOrMsg.data?.type === "info" || errorOrMsg.data?.type === "warning")) return true;

  const msg = (isObj ? (errorOrMsg.message || errorOrMsg.data?.message || "") : errorOrMsg).toString().toLowerCase();
  if (!msg) return false;

  const nativePhrases = [
    "group is full",
    "already a member",
    "already sent a request",
    "already requested",
    "group does not exist",
    "group not found",
    "cannot join this group",
    "private and not visible",
    "invitation not found",
    "invitation expired",
    "demande not found",
    "already processed",
    "already invited",
    "creator must transfer",
    "must transfer your role",
    "creator cannot leave",
    "quiz title already exists",
    "already exists",
    "no questions",
    "cannot start quiz",
    "already passed",
    "session not found",
    "session has ended",
    "session already ended",
    "already in this session",
    "only group creator",
    "current password is incorrect",
    "cannot be empty",
  ];

  return nativePhrases.some((phrase) => msg.includes(phrase));
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

  if (!response.ok) {
    if (response.status === 401) {
      // Handle unauthorized access
      showMessageBlock(
        t("common:alerts.unauthorized"),
        "warning"
      );
      setTimeout(() => {
        redirectTo("/login");
      }, 2000);
      return;
    }

    // if the responce is for redirection
    if (response.status === 301) {
      history.back();
    }

    const responseData = await response.json().catch(() => ({ message: t("common:alerts.error_occurred") }));
    const error = new Error(responseData.message || t("common:alerts.error_occurred"));
    error.data = responseData;
    error.status = response.status;
    const isNative = responseData.isNative || isNativeDomainCondition(error);
    error.isNative = isNative;
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
export const sendData = async (
  url,
  data,
  method = "POST"
) => {
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
    { "x-requested-with": "fetch" }
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
      error.message = t(`shared:auth_errors.${key}`, { defaultValue: t(`common:auth_errors.${key}`, { defaultValue: AUTH_ERRORS[key].message }) });
      return;
    }
  }
  const code = error.code.split("/")[1];
  const message = code.split("-").join(" ");
  error.message = message;
  return;
};
