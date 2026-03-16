import { create } from 'zustand';
import type { UserProfile, AppView } from '../types/game';
import { auth, db, googleProvider } from '../lib/firebase';
import { signInWithPopup, signOut, onAuthStateChanged, type User } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

interface UserState {
  user: UserProfile | null;
  loading: boolean;
  currentView: AppView;
  
  // Actions
  setView: (view: AppView) => void;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateScore: (points: number, levelInfo: number, difficulty: import('../types/game').Difficulty) => Promise<void>;
  updateCoins: (amount: number) => Promise<void>;
  updateTrophies: (amount: number) => Promise<void>;
  buyItem: (itemId: string, cost: number) => Promise<boolean>;
  equipItem: (category: string, itemId: string) => Promise<void>;
  claimDailyLogin: () => Promise<number>; // returns coins earned
  claimPlaytimeReward: () => Promise<number>; // returns coins earned
  incrementPlaytime: (seconds: number) => void;
  updateQuestProgress: (questId: string, isWeekly: boolean) => Promise<void>;
  initializeAuth: () => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  loading: true,
  currentView: 'menu',

  setView: (view) => set({ currentView: view }),

  signInWithGoogle: async () => {
    try {
      set({ loading: true });
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Check if user exists in Firestore
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      
      let profile: UserProfile;
      if (userSnap.exists()) {
        profile = userSnap.data() as UserProfile;
        if (!profile.scores) {
          profile.scores = { easy: 0, medium: 0, hard: 0, progressive: profile.totalScore || 0, time_attack: 0, daily: 0 };
          profile.levels = { easy: 1, medium: 1, hard: 1, progressive: profile.highestLevel || 1, time_attack: 1, daily: 1 };
        }
        if (typeof profile.coins !== 'number') profile.coins = 0;
        if (typeof profile.trophies !== 'number') profile.trophies = 0;
        if (!profile.inventory) profile.inventory = [];
        if (!profile.equipped) profile.equipped = {};
        if (typeof profile.playtimeSeconds !== 'number') profile.playtimeSeconds = 0;
        if (typeof profile.playtimeRewardClaimed !== 'number') profile.playtimeRewardClaimed = 0;
        if (typeof profile.loginStreak !== 'number') profile.loginStreak = 0;
      } else {
        profile = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          scores: { easy: 0, medium: 0, hard: 0, progressive: 0, time_attack: 0, daily: 0 },
          levels: { easy: 1, medium: 1, hard: 1, progressive: 1, time_attack: 1, daily: 1 },
          coins: 100, // Welcome bonus
          trophies: 0,
          inventory: [],
          equipped: {}
        };
        await setDoc(userRef, profile);
      }
      
      set({ user: profile, currentView: 'menu' });
    } catch (error) {
      console.error("Login failed:", error);
    } finally {
      set({ loading: false });
    }
  },

  logout: async () => {
    try {
      await signOut(auth);
      set({ user: null, currentView: 'menu' });
    } catch (error) {
      console.error("Logout failed:", error);
    }
  },

  updateScore: async (points, levelInfo, difficulty) => {
    const { user } = get();
    if (!user) return;

    const newScore = (user.scores[difficulty] || 0) + points;
    const newHighestLevel = Math.max(user.levels[difficulty] || 1, levelInfo);
    
    const newProfile = {
      ...user,
      scores: { ...user.scores, [difficulty]: newScore },
      levels: { ...user.levels, [difficulty]: newHighestLevel }
    };
    
    set({ user: newProfile });
    
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        [`scores.${difficulty}`]: newScore,
        [`levels.${difficulty}`]: newHighestLevel
      });
    } catch (error) {
      console.error("Error updating score:", error);
    }
  },

  updateCoins: async (amount) => {
    const { user } = get();
    if (!user) return;
    
    const newCoins = (user.coins || 0) + amount;
    set({ user: { ...user, coins: newCoins } });
    
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { coins: newCoins });
    } catch (error) {
       console.error("Error updating coins:", error);
    }
  },

  updateTrophies: async (amount) => {
    const { user } = get();
    if (!user) return;
    
    // Trophies cannot be less than 0
    const newTrophies = Math.max(0, (user.trophies || 0) + amount);
    set({ user: { ...user, trophies: newTrophies } });
    
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { trophies: newTrophies });
    } catch (error) {
       console.error("Error updating trophies:", error);
    }
  },

  buyItem: async (itemId: string, cost: number) => {
    const { user } = get();
    if (!user || user.coins < cost) return false;
    
    // Check if already owned
    const inventory = user.inventory || [];
    if (inventory.includes(itemId)) return false;

    const newCoins = user.coins - cost;
    const newInventory = [...inventory, itemId];
    
    // Optimistic update
    set({ user: { ...user, coins: newCoins, inventory: newInventory } });
    
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { 
        coins: newCoins,
        inventory: newInventory
      });
      return true;
    } catch (error) {
      console.error("Error buying item:", error);
      // Revert optimism if needed (ignoring for now to keep it simple)
      return false;
    }
  },

  equipItem: async (category: string, itemId: string) => {
    const { user } = get();
    if (!user) return;
    
    const equipped = user.equipped || {};
    // If selecting same item, unequip it
    const newEquipped = { ...equipped };
    if (newEquipped[category] === itemId) {
       delete newEquipped[category];
    } else {
       newEquipped[category] = itemId;
    }

    set({ user: { ...user, equipped: newEquipped } });
    
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { equipped: newEquipped });
    } catch (error) {
       console.error("Error equipping item:", error);
    }
  },

  claimDailyLogin: async () => {
    const { user } = get();
    if (!user) return 0;

    const today = new Date().toISOString().split('T')[0];
    if (user.lastLoginDate === today) return 0; // Already claimed

    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const newStreak = user.lastLoginDate === yesterday ? (user.loginStreak || 0) + 1 : 1;
    
    // Base reward = 50 coins + 10 per streak (up to 200)
    const reward = Math.min(200, 50 + newStreak * 10);
    const newCoins = (user.coins || 0) + reward;

    const updatedUser = { ...user, coins: newCoins, lastLoginDate: today, loginStreak: newStreak };
    set({ user: updatedUser });

    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { coins: newCoins, lastLoginDate: today, loginStreak: newStreak });
    } catch (e) {
      console.error(e);
    }
    return reward;
  },

  incrementPlaytime: (seconds: number) => {
    const { user } = get();
    if (!user) return;
    const newPlaytime = (user.playtimeSeconds || 0) + seconds;
    set({ user: { ...user, playtimeSeconds: newPlaytime } });
  },

  claimPlaytimeReward: async () => {
    const { user } = get();
    if (!user) return 0;

    const totalSeconds = user.playtimeSeconds || 0;
    const lastClaimed = user.playtimeRewardClaimed || 0;
    const REWARD_INTERVAL = 600; // 10 minutes
    const unclaimed = Math.floor((totalSeconds - lastClaimed) / REWARD_INTERVAL);
    if (unclaimed <= 0) return 0;

    const reward = unclaimed * 100;
    const newCoins = (user.coins || 0) + reward;
    const newClaimed = lastClaimed + unclaimed * REWARD_INTERVAL;
    const updatedUser = { ...user, coins: newCoins, playtimeRewardClaimed: newClaimed };
    set({ user: updatedUser });

    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { coins: newCoins, playtimeRewardClaimed: newClaimed });
    } catch (e) {
      console.error(e);
    }
    return reward;
  },

  updateQuestProgress: async (questId: string, isWeekly: boolean) => {
    const { user } = get();
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];
    const weekStart = (() => {
      const d = new Date();
      d.setDate(d.getDate() - d.getDay());
      return d.toISOString().split('T')[0];
    })();

    if (isWeekly) {
      const progress = user.weeklyQuestsDate === weekStart ? { ...(user.weeklyQuestsProgress || {}) } : {};
      progress[questId] = (progress[questId] || 0) + 1;
      const updated = { ...user, weeklyQuestsDate: weekStart, weeklyQuestsProgress: progress };
      set({ user: updated });
      try {
        await updateDoc(doc(db, 'users', user.uid), { weeklyQuestsDate: weekStart, weeklyQuestsProgress: progress });
      } catch (e) { console.error(e); }
    } else {
      const progress = user.dailyQuestsDate === today ? { ...(user.dailyQuestsProgress || {}) } : {};
      progress[questId] = (progress[questId] || 0) + 1;
      const updated = { ...user, dailyQuestsDate: today, dailyQuestsProgress: progress };
      set({ user: updated });
      try {
        await updateDoc(doc(db, 'users', user.uid), { dailyQuestsDate: today, dailyQuestsProgress: progress });
      } catch (e) { console.error(e); }
    }
  },

  initializeAuth: () => {
    onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      if (firebaseUser) {
        const userRef = doc(db, 'users', firebaseUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const ud = userSnap.data() as UserProfile;
          if (!ud.scores) {
             ud.scores = { easy: 0, medium: 0, hard: 0, progressive: ud.totalScore || 0, time_attack: 0, daily: 0 };
             ud.levels = { easy: 1, medium: 1, hard: 1, progressive: ud.highestLevel || 1, time_attack: 1, daily: 1 };
          }
          if (typeof ud.coins !== 'number') ud.coins = 0;
          if (typeof ud.trophies !== 'number') ud.trophies = 0;
          if (!ud.inventory) ud.inventory = [];
          if (!ud.equipped) ud.equipped = {};
          if (typeof ud.playtimeSeconds !== 'number') ud.playtimeSeconds = 0;
          if (typeof ud.playtimeRewardClaimed !== 'number') ud.playtimeRewardClaimed = 0;
          if (typeof ud.loginStreak !== 'number') ud.loginStreak = 0;
          set({ user: ud, loading: false });
        } else {
          set({ user: null, loading: false }); // Failsafe
        }
      } else {
        set({ user: null, loading: false });
      }
    });
  }
}));
