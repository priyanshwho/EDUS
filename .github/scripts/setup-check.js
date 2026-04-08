#!/usr/bin/env node
/**
 * setup-check.js
 * Master setup validation — runs all checks in sequence.
 * Ensures the project is properly configured before development or deployment.
 * Run: node .github/scripts/setup-check.js
 */

const { execSync } = require('child_process');
const path         = require('path');

const SCRIPTS_DIR = __dirname;
const ROOT        = path.join(__dirname, '../..');

const checks = [
  { name: 'Environment Variables', script: 'validate-env.js' },
  { name: 'Architecture Consistency', script: 'check-architecture-consistency.js' },
  { name: 'S3 Configuration',      script: 'verify-s3-config.js' },
  { name: 'Role Enforcement',      script: 'check-roles.js' },
  { name: 'Slug Format',           script: 'check-slug-format.js' },
  { name: 'Permission Rules',      script: 'verify-permissions.js' },
];

let allPassed = true;

console.log('═══════════════════════════════════════════');
console.log('  EduSphere — Setup & Configuration Check  ');
console.log('═══════════════════════════════════════════\n');

for (const check of checks) {
  console.log(`\n── ${check.name} ──`);
  try {
    execSync(`node ${path.join(SCRIPTS_DIR, check.script)}`, {
      cwd:   ROOT,
      stdio: 'inherit',
    });
  } catch {
    allPassed = false;
  }
}

console.log('\n═══════════════════════════════════════════');
if (allPassed) {
  console.log('✅  All checks passed. EduSphere is ready!');
} else {
  console.error('❌  One or more checks FAILED. Fix the issues above before proceeding.');
  process.exit(1);
}
console.log('═══════════════════════════════════════════\n');
