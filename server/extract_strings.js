const fs = require('fs');
const path = require('path');

const dirs = [
  path.join(__dirname, 'controllers'),
  path.join(__dirname, 'utils', 'firebase-utils')
];

const results = [];

const walkSync = (dir, filelist = []) => {
  if (!fs.existsSync(dir)) return filelist;
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    if (fs.statSync(dirFile).isDirectory()) {
      filelist = walkSync(dirFile, filelist);
    } else {
      if (dirFile.endsWith('.js')) {
        filelist.push(dirFile);
      }
    }
  });
  return filelist;
};

const extract = () => {
  dirs.forEach(dir => {
    const files = walkSync(dir);
    files.forEach(file => {
      const content = fs.readFileSync(file, 'utf-8');
      
      const messageRegex = /message:\s*(["'])(.*?)\1/g;
      let match;
      while ((match = messageRegex.exec(content)) !== null) {
        results.push({ file: path.relative(__dirname, file), string: match[2], type: 'message' });
      }

      const errorRegex = /new Error\(\s*(["'])(.*?)\1\s*\)/g;
      while ((match = errorRegex.exec(content)) !== null) {
        results.push({ file: path.relative(__dirname, file), string: match[2], type: 'error' });
      }
    });
  });

  const uniqueStrings = [...new Set(results.map(r => r.string))];
  console.log(`Found ${results.length} instances of strings across ${uniqueStrings.length} unique strings.`);
  
  // write to a file so we can read it back easily
  fs.writeFileSync(path.join(__dirname, 'extracted_strings.json'), JSON.stringify(uniqueStrings, null, 2));
};

extract();
