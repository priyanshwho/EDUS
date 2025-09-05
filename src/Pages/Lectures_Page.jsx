import { useState } from "react";
import LectureFilters from "../components/Ui_Lectures/LectureFilters";
import LectureCard from "../components/Ui_Lectures/LectureCard";
import { sampleLectures } from "../database/Lecture";


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

      <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6 mt-6">
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
