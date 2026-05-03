import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import { streamAIInteract } from '../api/ai.api';
import { fetchChapterNotes } from '../api/notes.api';
import TalkingAvatar from '../components/ai/TalkingAvatar';
import BottomNavBar from '../components/layout/BottomNavBar';
import {
  ChevronLeft,
  GraduationCap,
  MessageCircle,
  Send,
  Captions,
  CaptionsOff,
  Mic,
} from 'lucide-react';
import { clsx } from 'clsx';

/* Types */
type AIMode = 'tutor' | 'free' | null;
interface Message { role: 'user' | 'assistant'; content: string; }

const TranscriptPanel = ({ messages, streamingText }: { messages: Message[]; streamingText: string }) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, streamingText]);

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b border-white/10 flex items-center gap-2">
        <Captions size={18} className="text-primary" />
        <span className="font-bold text-sm uppercase tracking-widest text-primary">Transcript</span>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && !streamingText && (
          <p className="text-text-muted text-sm text-center mt-8">Conversation will appear here...</p>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={clsx('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
            <div className={clsx(
              'max-w-[90%] px-4 py-3 rounded-2xl text-sm leading-relaxed',
              msg.role === 'user'
                ? 'bg-primary text-white rounded-br-none'
                : 'bg-white/5 text-text rounded-bl-none'
            )}>
              {msg.content}
            </div>
          </div>
        ))}
        {streamingText && (
          <div className="flex justify-start">
            <div className="max-w-[90%] px-4 py-3 rounded-2xl rounded-bl-none text-sm leading-relaxed bg-white/5 text-text">
              {streamingText}
              <span className="inline-block w-1 h-4 bg-primary ml-1 animate-pulse" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};

const SoundWave = ({ active }: { active: boolean }) => (
  <div className="flex items-center gap-[3px] h-8">
    {[1, 2, 3, 4, 5, 4, 3, 2, 1].map((h, i) => (
      <div
        key={i}
        className={clsx('w-[3px] rounded-full transition-all duration-300', active ? 'bg-primary' : 'bg-white/20')}
        style={{
          height: active ? `${h * 6}px` : '4px',
          animationName: active ? 'soundWave' : 'none',
          animationDuration: `${0.4 + i * 0.08}s`,
          animationTimingFunction: 'ease-in-out',
          animationIterationCount: 'infinite',
          animationDirection: 'alternate',
        }}
      />
    ))}
    <style>{`@keyframes soundWave { from { transform: scaleY(0.3); } to { transform: scaleY(1); } }`}</style>
  </div>
);

const ModeSelector = ({ chapterTitle, onSelect }: { chapterTitle?: string; onSelect: (m: AIMode) => void }) => (
  <div
    className="min-h-screen bg-background flex flex-col items-center justify-center p-8 text-center"
    style={{ paddingBottom: '80px' }}
  >
    <div className="mb-10">
      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-6 shadow-xl shadow-primary/30">
        <MessageCircle size={40} className="text-white" />
      </div>
      <h1 className="text-4xl font-black mb-2">How would you like to learn?</h1>
      <p className="text-text-muted text-lg">{chapterTitle}</p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
      {[
        {
          mode: 'tutor',
          icon: <GraduationCap size={36} />,
          title: 'Step-by-Step Tutor',
          desc: 'AI teaches topic by topic and asks checkpoint questions.',
          color: 'hover:border-primary/50 hover:bg-primary/5',
          iconBg: 'bg-primary/20 text-primary',
        },
        {
          mode: 'free',
          icon: <MessageCircle size={36} />,
          title: 'Free Conversation',
          desc: 'Ask anything and explore the chapter at your own pace.',
          color: 'hover:border-secondary/50 hover:bg-secondary/5',
          iconBg: 'bg-secondary/20 text-secondary',
        },
      ].map(({ mode, icon, title, desc, color, iconBg }) => (
        <button
          key={mode}
          onClick={() => onSelect(mode)}
          className={`glass p-10 rounded-[2rem] text-left group transition-all duration-300 border border-white/5 hover:-translate-y-1 ${color}`}
        >
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform ${iconBg}`}>
            {icon}
          </div>
          <h3 className="text-2xl font-black mb-2">{title}</h3>
          <p className="text-text-muted leading-relaxed">{desc}</p>
        </button>
      ))}
    </div>
  </div>
);

const AIInteractMode = () => {
  const { branch, semester, subjectSlug, chapterId } = useParams();
  const { state } = useSession();

  const [mode, setMode] = useState<AIMode>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTalking, setIsTalking] = useState(false);
  const [showCC, setShowCC] = useState(false);

  const streamedRef = useRef('');
  const [streamingText, setStreamingText] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  const allChapters = [
    ...(state.subjectData?.sections?.A || []),
    ...(state.subjectData?.sections?.B || []),
  ];
  const chapter = allChapters.find((c: any) => c.chapterId === chapterId);

  useEffect(() => () => { abortRef.current?.abort(); }, []);

  const handleSend = async (text: string) => {
    if (!text.trim() || isTalking) return;

    const userMsg: Message = { role: 'user', content: text };
    const updatedMsgs = [...messages, userMsg];
    setMessages(updatedMsgs);
    setInput('');
    setIsTalking(true);
    streamedRef.current = '';
    setStreamingText('');

    let notes = { content: null as string | null, notesExist: false };
    try {
      notes = await fetchChapterNotes(branch!, semester!, subjectSlug!, chapterId!, chapter?.title || '');
    } catch {
      // proceed without notes
    }

    abortRef.current = new AbortController();

    streamAIInteract(
      {
        chapterTitle: chapter?.title,
        subjectName: state.subjectData?.subjectName,
        notesContent: notes.content,
        notesExist: notes.notesExist,
        messages: updatedMsgs,
        mode,
        topics: chapter?.topics,
      },
      (token: string) => {
        streamedRef.current += token;
        setStreamingText(streamedRef.current);
      },
      () => {
        setMessages((prev) => [...prev, { role: 'assistant', content: streamedRef.current }]);
        setStreamingText('');
        streamedRef.current = '';
        setIsTalking(false);
      },
      (err: any) => { console.error('AI Error:', err); setIsTalking(false); },
      abortRef.current.signal
    );
  };

  if (!mode) return <ModeSelector chapterTitle={chapter?.title} onSelect={setMode} />;

  return (
    <div className="min-h-screen bg-background text-text flex flex-col" style={{ paddingBottom: '64px' }}>
      <header
        className="flex items-center justify-between px-6 py-3 z-10 flex-shrink-0"
        style={{ background: 'rgba(15,23,42,0.9)', borderBottom: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)' }}
      >
        <button
          onClick={() => setMode(null)}
          className="flex items-center gap-2 text-text-muted hover:text-text transition-colors text-sm font-medium"
        >
          <ChevronLeft size={18} /> Back
        </button>

        <div className="flex items-center gap-2">
          <div className={clsx('w-2 h-2 rounded-full', isTalking ? 'bg-primary animate-pulse' : 'bg-green-500')} />
          <span className="text-xs font-bold uppercase tracking-widest">
            {mode === 'tutor' ? 'Tutor Mode' : 'Free Conversation'}
          </span>
        </div>

        <button
          onClick={() => setShowCC((v) => !v)}
          className={clsx(
            'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200',
            showCC ? 'bg-primary text-white' : 'text-text-muted hover:text-text hover:bg-white/5'
          )}
          title="Toggle Transcript"
        >
          {showCC ? <CaptionsOff size={18} /> : <Captions size={18} />}
          <span className="hidden sm:inline">CC</span>
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div
          className={clsx(
            'flex flex-col items-center justify-center transition-all duration-500 relative',
            showCC ? 'w-[58%]' : 'w-full'
          )}
          style={{ background: 'radial-gradient(ellipse at 50% 80%, rgba(99,102,241,0.08) 0%, transparent 70%)' }}
        >
          <div className="relative flex flex-col items-center">
            <div
              className={clsx(
                'absolute rounded-full transition-all duration-700',
                isTalking
                  ? 'w-72 h-72 bg-primary/10 animate-pulse'
                  : 'w-64 h-64 bg-transparent'
              )}
              style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
            />

            <div className="relative z-10" style={{ width: '220px', height: '220px' }}>
              <TalkingAvatar isTalking={isTalking} emotion={isTalking ? 'neutral' : 'happy'} />
            </div>

            <div className="mt-4">
              <SoundWave active={isTalking} />
            </div>

            <p className="mt-4 text-xl font-black">
              {isTalking ? 'Speaking...' : 'Listening...'}
            </p>
            <p className="text-text-muted text-sm mt-1 max-w-xs text-center">{chapter?.title}</p>
          </div>

          <div className="absolute top-4 left-4">
            <span className="px-3 py-1.5 text-xs font-bold uppercase tracking-widest bg-white/5 rounded-xl text-text-muted">
              {state.subjectData?.subjectName}
            </span>
          </div>

          {!showCC && messages.length > 0 && (
            <div className="absolute top-4 right-4">
              <button
                onClick={() => setShowCC(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-all"
              >
                <Captions size={14} /> Show Transcript
              </button>
            </div>
          )}
        </div>

        {showCC && (
          <div
            className="flex flex-col border-l border-white/10 transition-all duration-500"
            style={{ width: '42%', background: 'rgba(15,23,42,0.97)' }}
          >
            <TranscriptPanel messages={messages} streamingText={streamingText} />
          </div>
        )}
      </div>

      <div
        className="flex-shrink-0 px-4 py-3 z-10"
        style={{ background: 'rgba(15,23,42,0.95)', borderTop: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <div
            className="flex-1 flex items-center gap-3 rounded-2xl px-4 py-2"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <Mic size={18} className={clsx('flex-shrink-0 transition-colors', isTalking ? 'text-primary' : 'text-text-muted')} />
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend(input)}
              placeholder={isTalking ? 'AI is responding...' : 'Type your message...'}
              disabled={isTalking}
              className="flex-1 bg-transparent border-none focus:outline-none text-base placeholder:text-text-muted/60"
            />
          </div>

          <button
            onClick={() => handleSend(input)}
            disabled={!input.trim() || isTalking}
            className={clsx(
              'w-11 h-11 rounded-xl flex items-center justify-center transition-all flex-shrink-0',
              (!input.trim() || isTalking)
                ? 'bg-white/5 text-text-muted cursor-not-allowed'
                : 'bg-primary text-white hover:scale-105 active:scale-95'
            )}
          >
            <Send size={18} />
          </button>
        </div>
      </div>

      <BottomNavBar />
    </div>
  );
};

export default AIInteractMode;
