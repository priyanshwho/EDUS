import { useEffect, useState } from 'react';
import { userService, subjectService, resourceService } from '../services/index';
import { useAdminDashboardStore } from '../stores/adminDashboard.store';

/**
 * AdminDashboard
 * Full system access: analytics, user management, all resource management.
 */
export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('analytics');
  const tabs = ['analytics', 'users', 'subjects', 'resources'];

  return (
    <section className="min-h-screen bg-n-8 text-n-1 p-6">
      <header className="mb-8">
        <h1 className="h3">Admin Dashboard</h1>
        <p className="body-2 text-n-4">Full system access — EduSphere</p>
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

      {activeTab === 'analytics' && <PlatformAnalytics />}
      {activeTab === 'users'     && <UserManagement />}
      {activeTab === 'subjects'  && <SubjectManagement />}
      {activeTab === 'resources' && <ResourceManagement />}
    </section>
  );
}

// ── Resource Management (Admin) ────────────────────────────────────────────
const RESOURCE_TYPES = ['notes', 'assignment', 'pyq', 'lecture'];
const PYQ_TYPES      = ['minor1', 'minor2', 'major'];

function ResourceManagement() {
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
  const [filters,      setFilters]      = useState({ q: '', resource_type: '' });
  const [editId,       setEditId]       = useState(null);
  const [editForm,     setEditForm]     = useState({});
  const [saving,       setSaving]       = useState(false);
  const [driveForm,    setDriveForm]    = useState({
    subject_id: '', resource_type: 'notes', title: '', description: '',
    year: '', pyq_type: '', external_link: '',
  });
  const [driveLoading, setDriveLoading] = useState(false);
  const [driveOpen,    setDriveOpen]    = useState(false);

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
      const { resource } = await resourceService.update(editId, editForm);
      updateResource(resource);
      setEditId(null);
    } finally {
      setSaving(false);
    }
  };

  /* ── add Drive link ── */
  const addDriveLink = async (e) => {
    e.preventDefault();
    setDriveLoading(true);
    try {
      const payload = {
        ...driveForm,
        year: driveForm.year ? Number(driveForm.year) : undefined,
      };
      if (!payload.pyq_type)     delete payload.pyq_type;
      if (!payload.year)         delete payload.year;
      if (!payload.description)  delete payload.description;
      const { resource } = await resourceService.create(payload);
      prependResource(resource);
      setDriveForm({ subject_id: '', resource_type: 'notes', title: '', description: '', year: '', pyq_type: '', external_link: '' });
      setDriveOpen(false);
    } finally {
      setDriveLoading(false);
    }
  };

  /* ── client-side filter ── */
  const filtered = resources.filter(r => {
    if (filters.resource_type && r.resource_type !== filters.resource_type) return false;
    if (filters.q) {
      const q = filters.q.toLowerCase();
      if (!r.title?.toLowerCase().includes(q) && !r.slug?.toLowerCase().includes(q)) return false;
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
          onClick={() => setDriveOpen(o => !o)}
          className="px-4 py-1.5 text-xs rounded-lg bg-color-1 text-n-8 font-semibold hover:bg-color-1/90 transition"
        >
          {driveOpen ? 'Close' : '+ Add Drive Link'}
        </button>
      </div>

      {/* ── Add Drive Link Form ── */}
      {driveOpen && (
        <form onSubmit={addDriveLink} className="mb-8 rounded-xl border border-n-6 bg-n-7 p-5">
          <h3 className="font-semibold mb-4 text-sm">New Drive-Link Resource (Admin Only)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select
              required value={driveForm.subject_id}
              onChange={e => setDriveForm(p => ({ ...p, subject_id: e.target.value }))}
              className="rounded-lg border border-n-6 bg-n-6 px-3 py-2 text-sm"
            >
              <option value="">Select Subject…</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.name_full} ({s.branch} S{s.semester})</option>
              ))}
            </select>

            <select
              required value={driveForm.resource_type}
              onChange={e => setDriveForm(p => ({ ...p, resource_type: e.target.value, pyq_type: '' }))}
              className="rounded-lg border border-n-6 bg-n-6 px-3 py-2 text-sm"
            >
              {RESOURCE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>

            <input required placeholder="Title" value={driveForm.title}
              onChange={e => setDriveForm(p => ({ ...p, title: e.target.value }))}
              className="rounded-lg border border-n-6 bg-n-6 px-3 py-2 text-sm sm:col-span-2"
            />

            <input placeholder="Description (optional)" value={driveForm.description}
              onChange={e => setDriveForm(p => ({ ...p, description: e.target.value }))}
              className="rounded-lg border border-n-6 bg-n-6 px-3 py-2 text-sm sm:col-span-2"
            />

            <input required placeholder="Google Drive / external URL" value={driveForm.external_link}
              onChange={e => setDriveForm(p => ({ ...p, external_link: e.target.value }))}
              className="rounded-lg border border-n-6 bg-n-6 px-3 py-2 text-sm sm:col-span-2"
            />

            <input placeholder="Year (e.g. 2024)" type="number" value={driveForm.year}
              onChange={e => setDriveForm(p => ({ ...p, year: e.target.value }))}
              className="rounded-lg border border-n-6 bg-n-6 px-3 py-2 text-sm"
            />

            {driveForm.resource_type === 'pyq' && (
              <select value={driveForm.pyq_type}
                onChange={e => setDriveForm(p => ({ ...p, pyq_type: e.target.value }))}
                className="rounded-lg border border-n-6 bg-n-6 px-3 py-2 text-sm"
              >
                <option value="">PYQ Type…</option>
                {PYQ_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            )}
          </div>
          <button
            type="submit" disabled={driveLoading}
            className="mt-4 w-full py-2 rounded-xl bg-color-1 text-n-8 font-semibold text-sm hover:bg-color-1/90 transition disabled:opacity-50"
          >
            {driveLoading ? 'Adding…' : 'Add Resource'}
          </button>
        </form>
      )}

      {/* ── Filters ── */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <input
          placeholder="Search title / slug…"
          value={filters.q}
          onChange={e => setFilters(p => ({ ...p, q: e.target.value }))}
          className="flex-1 min-w-[180px] rounded-lg border border-n-6 bg-n-7 px-3 py-2 text-sm"
        />
        <select
          value={filters.resource_type}
          onChange={e => setFilters(p => ({ ...p, resource_type: e.target.value }))}
          className="rounded-lg border border-n-6 bg-n-7 px-3 py-2 text-sm"
        >
          <option value="">All types</option>
          {RESOURCE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <span className="text-xs text-n-4 self-center">{filtered.length} results</span>
      </div>

      {/* ── Resource Table ── */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-n-6 text-n-4">
              <th className="text-left pb-3 pr-3">Title</th>
              <th className="text-left pb-3 pr-3">Type</th>
              <th className="text-left pb-3 pr-3">Subject</th>
              <th className="text-left pb-3 pr-3">Year</th>
              <th className="text-left pb-3 pr-3">Source</th>
              <th className="text-left pb-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => (
              editId === r.id ? (
                /* ── Inline edit row ── */
                <tr key={r.id} className="border-b border-color-1/30 bg-n-7">
                  <td className="py-2 pr-3" colSpan={3}>
                    <div className="flex flex-col gap-1.5">
                      <input value={editForm.title}
                        onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))}
                        placeholder="Title"
                        className="rounded border border-n-5 bg-n-6 px-2 py-1 text-xs w-full"
                      />
                      <input value={editForm.description}
                        onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))}
                        placeholder="Description"
                        className="rounded border border-n-5 bg-n-6 px-2 py-1 text-xs w-full"
                      />
                      {editForm.youtube_url !== undefined && (
                        <input value={editForm.youtube_url}
                          onChange={e => setEditForm(p => ({ ...p, youtube_url: e.target.value }))}
                          placeholder="YouTube URL"
                          className="rounded border border-n-5 bg-n-6 px-2 py-1 text-xs w-full"
                        />
                      )}
                      {editForm.external_link !== undefined && (
                        <input value={editForm.external_link}
                          onChange={e => setEditForm(p => ({ ...p, external_link: e.target.value }))}
                          placeholder="Drive / external URL"
                          className="rounded border border-n-5 bg-n-6 px-2 py-1 text-xs w-full"
                        />
                      )}
                    </div>
                  </td>
                  <td className="py-2 pr-3">
                    <input type="number" value={editForm.year}
                      onChange={e => setEditForm(p => ({ ...p, year: e.target.value }))}
                      placeholder="Year"
                      className="rounded border border-n-5 bg-n-6 px-2 py-1 text-xs w-20"
                    />
                  </td>
                  <td className="py-2 pr-3">
                    {r.resource_type === 'pyq' ? (
                      <select value={editForm.pyq_type}
                        onChange={e => setEditForm(p => ({ ...p, pyq_type: e.target.value }))}
                        className="rounded border border-n-5 bg-n-6 px-1 py-1 text-xs"
                      >
                        <option value="">—</option>
                        {PYQ_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    ) : <span className="text-n-5 text-xs">—</span>}
                  </td>
                  <td className="py-2">
                    <div className="flex gap-2">
                      <button onClick={saveEdit} disabled={saving}
                        className="text-xs text-green-400 hover:text-green-300 disabled:opacity-50">Save</button>
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
                    {r.pyq_type && <span className="ml-1.5 text-[10px] font-mono text-color-2 uppercase">{r.pyq_type}</span>}
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
                    {r.aws_s3_key   && <span className="text-blue-400">S3</span>}
                    {r.youtube_url  && <span className="text-red-400">YT</span>}
                    {r.external_link && <span className="text-green-400">Drive</span>}
                  </td>
                  <td className="py-2.5">
                    <div className="flex gap-3">
                      <button onClick={() => startEdit(r)}
                        className="text-xs text-color-1 hover:text-color-1/80 transition">Edit</button>
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
            <p className="text-3xl font-bold text-color-1">{c.value}</p>
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
              <span className="text-color-2 font-mono">{count}</span>
            </div>
          ))}
        </div>
        <div>
          <h3 className="font-semibold mb-3">Resources by Type</h3>
          {Object.entries(platformAnalytics.resourcesByType || {}).map(([type, count]) => (
            <div key={type} className="flex justify-between py-1.5 border-b border-n-6 text-sm">
              <span className="capitalize text-n-2">{type}</span>
              <span className="text-color-2 font-mono">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── User Management ─────────────────────────────────────────────────────────
function UserManagement() {
  const {
    users,
    loadingUsers,
    fetchUsers,
    setUserRole,
    removeUserById,
  } = useAdminDashboardStore();

  useEffect(() => {
    fetchUsers().catch(() => {});
  }, [fetchUsers]);

  const changeRole = async (id, role) => {
    await userService.updateRole(id, role);
    setUserRole(id, role);
  };

  const deleteUser = async (id) => {
    if (!confirm('Delete this user?')) return;
    await userService.remove(id);
    removeUserById(id);
  };

  if (loadingUsers && users.length === 0) return <p className="text-n-4">Loading users…</p>;

  return (
    <div>
      <h2 className="h5 mb-4">User Management ({users.length})</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-n-6 text-n-4">
              <th className="text-left pb-3 pr-4">Username</th>
              <th className="text-left pb-3 pr-4">Email</th>
              <th className="text-left pb-3 pr-4">Role</th>
              <th className="text-left pb-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-b border-n-6 hover:bg-n-7 transition">
                <td className="py-3 pr-4 font-medium">{u.username}</td>
                <td className="py-3 pr-4 text-n-4">{u.email}</td>
                <td className="py-3 pr-4">
                  <select
                    value={u.role}
                    onChange={e => changeRole(u.id, e.target.value)}
                    className="bg-n-6 border border-n-5 rounded px-2 py-1 text-xs"
                  >
                    <option value="student">student</option>
                    <option value="professor">professor</option>
                    <option value="admin">admin</option>
                  </select>
                </td>
                <td className="py-3">
                  <button
                    onClick={() => deleteUser(u.id)}
                    className="text-xs text-red-400 hover:text-red-300 transition"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Subject Management ──────────────────────────────────────────────────────
function SubjectManagement() {
  const {
    subjects,
    loadingSubjects,
    fetchSubjects,
    addSubject,
    removeSubjectById,
  } = useAdminDashboardStore();
  const [form,     setForm]     = useState({ branch: '', semester: '', name_full: '', acronym: '' });

  useEffect(() => {
    fetchSubjects().catch(() => {});
  }, [fetchSubjects]);

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

  if (loadingSubjects && subjects.length === 0) return <p className="text-n-4">Loading…</p>;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="h4">Subject Management</h2>
        <span className="px-3 py-1 rounded-full bg-n-7 border border-n-6 text-sm text-color-1 font-medium shadow-sm">
          {subjects.length} Total Subjects
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Form */}
        <div className="lg:col-span-1">
          <form onSubmit={handleAdd} className="sticky top-24 rounded-2xl border border-n-6 bg-n-7/50 backdrop-blur p-6 shadow-2xl transition hover:border-color-1/50">
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
                    className="w-full rounded-xl border border-n-6 bg-n-8/50 px-4 py-2.5 text-sm transition focus:border-color-1 focus:ring-1 focus:ring-color-1 focus:outline-none placeholder:text-n-5"
                  />
                </div>
              ))}
              <button type="submit" className="w-full mt-2 py-3 rounded-xl bg-color-1 text-n-8 font-bold text-sm hover:opacity-90 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-color-1/20 transition-all duration-200">
                Create Subject
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Table */}
        <div className="lg:col-span-2 overflow-x-auto rounded-2xl border border-n-6 bg-n-7/30 backdrop-blur shadow-2xl">
          <table className="w-full text-sm text-left">
            <thead className="bg-n-8/50">
              <tr className="border-b border-n-6 text-n-4 text-xs uppercase tracking-wider">
                <th className="py-4 pl-6 pr-4 font-medium rounded-tl-2xl">Subject</th>
                <th className="py-4 px-4 font-medium">Acronym</th>
                <th className="py-4 px-4 font-medium">Branch</th>
                <th className="py-4 px-4 font-medium">Sem</th>
                <th className="py-4 pr-6 pl-4 font-medium text-right rounded-tr-2xl">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-n-6/50">
              {subjects.map(s => (
                <tr key={s.id} className="hover:bg-n-7/80 transition-colors group">
                  <td className="py-4 pl-6 pr-4 font-medium text-n-1 group-hover:text-color-1 transition-colors">{s.name_full}</td>
                  <td className="py-4 px-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium bg-color-2/10 text-color-2 border border-color-2/20">
                      {s.acronym}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-300 border border-blue-500/20">
                      {s.branch}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-n-3">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-n-6 text-xs font-semibold">
                      {s.semester}
                    </span>
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
          {subjects.length === 0 && (
            <div className="p-8 text-center text-n-4 text-sm">
              No subjects found. Use the form to add one.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
