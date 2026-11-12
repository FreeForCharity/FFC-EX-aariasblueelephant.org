import React, { useEffect } from 'react';
import { Video } from 'lucide-react';
import StagedFadeIn from '../components/StagedFadeIn';
import VideoPlayer from '../components/VideoPlayer';
import { tr, isEs } from '../lib/lang';
import { FEATURED_VIDEO, MESSAGE_VIDEOS, WEBINAR_VIDEOS, VideoItem } from '../data/videos';

const Grid: React.FC<{ videos: VideoItem[] }> = ({ videos }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
    {videos.map(v => (
      <div key={v.id} className="bg-white dark:bg-slate-800 rounded-3xl p-4 shadow-sm border border-slate-100 dark:border-slate-700">
        <VideoPlayer id={v.id} title={v.title} />
        <h3 className="mt-4 px-1 text-lg font-black text-slate-900 dark:text-white">{v.title}</h3>
        {v.caption && <p className="px-1 text-sm text-slate-600 dark:text-slate-300">{v.caption}</p>}
      </div>
    ))}
  </div>
);

const Videos: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-24">
      <section className="relative pt-24 pb-12 overflow-hidden bg-gradient-to-b from-[#00AEEF]/10 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <StagedFadeIn>
            <div className="inline-flex items-center justify-center p-3 bg-[#00AEEF]/20 rounded-full mb-6">
              <Video className="h-8 w-8 text-[#00AEEF]" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-6 uppercase tracking-tight">
              {tr('Watch &', 'Mira y')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00AEEF] to-[#8b5cf6]">{tr('Learn', 'Aprende')}</span>
            </h1>
            <p className="max-w-3xl mx-auto text-lg md:text-xl text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              {tr(
                'Messages and webinars from the people and experts who support our community.',
                'Mensajes y seminarios web de las personas y los expertos que apoyan a nuestra comunidad.'
              )}
            </p>
            {isEs() && <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{'Videos en inglés'}</p>}
          </StagedFadeIn>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
        <section>
          <div className="rounded-3xl bg-gradient-to-b from-sky-900 via-sky-800 to-indigo-900 p-5 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-sky-300 mb-2 text-center">
              {tr('A special message for our herd', 'Un mensaje especial para nuestra manada')}
            </p>
            <h2 className="text-2xl sm:text-4xl font-black text-white text-center mb-3">{FEATURED_VIDEO.title}</h2>
            <p className="text-sky-100 text-center max-w-3xl mx-auto mb-6 leading-relaxed">{FEATURED_VIDEO.caption}</p>
            <div className="max-w-4xl mx-auto">
              <VideoPlayer id={FEATURED_VIDEO.id} title={FEATURED_VIDEO.title} className="ring-4 ring-white/20" />
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-4">{tr('Messages', 'Mensajes')}</h2>
          <Grid videos={MESSAGE_VIDEOS} />
        </section>

        <section>
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-4">{tr('Webinar series', 'Serie de seminarios web')}</h2>
          <Grid videos={WEBINAR_VIDEOS} />
        </section>
      </div>
    </div>
  );
};

export default Videos;
