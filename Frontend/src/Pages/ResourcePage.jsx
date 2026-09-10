import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { resourceService } from '../services/resource.service';
import { useAuth } from '../context/AuthContext';
import {
  formatDate,
  resourceTypeLabel,
  semesterLabel,
  subjectPath,
  resourcePath,
  resourceShareUrl,
} from '../utils/format';
import { GooeyLoader } from '../components/ui/loader-10';
import { getStaticResources } from '../utils/staticResources';

const TYPE_COLORS = {
  notes:      'bg-blue-500/15 text-sky-300 border border-blue-400/30',
  note:       'bg-blue-500/15 text-sky-300 border border-blue-400/30',
  pyq:        'bg-sky-500/15 text-sky-300 border border-sky-400/30',
  lecture:    'bg-cyan-500/15 text-cyan-300 border border-cyan-400/30',
  assignment: 'bg-blue-600/15 text-blue-300 border border-blue-500/30',
  lab:        'bg-indigo-500/15 text-indigo-300 border border-indigo-400/30',
};

export default function ResourcePage() {
  const { slug } = useParams();
  const { user } = useAuth();

  const [resource, setResource] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setError(null);

    const cleanSlug = decodeURIComponent(slug).trim();

    // 1. Check if it's a known static resource
    const allStatic = getStaticResources();
    const staticRes = allStatic.find(
      (r) => r.slug === cleanSlug || r.id === cleanSlug || String(r.id) === String(cleanSlug)
    );

    if (staticRes) {
      setResource(staticRes);
      const canonical = resourcePath(staticRes, cleanSlug);
      if (canonical && window.location.pathname !== canonical) {
        window.history.replaceState(null, '', canonical);
      }
      setLoading(false);
      return;
    }

    // 2. Otherwise fetch from API
    resourceService.getBySlug(cleanSlug)
      .then((data) => {
        setResource(data.resource);
        if (data?.resource) {
          const canonical = resourcePath(data.resource, cleanSlug);
          if (canonical && window.location.pathname !== canonical) {
            window.history.replaceState(null, '', canonical);
          }
        }
      })
      .catch(() => {
        const fallbackRes = allStatic.find(
          (r) =>
            r.slug === cleanSlug ||
            r.id === cleanSlug ||
            (cleanSlug.startsWith('static-') && (r.slug.includes(cleanSlug) || cleanSlug.includes(r.slug)))
        );
        if (fallbackRes) {
          setResource(fallbackRes);
        } else {
          setError('Resource not found or may have been removed.');
        }
      })
      .finally(() => setLoading(false));
  }, [slug]);

  async function handleSave() {
    if (!resource || resource.isStatic) return;
    try {
      if (saved) {
        await resourceService.unsave(resource.id);
        setSaved(false);
      } else {
        await resourceService.save(resource.id);
        setSaved(true);
      }
    } catch {
      // fail silently
    }
  }

  function handleCopyLink() {
    navigator.clipboard.writeText(resourceShareUrl(resource.slug, resource)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0E0C15] flex items-center justify-center">
        <GooeyLoader primaryColor="#38bdf8" secondaryColor="#2563eb" borderColor="#1e293b" />
      </div>
    );
  }

  if (error || !resource) {
    return (
      <div className="min-h-screen bg-[#0E0C15] flex flex-col items-center justify-center gap-5 text-center px-4 relative overflow-hidden">
        {/* Ambient background glow */}
        <div
          aria-hidden
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[350px] pointer-events-none blur-[100px] opacity-30"
          style={{
            background: 'radial-gradient(circle, rgba(56,189,248,0.2) 0%, rgba(37,99,235,0.15) 50%, transparent 80%)',
          }}
        />

        <div className="relative z-10 p-8 rounded-3xl bg-slate-900/60 backdrop-blur-xl border border-blue-500/20 shadow-2xl shadow-blue-950/40 max-w-md w-full flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-sky-400 mb-4 shadow-[0_0_20px_rgba(56,189,248,0.2)]">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Resource Not Found</h1>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed">
            {error || 'The resource you are looking for does not exist or may have been moved.'}
          </p>
          <Link
            to="/"
            className="w-full py-3 px-6 rounded-xl font-semibold text-white bg-gradient-to-r from-sky-400 via-blue-500 to-blue-600 hover:from-sky-300 hover:via-blue-400 hover:to-blue-500 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 border border-sky-300/30 text-center"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const subject = resource.subjects;
  const subjectRoute = subjectPath(resource);
  const professorRoute = resource?.uploader?.username
    ? `/professors/${encodeURIComponent(resource.uploader.username)}`
    : null;
  const colorClass = TYPE_COLORS[resource.resource_type] || 'bg-blue-500/15 text-sky-300 border border-blue-400/30';

  return (
    <div className="min-h-screen bg-[#0E0C15] text-slate-100 relative overflow-hidden">
      {/* Ambient background glow: light blue to dark blue tinted */}
      <div
        aria-hidden
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[75vw] h-[40vh] pointer-events-none z-0 blur-[90px] opacity-35"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(56,189,248,0.2) 0%, rgba(37,99,235,0.12) 45%, transparent 75%)',
        }}
      />

      <div className="max-w-4xl mx-auto px-4 py-12 relative z-10">
        {/* Breadcrumb */}
        <nav className="text-sm text-slate-400 mb-6 flex items-center gap-2 flex-wrap">
          <Link to="/" className="hover:text-sky-400 transition-colors">Home</Link>
          <span className="text-slate-600">/</span>
          {professorRoute ? (
            <>
              <Link to="/professors" className="hover:text-sky-400 transition-colors">Professors</Link>
              <span className="text-slate-600">/</span>
              <Link to={professorRoute} className="hover:text-sky-400 transition-colors font-medium text-slate-300">
                @{resource.uploader.username}
              </Link>
              <span className="text-slate-600">/</span>
            </>
          ) : (
            <>
              <Link to="/dashboard/student" className="hover:text-sky-400 transition-colors">Resources</Link>
              <span className="text-slate-600">/</span>
            </>
          )}
          <span className="text-white truncate max-w-xs font-medium">{resource.title}</span>
        </nav>

        {/* Title & Badges */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-2.5 mb-3.5">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase ${colorClass}`}>
              {resourceTypeLabel(resource.resource_type)}
            </span>
            {resource.pyq_type && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-900/80 border border-blue-500/20 text-slate-300">
                {resource.pyq_type.charAt(0).toUpperCase() + resource.pyq_type.slice(1)}
              </span>
            )}
            {resource.year && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-900/80 border border-blue-500/20 text-slate-300">
                {resource.year}
              </span>
            )}
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight text-white tracking-tight">
            {resource.title}
          </h1>
          {resource.description && (
            <p className="mt-3 text-slate-400 leading-relaxed text-base">{resource.description}</p>
          )}
        </div>

        {/* Meta grid */}
        <div className="relative overflow-hidden grid grid-cols-2 sm:grid-cols-3 gap-5 mb-8 p-6 bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-blue-500/20 shadow-xl shadow-blue-950/20">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-sky-400 via-blue-500 to-blue-700 opacity-80" />
          {subject && (
            <>
              <MetaItem label="Subject" value={subject.name_full || subject.acronym} />
              <MetaItem label="Branch" value={subject.branch} />
              <MetaItem label="Semester" value={semesterLabel(subject.semester)} />
            </>
          )}
          <MetaItem label="Slug" value={resource.slug} mono />
          <MetaItem label="Uploaded" value={formatDate(resource.created_at)} />
          <MetaItem label="Type" value={resourceTypeLabel(resource.resource_type)} />
        </div>

        {resource?.uploader?.username && (
          <div className="mb-4 text-sm flex items-center gap-2">
            <span className="text-slate-400">Uploaded by</span>
            <Link
              to={professorRoute}
              className="font-medium text-sky-400 hover:text-sky-300 hover:underline flex items-center gap-1.5"
            >
              <div className="w-5 h-5 rounded-full bg-blue-500/20 border border-blue-500/50 flex items-center justify-center text-[10px] text-sky-400">
                {resource.uploader.name?.[0] || resource.uploader.username[0]}
              </div>
              {resource.uploader.name || resource.uploader.username}
            </Link>
          </div>
        )}

        {subjectRoute && (
          <div className="mb-8">
            <Link
              to={subjectRoute}
              className="inline-flex items-center gap-1 text-xs font-semibold text-sky-400 hover:text-sky-300 hover:underline transition-colors"
            >
              <span>View all resources in this subject route</span>
              <span className="text-sm leading-none">→</span>
            </Link>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-3 mb-10">
          {(resource.signedUrl || resource.external_link || resource.youtube_url) && (
            <a
              href={resource.signedUrl || resource.youtube_url || resource.external_link}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-sky-400 via-blue-500 to-blue-600 hover:from-sky-300 hover:via-blue-400 hover:to-blue-500 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 border border-sky-300/30 cursor-pointer"
            >
              Preview ↗
            </a>
          )}

          {resource.signedUrl && (
            <a
              href={resource.signedUrl}
              download
              className="px-5 py-2.5 bg-slate-900/80 hover:bg-slate-800 text-slate-200 hover:text-white border border-blue-500/20 hover:border-blue-400/50 rounded-xl font-medium transition-all"
            >
              Download ↓
            </a>
          )}

          <button
            onClick={handleCopyLink}
            className="px-5 py-2.5 bg-slate-900/80 hover:bg-slate-800 text-slate-200 hover:text-white border border-blue-500/20 hover:border-blue-400/50 hover:shadow-[0_0_15px_rgba(56,189,248,0.15)] rounded-xl font-medium transition-all flex items-center gap-1.5"
          >
            {copied ? (
              <>
                <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-emerald-400 font-semibold">Copied!</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <span>Copy Link</span>
              </>
            )}
          </button>

          {user && !resource.isStatic && (
            <button
              onClick={handleSave}
              className={`px-5 py-2.5 rounded-xl font-medium transition-all flex items-center gap-1.5 ${
                saved
                  ? 'bg-blue-500/15 text-sky-400 border border-blue-500/50 shadow-[0_0_15px_rgba(56,189,248,0.2)]'
                  : 'bg-slate-900/80 hover:bg-slate-800 text-slate-200 hover:text-white border border-blue-500/20 hover:border-blue-400/50'
              }`}
            >
              <span>{saved ? '★ Saved' : '☆ Save'}</span>
            </button>
          )}
        </div>

        {/* Slug info */}
        <div className="relative overflow-hidden p-5 bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-blue-500/20 shadow-xl shadow-blue-950/20">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-sky-400 via-blue-500 to-blue-700 opacity-80" />
          <p className="text-xs text-sky-300/80 uppercase tracking-wider font-semibold mb-2">Shareable URL</p>
          <code className="text-sm text-sky-400 font-mono break-all selection:bg-blue-500/30 selection:text-sky-200 block p-3 rounded-xl bg-slate-950/60 border border-blue-500/20">
            {resourceShareUrl(resource.slug, resource)}
          </code>
          <p className="text-xs text-slate-400 mt-3 flex items-center gap-2 flex-wrap">
            <span className="text-slate-500">Fallback URL:</span>
            <span className="font-mono text-slate-300">{`${window.location.origin}/resource/${resource.slug}`}</span>
          </p>
        </div>
      </div>
    </div>
  );
}

function MetaItem({ label, value, mono = false }) {
  return (
    <div>
      <p className="text-xs text-slate-400 mb-1 font-medium">{label}</p>
      <p className={`text-sm text-white font-semibold ${mono ? 'font-mono text-sky-300' : ''}`}>
        {value || '—'}
      </p>
    </div>
  );
}
