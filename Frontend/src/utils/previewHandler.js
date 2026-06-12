import { resourceService } from '../services/resource.service';

/**
 * Shared handler to ensure both cards and details pages
 * use the same signed URL generation logic for S3 files.
 */
export async function handlePreviewResource(r, e = null) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }

  // 1. If we already have the signedUrl (e.g., on the Resource details page), use it.
  if (r.signedUrl) {
    return window.open(r.signedUrl, '_blank');
  }

  // 2. If it's a non-S3 external link or youtube video
  if (r.external_link) {
    return window.open(r.external_link, '_blank');
  }
  if (r.youtube_url) {
    return window.open(r.youtube_url, '_blank');
  }

  // 3. If it's an S3 file but we lack the signedUrl (e.g., on list pages/cards), fetch it
  if (r.aws_s3_key) {
    try {
      // getBySlug generates and returns the fresh signedUrl
      const { resource } = await resourceService.getBySlug(r.slug);
      
      if (resource && resource.signedUrl) {
        return window.open(resource.signedUrl, '_blank');
      } else {
        console.error('No signedUrl returned from backend for this resource.');
        alert('Preview not available. Please try again later.');
      }
    } catch (err) {
      console.error('Failed to fetch preview URL:', err);
      alert('Failed to load preview. Please try again.');
    }
  }
}
