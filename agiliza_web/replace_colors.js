const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

const colorMap = {
  "'#140129'": "'var(--color-bg)'",
  "'#1c023d'": "'var(--color-surface)'",
  "'#FAFAF8'": "'var(--color-text)'",
  "'#111111'": "'var(--color-border)'",
  "'#111'": "'var(--color-border)'",
  "'#300267'": "'var(--color-primary)'",
  "'#2a035b'": "'var(--color-primary-light)'",
  
  // also handle some without quotes for css or string templates
  "#140129": "var(--color-bg)",
  "#1c023d": "var(--color-surface)",
  "#FAFAF8": "var(--color-text)",
  "#111111": "var(--color-border)",
  "#111": "var(--color-border)",
  "#300267": "var(--color-primary)",
  "#2a035b": "var(--color-primary-light)",
};

function walkDir(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walkDir(file));
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.css')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walkDir(srcDir);

let changedFiles = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let newContent = content;

  // For each mapping, we do a global replace
  Object.keys(colorMap).forEach(oldColor => {
    // Regex to match exact color (case insensitive) and avoid partial matches
    // e.g., avoid replacing #111 inside #111111
    let regex;
    if (oldColor.startsWith("'")) {
       const rawHex = oldColor.replace(/'/g, '');
       regex = new RegExp(`'${rawHex}'`, 'gi');
    } else {
       regex = new RegExp(`${oldColor}(?!\\w)`, 'gi');
    }
    
    // We should be careful. We'll do a simple replace first.
    // For CSS variables inside style prop in React: color: 'var(--color-text)'
    newContent = newContent.replace(regex, colorMap[oldColor]);
  });
  
  // Also fix Next.js / React inline styles using CSS variables without quotes if we missed it
  // Actually, in React style={{ color: 'var(--color-text)' }} is valid.
  
  // Custom tweaks for chat linear gradients that were hardcoded
  newContent = newContent.replace(/#059669/gi, 'var(--color-action-dark)');
  newContent = newContent.replace(/#047857/gi, 'var(--color-action-darker)');
  newContent = newContent.replace(/#25024e/gi, 'var(--color-surface-hover)');
  newContent = newContent.replace(/#3a037d/gi, 'var(--color-primary-light)');

  if (content !== newContent) {
    fs.writeFileSync(file, newContent, 'utf8');
    changedFiles++;
    console.log(`Updated ${file}`);
  }
});

console.log(`\nReplaced colors in ${changedFiles} files.`);
