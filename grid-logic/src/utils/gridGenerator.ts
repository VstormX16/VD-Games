import type { CellData, GridConfig, LevelData, CellType, CellState } from '../types/game';

export function generateGrid(config: GridConfig): LevelData {
  const { size, maxValue, negativeChance, lockChance, unknownChance } = config;
  const cells: CellData[][] = [];
  const rowTargets = new Array(size).fill(0);
  const colTargets = new Array(size).fill(0);
  
  // 1. Generate values and intended solution state
  for (let r = 0; r < size; r++) {
    cells[r] = [];
    for (let c = 0; c < size; c++) {
      let value = Math.floor(Math.random() * maxValue) + 1;
      let type: CellType = 'normal';
      
      // Negative modules
      if (negativeChance > 0 && Math.random() < negativeChance) {
        type = 'negative';
        value = -(Math.floor(Math.random() * Math.min(maxValue, 5)) + 1);
      }

      // Determine the solution state for this cell
      const isSolutionActive: CellState = Math.random() > 0.4 ? 'active' : 'passive';
      
      // Determine if locked or unknown
      // Cannot be both locked and unknown for fairness generally
      if (lockChance > 0 && Math.random() < lockChance) {
        type = 'locked';
      } else if (unknownChance > 0 && Math.random() < unknownChance) {
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
