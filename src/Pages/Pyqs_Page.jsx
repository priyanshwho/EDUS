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

// Filter only PYQs type resources
const pyqsData = geminiData.filter(item => item.type === "pyqs").map(item => ({
  id: item.id,
  title: item.title,
  subjectCode: item.subjectCode || "N/A",
  branch: item.branch,
  semester: item.semester,
  year: item.year === "N/A" ? "N/A" : item.year,
  subject: item.subject,
  examType: "-- Semester",
  duration: "-- hours",
  marks: "--",
  downloadUrl: item.url,
  uploadDate: "2023-12-15",
}))

const Pyqs_Page = () => {
  const [filters, setFilters] = useState({
    branch: "all",
    semester: "all",
    subjectCode: "",
    year: "all",
  })
  const [sortBy, setSortBy] = useState("newest")
  const [searchTerm, setSearchTerm] = useState("")

  // Get unique values for filter options
  const branches = [...new Set(pyqsData.map((pyq) => pyq.branch))]
  const semesters = [...new Set(pyqsData.map((pyq) => pyq.semester))].sort((a, b) => a - b)
  const years = [...new Set(pyqsData.map((pyq) => pyq.year))].sort((a, b) => b - a)

  // Filter and sort logic
  const filteredAndSortedPYQs = useMemo(() => {
    const filtered = pyqsData.filter((pyq) => {
      const matchesBranch = filters.branch === "all" || pyq.branch === filters.branch
      const matchesSemester = filters.semester === "all" || pyq.semester.toString() === filters.semester
      const matchesSubjectCode =
        !filters.subjectCode || pyq.subjectCode.toLowerCase().includes(filters.subjectCode.toLowerCase())
      const matchesYear = filters.year === "all" || pyq.year.toString() === filters.year
      const matchesSearch =
        !searchTerm ||
        pyq.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pyq.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pyq.subjectCode.toLowerCase().includes(searchTerm.toLowerCase())

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
          return b.year - a.year
        case "year-asc":
          return a.year - b.year
        case "semester-asc":
          return a.semester - b.semester
        case "semester-desc":
          return b.semester - a.semester
        case "subject":
          return a.subject.localeCompare(b.subject)
        default:
          return 0
      }
    })

    return filtered
  }, [filters, sortBy, searchTerm])

  const clearFilters = () => {
    setFilters({
      branch: "all",
      semester: "all",
      subjectCode: "",
      year: "all",
    })
    setSearchTerm("")
  }

  const sortOptions = [
    { value: "newest", label: "Newest First" },
    { value: "oldest", label: "Oldest First" },
    { value: "year-desc", label: "Year (High to Low)" },
    { value: "year-asc", label: "Year (Low to High)" },
    { value: "semester-asc", label: "Semester (Low to High)" },
    { value: "semester-desc", label: "Semester (High to Low)" },
    { value: "subject", label: "Subject Code" },
  ]

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-n-8 via-n-7 to-n-8 overflow-hidden">
      {/* Enhanced Themed background */}
      <div className="absolute inset-0 -z-10 pointer-events-none opacity-60">
        <Rings />
        <SideLines />
        <BackgroundCircles />
        {/* Additional gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 via-transparent to-purple-500/10" />
      </div>

      {/* Premium Header with enhanced design */}
      <div className="relative bg-gradient-to-r from-n-8/95 via-n-7/95 to-n-8/95 backdrop-blur-xl border-b border-sky-400/20 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-sky-400/5 via-purple-400/5 to-sky-400/5" />
        <div className="container relative mx-auto px-5 py-16">
          <div className="flex items-center gap-6 mb-8">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-sky-400 to-purple-500 rounded-2xl blur-lg opacity-75 group-hover:opacity-100 transition-opacity" />
              <div className="relative p-4 bg-gradient-to-r from-sky-400 to-purple-500 rounded-2xl shadow-xl">
                <FileTextIcon className="h-10 w-10 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-white via-sky-200 to-purple-200 bg-clip-text text-transparent mb-2 tracking-tight">
                Previous Year Questions
              </h1>
              <div className="h-1 w-32 bg-gradient-to-r from-sky-400 to-purple-500 rounded-full" />
            </div>
          </div>
          <p className="text-lg text-n-2 max-w-3xl leading-relaxed">
            Access and download previous year question papers to enhance your exam preparation with our comprehensive collection.
            <span className="block mt-2 text-sky-300 font-medium">✨ Premium academic resources at your fingertips</span>
          </p>
        </div>
      </div>

      <div className="container mx-auto px-5 py-8">
        {/* Mobile: single column (filters on top). Desktop: 2 columns with fixed sidebar. */}
        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 lg:gap-12">
          {/* Enhanced Filters Sidebar */}
          <div className="space-y-8 w-full">
            <div className="relative group">
              {/* Glowing border effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-sky-400/20 via-purple-400/20 to-sky-400/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <Card className="relative p-8 bg-gradient-to-br from-n-7/90 via-n-6/80 to-n-7/90 border border-sky-400/30 rounded-3xl shadow-2xl backdrop-blur-xl">
                <div className="flex items-center gap-4 mb-8">
                  <div className="p-2 bg-gradient-to-r from-sky-400/20 to-purple-400/20 rounded-xl">
                    <FilterIcon className="h-6 w-6 text-sky-300" />
                  </div>
                  <h3 className="text-xl font-bold bg-gradient-to-r from-white to-sky-200 bg-clip-text text-transparent">Smart Filters</h3>
                </div>

                <div className="space-y-8">
                  {/* Enhanced Search */}
                  <div className="space-y-4">
                    <label className="text-sm font-bold text-sky-200 uppercase tracking-widest flex items-center gap-2">
                      <span className="w-2 h-2 bg-sky-400 rounded-full" />
                      Search
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-r from-sky-400/20 to-purple-400/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity" />
                      <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-sky-300 z-10" />
                      <Input
                        placeholder="Search by title or subject code..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="relative pl-12 bg-n-8/80 border-sky-400/30 text-white placeholder-n-4 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/30 rounded-xl"
                      />
                    </div>
                  </div>

                  {/* Enhanced Branch Filter */}
                  <div className="space-y-4">
                    <label className="text-sm font-bold text-sky-200 uppercase tracking-widest flex items-center gap-2">
                      <span className="w-2 h-2 bg-purple-400 rounded-full" />
                      Branch
                    </label>
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

                  {/* Enhanced Semester Filter */}
                  <div className="space-y-4">
                    <label className="text-sm font-bold text-sky-200 uppercase tracking-widest flex items-center gap-2">
                      <span className="w-2 h-2 bg-sky-400 rounded-full" />
                      Semester
                    </label>
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

                  {/* Enhanced Subject Code Filter */}
                  <div className="space-y-4">
                    <label className="text-sm font-bold text-sky-200 uppercase tracking-widest flex items-center gap-2">
                      <span className="w-2 h-2 bg-purple-400 rounded-full" />
                      Subject Code
                    </label>
                    <Input
                      placeholder="e.g., CS201, EC101"
                      value={filters.subjectCode}
                      onChange={(e) => setFilters({ ...filters, subjectCode: e.target.value })}
                      className="bg-n-8/80 border-purple-400/30 text-white placeholder-n-4 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/30 rounded-xl"
                    />
                  </div>

                  {/* Enhanced Year Filter */}
                  <div className="space-y-4">
                    <label className="text-sm font-bold text-sky-200 uppercase tracking-widest flex items-center gap-2">
                      <span className="w-2 h-2 bg-sky-400 rounded-full" />
                      Year
                    </label>
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

                  <Button 
                    onClick={clearFilters} 
                    variant="outline" 
                    className="w-full bg-gradient-to-r from-red-500/20 to-orange-500/20 border-red-400/30 text-red-200 hover:from-red-500/30 hover:to-orange-500/30 hover:border-red-400/50 transition-all duration-300 font-semibold py-3 rounded-xl"
                  >
                    Clear All Filters
                  </Button>
                </div>
              </Card>
            </div>
          </div>

          {/* Main Content */}
          <div className="space-y-8">
            {/* Sort and Results Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div>
                <h2 className="h3 text-n-1 mb-2 font-bold drop-shadow">{filteredAndSortedPYQs.length} Question Papers Found</h2>
                <p className="body-2 text-n-3">Showing results based on your selected filters</p>
              </div>

              {/* Responsive themed Sort dropdown - full width on mobile, compact on desktop */}
              <div className="w-full lg:w-auto">
                <DropdownMenu
                  trigger={
                    <Button
                      variant="outline"
                      className="w-full lg:w-auto flex items-center justify-center px-4 py-2 bg-n-7/30 border border-sky-400/30 text-sky-200 rounded-lg hover:shadow-md transition-all duration-200"
                    >
                      <ArrowUpDownIcon className="w-5 h-5 mr-2 text-sky-200" />
                      {(() => {
                        const sel = sortOptions.find((o) => o.value === sortBy)
                        return sel ? sel.label : "Sort by"
                      })()}
                    </Button>
                  }
                  options={sortOptions}
                  value={sortBy}
                  onChange={setSortBy}
                />
              </div>
            </div>

            {/* PYQs Grid */}
            {filteredAndSortedPYQs.length === 0 ? (
              <Card className="p-12 bg-n-7/80 border border-n-3/30 rounded-2xl shadow-lg backdrop-blur">
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="p-4 bg-n-2 rounded-2xl mb-6">
                    <FileTextIcon className="h-12 w-12 text-n-4" />
                  </div>
                  <h3 className="h5 text-n-1 mb-3">No Question Papers Found</h3>
                  <p className="body-2 text-n-3 max-w-md">
                    Try adjusting your filters or search terms to find more results.
                  </p>
                </div>
              </Card>
            ) : (
              <div className="space-y-6">
                {filteredAndSortedPYQs.map((pyq) => (
                  <Card
                    key={pyq.id}
                    className="p-6 bg-n-7/80 border border-n-3/30 rounded-2xl shadow-lg hover:border-color-1 transition-all duration-300 hover:shadow-xl backdrop-blur"
                  >
                    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                      <div className="flex-1">
                        <div className="flex items-start gap-4 mb-4">
                          <div className="p-3 bg-gradient-to-r from-color-1 to-color-5 rounded-xl shadow">
                            <BookOpenIcon className="h-6 w-6 text-n-1" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="h6 text-n-1 mb-2 font-bold drop-shadow break-words whitespace-normal">{pyq.title}</h3>
                            <div className="flex items-center gap-3 text-sm text-n-3 mb-3 min-w-0">
                              <div className="flex items-center gap-1 min-w-0">
                                <CodeIcon className="h-4 w-4 flex-shrink-0" />
                                <span className="font-semibold truncate max-w-[9rem]">{pyq.subjectCode}</span>
                              </div>
                              <span className="w-1 h-1 bg-n-4 rounded-full flex-shrink-0" />
                              <div className="flex items-center gap-1 min-w-0">
                                <BookOpenIcon className="h-4 w-4 flex-shrink-0" />
                                <span className="truncate max-w-[14rem]">{pyq.subject}</span>
                              </div>
                              <span className="w-1 h-1 bg-n-4 rounded-full flex-shrink-0" />
                              <div className="flex items-center gap-1 min-w-0">
                                <CalendarIcon className="h-4 w-4 flex-shrink-0" />
                                <span className="truncate max-w-[6rem]">{pyq.year}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        

                        <div className="flex flex-wrap gap-2 mb-4">
                          <Badge variant="primary">{pyq.branch}</Badge>
                          <Badge variant="secondary">Semester {pyq.semester}</Badge>
                          <Badge variant="outline">{pyq.examType}</Badge>
                          <Badge variant="outline">{pyq.duration}</Badge>
                          <Badge variant="outline">{pyq.marks} marks</Badge>
                        </div>

                        {/* <p className="caption text-n-3">
                          Uploaded on{" "}
                          {new Date(pyq.uploadDate).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p> */}
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3">
                        <Button 
                          onClick={() => window.open(pyq.downloadUrl, '_blank')}
                          className="flex items-center gap-2 bg-gradient-to-r from-color-1 to-color-5 text-white font-semibold shadow-md hover:scale-105 transition-transform"
                        >
                          <DownloadIcon className="h-4 w-4" />
                          View PDF(s)
                        </Button>
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
  )
}

export default Pyqs_Page

