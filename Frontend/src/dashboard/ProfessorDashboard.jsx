import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { announcementService, subjectService } from '../services/index';
import { useUpload } from '../hooks/useUpload';
import { resourceService } from '../services/resource.service';
import { useProfessorDashboardStore } from '../stores/professorDashboard.store';
import { GooeyLoader } from '../components/ui/loader-10';
import DashboardBackground from '../components/design/DashboardBackground';

/**
 * ProfessorDashboard
 * Upload resources, post announcements, view analytics for own uploads.
 */
export default function ProfessorDashboard() {
  const { user } = useAuth();
  const [activeTab,  setActiveTab]  = useState('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const {
    analytics,
    subjects,
    myResources,
    loadingAnalytics,
    loadingResources,
    fetchAnalytics,
    fetchSubjects,
    fetchMyResources,
    prependSubject,
    removeResourceById,
    refreshAfterUpload,
  } = useProfessorDashboardStore();

  useEffect(() => {
    fetchAnalytics().catch(() => {});
    fetchSubjects().catch(() => {});
    if (user?.id) fetchMyResources(user.id).catch(() => {});
  }, [fetchAnalytics, fetchMyResources, fetchSubjects, user?.id]);

  const tabs = ['overview', 'upload', 'subjects', 'announcements', 'resources'];

  return (
    <section className="min-h-screen bg-gradient-to-br from-[#0b1021] via-[#0E0C15] to-[#1a1025] text-n-1 p-6 relative">
      <DashboardBackground />
      <div className="relative z-10">
        <header className="mb-8">
        <h1 className="h3">Professor Dashboard</h1>
        <p className="body-2 text-n-4">Manage your uploads and announcements</p>
      </header>

      {/* ── Mobile Tab Navigation (Dropdown Switcher) ── */}
      <div className="md:hidden relative mb-8 z-20">
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="w-full flex items-center justify-between px-5 py-3.5 bg-n-7 border border-n-6 rounded-xl font-medium text-n-1 shadow-sm"
        >
          <span className="capitalize text-sky-400">Professor Dashboard ▼ {activeTab}</span>
        </button>
        
        {isMobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-n-8/95 backdrop-blur-md border border-n-6 rounded-xl shadow-2xl overflow-hidden flex flex-col">
            {tabs.map(t => (
              <button
                key={t}
                onClick={() => {
                  setActiveTab(t);
                  setIsMobileMenuOpen(false);
                }}
                className={`flex items-center px-5 py-3.5 text-sm capitalize transition-colors border-b border-n-6/50 last:border-0
                  ${activeTab === t ? 'bg-sky-400/10 text-sky-400 font-semibold' : 'text-n-3 hover:bg-n-7 hover:text-n-1'}`}
              >
                {activeTab === t && <span className="mr-2">✓</span>}
                {t}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Desktop Tab Navigation ── */}
      <nav className="hidden md:flex gap-1 mb-8 border-b border-n-6">
        {tabs.map(t => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-5 py-2 text-sm capitalize transition border-b-2 -mb-px
              ${activeTab === t ? 'border-sky-400 text-sky-400' : 'border-transparent text-n-4 hover:text-n-1'}`}
          >
            {t}
          </button>
        ))}
      </nav>

      {activeTab === 'overview'       && <AnalyticsOverview analytics={analytics} loading={loadingAnalytics} />}
      {activeTab === 'upload'         && <UploadForm subjects={subjects} onUploaded={() => refreshAfterUpload(user?.id)} />}
      {activeTab === 'subjects'       && <SubjectsPanel subjects={subjects} onSubjectCreated={prependSubject} userId={user?.id} />}
      {activeTab === 'announcements'  && <AnnouncementsPanel subjects={subjects} />}
      {activeTab === 'resources'      && (
        <MyResources
          resources={myResources}
          loading={loadingResources}
          onDeleteSuccess={(id) => {
            removeResourceById(id);
            fetchAnalytics(true).catch(() => {});
          }}
        />
      )}
      </div>
    </section>
  );
}

// ── Analytics Overview ──────────────────────────────────────────────────────
function AnalyticsOverview({ analytics, loading }) {
  if (loading || !analytics) return (
    <div className="flex justify-center py-12">
      <GooeyLoader primaryColor="#AC6AFF" secondaryColor="#858DFF" borderColor="#252134" />
    </div>
  );

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
    <div className="w-full">
      <h2 className="h4 mb-6">Upload Analytics</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-12">
        {cards.map((c, idx) => (
          <div key={c.label} className="group relative rounded-2xl border border-n-6 bg-n-7/50 backdrop-blur p-6 text-center hover:-translate-y-1 transition-all duration-300 hover:shadow-2xl hover:border-sky-400/50 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-sky-400/0 to-sky-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <p className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-sky-500 via-sky-400 to-violet-400 drop-shadow-md mb-2">{c.value}</p>
            <p className="text-sm font-medium text-n-3 tracking-wide">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Subject contribution */}
      <h3 className="h5 mb-4">Subject Contributions</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Object.entries(analytics.bySubject || {}).map(([subject, count]) => (
          <div key={subject} className="flex items-center justify-between rounded-xl border border-n-6 bg-n-7/30 backdrop-blur px-5 py-4 hover:border-sky-400/30 transition-colors">
            <span className="font-medium text-n-2 line-clamp-1 pr-4">{subject}</span>
            <span className="flex items-center justify-center min-w-[2.5rem] h-8 rounded-full bg-sky-400/10 text-sky-400 font-bold border border-sky-400/20">{count}</span>
          </div>
        ))}
        {Object.keys(analytics.bySubject || {}).length === 0 && (
          <p className="text-sm text-n-4">No uploads yet.</p>
        )}
      </div>
    </div>
  );
}

// ── Upload Form ─────────────────────────────────────────────────────────────
function UploadForm({ subjects, onUploaded }) {
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
      onUploaded?.();
      setForm({ subject_id: '', resource_type: 'notes', title: '', description: '', year: '', pyq_type: '', youtube_url: '' });
      setFile(null);
    } catch {
      setSuccess(false);
    }
  };

  const isLecture = form.resource_type === 'lecture';
  const isPyq     = form.resource_type === 'pyq';

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto rounded-3xl border border-n-6 bg-n-7/40 backdrop-blur p-8 shadow-2xl">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-500 via-sky-400 to-violet-400">Upload Resource</h2>
        <p className="text-n-4 mt-2">Share knowledge with your students</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Left Column: Details */}
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-n-3 mb-2 uppercase tracking-wide">Subject</label>
            <select name="subject_id" value={form.subject_id} onChange={onChange} required
              className="w-full rounded-xl border border-n-6 bg-n-8/50 px-4 py-3 text-sm focus:border-sky-400 focus:outline-none transition">
              <option value="">Select Subject</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name_full} (Sem {s.semester})</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-n-3 mb-2 uppercase tracking-wide">Resource Type</label>
            <select name="resource_type" value={form.resource_type} onChange={onChange}
              className="w-full rounded-xl border border-n-6 bg-n-8/50 px-4 py-3 text-sm focus:border-sky-400 focus:outline-none transition">
              {['notes','assignment','pyq','lecture'].map(t =>
                <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
          </div>

          {isPyq && (
            <div>
              <label className="block text-xs font-semibold text-n-3 mb-2 uppercase tracking-wide">PYQ Type</label>
              <select name="pyq_type" value={form.pyq_type} onChange={onChange}
                className="w-full rounded-xl border border-n-6 bg-n-8/50 px-4 py-3 text-sm focus:border-sky-400 focus:outline-none transition">
                <option value="">Select PYQ Type</option>
                {[['minor1','Minor 1 (30 marks)'],['minor2','Minor 2 (30 marks)'],['major','Major (50 marks)']].map(([v,l]) =>
                  <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          )}

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-n-3 mb-2 uppercase tracking-wide">Title</label>
              <input name="title" value={form.title} onChange={onChange} placeholder="Enter title" required
                className="w-full rounded-xl border border-n-6 bg-n-8/50 px-4 py-3 text-sm focus:border-sky-400 focus:outline-none transition" />
            </div>
            <div className="w-24">
              <label className="block text-xs font-semibold text-n-3 mb-2 uppercase tracking-wide">Year</label>
              <input name="year" value={form.year} onChange={onChange} placeholder="e.g. 2024" type="number"
                className="w-full rounded-xl border border-n-6 bg-n-8/50 px-4 py-3 text-sm focus:border-sky-400 focus:outline-none transition" />
            </div>
          </div>
        </div>

        {/* Right Column: File/Link & Desc */}
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-n-3 mb-2 uppercase tracking-wide">Description</label>
            <textarea name="description" value={form.description} onChange={onChange} placeholder="Brief description (optional)" rows={4}
              className="w-full rounded-xl border border-n-6 bg-n-8/50 px-4 py-3 text-sm focus:border-sky-400 focus:outline-none transition resize-none" />
          </div>

          {isLecture ? (
            <div>
              <label className="block text-xs font-semibold text-n-3 mb-2 uppercase tracking-wide">YouTube Link</label>
              <input name="youtube_url" value={form.youtube_url} onChange={onChange} placeholder="https://youtube.com/..." required
                className="w-full rounded-xl border border-n-6 bg-n-8/50 px-4 py-3 text-sm focus:border-sky-400 focus:outline-none transition text-red-300" />
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-n-3 mb-2 uppercase tracking-wide">File Upload (.pdf)</label>
              <div className="relative flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-sky-400/40 rounded-xl bg-sky-400/5 hover:bg-sky-400/10 transition-colors cursor-pointer group overflow-hidden">
                <input type="file" accept=".pdf" onChange={e => setFile(e.target.files[0])} required
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                <div className="text-center p-4">
                  <p className="text-sm font-medium text-sky-400 group-hover:scale-105 transition-transform">{file ? file.name : "Click or drag to upload PDF"}</p>
                  {!file && <p className="text-xs text-n-4 mt-1">Maximum file size: 10MB</p>}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="pt-4 border-t border-n-6">
        {uploading && (
          <div className="mb-4 bg-n-8 rounded-full h-3 overflow-hidden border border-n-6">
            <div className="bg-gradient-to-r from-sky-500 via-sky-400 to-violet-400 h-full transition-all duration-300 ease-out" style={{ width: `${progress}%` }} />
          </div>
        )}

        {error   && <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}
        {success && <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm">✅ Resource uploaded successfully!</div>}

        <button type="submit" disabled={uploading}
          className="w-full py-3.5 rounded-xl bg-sky-400 text-white font-bold text-sm hover:opacity-90 hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(56,189,248,0.4)] transition-all duration-300 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none">
          {uploading ? `Uploading... ${progress}%` : 'Publish Resource'}
        </button>
      </div>
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
    <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-10">
      <div>
        <h2 className="h4 mb-6">Post Announcement</h2>
        <form onSubmit={handlePost} className="space-y-4 rounded-2xl border border-n-6 bg-n-7/50 backdrop-blur p-6 shadow-xl hover:border-sky-400/50 transition">
          <div>
            <label className="block text-xs font-medium text-n-4 mb-2 uppercase">Target Audience</label>
            <select name="subject_id" value={form.subject_id}
              onChange={e => setForm(p => ({ ...p, subject_id: e.target.value }))}
              className="w-full rounded-xl border border-n-6 bg-n-8/50 px-4 py-3 text-sm focus:border-sky-400 focus:outline-none transition">
              <option value="">All Subjects (Global Broadcast)</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name_full}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-n-4 mb-2 uppercase">Title</label>
            <input placeholder="Enter title..." value={form.title} required
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              className="w-full rounded-xl border border-n-6 bg-n-8/50 px-4 py-3 text-sm focus:border-sky-400 focus:outline-none transition" />
          </div>
          <div>
            <label className="block text-xs font-medium text-n-4 mb-2 uppercase">Message</label>
            <textarea placeholder="Write your announcement here..." rows={5} value={form.content} required
              onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
              className="w-full rounded-xl border border-n-6 bg-n-8/50 px-4 py-3 text-sm focus:border-sky-400 focus:outline-none transition resize-none" />
          </div>
          <button type="submit"
            className="w-full py-3 rounded-xl bg-sky-400 text-white font-bold text-sm hover:-translate-y-0.5 hover:shadow-lg hover:shadow-sky-400/30 transition-all">
            Broadcast Announcement
          </button>
        </form>
      </div>

      <div>
        <h2 className="h4 mb-6">Recent Announcements</h2>
        {announcements.length === 0 ? (
          <div className="p-10 text-center rounded-2xl border border-n-6 border-dashed bg-n-8 text-n-4">
            No announcements posted yet.
          </div>
        ) : (
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {announcements.map(a => (
              <div key={a.id} className="group rounded-2xl border border-n-6 bg-n-7/30 p-5 hover:bg-n-7 hover:border-sky-400/40 transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-500 via-sky-400 to-violet-400 flex items-center justify-center text-n-8 font-bold">
                    A
                  </div>
                  <div>
                    <h3 className="font-semibold text-n-1 leading-tight group-hover:text-sky-400 transition-colors">{a.title}</h3>
                    <p className="text-xs text-n-4">{a.subject_id ? "Specific Subject" : "Global Announcement"}</p>
                  </div>
                </div>
                <p className="text-sm text-n-3 leading-relaxed whitespace-pre-wrap">{a.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── My Resources ───────────────────────────────────────────────────────────
function MyResources({ resources, loading, onDeleteSuccess }) {

  if (loading) return (
    <div className="flex justify-center py-12">
      <GooeyLoader primaryColor="#AC6AFF" secondaryColor="#858DFF" borderColor="#252134" />
    </div>
  );

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
              onClick={async () => {
                await resourceService.remove(r.id);
                onDeleteSuccess?.(r.id);
              }}
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

function SubjectsPanel({ subjects, onSubjectCreated, userId }) {
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
      onSubjectCreated?.(subject);
      setForm({ name_full: '', acronym: '', branch: '', semester: '' });
      setSuccess(true);
    } catch {
      setError('Failed to create subject. Check all fields.');
    } finally {
      setCreating(false);
    }
  };

  const mySubjects = subjects.filter(s => s.added_by === userId);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="h4">Subject Management</h2>
        <span className="px-3 py-1 rounded-full bg-sky-400/10 border border-sky-400/20 text-sm text-sky-400 font-medium shadow-sm">
          {mySubjects.length} Added By You
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Form */}
        <div className="lg:col-span-1">
          <form onSubmit={handleCreate} className="sticky top-24 rounded-2xl border border-n-6 bg-n-7/50 backdrop-blur p-6 shadow-2xl transition hover:border-sky-400/50">
            <h3 className="font-semibold mb-5 text-sm text-n-2 uppercase tracking-wider">Add New Subject</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-n-4 mb-1.5 uppercase tracking-wide">Full Name</label>
                <input name="name_full" value={form.name_full} onChange={onChange} placeholder="e.g. Design & Analysis" required
                  className="w-full rounded-xl border border-n-6 bg-n-8/50 px-4 py-2.5 text-sm focus:border-sky-400 focus:outline-none transition" />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs text-n-4 mb-1.5 uppercase tracking-wide">Acronym</label>
                  <input name="acronym" value={form.acronym} onChange={onChange} placeholder="e.g. DAA" required
                    className="w-full rounded-xl border border-n-6 bg-n-8/50 px-4 py-2.5 text-sm uppercase focus:border-sky-400 focus:outline-none transition" maxLength={10} />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-n-4 mb-1.5 uppercase tracking-wide">Semester</label>
                  <select name="semester" value={form.semester} onChange={onChange} required 
                    className="w-full rounded-xl border border-n-6 bg-n-8/50 px-4 py-2.5 text-sm focus:border-sky-400 focus:outline-none transition">
                    <option value="">Sem</option>
                    {Array.from({ length: 8 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs text-n-4 mb-1.5 uppercase tracking-wide">Branch</label>
                <select name="branch" value={form.branch} onChange={onChange} required 
                  className="w-full rounded-xl border border-n-6 bg-n-8/50 px-4 py-2.5 text-sm focus:border-sky-400 focus:outline-none transition">
                  <option value="">Select Branch</option>
                  {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>

              {error   && <p className="text-red-400 text-sm mt-2">{error}</p>}
              {success && <p className="text-green-400 text-sm mt-2">✅ Subject created!</p>}

              <button type="submit" disabled={creating}
                className="w-full mt-2 py-3 rounded-xl bg-sky-400 text-white font-bold text-sm hover:opacity-90 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-sky-400/20 transition-all duration-200 disabled:opacity-50">
                {creating ? 'Creating…' : 'Create Subject'}
              </button>
            </div>
          </form>
        </div>

        {/* Right List */}
        <div className="lg:col-span-2">
          {mySubjects.length === 0 ? (
             <div className="p-10 text-center rounded-2xl border border-n-6 border-dashed bg-n-7/30 text-n-4">
               You haven't added any subjects yet.
             </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mySubjects.map(s => (
                <div key={s.id} className="group relative rounded-2xl border border-n-6 bg-n-7/30 backdrop-blur p-5 hover:border-sky-400/50 hover:bg-n-7/80 transition-all hover:shadow-xl">
                  <div className="absolute top-4 right-4 text-xs font-mono font-bold text-sky-400/30 group-hover:text-sky-400/70 transition-colors text-right">
                    SEM {s.semester}
                  </div>
                  <h3 className="font-bold text-lg text-n-1 mb-1 pr-12 group-hover:text-sky-400 transition-colors">{s.name_full}</h3>
                  <div className="flex items-center gap-2 mt-4">
                    <span className="px-2.5 py-1 rounded bg-sky-400/10 text-sky-300 text-xs font-mono font-medium border border-sky-400/20">
                      {s.acronym}
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-sky-500/10 text-blue-300 text-xs font-medium border border-sky-500/20">
                      {s.branch}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

