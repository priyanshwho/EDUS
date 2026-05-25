import React, { useEffect, useState, useRef, useCallback } from 'react';
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
  Captions,
  CaptionsOff,
  Mic,
  MicOff,
  Volume2,
} from 'lucide-react';
import { clsx } from 'clsx';

/* ─── Types ─────────────────────────────────────────────────────────────── */
type AIMode = 'tutor' | 'free' | null;
interface Message { role: 'user' | 'assistant'; content: string; }

/* ─── SpeechRecognition shim ─────────────────────────────────────────────── */
const SpeechRecognition =
  (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

/* ─── Transcript panel (CC) ─────────────────────────────────────────────── */
const TranscriptPanel = ({
  messages,
  streamingText,
}: {
  messages: Message[];
  streamingText: string;
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b border-white/10 flex items-center gap-2">
        <Captions size={18} className="text-primary" />
        <span className="font-bold text-sm uppercase tracking-widest text-primary">Transcript</span>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && !streamingText && (
          <p className="text-text-muted text-sm text-center mt-8">Conversation will appear here…</p>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={clsx('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
            <div className={clsx(
              'max-w-[90%] px-4 py-3 rounded-2xl text-sm leading-relaxed',
              msg.role === 'user'
                ? 'bg-primary text-white rounded-br-none'
                : 'bg-white/5 text-text rounded-bl-none',
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

/* ─── Sound wave animation ───────────────────────────────────────────────── */
const SoundWave = ({ active, color = 'bg-primary' }: { active: boolean; color?: string }) => (
  <div className="flex items-center gap-[3px] h-8">
    {[1, 2, 3, 4, 5, 4, 3, 2, 1].map((h, i) => (
      <div
        key={i}
        className={clsx('w-[3px] rounded-full transition-all duration-300', active ? color : 'bg-white/20')}
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

/* ─── Mode selector ──────────────────────────────────────────────────────── */
const ModeSelector = ({ chapterTitle, onSelect }: { chapterTitle?: string; onSelect: (m: AIMode) => void }) => (
  <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 text-center" style={{ paddingBottom: '80px' }}>
    <div className="mb-10">
      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-6 shadow-xl shadow-primary/30">
        <Mic size={40} className="text-white" />
      </div>
      <h1 className="text-4xl font-black mb-2">How would you like to learn?</h1>
      <p className="text-text-muted text-lg">{chapterTitle}</p>
      <p className="text-text-muted/60 text-sm mt-2 flex items-center justify-center gap-2">
        <Volume2 size={14} /> Voice-only — speak to the AI, hear it respond
      </p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
      {[
        { mode: 'tutor', icon: <GraduationCap size={36} />, title: 'Step-by-Step Tutor', desc: 'AI teaches topic by topic with checkpoint questions — fully voice guided.', color: 'hover:border-primary/50 hover:bg-primary/5', iconBg: 'bg-primary/20 text-primary' },
        { mode: 'free', icon: <MessageCircle size={36} />, title: 'Free Conversation', desc: 'Ask anything about the chapter at your own pace — just talk.', color: 'hover:border-secondary/50 hover:bg-secondary/5', iconBg: 'bg-secondary/20 text-secondary' },
      ].map(({ mode, icon, title, desc, color, iconBg }) => (
        <button key={mode} onClick={() => onSelect(mode as AIMode)}
          className={`glass p-10 rounded-[2rem] text-left group transition-all duration-300 border border-white/5 hover:-translate-y-1 ${color}`}>
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform ${iconBg}`}>{icon}</div>
          <h3 className="text-2xl font-black mb-2">{title}</h3>
          <p className="text-text-muted leading-relaxed">{desc}</p>
        </button>
      ))}
    </div>
  </div>
);

/* ─── Main component ─────────────────────────────────────────────────────── */
const AIInteractMode = () => {
  const { branch, semester, subjectSlug, chapterId } = useParams();
  const { state } = useSession();

  const [mode, setMode] = useState<AIMode>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [showCC, setShowCC] = useState(false);

  /* UI state */
  const [isAITalking, setIsAITalking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [streamingText, setStreamingText] = useState('');
  const [captionText, setCaptionText] = useState('');
  const [micError, setMicError] = useState('');

  /* ── Refs (avoid stale closures) ────────────────────────────────────────── */
  const messagesRef = useRef<Message[]>([]);
  const streamedRef = useRef('');
  const abortRef = useRef<AbortController | null>(null);
  const recognitionRef = useRef<any>(null);
  const isAITalkingRef = useRef(false);
  const modeRef = useRef<AIMode>(null);

  // Keep refs in sync with state
  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { isAITalkingRef.current = isAITalking; }, [isAITalking]);
  useEffect(() => { modeRef.current = mode; }, [mode]);

  /* ── Chapter data ────────────────────────────────────────────────────────── */
  const allChapters = [
    ...(state.subjectData?.sections?.A || []),
    ...(state.subjectData?.sections?.B || []),
  ];
  const chapter = allChapters.find((c: any) => c.chapterId === chapterId);
  const chapterRef = useRef(chapter);
  useEffect(() => { chapterRef.current = chapter; }, [chapter]);

  /* ── Cleanup ─────────────────────────────────────────────────────────────── */
  useEffect(() => () => {
    abortRef.current?.abort();
    recognitionRef.current?.stop();
    window.speechSynthesis?.cancel();
  }, []);

  /* ── Preload Voices ──────────────────────────────────────────────────────── */
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, []);

  /* ── Speak text using browser TTS ─────────────────────────────────────────── */
  const speakText = useCallback((text: string) => {
    if (!window.speechSynthesis || !text.trim()) return;
    window.speechSynthesis.cancel();

    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = 'en-US';
    utt.rate = 1.05;
    utt.pitch = 1.0;

    // Try to pick a clear natural voice
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v =>
      v.lang.startsWith('en') &&
      (v.name.includes('Google US English') ||
       v.name.includes('Google UK English Female') ||
       v.name.includes('Google UK English Male') ||
       v.name.includes('Siri') ||
       v.name.includes('Samantha') ||
       v.name.includes('Daniel'))
    ) || voices.find(v => v.lang.startsWith('en') && v.name.includes('Google')) 
      || voices.find(v => v.lang.startsWith('en'));

    if (preferred) utt.voice = preferred;

    utt.onstart = () => { setIsAITalking(true); isAITalkingRef.current = true; };
    utt.onend   = () => { setIsAITalking(false); isAITalkingRef.current = false; setCaptionText(''); };
    utt.onerror = () => { setIsAITalking(false); isAITalkingRef.current = false; };

    window.speechSynthesis.speak(utt);
  }, []);

  /* ── Send message to AI ─────────────────────────────────────────────────── */
  const handleSend = useCallback(async (text: string) => {
    if (!text.trim()) return;

    const currentMessages = messagesRef.current;
    const currentChapter = chapterRef.current;
    const currentMode = modeRef.current;

    const userMsg: Message = { role: 'user', content: text };
    const updatedMsgs = [...currentMessages, userMsg];
    setMessages(updatedMsgs);
    messagesRef.current = updatedMsgs;

    streamedRef.current = '';
    setStreamingText('');
    setCaptionText('');
    setIsAITalking(true);
    isAITalkingRef.current = true;

    let notes = { content: null as string | null, notesExist: false };
    try {
      notes = await fetchChapterNotes(branch!, semester!, subjectSlug!, chapterId!, currentChapter?.title || '');
    } catch {
      // proceed without notes — controller returns notesExist:false gracefully
    }

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    streamAIInteract(
      {
        chapterTitle: currentChapter?.title,
        subjectName: state.subjectData?.subjectName,
        notesContent: notes.content,
        notesExist: notes.notesExist,
        messages: updatedMsgs,
        mode: currentMode,
        topics: currentChapter?.topics,
      },
      (token: string) => {
        streamedRef.current += token;
        setStreamingText(streamedRef.current);
        setCaptionText(streamedRef.current);
      },
      () => {
        const finalText = streamedRef.current;
        const aiMsg: Message = { role: 'assistant', content: finalText };
        setMessages(prev => {
          const updated = [...prev, aiMsg];
          messagesRef.current = updated;
          return updated;
        });
        setStreamingText('');
        streamedRef.current = '';
        // Speak the full response
        speakText(finalText);
      },
      (err: any) => {
        console.error('[AI Interact Error]', err);
        setIsAITalking(false);
        isAITalkingRef.current = false;
        setCaptionText('');
        setMicError('AI response failed. Please try again.');
      },
      abortRef.current.signal,
    );
  }, [branch, semester, subjectSlug, chapterId, state, speakText]);

  /* ── Start speech recognition ───────────────────────────────────────────── */
  const startListening = useCallback(() => {
    if (!SpeechRecognition) {
      setMicError('Voice recognition not supported. Please use Chrome.');
      return;
    }
    // Stop any ongoing AI speech so user can speak
    if (isAITalkingRef.current) {
      window.speechSynthesis?.cancel();
      setIsAITalking(false);
      isAITalkingRef.current = false;
    }

    setMicError('');
    setLiveTranscript('');

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    let finalTranscript = '';

    recognition.onresult = (event: any) => {
      let interim = '';
      finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalTranscript += t;
        else interim += t;
      }
      setLiveTranscript(finalTranscript || interim);
    };

    recognition.onend = () => {
      setIsListening(false);
      setLiveTranscript('');
      if (finalTranscript.trim()) {
        handleSend(finalTranscript.trim());
      }
    };

    recognition.onerror = (event: any) => {
      setIsListening(false);
      setLiveTranscript('');
      if (event.error === 'not-allowed') {
        setMicError('Microphone access denied. Allow mic in browser settings.');
      } else if (event.error === 'no-speech') {
        setMicError('No speech detected. Try again.');
      } else if (event.error !== 'aborted') {
        setMicError(`Mic error: ${event.error}`);
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setIsListening(true);
    } catch (e) {
      setMicError('Could not start microphone. Please try again.');
    }
  }, [handleSend]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const handleMicToggle = useCallback(() => {
    if (isListening) stopListening();
    else startListening();
  }, [isListening, startListening, stopListening]);

  /* ── Mode selector screen ───────────────────────────────────────────────── */
  if (!mode) return <ModeSelector chapterTitle={chapter?.title} onSelect={setMode} />;

  /* ── Voice UI ────────────────────────────────────────────────────────────── */
  const statusLabel = isListening ? 'Listening…' : isAITalking ? 'Speaking…' : 'Tap mic to speak';

  return (
    <div className="min-h-screen bg-background text-text flex flex-col" style={{ paddingBottom: '64px' }}>

      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 z-10 flex-shrink-0"
        style={{ background: 'rgba(15,23,42,0.9)', borderBottom: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)' }}>
        <button
          onClick={() => {
            setMode(null);
            setMessages([]);
            messagesRef.current = [];
            setStreamingText('');
            setCaptionText('');
            setLiveTranscript('');
            window.speechSynthesis?.cancel();
            recognitionRef.current?.stop();
            abortRef.current?.abort();
          }}
          className="flex items-center gap-2 text-text-muted hover:text-text transition-colors text-sm font-medium"
        >
          <ChevronLeft size={18} /> Back
        </button>

        <div className="flex items-center gap-2">
          <div className={clsx('w-2 h-2 rounded-full transition-colors',
            isAITalking ? 'bg-primary animate-pulse' : isListening ? 'bg-green-400 animate-pulse' : 'bg-white/30')} />
          <span className="text-xs font-bold uppercase tracking-widest">
            {mode === 'tutor' ? 'Step-by-Step Tutor' : 'Free Conversation'}
          </span>
        </div>

        <button onClick={() => setShowCC(v => !v)}
          className={clsx('flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200',
            showCC ? 'bg-primary text-white' : 'text-text-muted hover:text-text hover:bg-white/5')}
          title="Toggle Transcript">
          {showCC ? <CaptionsOff size={18} /> : <Captions size={18} />}
          <span className="hidden sm:inline">CC</span>
        </button>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">

        {/* Avatar area */}
        <div
          className={clsx('flex flex-col items-center justify-center transition-all duration-500 relative', showCC ? 'w-[58%]' : 'w-full')}
          style={{ background: 'radial-gradient(ellipse at 50% 80%, rgba(99,102,241,0.08) 0%, transparent 70%)' }}
        >
          {/* Subject badge */}
          <div className="absolute top-4 left-4">
            <span className="px-3 py-1.5 text-xs font-bold uppercase tracking-widest bg-white/5 rounded-xl text-text-muted">
              {state.subjectData?.subjectName}
            </span>
          </div>

          {/* CC shortcut */}
          {!showCC && messages.length > 0 && (
            <div className="absolute top-4 right-4">
              <button onClick={() => setShowCC(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-all">
                <Captions size={14} /> Transcript
              </button>
            </div>
          )}

          {/* Avatar */}
          <div className="relative flex flex-col items-center gap-4">
            <div className={clsx('absolute rounded-full transition-all duration-700 pointer-events-none',
              isAITalking ? 'w-72 h-72 bg-primary/10 animate-pulse'
                : isListening ? 'w-72 h-72 bg-green-500/10 animate-pulse'
                  : 'w-64 h-64 bg-transparent')}
              style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />

            <div className="relative z-10" style={{ width: '220px', height: '220px' }}>
              <TalkingAvatar isTalking={isAITalking} emotion={isAITalking ? 'neutral' : 'happy'} />
            </div>

            <SoundWave active={isAITalking || isListening} color={isListening ? 'bg-green-400' : 'bg-primary'} />
            <p className="text-xl font-black">{statusLabel}</p>
            <p className="text-text-muted text-sm max-w-xs text-center">{chapter?.title}</p>
          </div>

          {/* Live caption — always visible below avatar */}
          {(captionText || liveTranscript) && (
            <div className="absolute bottom-24 left-4 right-4 mx-auto max-w-xl px-5 py-3 rounded-2xl text-sm leading-relaxed text-center"
              style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.08)' }}>
              {liveTranscript
                ? <span className="text-green-300 italic">You: {liveTranscript}</span>
                : <span className="text-white">{captionText}</span>}
            </div>
          )}
        </div>

        {/* Transcript panel (CC) */}
        {showCC && (
          <div className="flex flex-col border-l border-white/10 transition-all duration-500"
            style={{ width: '42%', background: 'rgba(15,23,42,0.97)' }}>
            <TranscriptPanel messages={messages} streamingText={streamingText} />
          </div>
        )}
      </div>

      {/* Bottom — mic only, no text input */}
      <div className="flex-shrink-0 px-4 py-4 z-10"
        style={{ background: 'rgba(15,23,42,0.95)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-xs mx-auto flex flex-col items-center gap-3">

          {micError && (
            <p className="text-xs text-red-400 text-center bg-red-400/10 px-4 py-2 rounded-xl w-full">{micError}</p>
          )}

          <button
            onClick={handleMicToggle}
            className={clsx(
              'w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl',
              isListening
                ? 'bg-green-500 text-white scale-110 shadow-green-500/40'
                : isAITalking
                  ? 'bg-primary/40 text-white/60 cursor-not-allowed'
                  : 'bg-primary text-white hover:scale-105 active:scale-95 shadow-primary/30',
            )}
            title={isListening ? 'Tap to stop' : isAITalking ? 'AI is speaking — tap to interrupt' : 'Tap to speak'}
          >
            {isListening ? <MicOff size={32} /> : <Mic size={32} />}
          </button>

          <p className="text-xs text-text-muted text-center">
            {isListening ? 'Listening — tap to stop' : isAITalking ? 'AI speaking — tap mic to interrupt' : 'Tap to speak'}
          </p>
        </div>
      </div>

      <BottomNavBar />
    </div>
  );
};

export default AIInteractMode;
