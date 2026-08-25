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

  // 1. If we already have the signedUrl, open it directly
  if (r?.signedUrl) {
    return window.open(r.signedUrl, '_blank', 'noopener,noreferrer');
  }

  // 2. If it's a non-S3 external link or youtube video
  if (r?.external_link) {
    return window.open(r.external_link, '_blank', 'noopener,noreferrer');
  }
  if (r?.youtube_url) {
    return window.open(r.youtube_url, '_blank', 'noopener,noreferrer');
  }

  // 3. For S3 files, open a new window synchronously to avoid popup blockers
  const win = window.open('about:blank', '_blank', 'noopener,noreferrer');

  if (r?.slug || r?.aws_s3_key) {
    try {
      const { resource } = await resourceService.getBySlug(r.slug);
      const targetUrl = resource?.signedUrl || resource?.external_link || resource?.youtube_url;
      
      if (targetUrl) {
        if (win) {
          win.location.href = targetUrl;
        } else {
          window.open(targetUrl, '_blank', 'noopener,noreferrer');
        }
      } else {
        if (win) win.close();
        alert('Preview not available. Please try again later.');
      }
    } catch (err) {
      if (win) win.close();
      console.error('Failed to fetch preview URL:', err);
      alert('Failed to load preview. Please try again.');
    }
  } else {
    if (win) win.close();
  }
}
