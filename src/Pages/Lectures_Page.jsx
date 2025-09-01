import { useState } from "react";
import LectureFilters from "../components/Ui_Lectures/LectureFilters";
import LectureCard from "../components/Ui_Lectures/LectureCard";

const sampleLectures = [
  {
    id: 1,
    title: "Introduction to DBMS",
    subject: "DBMS",
    semester: 4,
    branch: "CSE",
    type: "Video",
    link: "https://www.youtube.com/embed/XGnLaRwh0bY?list=PLQEaRBV9gAFu4ovJ41PywklqI7IyXwr01",
  },
  {
    id: 2,
    title: "Microprocessor Basics",
    subject: "Microprocessor",
    semester: 4,
    branch: "ECE",
    type: "Video",
    link: "https://www.youtube.com/embed/lHLW1L8Qc5w",
  },
  {
    id: 4,
    title: "Operating System Intro",
    subject: "OS",
    semester: 5,
    branch: "CSE",
    type: "Video",
    link: "https://www.youtube.com/embed/lHLW1L8Qc5w",
  },
];

export default function LecturesPage() {
  const [filters, setFilters] = useState({
    search: "",
    semester: "All",
    subject: "All",
    branch: "All",
  });

  const filteredLectures = sampleLectures.filter((lecture) => {
    return (
      (filters.semester === "All" || lecture.semester === Number(filters.semester)) &&
      (filters.subject === "All" || lecture.subject === filters.subject) &&
      (filters.branch === "All" || lecture.branch === filters.branch) &&
      (filters.search === "" ||
        lecture.title.toLowerCase().includes(filters.search.toLowerCase()))
    );
  });

  return (
    <div className="p-6">
      <h1 className="text-4xl md:text-5xl font-bold mb-8 ml-5">🎥 Lectures</h1>

      <LectureFilters filters={filters} setFilters={setFilters} />

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        {filteredLectures.length > 0 ? (
          filteredLectures.map((lecture) => (
            <LectureCard key={lecture.id} lecture={lecture} />
          ))
        ) : (
          <p className="text-center text-gray-500 col-span-full">
            No lectures found
          </p>
        )}
      </div>
    </div>
  );
}
