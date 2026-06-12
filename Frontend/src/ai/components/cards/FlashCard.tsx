import React, { useState } from 'react';
import { clsx } from 'clsx';
import { RotateCcw } from 'lucide-react';

interface FlashCardProps {
  question: string;
  answer: string;
}

const FlashCard: React.FC<FlashCardProps> = ({ question, answer }) => {
  const [flipped, setFlipped] = useState(false);

  return (
    <div
      className={clsx('flip-card w-full cursor-pointer select-none', flipped && 'flipped')}
      style={{ height: '400px' }}
      onClick={() => setFlipped(!flipped)}
    >
      <div className="flip-card-inner">
        {/* ── Front ── */}
        <div className="flip-card-front edus-card p-10 flex flex-col items-center justify-center text-center">
          <span className="edus-badge-blue mb-6">Question</span>
          <h3 className="text-2xl font-bold text-white mb-6 leading-relaxed">{question}</h3>
          <div className="flex items-center gap-2 text-sm text-slate-500 mt-auto">
            <RotateCcw size={14} /> Tap to flip
          </div>
        </div>

        {/* ── Back ── */}
        <div className="flip-card-back edus-card p-10 flex flex-col items-center justify-center text-center border-sky-400/30">
          <span className="edus-badge-blue mb-6">Answer</span>
          <div className="text-lg text-slate-200 mb-6 leading-relaxed overflow-y-auto">{answer}</div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mt-auto">
            <RotateCcw size={14} /> Tap to flip back
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlashCard;
