import { useEffect, useState } from 'react';
import {
  ChevronDown,
  Check,
  X,
  Link as LinkIcon,
  Video,
  MoreVertical,
  Pencil,
  Trash2,
  AlertTriangle,
  FileUp,
  Users,
  Activity,
  Mail,
  Globe,
  GraduationCap,
  UserCheck,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { userService, subjectService, resourceService } from '../services/index';
import { useAdminDashboardStore } from '../stores/adminDashboard.store';
import { useUpload } from '../hooks/useUpload';
import { useAuth } from '../context/AuthContext';
import { GooeyLoader } from '../components/ui/loader-10';
import DashboardBackground from '../components/design/DashboardBackground';

/**
 * AdminDashboard
 * Full system access: analytics, user management, all resource management.
 */
export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('analytics');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const tabs = ['analytics', 'users', 'subjects', 'resources'];

  return (
    <section className="min-h-screen bg-gradient-to-br from-[#0b1021] via-[#0E0C15] to-[#1a1025] text-n-1 p-6 relative">
      <DashboardBackground />
      <div className="relative z-10">
        <header className="mb-8">
          <h1 className="h3">Admin Dashboard</h1>
          <p className="body-2 text-n-4">Full system access — EduSphere</p>
        </header>

      {/* ── Mobile Tab Navigation (Dropdown Switcher) ── */}
      <div className="md:hidden relative mb-8 z-20">
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="w-full flex items-center justify-between px-5 py-3.5 bg-n-7 border border-n-6 rounded-xl font-medium text-n-1 shadow-sm"
        >
          <span className="capitalize text-blue-500 flex items-center gap-2">
            Admin Dashboard <ChevronDown className={`w-4 h-4 transition-transform ${isMobileMenuOpen ? 'rotate-180' : ''}`} /> {activeTab}
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

      {activeTab === 'analytics' && <PlatformAnalytics />}
      {activeTab === 'users'     && <UserManagement />}
      {activeTab === 'subjects'  && <SubjectManagement />}
      {activeTab === 'resources' && <ResourceManagement />}
      </div>
    </section>
  );
}

// ── Resource Management (Admin) ────────────────────────────────────────────
const RESOURCE_TYPES = ['notes', 'assignment', 'pyq', 'lecture'];
const PYQ_TYPES      = ['minor1', 'minor2', 'major'];

function ResourceManagement() {
  const { user } = useAuth();
  const {
    resources,
    subjects,
    loadingResources,
    loadingSubjects,
    fetchResources,
    fetchSubjects,
    prependResource,
    updateResource,
    removeResourceById,
  } = useAdminDashboardStore();
  const { upload, uploading, progress, error: uploadError } = useUpload();
  const [scope,         setScope]         = useState('global'); // 'own' | 'global'
  const [filters,       setFilters]       = useState({ q: '', resource_type: '' });
  const [editId,        setEditId]        = useState(null);
  const [editForm,      setEditForm]      = useState({});
  const [saving,        setSaving]        = useState(false);

  const [formOpen,      setFormOpen]      = useState(false);
  const [uploadMethod,  setUploadMethod]  = useState('file'); // 'file' | 'link' | 'youtube'
  const [file,          setFile]          = useState(null);
  const [createForm,    setCreateForm]    = useState({
    subject_id: '',
    resource_type: 'notes',
    title: '',
    description: '',
    year: '',
    pyq_type: '',
    external_link: '',
    youtube_url: '',
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError,   setCreateError]   = useState(null);

  useEffect(() => {
    fetchResources().catch(() => {});
    fetchSubjects().catch(() => {});
  }, [fetchResources, fetchSubjects]);

  /* ── delete ── */
  const handleDelete = async (id) => {
    if (!confirm('Permanently delete this resource?')) return;
    await resourceService.remove(id);
    removeResourceById(id);
  };

  /* ── edit ── */
  const startEdit = (r) => {
    setEditId(r.id);
    setEditForm({
      title:        r.title,
      description:  r.description  || '',
      year:         r.year         || '',
      pyq_type:     r.pyq_type     || '',
      youtube_url:  r.youtube_url  || '',
      aws_s3_key:   r.aws_s3_key   || '',
      external_link: r.external_link || '',
    });
  };

  const saveEdit = async () => {
    setSaving(true);
    try {
      const targetResource = resources.find(r => r.id === editId);
      const payload = {
        title: editForm.title?.trim(),
        description: editForm.description ? editForm.description.trim() : null,
        year: editForm.year ? Number(editForm.year) : null,
        pyq_type: (targetResource?.resource_type === 'pyq' && editForm.pyq_type) ? editForm.pyq_type : null,
      };

      if (targetResource?.youtube_url || targetResource?.resource_type === 'lecture') {
        payload.youtube_url = editForm.youtube_url ? editForm.youtube_url.trim() : null;
      } else if (targetResource?.external_link) {
        payload.external_link = editForm.external_link ? editForm.external_link.trim() : null;
      } else if (targetResource?.aws_s3_key) {
        payload.aws_s3_key = editForm.aws_s3_key || targetResource.aws_s3_key;
      }

      const res = await resourceService.update(editId, payload);
      const updated = res?.resource || res;
      updateResource(updated);
      setEditId(null);
    } catch (err) {
      console.error('Failed to save resource:', err);
      alert(err.message || 'Failed to save resource changes. Please check all fields.');
    } finally {
      setSaving(false);
    }
  };

  /* ── unified add resource ── */
  const handleCreateResource = async (e) => {
    e.preventDefault();
    setCreateError(null);
    setCreateLoading(true);

    try {
      let created = null;
      const basePayload = {
        subject_id: createForm.subject_id,
        resource_type: createForm.resource_type,
        title: createForm.title,
        description: createForm.description || undefined,
        year: createForm.year ? Number(createForm.year) : undefined,
        pyq_type: (createForm.resource_type === 'pyq' && createForm.pyq_type) ? createForm.pyq_type : undefined,
      };

      if (uploadMethod === 'youtube' || createForm.resource_type === 'lecture') {
        if (!createForm.youtube_url) throw new Error('YouTube URL is required');
        const res = await resourceService.create({
          ...basePayload,
          youtube_url: createForm.youtube_url,
        });
        created = res?.resource;
      } else if (uploadMethod === 'link') {
        if (!createForm.external_link) throw new Error('External link URL is required');
        const res = await resourceService.create({
          ...basePayload,
          external_link: createForm.external_link,
        });
        created = res?.resource;
      } else {
        // file upload via S3
        if (!file) throw new Error('Please select a PDF file to upload');
        created = await upload(file, basePayload);
      }

      if (created) {
        prependResource(created);
      }
      setCreateForm({
        subject_id: '',
        resource_type: 'notes',
        title: '',
        description: '',
        year: '',
        pyq_type: '',
        external_link: '',
        youtube_url: '',
      });
      setFile(null);
      setFormOpen(false);
    } catch (err) {
      setCreateError(err.response?.data?.error || err.message || 'Failed to create resource');
    } finally {
      setCreateLoading(false);
    }
  };

  /* ── client-side filter ── */
  const filtered = resources.filter(r => {
    if (scope === 'own' && String(r.uploaded_by) !== String(user?.id)) return false;
    if (filters.resource_type && r.resource_type !== filters.resource_type) return false;
    if (filters.q) {
      const q = filters.q.toLowerCase().trim();
      const titleMatch = r.title?.toLowerCase().includes(q);
      const slugMatch = r.slug?.toLowerCase().includes(q);
      const subjectMatch = r.subjects?.name_full?.toLowerCase().includes(q) || r.subjects?.acronym?.toLowerCase().includes(q);
      const uploaderMatch = r.uploader?.username?.toLowerCase().includes(q);
      if (!titleMatch && !slugMatch && !subjectMatch && !uploaderMatch) return false;
    }
    return true;
  });

  if ((loadingResources || loadingSubjects) && resources.length === 0) {
    return <p className="text-n-4">Loading resources…</p>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="h5">Resource Management ({resources.length})</h2>
        <button
          onClick={() => setFormOpen(o => !o)}
          className="px-4 py-1.5 text-xs rounded-lg bg-blue-500 text-white font-semibold hover:bg-blue-600 transition shadow-lg shadow-blue-500/20"
        >
          {formOpen ? 'Close' : '+ Add Resource'}
        </button>
      </div>

      {/* ── Unified Add Resource Form ── */}
      {formOpen && (
        <form onSubmit={handleCreateResource} className="mb-8 rounded-xl border border-n-6 bg-n-7 p-5">
          <h3 className="font-semibold mb-4 text-sm text-n-1">Add Resource</h3>

          {/* Source Selector Tabs */}
          <div className="mb-4">
            <label className="block text-xs font-semibold text-n-3 mb-2 uppercase tracking-wide">Upload Source</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full max-w-lg">
              <button
                type="button"
                onClick={() => {
                  setUploadMethod('file');
                  if (createForm.resource_type === 'lecture') {
                    setCreateForm(p => ({ ...p, resource_type: 'notes' }));
                  }
                }}
                className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                  uploadMethod === 'file'
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                    : 'bg-n-6 text-n-3 hover:text-n-1'
                }`}
              >
                <FileUp className="w-3.5 h-3.5" /> File Upload (S3)
              </button>
              <button
                type="button"
                onClick={() => {
                  setUploadMethod('link');
                  if (createForm.resource_type === 'lecture') {
                    setCreateForm(p => ({ ...p, resource_type: 'notes' }));
                  }
                }}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                  uploadMethod === 'link'
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                    : 'bg-n-6 text-n-3 hover:text-n-1'
                }`}
              >
                <LinkIcon className="w-3.5 h-3.5" /> Drive / Link
              </button>
              <button
                type="button"
                onClick={() => {
                  setUploadMethod('youtube');
                  setCreateForm(p => ({ ...p, resource_type: 'lecture' }));
                }}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                  uploadMethod === 'youtube'
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                    : 'bg-n-6 text-n-3 hover:text-n-1'
                }`}
              >
                <Video className="w-3.5 h-3.5" /> YouTube Lecture
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select
              required
              value={createForm.subject_id}
              onChange={e => setCreateForm(p => ({ ...p, subject_id: e.target.value }))}
              className="rounded-lg border border-n-6 bg-n-6 px-3 py-2 text-sm text-n-1"
            >
              <option value="">Select Subject…</option>
              {subjects.filter(s => String(s.added_by) === String(user?.id)).length === 0 ? (
                <option value="" disabled>No subjects created by you yet</option>
              ) : (
                subjects
                  .filter(s => String(s.added_by) === String(user?.id))
                  .map(s => (
                    <option key={s.id} value={s.id}>{s.name_full} ({s.branch} S{s.semester})</option>
                  ))
              )}
            </select>

            <select
              required
              value={createForm.resource_type}
              onChange={e => {
                const val = e.target.value;
                setCreateForm(p => ({ ...p, resource_type: val, pyq_type: '' }));
                if (val === 'lecture') setUploadMethod('youtube');
                else if (uploadMethod === 'youtube') setUploadMethod('file');
              }}
              className="rounded-lg border border-n-6 bg-n-6 px-3 py-2 text-sm text-n-1"
            >
              {RESOURCE_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>

            <input
              required
              placeholder="Title"
              value={createForm.title}
              onChange={e => setCreateForm(p => ({ ...p, title: e.target.value }))}
              className="rounded-lg border border-n-6 bg-n-6 px-3 py-2 text-sm text-n-1 sm:col-span-2"
            />

            <input
              placeholder="Description (optional)"
              value={createForm.description}
              onChange={e => setCreateForm(p => ({ ...p, description: e.target.value }))}
              className="rounded-lg border border-n-6 bg-n-6 px-3 py-2 text-sm text-n-1 sm:col-span-2"
            />

            {/* Conditional Source Inputs */}
            {uploadMethod === 'file' && (
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-n-3 mb-1">Upload PDF File (Max 10MB)</label>
                <div className="relative flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-blue-500/40 rounded-xl bg-blue-500/5 hover:bg-blue-500/10 transition-colors cursor-pointer group overflow-hidden">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={e => setFile(e.target.files[0])}
                    required={uploadMethod === 'file'}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="text-center p-2">
                    <p className="text-sm font-medium text-blue-500 group-hover:scale-105 transition-transform">
                      {file ? file.name : "Click or drag to upload PDF"}
                    </p>
                    {!file && <p className="text-xs text-n-4 mt-0.5">Maximum file size: 10MB</p>}
                  </div>
                </div>
              </div>
            )}

            {uploadMethod === 'link' && (
              <input
                required={uploadMethod === 'link'}
                placeholder="Google Drive / external URL"
                value={createForm.external_link}
                onChange={e => setCreateForm(p => ({ ...p, external_link: e.target.value }))}
                className="rounded-lg border border-n-6 bg-n-6 px-3 py-2 text-sm text-green-300 sm:col-span-2"
              />
            )}

            {uploadMethod === 'youtube' && (
              <input
                required={uploadMethod === 'youtube'}
                placeholder="YouTube URL (https://youtube.com/...)"
                value={createForm.youtube_url}
                onChange={e => setCreateForm(p => ({ ...p, youtube_url: e.target.value }))}
                className="rounded-lg border border-n-6 bg-n-6 px-3 py-2 text-sm text-red-300 sm:col-span-2"
              />
            )}

            <input
              placeholder="Year (e.g. 2024)"
              type="number"
              value={createForm.year}
              onChange={e => setCreateForm(p => ({ ...p, year: e.target.value }))}
              className="rounded-lg border border-n-6 bg-n-6 px-3 py-2 text-sm text-n-1"
            />

            {createForm.resource_type === 'pyq' && (
              <select
                value={createForm.pyq_type}
                onChange={e => setCreateForm(p => ({ ...p, pyq_type: e.target.value }))}
                className="rounded-lg border border-n-6 bg-n-6 px-3 py-2 text-sm text-n-1"
              >
                <option value="">PYQ Type…</option>
                {PYQ_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            )}
          </div>

          {uploading && (
            <div className="mt-4 bg-n-8 rounded-full h-2 overflow-hidden border border-n-6">
              <div
                className="bg-gradient-to-r from-blue-600 via-blue-500 to-purple-500 h-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          {(uploadError || createError) && (
            <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
              {uploadError || createError}
            </div>
          )}

          <button
            type="submit"
            disabled={createLoading || uploading}
            className="mt-4 w-full py-2 rounded-xl bg-blue-500 text-white font-semibold text-sm hover:bg-blue-600 transition disabled:opacity-50 shadow-lg shadow-blue-500/20"
          >
            {createLoading || uploading ? (uploading ? `Uploading ${progress}%…` : 'Adding…') : 'Add Resource'}
          </button>
        </form>
      )}

      {/* ── Scope Toggle & Filters ── */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mb-5">
        <div className="inline-flex p-1 rounded-xl bg-n-8/80 border border-n-6 self-start shadow-inner">
          <button
            type="button"
            onClick={() => setScope('own')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              scope === 'own'
                ? 'bg-blue-500 text-white shadow-md shadow-blue-500/25'
                : 'text-n-4 hover:text-n-2'
            }`}
          >
            Own Resources ({resources.filter(r => String(r.uploaded_by) === String(user?.id)).length})
          </button>
          <button
            type="button"
            onClick={() => setScope('global')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              scope === 'global'
                ? 'bg-blue-500 text-white shadow-md shadow-blue-500/25'
                : 'text-n-4 hover:text-n-2'
            }`}
          >
            Global Resources ({resources.length})
          </button>
        </div>

        <div className="flex items-center gap-3 flex-1 max-w-xl">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-n-4 pointer-events-none" />
            <input
              placeholder="Search title, slug, subject, or uploaded by…"
              value={filters.q}
              onChange={e => setFilters(p => ({ ...p, q: e.target.value }))}
              className="w-full pl-9 pr-8 py-2 rounded-xl border border-n-6 bg-n-7 text-xs text-n-1 placeholder:text-n-5 focus:border-blue-500 focus:outline-none transition"
            />
            {filters.q && (
              <button
                type="button"
                onClick={() => setFilters(p => ({ ...p, q: '' }))}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-n-4 hover:text-n-2 p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <select
            value={filters.resource_type}
            onChange={e => setFilters(p => ({ ...p, resource_type: e.target.value }))}
            className="rounded-xl border border-n-6 bg-n-7 px-3 py-2 text-xs text-n-1 focus:border-blue-500 focus:outline-none transition"
          >
            <option value="">All types</option>
            {RESOURCE_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </select>

          <span className="text-xs text-n-4 whitespace-nowrap self-center">{filtered.length} results</span>
        </div>
      </div>

      {/* ── Resource Table ── */}
      <div className="overflow-x-auto pb-4">
        <table className="w-full text-sm min-w-[720px]">
          <thead>
            <tr className="border-b border-n-6 text-n-4">
              <th className="text-left pb-3 pr-3">Title</th>
              <th className="text-left pb-3 pr-3">Type</th>
              <th className="text-left pb-3 pr-3">Subject</th>
              <th className="text-left pb-3 pr-3">Year</th>
              <th className="text-left pb-3 pr-3">Source</th>
              <th className="text-left pb-3 pr-3">Uploaded By</th>
              <th className="text-left pb-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => (
              editId === r.id ? (
                /* ── Inline edit row ── */
                <tr key={r.id} className="border-b border-blue-500/30 bg-n-7">
                  <td className="py-2 pr-3" colSpan={3}>
                    <div className="flex flex-col gap-1.5">
                      <input value={editForm.title}
                        onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))}
                        placeholder="Title"
                        className="rounded border border-n-5 bg-n-6 px-2 py-1 text-xs w-full text-n-1"
                      />
                      <input value={editForm.description}
                        onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))}
                        placeholder="Description"
                        className="rounded border border-n-5 bg-n-6 px-2 py-1 text-xs w-full text-n-1"
                      />
                      {(r.youtube_url || r.resource_type === 'lecture') && (
                        <input value={editForm.youtube_url}
                          onChange={e => setEditForm(p => ({ ...p, youtube_url: e.target.value }))}
                          placeholder="YouTube URL"
                          className="rounded border border-n-5 bg-n-6 px-2 py-1 text-xs w-full text-n-1"
                        />
                      )}
                      {r.external_link && (
                        <input value={editForm.external_link}
                          onChange={e => setEditForm(p => ({ ...p, external_link: e.target.value }))}
                          placeholder="Drive / external URL"
                          className="rounded border border-n-5 bg-n-6 px-2 py-1 text-xs w-full text-n-1"
                        />
                      )}
                      {r.aws_s3_key && (
                        <span className="text-[11px] text-blue-400 font-mono">PDF stored in S3</span>
                      )}
                    </div>
                  </td>
                  <td className="py-2 pr-3">
                    <input type="number" value={editForm.year}
                      onChange={e => setEditForm(p => ({ ...p, year: e.target.value }))}
                      placeholder="Year"
                      className="rounded border border-n-5 bg-n-6 px-2 py-1 text-xs w-20 text-n-1"
                    />
                  </td>
                  <td className="py-2 pr-3">
                    {r.resource_type === 'pyq' ? (
                      <select value={editForm.pyq_type}
                        onChange={e => setEditForm(p => ({ ...p, pyq_type: e.target.value }))}
                        className="rounded border border-n-5 bg-n-6 px-1 py-1 text-xs text-n-1"
                      >
                        <option value="">—</option>
                        {PYQ_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    ) : <span className="text-n-5 text-xs">—</span>}
                  </td>
                  <td className="py-2 pr-3 text-xs text-n-4">
                    {r.uploader?.username || '—'}
                  </td>
                  <td className="py-2">
                    <div className="flex gap-2">
                      <button onClick={saveEdit} disabled={saving}
                        className="text-xs text-green-400 hover:text-green-300 disabled:opacity-50 font-medium">
                        {saving ? 'Saving…' : 'Save'}
                      </button>
                      <button onClick={() => setEditId(null)}
                        className="text-xs text-n-4 hover:text-n-1">Cancel</button>
                    </div>
                  </td>
                </tr>
              ) : (
                /* ── Normal row ── */
                <tr key={r.id} className="border-b border-n-6 hover:bg-n-7 transition">
                  <td className="py-2.5 pr-3">
                    <span className="font-medium text-n-1">{r.title}</span>
                    {r.pyq_type && <span className="ml-1.5 text-[10px] font-mono text-blue-400 uppercase">{r.pyq_type}</span>}
                    <br />
                    <span className="text-[10px] text-n-5 font-mono">{r.slug}</span>
                  </td>
                  <td className="py-2.5 pr-3">
                    <span className="capitalize text-xs px-1.5 py-0.5 rounded bg-n-6 text-n-3">{r.resource_type}</span>
                  </td>
                  <td className="py-2.5 pr-3 text-n-4 text-xs">
                    {r.subjects?.acronym}
                    {r.subjects?.semester && <span className="text-n-5"> S{r.subjects.semester}</span>}
                  </td>
                  <td className="py-2.5 pr-3 text-n-4 text-xs">{r.year || '—'}</td>
                  <td className="py-2.5 pr-3 text-xs">
                    {r.aws_s3_key   && <span className="text-blue-500">S3</span>}
                    {r.youtube_url  && <span className="text-red-400">YT</span>}
                    {r.external_link && <span className="text-green-400">Drive</span>}
                  </td>
                  <td className="py-2.5 pr-3 text-xs">
                    {r.uploader?.username ? (
                      <span className={String(r.uploaded_by) === String(user?.id) ? "text-blue-400 font-medium" : "text-n-3"}>
                        {r.uploader.username}
                        {String(r.uploaded_by) === String(user?.id) && (
                          <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 font-mono">You</span>
                        )}
                      </span>
                    ) : (
                      <span className="text-n-5 text-xs">—</span>
                    )}
                  </td>
                  <td className="py-2.5">
                    <div className="flex gap-3">
                      <button onClick={() => startEdit(r)}
                        className="text-xs text-blue-500 hover:text-blue-400 transition">Edit</button>
                      <button onClick={() => handleDelete(r.id)}
                        className="text-xs text-red-400 hover:text-red-300 transition">Delete</button>
                    </div>
                  </td>
                </tr>
              )
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="text-center text-n-4 py-8 text-sm">No resources found.</p>}
      </div>
    </div>
  );
}

// ── Platform Analytics ──────────────────────────────────────────────────────
function PlatformAnalytics() {
  const {
    platformAnalytics,
    loadingPlatformAnalytics,
    fetchPlatformAnalytics,
  } = useAdminDashboardStore();

  useEffect(() => {
    fetchPlatformAnalytics().catch(() => {});
  }, [fetchPlatformAnalytics]);

  if (loadingPlatformAnalytics || !platformAnalytics) return <p className="text-n-4">Loading…</p>;

  const summaryCards = [
    { label: 'Total Users',     value: platformAnalytics.totalUsers },
    { label: 'Total Resources', value: platformAnalytics.totalResources },
    { label: 'Total Subjects',  value: platformAnalytics.totalSubjects },
  ];

  return (
    <div>
      <h2 className="h5 mb-4">Platform Summary</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        {summaryCards.map(c => (
          <div key={c.label} className="rounded-xl border border-n-6 bg-n-7 p-5 text-center">
            <p className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-blue-500 to-purple-500">{c.value}</p>
            <p className="text-sm text-n-4 mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h3 className="font-semibold mb-3">Users by Role</h3>
          {Object.entries(platformAnalytics.usersByRole || {}).map(([role, count]) => (
            <div key={role} className="flex justify-between py-1.5 border-b border-n-6 text-sm">
              <span className="capitalize text-n-2">{role}</span>
              <span className="text-blue-400 font-mono">{count}</span>
            </div>
          ))}
        </div>
        <div>
          <h3 className="font-semibold mb-3">Resources by Type</h3>
          {Object.entries(platformAnalytics.resourcesByType || {}).map(([type, count]) => (
            <div key={type} className="flex justify-between py-1.5 border-b border-n-6 text-sm">
              <span className="capitalize text-n-2">{type}</span>
              <span className="text-blue-400 font-mono">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── User Management ─────────────────────────────────────────────────────────

/* Avatar color from username hash */
const AVATAR_COLORS = [
  'bg-rose-500', 'bg-pink-500', 'bg-fuchsia-500', 'bg-purple-500',
  'bg-violet-500', 'bg-indigo-500', 'bg-blue-500', 'bg-sky-500',
  'bg-cyan-500', 'bg-teal-500', 'bg-emerald-500', 'bg-green-500',
  'bg-lime-500', 'bg-amber-500', 'bg-orange-500', 'bg-red-500',
];
function avatarColor(name) {
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

/* Format date in IST */
function formatIST(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d)) return null;
  return d.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

/* Relative time string */
function timeAgo(dateStr) {
  if (!dateStr) return 'Never';
  const d = new Date(dateStr);
  if (isNaN(d)) return 'Never';
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return `${Math.floor(diff / 604800)}w ago`;
}

/* Auth badge component */
function AuthBadge({ provider }) {
  if (provider === 'google') return <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-green-500/15 text-green-400 border border-green-500/30">Google</span>;
  if (provider === 'github') return <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-gray-500/15 text-gray-300 border border-gray-500/30">GitHub</span>;
  return <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-rose-500/15 text-rose-400 border border-rose-500/30">Email</span>;
}

function UserManagement() {
  const {
    users,
    resources,
    loadingUsers,
    fetchUsers,
    fetchResources,
    setUserRole,
    removeUserById,
    removeUserAndResources,
    renameUser: storeRenameUser,
  } = useAdminDashboardStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [authFilter, setAuthFilter] = useState('all');
  const [onlyActiveMonthly, setOnlyActiveMonthly] = useState(false);
  const [sortBy, setSortBy] = useState('joined');           // 'joined' | 'active' | 'name'
  const [sortOrder, setSortOrder] = useState('desc');        // 'asc' | 'desc'
  const [openActionId, setOpenActionId] = useState(null);    // which user's action menu is open
  const [renamingId, setRenamingId] = useState(null);         // which user is being renamed inline
  const [renameValue, setRenameValue] = useState('');
  const [renameError, setRenameError] = useState(null);

  const handleHeaderSort = (field) => {
    if (sortBy === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder(field === 'name' ? 'asc' : 'desc');
    }
  };

  useEffect(() => {
    fetchUsers().catch(() => {});
    fetchResources().catch(() => {});
  }, [fetchUsers, fetchResources]);

  // Close action menu on outside click
  useEffect(() => {
    if (!openActionId) return;
    const handler = () => setOpenActionId(null);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [openActionId]);

  const changeRole = async (id, role) => {
    await userService.updateRole(id, role);
    setUserRole(id, role);
  };

  const deleteUser = async (id) => {
    if (!confirm('Delete this user? (Their uploaded resources will remain on the platform)')) return;
    await userService.remove(id);
    removeUserById(id);
    setOpenActionId(null);
  };

  const deleteUserWithResources = async (user) => {
    const userResourcesCount = resources.filter(r => r.uploaded_by === user.id).length;
    const msg = `This will permanently delete user "${user.username}" AND all ${userResourcesCount} resources they uploaded, including S3 files. This cannot be undone.\n\nAre you sure?`;
    if (!confirm(msg)) return;
    try {
      await userService.removeWithResources(user.id);
      removeUserAndResources(user.id);
    } catch (err) {
      alert(err.response?.data?.error || err.message || 'Failed to delete user and resources');
    }
    setOpenActionId(null);
  };

  const startRename = (user) => {
    setRenamingId(user.id);
    setRenameValue(user.username);
    setRenameError(null);
    setOpenActionId(null);
  };

  const submitRename = async (userId) => {
    setRenameError(null);
    try {
      const { user } = await userService.renameUser(userId, renameValue);
      storeRenameUser(userId, user.username);
      setRenamingId(null);
    } catch (err) {
      setRenameError(err.response?.data?.error || err.message || 'Rename failed');
    }
  };

  const cancelRename = () => {
    setRenamingId(null);
    setRenameError(null);
  };

  const resetAllFilters = () => {
    setRoleFilter('all');
    setAuthFilter('all');
    setOnlyActiveMonthly(false);
    setSearchQuery('');
    setSortBy('joined');
    setSortOrder('desc');
  };

  /* ── Stats Calculations ── */
  const now = Date.now();
  const totalUsersCount = users.length;
  const activeMonthlyCount = users.filter(u => u.last_active_at && (now - new Date(u.last_active_at).getTime()) < 30 * 24 * 60 * 60 * 1000).length;
  const googleUsersCount = users.filter(u => u.oauth_provider === 'google').length;
  const emailUsersCount = users.filter(u => !u.oauth_provider || u.oauth_provider === 'email').length;
  const professorCount = users.filter(u => u.role === 'professor').length;
  const studentCount = users.filter(u => u.role === 'student').length;

  const userStats = [
    {
      id: 'total',
      label: 'Total Users',
      value: totalUsersCount,
      icon: Users,
      iconBg: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
      active: roleFilter === 'all' && authFilter === 'all' && !onlyActiveMonthly,
      onClick: resetAllFilters,
    },
    {
      id: 'active',
      label: 'Active Monthly',
      value: activeMonthlyCount,
      icon: Activity,
      iconBg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
      active: onlyActiveMonthly,
      onClick: () => setOnlyActiveMonthly(p => !p),
    },
    {
      id: 'google',
      label: 'Google Auth',
      value: googleUsersCount,
      icon: Globe,
      iconBg: 'bg-red-500/10 border-red-500/20 text-red-400',
      active: authFilter === 'google',
      onClick: () => setAuthFilter(p => p === 'google' ? 'all' : 'google'),
    },
    {
      id: 'email',
      label: 'Email Auth',
      value: emailUsersCount,
      icon: Mail,
      iconBg: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
      active: authFilter === 'email',
      onClick: () => setAuthFilter(p => p === 'email' ? 'all' : 'email'),
    },
    {
      id: 'professors',
      label: 'Professors',
      value: professorCount,
      icon: GraduationCap,
      iconBg: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
      active: roleFilter === 'professor',
      onClick: () => setRoleFilter(p => p === 'professor' ? 'all' : 'professor'),
    },
    {
      id: 'students',
      label: 'Students',
      value: studentCount,
      icon: UserCheck,
      iconBg: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
      active: roleFilter === 'student',
      onClick: () => setRoleFilter(p => p === 'student' ? 'all' : 'student'),
    },
  ];

  /* ── client-side filter by search + role + auth + active ── */
  const filtered = users.filter(u => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (authFilter !== 'all') {
      const provider = u.oauth_provider || 'email';
      if (authFilter !== provider) return false;
    }
    if (onlyActiveMonthly) {
      const isRecent = u.last_active_at && (now - new Date(u.last_active_at).getTime()) < 30 * 24 * 60 * 60 * 1000;
      if (!isRecent) return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!u.username?.toLowerCase().includes(q) && !u.email?.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  /* ── client-side sort by joined, last active, or alphabetical (asc/desc) ── */
  const sortedUsers = [...filtered].sort((a, b) => {
    if (sortBy === 'name') {
      const nameA = (a.username || a.name || '').toLowerCase();
      const nameB = (b.username || b.name || '').toLowerCase();
      const comp = nameA.localeCompare(nameB);
      if (comp !== 0) return sortOrder === 'asc' ? comp : -comp;
    } else if (sortBy === 'active') {
      const hasA = Boolean(a.last_active_at);
      const hasB = Boolean(b.last_active_at);
      if (hasA && hasB) {
        const timeA = new Date(a.last_active_at).getTime();
        const timeB = new Date(b.last_active_at).getTime();
        if (timeA !== timeB) return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
      } else if (hasA && !hasB) {
        return -1; // Active users come before 'Never'
      } else if (!hasA && hasB) {
        return 1;  // Active users come before 'Never'
      }
    } else {
      // Default 'joined' (created_at)
      const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
      if (timeA !== timeB) return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
    }

    // Tie-breaker: fallback to created_at desc, then id
    const fallback = (new Date(b.created_at || 0).getTime()) - (new Date(a.created_at || 0).getTime());
    if (fallback !== 0) return fallback;
    return String(a.id).localeCompare(String(b.id));
  });

  const hasActiveFilters = roleFilter !== 'all' || authFilter !== 'all' || onlyActiveMonthly || !!searchQuery || sortBy !== 'joined' || sortOrder !== 'desc';

  if (loadingUsers && users.length === 0) return <p className="text-n-4">Loading users…</p>;

  return (
    <div>
      {/* ── Top Analytics Stat Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2.5 sm:gap-3.5 mb-6">
        {userStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.id}
              onClick={stat.onClick}
              role="button"
              tabIndex={0}
              className={`rounded-2xl border p-3 sm:p-3.5 flex items-center gap-2.5 sm:gap-3.5 transition-all cursor-pointer select-none ${
                stat.active && stat.id !== 'total'
                  ? 'bg-n-7 border-blue-500/70 shadow-lg shadow-blue-500/10 ring-1 ring-blue-500/40 -translate-y-0.5'
                  : 'bg-n-7/50 hover:bg-n-7 border-n-6/70 hover:border-n-5 hover:-translate-y-0.5 shadow-sm'
              }`}
            >
              <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 border ${stat.iconBg}`}>
                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-black text-n-1 leading-tight tracking-tight">{stat.value}</p>
                <p className="text-[10px] sm:text-xs font-medium text-n-4 truncate">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Header row: title + sort selector + search bar ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="h5 whitespace-nowrap">Users ({sortedUsers.length})</h2>
          {hasActiveFilters && (
            <button
              onClick={resetAllFilters}
              className="text-xs px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition flex items-center gap-1"
            >
              <X className="w-3 h-3" /> Clear filters
            </button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Sort dropdown control */}
          <div className="flex items-center gap-2 bg-n-7 border border-n-6 rounded-lg px-3 py-2 text-xs text-n-3 hover:border-blue-500/50 focus-within:border-blue-500 transition">
            <ArrowUpDown className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="text-n-4 text-xs font-semibold uppercase tracking-wider whitespace-nowrap">Sort:</span>
            <select
              value={`${sortBy}_${sortOrder}`}
              onChange={e => {
                const [field, order] = e.target.value.split('_');
                setSortBy(field);
                setSortOrder(order);
              }}
              className="bg-transparent text-xs text-n-1 font-medium focus:outline-none cursor-pointer pr-1"
            >
              <option value="joined_desc" className="bg-n-8 text-n-1">Joined Date (Newest first)</option>
              <option value="joined_asc" className="bg-n-8 text-n-1">Joined Date (Oldest first)</option>
              <option value="active_desc" className="bg-n-8 text-n-1">Last Active (Most recent first)</option>
              <option value="active_asc" className="bg-n-8 text-n-1">Last Active (Least recent first)</option>
              <option value="name_asc" className="bg-n-8 text-n-1">Alphabetical (A → Z)</option>
              <option value="name_desc" className="bg-n-8 text-n-1">Alphabetical (Z → A)</option>
            </select>
          </div>

          {/* Search bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search by name or email…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 md:w-72 rounded-lg border border-n-6 bg-n-7 pl-9 pr-4 py-2 text-sm placeholder:text-n-5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition"
            />
            <Search className="w-4 h-4 text-n-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto pb-8">
        <table className="w-full text-sm min-w-[680px]">
          <thead>
            <tr className="border-b border-n-6 text-n-4 text-xs uppercase tracking-wide">
              {/* USER column header (sortable) */}
              <th className="text-left pb-3 pr-4 font-semibold">
                <button
                  type="button"
                  onClick={() => handleHeaderSort('name')}
                  className={`group inline-flex items-center gap-1.5 uppercase transition hover:text-n-1 cursor-pointer select-none ${
                    sortBy === 'name' ? 'text-blue-400 font-bold' : 'text-n-4'
                  }`}
                  title="Sort alphabetically (A-Z / Z-A)"
                >
                  <span>User</span>
                  {sortBy === 'name' ? (
                    sortOrder === 'asc' ? (
                      <ArrowUp className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    ) : (
                      <ArrowDown className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    )
                  ) : (
                    <ArrowUpDown className="w-3 h-3 text-n-5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  )}
                </button>
              </th>

              {/* AUTH column filter dropdown */}
              <th className="text-left pb-3 pr-4 font-semibold">
                <select
                  value={authFilter}
                  onChange={e => setAuthFilter(e.target.value)}
                  className="bg-transparent border border-n-6 rounded px-2 py-1 text-xs text-n-4 cursor-pointer hover:border-blue-500/50 focus:border-blue-500 focus:outline-none transition uppercase"
                >
                  <option value="all">Auth (All)</option>
                  <option value="email">Email</option>
                  <option value="google">Google</option>
                  <option value="github">GitHub</option>
                </select>
              </th>

              {/* ROLE column filter dropdown */}
              <th className="text-left pb-3 pr-4 font-semibold">
                <select
                  value={roleFilter}
                  onChange={e => setRoleFilter(e.target.value)}
                  className="bg-transparent border border-n-6 rounded px-2 py-1 text-xs text-n-4 cursor-pointer hover:border-blue-500/50 focus:border-blue-500 focus:outline-none transition uppercase"
                >
                  <option value="all">Role (All)</option>
                  <option value="student">Students</option>
                  <option value="professor">Professors</option>
                  <option value="admin">Admins</option>
                </select>
              </th>

              {/* JOINED column header (sortable) */}
              <th className="text-left pb-3 pr-4 font-semibold">
                <button
                  type="button"
                  onClick={() => handleHeaderSort('joined')}
                  className={`group inline-flex items-center gap-1.5 uppercase transition hover:text-n-1 cursor-pointer select-none ${
                    sortBy === 'joined' ? 'text-blue-400 font-bold' : 'text-n-4'
                  }`}
                  title="Sort by joined date (Newest / Oldest)"
                >
                  <span>Joined</span>
                  {sortBy === 'joined' ? (
                    sortOrder === 'asc' ? (
                      <ArrowUp className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    ) : (
                      <ArrowDown className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    )
                  ) : (
                    <ArrowUpDown className="w-3 h-3 text-n-5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  )}
                </button>
              </th>

              {/* LAST ACTIVE (IST) column header (sortable) */}
              <th className="text-left pb-3 pr-4 font-semibold">
                <button
                  type="button"
                  onClick={() => handleHeaderSort('active')}
                  className={`group inline-flex items-center gap-1.5 uppercase transition hover:text-n-1 cursor-pointer select-none ${
                    sortBy === 'active' ? 'text-blue-400 font-bold' : 'text-n-4'
                  }`}
                  title="Sort by last active (Most recent / Least recent)"
                >
                  <span>Last Active (IST)</span>
                  {sortBy === 'active' ? (
                    sortOrder === 'asc' ? (
                      <ArrowUp className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    ) : (
                      <ArrowDown className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    )
                  ) : (
                    <ArrowUpDown className="w-3 h-3 text-n-5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  )}
                </button>
              </th>

              <th className="text-left pb-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedUsers.map(u => (
              <tr key={u.id} className="border-b border-n-6 hover:bg-n-7/50 transition">
                {/* USER column: avatar + name + email */}
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 ${avatarColor(u.username)}`}>
                      {(u.username || '?')[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      {renamingId === u.id ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            value={renameValue}
                            onChange={e => setRenameValue(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') submitRename(u.id);
                              if (e.key === 'Escape') cancelRename();
                            }}
                            autoFocus
                            className="w-32 rounded border border-blue-500 bg-n-8 px-2 py-0.5 text-xs text-n-1 focus:outline-none"
                          />
                          <button onClick={() => submitRename(u.id)} className="text-green-400 p-0.5 hover:text-green-300 transition" title="Save">
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={cancelRename} className="text-n-4 p-0.5 hover:text-n-1 transition" title="Cancel">
                            <X className="w-3.5 h-3.5" />
                          </button>
                          {renameError && <span className="text-red-400 text-[10px]">{renameError}</span>}
                        </div>
                      ) : (
                        <p className="font-semibold text-n-1 truncate">{u.username}</p>
                      )}
                      <p className="text-xs text-n-4 truncate">{u.email}</p>
                    </div>
                  </div>
                </td>

                {/* AUTH column */}
                <td className="py-3 pr-4">
                  <AuthBadge provider={u.oauth_provider} />
                </td>

                {/* ROLE column */}
                <td className="py-3 pr-4">
                  <select
                    value={u.role}
                    onChange={e => changeRole(u.id, e.target.value)}
                    className="bg-n-6 border border-n-5 rounded px-2 py-1 text-xs capitalize"
                  >
                    <option value="student">student</option>
                    <option value="professor">professor</option>
                    <option value="admin">admin</option>
                  </select>
                </td>

                {/* JOINED column */}
                <td className="py-3 pr-4 text-xs text-n-4 whitespace-nowrap">
                  {formatIST(u.created_at) || '—'}
                </td>

                {/* LAST ACTIVE (IST) column */}
                <td className="py-3 pr-4 whitespace-nowrap">
                  <p className="text-xs font-medium text-n-2">{timeAgo(u.last_active_at)}</p>
                  {u.last_active_at && (
                    <p className="text-[10px] text-n-5">{formatIST(u.last_active_at)}</p>
                  )}
                </td>

                {/* ACTIONS column — dropdown */}
                <td className="py-3">
                  <div className="relative">
                    <button
                      onClick={e => { e.stopPropagation(); setOpenActionId(openActionId === u.id ? null : u.id); }}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-n-4 hover:text-n-1 hover:bg-n-6 transition"
                      title="Actions"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    {openActionId === u.id && (
                      <div
                        onClick={e => e.stopPropagation()}
                        className="absolute right-0 top-full mt-1 w-52 rounded-xl border border-n-6 bg-n-8/95 backdrop-blur-md shadow-2xl z-30 overflow-hidden"
                      >
                        <button
                          onClick={() => startRename(u)}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-n-2 hover:bg-n-7 hover:text-n-1 transition text-left"
                        >
                          <Pencil className="w-3.5 h-3.5 text-blue-400" /> Rename User
                        </button>
                        <div className="border-t border-n-6" />
                        <button
                          onClick={() => deleteUser(u.id)}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300 transition text-left"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-400" /> Delete User
                        </button>
                        <button
                          onClick={() => deleteUserWithResources(u)}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition text-left"
                        >
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-400" /> Delete + Resources
                        </button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-n-4 text-sm">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Subject Management ──────────────────────────────────────────────────────
function SubjectManagement() {
  const { user } = useAuth();
  const {
    subjects,
    loadingSubjects,
    fetchSubjects,
    addSubject,
    removeSubjectById,
    users,
    fetchUsers,
  } = useAdminDashboardStore();
  const [scope,       setScope]       = useState('global'); // 'own' | 'global'
  const [searchQuery, setSearchQuery] = useState('');
  const [form,        setForm]        = useState({ branch: '', semester: '', name_full: '', acronym: '' });

  useEffect(() => {
    fetchSubjects().catch(() => {});
    fetchUsers().catch(() => {});
  }, [fetchSubjects, fetchUsers]);

  const handleAdd = async (e) => {
    e.preventDefault();
    const { subject } = await subjectService.create({ ...form, semester: Number(form.semester) });
    addSubject(subject);
    setForm({ branch: '', semester: '', name_full: '', acronym: '' });
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete subject and all its resources?')) return;
    await subjectService.remove(id);
    removeSubjectById(id);
  };

  const filteredSubjects = subjects.filter(s => {
    if (scope === 'own' && String(s.added_by) !== String(user?.id)) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const creator = users.find(u => String(u.id) === String(s.added_by));
      const creatorName = creator?.username?.toLowerCase() || '';
      const matchesName = s.name_full?.toLowerCase().includes(q);
      const matchesAcronym = s.acronym?.toLowerCase().includes(q);
      const matchesBranch = s.branch?.toLowerCase().includes(q);
      const matchesSem = String(s.semester) === q || `sem ${s.semester}`.includes(q);
      const matchesCreator = creatorName.includes(q);
      if (!matchesName && !matchesAcronym && !matchesBranch && !matchesSem && !matchesCreator) {
        return false;
      }
    }
    return true;
  });

  if (loadingSubjects && subjects.length === 0) return (
    <div className="flex justify-center py-12">
      <GooeyLoader primaryColor="#AC6AFF" secondaryColor="#858DFF" borderColor="#252134" />
    </div>
  );

  const ownCount = subjects.filter(s => String(s.added_by) === String(user?.id)).length;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="h4">Subject Management</h2>
        <span className="px-3 py-1 rounded-full bg-n-7 border border-n-6 text-sm text-blue-500 font-medium shadow-sm">
          {subjects.length} Total Subjects
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Form */}
        <div className="lg:col-span-1">
          <form onSubmit={handleAdd} className="sticky top-24 rounded-2xl border border-n-6 bg-n-7/50 backdrop-blur p-6 shadow-2xl transition hover:border-blue-500/50">
            <h3 className="font-semibold mb-5 text-sm text-n-2 uppercase tracking-wider">Add New Subject</h3>
            <div className="space-y-4">
              {[
                { name: 'branch',    placeholder: 'Branch (e.g. CSE)' },
                { name: 'semester',  placeholder: 'Semester (1-8)', type: 'number' },
                { name: 'name_full', placeholder: 'Full Name (e.g. Data Structures)' },
                { name: 'acronym',   placeholder: 'Acronym (e.g. DS)' },
              ].map(f => (
                <div key={f.name}>
                  <label className="block text-xs text-n-4 mb-1.5 uppercase tracking-wide">{f.placeholder.split('(')[0].trim()}</label>
                  <input
                    name={f.name} required
                    type={f.type || 'text'}
                    placeholder={f.placeholder}
                    value={form[f.name]}
                    onChange={e => setForm(p => ({ ...p, [e.target.name]: e.target.value }))}
                    className="w-full rounded-xl border border-n-6 bg-n-8/50 px-4 py-2.5 text-sm transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none placeholder:text-n-5"
                  />
                </div>
              ))}
              <button type="submit" className="w-full mt-2 py-3 rounded-xl bg-blue-500 text-white font-bold text-sm hover:opacity-90 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-500/20 transition-all duration-200">
                Create Subject
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Controls + Table */}
        <div className="lg:col-span-2 space-y-4">
          {/* Controls: Scope Toggle & Search Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="inline-flex p-1 rounded-xl bg-n-8/80 border border-n-6 self-start shadow-inner">
              <button
                type="button"
                onClick={() => setScope('own')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  scope === 'own'
                    ? 'bg-blue-500 text-white shadow-md shadow-blue-500/25'
                    : 'text-n-4 hover:text-n-2'
                }`}
              >
                Own Subjects ({ownCount})
              </button>
              <button
                type="button"
                onClick={() => setScope('global')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  scope === 'global'
                    ? 'bg-blue-500 text-white shadow-md shadow-blue-500/25'
                    : 'text-n-4 hover:text-n-2'
                }`}
              >
                Global Subjects ({subjects.length})
              </button>
            </div>

            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-n-4 pointer-events-none" />
              <input
                type="text"
                placeholder="Search subject, branch, or created by…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 rounded-xl border border-n-6 bg-n-7 text-xs text-n-1 placeholder:text-n-5 focus:border-blue-500 focus:outline-none transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-n-4 hover:text-n-2 p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-n-6 bg-n-7/30 backdrop-blur shadow-2xl">
            <table className="w-full text-sm text-left">
              <thead className="bg-n-8/50">
                <tr className="border-b border-n-6 text-n-4 text-xs uppercase tracking-wider">
                  <th className="py-4 pl-6 pr-4 font-medium rounded-tl-2xl">Subject</th>
                  <th className="py-4 px-4 font-medium">Acronym</th>
                  <th className="py-4 px-4 font-medium">Branch</th>
                  <th className="py-4 px-4 font-medium">Sem</th>
                  <th className="py-4 px-4 font-medium">Created By</th>
                  <th className="py-4 pr-6 pl-4 font-medium text-right rounded-tr-2xl">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-n-6/50">
                {filteredSubjects.map(s => (
                  <tr key={s.id} className="hover:bg-n-7/80 transition-colors group">
                    <td className="py-4 pl-6 pr-4 font-medium text-n-1 group-hover:text-blue-500 transition-colors">{s.name_full}</td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {s.acronym}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-600/10 text-blue-300 border border-blue-600/20">
                        {s.branch}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-n-3">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-n-6 text-xs font-semibold">
                        {s.semester}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-xs">
                      {(() => {
                        const creator = users.find(u => String(u.id) === String(s.added_by));
                        if (creator) {
                          return (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-n-6 text-n-2">
                              {creator.username}
                              {String(s.added_by) === String(user?.id) && (
                                <span className="ml-1 text-[10px] text-blue-400 font-mono">(You)</span>
                              )}
                            </span>
                          );
                        }
                        if (s.added_by) {
                          return <span className="text-n-4 text-xs font-mono">#{s.added_by}</span>;
                        }
                        return <span className="text-n-5 text-xs">System</span>;
                      })()}
                    </td>
                    <td className="py-4 pr-6 pl-4 text-right">
                      <button onClick={() => handleDelete(s.id)} className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredSubjects.length === 0 && (
              <div className="p-8 text-center text-n-4 text-sm">
                {scope === 'own'
                  ? "You haven't created any subjects yet."
                  : searchQuery
                  ? "No subjects match your search."
                  : "No subjects found."}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
