import React, { useState } from 'react';
import { Play } from 'lucide-react';
import { tr } from '../lib/lang';
import VideoThumb from './VideoThumb';

// Click-to-play YouTube video: shows the thumbnail first so the page stays fast, and only
// loads YouTube's player when the visitor asks for it.
const VideoPlayer: React.FC<{ id: string; title: string; className?: string }> = ({ id, title, className = '' }) => {
    const [playing, setPlaying] = useState(false);

    return (
        <div className={`relative w-full aspect-video rounded-2xl overflow-hidden shadow-lg ring-1 ring-black/10 bg-black ${className}`}>
            {playing ? (
                <iframe
                    className="absolute inset-0 h-full w-full"
                    src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
                    title={title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                />
            ) : (
                <button
                    type="button"
                    onClick={() => setPlaying(true)}
                    className="group absolute inset-0 h-full w-full"
                    aria-label={`${tr('Play', 'Reproducir')}: ${title}`}
                >
                    <VideoThumb
                        id={id}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <span className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                    <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex h-16 w-16 items-center justify-center rounded-full bg-white/95 shadow-xl transition-transform group-hover:scale-110">
                        <Play className="h-7 w-7 text-sky-700 translate-x-0.5" fill="currentColor" />
                    </span>
                </button>
            )}
        </div>
    );
};

export default VideoPlayer;
