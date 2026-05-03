import React, { useEffect, useState } from 'react';
import Sidebar from '../components/layout/Sidebar';
import SubjectCard from '../components/cards/SubjectCard';
import { useSession } from '../context/SessionContext';
import { fetchSubjects } from '../api/syllabus.api';
import { Search, Loader2, Sparkles } from 'lucide-react';

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
    <div className="flex min-h-screen bg-background text-text">
      <Sidebar />

      <main className="flex-1 p-8 overflow-y-auto">
        <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-primary to-secondary flex items-center justify-center text-white">
                <Sparkles size={20} />
              </div>
              <h1 className="text-4xl font-black bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Edu.ai
              </h1>
            </div>
            <p className="text-text-muted mt-2 text-lg">AI-driven challenges to sharpen your learning.</p>
          </div>

          <div className="relative group max-w-md w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={20} />
            <input
              type="text"
              placeholder="Search subjects..."
              className="w-full bg-card/50 border border-white/5 rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:bg-card transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </header>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="animate-spin text-primary" size={48} />
          </div>
        ) : subjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSubjects.map((subject) => (
              <SubjectCard
                key={subject}
                name={subject}
                branch={state.branch}
                semester={state.semester}
              />
            ))}
          </div>
        ) : (
          <div className="glass rounded-3xl p-12 text-center max-w-2xl mx-auto mt-20">
            <div className="text-6xl mb-6">📚</div>
            <h2 className="text-2xl font-bold mb-4">Please select a Branch and Semester</h2>
            <p className="text-text-muted">Use the sidebar to filter subjects by your academic details.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Home;
