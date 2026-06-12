import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { resourceService } from '../services/resource.service';
import { useAuth } from '../context/AuthContext';
import {
  formatDate,
  resourceTypeLabel,
  semesterLabel,
  subjectPath,
  resourceShareUrl,
} from '../utils/format';
import { GooeyLoader } from '../components/ui/loader-10';

const TYPE_COLORS = {
  notes:      'bg-blue-500/20 text-blue-300',
  pyq:        'bg-purple-500/20 text-purple-300',
  lecture:    'bg-green-500/20 text-green-300',
  assignment: 'bg-yellow-500/20 text-yellow-300',
  lab:        'bg-orange-500/20 text-orange-300',
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

    resourceService.getBySlug(slug)
      .then((data) => {
        setResource(data.resource);
      })
      .catch(() => setError('Resource not found or may have been removed.'))
      .finally(() => setLoading(false));
  }, [slug]);

  async function handleSave() {
    if (!resource) return;
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
      <div className="min-h-screen bg-n-8 flex items-center justify-center">
        <GooeyLoader primaryColor="#AC6AFF" secondaryColor="#858DFF" borderColor="#252134" />
      </div>
    );
  }

  if (error || !resource) {
    return (
      <div className="min-h-screen bg-n-8 flex flex-col items-center justify-center gap-4 text-center px-4">
        <h1 className="text-2xl font-bold text-n-1">Resource Not Found</h1>
        <p className="text-n-3 text-sm">{error || 'The resource you are looking for does not exist.'}</p>
        <Link to="/" className="px-5 py-2.5 bg-color-1 text-n-8 rounded-xl font-medium hover:opacity-80 transition">
          Back to Home
        </Link>
      </div>
    );
  }

  const subject = resource.subjects;
  const subjectRoute = subjectPath(resource);
  const professorRoute = resource?.uploader?.username
    ? `/professors/${encodeURIComponent(resource.uploader.username)}`
    : null;
  const colorClass = TYPE_COLORS[resource.resource_type] || 'bg-n-6 text-n-3';
    <div className="min-h-screen bg-n-8 text-n-1">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Breadcrumb */}
        <nav className="text-sm text-n-3 mb-6 flex items-center gap-2">
          <Link to="/" className="hover:text-n-1 transition">Home</Link>
          <span>/</span>
          {professorRoute ? (
            <>
              <Link to="/professors" className="hover:text-n-1 transition">Professors</Link>
              <span>/</span>
              <Link to={professorRoute} className="hover:text-n-1 transition">@{resource.uploader.username}</Link>
              <span>/</span>
            </>
          ) : (
            <>
              <Link to="/dashboard/student" className="hover:text-n-1 transition">Resources</Link>
              <span>/</span>
            </>
          )}
          <span className="text-n-1 truncate max-w-xs">{resource.title}</span>
        </nav>

        {/* Title & Badges */}
        <div className="mb-6">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${colorClass}`}>
              {resourceTypeLabel(resource.resource_type)}
            </span>
            {resource.pyq_type && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-n-6 text-n-3">
                {resource.pyq_type.charAt(0).toUpperCase() + resource.pyq_type.slice(1)}
              </span>
            )}
            {resource.year && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-n-6 text-n-3">
                {resource.year}
              </span>
            )}
          </div>
          <h1 className="text-3xl font-bold leading-tight">{resource.title}</h1>
          {resource.description && (
            <p className="mt-3 text-n-3 leading-relaxed">{resource.description}</p>
          )}
        </div>

        {/* Meta grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8 p-5 bg-n-7 rounded-2xl border border-n-6">
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
          <div className="mb-6 text-sm">
            <span className="text-n-4">Uploaded by </span>
            <Link to={professorRoute} className="text-color-2 hover:underline">
              {resource.uploader.name || resource.uploader.username}
            </Link>
          </div>
        )}

        {subjectRoute && (
          <div className="mb-8">
            <Link to={subjectRoute} className="text-xs text-color-1 hover:underline">
              View all resources in this subject route →
            </Link>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3 mb-10">
          {(resource.signedUrl || resource.external_link || resource.youtube_url) && (
            <a
              href={resource.signedUrl || resource.youtube_url || resource.external_link}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 bg-color-1 text-n-8 rounded-xl font-medium hover:opacity-80 transition"
            >
              Preview ↗
            </a>
          )}

          {resource.signedUrl && (
            <a
              href={resource.signedUrl}
              download
              className="px-5 py-2.5 bg-n-6 text-n-1 rounded-xl font-medium hover:bg-n-5 transition"
            >
              Download ↓
            </a>
          )}

          <button
            onClick={handleCopyLink}
            className="px-5 py-2.5 bg-n-6 text-n-1 rounded-xl font-medium hover:bg-n-5 transition"
          >
            {copied ? '✓ Copied!' : 'Copy Link'}
          </button>

          {user && (
            <button
              onClick={handleSave}
              className={`px-5 py-2.5 rounded-xl font-medium transition ${
                saved
                  ? 'bg-color-1/20 text-color-1 border border-color-1'
                  : 'bg-n-6 text-n-1 hover:bg-n-5'
              }`}
            >
              {saved ? '★ Saved' : '☆ Save'}
            </button>
          )}
        </div>

        {/* Slug info */}
        <div className="p-4 bg-n-7 rounded-xl border border-n-6">
          <p className="text-xs text-n-4 mb-1">Shareable URL</p>
          <code className="text-sm text-color-1 break-all">{resourceShareUrl(resource.slug, resource)}</code>
          <p className="text-xs text-n-5 mt-2">Fallback URL: {`${window.location.origin}/resource/${resource.slug}`}</p>
        </div>
      </div>
    </div>
  );
}

function MetaItem({ label, value, mono = false }) {
  return (
    <div>
      <p className="text-xs text-n-4 mb-0.5">{label}</p>
      <p className={`text-sm text-n-1 font-medium ${mono ? 'font-mono' : ''}`}>
        {value || '—'}
      </p>
    </div>
  );
}
