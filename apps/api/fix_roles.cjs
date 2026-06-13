const fs = require('fs');
let content = fs.readFileSync('src/routes/students.ts', 'utf8');

// 1. Remove duplicate POST /:id/pa/acc (starts around line 1860)
// The duplicate looks like: .post("/:id/pa/acc", async (context) => { ... })
// Let's find the second occurrence.
let firstPaAccIndex = content.indexOf('.post("/:id/pa/acc"');
let secondPaAccIndex = content.indexOf('.post("/:id/pa/acc"', firstPaAccIndex + 1);

if (secondPaAccIndex !== -1) {
    let endIndex = content.indexOf('.patch("/:id/internship"', secondPaAccIndex);
    if (endIndex !== -1) {
        content = content.substring(0, secondPaAccIndex) + content.substring(endIndex);
    }
}

// 2. Remove duplicate POST /:id/internship/acc
let firstInternshipAccIndex = content.indexOf('.post("/:id/internship/acc"');
let secondInternshipAccIndex = content.indexOf('.post("/:id/internship/acc"', firstInternshipAccIndex + 1);

if (secondInternshipAccIndex !== -1) {
    let endIndex = content.indexOf('.get("/:id/status"', secondInternshipAccIndex);
    if (endIndex !== -1) {
        content = content.substring(0, secondInternshipAccIndex) + content.substring(endIndex);
    }
}

// 3. Update all role checks for ACC
content = content.replace(/if \(!user \|\| user\.role !== "pmb"\) \{/g, 'if (!user || (user.role !== "pmb" && user.role !== "superadmin")) {');
content = content.replace(/if \(!user \|\| user\.role !== "crm"\) \{/g, 'if (!user || (user.role !== "crm" && user.role !== "superadmin")) {');
content = content.replace(/if \(!user \|\| user\.role !== "finance"\) \{/g, 'if (!user || (user.role !== "finance" && user.role !== "superadmin")) {');
content = content.replace(/if \(!user \|\| user\.role !== "akademik"\) \{/g, 'if (!user || (user.role !== "akademik" && user.role !== "superadmin")) {');
content = content.replace(/if \(!user \|\| user\.role !== "dosen"\) \{/g, 'if (!user || (user.role !== "dosen" && user.role !== "superadmin")) {');
content = content.replace(/if \(!user \|\| user\.role !== "pa"\) \{/g, 'if (!user || (user.role !== "pa" && user.role !== "superadmin")) {');
content = content.replace(/if \(!user \|\| user\.role !== "magang"\) \{/g, 'if (!user || (user.role !== "magang" && user.role !== "superadmin")) {');

// Handle variations where there's no (!user ||)
content = content.replace(/if \(user\.role !== "pmb"\) \{/g, 'if (user.role !== "pmb" && user.role !== "superadmin") {');
content = content.replace(/if \(user\.role !== "crm"\) \{/g, 'if (user.role !== "crm" && user.role !== "superadmin") {');
content = content.replace(/if \(user\.role !== "finance"\) \{/g, 'if (user.role !== "finance" && user.role !== "superadmin") {');
content = content.replace(/if \(user\.role !== "akademik"\) \{/g, 'if (user.role !== "akademik" && user.role !== "superadmin") {');
content = content.replace(/if \(user\.role !== "dosen"\) \{/g, 'if (user.role !== "dosen" && user.role !== "superadmin") {');
content = content.replace(/if \(user\.role !== "pa"\) \{/g, 'if (user.role !== "pa" && user.role !== "superadmin") {');
content = content.replace(/if \(user\.role !== "magang"\) \{/g, 'if (user.role !== "magang" && user.role !== "superadmin") {');

// 4. Also fix some where it is `if (!user)` followed by another check.
content = content.replace(/if \(!user\) \{\s*set\.status = 401;\s*return \{ success: false, message: "Unauthorized" \};\s*\}\s*if \(user\.role !== "(.*?)"\)/g, 
    'if (!user) {\n\t\t\tset.status = 401;\n\t\t\treturn { success: false, message: "Unauthorized" };\n\t\t}\n\n\t\tif (user.role !== "$1" && user.role !== "superadmin")');


fs.writeFileSync('src/routes/students.ts', content, 'utf8');
console.log('Done cleaning and updating roles!');
