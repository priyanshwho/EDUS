import { extractYoutubeId } from '../../utils/preview';

/**
 * Renders a YouTube video embed inside a responsive wrapper.
 */
export default function YoutubeEmbed({ url }) {
  const videoId = extractYoutubeId(url);

  if (!videoId) {
    return (
      <div className="flex items-center justify-center h-64 bg-n-7 rounded-xl text-n-3 text-sm">
        Invalid YouTube URL
      </div>
    );
  }

  const embedSrc = `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`;

  return (
    <div className="relative w-full" style={{ paddingTop: '56.25%' /* 16:9 */ }}>
      <iframe
        className="absolute inset-0 w-full h-full rounded-xl"
        src={embedSrc}
        title="YouTube video player"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
