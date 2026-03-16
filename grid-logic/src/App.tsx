import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { useGameStore } from './store/gameStore';
import { useUserStore } from './store/userStore';
import { Grid } from './components/Grid';
import {
  Play, RotateCcw, Lightbulb,
  Wifi, Target, User as UserIcon, LogOut, ArrowLeft, Clock, Flame, Lock, Coins, Settings, Swords,
  Pencil, Check, X, Ghost, Sword, Shield, Crown, Zap, Heart, Star, Tv, Music, BookOpen
} from 'lucide-react';
import { collection, query, orderBy, limit, getDocs, doc, setDoc, updateDoc, onSnapshot, where, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from './lib/firebase';
import type { Difficulty } from './types/game';
import { initAudio, playClick, triggerHapticPop, playSuccess, playError } from './utils/audioHaptics';
import confetti from 'canvas-confetti';
import { useSettingsStore } from './store/settingsStore';
import { useTranslation } from './utils/i18n';
import { BottomNav } from './components/BottomNav';
import { motion, AnimatePresence } from 'framer-motion';
import { getDailyQuests, getWeeklyQuests } from './data/quests';

// We redefine tiers to include Platinum, Yücelik (Immortal), Radyant (Radiant)
const RANK_THRESHOLDS = [
  { name: 'Radyant', min: 5000, max: 99999, color: 'text-amber-300', bg: 'bg-amber-500/10', border: 'border-amber-500/30', glow: 'shadow-[0_0_25px_rgba(252,211,77,0.6)]', icon: Crown },
  { name: 'Immortal', min: 3000, max: 5000, color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/30', glow: 'shadow-[0_0_20px_rgba(244,63,94,0.5)]', icon: Crown },
  { name: 'Yücelik', min: 1500, max: 3000, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30', glow: 'shadow-[0_0_20px_rgba(168,85,247,0.5)]', icon: Crown },
  { name: 'Elmas', min: 1000, max: 1500, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', glow: 'shadow-[0_0_15px_rgba(34,211,238,0.3)]', icon: Shield },
  { name: 'Platin', min: 600, max: 1000, color: 'text-teal-400', bg: 'bg-teal-500/10', border: 'border-teal-500/30', glow: 'shadow-[0_0_15px_rgba(45,212,191,0.3)]', icon: Shield },
  { name: 'Altın', min: 300, max: 600, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', glow: 'shadow-[0_0_15px_rgba(250,204,21,0.3)]', icon: Star },
  { name: 'Gümüş', min: 100, max: 300, color: 'text-gray-300', bg: 'bg-gray-400/10', border: 'border-gray-400/30', glow: 'shadow-[0_0_10px_rgba(209,213,219,0.2)]', icon: Shield },
  { name: 'Bronz', min: 0, max: 100, color: 'text-orange-700', bg: 'bg-orange-900/10', border: 'border-orange-900/30', glow: '', icon: Shield }
];

const getLeagueInfo = (trophies: number) => {
  const currentRankIndex = RANK_THRESHOLDS.findIndex(r => trophies >= r.min);
  const rankInfo = currentRankIndex !== -1 ? RANK_THRESHOLDS[currentRankIndex] : RANK_THRESHOLDS[RANK_THRESHOLDS.length - 1];
  
  // Calculate progress to next rank
  let progressPercentage = 100;
  if (currentRankIndex > 0) {
     const currentLevelMin = rankInfo.min;
     const nextLevelMin = RANK_THRESHOLDS[currentRankIndex - 1].min;
     const pointsInLevel = trophies - currentLevelMin;
     const pointsRequired = nextLevelMin - currentLevelMin;
     progressPercentage = Math.min(100, Math.max(0, (pointsInLevel / pointsRequired) * 100));
  }

  return { ...rankInfo, progressPercentage };
};

const MainMenu = () => {
  const { startLevel } = useGameStore();
  const { setView, user } = useUserStore();
  const t = useTranslation();
  const [selectedMode, setSelectedMode] = useState<'offline' | 'online' | null>(null);

  if (selectedMode) {
    const handleStart = (diff: Difficulty) => {
      initAudio();
      startLevel(1, selectedMode, diff);
      setView('game');
    };

    return (
      <div className="flex flex-col items-center justify-center min-h-[100dvh] w-full max-w-md mx-auto p-6 gap-4 animate-fade-in relative z-10 text-textMain">
        <h2 className="text-3xl font-display font-black mb-8">{t('difficulty_selection')}</h2>

        <button onClick={() => handleStart('easy')} className="neo-button w-full py-5 bg-surface text-textMain font-display font-bold text-lg rounded-2xl shadow-xl flex items-center justify-center gap-3 border border-white/5 hover:bg-surfaceAlt">
          {t('easy')}
        </button>
        <button onClick={() => handleStart('medium')} className="neo-button w-full py-5 bg-surface text-textMain font-display font-bold text-lg rounded-2xl shadow-xl flex items-center justify-center gap-3 border border-white/5 hover:bg-surfaceAlt">
          {t('medium')}
        </button>
        <button onClick={() => handleStart('hard')} className="neo-button w-full py-5 bg-surface text-danger font-display font-bold text-lg rounded-2xl shadow-xl flex items-center justify-center gap-3 border border-danger/20 hover:bg-surfaceAlt">
          {t('hard')}
        </button>

        <div className="w-full h-px bg-white/10 my-2" />

        <button onClick={() => handleStart('progressive')} className="neo-button w-full py-5 bg-primary/10 text-primary font-display font-black text-xl rounded-2xl shadow-[0_8px_30px_rgba(16,185,129,0.25)] flex items-center justify-center gap-3 border border-primary/50">
          {t('progressive')}
        </button>
        <p className="text-textMuted text-xs text-center px-4 mb-4">{t('progressive_desc')}</p>

        <button onClick={() => setSelectedMode(null)} className="neo-button p-4 bg-surface rounded-xl hover:bg-surfaceAlt border border-white/5">
          <ArrowLeft className="w-6 h-6" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[100dvh] overflow-hidden w-full relative z-10 text-textMain animate-fade-in pt-safe pb-28 scrollbar-hide">
      {/* Top Bar for Coins and Settings */}
      <header className="w-full flex justify-between items-center px-6 pt-6 pb-2 z-20 max-w-md mx-auto relative">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setView('settings')}
          className="p-2.5 bg-surface/80 backdrop-blur-md rounded-xl hover:bg-surfaceAlt border border-white/5 neo-button hover:rotate-90 transition-all duration-300 shadow-lg"
        >
          <Settings className="w-5 h-5 text-textMuted hover:text-textMain" />
        </motion.button>
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center gap-4 bg-surface/80 backdrop-blur-md px-4 py-2 rounded-full border border-white/5 shadow-lg"
        >
          <div className="flex items-center gap-1.5 text-yellow-500 font-bold font-mono text-sm">
            <Coins className="w-4 h-4" />
            {user?.coins || 0}
          </div>
          <div className="w-px h-4 bg-white/10" />
          <div className="flex items-center gap-1.5 text-yellow-500 font-bold font-mono text-sm">
            🏆 {user?.trophies || 0}
          </div>
        </motion.div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center p-6 w-full max-w-md mx-auto relative mb-16">
        <div className="w-80 h-80 bg-primary opacity-[0.05] rounded-full blur-3xl absolute top-1/4 -translate-y-1/2 pointer-events-none" />

        <div className="text-center flex flex-col items-center w-full relative mb-8">
          <motion.div 
            animate={{ y: [0, -10, 0] }} 
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            className="relative mb-6 group"
          >
            <div className="absolute inset-0 bg-primary opacity-20 blur-xl rounded-full scale-150 transition-transform group-hover:scale-125 duration-1000" />
            <div className="w-24 h-24 bg-surface rounded-[2rem] border border-white/10 flex items-center justify-center shadow-2xl relative z-10 rotate-3">
              <img src="/logo.svg" alt="VD-Games Logo" className="w-16 h-16 object-contain -rotate-3 drop-shadow-lg" />
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/20 to-transparent rounded-b-[2rem]" />
            </div>
          </motion.div>

          <h1 className="text-5xl font-display font-black mb-2 tracking-tight drop-shadow-md">
            VD-Games
          </h1>
          <p className="text-primary font-bold tracking-[0.3em] text-xs uppercase opacity-80">
            {t('subtitle')}
          </p>
        </div>

        <div className="w-full flex flex-col gap-4">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedMode('offline')}
            className="neo-button w-full py-5 bg-surface text-textMain font-display font-bold text-lg rounded-2xl shadow-xl flex items-center justify-center gap-3 border border-white/5 hover:bg-surfaceAlt"
          >
            <Target className="w-6 h-6 text-textMuted" />
            {t('play_offline')}
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              if (user) {
                playClick();
                setView('matchmaking');
              } else {
                setView('auth');
              }
            }}
            className="neo-button w-full py-5 bg-danger/10 text-danger font-display font-bold text-lg rounded-2xl shadow-[0_8px_30px_rgba(244,63,94,0.25)] flex items-center justify-center gap-3 border border-danger/50"
          >
            <Swords className="w-6 h-6" />
            1v1 Düello
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              if (user) {
                setSelectedMode('online');
              } else {
                setView('auth');
              }
            }}
            className="neo-button w-full py-5 bg-primary/10 text-primary font-display font-bold text-lg rounded-2xl shadow-[0_8px_30px_rgba(16,185,129,0.25)] flex items-center justify-center gap-3 border border-primary/50"
          >
            <Wifi className="w-6 h-6" />
            {t('play_online')}
          </motion.button>

          <div className="flex gap-4 w-full">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                if (user) {
                  initAudio();
                  startLevel(1, 'time_attack', 'time_attack');
                  setView('game');
                } else {
                  setView('auth');
                }
              }}
              className="neo-button flex-1 py-4 bg-purple-500/10 text-purple-400 font-display font-bold rounded-2xl shadow-xl border border-purple-500/20 flex flex-col items-center justify-center gap-1 hover:bg-purple-500/20"
            >
              <Clock className="w-6 h-6 mb-1" />
              <span className="text-xs uppercase tracking-wider text-center">{t('time_attack')}</span>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                if (user) {
                  initAudio();
                  startLevel(1, 'daily', 'daily');
                  setView('game');
                } else {
                  setView('auth');
                }
              }}
              className="neo-button flex-1 py-4 bg-orange-500/10 text-orange-400 font-display font-bold rounded-2xl shadow-xl border border-orange-500/20 flex flex-col items-center justify-center gap-1 hover:bg-orange-500/20"
            >
              <Flame className="w-6 h-6 mb-1" />
              <span className="text-xs uppercase tracking-wider text-center">{t('daily_challenge')}</span>
            </motion.button>
          </div>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => {
                playClick();
                setView('guide');
            }}
            className="neo-button mt-2 w-full py-4 bg-surfaceAlt text-textMuted font-display font-bold text-sm rounded-2xl border border-white/5 hover:bg-white/5 hover:text-textMain flex items-center justify-center gap-2 transition-colors"
          >
            <BookOpen className="w-5 h-5" />
            Nasıl Oynanır?
          </motion.button>
        </div>
      </div>
    </div>
  );
};

const MatchmakingScreen = () => {
  const { setView, user } = useUserStore();
  const { startDuello } = useGameStore();
  const [status, setStatus] = useState<string>('Rakip Aranıyor...');

  const userUid = user?.uid;
  const userDisplayName = user?.displayName;

  useEffect(() => {
    if (!userUid) {
      setView('menu');
      return;
    }

    let currentMatchId = '';
    let unsubscribe: () => void;
    let hasStartedGame = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let pingInterval: ReturnType<typeof setInterval> | null = null;

    const findOrCreateMatch = async () => {
      try {
        // 1. Cleanup old matches in the background (fire and forget)
        const cleanupOldMatches = async () => {
          try {
            const finishedQuery = query(collection(db, 'matches'), where('status', '==', 'finished'), limit(5));
            const cancelledQuery = query(collection(db, 'matches'), where('status', '==', 'cancelled'), limit(5));
            const [finishedSnap, cancelledSnap] = await Promise.all([getDocs(finishedQuery), getDocs(cancelledQuery)]);
            
            finishedSnap.forEach(d => deleteDoc(doc(db, 'matches', d.id)).catch(() => {}));
            cancelledSnap.forEach(d => deleteDoc(doc(db, 'matches', d.id)).catch(() => {}));
          } catch {
            // Ignore if security rules block it or it fails
          }
        };
        cleanupOldMatches();

        // 2. Query for waiting match (fetch multiple and filter JS to avoid index mismatch and clear zombies)
        const q = query(collection(db, 'matches'), where('status', '==', 'waiting'), limit(20));
        const snapshot = await getDocs(q);

        let validMatchDoc = null;
        const now = Date.now();

        for (const docSnap of snapshot.docs) {
           const data = docSnap.data();
           const isMe = data.player1?.uid === userUid;
           
           let timestamp = data.createdAt;
           if (!timestamp && docSnap.id.includes('_')) {
               timestamp = parseInt(docSnap.id.split('_')[0], 10);
           }
           if (!timestamp || isNaN(timestamp)) timestamp = 0;

           const isOld = now - timestamp > 45000; // 45s heartbeat timeout

           if (isOld) {
               // Cleanup zombie
               deleteDoc(doc(db, 'matches', docSnap.id)).catch(() => {});
           } else if (!isMe && !validMatchDoc) {
               validMatchDoc = docSnap;
           }
        }

        if (validMatchDoc) {
          // Match found! Join it.
          currentMatchId = validMatchDoc.id;
          
          await updateDoc(doc(db, 'matches', currentMatchId), {
            player2: { uid: userUid, displayName: userDisplayName || 'Oyuncu' },
            status: 'playing'
          });
          setStatus(`Rakip Bulundu! Başlıyor...`);
        } else {
          // Create new match
          currentMatchId = `${Date.now()}_${user.uid}`;
          
          // Setup match data with a random seed based on time
          await setDoc(doc(db, 'matches', currentMatchId), {
            status: 'waiting',
            seed: currentMatchId, // Good enough random seed
            player1: { uid: userUid, displayName: userDisplayName || 'Oyuncu' },
            createdAt: Date.now()
          });

          pingInterval = setInterval(() => {
             if (currentMatchId && !hasStartedGame) {
                updateDoc(doc(db, 'matches', currentMatchId), { createdAt: Date.now() }).catch(() => {});
             }
          }, 15000); // keep alive
        }

        // 3. Listen to the match for updates
        unsubscribe = onSnapshot(doc(db, 'matches', currentMatchId), (snap) => {
          if (!snap.exists()) return;
          const data = snap.data();
          if (data.status === 'playing') {
            setStatus('Maç Başlıyor!');
            // Identify opponent
            const opponentName = data.player1.uid === userUid ? data.player2?.displayName : data.player1.displayName;
            
            // Small delay for dramatic effect, but only queue it ONCE
            if (!timeoutId) {
              timeoutId = setTimeout(() => {
                hasStartedGame = true;
                initAudio();
                startDuello(snap.id, opponentName || 'Rakip', data.seed);
                setView('game');
              }, 1500);
            }
          }
        });
      } catch (error: unknown) {
        console.error("Matchmaking error:", error);
        alert("Eşleştirme sunucusuna bağlanılamadı. (Veritabanı izni veya bağlantı sorunu olabilir).");
        setView('menu');
      }
    };

    findOrCreateMatch();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (pingInterval) clearInterval(pingInterval);
      if (unsubscribe) unsubscribe();
      if (currentMatchId && !hasStartedGame) {
        getDoc(doc(db, 'matches', currentMatchId)).then((snap) => {
           if (snap.exists() && snap.data().status === 'waiting' && snap.data().player1.uid === userUid) {
             updateDoc(doc(db, 'matches', currentMatchId), { status: 'cancelled' });
           }
        });
      }
    };
  }, [userUid, userDisplayName, setView, startDuello, user?.uid]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] w-full max-w-md mx-auto p-6 gap-8 animate-fade-in relative z-10 text-textMain">
      <div className="w-32 h-32 rounded-full border-4 border border-danger/30 flex items-center justify-center animate-pulse relative">
        <Swords size={48} className="text-danger animate-bounce shadow-danger/50 drop-shadow-[0_0_15px_rgba(244,63,94,0.5)]" />
        <div className="absolute inset-0 rounded-full border-t-4 border-danger animate-spin" style={{ animationDuration: '2s' }} />
      </div>

      <h2 className="text-3xl font-display font-black text-center">{status}</h2>

      <button
        onClick={() => setView('menu')}
        className="mt-10 text-textMuted underline hover:text-textMain"
      >
        İptal Et
      </button>
    </div>
  );
};

const AuthScreen = () => {
  const { signInWithGoogle, setView, loading } = useUserStore();

  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] w-full max-w-md mx-auto p-6 gap-8 animate-fade-in relative z-10 text-textMain">
      <h2 className="text-3xl font-display font-black mb-4">Hoş Geldin!</h2>
      <p className="text-center text-textMuted mb-8">
        Çevrimiçi modda oynayıp puan kazanmak ve liderlik tablosuna girmek için Google ile giriş yapmalısın.
      </p>

      <button
        onClick={() => signInWithGoogle()}
        disabled={loading}
        className="neo-button w-full py-5 bg-white text-bgStart font-display font-bold text-xl rounded-2xl shadow-xl flex items-center justify-center gap-3"
      >
        {loading ? 'Yükleniyor...' : 'Google ile Giriş Yap'}
      </button>

      <button
        onClick={() => setView('menu')}
        className="text-textMuted mt-4 underline decoration-textMuted/30 hover:text-textMain"
      >
        Geri Dön
      </button>
    </div>
  );
};

const LeaderboardScreen = () => {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'progressive' | 'hard' | 'time_attack' | 'trophies'>('progressive');
  const [seasonInfo, setSeasonInfo] = useState<{name: string, daysRemaining: number} | null>(null);

  useEffect(() => {
    import('./utils/season').then(({ getCurrentSeason }) => {
      setSeasonInfo(getCurrentSeason());
    });
  }, []);
  useEffect(() => {
    const fetchLeaders = async () => {
      setLoading(true);
      try {
        let orderField = `scores.${activeTab}`;
        if (activeTab === 'trophies') {
            orderField = 'seasonTrophies'; // Query season trophies for leaderboard
        }
        
        const q = query(
          collection(db, 'users'),
          orderBy(orderField, 'desc'),
          limit(20)
        );
        const snap = await getDocs(q);
        setLeaders(snap.docs.map(d => ({ id: d.id, ...d.data() })) as never[]);
      } catch (error) {
        console.error("Error fetching leaders:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaders();
  }, [activeTab]);

  return (
    <div className="flex flex-col w-full h-[100dvh] max-w-md mx-auto p-6 animate-fade-in relative z-10 text-textMain overflow-y-auto pb-28 scrollbar-hide">
      <div className="flex flex-col mb-4">
        <h2 className="text-3xl font-display font-black">Liderlik Tablosu</h2>
        {seasonInfo && (
          <div className="flex items-center gap-2 mt-2">
            <span className="text-primary font-black uppercase text-xs tracking-wider">{seasonInfo.name}</span>
            <div className="w-1 h-1 rounded-full bg-white/20" />
            <span className="text-textMuted text-xs flex items-center gap-1">
              <Clock className="w-3 h-3" /> {seasonInfo.daysRemaining} gün kaldı
            </span>
          </div>
        )}
      </div>

      <div className="flex gap-2 w-full mb-4 overflow-x-auto pb-2 scrollbar-hide">
        {[
          { id: 'trophies', label: 'Kupa 🏆' },
          { id: 'progressive', label: 'İlerlemeli' },
          { id: 'time_attack', label: 'Zamana Karşı' },
          { id: 'hard', label: 'Zor' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as 'progressive' | 'hard' | 'time_attack' | 'trophies')}
            className={clsx(
              "px-4 py-2 font-bold font-display rounded-xl whitespace-nowrap transition-colors border border-white/5",
              activeTab === tab.id ? "bg-primary text-textMain" : "bg-surface text-textMuted hover:bg-surfaceAlt"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-surface/50 border border-white/5 rounded-3xl p-2 h-full flex-1">
        {loading ? (
          <div className="p-8 text-center text-textMuted">Yükleniyor...</div>
        ) : leaders.length === 0 ? (
          <div className="p-8 text-center text-textMuted">Henüz kimse skor yapmadı!</div>
        ) : (
          <motion.div 
            initial="hidden" animate="show"
            variants={{
              hidden: {},
              show: { transition: { staggerChildren: 0.1 } }
            }}
            className="flex flex-col gap-2"
          >
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {leaders.map((u: any, i) => (
              <motion.div 
                key={u.id} 
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
                }}
                className={clsx(
                  "bg-surface p-4 rounded-3xl flex items-center justify-between border relative overflow-hidden group",
                  i === 0 ? "border-yellow-500/30 shadow-[0_0_20px_rgba(234,179,8,0.15)]" :
                  i === 1 ? "border-gray-400/30 shadow-[0_0_15px_rgba(156,163,175,0.1)]" :
                  i === 2 ? "border-orange-500/30 shadow-[0_0_15px_rgba(249,115,22,0.1)]" : "border-white/5"
                )}
              >
                {/* Subtle gradient for top 3 */}
                {i === 0 && <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 to-transparent pointer-events-none" />}
                {i === 1 && <div className="absolute inset-0 bg-gradient-to-r from-gray-400/10 to-transparent pointer-events-none" />}
                {i === 2 && <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-transparent pointer-events-none" />}

                <div className="flex items-center gap-4 relative z-10">
                  <div className={clsx(
                    "w-10 h-10 rounded-full flex items-center justify-center font-black font-display text-lg",
                    i === 0 ? 'bg-gradient-to-br from-yellow-300 to-yellow-600 text-bgStart shadow-lg' :
                    i === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-bgStart shadow-md' :
                    i === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-700 text-bgStart shadow-md' : 
                    'bg-white/5 text-textMuted border border-white/5'
                  )}>
                    {i === 0 ? <Crown className="w-5 h-5" /> : i + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className={clsx("font-bold font-display text-lg tracking-tight", i <= 2 ? "text-textMain" : "text-textMain/90")}>
                        {u.displayName || 'İsimsiz Oyuncu'}
                      </h3>
                      {activeTab === 'trophies' && (() => {
                        const lig = getLeagueInfo(u.trophies || 0);
                        const LigIcon = lig.icon;
                        return <LigIcon className={clsx("w-4 h-4", lig.color)} />;
                      })()}
                      {u.winStreak && u.winStreak >= 3 && (
                         <div className="flex items-center gap-0.5 bg-orange-500/10 border border-orange-500/30 px-1.5 py-0.5 rounded-full shadow-[0_0_10px_rgba(249,115,22,0.3)]">
                            <Flame className="w-3 h-3 text-orange-400" />
                            <span className="text-[10px] font-black font-mono text-orange-400">{u.winStreak}</span>
                         </div>
                      )}
                    </div>
                    {activeTab !== 'trophies' && <p className="text-xs text-textMuted tracking-wider font-mono">Max Lvl: {u.levels?.[activeTab] || 1}</p>}
                  </div>
                </div>
                
                <div className="flex flex-col items-end relative z-10">
                  <div className={clsx(
                    "font-display font-black text-2xl flex items-center gap-1",
                    i === 0 ? "text-yellow-500" :
                    i === 1 ? "text-gray-400" :
                    i === 2 ? "text-orange-500" : "text-primary/90"
                  )}>
                    {activeTab === 'trophies' ? (u.seasonTrophies || 0) : (u.scores?.[activeTab] || 0)}
                    {activeTab === 'trophies' && <span className="text-xl">🏆</span>}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
};

const GuideScreen = () => {
  return (
    <div className="flex flex-col w-full h-[100dvh] max-w-md mx-auto p-6 animate-slide-up relative z-10 text-textMain overflow-y-auto pb-28 scrollbar-hide">
      <div className="flex items-center gap-4 mb-8 sticky top-0 py-2 bg-bgStart/90 backdrop-blur z-20">
        <h2 className="text-3xl font-display font-black leading-none">Nasıl Oynanır?</h2>
      </div>

      <div className="space-y-6">
        {/* Basic Rules */}
        <div className="bg-surface p-6 rounded-[2rem] border border-white/5">
          <h3 className="text-xl font-display font-bold text-primary mb-3">Temel Kural</h3>
          <p className="text-textMuted text-sm leading-relaxed mb-4">
            Oyunun amacı çok basit: <span className="text-textMain font-bold">Kutuları seçerek</span> (üzerlerine tıklayıp zümrüt yeşili yaparak) satırların sonunda ve sütunların altında yazan
            <span className="text-textMain font-bold"> Hedef Sayılara</span> ulaşmak.
          </p>
          <p className="text-textMuted text-sm leading-relaxed">
            Tüm satır ve sütun hedefleri <span className="text-primary font-bold bg-primary/20 px-1 rounded">Yeşil</span> olduğunda o bölümü kazanırsın!
          </p>
        </div>

        {/* Locked Boxes */}
        <div className="bg-surface p-6 rounded-[2rem] border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-[100px] pointer-events-none" />
          <Lock className="absolute top-6 right-6 w-8 h-8 text-textMain/20" />

          <h3 className="text-xl font-display font-bold text-textMain mb-3">Asma Kilitli Kutular</h3>
          <p className="text-textMuted text-sm leading-relaxed mb-3">
            Bölümler ilerledikçe bazı kutularda asma kilit 🔒 göreceksin. Kilitli kutulara <span className="text-textMain font-bold underline">dokunamazsın.</span>
          </p>
          <ul className="text-sm space-y-2 text-textMuted">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">■</span>
              <span>Eğer kilit <span className="text-textMain font-bold">Yeşil (Aktif)</span> durumdaysa, o sayı sana yardım olsun diye otomatik olarak verilmiştir ve hesaba katılmaz zorundadır.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-textMuted/50 mt-0.5">■</span>
              <span>Eğer kilit <span className="text-textMain font-bold">Gri (Pasif)</span> durumdaysa, o sayıyı kesinlikle kullanmamanı ister.</span>
            </li>
          </ul>
        </div>

        {/* Negative Boxes */}
        <div className="bg-danger/5 border border-danger/20 p-6 rounded-[2rem] relative overflow-hidden">
          <div className="absolute top-6 right-6 w-10 h-10 rounded-full bg-danger/20 text-danger flex items-center justify-center text-xl font-bold font-mono">
            -
          </div>

          <h3 className="text-xl font-display font-bold text-danger mb-3">Negatif Mayınlar</h3>
          <p className="text-textMuted text-sm leading-relaxed mb-3">
            Zor zorluklarda bazı kutuların köşesinde "Kırmızı Eksi" bulunur. Bunlara tıkladığında sayıyı <span className="text-textMain font-bold">TOPLAMAZ, hedefinden ÇIKARIR.</span>
          </p>
          <div className="bg-bgStart/50 p-3 rounded-xl border border-danger/10 text-xs text-textMuted/90">
            <span className="text-danger font-bold">Örnek:</span> Hedefin 10 ise ve elinde [7], [5] ve [-2] varsa;<br />
            7'yi aç + 5'i aç + kırmızı 2'yi aç =  <span className="text-textMain font-bold">7 + 5 - 2 = 10!</span>
          </div>
        </div>

        {/* Unknown Boxes */}
        <div className="bg-surface p-6 rounded-[2rem] border border-white/5 relative overflow-hidden">
          <div className="absolute top-6 right-6 text-4xl font-display font-black text-textMain/10">?</div>

          <h3 className="text-xl font-display font-bold text-textMain mb-3">Gizli Kutular</h3>
          <p className="text-textMuted text-sm leading-relaxed mb-3">
            Gerçek zeka testi burada başlar. İleri seviyelerde kutuların içinde sayı yerine <span className="text-textMain font-bold text-lg">?</span> yazar.
            İçinde ne yazdığını ancak satırın sonundaki hedeften geriye doğru matematik yaparak Sudoku gibi tahmin edebilirsin!
          </p>
        </div>

      </div>
    </div>
  );
};

const ShopScreen = () => {
  const { user, setView } = useUserStore();
  const [isWatchingAd, setIsWatchingAd] = useState(false);
  const [showVideoOverlay, setShowVideoOverlay] = useState(false);
  const [currentAdUrl, setCurrentAdUrl] = useState("");
  const [timeLeft, setTimeLeft] = useState(40);
  const [canCloseAd, setCanCloseAd] = useState(false);

  const adVideoIds = [
    "8zN_QIk8_LU",
    "J8aBh5clWzo",
    "p8q-PhpcmDk"
  ];

  useEffect(() => {
     let timer: ReturnType<typeof setInterval>;
     if (showVideoOverlay && !canCloseAd) {
         timer = setInterval(() => {
             setTimeLeft((prev) => {
                 if (prev <= 1) {
                     setCanCloseAd(true);
                     clearInterval(timer);
                     return 0;
                 }
                 return prev - 1;
             });
         }, 1000);
     }
     return () => clearInterval(timer);
  }, [showVideoOverlay, canCloseAd]);

  if (!user) {
    setView('menu');
    return null;
  }

  const handleWatchAd = async () => {
    if (isWatchingAd || showVideoOverlay) return;
    setIsWatchingAd(true);
    setCanCloseAd(false);
    setTimeLeft(40); // 40 saniyelik zorunlu süre
    playClick();

    const randomId = adVideoIds[Math.floor(Math.random() * adVideoIds.length)];
    setCurrentAdUrl(`https://www.youtube.com/embed/${randomId}?autoplay=1&controls=0&modestbranding=1&rel=0&playsinline=1`);

    // Show the video overlay
    setShowVideoOverlay(true);
  };


  const handleCloseAd = async () => {
     playClick();
     setShowVideoOverlay(false);

     try {
       const { doc, updateDoc, increment } = await import('firebase/firestore');
       const userRef = doc(db, 'users', user.uid);
       await updateDoc(userRef, {
         coins: increment(250)
       });
       
       useUserStore.setState({ user: { ...user, coins: (user.coins || 0) + 250 } });
       playSuccess();
     } catch (error) {
       console.error("Ad reward failed", error);
       playError();
     } finally {
       setIsWatchingAd(false);
       setCanCloseAd(false);
     }
  };

  return (
    <div className="flex flex-col w-full h-[100dvh] animate-slide-up relative z-10 text-textMain overflow-y-auto pb-28 scrollbar-hide">
      
      {/* AD VIDEO OVERLAY */}
      <AnimatePresence>
        {showVideoOverlay && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-4"
          >
            <div className="absolute top-8 left-0 w-full flex justify-center z-20 px-4">
              <div className="w-full max-w-2xl flex items-start justify-between">
                <div className="bg-black/50 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 text-textMain font-mono text-sm shadow-xl flex items-center gap-2">
                   <div className="w-3 h-3 rounded-full bg-danger animate-pulse" />
                   Reklam Oyuncusu
                </div>
                
                {canCloseAd ? (
                  <button 
                    onClick={handleCloseAd} 
                    className="bg-danger/90 hover:bg-danger text-textMain font-black uppercase text-sm px-6 py-2.5 rounded-full border border-white/20 shadow-[0_0_20px_rgba(244,63,94,0.5)] flex items-center gap-2 animate-slide-up"
                  >
                     <X className="w-4 h-4" />
                     Ödülü Al ve Kapat
                  </button>
                ) : (
                  <div className="bg-black/50 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 text-textMain/80 font-mono font-bold text-sm shadow-xl flex items-center gap-2">
                     <Clock className="w-4 h-4 text-orange-400" />
                     {timeLeft}s...
                  </div>
                )}
              </div>
            </div>
            
            <div className="w-full aspect-video max-w-2xl bg-surface rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(255,255,255,0.1)] relative border border-white/10 z-10">
               <iframe 
                 width="100%" 
                 height="100%" 
                 src={currentAdUrl} 
                 title="Ad Video" 
                 frameBorder="0" 
                 allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                 allowFullScreen
                 className="absolute inset-0 w-full h-full pointer-events-none" // Disable pointer events so they can't pause it easily
               />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      
      {/* Full-width sticky header */}
      <header className="sticky top-0 z-20 w-full bg-bgStart/80 backdrop-blur-md border-b border-white/5">
        <div className="w-full max-w-md mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-display font-black leading-none">Mağaza</h2>
          </div>
          <div className="flex items-center gap-2 bg-yellow-500/10 text-yellow-500 px-3 py-1.5 rounded-full border border-yellow-500/20 font-bold font-mono text-sm shadow-sm">
            <Coins className="w-4 h-4" />
            {user.coins}
          </div>
        </div>
      </header>

      {/* Content wrapper */}
      <div className="w-full max-w-md mx-auto px-6 pt-6 space-y-8">
        <div>
          <h3 className="text-textMuted font-bold tracking-widest text-xs uppercase mb-4 px-2">Ücretsiz Altın Kazan</h3>
          
          <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/5 border border-yellow-500/30 p-6 rounded-[2rem] relative overflow-hidden flex flex-col items-center justify-center text-center shadow-[0_0_30px_rgba(234,179,8,0.15)]">
            <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(250,204,21,0.5)]">
              <Tv className="w-8 h-8 text-black" fill="currentColor" />
            </div>
            <h3 className="font-display font-black text-2xl text-textMain mb-2">Ödüllü Reklam İzle</h3>
            <p className="text-yellow-100/70 text-sm mb-6 max-w-[200px]">30 saniyelik kısa bir reklam izleyerek anında bedava altın kazan.</p>
            
            <button 
              onClick={handleWatchAd}
              disabled={isWatchingAd}
              className="neo-button w-full py-4 bg-yellow-400 text-black font-black font-display text-lg rounded-2xl shadow-xl flex items-center justify-center gap-2 hover:bg-yellow-300 disabled:opacity-50 transition-all"
            >
              {isWatchingAd ? (
                <>
                  <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Reklam Yükleniyor...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" fill="currentColor" />
                  İzle ve Kazan (+250)
                </>
              )}
            </button>
          </div>
        </div>

        <div>
          <h3 className="text-textMuted font-bold tracking-widest text-xs uppercase mb-4 px-2">Kozmetikler (Oyun İçi Altın)</h3>
          <div className="space-y-4 relative">
            
            {/* Theme: Neon Mavi */}
            <div className="bg-surface p-4 rounded-3xl border border-white/5 flex items-center justify-between shadow-lg blur-0">
              <div className="flex items-center gap-4 relative">
                <div className="absolute -top-6 -left-2 rotate-[-10deg] z-10">
                   <div className="bg-danger text-textMain text-[9px] font-black uppercase px-2 py-0.5 rounded-full shadow-[0_0_10px_rgba(244,63,94,0.5)] border border-white/20 animate-pulse">HOT</div>
                </div>
                <div className="w-16 h-16 rounded-2xl bg-[#0ea5e9]/20 flex items-center justify-center border border-[#0ea5e9]/30 relative">
                  <div className="w-8 h-8 rounded-full bg-[#0ea5e9] shadow-[0_0_15px_rgba(14,165,233,0.5)]" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg text-textMain">Neon Mavi</h3>
                  <p className="text-textMuted text-xs">Arayüz temasını siber mavi yapar.</p>
                </div>
              </div>
              
              {!user.inventory?.includes('theme_neon') ? (
                 <button onClick={async () => {
                   playClick();
                   const success = await useUserStore.getState().buyItem('theme_neon', 1000);
                   if (success) playSuccess();
                   else playError();
                 }} className="neo-button px-4 py-3 bg-yellow-500/10 text-yellow-500 font-bold rounded-xl border border-yellow-500/20 flex flex-col items-center justify-center gap-1 hover:bg-yellow-500/20 w-24">
                   <span className="text-[10px] tracking-wider opacity-80 uppercase">Satın Al</span>
                   <span className="flex items-center gap-1 font-black"><Coins className="w-4 h-4" /> 1000</span>
                 </button>
              ) : (
                <button onClick={() => {
                  playClick();
                  useUserStore.getState().equipItem('theme', 'theme_neon');
                }} className={`neo-button px-4 py-3 ${user.equipped?.theme === 'theme_neon' ? 'bg-primary/20 text-primary border-primary/30' : 'bg-surfaceAlt text-textMain/50 border-white/10'} font-bold rounded-xl border flex flex-col items-center justify-center gap-1 hover:bg-white/10 w-24`}>
                   <span className="text-xs tracking-wider uppercase whitespace-nowrap">{user.equipped?.theme === 'theme_neon' ? 'Kullanılıyor' : 'Kullan'}</span>
                </button>
              )}
            </div>

            {/* Theme: Kızıl Öfke */}
            <div className="bg-surface p-4 rounded-3xl border border-white/5 flex items-center justify-between shadow-lg blur-0">
              <div className="flex items-center gap-4 relative">
                <div className="absolute -top-6 -left-2 rotate-[10deg] z-10 w-fit">
                   <div className="bg-orange-500 text-textMain text-[9px] font-black uppercase px-2 py-0.5 rounded-full shadow-[0_0_10px_rgba(249,115,22,0.5)] border border-white/20 animate-pulse">TREND</div>
                </div>
                <div className="w-16 h-16 rounded-2xl bg-[#e11d48]/20 flex items-center justify-center border border-[#e11d48]/30 relative">
                  <div className="w-8 h-8 rounded-full bg-[#e11d48] shadow-[0_0_15px_rgba(225,29,72,0.5)]" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg text-textMain">Kızıl Öfke</h3>
                  <p className="text-textMuted text-xs">Oyun tahtasını kan kırmızı yapar.</p>
                </div>
              </div>
              
              {!user.inventory?.includes('theme_crimson') ? (
                 <button onClick={async () => {
                   playClick();
                   const success = await useUserStore.getState().buyItem('theme_crimson', 2500);
                   if (success) playSuccess();
                   else playError();
                 }} className="neo-button px-4 py-3 bg-yellow-500/10 text-yellow-500 font-bold rounded-xl border border-yellow-500/20 flex flex-col items-center justify-center gap-1 hover:bg-yellow-500/20 w-24">
                   <span className="text-[10px] tracking-wider opacity-80 uppercase">Satın Al</span>
                   <span className="flex items-center gap-1 font-black"><Coins className="w-4 h-4" /> 2500</span>
                 </button>
              ) : (
                <button onClick={() => {
                  playClick();
                  useUserStore.getState().equipItem('theme', 'theme_crimson');
                }} className={`neo-button px-4 py-3 ${user.equipped?.theme === 'theme_crimson' ? 'bg-primary/20 text-primary border-primary/30' : 'bg-surfaceAlt text-textMain/50 border-white/10'} font-bold rounded-xl border flex flex-col items-center justify-center gap-1 hover:bg-white/10 w-24`}>
                   <span className="text-xs tracking-wider uppercase whitespace-nowrap">{user.equipped?.theme === 'theme_crimson' ? 'Kullanılıyor' : 'Kullan'}</span>
                </button>
              )}
            </div>

            {/* Feature: Retro Ses Paketi */}
            <div className="bg-surface p-4 rounded-3xl border border-white/5 flex items-center justify-between shadow-lg blur-0">
              <div className="flex items-center gap-4 relative">
                <div className="absolute -top-6 -left-2 rotate-[-10deg] z-10 w-fit">
                   <div className="bg-purple-500 text-textMain text-[9px] font-black uppercase px-2 py-0.5 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.5)] border border-white/20 animate-pulse">NOSTALJİ</div>
                </div>
                <div className="w-16 h-16 rounded-2xl bg-purple-500/20 flex items-center justify-center border border-purple-500/30 relative">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center">
                     <Music className="w-5 h-5 text-purple-400" />
                  </div>
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg text-textMain">Retro Ses Paketi</h3>
                  <p className="text-textMuted text-xs">Tıklama seslerini 8-bit arcade yapar.</p>
                </div>
              </div>
              
              {!user.inventory?.includes('sfx_retro') ? (
                 <button onClick={async () => {
                   playClick();
                   const success = await useUserStore.getState().buyItem('sfx_retro', 750);
                   if (success) playSuccess();
                   else playError();
                 }} className="neo-button px-4 py-3 bg-yellow-500/10 text-yellow-500 font-bold rounded-xl border border-yellow-500/20 flex flex-col items-center justify-center gap-1 hover:bg-yellow-500/20 w-24">
                   <span className="text-[10px] tracking-wider opacity-80 uppercase">Satın Al</span>
                   <span className="flex items-center gap-1 font-black"><Coins className="w-4 h-4" /> 750</span>
                 </button>
              ) : (
                <button onClick={() => {
                  playClick();
                  useUserStore.getState().equipItem('sfx', 'sfx_retro');
                }} className={`neo-button px-4 py-3 ${user.equipped?.sfx === 'sfx_retro' ? 'bg-primary/20 text-primary border-primary/30' : 'bg-surfaceAlt text-textMain/50 border-white/10'} font-bold rounded-xl border flex flex-col items-center justify-center gap-1 hover:bg-white/10 w-24`}>
                   <span className="text-xs tracking-wider uppercase whitespace-nowrap">{user.equipped?.sfx === 'sfx_retro' ? 'Kullanılıyor' : 'Kullan'}</span>
                </button>
              )}
            </div>

            {/* Theme: Siberpunk */}
            <div className="bg-surface p-4 rounded-3xl border border-white/5 flex items-center justify-between shadow-lg blur-0">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-yellow-400/20 flex items-center justify-center border border-yellow-400/30">
                  <div className="w-8 h-8 rounded-full bg-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg text-textMain">Siberpunk</h3>
                  <p className="text-textMuted text-xs">Arayüzü neon sarı cyberpunk stiline sokar.</p>
                </div>
              </div>
              
              {!user.inventory?.includes('theme_cyberpunk') ? (
                 <button onClick={async () => {
                   playClick();
                   const success = await useUserStore.getState().buyItem('theme_cyberpunk', 5000);
                   if (success) playSuccess();
                   else playError();
                 }} className="neo-button px-4 py-3 bg-yellow-500/10 text-yellow-500 font-bold rounded-xl border border-yellow-500/20 flex flex-col items-center justify-center gap-1 hover:bg-yellow-500/20 w-24">
                   <span className="text-[10px] tracking-wider opacity-80 uppercase">Satın Al</span>
                   <span className="flex items-center gap-1 font-black"><Coins className="w-4 h-4" /> 5000</span>
                 </button>
              ) : (
                <button onClick={() => {
                  playClick();
                  useUserStore.getState().equipItem('theme', 'theme_cyberpunk');
                }} className={`neo-button px-4 py-3 ${user.equipped?.theme === 'theme_cyberpunk' ? 'bg-primary/20 text-primary border-primary/30' : 'bg-surfaceAlt text-textMain/50 border-white/10'} font-bold rounded-xl border flex flex-col items-center justify-center gap-1 hover:bg-white/10 w-24`}>
                   <span className="text-xs tracking-wider uppercase whitespace-nowrap">{user.equipped?.theme === 'theme_cyberpunk' ? 'Kullanılıyor' : 'Kullan'}</span>
                </button>
              )}
            </div>

            {/* Kozmetik Başlıkları Ayırma */}
            <h3 className="text-textMuted font-bold tracking-widest text-xs uppercase mb-4 mt-8 px-2">Profil Çerçeveleri</h3>
            
            {/* Frame: Alev Ruhu */}
            <div className="bg-surface p-4 rounded-3xl border border-white/5 flex items-center justify-between shadow-lg blur-0">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-orange-500/5 flex items-center justify-center border border-white/5 relative">
                  <div className="w-10 h-10 rounded-full border-2 border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.5)]" />
                  <Flame className="absolute -top-1 -right-1 w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg text-textMain">Alev Ruhu</h3>
                  <p className="text-textMuted text-xs">Profil resminin etrafına alevli bir çerçeve ekler.</p>
                </div>
              </div>
              
              {!user.inventory?.includes('frame_fire') ? (
                 <button onClick={async () => {
                   playClick();
                   const success = await useUserStore.getState().buyItem('frame_fire', 1500);
                   if (success) playSuccess();
                   else playError();
                 }} className="neo-button px-4 py-3 bg-yellow-500/10 text-yellow-500 font-bold rounded-xl border border-yellow-500/20 flex flex-col items-center justify-center gap-1 hover:bg-yellow-500/20 w-24">
                   <span className="text-[10px] tracking-wider opacity-80 uppercase">Satın Al</span>
                   <span className="flex items-center gap-1 font-black"><Coins className="w-4 h-4" /> 1500</span>
                 </button>
              ) : (
                <button onClick={() => {
                  playClick();
                  useUserStore.getState().equipItem('frame', 'frame_fire');
                }} className={`neo-button px-4 py-3 ${user.equipped?.frame === 'frame_fire' ? 'bg-orange-500/20 text-orange-500 border-orange-500/30' : 'bg-surfaceAlt text-textMain/50 border-white/10'} font-bold rounded-xl border flex flex-col items-center justify-center gap-1 hover:bg-white/10 w-24`}>
                   <span className="text-xs tracking-wider uppercase whitespace-nowrap">{user.equipped?.frame === 'frame_fire' ? 'Kullanılıyor' : 'Kullan'}</span>
                </button>
              )}
            </div>

            {/* Frame: Neon Halka */}
            <div className="bg-surface p-4 rounded-3xl border border-white/5 flex items-center justify-between shadow-lg blur-0">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-[#0ea5e9]/5 flex items-center justify-center border border-white/5 relative">
                  <div className="w-10 h-10 rounded-full border-2 border-[#0ea5e9] shadow-[0_0_15px_rgba(14,165,233,0.5)]" />
                  <Zap className="absolute -bottom-1 -left-1 w-5 h-5 text-[#0ea5e9]" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg text-textMain">Neon Halka</h3>
                  <p className="text-textMuted text-xs">Profil avatarını siber mavi neon halkanın içine alır.</p>
                </div>
              </div>
              
              {!user.inventory?.includes('frame_neon') ? (
                 <button onClick={async () => {
                   playClick();
                   const success = await useUserStore.getState().buyItem('frame_neon', 1500);
                   if (success) playSuccess();
                   else playError();
                 }} className="neo-button px-4 py-3 bg-yellow-500/10 text-yellow-500 font-bold rounded-xl border border-yellow-500/20 flex flex-col items-center justify-center gap-1 hover:bg-yellow-500/20 w-24">
                   <span className="text-[10px] tracking-wider opacity-80 uppercase">Satın Al</span>
                   <span className="flex items-center gap-1 font-black"><Coins className="w-4 h-4" /> 1500</span>
                 </button>
              ) : (
                <button onClick={() => {
                  playClick();
                  useUserStore.getState().equipItem('frame', 'frame_neon');
                }} className={`neo-button px-4 py-3 ${user.equipped?.frame === 'frame_neon' ? 'bg-[#0ea5e9]/20 text-[#0ea5e9] border-[#0ea5e9]/30' : 'bg-surfaceAlt text-textMain/50 border-white/10'} font-bold rounded-xl border flex flex-col items-center justify-center gap-1 hover:bg-white/10 w-24`}>
                   <span className="text-xs tracking-wider uppercase whitespace-nowrap">{user.equipped?.frame === 'frame_neon' ? 'Kullanılıyor' : 'Kullan'}</span>
                </button>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};



const PREDEFINED_AVATARS = [
  { id: 'UserIcon', icon: UserIcon, color: 'text-primary', bg: 'bg-primary/20' },
  { id: 'Ghost', icon: Ghost, color: 'text-purple-400', bg: 'bg-purple-500/20' },
  { id: 'Sword', icon: Sword, color: 'text-danger', bg: 'bg-danger/20' },
  { id: 'Shield', icon: Shield, color: 'text-blue-400', bg: 'bg-blue-500/20' },
  { id: 'Crown', icon: Crown, color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
  { id: 'Zap', icon: Zap, color: 'text-orange-400', bg: 'bg-orange-500/20' },
  { id: 'Heart', icon: Heart, color: 'text-pink-400', bg: 'bg-pink-500/20' },
  { id: 'Star', icon: Star, color: 'text-yellow-300', bg: 'bg-yellow-400/20' },
];

const ProfileScreen = () => {
  const { user, logout, setView } = useUserStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user?.displayName || '');
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  if (!user) {
    setView('menu');
    return null;
  }

  const handleSaveName = async () => {
    const newName = editName.trim();
    if (newName && newName !== user.displayName) {
      try {
        await updateDoc(doc(db, 'users', user.uid), { displayName: newName });
        useUserStore.setState({ user: { ...user, displayName: newName } });
      } catch (error) {
        console.error(error);
      }
    }
    setIsEditing(false);
  };

  const currentAvatarId = user.photoURL?.startsWith('icon:') ? user.photoURL.split(':')[1] : 'UserIcon';
  const CurrentIconObj = PREDEFINED_AVATARS.find(a => a.id === currentAvatarId) || PREDEFINED_AVATARS[0];
  const CurrentIcon = CurrentIconObj.icon;

  const currentTrophies = user.trophies || 0;
  const league = getLeagueInfo(currentTrophies);
  const LeagueIcon = league.icon;

  const handleSelectAvatar = async (id: string) => {
    const photoURL = `icon:${id}`;
    try {
      await updateDoc(doc(db, 'users', user.uid), { photoURL });
      useUserStore.setState({ user: { ...user, photoURL } });
    } catch (error) {
      console.error(error);
    }
    setShowAvatarModal(false);
  };

  return (
    <div className="flex flex-col w-full h-[100dvh] max-w-md mx-auto p-6 animate-fade-in relative z-10 text-textMain overflow-y-auto pb-28 scrollbar-hide">
      <div className="flex items-center gap-4 mb-4">
        <h2 className="text-3xl font-display font-black">Profilim</h2>
      </div>

      {user.winStreak && user.winStreak >= 3 ? (
         <div className="w-full bg-gradient-to-r from-orange-500/20 to-danger/20 border border-orange-500/30 rounded-2xl p-3 mb-4 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(249,115,22,0.2)]">
            <Flame className="w-5 h-5 text-orange-400 animate-pulse" />
            <span className="font-bold text-orange-400 text-sm">{user.winStreak} Maçlık Galibiyet Serisi!</span>
            <Flame className="w-5 h-5 text-orange-400 animate-pulse" />
         </div>
      ) : null}

      <div className={clsx("bg-surface border p-8 rounded-[2rem] flex flex-col items-center text-center shadow-2xl mb-6 relative", league.border)}>
        {/* League Badge floating top right */}
        <div className={clsx("absolute top-4 right-4 flex flex-col items-center justify-center p-2 rounded-xl", league.bg, league.border)}>
           <LeagueIcon className={clsx("w-6 h-6 mb-1", league.color)} />
           <span className={clsx("text-[10px] font-black uppercase tracking-widest", league.color)}>{league.name}</span>
        </div>

        <button 
          onClick={() => setShowAvatarModal(true)}
          className="relative group mb-6"
        >
          {user.photoURL && !user.photoURL.startsWith('icon:') ? (
            <img src={user.photoURL} alt="Profile" className={clsx("w-24 h-24 rounded-full border-4 object-cover", user.equipped?.frame === 'frame_fire' ? 'border-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.6)]' : 'border-surfaceAlt')} />
          ) : (
            <div className={clsx("w-24 h-24 rounded-full flex items-center justify-center border-4 transition-transform group-hover:scale-105", CurrentIconObj.bg, user.equipped?.frame === 'frame_fire' ? 'border-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.6)]' : user.equipped?.frame === 'frame_neon' ? 'border-[#0ea5e9] shadow-[0_0_20px_rgba(14,165,233,0.6)]' : 'border-surfaceAlt')}>
              <CurrentIcon className={`w-12 h-12 ${CurrentIconObj.color}`} strokeWidth={1.5} />
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 top-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Pencil className="w-6 h-6 text-textMain" />
          </div>
        </button>

        <div className="w-full flex justify-center items-center mb-1 h-12">
          {isEditing ? (
            <div className="flex items-center gap-2 bg-bgStart border border-white/10 rounded-xl p-1 px-3 w-full">
              <input
                type="text"
                autoFocus
                value={editName}
                onChange={e => setEditName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSaveName()}
                className="text-xl font-bold font-display bg-transparent text-textMain outline-none w-full text-center"
              />
              <button onClick={() => { setEditName(user.displayName || ''); setIsEditing(false); }} className="p-1.5 text-textMuted hover:text-danger hover:bg-white/5 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
              <button onClick={handleSaveName} className="p-1.5 text-primary hover:bg-primary/20 rounded-lg transition-colors">
                <Check className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <h3 className="text-2xl font-bold font-display text-textMain">{user.displayName || 'İsimsiz Oyuncu'}</h3>
              <button onClick={() => setIsEditing(true)} className="p-1.5 text-textMuted hover:text-textMain hover:bg-white/5 rounded-lg transition-colors">
                <Pencil className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
        
        <p className="text-textMuted text-sm mb-6 mt-1">{user.email}</p>

        {/* Rank Progress Bar */}
        <div className="w-full mb-6 flex flex-col items-center">
           <div className="flex justify-between w-full text-xs font-bold mb-1 px-1">
              <span className={league.color}>{league.name}</span>
              <span className="text-textMuted">{Math.floor(league.progressPercentage)}%</span>
           </div>
           <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden shadow-inner relative border border-white/5">
              <motion.div 
                 initial={{ width: 0 }}
                 animate={{ width: `${league.progressPercentage}%` }}
                 transition={{ duration: 1, ease: "easeOut" }}
                 className={clsx("h-full rounded-full bg-current", league.color)}
              />
              <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.15)25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent)] bg-[length:1rem_1rem] animate-[stripes_1s_linear_infinite]" />
           </div>
           <p className="text-[10px] text-textMuted mt-1 w-full text-center">İkinci haftada bir sezonlar sıfırlanır, kupalara göre ödüller verilir!</p>
        </div>

        <div className="w-full grid grid-cols-2 gap-4">
          <div className="bg-bgStart p-4 rounded-2xl border border-white/5 flex flex-col items-center text-center">
            <p className="text-textMuted text-[10px] font-bold uppercase mb-1">Toplam Kupa</p>
            <p className={clsx("text-2xl font-display font-black flex items-center gap-1", league.color)}>
               {currentTrophies} <span className="text-lg">🏆</span>
            </p>
          </div>
          <div className="bg-bgStart p-4 rounded-2xl border border-white/5 flex flex-col items-center text-center">
             <p className="text-textMuted text-[10px] font-bold uppercase mb-1">Galibiyet Serisi</p>
             <p className="text-2xl font-display font-black text-orange-500 flex items-center gap-1">
                {user.winStreak || 0} <Flame className="w-5 h-5" />
             </p>
          </div>
          <div className="bg-bgStart p-4 rounded-2xl border border-white/5">
            <p className="text-textMuted text-[10px] font-bold uppercase mb-1">Skor (İlerlemeli)</p>
            <p className="text-2xl font-display font-black text-primary">{user.scores?.progressive || 0}</p>
          </div>
          <div className="bg-bgStart p-4 rounded-2xl border border-white/5">
            <p className="text-textMuted text-[10px] font-bold uppercase mb-1">Skor (Zor)</p>
            <p className="text-2xl font-display font-black text-danger">{user.scores?.hard || 0}</p>
          </div>
        </div>
      </div>

      <button
        onClick={async () => {
          await logout();
        }}
        className="neo-button w-full py-4 bg-danger/10 text-danger border border-danger/20 font-bold rounded-2xl flex items-center justify-center gap-2"
      >
        <LogOut className="w-5 h-5" />
        Çıkış Yap
      </button>

      {/* Avatar Selection Modal */}
      <AnimatePresence>
        {showAvatarModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-surface border border-white/10 p-6 rounded-[2rem] w-full max-w-sm shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-display font-black">Avatar Seç</h3>
                <button onClick={() => setShowAvatarModal(false)} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
                  <X className="w-5 h-5 text-textMuted hover:text-textMain" />
                </button>
              </div>
              <div className="grid grid-cols-4 gap-4">
                {PREDEFINED_AVATARS.map((avatar) => (
                  <button
                    key={avatar.id}
                    onClick={() => handleSelectAvatar(avatar.id)}
                    className={`aspect-square rounded-2xl flex items-center justify-center border-2 transition-all hover:scale-105 ${
                      currentAvatarId === avatar.id ? 'border-white bg-white/10' : 'border-transparent bg-bgStart hover:border-white/20'
                    }`}
                  >
                    <avatar.icon className={`w-8 h-8 ${avatar.color}`} strokeWidth={1.5} />
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── DAILY QUESTS CONFIG (Moved to data/quests.ts) ─────────

const QuestsScreen = () => {
  const { user, setView, claimDailyLogin, claimPlaytimeReward } = useUserStore();
  const [dailyClaimed, setDailyClaimed] = useState(false);
  const [dailyReward, setDailyReward] = useState(0);
  const [playtimeClaimed, setPlaytimeClaimed] = useState(false);
  const [playtimeReward, setPlaytimeReward] = useState(0);
  const [isClaiming, setIsClaiming] = useState(false);

  if (!user) {
    setView('menu');
    return null;
  }

  const today = new Date().toISOString().split('T')[0];
  const weekStart = (() => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay());
    return d.toISOString().split('T')[0];
  })();

  const canClaimLogin = user.lastLoginDate !== today;
  const loginStreak = user.loginStreak || 0;
  const nextLoginReward = Math.min(200, 50 + (loginStreak + 1) * 10);

  const totalPlaytime = user.playtimeSeconds || 0;
  const lastClaimed = user.playtimeRewardClaimed || 0;
  const INTERVAL = 600;
  const unclaimed = Math.floor((totalPlaytime - lastClaimed) / INTERVAL);
  const canClaimPlaytime = unclaimed > 0;
  const nextMilestone = lastClaimed + INTERVAL;
  const playtimeToGo = Math.max(0, nextMilestone - totalPlaytime);

  const dailyQuestsList = getDailyQuests(user.uid, today);
  const weeklyQuestsList = getWeeklyQuests(user.uid, weekStart);

  const dailyProgress = user.dailyQuestsDate === today ? (user.dailyQuestsProgress || {}) : {};
  const weeklyProgress = user.weeklyQuestsDate === weekStart ? (user.weeklyQuestsProgress || {}) : {};

  const handleLoginClaim = async () => {
    if (!canClaimLogin || isClaiming) return;
    setIsClaiming(true);
    playClick();
    const earned = await claimDailyLogin();
    setDailyReward(earned);
    setDailyClaimed(true);
    if (earned > 0) playSuccess();
    setIsClaiming(false);
  };

  const handlePlaytimeClaim = async () => {
    if (!canClaimPlaytime || isClaiming) return;
    setIsClaiming(true);
    playClick();
    const earned = await claimPlaytimeReward();
    setPlaytimeReward(earned);
    setPlaytimeClaimed(true);
    if (earned > 0) playSuccess();
    setIsClaiming(false);
  };

  const fmtTime = (s: number) => `${Math.floor(s / 60)}d ${s % 60}s`;

  return (
    <div className="flex flex-col w-full h-[100dvh] max-w-md mx-auto p-6 animate-fade-in relative z-10 text-textMain pb-28 overflow-y-auto scrollbar-hide">
      <div className="flex items-center gap-4 mb-6">
        <h2 className="text-3xl font-display font-black">Görevler</h2>
      </div>

      {/* Daily Login Reward */}
      <div className="mb-6">
        <h3 className="text-textMuted font-bold tracking-widest text-xs uppercase mb-3 px-1">Günlük Giriş Ödülü</h3>
        <div className={`bg-gradient-to-br from-orange-500/20 to-orange-900/5 border ${canClaimLogin ? 'border-orange-500/40' : 'border-white/5'} p-5 rounded-[2rem] flex items-center justify-between gap-4 shadow-lg`}>
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${canClaimLogin ? 'bg-orange-500/30' : 'bg-white/5'}`}>
              <Flame className={`w-7 h-7 ${canClaimLogin ? 'text-orange-400' : 'text-textMuted'}`} />
            </div>
            <div>
              <p className="font-bold text-textMain">Giriş #{loginStreak + (canClaimLogin ? 1 : 0)}</p>
              <p className="text-textMuted text-xs">
                {canClaimLogin ? `+${nextLoginReward} altın kazanacaksın` : 'Bugün zaten toplandı'}
              </p>
              {loginStreak > 0 && (
                <p className="text-orange-400 text-[10px] font-bold mt-0.5">🔥 {loginStreak} günlük seri</p>
              )}
            </div>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleLoginClaim}
            disabled={!canClaimLogin || isClaiming}
            className={`neo-button px-5 py-3 font-black rounded-xl flex items-center justify-center gap-2 text-sm min-w-[80px] transition-all ${
              canClaimLogin
                ? 'bg-orange-500 text-textMain shadow-[0_5px_20px_rgba(249,115,22,0.3)]'
                : 'bg-white/5 text-textMuted cursor-not-allowed'
            }`}
          >
            {dailyClaimed ? <Check className="w-5 h-5 text-green-400" /> : canClaimLogin ? `Al` : `✓`}
            {dailyClaimed && <span className="text-green-400 text-xs">+{dailyReward}</span>}
          </motion.button>
        </div>
      </div>

      {/* Playtime Reward */}
      <div className="mb-6">
        <h3 className="text-textMuted font-bold tracking-widest text-xs uppercase mb-3 px-1">Oynama Ödülü</h3>
        <div className={`bg-gradient-to-br from-blue-500/20 to-blue-900/5 border ${canClaimPlaytime ? 'border-blue-500/40' : 'border-white/5'} p-5 rounded-[2rem] flex items-center justify-between gap-4 shadow-lg`}>
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${canClaimPlaytime ? 'bg-blue-500/30' : 'bg-white/5'}`}>
              <Clock className={`w-7 h-7 ${canClaimPlaytime ? 'text-blue-400' : 'text-textMuted'}`} />
            </div>
            <div>
              <p className="font-bold text-textMain">Her 10 Dakika = 100 Altın</p>
              <p className="text-textMuted text-xs">
                {canClaimPlaytime
                  ? `${unclaimed}x ödül hazır!`
                  : `Kalan: ~${fmtTime(playtimeToGo)}`
                }
              </p>
              <p className="text-blue-400/70 text-[10px] mt-0.5">Toplam: {fmtTime(totalPlaytime)}</p>
            </div>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handlePlaytimeClaim}
            disabled={!canClaimPlaytime || isClaiming}
            className={`neo-button px-5 py-3 font-black rounded-xl flex flex-col items-center gap-1 text-sm min-w-[80px] transition-all ${
              canClaimPlaytime
                ? 'bg-blue-500 text-textMain shadow-[0_5px_20px_rgba(59,130,246,0.3)]'
                : 'bg-white/5 text-textMuted cursor-not-allowed'
            }`}
          >
            {playtimeClaimed ? <Check className="w-5 h-5 text-green-400" /> : 'Al'}
            {playtimeClaimed && <span className="text-green-400 text-[10px]">+{playtimeReward}</span>}
          </motion.button>
        </div>
      </div>

      {/* Daily Quests */}
      <div className="mb-6">
        <h3 className="text-textMuted font-bold tracking-widest text-xs uppercase mb-3 px-1">Günlük Görevler</h3>
        <div className="space-y-3">
          {dailyQuestsList.map((q) => {
            const progInfo = dailyProgress[q.id] || { count: 0, claimed: false };
            const progCount = typeof progInfo === 'number' ? progInfo : progInfo.count;
            const claimed = typeof progInfo === 'number' ? false : progInfo.claimed;

            const prog = Math.min(q.target, progCount || 0);
            const done = prog >= q.target;
            return (
              <div key={q.id} className={`bg-surface border ${done ? 'border-primary/30' : 'border-white/5'} p-4 rounded-2xl flex items-center gap-4`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${done ? 'bg-primary/20' : 'bg-bgStart'}`}>
                  {done ? <Check className="w-5 h-5 text-primary" /> : <Target className="w-5 h-5 text-textMuted" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-textMain text-sm">{q.label}</p>
                  <div className="w-full bg-white/5 rounded-full h-1.5 mt-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all ${done ? 'bg-primary' : 'bg-white/30'}`}
                      style={{ width: `${(prog / q.target) * 100}%` }}
                    />
                  </div>
                  <p className="text-textMuted text-[10px] mt-1">{prog}/{q.target}</p>
                </div>
                <div className="flex-shrink-0 flex flex-col items-center gap-1.5 min-w-[60px]">
                  <div className="flex items-center gap-1 text-yellow-400 font-black text-sm">
                    <Coins className="w-4 h-4" /> {q.reward}
                  </div>
                  {done && !claimed && (
                    <button
                      onClick={() => {
                         playClick();
                         useUserStore.getState().claimQuestReward(q.id, false, q.reward);
                         playSuccess();
                      }}
                      className="px-3 py-1 bg-yellow-500/20 text-yellow-500 text-[10px] font-black uppercase rounded-lg border border-yellow-500/30 hover:bg-yellow-500/30 active:scale-95 transition-all w-full"
                    >
                      Al
                    </button>
                  )}
                  {claimed && (
                     <span className="text-primary text-[10px] font-bold uppercase w-full text-center">Alındı</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Weekly Quests */}
      <div className="mb-6">
        <h3 className="text-textMuted font-bold tracking-widest text-xs uppercase mb-3 px-1">Haftalık Görevler</h3>
        <div className="space-y-3">
          {weeklyQuestsList.map((q) => {
            const progInfo = weeklyProgress[q.id] || { count: 0, claimed: false };
            const progCount = typeof progInfo === 'number' ? progInfo : progInfo.count;
            const claimed = typeof progInfo === 'number' ? false : progInfo.claimed;

            const prog = Math.min(q.target, progCount || 0);
            const done = prog >= q.target;
            return (
              <div key={q.id} className={`bg-surface border ${done ? 'border-purple-500/30' : 'border-white/5'} p-4 rounded-2xl flex items-center gap-4`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${done ? 'bg-purple-500/20' : 'bg-bgStart'}`}>
                  {done ? <Check className="w-5 h-5 text-purple-400" /> : <Star className="w-5 h-5 text-textMuted" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-textMain text-sm">{q.label}</p>
                  <div className="w-full bg-white/5 rounded-full h-1.5 mt-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all ${done ? 'bg-purple-500' : 'bg-white/30'}`}
                      style={{ width: `${(prog / q.target) * 100}%` }}
                    />
                  </div>
                  <p className="text-textMuted text-[10px] mt-1">{prog}/{q.target}</p>
                </div>
                <div className="flex-shrink-0 flex flex-col items-center gap-1.5 min-w-[60px]">
                  <div className="flex items-center gap-1 text-yellow-400 font-black text-sm">
                    <Coins className="w-4 h-4" /> {q.reward}
                  </div>
                  {done && !claimed && (
                    <button
                      onClick={() => {
                         playClick();
                         useUserStore.getState().claimQuestReward(q.id, true, q.reward);
                         playSuccess();
                      }}
                      className="px-3 py-1 bg-yellow-500/20 text-yellow-500 text-[10px] font-black uppercase rounded-lg border border-yellow-500/30 hover:bg-yellow-500/30 active:scale-95 transition-all w-full"
                    >
                      Al
                    </button>
                  )}
                  {claimed && (
                     <span className="text-purple-400 text-[10px] font-bold uppercase w-full text-center">Alındı</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};

const VictoryScreen = () => {
  const { level, startLevel, gameMode } = useGameStore();

  useEffect(() => {
    confetti({
      particleCount: 150,
      spread: 100,
      origin: { y: 0.5 },
      colors: ['#10b981', '#f43f5e', '#ffffff']
    });
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] w-full max-w-md mx-auto p-6 gap-8 animate-slide-up relative z-10">
      <div className="bg-surface border border-white/10 p-10 rounded-[3rem] text-center flex flex-col items-center w-full shadow-2xl relative z-10 overflow-hidden">
        <h2 className="text-6xl font-display font-black text-textMain mb-2">BÖLÜM {level}</h2>
        {gameMode === 'duello' ? (
          <>
            <p className="text-danger font-bold tracking-widest text-sm mb-6">DÜELLO KAZANILDI</p>
            <div className="bg-bgStart p-4 rounded-2xl w-full border border-white/5 mb-6 flex flex-col items-center">
              <p className="text-textMuted text-[10px] font-bold uppercase tracking-wider mb-1">Kazanılan Rank Puanı</p>
              <p className="text-3xl font-mono font-black text-yellow-500 flex items-center gap-2">
                +15 🏆
              </p>
            </div>
            <p className="text-textMuted mb-8 leading-relaxed">Rakipten önce çözdün! Düellodan kupa kazandın.</p>
          </>
        ) : gameMode === 'daily' ? (
          <>
            <p className="text-orange-400 font-bold tracking-widest text-sm mb-6">GÜNLÜK MOD TAMAMLANDI</p>
            <div className="bg-bgStart p-4 rounded-2xl w-full border border-white/5 mb-6 flex flex-col items-center">
              <p className="text-textMuted text-[10px] font-bold uppercase tracking-wider mb-1">Kazanılan Altın</p>
              <p className="text-3xl font-mono font-black text-yellow-500 flex items-center gap-2">
                +50 <Coins className="w-6 h-6" />
              </p>
            </div>
            <p className="text-textMuted mb-8 leading-relaxed">Yeni günün zeka bulmacası yarın gece yarısı tekrar burada olacak. Harika iş çıkardın!</p>
          </>
        ) : (
          <>
            <p className="text-primary font-bold tracking-[0.2em] mb-6 text-sm">TAMAMLANDI</p>
            {gameMode === 'offline' ? (
              <div className="bg-bgStart p-4 rounded-2xl w-full border border-white/5 mb-8 flex flex-col items-center text-center">
                <p className="text-textMuted text-xs font-bold mb-1">ÇEVRİMDIŞI MOD</p>
                <p className="text-textMuted text-[10px] uppercase opacity-80">Altın ve skor kazanmak için çevrimiçi oyna.</p>
              </div>
            ) : (
              <div className="bg-bgStart p-4 rounded-2xl w-full border border-white/5 mb-8 flex flex-col items-center">
                <p className="text-textMuted text-[10px] font-bold uppercase tracking-wider mb-1">Kazanılan Altın</p>
                <p className="text-3xl font-mono font-black text-yellow-500 flex items-center gap-2">
                  +10 <Coins className="w-6 h-6" />
                </p>
              </div>
            )}
            <button
              onClick={() => startLevel(level + 1)}
              className="neo-button w-full py-5 bg-white text-bgStart font-display font-black text-xl rounded-2xl shadow-xl flex items-center justify-center gap-3"
            >
              <Play className="fill-current w-6 h-6" />
              Sıradaki Hedef
            </button>
          </>
        )}
        <button
          onClick={() => useUserStore.getState().setView('menu')}
          className="mt-6 text-textMuted font-bold uppercase text-sm tracking-wider hover:text-textMain"
        >
          Ana Menüye Dön
        </button>
      </div>
    </div>
  );
};

const GameOverScreen = () => {
  const { scoreCount } = useGameStore();
  const { setView } = useUserStore();

  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] w-full max-w-md mx-auto p-6 gap-8 animate-slide-up relative z-10">
      <div className="bg-surface border border-danger/20 p-10 rounded-[3rem] text-center flex flex-col items-center w-full shadow-[0_0_50px_rgba(244,63,94,0.1)] relative z-10 overflow-hidden">
        <h2 className="text-4xl font-display font-black text-textMain mb-2">SÜRE BİTTİ</h2>
        <p className="text-danger font-bold tracking-[0.2em] mb-6 text-sm">ZAMANA KARŞI MODU</p>

        <div className="bg-bgStart p-6 rounded-2xl w-full border border-white/5 mb-8">
          <p className="text-textMuted text-xs font-bold uppercase tracking-wider mb-2">Kazanılan Skor</p>
          <p className="text-5xl font-mono font-black text-purple-400">{scoreCount}</p>
        </div>

        <button
          onClick={() => {
            initAudio();
            useGameStore.getState().startLevel(1, 'time_attack', 'time_attack');
          }}
          className="neo-button w-full py-5 bg-white text-bgStart font-display font-black text-xl rounded-2xl shadow-xl flex items-center justify-center gap-3"
        >
          <RotateCcw className="w-6 h-6" />
          Tekrar Dene
        </button>
        <button
          onClick={() => setView('menu')}
          className="mt-6 text-textMuted font-bold uppercase text-sm tracking-wider hover:text-textMain"
        >
          Ana Menüye Dön
        </button>
      </div>
    </div>
  );
};

const DuelloLostScreen = () => {
  const { setView } = useUserStore();
  const { opponent } = useGameStore();

  useEffect(() => {
     // Ensure we increment play_online on unmount or first enter if not fully hooked up in gameStore
     // Actually, it's safer to just increment it when this screen opens
     useUserStore.getState().updateQuestProgress('play_online');
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] w-full max-w-md mx-auto p-6 gap-8 animate-slide-up relative z-10">
      <div className="bg-surface border border-danger/20 p-10 rounded-[3rem] text-center flex flex-col items-center w-full shadow-[0_0_50px_rgba(244,63,94,0.1)] relative z-10 overflow-hidden">
        <h2 className="text-3xl font-display font-black text-danger mb-2 uppercase break-words w-full px-2">{opponent?.displayName ? opponent.displayName : 'RAKİP'}</h2>
        <h3 className="text-2xl font-display font-black text-textMain mb-6">KAZANDI</h3>

        <div className="bg-bgStart p-6 rounded-2xl w-full border border-white/5 mb-8">
          <p className="text-2xl font-mono font-black text-danger/80 line-through">-10 Rank Puanı 🏆</p>
        </div>

        <button
          onClick={() => setView('menu')}
          className="neo-button w-full py-5 bg-white text-bgStart font-display font-black text-xl rounded-2xl shadow-xl flex items-center justify-center gap-3"
        >
          Ana Menüye Dön
        </button>
      </div>
    </div>
  );
};

const GameScreen = () => {
  const { level, gameMode, resetGrid, useHint, status, timeLeft, decrementTimeLeft, scoreCount, matchId, matchProgress, boardSize } = useGameStore();
  const { setView, user } = useUserStore();
  
  const userUid = user?.uid;
  
  const [opponentProgress, setOpponentProgress] = useState(0);
  const [myRole, setMyRole] = useState<'player1' | 'player2' | null>(null);

  useEffect(() => {
    if (status !== 'playing' && gameMode !== 'duello') return;
    if (gameMode === 'time_attack' && timeLeft !== null) {
      const timer = setInterval(() => {
        decrementTimeLeft();
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [status, timeLeft, decrementTimeLeft, gameMode]);

  useEffect(() => {
    if (gameMode !== 'duello' || !matchId) return;
    
    // Evaluate my role once
    if (userUid) {
        getDoc(doc(db, 'matches', matchId)).then(snap => {
            if (snap.exists()) {
                const data = snap.data();
                if (data.player1?.uid === userUid) setMyRole('player1');
                else setMyRole('player2');
            }
        });
    }

    // Listen to match document
    const unsubscribe = onSnapshot(doc(db, 'matches', matchId), (snap) => {
       if (snap.exists()) {
         const data = snap.data();
         if (data.status === 'finished') {
           if (data.winnerUid !== userUid && status === 'playing') {
              useGameStore.setState({ status: 'lost' });
              useUserStore.getState().updateTrophies(-10); // Penalty for losing
              useUserStore.getState().updateWinStreak(false);
              playError();
           }
         }
         
         if (data.player1?.uid === userUid) {
             setOpponentProgress(data.player2Progress || 0);
         } else {
             setOpponentProgress(data.player1Progress || 0);
         }
       }
    });

    return () => unsubscribe();
  }, [gameMode, matchId, userUid, status]);

  // Push our progress to firebase when it changes
  useEffect(() => {
     if (myRole && matchId && gameMode === 'duello' && status === 'playing') {
         updateDoc(doc(db, 'matches', matchId), {
             [`${myRole}Progress`]: matchProgress
         }).catch(() => {});
     }
  }, [matchProgress, myRole, matchId, gameMode, status]);

  useEffect(() => {
     // Handle Win Logic for Duello
     if (status === 'won' && gameMode === 'duello' && matchId && userUid) {
        updateDoc(doc(db, 'matches', matchId), {
           status: 'finished',
           winnerUid: userUid,
        }).catch(err => console.error(err));
        // Faster wins could reward more, but fixed 15 for now
        const reward = 15;
        // The store handles adding coins/quests
        useUserStore.getState().updateTrophies(reward);
        useUserStore.getState().updateWinStreak(true);
     }
  }, [status, gameMode, matchId, userUid]);

  if (status === 'won') return <VictoryScreen />;
  if (status === 'lost' && gameMode === 'time_attack') return <GameOverScreen />;
  if (status === 'lost' && gameMode === 'duello') return <DuelloLostScreen />;

  return (
    <div className="flex flex-col min-h-[100dvh] w-full relative z-10 animate-fade-in pt-safe pb-safe">
      <header className="glass-header sticky top-0 z-20 w-full relative">
        <div className="w-full max-w-md mx-auto flex items-center justify-between px-6 py-4 relative">
          <button
            onClick={() => setView('menu')}
            className="w-10 h-10 bg-surface rounded-xl flex items-center justify-center hover:bg-surfaceAlt border border-white/5 neo-button"
          >
            <ArrowLeft className="w-5 h-5 text-textMain" />
          </button>
          <div className="flex flex-col items-end shrink-0">
            <span className={clsx(
              "font-bold tracking-[0.2em] text-[10px] uppercase opacity-80",
              gameMode === 'online' ? 'text-primary' :
                gameMode === 'time_attack' ? 'text-purple-400' :
                  gameMode === 'daily' ? 'text-orange-400' :
                  gameMode === 'duello' ? 'text-danger' : 'text-textMuted'
            )}>
              {gameMode === 'online' ? 'Çevrimiçi Seri' :
                gameMode === 'time_attack' ? `Skor: ${scoreCount}` :
                  gameMode === 'daily' ? 'Günün Sorusu' :
                  gameMode === 'duello' ? `Rakip ${opponentProgress} | Sen ${matchProgress} / ${boardSize * 2}` : 'Çevrimdışı'}
            </span>
            <h1 className="text-2xl font-display font-black text-textMain">
              {gameMode === 'daily' ? 'Meydan Okuma' : gameMode === 'duello' ? '1v1 Düello' : `Bölüm ${level}`}
            </h1>
          </div>

          {/* Timer overlay for absolute center if time attack */}
          {gameMode === 'time_attack' && timeLeft !== null && (
            <div className="absolute left-1/2 -translate-x-1/2 font-mono font-black text-3xl text-purple-400 flex items-center gap-2 drop-shadow-lg pointer-events-none">
              {timeLeft}s
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center -mt-6 w-full max-w-md mx-auto">
        <Grid />
      </main>

      <footer className="p-6 flex gap-4 w-full max-w-md mx-auto">
        <button onClick={useHint} className="neo-button flex-1 py-4 bg-surface text-textMain font-bold rounded-[1.25rem] flex items-center justify-center gap-2 border border-white/5 hover:bg-surfaceAlt">
          <Lightbulb className="w-5 h-5 text-primary" />
          <span className="font-display tracking-wide">İPUCU</span>
        </button>
        <button onClick={resetGrid} className="neo-button w-16 h-16 bg-surface text-danger shrink-0 rounded-[1.25rem] flex items-center justify-center border border-white/5 hover:bg-surfaceAlt">
          <RotateCcw className="w-6 h-6" />
        </button>
      </footer>
    </div>
  );
};

export default function App() {
  const { currentView, initializeAuth, loading, user } = useUserStore();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (user?.equipped?.theme) {
      document.documentElement.setAttribute('data-theme', user.equipped.theme);
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, [user?.equipped?.theme]);

  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const button = target.closest('button');
      // Play a thud sound for all buttons EXCEPT the grid cells (they have their own specific pop sounds)
      if (button && !button.classList.contains('grid-cell')) {
        playClick();
      }
    };
    document.addEventListener('mousedown', handleGlobalClick);
    return () => document.removeEventListener('mousedown', handleGlobalClick);
  }, []);

  // Track playtime every 30 seconds while user is logged in
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      useUserStore.getState().incrementPlaytime(30);
    }, 30000);
    return () => clearInterval(interval);
  }, [user?.uid]);

  if (loading) {
    return <div className="min-h-screen bg-bgStart flex items-center justify-center text-primary font-display font-bold text-2xl animate-pulse">Yükleniyor...</div>;
  }

  // Determine slide direction based on index to create a natural flow
  const navOrder = ['quests', 'leaderboard', 'menu', 'shop', 'profile', 'settings', 'game', 'matchmaking', 'auth', 'guide'];
  const viewIndex = navOrder.indexOf(currentView);

  const getSlideVariants = () => ({
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  });

  return (
    <div className="w-full relative h-[100dvh] selection:bg-primary/30 overflow-hidden">
      <div className="bg-ambient" />
      
      <AnimatePresence mode="wait">
        <motion.div
          key={currentView}
          custom={viewIndex}
          variants={getSlideVariants()}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ type: "tween", duration: 0.15, ease: "easeOut" }}
          className="absolute inset-x-0 top-0 bottom-0"
        >
          {currentView === 'menu' && <MainMenu />}
          {currentView === 'auth' && <AuthScreen />}
          {currentView === 'matchmaking' && <MatchmakingScreen />}
          {currentView === 'game' && <GameScreen />}
          {currentView === 'guide' && <GuideScreen />}
          {currentView === 'shop' && <ShopScreen />}
          {currentView === 'leaderboard' && <LeaderboardScreen />}
          {currentView === 'profile' && <ProfileScreen />}
          {currentView === 'quests' && <QuestsScreen />}
          {currentView === 'settings' && <SettingsScreen />}
        </motion.div>
      </AnimatePresence>
      
      <BottomNav />
    </div>
  );
}

const SettingsScreen = () => {
  const { setView, user } = useUserStore();
  const t = useTranslation();
  const { soundEnabled, hapticsEnabled, language, toggleSound, toggleHaptics, setLanguage } = useSettingsStore();

  const handleThemeToggle = async () => {
    // We treat empty string '' as Dark Mode (default).
    // And 'theme_light' as Light Mode. 
    // If it's something else like 'theme_neon', this toggle will switch back to dark mode if we treat it as "dark".
    const current = document.documentElement.getAttribute('data-theme') || '';
    const isDark = current !== 'theme_light'; // treat anything other than light as dark
    const newTheme = isDark ? 'theme_light' : '';
    document.documentElement.setAttribute('data-theme', newTheme);
    
    if (user) {
      try {
        const { updateDoc, doc } = await import('firebase/firestore');
        await updateDoc(doc(db, 'users', user.uid), {
          'equipped.theme': newTheme
        });
        useUserStore.setState({ user: { ...user, equipped: { ...user.equipped, theme: newTheme } } });
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    <div className="flex flex-col w-full h-[100dvh] max-w-md mx-auto p-6 animate-slide-up relative z-10 text-textMain overflow-y-auto pb-28 scrollbar-hide">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => setView('menu')} className="p-3 bg-surface rounded-xl hover:bg-surfaceAlt border border-white/5 neo-button shrink-0">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="text-3xl font-display font-black">{t('settings')}</h2>
      </div>

      <div className="space-y-6">
        <div className="bg-surface/50 border border-white/5 rounded-3xl p-6">
          <h3 className="text-sm font-bold text-primary tracking-widest uppercase mb-6">Gorunum</h3>
          
          <div className="flex items-center justify-between mb-4">
            <span className="font-display font-medium text-lg">Karanlık Mod (Dark)</span>
            <button
              onClick={handleThemeToggle}
              className={`w-14 h-8 rounded-full transition-colors relative ${document.documentElement.getAttribute('data-theme') !== 'theme_light' ? 'bg-primary' : 'bg-surfaceAlt border border-white/10'}`}
            >
              <div className={`w-6 h-6 bg-white rounded-full absolute top-1 transition-transform ${document.documentElement.getAttribute('data-theme') !== 'theme_light' ? 'translate-x-[26px]' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>

        <div className="bg-surface/50 border border-white/5 rounded-3xl p-6">
          <h3 className="text-sm font-bold text-primary tracking-widest uppercase mb-6">{t('game_effects')}</h3>

          <div className="flex items-center justify-between mb-6">
            <span className="font-display font-medium text-lg">{t('sound_effects')}</span>
            <button
              onClick={() => {
                const newState = !soundEnabled;
                toggleSound();
                if (newState) setTimeout(() => playClick(), 50);
              }}
              className={`w-14 h-8 rounded-full transition-colors relative ${soundEnabled ? 'bg-primary' : 'bg-surfaceAlt border border-white/10'}`}
            >
              <div className={`w-6 h-6 bg-white rounded-full absolute top-1 transition-transform ${soundEnabled ? 'translate-x-[26px]' : 'translate-x-1'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <span className="font-display font-medium text-lg">{t('haptic_feedback')}</span>
            <button
              onClick={() => {
                const newState = !hapticsEnabled;
                toggleHaptics();
                if (newState) setTimeout(() => triggerHapticPop(), 50);
              }}
              className={`w-14 h-8 rounded-full transition-colors relative ${hapticsEnabled ? 'bg-primary' : 'bg-surfaceAlt border border-white/10'}`}
            >
              <div className={`w-6 h-6 bg-white rounded-full absolute top-1 transition-transform ${hapticsEnabled ? 'translate-x-[26px]' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>

        <div className="bg-surface/50 border border-white/5 rounded-3xl p-6">
          <h3 className="text-sm font-bold text-primary tracking-widest uppercase mb-6">{t('language')}</h3>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setLanguage('tr')}
              className={clsx(
                "p-4 rounded-xl font-bold font-display text-lg border transition-all",
                language === 'tr' ? "bg-primary/20 border-primary text-primary scale-105" : "bg-bgStart border-white/5 text-textMuted hover:bg-surfaceAlt"
              )}
            >
              Türkçe
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={clsx(
                "p-4 rounded-xl font-bold font-display text-lg border transition-all",
                language === 'en' ? "bg-primary/20 border-primary text-primary scale-105" : "bg-bgStart border-white/5 text-textMuted hover:bg-surfaceAlt"
              )}
            >
              English
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
