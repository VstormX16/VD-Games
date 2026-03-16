import { Trophy, Medal, ShoppingBag, User as UserIcon, Home } from 'lucide-react';
import { useUserStore } from '../store/userStore';
import { useTranslation } from '../utils/i18n';
import clsx from 'clsx';
import { motion } from 'framer-motion';

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
      <div className="w-full max-w-sm pointer-events-auto">
        <div className="glass-header rounded-[2rem] p-1.5 flex items-center justify-between border border-white/10 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.8)] bg-surface/40 backdrop-blur-xl relative">
          
          {navItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <motion.button
                key={item.id}
                whileTap={{ scale: 0.85 }}
                onClick={() => {
                  if (item.authRequired && !user) {
                    setView('auth');
                  } else {
                    setView(item.id as any);
                  }
                }}
                className={clsx(
                  "relative flex-1 py-3 flex flex-col items-center gap-1.5 rounded-[1.5rem] transition-colors",
                  isActive ? "text-white" : "text-textMuted hover:text-white/80"
                )}
              >
                {isActive && (
                   <motion.div 
                     layoutId="nav-pill"
                     className="absolute inset-0 bg-white/10 rounded-[1.5rem]"
                     transition={{ type: "spring", stiffness: 400, damping: 25 }}
                   />
                )}
                
                <item.icon 
                  className={clsx("w-5 h-5 relative z-10", isActive && item.id === 'menu' && "text-primary")} 
                  strokeWidth={isActive ? 3 : 2} 
                />
                
                <span className={clsx(
                  "text-[10px] font-bold uppercase tracking-widest relative z-10 transition-all",
                  isActive ? (item.id === 'menu' ? "text-primary" : "text-white") : "text-textMuted scale-90"
                )}>
                  {item.label}
                </span>
                
              </motion.button>
            );
          })}

        </div>
      </div>
    </motion.div>
  );
};
