import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useResources } from '../hooks/useResources';
import { userService } from '../services/index';

/**
 * StudentDashboard
 * Read-only view: browse resources, preview, download, share, save.
 */
export default function StudentDashboard() {
  const { user } = useAuth();
  const { resources, loading, error, fetch, updateFilters, filters } = useResources();

  useEffect(() => { fetch(); }, []);

  return (
    <section className="min-h-screen bg-n-8 text-n-1 p-6">
      <header className="mb-8">
        <h1 className="h3">Welcome, {user?.username} 👋</h1>
        <p className="body-2 text-n-4">Browse and access academic resources</p>
      </header>

      {/* ── Filters ── */}
      <div className="flex flex-wrap gap-3 mb-6">
        {['notes', 'assignment', 'pyq', 'lecture', 'youtube'].map(type => (
          <button
            key={type}
            onClick={() => { updateFilters({ resource_type: type }); fetch({ ...filters, resource_type: type }); }}
            className={`px-4 py-1.5 rounded-full text-sm border transition
              ${filters.resource_type === type
                ? 'bg-color-1 border-color-1 text-n-8'
                : 'border-n-6 text-n-3 hover:border-color-1'}`}
          >
            {type.toUpperCase()}
          </button>
        ))}
        <button
          onClick={() => fetch({})}
          className="px-4 py-1.5 rounded-full text-sm border border-n-6 text-n-4 hover:border-n-3"
        >
          Clear
        </button>
      </div>

      {/* ── Resource Grid ── */}
      {loading && <p className="text-n-4">Loading resources…</p>}
      {error   && <p className="text-red-400">Error: {error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {resources.map(r => (
          <ResourceCard key={r.id} resource={r} />
        ))}
      </div>

      {!loading && resources.length === 0 && (
        <p className="text-center text-n-4 mt-16">No resources found.</p>
      )}
    </section>
  );
}

function ResourceCard({ resource: r }) {
  const { user } = useAuth();

  const handleSave = async () => {
    try {
      await userService.savedList(); // placeholder — wires up to saveResource
    } catch {}
  };

  return (
    <div className="rounded-2xl border border-n-6 bg-n-7 p-5 flex flex-col gap-3 hover:border-color-1 transition">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono text-color-2 uppercase">{r.resource_type}</span>
        {r.pyq_type && (
          <span className="text-xs px-2 py-0.5 bg-color-1/20 text-color-1 rounded-full">{r.pyq_type}</span>
        )}
      </div>
      <h3 className="font-semibold text-n-1 leading-snug">{r.title}</h3>
      {r.description && <p className="text-sm text-n-4 line-clamp-2">{r.description}</p>}

      {/* Subject info */}
      {r.subjects && (
        <p className="text-xs text-n-5">
          {r.subjects.name_full} · Sem {r.subjects.semester} · {r.subjects.branch}
        </p>
      )}

      <div className="flex items-center gap-2 mt-auto pt-2 border-t border-n-6">
        {(r.external_link || r.signedUrl) && (
          <a
            href={r.external_link || r.signedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-center py-1.5 rounded-lg bg-color-1 text-n-8 text-sm font-medium hover:bg-color-1/90 transition"
          >
            Open
          </a>
        )}
        <button
          onClick={() => navigator.clipboard.writeText(
            `${window.location.origin}/resource/${r.slug}`
          )}
          className="px-3 py-1.5 rounded-lg border border-n-6 text-sm text-n-3 hover:border-color-1 transition"
          title="Copy share link"
        >
          Share
        </button>
      </div>
    </div>
  );
}
