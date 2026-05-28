const https = require('https');
const fs = require('fs');
const path = require('path');

const icons = {
  attack: 'https://raw.githubusercontent.com/google/material-design-icons/master/symbols/web/swords/materialsymbolsoutlined/swords_24px.svg',
  defend: 'https://raw.githubusercontent.com/google/material-design-icons/master/symbols/web/shield/materialsymbolsoutlined/shield_24px.svg',
  dodge: 'https://raw.githubusercontent.com/google/material-design-icons/master/symbols/web/directions_run/materialsymbolsoutlined/directions_run_24px.svg',
  breathe: 'https://raw.githubusercontent.com/google/material-design-icons/master/symbols/web/air/materialsymbolsoutlined/air_24px.svg'
};

const dir = path.join(__dirname, 'public', 'icons');
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir, { recursive: true });
}

Object.entries(icons).forEach(([name, url]) => {
  https.get(url, (res) => {
    const file = fs.createWriteStream(path.join(dir, `${name}.svg`));
    res.pipe(file);
    file.on('finish', () => {
      file.close();
      console.log(`Downloaded ${name}.svg`);
    });
  }).on('error', (err) => {
    console.error(`Error downloading ${name}:`, err.message);
  });
});
