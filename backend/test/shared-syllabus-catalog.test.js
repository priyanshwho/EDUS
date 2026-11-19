const test = require('node:test');
const assert = require('node:assert/strict');
const catalog = require('../src/ai/data/catalog/uiet-2023-27.json');
const shared = require('../src/services/shared-syllabus-catalog');

test('all sixteen branch/semester combinations match the main theory rows in the teaching schemes', () => {
  const counts = { CSE: [6, 6, 6, 5, 5, 5, 4, 3], IT: [6, 6, 5, 5, 4, 6, 4, 3] };
  assert.deepEqual(shared.branches(), ['CSE', 'IT']);
  for (const branch of shared.branches()) {
    assert.deepEqual(shared.semestersFor(branch), [1, 2, 3, 4, 5, 6, 7, 8]);
    for (let sem = 1; sem <= 8; sem++) assert.equal(shared.subjectsFor(branch, sem).length, counts[branch][sem - 1]);
    const names = new Set();
    for (const course of catalog.sources[branch].courses) {
      const identity = `${course.semester}:${course.subjectName.toLowerCase()}`;
      assert(!names.has(identity), identity); names.add(identity);
      assert(['theory', 'elective'].includes(course.kind), identity);
      assert(!/practical|training|seminar|project[- ](?:I|II|III|IV|\d)\b/i.test(course.subjectName), identity);
      assert(course.subjectCode);
      assert(course.sourcePages[0] > 0 && course.sourcePages[1] >= course.sourcePages[0]);
      assert(course.sourcePages[1] <= catalog.sources[branch].pages);
      const chapters = [...course.sections.A, ...course.sections.B];
      assert(chapters.length > 0 && new Set(chapters.map(c => c.chapterId)).size === chapters.length, identity);
      for (const chapter of chapters) assert(chapter.title && chapter.topics.length && chapter.topics.every(t => t.trim()), identity);
    }
  }
});

test('branch assignments follow the PDF and each elective retains its alternative syllabi', () => {
  assert(shared.subjectDetails('CSE', 4, 'Analysis and Design of Algorithms'));
  assert.equal(shared.subjectDetails('IT', 4, 'Analysis and Design of Algorithms'), null);
  assert(shared.subjectDetails('IT', 6, 'Design and Analysis of Algorithms'));
  assert(shared.subjectDetails('IT', 3, 'Linear Algebra and Probability Theory'));
  assert(shared.subjectDetails('IT', 4, 'Discrete Structures'));
  assert(shared.subjectDetails('CSE', 5, 'Economics'));
  assert.equal(shared.subjectDetails('CSE', 4, 'Economics'), null);
  const elective = shared.subjectDetails('IT', 5, 'Professional Elective-I');
  assert.equal(elective.sections.A.length, 6);
  assert.match(JSON.stringify(elective.sections), /Python Programming/);
  assert.match(JSON.stringify(elective.sections), /Java programming\/Technologies/);
  assert.match(JSON.stringify(elective.sections), /Database Connectivity/);
  assert.equal(shared.subjectDetails('IT', 5, 'Python Programming'), null);
  assert.equal(shared.subjectDetails('IT', 1, 'Choice-based Physics').sections.A.length, 3);
});

test('continued pages retain teaching content and missing theory sheets are not invented', () => {
  const topics = JSON.stringify(shared.subjectDetails('IT', 6, 'Machine Learning').sections);
  assert.match(topics, /decision boundary/i); assert.match(topics, /Neural networks/i);
  assert.doesNotMatch(topics, /NAME AUTHOR|PUBLISHER/);
  assert.equal(shared.subjectDetails('IT', 1, 'Professional Communication').schemeOnly, true);
  assert.equal(shared.subjectDetails('IT', 6, 'Open Elective-I').schemeOnly, true);
  assert.equal(shared.subjectDetails('CSE', 8, '../../unavailable'), null);
});
