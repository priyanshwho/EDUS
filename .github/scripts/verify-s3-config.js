#!/usr/bin/env node
/**
 * verify-s3-config.js
 * Validates Tigris S3 configuration:
 *  - Required env vars are set
 *  - Credentials not hardcoded in source
 *  - S3 config uses forcePathStyle: true
 *  - Pre-signed URLs used (not public URLs)
 *  - .env not committed to git
 * Run: npm run check:s3 (from backend/)
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../backend/.env') });

const fs   = require('fs');
const path = require('path');

let hasError = false;

// ── 1. Required S3 env vars ────────────────────────────────────────────────
const S3_VARS = [
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'AWS_REGION',
  'AWS_ENDPOINT_URL_S3',
  'AWS_BUCKET_NAME',
];

for (const v of S3_VARS) {
  if (!process.env[v]) {
    console.error(`❌  Missing S3 env var: ${v}`);
    hasError = true;
  } else {
    console.log(`✅  ${v} is set`);
  }
}

// ── 2. Check S3 config file ────────────────────────────────────────────────
const s3ConfigPath = path.join(__dirname, '../../backend/src/config/s3.config.js');
if (fs.existsSync(s3ConfigPath)) {
  const src = fs.readFileSync(s3ConfigPath, 'utf8');

  if (!src.includes('forcePathStyle: true')) {
    console.error('❌  s3.config.js: forcePathStyle must be true for Tigris');
    hasError = true;
  } else {
    console.log('✅  s3.config.js: forcePathStyle: true');
  }

  // Credentials must come from process.env — not hardcoded
  if (/accessKeyId\s*:\s*['"`][A-Z0-9]{16,}/.test(src)) {
    console.error('❌  s3.config.js: AWS credentials appear to be hardcoded!');
    hasError = true;
  } else {
    console.log('✅  s3.config.js: Credentials loaded from env');
  }
} else {
  console.error(`❌  S3 config file not found: ${s3ConfigPath}`);
  hasError = true;
}

// ── 3. Pre-signed URL usage in S3 service ─────────────────────────────────
const s3ServicePath = path.join(__dirname, '../../backend/src/services/s3.service.js');
if (fs.existsSync(s3ServicePath)) {
  const src = fs.readFileSync(s3ServicePath, 'utf8');

  if (!src.includes('getSignedUrl')) {
    console.error('❌  s3.service.js: getSignedUrl not found — URLs must be pre-signed');
    hasError = true;
  } else {
    console.log('✅  s3.service.js: getSignedUrl used for secure access');
  }

  if (!src.includes('PutObjectCommand')) {
    console.error('❌  s3.service.js: PutObjectCommand not found — presigned upload missing');
    hasError = true;
  } else {
    console.log('✅  s3.service.js: PutObjectCommand present for presigned upload');
  }
} else {
  console.error(`❌  S3 service file not found: ${s3ServicePath}`);
  hasError = true;
}

// ── 4. Ensure .env is not committed ───────────────────────────────────────
const { execSync } = require('child_process');
try {
  const tracked = execSync('git ls-files backend/.env', {
    cwd: path.join(__dirname, '../..'),
  }).toString().trim();

  if (tracked) {
    console.error('❌  CRITICAL: backend/.env is tracked by git! Remove it immediately.');
    console.error('   Run: git rm --cached backend/.env && echo "backend/.env" >> .gitignore');
    hasError = true;
  } else {
    console.log('✅  backend/.env is NOT tracked by git');
  }
} catch {
  console.warn('⚠️   Could not check git tracking — ensure .env is in .gitignore');
}

// ── 5. Ensure .env.example exists ─────────────────────────────────────────
const envExamplePath = path.join(__dirname, '../../backend/.env.example');
if (!fs.existsSync(envExamplePath)) {
  console.error('❌  backend/.env.example not found');
  hasError = true;
} else {
  console.log('✅  backend/.env.example exists');
}

if (hasError) {
  console.error('\n❌  S3 configuration check FAILED.\n');
  process.exit(1);
}
console.log('\n✅  S3 configuration verified successfully.');
process.exit(0);
