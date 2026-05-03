import React from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import { ChevronLeft, Zap, HelpCircle, MessageSquare } from 'lucide-react';

const ChapterSelector = () => {
  const { branch, semester, subjectSlug } = useParams();
  const [searchParams] = useSearchParams();
  const section = searchParams.get('section') || 'A';
  const navigate = useNavigate();
  const { state, dispatch } = useSession();

  const data = state.subjectData;
  if (!data) return <div className="p-12 text-center">No subject data found. Please restart.</div>;

  const chapters = section === 'BOTH'
    ? [...data.sections.A, ...data.sections.B]
    : data.sections[section] || [];

  const startMode = (chapterId, mode) => {
    dispatch({ type: 'SET_CHAPTER', payload: chapterId });
    dispatch({ type: 'SET_MODE', payload: mode });
    navigate(`/ai/${mode}/${branch}/${semester}/${subjectSlug}/${chapterId}`);
  };

  return (
    <div className="min-h-screen bg-background text-text p-8 max-w-6xl mx-auto">
      <header className="mb-12 flex items-center justify-between">
        <button
          onClick={() => navigate(`/ai/subject/${branch}/${semester}/${subjectSlug}`)}
          className="flex items-center gap-2 text-text-muted hover:text-text transition-colors"
        >
          <ChevronLeft size={20} /> Back to Sections
        </button>
        <div className="text-right">
          <h1 className="text-2xl font-black">{data.subjectName}</h1>
          <p className="text-text-muted uppercase tracking-widest text-xs">Section {section}</p>
        </div>
      </header>

      <div className="space-y-6">
        {chapters.map((chapter, index) => (
          <div key={chapter.chapterId} className="glass rounded-3xl p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-8 group hover:border-white/20 transition-all">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-primary font-mono font-bold">CHAPTER {index + 1}</span>
                <span className="w-1 h-1 rounded-full bg-white/20"></span>
                <span className="text-text-muted text-sm">{chapter.hours} Hours</span>
              </div>
              <h3 className="text-2xl font-black group-hover:text-primary transition-colors">{chapter.title}</h3>
              <p className="text-text-muted mt-2 text-sm line-clamp-2">{chapter.topics.join(' • ')}</p>
            </div>

            <div className="flex items-center gap-3">
              {[
                { id: 'flashcards', label: 'Flashcards', icon: <Zap size={18} />, color: 'bg-yellow-500/10 text-yellow-500' },
                { id: 'mcq', label: 'MCQ', icon: <HelpCircle size={18} />, color: 'bg-blue-500/10 text-blue-500' },
                { id: 'ai', label: 'Interact', icon: <MessageSquare size={18} />, color: 'bg-green-500/10 text-green-500' }
              ].map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => startMode(chapter.chapterId, mode.id)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold transition-all hover:scale-105 active:scale-95 ${mode.color}`}
                >
                  {mode.icon} <span>{mode.label}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChapterSelector;
