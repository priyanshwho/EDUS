import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import { streamAIInteract } from '../api/ai.api';
import { fetchChapterNotes } from '../api/notes.api';
import TalkingAvatar from '../components/ai/TalkingAvatar';
import BottomNavBar from '../components/layout/BottomNavBar';
import { ChevronLeft, GraduationCap, MessageCircle, Captions, CaptionsOff, Mic, MicOff, Volume2 } from 'lucide-react';
import { clsx } from 'clsx';

type AIMode = 'tutor' | 'free' | null;
interface Message { role: 'user' | 'assistant'; content: string; }

const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

const SoundWave = ({ active }: { active: boolean }) => {
  return (
    <div className="flex items-end gap-[3px] h-6">
      {[1, 2, 3, 4, 3, 5, 3, 4, 3, 2, 1].map((h, i) => (
        <div
          key={i}
          className="w-[3px] rounded-full transition-all duration-300"
          style={{
            height: active ? `${h * 4}px` : '4px',
            background: active ? '#38bdf8' : 'rgba(148,163,184,0.2)',
          }}
        />
      ))}
    </div>
  );
};

const TranscriptPanel = ({ messages, streamingText }: { messages: Message[]; streamingText: string }) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, streamingText]);

  return (
    <div className="flex flex-col h-full bg-[#15131D] border-l border-[#252134]">
      <div className="px-5 py-4 border-b border-[#252134] flex items-center gap-2">
        <Captions size={16} className="text-slate-400" />
        <span className="text-sm font-semibold text-slate-300">Transcript</span>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {messages.length === 0 && !streamingText && (
          <div className="text-center mt-10 text-sm text-slate-500">
            Conversation will appear here…
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={clsx('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
            <div className={clsx(
              "max-w-[85%] px-5 py-4 rounded-2xl text-[15px] leading-relaxed shadow-sm",
              msg.role === 'user' ? "edus-gradient-bg text-white rounded-br-sm shadow-sky-500/10" : "bg-slate-800/80 text-slate-200 border border-slate-700/50 rounded-bl-sm"
            )}>
              {msg.content}
            </div>
          </div>
        ))}
        {streamingText && (
          <div className="flex justify-start">
            <div className="max-w-[85%] px-5 py-4 rounded-2xl text-[15px] leading-relaxed bg-slate-800/80 text-slate-200 border border-slate-700/50 rounded-bl-sm">
              {streamingText}
              <span className="inline-block w-1.5 h-3 edus-gradient-bg ml-1 animate-pulse" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};

const ModeSelector = ({ chapterTitle, onSelect }: { chapterTitle?: string; onSelect: (m: AIMode) => void }) => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-[#0E0C15] p-8 text-center pb-36 md:pb-20">
    <div className="w-16 h-16 rounded-2xl flex items-center justify-center edus-gradient-bg mb-6">
      <Mic size={28} className="text-white" />
    </div>

    <h1 className="text-3xl font-bold text-white mb-2">How would you like to learn?</h1>
    <p className="text-sm text-slate-400 mb-8">{chapterTitle}</p>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full max-w-2xl">
      <button onClick={() => onSelect('tutor')} className="edus-card p-6 text-left hover:edus-gradient-border-active transition-colors group">
        <div className="w-10 h-10 rounded-xl edus-gradient-bg flex items-center justify-center mb-4 text-white">
          <GraduationCap size={20} />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">Step-by-Step Tutor</h3>
        <p className="text-sm text-slate-400">AI teaches topic by topic with checkpoint questions.</p>
      </button>
      <button onClick={() => onSelect('free')} className="edus-card p-6 text-left hover:edus-gradient-border-active transition-colors group">
        <div className="w-10 h-10 rounded-xl edus-gradient-bg flex items-center justify-center mb-4 text-white">
          <MessageCircle size={20} />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">Free Conversation</h3>
        <p className="text-sm text-slate-400">Ask anything about the chapter at your own pace.</p>
      </button>
    </div>
    <BottomNavBar />
  </div>
);

const AIInteractMode = () => {
  const { branch, semester, subjectSlug, chapterId } = useParams();
  const { state } = useSession();

  const [mode, setMode] = useState<AIMode>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [showCC, setShowCC] = useState(false);
  const [isAITalking, setIsAITalking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [streamingText, setStreamingText] = useState('');
  const [captionText, setCaptionText] = useState('');
  const [micError, setMicError] = useState('');

  const messagesRef = useRef<Message[]>([]);
  const streamedRef = useRef('');
  const abortRef = useRef<AbortController | null>(null);
  const recognitionRef = useRef<any>(null);
  const isAITalkingRef = useRef(false);
  const modeRef = useRef<AIMode>(null);

  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { isAITalkingRef.current = isAITalking; }, [isAITalking]);
  useEffect(() => { modeRef.current = mode; }, [mode]);

  const allChapters = [...(state.subjectData?.sections?.A || []), ...(state.subjectData?.sections?.B || [])];
  const chapter = allChapters.find((c: any) => c.chapterId === chapterId);
  const chapterRef = useRef(chapter);
  useEffect(() => { chapterRef.current = chapter; }, [chapter]);

  useEffect(() => () => {
    abortRef.current?.abort();
    recognitionRef.current?.stop();
    window.speechSynthesis?.cancel();
  }, []);

  const speakText = useCallback((text: string) => {
    if (!window.speechSynthesis || !text.trim()) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = 'en-US'; utt.rate = 1.05; utt.pitch = 1.0;
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v => v.lang.startsWith('en') && v.name.includes('Google'));
    if (preferred) utt.voice = preferred;
    utt.onstart = () => { setIsAITalking(true); isAITalkingRef.current = true; };
    utt.onend   = () => { setIsAITalking(false); isAITalkingRef.current = false; setCaptionText(''); };
    utt.onerror = () => { setIsAITalking(false); isAITalkingRef.current = false; };
    window.speechSynthesis.speak(utt);
  }, []);

  const handleSend = useCallback(async (text: string) => {
    if (!text.trim()) return;
    const currentMessages = messagesRef.current;
    const userMsg: Message = { role: 'user', content: text };
    const updatedMsgs = [...currentMessages, userMsg];
    setMessages(updatedMsgs); messagesRef.current = updatedMsgs;
    streamedRef.current = ''; setStreamingText(''); setCaptionText('');
    setIsAITalking(true); isAITalkingRef.current = true;
    let notes = { content: null as string | null, notesExist: false };
    try { notes = await fetchChapterNotes(branch!, semester!, subjectSlug!, chapterId!, chapterRef.current?.title || ''); }
    catch { }
    abortRef.current?.abort(); abortRef.current = new AbortController();
    streamAIInteract(
      { chapterTitle: chapterRef.current?.title, subjectName: state.subjectData?.subjectName,
        notesContent: notes.content, notesExist: notes.notesExist, messages: updatedMsgs,
        mode: modeRef.current, topics: chapterRef.current?.topics },
      (token: string) => { streamedRef.current += token; setStreamingText(streamedRef.current); setCaptionText(streamedRef.current); },
      () => {
        const finalText = streamedRef.current;
        setMessages(prev => [...prev, { role: 'assistant', content: finalText }]);
        setStreamingText(''); streamedRef.current = ''; speakText(finalText);
      },
      (err: any) => {
        console.error(err);
        setIsAITalking(false); isAITalkingRef.current = false;
        setCaptionText(''); setMicError('AI response failed.');
      },
      abortRef.current.signal,
    );
  }, [branch, semester, subjectSlug, chapterId, state, speakText]);

  const startListening = useCallback(() => {
    if (!SpeechRecognition) { setMicError('Voice recognition not supported. Use Chrome.'); return; }
    if (isAITalkingRef.current) { window.speechSynthesis?.cancel(); setIsAITalking(false); isAITalkingRef.current = false; }
    setMicError(''); setLiveTranscript('');
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US'; recognition.interimResults = true; recognition.continuous = false;
    let finalTranscript = '';
    recognition.onresult = (event: any) => {
      let interim = ''; finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalTranscript += t; else interim += t;
      }
      setLiveTranscript(finalTranscript || interim);
    };
    recognition.onend = () => { setIsListening(false); setLiveTranscript(''); if (finalTranscript.trim()) handleSend(finalTranscript.trim()); };
    recognition.onerror = () => { setIsListening(false); setLiveTranscript(''); setMicError('Mic error.'); };
    recognitionRef.current = recognition;
    recognition.start(); setIsListening(true);
  }, [handleSend]);

  const stopListening = useCallback(() => { recognitionRef.current?.stop(); setIsListening(false); }, []);

  if (!mode) return <ModeSelector chapterTitle={chapter?.title} onSelect={setMode} />;

  return (
    <div className="min-h-screen flex flex-col bg-[#0E0C15] pb-36 md:pb-16">
      <header className="flex items-center justify-between px-5 py-4 border-b border-[#252134] bg-[#0E0C15]">
        <button
          onClick={() => {
            setMode(null); setMessages([]); setStreamingText(''); setCaptionText(''); setLiveTranscript('');
            window.speechSynthesis?.cancel(); recognitionRef.current?.stop(); abortRef.current?.abort();
          }}
          className="flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-sky-400 transition-colors"
        >
          <ChevronLeft size={18} /> Back
        </button>
        <span className="edus-badge-muted">{mode === 'tutor' ? 'Tutor' : 'Free Chat'}</span>
        <button
          onClick={() => setShowCC(!showCC)}
          className={clsx("flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors", showCC ? "bg-sky-400/10 text-sky-400" : "bg-slate-800 text-slate-400 hover:text-white")}
        >
          {showCC ? <CaptionsOff size={16} /> : <Captions size={16} />} <span className="hidden sm:inline">CC</span>
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className={clsx("flex flex-col items-center justify-center transition-all", showCC ? "w-1/2" : "w-full")}>
          <div className="w-48 h-48 mb-8 border border-[#252134] rounded-full flex items-center justify-center bg-[#15131D]">
            <TalkingAvatar isTalking={isAITalking} emotion={isAITalking ? 'neutral' : 'happy'} />
          </div>

          <SoundWave active={isAITalking || isListening} />
          
          <p className="mt-4 text-sm font-medium text-slate-400">
            {isListening ? 'Listening…' : isAITalking ? 'Speaking…' : 'Tap mic to speak'}
          </p>

          {(captionText || liveTranscript) && (
            <div className="absolute bottom-24 max-w-lg px-6 py-4 rounded-xl bg-[#15131D] border border-[#252134] text-sm text-center">
              {liveTranscript ? <span className="text-sky-400">You: {liveTranscript}</span> : <span className="text-white">{captionText}</span>}
            </div>
          )}
        </div>

        {showCC && <div className="w-1/2"><TranscriptPanel messages={messages} streamingText={streamingText} /></div>}
      </div>

      <div className="flex justify-center p-6 border-t border-[#252134] bg-[#0E0C15]/95 backdrop-blur">
        <button
          onClick={isListening ? stopListening : startListening}
          className={clsx(
            "w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300",
            isListening ? "bg-rose-500 text-white shadow-[0_0_30px_rgba(244,63,94,0.4)] scale-105" : isAITalking ? "bg-slate-800 text-slate-500 cursor-not-allowed" : "edus-gradient-bg text-white hover:scale-105 hover:shadow-[0_0_20px_rgba(56,189,248,0.4)]"
          )}
        >
          {isListening ? <MicOff size={28} /> : <Mic size={28} />}
        </button>
      </div>

      <BottomNavBar />
    </div>
  );
};

export default AIInteractMode;
