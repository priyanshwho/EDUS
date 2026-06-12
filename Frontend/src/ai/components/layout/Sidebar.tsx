import React, { useEffect, useState } from 'react';
import { useSession } from '../../context/SessionContext';
import { fetchBranches, fetchSemesters } from '../../api/syllabus.api';
import { Sparkles, Menu, X, ChevronRight, Layers, BookOpen } from 'lucide-react';
import { clsx } from 'clsx';

const Sidebar = () => {
  const { state, dispatch } = useSession();
  const [branches, setBranches] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    fetchBranches().then(setBranches).catch(console.error);
  }, []);

  useEffect(() => {
    if (state.branch) {
      fetchSemesters(state.branch).then(setSemesters).catch(console.error);
    } else {
      setSemesters([]);
    }
  }, [state.branch]);

  const SidebarContent = () => (
    <div className="flex flex-col h-full p-5 gap-6">
      {/* ── Logo ── */}
      <div className="relative">
        <div className="absolute inset-0 rounded-2xl blur-lg opacity-40"
          style={{ background: 'linear-gradient(135deg, rgba(56,189,248,0.4), rgba(34,211,238,0.3))' }} />
        <div className="relative ai-glass-blue rounded-2xl p-4 flex items-center gap-3">
          {/* Animated ring around icon */}
          <div className="relative flex-shrink-0">
            <div className="ai-ring-pulse absolute inset-0 rounded-full"
              style={{ border: '2px solid rgba(56,189,248,0.4)', margin: '-6px' }} />
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #0ea5e9, #22d3ee)' }}>
              <Sparkles size={20} className="text-white" />
            </div>
          </div>
          <div>
            <div className="font-black text-lg tracking-tight text-white">Edu.ai</div>
            <div className="text-[10px] uppercase tracking-[0.18em]"
              style={{ color: '#7dd3fc' }}>AI Learning Hub</div>
          </div>
        </div>
      </div>

      {/* ── Section label ── */}
      <div className="flex items-center gap-2 px-1">
        <Layers size={14} style={{ color: '#38bdf8' }} />
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#94a3b8' }}>
          Filter Your Syllabus
        </span>
      </div>

      {/* ── Branch ── */}
      <div className="space-y-2">
        <label className="text-[10px] font-bold uppercase tracking-[0.2em] px-1 block"
          style={{ color: '#64748b' }}>Branch</label>
        <div className="space-y-1 ai-scroll overflow-y-auto max-h-48">
          {branches.map((branch) => {
            const active = state.branch === branch;
            return (
              <button
                key={branch}
                onClick={() => { dispatch({ type: 'SET_BRANCH', payload: branch }); setMobileOpen(false); }}
                className={clsx(
                  'w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-between group',
                  active
                    ? 'text-white'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                )}
                style={active ? {
                  background: 'linear-gradient(135deg, rgba(56,189,248,0.2), rgba(34,211,238,0.1))',
                  border: '1px solid rgba(56,189,248,0.3)',
                  boxShadow: '0 0 16px rgba(56,189,248,0.1)',
                } : {}}
              >
                <span>{branch}</span>
                {active && <ChevronRight size={14} style={{ color: '#38bdf8' }} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Divider ── */}
      {state.branch && (
        <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(56,189,248,0.2), transparent)' }} />
      )}

      {/* ── Semester ── */}
      {state.branch && (
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2 px-1">
            <BookOpen size={14} style={{ color: '#22d3ee' }} />
            <label className="text-[10px] font-bold uppercase tracking-[0.2em]"
              style={{ color: '#64748b' }}>Semester</label>
          </div>
          <div className="space-y-1 ai-scroll overflow-y-auto max-h-56">
            {semesters.map((sem) => {
              const active = state.semester === sem;
              return (
                <button
                  key={sem}
                  onClick={() => { dispatch({ type: 'SET_SEMESTER', payload: sem }); setMobileOpen(false); }}
                  className={clsx(
                    'w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-between',
                    active ? 'text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'
                  )}
                  style={active ? {
                    background: 'linear-gradient(135deg, rgba(34,211,238,0.18), rgba(45,212,191,0.1))',
                    border: '1px solid rgba(34,211,238,0.3)',
                    boxShadow: '0 0 16px rgba(34,211,238,0.08)',
                  } : {}}
                >
                  <span>{sem.replace('_', ' ')}</span>
                  {active && <ChevronRight size={14} style={{ color: '#22d3ee' }} />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Status chips ── */}
      <div className="mt-auto space-y-2 pt-4"
        style={{ borderTop: '1px solid rgba(148,163,184,0.08)' }}>
        {state.branch && (
          <div className="flex items-center gap-2 px-1">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#38bdf8' }} />
            <span className="text-xs" style={{ color: '#94a3b8' }}>{state.branch}</span>
            {state.semester && (
              <>
                <span style={{ color: '#475569' }}>·</span>
                <span className="text-xs" style={{ color: '#94a3b8' }}>{state.semester.replace('_', ' ')}</span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* ── Mobile hamburger ── */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-20 left-4 z-50 w-10 h-10 rounded-xl flex items-center justify-center transition-all"
        style={{
          background: 'rgba(15,23,42,0.9)',
          border: '1px solid rgba(56,189,248,0.25)',
          boxShadow: '0 4px 20px rgba(56,189,248,0.15)',
        }}
      >
        <Menu size={18} style={{ color: '#38bdf8' }} />
      </button>

      {/* ── Mobile overlay ── */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={() => setMobileOpen(false)}
        >
          <aside
            className="ai-sidebar-open absolute left-0 top-0 bottom-0 w-72 ai-scroll overflow-y-auto"
            style={{ background: '#0a1628', borderRight: '1px solid rgba(56,189,248,0.15)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-4 right-4">
              <button
                onClick={() => setMobileOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8' }}
              >
                <X size={16} />
              </button>
            </div>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* ── Desktop sidebar ── */}
      <aside
        className="hidden lg:flex flex-col w-72 h-screen sticky top-0 ai-scroll overflow-y-auto flex-shrink-0"
        style={{
          background: 'rgba(10, 22, 40, 0.8)',
          borderRight: '1px solid rgba(56,189,248,0.12)',
          backdropFilter: 'blur(20px)',
        }}
      >
        <SidebarContent />
      </aside>
    </>
  );
};

export default Sidebar;
