// Characters and small props: the drone, Shiqi, the cat, furniture pieces.
import { THREE, std, glow, basic, mesh, box, cyl, sph, group, V } from "./util.js";

export function makeDrone() {
  const d = new THREE.Group();
  const white = std(0xeeeae2, { roughness: 0.32, metalness: 0.05 });
  const dark = std(0x24282d, { roughness: 0.45 });
  const sage = std(0x5f9a80, { roughness: 0.35 });
  const brass = std(0xc9a35b, { metalness: 0.8, roughness: 0.28 });
  // shell: tapered body with a canopy
  const body = mesh(new THREE.CapsuleGeometry(0.16, 0.38, 6, 16), white, 0, 0, 0, d);
  body.rotation.x = Math.PI / 2; body.scale.set(1.25, 1, 0.62);
  const canopy = sph(0.17, sage, 0, 0.07, 0.02, d, 20);
  canopy.scale.set(1.05, 0.45, 1.5);
  box(0.36, 0.03, 0.06, dark, 0, 0.02, -0.33, d);
  const rotors = [];
  [[1, 1], [-1, 1], [1, -1], [-1, -1]].forEach(([sx, sz]) => {
    const arm = box(0.52, 0.045, 0.07, white, sx * 0.24, 0.02, sz * 0.24, d);
    arm.rotation.y = sx * sz > 0 ? -Math.PI / 4 : Math.PI / 4;
    cyl(0.055, 0.06, 0.09, dark, sx * 0.44, 0.06, sz * 0.44, d, 14);
    cyl(0.04, 0.04, 0.02, brass, sx * 0.44, 0.115, sz * 0.44, d, 12);
    // landing legs
    const leg = box(0.025, 0.2, 0.025, dark, sx * 0.4, -0.1, sz * 0.4, d);
    leg.rotation.z = sx * 0.2;
    const r = new THREE.Group();
    r.position.set(sx * 0.44, 0.13, sz * 0.44);
    const bladeMat = std(0x2f353b, { roughness: 0.3, transparent: true, opacity: 0.9 });
    const b1 = box(0.6, 0.008, 0.045, bladeMat, 0, 0, 0, r); b1.rotation.x = 0.12;
    const b2 = box(0.045, 0.008, 0.6, bladeMat, 0, 0, 0, r); b2.rotation.z = 0.12;
    const blur = mesh(new THREE.CircleGeometry(0.31, 32), new THREE.MeshBasicMaterial({ color: 0xc8d4dc, transparent: true, opacity: 0.12, depthWrite: false, side: THREE.DoubleSide }), 0, 0.002, 0, r);
    blur.rotation.x = -Math.PI / 2;
    const guard = mesh(new THREE.TorusGeometry(0.32, 0.01, 6, 40), brass, 0, 0, 0, r);
    guard.rotation.x = Math.PI / 2;
    d.add(r);
    rotors.push(r);
  });
  // gimbal camera
  const gimbal = group(0, -0.1, 0.27, d);
  box(0.05, 0.08, 0.04, dark, 0, 0.04, -0.03, gimbal);
  const cam = box(0.14, 0.1, 0.12, dark, 0, -0.02, 0, gimbal);
  const lens = cyl(0.035, 0.035, 0.03, std(0x0d0f12, { roughness: 0.05, metalness: 0.6 }), 0, -0.02, 0.07, gimbal, 16);
  lens.rotation.x = Math.PI / 2;
  sph(0.022, basic(0x6fb7ff), 0, -0.02, 0.085, gimbal, 10);
  const led = sph(0.022, new THREE.MeshBasicMaterial({ color: 0x7dffb4, toneMapped: false }), 0, 0.03, -0.38, d, 8);
  [[-0.14, 0.33], [0.14, 0.33]].forEach(([x, z]) => sph(0.018, new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffd38a).multiplyScalar(3), toneMapped: false }), x, 0.0, z, d, 8));
  [[-0.47, -0.47, 0xff3b3b], [0.47, -0.47, 0xff3b3b], [-0.47, 0.47, 0x3bff7a], [0.47, 0.47, 0x3bff7a]].forEach(([x, z, c]) => sph(0.016, new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(3), toneMapped: false }), x, 0.02, z, d, 6));
  const light = new THREE.PointLight(0xdff3ff, 0.8, 4, 2);
  light.position.set(0, -0.3, 0.4);
  d.add(light);
  d.userData = { rotors, led, gimbal, light };
  return d;
}

// A stylized Shiqi. Local forward is +Z, seat height y = 0.
export function makeShiqi({ hands = "desk" } = {}) {
  const g = new THREE.Group();
  const skin = std(0xf1d3be, { roughness: 0.55 });
  const hair = std(0x1e1512, { roughness: 0.42, metalness: 0.08 });
  const top = std(0xf1ebe0, { roughness: 0.92 });
  const knit = std(0x9cc7b2, { roughness: 0.95 });
  const skirt = std(0x34465c, { roughness: 0.8 });
  const cap = (r, l, mat, x, y, z, rx = 0, rz = 0) => { const m = mesh(new THREE.CapsuleGeometry(r, l, 6, 14), mat, x, y, z, g); m.rotation.set(rx, 0, rz); return m; };
  // legs
  [-0.1, 0.1].forEach((x) => {
    cap(0.078, 0.36, skirt, x, 0.06, 0.2, Math.PI / 2);
    cap(0.058, 0.36, skin, x, -0.22, 0.42);
    const shoe = sph(0.07, std(0x2a2522, { roughness: 0.4 }), x, -0.46, 0.47, g, 12); shoe.scale.set(0.9, 0.55, 1.6);
  });
  const skirtM = mesh(new THREE.CylinderGeometry(0.2, 0.26, 0.22, 20, 1, true), skirt, 0, 0.09, 0.06, g);
  skirtM.material.side = THREE.DoubleSide;
  cap(0.165, 0.3, knit, 0, 0.38, 0); // cardigan
  const collar = mesh(new THREE.TorusGeometry(0.075, 0.02, 6, 16), top, 0, 0.66, 0.02, g); collar.rotation.x = Math.PI / 2;
  sph(0.19, knit, 0, 0.57, 0, g, 18).scale.set(1.28, 0.66, 0.92);
  cap(0.05, 0.06, skin, 0, 0.72, 0);
  const head = sph(0.152, skin, 0, 0.9, 0.01, g, 28);
  head.scale.set(0.98, 1.08, 1);
  // hair: crown, long back, side strands, bangs, a claw clip
  sph(0.165, hair, 0, 0.915, -0.008, g, 28).scale.set(1.04, 1.1, 1.06);
  const back = cap(0.13, 0.36, hair, 0, 0.64, -0.075); back.scale.set(1.1, 1, 0.45);
  [-1, 1].forEach((sx) => { const s = cap(0.045, 0.34, hair, sx * 0.135, 0.71, 0.04); s.rotation.z = sx * 0.07; });
  const bangs = mesh(new THREE.SphereGeometry(0.16, 24, 10, 0, Math.PI * 2, 0, Math.PI * 0.36), hair, 0, 0.945, 0.035, g);
  bangs.rotation.x = 0.6; bangs.scale.set(1.02, 0.9, 1);
  box(0.12, 0.04, 0.04, std(0xc9a35b, { metalness: 0.7, roughness: 0.3 }), 0, 0.98, -0.16, g);
  // face
  const ink = basic(0x1c1512);
  [-0.052, 0.052].forEach((x) => { const e = sph(0.017, ink, x, 0.895, 0.142, g, 10); e.scale.set(1, 1.25, 0.6); sph(0.005, basic(0xffffff), x + 0.006, 0.9, 0.152, g, 6); });
  const blush = new THREE.MeshBasicMaterial({ color: 0xf2a99a, transparent: true, opacity: 0.5 });
  [-0.088, 0.088].forEach((x) => { const b = mesh(new THREE.CircleGeometry(0.024, 14), blush, x, 0.86, 0.138, g); b.rotation.y = x > 0 ? 0.45 : -0.45; });
  const smile = mesh(new THREE.TorusGeometry(0.024, 0.005, 6, 14, Math.PI), basic(0x8a3b3b), 0, 0.85, 0.148, g);
  smile.rotation.z = Math.PI;
  // gold earrings
  [-0.15, 0.15].forEach((x) => sph(0.012, std(0xd9b46a, { metalness: 0.9, roughness: 0.2 }), x, 0.86, 0.02, g, 8));
  // arms
  [-1, 1].forEach((sx) => {
    const upper = mesh(new THREE.CapsuleGeometry(0.056, 0.26, 6, 12), knit, sx * 0.24, 0.47, 0.06, g);
    upper.rotation.set(0.45, 0, sx * 0.12);
    const fore = mesh(new THREE.CapsuleGeometry(0.047, 0.24, 6, 12), knit, sx * 0.17, 0.32, 0.25, g);
    fore.rotation.set(hands === "lap" ? 1.35 : 1.45, 0, -sx * 0.5);
    sph(0.044, skin, sx * 0.1, hands === "lap" ? 0.27 : 0.3, 0.38, g, 12);
  });
  g.userData = { head };
  return g;
}

// A curled-up sleeping cat (breathes)
export function makeCat() {
  const g = new THREE.Group();
  const fur = std(0xd9cbb5, { roughness: 0.95 });
  const dark = std(0x8a7a66, { roughness: 0.95 });
  const body = sph(0.22, fur, 0, 0.13, 0, g, 18); body.scale.set(1.3, 0.62, 1);
  const head = sph(0.11, fur, 0.2, 0.15, 0.12, g, 16);
  [[-0.05], [0.05]].forEach(([z]) => { const ear = mesh(new THREE.ConeGeometry(0.035, 0.07, 4), dark, 0.22, 0.25, 0.12 + z, g); ear.rotation.z = -0.3; });
  const tail = mesh(new THREE.TorusGeometry(0.2, 0.035, 6, 20, Math.PI * 1.2), dark, 0, 0.07, 0, g);
  tail.rotation.x = Math.PI / 2;
  g.userData = { body };
  return g;
}

// A leather Chesterfield armchair
export function chesterfield(mat, parent, x, y, z, ry = 0, w = 1.1) {
  const g = group(x, y, z, parent, ry);
  box(w, 0.42, 0.95, mat, 0, 0.25, 0, g);
  box(w * 0.9, 0.16, 0.8, mat, 0, 0.53, 0.05, g);
  box(w, 0.75, 0.24, mat, 0, 0.62, -0.38, g);
  [-1, 1].forEach((s) => { const a = cyl(0.17, 0.17, 0.95, mat, s * (w / 2 - 0.05), 0.62, 0, g, 14); a.rotation.x = Math.PI / 2; box(0.22, 0.32, 0.95, mat, s * (w / 2 - 0.05), 0.42, 0, g); });
  for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) sph(0.016, std(0x2a1a12), -w * 0.33 + i * w * 0.22, 0.75 + j * 0.18, -0.255, g, 6);
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => cyl(0.03, 0.025, 0.08, std(0x2a1a12), sx * (w / 2 - 0.1), 0.04, sz * 0.38, g, 8));
  return g;
}

// A dining/desk chair (tufted back)
export function chair(mat, wood, parent, x, y, z, ry = 0) {
  const g = group(x, y, z, parent, ry);
  box(0.52, 0.09, 0.5, mat, 0, 0.5, 0, g);
  box(0.5, 0.62, 0.07, mat, 0, 0.88, -0.23, g);
  [[-0.22, -0.21], [0.22, -0.21], [-0.22, 0.21], [0.22, 0.21]].forEach(([px, pz]) => box(0.05, 0.48, 0.05, wood, px, 0.24, pz, g));
  return g;
}

// A potted plant (monstera-ish leaves or a fern)
export function plant(parent, x, y, z, s = 1, potColor = 0xf0ece4) {
  const g = group(x, y, z, parent);
  cyl(0.28 * s, 0.22 * s, 0.5 * s, std(potColor, { roughness: 0.6 }), 0, 0.25 * s, 0, g, 16);
  cyl(0.26 * s, 0.26 * s, 0.02, std(0x3a2a1e), 0, 0.5 * s, 0, g, 16);
  const leaf = std(0x3f6b45, { roughness: 0.7, side: THREE.DoubleSide });
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2, r = 0.2 * s;
    const l = mesh(new THREE.CircleGeometry(0.22 * s, 10), leaf, Math.cos(a) * r, (0.9 + (i % 3) * 0.22) * s, Math.sin(a) * r, g);
    l.rotation.set(-0.9 + (i % 2) * 0.3, -a + Math.PI / 2, 0.3);
    l.scale.set(0.8, 1.2, 1);
    const stem = cyl(0.008 * s, 0.008 * s, 0.6 * s, std(0x4a6b3a), Math.cos(a) * r * 0.5, 0.75 * s, Math.sin(a) * r * 0.5, g, 4);
    stem.rotation.z = Math.cos(a) * 0.4; stem.rotation.x = Math.sin(a) * 0.4;
  }
  return g;
}

// A table lamp with a glowing shade
export function tableLamp(parent, x, y, z, s = 1, shadeColor = 0xf6efe0) {
  const g = group(x, y, z, parent);
  cyl(0.08 * s, 0.11 * s, 0.05 * s, std(0xc9a35b, { metalness: 0.8, roughness: 0.3 }), 0, 0.025 * s, 0, g, 16);
  cyl(0.018 * s, 0.018 * s, 0.38 * s, std(0xc9a35b, { metalness: 0.8, roughness: 0.3 }), 0, 0.22 * s, 0, g, 8);
  cyl(0.12 * s, 0.2 * s, 0.22 * s, std(shadeColor, { emissive: 0xffd9a0, emissiveIntensity: 0.9, side: THREE.DoubleSide, roughness: 0.9 }), 0, 0.48 * s, 0, g, 20).geometry = new THREE.CylinderGeometry(0.12 * s, 0.2 * s, 0.22 * s, 20, 1, true);
  return g;
}

// Books on a shelf, as instanced boxes
export function bookRow(parent, x0, x1, y, z, depth, axis = "x", rng = Math.random) {
  const colors = [0x2f4f6b, 0x8a3b3b, 0x3c6b4c, 0xc9a35b, 0x5a4a6b, 0xd9cfbd, 0x6b5136, 0x9cb8c9, 0x2b2f38, 0xa7633b];
  let p = x0;
  while (p < x1 - 0.06) {
    const w = 0.035 + rng() * 0.06, h = 0.22 + rng() * 0.14;
    const lean = rng() < 0.06 ? 0.25 : 0;
    const m = std(colors[Math.floor(rng() * colors.length)], { roughness: 0.8 });
    const b = axis === "x" ? box(w, h, depth * (0.8 + rng() * 0.2), m, p + w / 2, y + h / 2, z, parent) : box(depth * (0.8 + rng() * 0.2), h, w, m, x0 === x0 ? z : z, y + h / 2, p + w / 2, parent);
    if (lean) b.rotation[axis === "x" ? "z" : "x"] = lean;
    p += w + 0.004 + (lean ? 0.05 : 0);
    if (rng() < 0.04) p += 0.12;
  }
}
