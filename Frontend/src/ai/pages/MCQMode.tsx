import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import { fetchChapterNotes } from '../api/notes.api';
import { generateMCQ } from '../api/ai.api';
import DifficultySelector from '../components/mcq/DifficultySelector';
import MCQQuestion from '../components/mcq/MCQQuestion';
import { Loader2, ChevronLeft, Trophy } from 'lucide-react';
import BottomNavBar from '../components/layout/BottomNavBar';

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
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8">
        <Loader2 className="animate-spin text-primary mb-6" size={48} />
        <h2 className="text-2xl font-bold">Preparing Your Quiz...</h2>
        <p className="text-text-muted mt-2">AI is crafting questions for {difficulty} level.</p>
      </div>
    );
  }

  if (!difficulty) return <DifficultySelector onSelect={loadQuestions} />;

  if (completed) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 text-center">
        <div className="w-24 h-24 bg-yellow-500/20 text-yellow-500 rounded-full flex items-center justify-center mb-8 animate-bounce">
          <Trophy size={48} />
        </div>
        <h1 className="text-5xl font-black mb-4">Quiz Completed!</h1>
        <p className="text-text-muted text-xl mb-12">You scored {score} out of {questions.length}</p>

        <div className="flex gap-4">
          <button
            onClick={() => window.location.reload()}
            className="px-8 py-4 bg-primary text-white rounded-2xl font-bold hover:scale-105 transition-all"
          >
            Try Again
          </button>
          <button
            onClick={() => navigate(`/ai/learn/${branch}/${semester}/${subjectSlug}`)}
            className="px-8 py-4 glass rounded-2xl font-bold hover:scale-105 transition-all"
          >
            Next Chapter
          </button>
        </div>
        <BottomNavBar />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-text flex flex-col pb-20">
      <header className="p-8 flex items-center justify-between">
        <button
          onClick={() => setDifficulty(null)}
          className="flex items-center gap-2 text-text-muted hover:text-text"
        >
          <ChevronLeft size={20} /> Change Difficulty
        </button>
        <div className="flex items-center gap-4">
          <span className="text-sm font-bold uppercase tracking-widest text-text-muted">Score: {score}</span>
          <div className="h-6 w-px bg-white/10" />
          <span className="text-sm font-bold uppercase tracking-widest text-primary">Q{currentIndex + 1} / {questions.length}</span>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-8">
        {questions.length > 0 && (
          <MCQQuestion
            key={currentIndex}
            question={questions[currentIndex]}
            onAnswer={handleAnswer}
          />
        )}
      </main>

      <BottomNavBar />
    </div>
  );
};

export default MCQMode;
