import { useState, useEffect } from 'react';

// Data structure to map branches and semesters to subjects
const subjectMapping = {
  CSE: {
    '1': ['Introduction to Programming', 'Mathematics I', 'Physics'],
    '2': ['Data Structures', 'Mathematics II', 'Electrical Engineering'],
    '3': ['Operating Systems', 'DBMS', 'Algorithms'],
    '4': ['Computer Networks', 'Microprocessor', 'Software Engineering'],
    '5': ['Artificial Intelligence', 'Machine Learning', 'Web Development'],
    '6': ['Cloud Computing', 'Cryptography', 'Network Security'],
    '7': ['Data Science', 'Compiler Design', 'Big Data'],
    '8': ['Cyber Forensics', 'Distributed Systems', 'Ethical Hacking'],
  },
  IT: {
    '1': ['Applied Physics', 'Mathematics I', 'Physics'],
    '3': ['DBMS', 'Data Structures', 'IT Fundamentals'],
    '4': ['Web Technologies', 'Cyber Security', 'Networking'],
  },
  ECE: {
    '3': ['Digital Electronics', 'Signals and Systems'],
    '4': ['Communication Systems', 'Microcontrollers', 'VLSI'],
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

  // This useEffect hook updates the available subjects
  // whenever the selected branch or semester changes.
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