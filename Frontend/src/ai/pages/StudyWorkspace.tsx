import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, BookOpen, CheckCircle2, ChevronLeft, ChevronRight, FileText, Layers, Loader2, LockKeyhole, MessageSquare, Plus, RefreshCw, Send, Trash2, X } from 'lucide-react';
import { studyApi, studyError } from '../api/study.api';
import StudyUploadDialog from '../components/study/StudyUploadDialog';
import StudySelect from '../components/study/StudySelect';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import PdfViewer from '../../components/previews/PdfViewer';
import { correctOptionIndex, documentStatus, formatBytes, isFailed, isProcessing, isReady, sourcesForItem, STATUS_LABELS } from '../components/study/studyUtils';

type Source = { id: string; documentId: string; title: string; page: number; excerpt?: string; sourceType?: 'pdf' | 'text' };
type Message = { role: 'user' | 'assistant'; content: string; sources?: Source[]; incomplete?: boolean; generalKnowledgeUsed?: boolean; insufficientEvidence?: boolean };

function SourceButtons({ sources = [], onOpen }: { sources?: Source[]; onOpen: (source: Source) => void }) {
  if (!sources.length) return null;
  return (
    <div className="study-citations" aria-label="Answer sources">
      {sources.map((source, index) => (
        <button
          key={`${source.id || source.documentId}-${source.page}-${index}`}
          onClick={() => onOpen(source)}
          title={`${source.title}${source.excerpt ? `: ${source.excerpt}` : ''}`}
          className="study-citation"
        >
          <FileText size={14} className="shrink-0" aria-hidden="true" />
          <span className="shrink-0">[{source.id || index + 1}]</span>
          <span className="study-citation-title">{source.title || 'Source'}</span>
          <span className="study-citation-page">{source.sourceType === 'text' ? 'Text' : `p. ${source.page || 1}`}</span>
        </button>
      ))}
    </div>
  );
}

export default function StudyWorkspace() {
  const { workspaceId = '' } = useParams();
  const [workspace, setWorkspace] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [limits, setLimits] = useState<any>({});
  const [usage, setUsage] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);
  const [retryingId, setRetryingId] = useState('');
  const [filter, setFilter] = useState('all');
  const [allSources, setAllSources] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [tab, setTab] = useState<'chat' | 'flashcards' | 'mcq'>('chat');
  const [mode, setMode] = useState<'notes_only' | 'general'>('notes_only');
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatBusy, setChatBusy] = useState(false);
  const [chatError, setChatError] = useState('');
  const [generationError, setGenerationError] = useState('');
  const [generationBusy, setGenerationBusy] = useState(false);
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [cards, setCards] = useState<any[]>([]);
  const [quiz, setQuiz] = useState<any[]>([]);
  const [practiceSources, setPracticeSources] = useState<{ flashcards: Source[]; mcq: Source[] }>({ flashcards: [], mcq: [] });
  const [cardIndex, setCardIndex] = useState(0);
  const [cardFlipped, setCardFlipped] = useState(false);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [source, setSource] = useState<Source | null>(null);
  const [sourceUrl, setSourceUrl] = useState('');
  const [sourceText, setSourceText] = useState<string | null>(null);
  const [sourceError, setSourceError] = useState('');
  const [sourceLoading, setSourceLoading] = useState(false);
  const chatAbort = useRef<AbortController | null>(null);
  const generationAbort = useRef<AbortController | null>(null);
  const sourceRequest = useRef(0);
  const transcriptEnd = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await studyApi.get(workspaceId, signal);
      if (!signal?.aborted) { setWorkspace(response.workspace); setDocuments(response.documents || []); setError(''); }
    } catch (failure: any) { if (failure?.name !== 'AbortError') setError(studyError(failure)); }
    finally { if (!signal?.aborted) setLoading(false); }
  }, [workspaceId]);
  const refreshUsage = useCallback(async () => {
    try { const response = await studyApi.list(); setLimits(response.limits || {}); setUsage(response.usage || {}); }
    catch { /* Workspace remains usable if the optional usage request fails. */ }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    refresh(controller.signal);
    return () => { controller.abort(); chatAbort.current?.abort(); generationAbort.current?.abort(); sourceRequest.current += 1; };
  }, [refresh, refreshUsage]);

  const processing = documents.some(isProcessing);
  const polling = documents.some(document => isProcessing(document) || ['uploading', 'deleting'].includes(document.status));
  useEffect(() => { if (!polling) refreshUsage(); }, [polling, refreshUsage]);
  useEffect(() => {
    if (!polling) return;
    const controller = new AbortController();
    let inFlight = false;
    const interval = window.setInterval(async () => {
      if (document.hidden || inFlight) return;
      inFlight = true;
      await refresh(controller.signal);
      inFlight = false;
    }, 4000);
    return () => { clearInterval(interval); controller.abort(); };
  }, [polling, refresh]);

  useEffect(() => { transcriptEnd.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }, [messages, chatBusy]);
  useEffect(() => { setCardIndex(0); setCardFlipped(false); }, [cards]);
  useEffect(() => { setCardFlipped(false); }, [cardIndex]);

  const ready = documents.filter(isReady);
  const effectiveIds = allSources ? undefined : selectedIds.filter((id) => ready.some((doc: any) => doc.id === id));
  const canRetrieve = ready.length > 0 && (allSources || Boolean(effectiveIds?.length));
  const visibleDocuments = documents.filter((doc) => filter === 'all' || doc.kind === filter);
  const workspaceBytes = documents.reduce((total, doc) => total + Number(doc.sizeBytes || 0), 0);

  const openSource = async (nextSource: Source) => {
    const request = ++sourceRequest.current;
    setSource(nextSource); setSourceUrl(''); setSourceText(null); setSourceError(''); setSourceLoading(true);
    try {
      const result = await studyApi.source(nextSource.documentId);
      if (sourceRequest.current === request) { if (result.type === 'text') setSourceText(result.content); else setSourceUrl(result.url); }
    } catch (failure) { if (sourceRequest.current === request) setSourceError(studyError(failure)); }
    finally { if (sourceRequest.current === request) setSourceLoading(false); }
  };

  const deleteDocument = async () => {
    if (!deleteTarget) return;
    setDeleting(true); setActionError('');
    try {
      await studyApi.removeDocument(deleteTarget.id);
      setSelectedIds((previous) => previous.filter((id) => id !== deleteTarget.id));
      if (source?.documentId === deleteTarget.id) { setSource(null); sourceRequest.current += 1; }
      setDeleteTarget(null); await refresh(); refreshUsage();
      setMessages([]); setCards([]); setQuiz([]); setPracticeSources({ flashcards: [], mcq: [] });
    } catch (failure) { setActionError(studyError(failure)); }
    finally { setDeleting(false); }
  };

  const retryDocument = async (id: string) => {
    setRetryingId(id); setActionError('');
    try { await studyApi.retry(id); await refresh(); }
    catch (failure) { setActionError(studyError(failure)); }
    finally { setRetryingId(''); }
  };

  const sendQuestion = async (event: React.FormEvent) => {
    event.preventDefault();
    const text = question.trim();
    if (!text || chatBusy || !canRetrieve) return;
    const history = messages.slice(-10).map(({ role, content }) => ({ role, content: content.slice(0, 2000) }));
    const controller = new AbortController(); chatAbort.current = controller;
    setQuestion(''); setChatError(''); setChatBusy(true);
    setMessages((previous) => [...previous, { role: 'user', content: text }]);
    try {
      const result = await studyApi.chat(workspaceId, { question: text, mode, documentIds: effectiveIds, history }, controller.signal);
      if (!controller.signal.aborted) setMessages((previous) => [...previous, { role: 'assistant', content: result.answer || 'No answer was returned. Please try again.', sources: result.sources || [], incomplete: result.incomplete, generalKnowledgeUsed: result.generalKnowledgeUsed, insufficientEvidence: result.insufficientEvidence }]);
    } catch (failure: any) {
      if (failure?.name !== 'AbortError') { setChatError(studyError(failure)); setQuestion((current) => current || text); setMessages((previous) => previous.slice(0, -1)); }
    } finally { if (!controller.signal.aborted) setChatBusy(false); }
  };

  const generate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canRetrieve || generationBusy) return;
    const controller = new AbortController(); generationAbort.current = controller;
    setGenerationBusy(true); setGenerationError('');
    try {
      const result = await studyApi.generate(workspaceId, tab, { documentIds: effectiveIds, topic: topic.trim() || undefined, difficulty }, controller.signal);
      if (!Array.isArray(result.items) || !result.items.length) throw new Error('No practice items were found in the selected sources. Try a different topic or source.');
      if (tab === 'flashcards') {
        if (result.items.some((item: any) => typeof item.question !== 'string' || typeof item.answer !== 'string')) throw new Error('The flashcards could not be read. Please generate them again.');
        setCards(result.items);
      } else {
        if (result.items.some((item: any) => typeof item.question !== 'string' || !Array.isArray(item.options) || item.options.length < 2)) throw new Error('The quiz could not be read. Please generate it again.');
        setQuiz(result.items); setAnswers({});
      }
      setPracticeSources((previous) => ({ ...previous, [tab]: result.sources || [] }));
    } catch (failure: any) { if (failure?.name !== 'AbortError') setGenerationError(studyError(failure)); }
    finally { if (!controller.signal.aborted) setGenerationBusy(false); }
  };

  if (loading) return <div className="min-h-screen flex justify-center items-center gap-3 text-slate-400 bg-[#0E0C15]"><Loader2 className="animate-spin" /> Loading study subject…</div>;
  if (!workspace) return <div className="min-h-screen bg-[#0E0C15] text-slate-200 p-8 flex flex-col items-center justify-center gap-5 text-center"><AlertCircle size={30} className="text-rose-300" /><p>{error || 'This private study subject is unavailable.'}</p><Link to="/ai/study" className="edus-btn">Back to my subjects</Link></div>;

  return (
    <div className="study-workspace min-h-screen bg-[#0E0C15] text-slate-200 px-4 sm:px-6 lg:px-8 pb-24">
      <div className="max-w-[1440px] mx-auto">
        <Link to="/ai/study" className="inline-flex gap-2 items-center text-sm text-slate-400 hover:text-sky-300 mb-5"><ArrowLeft size={16} /> My Study Subjects</Link>
        <header className="flex flex-col sm:flex-row justify-between gap-5 mb-8 sm:items-center">
          <div className="min-w-0"><h1 className="text-2xl sm:text-3xl font-bold text-white break-words">{workspace.title}</h1><p className="text-sm text-slate-400 mt-3 flex items-center flex-wrap gap-2"><LockKeyhole size={13} /><span>Private to you</span>{workspace.branch && <span>· {workspace.branch}</span>}{workspace.semester && <span>· Semester {String(workspace.semester).replace('semester_', '')}</span>}</p></div>
          <button onClick={() => setUploadOpen(true)} className="edus-btn shrink-0 self-start"><Plus size={16} /> Add material</button>
        </header>
        {(error || actionError) && <div role="alert" className="flex items-start gap-2 mb-5 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-300"><AlertCircle size={16} className="shrink-0 mt-0.5" /><span className="flex-1">{actionError || error}</span><button onClick={() => { setActionError(''); refresh(); }} className="text-xs underline">Refresh</button></div>}
        <div className="grid lg:grid-cols-[320px_minmax(0,1fr)] xl:grid-cols-[340px_minmax(0,1fr)] gap-6 items-start">
          <aside className="study-sidebar edus-card min-w-0 lg:sticky lg:top-24">
            <div className="flex items-center justify-between gap-2 mb-2"><h2 className="font-semibold text-white flex items-center gap-2"><BookOpen size={17} className="text-sky-400" /> Your material</h2><button onClick={() => { refresh(); refreshUsage(); }} aria-label="Refresh documents" className="study-icon-button text-slate-400 hover:text-sky-300"><RefreshCw size={14} /></button></div>
            <p className="study-storage">{ready.length} searchable · {formatBytes(workspaceBytes)}{limits.subjectBytes ? ` / ${formatBytes(limits.subjectBytes)}` : ''}<br />{usage.storageBytes != null && `Account storage: ${formatBytes(usage.storageBytes)}${limits.userBytes ? ` / ${formatBytes(limits.userBytes)}` : ''}`}</p>
            <div className="study-filters">{['all', 'syllabus', 'notes'].map((value) => <button key={value} aria-pressed={filter === value} onClick={() => setFilter(value)} className={`rounded-lg px-3 py-1.5 text-xs capitalize ${filter === value ? 'bg-sky-500/15 text-sky-300' : 'text-slate-400 hover:bg-slate-800'}`}>{value}</button>)}</div>
            <div className="space-y-3 max-h-[45dvh] lg:max-h-[52dvh] overflow-y-auto pr-1">
              {visibleDocuments.length ? visibleDocuments.map((doc) => {
                const status = documentStatus(doc);
                const pending = isProcessing(doc);
                const failed = isFailed(doc) || status === 'partial';
                const stage = doc.processingStage;
                const statusLabel = pending && typeof stage === 'string' ? (STATUS_LABELS[stage] || STATUS_LABELS[status] || 'Processing PDF') : (STATUS_LABELS[status] || (status === 'reserved' ? 'Waiting for upload' : status === 'partial' ? 'Some pages need attention' : status));
                return <article key={doc.id} className="study-document rounded-xl border bg-slate-900/40">
                  <div className="flex gap-2 items-start"><FileText size={16} className="text-slate-400 shrink-0 mt-0.5" /><div className="min-w-0 flex-1"><p className="study-document-title">{doc.filename}</p><p className="study-document-meta capitalize">{doc.kind} · {formatBytes(doc.sizeBytes)}{doc.sourceType === 'text' ? ' · Pasted text' : ''}{doc.sourceType !== 'text' && doc.pageCount ? ` · ${doc.pageCount} pages` : ''}</p></div></div>
                  <p className={`study-document-status flex items-center gap-2 ${status === 'ready' ? 'text-emerald-400' : failed ? 'text-amber-300' : 'text-sky-300'}`}>{pending ? <Loader2 size={12} className="animate-spin" /> : status === 'ready' ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />} {statusLabel}</p>
                  {doc.error && <p className="text-xs text-rose-300 mt-2 leading-relaxed break-words">{typeof doc.error === 'string' ? doc.error : 'This PDF could not be fully processed.'}</p>}
                  {doc.reviewPages?.length > 0 && <details className="text-xs mt-3 text-amber-300"><summary className="cursor-pointer">Review {doc.reviewPages.length} page(s)</summary><div className="mt-2 flex flex-wrap gap-2">{doc.reviewPages.map((page: any) => <button key={page.page} onClick={() => openSource({ id: doc.id, documentId: doc.id, title: doc.filename, page: page.page })} className="border border-amber-500/25 rounded px-2 py-1">Page {page.page} · {page.quality === 'quota_limited' ? 'OCR quota reached' : page.quality === 'vision_unavailable' ? 'OCR unavailable' : 'Check original'}</button>)}</div></details>}
                  {doc.containsHandwriting && <p className="study-help mt-3">Handwriting marked</p>}
                  <div className="study-document-actions">
                    {!['reserved', 'uploading', 'deleting', 'deleted'].includes(status) && <button onClick={() => openSource({ id: doc.id, documentId: doc.id, title: doc.filename, page: 1 })} className="text-xs text-sky-300 hover:text-white">{doc.sourceType === 'text' ? 'View text' : 'View PDF'}</button>}
                    {failed && <button disabled={Boolean(retryingId)} onClick={() => retryDocument(doc.id)} className="text-xs text-amber-300 hover:text-white disabled:opacity-40">{retryingId === doc.id ? 'Retrying…' : 'Retry processing'}</button>}
                    {status !== 'deleting' && <button onClick={() => setDeleteTarget(doc)} className="study-icon-button ml-auto text-slate-400 hover:text-rose-300" aria-label={`Delete ${doc.filename}`}><Trash2 size={14} /></button>}
                  </div>
                  {status === 'reserved' && <p className="text-[11px] text-slate-500 mt-2">Upload did not finish. Remove this entry and upload the PDF again.</p>}
                </article>;
              }) : <p className="text-sm text-slate-500 py-4">{documents.length ? 'No sources of this kind.' : 'Add a syllabus, notes, or both to begin.'}</p>}
            </div>
            <div className="study-source-settings">
              <label className="study-field-label" htmlFor="study-source-scope">Use these sources</label>
              <StudySelect id="study-source-scope" value={allSources ? 'all' : 'selected'} onChange={(e) => setAllSources(e.target.value === 'all')} className="text-sm"><option value="all">All searchable sources ({ready.length})</option><option value="selected">Choose searchable sources</option></StudySelect>
              {!allSources && <div className="mt-3 space-y-2">{ready.map((doc: any) => <label key={doc.id} className="flex gap-2 text-xs text-slate-300 items-start"><input type="checkbox" checked={selectedIds.includes(doc.id)} onChange={(e) => setSelectedIds((previous) => e.target.checked ? [...previous, doc.id] : previous.filter((id) => id !== doc.id))} className="accent-sky-500 mt-0.5" /><span className="break-words min-w-0">{doc.filename}</span></label>)}{!effectiveIds?.length && <p className="text-xs text-amber-300">Select at least one searchable source.</p>}</div>}
              <p className="study-help mt-4">{processing ? 'Your material updates automatically while processing.' : 'Answers reference your selected sources. Partially processed files may have missing pages.'}</p>
            </div>
          </aside>

          <main className="edus-card min-w-0 overflow-hidden">
            <div className="study-tabs flex border-b border-slate-800 overflow-x-auto">{[{ id: 'chat', label: 'Ask your sources', icon: MessageSquare }, { id: 'flashcards', label: 'Flashcards', icon: Layers }, { id: 'mcq', label: 'Practice quiz', icon: BookOpen }].map((item) => <button key={item.id} aria-pressed={tab === item.id} onClick={() => setTab(item.id as any)} disabled={generationBusy} className={`flex items-center gap-2 px-3 sm:px-4 py-3 text-xs sm:text-sm border-b-2 whitespace-nowrap disabled:opacity-50 ${tab === item.id ? 'text-sky-300 border-sky-400' : 'text-slate-400 border-transparent hover:text-white'}`}><item.icon size={16} />{item.label}</button>)}</div>
            {tab === 'chat' ? <>
              <div className="study-answer-settings border-b border-slate-800">
                <div>
                  <label htmlFor="study-answer-mode" className="study-field-label">Answer mode</label>
                  <p id="study-answer-help" className="study-help">{mode === 'notes_only' ? 'Grounded in your sources, with page references.' : 'General explanations, supported by your sources where available.'}</p>
                </div>
                <StudySelect id="study-answer-mode" aria-describedby="study-answer-help" value={mode} onChange={(e) => setMode(e.target.value as any)} disabled={chatBusy}>
                  <option value="notes_only">My sources only</option>
                  <option value="general">General tutor + my sources</option>
                </StudySelect>
              </div>
              <div role="log" aria-label="Study conversation" aria-live="polite" className="study-conversation space-y-6 overflow-y-auto">
                {!messages.length && <div className="text-center py-10 max-w-sm mx-auto"><MessageSquare size={30} className="mx-auto text-sky-400 mb-4" /><h2 className="font-semibold text-white mb-2">Learn from your own material</h2><p className="text-sm text-slate-400 leading-relaxed">{canRetrieve ? 'Ask for an explanation, compare concepts, or find a topic in your sources. Select a page reference to see the original.' : processing ? 'Your material is being processed. You can ask questions as soon as they are ready.' : 'Add a notes or syllabus PDF, or paste text and wait for it to finish processing.'}</p></div>}
                {messages.map((message, index) => <article key={index} className={`study-message ${message.role === 'user' ? 'bg-sky-500/10 border border-sky-500/15 ml-3 sm:ml-12' : 'bg-slate-900/60 border border-slate-800'}`}><p className="study-message-role">{message.role === 'user' ? 'You' : 'EDU AI'}</p><p className="study-message-content whitespace-pre-wrap">{message.content}</p>{message.incomplete && <p className="text-xs text-amber-300 mt-3">The available source evidence is incomplete.</p>}{message.insufficientEvidence && <p className="text-xs text-amber-300 mt-3">Your selected sources do not contain enough evidence to answer this question.</p>}{message.generalKnowledgeUsed && <p className="text-xs text-slate-500 mt-3">Includes general tutoring knowledge. Page references identify evidence from your sources.</p>}<SourceButtons sources={message.sources} onOpen={openSource} /></article>)}
                {chatBusy && <p className="text-sm text-sky-300 flex gap-2 items-center"><Loader2 size={16} className="animate-spin" /> Reading your sources…</p>}<div ref={transcriptEnd} />
              </div>
              <form onSubmit={sendQuestion} className="study-composer border-t border-slate-800">
                {chatError && <p role="alert" className="text-sm text-rose-300 mb-3">{chatError}</p>}
                {!canRetrieve && <p className="text-xs text-amber-300 mb-3">{processing ? 'Wait for a source to finish processing.' : 'Add a PDF or paste text, then select a searchable source to ask questions.'}</p>}
                <label htmlFor="study-question" className="sr-only">Question about your study material</label><div className="flex gap-2 items-end"><textarea id="study-question" value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Ask about your sources…" rows={2} maxLength={2000} disabled={chatBusy} className="edus-input flex-1 min-w-0 resize-y text-sm" /><button type="submit" disabled={chatBusy || !question.trim() || !canRetrieve} aria-label="Send question" className="edus-btn !p-3 disabled:opacity-40"><Send size={18} /></button></div><p className="study-help mt-3">Conversation stays in this page and clears when you leave.</p>
              </form>
            </> : <div className="study-practice">
              <h2 className="text-lg font-semibold text-white">{tab === 'flashcards' ? 'Review with flashcards' : 'Practice from your sources'}</h2><p className="text-sm text-slate-400 mt-2 mb-5">{tab === 'flashcards' ? 'Turn the selected material into questions and answers.' : 'Generate practice questions with explanations and source references.'}</p>
              <form onSubmit={generate} className="flex flex-col sm:flex-row gap-3 items-end mb-5"><label className="text-xs text-slate-400 flex-1 w-full">Topic (optional)<input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Process scheduling" maxLength={200} className="edus-input text-sm w-full mt-1.5" /></label>{tab === 'mcq' && <label className="text-xs text-slate-400">Difficulty<StudySelect value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="text-sm"><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></StudySelect></label>}<button type="submit" disabled={!canRetrieve || generationBusy} className="edus-btn shrink-0 disabled:opacity-40">{generationBusy ? <><Loader2 size={15} className="animate-spin" /> Creating…</> : `Generate ${tab === 'flashcards' ? 'cards' : 'quiz'}`}</button></form>
              {!canRetrieve && <p className="text-xs text-amber-300 mb-5">Choose at least one searchable source to create practice material.</p>}{generationError && <p role="alert" className="text-sm text-rose-300 mb-5">{generationError}</p>}
              {tab === 'flashcards' && cards.length > 0 && <div>
                <button onClick={() => setCardFlipped((previous) => !previous)} aria-label={cardFlipped ? 'Show question' : 'Show answer'} className="w-full rounded-2xl border border-sky-500/25 bg-gradient-to-br from-sky-500/10 to-violet-500/10 min-h-56 p-6 text-left"><p className="text-xs uppercase tracking-wider text-sky-400 mb-5">{cardFlipped ? 'Answer' : 'Question'}</p><p className="text-base leading-relaxed whitespace-pre-wrap">{cardFlipped ? cards[cardIndex].answer : cards[cardIndex].question}</p><p className="text-xs text-slate-500 mt-7">Tap to {cardFlipped ? 'see question' : 'reveal answer'}</p></button>
                <div className="flex justify-center items-center gap-5 mt-4"><button disabled={cardIndex === 0} onClick={() => setCardIndex((index) => index - 1)} aria-label="Previous card" className="p-2 disabled:opacity-30"><ChevronLeft size={20} /></button><span className="text-xs text-slate-400">{cardIndex + 1} / {cards.length}</span><button disabled={cardIndex === cards.length - 1} onClick={() => setCardIndex((index) => index + 1)} aria-label="Next card" className="p-2 disabled:opacity-30"><ChevronRight size={20} /></button></div><SourceButtons sources={sourcesForItem(cards[cardIndex], practiceSources.flashcards)} onOpen={openSource} />
              </div>}
              {tab === 'mcq' && quiz.length > 0 && <div className="space-y-5">{quiz.map((item, index) => {
                const correctIndex = correctOptionIndex(item);
                const answered = answers[index] !== undefined;
                return <article key={index} className="rounded-xl border border-slate-800 p-4"><h3 className="text-sm font-semibold text-white mb-4">{index + 1}. {item.question}</h3><div className="grid sm:grid-cols-2 gap-2">{item.options.map((option: any, optionIndex: number) => <button key={optionIndex} disabled={answered} onClick={() => setAnswers((previous) => ({ ...previous, [index]: optionIndex }))} className={`text-left text-sm p-3 rounded-lg border ${answered && optionIndex === correctIndex ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300' : answered && answers[index] === optionIndex ? 'border-rose-500/50 bg-rose-500/10 text-rose-300' : 'border-slate-700 text-slate-300 hover:border-sky-500/50'}`}>{String.fromCharCode(65 + optionIndex)}. {typeof option === 'string' ? option : option.text || option.label}</button>)}</div>{answered && <div className="mt-4"><p className={`text-xs font-semibold ${answers[index] === correctIndex ? 'text-emerald-400' : 'text-amber-300'}`}>{correctIndex < 0 ? 'Review the explanation below.' : answers[index] === correctIndex ? 'Correct' : `Correct answer: ${String.fromCharCode(65 + correctIndex)}`}</p>{item.explanation && <p className="text-sm text-slate-400 mt-2 leading-relaxed">{item.explanation}</p>}<SourceButtons sources={sourcesForItem(item, practiceSources.mcq)} onOpen={openSource} /></div>}</article>;
              })}<button onClick={() => setAnswers({})} className="edus-btn-ghost">Try these questions again</button></div>}
            </div>}
          </main>
        </div>
      </div>
      {uploadOpen && <StudyUploadDialog workspace={workspace} documents={documents} limits={limits} onClose={() => { setUploadOpen(false); refresh(); refreshUsage(); }} onChanged={() => { refresh(); refreshUsage(); }} onComplete={() => { setUploadOpen(false); refresh(); refreshUsage(); }} />}
      <DeleteConfirmationModal isOpen={Boolean(deleteTarget)} title="Delete private source" itemName={deleteTarget?.filename || ''} description="Delete your source" warning="Its searchable content will also be removed. Your other sources will remain available." isDeleting={deleting} onClose={() => { if (!deleting) setDeleteTarget(null); }} onConfirm={deleteDocument} />
      {source && <div className="fixed inset-0 z-[130] bg-black/85 backdrop-blur-sm flex justify-center items-center p-2 sm:p-5" role="dialog" aria-modal="true" aria-label={`Study source: ${source.title}`} onKeyDown={(event) => { if (event.key === 'Escape') { setSource(null); sourceRequest.current += 1; } }}>
        <div className="w-full max-w-5xl bg-[#14121F] border border-slate-700 rounded-2xl max-h-[94dvh] overflow-y-auto p-3 sm:p-5"><div className="flex items-start justify-between gap-3 mb-4"><div className="min-w-0"><h2 className="text-base font-semibold text-white break-words">{source.title}</h2><p className="text-xs text-slate-500 mt-1">{sourceText !== null ? 'Pasted text source' : `Source page ${source.page || 1}`}</p></div><div className="flex gap-2 shrink-0"><button onClick={() => openSource(source)} className="p-2 text-slate-400 hover:text-white" aria-label="Refresh source access"><RefreshCw size={16} /></button><button autoFocus onClick={() => { setSource(null); sourceRequest.current += 1; }} aria-label="Close source" className="p-2 text-slate-400 hover:text-white"><X size={20} /></button></div></div>{source.excerpt && <blockquote className="border-l-2 border-sky-500 pl-3 mb-4 text-xs leading-relaxed text-slate-400 whitespace-pre-wrap">{source.excerpt}</blockquote>}{sourceLoading ? <p className="flex gap-2 items-center text-sm text-slate-400 p-10 justify-center"><Loader2 className="animate-spin" size={18} /> Opening your source…</p> : sourceError ? <p role="alert" className="text-sm text-rose-300 p-5">{sourceError}</p> : sourceText !== null ? <pre className="text-sm text-slate-200 whitespace-pre-wrap break-words leading-relaxed p-4 bg-slate-900/50 rounded-xl">{sourceText}</pre> : sourceUrl ? <PdfViewer url={sourceUrl} initialPage={source.page || 1} /> : null}</div>
      </div>}
    </div>
  );
}
