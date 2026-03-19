import { create } from 'zustand';
import type { UserProfile, AppView } from '../types/game';
import { auth, db, googleProvider } from '../lib/firebase';
import { signInWithPopup, signOut, onAuthStateChanged, type User } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { getCurrentSeason } from '../utils/season';
import { getLeagueInfo, type RankInfo } from '../utils/rank';

interface UserState {
  user: UserProfile | null;
  loading: boolean;
  currentView: AppView;
  rankUpData: { previous: RankInfo; current: RankInfo } | null;
  matchmakingParams: { mode: 'public' | 'create' | 'join', roomCode?: string } | null;
  
  // Actions
  setView: (view: AppView) => void;
  clearRankUpData: () => void;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName: string) => Promise<void>;
  syncUserProfile: (user: User, customDisplayName?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateScore: (points: number, levelInfo: number, difficulty: import('../types/game').Difficulty) => Promise<void>;
  updateCoins: (amount: number) => Promise<void>;
  updateTrophies: (amount: number) => Promise<void>;
  updateWinStreak: (won: boolean) => Promise<void>;
  buyItem: (itemId: string, cost: number) => Promise<boolean>;
  equipItem: (category: string, itemId: string) => Promise<void>;
  claimDailyLogin: () => Promise<number>; // returns coins earned
  claimPlaytimeReward: () => Promise<number>; // returns coins earned
  incrementPlaytime: (seconds: number) => void;
  updateQuestProgress: (action: import('../data/quests').QuestAction) => Promise<void>;
  claimQuestReward: (questId: string, isWeekly: boolean, reward: number) => Promise<void>;
  claimSeasonReward: () => Promise<boolean>;
  sendFriendRequest: (friendUid: string) => Promise<{ success: boolean; error?: string }>;
  acceptFriendRequest: (requestId: string, fromUid: string) => Promise<{ success: boolean; error?: string }>;
  declineFriendRequest: (requestId: string) => Promise<void>;
  removeFriend: (friendUid: string) => Promise<void>;
  buyFriendSlot: () => Promise<boolean>;
  deletePlayer: (uid: string) => Promise<void>;
  resetPlayerStats: (uid: string) => Promise<void>;
  sendCoinsToUser: (uid: string, amount: number) => Promise<void>;
  initializeAuth: () => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  loading: true,
  currentView: 'menu',
  rankUpData: null,
  matchmakingParams: null,

  setView: (view) => set({ currentView: view }),
  clearRankUpData: () => set({ rankUpData: null }),

  signInWithGoogle: async () => {
    try {
      set({ loading: true });
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      await get().syncUserProfile(user);
    } catch (error) {
      console.error("Login failed:", error);
    } finally {
      set({ loading: false });
    }
  },

  signInWithEmail: async (email, password) => {
    try {
      set({ loading: true });
      const { signInWithEmailAndPassword } = await import('firebase/auth');
      const result = await signInWithEmailAndPassword(auth, email, password);
      await get().syncUserProfile(result.user);
    } catch (error: any) {
      console.error("Login failed:", error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  signUpWithEmail: async (email, password, displayName) => {
    try {
      set({ loading: true });
      const { createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth');
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const user = result.user;
      
      // Update firebase profile with display name
      await updateProfile(user, { displayName });
      
      await get().syncUserProfile(user, displayName);
    } catch (error: any) {
      console.error("Sign up failed:", error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  syncUserProfile: async (user: User, customDisplayName?: string) => {
    // Check if user exists in Firestore
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    const isAdmin = user.email === 'admin@vdgames.com';
    
    let profile: UserProfile;
    if (userSnap.exists()) {
      profile = userSnap.data() as UserProfile;
      // Merge/Fix data if needed
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
      if (!profile.friends) profile.friends = [];
      if (typeof profile.friendSlots !== 'number') profile.friendSlots = 5;
      if (typeof profile.loginStreak !== 'number') profile.loginStreak = 0;
      if (typeof profile.winStreak !== 'number') profile.winStreak = 0;
    } else {
      profile = {
        uid: user.uid,
        email: user.email,
        displayName: isAdmin ? 'Admin' : (customDisplayName || user.displayName || 'İsimsiz Oyuncu'),
        photoURL: user.photoURL,
        scores: { easy: 0, medium: 0, hard: 0, progressive: 0, time_attack: 0, daily: 0 },
        levels: { easy: 1, medium: 1, hard: 1, progressive: 1, time_attack: 1, daily: 1 },
        coins: isAdmin ? 9999999 : 100, // Welcome bonus
        trophies: 0,
        winStreak: 0,
        inventory: [],
        friends: [],
        friendSlots: 5,
        equipped: {},
        friendCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
        role: isAdmin ? 'admin' : 'user'
      };
      await setDoc(userRef, profile);
    }

    if (isAdmin) {
      profile.role = 'admin';
      profile.displayName = 'Admin';
      profile.coins = 9999999;
    }
    
    set({ user: profile, currentView: 'menu' });
  },

  logout: async () => {
    try {
      set({ loading: true });
      await signOut(auth);
      set({ user: null, currentView: 'menu', loading: false });
    } catch (error) {
      console.error("Logout failed:", error);
      set({ loading: false });
    }
  },

  updateScore: async (points, levelInfo, difficulty) => {
    const { user } = get();
    if (!user || user.role === 'admin') return;

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
    if (!user || user.role === 'admin') return;
    
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
    if (!user || user.role === 'admin') return;
    
    // Trophies cannot be less than 0
    const oldSeasonTrophies = user.seasonTrophies || 0;
    const newTrophies = Math.max(0, (user.trophies || 0) + amount);
    const newSeasonTrophies = Math.max(0, oldSeasonTrophies + amount);
    const currentSeason = getCurrentSeason();
    
    // Check rank up
    const oldLeague = getLeagueInfo(oldSeasonTrophies);
    const newLeague = getLeagueInfo(newSeasonTrophies);
    let rankUpData = get().rankUpData;
    if (newLeague.min > oldLeague.min) {
        rankUpData = { previous: oldLeague, current: newLeague };
    }
    
    set({ user: { ...user, trophies: newTrophies, seasonTrophies: newSeasonTrophies, seasonId: currentSeason.id }, rankUpData });
    
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { trophies: newTrophies, seasonTrophies: newSeasonTrophies, seasonId: currentSeason.id });
    } catch (error) {
       console.error("Error updating trophies:", error);
    }
  },

  updateWinStreak: async (won: boolean) => {
    const { user } = get();
    if (!user || user.role === 'admin') return;
    
    const newStreak = won ? (user.winStreak || 0) + 1 : 0;
    set({ user: { ...user, winStreak: newStreak } });
    
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { winStreak: newStreak });
    } catch (error) {
       console.error("Error updating win streak:", error);
    }
  },

  buyItem: async (itemId: string, cost: number) => {
    const { user } = get();
    if (!user || (user.coins < cost && user.role !== 'admin')) return false;
    
    // Check if already owned (except consumables)
    const inventory = user.inventory || [];
    if (itemId !== 'streak_freeze' && inventory.includes(itemId)) return false;

    const newCoins = user.role === 'admin' ? 9999999 : (user.coins - cost);
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
    const twoDaysAgo = new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0];
    
    let newStreak = 1;
    let newInventory = user.inventory || [];

    if (user.lastLoginDate === yesterday) {
      newStreak = (user.loginStreak || 0) + 1;
    } else if (user.lastLoginDate === twoDaysAgo && newInventory.includes('streak_freeze')) {
      newStreak = (user.loginStreak || 0) + 1;
      newInventory = newInventory.filter(i => i !== 'streak_freeze'); 
    } else {
      newStreak = 1;
    }
    
    // Base reward = 50 coins + 10 per streak (up to 200)
    const reward = Math.min(200, 50 + newStreak * 10);
    const newCoins = user.role === 'admin' ? 9999999 : ((user.coins || 0) + reward);

    const updatedUser = { ...user, coins: newCoins, lastLoginDate: today, loginStreak: newStreak, inventory: newInventory };
    set({ user: updatedUser });

    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { coins: newCoins, lastLoginDate: today, loginStreak: newStreak, inventory: newInventory });
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
    const newCoins = user.role === 'admin' ? 9999999 : ((user.coins || 0) + reward);
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

  updateQuestProgress: async (action: import('../data/quests').QuestAction) => {
    const { user } = get();
    if (!user || user.role === 'admin') return;

    const today = new Date().toISOString().split('T')[0];
    const weekStart = (() => {
      const d = new Date();
      d.setDate(d.getDate() - d.getDay());
      return d.toISOString().split('T')[0];
    })();

    const { getDailyQuests, getWeeklyQuests } = await import('../data/quests');
    
    // Find matching daily quests
    const dailyPool = getDailyQuests(user.uid, today);
    const dailyMatches = dailyPool.filter(q => q.action === action);
    
    let updatedUser = { ...user };
    let hasDailyUpdates = false;

    if (dailyMatches.length > 0) {
       const progress = user.dailyQuestsDate === today ? { ...(user.dailyQuestsProgress || {}) } as Record<string, { count: number; claimed: boolean }> : {};
       
       for (const q of dailyMatches) {
          const currentProc = progress[q.id] || { count: 0, claimed: false };
          if (!currentProc.claimed) {
             progress[q.id] = { count: currentProc.count + 1, claimed: false };
             hasDailyUpdates = true;
          }
       }
       if (hasDailyUpdates) {
          updatedUser = { ...updatedUser, dailyQuestsDate: today, dailyQuestsProgress: progress };
       }
    }

    // Find matching weekly quests
    const weeklyPool = getWeeklyQuests(user.uid, weekStart);
    const weeklyMatches = weeklyPool.filter(q => q.action === action);
    
    let hasWeeklyUpdates = false;
    
    if (weeklyMatches.length > 0) {
       const progress = user.weeklyQuestsDate === weekStart ? { ...(user.weeklyQuestsProgress || {}) } as Record<string, { count: number; claimed: boolean }> : {};
       
       for (const q of weeklyMatches) {
          const currentProc = progress[q.id] || { count: 0, claimed: false };
          if (!currentProc.claimed) {
             progress[q.id] = { count: currentProc.count + 1, claimed: false };
             hasWeeklyUpdates = true;
          }
       }
       if (hasWeeklyUpdates) {
          updatedUser = { ...updatedUser, weeklyQuestsDate: weekStart, weeklyQuestsProgress: progress };
       }
    }

    if (hasDailyUpdates || hasWeeklyUpdates) {
       set({ user: updatedUser });
       const payload: Record<string, any> = {};
       if (hasDailyUpdates) {
           payload.dailyQuestsDate = today;
           if (updatedUser.dailyQuestsProgress) payload.dailyQuestsProgress = updatedUser.dailyQuestsProgress;
       }
       if (hasWeeklyUpdates) {
           payload.weeklyQuestsDate = weekStart;
           if (updatedUser.weeklyQuestsProgress) payload.weeklyQuestsProgress = updatedUser.weeklyQuestsProgress;
       }
       try {
         await updateDoc(doc(db, 'users', user.uid), payload);
       } catch (e) {
         console.error(e);
       }
    }
  },

  claimQuestReward: async (questId: string, isWeekly: boolean, reward: number) => {
    const { user } = get();
    if (!user) return;

    const progress = isWeekly 
      ? { ...(user.weeklyQuestsProgress || {}) } as Record<string, { count: number; claimed: boolean }>
      : { ...(user.dailyQuestsProgress || {}) } as Record<string, { count: number; claimed: boolean }>;
    
    progress[questId] = { ...(progress[questId] || { count: 0 }), claimed: true };
    const newCoins = user.role === 'admin' ? 9999999 : ((user.coins || 0) + reward);
    
    const updated = isWeekly 
      ? { ...user, coins: newCoins, weeklyQuestsProgress: progress }
      : { ...user, coins: newCoins, dailyQuestsProgress: progress };

    set({ user: updated });
    try {
      await updateDoc(doc(db, 'users', user.uid), { 
        coins: newCoins, 
        [isWeekly ? 'weeklyQuestsProgress' : 'dailyQuestsProgress']: progress 
      });
    } catch (e) { console.error(e); }
  },

  claimSeasonReward: async () => {
    const { user } = get();
    if (!user || (!user.pendingSeasonReward && user.role !== 'admin')) return false;
    
    const rewardCoins = user.pendingSeasonReward?.coins || 0;
    const newCoins = user.role === 'admin' ? 9999999 : ((user.coins || 0) + rewardCoins);
    
    const updatedUser = { ...user, coins: newCoins, pendingSeasonReward: null };
    const rankUpData = get().rankUpData;
    set({ user: updatedUser, rankUpData });
    
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { 
         coins: newCoins, 
         pendingSeasonReward: null
      });
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  },

  sendFriendRequest: async (friendCode: string) => {
    const { user } = get();
    if (!user) return { success: false, error: 'Giriş yapılmamış.' };
    
    const code = friendCode.trim().toUpperCase();
    if (code === user.friendCode) return { success: false, error: 'Kendini ekleyemezsin!' };
    
    const friends = user.friends || [];
    const maxSlots = user.friendSlots || 5;
    if (friends.length >= maxSlots && user.role !== 'admin') return { success: false, error: 'Arkadaş slotun dolu! Mağazadan yeni slot al.' };
    
    try {
      const q = query(collection(db, 'users'), where('friendCode', '==', code));
      const snap = await getDocs(q);
      
      if (snap.empty) return { success: false, error: 'Bu kodla oyuncu bulunamadı.' };
      
      const friendDoc = snap.docs[0];
      const friendUid = friendDoc.id;
      const friendData = friendDoc.data();
      
      if (friends.includes(friendUid)) return { success: false, error: 'Bu kişi zaten arkadaşın!' };
      
      const newFriends = [...friends, friendUid];
      set({ user: { ...user, friends: newFriends } });
      await updateDoc(doc(db, 'users', user.uid), { friends: newFriends });
      
      const friendFriends = friendData.friends || [];
      if (!friendFriends.includes(user.uid)) {
        await updateDoc(doc(db, 'users', friendUid), { friends: [...friendFriends, user.uid] });
      }
      
      return { success: true };
    } catch (e) {
      console.error(e);
      return { success: false, error: 'Bağlantı hatası.' };
    }
  },

  acceptFriendRequest: async (requestId: string, fromUid: string) => {
    const { user } = get();
    if (!user) return { success: false, error: 'Not logged in' };
    
    const friends = user.friends || [];
    const maxSlots = user.friendSlots || 5;
    
    if (friends.includes(fromUid)) {
      await deleteDoc(doc(db, 'friendRequests', requestId)).catch(() => {});
      return { success: true };
    }
    if (friends.length >= maxSlots && user.role !== 'admin') return { success: false, error: 'Arkadaş slotun dolu!' };
    
    try {
      const newFriends = [...friends, fromUid];
      set({ user: { ...user, friends: newFriends } });
      await updateDoc(doc(db, 'users', user.uid), { friends: newFriends });
      
      const friendRef = doc(db, 'users', fromUid);
      const friendSnap = await getDoc(friendRef);
      if (friendSnap.exists()) {
        const friendFriends = friendSnap.data().friends || [];
        if (!friendFriends.includes(user.uid)) {
          await updateDoc(friendRef, { friends: [...friendFriends, user.uid] });
        }
      }
      
      await deleteDoc(doc(db, 'friendRequests', requestId));
      return { success: true };
    } catch (e) {
      console.error(e);
      return { success: false, error: 'Bağlantı hatası.' };
    }
  },

  declineFriendRequest: async (requestId: string) => {
    try {
      await deleteDoc(doc(db, 'friendRequests', requestId));
    } catch (e) {
      console.error(e);
    }
  },

  removeFriend: async (friendUid: string) => {
    const { user } = get();
    if (!user) return;
    
    const newFriends = (user.friends || []).filter(f => f !== friendUid);
    set({ user: { ...user, friends: newFriends } });
    
    try {
      await updateDoc(doc(db, 'users', user.uid), { friends: newFriends });
      const friendRef = doc(db, 'users', friendUid);
      const friendSnap = await getDoc(friendRef);
      if (friendSnap.exists()) {
        const friendFriends = (friendSnap.data().friends || []).filter((f: string) => f !== user.uid);
        await updateDoc(friendRef, { friends: friendFriends });
      }
    } catch (e) {
      console.error(e);
    }
  },

  buyFriendSlot: async () => {
    const { user } = get();
    if (!user || (user.coins < 5000 && user.role !== 'admin')) return false;
    
    const newCoins = user.role === 'admin' ? 9999999 : (user.coins - 5000);
    const newSlots = (user.friendSlots || 5) + 1;
    set({ user: { ...user, coins: newCoins, friendSlots: newSlots } });
    
    try {
      await updateDoc(doc(db, 'users', user.uid), { coins: newCoins, friendSlots: newSlots });
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  },

  deletePlayer: async (uid: string) => {
    const { user } = get();
    if (!user || user.role !== 'admin') return;
    try {
      await deleteDoc(doc(db, 'users', uid));
    } catch (e) {
      console.error(e);
    }
  },

  resetPlayerStats: async (uid: string) => {
    const { user } = get();
    if (!user || user.role !== 'admin') return;
    try {
      const targetUserRef = doc(db, 'users', uid);
      await updateDoc(targetUserRef, {
        scores: { easy: 0, medium: 0, hard: 0, progressive: 0, time_attack: 0, daily: 0 },
        levels: { easy: 1, medium: 1, hard: 1, progressive: 1, time_attack: 1, daily: 1 },
        trophies: 0,
        seasonTrophies: 0,
        winStreak: 0
      });
    } catch (e) {
      console.error(e);
    }
  },

  sendCoinsToUser: async (uid: string, amount: number) => {
    const { user } = get();
    if (!user || user.role !== 'admin') return;
    try {
      const targetUserRef = doc(db, 'users', uid);
      const targetUserSnap = await getDoc(targetUserRef);
      if (targetUserSnap.exists()) {
        const currentCoins = targetUserSnap.data().coins || 0;
        await updateDoc(targetUserRef, { coins: currentCoins + amount });
      }
    } catch (e) {
      console.error(e);
    }
  },

  initializeAuth: () => {
    onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      if (firebaseUser) {
        const userRef = doc(db, 'users', firebaseUser.uid);
        const userSnap = await getDoc(userRef);
        const isAdmin = firebaseUser.email === 'admin@vdgames.com';

        if (userSnap.exists()) {
          const ud = userSnap.data() as UserProfile;
          if (!ud.scores) {
             ud.scores = { easy: 0, medium: 0, hard: 0, progressive: ud.totalScore || 0, time_attack: 0, daily: 0 };
             ud.levels = { easy: 1, medium: 1, hard: 1, progressive: ud.highestLevel || 1, time_attack: 1, daily: 1 };
          }
          if (isAdmin) {
            ud.role = 'admin';
            ud.displayName = 'Admin';
            ud.coins = 9999999;
          }

          if (typeof ud.coins !== 'number') ud.coins = 0;
          if (typeof ud.trophies !== 'number') ud.trophies = 0;
          if (!ud.inventory) ud.inventory = [];
          if (!ud.equipped) ud.equipped = {};
          if (typeof ud.playtimeSeconds !== 'number') ud.playtimeSeconds = 0;
          if (typeof ud.playtimeRewardClaimed !== 'number') ud.playtimeRewardClaimed = 0;
          if (!ud.friends) ud.friends = [];
          if (typeof ud.friendSlots !== 'number') ud.friendSlots = 5;
          if (typeof ud.loginStreak !== 'number') ud.loginStreak = 0;

          if (!ud.friendCode) {
            ud.friendCode = Math.random().toString(36).substring(2, 8).toUpperCase();
            updateDoc(userRef, { friendCode: ud.friendCode }).catch(console.error);
          }

          const currentSeason = getCurrentSeason();
          let needsUpdate = false;
          const updateData: any = {};

          if (ud.seasonId !== currentSeason.id) {
             const oldSeasonTrophies = ud.seasonTrophies || 0;
             if (oldSeasonTrophies > 0) {
                 const oldLeagueInfo = getLeagueInfo(oldSeasonTrophies);
                 if (oldLeagueInfo.seasonReward && oldLeagueInfo.seasonReward > 0) {
                     ud.pendingSeasonReward = {
                         rankName: oldLeagueInfo.name,
                         coins: oldLeagueInfo.seasonReward
                     };
                     updateData.pendingSeasonReward = ud.pendingSeasonReward;
                 }
             }
             ud.seasonId = currentSeason.id;
             ud.seasonTrophies = 0;
             updateData.seasonId = currentSeason.id;
             updateData.seasonTrophies = 0;
             needsUpdate = true;
          }

          const rankUpData = get().rankUpData;
          set({ user: ud, loading: false, rankUpData });
          
          if (needsUpdate) {
             updateDoc(userRef, updateData).catch(console.error);
          }
        } else {
          // If Firestore Doc doesn't exist yet, call syncUserProfile
          await get().syncUserProfile(firebaseUser);
          set({ loading: false });
        }
      } else {
        set({ user: null, loading: false });
      }
    });
  }
}));
