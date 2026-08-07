import fs from 'fs';

const res = await fetch('https://airport-simulator.vercel.app/assets/index-70THNDgT.js');
const text = await res.text();

const wrPos = text.indexOf('function wr(');
const panelFunc = text.substring(wrPos, wrPos + 8000);

fs.writeFileSync('scenario_panel_code.js', panelFunc);
console.log('Saved scenario_panel_code.js (length:', panelFunc.length, ')');
