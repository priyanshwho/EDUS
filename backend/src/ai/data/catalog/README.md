# Semester-wise syllabus content

Source: the two supplied UIET, Panjab University **2023–2027** CSE/IT PDFs.
This catalog populates the existing Edu.ai subject cards with the main theory
subjects. It excludes separate practical, project, seminar, and training cards.
Physics choices and elective alternatives stay inside their single subject group.
Existing database uploads retain precedence; no professor uploads are overwritten.

| Semester | CSE subjects | IT subjects |
| --- | ---: | ---: |
| 1 | 6 | 6 |
| 2 | 6 | 6 |
| 3 | 6 | 5 |
| 4 | 5 | 5 |
| 5 | 5 | 4 |
| 6 | 5 | 6 |
| 7 | 4 | 4 |
| 8 | 3 | 3 |

These counts follow the teaching schemes, including first-year self-study theory
courses. Semester 8 has three theory/elective subjects in both supplied schemes;
its other rows are projects, practicals, seminars, or industrial training.

Each subject contains extracted A/B topics; source pages and raw text are retained
for review. No AI-generated syllabus or external model is used. This replaces the
incomplete legacy CSE/IT files, whose semester-4 assignments differ from these PDFs.
The scheme places CSE Economics in semester 5 despite a blank course-sheet semester.

IT Professional Communication theory is listed without its own detailed theory sheet.
Open Elective-I specifies an external course choice rather than a fixed syllabus.
Both preserve available scheme information without inventing content. Each named
elective option's syllabus appears inside that semester's elective subject.

Rebuild with the worker Python environment (pypdfium2 installed):

```sh
python backend/scripts/import-uiet-syllabi.py /path/to/cse-syllabus-1-8sem.pdf /path/to/it-syllabus-1-8sem.pdf
node --test backend/test/shared-syllabus-catalog.test.js
```

Source filenames, hashes, page ranges, and batch are recorded in the JSON. The
importer is tailored to these documents; review a new batch separately.
