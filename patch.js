const fs = require('fs');
let code = fs.readFileSync('artifacts/deen-complete/scripts/build.js', 'utf8');
code = code.replace(/function getDeploymentDomain\(\) \{[\s\S]*?process\.exit\(1\);\n\}/, `function getDeploymentDomain() { return "localhost"; }`);
fs.writeFileSync('artifacts/deen-complete/scripts/build.js', code);

let viteCode = fs.readFileSync('artifacts/mockup-sandbox/vite.config.ts', 'utf8');
viteCode = viteCode.replace(/if \(\!basePath\) \{[\s\S]*?\}/, '');
viteCode = viteCode.replace(/const basePath = process.env.BASE_PATH;/, 'const basePath = process.env.BASE_PATH || "/";');
viteCode = viteCode.replace(/const rawPort = process.env.PORT;/, 'const rawPort = process.env.PORT || "3000";');
viteCode = viteCode.replace(/if \(\!rawPort\) \{[\s\S]*?\}/, '');
fs.writeFileSync('artifacts/mockup-sandbox/vite.config.ts', viteCode);
