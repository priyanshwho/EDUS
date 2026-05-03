import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import { fetchChapterNotes } from '../api/notes.api';
import { generateFlashcards } from '../api/ai.api';
import FlashCard from '../components/cards/FlashCard';
import { ChevronLeft, ChevronRight, Loader2, RefreshCw } from 'lucide-react';
import BottomNavBar from '../components/layout/BottomNavBar';

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
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8">
        <Loader2 className="animate-spin text-primary mb-6" size={48} />
        <h2 className="text-2xl font-bold">Generating Flashcards...</h2>
        <p className="text-text-muted mt-2">AI is reading your notes and creating study material.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-text flex flex-col" style={{ paddingBottom: '64px' }}>
      <header className="p-8 flex items-center justify-between">
        <button
          onClick={() => navigate(`/ai/learn/${branch}/${semester}/${subjectSlug}?section=${state.selectedSection}`)}
          className="flex items-center gap-2 text-text-muted hover:text-text"
        >
          <ChevronLeft size={20} /> Back to Chapters
        </button>
        <div className="text-center">
          <h2 className="font-bold">{chapter?.title}</h2>
          <div className="flex gap-1 mt-2">
            {cards.map((_, i) => (
              <div key={i} className={`h-1 w-8 rounded-full transition-all ${i === currentIndex ? 'bg-primary' : i < currentIndex ? 'bg-primary/40' : 'bg-white/10'}`} />
            ))}
          </div>
        </div>
        <button onClick={() => window.location.reload()} className="p-3 hover:bg-white/5 rounded-full transition-colors text-text-muted">
          <RefreshCw size={20} />
        </button>
      </header>

      <main className="flex-1 flex items-center justify-center p-8 max-w-2xl mx-auto w-full">
        {cards.length > 0 && (
          <FlashCard
            key={`${currentIndex}-${chapterId}`}
            question={cards[currentIndex].question}
            answer={cards[currentIndex].answer}
          />
        )}
      </main>

      <div className="flex items-center justify-center gap-10 py-6">
        <button
          onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
          disabled={currentIndex === 0}
          className="p-5 rounded-full glass hover:bg-primary/10 disabled:opacity-30 transition-all active:scale-90"
        >
          <ChevronLeft size={28} />
        </button>

        <span className="text-2xl font-black">{currentIndex + 1} <span className="text-text-muted text-lg">/ {cards.length}</span></span>

        <button
          onClick={() => setCurrentIndex((prev) => Math.min(cards.length - 1, prev + 1))}
          disabled={currentIndex === cards.length - 1}
          className="p-5 rounded-full glass hover:bg-primary/10 disabled:opacity-30 transition-all active:scale-90"
        >
          <ChevronRight size={28} />
        </button>
      </div>

      <BottomNavBar />
    </div>
  );
};

export default FlashcardMode;
