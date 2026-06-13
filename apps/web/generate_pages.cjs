const fs = require('fs');
const path = require('path');

const modules = ['pmb', 'crm', 'akademik', 'dosen', 'pa', 'magang'];
const baseDir = path.join('src', 'app', 'dashboard');

modules.forEach(mod => {
    const dir = path.join(baseDir, mod);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    const content = `import { SharedDashboardLoader } from "@/components/dashboards/SharedDashboardLoader";

export default function ${mod.charAt(0).toUpperCase() + mod.slice(1)}Page() {
\treturn <SharedDashboardLoader module="${mod}" />;
}
`;
    fs.writeFileSync(path.join(dir, 'page.tsx'), content, 'utf8');
});

console.log("Pages generated!");
