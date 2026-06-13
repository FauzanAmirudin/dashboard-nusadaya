const fs = require('fs');

let content = fs.readFileSync('src/components/panels/InternshipPanel.tsx', 'utf8');

// Fix uncontrolled to controlled issue
content = content.replace(/checked=\{data\?\.(passportReady|interviewReady|loaReady|contractReady|mcuReady|visaReady|ticketReady|pdtReady)\}/g, 'checked={!!data?.$1}');

// Update checkbox styling
content = content.replace(/className="w-5 h-5 data-\[state=checked\]:bg-emerald-600 data-\[state=checked\]:border-emerald-600"/g, 'className="w-5 h-5 data-[state=checked]:bg-emerald-500 data-[state=checked]:text-white data-[state=checked]:border-emerald-500 border-slate-300"');

// Update CollapsibleTrigger styling to be bold like PMB/CRM
content = content.replace(/className="flex-1 text-left flex items-center justify-between font-medium text-slate-700"/g, 'className="flex-1 text-left flex items-center justify-between text-sm font-bold text-slate-800 cursor-pointer"');

fs.writeFileSync('src/components/panels/InternshipPanel.tsx', content);
