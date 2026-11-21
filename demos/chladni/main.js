// Chladni plate. Sand grains random-walk with step size set by local vibration amplitude,
// so they collect on the nodal lines of cos(n pi x) cos(m pi y) +/- cos(m pi x) cos(n pi y).
// The frame renders in greyscale at low resolution, then an 8x8 Bayer pass makes it 1-bit.
import * as THREE from 'three';

const q = new URLSearchParams(location.search);
const PI = Math.PI;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const N = 46000, LO = 1, HI = 12;
const S = { m: +q.get('m') || 3, n: +q.get('n') || 5, tm: 0, tn: 0, sg: q.get('s') === '1' ? 1 : -1, ink: 0 };
S.tm = S.m; S.tn = S.n;
const PALETTES = [['#efe7d2', '#0d0d0f'], ['#ffb000', '#140a00'], ['#8dffb0', '#04140a'], ['#f4f1ff', '#1a1ad6'], ['#0d0d0f', '#efe7d2']];
const rgb = (hex) => new THREE.Vector3(parseInt(hex.slice(1, 3), 16) / 255, parseInt(hex.slice(3, 5), 16) / 255, parseInt(hex.slice(5, 7), 16) / 255);

const canvas = document.getElementById('gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(1);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
const rig = new THREE.Group(); scene.add(rig);

const U = { m: { value: S.m }, n: { value: S.n }, sg: { value: S.sg }, ph: { value: 0 }, amp: { value: 0.075 } };
const WAVE = /* glsl */`
  uniform float m, n, sg, ph, amp;
  const float PI = 3.14159265;
  float F(vec2 p) { return cos(n * PI * p.x) * cos(m * PI * p.y) + sg * cos(m * PI * p.x) * cos(n * PI * p.y); }
`;
const plate = new THREE.Mesh(new THREE.PlaneGeometry(1, 1, 160, 160), new THREE.ShaderMaterial({
  uniforms: U,
  vertexShader: WAVE + /* glsl */`
    varying float vF; varying vec2 vUv;
    void main() {
      vUv = uv; vF = F(uv);
      vec3 p = vec3(uv.x * 2. - 1., amp * .5 * vF * sin(ph), uv.y * 2. - 1.);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.);
    }`,
  fragmentShader: /* glsl */`
    uniform float ph; varying float vF; varying vec2 vUv;
    void main() {
      float h = abs(vF * sin(ph)) * .5;
      vec2 e = min(vUv, 1. - vUv); float rim = 1. - smoothstep(0., .012, min(e.x, e.y));
      gl_FragColor = vec4(vec3(.035 + .42 * pow(h, 1.25) + .5 * rim), 1.);
    }`,
  side: THREE.DoubleSide,
}));
plate.frustumCulled = false; rig.add(plate);

const lambert = (albedo) => new THREE.ShaderMaterial({
  uniforms: { k: { value: albedo } },
  vertexShader: 'varying vec3 vN; void main(){ vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
  fragmentShader: 'uniform float k; varying vec3 vN; void main(){ float d = max(dot(normalize(vN), normalize(vec3(-.5, .75, .45))), 0.); gl_FragColor = vec4(vec3(k * (.12 + .88 * d)), 1.); }',
});
const add = (geo, mat, y) => { const m = new THREE.Mesh(geo, mat); m.position.y = y; rig.add(m); return m; };
add(new THREE.BoxGeometry(2.03, 0.035, 2.03), lambert(0.55), -0.06);
add(new THREE.CylinderGeometry(0.05, 0.05, 0.62, 20), lambert(0.8), -0.38);
add(new THREE.CylinderGeometry(0.2, 0.34, 0.12, 28), lambert(0.75), -0.7);
add(new THREE.CylinderGeometry(0.62, 0.7, 0.2, 40), lambert(0.6), -0.86);
const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.ShaderMaterial({
  vertexShader: 'varying vec3 vP; void main(){ vP = (modelMatrix * vec4(position, 1.)).xyz; gl_Position = projectionMatrix * viewMatrix * vec4(vP, 1.); }',
  fragmentShader: 'varying vec3 vP; void main(){ float r = length(vP.xz); float l = .34 * exp(-r * r * .16); l *= .25 + .75 * smoothstep(.7, 1.9, r); gl_FragColor = vec4(vec3(l), 1.); }',
}));
floor.rotation.x = -PI / 2; floor.position.y = -0.96; scene.add(floor);

const pos = new Float32Array(N * 3);
const scatter = () => { for (let i = 0; i < N; i++) { pos[i * 3] = Math.random(); pos[i * 3 + 1] = Math.random(); pos[i * 3 + 2] = Math.random(); } };
scatter();
const sandGeo = new THREE.BufferGeometry(); sandGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
const sand = new THREE.Points(sandGeo, new THREE.ShaderMaterial({
  uniforms: { ...U, size: { value: 1 } },
  vertexShader: WAVE + /* glsl */`
    uniform float size;
    void main() {
      vec2 uv = position.xz; float f = F(uv);
      float hop = abs(f) * abs(sin(ph * 1.7 + position.y * 40.)) * amp * .55;
      vec3 p = vec3(uv.x * 2. - 1., amp * .5 * f * sin(ph) + hop + .004, uv.y * 2. - 1.);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.); gl_PointSize = size;
    }`,
  fragmentShader: 'void main(){ gl_FragColor = vec4(1.); }',
}));
sand.frustumCulled = false; rig.add(sand);

// 1-bit pass
const rt = new THREE.WebGLRenderTarget(4, 4, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter });
const post = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
  uniforms: { map: { value: rt.texture }, fg: { value: rgb(PALETTES[0][0]) }, bg: { value: rgb(PALETTES[0][1]) }, res: { value: new THREE.Vector2(4, 4) } },
  vertexShader: 'void main(){ gl_Position = vec4(position.xy, 0., 1.); }',
  fragmentShader: /* glsl */`
    uniform sampler2D map; uniform vec3 fg, bg; uniform vec2 res;
    float b2(vec2 a) { a = floor(a); return fract(a.x / 2. + a.y * a.y * .75); }
    float b4(vec2 a) { return b2(.5 * a) * .25 + b2(a); }
    float b8(vec2 a) { return b4(.5 * a) * .25 + b2(a); }
    void main() {
      vec2 uv = gl_FragCoord.xy / res; float l = texture2D(map, uv).r;
      vec2 c = uv - .5; l *= 1. - .55 * dot(c, c);
      gl_FragColor = vec4(l > b8(gl_FragCoord.xy) + .004 ? fg : bg, 1.);
    }`,
  depthTest: false, depthWrite: false,
}));
const postScene = new THREE.Scene(); postScene.add(post);
const postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

function resize() {
  const s = clamp(Math.round(innerWidth / 640), 1, 3);
  const w = Math.ceil(innerWidth / s), h = Math.ceil(innerHeight / s);
  renderer.setSize(w, h, false); rt.setSize(w, h); post.material.uniforms.res.value.set(w, h);
  camera.aspect = w / h;
  const portrait = clamp((1.15 - camera.aspect) / 0.65, 0, 1);
  camera.fov = 30 + 22 * portrait; camera.updateProjectionMatrix();
  const hh = Math.atan(Math.tan((camera.fov * PI) / 360) * camera.aspect);
  const d = Math.max(5.1, 1.6 / Math.tan(hh)), el = 0.62 + 0.3 * portrait;
  camera.position.set(0, Math.sin(el) * d - 0.1, Math.cos(el) * d); camera.lookAt(0, -0.22 - 0.25 * portrait, 0);
  sand.material.uniforms.size.value = w > 900 ? 1.6 : 1;
}
addEventListener('resize', resize); resize();

// sand
function step(m, n, sg, k) {
  const J = 0.034 * k, G = 0.00042 * k, nP = n * PI, mP = m * PI;
  for (let i = 0; i < N; i++) {
    const a = i * 3; let x = pos[a], y = pos[a + 2];
    const cnx = Math.cos(nP * x), snx = Math.sin(nP * x), cmy = Math.cos(mP * y), smy = Math.sin(mP * y);
    const cmx = Math.cos(mP * x), smx = Math.sin(mP * x), cny = Math.cos(nP * y), sny = Math.sin(nP * y);
    const f = cnx * cmy + sg * cmx * cny, af = f < 0 ? -f : f;
    x += (Math.random() - 0.5) * J * af - f * (-nP * snx * cmy - sg * mP * smx * cny) * G;
    y += (Math.random() - 0.5) * J * af - f * (-mP * cnx * smy - sg * nP * cmx * sny) * G;
    if (x < 0) x = -x; else if (x > 1) x = 2 - x;
    if (y < 0) y = -y; else if (y > 1) y = 2 - y;
    pos[a] = x; pos[a + 2] = y;
  }
  sandGeo.attributes.position.needsUpdate = true;
}

// sound
let ac, osc, gain, sounding = false;
const hz = () => 30 + 11 * (S.m * S.m + S.n * S.n);
function sound(on) {
  if (!ac) {
    ac = new (window.AudioContext || window.webkitAudioContext)(); osc = ac.createOscillator(); gain = ac.createGain();
    osc.type = 'sine'; gain.gain.value = 0; osc.connect(gain).connect(ac.destination); osc.start();
  }
  ac.resume(); sounding = on; gain.gain.setTargetAtTime(on ? 0.07 : 0, ac.currentTime, 0.06);
}

// input
const $ = (id) => document.getElementById(id);
const fmt = (v) => (Math.abs(v - Math.round(v)) < 0.05 ? String(Math.round(v)) : v.toFixed(1));
const tune = (m, n) => { S.tm = clamp(m, LO, HI); S.tn = clamp(n, LO, HI); };
const flip = () => { S.sg = -S.sg; U.sg.value = S.sg; };
function ink() {
  S.ink = (S.ink + 1) % PALETTES.length; const [f, b] = PALETTES[S.ink];
  post.material.uniforms.fg.value.copy(rgb(f)); post.material.uniforms.bg.value.copy(rgb(b));
  const r = document.documentElement.style; r.setProperty('--fg', f); r.setProperty('--bg', b);
  document.querySelector('meta[name=theme-color]').content = b;
}
document.querySelectorAll('[data-m]').forEach((b) => (b.onclick = () => tune(+b.dataset.m, +b.dataset.n)));
$('snd').onclick = (e) => { sound(!sounding); e.currentTarget.setAttribute('aria-pressed', String(sounding)); };
$('sym').onclick = flip; $('sct').onclick = scatter; $('ink').onclick = ink;
let down = null; const look = { x: 0, y: 0, tx: 0, ty: 0 };
canvas.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY, m: S.tm, n: S.tn, moved: false }; canvas.setPointerCapture(e.pointerId); });
canvas.addEventListener('pointermove', (e) => {
  look.tx = (e.clientX / innerWidth) * 2 - 1; look.ty = (e.clientY / innerHeight) * 2 - 1;
  if (!down) return;
  const dx = e.clientX - down.x, dy = e.clientY - down.y;
  if (Math.abs(dx) + Math.abs(dy) > 6) down.moved = true;
  if (down.moved) tune(down.m + (dx / Math.min(innerWidth, 900)) * 9, down.n - (dy / Math.min(innerHeight, 700)) * 9);
});
canvas.addEventListener('pointerup', (e) => {
  if (!down) return;
  if (!down.moved) scatter(); else if (!e.shiftKey) tune(Math.round(S.tm), Math.round(S.tn));
  down = null;
});
addEventListener('keydown', (e) => {
  const k = e.key;
  if (k === 'ArrowRight') tune(Math.round(S.tm) + 1, S.tn); else if (k === 'ArrowLeft') tune(Math.round(S.tm) - 1, S.tn);
  else if (k === 'ArrowUp') tune(S.tm, Math.round(S.tn) + 1); else if (k === 'ArrowDown') tune(S.tm, Math.round(S.tn) - 1);
  else if (k === ' ') scatter(); else if (k === 's') $('snd').click(); else if (k === 'i') ink(); else if (k === 'f') flip();
  else if (k >= '1' && k <= '6') document.querySelectorAll('[data-m]')[+k - 1].click();
});

for (let i = 0, w = +q.get('warm') || 0; i < w; i++) step(S.m, S.n, S.sg, 1);
for (let i = 0, c = +q.get('ink') || 0; i < c; i++) ink();

let last = performance.now(), shown = '';
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000), t = now / 1000; last = now;
  const e = 1 - Math.exp(-dt * 7);
  S.m += (S.tm - S.m) * e; S.n += (S.tn - S.n) * e;
  U.m.value = S.m; U.n.value = S.n; U.ph.value = t * 9.5;
  step(S.m, S.n, S.sg, Math.min(2, dt * 60));
  if (osc && sounding) osc.frequency.setTargetAtTime(hz(), ac.currentTime, 0.04);
  const txt = `${fmt(S.m)} x ${fmt(S.n)}|${Math.round(hz())} Hz`;
  if (txt !== shown) { shown = txt; const [a, b] = txt.split('|'); $('mn').textContent = a; $('hz').textContent = b; }
  look.x += (look.tx - look.x) * (1 - Math.exp(-dt * 3)); look.y += (look.ty - look.y) * (1 - Math.exp(-dt * 3));
  rig.rotation.y = 0.5 + look.x * 0.32 + Math.sin(t * 0.21) * 0.06; rig.rotation.x = look.y * 0.08;
  renderer.setRenderTarget(rt); renderer.render(scene, camera);
  renderer.setRenderTarget(null); renderer.render(postScene, postCam);
  window.__ready = true;
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
