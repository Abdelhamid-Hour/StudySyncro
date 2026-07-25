const fs = require('fs');
const path = require('path');

const replaceInFile = (filePath) => {
  let content = fs.readFileSync(filePath, 'utf-8');
  let originalContent = content;

  // Replace `message: result.message` with `message: res.locals.t(result.message)`
  // Also handle `message: result.message || "fallback"` etc.
  
  // A simple regex to catch common patterns where result.message is passed directly to message
  const regex = /message:\s*([a-zA-Z0-9_\.]+\.message)/g;
  content = content.replace(regex, 'message: res.locals.t($1)');

  // Also replace `res.payload.message` which I saw in groupFragmentHandler
  const regexPayload = /message:\s*(res\.payload\.message)(\s*\|\|\s*["'].*?["'])?/g;
  content = content.replace(regexPayload, (match, p1, p2) => {
    if (p2) {
      return `message: res.locals.t(${p1}) ${p2}`;
    }
    return `message: res.locals.t(${p1})`;
  });

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Updated ${filePath}`);
  }
};

const walkSync = (dir) => {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    if (fs.statSync(dirFile).isDirectory()) {
      walkSync(dirFile);
    } else {
      if (dirFile.endsWith('.js')) {
        replaceInFile(dirFile);
      }
    }
  });
};

walkSync(path.join(__dirname, 'controllers'));
console.log('Finished wrapping variables with res.locals.t() in controllers.');
