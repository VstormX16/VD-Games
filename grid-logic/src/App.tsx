import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { useGameStore } from './store/gameStore';
import { useUserStore } from './store/userStore';
import { Grid } from './components/Grid';
import {
  Play, RotateCcw, Lightbulb, Hexagon,
  Wifi, Target, User as UserIcon, LogOut, Medal, ArrowLeft, Clock, Flame, BookOpen, Lock, ShoppingBag, Coins, Settings, Swords
} from 'lucide-react';
import { collection, query, orderBy, limit, getDocs, doc, setDoc, updateDoc, onSnapshot, where, getDoc } from 'firebase/firestore';
import { db } from './lib/firebase';
import type { Difficulty } from './types/game';
import { initAudio, playClick, triggerHapticPop, playSuccess, playError } from './utils/audioHaptics';
import confetti from 'canvas-confetti';
import { useSettingsStore } from './store/settingsStore';
import { useTranslation } from './utils/i18n';

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
      <div className="flex flex-col items-center justify-center min-h-[100dvh] w-full max-w-md mx-auto p-6 gap-4 animate-fade-in relative z-10 text-white">
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
    <div className="flex flex-col h-[100dvh] overflow-hidden w-full relative z-10 text-white animate-fade-in pt-safe pb-safe">
      {/* Top Bar for Coins and Settings */}
      <header className="w-full flex justify-between items-center px-6 pt-6 pb-2 z-20 max-w-md mx-auto relative">
        <button
          onClick={() => setView('settings')}
          className="p-2.5 bg-surface/80 backdrop-blur-md rounded-xl hover:bg-surfaceAlt border border-white/5 neo-button hover:rotate-90 transition-all duration-300 shadow-lg"
        >
          <Settings className="w-5 h-5 text-textMuted hover:text-white" />
        </button>
        <div className="flex items-center gap-4 bg-surface/80 backdrop-blur-md px-4 py-2 rounded-full border border-white/5 shadow-lg">
          <div className="flex items-center gap-1.5 text-yellow-500 font-bold font-mono text-sm">
            <Coins className="w-4 h-4" />
            {user?.coins || 0}
          </div>
          <div className="w-px h-4 bg-white/10" />
          <div className="flex items-center gap-1.5 text-yellow-500 font-bold font-mono text-sm">
            🏆 {user?.trophies || 0}
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center p-6 w-full max-w-md mx-auto relative mb-16">
        <div className="w-80 h-80 bg-primary opacity-[0.05] rounded-full blur-3xl absolute top-1/4 -translate-y-1/2 pointer-events-none" />

        <div className="text-center flex flex-col items-center w-full relative mb-8">
          <div className="relative mb-6 group">
            <div className="absolute inset-0 bg-primary opacity-20 blur-xl rounded-full scale-150 transition-transform group-hover:scale-125 duration-1000" />
            <div className="w-24 h-24 bg-surface rounded-[2rem] border border-white/10 flex items-center justify-center shadow-2xl relative z-10 rotate-3">
              <Hexagon size={48} className="text-primary -rotate-3" strokeWidth={1.5} />
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/20 to-transparent rounded-b-[2rem]" />
            </div>
          </div>

          <h1 className="text-5xl font-display font-black mb-2 tracking-tight drop-shadow-md">
            VD-Games
          </h1>
          <p className="text-primary font-bold tracking-[0.3em] text-xs uppercase opacity-80">
            {t('subtitle')}
          </p>
        </div>

        <div className="w-full flex flex-col gap-4">
          <button
            onClick={() => setSelectedMode('offline')}
            className="neo-button w-full py-5 bg-surface text-textMain font-display font-bold text-lg rounded-2xl shadow-xl flex items-center justify-center gap-3 border border-white/5 hover:bg-surfaceAlt"
          >
            <Target className="w-6 h-6 text-textMuted" />
            {t('play_offline')}
          </button>

          <button
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
          </button>

          <button
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
          </button>

          <div className="flex gap-4 w-full">
            <button
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
            </button>

            <button
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
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Sticky Navigation */}
      <div className="absolute inset-x-0 bottom-6 z-30 flex justify-center w-full px-6">
        <div className="w-full max-w-sm">
          <div className="glass-header rounded-[2rem] p-1.5 flex items-center justify-between border border-white/10 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.8)] bg-surface/40 backdrop-blur-xl">
            <button
              onClick={() => setView('guide')}
              className="neo-button flex-1 py-3 flex flex-col items-center gap-1.5 text-textMuted hover:text-white rounded-[1.5rem] hover:bg-white/5 transition-all"
            >
              <BookOpen className="w-5 h-5" strokeWidth={2.5} />
              <span className="text-[10px] font-bold uppercase tracking-widest">{t('guide')}</span>
            </button>
            <button
              onClick={() => setView('leaderboard')}
              className="neo-button flex-1 py-3 flex flex-col items-center gap-1.5 text-textMuted hover:text-white rounded-[1.5rem] hover:bg-white/5 transition-all"
            >
              <Medal className="w-5 h-5" strokeWidth={2.5} />
              <span className="text-[10px] font-bold uppercase tracking-widest">{t('leaderboard')}</span>
            </button>
            <button
              onClick={() => {
                if (user) setView('shop');
                else setView('auth');
              }}
              className="neo-button flex-1 py-3 flex flex-col items-center gap-1.5 text-textMuted hover:text-yellow-400 rounded-[1.5rem] hover:bg-yellow-500/10 transition-all"
            >
              <ShoppingBag className="w-5 h-5" strokeWidth={2.5} />
              <span className="text-[10px] font-bold uppercase tracking-widest">{t('shop')}</span>
            </button>
            <button
              onClick={() => {
                if (user) setView('profile');
                else setView('auth');
              }}
              className="neo-button flex-1 py-3 flex flex-col items-center gap-1.5 text-textMuted hover:text-primary rounded-[1.5rem] hover:bg-primary/10 transition-all"
            >
              <UserIcon className="w-5 h-5" strokeWidth={2.5} />
              <span className="text-[10px] font-bold uppercase tracking-widest">{user ? t('profile') : t('login')}</span>
            </button>
          </div>
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

    const findOrCreateMatch = async () => {
      try {

        // 2. Query for waiting match
        const q = query(collection(db, 'matches'), where('status', '==', 'waiting'), limit(1));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          // Match found! Join it.
          const matchDoc = snapshot.docs[0];
          currentMatchId = matchDoc.id;
          
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
          });
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
      if (unsubscribe) unsubscribe();
      if (currentMatchId && !hasStartedGame) {
        getDoc(doc(db, 'matches', currentMatchId)).then((snap) => {
           if (snap.exists() && snap.data().status === 'waiting' && snap.data().player1.uid === userUid) {
             updateDoc(doc(db, 'matches', currentMatchId), { status: 'cancelled' });
           }
        });
      }
    };
  }, [userUid, userDisplayName, setView, startDuello]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] w-full max-w-md mx-auto p-6 gap-8 animate-fade-in relative z-10 text-white">
      <div className="w-32 h-32 rounded-full border-4 border border-danger/30 flex items-center justify-center animate-pulse relative">
        <Swords size={48} className="text-danger animate-bounce shadow-danger/50 drop-shadow-[0_0_15px_rgba(244,63,94,0.5)]" />
        <div className="absolute inset-0 rounded-full border-t-4 border-danger animate-spin" style={{ animationDuration: '2s' }} />
      </div>

      <h2 className="text-3xl font-display font-black text-center">{status}</h2>

      <button
        onClick={() => setView('menu')}
        className="mt-10 text-textMuted underline hover:text-white"
      >
        İptal Et
      </button>
    </div>
  );
};

const AuthScreen = () => {
  const { signInWithGoogle, setView, loading } = useUserStore();

  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] w-full max-w-md mx-auto p-6 gap-8 animate-fade-in relative z-10 text-white">
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
        className="text-textMuted mt-4 underline decoration-textMuted/30 hover:text-white"
      >
        Geri Dön
      </button>
    </div>
  );
};

const LeaderboardScreen = () => {
  const { setView } = useUserStore();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [leaders, setLeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Difficulty | 'trophies'>('trophies');

  useEffect(() => {
    const fetchLeaders = async () => {
      setLoading(true);
      try {
        const usersRef = collection(db, 'users');
        const q = activeTab === 'trophies'
          ? query(usersRef, orderBy('trophies', 'desc'), limit(10))
          : query(usersRef, orderBy(`scores.${activeTab}`, 'desc'), limit(10));
          
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setLeaders(data);
      } catch (error) {
        console.error("Error fetching leaderboard", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaders();
  }, [activeTab]);

  return (
    <div className="flex flex-col w-full min-h-[100dvh] max-w-md mx-auto p-6 animate-fade-in relative z-10 text-white">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => setView('menu')} className="p-3 bg-surface rounded-xl hover:bg-surfaceAlt neo-button border border-white/5">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="text-3xl font-display font-black">Liderlik Tablosu</h2>
      </div>

      <div className="flex gap-2 w-full mb-4 overflow-x-auto pb-2 scrollbar-hide">
        {[
          { id: 'trophies', label: 'Kupa 🏆' },
          { id: 'progressive', label: 'İlerlemeli' },
          { id: 'easy', label: 'Kolay' },
          { id: 'medium', label: 'Orta' },
          { id: 'hard', label: 'Zor' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as Difficulty | 'trophies')}
            className={clsx(
              "px-4 py-2 font-bold font-display rounded-xl whitespace-nowrap transition-colors border border-white/5",
              activeTab === tab.id ? "bg-primary text-white" : "bg-surface text-textMuted hover:bg-surfaceAlt"
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
          <div className="flex flex-col gap-2">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {leaders.map((u: any, i) => (
              <div key={u.id} className="bg-surface p-4 rounded-2xl flex items-center justify-between border border-white/5">
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${i === 0 ? 'bg-yellow-500/20 text-yellow-500' :
                      i === 1 ? 'bg-gray-400/20 text-gray-400' :
                        i === 2 ? 'bg-orange-500/20 text-orange-500' : 'bg-white/5 text-textMuted'
                    }`}>
                    {i + 1}
                  </div>
                  <div>
                    <h3 className="font-bold">{u.displayName || 'İsimsiz Oyuncu'}</h3>
                    {activeTab !== 'trophies' && <p className="text-xs text-textMuted">Max Lvl: {u.levels?.[activeTab] || 1}</p>}
                  </div>
                </div>
                <div className="font-display font-black text-primary text-xl flex items-center gap-1">
                  {activeTab === 'trophies' ? (u.trophies || 0) : (u.scores?.[activeTab] || 0)}
                  {activeTab === 'trophies' && <span className="text-yellow-500 text-sm">🏆</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const GuideScreen = () => {
  const { setView } = useUserStore();

  return (
    <div className="flex flex-col w-full min-h-[100dvh] max-w-md mx-auto p-6 animate-slide-up relative z-10 text-white overflow-y-auto pb-12">
      <div className="flex items-center gap-4 mb-8 sticky top-0 py-2 bg-bgStart/90 backdrop-blur z-20">
        <button onClick={() => setView('menu')} className="p-3 bg-surface rounded-xl hover:bg-surfaceAlt neo-button border border-white/5 shrink-0">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="text-3xl font-display font-black leading-none">Nasıl Oynanır?</h2>
      </div>

      <div className="space-y-6">
        {/* Basic Rules */}
        <div className="bg-surface p-6 rounded-[2rem] border border-white/5">
          <h3 className="text-xl font-display font-bold text-primary mb-3">Temel Kural</h3>
          <p className="text-textMuted text-sm leading-relaxed mb-4">
            Oyunun amacı çok basit: <span className="text-white font-bold">Kutuları seçerek</span> (üzerlerine tıklayıp zümrüt yeşili yaparak) satırların sonunda ve sütunların altında yazan
            <span className="text-white font-bold"> Hedef Sayılara</span> ulaşmak.
          </p>
          <p className="text-textMuted text-sm leading-relaxed">
            Tüm satır ve sütun hedefleri <span className="text-primary font-bold bg-primary/20 px-1 rounded">Yeşil</span> olduğunda o bölümü kazanırsın!
          </p>
        </div>

        {/* Locked Boxes */}
        <div className="bg-surface p-6 rounded-[2rem] border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-[100px] pointer-events-none" />
          <Lock className="absolute top-6 right-6 w-8 h-8 text-white/20" />

          <h3 className="text-xl font-display font-bold text-white mb-3">Asma Kilitli Kutular</h3>
          <p className="text-textMuted text-sm leading-relaxed mb-3">
            Bölümler ilerledikçe bazı kutularda asma kilit 🔒 göreceksin. Kilitli kutulara <span className="text-white font-bold underline">dokunamazsın.</span>
          </p>
          <ul className="text-sm space-y-2 text-textMuted">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">■</span>
              <span>Eğer kilit <span className="text-white font-bold">Yeşil (Aktif)</span> durumdaysa, o sayı sana yardım olsun diye otomatik olarak verilmiştir ve hesaba katılmaz zorundadır.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-textMuted/50 mt-0.5">■</span>
              <span>Eğer kilit <span className="text-white font-bold">Gri (Pasif)</span> durumdaysa, o sayıyı kesinlikle kullanmamanı ister.</span>
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
            Zor zorluklarda bazı kutuların köşesinde "Kırmızı Eksi" bulunur. Bunlara tıkladığında sayıyı <span className="text-white font-bold">TOPLAMAZ, hedefinden ÇIKARIR.</span>
          </p>
          <div className="bg-bgStart/50 p-3 rounded-xl border border-danger/10 text-xs text-textMuted/90">
            <span className="text-danger font-bold">Örnek:</span> Hedefin 10 ise ve elinde [7], [5] ve [-2] varsa;<br />
            7'yi aç + 5'i aç + kırmızı 2'yi aç =  <span className="text-white font-bold">7 + 5 - 2 = 10!</span>
          </div>
        </div>

        {/* Unknown Boxes */}
        <div className="bg-surface p-6 rounded-[2rem] border border-white/5 relative overflow-hidden">
          <div className="absolute top-6 right-6 text-4xl font-display font-black text-white/10">?</div>

          <h3 className="text-xl font-display font-bold text-white mb-3">Gizli Kutular</h3>
          <p className="text-textMuted text-sm leading-relaxed mb-3">
            Gerçek zeka testi burada başlar. İleri seviyelerde kutuların içinde sayı yerine <span className="text-white font-bold text-lg">?</span> yazar.
            İçinde ne yazdığını ancak satırın sonundaki hedeften geriye doğru matematik yaparak Sudoku gibi tahmin edebilirsin!
          </p>
        </div>

      </div>
    </div>
  );
};

const ShopScreen = () => {
  const { user, setView } = useUserStore();
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<{coins: number, price: string, name: string} | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Form states for the mock checkout
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');

  if (!user) {
    setView('menu');
    return null;
  }

  const coinPackages = [
    { name: "Başlangıç Paketi", coins: 500, price: "19.90", popular: false },
    { name: "Uzman Paketi", coins: 1500, price: "49.90", popular: true },
    { name: "Efsanevi Kasa", coins: 5000, price: "149.90", popular: false },
  ];

  const handleBuyClick = (pkg: {coins: number, price: string, name: string}) => {
    playClick();
    setSelectedPackage(pkg);
    setIsCheckoutOpen(true);
    setPaymentSuccess(false);
    // Reset forms
    setCardName(''); 
    setCardNumber('');
    setExpiry('');
    setCvv('');
  };

  const processPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPackage) return;
    
    setIsProcessing(true);
    playClick();

    // Simulate network request to PayTR API
    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
      // Top up user's account in firebase
      const { doc, updateDoc, increment } = await import('firebase/firestore');
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        coins: increment(selectedPackage.coins)
      });
      
      // Update local state instantly
      useUserStore.setState({ user: { ...user, coins: (user.coins || 0) + selectedPackage.coins } });
      
      setPaymentSuccess(true);
      playSuccess();
      
      // Close modal after showing success message
      setTimeout(() => {
        setIsCheckoutOpen(false);
        setIsProcessing(false);
        setSelectedPackage(null);
      }, 2000);

    } catch (error) {
      console.error("Payment failed", error);
      setIsProcessing(false);
      playError();
      alert("Ödeme sırasında bir hata oluştu.");
    }
  };

  return (
    <div className="flex flex-col w-full min-h-[100dvh] animate-slide-up relative z-10 text-white overflow-y-auto pb-12">
      
      {/* Full-width sticky header */}
      <header className="sticky top-0 z-20 w-full bg-bgStart/80 backdrop-blur-md border-b border-white/5">
        <div className="w-full max-w-md mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <button onClick={() => setView('menu')} className="p-2.5 bg-surface rounded-xl hover:bg-surfaceAlt neo-button border border-white/5 shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </button>
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
          <h3 className="text-textMuted font-bold tracking-widest text-xs uppercase mb-4 px-2">Altın Paketleri (Gerçek Para)</h3>
          <div className="grid grid-cols-1 gap-4">
            {coinPackages.map((pkg, idx) => (
              <div key={idx} className={`bg-surface p-5 rounded-3xl border ${pkg.popular ? 'border-primary/50 shadow-[0_0_20px_rgba(16,185,129,0.1)]' : 'border-white/5'} flex items-center justify-between relative`}>
                {pkg.popular && (
                  <div className="absolute -top-3 left-6 bg-primary text-bgStart text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                    En Popüler
                  </div>
                )}
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${pkg.popular ? 'bg-yellow-500/20 border-yellow-500/50' : 'bg-white/5 border-white/10'}`}>
                    <Coins className={`w-8 h-8 ${pkg.popular ? 'text-yellow-400' : 'text-yellow-500/70'}`} />
                  </div>
                  <div className="flex flex-col">
                     <span className="font-display font-black text-2xl text-yellow-400">{pkg.coins}</span>
                     <span className="text-textMuted text-xs">{pkg.name}</span>
                  </div>
                </div>
                
                <button 
                  onClick={() => handleBuyClick(pkg)}
                  className="neo-button px-5 py-3 bg-white text-bgStart font-black rounded-xl hover:bg-gray-200 transition-colors"
                >
                  {pkg.price} ₺
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-textMuted font-bold tracking-widest text-xs uppercase mb-4 px-2">Kozmetikler (Oyun İçi Altın)</h3>
          <div className="space-y-4 relative">
            
            {/* Theme: Neon Mavi */}
            <div className="bg-surface p-4 rounded-3xl border border-white/5 flex items-center justify-between shadow-lg blur-0">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-[#0ea5e9]/20 flex items-center justify-center border border-[#0ea5e9]/30">
                  <div className="w-8 h-8 rounded-full bg-[#0ea5e9] shadow-[0_0_15px_rgba(14,165,233,0.5)]" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg text-white">Neon Mavi</h3>
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
                }} className={`neo-button px-4 py-3 ${user.equipped?.theme === 'theme_neon' ? 'bg-primary/20 text-primary border-primary/30' : 'bg-surfaceAlt text-white/50 border-white/10'} font-bold rounded-xl border flex flex-col items-center justify-center gap-1 hover:bg-white/10 w-24`}>
                   <span className="text-xs tracking-wider uppercase whitespace-nowrap">{user.equipped?.theme === 'theme_neon' ? 'Kullanılıyor' : 'Kullan'}</span>
                </button>
              )}
            </div>

            {/* Theme: Kızıl Öfke */}
            <div className="bg-surface p-4 rounded-3xl border border-white/5 flex items-center justify-between shadow-lg blur-0">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-[#e11d48]/20 flex items-center justify-center border border-[#e11d48]/30">
                  <div className="w-8 h-8 rounded-full bg-[#e11d48] shadow-[0_0_15px_rgba(225,29,72,0.5)]" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg text-white">Kızıl Öfke</h3>
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
                }} className={`neo-button px-4 py-3 ${user.equipped?.theme === 'theme_crimson' ? 'bg-primary/20 text-primary border-primary/30' : 'bg-surfaceAlt text-white/50 border-white/10'} font-bold rounded-xl border flex flex-col items-center justify-center gap-1 hover:bg-white/10 w-24`}>
                   <span className="text-xs tracking-wider uppercase whitespace-nowrap">{user.equipped?.theme === 'theme_crimson' ? 'Kullanılıyor' : 'Kullan'}</span>
                </button>
              )}
            </div>

            {/* Feature: Retro Ses Paketi */}
            <div className="bg-surface p-4 rounded-3xl border border-white/5 flex items-center justify-between shadow-lg blur-0">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-purple-400">
                     <span className="material-symbols-rounded">music_note</span>
                  </div>
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg text-white">Retro Ses Paketi</h3>
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
                }} className={`neo-button px-4 py-3 ${user.equipped?.sfx === 'sfx_retro' ? 'bg-primary/20 text-primary border-primary/30' : 'bg-surfaceAlt text-white/50 border-white/10'} font-bold rounded-xl border flex flex-col items-center justify-center gap-1 hover:bg-white/10 w-24`}>
                   <span className="text-xs tracking-wider uppercase whitespace-nowrap">{user.equipped?.sfx === 'sfx_retro' ? 'Kullanılıyor' : 'Kullan'}</span>
                </button>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Mock PayTR Checkout Modal */}
      {isCheckoutOpen && selectedPackage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="bg-white text-gray-900 w-full max-w-sm rounded-[2rem] p-6 shadow-2xl relative overflow-hidden animate-slide-up">
            
            {/* PayTR Header */}
            <div className="flex items-center justify-between border-b pb-4 mb-4">
               <div>
                 <p className="text-xs text-gray-500 font-medium">Güvenli Ödeme</p>
                 <div className="flex items-center gap-1">
                   <Lock className="w-3 h-3 text-green-600" />
                   <p className="font-bold text-lg text-gray-800">PayTR.</p>
                 </div>
               </div>
               <div className="text-right">
                 <p className="text-xs text-gray-500 font-medium">Ödenecek Tutar</p>
                 <p className="font-black text-xl text-blue-600">{selectedPackage.price} TL</p>
               </div>
            </div>

            {paymentSuccess ? (
              <div className="py-10 flex flex-col items-center justify-center animate-fade-in text-center">
                 <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                   <div className="w-8 h-8 rounded-full border-4 border-green-500 border-t-transparent animate-spin" style={{ animationIterationCount: 1, animationDuration: '0.5s' }} />
                   <div className="absolute font-bold text-green-500 text-2xl">✓</div>
                 </div>
                 <h3 className="text-2xl font-black text-gray-900 mb-2">Ödeme Başarılı!</h3>
                 <p className="text-gray-500">+{selectedPackage.coins} Altın hesabınıza eklendi.</p>
              </div>
            ) : (
              <form onSubmit={processPayment} className="space-y-4">
                <div className="bg-blue-50 text-blue-800 text-xs p-3 rounded-xl mb-4 border border-blue-100">
                  <span className="font-bold">TEST MODU:</span> Bu simüle edilmiş bir ödeme ekranıdır. Lütfen rastgele sayılar giriniz. Gerçek para çekilmez.
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Kart Üzerindeki İsim</label>
                  <input 
                    type="text" required
                    value={cardName} onChange={e => setCardName(e.target.value)}
                    placeholder="Ad Soyad"
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all font-medium placeholder:text-gray-400"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Kart Numarası</label>
                  <input 
                    type="text" required maxLength={19}
                    value={cardNumber} onChange={e => setCardNumber(e.target.value.replace(/\D/g, '').replace(/(\d{4})/g, '$1 ').trim())}
                    placeholder="0000 0000 0000 0000"
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all font-mono placeholder:text-gray-400"
                  />
                </div>

                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Son Kulla. (AA/YY)</label>
                    <input 
                      type="text" required maxLength={5}
                      value={expiry} onChange={e => setExpiry(e.target.value.replace(/\D/g, '').replace(/(\d{2})(\d{1,2})/, '$1/$2').trim())}
                      placeholder="MM/YY"
                      className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all font-mono placeholder:text-gray-400"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">CVV</label>
                    <input 
                      type="text" required maxLength={3}
                      value={cvv} onChange={e => setCvv(e.target.value.replace(/\D/g, ''))}
                      placeholder="123"
                      className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all font-mono placeholder:text-gray-400"
                    />
                  </div>
                </div>

                <div className="pt-2 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsCheckoutOpen(false)}
                    disabled={isProcessing}
                    className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-50 rounded-xl transition-colors disabled:opacity-50"
                  >
                    İptal
                  </button>
                  <button 
                    type="submit"
                    disabled={isProcessing}
                    className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-[0_5px_15px_rgba(37,99,235,0.3)] transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        İşleniyor...
                      </>
                    ) : (
                      `Onayla ve Öde`
                    )}
                  </button>
                </div>
              </form>
            )}
            
            {/* PayTR Footer logos */}
            <div className="flex justify-center gap-2 mt-6 border-t pt-4 opacity-50 grayscale">
               <div className="h-6 w-10 bg-gray-200 rounded animate-pulse" />
               <div className="h-6 w-10 bg-gray-200 rounded animate-pulse" />
               <div className="h-6 w-10 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ProfileScreen = () => {
  const { user, logout, setView } = useUserStore();

  if (!user) {
    setView('menu');
    return null;
  }

  return (
    <div className="flex flex-col w-full min-h-[100dvh] max-w-md mx-auto p-6 animate-fade-in relative z-10 text-white">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => setView('menu')} className="p-3 bg-surface rounded-xl hover:bg-surfaceAlt neo-button">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="text-3xl font-display font-black">Profilim</h2>
      </div>

      <div className="bg-surface border border-white/5 p-8 rounded-[2rem] flex flex-col items-center text-center shadow-2xl mb-6">
        {user.photoURL ? (
          <img src={user.photoURL} alt="Profile" className="w-24 h-24 rounded-full border-4 border-surfaceAlt mb-4" />
        ) : (
          <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mb-4">
            <UserIcon className="w-12 h-12 text-primary" />
          </div>
        )}

        <input
          type="text"
          defaultValue={user.displayName || 'İsimsiz Oyuncu'}
          onBlur={async (e) => {
            const newName = e.target.value.trim();
            if (newName && newName !== user.displayName) {
              try {
                const { doc, updateDoc } = await import('firebase/firestore');
                const userRef = doc(db, 'users', user.uid);
                await updateDoc(userRef, { displayName: newName });
                useUserStore.setState({ user: { ...user, displayName: newName } });
              } catch (error) {
                console.error(error);
              }
            }
          }}
          className="text-2xl font-bold font-display mb-1 bg-transparent border-b border-dashed border-textMuted/30 focus:border-primary text-center outline-none transition-colors w-full px-2 py-1"
        />
        <p className="text-textMuted text-sm mb-6 mt-1">{user.email}</p>

        <div className="w-full grid grid-cols-2 gap-4">
          <div className="bg-bgStart p-4 rounded-2xl border border-white/5">
            <p className="text-textMuted text-[10px] font-bold uppercase mb-1">Skor (İlerlemeli)</p>
            <p className="text-2xl font-display font-black text-primary">{user.scores?.progressive || 0}</p>
          </div>
          <div className="bg-bgStart p-4 rounded-2xl border border-white/5">
            <p className="text-textMuted text-[10px] font-bold uppercase mb-1">Maks Seviye</p>
            <p className="text-2xl font-display font-black text-white">{user.levels?.progressive || 1}</p>
          </div>
          <div className="bg-bgStart p-4 rounded-2xl border border-white/5">
            <p className="text-textMuted text-[10px] font-bold uppercase mb-1">Skor (Zor)</p>
            <p className="text-2xl font-display font-black text-danger">{user.scores?.hard || 0}</p>
          </div>
          <div className="bg-bgStart p-4 rounded-2xl border border-white/5">
            <p className="text-textMuted text-[10px] font-bold uppercase mb-1">Maks Seviye</p>
            <p className="text-2xl font-display font-black text-white">{user.levels?.hard || 1}</p>
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
        <h2 className="text-6xl font-display font-black text-white mb-2">BÖLÜM {level}</h2>
        {gameMode === 'duello' ? (
          <>
            <p className="text-danger font-bold tracking-widest text-sm mb-6">DÜELLO KAZANILDI</p>
            <div className="bg-bgStart p-4 rounded-2xl w-full border border-white/5 mb-6 flex flex-col items-center">
              <p className="text-textMuted text-[10px] font-bold uppercase tracking-wider mb-1">Kazanılan Kupa</p>
              <p className="text-3xl font-mono font-black text-yellow-500 flex items-center gap-2">
                +10 🏆
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
          className="mt-6 text-textMuted font-bold uppercase text-sm tracking-wider hover:text-white"
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
        <h2 className="text-4xl font-display font-black text-white mb-2">SÜRE BİTTİ</h2>
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
          className="mt-6 text-textMuted font-bold uppercase text-sm tracking-wider hover:text-white"
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

  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] w-full max-w-md mx-auto p-6 gap-8 animate-slide-up relative z-10">
      <div className="bg-surface border border-danger/20 p-10 rounded-[3rem] text-center flex flex-col items-center w-full shadow-[0_0_50px_rgba(244,63,94,0.1)] relative z-10 overflow-hidden">
        <h2 className="text-3xl font-display font-black text-danger mb-2 uppercase break-words w-full px-2">{opponent?.displayName ? opponent.displayName : 'RAKİP'}</h2>
        <h3 className="text-2xl font-display font-black text-white mb-6">KAZANDI</h3>

        <div className="bg-bgStart p-6 rounded-2xl w-full border border-white/5 mb-8">
          <p className="text-2xl font-mono font-black text-danger/80 line-through">-5 Kupa 🏆</p>
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
              useUserStore.getState().updateTrophies(-5);
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
        useUserStore.getState().updateTrophies(10);
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
            <h1 className="text-2xl font-display font-black text-white">
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

  if (loading) {
    return <div className="min-h-screen bg-bgStart flex items-center justify-center text-primary font-display font-bold text-2xl animate-pulse">Yükleniyor...</div>;
  }

  return (
    <div className="w-full relative min-h-screen selection:bg-primary/30">
      <div className="bg-ambient" />
      {currentView === 'menu' && <MainMenu />}
      {currentView === 'auth' && <AuthScreen />}
      {currentView === 'matchmaking' && <MatchmakingScreen />}
      {currentView === 'game' && <GameScreen />}
      {currentView === 'guide' && <GuideScreen />}
      {currentView === 'shop' && <ShopScreen />}
      {currentView === 'leaderboard' && <LeaderboardScreen />}
      {currentView === 'profile' && <ProfileScreen />}
      {currentView === 'settings' && <SettingsScreen />}
    </div>
  );
}

const SettingsScreen = () => {
  const { setView } = useUserStore();
  const t = useTranslation();
  const { soundEnabled, hapticsEnabled, language, toggleSound, toggleHaptics, setLanguage } = useSettingsStore();

  return (
    <div className="flex flex-col w-full min-h-[100dvh] max-w-md mx-auto p-6 animate-slide-up relative z-10 text-white">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => setView('menu')} className="p-3 bg-surface rounded-xl hover:bg-surfaceAlt border border-white/5 neo-button shrink-0">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="text-3xl font-display font-black">{t('settings')}</h2>
      </div>

      <div className="space-y-6">
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
