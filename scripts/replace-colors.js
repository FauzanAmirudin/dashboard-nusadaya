const fs = require('fs');
const path = require('path');

const dir = 'c:\\.PROJECT\\dashboard-nusadaya\\ui-plans';

const replacements = [
  { regex: /#0F172A/g, replace: '#F8FAFF' },
  { regex: /#1E293B/g, replace: '#FFFFFF' },
  { regex: /#334155/g, replace: '#E2E8F0' }, // slate-200
  { regex: /#6366F1/g, replace: '#0517B0' },
  { regex: /#4F46E5/g, replace: '#04128A' }, // dark blue
  { regex: /#F1F5F9/g, replace: '#0F172A' }, // text primary invert
  { regex: /bg-\[#0F172A\]/g, replace: 'bg-[#F8FAFF]' },
  { regex: /bg-\[#1E293B\]/g, replace: 'bg-white' },
  { regex: /border-\[#334155\]/g, replace: 'border-slate-200' },
  { regex: /text-\[#F1F5F9\]/g, replace: 'text-slate-900' },
  { regex: /text-white/g, replace: 'text-slate-900' },
  { regex: /text-slate-300/g, replace: 'text-slate-600' },
  { regex: /text-slate-400/g, replace: 'text-slate-500' },
  { regex: /text-slate-200/g, replace: 'text-slate-800' },
  { regex: /bg-indigo-/g, replace: 'bg-blue-' },
  { regex: /text-indigo-/g, replace: 'text-blue-' },
  { regex: /border-indigo-/g, replace: 'border-blue-' },
  { regex: /ring-indigo-/g, replace: 'ring-[#0517B0]' },
  { regex: /hitam gelap/gi, replace: 'putih kebiruan' },
  { regex: /dark mode/gi, replace: 'light mode' },
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
        console.log(`Updated: ${file}`);
      }
    }
  }
}

processDir(dir);
console.log('Finished updating ui-plans colors.');
