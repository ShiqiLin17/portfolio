// A small robot controller board, built from simple shapes, that turns as you scroll.
// Each part lifts and glows when its step in the story is showing.
import * as THREE from "./vendor/three.module.min.js";

const canvas = document.getElementById("board");
const story = document.getElementById("build");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
} catch (e) {
  story.classList.add("story-fallback");
  throw e;
}
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
camera.position.set(0, 7.5, 12);
camera.lookAt(0, 0, 0);

scene.add(new THREE.HemisphereLight(0xffffff, 0x334433, 1.6));
const key = new THREE.DirectionalLight(0xffffff, 2.2);
key.position.set(5, 10, 6);
scene.add(key);
const rim = new THREE.DirectionalLight(0xffd2a8, 1.2);
rim.position.set(-6, 4, -6);
scene.add(rim);

const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.1, ...extra });
const copper = mat(0xc77a3a, { metalness: 0.7, roughness: 0.35 });
const box = (w, h, d, m) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
const cyl = (rt, rb, h, m, seg = 32) => new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m);

const root = new THREE.Group();
scene.add(root);

/* PCB */
const pcb = box(6.4, 0.16, 4.2, mat(0x1f6b4c, { roughness: 0.4 }));
root.add(pcb);
// Copper traces on the top surface
const traceRuns = [
  [[-2.6, -1.6], [-0.8, -1.6], [-0.8, -0.5]],
  [[-2.6, 1.6], [-1.6, 1.6], [-1.6, 0.6], [-0.8, 0.6]],
  [[0.8, 0.2], [1.8, 0.2], [1.8, -1.2], [2.4, -1.2]],
  [[0.8, -0.3], [1.3, -0.3], [1.3, 1.4], [2.2, 1.4]],
  [[-0.2, 0.9], [-0.2, 1.7], [0.9, 1.7]],
];
traceRuns.forEach((run) => {
  for (let i = 0; i < run.length - 1; i++) {
    const [x1, z1] = run[i];
    const [x2, z2] = run[i + 1];
    const len = Math.hypot(x2 - x1, z2 - z1);
    const t = box(len + 0.08, 0.02, 0.08, copper);
    t.position.set((x1 + x2) / 2, 0.09, (z1 + z2) / 2);
    t.rotation.y = -Math.atan2(z2 - z1, x2 - x1);
    root.add(t);
  }
  const [vx, vz] = run[0];
  const via = cyl(0.11, 0.11, 0.03, copper, 20);
  via.position.set(vx, 0.095, vz);
  root.add(via);
});
// Mounting holes
[[-2.95, -1.85], [2.95, -1.85], [-2.95, 1.85], [2.95, 1.85]].forEach(([x, z]) => {
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.05, 10, 24), copper);
  ring.rotation.x = Math.PI / 2;
  ring.position.set(x, 0.09, z);
  root.add(ring);
});
// Header pins along the back edge
const pinMat = mat(0xd9b46a, { metalness: 0.9, roughness: 0.3 });
const headerBase = box(4.2, 0.22, 0.28, mat(0x111111));
headerBase.position.set(-0.4, 0.19, -1.85);
root.add(headerBase);
for (let i = 0; i < 16; i++) {
  const pin = box(0.06, 0.5, 0.06, pinMat);
  pin.position.set(-2.3 + i * 0.254, 0.42, -1.85);
  root.add(pin);
}
// Status LED that blinks
const ledMat = mat(0x2fbf71, { emissive: 0x2fbf71, emissiveIntensity: 1.2 });
const led = box(0.2, 0.1, 0.12, ledMat);
led.position.set(-2.5, 0.13, 0.4);
root.add(led);

/* Part 1: the brain (microcontroller) */
const brain = new THREE.Group();
const chipMat = mat(0x1b1b1d, { roughness: 0.3, emissive: 0xc77a3a, emissiveIntensity: 0 });
const chip = box(1.5, 0.22, 1.5, chipMat);
brain.add(chip);
const legMat = mat(0xbfc3c7, { metalness: 0.9, roughness: 0.3 });
for (let i = 0; i < 8; i++) {
  const o = -0.6 + i * 0.17;
  [[o, 0.82, 0], [o, -0.82, 0], [0.82, o, Math.PI / 2], [-0.82, o, Math.PI / 2]].forEach(([a, b, r]) => {
    const leg = box(0.07, 0.05, 0.22, legMat);
    leg.position.set(r ? a : a, -0.07, r ? b : b);
    if (r) { leg.position.set(a, -0.07, b); leg.rotation.y = r; } else { leg.position.set(a, -0.07, b); }
    brain.add(leg);
  });
}
const dot = cyl(0.07, 0.07, 0.01, mat(0x444444), 16);
dot.position.set(-0.5, 0.115, -0.5);
brain.add(dot);
brain.position.set(0, 0.2, 0.15);
root.add(brain);

/* Part 2: the eyes (camera module) */
const eyes = new THREE.Group();
const camPcbMat = mat(0x16324a, { emissive: 0xc77a3a, emissiveIntensity: 0 });
eyes.add(box(1.3, 0.1, 1.3, camPcbMat));
const housing = box(0.8, 0.45, 0.8, mat(0x222326));
housing.position.y = 0.27;
eyes.add(housing);
const lens = cyl(0.3, 0.33, 0.35, mat(0x0d0d10, { roughness: 0.15, metalness: 0.4 }));
lens.position.y = 0.66;
eyes.add(lens);
const glass = cyl(0.22, 0.22, 0.02, mat(0x3a6aff, { roughness: 0.05, metalness: 0.6, emissive: 0x1a2a66, emissiveIntensity: 0.5 }));
glass.position.y = 0.84;
eyes.add(glass);
eyes.position.set(1.9, 0.13, 1.0);
root.add(eyes);

/* Part 3: the muscle (servo) */
const muscle = new THREE.Group();
const servoMat = mat(0x2e4fa3, { emissive: 0xc77a3a, emissiveIntensity: 0 });
const servoBody = box(1.6, 0.9, 0.8, servoMat);
servoBody.position.y = 0.45;
muscle.add(servoBody);
const tabs = box(2.2, 0.08, 0.8, servoMat);
tabs.position.y = 0.7;
muscle.add(tabs);
const hornGroup = new THREE.Group();
hornGroup.position.set(0.4, 0.95, 0);
const hornHub = cyl(0.2, 0.2, 0.14, mat(0xf2f2f2));
hornGroup.add(hornHub);
const hornArm = box(1.2, 0.07, 0.18, mat(0xf2f2f2));
hornArm.position.set(0.35, 0.05, 0);
hornGroup.add(hornArm);
muscle.add(hornGroup);
muscle.position.set(1.9, 0.08, -0.85);
root.add(muscle);

/* Part 4: the shell (enclosure halves, an exploded CAD view) */
const shell = new THREE.Group();
const shellMat = new THREE.MeshStandardMaterial({ color: 0xdfe6e1, transparent: true, opacity: 0, roughness: 0.2, metalness: 0, depthWrite: false });
const edgeMat = new THREE.LineBasicMaterial({ color: 0xc77a3a, transparent: true, opacity: 0 });
function shellHalf(y) {
  const g = new THREE.Group();
  const geo = new THREE.BoxGeometry(7, 0.9, 4.8);
  g.add(new THREE.Mesh(geo, shellMat));
  g.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo), edgeMat));
  g.position.y = y;
  return g;
}
const lid = shellHalf(4);
const base = shellHalf(-4);
shell.add(lid, base);
root.add(shell);

const parts = [null, brain, eyes, muscle];
const glowMats = [null, chipMat, camPcbMat, servoMat];
const restY = [0, brain.position.y, eyes.position.y, muscle.position.y];

/* Camera poses per step: [rotY, rotX tilt, zoom distance] */
const poses = [
  [-0.6, 0.0, 17],
  [0.15, 0.35, 16.5],
  [-1.25, 0.05, 14.5],
  [-2.45, 0.1, 14.5],
  [-3.75, -0.05, 17.5],
];

function themeColors() {
  const dark = document.documentElement.dataset.theme === "dark" ||
    (!document.documentElement.dataset.theme && window.matchMedia("(prefers-color-scheme: dark)").matches);
  scene.fog = null;
  edgeMat.color.set(dark ? 0xe0955a : 0xa85f27);
}
themeColors();
document.addEventListener("themechange", themeColors);

function resize() {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (!w || !h) return;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  // Pull back on narrow screens so the board fits.
  camera.userData.narrow = w / h < 1 ? 1.35 : 1;
  camera.updateProjectionMatrix();
}
window.addEventListener("resize", resize);
resize();

let mx = 0, my = 0;
window.addEventListener("pointermove", (e) => {
  mx = e.clientX / window.innerWidth - 0.5;
  my = e.clientY / window.innerHeight - 0.5;
});

const ease = (t) => t * t * (3 - 2 * t);
const lerp = (a, b, t) => a + (b - a) * t;
let smooth = 0;
let visible = true;
new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(story);

const clock = new THREE.Clock();
function frame() {
  requestAnimationFrame(frame);
  if (!visible) return;
  const t = clock.getElapsedTime();
  const target = window.storyProgress || 0;
  smooth += (target - smooth) * (reduceMotion ? 1 : 0.08);

  // Blend between poses
  const f = Math.min(poses.length - 1.0001, smooth * poses.length - 0.5);
  const i = Math.max(0, Math.floor(f));
  const k = ease(Math.max(0, Math.min(1, f - i)));
  const a = poses[i], b = poses[Math.min(i + 1, poses.length - 1)];
  root.rotation.y = lerp(a[0], b[0], k) + mx * 0.25;
  root.rotation.x = lerp(a[1], b[1], k) + my * 0.12;
  const dist = lerp(a[2], b[2], k) * (camera.userData.narrow || 1);
  camera.position.set(0, dist * 0.55, dist * 0.85);
  camera.lookAt(0, 0.3, 0);

  const active = Math.min(4, Math.floor(target * 5));
  for (let p = 1; p <= 3; p++) {
    const on = active === p;
    const g = parts[p];
    g.position.y += ((restY[p] + (on ? 0.7 : 0)) - g.position.y) * 0.1;
    const m = glowMats[p];
    m.emissiveIntensity += ((on ? 0.35 + Math.sin(t * 4) * 0.15 : 0) - m.emissiveIntensity) * 0.15;
  }
  // Servo horn sweeps when the muscle step is on, idles otherwise.
  const sweep = active === 3 ? Math.sin(t * 2.4) * 1.2 : Math.sin(t * 0.6) * 0.15;
  hornGroup.rotation.y += (sweep - hornGroup.rotation.y) * 0.15;

  // Shell assembles during the last step.
  const shellT = ease(Math.max(0, Math.min(1, (smooth - 0.78) / 0.18)));
  lid.position.y = lerp(4, 0.75, shellT);
  base.position.y = lerp(-4, -0.25, shellT);
  shellMat.opacity = shellT * 0.18;
  edgeMat.opacity = shellT;

  ledMat.emissiveIntensity = reduceMotion ? 1 : (Math.sin(t * 3) > 0 ? 1.6 : 0.2);
  renderer.render(scene, camera);
}
frame();
