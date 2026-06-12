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
    <div className="min-h-screen flex flex-col items-center justify-center p-12 text-center bg-[#0E0C15]">
      <p className="text-xl font-bold text-white mb-2">Something went wrong</p>
      <p className="mb-8 text-sm text-slate-400">{error}</p>
      <button onClick={() => navigate('/ai')} className="edus-btn-ghost">← Back Home</button>
    </div>
  );

  if (!data) return (
    <div className="min-h-screen flex items-center justify-center bg-[#0E0C15]">
      <div className="text-center">
        <p className="font-semibold text-white mb-1">Loading {subjectName}</p>
        <p className="text-sm text-slate-400">Fetching syllabus data…</p>
      </div>
    </div>
  );

  const SECTION_CONFIG = [
    { id: 'A', title: 'Section A', icon: <BookOpen size={24} />, desc: 'Focus on the first half of the syllabus' },
    { id: 'B', title: 'Section B', icon: <Sparkles size={24} />, desc: 'Focus on the second half of the syllabus' },
    { id: 'BOTH', title: 'Full Syllabus', icon: <Layout size={24} />, desc: 'Study everything comprehensively' },
  ];

  return (
    <div className="min-h-screen bg-[#0E0C15] p-6 md:p-10 text-slate-200">
      <div className="max-w-5xl mx-auto">
        <button
          onClick={() => navigate('/ai')}
          className="flex items-center gap-2 text-sm font-medium mb-10 text-slate-400 hover:text-sky-400 transition-colors"
        >
          <ChevronLeft size={18} /> Back to Dashboard
        </button>

        <div className="mb-12">
          <h1 className="text-3xl md:text-4xl font-bold edus-gradient-text mb-4 leading-tight">{data.subjectName}</h1>
          <div className="flex items-center gap-3">
            <span className="edus-badge-gradient">{branch}</span>
            <span className="edus-badge-muted uppercase">{semester?.replace('_', ' ')}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {SECTION_CONFIG.map((item) => (
            <button
              key={item.id}
              onClick={() => selectSection(item.id)}
              className="edus-card p-6 text-left hover:edus-gradient-border-active transition-colors group"
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center edus-gradient-bg text-white mb-5">
                {item.icon}
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
              <p className="text-sm text-slate-400">{item.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SubjectDetail;
