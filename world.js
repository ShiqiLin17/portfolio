// The 3D world: a Forest Hills / Dyker Heights style mansion (foyer, grand stair,
// study, bedroom), a Queens neighborhood, Central Park and Billionaires' Row,
// a drone, and a stylized Shiqi. Everything is built from simple shapes so it
// loads fast and needs no model files.
import * as THREE from "./vendor/three.module.min.js";
import { mergeGeometries } from "./vendor/BufferGeometryUtils.js";

const S = THREE.SRGBColorSpace;

// ---------- small helpers ----------
const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.75, metalness: 0.02, ...o });
function mesh(geo, mat, x = 0, y = 0, z = 0, parent) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  if (parent) parent.add(m);
  return m;
}
const box = (w, h, d, mat, x, y, z, parent) => mesh(new THREE.BoxGeometry(w, h, d), mat, x, y, z, parent);
function canvasTex(w, h, draw, repeat) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = S;
  t.anisotropy = 4;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
  return t;
}
let seed = 11;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

// Wall along X (at z) or along Z (at x) with rectangular openings.
// holes: [{a0, a1, y0, y1}] in wall-local coords (a = x or z).
function wall({ axis = "x", at, a0, a1, y0, y1, t = 0.3, holes = [], matOut, matIn, outward = 1, parent }) {
  const cuts = new Set([a0, a1]);
  holes.forEach((h) => { cuts.add(h.a0); cuts.add(h.a1); });
  const xs = [...cuts].sort((p, q) => p - q);
  for (let i = 0; i < xs.length - 1; i++) {
    const s0 = xs[i], s1 = xs[i + 1];
    if (s1 - s0 < 1e-3) continue;
    const mid = (s0 + s1) / 2;
    const cover = holes.filter((h) => h.a0 <= mid && h.a1 >= mid).sort((p, q) => p.y0 - q.y0);
    let y = y0;
    const spans = [];
    cover.forEach((h) => { if (h.y0 > y) spans.push([y, h.y0]); y = Math.max(y, h.y1); });
    if (y < y1) spans.push([y, y1]);
    spans.forEach(([b, top]) => {
      const len = s1 - s0, hgt = top - b;
      if (axis === "x") {
        box(len, hgt, t, matIn, mid, b + hgt / 2, at, parent);
        if (matOut !== matIn) {
          const skin = mesh(new THREE.PlaneGeometry(len, hgt), matOut, mid, b + hgt / 2, at + outward * (t / 2 + 0.005), parent);
          if (outward < 0) skin.rotation.y = Math.PI;
          skin.geometry.attributes.uv.array.forEach((v, i, a) => (a[i] = v * (i % 2 ? hgt / 4 : len / 4)));
        }
      } else {
        box(t, hgt, len, matIn, at, b + hgt / 2, mid, parent);
        if (matOut !== matIn) {
          const skin = mesh(new THREE.PlaneGeometry(len, hgt), matOut, at + outward * (t / 2 + 0.005), b + hgt / 2, mid, parent);
          skin.rotation.y = outward > 0 ? Math.PI / 2 : -Math.PI / 2;
          skin.geometry.attributes.uv.array.forEach((v, i, a) => (a[i] = v * (i % 2 ? hgt / 4 : len / 4)));
        }
      }
    });
  }
}

// ---------- textures ----------
function brickTex() {
  return canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = "#c9b8a4"; g.fillRect(0, 0, w, h);
    const bh = 16, bw = 48;
    for (let r = 0; r < h / bh; r++) {
      for (let c = -1; c < w / bw + 1; c++) {
        const x = c * bw + (r % 2 ? bw / 2 : 0);
        const v = 150 + Math.floor(rnd() * 40);
        g.fillStyle = `rgb(${v + 30},${v - 25},${v - 50})`;
        g.fillRect(x + 2, r * bh + 2, bw - 4, bh - 4);
      }
    }
  }, [1, 1]);
}
function marbleTex() {
  return canvasTex(256, 256, (g, w, h) => {
    const n = 4, s = w / n;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      g.fillStyle = (i + j) % 2 ? "#eae3d6" : "#2f3b38";
      g.fillRect(i * s, j * s, s, s);
    }
    g.strokeStyle = "rgba(255,255,255,.08)";
    for (let k = 0; k < 30; k++) { g.beginPath(); g.moveTo(rnd() * w, rnd() * h); g.bezierCurveTo(rnd() * w, rnd() * h, rnd() * w, rnd() * h, rnd() * w, rnd() * h); g.stroke(); }
  }, [7, 5]);
}
function woodTex() {
  return canvasTex(256, 256, (g, w, h) => {
    for (let i = 0; i < 16; i++) {
      const v = 120 + Math.floor(rnd() * 30);
      g.fillStyle = `rgb(${v + 40},${v},${v - 40})`;
      g.fillRect(0, i * 16, w, 16);
      g.fillStyle = "rgba(0,0,0,.15)"; g.fillRect(0, i * 16, w, 1);
      g.fillRect(Math.floor(rnd() * w), i * 16, 1, 16);
    }
  }, [5, 8]);
}
function windowsTex() {
  return canvasTex(64, 128, (g, w, h) => {
    g.fillStyle = "#151b24"; g.fillRect(0, 0, w, h);
    for (let y = 2; y < h; y += 6) for (let x = 2; x < w; x += 6) {
      const r = rnd();
      g.fillStyle = r > 0.55 ? (r > 0.9 ? "#ffe6b0" : "#f4c983") : "#222b38";
      g.fillRect(x, y, 4, 4);
    }
  });
}
function pegTex() {
  return canvasTex(256, 128, (g, w, h) => {
    g.fillStyle = "#b8916a"; g.fillRect(0, 0, w, h);
    g.fillStyle = "#6e5236";
    for (let y = 6; y < h; y += 10) for (let x = 6; x < w; x += 10) { g.beginPath(); g.arc(x, y, 1.6, 0, 7); g.fill(); }
  });
}

// ---------- props ----------
function makeDrone() {
  const d = new THREE.Group();
  const white = std(0xf4f1ea, { roughness: 0.35 });
  const dark = std(0x2b3036, { roughness: 0.5 });
  const sage = std(0x6fa38c, { roughness: 0.4 });
  const body = box(0.42, 0.14, 0.56, white, 0, 0, 0, d);
  box(0.3, 0.06, 0.4, sage, 0, 0.09, 0, d);
  const rotors = [];
  [[1, 1], [-1, 1], [1, -1], [-1, -1]].forEach(([sx, sz]) => {
    const arm = box(0.5, 0.05, 0.06, dark, sx * 0.3, 0.02, sz * 0.3, d);
    arm.rotation.y = sx * sz > 0 ? -Math.PI / 4 : Math.PI / 4;
    mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.1, 12), dark, sx * 0.48, 0.05, sz * 0.48, d);
    const r = new THREE.Group();
    r.position.set(sx * 0.48, 0.11, sz * 0.48);
    box(0.62, 0.012, 0.05, std(0x3a4148, { transparent: true, opacity: 0.85 }), 0, 0, 0, r);
    box(0.05, 0.012, 0.62, std(0x3a4148, { transparent: true, opacity: 0.85 }), 0, 0, 0, r);
    mesh(new THREE.TorusGeometry(0.31, 0.012, 6, 32), std(0xc9a35b, { metalness: 0.6, roughness: 0.3 }), 0, 0, 0, r).rotation.x = Math.PI / 2;
    d.add(r);
    rotors.push(r);
  });
  const gimbal = mesh(new THREE.SphereGeometry(0.09, 16, 12), dark, 0, -0.1, 0.22, d);
  mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.04, 12), std(0x111111, { roughness: 0.1, metalness: 0.5 }), 0, -0.1, 0.3, d).rotation.x = Math.PI / 2;
  const led = mesh(new THREE.SphereGeometry(0.025, 8, 8), new THREE.MeshBasicMaterial({ color: 0x7dffb4 }), 0, 0.02, 0.29, d);
  [[-0.16, 0.24], [0.16, 0.24]].forEach(([x, z]) => mesh(new THREE.SphereGeometry(0.02, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffd38a }), x, 0, z, d));
  d.userData = { rotors, led, gimbal, body };
  return d;
}

// A stylized, seated Shiqi. Local forward is +Z, seat at y = 0.
function makeShiqi({ hands = "desk" } = {}) {
  const g = new THREE.Group();
  const skin = std(0xf0d0bb, { roughness: 0.6 });
  const hair = std(0x2a1d18, { roughness: 0.45, metalness: 0.05 });
  const top = std(0xe9e1d2, { roughness: 0.85 });
  const skirt = std(0x4a5b73, { roughness: 0.8 });
  const cap = (r, l, mat, x, y, z, rx = 0, rz = 0) => {
    const m = mesh(new THREE.CapsuleGeometry(r, l, 6, 12), mat, x, y, z, g);
    m.rotation.set(rx, 0, rz);
    return m;
  };
  // legs: thighs forward, shins down
  [-0.1, 0.1].forEach((x) => {
    cap(0.075, 0.36, skirt, x, 0.06, 0.2, Math.PI / 2);
    cap(0.06, 0.36, skin, x, -0.22, 0.42);
    mesh(new THREE.SphereGeometry(0.07, 10, 8), std(0xf3efe8), x, -0.46, 0.46, g).scale.set(1, 0.6, 1.5);
  });
  cap(0.17, 0.32, top, 0, 0.38, 0); // torso
  mesh(new THREE.SphereGeometry(0.19, 16, 12), top, 0, 0.58, 0, g).scale.set(1.25, 0.7, 0.9); // shoulders
  cap(0.05, 0.06, skin, 0, 0.72, 0); // neck
  const head = mesh(new THREE.SphereGeometry(0.15, 24, 18), skin, 0, 0.9, 0.01, g);
  head.scale.set(1, 1.08, 1);
  // hair: crown, long back, side strands, bangs
  mesh(new THREE.SphereGeometry(0.163, 24, 18, 0, Math.PI * 2, 0, Math.PI * 0.62), hair, 0, 0.91, -0.005, g).scale.set(1.04, 1.12, 1.06);
  const back = mesh(new THREE.CapsuleGeometry(0.13, 0.3, 6, 14), hair, 0, 0.66, -0.08, g);
  back.scale.set(1.05, 1, 0.42);
  [-1, 1].forEach((sx) => {
    const s = cap(0.045, 0.32, hair, sx * 0.14, 0.72, 0.04);
    s.rotation.z = sx * 0.08;
  });
  const bangs = mesh(new THREE.SphereGeometry(0.16, 20, 10, 0, Math.PI * 2, 0, Math.PI * 0.35), hair, 0, 0.94, 0.04, g);
  bangs.rotation.x = 0.55;
  bangs.scale.set(1, 0.9, 1);
  // face
  const ink = new THREE.MeshBasicMaterial({ color: 0x1c1512 });
  [-0.05, 0.05].forEach((x) => mesh(new THREE.SphereGeometry(0.016, 8, 8), ink, x, 0.89, 0.14, g));
  const blush = new THREE.MeshBasicMaterial({ color: 0xf2a99a, transparent: true, opacity: 0.55 });
  [-0.085, 0.085].forEach((x) => mesh(new THREE.CircleGeometry(0.022, 12), blush, x, 0.855, 0.138, g).rotation.y = x > 0 ? 0.4 : -0.4);
  const smile = mesh(new THREE.TorusGeometry(0.022, 0.005, 6, 12, Math.PI), ink, 0, 0.845, 0.148, g);
  smile.rotation.z = Math.PI;
  // arms
  const arms = new THREE.Group();
  g.add(arms);
  [-1, 1].forEach((sx) => {
    const upper = mesh(new THREE.CapsuleGeometry(0.055, 0.26, 6, 10), top, sx * 0.24, 0.47, 0.06, arms);
    upper.rotation.set(0.45, 0, sx * 0.12);
    const fore = mesh(new THREE.CapsuleGeometry(0.045, 0.24, 6, 10), hands === "lap" ? top : skin, sx * 0.17, 0.32, 0.25, arms);
    fore.rotation.set(hands === "lap" ? 1.35 : 1.45, 0, -sx * 0.5);
    mesh(new THREE.SphereGeometry(0.045, 10, 8), skin, sx * 0.1, hands === "lap" ? 0.27 : 0.3, 0.38, arms);
  });
  g.userData = { head };
  return g;
}

function makeTree(scale = 1, leaf = 0x5f7d5a) {
  const t = new THREE.Group();
  mesh(new THREE.CylinderGeometry(0.15 * scale, 0.22 * scale, 2 * scale, 6), std(0x5a4636), 0, scale, 0, t);
  mesh(new THREE.IcosahedronGeometry(1.4 * scale, 1), std(leaf, { flatShading: true }), 0, 2.6 * scale, 0, t);
  mesh(new THREE.IcosahedronGeometry(1 * scale, 1), std(leaf, { flatShading: true }), 0.6 * scale, 3.2 * scale, 0.2 * scale, t);
  return t;
}


// Merge every static mesh under `root` into one mesh per look (material), so
// the whole house draws in a few dozen calls instead of hundreds.
function bake(root, keep) {
  root.updateMatrixWorld(true);
  const buckets = new Map();
  const victims = [];
  const isKept = (o) => { for (let p = o; p; p = p.parent) if (keep.has(p)) return true; return false; };
  root.traverse((o) => {
    if (!o.isMesh || o.isInstancedMesh || Array.isArray(o.material) || isKept(o)) return;
    const m = o.material;
    if (!m.isMeshStandardMaterial && !m.isMeshBasicMaterial) return;
    const key = [m.type, m.color && m.color.getHex(), m.roughness, m.metalness, m.emissive && m.emissive.getHex(), m.emissiveIntensity, m.map && m.map.uuid, m.flatShading, m.transparent, m.opacity, m.side].join("|");
    let g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
    g.applyMatrix4(o.matrixWorld);
    ["position", "normal", "uv"].forEach((a) => {
      if (!g.attributes[a]) g.setAttribute(a, new THREE.Float32BufferAttribute(new Array(g.attributes.position.count * (a === "uv" ? 2 : 3)).fill(0), a === "uv" ? 2 : 3));
    });
    Object.keys(g.attributes).forEach((a) => { if (!["position", "normal", "uv"].includes(a)) g.deleteAttribute(a); });
    if (!buckets.has(key)) buckets.set(key, { mat: m, geos: [] });
    buckets.get(key).geos.push(g);
    victims.push(o);
  });
  victims.forEach((o) => o.parent && o.parent.remove(o));
  const out = new THREE.Group();
  buckets.forEach(({ mat, geos }) => {
    const merged = mergeGeometries(geos, false);
    if (merged) out.add(new THREE.Mesh(merged, mat));
  });
  return out;
}

// ---------- the world ----------
export function createWorld(canvas, { mobile = false } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !mobile, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2));
  renderer.outputColorSpace = S;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.05, 4000);
  scene.fog = new THREE.FogExp2(0x9a8fa0, 0.0011);

  // sky
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(3000, 32, 16),
    new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: { top: { value: new THREE.Color(0x1d2b4a) }, mid: { value: new THREE.Color(0x6d7aa3) }, low: { value: new THREE.Color(0xf3b98f) } },
      vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }",
      fragmentShader: "uniform vec3 top; uniform vec3 mid; uniform vec3 low; varying vec3 vP; void main(){ float h = vP.y; vec3 c = mix(low, mid, smoothstep(-0.02, 0.18, h)); c = mix(c, top, smoothstep(0.18, 0.6, h)); gl_FragColor = vec4(c,1.); }",
    })
  );
  scene.add(sky);
  {
    const pts = [];
    for (let i = 0; i < 400; i++) {
      const th = rnd() * Math.PI * 2, ph = 0.25 + rnd() * 1.1;
      pts.push(Math.cos(th) * Math.cos(ph) * 2800, Math.sin(ph) * 2800, Math.sin(th) * Math.cos(ph) * 2800);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    scene.add(new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffffff, size: 3, sizeAttenuation: false, fog: false, transparent: true, opacity: 0.7 })));
  }

  scene.add(new THREE.HemisphereLight(0xc9d4ee, 0x3d3226, 0.9));
  const sun = new THREE.DirectionalLight(0xffc49a, 1.4);
  sun.position.set(-200, 120, 300);
  scene.add(sun);
  scene.add(new THREE.AmbientLight(0xfff3e2, 0.25));

  // ground
  const ground = mesh(new THREE.PlaneGeometry(4000, 4000), std(0x3f5543, { roughness: 1 }), 0, -0.02, 0, scene);
  ground.rotation.x = -Math.PI / 2;

  const M = {
    brick: std(0xffffff, { map: brickTex(), roughness: 0.9 }),
    stone: std(0xefe8db, { roughness: 0.6 }),
    cream: std(0xf3ecdf, { roughness: 0.9 }),
    sageWall: std(0xd5ddcf, { roughness: 0.9 }),
    blueWall: std(0xd8dfe6, { roughness: 0.9 }),
    trim: std(0xfbf8f1, { roughness: 0.5 }),
    gold: std(0xc9a35b, { metalness: 0.75, roughness: 0.3 }),
    marble: std(0xffffff, { map: marbleTex(), roughness: 0.25, metalness: 0.05 }),
    wood: std(0xffffff, { map: woodTex(), roughness: 0.7 }),
    darkWood: std(0x4b3426, { roughness: 0.6 }),
    roof: std(0x3b4652, { roughness: 0.8 }),
    glass: new THREE.MeshStandardMaterial({ color: 0xf6d39a, emissive: 0xf2b866, emissiveIntensity: 0.9, roughness: 0.2 }),
    hedge: std(0x46613f, { flatShading: true }),
    lawn: std(0x55704b, { roughness: 1 }),
    path: std(0xcfc6b8, { roughness: 1 }),
    road: std(0x2c2f35, { roughness: 1 }),
  };

  // ================= MANSION =================
  const house = new THREE.Group();
  scene.add(house);
  // lawn, path, street
  box(60, 0.05, 30, M.lawn, 0, 0.0, 22, house);
  box(3.2, 0.06, 18, M.path, 0, 0.02, 19, house);
  box(400, 0.05, 10, M.road, 0, 0.0, 38, house);
  box(400, 0.08, 3, M.path, 0, 0.03, 31.5, house);
  // floors
  box(28, 0.2, 20, M.marble, 0, -0.1, 0, house);
  box(9, 0.2, 20, M.wood, -9.5, 4.9, 0, house); // study floor
  box(9, 0.2, 20, std(0xc9b9a6, { roughness: 1 }), 9.5, 4.9, 0, house); // bedroom carpet
  box(10, 0.2, 2.2, M.wood, 0, 4.9, -8.9, house); // landing
  box(28.6, 0.4, 20.6, M.cream, 0, 10.2, 0, house); // ceiling slab
  // exterior walls
  const front = { a0: -14, a1: 14 };
  wall({ axis: "x", at: 10, ...front, y0: 0, y1: 10, outward: 1, matOut: M.brick, matIn: M.cream, parent: house, holes: [
    { a0: -1.4, a1: 1.4, y0: 0, y1: 3.8 },
    { a0: -11, a1: -8, y0: 1, y1: 3.7 }, { a0: 8, a1: 11, y0: 1, y1: 3.7 },
    { a0: -11.2, a1: -7.8, y0: 6, y1: 9.1 }, { a0: 7.8, a1: 11.2, y0: 6, y1: 9.1 },
    { a0: -2.6, a1: 2.6, y0: 5.2, y1: 9.4 },
  ] });
  wall({ axis: "x", at: -10, ...front, y0: 0, y1: 10, outward: -1, matOut: M.brick, matIn: M.cream, parent: house, holes: [{ a0: 8, a1: 11, y0: 6, y1: 9 }] });
  wall({ axis: "z", at: -14, a0: -10, a1: 10, y0: 0, y1: 10, outward: -1, matOut: M.brick, matIn: M.sageWall, parent: house, holes: [{ a0: -6, a1: -3, y0: 1, y1: 3.7 }, { a0: 3, a1: 6, y0: 1, y1: 3.7 }] });
  wall({ axis: "z", at: 14, a0: -10, a1: 10, y0: 0, y1: 10, outward: 1, matOut: M.brick, matIn: M.blueWall, parent: house, holes: [{ a0: -6, a1: -3, y0: 1, y1: 3.7 }, { a0: 3, a1: 6, y0: 1, y1: 3.7 }, { a0: 4, a1: 7, y0: 6, y1: 9 }] });
  // upper interior walls with doors to the landing
  wall({ axis: "z", at: -5, a0: -10, a1: 10, y0: 5, y1: 10, outward: 1, matOut: M.cream, matIn: M.sageWall, parent: house, holes: [{ a0: -9.2, a1: -7.2, y0: 5, y1: 8 }] });
  wall({ axis: "z", at: 5, a0: -10, a1: 10, y0: 5, y1: 10, outward: -1, matOut: M.cream, matIn: M.blueWall, parent: house, holes: [{ a0: -9.2, a1: -7.2, y0: 5, y1: 8 }] });
  // glowing window panes (outside faces only, so they never block the view out)
  const pane = (w, h, x, y, z, ry = 0) => {
    const p = mesh(new THREE.PlaneGeometry(w, h), M.glass, x, y, z, house);
    p.rotation.y = ry;
    return p;
  };
  pane(3, 2.7, -9.5, 2.35, 10.16); pane(3, 2.7, 9.5, 2.35, 10.16);
  [[-6, -3], [3, 6]].forEach(([a, b]) => { pane(3, 2.7, -14.16, 2.35, (a + b) / 2, -Math.PI / 2); pane(3, 2.7, 14.16, 2.35, (a + b) / 2, Math.PI / 2); });
  pane(3, 3, 14.16, 7.5, 5.5, Math.PI / 2);
  // window trims and mullions
  const trimRect = (x0, x1, y0, y1, z) => {
    box(x1 - x0 + 0.4, 0.2, 0.25, M.trim, (x0 + x1) / 2, y0 - 0.1, z, house);
    box(x1 - x0 + 0.5, 0.25, 0.3, M.trim, (x0 + x1) / 2, y1 + 0.12, z, house);
  };
  trimRect(-11, -8, 1, 3.7, 10.2); trimRect(8, 11, 1, 3.7, 10.2);
  trimRect(-11.2, -7.8, 6, 9.1, 10.2); trimRect(7.8, 11.2, 6, 9.1, 10.2);
  // palladian arch over the foyer window
  const arch = mesh(new THREE.TorusGeometry(2.6, 0.18, 8, 32, Math.PI), M.trim, 0, 9.4, 10.2, house);
  arch.scale.set(1, 0.35, 1);
  // cornice and roof
  box(29.4, 0.6, 21.4, M.trim, 0, 10.3, 0, house);
  const roof = mesh(new THREE.ConeGeometry(1, 1, 4), M.roof, 0, 13, 0, house);
  roof.rotation.y = Math.PI / 4;
  roof.scale.set(21.5, 5.4, 15.3);
  // portico
  [-4.6, -1.8, 1.8, 4.6].forEach((x) => {
    mesh(new THREE.CylinderGeometry(0.36, 0.42, 8.6, 20), M.trim, x, 4.3, 12.3, house);
    box(1, 0.3, 1, M.trim, x, 8.75, 12.3, house);
    box(1, 0.3, 1, M.trim, x, 0.15, 12.3, house);
  });
  box(11.6, 0.9, 3.6, M.trim, 0, 9.3, 11.9, house);
  const ped = mesh(new THREE.CylinderGeometry(0.01, 6.4, 2.2, 3, 1), M.trim, 0, 10.85, 12.3, house);
  ped.rotation.set(Math.PI / 2, 0, 0);
  ped.scale.set(1, 0.9, 0.35);
  ped.rotation.z = Math.PI;
  for (let i = 0; i < 4; i++) box(9 - i * 0.6, 0.18, 1, M.stone, 0, 0.09 + i * 0.18, 14.7 - i * 0.55, house);
  // front door (open, swung inward)
  const door = box(1.35, 3.7, 0.12, std(0x2f4a3e, { roughness: 0.5 }), -0.7, 1.85, 9.4, house);
  door.geometry.translate(0.675, 0, 0);
  door.position.x = -1.4;
  door.rotation.y = -1.25;
  const door2 = box(1.35, 3.7, 0.12, std(0x2f4a3e, { roughness: 0.5 }), 1.4, 1.85, 9.4, house);
  door2.geometry.translate(-0.675, 0, 0);
  door2.rotation.y = 1.25;
  mesh(new THREE.TorusGeometry(0.42, 0.12, 8, 20), std(0x3c6b4c, { flatShading: true }), 0, 4.4, 10.3, house); // wreath
  // hedges, lamps, trees, mailbox
  [-1, 1].forEach((sx) => {
    box(10, 1.1, 1.2, M.hedge, sx * 9.5, 0.55, 12.4, house);
    const lamp = new THREE.Group();
    lamp.position.set(sx * 2.6, 0, 26);
    mesh(new THREE.CylinderGeometry(0.07, 0.1, 3.2, 8), std(0x1e2329, { metalness: 0.5 }), 0, 1.6, 0, lamp);
    mesh(new THREE.SphereGeometry(0.28, 12, 10), new THREE.MeshBasicMaterial({ color: 0xffe2a8 }), 0, 3.35, 0, lamp);
    house.add(lamp);
    const tr = makeTree(1.3, 0x4f6e4a);
    tr.position.set(sx * 20, 0, 18);
    house.add(tr);
    const xmas = new THREE.Group();
    xmas.position.set(sx * 13.5, 0, 17);
    mesh(new THREE.ConeGeometry(1.6, 4.4, 8), std(0x2f5c45, { flatShading: true }), 0, 2.6, 0, xmas);
    for (let k = 0; k < 26; k++) {
      const a = k * 0.9, yy = 0.7 + (k / 26) * 3.8, rr = 1.55 * (1 - (yy - 0.4) / 4.4) + 0.08;
      mesh(new THREE.SphereGeometry(0.07, 6, 6), new THREE.MeshBasicMaterial({ color: [0xffd27a, 0xff9a8a, 0x9ad7ff, 0xc9ffb0][k % 4] }), Math.cos(a) * rr, yy, Math.sin(a) * rr, xmas);
    }
    mesh(new THREE.OctahedronGeometry(0.28), new THREE.MeshBasicMaterial({ color: 0xffe39a }), 0, 5, 0, xmas);
    house.add(xmas);
  });
  const mailbox = new THREE.Group();
  mailbox.position.set(4.2, 0, 27.5);
  mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.2, 8), std(0x3b3026), 0, 0.6, 0, mailbox);
  const mb = box(0.5, 0.45, 0.85, std(0x2f4f6b, { roughness: 0.4 }), 0, 1.35, 0, mailbox);
  mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.85, 16, 1, false, 0, Math.PI), std(0x2f4f6b, { roughness: 0.4 }), 0, 1.57, 0, mailbox).rotation.set(Math.PI / 2, 0, Math.PI / 2);
  const flag = box(0.04, 0.35, 0.18, std(0xd6705a), 0.27, 1.55, -0.1, mailbox);
  house.add(mailbox);
  // Dyker Heights lights: strings along the cornice and portico
  {
    const pts = [];
    const add = (x0, z0, x1, z1, y, n) => { for (let i = 0; i <= n; i++) pts.push([x0 + (x1 - x0) * i / n, y - Math.sin(i / n * Math.PI * 6) * 0.08, z0 + (z1 - z0) * i / n]); };
    add(-14.7, 10.75, 14.7, 10.75, 10.05, 120);
    add(-5.8, 13.8, 5.8, 13.8, 8.8, 50);
    add(-14.7, -10.75, -14.7, 10.75, 10.05, 80);
    add(14.7, -10.75, 14.7, 10.75, 10.05, 80);
    [-4.6, -1.8, 1.8, 4.6].forEach((x) => { for (let i = 0; i < 24; i++) { const a = i * 0.8; pts.push([x + Math.cos(a) * 0.45, 0.4 + i * 0.34, 12.3 + Math.sin(a) * 0.45]); } });
    const cols = [0xffd27a, 0xffe9c4, 0xffb27a, 0xfff1d6];
    cols.forEach((c, ci) => {
      const sub = pts.filter((_, i) => i % 4 === ci);
      const im = new THREE.InstancedMesh(new THREE.SphereGeometry(0.06, 6, 6), new THREE.MeshBasicMaterial({ color: c }), sub.length);
      const m4 = new THREE.Matrix4();
      sub.forEach((p, i) => { m4.makeTranslation(p[0], p[1], p[2]); im.setMatrixAt(i, m4); });
      house.add(im);
    });
  }

  // ---------- foyer ----------
  const foyer = new THREE.Group();
  house.add(foyer);
  // grand stair rising toward the back to the landing (y=5 at z=-8)
  const steps = 20;
  for (let i = 0; i < steps; i++) {
    const y = (i + 1) * (5 / steps), z = -0.8 - i * (7 / steps);
    box(4.2, 5 / steps, 7 / steps + 0.02, M.wood, 0, y - 5 / steps / 2, z, foyer);
    box(4.2, 0.03, 0.36, std(0x6b2d33), 0, y + 0.01, z, foyer); // runner
  }
  [-2.2, 2.2].forEach((x) => {
    const rail = box(0.12, 0.12, 8.7, M.darkWood, x, 3.5, -4.3, foyer);
    rail.rotation.x = Math.atan2(5, 7);
    for (let i = 0; i < 14; i++) box(0.05, 1, 0.05, M.trim, x, 0.95 + i * 0.36 + 0.35, -0.9 - i * 0.5, foyer);
    box(0.32, 1.4, 0.32, M.trim, x, 0.7, -0.6, foyer);
    mesh(new THREE.SphereGeometry(0.2, 12, 10), M.gold, x, 1.55, -0.6, foyer);
  });
  // balcony rails along the landing
  [[-5, -2.2], [2.2, 5]].forEach(([a, b]) => {
    box(b - a, 0.1, 0.1, M.darkWood, (a + b) / 2, 6.05, -7.85, foyer);
    for (let x = a + 0.2; x < b; x += 0.35) box(0.05, 1, 0.05, M.trim, x, 5.5, -7.85, foyer);
  });
  // chandelier
  const chand = new THREE.Group();
  mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.8, 6), M.gold, 0, 0.9, 0, chand);
  [1.2, 0.8, 0.45].forEach((r, k) => {
    const ring = mesh(new THREE.TorusGeometry(r, 0.04, 8, 40), M.gold, 0, -k * 0.45, 0, chand);
    ring.rotation.x = Math.PI / 2;
    const n = Math.round(r * 12);
    for (let i = 0; i < n; i++) mesh(new THREE.SphereGeometry(0.07, 8, 8), new THREE.MeshBasicMaterial({ color: 0xfff0c8 }), Math.cos(i / n * Math.PI * 2) * r, -k * 0.45 + 0.08, Math.sin(i / n * Math.PI * 2) * r, chand);
    for (let i = 0; i < n * 2; i++) mesh(new THREE.OctahedronGeometry(0.045), std(0xffffff, { roughness: 0.05, metalness: 0.2, emissive: 0x8899aa, emissiveIntensity: 0.2 }), Math.cos(i / (n * 2) * Math.PI * 2) * r, -k * 0.45 - 0.22, Math.sin(i / (n * 2) * Math.PI * 2) * r, chand);
  });
  chand.add(bake(chand, new Set()));
  chand.position.set(0, 8.2, 2.5);
  foyer.add(chand);
  const chandLight = new THREE.PointLight(0xffd9a0, 60, 26, 1.6);
  chandLight.position.set(0, 7.5, 2.5);
  foyer.add(chandLight);
  // rug, round table with flowers, plants, paintings
  const rug = mesh(new THREE.CircleGeometry(3.4, 48), std(0x5d3a3f, { roughness: 1 }), 0, 0.02, 3.2, foyer);
  rug.rotation.x = -Math.PI / 2;
  const rug2 = mesh(new THREE.RingGeometry(3.1, 3.3, 48), std(0xc9a35b, { roughness: 1 }), 0, 0.03, 3.2, foyer);
  rug2.rotation.x = -Math.PI / 2;
  mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.08, 32), M.darkWood, 0, 0.95, 3.2, foyer);
  mesh(new THREE.CylinderGeometry(0.12, 0.25, 0.9, 12), M.darkWood, 0, 0.45, 3.2, foyer);
  mesh(new THREE.CylinderGeometry(0.16, 0.12, 0.4, 16), std(0xf2efe8, { roughness: 0.2 }), 0, 1.2, 3.2, foyer);
  for (let i = 0; i < 9; i++) mesh(new THREE.SphereGeometry(0.11, 8, 8), std([0xf6f0e6, 0xe9b8b0, 0xf2d6a2][i % 3]), Math.cos(i) * 0.18, 1.5 + (i % 3) * 0.06, 3.2 + Math.sin(i) * 0.18, foyer);
  [[-4.2, 8.6], [4.2, 8.6], [-4.2, -0.5], [4.2, -0.5]].forEach(([x, z]) => {
    mesh(new THREE.CylinderGeometry(0.35, 0.28, 0.7, 12), std(0xf2efe8), x, 0.35, z, foyer);
    mesh(new THREE.IcosahedronGeometry(0.7, 1), std(0x4e7a54, { flatShading: true }), x, 1.3, z, foyer).scale.set(1, 1.4, 1);
  });
  const painting = (w, h, x, y, z, ry, colors) => {
    const p = new THREE.Group();
    p.position.set(x, y, z);
    p.rotation.y = ry;
    box(w + 0.3, h + 0.3, 0.08, M.gold, 0, 0, 0, p);
    const tex = canvasTex(128, 96, (g, W, H) => {
      const gr = g.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, colors[0]); gr.addColorStop(1, colors[1]);
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
      g.fillStyle = colors[2];
      for (let i = 0; i < 6; i++) g.fillRect(10 + i * 19, H * 0.45 - i * 3, 12, H);
    });
    mesh(new THREE.PlaneGeometry(w, h), std(0xffffff, { map: tex }), 0, 0, 0.05, p);
    foyer.add(p);
  };
  painting(3, 2, -13.82, 3, 0, Math.PI / 2, ["#e8b98f", "#6d7aa3", "#2f3b48"]);
  painting(3, 2, 13.82, 3, 0, -Math.PI / 2, ["#bcd5e7", "#557c9f", "#33403b"]);

  // ---------- study (x -14..-5, y 5..10) ----------
  const study = new THREE.Group();
  house.add(study);
  const studyLight = new THREE.PointLight(0xffe2b8, 30, 16, 1.6);
  studyLight.position.set(-9.5, 9.3, 1);
  study.add(studyLight);
  const studyRug = box(5.5, 0.03, 7, std(0x37505e, { roughness: 1 }), -9.5, 5.02, 1, study);
  // desk by the front window
  const desk = new THREE.Group();
  desk.position.set(-9.5, 5, 7.3);
  box(3.4, 0.12, 1.5, M.darkWood, 0, 0.86, 0, desk);
  box(0.8, 0.8, 1.4, M.darkWood, -1.2, 0.4, 0, desk);
  box(0.8, 0.8, 1.4, M.darkWood, 1.2, 0.4, 0, desk);
  [[-1.2, 0.71], [1.2, 0.71]].forEach(([x, z]) => box(0.7, 0.04, 0.02, M.gold, x, 0.55, z, desk));
  box(3.2, 0.02, 1.3, std(0x2f5a46, { roughness: 0.8 }), 0, 0.93, 0, desk); // leather inlay
  // banker's lamp
  const lamp = new THREE.Group();
  lamp.position.set(-1.3, 0.93, 0.35);
  mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.04, 16), M.gold, 0, 0.02, 0, lamp);
  mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.4, 8), M.gold, 0, 0.22, 0, lamp);
  const shade = mesh(new THREE.CylinderGeometry(0.06, 0.22, 0.14, 16, 1, true), std(0x2e6b4e, { side: THREE.DoubleSide, emissive: 0x1d4a34, emissiveIntensity: 0.6 }), 0, 0.44, 0, lamp);
  shade.rotation.z = 0.12;
  desk.add(lamp);
  const deskLight = new THREE.PointLight(0xffd59a, 8, 5, 1.6);
  deskLight.position.set(-9.5 - 1.3, 5 + 1.25, 7.65);
  study.add(deskLight);
  // books, mug, plant on desk
  [[1.05, 0.3, 0x8a3b3b], [1.05, 0.38, 0x2f4f6b], [1.05, 0.45, 0xc9a35b]].forEach(([x, y, c], i) => box(0.5, 0.07, 0.36, std(c), x, 0.93 + 0.04 + i * 0.07, 0.25, desk).rotation.y = i * 0.15);
  mesh(new THREE.CylinderGeometry(0.06, 0.055, 0.12, 16), std(0xf2efe8), 0.45, 0.99, -0.35, desk);
  mesh(new THREE.CylinderGeometry(0.1, 0.08, 0.16, 12), std(0xb5764f), 1.45, 1.01, -0.4, desk);
  mesh(new THREE.IcosahedronGeometry(0.16, 1), std(0x5d8a5c, { flatShading: true }), 1.45, 1.2, -0.4, desk);
  study.add(desk);
  // the half-written letter (texture redrawn by the app)
  const letterCanvas = document.createElement("canvas");
  letterCanvas.width = 512; letterCanvas.height = 680;
  const letterTex = new THREE.CanvasTexture(letterCanvas);
  letterTex.colorSpace = S;
  const letter = mesh(new THREE.PlaneGeometry(0.62, 0.82), new THREE.MeshStandardMaterial({ map: letterTex, roughness: 0.9, emissive: 0xffffff, emissiveIntensity: 0, emissiveMap: letterTex }), -9.05, 5.945, 7.05, study);
  letter.rotation.set(-Math.PI / 2, 0, 0.18);
  const pen = mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.32, 8), M.gold, -8.62, 5.96, 7.15, study);
  pen.rotation.set(Math.PI / 2, 0, 0.9);
  // chair + Shiqi at the desk
  const chair = new THREE.Group();
  chair.position.set(-9.5, 5, 5.95);
  box(0.75, 0.1, 0.7, std(0x6b2d33, { roughness: 0.6 }), 0, 0.55, 0, chair);
  box(0.75, 0.9, 0.1, std(0x6b2d33, { roughness: 0.6 }), 0, 1.05, -0.33, chair);
  [[-0.32, -0.3], [0.32, -0.3], [-0.32, 0.3], [0.32, 0.3]].forEach(([x, z]) => box(0.06, 0.55, 0.06, M.darkWood, x, 0.27, z, chair));
  study.add(chair);
  const meDesk = makeShiqi({ hands: "desk" });
  meDesk.position.set(-9.5, 5.62, 6.0);
  study.add(meDesk);
  // bookshelf on the outer wall (x=-14)
  const shelf = new THREE.Group();
  shelf.position.set(-13.55, 5, 0);
  const shelfW = 10;
  box(0.6, 4.9, 0.12, M.darkWood, 0, 2.45, -shelfW / 2, shelf);
  box(0.6, 4.9, 0.12, M.darkWood, 0, 2.45, shelfW / 2, shelf);
  box(0.6, 0.15, shelfW, M.darkWood, 0, 4.85, 0, shelf);
  for (let k = 1; k < 5; k++) box(0.6, 0.12, 0.08, M.darkWood, 0, 2.45, -shelfW / 2 + k * 2, shelf).scale.y = 40;
  const shelfYs = [0.1, 1.05, 2.0, 2.95, 3.9];
  shelfYs.forEach((y) => box(0.6, 0.08, shelfW, M.darkWood, 0, y, 0, shelf));
  {
    const colors = [0x2f4f6b, 0x8a3b3b, 0x3c6b4c, 0xc9a35b, 0x5a4a6b, 0xd9cfbd, 0x6b5136, 0x9cb8c9];
    const geo = new THREE.BoxGeometry(1, 1, 1);
    colors.forEach((c, ci) => {
      const list = [];
      shelfYs.slice(0, 4).forEach((y, si) => {
        let z = -shelfW / 2 + 0.1;
        let n = 0;
        while (z < shelfW / 2 - 0.15) {
          const w = 0.08 + rnd() * 0.07, h = 0.55 + rnd() * 0.3;
          if (Math.floor(rnd() * colors.length) === ci && !(si === 2 && Math.abs(z) < 0.35)) list.push([z + w / 2, y + 0.04 + h / 2, w, h]);
          z += w + 0.005;
          if (++n > 400) break;
        }
      });
      const im = new THREE.InstancedMesh(geo, std(c, { roughness: 0.8 }), list.length);
      const m4 = new THREE.Matrix4();
      list.forEach(([z, y, w, h], i) => { m4.compose(new THREE.Vector3(0.05, y, z), new THREE.Quaternion(), new THREE.Vector3(0.42, h, w)); im.setMatrixAt(i, m4); });
      shelf.add(im);
    });
  }
  study.add(shelf);
  // the experience book: a tall sage book with a gold spine
  const book = new THREE.Group();
  book.position.set(-13.45, 5 + shelfYs[2] + 0.48, 0);
  const bookMat = std(0x3c6b55, { roughness: 0.5, emissive: 0xc9a35b, emissiveIntensity: 0 });
  box(0.48, 0.86, 0.2, bookMat, 0, 0, 0, book);
  book.position.x += 0.12;
  box(0.02, 0.6, 0.16, M.gold, 0.25, 0, 0, book);
  [0.32, -0.32].forEach((y) => box(0.02, 0.04, 0.2, M.gold, 0.25, y, 0, book));
  study.add(book);
  const haloTex = canvasTex(128, 128, (g, w, h) => {
    const gr = g.createRadialGradient(w / 2, h / 2, 4, w / 2, h / 2, w / 2);
    gr.addColorStop(0, "rgba(255,226,160,1)"); gr.addColorStop(0.35, "rgba(255,210,130,.55)"); gr.addColorStop(1, "rgba(255,200,120,0)");
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  });
  const bookHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  bookHalo.position.set(-13.0, book.position.y, 0);
  bookHalo.scale.setScalar(1.3);
  bookHalo.visible = false;
  study.add(bookHalo);
  // tool wall (back wall) and workbench
  const peg = mesh(new THREE.PlaneGeometry(6.8, 3.2), std(0xffffff, { map: pegTex() }), -9.8, 7.85, -9.83, study);
  box(7, 0.1, 0.1, M.darkWood, -9.8, 9.5, -9.8, study);
  box(7, 0.1, 0.1, M.darkWood, -9.8, 6.2, -9.8, study);
  const tool = new THREE.Group();
  study.add(tool);
  const steel = std(0xb8c0c6, { metalness: 0.7, roughness: 0.35 });
  const red = std(0xb5473f, { roughness: 0.5 });
  const sageT = std(0x5f9a80, { roughness: 0.5 });
  const T = (x, y, build) => { const g = new THREE.Group(); g.position.set(x, y, -9.72); build(g); tool.add(g); return g; };
  // wrenches
  [0, 1, 2, 3].forEach((i) => T(-12.9 + i * 0.32, 8.3, (g) => { box(0.06, 0.8 - i * 0.1, 0.03, steel, 0, 0, 0, g); mesh(new THREE.TorusGeometry(0.07, 0.025, 6, 12, Math.PI * 1.5), steel, 0, (0.8 - i * 0.1) / 2, 0, g); }));
  // screwdrivers
  [red, sageT, std(0xd8b56e), std(0x557c9f)].forEach((m, i) => T(-11.4 + i * 0.25, 8.6, (g) => { mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.3, 10), m, 0, 0.15, 0, g); mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.4, 6), steel, 0, -0.2, 0, g); }));
  // hammer
  T(-10.2, 8.2, (g) => { box(0.06, 0.8, 0.04, M.darkWood, 0, 0, 0, g); box(0.34, 0.1, 0.08, steel, 0, 0.4, 0, g); });
  // pliers
  T(-9.6, 8.3, (g) => { [-1, 1].forEach((s) => { const a = box(0.05, 0.55, 0.03, red, s * 0.05, -0.1, 0, g); a.rotation.z = s * 0.12; }); box(0.05, 0.2, 0.03, steel, 0, 0.27, 0, g); });
  // multimeter
  T(-8.9, 8.2, (g) => { box(0.42, 0.62, 0.08, std(0xd8b56e), 0, 0, 0, g); box(0.32, 0.18, 0.02, std(0x9fc7a8, { emissive: 0x4f8a74, emissiveIntensity: 0.6 }), 0, 0.15, 0.05, g); mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.04, 16), std(0x2b3036), 0, -0.1, 0.05, g).rotation.x = Math.PI / 2; });
  // soldering iron + spool
  T(-8.2, 8.4, (g) => { mesh(new THREE.CylinderGeometry(0.035, 0.03, 0.5, 10), std(0x2b3036), 0, 0, 0, g); mesh(new THREE.ConeGeometry(0.02, 0.2, 8), steel, 0, -0.35, 0, g).rotation.x = Math.PI; });
  T(-7.75, 8.0, (g) => { mesh(new THREE.TorusGeometry(0.13, 0.06, 8, 18), std(0xd0d4d8, { metalness: 0.6 }), 0, 0, 0, g); });
  // calipers, saw, tape measure
  T(-12.3, 7.0, (g) => { box(0.9, 0.06, 0.03, steel, 0, 0, 0, g); box(0.06, 0.25, 0.03, steel, -0.4, -0.1, 0, g); box(0.06, 0.25, 0.03, steel, -0.25, -0.1, 0, g); });
  T(-11.0, 7.0, (g) => { box(0.9, 0.3, 0.02, steel, 0.1, 0, 0, g); box(0.25, 0.32, 0.05, red, -0.45, 0, 0, g); });
  T(-9.6, 6.95, (g) => { mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.1, 18), std(0xd8b56e), 0, 0, 0, g).rotation.x = Math.PI / 2; });
  // sketch paper pinned on the pegboard (texture drawn here)
  const sketchTex = canvasTex(512, 380, (g, w, h) => {
    g.fillStyle = "#f7f3e8"; g.fillRect(0, 0, w, h);
    g.strokeStyle = "rgba(85,124,159,.25)"; g.lineWidth = 1;
    for (let x = 0; x < w; x += 16) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
    for (let y = 0; y < h; y += 16) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
    g.strokeStyle = "#2f4f6b"; g.lineWidth = 3;
    g.strokeRect(60, 120, 180, 140); g.beginPath(); g.arc(150, 190, 40, 0, 7); g.stroke();
    g.beginPath(); g.moveTo(300, 260); g.lineTo(300, 110); g.lineTo(440, 110); g.lineTo(440, 150); g.stroke();
    g.beginPath(); g.moveTo(440, 150); g.lineTo(440, 220); g.stroke();
    g.font = "bold 40px 'Caveat', cursive"; g.fillStyle = "#2d3531"; g.fillText("my toolbox", 150, 70);
    g.font = "26px 'Caveat', cursive"; g.fillStyle = "#4f8a74"; g.fillText("code · robotics · CAD · tools", 120, 330);
    g.fillStyle = "#c9a35b"; g.beginPath(); g.arc(256, 14, 9, 0, 7); g.fill();
  });
  const sketch = mesh(new THREE.PlaneGeometry(1.25, 0.93), new THREE.MeshStandardMaterial({ map: sketchTex, roughness: 0.9, emissive: 0xffffff, emissiveIntensity: 0, emissiveMap: sketchTex }), -6.95, 8.55, -9.7, study);
  sketch.rotation.z = -0.04;
  // workbench
  const bench = new THREE.Group();
  bench.position.set(-9.8, 5, -9.0);
  box(6.8, 0.14, 1.6, M.wood, 0, 0.95, 0, bench);
  [[-3.2, -0.65], [3.2, -0.65], [-3.2, 0.65], [3.2, 0.65]].forEach(([x, z]) => box(0.14, 0.95, 0.14, M.darkWood, x, 0.47, z, bench));
  box(6.6, 0.08, 1.4, M.darkWood, 0, 0.3, 0, bench);
  study.add(bench);
  const benchTop = 5 + 1.02;
  // builds (simple placeholder models made of parts that can be taken apart)
  const builds = [];
  const part = (grp, geo, mat, home, apart) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.copy(home);
    m.userData = { home: home.clone(), apart: apart.clone(), build: grp.userData.key };
    grp.add(m);
    grp.userData.parts.push(m);
    return m;
  };
  const mkBuild = (key, x) => {
    const g = new THREE.Group();
    g.position.set(x, benchTop, -9.0);
    g.userData = { key, parts: [] };
    study.add(g);
    builds.push(g);
    return g;
  };
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  {
    const g = mkBuild("sorter", -11.9);
    part(g, new THREE.BoxGeometry(1.3, 0.08, 0.5), std(0x2b3036), V(0, 0.25, 0), V(0, 0.04, 0.35));
    [-0.55, 0.55].forEach((x, i) => part(g, new THREE.BoxGeometry(0.08, 0.25, 0.08), steel, V(x, 0.12, -0.18), V(x * 1.4, 0.12, -0.45 + i * 0.05)));
    [-0.55, 0.55].forEach((x) => part(g, new THREE.BoxGeometry(0.08, 0.25, 0.08), steel, V(x, 0.12, 0.18), V(x * 1.5, 0.12, 0.62)));
    part(g, new THREE.BoxGeometry(0.28, 0.22, 0.3), std(0x557c9f), V(0.15, 0.4, 0), V(0.25, 0.11, -0.55));
    part(g, new THREE.SphereGeometry(0.05, 10, 8), new THREE.MeshBasicMaterial({ color: 0x9fe0ff }), V(0.15, 0.27, 0), V(0.65, 0.05, -0.25));
    [[0xc6463c, -0.7], [0x5f9a80, -0.95], [0xd8b56e, 0.75]].forEach(([c, x]) => part(g, new THREE.BoxGeometry(0.22, 0.18, 0.28), std(c), V(x, 0.09, 0.42), V(x * 1.25, 0.09, 0.62)));
    [0xc6463c, 0x5f9a80, 0xd8b56e].forEach((c, i) => part(g, new THREE.SphereGeometry(0.06, 12, 10), std(c), V(-0.35 + i * 0.25, 0.35, 0), V(-0.2 + i * 0.18, 0.06, 0.62)));
  }
  {
    const g = mkBuild("crane", -9.8);
    part(g, new THREE.CylinderGeometry(0.32, 0.36, 0.14, 20), std(0x2b3036), V(0, 0.07, 0), V(0, 0.07, 0.2));
    part(g, new THREE.CylinderGeometry(0.2, 0.2, 0.12, 16), std(0xd8b56e), V(0, 0.2, 0), V(-0.55, 0.06, 0.2));
    part(g, new THREE.BoxGeometry(0.1, 1.1, 0.1), std(0xd8b56e), V(0, 0.8, 0), V(-0.2, 0.05, -0.45)).userData.lay = true;
    part(g, new THREE.BoxGeometry(1.1, 0.08, 0.08), std(0xd8b56e), V(0.35, 1.35, 0), V(0.5, 0.04, -0.35));
    part(g, new THREE.BoxGeometry(0.22, 0.16, 0.16), std(0x557c9f), V(-0.22, 1.35, 0), V(0.65, 0.08, 0.2));
    part(g, new THREE.CylinderGeometry(0.005, 0.005, 0.6, 4), std(0x2b3036), V(0.85, 1.05, 0), V(0.35, 0.02, 0.5)).userData.lay = true;
    part(g, new THREE.TorusGeometry(0.06, 0.015, 6, 12, Math.PI * 1.4), steel, V(0.85, 0.72, 0), V(0.0, 0.04, 0.55));
  }
  {
    const g = mkBuild("tempbox", -7.7);
    part(g, new THREE.BoxGeometry(0.9, 0.45, 0.6), std(0xe9e3d6), V(0, 0.225, 0), V(0, 0.225, 0.1));
    part(g, new THREE.BoxGeometry(0.92, 0.06, 0.62), std(0x5f9a80), V(0, 0.48, 0), V(-0.75, 0.03, -0.25));
    part(g, new THREE.BoxGeometry(0.34, 0.16, 0.02), std(0x9fc7a8, { emissive: 0x4f8a74, emissiveIntensity: 0.8 }), V(0, 0.26, 0.31), V(0.7, 0.01, -0.3)).userData.lay = true;
    part(g, new THREE.BoxGeometry(0.5, 0.03, 0.35), std(0x2f5a46), V(0, 0.08, 0), V(0.75, 0.02, 0.3));
    part(g, new THREE.CylinderGeometry(0.03, 0.03, 0.18, 10), std(0x2b3036), V(0.3, 0.57, 0.15), V(-0.3, 0.02, 0.45)).userData.lay = true;
    part(g, new THREE.SphereGeometry(0.04, 10, 8), new THREE.MeshBasicMaterial({ color: 0xff8a6a }), V(-0.3, 0.52, 0.2), V(0.25, 0.04, 0.5));
  }
  // certificate wall on the inner wall (x=-5, facing -X). Frames get textures from the app.
  const certFrames = [];
  const certGroup = new THREE.Group();
  study.add(certGroup);
  function addFrame(w, h, y, z, tone) {
    const f = new THREE.Group();
    f.position.set(-5.2, y, z);
    f.rotation.y = -Math.PI / 2;
    box(w + 0.16, h + 0.16, 0.06, std(0x6b5136, { roughness: 0.5 }), 0, 0, 0, f);
    box(w + 0.04, h + 0.04, 0.065, std(tone, { roughness: 0.6 }), 0, 0, 0.005, f);
    const c = document.createElement("canvas");
    c.width = 400; c.height = Math.round(400 * h / w);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = S;
    const face = mesh(new THREE.PlaneGeometry(w - 0.1, h - 0.1), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.12 }), 0, 0, 0.04, f);
    f.userData = { canvas: c, tex, face };
    certGroup.add(f);
    certFrames.push(f);
    return f;
  }
  const honorZ = [-3.2, -1.07, 1.07, 3.2];
  honorZ.forEach((z, i) => addFrame(1.5, 1.08, 8.75, z, [0xc9a35b, 0xb9cfc2, 0xd8c7a3, 0xb7cadb][i]));
  const certRows = [[7.45, 7], [6.4, 6]];
  certRows.forEach(([y, n]) => { for (let i = 0; i < n; i++) addFrame(0.98, 0.74, y, (i - (n - 1) / 2) * 1.12, [0xc4dfcd, 0xc6dceb, 0xeadcc3, 0xd3e2d0, 0xefe4c2, 0xb9d3dd][(i + n) % 6]); });
  const certLight = new THREE.PointLight(0xfff0d6, 14, 9, 1.6);
  certLight.position.set(-7.2, 9, 0);
  study.add(certLight);

  // ---------- bedroom (x 5..14) ----------
  const bedroom = new THREE.Group();
  house.add(bedroom);
  const bedLight = new THREE.PointLight(0xffd7a8, 22, 14, 1.6);
  bedLight.position.set(9.5, 9.2, 1);
  bedroom.add(bedLight);
  const bed = new THREE.Group();
  bed.position.set(12.2, 5, 0.6);
  box(3.6, 0.45, 3, std(0xe9e3d6), 0, 0.3, 0, bed);
  box(3.4, 0.35, 2.9, std(0xfbf8f1, { roughness: 1 }), -0.05, 0.68, 0, bed); // mattress
  box(2.5, 0.12, 3.02, std(0x8fb3a0, { roughness: 1 }), -0.55, 0.88, 0, bed); // duvet
  box(0.2, 2.1, 3.3, std(0xd8c7a3, { roughness: 0.6 }), 1.85, 1.05, 0, bed); // headboard
  [-0.7, 0.7].forEach((z) => box(0.45, 0.25, 0.85, std(0xf6f1e7), 1.35, 0.98, z, bed));
  box(0.4, 0.22, 0.6, std(0xd9b8b0), 1.25, 1.02, 0, bed);
  bedroom.add(bed);
  const nightstand = box(0.8, 0.8, 0.7, std(0xe9e3d6), 13.4, 5.4, 3.1, bedroom);
  mesh(new THREE.CylinderGeometry(0.06, 0.12, 0.45, 12), std(0xc9a35b, { metalness: 0.5 }), 13.4, 6.02, 3.1, bedroom);
  mesh(new THREE.CylinderGeometry(0.18, 0.3, 0.32, 16, 1, true), std(0xfaf3e3, { emissive: 0xffd7a0, emissiveIntensity: 0.7, side: THREE.DoubleSide }), 13.4, 6.4, 3.1, bedroom);
  const bedRug = mesh(new THREE.CircleGeometry(2.6, 40), std(0xd6cbbb, { roughness: 1 }), 9.3, 5.02, 0.6, bedroom);
  bedRug.rotation.x = -Math.PI / 2;
  [[7, 8.5], [6, -8.6]].forEach(([x, z]) => {
    mesh(new THREE.CylinderGeometry(0.3, 0.24, 0.6, 12), std(0xf2efe8), x, 5.3, z, bedroom);
    mesh(new THREE.IcosahedronGeometry(0.6, 1), std(0x4e7a54, { flatShading: true }), x, 6.2, z, bedroom).scale.set(1, 1.5, 1);
  });
  // vanity mirror and a framed NYC print
  box(0.08, 2, 1.2, M.gold, 5.2, 7, 4.5, bedroom);
  mesh(new THREE.PlaneGeometry(1.05, 1.85), std(0xcfd8e2, { roughness: 0.05, metalness: 0.9 }), 5.26, 7, 4.5, bedroom).rotation.y = Math.PI / 2;
  // Shiqi on the bed with the laptop
  const meBed = makeShiqi({ hands: "lap" });
  meBed.position.set(10.75, 5.98, 0.6);
  meBed.rotation.y = -Math.PI / 2;
  bedroom.add(meBed);
  const laptop = new THREE.Group();
  laptop.position.set(10.27, 6.1, 0.6);
  laptop.rotation.y = -Math.PI / 2;
  const alu = std(0xd2d5d9, { metalness: 0.6, roughness: 0.35 });
  box(0.62, 0.025, 0.42, alu, 0, 0, 0, laptop);
  const lid = new THREE.Group();
  lid.position.set(0, 0.012, 0.21);
  lid.rotation.x = 1.85;
  box(0.62, 0.015, 0.42, alu, 0, 0, -0.21, lid);
  const screenCanvas = document.createElement("canvas");
  screenCanvas.width = 640; screenCanvas.height = 430;
  const screenTex = new THREE.CanvasTexture(screenCanvas);
  screenTex.colorSpace = S;
  const screen = mesh(new THREE.PlaneGeometry(0.58, 0.39), new THREE.MeshBasicMaterial({ map: screenTex }), 0, -0.009, -0.21, lid);
  screen.rotation.x = Math.PI / 2;
  laptop.add(lid);
  bedroom.add(laptop);

  // ================= NEIGHBORHOOD (Forest Hills) =================
  {
    const houseGeo = new THREE.BoxGeometry(1, 1, 1);
    const roofGeo = new THREE.ConeGeometry(0.75, 0.6, 4);
    roofGeo.rotateY(Math.PI / 4);
    const list = [];
    for (let z = 50; z < 380; z += 22) for (let x = -220; x <= 220; x += 18) {
      if (rnd() < 0.25) continue;
      list.push([x + rnd() * 4, z + rnd() * 4, 7 + rnd() * 4, 5 + rnd() * 3]);
    }
    for (let x = -220; x <= 220; x += 22) if (Math.abs(x) > 40) list.push([x, -10, 9, 6]);
    const walls = new THREE.InstancedMesh(houseGeo, std(0xffffff, { map: brickTex(), roughness: 1 }), list.length);
    const roofs = new THREE.InstancedMesh(roofGeo, M.roof, list.length);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion();
    list.forEach(([x, z, w, h], i) => {
      m4.compose(V(x, h / 2, z), q, V(w, h, w * 0.8)); walls.setMatrixAt(i, m4);
      m4.compose(V(x, h + w * 0.25, z), q, V(w, w * 0.8, w * 0.8)); roofs.setMatrixAt(i, m4);
    });
    scene.add(walls, roofs);
    const treeGeo = new THREE.IcosahedronGeometry(1, 0);
    const trees = new THREE.InstancedMesh(treeGeo, std(0x4c6a47, { flatShading: true }), mobile ? 300 : 700);
    for (let i = 0; i < trees.count; i++) {
      const x = (rnd() - 0.5) * 520, z = 30 + rnd() * 380;
      if (Math.abs(x) < 26 && z < 45) { i--; continue; }
      const s = 3 + rnd() * 3;
      m4.compose(V(x, s, z), q, V(s, s * 1.2, s)); trees.setMatrixAt(i, m4);
    }
    scene.add(trees);
  }

  // ================= MANHATTAN =================
  const city = new THREE.Group();
  scene.add(city);
  const PARK = { x0: -36, x1: 36, z0: 430, z1: 670 };
  const park = mesh(new THREE.PlaneGeometry(PARK.x1 - PARK.x0, PARK.z1 - PARK.z0), std(0x4d6b43, { roughness: 1 }), 0, 0.05, (PARK.z0 + PARK.z1) / 2, city);
  park.rotation.x = -Math.PI / 2;
  const lake = mesh(new THREE.CircleGeometry(14, 32), std(0x6f8fa8, { roughness: 0.1, metalness: 0.3 }), -6, 0.1, 520, city);
  lake.rotation.x = -Math.PI / 2;
  lake.scale.set(1, 2.2, 1);
  {
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion();
    const pt = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), std(0x4f7a46, { flatShading: true }), mobile ? 260 : 600);
    for (let i = 0; i < pt.count; i++) {
      const x = PARK.x0 + 2 + rnd() * (PARK.x1 - PARK.x0 - 4), z = PARK.z0 + 2 + rnd() * (PARK.z1 - PARK.z0 - 4);
      if (((x + 6) / 14) ** 2 + ((z - 520) / 30) ** 2 < 1) { i--; continue; }
      const s = 1.6 + rnd() * 1.8;
      m4.compose(V(x, s, z), q, V(s, s * 1.1, s)); pt.setMatrixAt(i, m4);
    }
    city.add(pt);
    // blocks around the park and midtown
    const wTex = windowsTex();
    wTex.wrapS = wTex.wrapT = THREE.RepeatWrapping;
    const bmat = new THREE.MeshStandardMaterial({ color: 0x7d8594, map: wTex, emissive: 0xffffff, emissiveMap: wTex, emissiveIntensity: 0.55, roughness: 0.8 });
    const blds = [];
    for (let z = 380; z < 980; z += 16) for (let x = -300; x <= 300; x += 16) {
      const inPark = x > PARK.x0 - 8 && x < PARK.x1 + 8 && z > PARK.z0 - 8 && z < PARK.z1 + 8;
      if (inPark || rnd() < 0.12) continue;
      const mid = z > PARK.z1 + 10;
      const h = mid ? 30 + rnd() * 90 : 18 + rnd() * 30;
      blds.push([x, z, 10 + rnd() * 3, h]);
    }
    const im = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), bmat, blds.length);
    blds.forEach(([x, z, w, h], i) => { m4.compose(V(x, h / 2, z), q, V(w, h, w)); im.setMatrixAt(i, m4); });
    city.add(im);
    // Billionaires' Row: slender supertalls just south of the park
    const towerMat = new THREE.MeshStandardMaterial({ color: 0xbfc6cf, map: wTex, emissive: 0xffffff, emissiveMap: wTex, emissiveIntensity: 0.6, roughness: 0.35, metalness: 0.3 });
    const row = [[-44, 690, 9, 165], [-22, 684, 8, 205], [-2, 692, 9, 180], [40, 688, 8, 172], [60, 694, 10, 150]];
    row.forEach(([x, z, w, h]) => { box(w, h, w, towerMat, x, h / 2, z, city); box(w * 0.7, 6, w * 0.7, std(0x2b3036), x, h + 3, z, city); });
    // the tall slanted one (stepped, feathered taper on one side)
    const slant = new THREE.Group();
    slant.position.set(18, 0, 686);
    const SEG = 16, H = 260, W = 7.5, D0 = 12;
    for (let i = 0; i < SEG; i++) {
      const t = i / SEG, d = D0 * (1 - Math.pow(t, 1.6) * 0.92), h = H / SEG;
      box(W, h * 0.98, d, towerMat, 0, i * h + h / 2, (D0 - d) / 2, slant);
    }
    box(0.4, 18, 0.4, std(0xffe2a8, { emissive: 0xffd27a, emissiveIntensity: 1 }), 0, H + 9, D0 / 2 - 0.3, slant);
    city.add(slant);
    // a spire tower further downtown
    box(16, 180, 16, towerMat, -40, 90, 860, city);
    box(10, 30, 10, towerMat, -40, 195, 860, city);
    mesh(new THREE.ConeGeometry(2, 40, 8), std(0xe9eef4, { emissive: 0xffffff, emissiveIntensity: 0.4 }), -40, 230, 860, city);
  }

  // ================= batch static meshes =================
  const keep = new Set([book, sketch, chand, mailbox, laptop, letter, ...builds, ...certFrames.map((f) => f.userData.face)]);
  scene.add(bake(house, keep));
  scene.add(bake(city, new Set()));

  // ================= drone =================
  const drone = makeDrone();
  scene.add(drone);

  // lasers for the contact scene
  const laserMat = new THREE.LineBasicMaterial({ color: 0x7dffd0, transparent: true, opacity: 0.85, fog: false });
  const laserGeo = new THREE.BufferGeometry();
  laserGeo.setAttribute("position", new THREE.Float32BufferAttribute(new Array(24).fill(0), 3));
  const lasers = new THREE.LineSegments(laserGeo, laserMat);
  lasers.frustumCulled = false;
  lasers.visible = false;
  scene.add(lasers);
  const beams = [];
  for (let i = 0; i < 8; i++) {
    const glow = i >= 4;
    const b = new THREE.Mesh(new THREE.CylinderGeometry(glow ? 0.07 : 0.018, glow ? 0.07 : 0.018, 1, 8, 1, true),
      new THREE.MeshBasicMaterial({ color: glow ? 0x3dffc0 : 0xb8ffe6, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
    b.userData.glow = glow;
    b.visible = false;
    b.frustumCulled = false;
    scene.add(b);
    beams.push(b);
  }
  // each glow beam shadows a core beam
  const beamPairs = beams.slice(0, 4).map((b, i) => [b, beams[i + 4]]);

  function resize(w, h) {
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = w / h < 0.9 ? 68 : 50;
    camera.updateProjectionMatrix();
  }

  return {
    THREE, renderer, scene, camera, drone, resize,
    objects: { beams: beamPairs.flat(), bookHalo, letter, letterCanvas, letterTex, book, bookMat, sketch, builds, certFrames, laptop, screenCanvas, screenTex, screen, lasers, laserGeo, meDesk, meBed, mailbox, flag, chand },
    anchors: { benchTop },
  };
}
