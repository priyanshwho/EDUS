export default function LectureCard({ lecture }) {
  return (
    <div className="border rounded-lg shadow-md p-4 bg-white">
      <h2 className="text-lg font-semibold mb-2">{lecture.title}</h2>
      <p className="text-sm text-gray-600 mb-2">
        📘 {lecture.subject} | 🎓 Sem {lecture.semester} | 🏫 {lecture.branch}
      </p>

      {lecture.type === "Video" && lecture.link ? (
        <iframe
          className="w-full h-48 rounded-lg"
          src={lecture.link}
          title={lecture.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      ) : (
        <p className="text-gray-500">📄 {lecture.type} (Resource link coming soon)</p>
      )}
    </div>
  );
}
