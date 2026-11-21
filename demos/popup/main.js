// Pop-up book portfolio. Board-book leaves hinge on the spine, paper layers stand up on each spread.
import * as THREE from 'three';

const q = new URLSearchParams(location.search);
const TAU = Math.PI * 2;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const backOut = (x) => { const c = 1.9, y = x - 1; return 1 + (c + 1) * y * y * y + c * y * y; };

const INK = { pink: '#ff4fa3', blue: '#2f46c9', yellow: '#ffd93b', green: '#00a57a', red: '#ff5533', violet: '#7d5cff', ink: '#1d1d1b', paper: '#f4eddc' };
const STORE = 'https://apps.apple.com/us/app/';
const SPREADS = [
  { table: INK.blue, a: INK.pink, b: INK.yellow, fg: INK.paper },
  { name: 'Veep AR', words: ['VEEP', 'AR'], tag: 'SPACES / CHAT / MEET', icon: 'veep-ar', url: STORE + 'veep-ar-spaces-chat-meet/id1579238644', table: INK.pink, a: INK.blue, b: INK.yellow, fg: INK.paper },
  { name: 'Demi', words: ['DEMI'], tag: 'AI ASSISTANT', icon: 'demi', url: STORE + 'demi-ai-assistant/id6757938405', table: INK.yellow, a: INK.pink, b: INK.blue, fg: INK.ink },
  { name: 'Marriott Bonvoy', words: ['MARRIOTT', 'BONVOY'], tag: 'BOOK HOTELS', icon: 'marriott-bonvoy', url: STORE + 'marriott-bonvoy-book-hotels/id455004730', table: INK.green, a: INK.red, b: INK.blue, fg: INK.paper },
  { name: 'ViralCooker', words: ['VIRAL', 'COOKER'], tag: 'UGC VIDEO EDITOR', icon: 'viralcooker', url: STORE + 'viralcooker-ugc-video-editor/id6762104181', table: INK.red, a: INK.yellow, b: INK.blue, fg: INK.paper },
  { name: 'Vision3D', words: ['VISION', '3D'], tag: 'APP STORE', icon: 'vision3d', url: STORE + 'vision3d/id6738053111', table: INK.violet, a: INK.yellow, b: INK.pink, fg: INK.paper },
  { table: INK.ink, a: INK.pink, b: INK.blue, fg: INK.paper },
];
const LINKS = [
  ['X', 'https://x.com/hunter_spatial'],
  ['INSTAGRAM', 'https://instagram.com/hunter_spatial'],
  ['LINKEDIN', 'https://www.linkedin.com/in/hunt3r-harris/'],
];
const L = 6, LAST = 6;            // leaves, last spread index
const W = 2.5, D = 3.3, TH = 0.028; // page width, depth, board thickness
const DISPLAY = '"Dela Gothic One", "Arial Black", sans-serif';
const MONO = '"DM Mono", ui-monospace, monospace';

function overprint(a, b) {
  const x = new THREE.Color(a), y = new THREE.Color(b);
  return '#' + new THREE.Color().setRGB(x.r * y.r, x.g * y.g, x.b * y.b).getHexString();
}

// ---------- print (canvas) ----------
const PW = 1024, PH = 1352;
function mk(w = PW, h = PH) { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }
function paperBase(g, w, h) {
  g.fillStyle = INK.paper; g.fillRect(0, 0, w, h);
  for (let i = 0; i < (w * h) / 300; i++) {
    g.fillStyle = `rgba(80,55,30,${Math.random() * 0.07})`;
    g.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 2, 1 + Math.random() * 2);
  }
}
function halftone(g, cx, cy, r, color, { cell = 22, ang = 0.55, min = 0.1, flip = false } = {}) {
  g.save(); g.globalCompositeOperation = 'multiply';
  g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.clip();
  g.translate(cx, cy); g.rotate(ang); g.fillStyle = color;
  const n = Math.ceil((r * 1.45) / cell), sa = Math.sin(ang), ca = Math.cos(ang);
  for (let i = -n; i <= n; i++) for (let j = -n; j <= n; j++) {
    const x = i * cell, y = j * cell;
    const wy = (x * sa + y * ca) / r;
    const k = clamp(0.5 + 0.5 * wy * (flip ? -1 : 1));
    g.beginPath(); g.arc(x, y, cell * 0.74 * (min + (1 - min) * k), 0, TAU); g.fill();
  }
  g.restore();
}
function stripes(g, x, y, w, h, color, step = 26) {
  g.save(); g.globalCompositeOperation = 'multiply'; g.beginPath(); g.rect(x, y, w, h); g.clip();
  g.strokeStyle = color; g.lineWidth = step * 0.42;
  for (let i = -h; i < w + h; i += step) { g.beginPath(); g.moveTo(x + i, y + h); g.lineTo(x + i + h, y); g.stroke(); }
  g.restore();
}
function label(g, text, x, y, align = 'left', color = INK.ink, size = 25) {
  g.save(); g.font = `500 ${size}px ${MONO}`; if ('letterSpacing' in g) g.letterSpacing = '5px';
  g.textAlign = align; g.textBaseline = 'alphabetic'; g.fillStyle = color; g.fillText(text, x, y); g.restore();
}
function fit(g, text, maxW, max) {
  let s = max; g.font = `${s}px ${DISPLAY}`;
  const w = g.measureText(text).width; if (w > maxW) s = Math.floor((s * maxW) / w);
  return s;
}
function misreg(g, text, x, y, size, a, b, align = 'left') {
  g.save(); g.font = `${size}px ${DISPLAY}`; g.textAlign = align; g.textBaseline = 'alphabetic';
  g.globalCompositeOperation = 'multiply';
  g.fillStyle = a; g.fillText(text, x + size * 0.04, y + size * 0.035);
  g.fillStyle = b; g.fillText(text, x, y);
  g.restore();
}
function words(g, list, bottom, a, b, max = 250) {
  const M = 84; let y = bottom;
  for (let i = list.length - 1; i >= 0; i--) {
    const s = fit(g, list[i], PW - M * 2, max);
    misreg(g, list[i], M, y, s, a, b); y -= s * 0.98;
  }
}
function coverArt() {
  const s = SPREADS[0], [c, g] = mk(); paperBase(g, PW, PH);
  g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = s.b; g.beginPath(); g.arc(PW * 0.6, 470, 330, 0, TAU); g.fill(); g.restore();
  halftone(g, PW * 0.36, 590, 300, s.a, { cell: 24 });
  stripes(g, 84, 860, PW - 168, 44, INK.blue);
  label(g, 'POP-UP PORTFOLIO', 84, 130); label(g, '05 APPS', PW - 84, 130, 'right');
  words(g, ['HUNTER', 'HARRIS'], PH - 190, s.a, INK.blue, 230);
  label(g, 'TAP TO OPEN', 84, PH - 92); label(g, '→', PW - 84, PH - 92, 'right', INK.ink, 34);
  return c;
}
function leftArt(k) {
  const s = SPREADS[k], [c, g] = mk(); paperBase(g, PW, PH);
  if (k === LAST) {
    halftone(g, PW * 0.5, 520, 340, s.a); label(g, 'CONTACT', 84, 130); label(g, 'HUNTER HARRIS', PW - 84, 130, 'right');
    words(g, ['SAY', 'HELLO'], PH - 190, s.a, s.b, 270); label(g, 'TAP A TAG', 84, PH - 92);
    return c;
  }
  halftone(g, PW * 0.6, 500, 320, s.b, { flip: k % 2 === 0 });
  g.save(); g.globalCompositeOperation = 'multiply'; g.font = `560px ${DISPLAY}`; g.fillStyle = s.a; g.textBaseline = 'alphabetic';
  g.fillText(String(k), 64, 740); g.restore();
  label(g, `0${k} / 05`, 84, 130); label(g, s.tag, PW - 84, 130, 'right');
  words(g, s.words, PH - 190, s.a, s.b);
  stripes(g, 84, PH - 128, 250, 34, s.b); label(g, 'APP STORE ↗', PW - 84, PH - 100, 'right');
  return c;
}
function rightArt(k) {
  const s = SPREADS[k], [c, g] = mk(); paperBase(g, PW, PH);
  halftone(g, PW * 0.46, PH * 0.4, 400, s.a, { flip: true, cell: 26, min: 0.04 });
  g.save(); g.globalCompositeOperation = 'multiply'; g.strokeStyle = s.b; g.lineWidth = 10;
  g.beginPath(); g.arc(PW * 0.46, PH * 0.4, 440, 0, TAU); g.stroke(); g.restore();
  label(g, k === LAST ? 'FIN' : `NO. 0${k}`, PW - 84, 130, 'right');
  stripes(g, PW - 334, PH - 128, 250, 34, s.a);
  label(g, k === LAST ? 'HUNT3R.ORG' : 'TAP THE ICON', 84, PH - 100);
  return c;
}
function iconArt(img) {
  const [c, g] = mk(512, 512);
  g.beginPath(); g.roundRect(0, 0, 512, 512, 112); g.clip();
  if (img) g.drawImage(img, 0, 0, 512, 512); else { g.fillStyle = INK.blue; g.fillRect(0, 0, 512, 512); }
  return c;
}
function tagArt(text, a, b) {
  const [c, g] = mk(640, 400); paperBase(g, 640, 400);
  stripes(g, 0, 330, 640, 70, a, 30);
  const s = fit(g, text, 520, 190); misreg(g, text, 60, 250, s, a, b);
  label(g, '↗', 580, 86, 'right', INK.ink, 54);
  return c;
}
function dotArt(strong) {
  const [c, g] = mk(128, 128); g.fillStyle = '#fff'; g.fillRect(0, 0, 128, 128);
  g.fillStyle = strong ? 'rgba(0,0,20,.11)' : 'rgba(0,0,20,.09)';
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { g.beginPath(); g.arc(i * 32 + (j % 2 ? 16 : 0) + 8, j * 32 + 16, strong ? 9 : 7, 0, TAU); g.fill(); }
  return c;
}

// ---------- paper shapes (base on y = 0, centred on x) ----------
const V2 = (x, y) => new THREE.Vector2(x, y);
const S = {
  circle(r) { const s = new THREE.Shape(); s.absarc(0, r, r, 0, TAU); return s; },
  ring(r, r2) { const s = S.circle(r); const h = new THREE.Path(); h.absarc(0, r, r2, 0, TAU, true); s.holes.push(h); return s; },
  burst(r, n, k = 0.74) {
    const p = []; for (let i = 0; i < n * 2; i++) { const a = (i / (n * 2)) * TAU, rr = i % 2 ? r * k : r; p.push(V2(Math.cos(a) * rr, r + Math.sin(a) * rr)); }
    return new THREE.Shape(p);
  },
  spark(r) {
    const s = new THREE.Shape(), c = r * 0.14;
    s.moveTo(0, 2 * r); s.quadraticCurveTo(c, r + c, r, r); s.quadraticCurveTo(c, r - c, 0, 0);
    s.quadraticCurveTo(-c, r - c, -r, r); s.quadraticCurveTo(-c, r + c, 0, 2 * r); return s;
  },
  hill(w, h) { const s = new THREE.Shape(); s.moveTo(-w / 2, 0); s.absellipse(0, 0, w / 2, h, Math.PI, 0, true); s.closePath(); return s; },
  cloud(w) {
    const cs = [[-0.3, 0.16, 0.2], [-0.08, 0.26, 0.26], [0.18, 0.2, 0.22], [0.36, 0.12, 0.14], [-0.42, 0.1, 0.12]].map((c) => c.map((v) => v * w));
    const p = [V2(-w / 2, -0.01)];
    for (let i = 1; i < 64; i++) {
      const x = -w / 2 + (w * i) / 64; let y = 0.02;
      for (const [cx, cy, r] of cs) { const d = r * r - (x - cx) ** 2; if (d > 0) y = Math.max(y, cy + Math.sqrt(d)); }
      p.push(V2(x, y));
    }
    p.push(V2(w / 2, -0.01)); return new THREE.Shape(p);
  },
  rrect(w, h, r, y0 = 0) {
    const s = new THREE.Shape(), x = -w / 2;
    s.moveTo(x + r, y0); s.lineTo(x + w - r, y0); s.quadraticCurveTo(x + w, y0, x + w, y0 + r);
    s.lineTo(x + w, y0 + h - r); s.quadraticCurveTo(x + w, y0 + h, x + w - r, y0 + h);
    s.lineTo(x + r, y0 + h); s.quadraticCurveTo(x, y0 + h, x, y0 + h - r);
    s.lineTo(x, y0 + r); s.quadraticCurveTo(x, y0, x + r, y0); return s;
  },
  hole(cx, cy, w, h) { const p = new THREE.Path(); p.moveTo(cx - w / 2, cy - h / 2); p.lineTo(cx - w / 2, cy + h / 2); p.lineTo(cx + w / 2, cy + h / 2); p.lineTo(cx + w / 2, cy - h / 2); p.closePath(); return p; },
  dot(cx, cy, r) { const p = new THREE.Path(); p.absarc(cx, cy, r, 0, TAU, true); return p; },
  skyline(list) {
    const total = list.reduce((a, b) => a + b[0], 0); let x = -total / 2;
    const s = new THREE.Shape(); s.moveTo(x, 0);
    for (const [w, h] of list) {
      s.lineTo(x, h); s.lineTo(x + w, h);
      const cols = Math.max(1, Math.floor(w / 0.2)), rows = Math.floor((h - 0.2) / 0.24), cw = w / cols;
      for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) if ((i * 7 + j * 3 + Math.round(w * 10)) % 4) s.holes.push(S.hole(x + cw * (i + 0.5), h - 0.2 - j * 0.24, cw * 0.46, 0.12));
      x += w;
    }
    s.lineTo(x, 0); s.closePath(); return s;
  },
  flame(h) {
    const s = new THREE.Shape(); s.moveTo(0, 0);
    s.bezierCurveTo(-0.5 * h, 0, -0.44 * h, 0.5 * h, -0.1 * h, 0.62 * h);
    s.bezierCurveTo(-0.14 * h, 0.8 * h, 0, 0.92 * h, 0.1 * h, h);
    s.bezierCurveTo(0.1 * h, 0.8 * h, 0.44 * h, 0.62 * h, 0.4 * h, 0.3 * h);
    s.bezierCurveTo(0.38 * h, 0.1 * h, 0.2 * h, 0, 0, 0); return s;
  },
  bubble(w, h, dir) {
    const t = h * 0.26, s = S.rrect(w, h, h * 0.3, t), x = dir * w * 0.22;
    const tail = new THREE.Shape([V2(x - w * 0.09, t + 0.02), V2(x + dir * w * 0.1, 0), V2(x + w * 0.09, t + 0.02)]);
    for (let i = -1; i <= 1; i++) s.holes.push(S.dot(i * w * 0.2, t + h / 2, h * 0.09));
    return [s, tail];
  },
  strip(w, h) {
    const s = S.rrect(w, h, 0.04), n = Math.floor(w / 0.22);
    for (let i = 0; i < n; i++) { const x = -w / 2 + (w * (i + 0.5)) / n; s.holes.push(S.hole(x, h - 0.1, 0.1, 0.08), S.hole(x, 0.1, 0.1, 0.08)); }
    return s;
  },
  goggles(w, h) {
    const s = S.rrect(w, h, h * 0.46), lw = w * 0.36, lh = h * 0.56;
    for (const d of [-1, 1]) { const p = S.rrect(lw, lh, lh * 0.45, (h - lh) / 2); p.getPoints(10); const hp = new THREE.Path(p.getPoints(10).map((v) => V2(v.x + d * w * 0.225, v.y)).reverse()); s.holes.push(hp); }
    return s;
  },
  play(r) { const s = S.circle(r); s.holes.push(new THREE.Path([V2(-r * 0.28, r * 0.55), V2(-r * 0.28, r * 1.45), V2(r * 0.5, r)])); return s; },
  arch(w, h, t) {
    const s = new THREE.Shape(), r = w / 2, cy = h - r;
    s.moveTo(-r, 0); s.lineTo(-r, cy); s.absarc(0, cy, r, Math.PI, 0, true); s.lineTo(r, 0); s.lineTo(r - t, 0); s.lineTo(r - t, cy);
    s.absarc(0, cy, r - t, 0, Math.PI, false); s.lineTo(-r + t, 0); s.closePath(); return s;
  },
  cube(r) {
    const a = r * 0.866, g = 0.93, f = (pts) => { const cx = pts.reduce((s, p) => s + p[0], 0) / 4, cy = pts.reduce((s, p) => s + p[1], 0) / 4; return new THREE.Shape(pts.map(([x, y]) => V2(cx + (x - cx) * g, cy + (y - cy) * g))); };
    return [f([[0, 2 * r], [a, 1.5 * r], [0, r], [-a, 1.5 * r]]), f([[-a, 1.5 * r], [0, r], [0, 0], [-a, 0.5 * r]]), f([[a, 1.5 * r], [a, 0.5 * r], [0, 0], [0, r]])];
  },
};

// ---------- scene ----------
const canvas = document.getElementById('gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const ANISO = renderer.capabilities.getMaxAnisotropy();
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
scene.add(new THREE.HemisphereLight(0xffffff, 0xfff1e0, 2.25));
const sun = new THREE.DirectionalLight(0xffffff, 1.35);
sun.position.set(-3.2, 7.5, 4.2); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -5, right: 5, top: 5, bottom: -5, near: 1, far: 20 });
sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.012; sun.shadow.radius = 5;
scene.add(sun);

function tex(c, flip) {
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = ANISO;
  if (flip) { t.center.set(0.5, 0.5); t.rotation = Math.PI; }
  return t;
}
const std = (o) => new THREE.MeshStandardMaterial({ roughness: 1, metalness: 0, ...o });
const dotTex = tex(dotArt(false)); dotTex.wrapS = dotTex.wrapT = THREE.RepeatWrapping; dotTex.repeat.set(2.2, 2.2);
const tableTex = tex(dotArt(true)); tableTex.wrapS = tableTex.wrapT = THREE.RepeatWrapping; tableTex.repeat.set(44, 44);
const edgeMat = std({ color: '#efe6d2' });
const tableMat = std({ color: SPREADS[0].table, map: tableTex });
const table = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), tableMat);
table.rotation.x = -Math.PI / 2; table.position.y = -TH; table.receiveShadow = true; scene.add(table);

const book = new THREE.Group(); scene.add(book);
const leaves = [], spreads = [], pieces = [], hot = [];

function yAt(k, x) { return (x < 0 ? k * TH : (L - k) * TH) + 0.002; }
function piece(k, shape, color, o = {}) {
  const { x = 0, z = 0, lift = 0, delay = 0, tilt = -0.1, ry = 0, stems, plain } = o;
  const hinge = new THREE.Group(), inner = new THREE.Group(); hinge.add(inner);
  hinge.position.set(x, yAt(k, x), z); hinge.rotation.y = ry;
  const list = Array.isArray(shape) ? shape : [shape], cols = Array.isArray(color) ? color : [color];
  let main;
  list.forEach((sh, i) => {
    const geo = new THREE.ExtrudeGeometry(sh, { depth: 0.018, bevelEnabled: false, curveSegments: 20 });
    const m = new THREE.Mesh(geo, [std({ color: cols[i % cols.length], map: plain ? null : dotTex }), edgeMat]);
    m.position.y = lift; m.castShadow = m.receiveShadow = true; inner.add(m); main = main || m;
  });
  if (lift > 0) for (const sx of stems || [0]) {
    const st = new THREE.Mesh(new THREE.BoxGeometry(0.07, lift + 0.16, 0.012), edgeMat);
    st.position.set(sx, (lift + 0.16) / 2, -0.004); st.castShadow = true; inner.add(st);
  }
  spreads[k].add(hinge);
  const rec = { k, hinge, inner, tilt, delay, main, lift, seed: pieces.length * 1.7, hover: 0 };
  pieces.push(rec); return rec;
}
function card(k, canvasArt, o) {
  const { w = 1, h = 1, r = 0.2, url } = o;
  const rec = piece(k, S.rrect(w, h, r * Math.min(w, h)), INK.paper, { tilt: -0.24, lift: 0.3, delay: 0.62, plain: true, ...o });
  const face = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.86, h * 0.86), std({ map: tex(canvasArt), alphaTest: 0.5 }));
  face.position.set(0, rec.lift + h / 2, 0.023); rec.inner.add(face);
  for (const m of [rec.main, face]) { m.userData.url = url; m.userData.rec = rec; hot.push(m); }
  return rec;
}

function loadImg(src) { return new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; }); }

async function build() {
  await Promise.race([
    Promise.all([document.fonts.load(`80px ${DISPLAY}`), document.fonts.load(`500 25px ${MONO}`)]),
    new Promise((r) => setTimeout(r, 2500)),
  ]).catch(() => {});
  const icons = await Promise.all(SPREADS.map((s) => (s.icon ? loadImg(`../../apps/${s.icon}.jpg`) : null)));

  for (let j = 0; j < L; j++) {
    const front = tex(j === 0 ? coverArt() : rightArt(j)), back = tex(leftArt(j + 1), true);
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(W, TH, D), [edgeMat, edgeMat, std({ map: front }), std({ map: back }), edgeMat, edgeMat]);
    mesh.position.set(W / 2, TH / 2, 0); mesh.castShadow = mesh.receiveShadow = true;
    const grp = new THREE.Group(); grp.add(mesh); book.add(grp); leaves.push(grp);
  }
  const board = new THREE.Mesh(new THREE.BoxGeometry(W, TH, D), [edgeMat, edgeMat, std({ map: tex(rightArt(LAST)) }), edgeMat, edgeMat, edgeMat]);
  board.position.set(W / 2, -TH / 2, 0); board.receiveShadow = true; book.add(board);

  for (let k = 0; k <= LAST; k++) { const g = new THREE.Group(); g.visible = false; g.userData.e = 0; book.add(g); spreads.push(g); }
  const P = INK.paper;
  {
    const k = 1, { a, b } = SPREADS[k], K = overprint(a, INK.pink);
    piece(k, S.ring(1.05, 0.78), a, { x: -0.5, z: -1.12 });
    piece(k, S.circle(0.55), b, { x: 1.25, z: -0.95, lift: 0.55, delay: 0.1 });
    piece(k, S.bubble(1.7, 1.05, -1), a, { x: -1.25, z: -0.4, lift: 0.12, delay: 0.2 });
    piece(k, S.bubble(1.15, 0.75, 1), b, { x: 0.2, z: 0.02, lift: 0.1, delay: 0.3 });
    piece(k, S.cloud(1.05), P, { x: 0.3, z: 1.08, delay: 0.42 });
    piece(k, S.spark(0.22), K, { x: -2.1, z: 0.15, lift: 0.9, delay: 0.5 });
    piece(k, S.spark(0.17), P, { x: 2.1, z: -0.3, lift: 1.15, delay: 0.55 });
    card(k, iconArt(icons[k]), { x: 1.38, z: 0.82, url: SPREADS[k].url });
  }
  {
    const k = 2, { a, b } = SPREADS[k], K = overprint(a, b);
    piece(k, S.burst(1.15, 18, 0.78), a, { x: 0, z: -1.15 });
    piece(k, S.circle(0.7), b, { x: 0, z: -0.82, lift: 0.28, delay: 0.12 });
    piece(k, S.spark(0.42), P, { x: -1.55, z: -0.45, lift: 0.7, delay: 0.2 });
    piece(k, S.spark(0.3), K, { x: 1.75, z: -0.5, lift: 1.0, delay: 0.26 });
    piece(k, S.spark(0.24), a, { x: -0.6, z: 0.1, lift: 0.45, delay: 0.32 });
    piece(k, S.spark(0.18), b, { x: 0.45, z: 0.3, lift: 0.5, delay: 0.38 });
    piece(k, S.spark(0.2), P, { x: 2.15, z: 0.25, lift: 0.35, delay: 0.42 });
    piece(k, S.hill(2.2, 0.55), b, { x: -1.35, z: 0.2, delay: 0.46 });
    piece(k, S.hill(1.4, 0.38), a, { x: -0.75, z: 0.46, delay: 0.52 });
    card(k, iconArt(icons[k]), { x: 1.38, z: 0.85, url: SPREADS[k].url });
  }
  {
    const k = 3, { a, b } = SPREADS[k], K = overprint(a, b);
    piece(k, S.circle(0.8), a, { x: 0.75, z: -1.22, lift: 0.75 });
    piece(k, S.skyline([[0.5, 1.3], [0.42, 1.9], [0.6, 1.1], [0.38, 1.6], [0.55, 2.1], [0.45, 1.25], [0.6, 1.7]]), b, { x: -0.1, z: -0.82, delay: 0.1 });
    piece(k, S.skyline([[0.6, 0.8], [0.45, 1.2], [0.7, 0.65], [0.5, 1.0]]), K, { x: -1.25, z: -0.18, delay: 0.22 });
    piece(k, S.skyline([[0.5, 0.6], [0.4, 0.9], [0.55, 0.5]]), a, { x: 1.35, z: -0.22, delay: 0.28 });
    piece(k, S.cloud(1.1), P, { x: -1.75, z: -0.5, lift: 1.5, delay: 0.35 });
    piece(k, S.cloud(0.8), P, { x: 1.7, z: -0.6, lift: 1.8, delay: 0.4 });
    piece(k, S.hill(1.0, 0.3), b, { x: 0.3, z: 1.1, delay: 0.46 });
    card(k, iconArt(icons[k]), { x: 1.35, z: 0.85, url: SPREADS[k].url });
  }
  {
    const k = 4, { a, b } = SPREADS[k], K = overprint(INK.pink, b);
    piece(k, S.strip(3.7, 0.55), K, { x: 0, z: -1.18, lift: 1.4, stems: [-1.3, 1.3] });
    piece(k, S.flame(2.0), b, { x: -0.4, z: -0.72, delay: 0.1 });
    piece(k, S.flame(1.5), INK.pink, { x: -0.25, z: -0.36, delay: 0.18 });
    piece(k, S.flame(1.0), a, { x: -0.12, z: 0, delay: 0.26 });
    piece(k, S.play(0.5), P, { x: -1.8, z: 0.08, lift: 0.3, delay: 0.34 });
    piece(k, S.spark(0.25), a, { x: 1.95, z: -0.4, lift: 1.2, delay: 0.4 });
    piece(k, S.spark(0.18), P, { x: -2.1, z: -0.6, lift: 1.3, delay: 0.45 });
    card(k, iconArt(icons[k]), { x: 1.38, z: 0.82, url: SPREADS[k].url });
  }
  {
    const k = 5, { a, b } = SPREADS[k], K = overprint(b, INK.blue);
    piece(k, S.circle(1.0), b, { x: -0.3, z: -1.18, lift: 0.3 });
    piece(k, S.goggles(2.6, 1.05), a, { x: -0.4, z: -0.5, lift: 0.55, stems: [-0.95, 0.95], delay: 0.12 });
    piece(k, S.cube(0.42), [P, K, b], { x: -1.85, z: 0.02, lift: 0.15, delay: 0.25 });
    piece(k, S.cube(0.3), [a, K, P], { x: 0.3, z: 1.05, delay: 0.32 });
    piece(k, S.cube(0.36), [P, b, K], { x: 1.95, z: -0.35, lift: 0.6, delay: 0.38 });
    piece(k, S.ring(0.4, 0.26), K, { x: 0.35, z: 0.2, lift: 0.2, delay: 0.42 });
    card(k, iconArt(icons[k]), { x: 1.38, z: 0.85, url: SPREADS[k].url });
  }
  {
    const k = LAST, { a, b } = SPREADS[k], K = overprint(a, b);
    piece(k, S.burst(1.2, 14, 0.7), a, { x: 0, z: -1.12 });
    piece(k, S.circle(0.6), b, { x: 0, z: -0.8, lift: 0.6, delay: 0.1 });
    piece(k, S.arch(1.5, 1.2, 0.2), K, { x: -1.55, z: -0.55, delay: 0.18 });
    piece(k, S.arch(1.5, 1.2, 0.2), b, { x: 1.55, z: -0.55, delay: 0.24 });
    LINKS.forEach(([name, url], i) => card(k, tagArt(name, a, b), { x: (i - 1) * 1.55, z: i === 1 ? 0.4 : 0.12, w: 1.35, h: 0.86, r: 0.12, lift: 0.22, delay: 0.4 + i * 0.1, ry: (1 - i) * 0.16, url }));
    piece(k, S.spark(0.2), P, { x: -2.1, z: 0.9, lift: 0.3, delay: 0.7 });
    piece(k, S.spark(0.16), a, { x: 2.15, z: 1.0, lift: 0.25, delay: 0.75 });
  }
}

// ---------- state, input ----------
let goal = clamp(parseInt(q.get('p') || '0', 10) || 0, 0, LAST), p = goal, vel = 0;
const pointer = new THREE.Vector2(0, 0), look = new THREE.Vector2(0, 0), ray = new THREE.Raycaster();
const $ = (id) => document.getElementById(id);
const dots = $('dots');
for (let i = 0; i <= LAST; i++) dots.appendChild(document.createElement('i'));
let shown = -1;
const tA = new THREE.Color(), tB = new THREE.Color();
function ui() {
  const k = Math.round(clamp(goal, 0, LAST)); if (k === shown) return; shown = k;
  const s = SPREADS[k];
  $('count').textContent = `0${k} / 0${LAST}`;
  [...dots.children].forEach((d, i) => d.classList.toggle('on', i === k));
  $('prev').disabled = k === 0; $('next').disabled = k === LAST;
  const o = $('open'); o.hidden = !s.url; if (s.url) { o.href = s.url; o.textContent = `${s.name} ↗`; }
  const root = document.documentElement.style; root.setProperty('--fg', s.fg); root.setProperty('--bg', s.table);
  document.querySelector('meta[name=theme-color]').content = s.table;
}
const go = (d) => { goal = clamp(Math.round(goal) + d, 0, LAST); ui(); };
$('prev').onclick = () => go(-1); $('next').onclick = () => go(1);
addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight' || e.key === ' ') go(1); else if (e.key === 'ArrowLeft') go(-1);
  else if (e.key === 'Home') { goal = 0; ui(); } else if (e.key === 'End') { goal = LAST; ui(); }
});
let wheelAt = 0;
addEventListener('wheel', (e) => { const now = performance.now(); if (now - wheelAt < 480 || Math.abs(e.deltaY) + Math.abs(e.deltaX) < 14) return; wheelAt = now; go(e.deltaY + e.deltaX > 0 ? 1 : -1); }, { passive: true });

let down = null, hoverRec = null;
function pick(e) {
  pointer.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  ray.setFromCamera(pointer, camera);
  const live = hot.filter((m) => spreads[m.userData.rec.k].userData.e > 0.85);
  const hit = ray.intersectObjects(live, false)[0];
  return hit ? hit.object.userData : null;
}
canvas.addEventListener('pointerdown', (e) => { down = { x: e.clientX, g: Math.round(goal), drag: false }; canvas.setPointerCapture(e.pointerId); });
canvas.addEventListener('pointermove', (e) => {
  const h = pick(e);
  if (down) {
    const dx = e.clientX - down.x;
    if (Math.abs(dx) > 8) { down.drag = true; canvas.classList.add('drag'); }
    if (down.drag) goal = clamp(down.g - dx / (innerWidth * 0.42), Math.max(0, down.g - 1), Math.min(LAST, down.g + 1));
  }
  hoverRec = h && !down?.drag ? h.rec : null; canvas.classList.toggle('hot', !!hoverRec);
});
canvas.addEventListener('pointerup', (e) => {
  if (!down) return; const d = down; down = null; canvas.classList.remove('drag');
  if (d.drag) { const dx = e.clientX - d.x; goal = clamp(Math.round(goal - Math.sign(dx) * 0.3), 0, LAST); ui(); return; }
  const h = pick(e);
  if (h?.url) { window.open(h.url, '_blank', 'noopener'); return; }
  go(e.clientX > innerWidth / 2 ? 1 : -1);
});
canvas.addEventListener('pointerleave', () => { hoverRec = null; canvas.classList.remove('hot'); });

function resize() {
  renderer.setSize(innerWidth, innerHeight, false);
  camera.aspect = innerWidth / innerHeight; camera.fov = lerp(30, 46, clamp((1.1 - camera.aspect) / 0.6)); camera.updateProjectionMatrix();
}
addEventListener('resize', resize); resize();

const target = new THREE.Vector3();
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000), t = now / 1000; last = now;
  vel += ((goal - p) * 46 - vel * 12.5) * dt; p += vel * dt;
  const pc = clamp(p, 0, LAST);

  leaves.forEach((g, j) => {
    const tj = clamp(pc - j), a = sstep(0.1, 1, tj);
    g.rotation.z = Math.PI * a; g.position.y = lerp((L - 1 - j) * TH, (j + 1) * TH, a);
  });
  spreads.forEach((g, k) => {
    if (!k) return;
    const open = clamp(pc - (k - 1)) > 0.93 && (k === LAST || clamp(pc - k) < 0.045);
    g.userData.e = clamp(g.userData.e + (open ? dt / 1.05 : -dt / 0.13)); g.visible = g.userData.e > 0.004;
  });
  for (const r of pieces) {
    const E = spreads[r.k].userData.e; if (E <= 0.004) continue;
    const e = backOut(clamp(E * 1.85 - r.delay));
    r.hover = lerp(r.hover, r === hoverRec ? 1 : 0, 1 - Math.exp(-dt * 12));
    r.hinge.rotation.x = -(1 - e) * Math.PI * 0.5 + r.tilt * e + Math.sin(t * 1.25 + r.seed) * 0.014 * e + r.hover * 0.12;
    r.inner.scale.setScalar(clamp(e * 4) * (1 + r.hover * 0.07));
    r.inner.rotation.z = Math.sin(t * 9) * 0.035 * r.hover;
  }

  const k0 = Math.floor(clamp(pc, 0, LAST - 0.0001)), f = sstep(0.25, 0.75, pc - k0);
  tableMat.color.copy(tA.set(SPREADS[k0].table)).lerp(tB.set(SPREADS[k0 + 1].table), f);

  look.lerp(pointer, 1 - Math.exp(-dt * 3.5));
  const open0 = sstep(0, 1, clamp(pc)), asp = camera.aspect;
  const portrait = clamp((1.1 - asp) / 0.6), elev = lerp(0.76, 1.12, portrait);
  const half = lerp(1.85, 3.05, open0), hh = Math.atan(Math.tan((camera.fov * Math.PI) / 360) * asp);
  const dist = Math.max(lerp(7.4, 8.6, open0), half / Math.tan(hh));
  target.set(lerp(W / 2, 0, open0), lerp(0.1, 0.5, open0), lerp(0, -0.12, open0));
  camera.position.set(target.x + look.x * 0.95, target.y + Math.sin(elev) * dist + look.y * 0.45, target.z + Math.cos(elev) * dist);
  camera.lookAt(target);
  renderer.render(scene, camera);
  if (!window.__ready && leaves.length) window.__ready = true;
  requestAnimationFrame(frame);
}

build().then(() => {
  ui();
  for (const g of spreads) if (spreads.indexOf(g) === Math.round(p) && Math.round(p) > 0) g.userData.e = q.has('p') ? 1 : 0;
  requestAnimationFrame(frame);
});
