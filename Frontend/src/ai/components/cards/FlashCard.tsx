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
      className={clsx(
        'flip-card w-full cursor-pointer select-none max-w-2xl mx-auto h-[380px] sm:h-[440px] md:h-[480px]',
        flipped && 'flipped'
      )}
      onClick={() => setFlipped(!flipped)}
    >
      <div className="flip-card-inner transition-transform duration-700 ease-in-out">
        {/* ── Front ── */}
        <div className="flip-card-front edus-card p-6 sm:p-8 md:p-10 flex flex-col items-center justify-center text-center hover:edus-gradient-border-active group shadow-xl relative overflow-hidden bg-gradient-to-b from-[#1A1825]/80 to-[#0E0C15]/80">
          <div className="absolute inset-0 flex items-center justify-center opacity-10 text-[200px] sm:text-[300px] md:text-[350px] font-black font-sans pointer-events-none select-none edus-gradient-text translate-y-6 sm:translate-y-10">
            Q
          </div>
          <span className="edus-badge-gradient mb-4 sm:mb-8 shadow-sm relative z-10 text-xs">Question</span>
          <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-6 sm:mb-8 leading-snug tracking-tight group-hover:edus-gradient-text transition-all duration-300 relative z-10 px-2 sm:px-4">
            {question}
          </h3>
          <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 mt-auto opacity-70 group-hover:opacity-100 transition-opacity relative z-10">
            <RotateCcw size={15} /> Tap to reveal answer
          </div>
        </div>

        {/* ── Back ── */}
        <div className="flip-card-back edus-card p-6 sm:p-8 md:p-10 flex flex-col items-center justify-center text-center edus-gradient-border-active shadow-2xl shadow-sky-900/20 relative overflow-hidden bg-gradient-to-t from-[#1A1825]/80 to-[#0E0C15]/80">
          <div className="absolute inset-0 flex items-center justify-center opacity-10 text-[200px] sm:text-[300px] md:text-[350px] font-black font-sans pointer-events-none select-none edus-gradient-text translate-y-6 sm:translate-y-10">
            A
          </div>
          <span className="edus-badge-gradient mb-4 sm:mb-8 shadow-sm relative z-10 text-xs">Answer</span>
          <div className="text-base sm:text-xl md:text-2xl font-medium text-slate-200 mb-6 sm:mb-8 leading-relaxed overflow-y-auto max-h-[220px] sm:max-h-[280px] px-2 sm:px-6 relative z-10">
            {answer}
          </div>
          <div className="flex items-center gap-2 text-xs sm:text-sm text-sky-400/70 mt-auto hover:text-sky-400 transition-colors relative z-10">
            <RotateCcw size={15} /> Tap to view question
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlashCard;
