import React from 'react';
import { Youtube, Instagram, Link as LinkIcon, ExternalLink, Image as ImageIcon } from 'lucide-react';

interface RichTextProps {
    content: string;
    className?: string;
}

export const extractMedia = (content: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = content.match(urlRegex) || [];

    for (const url of urls) {
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
            let videoId = '';
            if (url.includes('v=')) {
                videoId = url.split('v=')[1].split('&')[0];
            } else if (url.includes('youtu.be/')) {
                videoId = url.split('youtu.be/')[1].split('?')[0];
            } else if (url.includes('shorts/')) {
                videoId = url.split('shorts/')[1].split('?')[0];
            } else if (url.includes('embed/')) {
                videoId = url.split('embed/')[1].split('?')[0];
            }
            if (videoId) {
                return {
                    url,
                    type: 'youtube' as const,
                    thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
                };
            }
        }
        if (url.includes('instagram.com')) {
            let postId = '';
            if (url.includes('/p/')) postId = url.split('/p/')[1].split('/')[0].split('?')[0];
            else if (url.includes('/reels/')) postId = url.split('/reels/')[1].split('/')[0].split('?')[0];
            else if (url.includes('/reel/')) postId = url.split('/reel/')[1].split('/')[0].split('?')[0];

            return {
                url,
                type: 'instagram' as const,
                thumbnail: postId ? `https://www.instagram.com/p/${postId}/media/?size=m` : undefined
            };
        }
        if (url.includes('tiktok.com')) {
            let videoId = '';
            if (url.includes('/video/')) videoId = url.split('/video/')[1].split('/')[0].split('?')[0];
            return { url, type: 'tiktok' as const };
        }
        if (url.includes('facebook.com') || url.includes('fb.watch')) {
            return { url, type: 'facebook' as const };
        }
        if (url.includes('photos.google.com') || url.includes('photos.app.goo.gl')) {
            return { url, type: 'google-photos' as const };
        }
        if (/\.(jpg|jpeg|png|gif|webp)$/i.test(url)) {
            return { url, type: 'image' as const, thumbnail: url };
        }
    }
    return null;
};

const RichText: React.FC<RichTextProps> = ({ content, className = '' }) => {
    const [playingTikToks, setPlayingTikToks] = React.useState<Record<number, boolean>>({});
    // Regular expression to find URLs
    const urlRegex = /(https?:\/\/[^\s]+)/g;

    // Split content by URLs to process them individually
    const parts = content.split(urlRegex);

    const isYouTube = (url: string) => {
        return url.includes('youtube.com') || url.includes('youtu.be');
    };

    const isInstagram = (url: string) => {
        return url.includes('instagram.com');
    };

    const isTikTok = (url: string) => {
        return url.includes('tiktok.com');
    };

    const isImage = (url: string) => {
        return /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
    };

    const getYouTubeEmbedUrl = (url: string) => {
        let videoId = '';
        if (url.includes('v=')) {
            videoId = url.split('v=')[1].split('&')[0];
        } else if (url.includes('youtu.be/')) {
            videoId = url.split('youtu.be/')[1].split('?')[0];
        } else if (url.includes('shorts/')) {
            videoId = url.split('shorts/')[1].split('?')[0];
        } else if (url.includes('embed/')) {
            videoId = url.split('embed/')[1].split('?')[0];
        }

        if (videoId) {
            return `https://www.youtube-nocookie.com/embed/${videoId}`;
        }
        return null;
    };

    const getInstagramEmbedUrl = (url: string) => {
        let postId = '';
        if (url.includes('/p/')) postId = url.split('/p/')[1].split('/')[0].split('?')[0];
        else if (url.includes('/reels/')) postId = url.split('/reels/')[1].split('/')[0].split('?')[0];
        else if (url.includes('/reel/')) postId = url.split('/reel/')[1].split('/')[0].split('?')[0];

        if (postId) return `https://www.instagram.com/p/${postId}/embed`;
        return null;
    };

    const getTikTokEmbedUrl = (url: string) => {
        let videoId = '';
        if (url.includes('/video/')) videoId = url.split('/video/')[1].split('/')[0].split('?')[0];
        if (videoId) return `https://www.tiktok.com/embed/v2/${videoId}`;
        return null;
    };

    const getFacebookEmbedUrl = (url: string) => {
        return `https://www.facebook.com/plugins/post.php?href=${encodeURIComponent(url)}&show_text=true&width=500`;
    };

    return (
        <div className={`rich-text leading-relaxed whitespace-pre-wrap ${className}`}>
            {parts.map((part, index) => {
                if (part.match(urlRegex)) {
                    // It's a URL
                    if (isYouTube(part)) {
                        const embedUrl = getYouTubeEmbedUrl(part);
                        if (embedUrl) {
                            return (
                                <div key={index} className="my-4 rounded-xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-800 bg-slate-900 aspect-video">
                                    <iframe
                                        width="100%"
                                        height="100%"
                                        src={embedUrl}
                                        title="YouTube video player"
                                        frameBorder="0"
                                        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                        allowFullScreen
                                    ></iframe>
                                </div>
                            );
                        }
                    }

                    if (isImage(part)) {
                        return (
                            <div key={index} className="my-4 rounded-xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-800">
                                <img src={part} alt="Uploaded in story" className="w-full h-auto max-h-[400px] object-contain bg-slate-100 dark:bg-slate-800" />
                            </div>
                        );
                    }

                    if (isInstagram(part)) {
                        const embedUrl = getInstagramEmbedUrl(part);
                        if (embedUrl) {
                            return (
                                <div key={index} className="my-4 rounded-xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-800 bg-white max-w-[500px] mx-auto min-h-[450px]">
                                    <iframe
                                        src={embedUrl}
                                        width="100%"
                                        height="100%"
                                        frameBorder="0"
                                        scrolling="no"
                                        allowTransparency={true}
                                        allow="encrypted-media"
                                        className="min-h-[450px]"
                                    ></iframe>
                                </div>
                            );
                        }
                    }

                    if (isTikTok(part)) {
                        const embedUrl = getTikTokEmbedUrl(part);
                        const isPlaying = playingTikToks[index];

                        if (embedUrl) {
                            return (
                                <div key={index} className="my-4 rounded-xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-800 bg-black max-w-[325px] mx-auto min-h-[580px] relative group">
                                    {!isPlaying ? (
                                        <div
                                            className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-sm cursor-pointer hover:bg-slate-900/40 transition-all"
                                            onClick={() => setPlayingTikToks({ ...playingTikToks, [index]: true })}
                                        >
                                            <div className="h-20 w-20 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30 group-hover:scale-110 transition-transform shadow-2xl">
                                                <div className="h-16 w-16 rounded-full bg-sky-500 flex items-center justify-center shadow-inner">
                                                    <Youtube className="h-8 w-8 text-white fill-current" />
                                                </div>
                                            </div>
                                            <p className="mt-4 text-white font-bold tracking-wide uppercase text-xs">Click to Play Community Story</p>
                                        </div>
                                    ) : null}
                                    <iframe
                                        src={embedUrl}
                                        width="100%"
                                        height="700px" // TikTok embeds are vertical
                                        frameBorder="0"
                                        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                        allowFullScreen
                                        className={`w-full ${!isPlaying ? 'pointer-events-none' : ''}`}
                                    ></iframe>
                                </div>
                            );
                        }
                    }

                    if (part.includes('facebook.com') || part.includes('fb.watch')) {
                        const embedUrl = getFacebookEmbedUrl(part);
                        return (
                            <div key={index} className="my-4 rounded-xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-800 bg-white max-w-[500px] mx-auto overflow-x-auto min-h-[300px]">
                                <iframe
                                    src={embedUrl}
                                    width="500"
                                    height="500"
                                    style={{ border: 'none', overflow: 'hidden' }}
                                    scrolling="no"
                                    frameBorder="0"
                                    allowFullScreen={true}
                                    allow="clipboard-write; encrypted-media; picture-in-picture; web-share"
                                ></iframe>
                            </div>
                        );
                    }

                    if (part.includes('photos.google.com') || part.includes('photos.app.goo.gl')) {
                        return (
                            <div key={index} className="my-6">
                                <a
                                    href={part}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block p-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl hover:border-sky-500 dark:hover:border-sky-500 transition-all shadow-md hover:shadow-xl group no-underline"
                                >
                                    <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-900 mb-2">
                                        {/* Stack of photos simulation */}
                                        <div className="absolute inset-0 flex items-center justify-center p-8">
                                            <div className="relative w-full h-full">
                                                <div className="absolute top-2 left-6 right-2 bottom-6 bg-slate-200 dark:bg-slate-700 rounded-xl transform rotate-3 shadow-md opacity-30"></div>
                                                <div className="absolute top-4 left-2 right-6 bottom-4 bg-slate-300 dark:bg-slate-600 rounded-xl transform -rotate-2 shadow-md opacity-50"></div>
                                                <div className="absolute inset-0 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center gap-4">
                                                    <div className="h-16 w-16 rounded-2xl bg-sky-50 dark:bg-sky-900/30 flex items-center justify-center text-sky-600 dark:text-sky-400">
                                                        <ImageIcon className="h-8 w-8" />
                                                    </div>
                                                    <div className="text-center px-4">
                                                        <p className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-sm">Open Shared Photo Album</p>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 italic">Click to view all {part.includes('album') ? 'album' : 'event'} photos</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="absolute bottom-4 right-4 h-10 w-10 rounded-full bg-sky-600 text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                                            <ExternalLink className="h-5 w-5" />
                                        </div>
                                    </div>
                                </a>
                            </div>
                        );
                    }

                    // Default link
                    return (
                        <a
                            key={index}
                            href={part}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sky-600 dark:text-sky-400 hover:underline inline-flex items-center gap-1 font-semibold break-all"
                        >
                            {part} <ExternalLink className="h-3 w-3" />
                        </a>
                    );
                }

                // It's regular text
                return <span key={index}>{part}</span>;
            })}
        </div>
    );
};

export default RichText;
