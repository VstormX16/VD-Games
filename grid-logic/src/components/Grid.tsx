import React from 'react';
import clsx from 'clsx';
import { useGameStore } from '../store/gameStore';
import { Cell } from './Cell';

export const Grid: React.FC = () => {
  const { cells, rowTargets, colTargets, boardSize } = useGameStore();

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

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto p-4 animate-pop">
      <div className="bg-white/[0.02] p-4 sm:p-6 rounded-[2rem] border border-white/[0.05] shadow-2xl w-full backdrop-blur-sm">
        <div 
          className="w-full grid gap-3 sm:gap-4 justify-items-center"
          style={{ 
            gridTemplateColumns: `repeat(${boardSize}, minmax(0, 1fr)) 3.5rem`
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
              <div className="flex flex-col items-center justify-center ml-1 sm:ml-2">
                <div className={clsx(
                  "flex items-center justify-center w-12 h-12 rounded-2xl font-display text-2xl font-bold transition-all duration-300",
                  rowSums[r] === rowTargets[r] 
                    ? "bg-primary/20 text-primary border-2 border-primary/50 shadow-[0_0_15px_rgba(16,185,129,0.3)]" 
                    : rowSums[r] > rowTargets[r] 
                      ? "bg-danger/10 text-danger border border-danger/20"
                      : "bg-surface text-white border border-white/10"
                )}>
                  {rowTargets[r]}
                </div>
                <div className="flex items-center gap-1 mt-1 opacity-80 transistion-colors">
                   <span className={clsx(
                     "text-[10px] sm:text-xs font-mono font-bold tracking-widest",
                      rowSums[r] === rowTargets[r] && "text-primary",
                      rowSums[r] > rowTargets[r] ? "text-danger" : "text-textMuted"
                   )}>{rowSums[r]}</span>
                </div>
              </div>
            </React.Fragment>
          ))}

          {/* Column Targets (Bottom Row) */}
          {colTargets.map((target, c) => (
            <div key={`col-${c}`} className="flex flex-col items-center justify-center mt-1 sm:mt-2 w-full h-full">
               <div className={clsx(
                  "flex items-center justify-center w-full aspect-square max-w-[4rem] rounded-2xl font-display text-2xl font-bold transition-all duration-300",
                  colSums[c] === target 
                    ? "bg-primary/20 text-primary border-2 border-primary/50 shadow-[0_0_15px_rgba(16,185,129,0.3)]" 
                    : colSums[c] > target 
                      ? "bg-danger/10 text-danger border border-danger/20"
                      : "bg-surface text-white border border-white/10"
                )}>
                  {target}
                </div>
                <div className="flex items-center gap-1 mt-1 opacity-80 transition-colors">
                   <span className={clsx(
                     "text-[10px] sm:text-xs font-mono font-bold tracking-widest",
                      colSums[c] === target && "text-primary",
                      colSums[c] > target ? "text-danger" : "text-textMuted"
                   )}>{colSums[c]}</span>
                </div>
            </div>
          ))}
          {/* Empty bottom-right corner block for spacing */}
          <div />
        </div>
      </div>
    </div>
  );
};
