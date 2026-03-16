import { create } from 'zustand';
import type { CellData, GameMode, GridConfig, Difficulty } from '../types/game';
import { generateGrid } from '../utils/gridGenerator';
import { playPop, playUnpop, playError, playSuccess, triggerHapticPop, triggerHapticError, triggerHapticSuccess } from '../utils/audioHaptics';

interface GameState {
  level: number;
  boardSize: number;
  cells: CellData[][];
  rowTargets: number[];
  colTargets: number[];
  gameMode: GameMode;
  difficulty: Difficulty;
  status: 'playing' | 'won' | 'lost';
  timeLeft: number | null;
  scoreCount: number;
  isShaking: boolean;
  hintsLeft: number;
  matchId: string | null;
  opponent: { displayName: string, uid?: string, photoURL?: string, frame?: string } | null;
  matchProgress: number;
  
  // Actions
  toggleCell: (row: number, col: number) => void;
  checkWinCondition: () => void;
  startLevel: (levelNumber: number, mode?: GameMode, diff?: Difficulty) => void;
  startDuello: (matchId: string, opponentName: string, seed: string, opponentUid?: string, photoURL?: string, frame?: string) => void;
  resetGrid: () => void;
  useHint: () => void;
  decrementTimeLeft: () => void;
  setShaking: (shaking: boolean) => void;
}

const getLevelConfig = (level: number, difficulty: Difficulty): GridConfig => {
  if (difficulty === 'easy') {
    return { size: 3, maxValue: 5, negativeChance: 0, lockChance: 0, unknownChance: 0 };
  }
  if (difficulty === 'medium') {
    return { size: 4, maxValue: 9, negativeChance: 0.1, lockChance: 0, unknownChance: 0 };
  }
  if (difficulty === 'hard') {
    return { size: 5, maxValue: 15, negativeChance: 0.2, lockChance: 0.15, unknownChance: 0.1 };
  }

  // Progressive difficulty
  let size = 3;
  let maxValue = 3;
  let negativeChance = 0;
  let lockChance = 0;
  let unknownChance = 0;

  // Grid Size Progression
  if (level >= 3) size = 4;
  if (level >= 8) size = 5;
  if (level >= 15) size = 6;
  if (level >= 25) size = 7;

  // Max Value Progression
  if (level === 2) maxValue = 5;
  if (level >= 3) maxValue = 9;
  if (level >= 10) maxValue = 12;
  if (level >= 18) maxValue = 15;
  if (level >= 30) maxValue = 20;

  // Negative Chance Progression (Starts at roughly lvl 5)
  if (level >= 5) {
    negativeChance = Math.min(0.25, 0.05 + ((level - 5) * 0.01));
  }
  
  // Lock Chance Progression (Starts at lvl 8)
  if (level >= 8) {
    lockChance = Math.min(0.15, 0.03 + ((level - 8) * 0.01));
  }
  
  // Unknown Chance Progression (Question marks, starts at lvl 12)
  if (level >= 12) {
    unknownChance = Math.min(0.15, 0.03 + ((level - 12) * 0.01));
  }

  return {
    size,
    maxValue,
    negativeChance,
    lockChance,
    unknownChance,
  };
};

export const useGameStore = create<GameState>((set, get) => ({
  level: 1,
  boardSize: 3,
  cells: [],
  rowTargets: [],
  colTargets: [],
  gameMode: 'offline',
  difficulty: 'progressive',
  status: 'playing',
  timeLeft: null,
  scoreCount: 0,
  isShaking: false,
  hintsLeft: 1,
  matchId: null,
  opponent: null,
  matchProgress: 0,

  decrementTimeLeft: () => {
    const { timeLeft, status } = get();
    if (status !== 'playing' || timeLeft === null) return;
    
    if (timeLeft <= 1) {
      set({ timeLeft: 0, status: 'lost' }); // Time's up
      playError();
      import('./userStore').then(module => {
         const { useUserStore } = module;
         const { user, updateScore } = useUserStore.getState();
         if (user && get().scoreCount > 0) {
           updateScore(get().scoreCount, get().level, 'time_attack');
         }
      });
    } else {
      set({ timeLeft: timeLeft - 1 });
    }
  },

  setShaking: (isShaking) => set({ isShaking }),

  toggleCell: (row, col) => {
    const { cells, status } = get();
    if (status !== 'playing') return;

    const cell = cells[row][col];
    if (cell.type === 'locked') {
      playError();
      triggerHapticError();
      set({ isShaking: true });
      setTimeout(() => set({ isShaking: false }), 400); // Remove shake after animation (0.4s)
      return;
    }

    const newCells = cells.map(r => [...r]);
    const newState = cell.state === 'active' ? 'passive' : 'active';
    
    newCells[row][col] = {
      ...cell,
      state: newState
    };

    // Audio & Haptic response
    if (newState === 'active') {
       playPop();
       triggerHapticPop();
    } else {
       playUnpop();
       triggerHapticPop();
    }

    set({ cells: newCells });
    get().checkWinCondition();
  },

  checkWinCondition: () => {
    const { cells, rowTargets, colTargets, boardSize } = get();
    let isWon = true;

    let correctCount = 0;

    for (let r = 0; r < boardSize; r++) {
      let rowSum = 0;
      for (let c = 0; c < boardSize; c++) {
        if (cells[r][c].state === 'active') {
          rowSum += cells[r][c].value;
        }
      }
      if (rowSum === rowTargets[r]) correctCount++;
      else isWon = false;
    }

    for (let c = 0; c < boardSize; c++) {
      let colSum = 0;
      for (let r = 0; r < boardSize; r++) {
        if (cells[r][c].state === 'active') {
          colSum += cells[r][c].value;
        }
      }
      if (colSum === colTargets[c]) correctCount++;
      else isWon = false;
    }

    set({ matchProgress: correctCount });

    if (isWon) {
      playSuccess();
      triggerHapticSuccess();
      const points = boardSize * 100;
      
      const { gameMode } = get();
      
      if (gameMode === 'time_attack') {
         // In time attack, do not show victory screen, just play confetti maybe later, add time and loop
         set(state => ({ 
            timeLeft: (state.timeLeft || 0) + 10, 
            scoreCount: state.scoreCount + points 
         }));
         // Delay very slightly for feel, then restart
         setTimeout(() => {
           get().startLevel(get().level + 1, gameMode, get().difficulty);
         }, 300);

         // Increment time attack quests
         import('./userStore').then(module => {
            const { useUserStore } = module;
            if (useUserStore.getState().user) {
               useUserStore.getState().updateQuestProgress('play_time_attack');
               useUserStore.getState().updateQuestProgress('play_level');
            }
         });
      } else if (gameMode === 'duello') {
         // Stop the game, GameScreen will handle firebase update
         set({ status: 'won' });

         // Increment online match quests
         import('./userStore').then(module => {
            const { useUserStore } = module;
            if (useUserStore.getState().user) {
               useUserStore.getState().updateQuestProgress('play_online');
               useUserStore.getState().updateQuestProgress('win_online');
               useUserStore.getState().updateQuestProgress('play_level');
            }
         });
      } else {
         // Normal modes/daily
         set({ status: 'won' });
         
         import('./userStore').then(module => {
            const { useUserStore } = module;
            const { user, updateScore, updateCoins, updateQuestProgress } = useUserStore.getState();
            if (user) {
              // Update generic playtime/level quests
              updateQuestProgress('play_level');

              if (gameMode === 'online') {
                updateScore(points, get().level, get().difficulty);
                updateCoins(10); // Standard victory coins
              }
              if (gameMode === 'daily') {
                updateScore(points, 1, 'daily');
                updateCoins(50); // Daily chunk of coins
                updateQuestProgress('play_daily');
              }
            }
         });
      }
    }
  },

  startDuello: (matchId, opponentName, seed, opponentUid?, photoURL?, frame?) => {
    // A standard medium level but fully seeded
    const config = { ...getLevelConfig(1, 'medium'), seed };
    const { cells, rowTargets, colTargets } = generateGrid(config);

    set({
      level: 1,
      boardSize: config.size,
      cells,
      rowTargets,
      colTargets,
      status: 'playing',
      difficulty: 'medium',
      gameMode: 'duello',
      matchId,
      opponent: { displayName: opponentName, uid: opponentUid, photoURL, frame },
      matchProgress: 0,
      timeLeft: null, // We could add a time limit to duello later
      scoreCount: 0,
      hintsLeft: 0 // No hints in duello
    });
  },

  startLevel: (levelNumber, mode, diff) => {
    const selectedMode = mode || get().gameMode;
    const selectedDifficulty = diff || get().difficulty;
    
    // For Daily Challenge, always use 'medium' difficulty sizing via a seed
    const effectiveDifficulty = selectedMode === 'daily' ? 'medium' : selectedDifficulty;
    let config = getLevelConfig(levelNumber, effectiveDifficulty);
    
    if (selectedMode === 'daily') {
       const today = new Date().toISOString().split('T')[0];
       config = { ...config, seed: today, unknownChance: 0.1, negativeChance: 0.2 }; // Override for daily excitement
    }
    
    const { cells, rowTargets, colTargets } = generateGrid(config);
    
    set({
      level: levelNumber,
      boardSize: config.size,
      cells,
      rowTargets,
      colTargets,
      status: 'playing',
      difficulty: selectedDifficulty,
      gameMode: selectedMode,
      hintsLeft: 1, // Only 1 hint per level for normal modes
      ...(selectedMode === 'time_attack' && levelNumber === 1 && { timeLeft: 60, scoreCount: 0 })
    });
  },

  resetGrid: () => {
    const { cells } = get();
    const resetCells = cells.map(row => 
      row.map(cell => ({
        ...cell,
        state: cell.type === 'locked' ? cell.solutionState : 'passive' as const
      }))
    );
    set({ cells: resetCells, status: 'playing' });
  },

  useHint: () => {
    const { cells, status, hintsLeft, gameMode } = get();
    if (status !== 'playing' || hintsLeft <= 0 || gameMode === 'duello') return;

    // Find a cell that is not in its solution state
    const wrongCells: {r: number, c: number}[] = [];
    cells.forEach((row, r) => {
      row.forEach((cell, c) => {
        if (cell.type !== 'locked' && cell.state !== cell.solutionState) {
          wrongCells.push({r, c});
        }
      });
    });

    if (wrongCells.length > 0) {
      const randomHint = wrongCells[Math.floor(Math.random() * wrongCells.length)];
      const newCells = cells.map(r => [...r]);
      const cell = newCells[randomHint.r][randomHint.c];
      
      newCells[randomHint.r][randomHint.c] = {
        ...cell,
        state: cell.solutionState,
        type: 'locked' // Lock it so they can't mess it up
      };

      set({ cells: newCells, hintsLeft: hintsLeft - 1 });
      get().checkWinCondition();
    }
  }
}));
