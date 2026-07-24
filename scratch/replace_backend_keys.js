const fs = require('fs');
const path = require('path');

const mapData = JSON.parse(fs.readFileSync('d:\\PFE\\scratch\\backend_deduplication_map.json', 'utf8'));
const mapping = mapData.mapping;

function getAllFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      if (file !== 'locales' && file !== 'node_modules') {
        getAllFiles(filePath, fileList);
      }
    } else if (file.endsWith('.js') || file.endsWith('.ejs') || file.endsWith('.html')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const backendFiles = getAllFiles('d:\\PFE\\server');

let replacementsCount = 0;

backendFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // We only replace keys that match EXACTLY in the t("...") function
  // Sort keys by length descending to replace longer keys first (prevent partial match bugs)
  const oldKeys = Object.keys(mapping).sort((a, b) => b.length - a.length);

  oldKeys.forEach(oldKey => {
    const canonicalKey = mapping[oldKey];
    
    // Replace `t("old:key")`, `t('old:key')`, `t(`old:key`)`
    
    const escapedOldKey = oldKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\bt\\(\\s*(['"\`])${escapedOldKey}\\1`, 'g');
    
    content = content.replace(regex, (match, quote) => {
      replacementsCount++;
      return `t(${quote}${canonicalKey}${quote}`;
    });
  });

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
  }
});

console.log(`Backend codebase refactoring complete! Made ${replacementsCount} replacements.`);
