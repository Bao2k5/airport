import fs from 'fs';

const res = await fetch('https://airport-simulator.vercel.app/assets/index-70THNDgT.js');
const text = await res.text();

const obsPos = text.indexOf('ĐIỀU CẦN QUAN SÁT');
const snippet = text.substring(obsPos - 3000, obsPos + 6000);

fs.writeFileSync('scenario_panel_jsx_exact.js', snippet);
console.log('Saved scenario_panel_jsx_exact.js (length:', snippet.length, ')');
