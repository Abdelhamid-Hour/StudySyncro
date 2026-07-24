const fs = require('fs');
const path = require('path');

// --- 1. File Discovery ---
function walk(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      if (!filePath.includes('node_modules') && !filePath.includes('.git')) {
        walk(filePath, fileList);
      }
    } else {
      if (filePath.endsWith('.js') || filePath.endsWith('.ejs') || filePath.endsWith('.html')) {
        fileList.push(filePath);
      }
    }
  }
  return fileList;
}

const clientFolders = [
  'd:\\PFE\\client\\public\\app\\assets',
  'd:\\PFE\\client\\public\\main_assets',
  'd:\\PFE\\client\\public\\login',
  'd:\\PFE\\client\\public\\reset-password'
];

const serverFolders = [
  'd:\\PFE\\server\\views',
  'd:\\PFE\\server\\controllers',
  'd:\\PFE\\server\\routes',
  'd:\\PFE\\server\\middleware',
  'd:\\PFE\\server\\utils'
];

let frontendFiles = [];
clientFolders.forEach(folder => walk(folder, frontendFiles));

let backendFiles = [];
serverFolders.forEach(folder => walk(folder, backendFiles));

// --- Frontend Namespace Rules ---
// Define allowed namespaces per folder. "common" and "notifications" are usually globally available.
const globalNamespaces = ['common', 'notifications'];

function getAllowedNamespacesForFile(filePath) {
  const allowed = [...globalNamespaces];
  const normalizedPath = filePath.replace(/\\/g, '/');
  
  if (normalizedPath.includes('/app/assets/groups')) {
    allowed.push('groups');
    if (normalizedPath.includes('/group-chat')) allowed.push('group-chat');
  } else if (normalizedPath.includes('/app/assets/quizzes')) {
    allowed.push('quizzes');
    if (normalizedPath.includes('/quiz-editor')) allowed.push('quiz-edit');
  } else if (normalizedPath.includes('/app/assets/quiz-play')) {
    allowed.push('quizzes');
  } else if (normalizedPath.includes('/app/assets/home')) {
    allowed.push('home');
    if (normalizedPath.includes('/active')) allowed.push('group-chat');
  } else if (normalizedPath.includes('/app/assets/settings')) {
    allowed.push('settings');
  } else if (normalizedPath.includes('/app/assets/shared')) {
    if (normalizedPath.includes('/chat')) allowed.push('group-chat');
  } else if (normalizedPath.includes('/login')) {
    allowed.push('login', 'shared');
  } else if (normalizedPath.includes('/reset-password')) {
    allowed.push('reset_password');
  } else if (normalizedPath.includes('/main_assets')) {
    allowed.push('shared');
  }
  
  return allowed;
}

// --- 2. Strict Key Extraction ---
const FrontendCodeKeys = new Map();
const BackendCodeKeys = new Map();
const FrontendDynamicKeys = [];
const BackendDynamicKeys = [];
const FrontendNamespaceViolations = [];

// \b ensures we match the function 't' and not 'setTimeout'
const tStaticRegex = /\bt\(\s*(['"`])(.*?)\1\s*(?:,|\))/g;
// Match any t(...) to catch dynamic ones
const tDynamicRegex = /\bt\(\s*(.*?)\s*\)/g;

function extractKeys(files, keyMap, dynamicArray, isFrontend = false) {
  files.forEach(file => {
    const lines = fs.readFileSync(file, 'utf8').split('\n');
    const allowedNamespaces = isFrontend ? getAllowedNamespacesForFile(file) : null;

    lines.forEach((line, i) => {
      // Extract Static keys
      let match;
      while ((match = tStaticRegex.exec(line)) !== null) {
        const key = match[2];
        
        // If the key has interpolation like ${var}, it's dynamic
        if (key.includes('${')) {
          dynamicArray.push({
            file: `${file}:${i + 1}`,
            raw: `\`${key}\``,
            allowed: allowedNamespaces
          });
          continue;
        }

        if (!keyMap.has(key)) keyMap.set(key, new Set());
        keyMap.get(key).add(`${file}:${i + 1}`);

        // Check namespace violation for frontend
        if (isFrontend && key.includes(':')) {
          const ns = key.split(':')[0];
          if (!allowedNamespaces.includes(ns)) {
            FrontendNamespaceViolations.push({
              file: `${file}:${i + 1}`,
              key,
              ns,
              allowed: allowedNamespaces
            });
          }
        }
      }

      // Extract Dynamic keys (concatenation or complex interpolation)
      let dynMatch;
      while ((dynMatch = tDynamicRegex.exec(line)) !== null) {
        const inner = dynMatch[1].trim();
        // Skip if it's just a simple string (handled by static regex)
        if (/^['"`][^'"`]+['"`]$/.test(inner)) continue;
        // Skip empty or simple objects
        if (!inner || inner === '...' || inner.startsWith('{')) continue;

        // If it has + or ${} or no quotes, it's dynamic
        if (inner.includes('+') || inner.includes('${') || (!inner.includes('"') && !inner.includes("'") && !inner.includes("`"))) {
          dynamicArray.push({
            file: `${file}:${i + 1}`,
            raw: inner,
            allowed: allowedNamespaces
          });
        }
      }
    });
  });
}

extractKeys(frontendFiles, FrontendCodeKeys, FrontendDynamicKeys, true);
extractKeys(backendFiles, BackendCodeKeys, BackendDynamicKeys, false);

// --- 3. Dictionary Loading & Flattening ---
function flattenJSON(obj, prefix = '', res = new Set()) {
  for (let key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      res.add(prefix + key); // Add parent key as well
      flattenJSON(obj[key], prefix + key + '.', res);
    } else {
      res.add(prefix + key);
    }
  }
  return res;
}

function loadDictionaries(dir) {
  const dict = new Set();
  if (!fs.existsSync(dir)) return dict;
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
  for (const file of files) {
    const ns = file.replace('.json', '');
    const content = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
    flattenJSON(content, ns + ':', dict);
  }
  return dict;
}

const ClientEnDict = loadDictionaries('d:\\PFE\\client\\public\\locales\\en');
const ClientArDict = loadDictionaries('d:\\PFE\\client\\public\\locales\\ar');
const ServerEnDict = loadDictionaries('d:\\PFE\\server\\locales\\en');
const ServerArDict = loadDictionaries('d:\\PFE\\server\\locales\\ar');

// --- 4. Cross-Referencing & 5. Report Generation ---
let report = "=== PHASE 1: TRANSLATIONS REPORT ===\n\n";

function checkMissing(codeKeys, enDict, arDict, type) {
  let missingCount = 0;
  for (const [key, locations] of codeKeys.entries()) {
    const inEn = enDict.has(key);
    const inAr = arDict.has(key);
    
    if (!inEn || !inAr) {
      missingCount++;
      let status = "";
      if (!inEn && !inAr) status = "Missing in BOTH (En & Ar)";
      else if (!inEn) status = "Missing in ENGLISH";
      else if (!inAr) status = "Missing in ARABIC";
      
      report += `[${type}] KEY: "${key}"\n`;
      report += `  Status: ${status}\n`;
      report += `  Found in code at:\n`;
      for (const loc of locations) {
        report += `    - ${loc}\n`;
      }
      report += "\n";
    }
  }
  return missingCount;
}

report += "--- MISSING STATIC KEYS ---\n";
const frontMissing = checkMissing(FrontendCodeKeys, ClientEnDict, ClientArDict, "FRONTEND");
const backMissing = checkMissing(BackendCodeKeys, ServerEnDict, ServerArDict, "BACKEND");

if (FrontendNamespaceViolations.length > 0) {
  report += "\n--- FRONTEND NAMESPACE VIOLATIONS ---\n";
  report += "These keys use a namespace that is not typically loaded for this page.\n\n";
  FrontendNamespaceViolations.forEach(v => {
    report += `File: ${v.file}\n`;
    report += `  Key: "${v.key}"\n`;
    report += `  Namespace Used: "${v.ns}"\n`;
    report += `  Allowed Namespaces: ${v.allowed.join(', ')}\n\n`;
  });
}

function extractDynamicInfo(raw) {
  // Try to remove the options object if present: e.g. `"key", { ... }`
  let keyPart = raw.split(',')[0].trim();
  
  // Extract static prefix before the first dynamic part (+ or ${)
  let staticPrefix = keyPart;
  if (staticPrefix.includes('${')) {
    staticPrefix = staticPrefix.split('${')[0];
  } else if (staticPrefix.includes('+')) {
    staticPrefix = staticPrefix.split('+')[0];
  }
  
  // Remove backticks, quotes and spaces
  staticPrefix = staticPrefix.replace(/['"`\s]/g, '');
  let ns = 'common';
  if (staticPrefix.includes(':')) {
    ns = staticPrefix.split(':')[0].trim();
  }
  
  return { ns, staticPrefix };
}

function analyzeDynamicKeys(dynamicArray, enDict, arDict, type) {
  let dynamicReport = "";
  for (const item of dynamicArray) {
    const info = extractDynamicInfo(item.raw);
    
    // Check namespace
    let nsStatus = "OK";
    if (item.allowed && !item.allowed.includes(info.ns)) {
      nsStatus = "VIOLATION (Not allowed)";
    }
    
    // Check static prefix exists
    let prefixExistsEn = false;
    let prefixExistsAr = false;
    let possibleChildren = new Set();
    
    for (const k of enDict) {
      if (k.startsWith(info.staticPrefix)) {
        prefixExistsEn = true;
        const child = k.replace(info.staticPrefix, '');
        if (child) possibleChildren.add(child.split('.')[0]);
      }
    }
    for (const k of arDict) {
      if (k.startsWith(info.staticPrefix)) {
        prefixExistsAr = true;
      }
    }
    
    dynamicReport += `File: ${item.file}\n`;
    dynamicReport += `  Raw Expression: ${item.raw}\n`;
    dynamicReport += `  Static Prefix Found: "${info.staticPrefix}"\n`;
    dynamicReport += `  Namespace Valid: ${nsStatus}\n`;
    dynamicReport += `  Prefix Exists in Dictionaries: En: ${prefixExistsEn ? "YES" : "NO"}, Ar: ${prefixExistsAr ? "YES" : "NO"}\n`;
    if (prefixExistsEn) {
      const childrenArr = Array.from(possibleChildren).filter(Boolean);
      if (childrenArr.length > 0 && childrenArr.length <= 15) {
        dynamicReport += `  Available Children in Dict: ${childrenArr.join(', ')}\n`;
      } else if (childrenArr.length > 15) {
        dynamicReport += `  Available Children in Dict: ${childrenArr.slice(0, 10).join(', ')}... (+${childrenArr.length - 10} more)\n`;
      } else {
        dynamicReport += `  Available Children in Dict: None (Exact match only)\n`;
      }
    }
    dynamicReport += "\n";
  }
  return dynamicReport;
}

report += "\n--- DYNAMIC KEYS ANALYSIS ---\n\n";
report += "FRONTEND DYNAMIC KEYS:\n";
report += analyzeDynamicKeys(FrontendDynamicKeys, ClientEnDict, ClientArDict, "FRONTEND");

report += "BACKEND DYNAMIC KEYS:\n";
report += analyzeDynamicKeys(BackendDynamicKeys, ServerEnDict, ServerArDict, "BACKEND");

report += `\n=== SUMMARY ===\n`;
report += `Frontend Missing Static Keys: ${frontMissing}\n`;
report += `Backend Missing Static Keys: ${backMissing}\n`;
report += `Frontend Namespace Violations: ${FrontendNamespaceViolations.length}\n`;
report += `Frontend Dynamic Keys: ${FrontendDynamicKeys.length}\n`;
report += `Backend Dynamic Keys: ${BackendDynamicKeys.length}\n`;

fs.writeFileSync('d:\\PFE\\missing_translations_phase1_report.txt', report);
console.log(`Report generated with advanced dynamic analysis.`);
