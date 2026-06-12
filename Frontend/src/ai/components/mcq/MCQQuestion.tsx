import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { clsx } from 'clsx';

interface MCQQuestionProps {
  question: any;
  onAnswer: (correct: boolean, option: string) => void;
  userAnswer?: string | null;
}

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

const MCQQuestion: React.FC<MCQQuestionProps> = ({ question, onAnswer, userAnswer }) => {
  const isSubmitted = !!userAnswer;
  const selected = userAnswer;

  const handleSubmit = (option: string) => {
    if (isSubmitted) return;
    const correct = option.startsWith(question.correct);
    onAnswer(correct, option);
  };

  return (
    <div className="w-full edus-card p-8 md:p-10 relative overflow-hidden">
      {/* Decorative background element */}
      <div className="absolute -top-24 -right-24 w-64 h-64 edus-gradient-bg opacity-[0.03] rounded-full blur-3xl pointer-events-none" />

      <h3 className="text-xl md:text-2xl font-bold text-white mb-8 leading-relaxed">{question.question}</h3>

      <div className="space-y-4 mb-8 relative z-10">
        {question.options.map((option: string, idx: number) => {
          const isCorrect = option.startsWith(question.correct);
          const isSelected = selected === option;
          const letter = OPTION_LABELS[idx] || String.fromCharCode(65 + idx);

          return (
            <button
              key={option}
              disabled={isSubmitted}
              onClick={() => handleSubmit(option)}
              className={clsx(
                "w-full text-left px-5 py-4 rounded-xl flex items-center justify-between gap-4 transition-all duration-300 border",
                !isSubmitted && "bg-[#1A1825] border-[#252134] text-slate-300 hover:edus-gradient-border-active hover:shadow-lg hover:-translate-y-0.5",
                isSubmitted && isCorrect && "bg-emerald-500/10 border-emerald-500/40 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]",
                isSubmitted && isSelected && !isCorrect && "bg-rose-500/10 border-rose-500/40 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.15)]",
                isSubmitted && !isCorrect && !isSelected && "bg-[#1A1825]/50 border-[#252134]/50 text-slate-500 opacity-60"
              )}
            >
              <div className="flex items-center gap-4">
                <span className={clsx(
                  "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 shadow-inner",
                  !isSubmitted && "bg-slate-800 text-slate-400",
                  isSubmitted && isCorrect && "bg-emerald-500/20 text-emerald-300",
                  isSubmitted && isSelected && !isCorrect && "bg-rose-500/20 text-rose-300"
                )}>
                  {letter}
                </span>
                <span className="text-base md:text-lg font-medium">{option.slice(option.indexOf('.') + 1).trim() || option}</span>
              </div>
              {isSubmitted && isCorrect && <CheckCircle2 size={24} className="shrink-0 drop-shadow-md" />}
              {isSubmitted && isSelected && !isCorrect && <XCircle size={24} className="shrink-0 drop-shadow-md" />}
            </button>
          );
        })}
      </div>

      {isSubmitted && (
        <div className="mt-6 p-6 rounded-xl bg-sky-400/5 border border-sky-400/20 shadow-inner relative z-10 animate-fadein">
          <p className="text-xs font-bold edus-gradient-text uppercase tracking-widest mb-3">Explanation</p>
          <p className="text-sm md:text-base text-slate-300 leading-relaxed">{question.explanation}</p>
        </div>
      )}
    </div>
  );
};

export default MCQQuestion;
