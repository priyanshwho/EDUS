import React, { useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { clsx } from 'clsx';

interface MCQQuestionProps {
  question: any;
  onAnswer: (correct: boolean) => void;
}

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

const MCQQuestion: React.FC<MCQQuestionProps> = ({ question, onAnswer }) => {
  const [selected, setSelected] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (option) => {
    if (isSubmitted) return;
    setSelected(option);
    setIsSubmitted(true);
    const correct = option.startsWith(question.correct);
    setTimeout(() => onAnswer(correct), 1800);
  };

  return (
    <div className="w-full max-w-3xl edus-card p-8">
      <h3 className="text-xl font-bold text-white mb-6">{question.question}</h3>

      <div className="space-y-3 mb-6">
        {question.options.map((option, idx) => {
          const isCorrect = option.startsWith(question.correct);
          const isSelected = selected === option;
          const letter = OPTION_LABELS[idx] || String.fromCharCode(65 + idx);

          return (
            <button
              key={option}
              disabled={isSubmitted}
              onClick={() => handleSubmit(option)}
              className={clsx(
                "w-full text-left px-5 py-4 rounded-xl flex items-center justify-between gap-4 transition-colors border",
                !isSubmitted && "bg-[#1A1825] border-[#252134] text-slate-300 hover:border-sky-400/50 hover:bg-sky-400/5",
                isSubmitted && isCorrect && "bg-emerald-500/10 border-emerald-500/40 text-emerald-400",
                isSubmitted && isSelected && !isCorrect && "bg-rose-500/10 border-rose-500/40 text-rose-400",
                isSubmitted && !isCorrect && !isSelected && "bg-[#1A1825]/50 border-[#252134]/50 text-slate-500 opacity-60"
              )}
            >
              <div className="flex items-center gap-3">
                <span className={clsx(
                  "w-6 h-6 rounded flex items-center justify-center text-xs font-bold shrink-0",
                  !isSubmitted && "bg-slate-800 text-slate-400",
                  isSubmitted && isCorrect && "bg-emerald-500/20",
                  isSubmitted && isSelected && !isCorrect && "bg-rose-500/20"
                )}>
                  {letter}
                </span>
                <span className="text-sm md:text-base font-medium">{option.slice(option.indexOf('.') + 1).trim() || option}</span>
              </div>
              {isSubmitted && isCorrect && <CheckCircle2 size={20} className="shrink-0" />}
              {isSubmitted && isSelected && !isCorrect && <XCircle size={20} className="shrink-0" />}
            </button>
          );
        })}
      </div>

      {isSubmitted && (
        <div className="mt-4 p-5 rounded-xl bg-sky-400/5 border border-sky-400/20">
          <p className="text-xs font-bold text-sky-400 uppercase tracking-widest mb-2">Explanation</p>
          <p className="text-sm text-slate-300 leading-relaxed">{question.explanation}</p>
        </div>
      )}
    </div>
  );
};

export default MCQQuestion;
