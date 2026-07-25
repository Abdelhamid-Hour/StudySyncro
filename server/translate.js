const fs = require('fs');
const path = require('path');

const strings = JSON.parse(fs.readFileSync(path.join(__dirname, 'extracted_strings.json'), 'utf-8'));

const generateKey = (str) => {
  return str.toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .substring(0, 50); // limit length
};

const enMap = {};
const arMap = {};
const stringToKey = {};

strings.forEach(str => {
  let key = generateKey(str);
  // Handle collisions
  let originalKey = key;
  let counter = 1;
  while (enMap[key] && enMap[key] !== str) {
    key = `${originalKey}_${counter}`;
    counter++;
  }
  
  enMap[key] = str;
  stringToKey[str] = key;
});



// Write locales
const localesDir = path.join(__dirname, 'locales');
if (!fs.existsSync(localesDir)) fs.mkdirSync(localesDir);

const enDir = path.join(localesDir, 'en');
if (!fs.existsSync(enDir)) fs.mkdirSync(enDir);
fs.writeFileSync(path.join(enDir, 'api.json'), JSON.stringify(enMap, null, 2));


console.log('Locales generated.');

// Replace in files
const replaceInFile = (filePath, isController) => {
  let content = fs.readFileSync(filePath, 'utf-8');
  let originalContent = content;

  // We need to match strings carefully to avoid replacing imports or other things.
  // We will only replace strings that match our exact extracted list, when they are inside an object (e.g., message: "...") or Error("...").

  strings.forEach(str => {
    const key = stringToKey[str];
    
    // Replace in message: "..."
    // Using regex to carefully replace ONLY the exact string when it's assigned to 'message' or 'error'
    const escapeRegex = (s) => s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    
    // We match: message: 'str' or message: "str" or Error('str') or Error("str")
    const strEscaped = escapeRegex(str);
    
    if (isController) {
      // In controllers, we wrap in res.locals.t("api:key")
      // But wait, the controller might just be passing result.message
      const regexMsg1 = new RegExp(`message:\\s*(["'])${strEscaped}\\1`, 'g');
      content = content.replace(regexMsg1, `message: res.locals.t("api:${key}")`);
      
      const regexErr1 = new RegExp(`error:\\s*(["'])${strEscaped}\\1`, 'g');
      content = content.replace(regexErr1, `error: res.locals.t("api:${key}")`);

      // For direct string responses, e.g. res.status(200).json({ message: "User data updated" })
      // The above regex already covers it.
    } else {
      // In utils, we just return the translation key "api:key"
      const regexMsg1 = new RegExp(`message:\\s*(["'])${strEscaped}\\1`, 'g');
      content = content.replace(regexMsg1, `message: "api:${key}"`);
      
      const regexErr1 = new RegExp(`error:\\s*(["'])${strEscaped}\\1`, 'g');
      content = content.replace(regexErr1, `error: "api:${key}"`);
      
      const regexThrow = new RegExp(`Error\\(\\s*(["'])${strEscaped}\\1\\s*\\)`, 'g');
      content = content.replace(regexThrow, `Error("api:${key}")`);
    }
  });

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Updated ${filePath}`);
  }
};

const walkSync = (dir, isController) => {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    if (fs.statSync(dirFile).isDirectory()) {
      walkSync(dirFile, isController);
    } else {
      if (dirFile.endsWith('.js')) {
        replaceInFile(dirFile, isController);
      }
    }
  });
};

walkSync(path.join(__dirname, 'controllers'), true);
walkSync(path.join(__dirname, 'utils', 'firebase-utils'), false);

console.log('Replacement complete.');
