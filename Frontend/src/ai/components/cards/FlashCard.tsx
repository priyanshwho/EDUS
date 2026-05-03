import React, { useState } from 'react';
import { clsx } from 'clsx';

interface FlashCardProps {
  question: string;
  answer: string;
}

const FlashCard: React.FC<FlashCardProps> = ({ question, answer }) => {
  const [flipped, setFlipped] = useState(false);

  return (
    <div
      className={clsx('flip-card w-full h-[400px] cursor-pointer', flipped && 'flipped')}
      onClick={() => setFlipped(!flipped)}
    >
      <div className="flip-card-inner">
        <div className="flip-card-front glass p-12 flex flex-col items-center justify-center text-center border-2 border-primary/20">
          <span className="text-primary font-black tracking-widest text-xs uppercase mb-8">Question</span>
          <h3 className="text-3xl font-bold leading-tight">{question}</h3>
          <p className="text-text-muted mt-12 text-sm">Click to flip</p>
        </div>

        <div className="flip-card-back glass p-12 flex flex-col items-center justify-center text-center border-2 border-secondary/20 bg-secondary/5">
          <span className="text-secondary font-black tracking-widest text-xs uppercase mb-8">Answer</span>
          <div className="text-2xl leading-relaxed text-text">
            {answer}
          </div>
          <p className="text-text-muted mt-12 text-sm">Click to flip back</p>
        </div>
      </div>
    </div>
  );
};

export default FlashCard;
