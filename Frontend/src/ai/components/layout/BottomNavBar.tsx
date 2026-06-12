import React from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Zap, HelpCircle, MessageSquare, BookOpen, OctagonX } from 'lucide-react';
import { useSession } from '../../context/SessionContext';
import { clsx } from 'clsx';

const MODES = [
  { id: 'flashcards', icon: <Zap size={18} />, label: 'Cards' },
  { id: 'mcq',        icon: <HelpCircle size={18} />, label: 'Quiz' },
  { id: 'ai',         icon: <MessageSquare size={18} />, label: 'AI Talk' },
  { id: 'pyq',        icon: <BookOpen size={18} />, label: 'PYQ' },
];

const BottomNavBar = () => {
  const navigate = useNavigate();
  const { branch, semester, subjectSlug, chapterId } = useParams();
  const location = useLocation();
  const { state, dispatch } = useSession();

  const switchMode = (modeId) => {
    dispatch({ type: 'SWITCH_MODE', payload: modeId });
    if (modeId === 'pyq') {
      navigate(`/ai/pyq/${branch}/${semester}/${subjectSlug}/${state.selectedSection || 'A'}`);
    } else {
      navigate(`/ai/${modeId}/${branch}/${semester}/${subjectSlug}/${chapterId}`);
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-center h-16 bg-[#0E0C15]/95 border-t border-[#252134] backdrop-blur-md">
      <div className="flex items-center gap-2 px-4">
        {MODES.map((mode) => {
          const isActive = location.pathname.startsWith(`/ai/${mode.id}/`);
          return (
            <button
              key={mode.id}
              onClick={() => switchMode(mode.id)}
              className={clsx(
                "flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors",
                isActive ? "text-white edus-gradient-bg" : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/50"
              )}
            >
              {mode.icon}
              <span className="text-[10px] font-semibold">{mode.label}</span>
            </button>
          );
        })}

        <div className="w-px h-6 mx-2 bg-[#252134]" />

        <button
          onClick={() => dispatch({ type: 'PAUSE_SESSION' })}
          className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-400/10 transition-colors"
        >
          <OctagonX size={18} />
          <span className="text-[10px] font-semibold">Stop</span>
        </button>
      </div>
    </nav>
  );
};

export default BottomNavBar;
