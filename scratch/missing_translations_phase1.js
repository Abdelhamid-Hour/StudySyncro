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
  } else if (normalizedPath.includes('/app/assets/home')) {
    allowed.push('home');
  } else if (normalizedPath.includes('/app/assets/settings')) {
    allowed.push('settings');
  }
  return allowed;
}

// --- 2. Strict Key Extraction ---
const FrontendCodeKeys = new Map();
const BackendCodeKeys = new Map();
const FrontendDynamicKeys = new Set();
const BackendDynamicKeys = new Set();
const FrontendNamespaceViolations = [];

// \b ensures we match the function 't' and not 'setTimeout'
const tStaticRegex = /\bt\(\s*(['"`])(.*?)\1\s*(?:,|\))/g;
// Match any t(...) to catch dynamic ones
const tDynamicRegex = /\bt\(\s*(.*?)\s*\)/g;

function extractKeys(files, keyMap, dynamicSet, isFrontend = false) {
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
          dynamicSet.add(`[In: ${file}:${i + 1}] -> \`${key}\``);
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
          dynamicSet.add(`[In: ${file}:${i + 1}] -> ${inner}`);
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

report += "\n--- DYNAMIC KEYS (Requires Manual Checking) ---\n";
report += "Frontend Dynamic Keys:\n";
for (const dyn of FrontendDynamicKeys) {
  report += `  - ${dyn}\n`;
}
report += "\nBackend Dynamic Keys:\n";
for (const dyn of BackendDynamicKeys) {
  report += `  - ${dyn}\n`;
}

report += `\n=== SUMMARY ===\n`;
report += `Frontend Missing Static Keys: ${frontMissing}\n`;
report += `Backend Missing Static Keys: ${backMissing}\n`;
report += `Frontend Namespace Violations: ${FrontendNamespaceViolations.length}\n`;
report += `Frontend Dynamic Keys: ${FrontendDynamicKeys.size}\n`;
report += `Backend Dynamic Keys: ${BackendDynamicKeys.size}\n`;

fs.writeFileSync('d:\\PFE\\missing_translations_phase1_report.txt', report);
console.log(`Report generated! Missing Front: ${frontMissing}, Back: ${backMissing}. Check d:\\PFE\\missing_translations_phase1_report.txt`);
