const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.tsx')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk(path.join(__dirname, 'src'));

let replacedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // We want to replace "bg-white" with "bg-surface"
  // but we should avoid "hover:bg-white" and replace with "hover:bg-surface-hover" or just "hover:bg-surface"
  
  // Custom manual exclusions based on my review
  // src\components\settings\integrations-card.tsx has a toggle switch thumb that should stay white
  if (file.includes('integrations-card.tsx')) {
    // replace only the card container, not the switch thumb
    content = content.replace(/className="bg-white border border-border rounded-xl/g, 'className="bg-surface border border-border rounded-xl');
  } else {
    content = content.replace(/\bbg-white\b/g, 'bg-surface');
    // For hover:bg-white which became hover:bg-surface, let's make it hover:bg-surface-hover if it makes sense, but hover:bg-surface is fine too
  }

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    replacedCount++;
    console.log(`Replaced in ${file}`);
  }
});

console.log(`Finished replacing in ${replacedCount} files.`);
