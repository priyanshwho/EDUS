import React, { useEffect, useState } from 'react';
import Sidebar from '../components/layout/Sidebar';
import SubjectCard from '../components/cards/SubjectCard';
import { useSession } from '../context/SessionContext';
import { fetchSubjects } from '../api/syllabus.api';
import { Search, ChevronRight, BookOpen, Zap, X } from 'lucide-react';
import eduAiImg from '../../assets/eduai.png';

const LoadingCard = () => (
  <div className="edus-card rounded-2xl h-40 animate-pulse bg-slate-800/50" />
);

const Home = () => {
  const { state } = useSession();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadSubjects = async () => {
      if (state.branch && state.semester) {
        setLoading(true);
        try {
          const data = await fetchSubjects(state.branch, state.semester);
          setSubjects(data);
        } catch (error) {
          console.error('Failed to load subjects', error);
        } finally {
          setLoading(false);
        }
      }
    };
    loadSubjects();
  }, [state.branch, state.semester]);

  const filteredSubjects = subjects.filter((s) =>
    s.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              <h1 className="text-3xl md:text-4xl font-bold edus-gradient-text">Edu.ai</h1>
            </div>
            <p className="text-sm text-slate-400">AI-driven challenges to sharpen your learning</p>
          </div>

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
        </header>

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
                  {filteredSubjects.map((subject, idx) => (
                    <SubjectCard
                      key={subject}
                      name={subject}
                      branch={state.branch}
                      semester={state.semester}
                    />
                  ))}
                </div>
              )}
            </>
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
