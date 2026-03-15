import React from 'react';
import clsx from 'clsx';
import type { CellData } from '../types/game';
import { useGameStore } from '../store/gameStore';
import { Lock } from 'lucide-react';

interface CellProps {
  data: CellData;
}

export const Cell: React.FC<CellProps> = ({ data }) => {
  const toggleCell = useGameStore(state => state.toggleCell);
  const boardSize = useGameStore(state => state.boardSize);

  const isActive = data.state === 'active';
  const isLocked = data.type === 'locked';
  const isNegative = data.type === 'negative';
  const isUnknown = data.type === 'unknown';

  let displayValue = Math.abs(data.value).toString();
  if (isUnknown) displayValue = '?';

  const isLargeBoard = boardSize > 4;
  const isHugeBoard = boardSize > 5;

  const textSizeClass = 
    isHugeBoard ? 'text-lg sm:text-xl rounded-lg' :
    isLargeBoard ? 'text-xl sm:text-2xl rounded-xl' :
    boardSize === 4 ? 'text-3xl sm:text-4xl rounded-[1rem]' :
    'text-4xl sm:text-5xl rounded-[1.25rem]';

  const badgeSize = 
    isHugeBoard ? 'w-2.5 h-2.5 text-[8px] bottom-1 right-1' :
    isLargeBoard ? 'w-4 h-4 text-[10px] bottom-1.5 right-1.5' :
    'w-5 h-5 text-xs bottom-2 right-2';

  const lockSize = 
    isHugeBoard ? 'w-2 h-2 top-1 right-1' :
    isLargeBoard ? 'w-2.5 h-2.5 top-1.5 right-1.5' :
    'w-3.5 h-3.5 top-2 right-2';

  return (
    <button
      onClick={() => toggleCell(data.row, data.col)}
      disabled={isLocked}
      className={clsx(
        'grid-cell neo-button relative flex items-center justify-center font-display font-bold w-full select-none',
        'aspect-square shadow-sm border border-white/[0.05] overflow-hidden',
        textSizeClass,
        
        // Passive state (Unselected, elevated)
        !isActive && 'bg-surface text-textMuted hover:bg-surfaceAlt',
        
        // Active state (Emerald or Rose, pushed in a bit with inner shadow)
        isActive && !isNegative && !isLocked && 'bg-primary text-white shadow-[inset_0_2px_10px_rgba(0,0,0,0.2)]',
        isActive && isNegative && 'bg-danger text-white shadow-[inset_0_2px_10px_rgba(0,0,0,0.2)]',
        
        // Locked state overrides
        isLocked && isActive && 'bg-surfaceAlt text-textMain cursor-not-allowed opacity-80',
        isLocked && !isActive && 'bg-bgStart text-textMuted/30 cursor-not-allowed border-black/50',

        // Scaling effect
        isActive ? 'scale-[0.96]' : 'scale-100 hover:scale-[1.02]'
      )}
    >
      <span className={clsx("relative z-10 drop-shadow-md", isActive && "translate-y-[1px]")}>{displayValue}</span>

      {isLocked && (
        <Lock fill="currentColor" className={clsx("absolute text-textMain/20", lockSize)} />
      )}
      {isNegative && (
        <div className={clsx(
          "absolute flex items-center justify-center rounded-full",
          badgeSize,
          isActive ? "bg-black/20 text-white" : "bg-danger/20 text-danger"
        )}>
          <span className="absolute font-bold" style={{ marginTop: '-1px' }}>−</span>
        </div>
      )}
    </button>
  );
};
