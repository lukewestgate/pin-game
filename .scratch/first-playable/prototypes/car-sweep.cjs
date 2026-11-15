// Throwaway: sweep seeded colour deals on the proposed first car (Car level design ticket).
const fs = require('fs');
const html = fs.readFileSync(process.argv[2], 'utf8');
const src = html.split('<script id="rules">')[1].split('</script>')[0];
const R = new Function(src + '\nreturn Rules;')();

// [name, layer, pins: coveredBy part-name lists]
const P = [
  ['wheel-fl', 0, [[]]], ['wheel-fr', 0, [[]]], ['wheel-rl', 0, [[]]], ['wheel-rr', 0, [[]]],
  ['bonnet', 0, [[], []]], ['roof', 0, [[], []]], ['door-l', 0, [[], []]], ['door-r', 0, [[], []]],
  ['tailgate', 0, [[], []]], ['spare-wheel', 0, [[], []]],
  ['axle-front', 1, [['wheel-fl'], ['wheel-fr']]], ['axle-rear', 1, [['wheel-rl'], ['wheel-rr']]],
  ['engine', 1, [['bonnet'], ['bonnet'], ['bonnet']]],
  ['seat-l', 1, [['door-l'], ['door-l']]], ['seat-r', 1, [['door-r'], ['door-r']]],
  ['steering-wheel', 1, [['roof']]], ['rear-seat', 1, [['tailgate'], ['tailgate']]],
];
const names = P.map(p => p[0]);
const slots = [];
P.forEach(([, l, pins], pi) => pins.forEach(cov => slots.push({ pi, l, cov })));
if (slots.length !== 30) throw new Error('count ' + slots.length);

function rng(s) { return () => { s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function deal(seed) {
  const r = rng(seed);
  for (;;) {
    const c = []; for (let k = 0; k < 5; k++) for (let j = 0; j < 6; j++) c.push(k);
    for (let i = c.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [c[i], c[j]] = [c[j], c[i]]; }
    const byPart = {}; slots.forEach((s, i) => (byPart[s.pi] ??= []).push(c[i]));
    if (Object.values(byPart).some(a => a.length > 1 && a.every(x => x === a[0]))) continue; // (a)
    const outer = new Set(slots.filter(s => s.l === 0).map(s => c[slots.indexOf(s)]));
    if ([0, 1, 2, 3, 4].some(k => !outer.has(k))) continue; // (b)
    return c;
  }
}
let BOXES = 3;
function level(c, buf, seed) {
  const parts = P.map(([n, l]) => ({ name: n, layer: l, pins: [] }));
  slots.forEach((sl, i) => parts[sl.pi].pins.push({ colour: c[i], coveredBy: sl.cov.map(x => names.indexOf(x)) }));
  const L = R.makeLevel({ name: 'car', boxes: BOXES, capacity: 3, bufferSize: buf, seed, rule: 'reachable-first', parts });
  if (L.errors.length) throw new Error(L.errors.join('; '));
  return L;
}
for (const [boxes, buf] of (process.argv[3] || '3x5,3x6').split(',').map(s => s.split('x').map(Number))) {
  BOXES = boxes; process.stdout.write(`boxes ${boxes} `);
  const rates = []; let unw = 0, unk = 0;
  for (let d = 1; d <= 40; d++) {
    const c = deal(d);
    for (let s = 1; s <= 3; s++) {
      const L = level(c, buf, s);
      const st = R.initialState(L); const v = R.solve(L, st.state || st, 200000).verdict;
      if (v === 'unwinnable') { unw++; continue; } if (v === 'unknown') { unk++; continue; }
      rates.push(R.playouts(L, 1000, s).winRate);
    }
  }
  rates.sort((a, b) => a - b);
  const q = f => (100 * rates[Math.floor(f * (rates.length - 1))]).toFixed(0);
  const inBand = rates.filter(x => x >= 0.6 && x <= 0.8).length;
  console.log(`buffer ${buf}: 120 levels (40 deals x 3 rule seeds), unwinnable ${unw}, solver gave up ${unk}; random-tap win % min ${q(0)} / p25 ${q(.25)} / median ${q(.5)} / p75 ${q(.75)} / max ${q(1)}; in 60-80% band: ${inBand}/${rates.length}`);
}
