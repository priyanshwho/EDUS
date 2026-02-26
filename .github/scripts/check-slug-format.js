#!/usr/bin/env node
/**
 * check-slug-format.js
 * Validates that slug generation utility and usage are consistent.
 * Also validates sample slugs against the required format.
 * Run: npm run check:slug (from backend/)
 */

const path = require('path');

// Load slug service
const slugServicePath = path.join(__dirname, '../../backend/src/services/slug.service.js');
const { isValidSlugFormat, buildSlug } = require(slugServicePath);

let hasError = false;

// ── Valid slug samples ─────────────────────────────────────────────────────
const VALID_SAMPLES = [
  { acronym: 'daa',  resource_type: 'pyq',        semester: 3, pyq_type: 'major', year: 2023 },
  { acronym: 'os',   resource_type: 'notes',       semester: 4, pyq_type: null,   year: 2024 },
  { acronym: 'dbms', resource_type: 'assignment',  semester: 5, pyq_type: null,   year: 2025 },
  { acronym: 'cn',   resource_type: 'lecture',     semester: 6, pyq_type: null,   year: null },
  { acronym: 'se',   resource_type: 'pyq',         semester: 3, pyq_type: 'minor1', year: 2022 },
];

// ── Invalid slug samples ───────────────────────────────────────────────────
const INVALID_SAMPLES = [
  'DAA-PYQ-SEM3-2023',   // uppercase
  'daa_pyq_sem3_2023',   // underscores
  'daa pyq sem3 2023',   // spaces
  '-daa-pyq-sem3',       // leading hyphen
];

console.log('Checking slug format rules...\n');

// Test valid samples
for (const params of VALID_SAMPLES) {
  const slug = buildSlug(params);
  if (!isValidSlugFormat(slug)) {
    console.error(`❌  buildSlug produced invalid format: "${slug}"`);
    hasError = true;
  } else {
    console.log(`✅  Valid:   ${slug}`);
  }
}

// Test invalid samples
for (const slug of INVALID_SAMPLES) {
  if (isValidSlugFormat(slug)) {
    console.error(`❌  Invalid slug passed validation: "${slug}"`);
    hasError = true;
  } else {
    console.log(`✅  Rejected: ${slug}`);
  }
}

if (hasError) {
  console.error('\n❌  Slug format check FAILED.\n');
  process.exit(1);
}

console.log('\n✅  Slug format check passed.');
process.exit(0);
