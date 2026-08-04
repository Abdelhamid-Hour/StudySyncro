/**
 * Client-Side i18n Utility & Language Switcher
 * Handles dictionary fetching, caching, DOM translation, and language persistence.
 */

import { getFrozenPromise, getRouteSignal } from "./utils.mjs";

const SUPPORTED_LANGUAGES = ["en", "ar"];
const DEFAULT_LANGUAGE = "en";

// In-memory cache for current language and loaded localization namespaces
let currentLang = null;
let currentNamespaces = ["common"];
const localesCache = {
  en: {},
  ar: {},
};

/**
 * Resolves the current language according to precedence:
 * (1) Cookie ('lang')
 * (2) Browser Accept-Language (navigator.language)
 * (3) Fallback: 'en'
 * Uses in-memory cache currentLang after first resolution.
 * @returns {string} - 'en' or 'ar'
 */
export const getLang = () => {
  if (currentLang) return currentLang;

  try {
    // 1. Check Cookie
    const cookies = document.cookie.split("; ");
    const langCookie = cookies.find((row) => row.startsWith("lang="));
    if (langCookie) {
      const cookieVal = langCookie.split("=")[1]?.trim();
      if (SUPPORTED_LANGUAGES.includes(cookieVal)) {
        currentLang = cookieVal;
        return currentLang;
      }
    }

    // 2. Check Browser Accept-Language
    const browserLang = (
      navigator.language ||
      navigator.userLanguage ||
      ""
    ).toLowerCase();
    if (browserLang.startsWith("ar")) {
      currentLang = "ar";
      return currentLang;
    }
    if (browserLang.startsWith("en")) {
      currentLang = "en";
      return currentLang;
    }
  } catch (e) {
    console.warn("Error resolving language from cookie/browser:", e);
  }

  // 3. Fallback
  currentLang = DEFAULT_LANGUAGE;
  return currentLang;
};

/**
 * Sets the current language in cookies, updates in-memory currentLang, and updates document attributes.
 * @param {string} lang - 'en' or 'ar'
 */
export const setLang = (lang) => {
  const validLang = SUPPORTED_LANGUAGES.includes(lang)
    ? lang
    : DEFAULT_LANGUAGE;

  if (validLang === currentLang) return validLang;

  currentLang = validLang;

  // Set Cookie for 1 year (no database storage, no query parameters)
  document.cookie = `lang=${validLang}; path=/; max-age=31536000; SameSite=Lax`;

  return validLang;
};

/**
 * Loads a single dictionary namespace JSON from the server.
 * @param {string} ns - Namespace (e.g., 'common', 'groups')
 * @param {string} [lang] - Language code (defaults to getLang())
 * @returns {Promise<Object>} - The loaded dictionary object
 */
export const loadNamespace = async (ns = "common", lang = getLang()) => {
  if (localesCache[lang]?.[ns]) {
    return localesCache[lang][ns];
  }

  try {
    const signal =
      typeof getRouteSignal === "function" ? getRouteSignal() : undefined;
    const response = await fetch(`/locales/${lang}/${ns}.json`, { signal });
    if (!response.ok) {
      throw new Error(
        `Failed to load namespace "${ns}" for language "${lang}" (${response.status})`,
      );
    }
    const data = await response.json();
    if (!localesCache[lang]) localesCache[lang] = {};
    localesCache[lang][ns] = data;
    return data;
  } catch (error) {
    if (error.name === "AbortError" && typeof getFrozenPromise === "function") {
      return getFrozenPromise();
    }
    console.error("i18n loadNamespace error:", error);
    return {};
  }
};

/**
 * Loads multiple dictionary namespaces in parallel.
 * @param {string[]} namespaces - Array of namespace strings
 * @returns {Promise<Object>} - Combined namespaces map
 */
export const loadNamespaces = async (namespaces = ["common"]) => {
  const lang = getLang();
  await Promise.all(namespaces.map((ns) => loadNamespace(ns, lang)));
  return localesCache[lang];
};

/**
 * Translates a key with optional interpolation parameters and pluralization.
 * Supports "namespace:path.to.key" notation (defaults to 'common' if no namespace given).
 * @param {string} key - Key string (e.g., "shared:alerts.error_occurred" or "time.ago_minutes")
 * @param {Object} [params] - Interpolation & pluralization arguments (e.g., { count: 5, name: "file.pdf" })
 * @returns {string} - Translated and interpolated string
 */
export const t = (key, params = {}) => {
  if (key.includes("messages.verification_invalid")) debugger;
  if (!key || typeof key !== "string") return "";

  const lang = getLang();
  let ns = "common";
  let path = key;

  if (key.includes(":")) {
    const parts = key.split(":");
    ns = parts[0];
    path = parts[1];
  }

  const dictionary = localesCache[lang]?.[ns];
  if (!dictionary) {
    // If dictionary is not loaded in memory yet, return key as fallback
    return path;
  }

  // Resolve nested object path
  const keys = path.split(".");
  let val = dictionary;
  for (const k of keys) {
    if (val && typeof val === "object" && k in val) {
      val = val[k];
    } else {
      val = undefined;
      break;
    }
  }

  if (val === undefined) {
    return path;
  }

  // Handle Pluralization if resolved value is an object containing plural rules
  if (typeof val === "object" && val !== null) {
    if (params.count !== undefined && typeof params.count === "number") {
      const pluralRules = new Intl.PluralRules(lang);
      const rule = pluralRules.select(params.count);
      val = val[rule] || val.other || val[Object.keys(val)[0]] || path;
    } else {
      // If object without count, return string representation or path
      return path;
    }
  }

  if (typeof val !== "string") {
    return path;
  }

  // Interpolation: replace placeholders like {name} or {count}
  return val.replace(/\{(\w+)\}/g, (match, prop) => {
    return params[prop] !== undefined ? params[prop] : match;
  });
};

/**
 * Switches the active language, updates cookies/attributes, and either reloads or updates static DOM.
 * @param {string} newLang - 'en' or 'ar'
 * @param {boolean} [isStatic=false] - Whether in static pages mode
 */
export const changeLanguage = async (newLang) => {
  if (!SUPPORTED_LANGUAGES.includes(newLang)) return;
  if (newLang === getLang()) return;

  setLang(newLang);

  window.location.reload();
};

/**
 * Initializes the Language Switcher UI via global event delegation.
 * @param {boolean} [isStatic=false] - Whether in static pages mode
 */
export const initLanguageSwitcher = () => {
  document.addEventListener("click", (e) => {
    const toggleBtn = e.target.closest(".lang-toggle-btn");
    if (toggleBtn) {
      e.preventDefault();
      const nextLang = getLang() === "ar" ? "en" : "ar";
      const labelSpan =
        toggleBtn.querySelector(".lang-toggle-text") || toggleBtn;
      if (labelSpan) {
        labelSpan.textContent = nextLang === "ar" ? "EN" : "AR";
      }
      toggleBtn.setAttribute(
        "title",
        nextLang === "ar"
          ? t("shared:actions.switch_to_en", {
              defaultValue: "Switch to English",
            })
          : t("shared:actions.switch_to_ar", {
              defaultValue: "التحويل إلى العربية",
            }),
      );
      changeLanguage(nextLang);
    }
  });
};

/**
 * Initializes client-side i18n, loads namespaces, and initializes Switchers/translateDOM.
 * @param {string[]} namespaces - Initial namespaces to load (default: ['common'])
 */
export const initI18n = async (namespaces = ["common"]) => {
  if (Array.isArray(namespaces)) {
    currentNamespaces = namespaces;
  }

  const lang = setLang(getLang());
  await loadNamespaces(currentNamespaces);
  initLanguageSwitcher();
  return lang;
};
