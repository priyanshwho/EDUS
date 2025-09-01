"use client"

import { useState, useMemo } from "react"
import { Rings, SideLines, BackgroundCircles } from "../components/design/Header"
import Card from "../components/Ui_Pyqs/Card"
import Button from "../components/Ui_Pyqs/Button"
import Badge from "../components/Ui_Pyqs/Badge"
import Select from "../components/Ui_Pyqs/Select"
import Input from "../components/Ui_Pyqs/Input"
import DropdownMenu from "../components/Ui_Pyqs//DropdownMenu"
import {
  DownloadIcon,
  SearchIcon,
  FilterIcon,
  ArrowUpDownIcon,
  FileTextIcon,
  CalendarIcon,
  BookOpenIcon,
  CodeIcon,
} from "../components/Ui_Pyqs/Icons"

// Import data from Gemini.json
import geminiData from "../constants/Gemini.json"

// Filter only Notes type resources
const notesData = geminiData
  .filter((item) => item.type === "notes")
  .map((item) => ({
    id: item.id,
    title: item.title,
    subjectCode: item.subjectCode || "N/A",
    branch: item.branch || "N/A",
    semester: item.semester || "N/A",
    year: item.year === "N/A" || !item.year ? "N/A" : item.year,
    subject: item.subject || "N/A",
    examType: item.type || "notes",
    duration: item.duration || "N/A",
    marks: item.marks || "N/A",
    downloadUrl: item.url,
    uploadDate: item.uploadDate || "2023-12-15",
  }))

const Notes_Page = () => {
  const [filters, setFilters] = useState({
    branch: "all",
    semester: "all",
    subjectCode: "",
    year: "all",
  })
  const [sortBy, setSortBy] = useState("newest")
  const [searchTerm, setSearchTerm] = useState("")

  // Get unique values for filter options
  const branches = [...new Set(notesData.map((note) => note.branch))].filter(Boolean)
  const semesters = [...new Set(notesData.map((note) => note.semester))]
    .filter((s) => s !== "N/A")
    .sort((a, b) => a - b)
  const years = [...new Set(notesData.map((note) => note.year))]
    .filter((y) => y !== "N/A")
    .sort((a, b) => b - a)

  // Filter and sort logic
  const filteredAndSortedNotes = useMemo(() => {
    const filtered = notesData.filter((note) => {
      const matchesBranch = filters.branch === "all" || note.branch === filters.branch
      const matchesSemester = filters.semester === "all" || note.semester.toString() === filters.semester
      const matchesSubjectCode = !filters.subjectCode || note.subjectCode.toLowerCase().includes(filters.subjectCode.toLowerCase())
      const matchesYear = filters.year === "all" || note.year.toString() === filters.year
      const matchesSearch =
        !searchTerm ||
        note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.subjectCode.toLowerCase().includes(searchTerm.toLowerCase())

      return matchesBranch && matchesSemester && matchesSubjectCode && matchesYear && matchesSearch
    })

    // Sort the filtered results
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
        case "oldest":
          return new Date(a.uploadDate).getTime() - new Date(b.uploadDate).getTime()
        case "year-desc":
          return Number(b.year) - Number(a.year)
        case "year-asc":
          return Number(a.year) - Number(b.year)
        case "semester-asc":
          return Number(a.semester) - Number(b.semester)
        case "semester-desc":
          return Number(b.semester) - Number(a.semester)
        case "subject":
          return a.subject.localeCompare(b.subject)
        default:
          return 0
      }
    })

    return filtered
  }, [filters, sortBy, searchTerm])

  const clearFilters = () => {
    setFilters({ branch: "all", semester: "all", subjectCode: "", year: "all" })
    setSearchTerm("")
    setSortBy("newest")
  }

  const sortOptions = [
    { value: "newest", label: "Newest First" },
    { value: "oldest", label: "Oldest First" },
    { value: "year-desc", label: "Year (High to Low)" },
    { value: "year-asc", label: "Year (Low to High)" },
    { value: "semester-asc", label: "Semester (Low to High)" },
    { value: "semester-desc", label: "Semester (High to Low)" },
    { value: "subject", label: "Subject" },
  ]

  return (
    <div className="relative min-h-screen bg-n-8 overflow-hidden">
      <div className="relative z-1">
        <SideLines />
        <div className="container mx-auto px-4 py-8 lg:py-16">
          {/* Header Section */}
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
                  <FileTextIcon className="h-6 w-6 text-white" />
                </div>
                <h1 className="h2 text-n-1 font-bold">Study Notes & Materials</h1>
              </div>
              <p className="body-1 text-n-3 max-w-2xl mx-auto">
                Access comprehensive study notes and materials to enhance your learning experience
              </p>
            </div>

            <div className="grid lg:grid-cols-[380px_1fr] gap-12">
              {/* Sidebar (same design as PYQs) */}
              <div className="space-y-8">
                <div className="relative group">
                  <Card className="relative p-8 bg-gradient-to-br from-n-7/90 via-n-6/80 to-n-7/90 border border-sky-400/30 rounded-3xl shadow-2xl backdrop-blur-xl">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="p-2 bg-gradient-to-r from-sky-400/20 to-purple-400/20 rounded-xl">
                        <FilterIcon className="h-6 w-6 text-sky-300" />
                      </div>
                      <h3 className="text-xl font-bold bg-gradient-to-r from-white to-sky-200 bg-clip-text text-transparent">Smart Filters</h3>
                    </div>

                    <div className="space-y-8">
                      <div className="space-y-4">
                        <label className="text-sm font-bold text-sky-200 uppercase tracking-widest">Search</label>
                        <div className="relative">
                          <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-sky-300 z-10" />
                          <Input
                            placeholder="Search by title or subject code..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="relative pl-12 bg-n-8/80 border-sky-400/30 text-white placeholder-n-4 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/30 rounded-xl"
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <label className="text-sm font-bold text-sky-200 uppercase tracking-widest">Branch</label>
                        <Select
                          value={filters.branch}
                          onChange={(value) => setFilters({ ...filters, branch: value })}
                          options={[
                            { value: "all", label: "All Branches" },
                            ...branches.map((branch) => ({ value: branch, label: branch })),
                          ]}
                          className="bg-n-8/80 border-purple-400/30 text-white"
                        />
                      </div>

                      <div className="space-y-4">
                        <label className="text-sm font-bold text-sky-200 uppercase tracking-widest">Semester</label>
                        <Select
                          value={filters.semester}
                          onChange={(value) => setFilters({ ...filters, semester: value })}
                          options={[
                            { value: "all", label: "All Semesters" },
                            ...semesters.map((semester) => ({ value: semester.toString(), label: `Semester ${semester}` })),
                          ]}
                          className="bg-n-8/80 border-sky-400/30 text-white"
                        />
                      </div>

                      <div className="space-y-4">
                        <label className="text-sm font-bold text-sky-200 uppercase tracking-widest">Subject Code</label>
                        <Input
                          placeholder="e.g., CS201, EC101"
                          value={filters.subjectCode}
                          onChange={(e) => setFilters({ ...filters, subjectCode: e.target.value })}
                          className="bg-n-8/80 border-purple-400/30 text-white placeholder-n-4 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/30 rounded-xl"
                        />
                      </div>

                      <div className="space-y-4">
                        <label className="text-sm font-bold text-sky-200 uppercase tracking-widest">Year</label>
                        <Select
                          value={filters.year}
                          onChange={(value) => setFilters({ ...filters, year: value })}
                          options={[
                            { value: "all", label: "All Years" },
                            ...years.map((year) => ({ value: year.toString(), label: year.toString() })),
                          ]}
                          className="bg-n-8/80 border-sky-400/30 text-white"
                        />
                      </div>

                      <Button onClick={clearFilters} variant="outline" className="w-full bg-gradient-to-r from-red-500/20 to-orange-500/20 border-red-400/30 text-red-200 font-semibold py-3 rounded-xl">
                        Clear All Filters
                      </Button>
                    </div>
                  </Card>
                </div>
              </div>

              {/* Results Column */}
              <div className="space-y-8">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                  <div>
                    <h2 className="h3 text-n-1 mb-2 font-bold drop-shadow">{filteredAndSortedNotes.length} Notes Found</h2>
                    <p className="body-2 text-n-3">Showing results based on your selected filters</p>
                  </div>

                  <DropdownMenu
                    trigger={
                      <Button variant="outline" className="hover:text-black text-yellow-50 shrink-0">
                        <ArrowUpDownIcon className="w-5 h-5 mr-2" />
                        Sort by
                      </Button>
                    }
                    options={sortOptions}
                    value={sortBy}
                    onChange={setSortBy}
                  />
                </div>

                {/* Notes Grid */}
                {filteredAndSortedNotes.length === 0 ? (
                  <Card className="p-12 bg-n-7/80 border border-n-3/30 rounded-2xl shadow-lg backdrop-blur">
                    <div className="flex flex-col items-center justify-center text-center">
                      <div className="p-4 bg-n-2 rounded-2xl mb-6">
                        <FileTextIcon className="h-12 w-12 text-n-4" />
                      </div>
                      <h3 className="h5 text-n-1 mb-3">No Notes Found</h3>
                      <p className="body-2 text-n-3 max-w-md">Try adjusting your filters or search terms to find more results.</p>
                    </div>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {filteredAndSortedNotes.map((note) => (
                      <Card key={note.id} className="p-3 bg-n-7/80 border border-n-3/30 rounded-2xl shadow-lg hover:border-color-1 transition-all duration-300 hover:shadow-xl backdrop-blur">
                        <div className="flex flex-col justify-between max-h-[150px] gap-3">
                          <div className="relative">
                            <h3 className="h6 text-n-1 mb-2 font-bold break-words">{note.title}</h3>

                            <div className="flex items-start gap-4 text-sm text-n-3 mb-2">
                              <div className="flex items-center gap-1">
                                <CodeIcon className="h-4 w-4" />
                                <span className="font-semibold">{note.subjectCode}</span>
                              </div>

                              <div className="flex items-center gap-1">
                                <BookOpenIcon className="h-4 w-4" />
                                <span>{note.subject}</span>
                              </div>

                              <div className="flex items-center gap-1 ml-4 text-n-3">
                                <CalendarIcon className="h-4 w-4" />
                                <span>{note.year}</span>
                              </div>

                              {/* Top-right button */}
                              <div className="ml-auto self-start">
                                <Button onClick={() => window.open(note.downloadUrl, "_blank")} className="flex items-center gap-2 bg-gradient-to-r from-color-1 to-color-5 text-white font-semibold shadow-md hover:scale-105 transition-transform">
                                  <DownloadIcon className="h-4 w-4" />
                                  Open Notes
                                </Button>
                              </div>
                            </div>

                            {/* Semester/Branch row (no button) */}
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="secondary">Semester {note.semester}</Badge>
                              <Badge variant="outline">{note.branch}</Badge>
                            </div>

                            <p className="caption text-n-3 mb-2 line-clamp-4">{note.description || ""}</p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Rings />
      <BackgroundCircles />
    </div>
  )
}

export default Notes_Page