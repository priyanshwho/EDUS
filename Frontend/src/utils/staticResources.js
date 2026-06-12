import geminiData from '../constants/Gemini.json';
import { sampleLectures } from '../database/Lecture';

export function getStaticResources() {
  const adminUploader = {
    username: 'priyanswho',
    email: 'priyanshu82711@gmail.com',
    name: 'Admin'
  };

  const staticDate = new Date('2024-01-01T00:00:00Z').toISOString();

  const geminiResources = geminiData.map((item, index) => {
    // Determine type based on item.type: 'notes' -> 'note', 'pyqs' -> 'pyq', else 'note'
    let rType = 'note';
    if (item.type === 'pyqs') rType = 'pyq';
    if (item.type === 'notes') rType = 'note';
    // 'majors' or 'minor' typically fall under PYQs in this project's context, but let's keep them as pyq.
    if (item.type === 'majors' || item.type === 'minor') rType = 'pyq';
    
    return {
      id: `static-gemini-${item.id}-${index}`,
      resource_type: rType,
      title: item.title,
      description: 'Imported resource material.',
      subjects: {
        name_full: item.subject,
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
          name_full: lecture.subject,
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
            name_full: lecture.subject,
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
