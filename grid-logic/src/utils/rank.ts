import { Shield, Star, Crown } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface RankInfo {
  name: string;
  min: number;
  max: number;
  color: string;
  bg: string;
  border: string;
  glow: string;
  icon: LucideIcon;
  progressPercentage?: number;
  seasonReward: number;
}

export const RANK_THRESHOLDS: RankInfo[] = [
  { name: 'Radyant', min: 5000, max: 99999, color: 'text-amber-300', bg: 'bg-amber-500/10', border: 'border-amber-500/30', glow: 'shadow-[0_0_25px_rgba(252,211,77,0.6)]', icon: Crown as unknown as LucideIcon, seasonReward: 10000 },
  { name: 'Immortal', min: 3000, max: 5000, color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/30', glow: 'shadow-[0_0_20px_rgba(244,63,94,0.5)]', icon: Crown as unknown as LucideIcon, seasonReward: 5000 },
  { name: 'Yücelik', min: 1500, max: 3000, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30', glow: 'shadow-[0_0_20px_rgba(168,85,247,0.5)]', icon: Crown as unknown as LucideIcon, seasonReward: 2500 },
  { name: 'Elmas', min: 1000, max: 1500, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', glow: 'shadow-[0_0_15px_rgba(34,211,238,0.3)]', icon: Shield as unknown as LucideIcon, seasonReward: 1000 },
  { name: 'Platin', min: 600, max: 1000, color: 'text-teal-400', bg: 'bg-teal-500/10', border: 'border-teal-500/30', glow: 'shadow-[0_0_15px_rgba(45,212,191,0.3)]', icon: Shield as unknown as LucideIcon, seasonReward: 500 },
  { name: 'Altın', min: 300, max: 600, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', glow: 'shadow-[0_0_15px_rgba(250,204,21,0.3)]', icon: Star as unknown as LucideIcon, seasonReward: 250 },
  { name: 'Gümüş', min: 100, max: 300, color: 'text-gray-300', bg: 'bg-gray-400/10', border: 'border-gray-400/30', glow: 'shadow-[0_0_10px_rgba(209,213,219,0.2)]', icon: Shield as unknown as LucideIcon, seasonReward: 100 },
  { name: 'Bronz', min: 0, max: 100, color: 'text-orange-700', bg: 'bg-orange-900/10', border: 'border-orange-900/30', glow: '', icon: Shield as unknown as LucideIcon, seasonReward: 50 }
];

export const getLeagueInfo = (trophies: number): RankInfo => {
  const currentRankIndex = RANK_THRESHOLDS.findIndex(r => trophies >= r.min);
  const rankInfo = currentRankIndex !== -1 ? RANK_THRESHOLDS[currentRankIndex] : RANK_THRESHOLDS[RANK_THRESHOLDS.length - 1];
  
  let progressPercentage = 100;
  if (currentRankIndex > 0) {
     const currentLevelMin = rankInfo.min;
     const nextLevelMin = RANK_THRESHOLDS[currentRankIndex - 1].min;
     const pointsInLevel = trophies - currentLevelMin;
     const pointsRequired = nextLevelMin - currentLevelMin;
     progressPercentage = Math.min(100, Math.max(0, (pointsInLevel / pointsRequired) * 100));
  }

  return { ...rankInfo, progressPercentage };
};
