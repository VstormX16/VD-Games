const fs = require('fs');
const path = 'C:/Users/Kaan/Documents/Projeler/VD-Games/grid-logic/src/App.tsx';
let c = fs.readFileSync(path, 'utf8');

c = c.replace(/>\s*Arkada\u015Flar\u0131nla Oyna\s*</g, ">{t('friends')}<");
c = c.replace(/>\s*Nas\u0131l Oynan\u0131r\?\s*</g, ">{t('how_to_play')}<");
c = c.replace(/>\s*Oda Aran\u0131yor /g, ">{t('searching')} ");
c = c.replace(/>\s*Oda Bulunamad\u0131 veya Dolu\.\s*</g, ">{t('error')}<");

fs.writeFileSync(path, c, 'utf8');
console.log('Pass 2');
