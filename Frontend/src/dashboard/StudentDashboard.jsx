import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { resourceService } from '../services/resource.service';
import ResourceFilterPanel from '../components/ResourceFilterPanel';
import { resourceTypeLabel, formatDate, resourcePath, resourceShareUrl } from '../utils/format';
import { useStudentDashboardStore } from '../stores/studentDashboard.store';
import { GooeyLoader } from '../components/ui/loader-10';

/**
 * StudentDashboard
 * Read-only view: browse resources, preview, download, share, save.
 */
export default function StudentDashboard() {
  const { user, isStudent, upgradeToProfessor } = useAuth();
  const navigate = useNavigate();
  const {
    resources,
    loading,
    error,
    filters,
    fetchResources,
    setFilters,
    clearFilters,
  } = useStudentDashboardStore();
  const [showUpgradeForm, setShowUpgradeForm] = useState(false);
  const [upgradePin, setUpgradePin] = useState('');
  const [upgrading, setUpgrading] = useState(false);
  const [upgradeError, setUpgradeError] = useState('');

  useEffect(() => {
    fetchResources().catch(() => {});
  }, [fetchResources]);

  function handleFilterChange(newFilters) {
    const merged = { ...filters, ...newFilters };
    setFilters(newFilters);
    fetchResources(merged).catch(() => {});
  }

  function handleClear() {
    clearFilters();
    fetchResources({}).catch(() => {});
  }

  async function handleUpgradeSubmit(e) {
    e.preventDefault();
    setUpgradeError('');
    setUpgrading(true);
    try {
      await upgradeToProfessor(upgradePin);
      navigate('/dashboard/professor');
    } catch (err) {
      setUpgradeError(err.message || 'PIN verification failed');
    } finally {
      setUpgrading(false);
    }
  }

  return (
    <section className="min-h-screen bg-n-8 text-n-1 relative">
      {/* Decorative background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-64 bg-color-1/10 blur-[120px] pointer-events-none rounded-full"></div>
      
      <div className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        <header className="mb-10 rounded-3xl border border-n-6 bg-n-7/40 backdrop-blur overflow-hidden shadow-2xl">
          <div className="bg-gradient-to-r from-color-1/20 via-color-5/20 to-cyan-400/20 p-8 sm:p-12 relative overflow-hidden">
            <div className="relative z-10">
              <h1 className="text-4xl sm:text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-n-1 to-n-3 mb-3 tracking-tight">
                Welcome back, {user?.username} 👋
              </h1>
              <p className="text-lg text-n-3 mb-6 max-w-2xl font-medium">
                Browse and access premium academic resources curated by top professors.
              </p>
              <Link
                to="/professors"
                className="inline-flex items-center text-sm font-semibold text-color-1 hover:text-color-2 hover:translate-x-1 transition-all"
              >
                Discover professor profiles <span className="ml-2">→</span>
              </Link>
            </div>
            
            {/* Background elements in banner */}
            <div className="absolute top-[-50%] right-[-10%] w-96 h-96 bg-color-1/30 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-[-50%] right-[10%] w-80 h-80 bg-cyan-400/20 rounded-full blur-3xl pointer-events-none"></div>
          </div>

          {isStudent && (
            <div className="p-6 sm:p-8 bg-n-8/80 border-t border-n-6/50 flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-3 py-1 text-xs font-bold bg-color-2/10 text-blue-400 border border-color-2/20 rounded-full uppercase tracking-wider">
                    Student Profile
                  </span>
                </div>
                <p className="text-sm text-n-4">Want to publish your own notes and PYQs? Upgrade to Professor status using your secure institute PIN.</p>
              </div>
              
              <div className="w-full md:w-auto shrink-0">
                {!showUpgradeForm ? (
                  <button
                    onClick={() => setShowUpgradeForm(true)}
                    className="w-full md:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-color-1 via-color-5 to-cyan-400 text-n-8 text-sm font-bold shadow-[0_0_15px_rgba(172,106,255,0.4)] hover:shadow-[0_0_25px_rgba(172,106,255,0.6)] hover:-translate-y-0.5 transition-all"
                  >
                    Become Professor
                  </button>
                ) : (
                  <div className="bg-n-7 p-4 rounded-2xl border border-color-1/30 relative">
                    <button onClick={() => setShowUpgradeForm(false)} className="absolute top-2 right-2 text-n-4 hover:text-n-1 p-1">✕</button>
                    <p className="text-xs font-semibold text-color-1 mb-3">Enter Professor PIN</p>
                    <form onSubmit={handleUpgradeSubmit} className="flex flex-col sm:flex-row gap-3">
                      <input
                        type="password"
                        inputMode="numeric"
                        maxLength={10}
                        value={upgradePin}
                        onChange={(e) => setUpgradePin(e.target.value)}
                        placeholder="••••"
                        className="w-full sm:w-40 rounded-xl border border-n-6 bg-n-8 px-4 py-2.5 text-center tracking-widest font-mono text-lg focus:outline-none focus:border-color-1 focus:ring-1 focus:ring-color-1 transition"
                        required
                      />
                      <button
                        type="submit"
                        disabled={upgrading || upgradePin.length < 4}
                        className="w-full sm:w-auto px-6 py-2.5 rounded-xl border border-color-1 bg-color-1/10 text-color-1 text-sm font-bold hover:bg-color-1/20 disabled:opacity-50 transition"
                      >
                        {upgrading ? 'Verifying…' : 'Upgrade'}
                      </button>
                    </form>
                    {upgradeError && <p className="mt-2 text-xs text-red-400 font-medium">{upgradeError}</p>}
                  </div>
                )}
              </div>
            </div>
          )}
        </header>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar filter */}
          <div className="hidden lg:block w-72 flex-shrink-0">
            <div className="sticky top-24">
              <ResourceFilterPanel
                filters={filters}
                onChange={handleFilterChange}
                onClear={handleClear}
              />
            </div>
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
                <GooeyLoader primaryColor="#AC6AFF" secondaryColor="#858DFF" borderColor="#252134" />
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
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ResourceCard({ resource: r }) {
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleSave() {
    try {
      if (saved) { await resourceService.unsave(r.id); setSaved(false); }
      else        { await resourceService.save(r.id);   setSaved(true);  }
    } catch {
      setSaved((prev) => prev);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(resourceShareUrl(r.slug, r)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const typeColors = {
    notes: 'bg-color-2/20 text-blue-300',
    pyq: 'bg-purple-500/20 text-purple-300',
    lecture: 'bg-green-500/20 text-green-300',
    assignment: 'bg-yellow-500/20 text-yellow-300',
    lab: 'bg-orange-500/20 text-orange-300',
  };
  const colorClass = typeColors[r.resource_type] || 'bg-n-6 text-n-3';

  return (
    <div className="group relative rounded-3xl border border-n-6 bg-n-7/30 backdrop-blur p-6 flex flex-col gap-4 hover:-translate-y-1.5 hover:shadow-2xl hover:border-color-1/50 transition-all duration-300 overflow-hidden">
      {/* Subtle background glow on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-color-1/0 to-color-1/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

      <div className="relative z-10 flex items-center justify-between gap-2">
        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${colorClass}`}>
          {resourceTypeLabel(r.resource_type)}
        </span>
        <div className="flex items-center gap-2 text-xs font-mono font-medium">
          {r.pyq_type && <span className="px-2 py-1 bg-n-8/80 border border-n-6 text-n-3 rounded-md">{r.pyq_type}</span>}
          {r.year     && <span className="px-2 py-1 bg-n-8/80 border border-n-6 text-n-3 rounded-md">{r.year}</span>}
        </div>
      </div>

      <Link to={resourcePath(r, r.slug)} className="relative z-10 mt-1 block">
        <h3 className="text-lg font-bold text-n-1 leading-tight group-hover:text-color-1 transition-colors line-clamp-2">
          {r.title}
        </h3>
      </Link>

      {r.description && (
        <p className="relative z-10 text-sm text-n-4 line-clamp-2">{r.description}</p>
      )}

      {r.subjects && (
        <div className="relative z-10 flex items-center gap-2 mt-2">
          <span className="px-2.5 py-1 rounded-full bg-n-6/50 text-n-2 text-xs font-medium border border-n-5">
            {r.subjects.branch} · Sem {r.subjects.semester}
          </span>
          <span className="text-xs text-n-5 font-mono truncate">
            {r.subjects.acronym}
          </span>
        </div>
      )}

      <div className="relative z-10 mt-auto pt-5 border-t border-n-6/50 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          {r.uploader?.username && (
            <Link
              to={`/professors/${encodeURIComponent(r.uploader.username)}`}
              className="text-xs font-medium text-color-2 hover:text-color-1 hover:underline transition-colors flex items-center gap-1.5"
            >
              <div className="w-5 h-5 rounded-full bg-color-2/20 border border-color-2 flex items-center justify-center text-[10px] text-color-2">
                {r.uploader.name?.[0] || r.uploader.username[0]}
              </div>
              {r.uploader.name || r.uploader.username}
            </Link>
          )}
          <span className="text-[11px] text-n-5 uppercase tracking-wider font-medium">{formatDate(r.created_at)}</span>
        </div>

        <div className="flex items-center gap-2 mt-1">
          {(r.signedUrl || r.external_link || r.youtube_url) && (
            <a
              href={r.signedUrl || r.external_link || r.youtube_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center py-2 rounded-xl bg-color-1/10 text-color-1 text-sm font-bold border border-color-1/20 hover:bg-color-1 hover:text-n-8 transition-all"
            >
              Preview
            </a>
          )}
          {(r.signedUrl || r.external_link) && (
            <a
              href={r.signedUrl || r.external_link}
              download={!!r.signedUrl}
              target={r.signedUrl ? '_self' : '_blank'}
              rel="noopener noreferrer"
              className="flex items-center justify-center w-10 h-10 rounded-xl bg-n-8 border border-n-6 text-n-3 hover:border-color-1 hover:text-color-1 hover:shadow-[0_0_10px_rgba(172,106,255,0.2)] transition-all"
              title="Download"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </a>
          )}
          <button
            onClick={handleCopy}
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-n-8 border border-n-6 text-n-3 hover:border-color-1 hover:text-color-1 hover:shadow-[0_0_10px_rgba(172,106,255,0.2)] transition-all"
            title="Copy link"
          >
            {copied ? (
               <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
               </svg>
            ) : (
               <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
               </svg>
            )}
          </button>
          <button
            onClick={handleSave}
            className={`flex items-center justify-center w-10 h-10 rounded-xl bg-n-8 border transition-all ${
              saved 
                ? 'border-yellow-500/50 text-yellow-500 bg-yellow-500/10 shadow-[0_0_10px_rgba(234,179,8,0.2)]' 
                : 'border-n-6 text-n-3 hover:border-yellow-500/50 hover:text-yellow-500'
            }`}
            title={saved ? 'Unsave' : 'Save'}
          >
            <svg className="w-4 h-4" fill={saved ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
