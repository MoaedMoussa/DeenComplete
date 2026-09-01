const fs = require('fs');

const catalog = {
  '@replit/vite-plugin-cartographer': '^0.5.1',
  '@replit/vite-plugin-dev-banner': '^0.1.1',
  '@replit/vite-plugin-runtime-error-modal': '^0.0.6',
  '@tailwindcss/vite': '^4.1.14',
  '@tanstack/react-query': '^5.90.21',
  '@types/node': '^25.3.3',
  '@types/react': '^19.2.0',
  '@types/react-dom': '^19.2.0',
  '@vitejs/plugin-react': '^5.0.4',
  'class-variance-authority': '^0.7.1',
  'clsx': '^2.1.1',
  'drizzle-orm': '^0.45.2',
  'framer-motion': '^12.23.24',
  'lucide-react': '^0.545.0',
  'react': '19.1.0',
  'react-dom': '19.1.0',
  'tailwind-merge': '^3.3.1',
  'tailwindcss': '^4.1.14',
  'tsx': '^4.21.0',
  'vite': '^7.3.2',
  'wouter': '^3.3.5',
  'zod': '^3.25.76'
};

const files = [
  './artifacts/deen-complete/package.json',
  './artifacts/api-server/package.json',
  './artifacts/mockup-sandbox/package.json',
  './lib/api-zod/package.json',
  './lib/api-client-react/package.json',
  './lib/db/package.json',
  './lib/api-spec/package.json',
  './scripts/package.json'
];

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  const pkg = JSON.parse(fs.readFileSync(file, 'utf8'));
  ['dependencies', 'devDependencies', 'peerDependencies'].forEach(depType => {
    if (pkg[depType]) {
      for (const [name, version] of Object.entries(pkg[depType])) {
        if (version === 'workspace:*') {
          pkg[depType][name] = '*';
        } else if (version === 'catalog:') {
          pkg[depType][name] = catalog[name] || '*';
        }
      }
    }
  });
  
  if (pkg.scripts && pkg.scripts.dev) {
     pkg.scripts.dev = pkg.scripts.dev.replace(/pnpm exec /g, 'npx ').replace(/pnpm /g, 'npm ');
  }
  
  fs.writeFileSync(file, JSON.stringify(pkg, null, 2));
});

const rootPkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
rootPkg.workspaces = ['artifacts/*', 'lib/*', 'scripts'];
rootPkg.scripts = {
  "dev": "npm run dev --workspace=@workspace/deen-complete",
  "build": "npm run build --workspaces",
  "typecheck": "npm run typecheck --workspaces"
};
// Add global overrides if needed
rootPkg.overrides = {
  "esbuild": "0.27.3",
  "@esbuild-kit/esm-loader": "npm:tsx@^4.21.0"
};
fs.writeFileSync('./package.json', JSON.stringify(rootPkg, null, 2));
