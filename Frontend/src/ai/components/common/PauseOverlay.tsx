import React from 'react';
import { useSession } from '../../context/SessionContext';
import { Play } from 'lucide-react';

const PauseOverlay = () => {
  const { state, dispatch } = useSession();

  if (!state.sessionPaused) return null;

  return (
    <div className="fixed inset-0 z-[100] backdrop-blur-md bg-background/40 flex items-center justify-center p-8">
      <div className="glass p-12 rounded-[3rem] text-center max-w-md w-full border-2 border-primary/30 shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="w-24 h-24 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl shadow-primary/20">
          <Play size={48} className="ml-2" />
        </div>
        <h2 className="text-4xl font-black mb-4 uppercase tracking-tighter">Session Paused</h2>
        <p className="text-text-muted text-lg mb-12">Take a breath. Your progress is safe.</p>

        <button
          onClick={() => dispatch({ type: 'RESUME_SESSION' })}
          className="w-full py-5 bg-primary text-white rounded-2xl font-black text-xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20"
        >
          Resume Learning
        </button>
      </div>
    </div>
  );
};

export default PauseOverlay;
