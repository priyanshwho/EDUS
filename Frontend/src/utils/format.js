/**
 * Format a date string into a readable format
 * @param {string|Date} date
 * @param {Intl.DateTimeFormatOptions} options
 */
export function formatDate(date, options = {}) {
  if (!date) return '';
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...options,
  }).format(new Date(date));
}

/**
 * Format a file size in bytes to a human-readable string
 * @param {number} bytes
 */
export function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

/**
 * Convert a slug like "daa-pyq-sem3-major-2023" into a readable title
 * e.g. "DAA · PYQ · Sem 3 · Major · 2023"
 */
export function slugToDisplay(slug) {
  if (!slug) return '';
  return slug
    .split('-')
    .map((part) => {
      if (part.startsWith('sem')) return `Sem ${part.slice(3)}`;
      return part.toUpperCase();
    })
    .join(' · ');
}

/**
 * Capitalize the first letter of a string
 */
export function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Truncate a string to maxLength and append ellipsis
 */
export function truncate(str, maxLength = 80) {
  if (!str || str.length <= maxLength) return str;
  return str.slice(0, maxLength).trim() + '…';
}

/**
 * Get semester ordinal label e.g. 1 → "1st Semester"
 */
export function semesterLabel(n) {
  const suffixes = ['', 'st', 'nd', 'rd'];
  const suffix = n <= 3 ? suffixes[n] : 'th';
  return `${n}${suffix} Semester`;
}

/**
 * Get resource type display name
 */
export function resourceTypeLabel(type) {
  const map = {
    notes: 'Notes',
    pyq: 'PYQ',
    lecture: 'Lecture',
    assignment: 'Assignment',
    lab: 'Lab Manual',
  };
  return map[type] || capitalize(type);
}

/**
 * Build shareable resource URL
 */
export function resourceShareUrl(slug) {
  return `${window.location.origin}/resource/${slug}`;
}
