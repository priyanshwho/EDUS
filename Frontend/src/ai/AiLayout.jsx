import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import PauseOverlay from './components/common/PauseOverlay';
import DashboardBackground from '../components/design/DashboardBackground';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

/* ─────────────────────────────────────────────────────────────────
   Top-level Error Boundary for the entire AI section.
   Catches any unhandled render crash in any AI page/component and
   shows a recovery screen instead of a blank black screen.
───────────────────────────────────────────────────────────────── */
class AiErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; message: string }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[AiLayout] Caught render error:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return <AiErrorScreen message={this.state.message} onRetry={() => this.setState({ hasError: false, message: '' })} />;
    }
    return this.props.children;
  }
}

/* Functional recovery screen — uses a raw anchor for navigation
   so it works even if the router context is broken */
const AiErrorScreen = ({ message, onRetry }: { message: string; onRetry: () => void }) => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-[#0E0C15] p-8 text-center">
    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
      style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
      <AlertTriangle size={28} className="text-rose-400" />
    </div>
    <h2 className="text-xl font-bold text-white mb-2">Something crashed</h2>
    <p className="text-sm text-slate-400 mb-2 max-w-md leading-relaxed">
      An unexpected error occurred in the AI section. Your session data is safe.
    </p>
    {message && (
      <p className="text-xs text-slate-600 mb-8 font-mono max-w-md break-all">{message}</p>
    )}
    <div className="flex gap-3 flex-wrap justify-center">
      <button onClick={onRetry} className="edus-btn">
        <RotateCcw size={15} /> Try Again
      </button>
      <a href="/ai" className="edus-btn-ghost flex items-center gap-2">
        <Home size={15} /> AI Home
      </a>
    </div>
  </div>
);

/* ─────────────────────────────────────────────────────────────────
   AiLayout — wraps all AI routes
───────────────────────────────────────────────────────────────── */
const AiLayout = () => {
  return (
    <div className="min-h-screen relative bg-gradient-to-br from-[#0b1021] via-[#0E0C15] to-[#1a1025] text-n-1">
      <DashboardBackground />
      <div className="relative z-10 h-full">
        <PauseOverlay />
        <AiErrorBoundary>
          <Outlet />
        </AiErrorBoundary>
      </div>
    </div>
  );
};

export default AiLayout;
