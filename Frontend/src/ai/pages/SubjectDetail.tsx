import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import { fetchSubjectDetails } from '../api/syllabus.api';
import { ChevronLeft, Layout, Sparkles, BookOpen } from 'lucide-react';

const SubjectDetail = () => {
  const { branch, semester, subjectSlug } = useParams();
  const navigate = useNavigate();
  const { dispatch } = useSession();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const subjectName = subjectSlug ? decodeURIComponent(subjectSlug) : '';

  useEffect(() => {
    if (branch && semester && subjectName) {
      setError(null);
      fetchSubjectDetails(branch, semester, subjectName)
        .then((res) => {
          if (res.error) { setError(res.error); return; }
          setData(res);
          dispatch({ type: 'SET_SUBJECT_DATA', payload: res });
          dispatch({ type: 'SET_SUBJECT', payload: subjectName });
        })
        .catch(() => setError('Failed to load subject data'));
    }
  }, [branch, semester, subjectName, dispatch]);

  const selectSection = (section) => {
    dispatch({ type: 'SET_SECTION', payload: section });
    navigate(`/ai/learn/${branch}/${semester}/${subjectSlug}?section=${section}`);
  };

  if (error) return (
    <div className="p-12 text-center text-red-400">
      <p className="text-2xl font-bold mb-2">Error</p>
      <p>{error}</p>
      <button onClick={() => navigate('/ai')} className="mt-6 px-6 py-3 glass rounded-xl">Back Home</button>
    </div>
  );
  if (!data) return <div className="p-12 text-center text-text-muted">Loading {subjectName}...</div>;

  return (
    <div className="min-h-screen bg-background text-text p-8 max-w-6xl mx-auto">
      <button
        onClick={() => navigate('/ai')}
        className="flex items-center gap-2 text-text-muted hover:text-text transition-colors mb-12"
      >
        <ChevronLeft size={20} /> Back to Dashboard
      </button>

      <div className="mb-16">
        <h1 className="text-6xl font-black mb-4 uppercase tracking-tighter">{data.subjectName}</h1>
        <div className="flex items-center gap-4">
          <span className="px-4 py-1.5 bg-primary/20 text-primary rounded-full font-bold text-sm">{branch}</span>
          <span className="px-4 py-1.5 bg-secondary/20 text-secondary rounded-full font-bold text-sm uppercase">{semester?.replace('_', ' ')}</span>
        </div>
      </div>

      <h2 className="text-2xl font-bold mb-8">How would you like to start?</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { id: 'A', title: 'Section A', icon: <BookOpen />, desc: 'Focus on first half of the syllabus' },
          { id: 'B', title: 'Section B', icon: <Sparkles />, desc: 'Focus on second half of the syllabus' },
          { id: 'BOTH', title: 'Full Syllabus', icon: <Layout />, desc: 'Study everything comprehensively' }
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => selectSection(item.id)}
            className="glass p-10 rounded-3xl text-left group hover:bg-primary/10 transition-all duration-300 hover:-translate-y-2 border border-white/5"
          >
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform mb-6">
              {item.icon}
            </div>
            <h3 className="text-2xl font-black mb-3">{item.title}</h3>
            <p className="text-text-muted text-lg leading-relaxed">{item.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default SubjectDetail;
