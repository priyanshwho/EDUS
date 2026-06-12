import React from 'react';
import { Book, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface SubjectCardProps {
  name: string;
  branch: string;
  semester: string;
}

const SubjectCard: React.FC<SubjectCardProps> = ({ name, branch, semester }) => {
  return (
    <Link to={`/ai/subject/${branch}/${semester}/${encodeURIComponent(name)}`} className="block">
      <div className="edus-card p-5 h-40 flex flex-col justify-between transition-colors hover:edus-gradient-border-active group">
        <div className="flex items-start justify-between">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center edus-gradient-bg text-white">
            <Book size={18} />
          </div>
          <ChevronRight size={18} className="text-slate-500 transition-colors" />
        </div>
        
        <div>
          <h3 className="font-semibold text-white mb-1 line-clamp-2">{name}</h3>
          <p className="text-xs text-slate-400 uppercase tracking-wider">
            {branch} · {semester.replace('_', ' ')}
          </p>
        </div>
      </div>
    </Link>
  );
};

export default SubjectCard;
