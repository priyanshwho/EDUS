import React from 'react';
import { Book, ChevronRight, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

interface SubjectCardProps {
  name: string;
  branch: string;
  semester: string;
  id?: string | null;
  canDelete?: boolean;
  onDelete?: (id: string, name: string) => void;
  creatorName?: string | null;
}

const SubjectCard: React.FC<SubjectCardProps> = ({
  name = 'Untitled',
  branch = '',
  semester = '',
  id,
  canDelete = false,
  onDelete,
  creatorName,
}) => {
  const safeName = String(name || 'Untitled');
  const safeBranch = String(branch || '');
  const safeSemester = String(semester || '');

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (id && onDelete) {
      onDelete(id, safeName);
    }
  };

  return (
    <Link to={`/ai/subject/${safeBranch}/${safeSemester}/${encodeURIComponent(safeName)}`} className="block">
      <div className="edus-card p-5 h-40 flex flex-col justify-between transition-colors hover:edus-gradient-border-active group relative">
        <div className="flex items-start justify-between">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center edus-gradient-bg text-white">
            <Book size={18} />
          </div>
          <div className="flex items-center gap-1">
            {canDelete && id && (
              <button
                type="button"
                onClick={handleDeleteClick}
                title="Delete Syllabus"
                aria-label={`Delete ${safeName} syllabus`}
                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors z-10"
              >
                <Trash2 size={16} />
              </button>
            )}
            <ChevronRight size={18} className="text-slate-500 group-hover:text-sky-400 transition-colors" />
          </div>
        </div>
        
        <div>
          <h3 className="font-semibold text-white mb-1 line-clamp-2">{safeName}</h3>
          <div className="flex items-center justify-between text-xs text-slate-400 uppercase tracking-wider">
            <span>{safeBranch} · {safeSemester.replace('_', ' ')}</span>
            {creatorName && (
              <span className="text-[10px] text-sky-400 font-normal lowercase tracking-normal">
                by {creatorName}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default SubjectCard;
