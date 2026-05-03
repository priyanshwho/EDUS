import React, { useState } from 'react';
import { clsx } from 'clsx';
import { CheckCircle2, XCircle } from 'lucide-react';

interface MCQQuestionProps {
  question: any;
  onAnswer: (correct: boolean) => void;
}

const MCQQuestion: React.FC<MCQQuestionProps> = ({ question, onAnswer }) => {
  const [selected, setSelected] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (option) => {
    if (isSubmitted) return;
    setSelected(option);
    setIsSubmitted(true);
    const correct = option.startsWith(question.correct);
    setTimeout(() => onAnswer(correct), 2000);
  };

  return (
    <div className="w-full max-w-3xl glass p-10 rounded-[2.5rem] border border-white/10">
      <h3 className="text-2xl font-bold mb-10 leading-relaxed">{question.question}</h3>

      <div className="space-y-4">
        {question.options.map((option) => {
          const isCorrect = option.startsWith(question.correct);
          const isSelected = selected === option;

          return (
            <button
              key={option}
              disabled={isSubmitted}
              onClick={() => handleSubmit(option)}
              className={clsx(
                'w-full text-left px-6 py-5 rounded-2xl border-2 transition-all duration-200 flex items-center justify-between group',
                !isSubmitted && 'border-white/5 hover:border-primary/50 hover:bg-primary/5',
                isSubmitted && isCorrect && 'border-green-500 bg-green-500/10 text-green-500',
                isSubmitted && isSelected && !isCorrect && 'border-red-500 bg-red-500/10 text-red-500',
                isSubmitted && !isSelected && !isCorrect && 'opacity-40 border-white/5'
              )}
            >
              <span className="text-lg font-medium">{option}</span>
              {isSubmitted && isCorrect && <CheckCircle2 size={24} />}
              {isSubmitted && isSelected && !isCorrect && <XCircle size={24} />}
            </button>
          );
        })}
      </div>

      {isSubmitted && (
        <div className="mt-10 p-6 bg-white/5 rounded-2xl animate-in fade-in slide-in-from-top-4 duration-500">
          <p className="text-sm font-bold text-primary uppercase tracking-widest mb-2">Explanation</p>
          <p className="text-text-muted leading-relaxed">{question.explanation}</p>
        </div>
      )}
    </div>
  );
};

export default MCQQuestion;
