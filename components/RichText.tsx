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
            return { url, type: 'instagram' as const };
        }
        if (url.includes('tiktok.com')) {
            return { url, type: 'tiktok' as const };
        }
        if (/\.(jpg|jpeg|png|gif|webp)$/i.test(url)) {
            return { url, type: 'image' as const, thumbnail: url };
        }
    }
    return null;
};

const RichText: React.FC<RichTextProps> = ({ content, className = '' }) => {
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
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
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

                    if (isInstagram(part) || isTikTok(part)) {
                        const isInsta = isInstagram(part);
                        return (
                            <a
                                key={index}
                                href={part}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 my-2 px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-sky-500 dark:hover:border-sky-500 transition-all text-sky-600 dark:text-sky-400 font-bold group no-underline"
                            >
                                {isInsta ? <Instagram className="h-5 w-5" /> : <LinkIcon className="h-5 w-5" />}
                                <span className="text-sm">View {isInsta ? 'Instagram' : 'TikTok'} Post</span>
                                <ExternalLink className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </a>
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
