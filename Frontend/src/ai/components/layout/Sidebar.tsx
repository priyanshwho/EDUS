import React, { useEffect, useState, useMemo } from 'react';
import { useSession } from '../../context/SessionContext';
import { fetchBranches, fetchSemesters } from '../../api/syllabus.api';
import { Menu, X, ChevronRight, Layers, BookOpen, FolderUp, Globe, Check } from 'lucide-react';
import { clsx } from 'clsx';
import eduAiImg from '../../../assets/eduai.png';
import { useAuth } from '../../../context/AuthContext';

const Sidebar = () => {
  const { state, dispatch } = useSession();
  const { isAdmin, isProfessor } = useAuth();
  const canManage = Boolean(isAdmin || isProfessor);
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

  const validSemesters = useMemo(() => {
    return semesters.filter((sem) => {
      const num = parseInt(String(sem).replace(/\D/g, ''), 10);
      return !isNaN(num) && num >= 1 && num <= 8;
    });
  }, [semesters]);

  const selectedList = useMemo(() => {
    if (Array.isArray(state.selectedSemesters) && state.selectedSemesters.length > 0) {
      return state.selectedSemesters;
    }
    return state.semester ? [state.semester] : [];
  }, [state.selectedSemesters, state.semester]);

  const isAllSelected = validSemesters.length > 0 && validSemesters.every((s) => selectedList.includes(s));

  const handleSelectAll = () => {
    if (isAllSelected) {
      dispatch({ type: 'SET_SEMESTERS', payload: [] });
    } else {
      dispatch({ type: 'SET_SEMESTERS', payload: validSemesters });
    }
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full p-5 gap-6">
      {/* ── Logo ── */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-transparent border border-white/10 overflow-hidden">
          <img src={eduAiImg} className="w-full h-full object-cover" alt="Edu AI" />
        </div>
        <div>
          <div className="font-bold text-lg bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Edu.ai</div>
          <div className="text-[10px] uppercase tracking-wider text-slate-400">AI Learning Hub</div>
        </div>
      </div>

      {/* ── Branch ── */}
      <div className="space-y-2 mt-4">
        <label className="text-xs font-semibold uppercase text-slate-500 px-1">Branch</label>
        <div className="space-y-1 overflow-y-auto max-h-48">
          {branches.map((branch) => {
            const active = state.viewMode !== 'my_uploads' && state.branch === branch;
            return (
              <button
                key={branch}
                onClick={() => { dispatch({ type: 'SET_BRANCH', payload: branch }); setMobileOpen(false); }}
                className={clsx(
                  'w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-between',
                  active
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md shadow-blue-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                )}
              >
                <span>{branch}</span>
                {active && <ChevronRight size={14} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Semester ── */}
      {state.branch && state.viewMode !== 'my_uploads' && state.viewMode !== 'global_uploads' && (
        <div className="space-y-2 mt-4">
          <div className="flex items-center justify-between px-1">
            <label className="text-xs font-semibold uppercase text-slate-500">Semester</label>
            {validSemesters.length > 0 && (
              <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-400 hover:text-white select-none transition-colors">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={handleSelectAll}
                  className="w-3.5 h-3.5 rounded border-slate-700 bg-slate-900/80 text-blue-500 focus:ring-0 focus:ring-offset-0 cursor-pointer accent-blue-500"
                />
                <span className="font-medium text-[11px]">Select All</span>
              </label>
            )}
          </div>
          <div className="space-y-1 overflow-y-auto max-h-56">
            {validSemesters.map((sem) => {
              const active = selectedList.includes(sem);
              return (
                <div
                  key={sem}
                  onClick={() => dispatch({ type: 'TOGGLE_SEMESTER', payload: sem })}
                  className={clsx(
                    'w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-between cursor-pointer group select-none',
                    active
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md shadow-blue-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={clsx(
                        'w-4 h-4 rounded flex items-center justify-center border transition-all duration-150',
                        active
                          ? 'bg-white text-blue-600 border-white shadow-sm'
                          : 'border-slate-600 bg-slate-800/60 group-hover:border-slate-400'
                      )}
                    >
                      {active && <Check size={12} strokeWidth={3} />}
                    </div>
                    <span className="capitalize">{sem.replace('_', ' ')}</span>
                  </div>
                  {active && (
                    <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-white/20 text-white">
                      Active
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Professor & Admin Uploads Section ── */}
      {canManage && (
        <div className="space-y-2 mt-4 pt-4 border-t border-slate-800">
          <div className="flex items-center justify-between px-1">
            <label className="text-xs font-semibold uppercase text-slate-500">
              Uploads
            </label>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-sky-500/10 text-sky-400 font-semibold border border-sky-500/20">
              {isAdmin ? 'Admin' : 'Professor'}
            </span>
          </div>

          <div className="space-y-1">
            {/* My Uploads */}
            <button
              type="button"
              onClick={() => {
                dispatch({ type: 'SET_VIEW_MODE', payload: 'my_uploads' });
                setMobileOpen(false);
              }}
              className={clsx(
                'w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-between',
                state.viewMode === 'my_uploads'
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
              )}
            >
              <div className="flex items-center gap-2.5">
                <FolderUp size={16} />
                <span>My Uploads</span>
              </div>
              {state.viewMode === 'my_uploads' && <ChevronRight size={14} />}
            </button>

            {/* Global Uploads (Admin only) */}
            {isAdmin && (
              <button
                type="button"
                onClick={() => {
                  dispatch({ type: 'SET_VIEW_MODE', payload: 'global_uploads' });
                  setMobileOpen(false);
                }}
                className={clsx(
                  'w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-between',
                  state.viewMode === 'global_uploads'
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md shadow-blue-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Globe size={16} />
                  <span>Global Uploads</span>
                </div>
                {state.viewMode === 'global_uploads' && <ChevronRight size={14} />}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* ── Mobile hamburger ── */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-20 right-4 z-[90] w-10 h-10 rounded-xl flex items-center justify-center bg-[#0a1120] border border-blue-500/30 hover:border-blue-500/50 shadow-md"
      >
        {mobileOpen ? <X size={18} className="text-slate-300" /> : <Menu size={18} className="text-slate-300" />}
      </button>

      {/* ── Mobile overlay ── */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/60"
          onClick={() => setMobileOpen(false)}
        >
          <aside
            className="absolute right-0 top-0 bottom-0 w-72 bg-[#0a1120] border-l border-blue-500/20 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-4 left-4">
              <button
                onClick={() => setMobileOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-white/5"
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
        className="hidden lg:flex flex-col w-72 h-screen sticky top-0 overflow-y-auto flex-shrink-0 bg-[#0a1120]/90 backdrop-blur-md border-r border-blue-500/20 shadow-xl shadow-blue-950/20"
      >
        <SidebarContent />
      </aside>
    </>
  );
};

export default Sidebar;
