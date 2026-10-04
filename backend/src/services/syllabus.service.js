const fs = require('fs');
const path = require('path');
const { sql } = require('../db/client');
const { parseSyllabus } = require('../ai/utils/parseSyllabus');

const DATA_DIR = path.join(__dirname, '../ai/data/Syllabus/Branch');

const isVisible = (name) => !name.startsWith('.');

const toSlug = (name) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const normalizeSemester = (semester) => {
  if (typeof semester === 'number') return semester;
  const num = parseInt(String(semester).replace(/\D/g, ''), 10);
  return isNaN(num) ? 1 : num;
};

const formatSemesterKey = (semNum) => `semester_${semNum}`;

/**
 * Split complete syllabus content into sectionA and sectionB if not already split.
 */
function extractSectionsFromContent(content) {
  const text = (content || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const sectionRegex = /SECTION[-\s]([AB])(?:\s+CO\(s\))?/gi;
  const matches = [];
  let m;
  while ((m = sectionRegex.exec(text)) !== null) {
    matches.push({ label: m[1].toUpperCase(), index: m.index, matchLength: m[0].length });
  }

  if (matches.length === 0) {
    return { sectionA: text, sectionB: '' };
  }

  let sectionA = '';
  let sectionB = '';

  for (let i = 0; i < matches.length; i++) {
    const cur = matches[i];
    const nxt = matches[i + 1];
    const chunk = text.substring(cur.index + cur.matchLength, nxt ? nxt.index : text.length).trim();
    if (cur.label === 'A') sectionA = chunk;
    if (cur.label === 'B') sectionB = chunk;
  }

  return { sectionA, sectionB };
}

/**
 * Combine sections into standard syllabus text with SECTION-A and SECTION-B markers.
 */
function buildFullContent(content, sectionA, sectionB) {
  if (content && /SECTION[-\s][AB]/i.test(content)) {
    return content.trim();
  }
  const parts = [];
  if (sectionA || content) {
    parts.push('SECTION-A\n' + (sectionA || content).trim());
  }
  if (sectionB) {
    parts.push('SECTION-B\n' + sectionB.trim());
  }
  return parts.join('\n\n');
}

/**
 * Get all available branches from both file system and database.
 */
async function getBranches() {
  const branchesSet = new Set();

  // 1. Filesystem branches
  try {
    if (fs.existsSync(DATA_DIR)) {
      const fsBranches = fs.readdirSync(DATA_DIR)
        .filter(isVisible)
        .filter((file) => {
          try {
            return fs.statSync(path.join(DATA_DIR, file)).isDirectory();
          } catch {
            return false;
          }
        });
      fsBranches.forEach((b) => branchesSet.add(b.toUpperCase()));
    }
  } catch (err) {
    console.warn('[SyllabusService] Warning reading filesystem branches:', err.message);
  }

  // 2. Database branches
  try {
    const dbBranches = await sql`SELECT DISTINCT UPPER(branch) AS branch FROM syllabi`;
    dbBranches.forEach((row) => {
      if (row.branch) branchesSet.add(row.branch.toUpperCase());
    });
  } catch (err) {
    console.warn('[SyllabusService] Warning reading database branches:', err.message);
  }

  return Array.from(branchesSet).sort();
}

/**
 * Get all semesters for a given branch from both file system and database.
 */
async function getSemesters(branch) {
  const upperBranch = branch.toUpperCase();
  const semSet = new Set();

  // 1. Filesystem semesters
  try {
    const branchPath = path.join(DATA_DIR, upperBranch);
    if (fs.existsSync(branchPath)) {
      const fsSemesters = fs.readdirSync(branchPath)
        .filter(isVisible)
        .filter((file) => {
          try {
            return fs.statSync(path.join(branchPath, file)).isDirectory();
          } catch {
            return false;
          }
        });
      fsSemesters.forEach((s) => semSet.add(s));
    }
  } catch (err) {
    console.warn('[SyllabusService] Warning reading filesystem semesters:', err.message);
  }

  // 2. Database semesters
  try {
    const dbSemesters = await sql`
      SELECT DISTINCT semester 
      FROM syllabi 
      WHERE UPPER(branch) = ${upperBranch}
      ORDER BY semester ASC
    `;
    dbSemesters.forEach((row) => {
      if (row.semester) {
        semSet.add(formatSemesterKey(row.semester));
      }
    });
  } catch (err) {
    console.warn('[SyllabusService] Warning reading database semesters:', err.message);
  }

  return Array.from(semSet).sort((a, b) => {
    const numA = parseInt(a.replace(/\D/g, ''), 10) || 0;
    const numB = parseInt(b.replace(/\D/g, ''), 10) || 0;
    return numA - numB;
  });
}

/**
 * Get all subjects for a branch and semester with metadata.
 */
async function getSubjects(branch, semester) {
  const upperBranch = branch.toUpperCase();
  const semNum = normalizeSemester(semester);
  const semKey = formatSemesterKey(semNum);

  const subjectMap = new Map(); // lowercase name -> subject object

  // 1. Filesystem subjects
  try {
    const semesterPath = path.join(DATA_DIR, upperBranch, semKey);
    if (fs.existsSync(semesterPath)) {
      const files = fs.readdirSync(semesterPath)
        .filter(isVisible)
        .filter((file) => file.endsWith('.txt'))
        .map((file) => file.replace('.txt', ''));

      files.forEach((name) => {
        subjectMap.set(name.toLowerCase(), {
          name,
          subjectName: name,
          id: null,
          isCustom: false,
          createdBy: null,
          branch: upperBranch,
          semester: semKey,
        });
      });
    }
  } catch (err) {
    console.warn('[SyllabusService] Warning reading filesystem subjects:', err.message);
  }

  // 2. Database subjects (DB overrides or adds)
  try {
    const dbRows = await sql`
      SELECT id, subject_name, subject_code, branch, semester, created_by 
      FROM syllabi 
      WHERE UPPER(branch) = ${upperBranch} AND semester = ${semNum}
      ORDER BY subject_name ASC
    `;
    dbRows.forEach((row) => {
      if (row.subject_name) {
        subjectMap.set(row.subject_name.toLowerCase(), {
          name: row.subject_name,
          subjectName: row.subject_name,
          subjectCode: row.subject_code,
          id: row.id,
          isCustom: true,
          createdBy: row.created_by,
          branch: row.branch,
          semester: formatSemesterKey(row.semester),
        });
      }
    });
  } catch (err) {
    console.warn('[SyllabusService] Warning reading database subjects:', err.message);
  }

  return Array.from(subjectMap.values()).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
}

/**
 * Get all syllabi uploaded by the current user (or all if admin).
 */
async function getMyUploads(user) {
  if (!user) return [];
  const isAdmin = user.role === 'admin';

  let rows;
  if (isAdmin) {
    rows = await sql`
      SELECT s.id, s.subject_name, s.subject_code, s.branch, s.semester, s.created_by, s.created_at,
             u.name AS creator_name, u.email AS creator_email
      FROM syllabi s
      LEFT JOIN users u ON s.created_by = u.id
      ORDER BY s.created_at DESC
    `;
  } else {
    rows = await sql`
      SELECT s.id, s.subject_name, s.subject_code, s.branch, s.semester, s.created_by, s.created_at,
             u.name AS creator_name, u.email AS creator_email
      FROM syllabi s
      LEFT JOIN users u ON s.created_by = u.id
      WHERE s.created_by = ${user.id}
      ORDER BY s.created_at DESC
    `;
  }

  return rows.map((r) => ({
    id: r.id,
    name: r.subject_name,
    subjectCode: r.subject_code,
    branch: r.branch,
    semester: formatSemesterKey(r.semester),
    semesterNumber: r.semester,
    createdBy: r.created_by,
    creatorName: r.creator_name || r.creator_email || 'Unknown',
    createdAt: r.created_at,
    isCustom: true,
  }));
}

/**
 * Get full parsed syllabus details for a specific subject.
 */
async function getSubjectDetails(branch, semester, subject) {
  const upperBranch = branch.toUpperCase();
  const semNum = normalizeSemester(semester);
  const semKey = formatSemesterKey(semNum);
  const slug = toSlug(subject);

  // 1. Check Database first
  try {
    const rows = await sql`
      SELECT s.*, u.name AS creator_name, u.email AS creator_email
      FROM syllabi s
      LEFT JOIN users u ON s.created_by = u.id
      WHERE UPPER(s.branch) = ${upperBranch} 
        AND s.semester = ${semNum}
        AND LOWER(s.subject_name) = LOWER(${subject})
      LIMIT 1
    `;

    if (rows && rows.length > 0) {
      const row = rows[0];
      const sections = parseSyllabus(slug, row.content);
      return {
        id: row.id,
        subjectName: row.subject_name,
        subjectCode: row.subject_code,
        branch: row.branch,
        semester: formatSemesterKey(row.semester),
        semesterNumber: row.semester,
        rawText: row.content,
        sectionA: row.section_a,
        sectionB: row.section_b,
        sections,
        isCustom: true,
        createdBy: row.creator_name || row.creator_email || null,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    }
  } catch (err) {
    console.warn('[SyllabusService] Warning checking database for subject:', err.message);
  }

  // 2. Fall back to Filesystem
  try {
    const subjectPath = path.join(DATA_DIR, upperBranch, semKey, `${subject}.txt`);
    if (fs.existsSync(subjectPath)) {
      const rawText = fs.readFileSync(subjectPath, 'utf-8');
      const sections = parseSyllabus(slug, rawText);
      const extracted = extractSectionsFromContent(rawText);

      return {
        subjectName: subject,
        subjectCode: null,
        branch: upperBranch,
        semester: semKey,
        semesterNumber: semNum,
        rawText,
        sectionA: extracted.sectionA,
        sectionB: extracted.sectionB,
        sections,
        isCustom: false,
      };
    }
  } catch (err) {
    console.warn('[SyllabusService] Warning reading filesystem subject:', err.message);
  }

  return null;
}

/**
 * Create or update a syllabus in the database.
 */
async function createSyllabus({ subjectName, subjectCode, branch, semester, content, sectionA, sectionB, userId }) {
  if (!subjectName || !subjectName.trim()) {
    throw new Error('Subject name is required');
  }
  if (!branch || !branch.trim()) {
    throw new Error('Branch is required');
  }
  if (!semester) {
    throw new Error('Semester is required');
  }

  const upperBranch = branch.trim().toUpperCase();
  const semNum = normalizeSemester(semester);
  if (semNum < 1 || semNum > 8) {
    throw new Error('Semester must be between 1 and 8');
  }

  const cleanSubjectName = subjectName.trim();
  const cleanSubjectCode = subjectCode ? subjectCode.trim() : null;

  const fullContent = buildFullContent(content, sectionA, sectionB);
  if (!fullContent || fullContent.length < 10) {
    throw new Error('Syllabus content is required');
  }

  const { sectionA: extA, sectionB: extB } = extractSectionsFromContent(fullContent);

  // Check if syllabus exists
  const existing = await sql`
    SELECT id 
    FROM syllabi 
    WHERE UPPER(branch) = ${upperBranch} 
      AND semester = ${semNum} 
      AND LOWER(subject_name) = LOWER(${cleanSubjectName})
    LIMIT 1
  `;

  let result;
  if (existing.length > 0) {
    // Update existing syllabus
    const updated = await sql`
      UPDATE syllabi
      SET subject_name = ${cleanSubjectName},
          subject_code = ${cleanSubjectCode},
          content      = ${fullContent},
          section_a    = ${extA},
          section_b    = ${extB},
          created_by   = COALESCE(${userId || null}, created_by),
          updated_at   = now()
      WHERE id = ${existing[0].id}
      RETURNING *
    `;
    result = updated[0];
  } else {
    // Insert new syllabus
    const inserted = await sql`
      INSERT INTO syllabi (
        subject_name,
        subject_code,
        branch,
        semester,
        content,
        section_a,
        section_b,
        created_by
      ) VALUES (
        ${cleanSubjectName},
        ${cleanSubjectCode},
        ${upperBranch},
        ${semNum},
        ${fullContent},
        ${extA},
        ${extB},
        ${userId || null}
      )
      RETURNING *
    `;
    result = inserted[0];
  }

  const slug = toSlug(result.subject_name);
  const sections = parseSyllabus(slug, result.content);

  return {
    id: result.id,
    subjectName: result.subject_name,
    subjectCode: result.subject_code,
    branch: result.branch,
    semester: formatSemesterKey(result.semester),
    semesterNumber: result.semester,
    rawText: result.content,
    sectionA: result.section_a,
    sectionB: result.section_b,
    sections,
    isCustom: true,
  };
}

/**
 * Delete a syllabus by ID. Only admins or the creator professor can delete.
 */
async function deleteSyllabus(id, user) {
  const existing = await sql`
    SELECT * FROM syllabi WHERE id = ${id} LIMIT 1
  `;

  if (existing.length === 0) {
    throw new Error('Syllabus not found');
  }

  const record = existing[0];
  const isOwner = user?.id && String(record.created_by) === String(user.id);
  const isAdmin = user?.role === 'admin';

  if (!isAdmin && !isOwner) {
    throw new Error('You do not have permission to delete this syllabus');
  }

  await sql`DELETE FROM syllabi WHERE id = ${id}`;
  return { success: true, id };
}

module.exports = {
  getBranches,
  getSemesters,
  getSubjects,
  getSubjectDetails,
  createSyllabus,
  deleteSyllabus,
  getMyUploads,
};
