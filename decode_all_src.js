const fs = require('fs');
const path = require('path');

let count = 0;

function decodeDirectory(dirPath) {
  const items = fs.readdirSync(dirPath);

  for (const item of items) {
    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      decodeDirectory(fullPath);
    } else if (stat.isFile()) {
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.startsWith('{"data":')) {
          const parsed = JSON.parse(content);
          if (parsed.data) {
            const decoded = Buffer.from(parsed.data, 'base64').toString('utf8');
            fs.writeFileSync(fullPath, decoded, 'utf8');
            count++;
          }
        }
      } catch (e) {
        // Ignore binary or read errors
      }
    }
  }
}

console.log('🔍 Recursively decoding base64 files in src/...');
decodeDirectory('src');
console.log(`🎉 Successfully decoded ${count} source files in src/!`);
