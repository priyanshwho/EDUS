import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { professorService } from '../services';

/* ─── Avatar initials ──────────────────────────────────────── */
function Avatar({ name, size = 48 }) {
  const initials = (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const hue = [...(name || '')].reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;
  return (
    <div
      style={{
        width: size, height: size, borderRadius: '50%', flexShrink: 0,
        background: `linear-gradient(135deg, hsl(${hue},60%,50%), hsl(${(hue + 60) % 360},70%,60%))`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.36, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em',
        boxShadow: `0 0 0 2px rgba(14,12,21,1), 0 0 12px hsla(${hue},60%,50%,0.3)`,
      }}
    >
      {initials}
    </div>
  );
}

/* ─── Professor card ───────────────────────────────────────── */
function ProfCard({ professor }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Link
      to={`/professors/${encodeURIComponent(professor.username)}`}
      className="edus-card"
      style={{
        display: 'block', padding: '20px', textDecoration: 'none',
        border: `1px solid ${hovered ? 'rgba(56,189,248,0.3)' : '#252134'}`,
        boxShadow: hovered ? '0 0 0 1px rgba(56,189,248,0.08), 0 8px 32px rgba(0,0,0,0.3)' : 'none',
        transition: 'all 0.2s ease',
        position: 'relative', overflow: 'hidden',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Top accent line */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
        background: 'linear-gradient(90deg, #38bdf8, #a78bfa)',
        opacity: hovered ? 1 : 0, transition: 'opacity 0.2s',
      }}/>

      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
        <Avatar name={professor.name || professor.username} size={48} />
        <div style={{ minWidth: 0 }}>
          <p style={{ color: '#fff', fontWeight: 600, fontSize: '15px', margin: 0, lineHeight: 1.3,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {professor.name || professor.username}
          </p>
          <p style={{ color: '#757185', fontSize: '12px', margin: '3px 0 0' }}>
            @{professor.username}
          </p>
        </div>
      </div>

      <div className="edus-divider" style={{ margin: '0 0 14px' }} />

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <span className="edus-badge-blue">
          {professor.subjects_count ?? 0} subjects
        </span>
        <span className="edus-badge-violet">
          {professor.resources_count ?? 0} uploads
        </span>
      </div>
    </Link>
  );
}

/* ─── Empty state ──────────────────────────────────────────── */
function EmptyState({ query }) {
  return (
    <div style={{ textAlign: 'center', padding: '64px 24px' }}>
      <div style={{
        width: 64, height: 64, borderRadius: '50%', margin: '0 auto 16px',
        background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round"/>
          <circle cx="9" cy="7" r="4" stroke="#38bdf8" strokeWidth="1.5"/>
          <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </div>
      <p style={{ color: '#ADA8C3', fontSize: '15px', fontWeight: 500, margin: '0 0 6px' }}>
        {query ? `No professors found for "${query}"` : 'No professor profiles yet'}
      </p>
      <p style={{ color: '#757185', fontSize: '13px', margin: 0 }}>
        {query ? 'Try a different search term.' : 'Check back soon as professors join.'}
      </p>
    </div>
  );
}

/* ─── Main page ────────────────────────────────────────────── */
export default function ProfessorsPage() {
  const [q, setQ]               = useState('');
  const [professors, setProfessors] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [activeQ, setActiveQ]   = useState('');

  async function fetchProfessors(filters = {}) {
    setLoading(true); setError('');
    try {
      const { professors: rows } = await professorService.list(filters);
      setProfessors(rows || []);
    } catch (err) {
      setError(err.message || 'Failed to load professors');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchProfessors(); }, []);

  async function onSearch(e) {
    e.preventDefault();
    const query = q.trim();
    setActiveQ(query);
    await fetchProfessors(query ? { q: query } : {});
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0E0C15', color: '#fff' }}>
      {/* Ambient top glow */}
      <div aria-hidden style={{
        position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)',
        width: '70vw', height: '30vh', pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(ellipse at center, rgba(56,189,248,0.07) 0%, transparent 70%)',
        filter: 'blur(40px)',
      }}/>

      <div style={{ maxWidth: '1160px', margin: '0 auto', padding: '64px 24px 80px', position: 'relative', zIndex: 1 }}>

        {/* Page header */}
        <div style={{ marginBottom: '40px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.2)',
            borderRadius: '999px', padding: '4px 14px', marginBottom: '16px' }}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="9" cy="7" r="4" stroke="#38bdf8" strokeWidth="2"/>
              <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#38bdf8', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Faculty
            </span>
          </div>
          <h1 className="edus-page-title" style={{ margin: '0 0 10px' }}>Browse Professors</h1>
          <p style={{ color: '#757185', fontSize: '15px', margin: 0 }}>
            Explore faculty profiles, their subjects, and all uploaded resources.
          </p>
        </div>

        {/* Search bar */}
        <form onSubmit={onSearch} style={{ display: 'flex', gap: '10px', marginBottom: '36px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" style={{
              position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#3F3A52', pointerEvents: 'none',
            }}>
              <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
              <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <input
              className="edus-input"
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Search by name or username…"
              style={{ paddingLeft: '40px' }}
            />
          </div>
          <button type="submit" className="edus-btn" style={{ flexShrink: 0 }}>
            Search
          </button>
          {activeQ && (
            <button type="button" className="edus-btn-ghost" style={{ flexShrink: 0 }}
              onClick={() => { setQ(''); setActiveQ(''); fetchProfessors(); }}>
              Clear
            </button>
          )}
        </form>

        {/* Loading */}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '64px' }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              border: '3px solid rgba(56,189,248,0.15)',
              borderTopColor: '#38bdf8',
              animation: 'edus-spin 0.8s linear infinite',
            }}/>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: '12px', padding: '14px 18px',
          }}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="#ef4444" strokeWidth="2"/>
              <path d="M12 8v4m0 4h.01" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span style={{ color: '#ef4444', fontSize: '14px' }}>{error}</span>
          </div>
        )}

        {/* Results count */}
        {!loading && !error && professors.length > 0 && (
          <p style={{ color: '#3F3A52', fontSize: '13px', marginBottom: '20px' }}>
            {professors.length} professor{professors.length !== 1 ? 's' : ''} found
            {activeQ && <span> for <span style={{ color: '#38bdf8' }}>"{activeQ}"</span></span>}
          </p>
        )}

        {/* Grid */}
        {!loading && !error && professors.length === 0 && <EmptyState query={activeQ} />}
        {!loading && !error && professors.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {professors.map(p => <ProfCard key={p.id} professor={p} />)}
          </div>
        )}
      </div>
    </div>
  );
}
