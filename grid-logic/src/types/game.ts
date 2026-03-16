export type CellState = 'active' | 'passive';
export type CellType = 'normal' | 'negative' | 'locked' | 'unknown';
export type GameMode = 'offline' | 'online' | 'daily' | 'time_attack' | 'duello';
export type Difficulty = 'easy' | 'medium' | 'hard' | 'progressive' | 'time_attack' | 'daily';
export type AppView = 'menu' | 'auth' | 'game' | 'leaderboard' | 'profile' | 'guide' | 'shop' | 'settings' | 'matchmaking' | 'quests';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  scores: Record<Difficulty, number>;
  levels: Record<Difficulty, number>;
  coins: number;
  trophies?: number;
  inventory?: string[]; // IDs of purchased items
  equipped?: Record<string, string>; // Category -> Item ID
  totalScore?: number; // legacy
  highestLevel?: number; // legacy
  lastLoginDate?: string; // ISO date string YYYY-MM-DD
  loginStreak?: number;
  playtimeSeconds?: number; // Total seconds played
  playtimeRewardClaimed?: number; // seconds at which last reward was claimed
  dailyQuestsDate?: string; // ISO date string to reset quests
  dailyQuestsProgress?: Record<string, number>; // questId -> progress count
  weeklyQuestsDate?: string; // ISO week string to reset weekly quests
  weeklyQuestsProgress?: Record<string, number>; // questId -> progress count
}

export interface CellData {
  id: string;
  row: number;
  col: number;
  value: number; // Positive for normal, negative for 'negative' type
  state: CellState;
  type: CellType;
  solutionState: CellState; // Intended state for guaranteed solvability
}

export interface GridConfig {
  size: number;
  maxValue: number;
  negativeChance: number;
  lockChance: number;
  unknownChance: number;
  seed?: string;
}

export interface LevelData {
  cells: CellData[][];
  rowTargets: number[];
  colTargets: number[];
}
