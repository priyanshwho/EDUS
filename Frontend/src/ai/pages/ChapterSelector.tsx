import React, { useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import {
  ChevronLeft, Zap, HelpCircle, MessageSquare, BookOpen,
  Clock, ChevronDown, ChevronUp, Layers,
} from 'lucide-react';

/* ── Mode config with distinct colors ─────────────────────── */
const MODE_CONFIG = [
  {
    id: 'flashcards',
    label: 'Flashcards',
    icon: Zap,
    color: 'from-sky-500 to-cyan-400',
    glow: 'rgba(56,189,248,0.25)',
    border: 'rgba(56,189,248,0.35)',
    bg: 'rgba(56,189,248,0.08)',
    textColor: '#7dd3fc',
    desc: 'Active recall',
  },
  {
    id: 'mcq',
    label: 'MCQ Quiz',
    icon: HelpCircle,
    color: 'from-violet-500 to-purple-400',
    glow: 'rgba(167,139,250,0.25)',
    border: 'rgba(167,139,250,0.35)',
    bg: 'rgba(167,139,250,0.08)',
    textColor: '#c4b5fd',
    desc: 'Test yourself',
  },
  {
    id: 'ai',
    label: 'AI Tutor',
    icon: MessageSquare,
    color: 'from-emerald-500 to-teal-400',
    glow: 'rgba(52,211,153,0.25)',
    border: 'rgba(52,211,153,0.35)',
    bg: 'rgba(52,211,153,0.08)',
    textColor: '#6ee7b7',
    desc: 'Ask anything',
  },
  {
    id: 'pyq',
    label: 'PYQ Exam',
    icon: BookOpen,
    color: 'from-amber-500 to-orange-400',
    glow: 'rgba(251,191,36,0.25)',
    border: 'rgba(251,191,36,0.35)',
    bg: 'rgba(251,191,36,0.08)',
    textColor: '#fcd34d',
    desc: 'Past papers',
  },
];

/* ── Single chapter card ───────────────────────────────────── */
const ChapterCard = ({
  chapter,
  index,
  branch,
  semester,
  subjectSlug,
  section,
  onStart,
}: {
  chapter: any;
  index: number;
  branch?: string;
  semester?: string;
  subjectSlug?: string;
  section: string;
  onStart: (chapterId: string, mode: string) => void;
}) => {
  const [expanded, setExpanded] = useState(false);
  const visibleTopics = expanded ? chapter.topics : chapter.topics.slice(0, 3);
  const hasMore = chapter.topics.length > 3;

  return (
    <div
      className="edus-card overflow-hidden"
      style={{
        animation: `edus-fadein 0.4s ease-out ${index * 60}ms both`,
      }}
    >
      {/* ── Top accent bar ─────────────────────────────────── */}
      <div
        className="h-0.5 w-full"
        style={{
          background: `linear-gradient(90deg, transparent, ${MODE_CONFIG[index % 4].border}, transparent)`,
        }}
      />

      <div className="p-5 md:p-6">
        {/* ── Chapter header ──────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            {/* Chapter number badge */}
            <div
              className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold"
              style={{
                background: `linear-gradient(135deg, ${MODE_CONFIG[index % 4].bg}, rgba(255,255,255,0.03))`,
                border: `1px solid ${MODE_CONFIG[index % 4].border}`,
                color: MODE_CONFIG[index % 4].textColor,
              }}
            >
              {String(index + 1).padStart(2, '0')}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 mb-0.5">
                Chapter {String(index + 1).padStart(2, '0')}
              </p>
              <h3 className="font-bold text-base md:text-lg text-white leading-tight truncate">
                {chapter.title}
              </h3>
            </div>
          </div>
          {/* Hours pill */}
          <div className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/60 border border-slate-700/50">
            <Clock size={11} className="text-slate-400" />
            <span className="text-[11px] font-semibold text-slate-400">{chapter.hours}h</span>
          </div>
        </div>

        {/* ── Divider ─────────────────────────────────────── */}
        <div className="edus-divider my-0 mb-4" />

        {/* ── Two-column body ─────────────────────────────── */}
        <div className="flex flex-col lg:flex-row gap-5">

          {/* LEFT: Topics ─────────────────────────────────── */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-3">
              <Layers size={13} className="text-slate-500" />
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Topics · {chapter.topics.length}
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              {visibleTopics.map((topic: string, ti: number) => (
                <div
                  key={ti}
                  className="flex items-start gap-2 px-3 py-2 rounded-lg"
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.04)',
                  }}
                >
                  <span
                    className="flex-shrink-0 mt-[5px] w-1.5 h-1.5 rounded-full"
                    style={{ background: MODE_CONFIG[index % 4].textColor, opacity: 0.7 }}
                  />
                  <span className="text-[12px] text-slate-300 leading-relaxed">{topic}</span>
                </div>
              ))}
            </div>

            {hasMore && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="mt-2 flex items-center gap-1.5 text-[11px] font-medium transition-colors"
                style={{ color: MODE_CONFIG[index % 4].textColor }}
              >
                {expanded ? (
                  <><ChevronUp size={13} /> Show less</>
                ) : (
                  <><ChevronDown size={13} /> +{chapter.topics.length - 3} more topics</>
                )}
              </button>
            )}
          </div>

          {/* RIGHT: Mode buttons ───────────────────────────── */}
          <div className="flex-shrink-0 lg:w-48 xl:w-52">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Study With
              </span>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
              {MODE_CONFIG.map((mode) => {
                const Icon = mode.icon;
                return (
                  <button
                    key={mode.id}
                    onClick={() => onStart(chapter.chapterId, mode.id)}
                    className="group flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-left w-full transition-all duration-200"
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: `1px solid rgba(255,255,255,0.06)`,
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.background = mode.bg;
                      (e.currentTarget as HTMLElement).style.border = `1px solid ${mode.border}`;
                      (e.currentTarget as HTMLElement).style.boxShadow = `0 0 14px ${mode.glow}`;
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)';
                      (e.currentTarget as HTMLElement).style.border = '1px solid rgba(255,255,255,0.06)';
                      (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                    }}
                  >
                    <div
                      className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{ background: mode.bg, border: `1px solid ${mode.border}` }}
                    >
                      <Icon size={13} style={{ color: mode.textColor }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[12px] font-semibold text-white leading-none mb-0.5">
                        {mode.label}
                      </p>
                      <p className="text-[10px] text-slate-500 leading-none">{mode.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Main page ─────────────────────────────────────────────── */
const ChapterSelector = () => {
  const { branch, semester, subjectSlug } = useParams();
  const [searchParams] = useSearchParams();
  const section = searchParams.get('section') || 'A';
  const navigate = useNavigate();
  const { state, dispatch } = useSession();

  const data = state.subjectData;
  if (!data) return (
    <div className="min-h-screen flex items-center justify-center bg-[#0E0C15]">
      <div className="edus-card p-10 max-w-sm mx-auto text-center">
        <p className="font-bold text-white mb-2">No subject data found</p>
        <p className="text-sm mb-6 text-slate-400">Please restart your session.</p>
        <button onClick={() => navigate('/ai')} className="edus-btn">← Back to Home</button>
      </div>
    </div>
  );

  const chapters = section === 'BOTH'
    ? [...data.sections.A, ...data.sections.B]
    : data.sections[section] || [];

  const startMode = (chapterId: string, mode: string) => {
    dispatch({ type: 'SET_CHAPTER', payload: chapterId });
    dispatch({ type: 'SET_MODE', payload: mode });
    if (mode === 'pyq') {
      navigate(`/ai/pyq/${branch}/${semester}/${subjectSlug}/${section}`);
    } else {
      navigate(`/ai/${mode}/${branch}/${semester}/${subjectSlug}/${chapterId}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#0E0C15] text-slate-200">
      {/* ── Sticky header ──────────────────────────────────── */}
      <div
        className="sticky top-0 z-20 px-5 md:px-10 py-3 flex items-center justify-between"
        style={{
          background: 'rgba(14,12,21,0.85)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        <button
          onClick={() => navigate(`/ai/subject/${branch}/${semester}/${subjectSlug}`)}
          className="flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-sky-400 transition-colors"
        >
          <ChevronLeft size={18} /> Back to Sections
        </button>

        <div className="flex items-center gap-2.5">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-white leading-none">{data.subjectName}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">{chapters.length} chapters</p>
          </div>
          <span className="edus-badge-gradient">Section {section}</span>
        </div>
      </div>

      {/* ── Page content ───────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-5 md:px-10 py-8">

        {/* Summary row */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <h1 className="text-xl font-bold edus-gradient-text">{data.subjectName}</h1>
          <span className="edus-badge-muted uppercase">{branch}</span>
          <span className="edus-badge-muted">{semester?.replace('_', ' ')}</span>
          <span
            className="text-xs text-slate-500 ml-auto hidden md:block"
          >
            Click any mode button to start learning
          </span>
        </div>

        {/* Mode legend row */}
        <div className="flex flex-wrap gap-2 mb-6 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
          {MODE_CONFIG.map(m => {
            const Icon = m.icon;
            return (
              <div key={m.id} className="flex items-center gap-1.5">
                <div
                  className="w-5 h-5 rounded-md flex items-center justify-center"
                  style={{ background: m.bg, border: `1px solid ${m.border}` }}
                >
                  <Icon size={10} style={{ color: m.textColor }} />
                </div>
                <span className="text-[11px] text-slate-400 font-medium">{m.label}</span>
              </div>
            );
          })}
          <span className="text-[11px] text-slate-600 ml-auto self-center hidden sm:block">
            {chapters.length} chapters · Section {section}
          </span>
        </div>

        {/* Chapter cards */}
        <div className="space-y-4">
          {chapters.map((chapter: any, index: number) => (
            <ChapterCard
              key={chapter.chapterId}
              chapter={chapter}
              index={index}
              branch={branch}
              semester={semester}
              subjectSlug={subjectSlug}
              section={section}
              onStart={startMode}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChapterSelector;
