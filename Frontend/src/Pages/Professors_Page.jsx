import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { professorService } from '../services';

export default function ProfessorsPage() {
  const [q, setQ] = useState('');
  const [professors, setProfessors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function fetchProfessors(filters = {}) {
    setLoading(true);
    setError('');
    try {
      const { professors: rows } = await professorService.list(filters);
      setProfessors(rows || []);
    } catch (err) {
      setError(err.message || 'Failed to load professors');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProfessors();
  }, []);

  async function onSearch(e) {
    e.preventDefault();
    const query = q.trim();
    await fetchProfessors(query ? { q: query } : {});
  }

  return (
    <section className="min-h-screen bg-n-8 text-n-1 px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-6">
          <h1 className="h3">Browse Professors</h1>
          <p className="text-n-4 text-sm mt-1">Find professor profiles and explore everything they have uploaded.</p>
        </header>

        <form onSubmit={onSearch} className="flex flex-col sm:flex-row gap-2 mb-6">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by professor name or username"
            className="flex-1 rounded-xl border border-n-6 bg-n-7 px-4 py-2.5 text-sm focus:outline-none focus:border-color-1"
          />
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-color-1 text-n-8 text-sm font-semibold hover:bg-color-1/90 transition"
          >
            Search
          </button>
        </form>

        {loading && <p className="text-n-4 text-sm">Loading professors…</p>}
        {error && <p className="text-red-400 text-sm">{error}</p>}

        {!loading && !error && professors.length === 0 && (
          <div className="rounded-2xl border border-n-6 bg-n-7 p-6 text-sm text-n-4">
            No professor profiles found.
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {professors.map((p) => (
            <Link
              key={p.id}
              to={`/professors/${encodeURIComponent(p.username)}`}
              className="rounded-2xl border border-n-6 bg-n-7 p-5 hover:border-color-1 transition"
            >
              <p className="text-lg font-semibold text-n-1">{p.name || p.username}</p>
              <p className="text-xs text-n-4 mt-1">@{p.username}</p>

              <div className="mt-4 flex gap-2 text-xs">
                <span className="px-2 py-1 rounded bg-n-6 text-n-3">Subjects: {p.subjects_count ?? 0}</span>
                <span className="px-2 py-1 rounded bg-n-6 text-n-3">Uploads: {p.resources_count ?? 0}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
