import { useSettingsStore } from '../store/settingsStore';

export const translations = {
  tr: {
    // Top Bar
    "coins": "Altın",
    
    // Main Menu
    "difficulty_selection": "Zorluk Seçimi",
    "easy": "KOLAY (3x3 Sabit)",
    "medium": "ORTA (5x5 Sabit)",
    "hard": "ZOR (7x7 / Tuzaklı)",
    "progressive": "İLERLEMELİ (Normal)",
    "progressive_desc": "Bölümler ilerledikçe tahta büyür ve yeni tuzaklar belirir.",
    "subtitle": "Sayısal Gölgeler",
    "play_offline": "ÇEVRİMDIŞI OYNA",
    "play_online": "ÇEVRİMİÇİ (SKORLU)",
    "time_attack": "Zamana Karşı",
    "daily_challenge": "Günün Sorusu",
    "guide": "Kılavuz",
    "leaderboard": "Skorlar",
    "shop": "Mağaza",
    "profile": "Profil",
    "login": "Giriş",
    
    // Auth & Generic
    "welcome": "Hoş Geldin!",
    "auth_desc": "Çevrimiçi modda oynayıp puan kazanmak ve liderlik tablosuna girmek için Google ile giriş yapmalısın.",
    "login_google": "Google ile Giriş Yap",
    "loading": "Yükleniyor...",
    "go_back": "Geri Dön",

    // Profile
    "settings": "Ayarlar",
    "game_effects": "Oyun Efektleri",
    "sound_effects": "Ses Efektleri",
    "haptic_feedback": "Titreşim (Haptik)",
    "language": "Dil Seçimi",
    "high_score": "Skor",
    "max_level": "Maks Seviye",
    "logout": "Çıkış Yap",

    // Shop
    "shop_title": "Mağaza",
    "coming_soon": "Çok Yakında",
    "shop_desc": "Altınlarla alabileceğiniz yeni renk temaları, tahta arka planları, ve avatar rozetleri yapım aşamasında. Altınlarınızı biriktirmeye başlayın!",
    "buy": "Satın Al",
    "theme_neon_title": "Neon Mavi",
    "theme_neon_desc": "Arayüz temasını siber mavi yapar.",
    "theme_crimson_title": "Kızıl Öfke",
    "theme_crimson_desc": "Oyun tahtasını kan kırmızı yapar.",
    "item_goldlock_title": "Altın Kilit",
    "item_goldlock_desc": "Kilitli kutular altın renginde parlar.",

    // Game
    "level": "BÖLÜM",
    "daily_completed": "GÜNLÜK MOD TAMAMLANDI",
    "daily_desc": "Yeni günün zeka bulmacası yarın gece yarısı tekrar burada olacak. Harika iş çıkardın!",
    "earned_coins": "Kazanılan Altın",
    "completed": "TAMAMLANDI",
    "offline_mode": "ÇEVRİMDIŞI MOD",
    "offline_desc": "Altın ve skor kazanmak için çevrimiçi oyna.",
    "next_target": "Sıradaki Hedef",
    "return_menu": "Ana Menüye Dön",
    "game_over": "SÜRE BİTTİ",
    "score": "Skor",
    "play_again": "Tekrar Oyna",
    "online_streak": "Çevrimiçi Seri",
    "offline": "Çevrimdışı",
    "challenge": "Meydan Okuma",
    "hint": "İPUCU",
    
    // Guide
    "how_to_play": "NASIL OYNANIR?",
    "guide_desc": "Bu oyun, satır ve sütun hedeflerine ulaşmak için kutuları aktif (mavi) veya pasif (karanlık) hale getirdiğin bir zeka bulmacasıdır.",
    "basic_rules": "Temel Kurallar",
    "basic_rules_desc": "Sağ ve alttaki sayısal hedefler, o satır veya sütundaki seçili (aktif) kutuların toplamına eşit olmalıdır.",
    "red_boxes": "Kırmızı Kutular",
    "red_boxes_desc": "Üzerinde kırmızı nokta olan kutular negatiftir. Yani toplama eksi olarak yansırlar (Örn: 5 yazıyorsa -5'tir).",
    "locked_boxes": "Kilitli Kutular",
    "locked_boxes_desc": "Asma kilitli kutular sabittir. Onları değiştiremezsin ancak hedefe dahildir.",
    "unknown_boxes": "Bilinmeyen Kutular",
    "unknown_boxes_desc": "Soru işareti olan kutuların değeri, sen onları seçene kadar gizlidir. Risk almalı mısın?",
  },
  en: {
    // Top Bar
    "coins": "Coins",
    
    // Main Menu
    "difficulty_selection": "Select Difficulty",
    "easy": "EASY (3x3 Fixed)",
    "medium": "MEDIUM (5x5 Fixed)",
    "hard": "HARD (7x7 / Traps)",
    "progressive": "PROGRESSIVE (Normal)",
    "progressive_desc": "As levels progress, the board grows and new traps appear.",
    "subtitle": "Numerical Shadows",
    "play_offline": "PLAY OFFLINE",
    "play_online": "PLAY ONLINE (RANKED)",
    "time_attack": "Time Attack",
    "daily_challenge": "Daily Challenge",
    "guide": "Guide",
    "leaderboard": "Leaderboard",
    "shop": "Shop",
    "profile": "Profile",
    "login": "Login",
    
    // Auth & Generic
    "welcome": "Welcome!",
    "auth_desc": "Log in with Google to play online, earn points and enter the leaderboard.",
    "login_google": "Log in with Google",
    "loading": "Loading...",
    "go_back": "Go Back",

    // Profile
    "settings": "Settings",
    "game_effects": "Game Effects",
    "sound_effects": "Sound Effects",
    "haptic_feedback": "Haptic Feedback",
    "language": "Language Selection",
    "high_score": "Score",
    "max_level": "Max Level",
    "logout": "Logout",

    // Shop
    "shop_title": "Shop",
    "coming_soon": "Coming Soon",
    "shop_desc": "New color themes, board backgrounds, and avatar badges you can buy with coins are under construction. Start saving up your coins!",
    "buy": "Buy",
    "theme_neon_title": "Neon Blue",
    "theme_neon_desc": "Turns the interface theme into cyber blue.",
    "theme_crimson_title": "Crimson Fury",
    "theme_crimson_desc": "Turns the game board blood red.",
    "item_goldlock_title": "Golden Lock",
    "item_goldlock_desc": "Locked boxes shine in golden color.",

    // Game
    "level": "LEVEL",
    "daily_completed": "DAILY MODE COMPLETED",
    "daily_desc": "The new logic puzzle of the day will be here tomorrow at midnight. Great job!",
    "earned_coins": "Earned Coins",
    "completed": "COMPLETED",
    "offline_mode": "OFFLINE MODE",
    "offline_desc": "Play online to earn coins and scores.",
    "next_target": "Next Target",
    "return_menu": "Return to Main Menu",
    "game_over": "TIME IS UP",
    "score": "Score",
    "play_again": "Play Again",
    "online_streak": "Online Streak",
    "offline": "Offline",
    "challenge": "Challenge",
    "hint": "HINT",
    
    // Guide
    "how_to_play": "HOW TO PLAY?",
    "guide_desc": "This is a logic puzzle where you activate (blue) or deactivate (dark) boxes to piece together row and column targets.",
    "basic_rules": "Basic Rules",
    "basic_rules_desc": "The numerical targets on the right and bottom must equal the sum of the selected (active) boxes in that row or column.",
    "red_boxes": "Red Boxes",
    "red_boxes_desc": "Boxes with a red dot are negative. They deduct from the sum (e.g. if it says 5, it means -5).",
    "locked_boxes": "Locked Boxes",
    "locked_boxes_desc": "Boxes with a padlock are fixed. You cannot interact with them, but they count towards the target.",
    "unknown_boxes": "Unknown Boxes",
    "unknown_boxes_desc": "The value of boxes with a question mark is hidden until you select them.",
  }
};

export const useTranslation = () => {
  const language = useSettingsStore((state) => state.language);
  
  return (key: keyof typeof translations['tr']) => {
    return translations[language][key] || translations['tr'][key];
  };
};
