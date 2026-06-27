export interface BeluMemory {
  playerName: string | null;
  visitCount: number;
  lastVisit: string | null;
  zonesVisited: string[];
  lastZone: string | null;
  skillsPracticed: { zone: string; count: number }[];
  personalityStage: 0 | 1 | 2 | 3;
  preferredZone: string | null;
  totalInteractions: number;
  achievements: string[];
  recentMoments: string[];
  beluMistakeCount: number;
}

const KEY = 'belus_world_memory_v1';

const defaults: BeluMemory = {
  playerName: null,
  visitCount: 0,
  lastVisit: null,
  zonesVisited: [],
  lastZone: null,
  skillsPracticed: [],
  personalityStage: 0,
  preferredZone: null,
  totalInteractions: 0,
  achievements: [],
  recentMoments: [],
  beluMistakeCount: 0,
};

export function loadMemory(): BeluMemory {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...defaults };
    return { ...defaults, ...JSON.parse(raw) };
  } catch {
    return { ...defaults };
  }
}

export function saveMemory(m: BeluMemory): void {
  try { localStorage.setItem(KEY, JSON.stringify(m)); } catch { /* silent */ }
}

export function recordVisit(m: BeluMemory): BeluMemory {
  const visitCount = m.visitCount + 1;
  const personalityStage: 0 | 1 | 2 | 3 =
    visitCount >= 16 ? 3 : visitCount >= 8 ? 2 : visitCount >= 3 ? 1 : 0;
  const updated = { ...m, visitCount, personalityStage, lastVisit: new Date().toISOString() };
  saveMemory(updated);
  return updated;
}

export function recordZoneVisit(m: BeluMemory, zone: string): BeluMemory {
  const zonesVisited = m.zonesVisited.includes(zone) ? m.zonesVisited : [...m.zonesVisited, zone];
  const skillsPracticed = [...m.skillsPracticed];
  const entry = skillsPracticed.find(s => s.zone === zone);
  if (entry) entry.count++;
  else skillsPracticed.push({ zone, count: 1 });
  const preferredZone = skillsPracticed.reduce(
    (best, curr) => !best || curr.count > (skillsPracticed.find(s => s.zone === best)?.count ?? 0) ? curr.zone : best,
    m.preferredZone
  );
  const updated = { ...m, zonesVisited, lastZone: zone, skillsPracticed, preferredZone, totalInteractions: m.totalInteractions + 1 };
  saveMemory(updated);
  return updated;
}

export function recordMoment(m: BeluMemory, moment: string): BeluMemory {
  const recentMoments = [moment, ...m.recentMoments].slice(0, 5);
  const updated = { ...m, recentMoments };
  saveMemory(updated);
  return updated;
}

export function recordMistake(m: BeluMemory): BeluMemory {
  const updated = { ...m, beluMistakeCount: m.beluMistakeCount + 1 };
  saveMemory(updated);
  return updated;
}

export function addAchievement(m: BeluMemory, achievement: string): BeluMemory {
  if (m.achievements.includes(achievement)) return m;
  const updated = { ...m, achievements: [...m.achievements, achievement] };
  saveMemory(updated);
  return updated;
}

export function setPlayerName(m: BeluMemory, name: string): BeluMemory {
  const updated = { ...m, playerName: name.trim() || null };
  saveMemory(updated);
  return updated;
}
