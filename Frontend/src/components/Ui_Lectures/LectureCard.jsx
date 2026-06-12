import { useState } from "react";

function LectureCard({ lecture }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="edus-card"
      style={{
        border: `1px solid ${hovered ? 'rgba(56,189,248,0.28)' : '#252134'}`,
        boxShadow: hovered ? '0 0 0 1px rgba(56,189,248,0.08), 0 8px 32px rgba(0,0,0,0.3)' : 'none',
        overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '10px',
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Top accent */}
      <div style={{
        height: '2px', margin: '-16px -20px 0',
        background: 'linear-gradient(90deg, #38bdf8, #a78bfa)',
        opacity: hovered ? 1 : 0, transition: 'opacity 0.2s',
        borderRadius: '16px 16px 0 0',
      }}/>

      {/* Type badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className={lecture.type === 'Video' ? 'edus-badge-blue' : 'edus-badge-muted'}>
          {lecture.type === 'Video' ? '▶ Video' : '📄 ' + lecture.type}
        </span>
        {lecture.playlistVideos?.length > 0 && (
          <span className="edus-badge-violet">{lecture.playlistVideos.length} in playlist</span>
        )}
      </div>

      {/* Title */}
      <h2 style={{ color: '#fff', fontSize: '14px', fontWeight: 600, margin: 0, lineHeight: 1.4 }}>
        {lecture.title}
      </h2>

      {/* Meta */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        <span className="edus-badge-muted">{lecture.subject}</span>
        <span className="edus-badge-muted">Sem {lecture.semester}</span>
        <span className="edus-badge-muted">{lecture.branch}</span>
      </div>

      {/* Video embed */}
      {lecture.type === "Video" && lecture.link && (
        <div style={{ borderRadius: '10px', overflow: 'hidden', border: '1px solid #252134' }}>
          <iframe
            style={{ width: '100%', height: '150px', display: 'block' }}
            src={lecture.link}
            title={lecture.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}

      {!lecture.link && lecture.type !== "Video" && (
        <p style={{ color: '#3F3A52', fontSize: '13px', margin: 0 }}>Resource link coming soon</p>
      )}

      {/* Playlist */}
      {lecture.playlistVideos?.length > 0 && (
        <div>
          <button
            onClick={() => setIsExpanded(v => !v)}
            style={{
              width: '100%', background: 'none', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              color: isExpanded ? '#38bdf8' : '#757185', fontSize: '13px', fontWeight: 500,
              padding: '6px 0', transition: 'color 0.15s',
            }}
          >
            <span>{isExpanded ? 'Hide playlist' : `Show playlist (${lecture.playlistVideos.length})`}</span>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24"
              style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
              <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>

          {isExpanded && (
            <div style={{ marginTop: '6px', maxHeight: '140px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {lecture.playlistVideos.map((video, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '6px 10px', borderRadius: '8px',
                    background: 'rgba(56,189,248,0.04)', border: '1px solid rgba(56,189,248,0.08)',
                  }}
                >
                  <p style={{ color: '#ADA8C3', fontSize: '12px', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                    {index + 1}. {video.title}
                  </p>
                  <a
                    href={video.link} target="_blank" rel="noopener noreferrer"
                    style={{ color: '#38bdf8', fontSize: '12px', textDecoration: 'none', marginLeft: '8px', flexShrink: 0, fontWeight: 500 }}
                  >
                    Watch →
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
