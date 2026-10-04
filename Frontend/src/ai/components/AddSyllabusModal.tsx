import React, { useState } from 'react';
import { X, Check, AlertCircle, Eye, Edit3, Sparkles, Trash2 } from 'lucide-react';
import { createSyllabus } from '../api/syllabus.api';

interface AddSyllabusModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultBranch?: string;
  defaultSemester?: string;
  onSuccess: (newSubject: string, branch: string, semester: string) => void;
}

const BRANCHES = ['CSE', 'IT', 'ECE', 'EEE', 'ME', 'CE', 'AI/ML', 'DS'];
const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

const SAMPLE_TEMPLATE = `SECTION-A
Chapter 1: Introduction to System Concepts (05)
Basic concepts, system components, architectural overview.

Chapter 2: Core Protocols & Operations (06)
Protocol architecture, data transfer, control mechanisms.

SECTION-B
Chapter 3: Advanced Architectures (06)
Distributed designs, performance metrics, security considerations.

Chapter 4: Applications & Case Studies (05)
Modern implementations, real-world case analysis.`;

export const AddSyllabusModal: React.FC<AddSyllabusModalProps> = ({
  isOpen,
  onClose,
  defaultBranch = 'CSE',
  defaultSemester = 'semester_4',
  onSuccess,
}) => {
  const initialSemNum = parseInt(String(defaultSemester).replace(/\D/g, ''), 10) || 4;

  const [subjectName, setSubjectName] = useState('');
  const [subjectCode, setSubjectCode] = useState('');
  const [branch, setBranch] = useState(defaultBranch || 'CSE');
  const [semester, setSemester] = useState<number>(initialSemNum);
  const [content, setContent] = useState('');
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleUseTemplate = () => {
    setContent(SAMPLE_TEMPLATE);
  };

  const handleClearContent = () => {
    setContent('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!subjectName.trim()) {
      setError('Subject Name is required.');
      return;
    }
    if (!branch) {
      setError('Branch is required.');
      return;
    }
    if (!content.trim()) {
      setError('Syllabus content is required.');
      return;
    }

    // Check for SECTION markers
    const hasSectionA = /SECTION[-\s]A/i.test(content);
    const hasSectionB = /SECTION[-\s]B/i.test(content);
    if (!hasSectionA && !hasSectionB) {
      setError('Please include at least a "SECTION-A" or "SECTION-B" marker in the syllabus content.');
      return;
    }

    setLoading(true);
    try {
      await createSyllabus({
        subjectName: subjectName.trim(),
        subjectCode: subjectCode.trim() || undefined,
        branch,
        semester,
        content: content.trim(),
      });

      const semFormatted = `semester_${semester}`;
      onSuccess(subjectName.trim(), branch, semFormatted);
      setSubjectName('');
      setSubjectCode('');
      setContent('');
      onClose();
    } catch (err: any) {
      console.error('Failed to create syllabus:', err);
      setError(err?.message || 'Failed to save syllabus. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#14121F] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-sky-400" />
              Add New Syllabus
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Create a globally available syllabus for all students & AI tools
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Row 1: Branch & Semester */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Branch *
              </label>
              <select
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="w-full bg-[#1A1827] border border-slate-700/60 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500 transition"
              >
                {BRANCHES.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Semester *
              </label>
              <select
                value={semester}
                onChange={(e) => setSemester(Number(e.target.value))}
                className="w-full bg-[#1A1827] border border-slate-700/60 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500 transition"
              >
                {SEMESTERS.map((s) => (
                  <option key={s} value={s}>Semester {s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Subject Name & Subject Code */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Subject Name *
              </label>
              <input
                type="text"
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
                placeholder="e.g. Computer Networks"
                className="w-full bg-[#1A1827] border border-slate-700/60 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500 transition"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Subject Code (Optional)
              </label>
              <input
                type="text"
                value={subjectCode}
                onChange={(e) => setSubjectCode(e.target.value)}
                placeholder="e.g. CS-401 (optional)"
                className="w-full bg-[#1A1827] border border-slate-700/60 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500 transition"
              />
            </div>
          </div>

          {/* Syllabus Content with Write / Preview Tabs */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Syllabus Content (Section A & Section B) *
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleUseTemplate}
                  className="text-xs text-sky-400 hover:text-sky-300 transition underline underline-offset-2"
                >
                  Load Template
                </button>
                {content.trim().length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearContent}
                    className="text-xs text-rose-400 hover:text-rose-300 transition flex items-center gap-1 underline underline-offset-2"
                    title="Clear all syllabus content"
                  >
                    <Trash2 size={11} />
                    <span>Clear</span>
                  </button>
                )}
                <div className="flex items-center bg-[#1A1827] border border-slate-800 rounded-lg p-0.5 ml-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab('write')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition ${
                      activeTab === 'write' ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Edit3 size={12} />
                    Write
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('preview')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition ${
                      activeTab === 'preview' ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Eye size={12} />
                    Preview
                  </button>
                </div>
              </div>
            </div>

            {activeTab === 'write' ? (
              <div>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={`SECTION-A\nChapter 1: ...\nTopics...\n\nSECTION-B\nChapter 2: ...\nTopics...`}
                  rows={10}
                  className="w-full bg-[#1A1827] border border-slate-700/60 rounded-xl p-3.5 text-sm font-mono text-slate-200 focus:outline-none focus:border-sky-500 transition resize-none leading-relaxed"
                  required
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Tip: Separate sections with <code className="text-sky-400">SECTION-A</code> and <code className="text-sky-400">SECTION-B</code>. Chapters can include hours like <code className="text-slate-400">(05)</code>.
                </p>
              </div>
            ) : (
              <div className="w-full h-64 overflow-y-auto bg-[#1A1827] border border-slate-800 rounded-xl p-4 text-xs font-mono text-slate-300 whitespace-pre-wrap leading-relaxed">
                {content.trim() ? (
                  content
                ) : (
                  <span className="text-slate-600 italic">No content typed yet. Switch back to Write to enter syllabus.</span>
                )}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800/80">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-sm font-medium hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-sm font-semibold hover:opacity-95 hover:shadow-lg hover:shadow-blue-500/20 transition disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>Saving Syllabus...</>
              ) : (
                <>
                  <Check size={16} />
                  Save Syllabus
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSyllabusModal;
