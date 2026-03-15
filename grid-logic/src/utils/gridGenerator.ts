import type { CellData, GridConfig, LevelData, CellType, CellState } from '../types/game';

// Simple seeded PRNG (xorshift)
const getSeededRandom = (seedStr: string) => {
  let h = 0xdeadbeef;
  for(let i = 0; i < seedStr.length; i++)
      h = Math.imul(h ^ seedStr.charCodeAt(i), 2654435761);
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h ^= h >>> 13;
  
  // Guard against 0 state
  let state = h === 0 ? 1 : h;
  return function() {
      state ^= state << 13;
      state ^= state >>> 17;
      state ^= state << 5;
      // Convert to unsigned 32-bit and divide by its max value to get [0, 1) range
      return (state >>> 0) / 4294967296;
  }
};

export function generateGrid(config: GridConfig): LevelData {
  const { size, maxValue, negativeChance, lockChance, unknownChance, seed } = config;
  
  const rand = seed ? getSeededRandom(seed) : Math.random;

  const cells: CellData[][] = [];
  const rowTargets = new Array(size).fill(0);
  const colTargets = new Array(size).fill(0);
  
  // 1. Generate values and intended solution state
  for (let r = 0; r < size; r++) {
    cells[r] = [];
    for (let c = 0; c < size; c++) {
      let value = Math.floor(rand() * maxValue) + 1;
      let type: CellType = 'normal';
      
      // Negative modules
      if (negativeChance > 0 && rand() < negativeChance) {
        type = 'negative';
        value = -(Math.floor(rand() * Math.min(maxValue, 5)) + 1);
      }

      // Determine the solution state for this cell
      const isSolutionActive: CellState = rand() > 0.4 ? 'active' : 'passive';
      
      // Determine if locked or unknown
      // Cannot be both locked and unknown for fairness generally
      if (lockChance > 0 && rand() < lockChance) {
        type = 'locked';
      } else if (unknownChance > 0 && rand() < unknownChance) {
        type = 'unknown';
      }

      cells[r][c] = {
        id: `${r}-${c}`,
        row: r,
        col: c,
        value,
        type,
        // Locked cells reveal their solution state early. Others start passive.
        state: type === 'locked' ? isSolutionActive : 'passive',
        solutionState: isSolutionActive,
      };

      // Accumulate targets based on the *intended* solution
      if (isSolutionActive === 'active') {
        rowTargets[r] += value;
        colTargets[c] += value;
      }
    }
  }

  return {
    cells,
    rowTargets,
    colTargets,
  };
}
