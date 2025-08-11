"use client"

import { useState, useMemo } from "react"
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

// Sample PYQs data structure
const pyqsData = [
  {
    id: 1,
    title: "Data Structures and Algorithms",
    subjectCode: "CS201",
    branch: "CSE",
    semester: 3,
    year: 2023,
    examType: "End Semester",
    duration: "3 hours",
    marks: 50,
    downloadUrl: "/pyqs/cs201-2023.pdf",
    uploadDate: "2023-12-15",
  },
  {
    id: 2,
    title: "Digital Electronics",
    subjectCode: "EC101",
    branch: "ECE",
    semester: 2,
    year: 2023,
    examType: "Mid Semester",
    duration: "2 hours",
    marks: 50,
    downloadUrl: "/pyqs/ec101-2023.pdf",
    uploadDate: "2023-11-20",
  },
  {
    id: 3,
    title: "Engineering Mathematics III",
    subjectCode: "MA301",
    branch: "CSE",
    semester: 5,
    year: 2022,
    examType: "End Semester",
    duration: "3 hours",
    marks: 50,
    downloadUrl: "/pyqs/ma301-2022.pdf",
    uploadDate: "2023-01-10",
  },
  {
    id: 4,
    title: "Computer Networks",
    subjectCode: "CS401",
    branch: "CSE",
    semester: 7,
    year: 2023,
    examType: "End Semester",
    duration: "3 hours",
    marks: 50,
    downloadUrl: "/pyqs/cs401-2023.pdf",
    uploadDate: "2023-12-20",
  },
  {
    id: 5,
    title: "Microprocessors",
    subjectCode: "EC201",
    branch: "ECE",
    semester: 4,
    year: 2022,
    examType: "End Semester",
    duration: "3 hours",
    marks: 50,
    downloadUrl: "/pyqs/ec201-2022.pdf",
    uploadDate: "2023-02-15",
  },
  {
    id: 6,
    title: "Database Management Systems",
    subjectCode: "CS301",
    branch: "CSE",
    semester: 5,
    year: 2023,
    examType: "End Semester",
    duration: "3 hours",
    marks: 50,
    downloadUrl: "/pyqs/cs301-2023.pdf",
    uploadDate: "2023-12-18",
  },
  {
    id: 7,
    title: "Signal Processing",
    subjectCode: "EC301",
    branch: "ECE",
    semester: 6,
    year: 2022,
    examType: "End Semester",
    duration: "3 hours",
    marks: 50,
    downloadUrl: "/pyqs/ec301-2022.pdf",
    uploadDate: "2023-03-10",
  },
  {
    id: 8,
    title: "Operating Systems",
    subjectCode: "CS202",
    branch: "CSE",
    semester: 4,
    year: 2023,
    examType: "End Semester",
    duration: "3 hours",
    marks: 50,
    downloadUrl: "/pyqs/cs202-2023.pdf",
    uploadDate: "2023-12-22",
  },
]

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
          return a.subjectCode.localeCompare(b.subjectCode)
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
    <div className="min-h-screen bg-n-1">
      {/* Header */}
      <div className="bg-n-1 border-b border-n-3">
        <div className="container mx-auto px-5 py-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-gradient-to-r from-color-1 to-color-5 rounded-xl">
              <FileTextIcon className="h-8 w-8 text-n-1" />
            </div>
             <h1 className="h1 text-n-8 text-5xl">Previous Year Questions</h1>
          </div>
          <p className="body-1 text-n-4 max-w-2xl">
            Access and download previous year question papers to enhance your exam preparation with our comprehensive
            collection
          </p>
        </div>
      </div>

      <div className="container mx-auto px-5 py-10">
        <div className="grid lg:grid-cols-[320px_1fr] gap-10">
          {/* Filters Sidebar */}
          <div className="space-y-8">
            <Card className="p-6 bg-n-1 border border-n-3 rounded-2xl">
              <div className="flex items-center gap-3 mb-6">
                <FilterIcon className="h-6 w-6 text-color-1" />
                <h3 className="h6 text-n-8">Filters</h3>
              </div>

              <div className="space-y-6">
                {/* Search */}
                <div className="space-y-3">
                  <label className="caption font-semibold text-n-6 uppercase tracking-wider">Search</label>
                  <div className="relative">
                    <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-n-4" />
                    <Input
                      placeholder="Search by title or subject code..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-12"
                    />
                  </div>
                </div>

                {/* Branch Filter */}
                <div className="space-y-3">
                  <label className="caption font-semibold text-n-6 uppercase tracking-wider">Branch</label>
                  <Select
                    value={filters.branch}
                    onChange={(value) => setFilters({ ...filters, branch: value })}
                    options={[
                      { value: "all", label: "All Branches" },
                      ...branches.map((branch) => ({ value: branch, label: branch })),
                    ]}
                  />
                </div>

                {/* Semester Filter */}
                <div className="space-y-3">
                  <label className="caption font-semibold text-n-6 uppercase tracking-wider">Semester</label>
                  <Select
                    value={filters.semester}
                    onChange={(value) => setFilters({ ...filters, semester: value })}
                    options={[
                      { value: "all", label: "All Semesters" },
                      ...semesters.map((semester) => ({ value: semester.toString(), label: `Semester ${semester}` })),
                    ]}
                  />
                </div>

                {/* Subject Code Filter */}
                <div className="space-y-3">
                  <label className="caption font-semibold text-n-6 uppercase tracking-wider">Subject Code</label>
                  <Input
                    placeholder="e.g., CS201, EC101"
                    value={filters.subjectCode}
                    onChange={(e) => setFilters({ ...filters, subjectCode: e.target.value })}
                  />
                </div>

                {/* Year Filter */}
                <div className="space-y-3">
                  <label className="caption font-semibold text-n-6 uppercase tracking-wider">Year</label>
                  <Select
                    value={filters.year}
                    onChange={(value) => setFilters({ ...filters, year: value })}
                    options={[
                      { value: "all", label: "All Years" },
                      ...years.map((year) => ({ value: year.toString(), label: year.toString() })),
                    ]}
                  />
                </div>

                <Button onClick={clearFilters} variant="outline" className="w-full">
                  Clear All Filters
                </Button>
              </div>
            </Card>
          </div>

          {/* Main Content */}
          <div className="space-y-8">
            {/* Sort and Results Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div>
                <h2 className="h3 text-n-8 mb-2">{filteredAndSortedPYQs.length} Question Papers Found</h2>
                <p className="body-2 text-n-4">Showing results based on your selected filters</p>
              </div>

              <DropdownMenu
                trigger={
                  <Button variant="outline" className="shrink-0">
                    <ArrowUpDownIcon className="w-5 h-5 mr-2" />
                    Sort by
                  </Button>
                }
                options={sortOptions}
                value={sortBy}
                onChange={setSortBy}
              />
            </div>

            {/* PYQs Grid */}
            {filteredAndSortedPYQs.length === 0 ? (
              <Card className="p-12 bg-n-1 border border-n-3 rounded-2xl">
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="p-4 bg-n-2 rounded-2xl mb-6">
                    <FileTextIcon className="h-12 w-12 text-n-4" />
                  </div>
                  <h3 className="h5 text-n-8 mb-3">No Question Papers Found</h3>
                  <p className="body-2 text-n-4 max-w-md">
                    Try adjusting your filters or search terms to find more results.
                  </p>
                </div>
              </Card>
            ) : (
              <div className="space-y-6">
                {filteredAndSortedPYQs.map((pyq) => (
                  <Card
                    key={pyq.id}
                    className="p-6 bg-n-1 border border-n-3 rounded-2xl hover:border-color-1 transition-all duration-300 hover:shadow-lg"
                  >
                    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                      <div className="flex-1">
                        <div className="flex items-start gap-4 mb-4">
                          <div className="p-3 bg-gradient-to-r from-color-1 to-color-5 rounded-xl">
                            <BookOpenIcon className="h-6 w-6 text-n-1" />
                          </div>
                          <div className="flex-1">
                            <h3 className="h6 text-n-8 mb-2">{pyq.title}</h3>
                            <div className="flex items-center gap-3 text-sm text-n-4 mb-3">
                              <div className="flex items-center gap-1">
                                <CodeIcon className="h-4 w-4" />
                                <span className="font-semibold">{pyq.subjectCode}</span>
                              </div>
                              <span className="w-1 h-1 bg-n-4 rounded-full"></span>
                              <div className="flex items-center gap-1">
                                <CalendarIcon className="h-4 w-4" />
                                <span>{pyq.year}</span>
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

                        <p className="caption text-n-4">
                          Uploaded on{" "}
                          {new Date(pyq.uploadDate).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3">
                        <Button className="flex items-center gap-2">
                          <DownloadIcon className="h-4 w-4" />
                          Download PDF
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
