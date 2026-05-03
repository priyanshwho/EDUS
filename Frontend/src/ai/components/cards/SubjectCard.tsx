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
    <Link
      to={`/ai/subject/${branch}/${semester}/${encodeURIComponent(name)}`}
      className="glass group p-6 rounded-2xl transition-all duration-300 hover:scale-[1.02] hover:border-primary/50 flex flex-col justify-between min-h-[160px]"
    >
      <div className="flex justify-between items-start">
        <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
          <Book size={24} />
        </div>
        <ChevronRight size={20} className="text-text-muted group-hover:text-text group-hover:translate-x-1 transition-all" />
      </div>

      <div>
        <h3 className="text-xl font-bold text-text group-hover:text-primary transition-colors">{name}</h3>
        <p className="text-sm text-text-muted mt-1 uppercase tracking-wider">{branch} • {semester.replace('_', ' ')}</p>
      </div>
    </Link>
  );
};

export default SubjectCard;
