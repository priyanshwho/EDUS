import React, { useState } from "react";

export default function LectureCard({ lecture }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentVideo, setCurrentVideo] = useState(lecture.link);

  return (
    <div className="border rounded-lg shadow-md p-3 #1E2939">
      {/* Title */}
      <h2 className="text-base font-semibold mb-1 truncate text-white">
        {lecture.title}
      </h2>
      <p className="text-xs text-gray-600 mb-2">
        📘 {lecture.subject} | 🎓 Sem {lecture.semester} | 🏫 {lecture.branch}
      </p>

      {/* Main Video */}
      {lecture.type === "Video" && currentVideo ? (
        <iframe
          className="w-full h-32 rounded-md" // reduced height
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
      {lecture.playlistVideos && lecture.playlistVideos.length > 0 && (
        <div className="mt-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full text-left text-sm font-medium text-purple-600 hover:text-purple-800 transition-colors duration-200"
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
                  className="p-1 rounded-md bg-gray-100 hover:bg-gray-200 transition-colors duration-200 flex items-center justify-between"
                >
                  <p className="text-xs text-gray-800 truncate">
                    {video.title}
                  </p>
                  <a
                    href={video.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 text-xs hover:underline ml-2"
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

