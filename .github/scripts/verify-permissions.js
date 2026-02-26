#!/usr/bin/env node
/**
 * verify-permissions.js
 * Verifies that role-permission isolation is correctly coded in the
 * resource controller and middleware.
 * Run: node .github/scripts/verify-permissions.js
 */

const fs   = require('fs');
const path = require('path');

let hasError = false;

function check(filePath, rules) {
  if (!fs.existsSync(filePath)) {
    console.error(`❌  File not found: ${filePath}`);
    hasError = true;
    return;
  }
  const src = fs.readFileSync(filePath, 'utf8');
  for (const { description, pattern, mustExist = true } of rules) {
    const found = pattern.test(src);
    if (mustExist && !found) {
      console.error(`❌  [${path.basename(filePath)}] Missing: ${description}`);
      hasError = true;
    } else if (!mustExist && found) {
      console.error(`❌  [${path.basename(filePath)}] Forbidden pattern found: ${description}`);
      hasError = true;
    } else {
      console.log(`✅  [${path.basename(filePath)}] ${description}`);
    }
  }
}

const BASE = path.join(__dirname, '../../backend/src');

// ── resource.controller.js ─────────────────────────────────────────────────
check(`${BASE}/controllers/resource.controller.js`, [
  { description: 'Professors blocked from adding Drive links', pattern: /professor.*Drive|Drive.*professor|legacy Drive/i },
  { description: 'Ownership check on update', pattern: /uploaded_by.*req\.user\.id|own.*edit|edit.*own/i },
  { description: 'Ownership check on delete', pattern: /uploaded_by.*req\.user\.id|own.*delete/i },
  { description: 'Signed GET URL issued for S3 resources', pattern: /getPresignedDownloadUrl/ },
]);

// ── legacy.middleware.js ───────────────────────────────────────────────────
check(`${BASE}/middleware/legacy.middleware.js`, [
  { description: 'Legacy content protection exists', pattern: /blockProfessorOnLegacy/ },
  { description: 'Checks external_link && !aws_s3_key', pattern: /external_link.*aws_s3_key/ },
]);

// ── role.middleware.js ─────────────────────────────────────────────────────
check(`${BASE}/middleware/role.middleware.js`, [
  { description: 'requireRole function exported', pattern: /requireRole/ },
  { description: 'requireAdmin exported', pattern: /requireAdmin/ },
  { description: 'requireProfessor exported', pattern: /requireProfessor/ },
  { description: 'role check covers student/professor/admin', pattern: /student|professor|admin/ },
]);

// ── authenticate.js ────────────────────────────────────────────────────────
check(`${BASE}/middleware/authenticate.js`, [
  { description: 'Bearer token extraction', pattern: /Bearer/ },
  { description: 'pin_pending blocked', pattern: /pin_pending/ },
  { description: 'verifyAccessToken used', pattern: /verifyAccessToken/ },
]);

if (hasError) {
  console.error('\n❌  Permission verification FAILED.\n');
  process.exit(1);
}
console.log('\n✅  All permission rules verified.');
process.exit(0);
