export type QuestAction = 'play_level' | 'play_time_attack' | 'play_online' | 'win_online' | 'play_daily';

export interface QuestTemplate {
  id: string;
  action: QuestAction;
  target: number;
  reward: number;
  label: string;
}

export const DAILY_QUEST_POOL: QuestTemplate[] = [
  { id: 'd_play_3', action: 'play_level', target: 3, reward: 50, label: '3 bölüm tamamla' },
  { id: 'd_play_5', action: 'play_level', target: 5, reward: 80, label: '5 bölüm tamamla' },
  { id: 'd_time_1', action: 'play_time_attack', target: 1, reward: 60, label: '1 Zamana Karşı oyna' },
  { id: 'd_time_3', action: 'play_time_attack', target: 3, reward: 150, label: '3 Zamana Karşı oyna' },
  { id: 'd_online_1', action: 'play_online', target: 1, reward: 100, label: '1 çevrimiçi maç yap' },
  { id: 'd_online_win_1', action: 'win_online', target: 1, reward: 150, label: '1 çevrimiçi maç kazan' },
  { id: 'd_daily_1', action: 'play_daily', target: 1, reward: 100, label: 'Günün Sorusunu oyna' }
];

export const WEEKLY_QUEST_POOL: QuestTemplate[] = [
  { id: 'w_play_20', action: 'play_level', target: 20, reward: 400, label: '20 bölüm tamamla' },
  { id: 'w_play_50', action: 'play_level', target: 50, reward: 800, label: '50 bölüm tamamla' },
  { id: 'w_time_5', action: 'play_time_attack', target: 5, reward: 300, label: '5 Zamana Karşı oyna' },
  { id: 'w_time_15', action: 'play_time_attack', target: 15, reward: 800, label: '15 Zamana Karşı oyna' },
  { id: 'w_online_5', action: 'play_online', target: 5, reward: 500, label: '5 çevrimiçi maç yap' },
  { id: 'w_online_15', action: 'play_online', target: 15, reward: 1000, label: '15 çevrimiçi maç yap' },
  { id: 'w_online_win_3', action: 'win_online', target: 3, reward: 600, label: '3 çevrimiçi maç kazan' },
  { id: 'w_online_win_10', action: 'win_online', target: 10, reward: 1500, label: '10 çevrimiçi maç kazan' },
  { id: 'w_daily_5', action: 'play_daily', target: 5, reward: 800, label: '5 kez Günün Sorusunu oyna' }
];

// Seeded random helper
function getSeededRandom(seed: number) {
  let t = seed += 0x6D2B79F5;
  t = Math.imul(t ^ t >>> 15, t | 1);
  t ^= t + Math.imul(t ^ t >>> 7, t | 61);
  return ((t ^ t >>> 14) >>> 0) / 4294967296;
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = Math.imul(31, hash) + str.charCodeAt(i) | 0;
  }
  return hash;
}

// Generate quests deterministically
export function getDailyQuests(uid: string, dateStr: string): QuestTemplate[] {
  const hash = hashString(uid + dateStr);
  
  // pick 3 unique random
  const pool = [...DAILY_QUEST_POOL];
  const selected: QuestTemplate[] = [];
  for (let i = 0; i < 3; i++) {
     const rng = getSeededRandom(hash + i * 10);
     const idx = Math.floor(rng * pool.length);
     selected.push(pool.splice(idx, 1)[0]);
  }
  return selected.sort((a,b) => a.reward - b.reward);
}

export function getWeeklyQuests(uid: string, weekStr: string): QuestTemplate[] {
  const hash = hashString(uid + weekStr + "weekly");
  
  // pick 3 unique random
  const pool = [...WEEKLY_QUEST_POOL];
  const selected: QuestTemplate[] = [];
  for (let i = 0; i < 3; i++) {
     const rng = getSeededRandom(hash + i * 10);
     const idx = Math.floor(rng * pool.length);
     selected.push(pool.splice(idx, 1)[0]);
  }
  return selected.sort((a,b) => a.reward - b.reward);
}
