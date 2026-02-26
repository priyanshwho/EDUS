import React, { useState, useEffect } from 'react';

// Subject mapping data structure
const subjectMapping = {
  "CSE": {
    "1": ["Mathematics-I", "Physics", "Intro to Programming"],
    "2": ["Data Structures", "Mathematics-II", "Electrical Engineering"],
    "3": ["Operating Systems", "DSA", "DBMS"],
    "4": ["Computer Networks", "Software Engineering", "Algorithms"],
    "5": ["Web Development", "Artificial Intelligence", "Machine Learning"],
    "6": ["Cloud Computing", "Cryptography", "Network Security"],
    "7": ["Data Science", "Compiler Design", "Big Data"],
    "8": ["Cyber Forensics", "Ethical Hacking", "Distributed Systems"]
  },
  "IT": {
    "3": ["DBMS", "Data Structures", "IT Fundamentals"],
    "4": ["Web Technologies", "Cyber Security", "Networking"],
  },
  "ECE": {
    "3": ["Digital Electronics", "Signals and Systems"],
    "4": ["Communication Systems", "Microcontrollers", "VLSI"],
  },
  "EEE": {
    "3": ["Power Systems", "Electrical Machines"],
    "4": ["Control Systems", "Power Electronics"],
  },
  "ME": {
    "3": ["Thermodynamics", "Fluid Mechanics"],
    "4": ["Machine Design", "Manufacturing Technology"],
  },
  "Bio-Tech": {
    "3": ["Genetics", "Biochemistry"],
    "4": ["Bioinformatics", "Molecular Biology"],
  }
};

export default function FilterBar({ filters, setFilters }) {
  const branches = ["All Branches", "CSE", "IT", "ECE", "EEE", "ME", "Bio-Tech"];
  const semesters = ["All Semesters", "1", "2", "3", "4", "5", "6", "7", "8"];
  const types = ["All Types", "Notes", "Assignment"];

  const [availableSubjects, setAvailableSubjects] = useState([]);

  // This effect updates the subjects whenever branch or semester changes
  useEffect(() => {
    const selectedBranch = filters.branch;
    const selectedSemester = filters.semester;

    // Default to a complete list if no specific branch/semester is selected
    if (selectedBranch === 'All Branches' || selectedSemester === 'All Semesters') {
      const allSubjects = new Set();
      Object.values(subjectMapping).forEach(branch => {
        Object.values(branch).forEach(semesters => {
          semesters.forEach(subject => allSubjects.add(subject));
        });
      });
      setAvailableSubjects(["All Subjects", ...Array.from(allSubjects)]);
    } else {
      // Get subjects for the specific branch and semester
      const subjectsForSelection = subjectMapping[selectedBranch]?.[selectedSemester] || [];
      setAvailableSubjects(["All Subjects", ...subjectsForSelection]);
    }
  }, [filters.branch, filters.semester]); // Run this effect when branch or semester changes

  const handleChange = (key, value) => {
    // If branch or semester changes, reset the subject filter to prevent a "dangling" value
    if (key === "branch" || key === "semester") {
      setFilters({ ...filters, [key]: value, subject: "All Subjects" });
    } else {
      setFilters({ ...filters, [key]: value });
    }
  };

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <h3 className="text-gray-700 font-semibold mb-2">SEARCH</h3>
        <div className="relative">
          <input
            type="text"
            placeholder="Search by title or subject"
            className="border border-gray-300 pl-10 pr-4 py-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-purple-400"
            value={filters.search}
            onChange={(e) => handleChange("search", e.target.value)}
          />
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            🔍
          </span>
        </div>
      </div>
      
      <div className="mb-4">
        <h3 className="text-gray-700 font-semibold mb-2">BRANCH</h3>
        <select
          className="border border-gray-300 p-2 rounded w-full bg-blue-300"
          value={filters.branch}
          onChange={(e) => handleChange("branch", e.target.value)}
        >
          {branches.map((branch) => (
            <option key={branch} value={branch}>
              {branch}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <h3 className="text-gray-700 font-semibold mb-2">SEMESTER</h3>
        <select
          className="border border-gray-300 p-2 rounded w-full bg-blue-300"
          value={filters.semester}
          onChange={(e) => handleChange("semester", e.target.value)}
        >
          {semesters.map((sem) => (
            <option key={sem} value={sem}>
              {sem}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <h3 className="text-gray-700 font-semibold mb-2">SUBJECT</h3>
        <select
          className="border border-gray-300 p-2 rounded w-full bg-blue-300"
          value={filters.subject}
          onChange={(e) => handleChange("subject", e.target.value)}
        >
          {availableSubjects.map((sub) => (
            <option key={sub} value={sub}>
              {sub}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <h3 className="text-gray-700 font-semibold mb-2">TYPE</h3>
        <select
          className="border border-gray-300 p-2 rounded w-full bg-blue-300"
          value={filters.type}
          onChange={(e) => handleChange("type", e.target.value)}
        >
          {types.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}