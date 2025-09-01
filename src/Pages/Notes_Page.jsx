import { useState, useEffect } from 'react';
import FilterBar from '../components/Ui_Notes/FilterBar';
import NoteCard from '../components/Ui_Notes/NoteCard';
import { initialNotes } from '../database/Notes';


export default function NotesPage() {
  const [notes, setNotes] = useState(initialNotes);
  const [filters, setFilters] = useState({
    search: '',
    branch: 'All Branches',
    semester: 'All Semesters',
    subject: 'All Subjects',
    type: 'All Types',
  });

  useEffect(() => {
    let filtered = initialNotes.filter(note => {
      const matchesSearch = note.title.toLowerCase().includes(filters.search.toLowerCase()) || note.subject.toLowerCase().includes(filters.search.toLowerCase());
      const matchesBranch = filters.branch === 'All Branches' || note.branch === filters.branch;
      const matchesSemester = filters.semester === 'All Semesters' || note.semester === filters.semester;
      const matchesSubject = filters.subject === 'All Subjects' || note.subject === filters.subject;
      const matchesType = filters.type === 'All Types' || note.type === filters.type;

      return matchesSearch && matchesBranch && matchesSemester && matchesSubject && matchesType;
    });

    setNotes(filtered);
  }, [filters]);

  return (
    <div className="p-4 md:p-8 font-sans bg-gray-50 min-h-screen">
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-2">
          <span className="text-purple-600">📝</span> Study Notes & Assignments
        </h1>
        <p className="text-gray-600 mt-2">
          Access and download comprehensive study notes and assignments to boost your academic performance.
        </p>
      </div>

      <div className="flex flex-col md:flex-row">
        {/* The FilterBar is now responsible for its own toggle state */}
        <FilterBar filters={filters} setFilters={setFilters} />

        <div className="flex-1 mt-6 md:mt-0 md:ml-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl md:text-2xl font-semibold text-gray-800">
              {notes.length} Notes Found
            </h2>
            <button className="flex items-center text-gray-600 hover:text-gray-800">
              <span className="mr-1">⇅</span> SORT BY
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {notes.map(note => (
              <NoteCard key={note.id} note={note} />
            ))}
          </div>

          {notes.length === 0 && (
            <div className="text-center text-gray-500 mt-10">
              ❌ No notes found. Try changing your filters or search.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}