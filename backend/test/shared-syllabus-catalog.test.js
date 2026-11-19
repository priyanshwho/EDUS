const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const catalog = require('../src/ai/data/catalog/uiet-2023-27.json');
const shared = require('../src/services/shared-syllabus-catalog');

test('both supplied curricula cover all eight semesters without duplicate subjects or empty topics', () => {
  assert.deepEqual(shared.branches(), ['CSE', 'IT']);
  for (const branch of shared.branches()) {
    assert.deepEqual(shared.semestersFor(branch), [1, 2, 3, 4, 5, 6, 7, 8]);
    const identities = new Set();
    for (const course of catalog.sources[branch].courses) {
      const identity = `${course.semester}:${course.subjectName.toLowerCase()}`;
      assert(!identities.has(identity), identity);
      identities.add(identity);
      assert(course.subjectCode);
      assert(course.sourcePages[0] > 0 && course.sourcePages[1] >= course.sourcePages[0]);
      assert(course.sourcePages[1] <= catalog.sources[branch].pages);
      const chapters = [...course.sections.A, ...course.sections.B];
      assert(chapters.length > 0, identity);
      assert(new Set(chapters.map(chapter => chapter.chapterId)).size === chapters.length, identity);
      for (const chapter of chapters) {
        assert(chapter.title && chapter.topics.length > 0, identity);
        assert(chapter.topics.every(topic => typeof topic === 'string' && topic.trim()), identity);
      }
    }
    const pdf = fs.readFileSync(path.join(__dirname, `../../Frontend/public/syllabi/uiet-2023-27/${branch.toLowerCase()}-syllabus.pdf`));
    assert.equal(createHash('sha256').update(pdf).digest('hex'), catalog.sources[branch].sha256);
  }
});

test('teaching scheme controls branch and semester assignments, including electives and source errata', () => {
  assert(shared.subjectDetails('CSE', 4, 'Analysis and Design of Algorithms'));
  assert.equal(shared.subjectDetails('IT', 4, 'Analysis and Design of Algorithms'), null);
  assert(shared.subjectDetails('IT', 6, 'Design and Analysis of Algorithms'));
  assert(shared.subjectDetails('IT', 3, 'Linear Algebra and Probability Theory'));
  assert(shared.subjectDetails('IT', 4, 'Discrete Structures'));
  assert(shared.subjectDetails('CSE', 5, 'Economics'));
  assert.equal(shared.subjectDetails('CSE', 4, 'Economics'), null);
  assert.equal(shared.subjectDetails('CSE', 8, 'User Interface Technologies (Practical)').subjectCode, 'CS 853C');
  assert.equal(shared.subjectDetails('IT', 5, 'Industrial Training (After 4th Semester)').subjectCode, 'PWIT 551');
  assert(shared.subjectDetails('IT', 5, 'Python Programming'));
});

test('continuation pages and shared-page courses retain teaching material without book tables', () => {
  const learning = shared.subjectDetails('IT', 6, 'Machine Learning');
  const topics = JSON.stringify(learning.sections);
  assert.match(topics, /decision boundary/i);
  assert.match(topics, /Neural networks/i);
  assert.doesNotMatch(topics, /NAME AUTHOR|PUBLISHER/);
  const python = shared.subjectDetails('IT', 5, 'Python Programming');
  assert.match(JSON.stringify(python.sections), /Database Connectivity/);
  assert.doesNotMatch(python.rawText, /Unix Networking Programming \(Practical\)/);
  assert.equal(shared.subjectDetails('IT', 1, 'Professional Communication').schemeOnly, true);
  assert.equal(shared.subjectDetails('IT', 1, 'Professional Communication (Practical)').schemeOnly, false);
  assert.equal(shared.subjectDetails('IT', 6, 'Open Elective-I').schemeOnly, true);
  assert.equal(shared.subjectDetails('CSE', 8, '../../unavailable'), null);
});
