export const isEs = () => { try { return localStorage.getItem('abe.lang') === 'es'; } catch { return false; } };
export const tr = (en: string, es: string) => (isEs() ? es : en);
export const toggleLang = () => { try { localStorage.setItem('abe.lang', isEs() ? 'en' : 'es'); } catch {} location.reload(); };
export const langLabel = () => (isEs() ? '🌐 English' : '🌐 Español');
