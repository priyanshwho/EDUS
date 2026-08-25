#!/usr/bin/env node
/**
 * check-architecture-consistency.js
 * Enforces backend architecture rules:
 *  - Database access must stay on Neon + Drizzle (no Supabase runtime usage)
 *  - File storage must stay on Tigris via S3-compatible client
 *
 * Run: npm run check:stack (from backend/)
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../..');
const BACKEND_DIR = path.join(ROOT, 'backend');
const BACKEND_SRC_DIR = path.join(BACKEND_DIR, 'src');

let hasError = false;

function readFileSafe(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`❌  Missing required file: ${filePath}`);
    hasError = true;
    return '';
  }
  return fs.readFileSync(filePath, 'utf8');
}

function walkFiles(dir, collected = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(fullPath, collected);
    } else if (entry.isFile()) {
      collected.push(fullPath);
    }
  }
  return collected;
}

function checkNoSupabaseRuntimeUsage() {
  const files = walkFiles(BACKEND_SRC_DIR).filter((f) => f.endsWith('.js'));
  const forbidden = [
    '@supabase/supabase-js',
    'supabase.config',
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
  ];

  for (const file of files) {
    const src = fs.readFileSync(file, 'utf8');
    for (const token of forbidden) {
      if (src.includes(token)) {
        console.error(`❌  Supabase token found in runtime source: ${path.relative(ROOT, file)} -> ${token}`);
        hasError = true;
      }
    }
  }

  if (!hasError) {
    console.log('✅  Backend runtime is free of Supabase usage');
  }
}

function checkNeonDrizzleClient() {
  const clientPath = path.join(BACKEND_SRC_DIR, 'db', 'client.js');
  const src = readFileSafe(clientPath);
  if (!src) return;

  const hasDrizzle = src.includes('drizzle-orm');
  const hasDbUrl = src.includes('DATABASE_URL');
  const hasClient = src.includes('postgres') || src.includes('@neondatabase/serverless');

  if (!hasDrizzle || !hasDbUrl || !hasClient) {
    console.error(`❌  Missing Neon/Postgres Drizzle requirement in ${path.relative(ROOT, clientPath)}`);
    hasError = true;
  }

  if (!hasError) {
    console.log('✅  Neon + Drizzle client configuration detected');
  }
}

function checkTigrisStoragePath() {
  const configPath = path.join(BACKEND_SRC_DIR, 'config', 's3.config.js');
  const servicePath = path.join(BACKEND_SRC_DIR, 'services', 's3.service.js');

  const configSrc = readFileSafe(configPath);
  const serviceSrc = readFileSafe(servicePath);
  if (!configSrc || !serviceSrc) return;

  const configTokens = ['AWS_ENDPOINT_URL_S3', 'forcePathStyle: true', '@aws-sdk/client-s3'];
  for (const token of configTokens) {
    if (!configSrc.includes(token)) {
      console.error(`❌  Missing Tigris/S3 config token in ${path.relative(ROOT, configPath)} -> ${token}`);
      hasError = true;
    }
  }

  const serviceTokens = ['PutObjectCommand', 'GetObjectCommand', 'DeleteObjectCommand', 'getSignedUrl'];
  for (const token of serviceTokens) {
    if (!serviceSrc.includes(token)) {
      console.error(`❌  Missing storage service token in ${path.relative(ROOT, servicePath)} -> ${token}`);
      hasError = true;
    }
  }

  if (!hasError) {
    console.log('✅  Tigris storage path is correctly configured via S3-compatible client');
  }
}

function checkPackageDependencies() {
  const packageJsonPath = path.join(BACKEND_DIR, 'package.json');
  const src = readFileSafe(packageJsonPath);
  if (!src) return;

  if (src.includes('@supabase/supabase-js')) {
    console.error('❌  backend/package.json contains @supabase/supabase-js');
    hasError = true;
  }

  const required = ['@neondatabase/serverless', 'drizzle-orm'];
  for (const token of required) {
    if (!src.includes(token)) {
      console.error(`❌  backend/package.json missing required dependency: ${token}`);
      hasError = true;
    }
  }

  if (!hasError) {
    console.log('✅  backend/package.json dependencies align with Drizzle + Neon');
  }
}

console.log('Checking backend architecture consistency...\n');

checkNoSupabaseRuntimeUsage();
checkNeonDrizzleClient();
checkTigrisStoragePath();
checkPackageDependencies();

if (hasError) {
  console.error('\n❌  Architecture consistency check FAILED.\n');
  process.exit(1);
}

console.log('\n✅  Architecture consistency check passed.');
process.exit(0);
