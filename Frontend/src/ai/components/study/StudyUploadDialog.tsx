import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, FileText, Loader2, LockKeyhole, Upload, X } from 'lucide-react';
import { studyApi, studyError } from '../../api/study.api';
import { formatBytes, uploadStudyFiles } from './studyUtils';

type UploadItem = {
  key: string; kind: 'syllabus' | 'notes'; file?: File; containsHandwriting?: boolean; sourceType?: 'pdf' | 'text'; title?: string; content?: string;
  documentId?: string; uploaded?: boolean; state?: string; error?: string;
};

export default function StudyUploadDialog({ workspace, documents = [], limits = {}, onClose, onChanged, onComplete }: any) {
  const [title, setTitle] = useState('');
  const [branch, setBranch] = useState('');
  const [semester, setSemester] = useState('');
  const [mode, setMode] = useState<'notes' | 'syllabus' | 'both'>('notes');
  const [items, setItems] = useState<UploadItem[]>([]);
  const [inputTypes, setInputTypes] = useState<Record<string, string>>({ syllabus: 'pdf', notes: 'pdf' });
  const [textDrafts, setTextDrafts] = useState<Record<string, UploadItem>>(() => ({
    syllabus: { key: crypto.randomUUID(), kind: 'syllabus', sourceType: 'text', title: 'Syllabus', content: '' },
    notes: { key: crypto.randomUUID(), kind: 'notes', sourceType: 'text', title: 'Notes', content: '' },
  }));
  const textMax = Number(limits.pastedTextCharacters || 50000);
  const textMaxBytes = Number(limits.pastedTextBytes || 65536);
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
  const selected = (['syllabus', 'notes'] as const).filter(kind => mode === 'both' || mode === kind).flatMap(kind =>
    inputTypes[kind] === 'text' ? (textDrafts[kind].content?.trim() ? [textDrafts[kind]] : []) : items.filter(item => item.kind === kind)
  );

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement;
    dialogRef.current?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) onClose();
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const controls = Array.from(dialogRef.current.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]'));
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
    if ((!workspaceId && !title.trim()) || !selected.length) { setError('Enter a subject title and add a PDF or paste text.'); return; }
    if (mode !== 'notes' && !selected.some((item) => item.kind === 'syllabus')) { setError('Add a syllabus PDF or paste the syllabus text, or select Notes only.'); return; }
    if (mode !== 'syllabus' && !selected.some((item) => item.kind === 'notes')) { setError('Add a notes PDF or paste notes, or select Syllabus only.'); return; }
    const invalidText = selected.find(item => item.sourceType === 'text' && (!item.title?.trim() || (item.content?.length || 0) > textMax || new TextEncoder().encode(item.content || '').length > textMaxBytes));
    if (invalidText) { setError('Each pasted source needs a title and must fit 50,000 characters and 64 KiB.'); return; }
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
        if (updated.sourceType === 'text') setTextDrafts(previous => ({ ...previous, [updated.kind]: updated }));
        else setItems((previous) => previous.map((item) => item.key === updated.key ? updated : item));
      });
      onChanged?.(targetId);
      if (results.every((item: UploadItem) => item.uploaded)) onComplete(targetId);
      else setError('Some sources could not be saved. Your subject and successful sources are saved. Retry the failed files or open your subject.');
    } catch (failure) { setError(studyError(failure)); }
    finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
      <div ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="study-upload-title" className="w-full max-w-2xl max-h-[90dvh] overflow-y-auto bg-[#14121F] rounded-2xl border border-slate-700/70 p-5 sm:p-7 text-slate-200 outline-none">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div><h2 id="study-upload-title" className="text-xl font-bold text-white">{workspace ? 'Add study material' : 'Create a study subject'}</h2><p className="text-xs text-slate-400 mt-2 flex items-center gap-1.5"><LockKeyhole size={13} /> Only you can access these subjects and sources.</p></div>
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
            <legend className="text-sm font-medium mb-2">What would you like to add?</legend>
            <div className="grid grid-cols-3 gap-2">{[{ value: 'notes', label: 'Notes only' }, { value: 'syllabus', label: 'Syllabus only' }, { value: 'both', label: 'Both together' }].map((option) => <label key={option.value} className={`cursor-pointer rounded-xl px-2 py-3 text-center text-xs border ${mode === option.value ? 'border-sky-500 bg-sky-500/10 text-sky-300' : 'border-slate-700 text-slate-400'}`}><input type="radio" name="study-upload-mode" value={option.value} checked={mode === option.value} onChange={() => setMode(option.value as any)} className="sr-only" />{option.label}</label>)}</div>
            <p className="text-xs text-slate-500 mt-2">Choose a PDF or paste text separately for each kind of material. You can add the other later.</p>
          </fieldset>
          {(['syllabus', 'notes'] as const).filter(kind => mode === 'both' || mode === kind).map(kind => {
            const label = kind === 'syllabus' ? 'Syllabus' : 'Notes';
            const blocked = kind === 'syllabus' ? hasSyllabus : existingNotes >= maxNotes;
            const draft = textDrafts[kind];
            return <fieldset key={kind} disabled={busy || hasAttempted || blocked} className="rounded-xl border border-slate-700 p-4 min-w-0">
              <legend className="px-1 text-sm font-medium">{label}</legend>
              <div className="flex gap-2 mb-3" role="group" aria-label={`${label} input method`}>{[{ id: 'pdf', label: 'Upload PDF' }, { id: 'text', label: 'Paste text' }].map(option => <button key={option.id} type="button" aria-pressed={inputTypes[kind] === option.id} onClick={() => setInputTypes(previous => ({ ...previous, [kind]: option.id }))} className={`rounded-lg px-3 py-2 text-xs border ${inputTypes[kind] === option.id ? 'border-sky-500 text-sky-300 bg-sky-500/10' : 'border-slate-700 text-slate-400'}`}>{option.label}</button>)}</div>
              {blocked && <p className="text-xs text-amber-300 mb-3">{kind === 'syllabus' ? 'Delete the current syllabus before adding another.' : `The ${maxNotes}-notes limit is reached. Remove a source to add another.`}</p>}
              {inputTypes[kind] === 'pdf' ? <label className="block text-xs text-slate-400">{kind === 'syllabus' ? `One PDF · ${formatBytes(syllabusMaxBytes)} · ${limits.syllabusPages || 30} pages maximum` : `Up to ${maxNotes} notes sources · ${existingNotes} already added · ${formatBytes(notesMaxBytes)} / ${limits.notesPages || 150} pages per PDF`}
                <input aria-label={`Choose ${kind === 'syllabus' ? 'syllabus PDF' : 'notes PDFs'}`} type="file" accept="application/pdf,.pdf" multiple={kind === 'notes'} onChange={e => chooseFiles(kind, e.target.files)} className="mt-3 block w-full text-xs file:mr-3 file:rounded-lg file:border-0 file:bg-slate-800 file:px-3 file:py-2 file:text-sky-300" />
              </label> : <div className="space-y-3">
                <label className="block text-xs text-slate-400">{label} title<input aria-label={`${label} text title`} value={draft.title || ''} maxLength={120} onChange={e => setTextDrafts(previous => ({ ...previous, [kind]: { ...previous[kind], title: e.target.value } }))} className="edus-input w-full mt-1.5 text-sm" /></label>
                <label className="block text-xs text-slate-400">Paste {kind === 'syllabus' ? 'your syllabus' : 'your notes'}<textarea aria-label={`Paste ${kind} text`} value={draft.content || ''} maxLength={textMax} rows={7} onChange={e => setTextDrafts(previous => ({ ...previous, [kind]: { ...previous[kind], content: e.target.value } }))} placeholder={kind === 'syllabus' ? 'Paste units, chapters, topics and learning outcomes…' : 'Paste lecture notes, definitions, explanations or examples…'} className="edus-input w-full mt-1.5 text-sm resize-y" /></label>
                <p className="text-[11px] text-slate-500">{(draft.content?.length || 0).toLocaleString()} / {textMax.toLocaleString()} characters · up to 64 KiB. One pasted block counts as one {kind === 'syllabus' ? 'syllabus' : 'notes source'}. It uses the same private study search.</p>
              </div>}
            </fieldset>;
          })}
          {selected.length > 0 && <ul className="space-y-2">{selected.map((item) => <li key={item.key} className="rounded-xl bg-slate-900/70 p-3 border border-slate-800">
            <div className="flex gap-2 items-start">{item.uploaded ? <CheckCircle2 size={16} className="text-emerald-400 mt-0.5 shrink-0" /> : item.state === 'uploading' ? <Loader2 size={16} className="animate-spin text-sky-400 mt-0.5 shrink-0" /> : <FileText size={16} className="text-slate-400 mt-0.5 shrink-0" />}<div className="min-w-0 flex-1"><p className="text-sm break-words">{item.sourceType === 'text' ? item.title : item.file?.name}</p><p className="text-[11px] text-slate-500 mt-1">{item.kind === 'syllabus' ? 'Syllabus' : 'Notes'} · {formatBytes(item.sourceType === 'text' ? new TextEncoder().encode(item.content || '').length : item.file?.size)}{item.uploaded ? ' · Saved, processing in your subject' : item.state === 'uploading' ? ' · Saving…' : ''}</p></div></div>
            {!hasAttempted && item.sourceType !== 'text' && <label className="flex items-center gap-2 text-xs text-slate-400 mt-3"><input type="checkbox" checked={item.containsHandwriting} onChange={(e) => setItems((previous) => previous.map((old) => old.key === item.key ? { ...old, containsHandwriting: e.target.checked } : old))} className="accent-sky-500" /> Contains handwriting</label>}
            {item.error && <p className="text-xs text-rose-300 mt-2" role="alert">{item.error}</p>}
          </li>)}</ul>}
          <p className="text-xs text-slate-400 leading-relaxed">Selectable text and photographed or scanned pages are supported. Free handwriting and difficult-page OCR is limited to at most 10 pages per day per account, subject to shared capacity. Larger files may be partially processed. Successful readings are reused on retry. Check the original for unclear handwriting or equations.</p>
          {error && <div role="alert" className="flex gap-2 text-sm text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded-xl p-3"><AlertCircle size={16} className="shrink-0 mt-0.5" /><span>{error}</span></div>}
          <div className="flex flex-wrap justify-end gap-3 border-t border-slate-800 pt-4">
            {workspaceId && hasAttempted && <button type="button" disabled={busy} onClick={() => onComplete(workspaceId)} className="edus-btn-ghost">Open subject</button>}
            <button type="button" disabled={busy} onClick={onClose} className="edus-btn-ghost">Close</button>
            <button type="submit" disabled={busy || !selected.length || (mode !== 'notes' && hasSyllabus)} className="edus-btn disabled:opacity-40">{busy ? <><Loader2 size={16} className="animate-spin" /> Saving…</> : hasAttempted ? 'Retry failed sources' : workspace ? 'Save material' : 'Create & save'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
