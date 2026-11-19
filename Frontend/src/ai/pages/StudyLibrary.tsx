import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, ArrowRight, BookOpen, FileText, Loader2, LockKeyhole, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { studyApi, studyError } from '../api/study.api';
import StudyUploadDialog from '../components/study/StudyUploadDialog';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import { formatBytes } from '../components/study/studyUtils';

export default function StudyLibrary() {
  const navigate = useNavigate();
  const [data, setData] = useState<any>({ workspaces: [], usage: {}, limits: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);
  const refresh = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await studyApi.list(signal);
      if (!signal?.aborted) { setData(response); setError(''); }
    } catch (failure: any) { if (failure?.name !== 'AbortError') setError(studyError(failure)); }
    finally { if (!signal?.aborted) setLoading(false); }
  }, []);

  useEffect(() => { const controller = new AbortController(); refresh(controller.signal); return () => controller.abort(); }, [refresh]);

  const workspaces = Array.isArray(data.workspaces) ? data.workspaces : [];
  const used = Number(data.usage?.subjects ?? workspaces.length);
  const maximum = Number(data.limits?.maxSubjects || data.limits?.subjects || 6);
  const storageBytes = Number(data.usage?.storageBytes || 0);
  const reservedBytes = Number(data.usage?.reservedBytes || 0);
  const maxStorage = Number(data.limits?.userBytes || data.limits?.maxStorageBytes || data.limits?.storageBytes || 0);
  const atLimit = used >= maximum;

  const deleteWorkspace = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try { await studyApi.remove(deleteTarget.id); setDeleteTarget(null); await refresh(); }
    catch (failure) { setError(studyError(failure)); }
    finally { setDeleting(false); }
  };

  return (
    <div className="min-h-screen bg-[#0E0C15] text-slate-200 px-4 py-7 sm:px-8 lg:px-12 pb-24">
      <div className="max-w-6xl mx-auto">
        <Link to="/ai" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-sky-300 mb-7"><ArrowLeft size={16} /> EDU AI</Link>
        <header className="flex flex-col sm:flex-row sm:items-start justify-between gap-5 mb-7">
          <div><div className="flex items-center gap-3 mb-3"><BookOpen className="text-sky-400" size={27} /><h1 className="text-2xl sm:text-3xl font-bold text-white">My Study Subjects</h1></div><p className="text-sm text-slate-400 max-w-xl leading-relaxed">Study from your own syllabus, notes, or both. Upload PDFs or paste text, ask questions, and practice with answers linked to your pages.</p><p className="text-xs text-sky-300 flex items-center gap-1.5 mt-3"><LockKeyhole size={13} /> Private to your account · available to students, professors, and admins</p></div>
          <button onClick={() => setUploadOpen(true)} disabled={loading || atLimit} className="edus-btn shrink-0 disabled:opacity-40"><Plus size={17} /> Add study subject</button>
        </header>

        <div className="grid sm:grid-cols-2 gap-3 mb-7">
          <div className="edus-card p-4"><div className="flex justify-between items-center text-sm"><span className="text-slate-400">Study subjects</span><span className="font-semibold text-white">{used} / {maximum}</span></div><div role="progressbar" aria-label="Study subject limit" aria-valuenow={used} aria-valuemin={0} aria-valuemax={maximum} className="h-1.5 rounded-full bg-slate-800 mt-3 overflow-hidden"><div className="h-full bg-sky-500" style={{ width: `${Math.min(100, (used / maximum) * 100)}%` }} /></div>{atLimit && <p className="text-xs text-amber-300 mt-3">Subject limit reached ({maximum}/{maximum}). Delete an existing subject to add a new one.</p>}</div>
          <div className="edus-card p-4"><div className="flex justify-between gap-3 items-center text-sm"><span className="text-slate-400">Study storage</span><span className="font-semibold text-white">{formatBytes(storageBytes)}{maxStorage > 0 ? ` / ${formatBytes(maxStorage)}` : ''}</span></div><p className="text-xs text-slate-500 mt-3">{reservedBytes > 0 ? `${formatBytes(reservedBytes)} reserved for uploads. ` : ''}One syllabus and up to five notes sources in each subject.</p></div>
        </div>

        {error && <div role="alert" className="flex flex-wrap items-center gap-3 text-sm text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 mb-6"><AlertCircle size={18} /><span className="flex-1">{error}</span><button onClick={() => refresh()} className="text-xs underline inline-flex gap-1 items-center"><RefreshCw size={13} /> Refresh</button></div>}
        {loading ? <div className="flex items-center justify-center gap-3 text-sm text-slate-400 py-20"><Loader2 className="animate-spin" size={22} /> Loading your study subjects…</div> : workspaces.length ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{workspaces.map((workspace: any) => <article key={workspace.id} className="edus-card p-5 flex flex-col min-h-48">
            <div className="flex justify-between gap-3 mb-4"><div className="rounded-xl bg-sky-500/10 border border-sky-500/20 p-2.5 text-sky-400"><FileText size={20} /></div><button onClick={() => setDeleteTarget(workspace)} aria-label={`Delete ${workspace.title}`} className="p-2 self-start text-slate-500 rounded-lg hover:bg-rose-500/10 hover:text-rose-300"><Trash2 size={16} /></button></div>
            <h2 className="text-lg font-semibold text-white break-words">{workspace.title}</h2><p className="text-xs text-slate-500 mt-2 mb-5">{[workspace.branch, workspace.semester ? `Semester ${String(workspace.semester).replace('semester_', '')}` : null].filter(Boolean).join(' · ') || 'Your private study space'}</p>
            <Link to={`/ai/study/${workspace.id}`} className="mt-auto flex items-center justify-between text-sm text-sky-300 hover:text-white">Open subject <ArrowRight size={16} /></Link>
          </article>)}</div>
        ) : <div className="edus-card text-center py-14 px-5"><BookOpen size={35} className="text-sky-400 mx-auto mb-4" /><h2 className="text-lg font-semibold text-white mb-2">Your material, your study space</h2><p className="text-sm text-slate-400 max-w-md mx-auto mb-5">Start with lecture notes, a syllabus, or upload both together. Upload scanned or selectable PDFs, or paste syllabus and notes text directly.</p><button onClick={() => setUploadOpen(true)} disabled={Boolean(error)} className="edus-btn disabled:opacity-40"><Plus size={16} /> Create your first subject</button></div>}
      </div>
      {uploadOpen && <StudyUploadDialog limits={data.limits} onClose={() => { setUploadOpen(false); refresh(); }} onChanged={() => refresh()} onComplete={(id: string) => navigate(`/ai/study/${id}`)} />}
      <DeleteConfirmationModal isOpen={Boolean(deleteTarget)} title="Delete study subject" itemName={deleteTarget?.title || ''} description="Delete your private study subject" warning="Its PDFs and searchable content will be removed. This cannot be undone." isDeleting={deleting} onClose={() => { if (!deleting) setDeleteTarget(null); }} onConfirm={deleteWorkspace} />
    </div>
  );
}
