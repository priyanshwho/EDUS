const catalog = require('../ai/data/catalog/uiet-2023-27.json');

const key = (value) => String(value).normalize('NFKC').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const branches = () => Object.keys(catalog.sources);
const coursesFor = (branch) => catalog.sources[String(branch).toUpperCase()]?.courses || [];
const hasBranch = (branch) => Object.hasOwn(catalog.sources, String(branch).toUpperCase());
const semestersFor = (branch) => [...new Set(coursesFor(branch).map(course => course.semester))].sort((a, b) => a - b);

function metadata(course) {
  return {
    subjectCode: course.subjectCode,
    kind: course.kind,
    curriculum: catalog.batch,
    institution: catalog.institution,
    sourcePages: course.sourcePages,
    sourceNotes: course.sourceNotes,
    schemeOnly: Boolean(course.schemeOnly),
  };
}

function subjectsFor(branch, semester) {
  return coursesFor(branch).filter(course => course.semester === semester).map(course => ({
    ...metadata(course), name: course.subjectName, subjectName: course.subjectName,
    branch: course.branch, semester: `semester_${course.semester}`,
    id: null, isCustom: false, createdBy: null,
  }));
}

function subjectDetails(branch, semester, name) {
  const course = coursesFor(branch).find(course => course.semester === semester && key(course.subjectName) === key(name));
  if (!course) return null;
  const sectionText = (label) => course.sections[label].map(chapter => [chapter.title, ...chapter.topics].join('\n')).join('\n\n');
  return {
    ...metadata(course), subjectName: course.subjectName, branch: course.branch,
    semester: `semester_${course.semester}`, semesterNumber: course.semester,
    rawText: course.rawText, sectionA: sectionText('A'), sectionB: sectionText('B'),
    sections: course.sections, isCustom: false,
  };
}

module.exports = { branches, hasBranch, semestersFor, subjectsFor, subjectDetails };
