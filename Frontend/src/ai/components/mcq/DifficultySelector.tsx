import React from 'react';
import { Brain, Flame, Zap } from 'lucide-react';
import BottomNavBar from '../layout/BottomNavBar';

interface DifficultySelectorProps {
  onSelect: (difficulty: 'easy' | 'medium' | 'hard') => void;
}

const LEVELS = [
  { id: 'easy', label: 'Easy', icon: <Zap size={24} />, desc: 'Basics & definitions' },
  { id: 'medium', label: 'Medium', icon: <Brain size={24} />, desc: 'Application & reasoning' },
  { id: 'hard', label: 'Hard', icon: <Flame size={24} />, desc: 'Edge cases & depth' },
];

const DifficultySelector: React.FC<DifficultySelectorProps> = ({ onSelect }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0E0C15] px-4 sm:px-6 py-10 sm:py-16 text-center pb-32 md:pb-24">
      <div className="mb-8 sm:mb-12">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2">Choose Difficulty</h2>
        <p className="text-xs sm:text-sm text-slate-400">Select a level for your practice quiz</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 w-full max-w-3xl">
        {LEVELS.map((level) => (
          <button
            key={level.id}
            onClick={() => onSelect(level.id as any)}
            className="edus-card p-5 sm:p-6 text-left hover:edus-gradient-border-active transition-all group"
          >
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center edus-gradient-bg text-white mb-3.5 sm:mb-4 group-hover:scale-105 transition-transform shadow-md shadow-sky-500/20">
              {level.icon}
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white mb-1">{level.label}</h3>
            <p className="text-xs sm:text-sm text-slate-400">{level.desc}</p>
          </button>
        ))}
      </div>
      <BottomNavBar />
    </div>
  );
};

export default DifficultySelector;
