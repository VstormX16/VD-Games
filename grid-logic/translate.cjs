const fs = require('fs');
const path = 'C:/Users/Kaan/Documents/Projeler/VD-Games/grid-logic/src/App.tsx';
let c = fs.readFileSync(path, 'utf8');

c = c.replace(/'E\u015Fle\u015Ftirme Ba\u015Flat\u0131l\u0131yor...'/g, "t('searching')");
c = c.replace(/Oda Aran\u0131yor/g, "Oda aranıyor");
c = c.replace(/Oda Bulunamad\u0131 veya Dolu\./g, "t('error')");
c = c.replace(/Odaya Girildi! Ba\u015Fl\u0131yor.../g, "Match found! Starting...");
c = c.replace(/Oda Kuruldu:/g, "Room created:");
c = c.replace(/'Halk A\u00E7\u0131k Rakip Aran\u0131yor...'/g, "t('searching')");
c = c.replace(/Rakip Bulundu! Ba\u015Fl\u0131yor.../g, "t('match_found')");
c = c.replace(/'Ma\u00E7 Ba\u015Fl\u0131yor!'/g, "t('match_found')");

c = c.replace(/>\s*Ana Men\u00FCye D\u00F6n\s*</g, ">{t('return_menu')}<");
c = c.replace(/>\s*\u00C7evrimd\u0131\u015F\u0131\s*</g, ">{t('offline')}<");
c = c.replace(/>\s*Meydan Okuma\s*</g, ">{t('challenge')}<");
c = c.replace(/>\s*\u00C7evrimi\u00E7i Seri\s*</g, ">{t('online_streak')}<");
c = c.replace(/>\s*G\u00FCn\u00FCn Sorusu\s*</g, ">{t('daily_challenge')}<");

fs.writeFileSync(path, c, 'utf8');
console.log('Done translations pass 1.');
