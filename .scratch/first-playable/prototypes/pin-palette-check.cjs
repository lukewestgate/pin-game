// PROTOTYPE · throwaway. Ticket: Pin colours and colour-blind readability (issues/12-...).
// Scores Pin palettes by the smallest OKLab distance between any two colours, under normal
// vision and simulated protanopia / deuteranopia / tritanopia (Machado, Oliveira & Fernandes
// 2009, severity 1.0, applied in linear RGB), plus distance from the car's neutral body colours.
// Also searches a pool of cartoon hues for the best 5, then extends greedily to 10.
// Run: node pin-palette-check.cjs   (no dependencies)

const SIMS = {
  normal: null,
  protan: [0.152286, 1.052583, -0.204868, 0.114503, 0.786281, 0.099216, -0.003882, -0.048116, 1.051998],
  deutan: [0.367322, 0.860646, -0.227968, 0.280085, 0.672501, 0.047413, -0.01182, 0.04294, 0.968881],
  tritan: [1.255528, -0.076749, -0.178779, -0.078411, 0.930809, 0.147602, 0.004733, 0.691367, 0.3039],
};
const BODY = { cream: '#f3e6c8', chassis: '#7d838a', interior: '#b8bcc2', tyre: '#3a3d42', engine: '#8a9099' };

const hex2rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255);
const lin = c => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
function oklab([r, g, b]) {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
}
function simLab(hex, sim) {
  let v = hex2rgb(hex).map(lin);
  const M = SIMS[sim];
  if (M) v = [0, 1, 2].map(i => Math.min(1, Math.max(0, M[i * 3] * v[0] + M[i * 3 + 1] * v[1] + M[i * 3 + 2] * v[2])));
  return oklab(v);
}
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

function score(pal) {
  const out = {};
  for (const sim of Object.keys(SIMS)) {
    const L = pal.map(([, h]) => simLab(h, sim));
    let min = Infinity, pair = '';
    for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) {
      const d = dist(L[i], L[j]); if (d < min) { min = d; pair = `${pal[i][0]}/${pal[j][0]}`; }
    }
    let bmin = Infinity, bpair = '';
    for (let i = 0; i < L.length; i++) for (const [bn, bh] of Object.entries(BODY)) {
      const d = dist(L[i], simLab(bh, sim)); if (d < bmin) { bmin = d; bpair = `${pal[i][0]}/${bn}`; }
    }
    out[sim] = { min, pair, bmin, bpair };
  }
  out.worst = Math.min(...Object.values(out).map(o => o.min));
  out.worstBody = Math.min(...Object.keys(SIMS).map(s => out[s].bmin));
  return out;
}
function report(name, pal) {
  const s = score(pal);
  console.log(`\n${name}: ${pal.map(p => p[0]).join(', ')}`);
  for (const sim of Object.keys(SIMS)) {
    const o = s[sim];
    console.log(`  ${sim.padEnd(7)} min pair ${(o.min * 100).toFixed(1).padStart(5)} (${o.pair.padEnd(16)})  min to body ${(o.bmin * 100).toFixed(1).padStart(5)} (${o.bpair})`);
  }
  console.log(`  worst pair across all visions: ${(s.worst * 100).toFixed(1)}   worst to body: ${(s.worstBody * 100).toFixed(1)}`);
  return s;
}

const POOL = [
  ['red', '#e63b3b'], ['vermilion', '#ff5a1f'], ['orange', '#ff9a1a'], ['yellow', '#ffd426'],
  ['lime', '#a6d930'], ['green', '#2fb350'], ['teal', '#14a39a'], ['cyan', '#36c8ec'],
  ['sky', '#4fa3ff'], ['blue', '#2a55e0'], ['navy', '#1f2f8f'], ['purple', '#8a46d6'],
  ['magenta', '#d63bb8'], ['pink', '#ff7fbf'], ['brown', '#8b5428'], ['white', '#ffffff'], ['black', '#1b1b22'],
];
const PALETTES = {
  placeholder: [['red', '#e5484d'], ['blue', '#3e63dd'], ['yellow', '#ffc53d'], ['green', '#30a46c'], ['purple', '#8e4ec6']],
  okabeIto: [['orange', '#e69f00'], ['sky', '#56b4e9'], ['green', '#009e73'], ['yellow', '#f0e442'], ['blue', '#0072b2'], ['vermilion', '#d55e00'], ['pink', '#cc79a7'], ['black', '#1b1b22']],
  tolBright: [['blue', '#4477aa'], ['cyan', '#66ccee'], ['green', '#228833'], ['yellow', '#ccbb44'], ['red', '#ee6677'], ['purple', '#aa3377']],
};

if (require.main === module) {
  for (const [n, p] of Object.entries(PALETTES)) report(n, p.slice(0, 5));
  report('okabeIto (8)', PALETTES.okabeIto);

  // Exhaustive best 5 from the pool, requiring a body distance of at least 0.08 in every vision.
  const n = POOL.length; let best = null;
  const pick = [];
  (function rec(start) {
    if (pick.length === 5) {
      const pal = pick.map(i => POOL[i]); const s = score(pal);
      if (s.worstBody >= 0.08 && (!best || s.worst > best.s.worst)) best = { pal, s };
      return;
    }
    for (let i = start; i < n; i++) { pick.push(i); rec(i + 1); pick.pop(); }
  })(0);
  report('best 5 from pool', best.pal);

  // Greedy extension to 10: add whichever pool colour keeps the worst pair largest.
  const ext = [...best.pal];
  while (ext.length < 10) {
    let bc = null;
    for (const c of POOL) if (!ext.includes(c)) {
      const s = score([...ext, c]); if (!bc || s.worst > bc.s.worst) bc = { c, s };
    }
    ext.push(bc.c);
    console.log(`  +${bc.c[0].padEnd(9)} → ${ext.length} colours, worst pair ${(bc.s.worst * 100).toFixed(1)} (${['protan', 'deutan', 'tritan', 'normal'].map(k => k + ' ' + (bc.s[k].min * 100).toFixed(1)).join(', ')})`);
  }
}
module.exports = { SIMS, score, POOL, PALETTES, BODY };
