import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import { fetchChapterNotes } from '../api/notes.api';
import { generateFlashcards } from '../api/ai.api';
import FlashCard from '../components/cards/FlashCard';
import BottomNavBar from '../components/layout/BottomNavBar';
import { ChevronLeft, ChevronRight, RefreshCw, Zap } from 'lucide-react';

const FlashcardMode = () => {
  const { branch, semester, subjectSlug, chapterId } = useParams();
  const navigate = useNavigate();
  const { state } = useSession();

  const [cards, setCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const chapter = state.subjectData?.sections.A.concat(state.subjectData?.sections.B)
    .find((c) => c.chapterId === chapterId);

  useEffect(() => {
    const loadContent = async () => {
      setLoading(true);
      try {
        const notes = await fetchChapterNotes(branch, semester, subjectSlug, chapterId, chapter?.title || '');
        const generated = await generateFlashcards({
          chapterTitle: chapter?.title,
          subjectName: state.subjectData?.subjectName,
          notesContent: notes.content,
          notesExist: notes.notesExist,
          topics: chapter?.topics
        });
        setCards(generated);
      } catch (error) {
        console.error('Failed to load flashcards', error);
      } finally {
        setLoading(false);
      }
    };
    if (chapter) loadContent();
  }, [chapterId]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0E0C15] p-8 text-center pb-20">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-sky-400/10 border border-sky-400/20 mb-6">
          <Zap size={24} className="text-sky-400 animate-pulse" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Generating Flashcards…</h2>
        <p className="text-sm text-slate-400">AI is analyzing your content.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0E0C15] pb-20">
      <header className="px-6 py-4 flex items-center justify-between border-b border-[#252134]">
        <button
          onClick={() => navigate(`/ai/learn/${branch}/${semester}/${subjectSlug}?section=${state.selectedSection}`)}
          className="flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-sky-400 transition-colors"
        >
          <ChevronLeft size={18} /> Back
        </button>

        <div className="text-center flex-1 mx-4">
          <p className="text-sm font-bold text-white truncate max-w-[200px] mx-auto">{chapter?.title}</p>
        </div>

        <button onClick={() => window.location.reload()} className="p-2 text-slate-400 hover:text-sky-400">
          <RefreshCw size={16} />
        </button>
      </header>

      <div className="h-1 bg-slate-800">
        <div className="h-full bg-sky-400 transition-all duration-300" style={{ width: `${((currentIndex + 1) / (cards.length || 1)) * 100}%` }} />
      </div>

      <main className="flex-1 flex items-center justify-center px-6 py-8">
        <div className="w-full max-w-xl">
          {cards.length > 0 && (
            <FlashCard
              key={`${currentIndex}-${chapterId}`}
              question={cards[currentIndex].question}
              answer={cards[currentIndex].answer}
            />
          )}
        </div>
      </main>

      <div className="flex items-center justify-center gap-8 pb-8 shrink-0">
        <button
          onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
          disabled={currentIndex === 0}
          className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#15131D] border border-[#252134] text-slate-300 disabled:opacity-40 hover:border-sky-400/50"
        >
          <ChevronLeft size={24} />
        </button>
        <div className="text-center w-24">
          <span className="text-2xl font-bold text-white">{currentIndex + 1}</span>
          <span className="text-slate-500"> / {cards.length}</span>
        </div>
        <button
          onClick={() => setCurrentIndex((prev) => Math.min(cards.length - 1, prev + 1))}
          disabled={currentIndex === cards.length - 1}
          className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#15131D] border border-[#252134] text-slate-300 disabled:opacity-40 hover:border-sky-400/50"
        >
          <ChevronRight size={24} />
        </button>
      </div>

      <BottomNavBar />
    </div>
  );
};

export default FlashcardMode;
