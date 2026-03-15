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

  const isActive = data.state === 'active';
  const isLocked = data.type === 'locked';
  const isNegative = data.type === 'negative';
  const isUnknown = data.type === 'unknown';

  let displayValue = data.value.toString();
  if (isUnknown) displayValue = '?';

  return (
    <button
      onClick={() => toggleCell(data.row, data.col)}
      disabled={isLocked}
      className={clsx(
        'grid-cell neo-button relative flex items-center justify-center font-display font-bold w-full select-none rounded-[1.25rem]',
        'aspect-square text-3xl sm:text-4xl shadow-sm border border-white/[0.05]',
        
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
        <Lock fill="currentColor" className="absolute top-2 right-2 w-3.5 h-3.5 text-textMain/20" />
      )}
      {isNegative && (
        <div className={clsx(
          "absolute bottom-2 right-2 flex items-center justify-center w-5 h-5 rounded-full",
           isActive ? "bg-black/20 text-white" : "bg-danger/20 text-danger"
        )}>
          <span className="text-xs absolute -mt-0.5 font-bold">−</span>
        </div>
      )}
    </button>
  );
};
