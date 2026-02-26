import { useState, useEffect, useCallback } from 'react';
import { subjectService } from '../services';

const RESOURCE_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'notes', label: 'Notes' },
  { value: 'pyq', label: 'PYQ' },
  { value: 'lecture', label: 'Lecture' },
  { value: 'assignment', label: 'Assignment' },
  { value: 'lab', label: 'Lab Manual' },
];

const PYQ_TYPES = [
  { value: '', label: 'All' },
  { value: 'major', label: 'Major' },
  { value: 'minor', label: 'Minor' },
  { value: 'sessional', label: 'Sessional' },
  { value: 'practical', label: 'Practical' },
];

const SEMESTERS = [
  { value: '', label: 'All Sems' },
  ...Array.from({ length: 8 }, (_, i) => ({ value: String(i + 1), label: `Sem ${i + 1}` })),
];

const YEARS = (() => {
  const current = new Date().getFullYear();
  const opts = [{ value: '', label: 'All Years' }];
  for (let y = current; y >= 2015; y--) opts.push({ value: String(y), label: String(y) });
  return opts;
})();

/**
 * Full-featured resource filter panel.
 *
 * Props:
 *   filters   — current filter state object
 *   onChange  — (newFilters) callback
 *   onClear   — () clear all callback
 *   compact   — boolean, render as a horizontal strip (default: false = sidebar panel)
 */
export default function ResourceFilterPanel({ filters = {}, onChange, onClear, compact = false }) {
  const [subjects, setSubjects] = useState([]);
  const [searchInput, setSearchInput] = useState(filters.q || '');
  const [debounceTimer, setDebounceTimer] = useState(null);

  // Load subjects once
  useEffect(() => {
    subjectService.list()
      .then((data) => setSubjects(data.subjects || []))
      .catch(() => {});
  }, []);

  // Debounce search input
  useEffect(() => {
    if (debounceTimer) clearTimeout(debounceTimer);
    const timer = setTimeout(() => {
      if (searchInput !== (filters.q || '')) {
        onChange?.({ ...filters, q: searchInput || undefined });
      }
    }, 400);
    setDebounceTimer(timer);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  function update(key, value) {
    const next = { ...filters };
    if (value === '' || value === undefined) {
      delete next[key];
    } else {
      next[key] = value;
    }
    onChange?.(next);
  }

  const activeCount = Object.keys(filters).filter((k) => filters[k] !== undefined && filters[k] !== '').length;

  if (compact) {
    return (
      <div className="flex flex-wrap gap-2 items-center">
        <SearchBox value={searchInput} onChange={setSearchInput} />
        <Select value={filters.resource_type || ''} onChange={(v) => update('resource_type', v)} options={RESOURCE_TYPES} />
        <Select value={filters.semester || ''} onChange={(v) => update('semester', v)} options={SEMESTERS} />
        {filters.resource_type === 'pyq' && (
          <Select value={filters.pyq_type || ''} onChange={(v) => update('pyq_type', v)} options={PYQ_TYPES} />
        )}
        {activeCount > 0 && (
          <button
            onClick={() => { setSearchInput(''); onClear?.(); }}
            className="px-3 py-2 text-xs text-n-3 hover:text-n-1 transition"
          >
            Clear ({activeCount})
          </button>
        )}
      </div>
    );
  }

  return (
    <aside className="w-full bg-n-7 border border-n-6 rounded-2xl p-5 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-n-1 text-sm">Filters</h3>
        {activeCount > 0 && (
          <button
            onClick={() => { setSearchInput(''); onClear?.(); }}
            className="text-xs text-color-1 hover:underline"
          >
            Clear all ({activeCount})
          </button>
        )}
      </div>

      {/* Search */}
      <FilterSection label="Search">
        <SearchBox value={searchInput} onChange={setSearchInput} />
      </FilterSection>

      {/* Resource Type */}
      <FilterSection label="Type">
        <div className="flex flex-wrap gap-2">
          {RESOURCE_TYPES.map((t) => (
            <Pill
              key={t.value}
              label={t.label}
              active={(filters.resource_type || '') === t.value}
              onClick={() => update('resource_type', t.value)}
            />
          ))}
        </div>
      </FilterSection>

      {/* Semester */}
      <FilterSection label="Semester">
        <div className="grid grid-cols-3 gap-1.5">
          {SEMESTERS.map((s) => (
            <Pill
              key={s.value}
              label={s.label}
              active={(filters.semester || '') === s.value}
              onClick={() => update('semester', s.value)}
            />
          ))}
        </div>
      </FilterSection>

      {/* Subject */}
      <FilterSection label="Subject">
        <Select
          value={filters.subject_id || ''}
          onChange={(v) => update('subject_id', v)}
          options={[
            { value: '', label: 'All Subjects' },
            ...subjects.map((s) => ({ value: s.id, label: s.name_full || s.acronym })),
          ]}
          fullWidth
        />
      </FilterSection>

      {/* PYQ-specific filters */}
      {(filters.resource_type === 'pyq' || !filters.resource_type) && (
        <>
          <FilterSection label="PYQ Type">
            <div className="flex flex-wrap gap-2">
              {PYQ_TYPES.map((t) => (
                <Pill
                  key={t.value}
                  label={t.label}
                  active={(filters.pyq_type || '') === t.value}
                  onClick={() => update('pyq_type', t.value)}
                />
              ))}
            </div>
          </FilterSection>

          <FilterSection label="Year">
            <Select
              value={filters.year || ''}
              onChange={(v) => update('year', v)}
              options={YEARS}
              fullWidth
            />
          </FilterSection>
        </>
      )}
    </aside>
  );
}

/* ── Small internal components ─────────────────────────────────────────────── */

function FilterSection({ label, children }) {
  return (
    <div>
      <p className="text-xs text-n-4 font-medium mb-2 uppercase tracking-wider">{label}</p>
      {children}
    </div>
  );
}

function Pill({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
        active
          ? 'bg-color-1 text-n-8'
          : 'bg-n-6 text-n-3 hover:text-n-1 hover:bg-n-5'
      }`}
    >
      {label}
    </button>
  );
}

function Select({ value, onChange, options, fullWidth = false }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`bg-n-6 text-n-1 text-sm rounded-lg px-3 py-2 border border-n-5 focus:outline-none focus:border-color-1 transition ${fullWidth ? 'w-full' : ''}`}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

function SearchBox({ value, onChange }) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-n-4 text-sm pointer-events-none">
        🔍
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search resources…"
        className="bg-n-6 text-n-1 text-sm rounded-lg pl-9 pr-3 py-2 border border-n-5 focus:outline-none focus:border-color-1 transition w-full sm:w-56"
      />
    </div>
  );
}
