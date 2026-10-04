import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Zap, HelpCircle, MessageSquare, BookOpen, OctagonX, MoreVertical } from 'lucide-react';
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
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const switchMode = (modeId) => {
    dispatch({ type: 'SWITCH_MODE', payload: modeId });
    setIsOpen(false);
    if (modeId === 'pyq') {
      navigate(`/ai/pyq/${branch}/${semester}/${subjectSlug}/${state.selectedSection || 'A'}`);
    } else {
      navigate(`/ai/${modeId}/${branch}/${semester}/${subjectSlug}/${chapterId}`);
    }
  };

  return (
    <div className="fixed bottom-20 right-4 sm:bottom-24 sm:right-6 z-[100]" ref={menuRef}>
      {/* Dropdown Menu */}
      <div 
        className={clsx(
          "absolute bottom-[72px] right-0 flex flex-col gap-2 bg-[#15131D]/95 backdrop-blur-xl border border-[#252134] rounded-2xl p-2 shadow-2xl transition-all duration-300 origin-bottom-right",
          isOpen ? "scale-100 opacity-100 visible pointer-events-auto" : "scale-50 opacity-0 invisible pointer-events-none"
        )}
      >
        {MODES.map((mode) => {
          const isActive = location.pathname.startsWith(`/ai/${mode.id}/`);
          return (
            <button
              key={mode.id}
              onClick={() => switchMode(mode.id)}
              className={clsx(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all min-w-[140px]",
                isActive 
                  ? "edus-gradient-bg text-white shadow-lg shadow-cyan-500/20" 
                  : "text-slate-300 hover:bg-white/10 hover:text-white"
              )}
            >
              <div className="w-6 flex justify-center">{mode.icon}</div>
              <span className="font-semibold text-sm">{mode.label}</span>
            </button>
          );
        })}

        <div className="h-px w-full bg-[#252134] my-1" />

        <button
          onClick={() => {
            dispatch({ type: 'PAUSE_SESSION' });
            setIsOpen(false);
          }}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-rose-400 hover:bg-rose-400/10 transition-colors min-w-[140px]"
        >
          <div className="w-6 flex justify-center"><OctagonX size={18} /></div>
          <span className="font-semibold text-sm">Stop</span>
        </button>
      </div>

      {/* FAB Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          "flex items-center justify-center w-14 h-14 rounded-full shadow-2xl border border-white/10 transition-all duration-300",
          isOpen ? "bg-n-6 text-white rotate-90" : "edus-gradient-bg text-white hover:scale-105 hover:shadow-cyan-500/40"
        )}
      >
        <MoreVertical size={28} />
      </button>
    </div>
  );
};

export default BottomNavBar;
