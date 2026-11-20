# Building 3D worlds using Three.js

Slides and starter prompts for the Sundai 3D worlds hackathon.

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

## Links

- Docs: https://threejs.org/docs
- Examples: https://threejs.org/examples
- Manual: https://threejs.org/manual

Screenshots in `assets/` belong to their projects and are shown for reference.
