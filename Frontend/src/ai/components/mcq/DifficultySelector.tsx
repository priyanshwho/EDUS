import React from 'react';
import { Brain, Flame, Zap } from 'lucide-react';

interface DifficultySelectorProps {
  onSelect: (difficulty: 'easy' | 'medium' | 'hard') => void;
}

const DifficultySelector: React.FC<DifficultySelectorProps> = ({ onSelect }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center max-w-4xl mx-auto">
      <h2 className="text-4xl font-black mb-4">Choose Your Challenge</h2>
      <p className="text-text-muted mb-12 text-lg">Select a difficulty level for your practice quiz.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
        {[
          { id: 'easy', label: 'Apprentice', desc: 'Basics and Definitions', icon: <Zap />, color: 'hover:border-green-500/50 hover:bg-green-500/5' },
          { id: 'medium', label: 'Scholar', desc: 'Application and Logic', icon: <Brain />, color: 'hover:border-blue-500/50 hover:bg-blue-500/5' },
          { id: 'hard', label: 'Master', desc: 'Reasoning and Edge Cases', icon: <Flame />, color: 'hover:border-red-500/50 hover:bg-red-500/5' }
        ].map((level) => (
          <button
            key={level.id}
            onClick={() => onSelect(level.id)}
            className={`glass p-10 rounded-3xl text-left group transition-all duration-300 hover:-translate-y-2 border border-white/5 ${level.color}`}
          >
            <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform mb-6">
              {level.icon}
            </div>
            <h3 className="text-2xl font-black mb-2">{level.label}</h3>
            <p className="text-text-muted">{level.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default DifficultySelector;
