const fs = require('fs');

let content = fs.readFileSync('src/components/panels/InternshipPanel.tsx', 'utf8');

content = content.replace(/onChange=\{\(e\) => handleUpdateField\('(\w+)', e\.target\.value\)\}/g, "onChange={(e) => handleLocalChange('$1', e.target.value)} onBlur={() => handleBlurField('$1')}");
content = content.replace(/onValueChange=\{\(val\) => handleUpdateField\('(\w+)', val\)\}/g, "onValueChange={(val) => handleToggleField('$1', val)}");
content = content.replace(/onClick=\{\(\) => handleUpdateField\('(\w+)', !data\?\.\w+\)\}/g, "onClick={() => handleToggleField('$1', !data?.$1)}");

fs.writeFileSync('src/components/panels/InternshipPanel.tsx', content);
