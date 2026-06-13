import React from 'react';
import { useSession } from '../../context/SessionContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Home, Coffee } from 'lucide-react';

const PauseOverlay = () => {
  const { state, dispatch } = useSession();
  const navigate = useNavigate();

  const resume = () => dispatch({ type: 'RESUME_SESSION' });
  const goHome = () => {
    dispatch({ type: 'RESUME_SESSION' });
    navigate('/ai');
  };

  return (
    <AnimatePresence>
      {state.sessionPaused && (
        <motion.div
          key="pause-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-6"
          style={{
            background: 'radial-gradient(ellipse at 50% 40%, rgba(14,12,21,0.96) 0%, rgba(8,7,14,0.98) 100%)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
          }}
        >
          {/* Ambient glow orbs */}
          <div
            className="pointer-events-none absolute top-1/4 left-1/2 -translate-x-1/2 w-[420px] h-[420px] rounded-full opacity-[0.07] blur-[80px]"
            style={{ background: 'radial-gradient(circle, #38bdf8 0%, #a78bfa 60%, transparent 100%)' }}
          />
          <div
            className="pointer-events-none absolute bottom-1/4 left-1/3 w-[260px] h-[260px] rounded-full opacity-[0.05] blur-[60px]"
            style={{ background: '#a78bfa' }}
          />

          {/* Card */}
          <motion.div
            initial={{ scale: 0.88, opacity: 0, y: 24 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 16 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-sm text-center"
            style={{
              background: 'linear-gradient(135deg, rgba(21,19,29,0.95) 0%, rgba(15,12,22,0.98) 100%)',
              border: '1px solid rgba(56,189,248,0.12)',
              borderRadius: '28px',
              padding: '48px 40px 40px',
              boxShadow: `
                0 0 0 1px rgba(167,139,250,0.06),
                0 24px 64px rgba(0,0,0,0.6),
                0 0 80px rgba(56,189,248,0.04),
                inset 0 1px 0 rgba(255,255,255,0.05)
              `,
            }}
          >
            {/* Top shimmer line */}
            <div
              className="absolute top-0 left-8 right-8 h-px"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(56,189,248,0.3), rgba(167,139,250,0.3), transparent)' }}
            />

            {/* Icon */}
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-7"
              style={{
                background: 'linear-gradient(135deg, rgba(56,189,248,0.12) 0%, rgba(167,139,250,0.12) 100%)',
                border: '1px solid rgba(56,189,248,0.2)',
                boxShadow: '0 0 32px rgba(56,189,248,0.1), inset 0 1px 0 rgba(255,255,255,0.05)',
              }}
            >
              <Coffee size={36} className="text-sky-300" />
            </motion.div>

            {/* Text */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.3 }}
            >
              <h2
                className="text-2xl font-black mb-2 tracking-tight"
                style={{
                  background: 'linear-gradient(135deg, #e2e8f0 0%, #94a3b8 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Session Paused
              </h2>
              <p className="text-sm text-slate-500 mb-8 leading-relaxed">
                Take a breath — your progress is saved and waiting.
              </p>
            </motion.div>

            {/* Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22, duration: 0.3 }}
              className="flex flex-col gap-3"
            >
              {/* Resume */}
              <button
                onClick={resume}
                className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl font-bold text-base text-white transition-all duration-200"
                style={{
                  background: 'linear-gradient(135deg, #38bdf8 0%, #a78bfa 100%)',
                  boxShadow: '0 4px 20px rgba(56,189,248,0.25)',
                }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 6px 28px rgba(56,189,248,0.4)')}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 4px 20px rgba(56,189,248,0.25)')}
              >
                <Play size={18} className="fill-white" />
                Resume Learning
              </button>

              {/* Back to Home */}
              <button
                onClick={goHome}
                className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl font-semibold text-sm transition-all duration-200"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: '#64748b',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(56,189,248,0.3)';
                  (e.currentTarget as HTMLElement).style.color = '#7dd3fc';
                  (e.currentTarget as HTMLElement).style.background = 'rgba(56,189,248,0.05)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)';
                  (e.currentTarget as HTMLElement).style.color = '#64748b';
                  (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)';
                }}
              >
                <Home size={16} />
                Back to Home
              </button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PauseOverlay;
