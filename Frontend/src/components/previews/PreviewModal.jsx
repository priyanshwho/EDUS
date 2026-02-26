import { useEffect } from 'react';
import { getPreviewType } from '../../utils/preview';
import PdfViewer from './PdfViewer';
import YoutubeEmbed from './YoutubeEmbed';
import DriveEmbed from './DriveEmbed';

/**
 * Modal shell that wraps all preview types.
 *
 * @param {object} resource  — full resource object (with signedUrl if S3)
 * @param {function} onClose — callback to close modal
 */
export default function PreviewModal({ resource, onClose }) {
  const previewType = getPreviewType(resource);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // Prevent scroll bleed
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  function renderContent() {
    switch (previewType) {
      case 'signed':
        return <PdfViewer url={resource.signedUrl} />;
      case 'youtube':
        return <YoutubeEmbed url={resource.youtube_url} />;
      case 'drive':
        return <DriveEmbed url={resource.external_link} />;
      case 'external':
        return (
          <div className="flex flex-col items-center gap-4 py-12 text-center">
            <p className="text-n-3 text-sm">This resource opens in an external link.</p>
            <a
              href={resource.external_link}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 bg-color-1 text-n-8 rounded-xl font-medium hover:opacity-80 transition"
            >
              Open Link →
            </a>
          </div>
        );
      default:
        return (
          <div className="flex items-center justify-center h-40 text-n-3 text-sm">
            No preview available for this resource.
          </div>
        );
    }
  }

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 backdrop-blur-sm overflow-y-auto py-8"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Modal panel */}
      <div className="relative w-full max-w-4xl mx-4 bg-n-8 border border-n-6 rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-n-6">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-n-1 truncate">
              {resource.title}
            </h2>
            {resource.description && (
              <p className="mt-1 text-sm text-n-3 line-clamp-2">{resource.description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="ml-4 flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-n-3 hover:text-n-1 hover:bg-n-6 transition"
            aria-label="Close preview"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
