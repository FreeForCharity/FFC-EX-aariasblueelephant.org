import React, { useState } from 'react';
import { Play } from 'lucide-react';
import { youtubeEmbed } from '../../lib/festival/store';
import { tr } from '../../lib/lang';

/**
 * A YouTube video that loads nothing until someone presses play — no
 * iframe, no thumbnail from YouTube, so a visit alone sends them no data.
 */
const VideoFacade: React.FC<{ id: string; title: string }> = ({ id, title }) => {
  const [on, setOn] = useState(false);
  if (on) {
    return (
      <iframe
        className="aspect-video w-full rounded-2xl bg-black"
        src={youtubeEmbed(id)}
        title={title}
        allow="autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
      />
    );
  }
  return (
    <button
      type="button"
      onClick={() => setOn(true)}
      aria-label={`${tr('Watch the video', 'Ver el video')}: ${title}`}
      className="group flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-sky-600 to-violet-600 text-white shadow-md transition hover:brightness-110"
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-sky-700 shadow-lg transition group-hover:scale-110">
        <Play className="ml-0.5 h-7 w-7" fill="currentColor" />
      </span>
      <span className="text-sm font-bold">{tr('Watch the video', 'Ver el video')}</span>
    </button>
  );
};

export default VideoFacade;
