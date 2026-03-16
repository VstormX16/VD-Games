import { Trophy, Medal, ShoppingBag, User as UserIcon, Home } from 'lucide-react';
import { useUserStore } from '../store/userStore';
import { useTranslation } from '../utils/i18n';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

export const BottomNav = () => {
  const { setView, currentView, user } = useUserStore();
  const t = useTranslation();

  // Hide nav on game, matchmaking, and auth screens.
  if (['game', 'matchmaking', 'auth', 'settings'].includes(currentView)) {
    return null;
  }

  const navItems = [
    { id: 'quests', icon: Trophy, label: 'Görevler', authRequired: true },
    { id: 'leaderboard', icon: Medal, label: t('leaderboard'), authRequired: false },
    { id: 'menu', icon: Home, label: t('menu'), authRequired: false },
    { id: 'shop', icon: ShoppingBag, label: t('shop'), authRequired: true },
    { id: 'profile', icon: UserIcon, label: user ? t('profile') : t('login'), authRequired: false },
  ] as const;

  return (
    <motion.div 
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed inset-x-0 bottom-6 z-30 flex justify-center w-full px-6 pointer-events-none"
    >
      <div className="w-full max-w-[380px] pointer-events-auto">
        <div className="glass-header rounded-[2.5rem] p-2 flex items-center justify-between border border-white/10 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.8)] bg-surface/60 backdrop-blur-2xl relative">
          
          {navItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <motion.button
                key={item.id}
                whileTap={{ scale: 0.8 }}
                onClick={() => {
                  if (item.authRequired && !user) {
                    setView('auth');
                  } else {
                    setView(item.id as import('../types/game').AppView);
                  }
                }}
                className={clsx(
                  "relative flex-1 py-3 flex flex-col items-center justify-center gap-1 rounded-[2rem] transition-colors focus:outline-none z-10",
                  isActive ? "text-textMain" : "text-textMuted hover:text-textMain/80"
                )}
              >
                {isActive && (
                   <motion.div 
                     layoutId="nav-pill-bg"
                     className="absolute inset-0 bg-white/10 rounded-[2rem] -z-10 shadow-inner"
                     initial={false}
                     transition={{ type: "spring", stiffness: 400, damping: 25 }}
                   />
                )}
                
                <motion.div
                  animate={isActive ? { y: -2, scale: 1.1 } : { y: 2, scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 25 }}
                >
                    <item.icon 
                      className={clsx(
                        "w-[22px] h-[22px] relative z-10 transition-colors duration-300", 
                        isActive && item.id === 'menu' ? "text-primary drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "",
                        isActive && item.id !== 'menu' ? "drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]" : ""
                      )} 
                      strokeWidth={isActive ? 2.5 : 2} 
                    />
                </motion.div>
                
                <AnimatePresence>
                   {isActive && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0, scale: 0.8 }}
                        animate={{ opacity: 1, height: 'auto', scale: 1 }}
                        exit={{ opacity: 0, height: 0, scale: 0.8 }}
                        transition={{ type: "spring", stiffness: 500, damping: 25 }}
                        className="relative h-[12px] w-full mt-1 overflow-visible flex justify-center items-center"
                      >
                       <span className={clsx(
                         "text-[9px] font-black uppercase tracking-widest absolute whitespace-nowrap",
                         item.id === 'menu' ? "text-primary" : "text-textMain"
                       )}>
                         {item.label}
                       </span>
                      </motion.div>
                   )}
                </AnimatePresence>
                
              </motion.button>
            );
          })}

        </div>
      </div>
    </motion.div>
  );
};
