import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, FileText, Loader2, LockKeyhole, Upload, X } from 'lucide-react';
import { studyApi, studyError } from '../../api/study.api';
import { formatBytes, uploadStudyFiles } from './studyUtils';

type UploadItem = {
  key: string; kind: 'syllabus' | 'notes'; file: File; containsHandwriting: boolean;
  documentId?: string; uploaded?: boolean; state?: string; error?: string;
};

export default function StudyUploadDialog({ workspace, documents = [], limits = {}, onClose, onChanged, onComplete }: any) {
  const [title, setTitle] = useState('');
  const [branch, setBranch] = useState('');
  const [semester, setSemester] = useState('');
  const [mode, setMode] = useState<'notes' | 'syllabus' | 'both'>('notes');
  const [items, setItems] = useState<UploadItem[]>([]);
  const [workspaceId, setWorkspaceId] = useState(workspace?.id || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [hasAttempted, setHasAttempted] = useState(false);
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const dialogRef = useRef<HTMLDivElement>(null);
  const notesMaxBytes = Number(limits.notesBytes || limits.maxFileBytes || 20 * 1024 * 1024);
  const syllabusMaxBytes = Number(limits.syllabusBytes || 5 * 1024 * 1024);
  const activeDocuments = documents.filter((d: any) => !['deleting', 'deleted'].includes(d.status));
  const existingNotes = activeDocuments.filter((d: any) => d.kind === 'notes').length;
  const hasSyllabus = activeDocuments.some((d: any) => d.kind === 'syllabus');
  const maxNotes = Number(limits.notesPerSubject || limits.maxNotesPerSubject || limits.maxNotes || 5);
  const selected = items.filter((item) => mode === 'both' || item.kind === mode);

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement;
    dialogRef.current?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) onClose();
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const controls = Array.from(dialogRef.current.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), [tabindex="0"]'));
      if (!controls.length) return;
      if (event.shiftKey && document.activeElement === controls[0]) { event.preventDefault(); controls[controls.length - 1].focus(); }
      else if (!event.shiftKey && document.activeElement === controls[controls.length - 1]) { event.preventDefault(); controls[0].focus(); }
    };
    document.addEventListener('keydown', handleKey);
    return () => { document.removeEventListener('keydown', handleKey); previousFocus?.focus(); };
  }, [busy, onClose]);

  const chooseFiles = (kind: 'syllabus' | 'notes', files: FileList | null) => {
    setError('');
    if (!files) return;
    const selectedFiles = Array.from(files);
    if (selectedFiles.some((file) => !file.name.toLowerCase().endsWith('.pdf'))) { setError('Choose PDF files. Scanned and selectable text PDFs are supported.'); return; }
    const maxFileBytes = kind === 'syllabus' ? syllabusMaxBytes : notesMaxBytes;
    if (selectedFiles.some((file) => file.size <= 0 || file.size > maxFileBytes)) { setError(`Each ${kind === 'syllabus' ? 'syllabus' : 'notes'} PDF must be nonempty and no larger than ${formatBytes(maxFileBytes)}.`); return; }
    if (kind === 'notes' && existingNotes + selectedFiles.length > maxNotes) { setError(`A subject can contain up to ${maxNotes} notes PDFs. ${existingNotes} already added.`); return; }
    setItems((previous) => [...previous.filter((item) => item.kind !== kind), ...selectedFiles.map((file) => ({ key: crypto.randomUUID(), file, kind, containsHandwriting: false }))]);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if ((!workspaceId && !title.trim()) || !selected.length) { setError('Enter a subject title and choose at least one PDF.'); return; }
    if (mode !== 'notes' && !selected.some((item) => item.kind === 'syllabus')) { setError('Choose a syllabus PDF, or select Notes only.'); return; }
    if (mode !== 'syllabus' && !selected.some((item) => item.kind === 'notes')) { setError('Choose a notes PDF, or select Syllabus only.'); return; }
    setBusy(true); setError('');
    let targetId = workspaceId;
    try {
      if (!targetId) {
        const result = await studyApi.create({ title: title.trim(), branch: branch.trim() || undefined, semester: semester ? Number(semester) : undefined, idempotencyKey });
        targetId = result.workspace.id;
        setWorkspaceId(targetId);
        onChanged?.(targetId);
      }
      setHasAttempted(true);
      const results = await uploadStudyFiles(studyApi, targetId, selected, (updated: UploadItem) => {
        setItems((previous) => previous.map((item) => item.key === updated.key ? updated : item));
      });
      onChanged?.(targetId);
      if (results.every((item: UploadItem) => item.uploaded)) onComplete(targetId);
      else setError('Some PDFs could not be uploaded. Your subject and successful uploads are saved. Retry the failed files or open your subject.');
    } catch (failure) { setError(studyError(failure)); }
    finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
      <div ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="study-upload-title" className="w-full max-w-2xl max-h-[90dvh] overflow-y-auto bg-[#14121F] rounded-2xl border border-slate-700/70 p-5 sm:p-7 text-slate-200 outline-none">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div><h2 id="study-upload-title" className="text-xl font-bold text-white">{workspace ? 'Add study PDFs' : 'Create a study subject'}</h2><p className="text-xs text-slate-400 mt-2 flex items-center gap-1.5"><LockKeyhole size={13} /> Only you can access these subjects and PDFs.</p></div>
          <button onClick={onClose} disabled={busy} aria-label="Close upload" className="p-2 rounded-lg hover:bg-slate-800 disabled:opacity-40"><X size={20} /></button>
        </div>
        <form onSubmit={submit} className="space-y-5">
          {!workspace && <div className="space-y-3">
            <label className="block text-sm">Subject title<input value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={150} disabled={Boolean(workspaceId)} placeholder="e.g. Operating Systems" className="edus-input w-full mt-1.5" /></label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-xs text-slate-400">Branch (optional)<input value={branch} onChange={(e) => setBranch(e.target.value)} maxLength={80} disabled={Boolean(workspaceId)} placeholder="e.g. CSE" className="edus-input w-full mt-1.5" /></label>
              <label className="block text-xs text-slate-400">Semester (optional)<select value={semester} onChange={(e) => setSemester(e.target.value)} disabled={Boolean(workspaceId)} className="edus-input w-full mt-1.5"><option value="">Choose semester</option>{Array.from({ length: 8 }, (_, i) => <option key={i} value={i + 1}>Semester {i + 1}</option>)}</select></label>
            </div>
          </div>}
          <fieldset disabled={busy || hasAttempted}>
            <legend className="text-sm font-medium mb-2">What would you like to upload?</legend>
            <div className="grid grid-cols-3 gap-2">{[{ value: 'notes', label: 'Notes only' }, { value: 'syllabus', label: 'Syllabus only' }, { value: 'both', label: 'Both together' }].map((option) => <label key={option.value} className={`cursor-pointer rounded-xl px-2 py-3 text-center text-xs border ${mode === option.value ? 'border-sky-500 bg-sky-500/10 text-sky-300' : 'border-slate-700 text-slate-400'}`}><input type="radio" name="study-upload-mode" value={option.value} checked={mode === option.value} onChange={() => setMode(option.value as any)} className="sr-only" />{option.label}</label>)}</div>
            <p className="text-xs text-slate-500 mt-2">Start with either kind of PDF. You can add the other later.</p>
          </fieldset>
          {mode !== 'notes' && <label className="block rounded-xl border border-dashed border-slate-600 p-4 text-sm"><span className="flex items-center gap-2 font-medium"><FileText size={17} /> Syllabus PDF</span><p className="text-xs text-slate-400 mt-1">One syllabus · {formatBytes(syllabusMaxBytes)} · {limits.syllabusPages || 30} pages maximum.{hasSyllabus && ' Delete the current syllabus before adding another.'}</p><input aria-label="Choose syllabus PDF" type="file" accept="application/pdf,.pdf" disabled={busy || hasAttempted || hasSyllabus} onChange={(e) => chooseFiles('syllabus', e.target.files)} className="mt-3 block w-full text-xs file:mr-3 file:rounded-lg file:border-0 file:bg-slate-800 file:px-3 file:py-2 file:text-sky-300" /></label>}
          {mode !== 'syllabus' && <label className="block rounded-xl border border-dashed border-slate-600 p-4 text-sm"><span className="flex items-center gap-2 font-medium"><Upload size={17} /> Notes PDFs</span><p className="text-xs text-slate-400 mt-1">Up to {maxNotes} · {existingNotes} already added · {formatBytes(notesMaxBytes)} / {limits.notesPages || 150} pages per PDF</p><input aria-label="Choose notes PDFs" type="file" accept="application/pdf,.pdf" multiple disabled={busy || hasAttempted || existingNotes >= maxNotes} onChange={(e) => chooseFiles('notes', e.target.files)} className="mt-3 block w-full text-xs file:mr-3 file:rounded-lg file:border-0 file:bg-slate-800 file:px-3 file:py-2 file:text-sky-300" /></label>}
          {selected.length > 0 && <ul className="space-y-2">{selected.map((item) => <li key={item.key} className="rounded-xl bg-slate-900/70 p-3 border border-slate-800">
            <div className="flex gap-2 items-start">{item.uploaded ? <CheckCircle2 size={16} className="text-emerald-400 mt-0.5 shrink-0" /> : item.state === 'uploading' ? <Loader2 size={16} className="animate-spin text-sky-400 mt-0.5 shrink-0" /> : <FileText size={16} className="text-slate-400 mt-0.5 shrink-0" />}<div className="min-w-0 flex-1"><p className="text-sm break-words">{item.file.name}</p><p className="text-[11px] text-slate-500 mt-1">{item.kind === 'syllabus' ? 'Syllabus' : 'Notes'} · {formatBytes(item.file.size)}{item.uploaded ? ' · Uploaded, processing in your subject' : item.state === 'uploading' ? ' · Uploading…' : ''}</p></div></div>
            {!hasAttempted && <label className="flex items-center gap-2 text-xs text-slate-400 mt-3"><input type="checkbox" checked={item.containsHandwriting} onChange={(e) => setItems((previous) => previous.map((old) => old.key === item.key ? { ...old, containsHandwriting: e.target.checked } : old))} className="accent-sky-500" /> Contains handwriting</label>}
            {item.error && <p className="text-xs text-rose-300 mt-2" role="alert">{item.error}</p>}
          </li>)}</ul>}
          <p className="text-xs text-slate-400 leading-relaxed">Selectable text and photographed or scanned pages are supported. Free handwriting and difficult-page OCR is limited to at most 10 pages per day per account, subject to shared capacity. Larger files may be partially processed. Successful readings are reused on retry. Check the original for unclear handwriting or equations.</p>
          {error && <div role="alert" className="flex gap-2 text-sm text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded-xl p-3"><AlertCircle size={16} className="shrink-0 mt-0.5" /><span>{error}</span></div>}
          <div className="flex flex-wrap justify-end gap-3 border-t border-slate-800 pt-4">
            {workspaceId && hasAttempted && <button type="button" disabled={busy} onClick={() => onComplete(workspaceId)} className="edus-btn-ghost">Open subject</button>}
            <button type="button" disabled={busy} onClick={onClose} className="edus-btn-ghost">Close</button>
            <button type="submit" disabled={busy || !selected.length || (mode !== 'notes' && hasSyllabus)} className="edus-btn disabled:opacity-40">{busy ? <><Loader2 size={16} className="animate-spin" /> Uploading…</> : hasAttempted ? 'Retry failed uploads' : workspace ? 'Upload PDFs' : 'Create & upload'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
