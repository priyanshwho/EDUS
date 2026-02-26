import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useResources } from '../hooks/useResources';
import { resourceService } from '../services/resource.service';
import ResourceFilterPanel from '../components/ResourceFilterPanel';
import PreviewModal from '../components/previews/PreviewModal';
import { resourceTypeLabel, formatDate, resourceShareUrl } from '../utils/format';
import { isPreviewable } from '../utils/preview';

/**
 * StudentDashboard
 * Read-only view: browse resources, preview, download, share, save.
 */
export default function StudentDashboard() {
  const { user } = useAuth();
  const { resources, loading, error, fetch, updateFilters, clearFilters, filters } = useResources();
  const [previewResource, setPreviewResource] = useState(null);

  useEffect(() => { fetch(); }, []);

  function handleFilterChange(newFilters) {
    updateFilters(newFilters);
    fetch(newFilters);
  }

  function handleClear() {
    clearFilters();
    fetch({});
  }

  return (
    <section className="min-h-screen bg-n-8 text-n-1">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="h3">Welcome back, {user?.username} 👋</h1>
          <p className="body-2 text-n-4 mt-1">Browse and access academic resources</p>
        </header>

        <div className="flex gap-6">
          {/* Sidebar filter */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            <ResourceFilterPanel
              filters={filters}
              onChange={handleFilterChange}
              onClear={handleClear}
            />
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Mobile compact filter */}
            <div className="lg:hidden mb-4">
              <ResourceFilterPanel
                filters={filters}
                onChange={handleFilterChange}
                onClear={handleClear}
                compact
              />
            </div>

            {loading && (
              <div className="flex items-center justify-center h-48">
                <div className="w-8 h-8 border-2 border-color-1 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {error && <p className="text-red-400 mb-4">Error: {error}</p>}

            {!loading && resources.length === 0 && (
              <div className="flex flex-col items-center justify-center h-48 text-n-4 gap-2">
                <p className="text-4xl">📭</p>
                <p>No resources match your filters.</p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {resources.map((r) => (
                <ResourceCard
                  key={r.id}
                  resource={r}
                  onPreview={() => setPreviewResource(r)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Preview modal */}
      {previewResource && (
        <PreviewModal resource={previewResource} onClose={() => setPreviewResource(null)} />
      )}
    </section>
  );
}

function ResourceCard({ resource: r, onPreview }) {
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleSave() {
    try {
      if (saved) { await resourceService.unsave(r.id); setSaved(false); }
      else        { await resourceService.save(r.id);   setSaved(true);  }
    } catch {}
  }

  function handleCopy() {
    navigator.clipboard.writeText(resourceShareUrl(r.slug)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const typeColors = {
    notes: 'bg-blue-500/20 text-blue-300',
    pyq: 'bg-purple-500/20 text-purple-300',
    lecture: 'bg-green-500/20 text-green-300',
    assignment: 'bg-yellow-500/20 text-yellow-300',
    lab: 'bg-orange-500/20 text-orange-300',
  };
  const colorClass = typeColors[r.resource_type] || 'bg-n-6 text-n-3';

  return (
    <div className="rounded-2xl border border-n-6 bg-n-7 p-5 flex flex-col gap-3 hover:border-color-1 transition group">
      <div className="flex items-center justify-between gap-2">
        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
          {resourceTypeLabel(r.resource_type)}
        </span>
        <div className="flex items-center gap-1 text-xs text-n-5">
          {r.pyq_type && <span className="px-1.5 py-0.5 bg-n-6 rounded">{r.pyq_type}</span>}
          {r.year     && <span className="px-1.5 py-0.5 bg-n-6 rounded">{r.year}</span>}
        </div>
      </div>

      <Link to={`/resource/${r.slug}`} className="group/title">
        <h3 className="font-semibold text-n-1 leading-snug group-hover/title:text-color-1 transition line-clamp-2">
          {r.title}
        </h3>
      </Link>

      {r.description && (
        <p className="text-sm text-n-4 line-clamp-2">{r.description}</p>
      )}

      {r.subjects && (
        <p className="text-xs text-n-5">
          {r.subjects.name_full || r.subjects.acronym} · Sem {r.subjects.semester} · {r.subjects.branch}
        </p>
      )}

      <p className="text-xs text-n-6">{formatDate(r.created_at)}</p>

      <div className="flex items-center gap-2 mt-auto pt-3 border-t border-n-6">
        {isPreviewable(r) && (
          <button
            onClick={onPreview}
            className="flex-1 py-1.5 rounded-lg bg-color-1 text-n-8 text-sm font-medium hover:opacity-80 transition"
          >
            Preview
          </button>
        )}
        {(r.signedUrl || r.external_link) && (
          <a
            href={r.signedUrl || r.external_link}
            download={!!r.signedUrl}
            target={r.signedUrl ? '_self' : '_blank'}
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg border border-n-6 text-sm text-n-3 hover:border-color-1 hover:text-n-1 transition"
            title="Download"
          >
            ↓
          </a>
        )}
        <button
          onClick={handleCopy}
          className="px-3 py-1.5 rounded-lg border border-n-6 text-sm text-n-3 hover:border-color-1 transition"
          title="Copy link"
        >
          {copied ? '✓' : '⎘'}
        </button>
        <button
          onClick={handleSave}
          className={`px-3 py-1.5 rounded-lg border text-sm transition ${
            saved ? 'border-color-1 text-color-1' : 'border-n-6 text-n-3 hover:border-color-1'
          }`}
          title={saved ? 'Unsave' : 'Save'}
        >
          {saved ? '★' : '☆'}
        </button>
      </div>
    </div>
  );
}
