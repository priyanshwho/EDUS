import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import { fetchChapterNotes } from '../api/notes.api';
import { generateMCQ } from '../api/ai.api';
import DifficultySelector from '../components/mcq/DifficultySelector';
import MCQQuestion from '../components/mcq/MCQQuestion';
import BottomNavBar from '../components/layout/BottomNavBar';
import {
  ChevronLeft, Trophy, RotateCcw, BookOpen,
  ArrowRight, ArrowLeft, AlertTriangle, WifiOff,
} from 'lucide-react';
import { GooeyLoader } from '../../components/ui/loader-10';

/* ─────────────────────────────────────────────────────────────────
   ErrorBoundary — catches crashes in the MCQ subtree so they don't
   tear down the whole AI section when the API returns garbage.
───────────────────────────────────────────────────────────────── */
class MCQErrorBoundary extends React.Component<
  { children: React.ReactNode; onReset: () => void },
  { hasError: boolean; message: string }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[MCQMode] Render error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#0E0C15] p-8 text-center pb-20">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-rose-500/10 border border-rose-500/30 mb-6">
            <AlertTriangle size={28} className="text-rose-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Something went wrong</h2>
          <p className="text-sm text-slate-400 mb-8 max-w-sm">
            {this.state.message || 'An unexpected error occurred while rendering the quiz.'}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, message: '' });
              this.props.onReset();
            }}
            className="edus-btn"
          >
            <RotateCcw size={16} /> Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ─────────────────────────────────────────────────────────────────
   Main MCQMode component
───────────────────────────────────────────────────────────────── */
const MCQMode = () => {
  const { branch, semester, subjectSlug, chapterId } = useParams();
  const navigate = useNavigate();
  const { state } = useSession();

  const [difficulty, setDifficulty] = useState<string | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, string | null>>({});
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);

  const chapter = state.subjectData
    ? [...(state.subjectData.sections.A || []), ...(state.subjectData.sections.B || [])]
        .find((c: any) => c.chapterId === chapterId)
    : null;

  /* ── Reset to difficulty selector ────────────────────────── */
  const resetToSelector = () => {
    setDifficulty(null);
    setQuestions([]);
    setCurrentIndex(0);
    setUserAnswers({});
    setScore(0);
    setError(null);
    setCompleted(false);
  };

  /* ── Load questions ───────────────────────────────────────── */
  const loadQuestions = async (diff: string) => {
    setLoading(true);
    setError(null);
    setQuestions([]);
    setCurrentIndex(0);
    setUserAnswers({});
    setScore(0);
    setCompleted(false);

    try {
      const notes = await fetchChapterNotes(
        branch!, semester!, subjectSlug!, chapterId!, chapter?.title || '',
      );
      const generated = await generateMCQ({
        chapterTitle:  chapter?.title,
        subjectName:   state.subjectData?.subjectName,
        notesContent:  notes.content,
        notesExist:    notes.notesExist,
        difficulty:    diff,
        topics:        chapter?.topics,
      });

      /* Validate the response is a non-empty array with question shapes */
      if (!Array.isArray(generated) || generated.length === 0) {
        throw new Error('The AI returned an empty question set. Please try again.');
      }

      const invalid = generated.find(
        (q: any) => !q || typeof q.question !== 'string' || !Array.isArray(q.options),
      );
      if (invalid) {
        throw new Error('Received malformed question data from the server. Please try again.');
      }

      /* Set difficulty ONLY after we have valid questions — prevents the
         component from rendering MCQQuestion with undefined data */
      setQuestions(generated);
      setDifficulty(diff);

    } catch (err: any) {
      const msg: string =
        err?.message?.includes('500')
          ? 'The AI server returned an error (500). The model may be overloaded — please try again in a moment.'
          : err?.message || 'Failed to generate questions. Please check your connection and try again.';
      setError(msg);
      /* Keep difficulty = null so we fall back to DifficultySelector with the error shown */
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (correct: boolean, option: string) => {
    if (correct) setScore((prev) => prev + 1);
    setUserAnswers((prev) => ({ ...prev, [currentIndex]: option }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setCompleted(true);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex((prev) => prev - 1);
  };

  /* ── Loading state ────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0E0C15] p-8 text-center pb-20">
        <div className="mb-12">
          <GooeyLoader primaryColor="#38bdf8" secondaryColor="#a78bfa" borderColor="#252134" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2 tracking-wide">Preparing Your Quiz…</h2>
        <p className="text-sm text-slate-400">
          AI is crafting <span className="text-sky-400 font-semibold">{difficulty || 'custom'}</span> level questions.
        </p>
      </div>
    );
  }

  /* ── Difficulty selector (also shown on API error) ────────── */
  if (!difficulty) {
    return (
      <>
        {error && (
          <div
            className="mx-auto mt-8 max-w-lg flex items-start gap-3 px-5 py-4 rounded-xl"
            style={{
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.25)',
            }}
          >
            <WifiOff size={18} className="text-rose-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-rose-400 mb-0.5">Failed to generate quiz</p>
              <p className="text-xs text-slate-400 leading-relaxed">{error}</p>
            </div>
          </div>
        )}
        <DifficultySelector onSelect={loadQuestions} />
      </>
    );
  }

  /* ── Completed state ──────────────────────────────────────── */
  if (completed) {
    const pct = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
    const msg =
      pct >= 80 ? 'Outstanding!' :
      pct >= 60 ? 'Well done!'   :
      pct >= 40 ? 'Good effort!' : 'Keep practicing!';

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
          <button onClick={resetToSelector} className="edus-btn">
            <RotateCcw size={16} /> Try Again
          </button>
          <button
            onClick={() =>
              navigate(`/ai/learn/${branch}/${semester}/${subjectSlug}?section=${state.selectedSection || 'A'}`)
            }
            className="edus-btn-ghost"
          >
            <BookOpen size={16} /> Next Chapter
          </button>
        </div>
        <BottomNavBar />
      </div>
    );
  }

  /* ── Safety guard: should never be reached, but prevents crash ─ */
  const currentQuestion = questions[currentIndex];
  if (!currentQuestion) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0E0C15] p-8 text-center pb-20">
        <AlertTriangle size={40} className="text-amber-400 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Question not found</h2>
        <p className="text-sm text-slate-400 mb-8">Something went wrong loading this question.</p>
        <button onClick={resetToSelector} className="edus-btn">
          <RotateCcw size={16} /> Restart Quiz
        </button>
      </div>
    );
  }

  const progress = ((currentIndex + 1) / questions.length) * 100;

  /* ── Active quiz ──────────────────────────────────────────── */
  return (
    <MCQErrorBoundary onReset={resetToSelector}>
      <div className="min-h-screen flex flex-col bg-[#0E0C15] pb-36 md:pb-12">
        <header className="px-6 py-4 flex items-center justify-between border-b border-[#252134]">
          <button
            onClick={resetToSelector}
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
          <div
            className="h-full edus-gradient-bg transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <main className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="w-full max-w-3xl">
            <MCQQuestion
              key={currentIndex}
              question={currentQuestion}
              onAnswer={handleAnswer}
              userAnswer={userAnswers[currentIndex]}
            />

            <div className="flex items-center justify-between mt-8">
              <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="flex items-center gap-2 edus-btn-ghost opacity-80 hover:opacity-100 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ArrowLeft size={16} /> Previous
              </button>
              <button
                onClick={handleNext}
                disabled={!userAnswers[currentIndex]}
                className="flex items-center gap-2 edus-btn disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {currentIndex === questions.length - 1 ? 'Finish Quiz' : 'Next'}
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </main>

        <BottomNavBar />
      </div>
    </MCQErrorBoundary>
  );
};

export default MCQMode;
