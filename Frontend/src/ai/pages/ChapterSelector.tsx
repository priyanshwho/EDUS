import React from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import { ChevronLeft, Zap, HelpCircle, MessageSquare, Clock, BookOpen } from 'lucide-react';

const MODE_CONFIG = [
  { id: 'flashcards', label: 'Flashcards', icon: <Zap size={16} /> },
  { id: 'mcq', label: 'MCQ Quiz', icon: <HelpCircle size={16} /> },
  { id: 'ai', label: 'AI Tutor', icon: <MessageSquare size={16} /> },
  { id: 'pyq', label: 'PYQ Exam', icon: <BookOpen size={16} /> },
];

const ChapterSelector = () => {
  const { branch, semester, subjectSlug } = useParams();
  const [searchParams] = useSearchParams();
  const section = searchParams.get('section') || 'A';
  const navigate = useNavigate();
  const { state, dispatch } = useSession();

  const data = state.subjectData;
  if (!data) return (
    <div className="min-h-screen flex items-center justify-center bg-[#0E0C15]">
      <div className="edus-card p-10 max-w-sm mx-auto text-center">
        <p className="font-bold text-white mb-2">No subject data found</p>
        <p className="text-sm mb-6 text-slate-400">Please restart your session.</p>
        <button onClick={() => navigate('/ai')} className="edus-btn">← Back to Home</button>
      </div>
    </div>
  );

  const chapters = section === 'BOTH'
    ? [...data.sections.A, ...data.sections.B]
    : data.sections[section] || [];

  const startMode = (chapterId, mode) => {
    dispatch({ type: 'SET_CHAPTER', payload: chapterId });
    dispatch({ type: 'SET_MODE', payload: mode });
    if (mode === 'pyq') {
      navigate(`/ai/pyq/${branch}/${semester}/${subjectSlug}/${section}`);
    } else {
      navigate(`/ai/${mode}/${branch}/${semester}/${subjectSlug}/${chapterId}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#0E0C15] p-6 md:p-10 text-slate-200">
      <div className="max-w-5xl mx-auto">
        <header className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate(`/ai/subject/${branch}/${semester}/${subjectSlug}`)}
            className="flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-sky-400 transition-colors"
          >
            <ChevronLeft size={18} /> Back to Sections
          </button>
          <div className="text-right">
            <h1 className="text-lg font-bold text-white">{data.subjectName}</h1>
            <div className="flex items-center gap-2 justify-end mt-1">
              <span className="edus-badge-gradient">Section {section}</span>
            </div>
          </div>
        </header>

        <div className="space-y-4">
          {chapters.map((chapter, index) => (
            <div key={chapter.chapterId} className="edus-card p-5">
              <div className="flex flex-col lg:flex-row lg:items-center gap-5">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">
                      CH {String(index + 1).padStart(2, '0')}
                    </span>
                    <div className="w-px h-3 bg-slate-700" />
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                      <Clock size={12} /> {chapter.hours}h
                    </span>
                  </div>

                  <h3 className="font-semibold text-lg text-white mb-3 leading-tight">
                    {chapter.title}
                  </h3>

                  <div className="flex flex-wrap gap-2">
                    {chapter.topics.slice(0, 4).map((topic, ti) => (
                      <span key={ti} className="px-2.5 py-1 bg-slate-800/50 border border-slate-700 rounded-md text-[11px] text-slate-300">
                        {topic}
                      </span>
                    ))}
                    {chapter.topics.length > 4 && (
                      <span className="px-2.5 py-1 edus-gradient-bg rounded-md text-[11px] text-white">
                        +{chapter.topics.length - 4} more
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap lg:flex-nowrap shrink-0">
                  {MODE_CONFIG.map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() => startMode(chapter.chapterId, mode.id)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-[#1A1825] border border-[#252134] text-slate-300 hover:edus-gradient-border-active transition-colors"
                    >
                      {mode.icon} <span>{mode.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChapterSelector;
