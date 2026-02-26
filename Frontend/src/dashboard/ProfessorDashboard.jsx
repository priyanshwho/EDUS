import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { analyticsService, announcementService, subjectService } from '../services/index';
import { useResources } from '../hooks/useResources';
import { useUpload } from '../hooks/useUpload';
import { resourceService } from '../services/resource.service';

/**
 * ProfessorDashboard
 * Upload resources, post announcements, view analytics for own uploads.
 */
export default function ProfessorDashboard() {
  const { user } = useAuth();
  const [analytics,  setAnalytics]  = useState(null);
  const [subjects,   setSubjects]   = useState([]);
  const [activeTab,  setActiveTab]  = useState('overview');

  useEffect(() => {
    analyticsService.myAnalytics().then(setAnalytics).catch(() => {});
    subjectService.list().then(({ subjects }) => setSubjects(subjects || []));
  }, []);

  const tabs = ['overview', 'upload', 'subjects', 'announcements', 'resources'];

  return (
    <section className="min-h-screen bg-n-8 text-n-1 p-6">
      <header className="mb-8">
        <h1 className="h3">Professor Dashboard</h1>
        <p className="body-2 text-n-4">Manage your uploads and announcements</p>
      </header>

      {/* ── Tab Navigation ── */}
      <nav className="flex gap-1 mb-8 border-b border-n-6">
        {tabs.map(t => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-5 py-2 text-sm capitalize transition border-b-2 -mb-px
              ${activeTab === t ? 'border-color-1 text-color-1' : 'border-transparent text-n-4 hover:text-n-1'}`}
          >
            {t}
          </button>
        ))}
      </nav>

      {activeTab === 'overview'       && <AnalyticsOverview analytics={analytics} />}
      {activeTab === 'upload'         && <UploadForm subjects={subjects} />}
      {activeTab === 'subjects'       && <SubjectsPanel subjects={subjects} setSubjects={setSubjects} userId={user?.id} />}
      {activeTab === 'announcements'  && <AnnouncementsPanel subjects={subjects} />}
      {activeTab === 'resources'      && <MyResources userId={user?.id} />}
    </section>
  );
}

// ── Analytics Overview ──────────────────────────────────────────────────────
function AnalyticsOverview({ analytics }) {
  if (!analytics) return <p className="text-n-4">Loading analytics…</p>;

  const cards = [
    { label: 'Total Uploads',    value: analytics.total },
    { label: 'Notes',            value: analytics.byType?.notes || 0 },
    { label: 'Assignments',      value: analytics.byType?.assignment || 0 },
    { label: 'PYQs (Major)',     value: analytics.byType?.['pyq:major'] || 0 },
    { label: 'PYQs (Minor 1)',   value: analytics.byType?.['pyq:minor1'] || 0 },
    { label: 'PYQs (Minor 2)',   value: analytics.byType?.['pyq:minor2'] || 0 },
    { label: 'Lectures',         value: analytics.byType?.lecture || 0 },
  ];

  return (
    <div>
      <h2 className="h5 mb-4">Upload Analytics</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {cards.map(c => (
          <div key={c.label} className="rounded-xl border border-n-6 bg-n-7 p-4 text-center">
            <p className="text-2xl font-bold text-color-1">{c.value}</p>
            <p className="text-xs text-n-4 mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Subject contribution */}
      <h3 className="font-semibold mb-3">Subject Contributions</h3>
      <ul className="space-y-2">
        {Object.entries(analytics.bySubject || {}).map(([subject, count]) => (
          <li key={subject} className="flex items-center justify-between text-sm border-b border-n-6 pb-2">
            <span className="text-n-2">{subject}</span>
            <span className="text-color-2 font-mono">{count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Upload Form ─────────────────────────────────────────────────────────────
function UploadForm({ subjects }) {
  const { upload, uploading, progress, error } = useUpload();
  const [form, setForm] = useState({
    subject_id: '', resource_type: 'notes', title: '', description: '',
    year: '', pyq_type: '', youtube_url: '',
  });
  const [file, setFile] = useState(null);
  const [success, setSuccess] = useState(false);

  const onChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess(false);
    try {
      if (form.resource_type === 'lecture' && form.youtube_url) {
        // YouTube lecture — no file upload needed
        await resourceService.create({
          ...form,
          year: Number(form.year) || undefined,
          youtube_url: form.youtube_url,
        });
      } else if (file) {
        await upload(file, { ...form, year: Number(form.year) || undefined });
      }
      setSuccess(true);
      setForm({ subject_id: '', resource_type: 'notes', title: '', description: '', year: '', pyq_type: '', youtube_url: '' });
      setFile(null);
    } catch {}
  };

  const isLecture = form.resource_type === 'lecture';
  const isPyq     = form.resource_type === 'pyq';

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
      <h2 className="h5 mb-4">Upload Resource</h2>

      <select name="subject_id" value={form.subject_id} onChange={onChange} required
        className="w-full rounded-lg border border-n-6 bg-n-7 px-4 py-2 text-sm">
        <option value="">Select Subject</option>
        {subjects.map(s => <option key={s.id} value={s.id}>{s.name_full} (Sem {s.semester})</option>)}
      </select>

      <select name="resource_type" value={form.resource_type} onChange={onChange}
        className="w-full rounded-lg border border-n-6 bg-n-7 px-4 py-2 text-sm">
        {['notes','assignment','pyq','lecture'].map(t =>
          <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
      </select>

      {isPyq && (
        <select name="pyq_type" value={form.pyq_type} onChange={onChange}
          className="w-full rounded-lg border border-n-6 bg-n-7 px-4 py-2 text-sm">
          <option value="">Select PYQ Type</option>
          {[['minor1','Minor 1 (30 marks)'],['minor2','Minor 2 (30 marks)'],['major','Major (50 marks)']].map(([v,l]) =>
            <option key={v} value={v}>{l}</option>)}
        </select>
      )}

      <input name="title" value={form.title} onChange={onChange} placeholder="Title" required
        className="w-full rounded-lg border border-n-6 bg-n-7 px-4 py-2 text-sm" />
      <textarea name="description" value={form.description} onChange={onChange} placeholder="Description (optional)" rows={3}
        className="w-full rounded-lg border border-n-6 bg-n-7 px-4 py-2 text-sm" />
      <input name="year" value={form.year} onChange={onChange} placeholder="Year (e.g. 2024)" type="number"
        className="w-full rounded-lg border border-n-6 bg-n-7 px-4 py-2 text-sm" />

      {isLecture
        ? <>
            <input name="youtube_url" value={form.youtube_url} onChange={onChange} placeholder="YouTube URL (required for lectures)" required
              className="w-full rounded-lg border border-n-6 bg-n-7 px-4 py-2 text-sm" />
            <p className="text-xs text-n-5">Or upload a PDF instead:</p>
            <input type="file" accept=".pdf" onChange={e => setFile(e.target.files[0])}
              className="text-sm text-n-4" />
          </>
        : <input type="file" accept=".pdf" onChange={e => setFile(e.target.files[0])} required
            className="text-sm text-n-4" />
      }

      {uploading && (
        <div className="w-full bg-n-6 rounded-full h-2">
          <div className="bg-color-1 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}

      {error   && <p className="text-red-400 text-sm">{error}</p>}
      {success && <p className="text-green-400 text-sm">✅ Resource uploaded successfully!</p>}

      <button type="submit" disabled={uploading}
        className="w-full py-2.5 rounded-xl bg-color-1 text-n-8 font-semibold hover:bg-color-1/90 disabled:opacity-50 transition">
        {uploading ? `Uploading… ${progress}%` : 'Upload'}
      </button>
    </form>
  );
}

// ── Announcements Panel ─────────────────────────────────────────────────────
function AnnouncementsPanel({ subjects }) {
  const [announcements, setAnnouncements] = useState([]);
  const [form, setForm] = useState({ subject_id: '', title: '', content: '' });

  useEffect(() => {
    announcementService.list().then(({ announcements }) => setAnnouncements(announcements || []));
  }, []);

  const handlePost = async (e) => {
    e.preventDefault();
    const { announcement } = await announcementService.create(form);
    setAnnouncements(prev => [announcement, ...prev]);
    setForm({ subject_id: '', title: '', content: '' });
  };

  return (
    <div className="max-w-2xl">
      <h2 className="h5 mb-4">Post Announcement</h2>
      <form onSubmit={handlePost} className="space-y-3 mb-8">
        <select name="subject_id" value={form.subject_id}
          onChange={e => setForm(p => ({ ...p, subject_id: e.target.value }))}
          className="w-full rounded-lg border border-n-6 bg-n-7 px-4 py-2 text-sm">
          <option value="">All Subjects (Global)</option>
          {subjects.map(s => <option key={s.id} value={s.id}>{s.name_full}</option>)}
        </select>
        <input placeholder="Title" value={form.title} required
          onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
          className="w-full rounded-lg border border-n-6 bg-n-7 px-4 py-2 text-sm" />
        <textarea placeholder="Content" rows={4} value={form.content} required
          onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
          className="w-full rounded-lg border border-n-6 bg-n-7 px-4 py-2 text-sm" />
        <button type="submit"
          className="px-6 py-2 rounded-xl bg-color-1 text-n-8 font-medium text-sm hover:bg-color-1/90 transition">
          Post
        </button>
      </form>

      <h3 className="font-semibold mb-3">Recent Announcements</h3>
      <ul className="space-y-3">
        {announcements.map(a => (
          <li key={a.id} className="rounded-xl border border-n-6 bg-n-7 p-4">
            <p className="font-semibold text-sm">{a.title}</p>
            <p className="text-n-4 text-sm mt-1">{a.content}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── My Resources ───────────────────────────────────────────────────────────
function MyResources({ userId }) {
  const { resources, loading, fetch } = useResources({ uploaded_by: userId });
  useEffect(() => { if (userId) fetch(); }, [userId]);

  if (loading) return <p className="text-n-4">Loading…</p>;

  return (
    <div>
      <h2 className="h5 mb-4">My Uploads ({resources.length})</h2>
      <div className="space-y-3">
        {resources.map(r => (
          <div key={r.id} className="flex items-center justify-between rounded-xl border border-n-6 bg-n-7 px-4 py-3">
            <div>
              <p className="text-sm font-medium">{r.title}</p>
              <p className="text-xs text-n-5">{r.resource_type} · {r.slug}</p>
            </div>
            <button
              onClick={async () => { await resourceService.remove(r.id); fetch(); }}
              className="text-xs text-red-400 hover:text-red-300 transition"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Subjects Panel ─────────────────────────────────────────────────────────
const BRANCHES = ['CSE', 'IT', 'ECE', 'EEE', 'ME', 'CE', 'AI/ML', 'DS'];

function SubjectsPanel({ subjects, setSubjects, userId }) {
  const [form, setForm] = useState({ name_full: '', acronym: '', branch: '', semester: '' });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const onChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError(null);
    setSuccess(false);
    try {
      const { subject } = await subjectService.create({
        ...form,
        semester: Number(form.semester),
      });
      setSubjects(prev => [subject, ...prev]);
      setForm({ name_full: '', acronym: '', branch: '', semester: '' });
      setSuccess(true);
    } catch (err) {
      setError('Failed to create subject. Check all fields.');
    } finally {
      setCreating(false);
    }
  };

  const mySubjects = subjects.filter(s => s.added_by === userId);

  const inputCls = 'w-full rounded-lg border border-n-6 bg-n-7 px-4 py-2 text-sm focus:outline-none focus:border-color-1';

  return (
    <div className="max-w-xl">
      <h2 className="h5 mb-4">Manage Subjects</h2>

      {/* Create form */}
      <form onSubmit={handleCreate} className="space-y-3 mb-8 p-5 bg-n-7 rounded-2xl border border-n-6">
        <h3 className="font-semibold text-sm text-n-2 mb-1">Add New Subject</h3>

        <input name="name_full" value={form.name_full} onChange={onChange} placeholder="Full Name (e.g. Design & Analysis of Algorithms)" required
          className={inputCls} />
        <div className="flex gap-3">
          <input name="acronym" value={form.acronym} onChange={onChange} placeholder="Acronym (e.g. DAA)" required
            className={inputCls + ' uppercase'} maxLength={10} />
          <select name="semester" value={form.semester} onChange={onChange} required className={inputCls}>
            <option value="">Semester</option>
            {Array.from({ length: 8 }, (_, i) => (
              <option key={i + 1} value={i + 1}>Sem {i + 1}</option>
            ))}
          </select>
        </div>
        <select name="branch" value={form.branch} onChange={onChange} required className={inputCls}>
          <option value="">Select Branch</option>
          {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
        </select>

        {error   && <p className="text-red-400 text-sm">{error}</p>}
        {success && <p className="text-green-400 text-sm">✅ Subject created!</p>}

        <button type="submit" disabled={creating}
          className="w-full py-2.5 rounded-xl bg-color-1 text-n-8 font-semibold text-sm hover:opacity-90 disabled:opacity-50 transition">
          {creating ? 'Creating…' : 'Create Subject'}
        </button>
      </form>

      {/* My subjects */}
      <h3 className="font-semibold text-sm mb-3 text-n-2">
        My Subjects ({mySubjects.length})
      </h3>
      {mySubjects.length === 0 && (
        <p className="text-sm text-n-5">You haven't added any subjects yet.</p>
      )}
      <ul className="space-y-2">
        {mySubjects.map(s => (
          <li key={s.id} className="flex items-center justify-between rounded-xl border border-n-6 bg-n-7 px-4 py-3">
            <div>
              <p className="text-sm font-medium">{s.name_full}</p>
              <p className="text-xs text-n-5 font-mono">{s.acronym} · {s.branch} · Sem {s.semester}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

