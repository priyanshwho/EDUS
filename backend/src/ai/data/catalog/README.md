# UIET shared syllabus catalog

The two user-supplied UIET, Panjab University **2023–2027** PDFs are the source of
this versioned catalog. These are shared academic syllabi, separate from account
private RAG workspaces and their six-subject quota. Existing database uploads keep
precedence; catalog reads do not insert, overwrite, or delete professor uploads.
For CSE and IT, the catalog replaces the incomplete legacy filesystem listings.

| Semester | CSE | IT |
| --- | ---: | ---: |
| 1 | 14 | 14 |
| 2 | 11 | 11 |
| 3 | 9 | 8 |
| 4 | 8 | 11 |
| 5 | 9 | 19 |
| 6 | 18 | 15 |
| 7 | 27 | 15 |
| 8 | 26 | 10 |
| Total | 122 | 103 |

Counts include named physics/elective alternatives, practicals, projects, seminars,
and training. Elective alternatives are choices, not a requirement to take every
listed course. The original PDFs are published unchanged under
`Frontend/public/syllabi/uiet-2023-27/`; their SHA-256 hashes and page counts are
recorded in the JSON. Every entry carries its source page range and extracted
course sheet. No LLM, Groq call, or paid service was used to import these documents.

## Extraction and source exceptions

- CSE Economics has a blank course-sheet semester; the scheme places it in semester 5.
- CSE Digital Image Processing practical has a blank semester; its scheme is semester 6.
- CSE CS 853C says semester 7 on page 228; the semester-8 elective scheme on page 24
  controls the assignment.
- IT Professional Communication practical on page 35 omits the practical label;
  its HSMC X51 code, LTP and semester-1 scheme identify it as the practical course.
- IT Python practical, Mobile Application Development, and Industrial Training
  after semester 4 have inconsistent sheet codes; their scheme codes are retained
  as PEIT 551c, PEIT 501d, and PWIT 551. The original sheet text is preserved.
- IT page 122 contains two course sheets, page 132 starts another practical midway,
  and page 171 starts Human Computer Interaction below the previous bibliography.
  Extraction splits these at their own metadata headers.
- IT Machine Learning practical's PDF drawing order places the experiment list
  before its metadata; it is preserved, including all nine experiments.
- CSE Building Enterprise Applications practical has an empty syllabus box; only
  its published course outcomes are shown, with that limitation in the chapter title.
- IT Professional Communication theory appears in the scheme without a separate
  detailed theory sheet. Open Elective-I is an external course choice. The two
  branches' first-year Product Re-engineering and Innovation training is described
  by the scheme. These four entries are explicitly marked `schemeOnly`.

Actual A/B markers are retained. Practicals and courses without an A/B split use
Course Content; no artificial second half is generated. Missing topic hours are
zero in the data and displayed as “Hours not specified”. Full raw text and original
PDFs remain available for verification of formulas, tables, or extraction artifacts.

## Rebuilding

Use the worker's Python environment, which already contains pypdfium2:

```sh
python backend/scripts/import-uiet-syllabi.py /path/to/cse-syllabus-1-8sem.pdf /path/to/it-syllabus-1-8sem.pdf
node --test backend/test/shared-syllabus-catalog.test.js
```

The extractor is tailored to these exact documents, including reviewed source
exceptions. Review a new batch separately instead of reusing its page overrides.
