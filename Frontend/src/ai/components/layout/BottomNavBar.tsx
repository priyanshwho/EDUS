import React from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Zap, HelpCircle, MessageSquare, BookOpen, OctagonX } from 'lucide-react';
import { useSession } from '../../context/SessionContext';
import { clsx } from 'clsx';

const BottomNavBar = () => {
  const navigate = useNavigate();
  const { branch, semester, subjectSlug, chapterId } = useParams();
  const location = useLocation();
  const { state, dispatch } = useSession();

  const modes = [
    { id: 'flashcards', icon: <Zap size={20} />, label: 'Cards' },
    { id: 'mcq',        icon: <HelpCircle size={20} />, label: 'Quiz' },
    { id: 'ai',         icon: <MessageSquare size={20} />, label: 'AI Talk' },
    { id: 'pyq',        icon: <BookOpen size={20} />, label: 'PYQ' },
  ];

  const switchMode = (modeId) => {
    dispatch({ type: 'SWITCH_MODE', payload: modeId });
    if (modeId === 'pyq') {
      navigate(`/ai/pyq/${branch}/${semester}/${subjectSlug}/${state.selectedSection || 'A'}`);
    } else {
      navigate(`/ai/${modeId}/${branch}/${semester}/${subjectSlug}/${chapterId}`);
    }
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-center gap-1"
      style={{ height: '64px', background: 'rgba(15,23,42,0.95)', borderTop: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(16px)' }}
    >
      <div className="flex items-center gap-1">
        {modes.map((mode) => {
          const isActive = location.pathname.startsWith(`/ai/${mode.id}/`);
          return (
            <button
              key={mode.id}
              onClick={() => switchMode(mode.id)}
              className={clsx(
                'flex flex-col items-center gap-1 px-5 py-2 rounded-2xl transition-all duration-200',
                isActive
                  ? 'bg-primary/15 text-primary'
                  : 'text-text-muted hover:text-text hover:bg-white/5'
              )}
            >
              {mode.icon}
              <span className="text-[9px] font-bold uppercase tracking-widest">{mode.label}</span>
            </button>
          );
        })}

        <div className="w-px h-8 bg-white/10 mx-2" />

        <button
          onClick={() => dispatch({ type: 'PAUSE_SESSION' })}
          className="flex flex-col items-center gap-1 px-5 py-2 rounded-2xl text-red-400 hover:text-red-300 hover:bg-red-400/10 transition-all duration-200"
        >
          <OctagonX size={20} />
          <span className="text-[9px] font-bold uppercase tracking-widest">Stop</span>
        </button>
      </div>
    </nav>
  );
};

export default BottomNavBar;
