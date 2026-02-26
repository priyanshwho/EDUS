#!/usr/bin/env node
/**
 * validate-env.js
 * Validates that all required environment variables are set before server start.
 * Run: npm run validate (from backend/)
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../backend/.env') });

const REQUIRED_VARS = [
  'PORT',
  'NODE_ENV',
  'CLIENT_URL',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'GOOGLE_CALLBACK_URL',
  'GITHUB_CLIENT_ID',
  'GITHUB_CLIENT_SECRET',
  'GITHUB_CALLBACK_URL',
  'ADMIN_EMAIL',
  'PROFESSOR_PIN',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'AWS_REGION',
  'AWS_ENDPOINT_URL_S3',
  'AWS_BUCKET_NAME',
];

let hasError = false;
const missing = [];

for (const key of REQUIRED_VARS) {
  if (!process.env[key]) {
    missing.push(key);
    hasError = true;
  }
}

// Validate JWT secret strength
if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
  console.error('❌  JWT_SECRET must be at least 32 characters long');
  hasError = true;
}

if (process.env.JWT_REFRESH_SECRET && process.env.JWT_REFRESH_SECRET.length < 32) {
  console.error('❌  JWT_REFRESH_SECRET must be at least 32 characters long');
  hasError = true;
}

// Check JWT secrets are different
if (
  process.env.JWT_SECRET &&
  process.env.JWT_REFRESH_SECRET &&
  process.env.JWT_SECRET === process.env.JWT_REFRESH_SECRET
) {
  console.error('❌  JWT_SECRET and JWT_REFRESH_SECRET must be different');
  hasError = true;
}

// PROFESSOR_PIN must be 4-8 digits
if (process.env.PROFESSOR_PIN && !/^\d{4,8}$/.test(process.env.PROFESSOR_PIN)) {
  console.error('❌  PROFESSOR_PIN must be 4–8 digits');
  hasError = true;
}

if (missing.length) {
  console.error('\n❌  Missing required environment variables:');
  missing.forEach(v => console.error(`    - ${v}`));
  console.error('\n   Copy backend/.env.example to backend/.env and fill in the values.\n');
}

if (hasError) {
  process.exit(1);
}

console.log('✅  All required environment variables are set.');
process.exit(0);
