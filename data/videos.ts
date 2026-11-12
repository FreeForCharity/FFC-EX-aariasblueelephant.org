// Videos shown on /videos. To add one, paste its YouTube ID (the part after "watch?v=" or "youtu.be/")
// into the right list. Titles and speaker names stay as entered; only the surrounding text is translated.
import { tr } from '../lib/lang';

export interface VideoItem {
    id: string;
    title: string;
    caption?: string;
}

export const FEATURED_VIDEO: VideoItem = {
    id: '95Acjx-ZdCo',
    title: 'Dr. Shashi Tharoor',
    caption: tr(
        'Former United Nations Under-Secretary-General and award-winning author of more than twenty books. He shares why inclusion and community support matter for special needs families.',
        'Exsubsecretario general de las Naciones Unidas y autor galardonado de más de veinte libros. Nos comparte por qué la inclusión y el apoyo comunitario son importantes para las familias con necesidades especiales.'
    ),
};

export const MESSAGE_VIDEOS: VideoItem[] = [
    { id: 'RU19wqmEDW4', title: tr('A word from our CEO', 'Unas palabras de nuestra directora ejecutiva') },
];

export const WEBINAR_VIDEOS: VideoItem[] = [
    { id: 'l4dxLMQcJbg', title: 'Soma Mukhopadhyay', caption: tr('Founder of the RPM · Webinar Series, Part 1', 'Fundadora del RPM · Serie de seminarios web, parte 1') },
    { id: 'j4FATCVtsxo', title: 'Diane Berger, MA, BCBA, LBA', caption: tr('Webinar Series', 'Serie de seminarios web') },
    { id: '1vR4evQTHcg', title: 'Dr. Kate Roche', caption: tr('Autism Acceptance Month webinar series', 'Serie de seminarios web del Mes de la Aceptación del Autismo') },
    { id: 'O7KFzASkmaA', title: 'Dr. Luke Beardon', caption: tr('Webinar Series', 'Serie de seminarios web') },
];

// Every video, in the order shown on /videos. The Home teaser rotates through all of them.
export const ALL_VIDEOS: VideoItem[] = [FEATURED_VIDEO, ...MESSAGE_VIDEOS, ...WEBINAR_VIDEOS];
