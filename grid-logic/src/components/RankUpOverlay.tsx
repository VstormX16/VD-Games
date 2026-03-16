import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserStore } from '../store/userStore';
import confetti from 'canvas-confetti';
import clsx from 'clsx';
import { playSuccess } from '../utils/audioHaptics';

export const RankUpOverlay: React.FC = () => {
  const { rankUpData, clearRankUpData } = useUserStore();

  useEffect(() => {
    if (rankUpData) {
      playSuccess();
      
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#Fbbf24', '#f59e0b', '#d97706']
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#Fbbf24', '#f59e0b', '#d97706']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();

      const timer = setTimeout(() => {
        clearRankUpData();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [rankUpData, clearRankUpData]);

  return (
    <AnimatePresence>
      {rankUpData && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-6 backdrop-blur-md bg-black/60"
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-yellow-500/20 via-black/50 to-bgStart/90 pointer-events-none" />
          
          <motion.h2 
            initial={{ scale: 0.5, y: -50, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            transition={{ type: 'spring', damping: 12, stiffness: 200, delay: 0.2 }}
            className="text-4xl sm:text-5xl font-display font-black text-white text-center mb-12 drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]"
          >
            RÜTBE ATLADIN!
          </motion.h2>

          <div className="flex items-center justify-center gap-6 sm:gap-10 relative z-10 w-full max-w-sm">
            
            {/* Previous Rank */}
            <motion.div 
               initial={{ x: -50, opacity: 0 }}
               animate={{ x: 0, opacity: 1 }}
               transition={{ duration: 0.5, delay: 0.5 }}
               className="flex flex-col items-center justify-center relative opacity-50 scale-75 blur-[1px]"
            >
               <div className={clsx('w-20 h-20 rounded-full flex items-center justify-center mb-3', rankUpData.previous.bg, rankUpData.previous.border, 'border-2')}>
                  {React.createElement(rankUpData.previous.icon, { className: clsx('w-10 h-10', rankUpData.previous.color) })}
               </div>
               <span className={clsx('font-black font-display text-lg tracking-wider', rankUpData.previous.color)}>
                 {rankUpData.previous.name}
               </span>
            </motion.div>

            {/* Arrow */}
            <motion.div
               initial={{ scale: 0, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               transition={{ duration: 0.5, delay: 1 }}
               className="text-white/50 text-4xl mb-8"
            >
               →
            </motion.div>

            {/* Current Rank */}
            <motion.div 
               initial={{ x: 50, scale: 0.5, opacity: 0 }}
               animate={{ x: 0, scale: 1.2, opacity: 1 }}
               transition={{ type: 'spring', damping: 10, stiffness: 100, delay: 1.5 }}
               className="flex flex-col items-center justify-center relative"
            >
               <div className="absolute inset-0 bg-yellow-500/20 blur-xl rounded-full animate-pulse" />
               <div className={clsx(
                  'w-28 h-28 rounded-full flex items-center justify-center mb-4 relative z-10',
                  rankUpData.current.bg, 
                  rankUpData.current.border, 
                  rankUpData.current.glow,
                  'border-4'
                )}>
                  {React.createElement(rankUpData.current.icon, { className: clsx('w-14 h-14', rankUpData.current.color) })}
               </div>
               <span className={clsx('font-black font-display text-2xl tracking-widest drop-shadow-md relative z-10', rankUpData.current.color)}>
                 {rankUpData.current.name}
               </span>
            </motion.div>

          </div>

          <motion.button
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 3 }}
            onClick={clearRankUpData}
            className="mt-20 neo-button px-10 py-4 bg-white text-black font-display font-black rounded-full text-lg shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:scale-105 active:scale-95 transition-all"
          >
            MÜKEMMEL!
          </motion.button>

        </motion.div>
      )}
    </AnimatePresence>
  );
};
