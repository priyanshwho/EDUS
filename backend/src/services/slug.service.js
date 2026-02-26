const slugify = require('slugify');
const supabase = require('../config/supabase.config');

/**
 * Build a deterministic slug from resource metadata.
 *
 * Format: <acronym>-<resource_type>-sem<semester>-[<pyq_type>-]<year>
 *
 * Examples:
 *   daa-pyq-sem3-major-2023
 *   os-notes-sem4-2024
 *   dbms-assignment-sem5-2025
 */
function buildSlug({ acronym, resource_type, semester, pyq_type, year }) {
  const parts = [
    acronym.toLowerCase(),
    resource_type.toLowerCase(),
    `sem${semester}`,
  ];
  if (pyq_type) parts.push(pyq_type.toLowerCase());
  if (year)     parts.push(String(year));
  return parts.join('-');
}

/**
 * Generate a unique slug, appending a numeric suffix if needed.
 */
async function generateUniqueSlug(params) {
  const base = buildSlug(params);
  let candidate = base;
  let counter   = 1;

  for (;;) {
    const { data } = await supabase
      .from('resources')
      .select('id')
      .eq('slug', candidate)
      .maybeSingle();

    if (!data) return candidate;
    candidate = `${base}-${counter++}`;
  }
}

/**
 * Validate a slug string matches the required format.
 * Returns true if valid.
 */
function isValidSlugFormat(slug) {
  // <acronym>-<type>-sem<n>[-<pyq_type>][-<year>]
  return /^[a-z0-9]+-[a-z0-9]+-sem\d+(-[a-z0-9]+)*$/.test(slug);
}

module.exports = { buildSlug, generateUniqueSlug, isValidSlugFormat };
