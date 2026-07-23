const fs = require("fs");
const path = require("path");

const supportedLangs = ["en", "ar"];
const defaultLang = "en";
const localesDir = path.join(__dirname, "../locales");

// In-memory cache for loaded translation dictionaries
// Structure: { en: { common: {...}, groups: {...} }, ar: { common: {...} } }
const dictionaryCache = {};

/**
 * Loads a translation namespace (e.g., 'common', 'groups') for a given language.
 * Falls back to 'en' if the file is missing or invalid.
 */
const getNamespaceDictionary = (lang, namespace) => {
  if (!dictionaryCache[lang]) {
    dictionaryCache[lang] = {};
  }

  if (dictionaryCache[lang][namespace]) {
    return dictionaryCache[lang][namespace];
  }

  const filePath = path.join(localesDir, lang, `${namespace}.json`);
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf8");
      dictionaryCache[lang][namespace] = JSON.parse(content);
      return dictionaryCache[lang][namespace];
    }
  } catch (err) {
    console.error(`[i18n] Error loading dictionary ${filePath}:`, err.message);
  }

  // Fallback to English if not defaultLang
  if (lang !== defaultLang) {
    return getNamespaceDictionary(defaultLang, namespace);
  }

  return {};
};

/**
 * Express middleware to attach i18n variables and t() helper to res.locals.
 */
module.exports = (req, res, next) => {
  let chosenLang = defaultLang;

  // Priority 1: Check Cookie
  if (req.cookies && req.cookies.lang && supportedLangs.includes(req.cookies.lang)) {
    chosenLang = req.cookies.lang;
  }
  // Priority 2: Check Accept-Language Header
  else if (req.headers && req.headers["accept-language"]) {
    const browserLang = req.headers["accept-language"].split(",")[0].trim().slice(0, 2);
    if (supportedLangs.includes(browserLang)) {
      chosenLang = browserLang;
    }
  }

  res.locals.lang = chosenLang;
  res.locals.dir = chosenLang === "ar" ? "rtl" : "ltr";

  /**
   * Translation function attached to res.locals.t
   * @param {string} keyPath - Dot notation path, e.g., "common.logout" or "groups.header.title"
   * @param {object} params - Key-value variables for interpolation, including optional 'count' for pluralization
   */
  res.locals.t = (keyPath, params = {}) => {
    if (!keyPath || typeof keyPath !== "string") return keyPath;

    let namespace = "common";
    let path = keyPath;

    if (keyPath.includes(":")) {
      const colParts = keyPath.split(":");
      namespace = colParts[0];
      path = colParts.slice(1).join(":");
    } else if (keyPath.includes(".")) {
      const dotParts = keyPath.split(".");
      namespace = dotParts[0];
      path = dotParts.slice(1).join(".");
    }

    const keys = path.split(".");

    let val = getNamespaceDictionary(chosenLang, namespace);

    for (const k of keys) {
      if (val && typeof val === "object" && k in val) {
        val = val[k];
      } else {
        // Fallback: check defaultLang dictionary if chosenLang didn't have the key
        if (chosenLang !== defaultLang) {
          let fallbackVal = getNamespaceDictionary(defaultLang, namespace);
          for (const fk of keys) {
            if (fallbackVal && typeof fallbackVal === "object" && fk in fallbackVal) {
              fallbackVal = fallbackVal[fk];
            } else {
              return keyPath;
            }
          }
          val = fallbackVal;
          break;
        }
        return keyPath;
      }
    }

    // Pluralization resolution if resolved value is an object and params.count is defined
    if (val && typeof val === "object" && params.count !== undefined) {
      try {
        const pr = new Intl.PluralRules(chosenLang).select(Number(params.count));
        val = val[pr] || val.other || Object.values(val)[0] || keyPath;
      } catch (e) {
        val = val.other || Object.values(val)[0] || keyPath;
      }
    }

    // Variable interpolation
    if (typeof val === "string") {
      return val.replace(/{(\w+)}/g, (_, match) =>
        params[match] !== undefined ? params[match] : `{${match}}`
      );
    }

    return typeof val === "string" ? val : keyPath;
  };

  next();
};
