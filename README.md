# Building 3D worlds using Three.js

Slides and starter prompts for the Sundai 3D worlds hackathon.

**[Getting started guide](http://hunt3r.org/start/)**: setup, a system prompt for your coding agent, examples, ship steps. Source: [start/index.html](start/index.html). Live demos: [hunt3r.org/demos](http://hunt3r.org/demos/).

- [threejs-hackathon.pdf](threejs-hackathon.pdf): the deck
- [threejs-hackathon.pptx](threejs-hackathon.pptx): same deck for Keynote and PowerPoint
- [deck.html](deck.html): source, open in a browser

## Start in one minute

```bash
npm create vite@latest my-world -- --template vanilla
cd my-world && npm i three && npm run dev
```

Replace `main.js` with:

```js
import * as THREE from 'three';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 100);
camera.position.z = 3;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

const cube = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshNormalMaterial());
scene.add(cube);

renderer.setAnimationLoop((t) => {
  cube.rotation.y = t / 1000;
  renderer.render(scene, camera);
});
```

## Prompts to build from

Paste one into Claude, Cursor or any coding agent.

**Drivable world** (see [bruno-simon.com](https://bruno-simon.com))
> Build a Three.js scene with a low-poly car on a flat plane. WASD drives it, cannon-es for physics, camera follows from above at 45°. Black ground, white objects.

**Tiny planet** (see [messenger.abeto.co](https://messenger.abeto.co))
> Make a small sphere planet in Three.js. A character walks on its surface with gravity toward the center. Camera orbits behind. Add toon shading and soft fog.

**Particle galaxy** (see [webgpu_tsl_galaxy](https://threejs.org/examples/#webgpu_tsl_galaxy))
> Build a spiral galaxy of 50,000 particles in Three.js with a ShaderMaterial. Three arms, hot pink core fading to violet at the edges, slow rotation, additive blending, OrbitControls.

**Data globe** (see [globe.gl](https://globe.gl))
> Render a wireframe globe in Three.js. Load a JSON of cities with lat and lon, draw them as points, connect pairs with animated arcs. OrbitControls with damping.

**Pop-up book portfolio** (live: [hunt3r.org/demos/popup](http://hunt3r.org/demos/popup/), built by Fable 5.2)
> Three.js portfolio as a pop-up book. One app per spread, cut-paper layers stand up as the page turns. Two-ink risograph print, halftone, soft shadows. Drag to turn, tap an icon to open it.

**Chladni plate** (live: [hunt3r.org/demos/chladni](http://hunt3r.org/demos/chladni/), built by Fable 5.2)
> Chladni plate in Three.js. 46,000 sand grains jitter by local plate amplitude and settle on the nodal lines. Drag to tune the mode, play the tone. Low-res render, 1-bit Bayer dither.

## More prompts

| Idea | Prompt |
|---|---|
| Portfolio | Build a Three.js portfolio for my [work]. Each project is a floating object in a dark room. Click flies the camera to it and opens details. |
| Game | Make a Three.js endless runner. Low poly road, WASD to dodge, score in the corner, speed rises every 10 s. One file. |
| Music | Audio-reactive scene: load an mp3, use AnalyserNode, bass scales a sphere, highs spawn particles. Bloom on. |
| Webcam | Use the webcam as a texture on a plane. Add datamosh and RGB split that spike when motion is detected. |
| Product | Show my GLB product on a turntable. Studio lighting, orbit controls, color swatches that swap the material. |
| Data | Plot this CSV as 3D bars on a grid. Hover shows the value. Camera eases to the tallest bar on load. |
| Multiplayer | Shared room with Three.js + WebSockets. Each visitor is a glowing cube that moves with the arrow keys. |
| Shader | Full-screen fragment shader of flowing ink. Mouse pushes the fluid. Black and white, film grain. |

## Looks to ask for

- Shaders: bloom, toon, matcap, glass, noise, ocean, sky, volume clouds, caustics, god rays
- Styles: diorama, pixel art, voxel, PS1 retro, halftone, ASCII, wireframe, line art, low poly, tilt shift
- FX: datamosh, glitch, chromatic aberration, blob tracking, pixel sort, feedback, CRT, 1-bit dither, slit scan, VHS

FX previews in `assets/fx/` are made by `scripts/fx.py` from a frame.

## Vision loop: photo to Three.js

`loop/scene.html?obj=apple|duck|ball&v=1..5` rebuilds three reference photos (`assets/loop/`, Wikimedia Commons: CC0, CC BY-SA 4.0, CC BY 4.0). Render one to PNG:

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --use-angle=swiftshader \
  --enable-unsafe-swiftshader --allow-file-access-from-files --virtual-time-budget=15000 \
  --window-size=800,600 --screenshot=out.png "file://$PWD/loop/scene.html?obj=duck&v=5"
```

> Recreate photo.jpg in Three.js. Screenshot your render, compare it side by side with the photo, score realism 0-10, fix the top 3 gaps. Loop until 7.0+. Never grade without viewing both images.

Scores v1 to v5: apple 3.0 to 6.0, duck 3.5 to 6.5, ball 2.0 to 7.2.

## Links

- Docs: https://threejs.org/docs
- Examples: https://threejs.org/examples
- Manual: https://threejs.org/manual

Screenshots in `assets/` belong to their projects and are shown for reference.
