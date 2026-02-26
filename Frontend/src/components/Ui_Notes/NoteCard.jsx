export default function NoteCard({ note }) {
  return (
    <div className="p-4 border rounded-lg shadow-sm hover:shadow-md transition bg-white">
      <h2 className="font-semibold text-lg text-gray-800">{note.title}</h2>
      <p className="text-sm text-gray-600 mt-1">📘 {note.subject}</p>
      <div className="flex justify-between items-center mt-2 text-sm">
        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs">
          Semester {note.semester}
        </span>
        <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">
          {note.type}
        </span>
      </div>
      <button className="mt-3 w-full bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 transition">
        View / Download
      </button>
    </div>
  );
}