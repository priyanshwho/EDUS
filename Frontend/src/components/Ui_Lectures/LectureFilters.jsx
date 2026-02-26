import { useState, useEffect } from 'react';

// Data structure to map branches and semesters to subjects
const subjectMapping = {
   CSE: {
    '1': [
      'CALCULUS',
      'PROFESSIONAL COMMUNICATION',
      'FUNDAMENTAL PROGRAMMING',
      'WORKSHOP'
    ],
    '2': [
      'APPLIED CHEMISTRY',
      'DIFF. EQ. & TRAN.',
      'BEEE',
      'ENGINEERING GRAPHICS',
      'OOPS'
    ],
    '3': [
      'DISCRETE STRUCTURE',
      'WEB TECHNOLOGIES',
      'DATA STRUCTURE',
      'DATABASE SYSTEMS',
      'SOFTWARE ENGINEERING'
    ],
    '4': [
      'LINEAR ALGEBRA & PROB. THEORY',
      'COMPUTER ARCH. & ORG.',
      'ANALYSIS AND DESIGN OF ALGORITHMS',
      'COMPUTER NETWORK',
      'OPERATING SYSTEM'
    ],
    '5': [
      'NATURAL LANGUAGE PROCESSING',
      'COMPUTER GRAPHICS',
      'ARTIFICIAL INTELLIGENCE',
      'THEORY OF COMPUTATION',
      'ECONOMICS'
    ],
    '6': [
      'DATA MINING AND MACHINE LEARNING',
      'NSC',
      'DIGITAL IMAGE PROCESSING',
      'COMPILER DESIGN',
    ]
},

  IT: {
    '1': [
      'APPLIED PHYSICS',
      'CALCULUS',
      'PROFESSIONAL COMMUNICATION',
      'FUNDAMENTAL PROGRAMMING',
      'WORKSHOP'
    ],
    '2': [
      'APPLIED CHEMISTRY',
      'DIFF. EQ. & TRAN.',
      'BEEE',
      'ENGINEERING GRAPHICS',
      'OOPS WITH C++'
    ],
    '3': [
      'LINEAR ALGEBRA & PROB. THEORY',
      'DIGITAL ELECTRONICS',
      'COMPUTER ARCH. & ORG.',
      'DATA STRUCTURE',
      'DBMS'
    ],
    '4': [
      'ECONOMICS',
      'DISCRETE STRUCTURE',
      'COMPUTER NETWORK',
      'MICRO-PROCESSOR',
      'OPERATING SYSTEM'
    ],
    '5': [
      'NETWORK SECURITY AND CRYPTOGRAPHY',
      'ARTIFICIAL INTELLIGENCE',
      'CYBER LAWS & IPR',
      'PYTHON'
    ],
    '6': [
      'THEORY OF COMPUTATION',
      'MACHINE LEARNING',
      'DESIGN AND ANALYSIS OF ALGORITHMS',
      'COMPUTER GRAPHICS',
      'SOFTWARE ENGINEERING'
    ]
},

  ECE: {
    '1': [
      'APPLIED CHEMISTRY',
      'CALCULUS',
      'BASIC ELECTRICAL AND ELECTRONICS ENGINEERING',
      'FUNDAMENTAL PROGRAMMING',
      'ENGINEERING GRAPHICS'
    ],
    '2': [
      'DIFF. EQ. & TRAN.',
      'PROFESSIONAL COMMUNICATION',
      'DIGITAL DESIGN',
      'WORKSHOP'
    ],
    '3': [
      'LINEAR ALGEBRA & COMPLEX ANALYSIS',
      'SIGNALS AND SYSTEMS',
      'MICROPROCESSOR AND MICROCONTROLLERS',
      'ELECTRONIC DEVICES AND CIRCUITS',
      'ELECTRONICS MEASUREMENTS & INSTRUMENTATION'
    ],
    '4': [
      'COMMUNICATION ENGINEERING',
      'ADVANCED MICROCONTROLLERS & APPLICATIONS',
      'ANALOG ELECTRONIC CIRCUITS',
      'PROBABILITY AND RANDOM PROCESSES',
      'ELECTROMAGNETIC THEORY',
      'NETWORK ANALYSIS'
    ],
    '5': [
      'VLSI DESIGN',
      'DIGITAL SIGNAL PROCESSING',
      'ANTENNAS & WAVE PROPAGATION',
      'COMPUTER NETWORKS',
      'DIGITAL SYSTEM DESIGN'
    ],
    '6': [
      'MICROWAVE & RADAR ENGINEERING',
      'FIBER OPTIC COMMUNICATION SYSTEMS',
      'DIGITAL COMMUNICATION',
      'CONTROL SYSTEMS',
      'POWER ELECTRONICS'
    ]
},
  ME: {
    '3': ['Thermodynamics', 'Fluid Mechanics'],
    '4': ['Machine Design', 'Manufacturing Technology'],
  },
  CE: {
    '3': ['Structural Analysis', 'Geotechnical Engineering'],
    '4': ['Transportation Engineering', 'Environmental Engineering'],
  },
  EE: {
    '3': ['Power Systems', 'Electrical Machines'],
    '4': ['Control Systems', 'Power Electronics'],
  },
};

export default function LectureFilters({ filters, setFilters }) {
  const [availableSubjects, setAvailableSubjects] = useState([]);

  useEffect(() => {
    const selectedBranch = filters.branch;
    const selectedSemester = filters.semester;
    let subjects = [];

    // If a valid branch and semester are selected, fetch the subjects
    if (selectedBranch !== 'All' && selectedSemester !== 'All') {
      subjects = subjectMapping[selectedBranch]?.[selectedSemester] || [];
    }

    // Always include "All Subjects" as the first option
    setAvailableSubjects(['All Subjects', ...subjects]);
  }, [filters.branch, filters.semester]);

  const handleChange = (key, value) => {
    // If the user changes branch or semester, reset the subject filter
    // to prevent an invalid selection from a previous curriculum.
    if (key === 'branch' || key === 'semester') {
      setFilters({ ...filters, [key]: value, subject: 'All Subjects' });
    } else {
      setFilters({ ...filters, [key]: value });
    }
  };

  return (
    <div className="flex flex-wrap gap-4 ml-5">
      {/* Search */}
      <input
        type="text"
        placeholder="Search lectures..."
        className="border p-2 rounded-md"
        value={filters.search}
        onChange={(e) => handleChange('search', e.target.value)}
      />

      {/* Branch */}
      <select
        className="border p-2 rounded-md"
        value={filters.branch}
        onChange={(e) => handleChange('branch', e.target.value)}
      >
        <option value="All">All Branches</option>
        <option value="CSE">CSE</option>
        <option value="IT">IT</option>
        <option value="ECE">ECE</option>
        <option value="ME">ME</option>
        <option value="CE">CE</option>
        <option value="EE">EE</option>
      </select>

      {/* Semester */}
      <select
        className="border p-2 rounded-md"
        value={filters.semester}
        onChange={(e) => handleChange('semester', e.target.value)}
      >
        <option value="All">All Semesters</option>
        {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
          <option key={sem} value={sem}>
            Semester {sem}
          </option>
        ))}
      </select>

      {/* Subject */}
      <select
        className="border p-2 rounded-md"
        value={filters.subject}
        onChange={(e) => handleChange('subject', e.target.value)}
      >
        {availableSubjects.map((sub) => (
          <option key={sub} value={sub}>
            {sub}
          </option>
        ))}
      </select>
    </div>
  );
}