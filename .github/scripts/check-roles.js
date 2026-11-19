#!/usr/bin/env node
/**
 * check-roles.js
 * Verifies that role middleware is enforced on all sensitive routes.
 * Scans backend source files for unprotected route patterns.
 * Run: npm run check:roles (from backend/)
 */

const fs   = require('fs');
const path = require('path');

const ROUTES_DIRS = ['routes', 'ai/routes', 'ai/study'].map(directory => path.join(__dirname, '../../backend/src', directory));

const AUTH_GUARD        = /authenticate/;
const ROLE_GUARD        = /requireAdmin|requireProfessor|requireRole|requireOwnerOrAdmin/;

// Public mutation routes are intentional and should not require authenticate middleware.
const PUBLIC_MUTATIONS = {
  'auth.routes.js': new Set([
    'post:/signup',
    'post:/login',
    'post:/verify-pin',
    'post:/refresh',
    'post:/logout',
    'post:/clerk-sync', // Clerk webhook — called by Clerk servers, not end users
  ]),
};

// Authenticated routes that intentionally do not require a role middleware.
// Role enforcement is handled inside the controller or via PIN verification.
const AUTH_ONLY_MUTATIONS = {
  'resource.routes.js': new Set([
    'post:/:id/save',
    'delete:/:id/save',
  ]),
  'auth.routes.js': new Set([
    'post:/upgrade-professor',     // PIN-based self-elevation, authenticate is present
    'post:/superadmin/switch-role', // Superadmin check enforced inside controller
  ]),
};

let hasError = false;

function checkFile(filePath) {
  const src   = fs.readFileSync(filePath, 'utf8');
  const lines = src.split('\n');
  const fileName = path.basename(filePath);

  lines.forEach((line, idx) => {
    const mutationMatch = line.match(/router\.(post|put|patch|delete)\(\s*['"`]([^'"`]+)['"`]/i);
    if (!mutationMatch) return;

    const method = mutationMatch[1].toLowerCase();
    const routePath = mutationMatch[2];
    const routeKey = `${method}:${routePath}`;

    if (PUBLIC_MUTATIONS[fileName] && PUBLIC_MUTATIONS[fileName].has(routeKey)) {
      return;
    }

    const hasAuth = AUTH_GUARD.test(line) || /router\.use\(\s*authenticate\s*\)/.test(lines.slice(0, idx).join('\n'));
    const hasRole = ROLE_GUARD.test(line);

    if (!hasAuth) {
      console.error(`❌  [${path.basename(filePath)}:${idx + 1}] Mutation route missing authenticate: ${line.trim()}`);
      hasError = true;
    } else if (['ai.routes.js', 'study.routes.js'].includes(fileName)) {
      // AI is available to every authenticated role. Study services enforce ownership.
      return;
    } else if (AUTH_ONLY_MUTATIONS[fileName] && AUTH_ONLY_MUTATIONS[fileName].has(routeKey)) {
      return;
    } else if (!hasRole) {
      // Warn — some routes (e.g. logout, refresh) may not need a role guard
      console.warn(`⚠️   [${path.basename(filePath)}:${idx + 1}] No role guard on mutation: ${line.trim()}`);
    }
  });
}

for (const directory of ROUTES_DIRS) {
  if (!fs.existsSync(directory)) {
    console.error(`❌  Routes directory not found: ${directory}`);
    process.exit(1);
  }
  fs.readdirSync(directory).filter(file => file.endsWith('.routes.js')).forEach(file => checkFile(path.join(directory, file)));
}

if (hasError) {
  console.error('\n❌  Role check FAILED — unprotected routes found.\n');
  process.exit(1);
}

console.log('✅  Role middleware check passed — all mutation routes are protected.');
process.exit(0);
