import { useState } from "react";
import LectureFilters from "../components/Ui_Lectures/LectureFilters";
import LectureCard from "../components/Ui_Lectures/LectureCard.jsx";
import { sampleLectures } from "../database/Lecture";

export default function LecturesPage() {
  const [filters, setFilters] = useState({ search: "", semester: "All", subject: "All", branch: "All" });
  const [numCardsToShow, setNumCardsToShow] = useState(8);
  const cardsPerPage = 8;

  const filteredLectures = sampleLectures.filter((lecture) =>
    (filters.semester === "All" || lecture.semester === Number(filters.semester)) &&
    (filters.subject === "All" || lecture.subject === filters.subject) &&
    (filters.branch === "All" || lecture.branch === filters.branch) &&
    (filters.search === "" || lecture.title.toLowerCase().includes(filters.search.toLowerCase()))
  );

  return (
    <div style={{ minHeight: "100vh", background: "#0E0C15", color: "#fff" }}>
      {/* Ambient glow */}
      <div aria-hidden style={{
        position: "fixed", top: 0, left: "50%", transform: "translateX(-50%)",
        width: "80vw", height: "35vh", pointerEvents: "none", zIndex: 0,
        background: "radial-gradient(ellipse at center, rgba(56,189,248,0.08) 0%, rgba(167,139,250,0.04) 40%, transparent 70%)",
        filter: "blur(40px)",
      }}/>

      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "52px 24px 80px", position: "relative", zIndex: 1 }}>

        {/* Page header */}
        <div style={{ marginBottom: "36px" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            background: "rgba(56,189,248,0.08)", border: "1px solid rgba(56,189,248,0.2)",
            borderRadius: "999px", padding: "4px 14px", marginBottom: "14px",
          }}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
              <path d="M15 10l4.553-2.069A1 1 0 0121 8.882v6.236a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span style={{ fontSize: "12px", fontWeight: 600, color: "#38bdf8", letterSpacing: "0.06em", textTransform: "uppercase" }}>
              Video Lectures
            </span>
          </div>
          <h1 className="edus-page-title" style={{ margin: "0 0 8px" }}>Lectures</h1>
          <p style={{ color: "#757185", fontSize: "15px", margin: 0 }}>
            {filteredLectures.length} lecture{filteredLectures.length !== 1 ? "s" : ""} available
            {filters.search && <span> matching <span style={{ color: "#38bdf8" }}>"{filters.search}"</span></span>}
          </p>
        </div>

        {/* Filters */}
        <LectureFilters filters={filters} setFilters={setFilters} />

        <div className="edus-divider" />

        {/* Cards grid */}
        {filteredLectures.length > 0 ? (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
              {filteredLectures.slice(0, numCardsToShow).map(lecture => (
                <LectureCard key={lecture.id} lecture={lecture} />
              ))}
            </div>

            {numCardsToShow < filteredLectures.length && (
              <div style={{ display: "flex", justifyContent: "center", marginTop: "36px" }}>
                <button
                  onClick={() => setNumCardsToShow(p => p + cardsPerPage)}
                  className="edus-btn"
                  style={{ padding: "12px 32px", fontSize: "14px" }}
                >
                  Show more lectures
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                    <path d="M19 9l-7 7-7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            )}
          </>
        ) : (
          <div style={{ textAlign: "center", padding: "80px 24px" }}>
            <div style={{
              width: 60, height: 60, borderRadius: "50%", margin: "0 auto 16px",
              background: "rgba(56,189,248,0.08)", border: "1px solid rgba(56,189,248,0.15)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="26" height="26" fill="none" viewBox="0 0 24 24">
                <path d="M15 10l4.553-2.069A1 1 0 0121 8.882v6.236a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p style={{ color: "#ADA8C3", fontSize: "15px", fontWeight: 500, margin: "0 0 6px" }}>No lectures found</p>
            <p style={{ color: "#757185", fontSize: "13px", margin: "0 0 20px" }}>Try adjusting your filters.</p>
            <button
              onClick={() => setFilters({ search: "", semester: "All", subject: "All", branch: "All" })}
              className="edus-btn-ghost"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
