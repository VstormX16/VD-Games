import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserStore } from '../store/userStore';
import confetti from 'canvas-confetti';
import { playSuccess } from '../utils/audioHaptics';

export const SeasonRewardOverlay: React.FC = () => {
  const { user, claimSeasonReward } = useUserStore();
  const [isClaiming, setIsClaiming] = useState(false);

  // If there's no reward to claim, don't show anything
  if (!user || (!user.pendingSeasonReward && !isClaiming)) return null;

  const rewardData = user?.pendingSeasonReward;

  const handleClaim = async () => {
    setIsClaiming(true);
    playSuccess();

    // Fire big confetti
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 7,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#Fbbf24', '#fcd34d', '#f59e0b']
      });
      confetti({
        particleCount: 7,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#Fbbf24', '#fcd34d', '#f59e0b']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();

    setTimeout(async () => {
      await claimSeasonReward();
      setIsClaiming(false);
    }, 2500);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[110] flex flex-col items-center justify-center p-6 backdrop-blur-md bg-black/80"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-yellow-500/20 via-black/60 to-black pointer-events-none" />
        
        <motion.div
          initial={{ scale: 0.5, y: 50, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          transition={{ type: 'spring', damping: 15, stiffness: 100 }}
          className="relative z-10 w-full max-w-sm bg-surface p-8 rounded-[2.5rem] border-2 border-yellow-500/30 flex flex-col items-center overflow-hidden shadow-[0_0_50px_rgba(234,179,8,0.2)]"
        >
          {/* Shine effect */}
          <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-yellow-500/20 to-transparent pointer-events-none" />

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="w-24 h-24 bg-gradient-to-br from-yellow-300 to-yellow-600 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(234,179,8,0.5)] border-4 border-yellow-200"
          >
            <span className="text-4xl">🏆</span>
          </motion.div>

          <h2 className="text-3xl font-display font-black text-white text-center mb-2">
            SEZON BİTTİ!
          </h2>
          <p className="text-textMuted text-center text-sm mb-6 leading-relaxed">
            Geçen sezonu <span className="text-yellow-400 font-bold">{rewardData?.rankName}</span> liginde bitirdin ve bu emeğinin karşılığını alma vakti geldi!
          </p>

          <div className="w-full bg-black/30 rounded-2xl p-4 mb-8 flex flex-col items-center border border-white/5">
            <span className="text-xs text-textMuted uppercase tracking-wider font-bold mb-1">Sezon Ödülün</span>
            <div className="flex items-center gap-2 font-display font-black text-4xl text-yellow-500">
              <span className="text-yellow-400">🪙</span>
              {rewardData?.coins || 0}
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleClaim}
            disabled={isClaiming}
            className="neo-button w-full py-5 bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-display font-black text-xl rounded-2xl shadow-[0_0_20px_rgba(234,179,8,0.4)]"
          >
            {isClaiming ? 'Alınıyor...' : 'Ödülü Kap!'}
          </motion.button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
