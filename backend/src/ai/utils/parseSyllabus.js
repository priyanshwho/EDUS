/**
 * Parses a syllabus .txt file and returns structured JSON.
 * Handles formats:
 *   - "SECTION-A", "SECTION-B", "SECTION-A CO(s)" markers
 *   - Chapter title lines (capitalized)
 *   - Topic lines with comma/colon content
 *   - Hours encoded as trailing (05) OR standalone line "5"
 *   - Standalone chapter index numbers (1, 2, 3...) are ignored (not hours)
 */
function parseSyllabus(subjectSlug, rawText) {
  const sections = { A: [], B: [] };

  // Normalize Windows line endings
  const text = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Find SECTION-A and SECTION-B split points
  // Handle: SECTION-A, SECTION A, SECTION-A CO(s), SECTION-B CO(s)
  const sectionRegex = /SECTION[-\s]([AB])(?:\s+CO\(s\))?/gi;
  const sectionIndices = [];
  let match;
  while ((match = sectionRegex.exec(text)) !== null) {
    sectionIndices.push({ label: match[1].toUpperCase(), index: match.index });
  }

  if (sectionIndices.length === 0) return sections;

  for (let i = 0; i < sectionIndices.length; i++) {
    const current = sectionIndices[i];
    const next = sectionIndices[i + 1];

    // Get section content (skip the marker line itself)
    const rawSection = text.substring(current.index, next ? next.index : text.length);
    // Remove the first line (the SECTION marker)
    const sectionContent = rawSection.split('\n').slice(1).join('\n').trim();

    const chapters = parseChapters(subjectSlug, current.label, sectionContent);
    sections[current.label] = chapters;
  }

  return sections;
}

function parseChapters(subjectSlug, sectionLabel, sectionText) {
  const chapters = [];
  let chapterIndex = 1;

  // Split into lines, trim each
  const lines = sectionText.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  let currentTitle = null;
  let currentTopics = [];
  let currentHours = null;

  const flushChapter = () => {
    if (currentTitle) {
      chapters.push({
        chapterId: `${subjectSlug}-${sectionLabel.toLowerCase()}-${chapterIndex}`,
        title: currentTitle,
        hours: currentHours || 0,
        topics: currentTopics,
      });
      chapterIndex++;
    }
    currentTitle = null;
    currentTopics = [];
    currentHours = null;
  };

  for (const line of lines) {
    // Check if line contains inline hours like "(05)" or "(06)"
    const inlineHoursMatch = line.match(/\((\d+)\)\s*$/);
    if (inlineHoursMatch) {
      // This line has inline hours — it's a topic line ending the block
      const hours = parseInt(inlineHoursMatch[1]);
      // Strip the (xx) from the line to get the topic text
      const topicText = line.replace(/\(\d+\)\s*$/, '').trim();

      if (currentTitle === null) {
        // Edge case: inline-hours line appears before we have a title
        // Treat the topicText as the chapter title
        currentTitle = topicText;
      } else if (topicText) {
        currentTopics.push(topicText);
      }
      currentHours = hours;
      flushChapter();
      continue;
    }

    // Check if line is ONLY a standalone number (chapter index or hours)
    if (/^\d+$/.test(line)) {
      const num = parseInt(line);
      // If we have a current chapter, this might be hours (>= 4) or a chapter index (1,2,3...)
      if (currentTitle) {
        // If we haven't got hours yet and the number looks like hours (>= 3), use it
        if (currentHours === null && num >= 3) {
          currentHours = num;
        }
        flushChapter();
      }
      // If no current chapter, it's a chapter index number — skip
      continue;
    }

    // Check if line looks like a chapter TITLE
    const looksLikeTitle = (
      /^[A-Z]/.test(line) &&
      line.split(/\s+/).length <= 10 &&
      !line.startsWith('Unix') === false ||
      /^[A-Z][a-z]/.test(line.split(' ')[0])
    );

    if (currentTitle === null) {
      if (line.length > 120) continue;
      currentTitle = line;
    } else {
      const topic = line.replace(/:$/, '').trim();
      if (topic) currentTopics.push(topic);
    }
  }

  if (currentTitle) {
    flushChapter();
  }

  return chapters;
}

module.exports = { parseSyllabus };
