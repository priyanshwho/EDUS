import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import { fetchChapterNotes } from '../api/notes.api';
import { generateMCQ } from '../api/ai.api';
import DifficultySelector from '../components/mcq/DifficultySelector';
import MCQQuestion from '../components/mcq/MCQQuestion';
import BottomNavBar from '../components/layout/BottomNavBar';
import { Loader2, ChevronLeft, Trophy, RotateCcw, BookOpen } from 'lucide-react';

const MCQMode = () => {
  const { branch, semester, subjectSlug, chapterId } = useParams();
  const navigate = useNavigate();
  const { state } = useSession();

  const [difficulty, setDifficulty] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);

  const chapter = state.subjectData?.sections.A.concat(state.subjectData?.sections.B)
    .find((c) => c.chapterId === chapterId);

  const loadQuestions = async (diff) => {
    setLoading(true);
    try {
      const notes = await fetchChapterNotes(branch, semester, subjectSlug, chapterId, chapter?.title || '');
      const generated = await generateMCQ({
        chapterTitle: chapter?.title,
        subjectName: state.subjectData?.subjectName,
        notesContent: notes.content,
        notesExist: notes.notesExist,
        difficulty: diff,
        topics: chapter?.topics
      });
      setQuestions(generated);
      setDifficulty(diff);
    } catch (error) {
      console.error('Failed to load MCQs', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (correct) => {
    if (correct) setScore((prev) => prev + 1);
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setCompleted(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0E0C15] p-8 text-center pb-20">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center edus-gradient-bg mb-6">
          <Loader2 size={24} className="text-white animate-spin" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Preparing Your Quiz…</h2>
        <p className="text-sm text-slate-400">AI is crafting {difficulty} level questions.</p>
      </div>
    );
  }

  if (!difficulty) return <DifficultySelector onSelect={loadQuestions} />;

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0E0C15] p-8 text-center pb-20">
        <h1 className="text-2xl font-bold text-white mb-4">No questions available</h1>
        <p className="text-sm text-slate-400 mb-8">Could not generate questions for this topic. Try another difficulty or chapter.</p>
        <button onClick={() => setDifficulty(null)} className="edus-btn">
          <RotateCcw size={16} /> Go Back
        </button>
        <BottomNavBar />
      </div>
    );
  }

  if (completed) {
    const pct = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
    const msg = pct >= 80 ? 'Outstanding!' : pct >= 60 ? 'Well done!' : pct >= 40 ? 'Good effort!' : 'Keep practicing!';

    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0E0C15] p-8 text-center pb-20">
        <div className="w-20 h-20 rounded-2xl flex items-center justify-center edus-gradient-bg mb-6">
          <Trophy size={36} className="text-white" />
        </div>

        <h1 className="text-3xl font-bold text-white mb-2">Quiz Complete!</h1>
        <p className="text-lg font-medium edus-gradient-text mb-8">{msg}</p>

        <div className="mb-10 text-center">
          <span className="text-4xl font-bold text-white">{pct}%</span>
          <div className="text-sm text-slate-400 mt-1">{score} out of {questions.length} correct</div>
        </div>

        <div className="flex gap-4 flex-wrap justify-center">
          <button onClick={() => window.location.reload()} className="edus-btn">
            <RotateCcw size={16} /> Try Again
          </button>
          <button onClick={() => navigate(`/ai/learn/${branch}/${semester}/${subjectSlug}`)} className="edus-btn-ghost">
            <BookOpen size={16} /> Next Chapter
          </button>
        </div>
        <BottomNavBar />
      </div>
    );
  }

  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen flex flex-col bg-[#0E0C15] pb-20">
      <header className="px-6 py-4 flex items-center justify-between border-b border-[#252134]">
        <button
          onClick={() => setDifficulty(null)}
          className="flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-sky-400 transition-colors"
        >
          <ChevronLeft size={18} /> Difficulty
        </button>

        <div className="flex items-center gap-3">
          <span className="edus-badge-muted">Q {currentIndex + 1}/{questions.length}</span>
          <span className="edus-badge-gradient">Score: {score}</span>
        </div>
      </header>

      <div className="h-1 bg-slate-800">
        <div className="h-full edus-gradient-bg transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>

      <main className="flex-1 flex items-center justify-center p-6">
        {questions.length > 0 && (
          <MCQQuestion key={currentIndex} question={questions[currentIndex]} onAnswer={handleAnswer} />
        )}
      </main>

      <BottomNavBar />
    </div>
  );
};

export default MCQMode;
