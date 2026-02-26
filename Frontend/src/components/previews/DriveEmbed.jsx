import { driveEmbedUrl } from '../../utils/preview';

/**
 * Renders a Google Drive file preview inside an iframe.
 */
export default function DriveEmbed({ url }) {
  const embedSrc = driveEmbedUrl(url);

  if (!embedSrc) {
    return (
      <div className="flex items-center justify-center h-64 bg-n-7 rounded-xl text-n-3 text-sm">
        Unable to load Drive preview
      </div>
    );
  }

  return (
    <div className="relative w-full" style={{ height: '70vh', minHeight: '400px' }}>
      <iframe
        className="w-full h-full rounded-xl border-0"
        src={embedSrc}
        title="Google Drive preview"
        allow="autoplay"
        sandbox="allow-scripts allow-same-origin allow-popups"
      />
    </div>
  );
}
