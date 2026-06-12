import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { professorService } from '../services';
import {
  formatDate,
  resourceTypeLabel,
  resourcePath,
  semesterLabel,
  slugifySegment,
} from '../utils/format';
import { getStaticResources } from '../utils/staticResources';
import { GooeyLoader } from '../components/ui/loader-10';

const RESOURCE_TYPE_COLORS = {
  notes:      { badge: 'edus-badge-blue',   dot: '#38bdf8' },
  pyq:        { badge: 'edus-badge-violet', dot: '#a78bfa' },
  assignment: { badge: 'edus-badge-muted',  dot: '#ADA8C3' },
  lecture:    { badge: 'edus-badge-blue',   dot: '#7dd3fc' },
};
function getBadgeClass(type) { return RESOURCE_TYPE_COLORS[type?.toLowerCase()]?.badge ?? 'edus-badge-muted'; }

function parseSemesterParam(p) {
  if (!p) return null;
  const v = String(p).toLowerCase();
  if (v.startsWith('sem')) return Number(v.slice(3));
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/* Avatar */
function Avatar({ name, size = 72 }) {
  const initials = (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const hue = [...(name || '')].reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: `linear-gradient(135deg, hsl(${hue},60%,50%), hsl(${(hue + 60) % 360},70%,60%))`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.35, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em',
      boxShadow: `0 0 0 3px rgba(14,12,21,1), 0 0 24px hsla(${hue},60%,50%,0.4)`,
    }}>
      {initials}
    </div>
  );
}

/* Loading skeleton */
function LoadingState() {
  return (
    <div style={{ minHeight: '100vh', background: '#0E0C15', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <GooeyLoader primaryColor="#38bdf8" secondaryColor="#a78bfa" borderColor="#252134" />
      </div>
    </div>
  );
}

export default function ProfessorProfilePage() {
  const { username, branch, semester, subject, resourceType } = useParams();

  const [profile,   setProfile]   = useState(null);
  const [subjects,  setSubjects]  = useState([]);
  const [resources, setResources] = useState([]);
  const [q, setQ]                 = useState('');
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [activeTab, setActiveTab] = useState('uploads'); // 'subjects' | 'uploads'

  const decodedUsername = decodeURIComponent(username || '');

  const fetchProfile = useCallback(async (filters = {}) => {
    setLoading(true); setError('');
    try {
      const data = await professorService.getByUsername(decodedUsername, filters);
      setProfile(data.professor || null);
      
      let fetchedSubjects = data.subjects || [];
      let fetchedResources = data.resources || [];

      if (decodedUsername === 'priyanshwho') {
        let staticRes = getStaticResources();
        if (filters.q) {
          const query = filters.q.toLowerCase();
          staticRes = staticRes.filter(r => 
            r.title.toLowerCase().includes(query) || 
            (r.description && r.description.toLowerCase().includes(query))
          );
        }
        
        fetchedResources = [...fetchedResources, ...staticRes].sort((a,b) => new Date(b.created_at) - new Date(a.created_at));

        const existingSubjectNames = new Set(fetchedSubjects.map(s => s.name_full));
        staticRes.forEach(r => {
          if (r.subjects && !existingSubjectNames.has(r.subjects.name_full)) {
            fetchedSubjects.push({
              id: `static-subj-${r.subjects.name_full}`,
              name_full: r.subjects.name_full,
              acronym: r.subjects.name_full, // default to name_full if acronym missing
              branch: r.subjects.branch,
              semester: r.subjects.semester
            });
            existingSubjectNames.add(r.subjects.name_full);
          }
        });
      }

      setSubjects(fetchedSubjects);
      setResources(fetchedResources);
    } catch (err) {
      setError(err.message || 'Failed to load professor profile');
    } finally {
      setLoading(false);
    }
  }, [decodedUsername]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const filteredResources = useMemo(() => {
    const semNumber = parseSemesterParam(semester);
    return resources.filter(r => {
      if (branch   && slugifySegment(r?.subjects?.branch) !== slugifySegment(branch)) return false;
      if (semNumber && Number(r?.subjects?.semester) !== semNumber) return false;
      if (subject) {
        const sl = slugifySegment(r?.subjects?.acronym || r?.subjects?.name_full);
        if (sl !== slugifySegment(subject)) return false;
      }
      if (resourceType && slugifySegment(r?.resource_type) !== slugifySegment(resourceType)) return false;
      return true;
    });
  }, [resources, branch, semester, subject, resourceType]);

  if (loading) return <LoadingState />;

  if (error || !profile) return (
    <div style={{ minHeight: '100vh', background: '#0E0C15', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div className="edus-card" style={{ maxWidth: '360px', textAlign: 'center', padding: '40px 32px' }}>
        <div style={{ fontSize: '36px', marginBottom: '12px' }}>⚠️</div>
        <p style={{ color: '#ef4444', fontSize: '14px', marginBottom: '16px' }}>{error || 'Professor profile not found'}</p>
        <Link to="/professors" className="edus-btn-ghost" style={{ textDecoration: 'none' }}>
          ← Back to Professors
        </Link>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#0E0C15', color: '#fff' }}>
      {/* Ambient glow */}
      <div aria-hidden style={{
        position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)',
        width: '70vw', height: '40vh', pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(ellipse at center, rgba(56,189,248,0.06) 0%, transparent 70%)',
        filter: 'blur(40px)',
      }}/>

      <div style={{ maxWidth: '1160px', margin: '0 auto', padding: '48px 24px 80px', position: 'relative', zIndex: 1 }}>

        {/* Breadcrumb */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '28px', fontSize: '13px', color: '#3F3A52' }}>
          <Link to="/professors" style={{ color: '#757185', textDecoration: 'none', transition: 'color 0.15s' }}
            onMouseEnter={e => e.target.style.color = '#38bdf8'} onMouseLeave={e => e.target.style.color = '#757185'}>
            Professors
          </Link>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          <span style={{ color: '#ADA8C3' }}>@{profile.username}</span>
        </nav>

        {/* Profile header card */}
        <div className="edus-card" style={{ padding: '28px 32px', marginBottom: '24px', overflow: 'hidden', position: 'relative' }}>
          {/* Decorative top stripe */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
            background: 'linear-gradient(90deg, #38bdf8, #a78bfa)' }}/>

          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
            <Avatar name={profile.name || profile.username} size={72} />
            <div style={{ flex: 1, minWidth: '200px' }}>
              <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 4px', letterSpacing: '-0.02em', color: '#fff' }}>
                {profile.name || profile.username}
              </h1>
              <p style={{ color: '#757185', fontSize: '14px', margin: '0 0 12px' }}>@{profile.username}</p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <span className="edus-badge-blue">{subjects.length} subjects</span>
                <span className="edus-badge-violet">{resources.length} uploads</span>
                <span className="edus-badge-muted">Joined {formatDate(profile.created_at)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Search + tabs */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
          <form onSubmit={e => { e.preventDefault(); fetchProfile(q.trim() ? { q: q.trim() } : {}); }}
            style={{ display: 'flex', gap: '8px', flex: 1, minWidth: '240px' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" style={{
                position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: '#3F3A52', pointerEvents: 'none',
              }}>
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <input className="edus-input" value={q} onChange={e => setQ(e.target.value)}
                placeholder="Search uploads…" style={{ paddingLeft: '38px' }}/>
            </div>
            <button type="submit" className="edus-btn">Search</button>
          </form>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '4px', background: '#15131D', borderRadius: '10px', padding: '4px' }}>
            {[['subjects', 'Subjects'], ['uploads', 'Uploads']].map(([key, label]) => (
              <button key={key} onClick={() => setActiveTab(key)} style={{
                padding: '6px 16px', borderRadius: '7px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 500,
                background: activeTab === key ? 'linear-gradient(135deg, rgba(56,189,248,0.2), rgba(167,139,250,0.2))' : 'transparent',
                color: activeTab === key ? '#fff' : '#757185',
                borderColor: activeTab === key ? 'rgba(56,189,248,0.3)' : 'transparent',
                borderWidth: '1px', borderStyle: 'solid',
                transition: 'all 0.18s',
              }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Subjects tab */}
        {activeTab === 'subjects' && (
          <div>
            <p style={{ color: '#3F3A52', fontSize: '13px', marginBottom: '16px' }}>
              {subjects.length} subject{subjects.length !== 1 ? 's' : ''}
            </p>
            {subjects.length === 0 ? (
              <div className="edus-card" style={{ padding: '32px', textAlign: 'center' }}>
                <p style={{ color: '#757185', fontSize: '14px' }}>No subjects found.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
                {subjects.map(s => {
                  const href = ['/professors', encodeURIComponent(profile.username),
                    slugifySegment(s.branch), `sem${s.semester}`,
                    slugifySegment(s.acronym || s.name_full)].join('/');
                  return (
                    <Link key={s.id} to={href} className="edus-card" style={{ display: 'block', padding: '18px 20px', textDecoration: 'none' }}>
                      <p style={{ color: '#fff', fontWeight: 600, fontSize: '14px', margin: '0 0 6px' }}>{s.name_full}</p>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <span className="edus-badge-muted">{s.acronym}</span>
                        <span className="edus-badge-muted">{s.branch}</span>
                        <span className="edus-badge-blue">{semesterLabel(s.semester)}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Uploads tab */}
        {activeTab === 'uploads' && (
          <div>
            <p style={{ color: '#3F3A52', fontSize: '13px', marginBottom: '16px' }}>
              {filteredResources.length} resource{filteredResources.length !== 1 ? 's' : ''}
            </p>
            {filteredResources.length === 0 ? (
              <div className="edus-card" style={{ padding: '40px', textAlign: 'center' }}>
                <p style={{ color: '#757185', fontSize: '14px' }}>No resources found.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
                {filteredResources.map(r => (
                  <article key={r.id} className="edus-card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                      <span className={getBadgeClass(r.resource_type)}>{resourceTypeLabel(r.resource_type)}</span>
                      {r.year && <span style={{ color: '#3F3A52', fontSize: '11px', flexShrink: 0 }}>{r.year}</span>}
                    </div>
                    <Link to={resourcePath(r, r.slug)}
                      style={{ color: '#CAC6DD', fontWeight: 600, fontSize: '14px', textDecoration: 'none', lineHeight: 1.4, transition: 'color 0.15s' }}
                      onMouseEnter={e => e.target.style.color = '#38bdf8'}
                      onMouseLeave={e => e.target.style.color = '#CAC6DD'}>
                      {r.title}
                    </Link>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {r.subjects?.name_full && <span className="edus-badge-muted">{r.subjects.name_full}</span>}
                      {r.subjects?.branch    && <span className="edus-badge-muted">{r.subjects.branch}</span>}
                      {r.subjects?.semester  && <span className="edus-badge-blue">Sem {r.subjects.semester}</span>}
                    </div>
                    <p style={{ color: '#3F3A52', fontSize: '11px', margin: 0 }}>{formatDate(r.created_at)}</p>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
