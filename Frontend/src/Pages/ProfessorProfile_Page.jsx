import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { professorService } from '../services';
import {
  formatDate,
  resourceTypeLabel,
  resourcePath,
  semesterLabel,
  slugifySegment,
} from '../utils/format';

const RESOURCE_TYPES = ['', 'notes', 'pyq', 'assignment', 'lecture'];

function parseSemesterParam(semParam) {
  if (!semParam) return null;
  const value = String(semParam).toLowerCase();
  if (value.startsWith('sem')) return Number(value.slice(3));
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export default function ProfessorProfilePage() {
  const { username, branch, semester, subject, resourceType } = useParams();

  const [profile, setProfile] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [resources, setResources] = useState([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const decodedUsername = decodeURIComponent(username || '');

  async function fetchProfile(filters = {}) {
    setLoading(true);
    setError('');
    try {
      const data = await professorService.getByUsername(decodedUsername, filters);
      setProfile(data.professor || null);
      setSubjects(data.subjects || []);
      setResources(data.resources || []);
    } catch (err) {
      setError(err.message || 'Failed to load professor profile');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProfile();
  }, [decodedUsername]);

  const filteredResources = useMemo(() => {
    const semNumber = parseSemesterParam(semester);

    return resources.filter((r) => {
      if (branch && slugifySegment(r?.subjects?.branch) !== slugifySegment(branch)) return false;
      if (semNumber && Number(r?.subjects?.semester) !== semNumber) return false;
      if (subject) {
        const subjectSlug = slugifySegment(r?.subjects?.acronym || r?.subjects?.name_full);
        if (subjectSlug !== slugifySegment(subject)) return false;
      }
      if (resourceType && slugifySegment(r?.resource_type) !== slugifySegment(resourceType)) return false;
      return true;
    });
  }, [resources, branch, semester, subject, resourceType]);

  async function onSearch(e) {
    e.preventDefault();
    const query = q.trim();
    await fetchProfile(query ? { q: query } : {});
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-n-8 text-n-4 flex items-center justify-center">
        Loading professor profile…
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-n-8 text-n-1 flex items-center justify-center px-4 text-center">
        <div>
          <p className="text-red-400 text-sm">{error || 'Professor profile not found'}</p>
          <Link to="/professors" className="inline-block mt-4 text-color-1 text-sm hover:underline">
            Back to professors
          </Link>
        </div>
      </div>
    );
  }

  return (
    <section className="min-h-screen bg-n-8 text-n-1 px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <nav className="text-sm text-n-4 mb-4 flex items-center gap-2">
          <Link to="/professors" className="hover:text-n-1 transition">Professors</Link>
          <span>/</span>
          <span className="text-n-2">@{profile.username}</span>
        </nav>

        <header className="rounded-2xl border border-n-6 bg-n-7 p-5 mb-6">
          <h1 className="h4">{profile.name || profile.username}</h1>
          <p className="text-sm text-n-4 mt-1">@{profile.username}</p>
          <p className="text-xs text-n-5 mt-2">Joined {formatDate(profile.created_at)}</p>
        </header>

        <form onSubmit={onSearch} className="flex flex-col sm:flex-row gap-2 mb-6">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search this professor's uploads"
            className="flex-1 rounded-xl border border-n-6 bg-n-7 px-4 py-2.5 text-sm focus:outline-none focus:border-color-1"
          />
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-color-1 text-n-8 text-sm font-semibold hover:bg-color-1/90 transition"
          >
            Search
          </button>
        </form>

        <section className="mb-8">
          <h2 className="h5 mb-3">Subjects ({subjects.length})</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {subjects.map((s) => {
              const href = [
                '/professors',
                encodeURIComponent(profile.username),
                slugifySegment(s.branch),
                `sem${s.semester}`,
                slugifySegment(s.acronym || s.name_full),
              ].join('/');

              return (
                <Link
                  key={s.id}
                  to={href}
                  className="rounded-xl border border-n-6 bg-n-7 p-4 hover:border-color-1 transition"
                >
                  <p className="text-sm font-semibold">{s.name_full}</p>
                  <p className="text-xs text-n-4 mt-1">{s.acronym} • {s.branch} • {semesterLabel(s.semester)}</p>
                </Link>
              );
            })}
          </div>
        </section>

        <section>
          <h2 className="h5 mb-3">Uploads ({filteredResources.length})</h2>

          {filteredResources.length === 0 ? (
            <div className="rounded-xl border border-n-6 bg-n-7 p-5 text-sm text-n-4">
              No resources found for the selected route/filter.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredResources.map((r) => (
                <article key={r.id} className="rounded-xl border border-n-6 bg-n-7 p-4 hover:border-color-1 transition">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs px-2 py-0.5 rounded bg-n-6 text-n-3">{resourceTypeLabel(r.resource_type)}</span>
                    {r.year && <span className="text-xs text-n-4">{r.year}</span>}
                  </div>

                  <Link to={resourcePath(r, r.slug)} className="text-sm font-semibold hover:text-color-1 transition">
                    {r.title}
                  </Link>

                  <p className="text-xs text-n-4 mt-2">
                    {r.subjects?.name_full || r.subjects?.acronym} • {r.subjects?.branch} • Sem {r.subjects?.semester}
                  </p>

                  <p className="text-xs text-n-5 mt-2">{formatDate(r.created_at)}</p>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
