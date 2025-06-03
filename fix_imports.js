import fs from 'fs';
import path from 'path';

const dir = './dist';

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/(from\s+['"]\.\/[^'"]+?)(?<!\.js)(['"])/g, '$1.js$2');
  fs.writeFileSync(filePath, content);
}

function walk(dirPath) {
  for (const file of fs.readdirSync(dirPath)) {
    const fullPath = path.join(dirPath, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) walk(fullPath);
    else if (file.endsWith('.js')) fixFile(fullPath);
  }
}

walk(dir);
