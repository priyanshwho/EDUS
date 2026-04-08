#!/usr/bin/env node
/**
 * check-roles.js
 * Verifies that role middleware is enforced on all sensitive routes.
 * Scans backend source files for unprotected route patterns.
 * Run: npm run check:roles (from backend/)
 */

const fs   = require('fs');
const path = require('path');

const ROUTES_DIR = path.join(__dirname, '../../backend/src/routes');

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
  ]),
};

// Authenticated routes that intentionally do not require a role middleware.
const AUTH_ONLY_MUTATIONS = {
  'resource.routes.js': new Set([
    'post:/:id/save',
    'delete:/:id/save',
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

    const hasAuth = AUTH_GUARD.test(line);
    const hasRole = ROLE_GUARD.test(line);

    if (!hasAuth) {
      console.error(`❌  [${path.basename(filePath)}:${idx + 1}] Mutation route missing authenticate: ${line.trim()}`);
      hasError = true;
    } else if (AUTH_ONLY_MUTATIONS[fileName] && AUTH_ONLY_MUTATIONS[fileName].has(routeKey)) {
      return;
    } else if (!hasRole) {
      // Warn — some routes (e.g. logout, refresh) may not need a role guard
      console.warn(`⚠️   [${path.basename(filePath)}:${idx + 1}] No role guard on mutation: ${line.trim()}`);
    }
  });
}

if (!fs.existsSync(ROUTES_DIR)) {
  console.error(`❌  Routes directory not found: ${ROUTES_DIR}`);
  process.exit(1);
}

const files = fs.readdirSync(ROUTES_DIR).filter(f => f.endsWith('.js'));
files.forEach(f => checkFile(path.join(ROUTES_DIR, f)));

if (hasError) {
  console.error('\n❌  Role check FAILED — unprotected routes found.\n');
  process.exit(1);
}

console.log('✅  Role middleware check passed — all mutation routes are protected.');
process.exit(0);
