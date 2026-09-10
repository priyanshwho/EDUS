import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronDown,
  Check,
  FileUp,
  Link as LinkIcon,
  FileText,
  ClipboardList,
  GraduationCap,
  Video,
  FolderOpen,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { announcementService, subjectService } from '../services/index';
import { useUpload } from '../hooks/useUpload';
import { resourceService } from '../services/resource.service';
import { useProfessorDashboardStore } from '../stores/professorDashboard.store';
import { resourcePath, resourceShareUrl } from '../utils/format';
import { handlePreviewResource } from '../utils/previewHandler';
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
          <span className="capitalize text-blue-500 flex items-center gap-2">
            Professor Dashboard <ChevronDown className={`w-4 h-4 transition-transform ${isMobileMenuOpen ? 'rotate-180' : ''}`} /> {activeTab}
          </span>
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
                  ${activeTab === t ? 'bg-blue-500/10 text-blue-500 font-semibold' : 'text-n-3 hover:bg-n-7 hover:text-n-1'}`}
              >
                {activeTab === t && <Check className="w-4 h-4 mr-2 text-blue-500 inline" />}
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
              ${activeTab === t ? 'border-blue-500 text-blue-500' : 'border-transparent text-n-4 hover:text-n-1'}`}
          >
            {t}
          </button>
        ))}
      </nav>

      {activeTab === 'overview'       && <AnalyticsOverview analytics={analytics} loading={loadingAnalytics} />}
      {activeTab === 'upload'         && <UploadForm subjects={subjects} user={user} onUploaded={() => refreshAfterUpload(user?.id)} />}
      {activeTab === 'subjects'       && <SubjectsPanel subjects={subjects} onSubjectCreated={prependSubject} userId={user?.id} />}
      {activeTab === 'announcements'  && <AnnouncementsPanel subjects={subjects} />}
      {activeTab === 'resources'      && (
        <MyResources
          resources={myResources}
          loading={loadingResources}
          user={user}
          subjects={subjects}
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
          <div key={c.label} className="group relative rounded-2xl border border-n-6 bg-n-7/50 backdrop-blur p-6 text-center hover:-translate-y-1 transition-all duration-300 hover:shadow-2xl hover:border-blue-500/50 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <p className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-blue-500 to-purple-500 drop-shadow-md mb-2">{c.value}</p>
            <p className="text-sm font-medium text-n-3 tracking-wide">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Subject contribution */}
      <h3 className="h5 mb-4">Subject Contributions</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Object.entries(analytics.bySubject || {}).map(([subject, count]) => (
          <div key={subject} className="flex items-center justify-between rounded-xl border border-n-6 bg-n-7/30 backdrop-blur px-5 py-4 hover:border-blue-500/30 transition-colors">
            <span className="font-medium text-n-2 line-clamp-1 pr-4">{subject}</span>
            <span className="flex items-center justify-center min-w-[2.5rem] h-8 rounded-full bg-blue-500/10 text-blue-500 font-bold border border-blue-500/20">{count}</span>
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
function UploadForm({ subjects, user, onUploaded }) {
  const { upload, uploading, progress, error } = useUpload();
  const [form, setForm] = useState({
    subject_id: '', resource_type: 'notes', title: '', description: '',
    year: '', pyq_type: '', youtube_url: '', external_link: '',
  });
  const [file, setFile] = useState(null);
  const [success, setSuccess] = useState(false);

  const [uploadedResource, setUploadedResource] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [uploadMethod, setUploadMethod] = useState('file'); // 'file' | 'link'

  const onChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess(false);
    setUploadedResource(null);
    try {
      let created = null;
      if (form.resource_type === 'lecture' && form.youtube_url) {
        // YouTube lecture — no file upload needed
        const res = await resourceService.create({
          ...form,
          year: Number(form.year) || undefined,
          youtube_url: form.youtube_url,
        });
        created = res?.resource;
      } else if (uploadMethod === 'link' && form.external_link) {
        // Drive / External Link — no file upload needed
        const payload = {
          subject_id: form.subject_id,
          resource_type: form.resource_type,
          title: form.title,
          description: form.description || undefined,
          year: Number(form.year) || undefined,
          pyq_type: form.pyq_type || undefined,
          external_link: form.external_link,
        };
        if (!payload.description) delete payload.description;
        if (!payload.year) delete payload.year;
        if (!payload.pyq_type) delete payload.pyq_type;
        const res = await resourceService.create(payload);
        created = res?.resource;
      } else if (file) {
        created = await upload(file, { ...form, year: Number(form.year) || undefined });
      }
      setUploadedResource(created);
      setSuccess(true);
      onUploaded?.();
      setForm({ subject_id: '', resource_type: 'notes', title: '', description: '', year: '', pyq_type: '', youtube_url: '', external_link: '' });
      setFile(null);
      setUploadMethod('file');
    } catch {
      setSuccess(false);
    }
  };

  const isLecture = form.resource_type === 'lecture';
  const isPyq     = form.resource_type === 'pyq';

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto rounded-3xl border border-n-6 bg-n-7/40 backdrop-blur p-8 shadow-2xl">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-blue-500 to-purple-500">Upload Resource</h2>
        <p className="text-n-4 mt-2">Share knowledge with your students</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Left Column: Details */}
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-n-3 mb-2 uppercase tracking-wide">Subject</label>
            <select name="subject_id" value={form.subject_id} onChange={onChange} required
              className="w-full rounded-xl border border-n-6 bg-n-8/50 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none transition">
              <option value="">Select Subject</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name_full} (Sem {s.semester})</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-n-3 mb-2 uppercase tracking-wide">Resource Type</label>
            <select name="resource_type" value={form.resource_type} onChange={onChange}
              className="w-full rounded-xl border border-n-6 bg-n-8/50 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none transition">
              {['notes','assignment','pyq','lecture'].map(t =>
                <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
          </div>

          {isPyq && (
            <div>
              <label className="block text-xs font-semibold text-n-3 mb-2 uppercase tracking-wide">PYQ Type</label>
              <select name="pyq_type" value={form.pyq_type} onChange={onChange}
                className="w-full rounded-xl border border-n-6 bg-n-8/50 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none transition">
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
                className="w-full rounded-xl border border-n-6 bg-n-8/50 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none transition" />
            </div>
            <div className="w-24">
              <label className="block text-xs font-semibold text-n-3 mb-2 uppercase tracking-wide">Year</label>
              <input name="year" value={form.year} onChange={onChange} placeholder="e.g. 2024" type="number"
                className="w-full rounded-xl border border-n-6 bg-n-8/50 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none transition" />
            </div>
          </div>
        </div>

        {/* Right Column: File/Link & Desc */}
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-n-3 mb-2 uppercase tracking-wide">Description</label>
            <textarea name="description" value={form.description} onChange={onChange} placeholder="Brief description (optional)" rows={4}
              className="w-full rounded-xl border border-n-6 bg-n-8/50 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none transition resize-none" />
          </div>

          {isLecture ? (
            <div>
              <label className="block text-xs font-semibold text-n-3 mb-2 uppercase tracking-wide">YouTube Link</label>
              <input name="youtube_url" value={form.youtube_url} onChange={onChange} placeholder="https://youtube.com/..." required
                className="w-full rounded-xl border border-n-6 bg-n-8/50 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none transition text-red-300" />
            </div>
          ) : (
            <div>
              {/* Upload Method Toggle */}
              <label className="block text-xs font-semibold text-n-3 mb-2 uppercase tracking-wide">Source</label>
              <div className="flex gap-2 mb-3">
                <button type="button" onClick={() => setUploadMethod('file')}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${uploadMethod === 'file' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-n-6 text-n-3 hover:text-n-1'}`}>
                  <FileUp className="w-3.5 h-3.5" /> File Upload
                </button>
                <button type="button" onClick={() => setUploadMethod('link')}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${uploadMethod === 'link' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-n-6 text-n-3 hover:text-n-1'}`}>
                  <LinkIcon className="w-3.5 h-3.5" /> Drive / Link
                </button>
              </div>

              {uploadMethod === 'file' ? (
                <div className="relative flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-blue-500/40 rounded-xl bg-blue-500/5 hover:bg-blue-500/10 transition-colors cursor-pointer group overflow-hidden">
                  <input type="file" accept=".pdf" onChange={e => setFile(e.target.files[0])} required={uploadMethod === 'file'}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                  <div className="text-center p-4">
                    <p className="text-sm font-medium text-blue-500 group-hover:scale-105 transition-transform">{file ? file.name : "Click or drag to upload PDF"}</p>
                    {!file && <p className="text-xs text-n-4 mt-1">Maximum file size: 10MB</p>}
                  </div>
                </div>
              ) : (
                <input name="external_link" value={form.external_link} onChange={onChange}
                  placeholder="Google Drive / external URL" required={uploadMethod === 'link'}
                  className="w-full rounded-xl border border-n-6 bg-n-8/50 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none transition text-green-300" />
              )}
            </div>
          )}
        </div>
      </div>

      <div className="pt-4 border-t border-n-6">
        {uploading && (
          <div className="mb-4 bg-n-8 rounded-full h-3 overflow-hidden border border-n-6">
            <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-purple-500 h-full transition-all duration-300 ease-out" style={{ width: `${progress}%` }} />
          </div>
        )}

        {error && <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}
        
        {success && (
          <div className="mb-6 p-5 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-n-1 space-y-4">
            <div className="flex items-center gap-2 text-green-400 font-bold text-sm">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Resource Published Successfully!</span>
            </div>

            {uploadedResource && (() => {
              const uploadSubj = uploadedResource?.subjects || subjects?.find(s => s.id === uploadedResource?.subject_id);
              const shareUrl = resourceShareUrl(uploadedResource.slug, uploadedResource, user, uploadSubj);
              return (
                <>
                  <div className="p-3.5 bg-n-8/80 rounded-xl border border-n-6 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-n-4 uppercase tracking-wider">Sharable Link for Students</span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(shareUrl);
                          setCopiedLink(true);
                          setTimeout(() => setCopiedLink(false), 2000);
                        }}
                        className="text-xs px-3 py-1 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 font-medium transition flex items-center gap-1"
                      >
                        {copiedLink ? <><Check className="w-3 h-3" /> Copied!</> : 'Copy Link'}
                      </button>
                    </div>
                    <code className="text-xs text-color-1 break-all block font-mono">
                      {shareUrl}
                    </code>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <button
                      type="button"
                      onClick={(e) => handlePreviewResource(uploadedResource, e)}
                      className="px-4 py-2.5 rounded-xl bg-blue-500 text-white text-xs font-bold hover:bg-blue-600 transition flex items-center gap-1.5 shadow-lg shadow-blue-500/20"
                    >
                      <span>View File (T3 Storage)</span>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </button>
                    <a
                      href={shareUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2.5 rounded-xl bg-n-6 text-n-1 text-xs font-bold hover:bg-n-5 transition flex items-center gap-1.5"
                    >
                      <span>Open Student Resource Page</span>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </a>
                  </div>
                </>
              );
            })()}
          </div>
        )}

        <button type="submit" disabled={uploading}
          className="w-full py-3.5 rounded-xl bg-blue-500 text-white font-bold text-sm hover:opacity-90 hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] transition-all duration-300 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none">
          {uploading ? `Uploading... ${progress}%` : 'Publish Another Resource'}
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
        <form onSubmit={handlePost} className="space-y-4 rounded-2xl border border-n-6 bg-n-7/50 backdrop-blur p-6 shadow-xl hover:border-blue-500/50 transition">
          <div>
            <label className="block text-xs font-medium text-n-4 mb-2 uppercase">Target Audience</label>
            <select name="subject_id" value={form.subject_id}
              onChange={e => setForm(p => ({ ...p, subject_id: e.target.value }))}
              className="w-full rounded-xl border border-n-6 bg-n-8/50 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none transition">
              <option value="">All Subjects (Global Broadcast)</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name_full}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-n-4 mb-2 uppercase">Title</label>
            <input placeholder="Enter title..." value={form.title} required
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              className="w-full rounded-xl border border-n-6 bg-n-8/50 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none transition" />
          </div>
          <div>
            <label className="block text-xs font-medium text-n-4 mb-2 uppercase">Message</label>
            <textarea placeholder="Write your announcement here..." rows={5} value={form.content} required
              onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
              className="w-full rounded-xl border border-n-6 bg-n-8/50 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none transition resize-none" />
          </div>
          <button type="submit"
            className="w-full py-3 rounded-xl bg-blue-500 text-white font-bold text-sm hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/30 transition-all">
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
              <div key={a.id} className="group rounded-2xl border border-n-6 bg-n-7/30 p-5 hover:bg-n-7 hover:border-blue-500/40 transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 via-blue-500 to-purple-500 flex items-center justify-center text-n-8 font-bold">
                    A
                  </div>
                  <div>
                    <h3 className="font-semibold text-n-1 leading-tight group-hover:text-blue-500 transition-colors">{a.title}</h3>
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

const TYPE_CONFIG = {
  notes:      { label: 'Notes',      color: 'from-blue-500 to-cyan-500',    bg: 'bg-blue-500/10 border-blue-500/20 text-blue-400',    Icon: FileText },
  assignment: { label: 'Assignment', color: 'from-orange-500 to-amber-500', bg: 'bg-orange-500/10 border-orange-500/20 text-orange-400', Icon: ClipboardList },
  pyq:        { label: 'PYQ',        color: 'from-purple-500 to-pink-500',  bg: 'bg-purple-500/10 border-purple-500/20 text-purple-400', Icon: GraduationCap },
  lecture:    { label: 'Lecture',    color: 'from-red-500 to-rose-500',     bg: 'bg-red-500/10 border-red-500/20 text-red-400',       Icon: Video },
};

function ResourceCard({ r, user, subjects, onDeleteSuccess }) {
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const cfg = TYPE_CONFIG[r.resource_type] || TYPE_CONFIG.notes;
  const subj = r.subjects || subjects?.find(s => s.id === r.subject_id);
  const canonicalPath = resourcePath(r, r.slug, user, subj);
  const shareUrl = resourceShareUrl(r.slug, r, user, subj);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const ta = document.createElement('textarea');
      ta.value = shareUrl;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: r.title, url: shareUrl });
      } catch {/* cancelled */}
    } else {
      handleCopy();
    }
  };


  const handleDelete = async () => {
    if (!window.confirm(`Delete "${r.title}"?`)) return;
    setDeleting(true);
    try {
      await resourceService.remove(r.id);
      onDeleteSuccess?.(r.id);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="group relative rounded-2xl border border-n-6 bg-n-7/50 backdrop-blur overflow-hidden hover:border-blue-500/40 hover:shadow-2xl hover:shadow-blue-500/5 transition-all duration-300">
      {/* Gradient top accent bar */}
      <div className={`h-1 w-full bg-gradient-to-r ${cfg.color}`} />

      <div className="p-4 sm:p-5">
        {/* Header row */}
        <div className="flex items-start gap-3 mb-3">
          <div className={`flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br ${cfg.color} flex items-center justify-center text-white shadow-lg`}>
            {cfg.Icon && <cfg.Icon className="w-4 h-4" />}
          </div>
          <div className="flex-1 min-w-0">
            <Link
              to={canonicalPath}
              className="font-semibold text-n-1 text-sm sm:text-base leading-tight line-clamp-2 hover:text-blue-400 transition-colors block"
              title="Open resource page"
            >
              {r.title}
            </Link>
            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.bg}`}>
                {cfg.label}
              </span>
              {r.slug && (
                <span className="text-xs text-n-5 font-mono truncate max-w-[140px]" title={r.slug}>
                  /{r.slug}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
          {/* View */}
          <a
            href={canonicalPath}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold hover:bg-blue-500/20 hover:border-blue-500/40 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-200"
            title="Open resource page in new tab"
          >
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span>View</span>
          </a>

          {/* Copy Link */}
          <button
            onClick={handleCopy}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all duration-200 hover:-translate-y-0.5
              ${copied
                ? 'bg-green-500/15 border-green-500/30 text-green-400 shadow-lg shadow-green-500/20'
                : 'bg-n-6/50 border-n-5/30 text-n-3 hover:bg-n-6 hover:border-n-5/50 hover:text-n-1 hover:shadow-lg hover:shadow-black/20'
              }`}
          >
            {copied ? (
              <>
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Copied!</span>
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span>Copy Link</span>
              </>
            )}
          </button>

          {/* Share */}
          <button
            onClick={handleShare}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold hover:bg-purple-500/20 hover:border-purple-500/40 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-200"
          >
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            <span>Share</span>
          </button>

          {/* Delete */}
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold hover:bg-red-500/20 hover:border-red-500/40 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-red-500/20 transition-all duration-200 disabled:opacity-40 disabled:hover:translate-y-0"
          >
            {deleting ? (
              <svg className="w-3.5 h-3.5 animate-spin flex-shrink-0" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            )}
            <span>{deleting ? 'Deleting…' : 'Delete'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function MyResources({ resources, loading, user, subjects, onDeleteSuccess }) {
  if (loading) return (
    <div className="flex justify-center py-12">
      <GooeyLoader primaryColor="#AC6AFF" secondaryColor="#858DFF" borderColor="#252134" />
    </div>
  );

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <h2 className="h5">My Uploads</h2>
        <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-sm text-blue-400 font-semibold">
          {resources.length}
        </span>
      </div>

      {resources.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 rounded-2xl border border-dashed border-n-6 bg-n-7/20 text-center">
          <div className="mb-3 flex justify-center text-n-4">
            <FolderOpen className="w-10 h-10 text-n-5" />
          </div>
          <p className="text-n-3 font-medium">No uploads yet</p>
          <p className="text-n-5 text-sm mt-1">Switch to the Upload tab to share resources with students.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {resources.map(r => (
            <ResourceCard key={r.id} r={r} user={user} subjects={subjects} onDeleteSuccess={onDeleteSuccess} />
          ))}
        </div>
      )}
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
        <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-sm text-blue-500 font-medium shadow-sm">
          {mySubjects.length} Added By You
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Form */}
        <div className="lg:col-span-1">
          <form onSubmit={handleCreate} className="sticky top-24 rounded-2xl border border-n-6 bg-n-7/50 backdrop-blur p-6 shadow-2xl transition hover:border-blue-500/50">
            <h3 className="font-semibold mb-5 text-sm text-n-2 uppercase tracking-wider">Add New Subject</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-n-4 mb-1.5 uppercase tracking-wide">Full Name</label>
                <input name="name_full" value={form.name_full} onChange={onChange} placeholder="e.g. Design & Analysis" required
                  className="w-full rounded-xl border border-n-6 bg-n-8/50 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none transition" />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs text-n-4 mb-1.5 uppercase tracking-wide">Acronym</label>
                  <input name="acronym" value={form.acronym} onChange={onChange} placeholder="e.g. DAA" required
                    className="w-full rounded-xl border border-n-6 bg-n-8/50 px-4 py-2.5 text-sm uppercase focus:border-blue-500 focus:outline-none transition" maxLength={10} />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-n-4 mb-1.5 uppercase tracking-wide">Semester</label>
                  <select name="semester" value={form.semester} onChange={onChange} required 
                    className="w-full rounded-xl border border-n-6 bg-n-8/50 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none transition">
                    <option value="">Sem</option>
                    {Array.from({ length: 8 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs text-n-4 mb-1.5 uppercase tracking-wide">Branch</label>
                <select name="branch" value={form.branch} onChange={onChange} required 
                  className="w-full rounded-xl border border-n-6 bg-n-8/50 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none transition">
                  <option value="">Select Branch</option>
                  {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>

              {error   && <p className="text-red-400 text-sm mt-2">{error}</p>}
              {success && (
                <p className="text-green-400 text-sm mt-2 flex items-center gap-1.5">
                  <Check className="w-4 h-4" /> Subject created!
                </p>
              )}

              <button type="submit" disabled={creating}
                className="w-full mt-2 py-3 rounded-xl bg-blue-500 text-white font-bold text-sm hover:opacity-90 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-500/20 transition-all duration-200 disabled:opacity-50">
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
                <div key={s.id} className="group relative rounded-2xl border border-n-6 bg-n-7/30 backdrop-blur p-5 hover:border-blue-500/50 hover:bg-n-7/80 transition-all hover:shadow-xl">
                  <div className="absolute top-4 right-4 text-xs font-mono font-bold text-blue-500/30 group-hover:text-blue-500/70 transition-colors text-right">
                    SEM {s.semester}
                  </div>
                  <h3 className="font-bold text-lg text-n-1 mb-1 pr-12 group-hover:text-blue-500 transition-colors">{s.name_full}</h3>
                  <div className="flex items-center gap-2 mt-4">
                    <span className="px-2.5 py-1 rounded bg-blue-500/10 text-blue-400 text-xs font-mono font-medium border border-blue-500/20">
                      {s.acronym}
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-blue-600/10 text-blue-300 text-xs font-medium border border-blue-600/20">
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

