// Shared helpers for building the world out of simple shapes.
import * as THREE from "./vendor/three.module.min.js";
import { mergeGeometries } from "./vendor/BufferGeometryUtils.js";

export { THREE };
export const S = THREE.SRGBColorSpace;

let seed = 1337;
export const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
export const reseed = (s) => (seed = s);
export const range = (a, b) => a + (b - a) * rnd();
export const pick = (arr) => arr[Math.floor(rnd() * arr.length)];

const matCache = new Map();
// Standard material, cached by its options so identical looks share one material (and merge).
export function std(color, o = {}) {
  const key = color + JSON.stringify(o, (k, v) => (v && v.isTexture ? v.uuid : v));
  if (matCache.has(key)) return matCache.get(key);
  const m = new THREE.MeshStandardMaterial({ color, roughness: 0.75, metalness: 0.02, ...o });
  matCache.set(key, m);
  return m;
}
export const glow = (color, intensity = 1.6) => std(color, { emissive: color, emissiveIntensity: intensity, roughness: 0.5 });
export const basic = (color, o = {}) => {
  const key = "B" + color + JSON.stringify(o);
  if (matCache.has(key)) return matCache.get(key);
  const m = new THREE.MeshBasicMaterial({ color, ...o });
  matCache.set(key, m);
  return m;
};

export function mesh(geo, mat, x = 0, y = 0, z = 0, parent) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  if (parent) parent.add(m);
  return m;
}
export const box = (w, h, d, mat, x, y, z, p) => mesh(new THREE.BoxGeometry(w, h, d), mat, x, y, z, p);
export const cyl = (rt, rb, h, mat, x, y, z, p, seg = 16) => mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat, x, y, z, p);
export const sph = (r, mat, x, y, z, p, seg = 12) => mesh(new THREE.SphereGeometry(r, seg, Math.max(6, seg * 0.7 | 0)), mat, x, y, z, p);
export const group = (x = 0, y = 0, z = 0, parent, ry = 0) => {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.rotation.y = ry;
  if (parent) parent.add(g);
  return g;
};
export const V = (x, y, z) => new THREE.Vector3(x, y, z);

export function canvasTex(w, h, draw, repeat, opts = {}) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = opts.linear ? THREE.LinearSRGBColorSpace : S;
  t.anisotropy = 8;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
  return t;
}

// Scale a geometry's UVs so a texture tiles at `size` meters, using the box's real dimensions.
export function worldUV(geo, sx, sy, sz, size = 1) {
  const pos = geo.attributes.position, nor = geo.attributes.normal, uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) {
    const x = pos.getX(i) * sx, y = pos.getY(i) * sy, z = pos.getZ(i) * sz;
    const nx = Math.abs(nor.getX(i)), ny = Math.abs(nor.getY(i));
    let u, v;
    if (ny > 0.5) { u = x; v = z; } else if (nx > 0.5) { u = z; v = y; } else { u = x; v = y; }
    uv.setXY(i, u / size, v / size);
  }
  uv.needsUpdate = true;
  return geo;
}
// A box whose texture tiles in real meters.
export function tbox(w, h, d, mat, x, y, z, p, size = 1) {
  const g = new THREE.BoxGeometry(1, 1, 1);
  worldUV(g, w, h, d, size);
  const m = mesh(g, mat, x, y, z, p);
  m.scale.set(w, h, d);
  return m;
}

// Merge every static mesh under `root` into one mesh per material.
export function bake(root, keep = new Set()) {
  root.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(root.matrixWorld).invert();
  const buckets = new Map();
  const victims = [];
  const isKept = (o) => { for (let p = o; p && p !== root; p = p.parent) if (keep.has(p) || p.userData.keep) return true; return false; };
  root.traverse((o) => {
    if (!o.isMesh || o.isInstancedMesh || o.isSkinnedMesh || Array.isArray(o.material) || isKept(o)) return;
    if (o.material.isShaderMaterial) return;
    const m = o.material;
    let g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
    g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld));
    const n = g.attributes.position.count;
    if (!g.attributes.normal) g.computeVertexNormals();
    if (!g.attributes.uv) g.setAttribute("uv", new THREE.Float32BufferAttribute(new Float32Array(n * 2), 2));
    Object.keys(g.attributes).forEach((a) => { if (!["position", "normal", "uv"].includes(a)) g.deleteAttribute(a); });
    if (!buckets.has(m.uuid)) buckets.set(m.uuid, { mat: m, geos: [] });
    buckets.get(m.uuid).geos.push(g);
    victims.push(o);
  });
  victims.forEach((o) => o.parent && o.parent.remove(o));
  const out = new THREE.Group();
  out.name = "baked";
  buckets.forEach(({ mat, geos }) => {
    const merged = mergeGeometries(geos, false);
    if (merged) {
      const mm = new THREE.Mesh(merged, mat);
      mm.matrixAutoUpdate = false;
      out.add(mm);
    }
  });
  root.add(out);
  return out;
}

// Instance many copies of one geometry from a list of matrices.
export function instanced(geo, mat, mats) {
  const im = new THREE.InstancedMesh(geo, mat, mats.length);
  mats.forEach((m, i) => im.setMatrixAt(i, m));
  im.instanceMatrix.needsUpdate = true;
  return im;
}
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _v = new THREE.Vector3(), _s = new THREE.Vector3();
export function trs(x, y, z, ry = 0, sx = 1, sy = 1, sz = 1, rx = 0, rz = 0) {
  _e.set(rx, ry, rz);
  _q.setFromEuler(_e);
  return new THREE.Matrix4().compose(_v.set(x, y, z), _q, _s.set(sx, sy, sz));
}

// Glowing bulbs (Christmas lights, city lights) as one instanced mesh.
export function bulbs(points, color = 0xffd27a, r = 0.06, intensity = 3) {
  const geo = new THREE.SphereGeometry(r, 6, 5);
  const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), toneMapped: false });
  return instanced(geo, mat, points.map((p) => trs(p[0], p[1], p[2])));
}

// A curve sampled into points.
export function sampleCurve(fn, n) {
  const out = [];
  for (let i = 0; i <= n; i++) out.push(fn(i / n));
  return out;
}

// A soft round sprite texture (glows, smoke, snow, streetlights).
let _dot;
export function dotTex() {
  if (_dot) return _dot;
  _dot = canvasTex(64, 64, (g, w, h) => {
    const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    gr.addColorStop(0, "rgba(255,255,255,1)");
    gr.addColorStop(0.25, "rgba(255,255,255,.7)");
    gr.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = gr;
    g.fillRect(0, 0, w, h);
  });
  return _dot;
}
