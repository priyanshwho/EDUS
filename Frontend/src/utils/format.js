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
    note: 'Notes',
    pyq: 'PYQ',
    lecture: 'Lecture',
    assignment: 'Assignment',
    lab: 'Lab Manual',
  };
  return map[type] || capitalize(type);
}

/**
 * Convert a string to a URL-safe slug segment.
 */
export function slugifySegment(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Build a hierarchical subject route for a professor.
 * Format: /professors/:username/:branch/:semester/:subject
 */
export function subjectPath(resource, fallbackUser = null, fallbackSubject = null) {
  const username =
    resource?.uploader?.username ||
    (typeof resource?.uploader === 'string' ? resource.uploader : null) ||
    resource?.username ||
    fallbackUser?.username ||
    fallbackUser?.name;

  const branch =
    resource?.subjects?.branch ||
    resource?.branch ||
    fallbackSubject?.branch;

  const semester =
    resource?.subjects?.semester ||
    resource?.semester ||
    fallbackSubject?.semester;

  const subjectRaw =
    resource?.subjects?.acronym ||
    resource?.subjects?.name_full ||
    resource?.acronym ||
    resource?.name_full ||
    fallbackSubject?.acronym ||
    fallbackSubject?.name_full;

  if (!username || !branch || !semester || !subjectRaw) return null;

  const usernameSegment = encodeURIComponent(String(username));

  return [
    '/professors',
    usernameSegment,
    slugifySegment(branch),
    `sem${semester}`,
    slugifySegment(subjectRaw),
  ].join('/');
}

/**
 * Build a hierarchical resource route.
 * Format: /professors/:username/:branch/:semester/:subject/:type/:slug
 */
export function resourcePath(resource, fallbackSlug, fallbackUser = null, fallbackSubject = null) {
  const slug = resource?.slug || fallbackSlug;
  if (!slug) return '/';

  const type = resource?.resource_type || (slug.includes('notes') ? 'notes' : slug.includes('pyq') ? 'pyq' : slug.includes('lecture') ? 'lecture' : 'notes');

  const baseSubjectPath = subjectPath(resource, fallbackUser, fallbackSubject);
  if (!baseSubjectPath) return `/resources/${slug}`;

  return `${baseSubjectPath}/${slugifySegment(type)}/${slug}`;
}

/**
 * Build shareable resource URL
 */
export function resourceShareUrl(slug, resource = null, fallbackUser = null, fallbackSubject = null) {
  return `${window.location.origin}${resourcePath(resource, slug, fallbackUser, fallbackSubject)}`;
}
