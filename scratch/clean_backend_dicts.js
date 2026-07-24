const fs = require('fs');
const path = require('path');

const mapData = JSON.parse(fs.readFileSync('d:\\PFE\\scratch\\backend_deduplication_map.json', 'utf8'));

function deleteKeyPath(obj, keyPath) {
  const parts = keyPath.split('.');
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!current[parts[i]]) return;
    current = current[parts[i]];
  }
  const lastPart = parts[parts.length - 1];
  delete current[lastPart];
}

function cleanEmptyObjects(obj) {
  let hasProperties = false;
  for (const key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      const childHasProps = cleanEmptyObjects(obj[key]);
      if (!childHasProps) {
        delete obj[key];
      } else {
        hasProperties = true;
      }
    } else {
      hasProperties = true;
    }
  }
  return hasProperties;
}

function setKeyPath(obj, keyPath, value) {
  const parts = keyPath.split('.');
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!current[parts[i]]) {
      current[parts[i]] = {};
    }
    current = current[parts[i]];
  }
  current[parts[parts.length - 1]] = value;
}

function processLang(lang) {
  const dir = `d:\\PFE\\server\\locales\\${lang}`;
  if (!fs.existsSync(dir)) return;
  
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
  
  for (const file of files) {
    const ns = file.replace('.json', '');
    const filePath = path.join(dir, file);
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    let modified = false;
    
    // 1. Delete redundant keys
    for (const oldKey in mapData.mapping) {
      if (oldKey.startsWith(ns + ':')) {
        const pathPart = oldKey.replace(ns + ':', '');
        deleteKeyPath(content, pathPart);
        modified = true;
      }
    }
    
    // 2. Insert new shared terms (if it's common.json)
    if (ns === 'common') {
      const terms = mapData.new_shared_terms[lang];
      for (const slug in terms) {
        setKeyPath(content, `shared_terms.${slug}`, terms[slug]);
        modified = true;
      }
    }
    
    if (modified) {
      cleanEmptyObjects(content);
      fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf8');
      console.log(`Updated ${lang}/${file}`);
    }
  }
}

processLang('en');
processLang('ar');

console.log("Backend dictionary cleanup complete!");
