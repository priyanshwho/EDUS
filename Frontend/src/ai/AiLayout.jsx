import React from 'react';
import { Outlet } from 'react-router-dom';
import PauseOverlay from './components/common/PauseOverlay';

const AiLayout = () => {
  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: '#0E0C15' }}>
      {/* ── Ambient orbs ── */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        {/* Orb 1 – electric blue, top-left */}
        <div
          className="ai-orb-drift absolute rounded-full"
          style={{
            width: 600, height: 600,
            top: '-180px', left: '-160px',
            background: 'radial-gradient(circle, rgba(56,189,248,0.12) 0%, rgba(56,189,248,0.04) 50%, transparent 70%)',
            filter: 'blur(1px)',
          }}
        />
        {/* Orb 2 – cyan, bottom-right */}
        <div
          className="ai-orb-drift-slow absolute rounded-full"
          style={{
            width: 700, height: 700,
            bottom: '-200px', right: '-200px',
            animationDelay: '-6s',
            background: 'radial-gradient(circle, rgba(34,211,238,0.10) 0%, rgba(34,211,238,0.03) 50%, transparent 70%)',
            filter: 'blur(1px)',
          }}
        />
        {/* Orb 3 – teal, center-right */}
        <div
          className="ai-orb-drift absolute rounded-full"
          style={{
            width: 400, height: 400,
            top: '40%', right: '-80px',
            animationDelay: '-4s',
            background: 'radial-gradient(circle, rgba(45,212,191,0.08) 0%, rgba(45,212,191,0.02) 60%, transparent 70%)',
          }}
        />
        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(56,189,248,0.025) 1px, transparent 1px),
              linear-gradient(90deg, rgba(56,189,248,0.025) 1px, transparent 1px)
            `,
            backgroundSize: '64px 64px',
          }}
        />
        {/* Radial vignette */}
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(56,189,248,0.06) 0%, transparent 70%)',
          }}
        />
      </div>

      {/* ── Content ── */}
      <div className="relative z-10">
        <PauseOverlay />
        <Outlet />
      </div>
    </div>
  );
};

export default AiLayout;
