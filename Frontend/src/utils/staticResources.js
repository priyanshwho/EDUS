import geminiData from '../constants/Gemini.json';
import { sampleLectures } from '../database/Lecture';

export function getStaticResources() {
  const adminUploader = {
    username: 'priyanshwho',
    email: 'priyanshu82711@gmail.com',
    name: 'Admin'
  };

  const staticDate = new Date('2024-01-01T00:00:00Z').toISOString();

  const geminiResources = geminiData.map((item, index) => {
    // Determine type based on item.type: 'notes' -> 'notes', 'pyqs' -> 'pyq'
    let rType = 'notes';
    let pyqType = null;
    if (item.type === 'pyqs') rType = 'pyq';
    if (item.type === 'notes') rType = 'notes';
    if (item.type === 'majors') {
      rType = 'pyq';
      pyqType = 'major';
    }
    if (item.type === 'minor') {
      rType = 'pyq';
      pyqType = 'minor1';
    }
    
    return {
      id: `static-gemini-${item.id}-${index}`,
      resource_type: rType,
      pyq_type: pyqType,
      year: item.year && item.year !== 'N/A' ? item.year : null,
      title: item.title,
      description: 'Imported resource material.',
      subjects: {
        id: `static-subj-${item.subject}`,
        name_full: item.subject,
        acronym: item.subject,
        semester: item.semester,
        branch: item.branch,
      },
      uploader: adminUploader,
      created_at: staticDate,
      slug: `static-gemini-${item.id}-${index}`,
      external_link: item.url || null,
      youtube_url: null,
      isStatic: true // custom flag
    };
  });

  const lectureResources = sampleLectures.flatMap((lecture, index) => {
    const resources = [];
    
    // Main video
    if (lecture.link) {
      resources.push({
        id: `static-lec-${lecture.id}-main`,
        resource_type: 'lecture',
        title: lecture.title,
        description: 'Imported lecture video.',
        subjects: {
          id: `static-subj-${lecture.subject}`,
          name_full: lecture.subject,
          acronym: lecture.subject,
          semester: lecture.semester,
          branch: lecture.branch,
        },
        uploader: adminUploader,
        created_at: staticDate,
        slug: `static-lec-${lecture.id}-main`,
        external_link: null,
        youtube_url: lecture.link,
        isStatic: true
      });
    }

    // Playlist videos
    if (lecture.playlistVideos && Array.isArray(lecture.playlistVideos)) {
      lecture.playlistVideos.forEach((pl, plIndex) => {
        resources.push({
          id: `static-lec-${lecture.id}-pl-${plIndex}`,
          resource_type: 'lecture',
          title: pl.title || `${lecture.title} Playlist Video ${plIndex + 1}`,
          description: 'Imported lecture playlist video.',
          subjects: {
            id: `static-subj-${lecture.subject}`,
            name_full: lecture.subject,
            acronym: lecture.subject,
            semester: lecture.semester,
            branch: lecture.branch,
          },
          uploader: adminUploader,
          created_at: staticDate,
          slug: `static-lec-${lecture.id}-pl-${plIndex}`,
          external_link: null,
          youtube_url: pl.link,
          isStatic: true
        });
      });
    }

    return resources;
  });

  return [...geminiResources, ...lectureResources];
}
