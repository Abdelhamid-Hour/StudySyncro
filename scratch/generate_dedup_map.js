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

function sanitizeForPath(val) {
  return val.trim().toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
}

function findDuplicates(dict) {
  const valueMap = new Map();
  for (const [key, value] of Object.entries(dict)) {
    if (typeof value !== 'string') continue;
    if (!value.trim()) continue;
    
    // IGNORE PLURAL KEYS
    if (key.match(/\.(zero|one|two|few|many|other)$/)) {
      continue;
    }
    
    // IGNORE DYNAMIC PREFIXES
    if (
      key.startsWith('groups:badges.') ||
      key.startsWith('common:forms.levels.') ||
      key.startsWith('common:forms.visibility.') ||
      key.startsWith('notifications:messages.') ||
      key.startsWith('common:auth_errors.') ||
      key.startsWith('shared:auth_errors.') ||
      key.startsWith('quizzes:editor.') ||
      key.startsWith('common:shared_quizzes.status.')
    ) {
      continue;
    }
    
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
  return duplicates;
}

const enDict = loadLocales('d:\\PFE\\client\\public\\locales\\en');
const arDict = loadLocales('d:\\PFE\\client\\public\\locales\\ar');

const enDuplicates = findDuplicates(enDict);

const output = {
  new_shared_terms: {
    en: {},
    ar: {}
  },
  mapping: {}
};

enDuplicates.forEach(dup => {
  let canonicalKey = null;
  
  // Prefer a key in the common namespace
  const commonKeys = dup.keys.filter(k => k.startsWith('common:'));
  if (commonKeys.length > 0) {
    // Pick the shortest common key
    canonicalKey = commonKeys.sort((a, b) => a.length - b.length)[0];
  } else {
    // Create a new key in common:shared_terms
    const sanitized = sanitizeForPath(dup.value);
    let finalSlug = sanitized;
    let counter = 1;
    while (output.new_shared_terms.en[finalSlug]) {
      // Avoid collisions if two different english strings sanitize to the same slug
      finalSlug = `${sanitized}_${counter}`;
      counter++;
    }
    
    canonicalKey = `common:shared_terms.${finalSlug}`;
    output.new_shared_terms.en[finalSlug] = dup.value;
    
    // Find the Arabic equivalent using one of the redundant keys
    const fallbackKey = dup.keys[0];
    const arValue = arDict[fallbackKey] || dup.value; // Fallback to English if Arabic is missing (shouldn't happen)
    output.new_shared_terms.ar[finalSlug] = arValue;
  }
  
  // Map ALL redundant keys (including non-chosen common keys) to the canonical key
  dup.keys.forEach(k => {
    if (k !== canonicalKey) {
      output.mapping[k] = canonicalKey;
    }
  });
});

fs.writeFileSync('d:\\PFE\\scratch\\deduplication_map.json', JSON.stringify(output, null, 2));
console.log(`Deduplication map generated with ${Object.keys(output.mapping).length} key remappings and ${Object.keys(output.new_shared_terms.en).length} new shared terms.`);
