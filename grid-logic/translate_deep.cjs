const fs = require('fs');
const path = 'C:/Users/Kaan/Documents/Projeler/VD-Games/grid-logic/src/App.tsx';
let c = fs.readFileSync(path, 'utf8');

const tReplace = [
  // Game Screen / UI
  [`>PES ET<`, `>{t('surrender')}<`],
  [`"PES ET"`, `t('surrender')`],
  [`Pes Etmek İstiyor Musun?`, `{t('surrender_title')}`],
  [`Bu düellodan çekilirsen <span className="text-danger font-bold">-10 kupa</span> kaybedeceksin ve rakibin kazanacak.`, `{t('surrender_desc')}`],
  [`İPUCU (`, `{t('hint')} (`],
  [`>DEVAM ET<`, `>{t('continue')}<`],
  
  // Matchmaking
  [`>Oda Kodu<`, `>{t('room_code')}<`],
  [`>Odaya Katıl<`, `>{t('join_room')}<`],
  [`>Oda Oluştur<`, `>{t('create_room')}<`],
  [`>Özel Düello<`, `>{t('private_duel')}<`],
  [`>Herkese Açık<`, `>{t('public_duel')}<`],
  
  // Friends
  [`Arkadaşlarınla Oyna`, `{t('friends')}`],
  [`Senin Oyuncu ID'n`, `{t('your_player_id')}`],
  [`Arkadaşlık Kodun`, `{t('your_player_id')}`],
  [`Arkadaş Ekle`, `{t('add_friend')}`],
  [`Oda aranıyor`, `{t('searching')}`],
  [`İstek Gönderildi`, `{t('request_sent')}`],
  [`Kopyala`, `{t('copy')}`],
  [`Kopyalandı`, `{t('copied')}`],
  
  // Victory / Lost
  [`>BÖLÜM `, `>{t('level')} `],
  [`DOSTLUK MAÇI KAZANILDI`, `{t('private_duel')}`],
  [`DÜELLO KAZANILDI`, `{t('duel_won')}`],
  [`Arkadaş maçlarında kupa kazanılmaz.`, `{t('rank_points_lost')} {t('challenge')}`],
  [`Kazanılan Rank Puanı`, `{t('rank_points_earned')}`],
  [`Arkadaşını yendin! İyi oyundu.`, `{t('duel_won_desc')}`],
  [`Rakipten önce çözdün! Düellodan kupa kazandın.`, `{t('duel_won_desc')}`],
  
  [`KAZANDI<`, `{t('opponent_won')}<`],
  [`-10 Rank Puanı`, `-10 {t('rank_points_lost')}`],
  
  [`GÜNLÜK MOD TAMAMLANDI`, `{t('daily_completed')}`],
  [`Kazanılan Altın`, `{t('earned_coins')}`],
  [`Yeni günün zeka bulmacası yarın gece yarısı tekrar burada olacak. Harika iş çıkardın!`, `{t('daily_desc')}`],
  
  [`TAMAMLANDI<`, `{t('completed')}<`],
  [`ÇEVRİMDIŞI MOD`, `{t('offline_mode')}`],
  [`Altın ve skor kazanmak için çevrimiçi oyna.`, `{t('offline_desc')}`],
  
  [`Sıradaki Hedef`, `{t('next_target')}`],
  [`>SÜRE BİTTİ<`, `>{t('game_over')}<`],
  [`>Skor: `, `>{t('score')}: `],
  [`>Tekrar Oyna<`, `>{t('play_again')}<`],
  [`Ana Menüye Dön`, `{t('return_menu')}`]
];

for (const [search, replace] of tReplace) {
   // Make sure to only replace if we match the exact text, avoids double replacing
   c = c.split(search).join(replace);
}

fs.writeFileSync(path, c, 'utf8');
console.log('Done deep translations pass');
