import { useState, useEffect } from 'react';

const subjectMapping = {
  CSE: {
    '1': ['CALCULUS', 'PROFESSIONAL COMMUNICATION', 'FUNDAMENTAL PROGRAMMING', 'WORKSHOP'],
    '2': ['APPLIED CHEMISTRY', 'DIFF. EQ. & TRAN.', 'BEEE', 'ENGINEERING GRAPHICS', 'OOPS'],
    '3': ['DISCRETE STRUCTURE', 'WEB TECHNOLOGIES', 'DATA STRUCTURE', 'DATABASE SYSTEMS', 'SOFTWARE ENGINEERING'],
    '4': ['LINEAR ALGEBRA & PROB. THEORY', 'COMPUTER ARCH. & ORG.', 'ANALYSIS AND DESIGN OF ALGORITHMS', 'COMPUTER NETWORK', 'OPERATING SYSTEM'],
    '5': ['NATURAL LANGUAGE PROCESSING', 'COMPUTER GRAPHICS', 'ARTIFICIAL INTELLIGENCE', 'THEORY OF COMPUTATION', 'ECONOMICS'],
    '6': ['DATA MINING AND MACHINE LEARNING', 'NSC', 'DIGITAL IMAGE PROCESSING', 'COMPILER DESIGN'],
  },
  IT: {
    '1': ['APPLIED PHYSICS', 'CALCULUS', 'PROFESSIONAL COMMUNICATION', 'FUNDAMENTAL PROGRAMMING', 'WORKSHOP'],
    '2': ['APPLIED CHEMISTRY', 'DIFF. EQ. & TRAN.', 'BEEE', 'ENGINEERING GRAPHICS', 'OOPS WITH C++'],
    '3': ['LINEAR ALGEBRA & PROB. THEORY', 'DIGITAL ELECTRONICS', 'COMPUTER ARCH. & ORG.', 'DATA STRUCTURE', 'DBMS'],
    '4': ['ECONOMICS', 'DISCRETE STRUCTURE', 'COMPUTER NETWORK', 'MICRO-PROCESSOR', 'OPERATING SYSTEM'],
    '5': ['NETWORK SECURITY AND CRYPTOGRAPHY', 'ARTIFICIAL INTELLIGENCE', 'CYBER LAWS & IPR', 'PYTHON'],
    '6': ['THEORY OF COMPUTATION', 'MACHINE LEARNING', 'DESIGN AND ANALYSIS OF ALGORITHMS', 'COMPUTER GRAPHICS', 'SOFTWARE ENGINEERING'],
  },
  ECE: {
    '1': ['APPLIED CHEMISTRY', 'CALCULUS', 'BASIC ELECTRICAL AND ELECTRONICS ENGINEERING', 'FUNDAMENTAL PROGRAMMING', 'ENGINEERING GRAPHICS'],
    '2': ['DIFF. EQ. & TRAN.', 'PROFESSIONAL COMMUNICATION', 'DIGITAL DESIGN', 'WORKSHOP'],
    '3': ['LINEAR ALGEBRA & COMPLEX ANALYSIS', 'SIGNALS AND SYSTEMS', 'MICROPROCESSOR AND MICROCONTROLLERS', 'ELECTRONIC DEVICES AND CIRCUITS', 'ELECTRONICS MEASUREMENTS & INSTRUMENTATION'],
    '4': ['COMMUNICATION ENGINEERING', 'ADVANCED MICROCONTROLLERS & APPLICATIONS', 'ANALOG ELECTRONIC CIRCUITS', 'PROBABILITY AND RANDOM PROCESSES', 'ELECTROMAGNETIC THEORY', 'NETWORK ANALYSIS'],
    '5': ['VLSI DESIGN', 'DIGITAL SIGNAL PROCESSING', 'ANTENNAS & WAVE PROPAGATION', 'COMPUTER NETWORKS', 'DIGITAL SYSTEM DESIGN'],
    '6': ['MICROWAVE & RADAR ENGINEERING', 'FIBER OPTIC COMMUNICATION SYSTEMS', 'DIGITAL COMMUNICATION', 'CONTROL SYSTEMS', 'POWER ELECTRONICS'],
  },
  ME: { '3': ['Thermodynamics', 'Fluid Mechanics'], '4': ['Machine Design', 'Manufacturing Technology'] },
  CE: { '3': ['Structural Analysis', 'Geotechnical Engineering'], '4': ['Transportation Engineering', 'Environmental Engineering'] },
  EE: { '3': ['Power Systems', 'Electrical Machines'], '4': ['Control Systems', 'Power Electronics'] },
};

const selectStyle = {
  background: 'rgba(21,19,29,0.8)',
  border: '1.5px solid #252134',
  borderRadius: '10px',
  color: '#CAC6DD',
  padding: '9px 36px 9px 14px',
  fontSize: '13px',
  outline: 'none',
  cursor: 'pointer',
  appearance: 'none',
  WebkitAppearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none'%3E%3Cpath d='M6 9l6 6 6-6' stroke='%23757185' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 10px center',
  transition: 'border-color 0.18s, box-shadow 0.18s',
  minWidth: '140px',
};

export default function LectureFilters({ filters, setFilters }) {
  const [availableSubjects, setAvailableSubjects] = useState([]);

  useEffect(() => {
    const { branch, semester } = filters;
    let subjects = [];
    if (branch !== 'All' && semester !== 'All') {
      subjects = subjectMapping[branch]?.[semester] || [];
    }
    setAvailableSubjects(['All Subjects', ...subjects]);
  }, [filters.branch, filters.semester]);

  const handleChange = (key, value) => {
    if (key === 'branch' || key === 'semester') {
      setFilters({ ...filters, [key]: value, subject: 'All Subjects' });
    } else {
      setFilters({ ...filters, [key]: value });
    }
  };

  const hasActiveFilters =
    filters.search !== '' ||
    filters.branch !== 'All' ||
    filters.semester !== 'All' ||
    filters.subject !== 'All';

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
      {/* Search */}
      <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
        <svg width="15" height="15" fill="none" viewBox="0 0 24 24" style={{
          position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#3F3A52', pointerEvents: 'none',
        }}>
          <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
          <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        <input
          className="edus-input"
          type="text"
          placeholder="Search lectures…"
          value={filters.search}
          onChange={e => handleChange('search', e.target.value)}
          style={{ paddingLeft: '36px' }}
        />
      </div>

      {/* Branch */}
      <select
        style={selectStyle}
        value={filters.branch}
        onChange={e => handleChange('branch', e.target.value)}
        onFocus={e => { e.target.style.borderColor = '#38bdf8'; e.target.style.boxShadow = '0 0 0 3px rgba(56,189,248,0.12)'; }}
        onBlur={e => { e.target.style.borderColor = '#252134'; e.target.style.boxShadow = 'none'; }}
      >
        <option value="All">All Branches</option>
        {['CSE', 'IT', 'ECE', 'ME', 'CE', 'EE'].map(b => <option key={b} value={b}>{b}</option>)}
      </select>

      {/* Semester */}
      <select
        style={selectStyle}
        value={filters.semester}
        onChange={e => handleChange('semester', e.target.value)}
        onFocus={e => { e.target.style.borderColor = '#38bdf8'; e.target.style.boxShadow = '0 0 0 3px rgba(56,189,248,0.12)'; }}
        onBlur={e => { e.target.style.borderColor = '#252134'; e.target.style.boxShadow = 'none'; }}
      >
        <option value="All">All Semesters</option>
        {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>Semester {s}</option>)}
      </select>

      {/* Subject */}
      <select
        style={{ ...selectStyle, minWidth: '180px' }}
        value={filters.subject}
        onChange={e => handleChange('subject', e.target.value)}
        onFocus={e => { e.target.style.borderColor = '#38bdf8'; e.target.style.boxShadow = '0 0 0 3px rgba(56,189,248,0.12)'; }}
        onBlur={e => { e.target.style.borderColor = '#252134'; e.target.style.boxShadow = 'none'; }}
      >
        {availableSubjects.map(s => <option key={s} value={s}>{s}</option>)}
      </select>

      {/* Clear */}
      {hasActiveFilters && (
        <button
          className="edus-btn-ghost"
          onClick={() => setFilters({ search: '', semester: 'All', subject: 'All', branch: 'All' })}
          style={{ padding: '9px 16px', fontSize: '13px' }}
        >
          Clear filters
        </button>
      )}
    </div>
  );
}