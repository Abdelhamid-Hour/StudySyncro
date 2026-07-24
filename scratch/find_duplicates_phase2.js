const fs = require('fs');
const path = require('path');

function flattenJSON(obj, prefix = '', res = {}) {
  for (let key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      flattenJSON(obj[key], prefix + key + '.', res);
    } else {
      res[prefix + key] = obj[key];
    }
  }
  return res;
}

function loadLocales(dir) {
  const dict = {};
  if (!fs.existsSync(dir)) return dict;
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
  for (const file of files) {
    const ns = file.replace('.json', '');
    const content = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
    const flat = flattenJSON(content, ns + ':');
    Object.assign(dict, flat);
  }
  return dict;
}

function findDuplicates(dict) {
  const valueMap = new Map();
  
  for (const [key, value] of Object.entries(dict)) {
    if (typeof value !== 'string') continue; // skip arrays or booleans just in case
    if (!value.trim()) continue; // skip empty strings
    
    // Use the raw value to find exact duplicates. 
    // You could also do value.trim().toLowerCase() for broader matches.
    const normalizedValue = value.trim(); 
    
    if (!valueMap.has(normalizedValue)) {
      valueMap.set(normalizedValue, []);
    }
    valueMap.get(normalizedValue).push(key);
  }
  
  const duplicates = [];
  for (const [value, keys] of valueMap.entries()) {
    if (keys.length > 1) {
      duplicates.push({ value, keys });
    }
  }
  
  // Sort by number of duplicates descending
  duplicates.sort((a, b) => b.keys.length - a.keys.length);
  return duplicates;
}

const enDict = loadLocales('d:\\PFE\\client\\public\\locales\\en');
const arDict = loadLocales('d:\\PFE\\client\\public\\locales\\ar');

const enDuplicates = findDuplicates(enDict);
const arDuplicates = findDuplicates(arDict);

let report = "=== PHASE 2: DEDUPLICATION REPORT ===\n\n";

report += `--- ENGLISH DUPLICATES (${enDuplicates.length} repeated values) ---\n`;
enDuplicates.forEach(dup => {
  report += `Value: "${dup.value}"\n`;
  dup.keys.forEach(k => report += `  - ${k}\n`);
  report += "\n";
});

report += `--- ARABIC DUPLICATES (${arDuplicates.length} repeated values) ---\n`;
arDuplicates.forEach(dup => {
  report += `Value: "${dup.value}"\n`;
  dup.keys.forEach(k => report += `  - ${k}\n`);
  report += "\n";
});

fs.writeFileSync('d:\\PFE\\deduplication_phase2_report.txt', report);
console.log(`Deduplication scan complete! Found ${enDuplicates.length} En duplicates and ${arDuplicates.length} Ar duplicates.`);
