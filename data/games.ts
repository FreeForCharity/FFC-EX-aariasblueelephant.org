import cards from './games.json';

// The games registry. data/games.json is the single source of truth: the
// Dashboard and the public /games page import it here, and the build publishes
// it verbatim as /games-catalog.json so the MOBILE APP's launcher can discover
// games added after the app shipped (no store update needed).
export type GameCard = { id: string; title: string; emoji: string; oneLiner: string; oneLiner_es?: string; img: string; view?: string; path?: string };

export const GAME_CARDS: GameCard[] = cards as GameCard[];
