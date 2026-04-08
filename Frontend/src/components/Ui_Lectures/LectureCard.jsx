import React, { useState } from "react";

function LectureCard({ lecture }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const currentVideo = lecture.link;

  return (
    <div className="border rounded-lg shadow-md p-4 bg-[#374151] text-white">
      {/* Title */}
      <h2 className="text-base font-semibold mb-1 truncate">
        {lecture.title}
      </h2>
      <p className="text-xs text-gray-400 mb-2">
        📘 {lecture.subject} | 🎓 Sem {lecture.semester} | 🏫 {lecture.branch}
      </p>

      {/* Main Video */}
      {lecture.type === "Video" && currentVideo ? (
        <iframe
          className="w-full h-32 rounded-md"
          src={currentVideo}
          title={lecture.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      ) : (
        <p className="text-gray-500 text-sm">
          📄 {lecture.type} (Resource link coming soon)
        </p>
      )}

      {/* Playlist Section */}
      {lecture.playlistVideos?.length > 0 && (
        <div className="mt-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full text-left text-sm font-medium text-purple-400 hover:text-purple-300 transition-colors duration-200"
          >
            {isExpanded
              ? "▼ Hide Playlist"
              : `► Show Playlist (${lecture.playlistVideos.length} videos)`}
          </button>

          {isExpanded && (
            <div className="mt-1 space-y-1 max-h-32 overflow-y-auto">
              {lecture.playlistVideos.map((video, index) => (
                <div
                  key={index}
                  className="p-1 rounded-md bg-[#4B5563] hover:bg-[#6B7280] transition-colors duration-200 flex items-center justify-between"
                >
                  <p className="text-xs text-white truncate">{video.title}</p>
                  <a
                    href={video.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 text-xs hover:underline ml-2"
                  >
                    🔗 Link
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
export default LectureCard;
