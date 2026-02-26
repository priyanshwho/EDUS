/**
 * Determine preview type from a resource object.
 * Returns one of: 'pdf' | 'youtube' | 'drive' | 'signed' | 'none'
 */
export function getPreviewType(resource) {
  if (!resource) return 'none';

  // S3-hosted PDF (signed URL available)
  if (resource.aws_s3_key || resource.signedUrl) {
    return 'signed';
  }

  // YouTube lecture
  if (resource.youtube_url) {
    return 'youtube';
  }

  // Legacy Google Drive link
  if (resource.external_link) {
    const url = resource.external_link;
    if (url.includes('drive.google.com') || url.includes('docs.google.com')) {
      return 'drive';
    }
    // Generic external link — open in new tab
    return 'external';
  }

  return 'none';
}

/**
 * Extract YouTube video ID from various YouTube URL formats
 * Supports: youtu.be/<id>, youtube.com/watch?v=<id>, youtube.com/embed/<id>
 */
export function extractYoutubeId(url) {
  if (!url) return null;
  const patterns = [
    /youtu\.be\/([A-Za-z0-9_-]{11})/,
    /[?&]v=([A-Za-z0-9_-]{11})/,
    /youtube\.com\/embed\/([A-Za-z0-9_-]{11})/,
    /youtube\.com\/v\/([A-Za-z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

/**
 * Convert a Google Drive view/share link to embed URL
 * https://drive.google.com/file/d/<id>/view → https://drive.google.com/file/d/<id>/preview
 */
export function driveEmbedUrl(url) {
  if (!url) return null;
  // Already embed
  if (url.includes('/preview')) return url;

  // file/d/<id>/view or /open?id=<id>
  const fileMatch = url.match(/\/file\/d\/([^/]+)/);
  if (fileMatch) {
    return `https://drive.google.com/file/d/${fileMatch[1]}/preview`;
  }

  const idMatch = url.match(/[?&]id=([^&]+)/);
  if (idMatch) {
    return `https://drive.google.com/file/d/${idMatch[1]}/preview`;
  }

  return url;
}

/**
 * Returns true if the resource has any previewable source
 */
export function isPreviewable(resource) {
  return getPreviewType(resource) !== 'none';
}
