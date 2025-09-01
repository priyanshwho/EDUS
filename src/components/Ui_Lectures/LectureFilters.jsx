export default function LectureFilters({ filters, setFilters }) {
  return (
    <div className="flex flex-wrap gap-4 ml-5">
      {/* Search */}
      <input
        type="text"
        placeholder="Search lectures..."
        className="border p-2 rounded-md"
        value={filters.search}
        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
      />

       {/* Branch */}
      <select
        className="border p-2 rounded-md"
        value={filters.branch}
        onChange={(e) => setFilters({ ...filters, branch: e.target.value })}
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
        onChange={(e) => setFilters({ ...filters, semester: e.target.value })}
      >
        <option value="All">All Semesters</option>
        {[3, 4, 5, 6, 7, 8].map((sem) => (
          <option key={sem} value={sem}>
            Semester {sem}
          </option>
        ))}
      </select>

      {/* Subject */}
      <select
        className="border p-2 rounded-md"
        value={filters.subject}
        onChange={(e) => setFilters({ ...filters, subject: e.target.value })}
      >
        <option value="All">All Subjects</option>
        <option value="DBMS">DBMS</option>
        <option value="Microprocessor">Microprocessor</option>
        <option value="CN">Computer Networks</option>
        <option value="OS">Operating System</option>
      </select>

     
    </div>
  );
}
