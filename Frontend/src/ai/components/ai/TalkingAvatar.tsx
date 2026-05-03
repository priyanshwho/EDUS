import React from 'react';
import { clsx } from 'clsx';

interface TalkingAvatarProps {
  isTalking: boolean;
  emotion?: 'neutral' | 'happy' | 'thinking';
}

const TalkingAvatar: React.FC<TalkingAvatarProps> = ({ isTalking, emotion = 'neutral' }) => {
  return (
    <div className="relative w-48 h-48 flex items-center justify-center">
      <div
        className={clsx(
          'absolute inset-0 rounded-full border-4 border-primary/20 transition-all duration-500',
          isTalking ? 'scale-110 opacity-100 animate-pulse' : 'scale-100 opacity-40'
        )}
      />

      <svg
        viewBox="0 0 200 200"
        className={clsx(
          'w-full h-full relative z-10 transition-transform duration-500',
          isTalking && 'animate-[bounce_2s_infinite_ease-in-out]'
        )}
      >
        <defs>
          <linearGradient id="avatarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
        </defs>

        <circle cx="100" cy="100" r="80" fill="url(#avatarGradient)" className="shadow-2xl" />

        <g className="eyes">
          <circle cx="70" cy="85" r="8" fill="white" className="animate-[blink_4s_infinite]" />
          <circle cx="130" cy="85" r="8" fill="white" className="animate-[blink_4s_infinite]" />
        </g>

        <g className={clsx('transition-transform duration-300', emotion === 'thinking' && '-translate-y-2')}>
          <path d="M60 65 Q70 60 80 65" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" />
          <path d="M120 65 Q130 60 140 65" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" />
        </g>

        {!isTalking ? (
          <path
            d={emotion === 'happy' ? 'M70 125 Q100 145 130 125' : 'M80 130 L120 130'}
            fill="none"
            stroke="white"
            strokeWidth="4"
            strokeLinecap="round"
            className="transition-all duration-300"
          />
        ) : (
          <ellipse
            cx="100"
            cy="135"
            rx="15"
            ry="10"
            fill="white"
            className="animate-[talking_0.25s_infinite_alternate]"
          />
        )}
      </svg>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes blink {
          0%, 90%, 100% { transform: scaleY(1); }
          95% { transform: scaleY(0.1); }
        }
        @keyframes talking {
          from { ry: 2; rx: 10; }
          to { ry: 12; rx: 18; }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      `
        }}
      />
    </div>
  );
};

export default TalkingAvatar;
