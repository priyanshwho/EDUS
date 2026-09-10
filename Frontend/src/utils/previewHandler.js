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

  const slugOrId = r?.slug || r?.id;
  if (!slugOrId && !r?.aws_s3_key) {
    alert('Preview not available for this resource.');
    return;
  }

  // 3. For S3 files needing a signed URL, open a blank window synchronously
  // in the user click event to avoid popup blockers.
  // NOTE: Do NOT pass 'noopener' or 'noreferrer' as window features here,
  // as browsers return null for `win` when noopener is passed, which prevents
  // updating win.location.href asynchronously and leaves the tab stuck on about:blank.
  let win = null;
  try {
    win = window.open('', '_blank');
    if (win) {
      win.document.title = `Opening ${r?.title || 'Resource'}...`;
      win.document.body.style.margin = '0';
      win.document.body.style.background = '#0E0C15';
      win.document.body.style.color = '#CAC6DD';
      win.document.body.style.display = 'flex';
      win.document.body.style.alignItems = 'center';
      win.document.body.style.justifyContent = 'center';
      win.document.body.style.height = '100vh';
      win.document.body.style.fontFamily = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      const safeTitle = r?.title
        ? String(r.title).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
        : '';
      win.document.body.innerHTML = `
        <div style="text-align: center; max-width: 420px; padding: 24px;">
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin: 0 auto 16px auto; display: block;"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>
          <h2 style="margin: 0 0 8px 0; color: #FFFFFF; font-size: 18px; font-weight: 600;">Opening Resource Preview...</h2>
          <p style="margin: 0; font-size: 13px; color: #757185;">${safeTitle || 'Loading file...'}</p>
        </div>
      `;
    }
  } catch (_) {
    // Document manipulation might be restricted in some environments; safely ignore
  }

  try {
    const { resource } = await resourceService.getBySlug(slugOrId);
    const targetUrl = resource?.signedUrl || resource?.external_link || resource?.youtube_url;

    if (targetUrl) {
      if (win && !win.closed) {
        win.location.replace(targetUrl);
        try {
          win.opener = null;
        } catch (_) {}
      } else {
        window.open(targetUrl, '_blank', 'noopener,noreferrer');
      }
    } else {
      if (win && !win.closed) win.close();
      alert('Preview not available. Please try again later.');
    }
  } catch (err) {
    if (win && !win.closed) win.close();
    console.error('Failed to fetch preview URL:', err);
    alert('Failed to load preview. Please try again.');
  }
}

