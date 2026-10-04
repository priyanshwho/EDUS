import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import { generatePYQ } from '../api/ai.api';
import { ChevronLeft, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import BottomNavBar from '../components/layout/BottomNavBar';
import { GooeyLoader } from '../../components/ui/loader-10';
import { motion, AnimatePresence } from 'framer-motion';

const PYQMode = () => {
  const { branch, semester, subjectSlug, section } = useParams();
  const navigate = useNavigate();
  const { state } = useSession();

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  useEffect(() => {
    const loadPYQ = async () => {
      setLoading(true);
      try {
        const sectionContent = section === 'A'
          ? state.subjectData?.sections.A
          : state.subjectData?.sections.B;
        const generated = await generatePYQ({
          subjectName: state.subjectData?.subjectName,
          sectionContent: JSON.stringify(sectionContent),
          section: section
        });
        setQuestions(generated);
      } catch (error) {
        console.error('Failed to load PYQs', error);
      } finally {
        setLoading(false);
      }
    };
    if (state.subjectData) loadPYQ();
  }, [section, state.subjectData]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0E0C15] p-8 text-center pb-20">
        <div className="mb-12">
          <GooeyLoader primaryColor="#38bdf8" secondaryColor="#a78bfa" borderColor="#252134" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2 tracking-wide">Predicting Exam Questions…</h2>
        <p className="text-base text-slate-400">AI is meticulously analyzing historical patterns.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0E0C15] pb-36 md:pb-12">
      <header className="px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between border-b border-[#252134] sticky top-0 z-20 bg-[#0E0C15]/90 backdrop-blur-md">
        <button
          onClick={() => navigate(`/ai/learn/${branch}/${semester}/${subjectSlug}?section=${section}`)}
          className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium text-slate-400 hover:text-sky-400 transition-colors"
        >
          <ChevronLeft size={18} /> Back
        </button>

        <div className="text-center truncate mx-2">
          <h2 className="text-sm sm:text-base font-bold text-white truncate">Section {section} — PYQ</h2>
          <p className="text-[11px] sm:text-xs text-slate-500 truncate">{state.subjectData?.subjectName}</p>
        </div>

        <span className="edus-badge-gradient text-xs">{questions.length} Q's</span>
      </header>

      <main className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 space-y-4 sm:space-y-5">
        {questions.map((q, i) => {
          const isOpen = openIdx === i;
          return (
            <div key={i} className="edus-card overflow-hidden">
              <div className="px-4 sm:px-6 py-4 sm:py-5">
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <span className="edus-badge-muted uppercase text-[10px] sm:text-xs">{q.type}</span>
                  {q.topic && <span className="text-[11px] sm:text-xs text-slate-500 uppercase">{q.topic}</span>}
                  <span className="ml-auto edus-badge-gradient text-[10px] sm:text-xs">Q{i + 1}</span>
                </div>

                <h4 className="text-base sm:text-lg font-semibold text-white leading-snug mb-4 sm:mb-5">{q.question}</h4>

                <button
                  onClick={() => setOpenIdx(isOpen ? null : i)}
                  className="flex items-center gap-2 text-xs sm:text-sm font-semibold edus-gradient-text hover:opacity-80 transition-opacity"
                >
                  <FileText size={16} className="text-sky-400" />
                  <span>{isOpen ? 'Hide' : 'View'} Model Answer</span>
                  {isOpen
                    ? <ChevronUp size={16} className="text-sky-400" />
                    : <ChevronDown size={16} className="text-sky-400" />}
                </button>
              </div>

              {/* ── Framer Motion animated answer panel ── */}
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    key="answer"
                    initial={{ height: 0, opacity: 0, y: -8 }}
                    animate={{ height: 'auto', opacity: 1, y: 0 }}
                    exit={{ height: 0, opacity: 0, y: -8 }}
                    transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div className="px-6 pb-6 pt-2 border-t border-[#252134] bg-sky-400/5">
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1, duration: 0.24 }}
                        className="p-5 rounded-xl bg-[#1A1825] border border-sky-400/10 shadow-inner"
                      >
                        <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                          {q.modelAnswer}
                        </p>
                      </motion.div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </main>

      <BottomNavBar />
    </div>
  );
};

export default PYQMode;
