const fs = require('fs');

let content = fs.readFileSync('src/components/panels/InternshipPanel.tsx', 'utf8');

// We have 8 fields: passport, interview, loa, contract, mcu, visa, ticket, pdt
const fields = [
    { key: 'passport', prop: 'passportReady', title: 'Paspor' },
    { key: 'interview', prop: 'interviewReady', title: 'Interview User' },
    { key: 'loa', prop: 'loaReady', title: 'Letter of Acceptance (LoA)' },
    { key: 'contract', prop: 'contractReady', title: 'Kontrak Magang' },
    { key: 'mcu', prop: 'mcuReady', title: 'Medical Check Up (MCU)' },
    { key: 'visa', prop: 'visaReady', title: 'Visa' },
    { key: 'ticket', prop: 'ticketReady', title: 'Tiket Pesawat' },
    { key: 'pdt', prop: 'pdtReady', title: 'Pre-Departure Training (PDT)' }
];

fields.forEach(f => {
    // We match the block starting with `<div className="flex items-center p-3 hover:bg-slate-50">`
    // to `</CollapsibleTrigger>`
    const regex = new RegExp(`(<div className="flex items-center p-3 hover:bg-slate-50">\\s*)<button[\\s\\S]*?<CollapsibleTrigger className="flex-1 text-left flex items-center justify-between px-2 font-medium text-slate-700">\\s*${f.title.replace(/[.*+?^$\\{\\}()|[\\]\\\\]/g, '\\$&')}\\s*\\{expandedItem === '${f.key}' \\? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />\\}\\s*</CollapsibleTrigger>`, 'm');
    
    const replacement = `<div className={\`flex items-center p-3 transition-colors \${data?.${f.prop} ? "bg-emerald-50 border-b border-emerald-200" : "bg-slate-50 border-b border-slate-200 hover:bg-slate-100"}\`}>
									<div className="mr-3">
										<Checkbox
											id="${f.prop}"
											checked={data?.${f.prop}}
											onCheckedChange={(checked) => handleToggleField('${f.prop}', checked === true)}
											disabled={!canEdit}
											className="w-5 h-5 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
										/>
									</div>
									<CollapsibleTrigger className="flex-1 text-left flex items-center justify-between font-medium text-slate-700">
										${f.title}
										{expandedItem === '${f.key}' ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
									</CollapsibleTrigger>`;
    content = content.replace(regex, replacement);
});

// Import Checkbox
if (!content.includes('import { Checkbox }')) {
    content = content.replace('import { Badge } from "@/components/ui/badge";', 'import { Badge } from "@/components/ui/badge";\nimport { Checkbox } from "@/components/ui/checkbox";');
}

fs.writeFileSync('src/components/panels/InternshipPanel.tsx', content);
