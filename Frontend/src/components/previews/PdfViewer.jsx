import { useEffect, useRef, useState } from 'react';

/**
 * Inline PDF viewer using PDF.js.
 * @param {string} url - Either a presigned S3 URL or a public PDF URL
 */
export default function PdfViewer({ url }) {
  const canvasRef = useRef(null);
  const [pdf, setPdf] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scale, setScale] = useState(1.5);
  const renderTaskRef = useRef(null);

  // Load PDFjs lazily to avoid SSR issues
  useEffect(() => {
    if (!url) return;

    let cancelled = false;

    async function loadPdf() {
      try {
        setLoading(true);
        setError(null);

        const pdfjs = await import('pdfjs-dist');
        // Use the bundled worker
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          'pdfjs-dist/build/pdf.worker.mjs',
          import.meta.url
        ).href;

        const loadingTask = pdfjs.getDocument({
          url,
          withCredentials: false,
        });
        const pdfDoc = await loadingTask.promise;
        if (cancelled) return;

        setPdf(pdfDoc);
        setTotalPages(pdfDoc.numPages);
        setCurrentPage(1);
      } catch {
        if (!cancelled) setError('Failed to load PDF. The link may have expired.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadPdf();
    return () => { cancelled = true; };
  }, [url]);

  // Render current page when pdf or page/scale changes
  useEffect(() => {
    if (!pdf || !canvasRef.current) return;

    let cancelled = false;

    async function renderPage() {
      try {
        // Cancel any in-progress render
        if (renderTaskRef.current) {
          renderTaskRef.current.cancel();
        }

        const page = await pdf.getPage(currentPage);
        if (cancelled) return;

        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = { canvasContext: context, viewport };
        const renderTask = page.render(renderContext);
        renderTaskRef.current = renderTask;
        await renderTask.promise;
      } catch (err) {
        if (err?.name !== 'RenderingCancelledException' && !cancelled) {
          setError('Failed to render page');
        }
      }
    }

    renderPage();
    return () => { cancelled = true; };
  }, [pdf, currentPage, scale]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-n-7 rounded-xl">
        <div className="flex flex-col items-center gap-3 text-n-3">
          <div className="w-8 h-8 border-2 border-color-1 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Loading PDF…</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-n-7 rounded-xl gap-3 text-center p-6">
        <p className="text-n-3 text-sm">{error}</p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-color-1 text-n-8 rounded-lg text-sm font-medium hover:opacity-80 transition"
        >
          Open in New Tab
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between bg-n-7 rounded-xl px-4 py-2 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className="px-3 py-1 bg-n-6 rounded-lg text-sm disabled:opacity-40 hover:bg-n-5 transition"
          >
            ←
          </button>
          <span className="text-sm text-n-3">
            Page <strong className="text-n-1">{currentPage}</strong> of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="px-3 py-1 bg-n-6 rounded-lg text-sm disabled:opacity-40 hover:bg-n-5 transition"
          >
            →
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setScale((s) => Math.max(0.5, s - 0.25))}
            className="px-2 py-1 bg-n-6 rounded-lg text-sm hover:bg-n-5 transition"
          >
            −
          </button>
          <span className="text-xs text-n-3 w-12 text-center">{Math.round(scale * 100)}%</span>
          <button
            onClick={() => setScale((s) => Math.min(3, s + 0.25))}
            className="px-2 py-1 bg-n-6 rounded-lg text-sm hover:bg-n-5 transition"
          >
            +
          </button>
          <a
            href={url}
            download
            className="ml-2 px-3 py-1 bg-color-1 text-n-8 rounded-lg text-sm font-medium hover:opacity-80 transition"
          >
            Download
          </a>
        </div>
      </div>

      {/* Canvas */}
      <div className="overflow-auto bg-n-8 rounded-xl flex justify-center" style={{ maxHeight: '70vh' }}>
        <canvas ref={canvasRef} className="shadow-xl" />
      </div>
    </div>
  );
}
