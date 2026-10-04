import React, { useEffect, useState } from 'react';
import Sidebar from '../components/layout/Sidebar';
import SubjectCard from '../components/cards/SubjectCard';
import { useSession } from '../context/SessionContext';
import { fetchSubjects, fetchMyUploads, deleteSyllabus } from '../api/syllabus.api';
import { Search, ChevronRight, BookOpen, Zap, X, Plus, FolderUp, CheckCircle } from 'lucide-react';
import eduAiImg from '../../assets/eduai.png';
import { useAuth } from '../../context/AuthContext';
import { AddSyllabusModal } from '../components/AddSyllabusModal';

const LoadingCard = () => (
  <div className="edus-card rounded-2xl h-40 animate-pulse bg-slate-800/50" />
);

const Home = () => {
  const { state, dispatch } = useSession();
  const { user, isAdmin, isProfessor } = useAuth();
  const canAddSyllabus = Boolean(isAdmin || isProfessor);

  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [notification, setNotification] = useState('');

  const isMyUploadsMode = state.viewMode === 'my_uploads';

  const loadData = async () => {
    setLoading(true);
    try {
      if (isMyUploadsMode) {
        const data = await fetchMyUploads();
        setSubjects(Array.isArray(data) ? data : []);
      } else if (state.branch && state.semester) {
        const data = await fetchSubjects(state.branch, state.semester);
        setSubjects(Array.isArray(data) ? data : []);
      } else {
        setSubjects([]);
      }
    } catch (error) {
      console.error('Failed to load syllabus data:', error);
      setSubjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [state.branch, state.semester, state.viewMode]);

  const handleSyllabusCreated = async (newSubject: string, branch: string, semester: string) => {
    setNotification(`Syllabus for "${newSubject}" created successfully!`);
    setTimeout(() => setNotification(''), 4000);

    if (isMyUploadsMode) {
      await loadData();
    } else if (state.branch === branch && state.semester === semester) {
      await loadData();
    } else {
      dispatch({ type: 'SET_BRANCH', payload: branch });
      dispatch({ type: 'SET_SEMESTER', payload: semester });
    }
  };

  const handleDeleteSyllabus = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete the syllabus for "${name}"? This action cannot be undone.`)) {
      return;
    }
    try {
      await deleteSyllabus(id);
      setNotification(`Syllabus for "${name}" deleted successfully.`);
      setTimeout(() => setNotification(''), 4000);
      await loadData();
    } catch (err: any) {
      alert(err?.message || 'Failed to delete syllabus.');
    }
  };

  const filteredSubjects = subjects.filter((s) => {
    const name = typeof s === 'string' ? s : s.name;
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="flex min-h-screen text-slate-200 bg-[#0E0C15]">
      <Sidebar />

      <main className="flex-1 overflow-y-auto pb-10">
        <header className="px-6 md:px-10 pt-10 pb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-transparent border border-white/10 overflow-hidden">
                <img src={eduAiImg} className="w-full h-full object-cover" alt="Edu AI" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold edus-gradient-text">
                {isMyUploadsMode ? (isAdmin ? 'All Uploaded Syllabi' : 'My Uploaded Syllabi') : 'Edu.ai'}
              </h1>
            </div>
            <p className="text-sm text-slate-400">
              {isMyUploadsMode
                ? (isAdmin ? 'Manage all dynamically created syllabi across departments' : 'Manage syllabi uploaded by you')
                : 'AI-driven challenges to sharpen your learning'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            {canAddSyllabus && (
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-sm font-semibold hover:opacity-95 hover:shadow-lg hover:shadow-blue-500/20 transition shrink-0"
              >
                <Plus size={16} />
                <span>Add Syllabus</span>
              </button>
            )}

            <div className="relative max-w-sm w-full group">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-sky-400 pointer-events-none transition-colors" />
              <input
                type="text"
                placeholder="Search subjects…"
                className="edus-input edus-input-search w-full py-2.5 !pl-10 pr-9 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors"
                  aria-label="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        </header>

        {notification && (
          <div className="mx-6 md:mx-10 mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-2">
              <CheckCircle size={16} />
              <span>{notification}</span>
            </div>
            <button onClick={() => setNotification('')} className="p-1 hover:text-white transition">
              <X size={14} />
            </button>
          </div>
        )}

        <AddSyllabusModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          defaultBranch={state.branch}
          defaultSemester={state.semester}
          onSuccess={handleSyllabusCreated}
        />

        <div className="mx-6 md:mx-10 mb-8 h-px bg-slate-800" />

        <section className="px-6 md:px-10">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[0, 1, 2, 3, 4, 5].map((i) => <LoadingCard key={i} />)}
            </div>
          ) : subjects.length > 0 ? (
            <>
              {filteredSubjects.length === 0 ? (
                <div className="edus-card py-16 text-center max-w-md mx-auto">
                  <Search size={32} className="mx-auto mb-4 text-slate-500" />
                  <p className="font-medium text-white">No results found</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredSubjects.map((s) => {
                    const isObj = typeof s === 'object' && s !== null;
                    const name = isObj ? s.name : s;
                    const id = isObj ? s.id : null;
                    const itemBranch = isObj ? s.branch : state.branch;
                    const itemSemester = isObj ? s.semester : state.semester;
                    const createdBy = isObj ? s.createdBy : null;
                    const isOwner = Boolean(user?.id && createdBy && String(createdBy) === String(user.id));
                    const canDelete = Boolean(id && (isAdmin || isOwner));

                    return (
                      <SubjectCard
                        key={id || `${itemBranch}-${itemSemester}-${name}`}
                        name={name}
                        branch={itemBranch}
                        semester={itemSemester}
                        id={id}
                        canDelete={canDelete}
                        onDelete={handleDeleteSyllabus}
                        creatorName={isAdmin && isObj ? s.creatorName : null}
                      />
                    );
                  })}
                </div>
              )}
            </>
          ) : isMyUploadsMode ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-slate-800/50 border border-slate-700 mb-6">
                <FolderUp size={28} className="text-slate-400" />
              </div>
              <h2 className="text-xl font-bold mb-2 text-white">No uploaded syllabi yet</h2>
              <p className="max-w-xs text-sm text-slate-400 mb-6">
                {isAdmin
                  ? 'No dynamic syllabi have been uploaded to the database yet.'
                  : 'You have not uploaded any syllabi yet. Uploaded syllabi will appear here.'}
              </p>
              {canAddSyllabus && (
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-sm font-semibold hover:opacity-95 transition"
                >
                  Add Your First Syllabus
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-slate-800/50 border border-slate-700 mb-6">
                <BookOpen size={28} className="text-slate-400" />
              </div>
              <h2 className="text-xl font-bold mb-2 text-white">Select Branch & Semester</h2>
              <p className="max-w-xs text-sm text-slate-400">
                Use the sidebar to filter subjects by your academic details.
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Home;
