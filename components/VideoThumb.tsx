import React, { useState } from 'react';

// YouTube thumbnail with a fallback chain. A missing size comes back as YouTube's tiny gray
// placeholder (120px wide), not as an error, so check the loaded width too.
const VideoThumb: React.FC<{ id: string; className?: string; loading?: 'lazy' | 'eager' }> = ({ id, className, loading = 'lazy' }) => {
    const thumbs = ['maxresdefault', 'sddefault', 'hqdefault'].map(n => `https://i.ytimg.com/vi/${id}/${n}.jpg`);
    const [idx, setIdx] = useState(0);
    const next = () => setIdx(i => Math.min(i + 1, thumbs.length - 1));
    return (
        <img
            src={thumbs[idx]}
            alt=""
            loading={loading}
            className={className}
            onLoad={e => { if (e.currentTarget.naturalWidth <= 120) next(); }}
            onError={next}
        />
    );
};

export default VideoThumb;
