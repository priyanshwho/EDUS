import { useState } from "react";
import LectureFilters from "../components/Ui_Lectures/LectureFilters";
import LectureCard from "../components/Ui_Lectures/LectureCard.jsx";

import { sampleLectures } from "../database/Lecture";

export default function LecturesPage() {
  const [filters, setFilters] = useState({
    search: "",
    semester: "All",
    subject: "All",
    branch: "All",
  });

  const [numCardsToShow, setNumCardsToShow] = useState(8);
  const cardsPerPage = 8;

  // Filter lectures based on filters
  const filteredLectures = sampleLectures.filter((lecture) => {
    return (
      (filters.semester === "All" ||
        lecture.semester === Number(filters.semester)) &&
      (filters.subject === "All" || lecture.subject === filters.subject) &&
      (filters.branch === "All" || lecture.branch === filters.branch) &&
      (filters.search === "" ||
        lecture.title.toLowerCase().includes(filters.search.toLowerCase()))
    );
  });

  const handleShowMore = () => {
    setNumCardsToShow((prev) => prev + cardsPerPage);
  };

  return (
    <div className="p-6 bg-[#1E2939] min-h-screen text-white">
      <h1 className="text-4xl md:text-5xl font-bold mb-8 ml-5">🎥 Lectures</h1>

      <LectureFilters filters={filters} setFilters={setFilters} />

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
        {filteredLectures.length > 0 ? (
          filteredLectures.slice(0, numCardsToShow).map((lecture) => (
            <LectureCard key={lecture.id} lecture={lecture} />
          ))
        ) : (
          <p className="text-center text-gray-500 col-span-full">
            No lectures found
          </p>
        )}
      </div>

      {numCardsToShow < filteredLectures.length && (
        <div className="flex justify-center mt-8">
          <button
            onClick={handleShowMore}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-full transition-colors duration-300 transform hover:scale-105 shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
          >
            Show More Lectures
          </button>
        </div>
      )}
    </div>
  );
}
