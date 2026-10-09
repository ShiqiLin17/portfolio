// CAD lab: an interactive viewer for STL models exported from Fusion 360.
// To add or change a model, edit the list below and put the .stl file in /cad.
import * as THREE from "./vendor/three.module.min.js";
import { STLLoader } from "./vendor/STLLoader.js";
import { OrbitControls } from "./vendor/OrbitControls.js";

const MODELS = [
  {
    file: "cad/walter.stl",
    name: "Autonomous waiter robot",
    meta: "2023 · Mechatronics, Midwood High School",
    text: "A food-service robot designed to carry orders to assigned tables. I built the wheel assembly to actually work: 2 mm of clearance between the body, axle and wheel lets each wheel spin freely. Delivered with a dimensioned technical drawing.",
    tags: ["Assembly", "Mechanism design", "Technical drawing"],
    color: 0x8fd3bd,
  },
  {
    file: "cad/gear.stl",
    name: "Spur gear",
    meta: "2023 · Fusion 360",
    text: "A parametric gear modeled from a tooth profile, patterned around a hub with a center bore.",
    tags: ["Parametric", "Circular pattern"],
    color: 0xf2b8cc,
  },
  {
    file: "cad/support-fixture.stl",
    name: "Support fixture",
    meta: "2023 · Fusion 360",
    text: "A mounting fixture designed for holding and supporting a part during assembly.",
    tags: ["Fixture design", "Extrude & fillet"],
    color: 0xa9c4f2,
  },
  {
    file: "cad/t-spline.stl",
    name: "T-spline form",
    meta: "2023 · Fusion 360",
    text: "An organic shape sculpted with T-spline surface modeling rather than sketches and extrudes.",
    tags: ["Surface modeling", "T-splines"],
    color: 0xc9b4f2,
  },
  {
    file: "cad/hole-features.stl",
    name: "Hole features study",
    meta: "2023 · Fusion 360",
    text: "Practice part covering counterbore, countersink and threaded hole features.",
    tags: ["Hole features", "Part modeling"],
    color: 0xf6d77f,
  },
];

const canvas = document.getElementById("cad-canvas");
const status = document.getElementById("cad-status");
const list = document.getElementById("cad-list");
const info = document.getElementById("cad-info");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
} catch (e) {
  status.textContent = "Your browser can't show 3D here.";
  throw e;
}
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(35, 1, 0.01, 100);
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.autoRotate = !reduceMotion;
controls.autoRotateSpeed = 1.6;
controls.enablePan = false;

scene.add(new THREE.HemisphereLight(0xffffff, 0x3a4a40, 1.5));
const key = new THREE.DirectionalLight(0xffffff, 2.4);
key.position.set(3, 5, 4);
scene.add(key);
const fill = new THREE.DirectionalLight(0xffd8b8, 0.9);
fill.position.set(-4, 2, -3);
scene.add(fill);

const grid = new THREE.GridHelper(4, 20, 0xffffff, 0xe4f5ee);
grid.material.transparent = true;
grid.material.opacity = 0.35;
grid.visible = false;
scene.add(grid);

const loader = new STLLoader();
const cache = new Map();
let mesh = null;
let edges = null;
let wire = false;
let current = 0;

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

MODELS.forEach((m, i) => {
  const b = document.createElement("button");
  b.type = "button";
  b.role = "tab";
  b.textContent = m.name;
  b.addEventListener("click", () => show(i));
  list.appendChild(b);
});

function frame() {
  if (!mesh) return;
  // Fit the camera to the model.
  const box = new THREE.Box3().setFromObject(mesh);
  const size = box.getSize(new THREE.Vector3()).length();
  camera.position.set(1.4, 1.0, 1.6).multiplyScalar(size * 0.9);
  camera.near = size / 100;
  camera.far = size * 20;
  camera.updateProjectionMatrix();
  controls.target.set(0, box.getSize(new THREE.Vector3()).y * 0.45, 0);
  controls.update();
}

function place(geometry, color) {
  if (mesh) scene.remove(mesh);
  if (edges) scene.remove(edges);
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  // Normalize: centre on the grid and scale to about 2 units.
  const bb = geometry.boundingBox;
  const size = bb.getSize(new THREE.Vector3());
  const scale = 2 / Math.max(size.x, size.y, size.z);
  mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color, roughness: 0.45, metalness: 0.15, wireframe: wire }));
  // Fusion exports Z-up; rotate to Y-up.
  mesh.rotation.x = -Math.PI / 2;
  mesh.scale.setScalar(scale);
  const c = bb.getCenter(new THREE.Vector3());
  mesh.position.set(-c.x * scale, c.z * scale * 0, c.y * scale);
  scene.add(mesh);
  grid.visible = true;
  mesh.updateMatrixWorld();
  const box = new THREE.Box3().setFromObject(mesh);
  mesh.position.y -= box.min.y;
  mesh.position.x -= (box.min.x + box.max.x) / 2;
  mesh.position.z -= (box.min.z + box.max.z) / 2;
  frame();
}

function show(i) {
  current = i;
  const m = MODELS[i];
  [...list.children].forEach((b, j) => b.setAttribute("aria-selected", String(j === i)));
  info.innerHTML = `<p class="when">${esc(m.meta)}</p><h3>${esc(m.name)}</h3><p>${esc(m.text)}</p><ul class="tags">${m.tags.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>`;
  status.textContent = "Loading model";
  status.hidden = false;
  const done = (g) => { if (current === i) { place(g, m.color); status.hidden = true; } };
  if (cache.has(m.file)) return done(cache.get(m.file));
  loader.load(
    m.file,
    (g) => { cache.set(m.file, g); done(g); },
    undefined,
    () => { if (current === i) { status.textContent = "3D model coming soon"; if (mesh) { scene.remove(mesh); mesh = null; } grid.visible = false; } }
  );
}

document.getElementById("cad-spin").addEventListener("click", (e) => {
  controls.autoRotate = !controls.autoRotate;
  e.currentTarget.setAttribute("aria-pressed", String(controls.autoRotate));
});
document.getElementById("cad-wire").addEventListener("click", (e) => {
  wire = !wire;
  if (mesh) mesh.material.wireframe = wire;
  e.currentTarget.setAttribute("aria-pressed", String(wire));
});
document.getElementById("cad-reset").addEventListener("click", frame);
canvas.addEventListener("pointerdown", () => {
  controls.autoRotate = false;
  document.getElementById("cad-spin").setAttribute("aria-pressed", "false");
});

function resize() {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  if (!w || !h) return;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(canvas);

let visible = false;
new IntersectionObserver(([e]) => {
  visible = e.isIntersecting;
  if (visible && !mesh && status.textContent === "Loading model" && !cache.size) show(0);
}).observe(canvas);

(function loop() {
  requestAnimationFrame(loop);
  if (!visible) return;
  controls.update();
  renderer.render(scene, camera);
})();
