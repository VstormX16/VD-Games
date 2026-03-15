import React from 'react';
import clsx from 'clsx';
import { useGameStore } from '../store/gameStore';
import { Cell } from './Cell';

export const Grid: React.FC = () => {
  const { cells, rowTargets, colTargets, boardSize, isShaking } = useGameStore();

  if (cells.length === 0) return null;

  const rowSums = new Array(boardSize).fill(0);
  const colSums = new Array(boardSize).fill(0);

  for (let r = 0; r < boardSize; r++) {
    for (let c = 0; c < boardSize; c++) {
      if (cells[r][c].state === 'active') {
        rowSums[r] += cells[r][c].value;
        colSums[c] += cells[r][c].value;
      }
    }
  }

  // Dynamic layout sizing based on board size to prevent squishing
  const isLargeBoard = boardSize > 4;
  const isHugeBoard = boardSize > 5;

  const getTargetSizeClass = () => {
    if (isHugeBoard) return "w-8 h-8 text-sm rounded-lg sm:w-10 sm:h-10 sm:text-base";
    if (isLargeBoard) return "w-10 h-10 text-lg rounded-xl sm:w-12 sm:h-12 sm:text-xl";
    return "w-12 h-12 text-2xl rounded-2xl";
  };

  const getTargetColWidth = () => {
    if (isHugeBoard) return "2.5rem"; // 40px
    if (isLargeBoard) return "3rem";  // 48px
    return "3.5rem";                  // 56px
  };

  const gapClass = isHugeBoard ? "gap-1.5 sm:gap-2" : isLargeBoard ? "gap-2 sm:gap-3" : "gap-3 sm:gap-4";
  const paddingClass = isHugeBoard ? "p-2 sm:p-4" : "p-4 sm:p-6";

  return (
    <div className={clsx("flex flex-col items-center justify-center w-full max-w-md mx-auto px-2 sm:p-4", isShaking ? "animate-shake" : "animate-pop")}>
      <div className={clsx("bg-white/[0.02] rounded-[2rem] border border-white/[0.05] shadow-2xl w-full backdrop-blur-sm", paddingClass)}>
        <div 
          className={clsx("w-full grid justify-items-center relative", gapClass)}
          style={{ 
            gridTemplateColumns: `repeat(${boardSize}, minmax(0, 1fr)) ${getTargetColWidth()}`
          }}
        >
          {cells.map((row, r) => (
            <React.Fragment key={`row-${r}`}>
              {/* Row Cells */}
              {row.map((cell) => (
                <div key={cell.id} className="w-full h-full flex items-center justify-center">
                   <Cell data={cell} />
                </div>
              ))}
              
              {/* Row Target Indicator (Right side of row) */}
              <div className="flex flex-col items-center justify-center ml-1">
                <div className={clsx(
                  "flex items-center justify-center font-display font-bold transition-all duration-300",
                  getTargetSizeClass(),
                  rowSums[r] === rowTargets[r] 
                    ? "bg-primary/20 text-primary border-2 border-primary/50 shadow-[0_0_15px_rgba(16,185,129,0.3)]" 
                    : rowSums[r] > rowTargets[r] 
                      ? "bg-danger/10 text-danger border border-danger/20"
                      : "bg-surface text-white border border-white/10"
                )}>
                  {rowTargets[r]}
                </div>
                {!isHugeBoard && (
                   <div className="flex items-center gap-1 mt-1 opacity-80 transistion-colors">
                      <span className={clsx(
                        "text-[10px] sm:text-xs font-mono font-bold tracking-widest",
                         rowSums[r] === rowTargets[r] && "text-primary",
                         rowSums[r] > rowTargets[r] ? "text-danger" : "text-textMuted"
                      )}>{rowSums[r]}</span>
                   </div>
                )}
              </div>
            </React.Fragment>
          ))}

          {/* Column Targets (Bottom Row) */}
          {colTargets.map((target, c) => (
            <div key={`col-${c}`} className="flex flex-col items-center justify-center mt-1 w-full h-full">
               <div className={clsx(
                  "flex items-center justify-center w-full aspect-square max-w-[4rem] font-display font-bold transition-all duration-300",
                  getTargetSizeClass(),
                  colSums[c] === target 
                    ? "bg-primary/20 text-primary border-2 border-primary/50 shadow-[0_0_15px_rgba(16,185,129,0.3)]" 
                    : colSums[c] > target 
                      ? "bg-danger/10 text-danger border border-danger/20"
                      : "bg-surface text-white border border-white/10"
                )}>
                  {target}
                </div>
                {!isHugeBoard && (
                   <div className="flex items-center gap-1 mt-1 opacity-80 transition-colors">
                      <span className={clsx(
                        "text-[10px] sm:text-xs font-mono font-bold tracking-widest",
                         colSums[c] === target && "text-primary",
                         colSums[c] > target ? "text-danger" : "text-textMuted"
                      )}>{colSums[c]}</span>
                   </div>
                )}
            </div>
          ))}
          {/* Empty bottom-right corner block for spacing */}
          <div />
        </div>
      </div>
    </div>
  );
};
