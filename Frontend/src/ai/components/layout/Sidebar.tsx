import React, { useEffect, useState } from 'react';
import { useSession } from '../../context/SessionContext';
import { fetchBranches, fetchSemesters } from '../../api/syllabus.api';
import { Settings, Sparkles, Wand2 } from 'lucide-react';
import { clsx } from 'clsx';

const Sidebar = () => {
  const { state, dispatch } = useSession();
  const [branches, setBranches] = useState([]);
  const [semesters, setSemesters] = useState([]);

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

  return (
    <aside className="w-80 bg-gradient-to-br from-n-8 via-n-7 to-n-8 border-r border-n-3/20 flex flex-col p-6 h-screen sticky top-0">
      <div className="relative mb-10">
        <div className="absolute inset-0 bg-gradient-to-r from-color-1/20 via-color-6/20 to-color-1/20 rounded-3xl blur-xl opacity-70" />
        <div className="relative p-5 rounded-3xl bg-gradient-to-br from-n-7/90 via-n-6/80 to-n-7/90 border border-color-1/30 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-gradient-to-r from-color-1 to-color-6 rounded-xl flex items-center justify-center text-white">
              <Sparkles size={22} />
            </div>
            <div>
              <div className="text-xl font-black tracking-tight text-n-1">Edu.ai</div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-n-3">AI-driven learning hub</div>
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-8">
        <div className="flex items-center gap-2 px-2">
          <div className="p-2 bg-gradient-to-r from-color-1/20 to-color-6/20 rounded-xl">
            <Wand2 size={18} className="text-n-1" />
          </div>
          <div>
            <p className="text-sm font-bold text-n-1">AI-driven navigator</p>
            <p className="text-[11px] text-n-3">Filter syllabus by branch and semester</p>
          </div>
        </div>
        <div>
          <label className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] mb-4 block">Select Branch</label>
          <div className="space-y-2">
            {branches.map((branch) => (
              <button
                key={branch}
                onClick={() => dispatch({ type: 'SET_BRANCH', payload: branch })}
                className={clsx(
                  'w-full text-left px-4 py-3 rounded-xl transition-all duration-200',
                  state.branch === branch ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'hover:bg-white/5 text-text-muted'
                )}
              >
                {branch}
              </button>
            ))}
          </div>
        </div>

        {state.branch && (
          <div>
            <label className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] mb-4 block">Select Semester</label>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
              {semesters.map((sem) => (
                <button
                  key={sem}
                  onClick={() => dispatch({ type: 'SET_SEMESTER', payload: sem })}
                  className={clsx(
                    'w-full text-left px-4 py-3 rounded-xl transition-all duration-200',
                    state.semester === sem ? 'bg-secondary text-white shadow-lg shadow-secondary/20' : 'hover:bg-white/5 text-text-muted'
                  )}
                >
                  {sem.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
        )}
      </nav>

      <div className="pt-6 border-t border-white/5 space-y-2">
        <button className="w-full flex items-center gap-3 px-4 py-3 text-text-muted hover:text-text hover:bg-white/5 rounded-xl transition-all">
          <Settings size={20} /> <span>Settings</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
