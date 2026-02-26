import { useEffect, useState } from 'react';
import { analyticsService, userService, subjectService } from '../services/index';

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
      {activeTab === 'resources' && <p className="text-n-4">Resource management — uses the same resource list with admin delete/edit access.</p>}
    </section>
  );
}

// ── Platform Analytics ──────────────────────────────────────────────────────
function PlatformAnalytics() {
  const [data, setData] = useState(null);

  useEffect(() => {
    analyticsService.platformAnalytics().then(setData).catch(() => {});
  }, []);

  if (!data) return <p className="text-n-4">Loading…</p>;

  const summaryCards = [
    { label: 'Total Users',     value: data.totalUsers },
    { label: 'Total Resources', value: data.totalResources },
    { label: 'Total Subjects',  value: data.totalSubjects },
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
          {Object.entries(data.usersByRole || {}).map(([role, count]) => (
            <div key={role} className="flex justify-between py-1.5 border-b border-n-6 text-sm">
              <span className="capitalize text-n-2">{role}</span>
              <span className="text-color-2 font-mono">{count}</span>
            </div>
          ))}
        </div>
        <div>
          <h3 className="font-semibold mb-3">Resources by Type</h3>
          {Object.entries(data.resourcesByType || {}).map(([type, count]) => (
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
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    userService.listAll()
      .then(({ users }) => setUsers(users || []))
      .finally(() => setLoading(false));
  }, []);

  const changeRole = async (id, role) => {
    await userService.updateRole(id, role);
    setUsers(prev => prev.map(u => u.id === id ? { ...u, role } : u));
  };

  const deleteUser = async (id) => {
    if (!confirm('Delete this user?')) return;
    await userService.remove(id);
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  if (loading) return <p className="text-n-4">Loading users…</p>;

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
  const [subjects, setSubjects] = useState([]);
  const [form,     setForm]     = useState({ branch: '', semester: '', name_full: '', acronym: '' });
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    subjectService.list()
      .then(({ subjects }) => setSubjects(subjects || []))
      .finally(() => setLoading(false));
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    const { subject } = await subjectService.create({ ...form, semester: Number(form.semester) });
    setSubjects(prev => [...prev, subject]);
    setForm({ branch: '', semester: '', name_full: '', acronym: '' });
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete subject and all its resources?')) return;
    await subjectService.remove(id);
    setSubjects(prev => prev.filter(s => s.id !== id));
  };

  if (loading) return <p className="text-n-4">Loading…</p>;

  return (
    <div className="max-w-3xl">
      <h2 className="h5 mb-4">Subject Management</h2>

      {/* Add form */}
      <form onSubmit={handleAdd} className="grid grid-cols-2 gap-3 mb-8">
        {[
          { name: 'branch',    placeholder: 'Branch (e.g. CSE)' },
          { name: 'semester',  placeholder: 'Semester', type: 'number' },
          { name: 'name_full', placeholder: 'Full Name (e.g. Data Structures)' },
          { name: 'acronym',   placeholder: 'Acronym (e.g. DS)' },
        ].map(f => (
          <input
            key={f.name} name={f.name} required
            type={f.type || 'text'}
            placeholder={f.placeholder}
            value={form[f.name]}
            onChange={e => setForm(p => ({ ...p, [e.target.name]: e.target.value }))}
            className="rounded-lg border border-n-6 bg-n-7 px-3 py-2 text-sm"
          />
        ))}
        <button type="submit" className="col-span-2 py-2 rounded-xl bg-color-1 text-n-8 font-semibold text-sm hover:bg-color-1/90 transition">
          Add Subject
        </button>
      </form>

      {/* Table */}
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-n-6 text-n-4">
            <th className="text-left pb-2 pr-4">Subject</th>
            <th className="text-left pb-2 pr-4">Acronym</th>
            <th className="text-left pb-2 pr-4">Branch</th>
            <th className="text-left pb-2 pr-4">Sem</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {subjects.map(s => (
            <tr key={s.id} className="border-b border-n-6 hover:bg-n-7 transition">
              <td className="py-2.5 pr-4">{s.name_full}</td>
              <td className="py-2.5 pr-4 font-mono text-color-2">{s.acronym}</td>
              <td className="py-2.5 pr-4 text-n-4">{s.branch}</td>
              <td className="py-2.5 pr-4 text-n-4">{s.semester}</td>
              <td className="py-2.5">
                <button onClick={() => handleDelete(s.id)} className="text-xs text-red-400 hover:text-red-300">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
