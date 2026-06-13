const fs = require('fs');
const path = require('path');

const dir = 'c:\\.PROJECT\\dashboard-nusadaya\\ui-plans';

const replacements = [
  { regex: /solid indigo/gi, replace: 'solid blue' },
  { regex: /dot kiri indigo/gi, replace: 'dot kiri blue' },
  { regex: /bg-slate-800\/50/g, replace: 'bg-slate-50' },
  { regex: /bg-emerald-950\/30 border-emerald-800\/30/g, replace: 'bg-emerald-50 border-emerald-200' },
  { regex: /abu-abu gelap/gi, replace: 'putih' },
  { regex: /tema gelap/gi, replace: 'tema terang' }
];

function processDir(directory) {
  const files = fs.readdirSync(directory);
  for (const file of files) {
    if (file.endsWith('.md')) {
      const filePath = path.join(directory, file);
      let content = fs.readFileSync(filePath, 'utf8');
      
      let modified = content;
      for (const { regex, replace } of replacements) {
        modified = modified.replace(regex, replace);
      }
      
      if (content !== modified) {
        fs.writeFileSync(filePath, modified, 'utf8');
        console.log(`Updated leftovers: ${file}`);
      }
    }
  }
}

processDir(dir);
console.log('Finished updating ui-plans leftovers.');
