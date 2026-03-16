import { differenceInWeeks, addWeeks, startOfWeek } from 'date-fns';

const SEASON_LENGTH_WEEKS = 2;
// A fixed epoch for seasons to start from
const SEASON_EPOCH = new Date('2026-01-01T00:00:00Z');

export interface SeasonInfo {
  id: string; // e.g. "2026-S5"
  name: string;
  startDate: string;
  endDate: string;
  daysRemaining: number;
}

export function getCurrentSeason(): SeasonInfo {
  const now = new Date();
  const epochStart = startOfWeek(SEASON_EPOCH, { weekStartsOn: 1 }); // Start on Monday
  const weeksSinceEpoch = differenceInWeeks(now, epochStart);
  const currentSeasonNumber = Math.floor(weeksSinceEpoch / SEASON_LENGTH_WEEKS) + 1;
  
  const seasonStart = addWeeks(epochStart, (currentSeasonNumber - 1) * SEASON_LENGTH_WEEKS);
  const seasonEnd = addWeeks(seasonStart, SEASON_LENGTH_WEEKS);
  
  const remainingMillis = Math.max(0, seasonEnd.getTime() - now.getTime());
  const daysRemaining = Math.max(0, Math.floor(remainingMillis / (1000 * 60 * 60 * 24)));

  return {
    id: `${seasonStart.getFullYear()}-S${currentSeasonNumber}`,
    name: `Sezon ${currentSeasonNumber}`,
    startDate: seasonStart.toISOString(),
    endDate: seasonEnd.toISOString(),
    daysRemaining
  };
}
