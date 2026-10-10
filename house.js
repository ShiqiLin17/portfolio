// The house: a Forest Hills Gardens Tudor Revival mansion (brick ground floor,
// half-timbered stucco above, steep slate gables, clustered chimneys, leaded
// casement windows) dressed for the holidays the Dyker Heights way: giant
// nutcrackers, lit reindeer, icicle lights, a lit tree and a wreath.
// Inside: a double-height foyer with a grand stair, a living room and dining
// room, and upstairs Shiqi's study (library, fireplace, workshop corner,
// certificate wall) and bedroom.
//
// Local frame: x across the front (-14 study side .. +14 bedroom side),
// z front (+10) to back (-10), y up. Ground floor 0..5, upper 5..10.
import { THREE, std, glow, basic, mesh, box, cyl, sph, group, V, tbox, trs, instanced, bulbs, canvasTex, dotTex, rnd, reseed, range, bake } from "./util.js";
import * as T from "./textures.js";
import { makeShiqi, makeCat, chesterfield, chair, plant, tableLamp, bookRow } from "./props.js";

const DS = THREE.DoubleSide;

export function buildHouse({ mobile = false } = {}) {
  reseed(9001);
  const root = new THREE.Group();
  const upd = [];
  const keep = new Set();
  const lights = [];

  // ---------- materials
  const tiled = (tex, o = {}) => { const t = tex.clone(); t.needsUpdate = true; t.wrapS = t.wrapT = THREE.RepeatWrapping; return std(0xffffff, { map: t, ...o }); };
  const M = {
    brick: std(0xffffff, { map: T.brick(), roughness: 0.92 }),
    timber: std(0xffffff, { map: T.timber(), roughness: 0.95 }),
    slate: std(0xffffff, { map: T.slate(), roughness: 0.7, metalness: 0.05 }),
    lime: std(0xffffff, { map: T.limestone(), roughness: 0.85 }),
    plaster: std(0xf1ebdf, { roughness: 0.95 }),
    plasterBlue: std(0xdfe5e8, { roughness: 0.95 }),
    sageWall: std(0xffffff, { map: T.damask("#7c9884", "#86a28e"), roughness: 0.95 }),
    walnut: std(0xffffff, { map: T.walnutPanel(), roughness: 0.6 }),
    creamPanel: std(0xffffff, { map: T.paintedPanel("#efe8da"), roughness: 0.8 }),
    whitePanel: std(0xffffff, { map: T.paintedPanel("#f3f1ec"), roughness: 0.8 }),
    trim: std(0xf6f2e9, { roughness: 0.6 }),
    oak: std(0x6b4a30, { roughness: 0.55 }),
    darkWood: std(0x3a2618, { roughness: 0.5 }),
    walnutWood: std(0x4a2f1b, { roughness: 0.45 }),
    beam: std(0x3b2a1d, { roughness: 0.8 }),
    brass: std(0xc9a35b, { metalness: 0.85, roughness: 0.25 }),
    iron: std(0x1d1f22, { metalness: 0.6, roughness: 0.5 }),
    marble: std(0xffffff, { map: T.marbleFloor(), roughness: 0.18, metalness: 0.05 }),
    whiteMarble: std(0xf1eee8, { roughness: 0.2 }),
    herring: std(0xffffff, { map: T.herringbone(), roughness: 0.5 }),
    planks: std(0xffffff, { map: T.oakPlanks(), roughness: 0.55 }),
    leather: std(0x5b2a1c, { roughness: 0.45 }),
    greenLeather: std(0x2f4f3f, { roughness: 0.5 }),
    velvet: std(0x2f5a4b, { roughness: 0.9 }),
    linen: std(0xf3efe6, { roughness: 1 }),
    sage: std(0x8fb3a0, { roughness: 1 }),
    oat: std(0xd9ccb4, { roughness: 1 }),
    lawn: std(0x2e4429, { roughness: 1 }),
    hedge: std(0x2f4a2c, { flatShading: true, roughness: 1 }),
    path: std(0x9a958c, { roughness: 1 }),
    asphalt: std(0x2c2d33, { roughness: 0.4, metalness: 0.05 }),
    concrete: std(0x8e8b86, { roughness: 1 }),
    copper: std(0x6f9183, { metalness: 0.4, roughness: 0.6 }),
  };
  const glassMat = (() => {
    const tex = canvasTex(128, 256, (g, w, h) => {
      g.clearRect(0, 0, w, h);
      g.fillStyle = "rgba(255,226,170,.10)"; g.fillRect(0, 0, w, h);
      g.strokeStyle = "rgba(25,22,20,1)"; g.lineWidth = 3;
      const s = 32;
      for (let k = -h; k < w + h; k += s) { g.beginPath(); g.moveTo(k, 0); g.lineTo(k + h * 0.6, h); g.stroke(); g.beginPath(); g.moveTo(k, 0); g.lineTo(k - h * 0.6, h); g.stroke(); }
    }, [1, 1]);
    return new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 0.15, metalness: 0.1, emissive: 0xffb866, emissiveIntensity: 0.12, side: DS, depthWrite: false });
  })();
  const glowGlass = std(0xffffff, { map: T.leaded(true), emissive: 0xffc27a, emissiveMap: T.leaded(true), emissiveIntensity: 1.1, roughness: 0.3 });

  // ---------- walls with openings, skinned on each side
  // axis "x": wall in the x-direction at z = at, faces +z/-z. axis "z": wall at x = at, faces +x/-x.
  function wall({ axis, at, a0, a1, y0, y1, t = 0.3, holes = [], pos, neg, parent = root }) {
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
        const len = s1 - s0, hgt = top - b, cy = b + hgt / 2;
        if (axis === "x") box(len, hgt, t, M.plaster, mid, cy, at, parent);
        else box(t, hgt, len, M.plaster, at, cy, mid, parent);
        [[pos, 1], [neg, -1]].forEach(([skin, sgn]) => {
          if (!skin) return;
          const [mat, tu, tv, ox = 0, oy = 0] = skin;
          const g = new THREE.PlaneGeometry(len, hgt);
          const uv = g.attributes.uv;
          for (let k = 0; k < uv.count; k++) {
            const u = uv.getX(k), v = uv.getY(k);
            uv.setXY(k, ((axis === "x" ? s0 : -s1) * (axis === "x" ? 1 : 1) + u * len) / tu * (axis === "x" ? sgn : -sgn) + ox, (b + v * hgt) / tv + oy);
          }
          const p = mesh(g, mat, 0, cy, 0, parent);
          if (axis === "x") { p.position.set(mid, cy, at + sgn * (t / 2 + 0.006)); if (sgn < 0) p.rotation.y = Math.PI; }
          else { p.position.set(at + sgn * (t / 2 + 0.006), cy, mid); p.rotation.y = sgn > 0 ? Math.PI / 2 : -Math.PI / 2; }
        });
      });
    }
  }
  const BR = [M.brick, 1.2, 1.2], TM = [M.timber, 4, 5, 0, 0], PL = [M.plaster, 1, 1], PB = [M.plasterBlue, 1, 1], SG = [M.sageWall, 0.8, 0.8];

  // ---------- floors and ceilings
  box(10, 0.2, 20, M.marble, 0, -0.1, 0, root); // marble map spans the whole foyer
  tbox(9, 0.2, 20, M.planks, -9.5, -0.1, 0, root, 2);
  tbox(9, 0.2, 20, M.planks, 9.5, -0.1, 0, root, 2);
  tbox(9, 0.25, 20, M.herring, -9.5, 4.9, 0, root, 2); // study
  tbox(9, 0.25, 20, M.planks, 9.5, 4.9, 0, root, 2); // bedroom
  tbox(10, 0.25, 2.2, M.planks, 0, 4.9, -8.9, root, 2); // landing
  box(9.2, 0.15, 20, M.plaster, -9.5, 4.72, 0, root); // ground-floor ceilings
  box(9.2, 0.15, 20, M.plaster, 9.5, 4.72, 0, root);
  box(28.6, 0.3, 20.6, M.plaster, 0, 10.15, 0, root);
  // coffered ceilings (foyer, study, living)
  const coffer = (x0, x1, z0, z1, y, step, mat) => {
    for (let x = x0; x <= x1 + 1e-6; x += step) box(0.22, 0.28, z1 - z0, mat, x, y - 0.14, (z0 + z1) / 2, root);
    for (let z = z0; z <= z1 + 1e-6; z += step) box(x1 - x0, 0.28, 0.22, mat, (x0 + x1) / 2, y - 0.14, z, root);
  };
  coffer(-4.8, 4.8, -9.8, 9.8, 10, 2.4, M.trim);
  coffer(-13.8, -5.2, -9.8, 9.8, 10, 2.15, M.beam);
  coffer(-13.8, -5.2, -9.8, 9.8, 4.65, 2.15, M.beam);

  // ---------- exterior + interior walls
  const FRONT_HOLES_G = [{ a0: -1.5, a1: 1.5, y0: 0, y1: 3.9 }, { a0: -11.4, a1: -7.6, y0: 1, y1: 3.8 }, { a0: 7.6, a1: 11.4, y0: 1, y1: 3.8 }, { a0: -4.2, a1: -3, y0: 1.2, y1: 3.6 }, { a0: 3, a1: 4.2, y0: 1.2, y1: 3.6 }];
  const FRONT_HOLES_U = [{ a0: -11.6, a1: -7.4, y0: 6, y1: 9.1 }, { a0: 7.4, a1: 11.6, y0: 6, y1: 9.1 }, { a0: -2.6, a1: 2.6, y0: 5.4, y1: 9.6 }];
  wall({ axis: "x", at: 10, a0: -14, a1: 14, y0: 0, y1: 5, holes: FRONT_HOLES_G, pos: BR, neg: null });
  wall({ axis: "x", at: 10, a0: -14, a1: 14, y0: 5, y1: 10, holes: FRONT_HOLES_U, pos: TM, neg: null });
  wall({ axis: "x", at: -10, a0: -14, a1: 14, y0: 0, y1: 5, holes: [{ a0: -11, a1: -8, y0: 1, y1: 3.7 }, { a0: 8, a1: 11, y0: 1, y1: 3.7 }, { a0: -1, a1: 1, y0: 0, y1: 2.8 }], neg: BR, pos: null });
  wall({ axis: "x", at: -10, a0: -14, a1: 14, y0: 5, y1: 10, holes: [{ a0: -1.5, a1: 1.5, y0: 6, y1: 9.2 }, { a0: 8.5, a1: 11, y0: 6, y1: 9 }], neg: TM, pos: null });
  wall({ axis: "z", at: -14, a0: -10, a1: 10, y0: 0, y1: 5, holes: [{ a0: -6, a1: -3, y0: 1, y1: 3.7 }, { a0: 6.6, a1: 8.4, y0: 1, y1: 3.7 }], neg: BR, pos: null });
  wall({ axis: "z", at: -14, a0: -10, a1: 10, y0: 5, y1: 10, holes: [{ a0: 6.9, a1: 8.7, y0: 6.2, y1: 8.8 }], neg: TM, pos: null });
  wall({ axis: "z", at: 14, a0: -10, a1: 10, y0: 0, y1: 5, holes: [{ a0: -6, a1: -3, y0: 1, y1: 3.7 }, { a0: 3, a1: 6, y0: 1, y1: 3.7 }], pos: BR, neg: null });
  wall({ axis: "z", at: 14, a0: -10, a1: 10, y0: 5, y1: 10, holes: [{ a0: 4, a1: 7, y0: 6, y1: 9 }], pos: TM, neg: null });
  // interior skins on the exterior walls
  const skinIn = (axis, at, a0, a1, y0, y1, sgn, mat, holes = []) => wall({ axis, at: at + sgn * 0.17, a0, a1, y0, y1, t: 0.02, holes, pos: sgn > 0 ? mat : null, neg: sgn < 0 ? mat : null });
  skinIn("x", 10, -5, 5, 0, 10, -1, PL, [...FRONT_HOLES_G, ...FRONT_HOLES_U].filter((h) => h.a1 > -5 && h.a0 < 5));
  skinIn("x", 10, -14, -5, 0, 5, -1, PL, FRONT_HOLES_G);
  skinIn("x", 10, 5, 14, 0, 5, -1, PL, FRONT_HOLES_G);
  skinIn("x", 10, -14, -5, 5, 10, -1, SG, FRONT_HOLES_U);
  skinIn("x", 10, 5, 14, 5, 10, -1, PB, FRONT_HOLES_U);
  skinIn("x", -10, -5, 5, 0, 10, 1, PL, [{ a0: -1, a1: 1, y0: 0, y1: 2.8 }, { a0: -1.5, a1: 1.5, y0: 6, y1: 9.2 }]);
  skinIn("x", -10, -14, -5, 0, 5, 1, PL, [{ a0: -11, a1: -8, y0: 1, y1: 3.7 }]);
  skinIn("x", -10, 5, 14, 0, 5, 1, PL, [{ a0: 8, a1: 11, y0: 1, y1: 3.7 }]);
  skinIn("x", -10, -14, -5, 5, 10, 1, SG);
  skinIn("x", -10, 5, 14, 5, 10, 1, PB, [{ a0: 8.5, a1: 11, y0: 6, y1: 9 }]);
  skinIn("z", -14, -10, 10, 0, 5, 1, PL, [{ a0: -6, a1: -3, y0: 1, y1: 3.7 }, { a0: 6.6, a1: 8.4, y0: 1, y1: 3.7 }]);
  skinIn("z", -14, -10, 10, 5, 10, 1, SG, [{ a0: 6.9, a1: 8.7, y0: 6.2, y1: 8.8 }]);
  skinIn("z", 14, -10, 10, 0, 5, -1, PL, [{ a0: -6, a1: -3, y0: 1, y1: 3.7 }, { a0: 3, a1: 6, y0: 1, y1: 3.7 }]);
  skinIn("z", 14, -10, 10, 5, 10, -1, PB, [{ a0: 4, a1: 7, y0: 6, y1: 9 }]);
  // partitions: ground floor archways, upper floor doors to the landing
  wall({ axis: "z", at: -5, a0: -10, a1: 10, y0: 0, y1: 5, holes: [{ a0: -2, a1: 5, y0: 0, y1: 3.6 }], pos: PL, neg: PL });
  wall({ axis: "z", at: 5, a0: -10, a1: 10, y0: 0, y1: 5, holes: [{ a0: -2, a1: 5, y0: 0, y1: 3.6 }], pos: PL, neg: PL });
  wall({ axis: "z", at: -5, a0: -10, a1: 10, y0: 5, y1: 10, holes: [{ a0: -9.3, a1: -7.1, y0: 5, y1: 8 }], pos: PL, neg: SG });
  wall({ axis: "z", at: 5, a0: -10, a1: 10, y0: 5, y1: 10, holes: [{ a0: -9.3, a1: -7.1, y0: 5, y1: 8 }], pos: PB, neg: PL });
  // arch heads over the archways and door casings
  [-5, 5].forEach((x) => {
    const arch = mesh(new THREE.TorusGeometry(3.5, 0.18, 8, 30, Math.PI), M.trim, x, 3.4, 1.5, root);
    arch.rotation.y = Math.PI / 2; arch.scale.set(1, 0.18, 1);
    [-2, 5].forEach((z) => box(0.45, 3.6, 0.3, M.trim, x, 1.8, z, root));
    [-9.3, -7.1].forEach((z) => box(0.4, 3.1, 0.2, M.trim, x, 6.55, z, root));
    box(0.4, 0.25, 2.6, M.trim, x, 8.1, -8.2, root);
  });

  // ---------- wainscoting, baseboards, chair rails, crown moldings
  const wains = (axis, at, a0, a1, y0, h, mat, sgn) => {
    const p = tbox(axis === "x" ? a1 - a0 : 0.05, h, axis === "x" ? 0.05 : a1 - a0, mat, axis === "x" ? (a0 + a1) / 2 : at + sgn * 0.2, y0 + h / 2, axis === "x" ? at + sgn * 0.2 : (a0 + a1) / 2, root, 1.2);
    box(axis === "x" ? a1 - a0 : 0.08, 0.08, axis === "x" ? 0.08 : a1 - a0, M.trim, axis === "x" ? (a0 + a1) / 2 : at + sgn * 0.22, y0 + h, axis === "x" ? at + sgn * 0.22 : (a0 + a1) / 2, root);
    box(axis === "x" ? a1 - a0 : 0.06, 0.18, axis === "x" ? 0.06 : a1 - a0, mat === M.walnut ? M.walnutWood : M.trim, axis === "x" ? (a0 + a1) / 2 : at + sgn * 0.23, y0 + 0.09, axis === "x" ? at + sgn * 0.23 : (a0 + a1) / 2, root);
  };
  // foyer
  wains("z", -5, -10, -2, 0, 1.3, M.creamPanel, 1); wains("z", -5, 5, 10, 0, 1.3, M.creamPanel, 1);
  wains("z", 5, -10, -2, 0, 1.3, M.creamPanel, -1); wains("z", 5, 5, 10, 0, 1.3, M.creamPanel, -1);
  wains("x", 10, -5, -1.5, 0, 1.3, M.creamPanel, -1); wains("x", 10, 1.5, 5, 0, 1.3, M.creamPanel, -1);
  // study (walnut)
  wains("z", -14, 1.6, 10, 5, 1.4, M.walnut, 1);
  wains("x", 10, -14, -5, 5, 1.0, M.walnut, -1);
  wains("z", -5, -7, 10, 5, 1.4, M.walnut, -1);
  // bedroom (white)
  wains("z", 5, -7, 10, 5, 1.2, M.whitePanel, 1); wains("x", -10, 5, 14, 5, 1.2, M.whitePanel, 1); wains("x", 10, 5, 14, 5, 1.0, M.whitePanel, -1);
  // crown moldings
  [[0, 9.82, 9.65, 10, 0.3], [0, 9.82, -9.65, 10, 0.3]].forEach(([x, y, z, w, d]) => box(w, 0.36, d, M.trim, x, y, z, root));
  [-14, 14].forEach((x) => box(0.3, 0.36, 19.4, M.trim, x - Math.sign(x) * 0.33, 9.82, 0, root));

  // ---------- windows: stone surrounds, mullions, leaded glass (see-through), casements that open
  const opening = {};
  function windowSet(name, face, a0, a1, y0, y1, { arched = false, lights = 3, parent = root, out = 1 } = {}) {
    // face: "front" (z=10, out +z), "back" (z=-10), "left" (x=-14, out -x), "right" (x=14)
    const g = new THREE.Group();
    parent.add(g);
    const w = a1 - a0, h = y1 - y0, c = (a0 + a1) / 2;
    if (face === "front") g.position.set(c, y0, 10);
    if (face === "back") { g.position.set(c, y0, -10); g.rotation.y = Math.PI; }
    if (face === "left") { g.position.set(-14, y0, -c); g.rotation.y = -Math.PI / 2; }
    if (face === "right") { g.position.set(14, y0, c); g.rotation.y = Math.PI / 2; }
    if (face === "left") g.position.z = c;
    // stone surround (outside)
    box(w + 0.5, 0.28, 0.5, M.lime, 0, -0.1, 0.12, g);
    box(w + 0.6, 0.32, 0.42, M.lime, 0, h + 0.14, 0.1, g);
    [-1, 1].forEach((s) => box(0.24, h, 0.42, M.lime, s * (w / 2 + 0.12), h / 2, 0.08, g));
    // mullions
    const leaves = [];
    for (let i = 1; i < lights; i++) box(0.14, h, 0.3, M.lime, -w / 2 + (w * i) / lights, h / 2, 0.02, g);
    const pw = w / lights;
    for (let i = 0; i < lights; i++) {
      const hinge = new THREE.Group();
      const left = i % 2 === 0;
      hinge.position.set(-w / 2 + pw * i + (left ? 0.07 : pw - 0.07), 0, 0.02);
      g.add(hinge);
      const paneW = pw - 0.14;
      const pane = mesh(new THREE.PlaneGeometry(paneW, h - 0.06), glassMat, (left ? 1 : -1) * paneW / 2, h / 2, 0, hinge);
      box(paneW, 0.05, 0.05, M.iron, (left ? 1 : -1) * paneW / 2, 0.03, 0, hinge);
      box(paneW, 0.05, 0.05, M.iron, (left ? 1 : -1) * paneW / 2, h - 0.03, 0, hinge);
      [0.02, paneW - 0.02].forEach((xx) => box(0.05, h, 0.05, M.iron, (left ? 1 : -1) * xx, h / 2, 0, hinge));
      hinge.userData = { left };
      leaves.push(hinge);
      keep.add(hinge);
    }
    if (arched) {
      const a = mesh(new THREE.TorusGeometry(w / 2 + 0.12, 0.2, 8, 28, Math.PI), M.lime, 0, h, 0.1, g);
      a.scale.set(1, 0.42, 1);
      const fill = mesh(new THREE.CircleGeometry(w / 2, 28, 0, Math.PI), glassMat, 0, h, 0.02, g);
      fill.scale.set(1, 0.42, 1);
      // keystone
      box(0.5, 0.7, 0.4, M.lime, 0, h + (w / 2) * 0.42 + 0.1, 0.12, g);
    }
    // window boxes with garlands and a wreath (Dyker style)
    if (y0 > 5) {
      box(w * 0.9, 0.35, 0.45, M.darkWood, 0, -0.42, 0.42, g);
      for (let k = 0; k < 12; k++) sph(0.16, M.hedge, -w * 0.42 + (k / 11) * w * 0.84, -0.18, 0.42, g, 5);
    }
    opening[name] = { leaves, open: 0 };
    return g;
  }
  windowSet("living", "front", -11.4, -7.6, 1, 3.8);
  windowSet("dining", "front", 7.6, 11.4, 1, 3.8);
  windowSet("sideL", "front", -4.2, -3, 1.2, 3.6, { lights: 1 });
  windowSet("sideR", "front", 3, 4.2, 1.2, 3.6, { lights: 1 });
  windowSet("study", "front", -11.6, -7.4, 6, 9.1);
  windowSet("bedroom", "front", 7.4, 11.6, 6, 9.1);
  windowSet("arch", "front", -2.6, 2.6, 5.4, 9.6, { arched: true, lights: 2 });
  windowSet("bedSide", "right", 4, 7, 6, 9, { lights: 2 });
  windowSet("stair", "back", -1.5, 1.5, 6, 9.2, { lights: 2, arched: true });
  windowSet("studySide", "left", 6.9, 8.7, 6.2, 8.8, { lights: 1 });
  windowSet("livingSide", "left", -6, -3, 1, 3.7, { lights: 2 });
  windowSet("diningSide", "right", -6, -3, 1, 3.7, { lights: 2 });
  windowSet("diningSide2", "right", 3, 6, 1, 3.7, { lights: 2 });
  windowSet("backL", "back", 8, 11, 1, 3.7);
  windowSet("backR", "back", -11, -8, 1, 3.7);
  windowSet("bedBack", "back", -11, -8.5, 6, 9, { lights: 2 });

  // ---------- front door: oak double doors under a Tudor arch
  const doors = [];
  {
    const g = group(0, 0, 10, root);
    // limestone Tudor-arch surround
    [-1, 1].forEach((s) => box(0.5, 4.1, 0.6, M.lime, s * 1.75, 2.05, 0.15, g));
    const a = mesh(new THREE.TorusGeometry(1.75, 0.28, 8, 24, Math.PI), M.lime, 0, 3.85, 0.15, g);
    a.scale.set(1, 0.38, 1);
    box(4.4, 0.5, 0.7, M.lime, 0, 4.75, 0.18, g);
    // steps
    for (let i = 0; i < 3; i++) box(5 - i * 0.6, 0.18, 1.1, M.lime, 0, 0.09 + i * 0.18 - 0.54, 1.5 - i * 0.55 + 0.6, g);
    const oak = std(0x5a3a22, { roughness: 0.55 });
    [-1, 1].forEach((s) => {
      const hinge = group(s * 1.5, 0, -0.05, g);
      const leaf = box(1.48, 3.86, 0.12, oak, -s * 0.74, 1.93, 0, hinge);
      for (let k = 0; k < 6; k++) box(0.04, 3.6, 0.13, std(0x4a2f1b), -s * (0.12 + k * 0.24), 1.93, 0.01, hinge);
      [0.9, 2.9].forEach((y) => box(1.2, 0.08, 0.15, M.iron, -s * 0.7, y, 0.02, hinge));
      sph(0.06, M.brass, -s * 1.3, 1.9, 0.12, hinge, 10);
      doors.push(hinge);
      keep.add(hinge);
    });
    // lanterns either side
    [-1, 1].forEach((s) => {
      const l = group(s * 2.45, 2.9, 0.35, g);
      box(0.3, 0.5, 0.3, M.iron, 0, 0, 0, l);
      box(0.24, 0.4, 0.24, glow(0xffc983, 2.2), 0, 0, 0, l);
      mesh(new THREE.ConeGeometry(0.24, 0.25, 4), M.iron, 0, 0.36, 0, l).rotation.y = Math.PI / 4;
    });
    // the big lit wreath over the door
    const wr = mesh(new THREE.TorusGeometry(0.75, 0.22, 10, 28), std(0x2f5a3e, { flatShading: true, roughness: 1 }), 0, 5.3, 0.45, g);
    const pts = []; for (let i = 0; i < 26; i++) { const t = (i / 26) * Math.PI * 2; pts.push([Math.cos(t) * 0.75, 5.3 + Math.sin(t) * 0.75, 0.68]); }
    g.add(bulbs(pts, 0xfff0c8, 0.045, 4));
    box(0.5, 0.35, 0.1, std(0xa32a2a), 0, 4.55, 0.68, g);
  }

  // ---------- roofs: steep slate gables, half-timbered gable ends, bargeboards, finials
  function gable({ cx, cz, span, length, base, pitch = 1, axis = "x", endFront = false, endBack = false }) {
    // ridge along `axis`. span is the width across the ridge.
    const half = span / 2, rise = half * pitch, slope = Math.hypot(half, rise), ang = Math.atan2(rise, half);
    const g = group(cx, base, cz, root);
    if (axis === "z") g.rotation.y = Math.PI / 2;
    [-1, 1].forEach((s) => {
      const p = tbox(length + 0.8, 0.3, slope + 0.5, M.slate, 0, rise / 2 + 0.1, s * (half / 2), g, 2);
      p.rotation.x = s * ang;
    });
    box(length + 0.8, 0.25, 0.25, std(0x2a2f36, { roughness: 0.6 }), 0, rise + 0.25, 0, g);
    // gable-end triangles with half-timbering
    const tri = (x, flip) => {
      const shape = new THREE.Shape([new THREE.Vector2(-half, 0), new THREE.Vector2(half, 0), new THREE.Vector2(0, rise)]);
      const geo = new THREE.ShapeGeometry(shape);
      const uv = geo.attributes.uv, pos = geo.attributes.position;
      for (let i = 0; i < uv.count; i++) uv.setXY(i, pos.getX(i) / 4, pos.getY(i) / 5);
      const m = mesh(geo, M.timber, x, 0, 0, g);
      m.rotation.y = flip ? -Math.PI / 2 : Math.PI / 2;
      m.material.side = DS;
      // bargeboards and finial
      [-1, 1].forEach((s) => { const b = box(0.12, 0.35, slope + 0.6, M.beam, x + (flip ? -0.05 : 0.05), rise / 2 + 0.05, s * half / 2, g); b.rotation.x = -s * ang; });
      cyl(0.04, 0.08, 1.2, M.beam, x, rise + 0.7, 0, g, 6);
    };
    if (endFront) tri(length / 2, false);
    if (endBack) tri(-length / 2, true);
    return g;
  }
  gable({ cx: 0, cz: 0, span: 21, length: 29, base: 10, pitch: 1.05, endFront: true, endBack: true });
  gable({ cx: -9.8, cz: 7.0, span: 9, length: 8.2, base: 10, pitch: 1.2, axis: "z", endFront: true });
  gable({ cx: 9.8, cz: 7.0, span: 9, length: 8.2, base: 10, pitch: 1.2, axis: "z", endFront: true });
  gable({ cx: 0, cz: 8.5, span: 6.8, length: 5, base: 10, pitch: 1.1, axis: "z", endFront: true });
  // gutters (copper) and downspouts
  box(29.4, 0.18, 0.22, M.copper, 0, 9.98, 10.62, root);
  box(29.4, 0.18, 0.22, M.copper, 0, 9.98, -10.62, root);
  [-14.4, 14.4].forEach((x) => cyl(0.07, 0.07, 10, M.copper, x, 5, 10.5, root, 8));
  // a plinth band and a stone belt course between brick and timber
  box(28.7, 0.6, 20.7, M.lime, 0, 0.3, 0, root);
  box(28.8, 0.3, 20.8, M.lime, 0, 5.05, 0, root);
  // chimneys with clay pots
  const smokeSources = [];
  const chimney = (x, z, top, w = 1.8, d = 1.2) => {
    tbox(w, top, d, M.brick, x, top / 2, z, root, 1.2);
    tbox(w + 0.3, 0.35, d + 0.3, M.lime, x, top - 0.2, z, root, 2);
    [-0.45, 0, 0.45].forEach((o) => cyl(0.16, 0.2, 0.9, std(0xa4583a, { roughness: 0.8 }), x + o * (w / 1.8), top + 0.4, z, root, 10));
    smokeSources.push(V(x, top + 1, z));
  };
  chimney(-14.9, 4.6, 22.5);
  chimney(9.2, -6.2, 21);

  // ---------- Dyker Heights lights: roof lines, icicles, gables
  {
    const pts = [];
    const line = (a, b, n, sag = 0) => { for (let i = 0; i <= n; i++) { const t = i / n; pts.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t - Math.sin(t * Math.PI) * sag, a[2] + (b[2] - a[2]) * t]); } };
    line([-14.6, 10.1, 10.75], [14.6, 10.1, 10.75], 130);
    // front gables outlined
    [[-9.8, 9, 1.2], [9.8, 9, 1.2], [0, 6.8, 1.1]].forEach(([cx, span, p]) => {
      const rise = (span / 2) * p, z = cx === 0 ? 11.1 : 11.2;
      line([cx - span / 2, 10.2, z], [cx, 10.2 + rise + 0.2, z], 30);
      line([cx, 10.2 + rise + 0.2, z], [cx + span / 2, 10.2, z], 30);
    });
    // icicle lights hanging from the eaves
    for (let x = -14.4; x <= 14.4; x += 0.35) { const len = 0.25 + ((x * 7.3) % 1 + 1) % 1 * 0.6; for (let k = 1; k <= 3; k++) pts.push([x, 10.05 - (len * k) / 3, 10.8]); }
    // door and window outlines
    line([-2.2, 0.6, 10.55], [-2.2, 4.4, 10.55], 18); line([2.2, 0.6, 10.55], [2.2, 4.4, 10.55], 18);
    const lt = bulbs(pts, 0xfff0d0, 0.05, 3.2);
    root.add(lt);
    const colored = [];
    for (let i = 0; i < 160; i++) { const t = i / 160; colored.push([-14.5 + t * 29, 5.25, 10.5]); }
    const c1 = bulbs(colored.filter((_, i) => i % 3 === 0), 0xff4b3b, 0.06, 3), c2 = bulbs(colored.filter((_, i) => i % 3 === 1), 0x4bff8a, 0.06, 3), c3 = bulbs(colored.filter((_, i) => i % 3 === 2), 0x5aa8ff, 0.06, 3);
    root.add(c1, c2, c3);
    upd.push((t) => { const k = Math.floor(t * 2) % 3; [c1, c2, c3].forEach((c, i) => (c.visible = i !== k)); });
  }

  // ---------- the front yard and the street (Forest Hills Gardens, Queens)
  const yard = new THREE.Group();
  root.add(yard);
  tbox(70, 0.1, 15, M.lawn, 0, 0.0, 17.2, yard, 4);
  tbox(70, 0.1, 30, M.lawn, 0, 0.0, -25, yard, 4);
  [-24, 24].forEach((x) => tbox(20, 0.1, 22, M.lawn, x, 0, 0, yard, 4));
  // flagstone walk
  for (let z = 11.6; z < 24; z += 0.8) for (const x of [-0.7, 0.3]) { const s = box(0.95 + rnd() * 0.15, 0.08, 0.7, std(0x8f897e, { roughness: 1 }), x + rnd() * 0.15, 0.06, z, yard); s.rotation.y = (rnd() - 0.5) * 0.1; }
  // boxwood hedges along the house and the fence
  [[-8.6, 11.6, 10.4], [8.6, 11.6, 10.4], [-12.5, 23.3, 22], [12.5, 23.3, 22]].forEach(([x, z, w]) => {
    for (let k = 0; k < w / 0.7; k++) sph(0.55, M.hedge, x - w / 2 + k * 0.7 + 0.35, 0.55, z, yard, 6).scale.set(1, 0.95, 0.9);
  });
  // wrought-iron fence with brick piers and an open gate
  {
    const posts = [];
    for (let x = -34; x <= 34; x += 0.18) { if (Math.abs(x) < 1.6) continue; posts.push(trs(x, 0.75, 24, 0, 0.03, 1.5, 0.03)); }
    yard.add(instanced(new THREE.BoxGeometry(1, 1, 1), M.iron, posts));
    [0.35, 1.35].forEach((y) => { box(32.4, 0.05, 0.05, M.iron, -17.8, y, 24, yard); box(32.4, 0.05, 0.05, M.iron, 17.8, y, 24, yard); });
    const spears = posts.map((m) => { const p = new THREE.Vector3().setFromMatrixPosition(m); return trs(p.x, 1.55, p.z, 0, 1, 1, 1); });
    yard.add(instanced(new THREE.ConeGeometry(0.04, 0.12, 4), M.iron, spears));
    [-1.8, 1.8].forEach((x) => {
      tbox(0.7, 1.9, 0.7, M.brick, x, 0.95, 24, yard, 1.2);
      box(0.85, 0.15, 0.85, M.lime, x, 1.95, 24, yard);
      const l = group(x, 2.3, 24, yard);
      box(0.32, 0.45, 0.32, M.iron, 0, 0, 0, l);
      box(0.26, 0.36, 0.26, glow(0xffc983, 2.2), 0, 0, 0, l);
    });
  }
  // the mailbox (scene 3 stop): post, mailbox, red flag, "LIN"
  const mailbox = group(3.2, 0, 25.6, yard);
  {
    cyl(0.07, 0.08, 1.15, std(0x2a2522), 0, 0.58, 0, mailbox, 10);
    box(0.5, 0.12, 0.6, std(0x2a2522), 0, 1.16, 0, mailbox);
    box(0.5, 0.42, 0.9, std(0x1f3c56, { roughness: 0.35, metalness: 0.3 }), 0, 1.42, 0, mailbox);
    mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.9, 20, 1, false, 0, Math.PI), std(0x1f3c56, { roughness: 0.35, metalness: 0.3 }), 0, 1.63, 0, mailbox).rotation.set(Math.PI / 2, 0, Math.PI / 2);
    const plate = canvasTex(256, 64, (g, w, h) => { g.fillStyle = "#c9a35b"; g.fillRect(0, 0, w, h); g.fillStyle = "#1d2430"; g.font = "bold 40px Georgia"; g.textAlign = "center"; g.fillText("LIN", w / 2, 46); });
    const pl = mesh(new THREE.PlaneGeometry(0.42, 0.11), std(0xffffff, { map: plate, metalness: 0.5, roughness: 0.3 }), 0.255, 1.45, 0, mailbox);
    pl.rotation.y = Math.PI / 2;
  }
  const flag = group(-0.27, 1.4, 0.15, mailbox);
  box(0.03, 0.42, 0.04, std(0xc0392b), 0, 0.18, 0, flag);
  box(0.03, 0.12, 0.2, std(0xc0392b), 0, 0.35, 0.1, flag);
  keep.add(mailbox);
  // sidewalk, curb, street, and the far side
  tbox(70, 0.18, 4, M.concrete, 0, 0.09, 26.5, yard, 1.5);
  for (let x = -34; x <= 34; x += 1.6) box(0.02, 0.19, 4, std(0x6f6c68), x, 0.1, 26.5, yard);
  box(70, 0.22, 0.3, M.lime, 0, 0.11, 28.6, yard);
  tbox(70, 0.05, 12, M.asphalt, 0, 0.02, 34.6, yard, 4);
  tbox(70, 0.18, 4, M.concrete, 0, 0.09, 42.7, yard, 1.5);
  box(70, 0.22, 0.3, M.lime, 0, 0.11, 40.6, yard);
  // manhole with a little steam (very New York)
  cyl(0.45, 0.45, 0.03, M.iron, -6, 0.06, 33, yard, 20);
  const steamPts = [];
  // Bishop's crook lampposts (the historic NYC lamppost, still in Forest Hills Gardens)
  const lampPost = (x, z, ry) => {
    const g = group(x, 0, z, yard, ry);
    const iron = std(0x1f2a24, { metalness: 0.5, roughness: 0.5 });
    cyl(0.16, 0.22, 1.2, iron, 0, 0.6, 0, g, 10);
    cyl(0.07, 0.1, 6.6, iron, 0, 4.2, 0, g, 10);
    const crook = mesh(new THREE.TorusGeometry(0.55, 0.05, 6, 14, Math.PI), iron, 0.55, 7.5, 0, g);
    crook.rotation.z = 0; crook.scale.set(1, 0.9, 1);
    cyl(0.02, 0.02, 0.3, iron, 1.1, 7.3, 0, g, 6);
    const head = group(1.1, 6.95, 0, g);
    mesh(new THREE.CylinderGeometry(0.12, 0.3, 0.35, 6), iron, 0, 0.18, 0, head);
    mesh(new THREE.CylinderGeometry(0.28, 0.18, 0.45, 6), glow(0xffd59a, 2.6), 0, -0.2, 0, head);
    const L = new THREE.PointLight(0xffc98a, 18, 16, 2);
    L.position.set(x + Math.cos(ry) * 1.1, 6.6, z - Math.sin(ry) * 1.1);
    lights.push(L);
    return g;
  };
  lampPost(-9, 27.3, 0); lampPost(14, 27.3, Math.PI); lampPost(-20, 41.8, 0); lampPost(22, 41.8, Math.PI);
  // London plane trees along the sidewalk, wrapped in lights
  const planeTree = (x, z, s = 1) => {
    const g = group(x, 0, z, yard);
    cyl(0.18 * s, 0.28 * s, 4.2 * s, std(0x8a8270, { roughness: 1 }), 0, 2.1 * s, 0, g, 8);
    [[0, 5.6, 0, 2.6], [1.3, 5, 0.5, 1.8], [-1.2, 5.2, -0.4, 1.9], [0.3, 6.6, -0.8, 1.6]].forEach(([px, py, pz, r]) => {
      const c = sph(r * s, std(0x34502c, { flatShading: true, roughness: 1 }), px * s, py * s, pz * s, g, 6);
      c.scale.set(1, 0.85, 1);
    });
    const pts = [];
    for (let i = 0; i < 90; i++) { const t = i / 90, a = t * Math.PI * 14; pts.push([Math.cos(a) * 0.32 * s, (0.4 + t * 3.8) * s, Math.sin(a) * 0.32 * s]); }
    for (let i = 0; i < 120; i++) { const a = rnd() * 6.28, r = (1.5 + rnd() * 1.2) * s; pts.push([Math.cos(a) * r, (4.6 + rnd() * 2.2) * s, Math.sin(a) * r]); }
    g.add(bulbs(pts, 0xfff0c8, 0.045, 3));
    return g;
  };
  [-28, -16, 18, 30].forEach((x) => planeTree(x, 26.8, 1));
  [-30, -6, 8, 26].forEach((x) => planeTree(x, 42.6, 0.95));
  // fire hydrant (NYC silver with a red top)
  {
    const g = group(-5.4, 0, 27.6, yard);
    cyl(0.17, 0.2, 0.75, std(0xb9bec4, { metalness: 0.5, roughness: 0.4 }), 0, 0.38, 0, g, 12);
    sph(0.18, std(0xb7322a), 0, 0.8, 0, g, 12).scale.set(1, 0.7, 1);
    [-1, 1].forEach((s) => { const n = cyl(0.07, 0.07, 0.2, std(0xb9bec4, { metalness: 0.5 }), s * 0.2, 0.52, 0, g, 8); n.rotation.z = Math.PI / 2; });
  }
  // street sign (green blades)
  {
    const g = group(-31, 0, 27.6, yard);
    cyl(0.05, 0.05, 3.6, std(0x2a5d3b), 0, 1.8, 0, g, 8);
    const sign = (text, y, ry) => {
      const t = canvasTex(512, 96, (c, w, h) => { c.fillStyle = "#1f6b3c"; c.fillRect(0, 0, w, h); c.strokeStyle = "#fff"; c.lineWidth = 4; c.strokeRect(6, 6, w - 12, h - 12); c.fillStyle = "#fff"; c.font = "bold 54px Helvetica, Arial"; c.textAlign = "center"; c.fillText(text, w / 2, 66); });
      const m = mesh(new THREE.BoxGeometry(1.5, 0.28, 0.03), [std(0x1f6b3c), std(0x1f6b3c), std(0x1f6b3c), std(0x1f6b3c), std(0xffffff, { map: t }), std(0xffffff, { map: t })], 0, y, 0, g);
      m.rotation.y = ry;
    };
    sign("SHIQI WAY", 3.4, 0);
    sign("GREENWAY TER", 3.05, Math.PI / 2);
  }
  // parked cars (a sedan and an SUV) and a taxi that drives by
  const car = (x, z, color, parent = yard, scale = 1) => {
    const g = group(x, 0, z, parent);
    const body = std(color, { metalness: 0.6, roughness: 0.3 });
    box(4.5 * scale, 0.75, 1.85, body, 0, 0.62, 0, g);
    box(2.5 * scale, 0.65, 1.7, std(0x1b2027, { roughness: 0.1, metalness: 0.5 }), -0.15, 1.3, 0, g);
    [[-1.45, -0.85], [1.45, -0.85], [-1.45, 0.85], [1.45, 0.85]].forEach(([px, pz]) => { const w = cyl(0.36, 0.36, 0.24, std(0x111111), px * scale, 0.36, pz, g, 14); w.rotation.x = Math.PI / 2; });
    box(0.06, 0.18, 1.4, glow(0xfff2d6, 2), 2.26 * scale, 0.75, 0, g);
    box(0.06, 0.16, 1.5, glow(0xff2a1a, 2), -2.26 * scale, 0.78, 0, g);
    return g;
  };
  car(-14, 30, 0x2b3a4a); car(17, 30, 0x6b6b6b, yard, 1.05); car(-22, 39.2, 0x7a1f1f).rotation.y = Math.PI;
  const taxi = car(-60, 36.6, 0xf2b705);
  box(0.7, 0.3, 0.32, glow(0xfff4d0, 2), -0.1, 1.8, 0, taxi);
  keep.add(taxi);
  upd.push((t) => { taxi.position.x = -60 + ((t * 9) % 120); });

  // nutcrackers flanking the walk (Dyker Heights' signature)
  const nutcracker = (x, z) => {
    const g = group(x, 0, z, yard, Math.PI);
    const red = std(0xa8232a, { roughness: 0.5 }), black = std(0x15171a, { roughness: 0.4 }), goldM = std(0xd8b25a, { metalness: 0.7, roughness: 0.3 }), skin = std(0xf1d3be), white = std(0xf3f0ea);
    box(1.1, 0.25, 0.8, black, 0, 0.12, 0, g);
    [-0.25, 0.25].forEach((o) => { cyl(0.2, 0.2, 1.4, black, o, 0.95, 0, g, 12); });
    cyl(0.52, 0.48, 1.6, red, 0, 2.4, 0, g, 16);
    box(1.06, 0.18, 1.0, black, 0, 1.7, 0, g);
    sph(0.08, goldM, 0, 1.7, 0.5, g, 8);
    [-1, 1].forEach((s) => { const a = cyl(0.14, 0.14, 1.2, red, s * 0.66, 2.5, 0.05, g, 10); a.rotation.z = s * 0.2; sph(0.15, white, s * 0.78, 1.88, 0.1, g, 8); });
    for (let k = 0; k < 4; k++) box(0.6, 0.04, 0.05, goldM, 0, 2.2 + k * 0.25, 0.5, g);
    cyl(0.36, 0.38, 0.6, skin, 0, 3.55, 0, g, 16);
    box(0.5, 0.35, 0.1, white, 0, 3.32, 0.33, g);
    [-0.12, 0.12].forEach((o) => sph(0.04, black, o, 3.65, 0.36, g, 6));
    box(0.08, 0.1, 0.1, std(0xd88a7a), 0, 3.55, 0.4, g);
    cyl(0.4, 0.4, 0.95, black, 0, 4.3, 0, g, 16);
    box(0.5, 0.1, 0.1, goldM, 0, 4.1, 0.38, g);
    sph(0.12, goldM, 0, 4.85, 0, g, 8);
    // a spotlight on each
    const s = new THREE.SpotLight(0xfff0d0, 30, 9, 0.5, 0.6, 1.6);
    s.position.set(x + 1.5, 0.3, z + 2);
    s.target.position.set(x, 2.5, z);
    lights.push(s, s.target);
    return g;
  };
  nutcracker(-2.6, 22.8);
  nutcracker(2.6, 22.8);
  // lit wire reindeer on the lawn
  const reindeer = (x, z, ry, s = 1) => {
    const g = group(x, 0, z, yard, ry);
    const pts = [];
    const seg = (a, b, n) => { for (let i = 0; i <= n; i++) { const t = i / n; pts.push([(a[0] + (b[0] - a[0]) * t) * s, (a[1] + (b[1] - a[1]) * t) * s, (a[2] + (b[2] - a[2]) * t) * s]); } };
    seg([-0.8, 1.3, 0], [0.8, 1.35, 0], 14); seg([-0.8, 1.0, 0], [0.8, 1.05, 0], 14);
    [[-0.7, 0.18], [-0.7, -0.18], [0.65, 0.18], [0.65, -0.18]].forEach(([lx, lz]) => seg([lx, 1.0, lz], [lx, 0, lz], 8));
    seg([0.8, 1.35, 0], [1.15, 2.0, 0], 8); seg([1.15, 2.0, 0], [1.55, 1.85, 0], 5);
    seg([1.1, 2.05, 0.1], [0.9, 2.7, 0.3], 6); seg([1.1, 2.05, -0.1], [0.9, 2.7, -0.3], 6); seg([0.95, 2.45, 0.2], [0.7, 2.6, 0.45], 3);
    g.add(bulbs(pts, 0xfff6e0, 0.045, 3.5));
    return g;
  };
  reindeer(-12, 16.5, 0.3, 1.25); reindeer(-15.5, 18.5, -0.4, 1.0); reindeer(-9.5, 19.5, 0.8, 0.85);
  // candy-cane path lights
  for (let z = 12.5; z < 22; z += 2) [-1.4, 1.4].forEach((x) => {
    const g = group(x, 0, z, yard);
    cyl(0.04, 0.04, 0.8, std(0xf5f0ea), 0, 0.4, 0, g, 8);
    for (let k = 0; k < 4; k++) box(0.09, 0.05, 0.09, std(0xc0282a), 0, 0.12 + k * 0.18, 0, g);
    const hook = mesh(new THREE.TorusGeometry(0.12, 0.04, 6, 10, Math.PI), std(0xf5f0ea), 0.12, 0.8, 0, g);
    sph(0.05, glow(0xffe0c0, 3), 0.24, 0.72, 0, g, 6);
  });
  // a big lit Christmas tree on the lawn
  {
    const g = group(13.5, 0, 17.5, yard);
    for (let k = 0; k < 5; k++) mesh(new THREE.ConeGeometry(2.1 - k * 0.38, 2.1, 10), std(0x234a34, { flatShading: true, roughness: 1 }), 0, 1.4 + k * 1.05, 0, g);
    cyl(0.18, 0.2, 0.8, std(0x4a3426), 0, 0.4, 0, g, 8);
    const cols = [0xffd27a, 0xff6b5a, 0x7ac7ff, 0xb6ff8a, 0xfff2d6];
    cols.forEach((c, ci) => {
      const pts = [];
      for (let i = 0; i < 70; i++) { const a = rnd() * 6.28, y = 0.8 + rnd() * 5.2, r = 2.15 * (1 - (y - 0.8) / 5.6) + 0.05; pts.push([Math.cos(a) * r, y, Math.sin(a) * r]); }
      g.add(bulbs(pts, c, 0.055, 3.4));
    });
    const star = mesh(new THREE.OctahedronGeometry(0.38), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffe39a).multiplyScalar(4), toneMapped: false }), 0, 6.9, 0, g);
    upd.push((t) => (star.rotation.y = t));
  }

  // ---------- Forest Hills Gardens neighbors (each lit up for the holidays)
  const neighbors = new THREE.Group();
  root.add(neighbors);
  const nbBulbs = new Map();
  const tudor = (x, z, ry, s, palette, lit = true) => {
    const g = group(x, 0, z, neighbors, ry);
    const W = 16 * s, D = 12 * s, H1 = 4 * s, H2 = 4 * s;
    tbox(W, H1, D, M.brick, 0, H1 / 2, 0, g, 1.2);
    const up = tbox(W, H2, D, M.timber, 0, H1 + H2 / 2, 0, g, 4);
    const half = D / 2, rise = half * 1.15, slope = Math.hypot(half, rise), ang = Math.atan2(rise, half);
    [-1, 1].forEach((sg) => { const p = tbox(W + 0.6, 0.25, slope + 0.4, M.slate, 0, H1 + H2 + rise / 2, sg * half / 2, g, 2); p.rotation.x = sg * ang; });
    const gw = 5 * s;
    const gx = (palette % 2 ? -1 : 1) * W * 0.22;
    const fr = new THREE.Shape([new THREE.Vector2(-gw / 2, 0), new THREE.Vector2(gw / 2, 0), new THREE.Vector2(0, gw * 0.65)]);
    const tri = mesh(new THREE.ShapeGeometry(fr), M.timber, gx, H1 + H2, D / 2 + 0.02, g);
    tri.material = M.timber;
    tbox(1.2 * s, 13 * s, 1.0 * s, M.brick, -W / 2 + 1.2 * s, 6.5 * s, -D * 0.2, g, 1.2);
    // lit windows
    [[-W * 0.3, H1 * 0.55], [W * 0.3, H1 * 0.55], [-W * 0.3, H1 + H2 * 0.5], [0, H1 + H2 * 0.5], [W * 0.3, H1 + H2 * 0.5]].forEach(([wx, wy]) => {
      box(1.6 * s, 1.8 * s, 0.1, glowGlass, wx, wy, D / 2 + 0.03, g);
      box(1.9 * s, 0.18, 0.25, M.lime, wx, wy - 1 * s, D / 2 + 0.08, g);
    });
    box(1.4 * s, 2.6 * s, 0.12, std(0x3b2a1d), 0, 1.3 * s, D / 2 + 0.04, g);
    // holiday lights (collected and drawn together at the end)
    if (lit) {
      const cols = [0xfff0d0, 0xff6b5a, 0x7ac7ff, 0xffd27a, 0xb6ff8a];
      const col = cols[palette % cols.length];
      if (!nbBulbs.has(col)) nbBulbs.set(col, []);
      const arr = nbBulbs.get(col), v = new THREE.Vector3();
      const put = (px, py, pz) => { v.set(px, py, pz).applyAxisAngle(V(0, 1, 0), ry); arr.push([x + v.x, py, z + v.z]); };
      for (let i = 0; i <= 50; i++) put(-W / 2 + (i / 50) * W, H1 + H2 + 0.05, D / 2 + 0.3);
      for (let i = 0; i <= 24; i++) { const t = i / 24; put(gx - gw / 2 + t * gw, H1 + H2 + (t < 0.5 ? t : 1 - t) * 2 * gw * 0.65, D / 2 + 0.2); }
      // a lit evergreen in some front yards
      if (palette % 3 === 0) for (let i = 0; i < 40; i++) { const t = i / 40, r = (1 - t) * 1.6 * s; put(W * 0.38 + Math.cos(i * 2.4) * r, 0.4 + t * 4.5 * s, D / 2 + 3.5 + Math.sin(i * 2.4) * r); }
    }
    // a few hedge balls
    for (let k = 0; k < 6; k++) sph(0.6 * s, M.hedge, -W / 2 + 1 + k * (W - 2) / 5, 0.6 * s, D / 2 + 1.4, g, 6);
    return g;
  };
  [[-46, 4, 0, 1.05, 1], [46, 2, 0, 1.0, 2], [-30, 64, Math.PI, 1.0, 3], [0, 66, Math.PI, 1.15, 4], [32, 64, Math.PI, 1.0, 5], [-82, 2, 0, 0.95, 6], [82, 6, 0, 1.1, 7],
   [-64, 64, Math.PI, 1.05, 8], [66, 66, Math.PI, 0.95, 9], [-110, 66, Math.PI, 1.0, 10], [110, 64, Math.PI, 1.0, 11], [-120, 4, 0, 1.0, 12], [120, 0, 0, 1.0, 13]].forEach(([x, z, ry, s, p]) => tudor(x, z, ry, s, p));
  // the rest of the neighborhood: Tudors lining every block, about a third of them lit up Dyker style
  {
    const xStreets = [34.6, -120, 190, -275], zStreets = [-150, 150, -300, 300];
    let k = 0;
    xStreets.forEach((sz) => {
      [-1, 1].forEach((side) => {
        for (let x = -404; x <= 404; x += mobile ? 48 : 32) {
          if (zStreets.some((X) => Math.abs(x - X) < 20)) continue;
          if (sz === 34.6 && Math.abs(x) < 136) continue; // the hand-placed houses on Shiqi's block
          const z = sz + side * 23;
          if (Math.abs(x) < 40 && z > -30 && z < 50) continue;
          if (Math.hypot(x, z) > 420) continue;
          const jit = (rnd() - 0.5) * 4;
          tudor(x + jit, z + side * rnd() * 3, side < 0 ? 0 : Math.PI, 0.85 + rnd() * 0.3, 20 + k++, rnd() < 0.36);
        }
      });
    });
  }
  nbBulbs.forEach((pts, col) => neighbors.add(bulbs(pts, col, 0.06, 3)));
  // the neighborhood ground and streets
  {
    const ground = mesh(new THREE.CircleGeometry(430, 48), std(0x1f2b1d, { roughness: 1 }), 0, -0.03, 0, root);
    ground.rotation.x = -Math.PI / 2;
    tbox(860, 0.04, 12, M.asphalt, 0, 0.005, 34.6, root, 4);
    [[-150, 0], [150, 0]].forEach(([x]) => { const s = tbox(12, 0.04, 860, M.asphalt, x, 0.006, 0, root, 4); });
    tbox(860, 0.04, 12, M.asphalt, 0, 0.005, -120, root, 4);
    tbox(860, 0.04, 12, M.asphalt, 0, 0.005, 190, root, 4);
    tbox(860, 0.04, 12, M.asphalt, 0, 0.005, -275, root, 4);
    [-300, 300].forEach((x) => tbox(12, 0.04, 860, M.asphalt, x, 0.006, 0, root, 4));
    const lp = [];
    for (let x = -420; x <= 420; x += 30) { lp.push([x, 7, 28.5]); lp.push([x + 15, 7, 41]); }
    for (let z = -420; z <= 420; z += 30) { [-143, 157, -293, 307].forEach((x) => lp.push([x, 7, z])); [-113, 197, -268].forEach((zz) => lp.push([z, 7, zz])); }
    for (let i = lp.length - 1; i >= 0; i--) if (Math.hypot(lp[i][0], lp[i][2]) > 425) lp.splice(i, 1);
    root.add(bulbs(lp, 0xffd5a0, 0.35, 2.4));
    const tr = [];
    for (let i = 0; i < (mobile ? 140 : 360); i++) {
      const x = (rnd() - 0.5) * 820, z = (rnd() - 0.5) * 820;
      if (Math.abs(x) < 40 && z > -30 && z < 50) continue;
      if ([34.6, -120, 190, -275].some((q) => Math.abs(z - q) < 9) || [-300, -150, 150, 300].some((q) => Math.abs(x - q) < 9)) continue;
      if ([34.6, -120, 190, -275].some((q) => Math.abs(Math.abs(z - q) - 23) < 9)) continue; // not inside the houses
      const s = 3 + rnd() * 3;
      tr.push(trs(x, s * 1.4, z, rnd() * 6, s, s * 1.15, s));
    }
    root.add(instanced(new THREE.IcosahedronGeometry(1, 0), std(0x2d4728, { flatShading: true, roughness: 1 }), tr));
  }

  // ============================================================ INTERIOR
  const I = new THREE.Group();
  root.add(I);
  // ---------- foyer: grand stair
  {
    const steps = 20, rise = 5 / steps, run = 7 / steps;
    for (let i = 0; i < steps; i++) {
      const y = (i + 1) * rise, z = -0.8 - i * run;
      box(4.2, rise, run + 0.02, M.oak, 0, y - rise / 2, z, I);
      box(4.25, 0.04, 0.06, M.trim, 0, y - rise, z + run / 2, I);
      box(2.6, 0.03, run + 0.02, std(0x6b2229, { roughness: 1 }), 0, y + 0.01, z, I);
      cyl(0.012, 0.012, 2.7, M.brass, 0, y + 0.04, z + run / 2 - 0.02, I, 6).rotation.z = Math.PI / 2;
    }
    // bullnose starter steps
    const b1 = cyl(3.2, 3.2, 0.25, M.oak, 0, 0.125, -0.7, I, 32); b1.scale.set(1, 1, 0.26);
    const b2 = cyl(2.7, 2.7, 0.25, M.oak, 0, 0.375, -0.75, I, 32); b2.scale.set(1, 1, 0.2);
    // balusters, rails, newels
    const bal = [];
    [-2.15, 2.15].forEach((x) => {
      for (let i = 0; i < 19; i++) {
        const y = (i + 1) * rise, z = -0.8 - i * run;
        bal.push(trs(x, y + 0.5, z, 0, 1, 1, 1));
      }
      const rail = box(0.14, 0.12, 8.6, M.walnutWood, x, 3.45, -4.3, I);
      rail.rotation.x = Math.atan2(5, 7);
      box(0.4, 1.5, 0.4, M.walnutWood, x, 0.75, -0.55, I);
      sph(0.2, M.walnutWood, x, 1.62, -0.55, I, 12);
      box(0.4, 1.3, 0.4, M.walnutWood, x, 5.65, -7.9, I);
    });
    const balGeo = new THREE.LatheGeometry([V(0.03, -0.5), V(0.05, -0.45), V(0.035, -0.3), V(0.045, -0.1), V(0.03, 0.1), V(0.04, 0.35), V(0.03, 0.5)].map((v) => new THREE.Vector2(v.x, v.y)), 8);
    I.add(instanced(balGeo, M.trim, bal));
    // landing balustrade
    const lb = [];
    [[-5, -2.2], [2.2, 5]].forEach(([a, b]) => { box(b - a, 0.12, 0.14, M.walnutWood, (a + b) / 2, 6.05, -7.85, I); for (let x = a + 0.15; x < b; x += 0.28) lb.push(trs(x, 5.5, -7.85, 0, 1, 1, 1)); });
    I.add(instanced(balGeo, M.trim, lb));
    box(10, 0.3, 0.3, M.trim, 0, 4.85, -7.8, I);
  }
  // ---------- foyer: chandelier
  const chand = new THREE.Group();
  {
    cyl(0.02, 0.02, 1.8, M.brass, 0, 0.9, 0, chand, 6);
    const crystal = std(0xffffff, { roughness: 0.02, metalness: 0.1, emissive: 0x99aabb, emissiveIntensity: 0.35, transparent: true, opacity: 0.85 });
    [1.3, 0.9, 0.5].forEach((r, k) => {
      const ring = mesh(new THREE.TorusGeometry(r, 0.035, 8, 48), M.brass, 0, -k * 0.5, 0, chand);
      ring.rotation.x = Math.PI / 2;
      const n = Math.round(r * 12);
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        cyl(0.025, 0.025, 0.14, std(0xf6efe0), Math.cos(a) * r, -k * 0.5 + 0.09, Math.sin(a) * r, chand, 6);
        sph(0.045, new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffe2a8).multiplyScalar(4), toneMapped: false }), Math.cos(a) * r, -k * 0.5 + 0.2, Math.sin(a) * r, chand, 8);
      }
      for (let i = 0; i < n * 2; i++) { const a = (i / (n * 2)) * Math.PI * 2; mesh(new THREE.OctahedronGeometry(0.05), crystal, Math.cos(a) * r, -k * 0.5 - 0.2 - (i % 2) * 0.12, Math.sin(a) * r, chand); }
    });
    mesh(new THREE.OctahedronGeometry(0.16), crystal, 0, -1.4, 0, chand).scale.set(1, 1.8, 1);
    chand.position.set(0, 8.2, 2.5);
    I.add(chand);
    keep.add(chand);
    const L = new THREE.PointLight(0xffd9a0, 70, 28, 1.5);
    L.position.set(0, 7.4, 2.5);
    lights.push(L);
  }
  // ---------- foyer: round table with hydrangeas, grandfather clock, console and mirror, art
  {
    const t = group(0, 0, 3.4, I);
    cyl(1.05, 1.05, 0.08, M.walnutWood, 0, 0.96, 0, t, 40);
    cyl(0.14, 0.32, 0.86, M.walnutWood, 0, 0.47, 0, t, 16);
    cyl(0.6, 0.7, 0.08, M.walnutWood, 0, 0.04, 0, t, 24);
    cyl(0.2, 0.14, 0.42, std(0xf3f0ea, { roughness: 0.15 }), 0, 1.21, 0, t, 18);
    for (let i = 0; i < 26; i++) { const a = rnd() * 6.28, r = rnd() * 0.32; sph(0.11 + rnd() * 0.05, std([0xe9eef6, 0xc9d6ea, 0xa9b8dd, 0xf1e6f1][i % 4], { roughness: 1 }), Math.cos(a) * r, 1.5 + rnd() * 0.3, Math.sin(a) * r, t, 7); }
    for (let i = 0; i < 6; i++) { const a = i; const l = mesh(new THREE.CircleGeometry(0.12, 6), std(0x3f6b45, { side: DS }), Math.cos(a) * 0.36, 1.42, Math.sin(a) * 0.36, t); l.rotation.set(-1, a, 0); }
    // books on the table
    box(0.32, 0.06, 0.24, std(0x2f4f6b), 0.6, 1.03, 0.2, t); box(0.3, 0.05, 0.22, std(0xc9a35b), 0.6, 1.08, 0.2, t);
  }
  const rug = (w, d, x, y, z, tex, parent = I) => { const r = box(w, 0.02, d, std(0xffffff, { map: tex, roughness: 1 }), x, y + 0.01, z, parent); return r; };
  rug(6, 8.2, 0, 0, 4.6, T.rug("#5d2f36", "#1f3a4a", "#c9a35b"));
  const pendulum = new THREE.Group();
  {
    const g = group(-4.62, 0, 7.6, I, Math.PI / 2);
    box(0.62, 0.3, 0.45, M.walnutWood, 0, 0.15, 0, g);
    box(0.5, 1.5, 0.36, M.walnutWood, 0, 1.05, 0, g);
    box(0.62, 0.7, 0.45, M.walnutWood, 0, 2.15, 0, g);
    box(0.7, 0.12, 0.5, M.walnutWood, 0, 2.56, 0, g);
    const bonnet = mesh(new THREE.CylinderGeometry(0.01, 0.4, 0.3, 4), M.walnutWood, 0, 2.77, 0, g); bonnet.rotation.y = Math.PI / 4;
    const face = mesh(new THREE.CircleGeometry(0.23, 32), std(0xffffff, { map: T.clockFace(), roughness: 0.4 }), 0, 2.15, 0.231, g);
    box(0.36, 1.2, 0.02, std(0xffffff, { transparent: true, opacity: 0.25, roughness: 0.05 }), 0, 1.1, 0.19, g);
    pendulum.position.set(0, 1.75, 0.12);
    g.add(pendulum);
    cyl(0.01, 0.01, 1.1, M.brass, 0, -0.55, 0, pendulum, 6);
    const bob = cyl(0.11, 0.11, 0.03, M.brass, 0, -1.12, 0, pendulum, 20); bob.rotation.x = Math.PI / 2;
    keep.add(pendulum);
    upd.push((t) => (pendulum.rotation.z = Math.sin(t * Math.PI) * 0.12));
  }
  {
    const g = group(4.72, 0, 7.6, I, -Math.PI / 2);
    box(1.8, 0.08, 0.5, M.walnutWood, 0, 0.92, 0, g);
    [[-0.8, -0.2], [0.8, -0.2], [-0.8, 0.2], [0.8, 0.2]].forEach(([x, z]) => box(0.06, 0.9, 0.06, M.walnutWood, x, 0.45, z, g));
    box(1.6, 0.04, 0.4, M.walnutWood, 0, 0.25, 0, g);
    box(1.5, 1.9, 0.06, M.brass, 0, 2.05, -0.22, g);
    box(1.35, 1.75, 0.02, std(0xc6d0d8, { roughness: 0.02, metalness: 1 }), 0, 2.05, -0.18, g);
    // orchid and a bowl for keys
    cyl(0.1, 0.08, 0.16, std(0xf0ece4), -0.55, 1.04, 0, g, 12);
    for (let i = 0; i < 5; i++) sph(0.05, std(0xf4e9f2), -0.55 + (i - 2) * 0.03, 1.35 + i * 0.05, 0.02, g, 6);
    cyl(0.14, 0.09, 0.06, M.brass, 0.45, 0.99, 0, g, 16);
  }
  const frame = (w, h, x, y, z, ry, tex, parent = I) => {
    const p = group(x, y, z, parent, ry);
    box(w + 0.24, h + 0.24, 0.08, M.brass, 0, 0, 0, p);
    mesh(new THREE.PlaneGeometry(w, h), std(0xffffff, { map: tex, roughness: 0.8 }), 0, 0, 0.045, p);
    // picture light
    box(w * 0.5, 0.05, 0.1, M.brass, 0, h / 2 + 0.25, 0.12, p);
    box(w * 0.48, 0.02, 0.05, glow(0xfff0d0, 2), 0, h / 2 + 0.22, 0.17, p);
    return p;
  };
  frame(2.6, 1.9, -4.8, 7.2, 2.4, Math.PI / 2, T.painting("park"));
  frame(2.6, 1.9, 4.8, 7.2, 2.4, -Math.PI / 2, T.painting("bridge"));
  frame(1.6, 1.2, -4.8, 2.4, -6.5, Math.PI / 2, T.painting("taxi"));
  frame(1.6, 1.2, 4.8, 2.4, -6.5, -Math.PI / 2, T.painting("skyline"));
  // sconces
  const sconce = (x, y, z, ry, parent = I) => {
    const g = group(x, y, z, parent, ry);
    box(0.12, 0.3, 0.05, M.brass, 0, 0, 0, g);
    const arm = cyl(0.015, 0.015, 0.25, M.brass, 0, 0.05, 0.12, g, 6); arm.rotation.x = Math.PI / 2;
    mesh(new THREE.CylinderGeometry(0.06, 0.1, 0.15, 12, 1, true), std(0xf6efe0, { emissive: 0xffd9a0, emissiveIntensity: 1.4, side: DS }), 0, 0.15, 0.25, g);
    return g;
  };
  [[-4.82, 2.6, -2.7, Math.PI / 2], [-4.82, 2.6, 5.7, Math.PI / 2], [4.82, 2.6, -2.7, -Math.PI / 2], [4.82, 2.6, 5.7, -Math.PI / 2], [-3.2, 7.4, 9.8, Math.PI], [3.2, 7.4, 9.8, Math.PI]].forEach((a) => sconce(...a));
  // coat stand with a BU scarf, umbrella stand, palms
  {
    const g = group(3.7, 0, 9.0, I);
    cyl(0.03, 0.03, 1.9, M.walnutWood, 0, 0.95, 0, g, 8);
    [0, 1, 2].forEach((k) => { const l = cyl(0.03, 0.02, 0.5, M.walnutWood, 0, 0.2, 0, g, 6); l.position.set(Math.cos(k * 2.1) * 0.18, 0.12, Math.sin(k * 2.1) * 0.18); l.rotation.set(Math.sin(k * 2.1) * 0.6, 0, -Math.cos(k * 2.1) * 0.6); });
    const scarf = box(0.12, 0.9, 0.04, std(0xcc0000, { roughness: 1 }), 0.12, 1.4, 0, g);
    box(0.13, 0.08, 0.05, std(0xffffff), 0.12, 1.05, 0, g);
    const coat = cyl(0.22, 0.3, 1, std(0x2b2d33, { roughness: 1 }), -0.12, 1.3, 0.05, g, 12);
    cyl(0.14, 0.14, 0.55, M.brass, -0.5, 0.28, 0, g, 12);
    [-0.05, 0.05].forEach((o) => cyl(0.012, 0.012, 0.9, std(0x1d1f22), -0.5 + o, 0.65, 0, g, 6));
  }
  plant(I, -4.2, 0, 9.1, 1.4); plant(I, 4.2, 0, -9.0, 1.4); plant(I, -4.2, 0, -9.0, 1.4);
  // a little robot vacuum doing laps of the foyer
  const vac = group(0, 0, 6, I);
  cyl(0.18, 0.18, 0.08, std(0x2b2f36, { roughness: 0.3 }), 0, 0.06, 0, vac, 20);
  sph(0.02, new THREE.MeshBasicMaterial({ color: new THREE.Color(0x7dffb4).multiplyScalar(3), toneMapped: false }), 0.1, 0.11, 0, vac, 6);
  keep.add(vac);
  upd.push((t) => { const a = t * 0.25; vac.position.set(Math.cos(a) * 2.8, 0, 3.4 + Math.sin(a * 1.3) * 3.6); vac.rotation.y = -a; });

  // ---------- living room (left, ground floor): fireplace, sofa, grand piano, shelves
  {
    const g = I;
    rug(5.4, 6.4, -9.6, 0, 3.4, T.rug("#2f4f4f", "#c9a35b", "#7a2e2e"));
    // fireplace on the outer wall
    const fp = group(-13.83, 0, 4.6, g, Math.PI / 2);
    tbox(2.6, 1.6, 0.4, M.whiteMarble, 0, 0.8, 0, fp, 1);
    box(1.3, 0.95, 0.42, std(0x111111), 0, 0.5, 0.02, fp);
    box(3.0, 0.12, 0.55, M.whiteMarble, 0, 1.66, 0.06, fp);
    box(2.2, 1.4, 0.06, M.brass, 0, 2.6, -0.15, fp);
    box(2.05, 1.25, 0.02, std(0xc6d0d8, { roughness: 0.02, metalness: 1 }), 0, 2.6, -0.11, fp);
    const fireL = flames(fp, 0, 0.12, 0.15, 1.0);
    chesterfield(M.velvet, g, -10.2, 0, 4.6, -Math.PI / 2, 2.4);
    chesterfield(M.leather, g, -12, 0, 2.2, -0.4, 1.1);
    box(1.2, 0.08, 0.7, M.walnutWood, -11.6, 0.42, 4.6, g);
    // grand piano by the front window
    const pg = group(-9.8, 0, 7.7, g, 0.4);
    const pshape = new THREE.Shape();
    pshape.moveTo(-0.75, -1.1); pshape.lineTo(0.75, -1.1); pshape.lineTo(0.75, 0.2); pshape.quadraticCurveTo(0.7, 1.2, -0.1, 1.0); pshape.quadraticCurveTo(-0.75, 0.9, -0.75, 0.2); pshape.lineTo(-0.75, -1.1);
    const pb = mesh(new THREE.ExtrudeGeometry(pshape, { depth: 0.3, bevelEnabled: false }), std(0x0d0d0f, { roughness: 0.15, metalness: 0.2 }), 0, 0.95, 0, pg);
    pb.rotation.x = -Math.PI / 2;
    const lid = mesh(new THREE.ExtrudeGeometry(pshape, { depth: 0.02, bevelEnabled: false }), std(0x0d0d0f, { roughness: 0.15, metalness: 0.2 }), 0.75, 1.27, 0, pg);
    lid.rotation.set(-Math.PI / 2, -0.9, 0);
    box(1.5, 0.06, 0.2, std(0xf6f2ea), 0, 0.98, -1.15, pg);
    [[-0.6, -0.9], [0.6, -0.9], [0, 0.8]].forEach(([x, z]) => cyl(0.05, 0.05, 0.95, std(0x0d0d0f), x, 0.47, z, pg, 8));
    box(0.9, 0.06, 0.35, std(0x0d0d0f), 0, 0.5, -1.6, pg);
    // shelves on the back wall
    const sh = group(-9.5, 0, -9.62, g);
    box(7, 3.4, 0.4, M.walnutWood, 0, 1.7, 0, sh);
    for (let k = 0; k < 5; k++) bookRow(sh, -3.3, 3.3, 0.18 + k * 0.66, 0.05, 0.3, "x", rnd);
    tableLamp(g, -12.4, 0.45, 6.4, 1.5);
    box(0.5, 0.45, 0.5, M.walnutWood, -12.4, 0.22, 6.4, g);
    const L = new THREE.PointLight(0xffc28a, 22, 14, 1.6); L.position.set(-10.5, 3.6, 3.5); lights.push(L);
    lights.push(fireL);
  }
  // ---------- dining room (right, ground floor)
  {
    const g = I;
    rug(4.6, 6.6, 9.6, 0, 2.6, T.rug("#3c2b4a", "#c9a35b", "#2f4f4f"));
    const t = group(9.6, 0, 2.6, g);
    box(1.4, 0.08, 4, M.walnutWood, 0, 0.92, 0, t);
    [[-0.55, -1.7], [0.55, -1.7], [-0.55, 1.7], [0.55, 1.7]].forEach(([x, z]) => cyl(0.06, 0.05, 0.9, M.walnutWood, x, 0.45, z, t, 10));
    for (let k = -1; k <= 1; k++) { [-1, 1].forEach((s) => chair(std(0xd9ccb4), M.walnutWood, t, s * 0.95, 0, k * 1.15, s > 0 ? -Math.PI / 2 : Math.PI / 2)); }
    chair(std(0xd9ccb4), M.walnutWood, t, 0, 0, -2.4, 0); chair(std(0xd9ccb4), M.walnutWood, t, 0, 0, 2.4, Math.PI);
    // candelabra with candles
    cyl(0.08, 0.12, 0.3, M.brass, 0, 1.1, 0, t, 12);
    [-0.25, 0, 0.25].forEach((o) => { cyl(0.02, 0.02, 0.25, std(0xf6f1e6), 0, 1.45, o, t, 8); sph(0.025, new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffc060).multiplyScalar(4), toneMapped: false }), 0, 1.6, o, t, 6); });
    for (let k = -1; k <= 1; k++) [-1, 1].forEach((s) => { cyl(0.13, 0.13, 0.01, std(0xf6f2ea), s * 0.45, 0.97, k * 1.15, t, 20); });
    // dining chandelier and a sideboard
    const dc = group(9.6, 3.6, 2.6, g);
    cyl(0.015, 0.015, 1, M.brass, 0, 0.6, 0, dc, 6);
    const r = mesh(new THREE.TorusGeometry(0.6, 0.03, 6, 32), M.brass, 0, 0, 0, dc); r.rotation.x = Math.PI / 2;
    for (let i = 0; i < 8; i++) sph(0.05, new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffe2a8).multiplyScalar(4), toneMapped: false }), Math.cos(i * 0.785) * 0.6, 0.12, Math.sin(i * 0.785) * 0.6, dc, 6);
    const sb = group(13.7, 0, 2.6, g, -Math.PI / 2);
    box(3, 0.95, 0.55, M.walnutWood, 0, 0.47, 0, sb);
    frame(2.2, 1.4, 13.8, 2.6, 2.6, -Math.PI / 2, T.painting("skyline"));
    const L = new THREE.PointLight(0xffd29a, 20, 14, 1.6); L.position.set(9.6, 3.3, 2.6); lights.push(L);
  }

  // ============================================================ STUDY (upper left)
  const study = new THREE.Group();
  I.add(study);
  const Y = 5;
  rug(5.6, 7.4, -9.4, Y, 4.6, T.rug("#24394a", "#c9a35b", "#7a2e2e"), study);
  // floor-to-ceiling library on the outer wall, with a rolling ladder
  const SH = { x: -13.6, z0: -8.6, z1: 1.6 };
  {
    const sh = group(SH.x, Y, 0, study);
    const depth = 0.55, H = 4.7;
    box(depth, H, 0.12, M.walnutWood, 0, H / 2, SH.z0, sh); box(depth, H, 0.12, M.walnutWood, 0, H / 2, SH.z1, sh);
    for (let z = SH.z0 + 1.7; z < SH.z1; z += 1.7) box(depth, H, 0.08, M.walnutWood, 0, H / 2, z, sh);
    const ys = [0.08, 0.86, 1.64, 2.42, 3.2, 3.98];
    ys.forEach((y) => box(depth, 0.06, SH.z1 - SH.z0, M.walnutWood, 0, y, (SH.z0 + SH.z1) / 2, sh));
    box(depth + 0.15, 0.3, SH.z1 - SH.z0 + 0.3, M.walnutWood, 0.05, H, (SH.z0 + SH.z1) / 2, sh);
    box(0.04, H, SH.z1 - SH.z0, M.walnutWood, -depth / 2 + 0.02, H / 2, (SH.z0 + SH.z1) / 2, sh);
    ys.slice(0, 5).forEach((y, k) => {
      for (let z = SH.z0 + 0.1; z < SH.z1 - 0.2; z += 1.7) {
        const z1 = Math.min(SH.z1 - 0.1, z + 1.55);
        if (k === 2 && z < 0.1 && z1 > -0.5) { bookRow(sh, z, -0.55, y + 0.03, 0.0, 0.42, "z", rnd); bookRow(sh, 0.3, z1, y + 0.03, 0.0, 0.42, "z", rnd); continue; }
        bookRow(sh, z, z1, y + 0.03, 0.0, 0.42, "z", rnd);
      }
    });
    // brass rail for the ladder
    box(0.05, 0.05, SH.z1 - SH.z0, M.brass, 0.42, 4.2, (SH.z0 + SH.z1) / 2, sh);
    // a few objects on shelves: a small globe, a trophy, a plant
    sph(0.14, std(0x4f7a9a, { roughness: 0.5 }), 0.05, 3.42, -6.8, sh, 16);
    cyl(0.05, 0.1, 0.32, M.brass, 0.05, 1.82, -3.4, sh, 10);
    sph(0.09, M.brass, 0.05, 2.02, -3.4, sh, 10);
  }
  // the experience book: tall sage cloth with a gold spine
  const book = group(SH.x + 0.08, Y + 1.64 + 0.48, -0.12, study);
  const bookMat = new THREE.MeshStandardMaterial({ color: 0x3c6b55, roughness: 0.5, emissive: 0xc9a35b, emissiveIntensity: 0 });
  box(0.46, 0.86, 0.2, bookMat, 0, 0, 0, book);
  box(0.02, 0.6, 0.16, M.brass, 0.24, 0, 0, book);
  [0.32, -0.32].forEach((y) => box(0.02, 0.04, 0.2, M.brass, 0.24, y, 0, book));
  keep.add(book);
  const bookHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTex(), color: 0xffd9a0, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  bookHalo.position.set(SH.x + 0.5, Y + 2.12, -0.12);
  bookHalo.scale.setScalar(1.2);
  bookHalo.visible = false;
  study.add(bookHalo);
  const ladder = group(SH.x + 0.95, Y, -5.5, study);
  {
    [-0.28, 0.28].forEach((o) => { const r = box(0.06, 4.4, 0.06, M.walnutWood, -0.24, 2.2, o, ladder); r.rotation.z = 0.12; });
    for (let k = 0; k < 11; k++) box(0.05, 0.04, 0.56, M.walnutWood, -0.02 - k * 0.048, 0.35 + k * 0.38, 0, ladder);
    [-0.28, 0.28].forEach((o) => { cyl(0.04, 0.04, 0.04, M.brass, 0.04, 0.03, o, ladder, 8); cyl(0.03, 0.03, 0.2, M.brass, -0.46, 4.2, o, ladder, 8).rotation.z = Math.PI / 2; });
  }
  keep.add(ladder);
  // fireplace with a marble surround, a mirror, the mantel, fire
  let studyFire;
  {
    const fp = group(-13.82, Y, 4.6, study, Math.PI / 2);
    tbox(2.4, 1.5, 0.35, M.whiteMarble, 0, 0.75, 0, fp, 1);
    box(1.2, 0.9, 0.37, std(0x0e0e0e), 0, 0.47, 0.02, fp);
    box(2.9, 0.12, 0.5, M.whiteMarble, 0, 1.56, 0.06, fp);
    box(1.4, 0.06, 0.5, std(0x2a2a2a), 0, 0.03, 0.5, fp);
    // brass fender and andirons with logs
    box(1.5, 0.12, 0.05, M.brass, 0, 0.1, 0.62, fp);
    [-0.35, 0.35].forEach((x) => box(0.05, 0.3, 0.3, M.iron, x, 0.15, 0.2, fp));
    [0, 1].forEach((k) => { const l = cyl(0.07, 0.07, 0.8, std(0x4a3426), 0, 0.17 + k * 0.1, 0.2 - k * 0.05, fp, 8); l.rotation.z = Math.PI / 2; l.rotation.y = k * 0.3; });
    studyFire = flames(fp, 0, 0.18, 0.2, 0.9);
    // overmantel mirror and mantel things
    box(1.7, 1.9, 0.06, M.brass, 0, 2.75, -0.12, fp);
    box(1.55, 1.75, 0.02, std(0xc6d0d8, { roughness: 0.02, metalness: 1 }), 0, 2.75, -0.08, fp);
    [-1.1, 1.1].forEach((x) => { cyl(0.05, 0.06, 0.08, M.brass, x, 1.66, 0.05, fp, 10); cyl(0.025, 0.025, 0.28, std(0xf6f1e6), x, 1.84, 0.05, fp, 8); sph(0.02, new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffc060).multiplyScalar(4), toneMapped: false }), x, 2.0, 0.05, fp, 6); });
    box(0.36, 0.28, 0.12, M.walnutWood, 0, 1.76, 0.05, fp);
    mesh(new THREE.CircleGeometry(0.1, 20), std(0xf3ead6), 0, 1.78, 0.115, fp);
    box(0.22, 0.28, 0.03, M.brass, -0.55, 1.76, 0.05, fp);
    box(0.18, 0.22, 0.01, std(0x9cc7b2), -0.55, 1.76, 0.067, fp);
    // garland across the mantel
    for (let i = 0; i < 18; i++) sph(0.07, M.hedge, -1.3 + i * 0.153, 1.6 - Math.sin((i / 17) * Math.PI) * 0.12, 0.25, fp, 5);
    const gp = []; for (let i = 0; i < 24; i++) gp.push([-1.3 + i * 0.113, 1.58 - Math.sin((i / 23) * Math.PI) * 0.12, 0.33]);
    fp.add(bulbs(gp, 0xfff0c8, 0.02, 4));
    // a log basket
    cyl(0.3, 0.25, 0.4, std(0x7a5a3a, { roughness: 1 }), 1.7, 0.2, 0.4, fp, 12);
  }
  lights.push(studyFire);
  // reading chair, ottoman, side table with tea
  chesterfield(M.leather, study, -11.4, Y, 3.0, 2.2, 1.0);
  box(0.7, 0.36, 0.55, M.leather, -11.0, Y + 0.2, 1.9, study);
  {
    const st = group(-12.7, Y, 2.0, study);
    cyl(0.28, 0.28, 0.04, M.walnutWood, 0, 0.62, 0, st, 20);
    cyl(0.04, 0.04, 0.6, M.walnutWood, 0, 0.31, 0, st, 8);
    cyl(0.07, 0.06, 0.08, std(0xf6f2ea), 0.08, 0.68, 0.05, st, 12);
    cyl(0.1, 0.1, 0.01, std(0xf6f2ea), 0.08, 0.645, 0.05, st, 14);
    box(0.24, 0.04, 0.17, std(0x8a3b3b), -0.08, 0.66, -0.08, st);
  }
  // the desk by the front window: partners desk, banker's lamp, the letter
  const desk = group(-9.5, Y, 7.3, study);
  {
    box(3.4, 0.1, 1.5, M.walnutWood, 0, 0.86, 0, desk);
    box(3.2, 0.012, 1.3, M.greenLeather, 0, 0.915, 0, desk);
    [-1.25, 1.25].forEach((x) => {
      box(0.8, 0.8, 1.4, M.walnutWood, x, 0.41, 0, desk);
      [0.18, 0.43, 0.68].forEach((y) => { box(0.72, 0.2, 0.02, M.walnutWood, x, y, -0.71, desk); box(0.16, 0.025, 0.03, M.brass, x, y, -0.725, desk); });
    });
    box(1.7, 0.12, 0.02, M.walnutWood, 0, 0.74, -0.71, desk);
    // banker's lamp
    const lamp = group(-1.3, 0.92, 0.35, desk);
    cyl(0.12, 0.14, 0.04, M.brass, 0, 0.02, 0, lamp, 18);
    cyl(0.018, 0.018, 0.4, M.brass, 0, 0.22, 0, lamp, 8);
    const shade = mesh(new THREE.CylinderGeometry(0.06, 0.22, 0.14, 18, 1, true), std(0x2e6b4e, { side: DS, emissive: 0x1d4a34, emissiveIntensity: 0.9, metalness: 0.3, roughness: 0.3 }), 0, 0.44, 0, lamp);
    shade.rotation.z = 0.12;
    // books, inkwell, a little FTC robot model, a framed photo, a mug, a plant
    [[1.05, 0x8a3b3b, 0], [1.05, 0x2f4f6b, 0.12], [1.05, 0xc9a35b, 0.22]].forEach(([x, c, r], i) => { const b = box(0.5, 0.07, 0.36, std(c), x, 0.96 + i * 0.07, 0.25, desk); b.rotation.y = r; });
    cyl(0.05, 0.06, 0.07, std(0x1b2130, { roughness: 0.1 }), -0.2, 0.96, 0.35, desk, 12);
    const bot = group(0.55, 0.92, 0.45, desk, 0.6);
    box(0.24, 0.07, 0.24, std(0x2f4f6b), 0, 0.05, 0, bot);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => { const w = cyl(0.04, 0.04, 0.03, std(0x111111), sx * 0.13, 0.04, sz * 0.09, bot, 10); w.rotation.z = Math.PI / 2; });
    box(0.03, 0.2, 0.03, M.brass, 0, 0.18, -0.05, bot);
    box(0.14, 0.03, 0.03, M.brass, 0.05, 0.28, -0.05, bot);
    box(0.08, 0.06, 0.07, std(0xd8b56e), 0, 0.12, 0.05, bot);
    const pf = group(-0.85, 0.92, 0.55, desk, 0.4);
    box(0.2, 0.25, 0.02, M.brass, 0, 0.13, 0, pf);
    box(0.16, 0.21, 0.01, std(0xbcd5e7), 0, 0.13, 0.012, pf);
    cyl(0.06, 0.055, 0.12, std(0xf6f2ea), 0.2, 0.98, -0.35, desk, 14);
    plant(desk, 1.45, 0.92, -0.4, 0.45, 0xb5764f);
    const deskLight = new THREE.PointLight(0xffd59a, 9, 5, 1.6);
    deskLight.position.set(-9.5 - 1.3, Y + 1.25, 7.65);
    lights.push(deskLight);
  }
  // the half-written letter (canvas drawn by the app)
  const letterCanvas = document.createElement("canvas");
  letterCanvas.width = 512; letterCanvas.height = 680;
  const letterTex = new THREE.CanvasTexture(letterCanvas);
  letterTex.colorSpace = THREE.SRGBColorSpace;
  const letter = mesh(new THREE.PlaneGeometry(0.62, 0.82), new THREE.MeshStandardMaterial({ map: letterTex, roughness: 0.9, emissive: 0xffffff, emissiveIntensity: 0, emissiveMap: letterTex }), -9.05, Y + 0.93, 7.05, study);
  letter.rotation.set(-Math.PI / 2, 0, 0.18);
  keep.add(letter);
  const pen = cyl(0.012, 0.012, 0.32, M.brass, -8.62, Y + 0.945, 7.15, study, 8);
  pen.rotation.set(Math.PI / 2, 0, 0.9);
  const chairG = group(-9.5, Y, 5.95, study);
  {
    box(0.78, 0.12, 0.72, M.greenLeather, 0, 0.55, 0, chairG);
    const back = box(0.78, 0.95, 0.12, M.greenLeather, 0, 1.08, -0.33, chairG);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) sph(0.014, M.brass, -0.27 + i * 0.18, 0.8 + j * 0.25, -0.265, chairG, 6);
    cyl(0.05, 0.05, 0.42, std(0x222222), 0, 0.28, 0, chairG, 10);
    for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2; const l = box(0.04, 0.04, 0.34, std(0x222222), Math.sin(a) * 0.17, 0.06, Math.cos(a) * 0.17, chairG); l.rotation.y = a; }
  }
  const meDesk = makeShiqi({ hands: "desk" });
  meDesk.position.set(-9.5, Y + 0.62, 6.0);
  study.add(meDesk);
  keep.add(meDesk);
  // curtains on the study window, a radiator under it, the globe
  const curtain = (x0, x1, y0, y1, z, mat, parent) => {
    [x0 - 0.35, x1 + 0.35].forEach((x) => {
      const c = mesh(new THREE.CylinderGeometry(0.22, 0.32, y1 - y0 + 0.6, 10, 1, true), mat, x, (y0 + y1) / 2 - 0.1, z, parent);
      c.scale.set(1, 1, 0.45);
      c.material.side = DS;
    });
    box(x1 - x0 + 1.6, 0.05, 0.05, M.brass, (x0 + x1) / 2, y1 + 0.3, z, parent);
  };
  curtain(-11.6, -7.4, 6, 9.1, 9.7, M.velvet, study);
  const radiator = (x, y, z, w, parent) => { const g = group(x, y, z, parent); for (let k = 0; k < w / 0.09; k++) cyl(0.035, 0.035, 0.7, std(0xe8e3d8, { metalness: 0.4, roughness: 0.5 }), -w / 2 + k * 0.09, 0.45, 0, g, 6); box(w, 0.06, 0.18, std(0xe8e3d8, { metalness: 0.4 }), 0, 0.1, 0, g); return g; };
  radiator(-9.5, Y, 9.7, 2.6, study);
  {
    const gl = group(-6.3, Y, 8.7, study);
    [[-1, -1], [1, -1], [0, 1]].forEach(([sx, sz]) => { const l = box(0.04, 0.8, 0.04, M.walnutWood, sx * 0.18, 0.4, sz * 0.18, gl); });
    const ring = mesh(new THREE.TorusGeometry(0.34, 0.02, 6, 32), M.brass, 0, 1.15, 0, gl);
    const globeTex = canvasTex(256, 128, (g, w, h) => { g.fillStyle = "#c8b98f"; g.fillRect(0, 0, w, h); g.fillStyle = "#6f8f7f"; for (let i = 0; i < 26; i++) { g.beginPath(); g.ellipse(rnd() * w, 20 + rnd() * 90, 10 + rnd() * 26, 6 + rnd() * 16, rnd() * 3, 0, 7); g.fill(); } });
    const globe = sph(0.3, std(0xffffff, { map: globeTex, roughness: 0.4 }), 0, 1.15, 0, gl, 28);
    globe.rotation.z = 0.4;
    keep.add(globe);
    upd.push((t) => (globe.rotation.y = t * 0.2));
  }
  // the workshop corner: pegboard, tools, bench, builds, oscilloscope, soldering, 3D printer
  const pegTex = canvasTex(512, 256, (g, w, h) => { g.fillStyle = "#b8916a"; g.fillRect(0, 0, w, h); g.fillStyle = "#6e5236"; for (let y = 8; y < h; y += 12) for (let x = 8; x < w; x += 12) { g.beginPath(); g.arc(x, y, 2, 0, 7); g.fill(); } });
  mesh(new THREE.PlaneGeometry(6.8, 3.3), std(0xffffff, { map: pegTex, roughness: 0.9 }), -9.8, Y + 2.85, -9.8, study);
  box(7, 0.1, 0.1, M.walnutWood, -9.8, Y + 4.5, -9.78, study); box(7, 0.1, 0.1, M.walnutWood, -9.8, Y + 1.2, -9.78, study);
  const tools = new THREE.Group();
  study.add(tools);
  {
    const steel = std(0xb8c0c6, { metalness: 0.75, roughness: 0.3 });
    const red = std(0xb5473f, { roughness: 0.5 }), sageT = std(0x5f9a80, { roughness: 0.5 });
    const Tg = (x, y, f) => { const g = group(x, Y + y, -9.72, tools); f(g); return g; };
    [0, 1, 2, 3, 4].forEach((i) => Tg(-13 + i * 0.27, 3.3, (g) => { box(0.06, 0.85 - i * 0.1, 0.03, steel, 0, 0, 0, g); mesh(new THREE.TorusGeometry(0.07, 0.025, 6, 12, Math.PI * 1.5), steel, 0, (0.85 - i * 0.1) / 2, 0, g); }));
    [red, sageT, std(0xd8b56e), std(0x557c9f), red].forEach((m, i) => Tg(-11.4 + i * 0.22, 3.6, (g) => { cyl(0.05, 0.05, 0.3, m, 0, 0.15, 0, g, 10); cyl(0.012, 0.012, 0.42, steel, 0, -0.21, 0, g, 6); }));
    Tg(-10.1, 3.2, (g) => { box(0.06, 0.8, 0.04, M.walnutWood, 0, 0, 0, g); box(0.34, 0.1, 0.08, steel, 0, 0.4, 0, g); });
    Tg(-9.5, 3.3, (g) => { [-1, 1].forEach((s) => { const a = box(0.05, 0.55, 0.03, red, s * 0.05, -0.1, 0, g); a.rotation.z = s * 0.12; }); box(0.05, 0.2, 0.03, steel, 0, 0.27, 0, g); });
    Tg(-8.9, 3.25, (g) => { box(0.42, 0.62, 0.08, std(0xd8b56e), 0, 0, 0, g); box(0.32, 0.18, 0.02, std(0x9fc7a8, { emissive: 0x4f8a74, emissiveIntensity: 0.8 }), 0, 0.15, 0.05, g); });
    Tg(-8.3, 3.4, (g) => { cyl(0.035, 0.03, 0.5, std(0x2b3036), 0, 0, 0, g, 10); });
    Tg(-7.8, 3.0, (g) => { mesh(new THREE.TorusGeometry(0.13, 0.06, 8, 18), std(0xd0d4d8, { metalness: 0.6 }), 0, 0, 0, g); });
    Tg(-7.2, 3.5, (g) => { mesh(new THREE.TorusGeometry(0.16, 0.04, 6, 18), std(0xd88a3a), 0, 0, 0, g); mesh(new THREE.TorusGeometry(0.11, 0.04, 6, 18), std(0x3a7ad8), 0, -0.05, 0.03, g); });
    Tg(-12.3, 2.0, (g) => { box(0.9, 0.06, 0.03, steel, 0, 0, 0, g); box(0.06, 0.25, 0.03, steel, -0.4, -0.1, 0, g); box(0.06, 0.25, 0.03, steel, -0.25, -0.1, 0, g); });
    Tg(-11.0, 2.0, (g) => { box(0.9, 0.3, 0.02, steel, 0.1, 0, 0, g); box(0.25, 0.32, 0.05, red, -0.45, 0, 0, g); });
    Tg(-9.7, 1.95, (g) => { cyl(0.17, 0.17, 0.1, std(0xd8b56e), 0, 0, 0, g, 18).rotation.x = Math.PI / 2; });
    Tg(-8.6, 2.0, (g) => { for (let k = 0; k < 6; k++) cyl(0.03, 0.03, 0.4, [red, sageT, steel][k % 3], -0.25 + k * 0.1, 0, 0, g, 6); });
  }
  // sketch paper pinned to the pegboard (opens the toolbox)
  const sketchTex = canvasTex(512, 380, (g, w, h) => {
    g.fillStyle = "#f7f3e8"; g.fillRect(0, 0, w, h);
    g.strokeStyle = "rgba(85,124,159,.25)"; g.lineWidth = 1;
    for (let x = 0; x < w; x += 16) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
    for (let y = 0; y < h; y += 16) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
    g.strokeStyle = "#2f4f6b"; g.lineWidth = 3;
    g.strokeRect(60, 120, 180, 140); g.beginPath(); g.arc(150, 190, 40, 0, 7); g.stroke();
    g.beginPath(); g.moveTo(300, 260); g.lineTo(300, 110); g.lineTo(440, 110); g.lineTo(440, 220); g.stroke();
    g.font = "bold 44px Caveat, cursive"; g.fillStyle = "#2d3531"; g.fillText("my toolbox", 150, 70);
    g.font = "28px Caveat, cursive"; g.fillStyle = "#4f8a74"; g.fillText("code · robotics · CAD · tools", 110, 330);
    g.fillStyle = "#c9a35b"; g.beginPath(); g.arc(256, 14, 9, 0, 7); g.fill();
  });
  const sketch = mesh(new THREE.PlaneGeometry(1.25, 0.93), new THREE.MeshStandardMaterial({ map: sketchTex, roughness: 0.9, emissive: 0xffffff, emissiveIntensity: 0, emissiveMap: sketchTex }), -6.95, Y + 3.55, -9.7, study);
  sketch.rotation.z = -0.04;
  keep.add(sketch);
  // the workbench
  const benchTop = Y + 1.02;
  {
    const b = group(-9.8, Y, -9.0, study);
    tbox(6.8, 0.14, 1.6, M.planks, 0, 0.95, 0, b, 2);
    [[-3.2, -0.65], [3.2, -0.65], [-3.2, 0.65], [3.2, 0.65]].forEach(([x, z]) => box(0.14, 0.95, 0.14, M.walnutWood, x, 0.47, z, b));
    box(6.6, 0.08, 1.4, M.walnutWood, 0, 0.3, 0, b);
    // parts bins under the bench
    for (let k = 0; k < 8; k++) box(0.5, 0.3, 0.6, std([0xd8b56e, 0x557c9f, 0xb5473f, 0x5f9a80][k % 4], { roughness: 0.6 }), -2.8 + k * 0.8, 0.5, 0.1, b);
    // vise
    const v = group(-3.15, 1.02, 0.5, b);
    box(0.25, 0.18, 0.3, std(0x3a5f8a, { metalness: 0.4 }), 0, 0.09, 0, v); box(0.25, 0.12, 0.06, std(0xb8c0c6, { metalness: 0.7 }), 0, 0.22, 0.1, v);
    // soldering station with a little smoke
    const sol = group(-1.45, 1.02, 0.45, b);
    box(0.3, 0.12, 0.22, std(0x2b3036), 0, 0.06, 0, sol);
    box(0.12, 0.05, 0.01, std(0xff8a5a, { emissive: 0xff6a3a, emissiveIntensity: 1.4 }), 0, 0.08, 0.115, sol);
    const holder = mesh(new THREE.TorusGeometry(0.04, 0.008, 6, 12), std(0xb8c0c6, { metalness: 0.7 }), 0.25, 0.12, 0, sol);
    // oscilloscope with a live trace
    const osc = group(2.85, 1.02, -0.2, b, -0.15);
    box(0.62, 0.36, 0.34, std(0xd8d6cf), 0, 0.18, 0, osc);
    const scopeC = document.createElement("canvas"); scopeC.width = 256; scopeC.height = 160;
    const scopeT = new THREE.CanvasTexture(scopeC); scopeT.colorSpace = THREE.SRGBColorSpace;
    mesh(new THREE.PlaneGeometry(0.34, 0.22), new THREE.MeshBasicMaterial({ map: scopeT, toneMapped: false }), -0.08, 0.2, 0.171, osc);
    [0, 1, 2].forEach((k) => cyl(0.025, 0.025, 0.03, std(0x333333), 0.18, 0.28 - k * 0.08, 0.17, osc, 10).rotation.x = Math.PI / 2);
    let st = 0;
    upd.push((t) => {
      if ((st += 1) % 3) return;
      const g = scopeC.getContext("2d");
      g.fillStyle = "#06140e"; g.fillRect(0, 0, 256, 160);
      g.strokeStyle = "rgba(80,200,140,.25)"; g.lineWidth = 1;
      for (let x = 0; x < 256; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 160); g.stroke(); }
      for (let y = 0; y < 160; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(256, y); g.stroke(); }
      g.strokeStyle = "#7dffb4"; g.lineWidth = 2.5; g.beginPath();
      for (let x = 0; x < 256; x++) { const y = 80 + Math.sin(x * 0.07 + t * 5) * 40 * Math.sin(t * 0.7) + Math.sin(x * 0.31 + t * 9) * 6; x ? g.lineTo(x, y) : g.moveTo(x, y); }
      g.stroke();
      scopeT.needsUpdate = true;
    });
    // bench lamp with a magnifier
    const bl = group(1.55, 1.02, -0.5, b);
    cyl(0.1, 0.12, 0.04, std(0x2b3036), 0, 0.02, 0, bl, 14);
    const arm1 = box(0.03, 0.6, 0.03, std(0x2b3036), 0, 0.3, 0, bl); arm1.rotation.z = 0.3;
    const lh = mesh(new THREE.TorusGeometry(0.12, 0.025, 6, 20), std(0x2b3036), -0.25, 0.62, 0.15, bl); lh.rotation.x = 1.2;
    mesh(new THREE.CircleGeometry(0.11, 20), std(0xeaf6ff, { emissive: 0xeaf6ff, emissiveIntensity: 1.4, transparent: true, opacity: 0.8 }), -0.25, 0.61, 0.15, bl).rotation.x = -Math.PI / 2 + 1.2 - Math.PI / 2;
    const benchLight = new THREE.PointLight(0xf2f6ff, 6, 4, 1.8); benchLight.position.set(-9.8 + 1.3, Y + 1.7, -8.6); lights.push(benchLight);
  }
  // 3D printer on a little cabinet: the head moves and the print grows
  {
    const p = group(-6.0, Y, -6.0, study, -Math.PI / 2);
    box(0.7, 0.75, 0.6, M.walnutWood, 0, 0.375, 0, p);
    const fr = std(0x2b3036, { metalness: 0.4, roughness: 0.5 });
    [[-0.28, -0.24], [0.28, -0.24], [-0.28, 0.24], [0.28, 0.24]].forEach(([x, z]) => box(0.03, 0.6, 0.03, fr, x, 1.05, z, p));
    box(0.6, 0.03, 0.52, fr, 0, 1.35, 0, p);
    box(0.5, 0.02, 0.44, std(0x1d1f22), 0, 0.8, 0, p);
    const gantry = box(0.56, 0.04, 0.04, fr, 0, 1.1, 0, p);
    const head = box(0.08, 0.08, 0.08, std(0xd8b56e), 0, 1.06, 0, p);
    const print = cyl(0.1, 0.1, 0.01, std(0x5f9a80), 0, 0.82, 0, p, 6);
    cyl(0.1, 0.1, 0.06, std(0x5f9a80), 0.3, 1.45, -0.2, p, 14).rotation.x = Math.PI / 2;
    [gantry, head, print].forEach((o) => keep.add(o));
    upd.push((t) => {
      const k = (t * 0.05) % 1;
      const hgt = 0.01 + k * 0.2;
      print.scale.y = hgt / 0.01; print.position.y = 0.81 + hgt / 2;
      gantry.position.y = 0.84 + hgt + 0.06; head.position.y = 0.84 + hgt + 0.02;
      head.position.x = Math.sin(t * 6) * 0.09; head.position.z = Math.cos(t * 4.3) * 0.09;
    });
  }
  // builds on the bench (drag them; take them apart)
  const builds = [];
  {
    const steel = std(0xb8c0c6, { metalness: 0.75, roughness: 0.3 });
    const part = (grp, geo, mat, home, apart) => {
      const m = new THREE.Mesh(geo, mat);
      m.position.copy(home);
      m.userData = { home: home.clone(), apart: apart.clone(), build: grp.userData.key };
      grp.add(m);
      grp.userData.parts.push(m);
      return m;
    };
    const mk = (key, x) => { const g = group(x, benchTop, -9.0, study); g.userData = { key, parts: [] }; builds.push(g); keep.add(g); return g; };
    {
      const g = mk("sorter", -11.9);
      part(g, new THREE.BoxGeometry(1.3, 0.08, 0.5), std(0x2b3036), V(0, 0.25, 0), V(0, 0.04, 0.35));
      [-0.55, 0.55].forEach((x, i) => part(g, new THREE.BoxGeometry(0.08, 0.25, 0.08), steel, V(x, 0.12, -0.18), V(x * 1.4, 0.12, -0.45 + i * 0.05)));
      [-0.55, 0.55].forEach((x) => part(g, new THREE.BoxGeometry(0.08, 0.25, 0.08), steel, V(x, 0.12, 0.18), V(x * 1.5, 0.12, 0.62)));
      part(g, new THREE.BoxGeometry(0.28, 0.22, 0.3), std(0x557c9f), V(0.15, 0.4, 0), V(0.25, 0.11, -0.55));
      part(g, new THREE.SphereGeometry(0.05, 10, 8), new THREE.MeshBasicMaterial({ color: 0x9fe0ff }), V(0.15, 0.27, 0), V(0.65, 0.05, -0.25));
      [[0xc6463c, -0.7], [0x5f9a80, -0.95], [0xd8b56e, 0.75]].forEach(([c, x]) => part(g, new THREE.BoxGeometry(0.22, 0.18, 0.28), std(c), V(x, 0.09, 0.42), V(x * 1.25, 0.09, 0.62)));
      [0xc6463c, 0x5f9a80, 0xd8b56e].forEach((c, i) => part(g, new THREE.SphereGeometry(0.06, 12, 10), std(c), V(-0.35 + i * 0.25, 0.35, 0), V(-0.2 + i * 0.18, 0.06, 0.62)));
    }
    {
      const g = mk("crane", -9.8);
      part(g, new THREE.CylinderGeometry(0.32, 0.36, 0.14, 20), std(0x2b3036), V(0, 0.07, 0), V(0, 0.07, 0.2));
      part(g, new THREE.CylinderGeometry(0.2, 0.2, 0.12, 16), std(0xd8b56e), V(0, 0.2, 0), V(-0.55, 0.06, 0.2));
      part(g, new THREE.BoxGeometry(0.1, 1.1, 0.1), std(0xd8b56e), V(0, 0.8, 0), V(-0.2, 0.05, -0.45)).userData.lay = true;
      part(g, new THREE.BoxGeometry(1.1, 0.08, 0.08), std(0xd8b56e), V(0.35, 1.35, 0), V(0.5, 0.04, -0.35));
      part(g, new THREE.BoxGeometry(0.22, 0.16, 0.16), std(0x557c9f), V(-0.22, 1.35, 0), V(0.65, 0.08, 0.2));
      part(g, new THREE.CylinderGeometry(0.005, 0.005, 0.6, 4), std(0x2b3036), V(0.85, 1.05, 0), V(0.35, 0.02, 0.5)).userData.lay = true;
      part(g, new THREE.TorusGeometry(0.06, 0.015, 6, 12, Math.PI * 1.4), steel, V(0.85, 0.72, 0), V(0.0, 0.04, 0.55));
    }
    {
      const g = mk("tempbox", -7.7);
      part(g, new THREE.BoxGeometry(0.9, 0.45, 0.6), std(0xe9e3d6), V(0, 0.225, 0), V(0, 0.225, 0.1));
      part(g, new THREE.BoxGeometry(0.92, 0.06, 0.62), std(0x5f9a80), V(0, 0.48, 0), V(-0.75, 0.03, -0.25));
      part(g, new THREE.BoxGeometry(0.34, 0.16, 0.02), std(0x9fc7a8, { emissive: 0x4f8a74, emissiveIntensity: 0.8 }), V(0, 0.26, 0.31), V(0.7, 0.01, -0.3)).userData.lay = true;
      part(g, new THREE.BoxGeometry(0.5, 0.03, 0.35), std(0x2f5a46), V(0, 0.08, 0), V(0.75, 0.02, 0.3));
      part(g, new THREE.CylinderGeometry(0.03, 0.03, 0.18, 10), std(0x2b3036), V(0.3, 0.57, 0.15), V(-0.3, 0.02, 0.45)).userData.lay = true;
      part(g, new THREE.SphereGeometry(0.04, 10, 8), new THREE.MeshBasicMaterial({ color: 0xff8a6a }), V(-0.3, 0.52, 0.2), V(0.25, 0.04, 0.5));
    }
  }
  // the certificate wall (inner wall, facing the room) with picture lights
  const certFrames = [];
  function addFrame(w, h, y, z, tone, honor) {
    const f = group(-5.22, y, z, study, -Math.PI / 2);
    box(w + 0.18, h + 0.18, 0.06, std(honor ? 0x7a5a2c : 0x4a3426, { roughness: 0.45, metalness: honor ? 0.3 : 0 }), 0, 0, 0, f);
    box(w + 0.04, h + 0.04, 0.065, std(tone, { roughness: 0.6 }), 0, 0, 0.005, f);
    const c = document.createElement("canvas");
    c.width = 400; c.height = Math.round((400 * h) / w);
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
    const face = mesh(new THREE.PlaneGeometry(w - 0.1, h - 0.1), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.14 }), 0, 0, 0.04, f);
    if (honor) { box(w * 0.55, 0.05, 0.1, M.brass, 0, h / 2 + 0.2, 0.1, f); box(w * 0.5, 0.02, 0.05, glow(0xfff0d0, 2.2), 0, h / 2 + 0.17, 0.15, f); }
    f.userData = { canvas: c, tex, face };
    keep.add(face);
    certFrames.push(f);
    return f;
  }
  [-3.2, -1.07, 1.07, 3.2].forEach((z, i) => addFrame(1.5, 1.08, Y + 3.75, z, [0xc9a35b, 0xb9cfc2, 0xd8c7a3, 0xb7cadb][i], true));
  [[Y + 2.45, 7], [Y + 1.4, 6]].forEach(([y, n]) => { for (let i = 0; i < n; i++) addFrame(0.98, 0.74, y, (i - (n - 1) / 2) * 1.12, [0xc4dfcd, 0xc6dceb, 0xeadcc3, 0xd3e2d0, 0xefe4c2, 0xb9d3dd][(i + n) % 6], false); });
  // pennants
  const pennant = (text, bg, fg, x, y, z, ry) => { const m = mesh(new THREE.PlaneGeometry(1.4, 0.44), std(0xffffff, { map: T.banner(text, bg, fg), transparent: true, side: DS }), x, y, z, study); m.rotation.y = ry; return m; };
  pennant("BU", "#cc0000", "#ffffff", -5.25, Y + 3.7, 6.2, -Math.PI / 2);
  pennant("FTC 3371", "#1f3a4a", "#d8b56e", -5.25, Y + 3.1, 6.5, -Math.PI / 2);
  // study lights
  {
    const L = new THREE.PointLight(0xffe2b8, 26, 16, 1.6); L.position.set(-9.5, Y + 4.3, 1); lights.push(L);
    const L2 = new THREE.PointLight(0xfff0d6, 12, 8, 1.6); L2.position.set(-7.0, Y + 4, 0); lights.push(L2);
    const pend = group(-9.5, Y + 4.4, 1, study);
    cyl(0.01, 0.01, 0.6, M.brass, 0, 0.3, 0, pend, 6);
    mesh(new THREE.SphereGeometry(0.35, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), std(0xf6efe0, { emissive: 0xffd9a0, emissiveIntensity: 1.2, side: DS }), 0, 0, 0, pend).rotation.x = Math.PI;
  }

  // ============================================================ BEDROOM (upper right)
  const bed = new THREE.Group();
  I.add(bed);
  rug(5, 5.6, 9.6, Y, 0.8, T.rug("#d6cbbb", "#7f9e8c", "#c9a35b"), bed);
  {
    const b = group(12.2, Y, 0.6, bed);
    box(2.4, 0.4, 2.6, std(0xe9e3d6), 0, 0.3, 0, b);
    box(2.3, 0.35, 2.5, M.linen, -0.05, 0.68, 0, b);
    box(1.7, 0.14, 2.56, M.sage, -0.45, 0.9, 0, b);
    box(0.5, 0.16, 2.6, M.oat, -1.05, 0.92, 0, b);
    // channel-tufted headboard
    for (let k = 0; k < 9; k++) { const c = cyl(0.14, 0.14, 2.2, std(0xd8c7a3, { roughness: 0.9 }), 1.15, 1.5, -1.2 + k * 0.3, b, 12); }
    [-0.65, 0.65].forEach((z) => { const p = box(0.4, 0.3, 0.9, M.linen, 0.85, 1.02, z, b); p.rotation.z = 0.35; });
    [-0.65, 0.65].forEach((z) => { const p = box(0.35, 0.28, 0.75, std(0x9cc7b2), 0.65, 0.98, z * 0.9, b); p.rotation.z = 0.3; });
    const lumbar = box(0.3, 0.25, 0.6, std(0xc9a35b), 0.5, 0.97, 0, b); lumbar.rotation.z = 0.25;
  }
  // fairy lights over the headboard
  {
    const pts = [];
    for (let i = 0; i <= 60; i++) { const t = i / 60; pts.push([13.82, Y + 3.0 - Math.sin(t * Math.PI * 3) ** 2 * 0.35, -1.6 + t * 4.4]); }
    bed.add(bulbs(pts, 0xffe6b0, 0.03, 4));
  }
  // nightstands, lamps, VR headset, books
  [-1.5, 2.7].forEach((z, i) => {
    const n = group(13.4, Y, z, bed);
    box(0.7, 0.62, 0.55, std(0xe9e3d6), 0, 0.31, 0, n);
    box(0.64, 0.02, 0.5, M.oak, 0, 0.63, 0, n);
    tableLamp(n, 0, 0.63, 0, 1.1, 0xf6efe0);
    if (i === 0) { const vr = box(0.22, 0.1, 0.12, std(0xf1f1f1, { roughness: 0.3 }), -0.15, 0.7, 0.12, n); box(0.2, 0.06, 0.02, std(0x111111), -0.15, 0.7, 0.18, n); }
    else { box(0.26, 0.05, 0.2, std(0x2f4f6b), -0.15, 0.66, 0.1, n); box(0.08, 0.15, 0.01, std(0x111111), 0.1, 0.71, 0.15, n); }
  });
  const meBed = makeShiqi({ hands: "lap" });
  meBed.position.set(12.5, Y + 0.98, 0.6);
  meBed.rotation.y = -Math.PI / 2;
  bed.add(meBed);
  keep.add(meBed);
  const cat = makeCat();
  cat.position.set(11.5, Y + 0.97, 1.6);
  cat.rotation.y = 0.6;
  bed.add(cat);
  keep.add(cat);
  upd.push((t) => cat.userData.body.scale.set(1.3, 0.62 + Math.sin(t * 1.6) * 0.03, 1));
  // the laptop and its screen (drawn by the app)
  const laptop = group(12.02, Y + 1.1, 0.6, bed, -Math.PI / 2);
  const alu = std(0xc9ccd1, { metalness: 0.7, roughness: 0.3 });
  box(0.62, 0.02, 0.42, alu, 0, 0, 0, laptop);
  box(0.56, 0.003, 0.3, std(0x2a2c30), 0, 0.011, -0.02, laptop);
  const lid = group(0, 0.012, 0.21, laptop);
  lid.rotation.x = 1.85;
  box(0.62, 0.012, 0.42, alu, 0, 0, -0.21, lid);
  const screenCanvas = document.createElement("canvas");
  screenCanvas.width = 640; screenCanvas.height = 430;
  const screenTex = new THREE.CanvasTexture(screenCanvas);
  screenTex.colorSpace = THREE.SRGBColorSpace;
  const screen = mesh(new THREE.PlaneGeometry(0.58, 0.39), new THREE.MeshBasicMaterial({ map: screenTex }), 0, -0.007, -0.21, lid);
  screen.rotation.x = Math.PI / 2;
  keep.add(laptop);
  const screenGlow = new THREE.PointLight(0xcfe3ff, 2.5, 2.2, 2); screenGlow.position.set(11.95, Y + 1.5, 0.6); lights.push(screenGlow);
  // dress form with her design
  {
    const d = group(6.3, Y, 7.8, bed, 0.6);
    cyl(0.25, 0.3, 0.05, M.walnutWood, 0, 0.03, 0, d, 16);
    cyl(0.025, 0.025, 1.1, M.brass, 0, 0.58, 0, d, 8);
    const torso = sph(0.24, std(0xe9e1d2), 0, 1.4, 0, d, 18); torso.scale.set(1, 1.6, 0.75);
    const skirt = mesh(new THREE.CylinderGeometry(0.22, 0.55, 0.9, 24, 1, true), std(0x9cc7b2, { roughness: 0.8, side: DS }), 0, 0.85, 0, d);
    const bodice = mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.45, 20, 1, true), std(0xf3efe6, { side: DS }), 0, 1.45, 0, d);
    const sash = mesh(new THREE.TorusGeometry(0.235, 0.03, 6, 20), std(0xc9a35b), 0, 1.25, 0, d); sash.rotation.x = Math.PI / 2;
  }
  // golf bag with clubs in the corner
  {
    const g = group(13.2, Y, 9.0, bed);
    const bag = cyl(0.2, 0.18, 1, std(0xf3efe6, { roughness: 0.6 }), 0, 0.55, 0, g, 16); bag.rotation.z = 0.15;
    box(0.06, 0.6, 0.05, std(0x2f5a46), 0.15, 0.6, 0.15, g);
    for (let k = 0; k < 6; k++) { const a = k; const c = cyl(0.012, 0.012, 0.6, std(0xb8c0c6, { metalness: 0.8 }), Math.cos(a) * 0.08 - 0.08, 1.3, Math.sin(a) * 0.08, g, 6); c.rotation.z = 0.15; sph(0.045, std(k % 2 ? 0x2b3036 : 0xb8c0c6, { metalness: 0.6 }), Math.cos(a) * 0.08 - 0.13, 1.6, Math.sin(a) * 0.08, g, 8); }
  }
  // vanity with a round mirror and bulbs, a camera on top
  {
    const v = group(5.35, Y, 4.4, bed, Math.PI / 2);
    box(1.4, 0.06, 0.5, std(0xe9e3d6), 0, 0.78, 0, v);
    [[-0.65, -0.2], [0.65, -0.2], [-0.65, 0.2], [0.65, 0.2]].forEach(([x, z]) => cyl(0.025, 0.02, 0.78, M.brass, x, 0.39, z, v, 8));
    const mir = cyl(0.5, 0.5, 0.03, std(0xd9dfe4, { roughness: 0.02, metalness: 1 }), 0, 1.65, -0.22, v, 40); mir.rotation.x = Math.PI / 2;
    const mr = mesh(new THREE.TorusGeometry(0.5, 0.025, 8, 40), M.brass, 0, 1.65, -0.2, v);
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; sph(0.03, new THREE.MeshBasicMaterial({ color: new THREE.Color(0xfff0d6).multiplyScalar(3), toneMapped: false }), Math.cos(a) * 0.56, 1.65 + Math.sin(a) * 0.56, -0.18, v, 6); }
    const cam = group(0.45, 0.81, 0.05, v, 0.4);
    box(0.13, 0.08, 0.05, std(0x1d1f22), 0, 0.04, 0, cam);
    box(0.13, 0.03, 0.05, std(0xc9c4ba, { metalness: 0.6 }), 0, 0.095, 0, cam);
    const lens = cyl(0.03, 0.03, 0.05, std(0x111111), 0, 0.04, 0.045, cam, 14); lens.rotation.x = Math.PI / 2;
    [-0.3, -0.15].forEach((x, i) => cyl(0.025, 0.025, 0.1 + i * 0.03, std([0xd88a9a, 0xe9d6c0][i]), x, 0.86, 0.05, v, 10));
    box(0.5, 0.05, 0.42, std(0xd9ccb4), 0, 0.45, 0.55, v);
  }
  // record player on a credenza, a crate of records, speakers
  {
    const c = group(9.8, Y, -9.45, bed);
    box(2.4, 0.75, 0.5, M.walnutWood, 0, 0.38, 0, c);
    box(0.5, 0.12, 0.38, std(0x2b2422), -0.3, 0.81, 0, c);
    const vinyl = cyl(0.15, 0.15, 0.01, std(0x111111, { roughness: 0.3 }), -0.35, 0.88, 0, c, 32);
    cyl(0.05, 0.05, 0.012, std(0xc9a35b), -0.35, 0.885, 0, c, 16);
    const arm = box(0.2, 0.01, 0.01, std(0xb8c0c6, { metalness: 0.7 }), -0.15, 0.9, 0.08, c); arm.rotation.y = 0.5;
    keep.add(vinyl);
    upd.push((t) => (vinyl.rotation.y = t * 3.5));
    [-1.0, 0.8].forEach((x) => { box(0.3, 0.45, 0.28, std(0x3a2a20), x, 0.98, 0, c); cyl(0.08, 0.08, 0.02, std(0x222222), x, 1.0, 0.145, c, 16).rotation.x = Math.PI / 2; });
    const crate = group(11.4, Y, -9.3, bed);
    box(0.5, 0.35, 0.4, std(0xb8916a), 0, 0.18, 0, crate);
    for (let k = 0; k < 10; k++) box(0.3, 0.3, 0.01, std([0xc0392b, 0x2f4f6b, 0xd8b56e, 0x5f9a80, 0x111111][k % 5]), 0, 0.3, -0.15 + k * 0.03, crate);
  }
  // posters, a polaroid string, plants, pointe shoes by the door
  {
    const sp = mesh(new THREE.PlaneGeometry(1.1, 1.55), std(0xffffff, { map: T.subwayPoster() }), 7.3, Y + 2.6, -9.79, bed);
    box(1.18, 1.63, 0.03, std(0x111111), 7.3, Y + 2.6, -9.82, bed);
    const pts = [];
    for (let i = 0; i < 8; i++) {
      const x = 12.8 - i * 0.28, y = Y + 3.4 - Math.sin((i / 7) * Math.PI) * 0.2;
      box(0.22, 0.26, 0.01, std(0xfbfaf7), x, y - 0.15, 9.78, bed);
      box(0.18, 0.18, 0.012, std([0x9cc7b2, 0xbcd5e7, 0xeadcc3, 0xd8b56e][i % 4]), x, y - 0.13, 9.78, bed);
      pts.push([x, y, 9.76]);
    }
    bed.add(bulbs(pts, 0xffe6b0, 0.025, 4));
    plant(bed, 6.0, Y, -8.6, 1.5); plant(bed, 13.3, Y, 7.6, 1.2);
    [[6.0, -6.5], [6.2, -6.4]].forEach(([x, z]) => { const s = sph(0.08, std(0xf1c9c0, { roughness: 0.5 }), x, Y + 0.05, z, bed, 10); s.scale.set(0.8, 0.5, 1.8); });
    curtain(7.4, 11.6, 6, 9.1, 9.7, std(0xe9e1d2, { roughness: 1 }), bed);
    radiator(9.5, Y, 9.7, 2.4, bed);
    const L = new THREE.PointLight(0xffd7a8, 22, 14, 1.6); L.position.set(9.5, Y + 4.2, 1); lights.push(L);
    const L2 = new THREE.PointLight(0xffc98a, 8, 6, 1.8); L2.position.set(13.2, Y + 1.4, 0.6); lights.push(L2);
  }

  // ---------- fire (animated flame planes) used by the fireplaces
  function flames(parent, x, y, z, s) {
    const g = group(x, y, z, parent);
    const tex = canvasTex(64, 128, (c, w, h) => {
      const gr = c.createRadialGradient(w / 2, h * 0.75, 2, w / 2, h * 0.7, h * 0.7);
      gr.addColorStop(0, "rgba(255,240,180,1)"); gr.addColorStop(0.3, "rgba(255,160,60,.9)"); gr.addColorStop(0.7, "rgba(200,60,20,.4)"); gr.addColorStop(1, "rgba(0,0,0,0)");
      c.fillStyle = gr; c.beginPath(); c.moveTo(w * 0.1, h); c.quadraticCurveTo(w * 0.05, h * 0.4, w / 2, 0); c.quadraticCurveTo(w * 0.95, h * 0.4, w * 0.9, h); c.fill();
    });
    const fl = [];
    for (let i = 0; i < 5; i++) {
      const m = mesh(new THREE.PlaneGeometry(0.35 * s, 0.6 * s), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: new THREE.Color(1.6, 1.3, 1.1), toneMapped: false, side: DS }), (i - 2) * 0.16 * s, 0.25 * s, 0.05 * (i % 2), g);
      fl.push(m);
      keep.add(m);
    }
    const L = new THREE.PointLight(0xff9a4a, 10, 7, 1.8);
    upd.push((t) => {
      fl.forEach((m, i) => { m.scale.y = 0.8 + Math.sin(t * 9 + i * 1.7) * 0.15 + Math.sin(t * 23 + i) * 0.08; m.position.y = 0.25 * s * m.scale.y; });
      L.intensity = 9 + Math.sin(t * 13) * 2 + Math.sin(t * 31) * 1.2;
    });
    g.updateMatrixWorld(true);
    L.userData.follow = g;
    return L;
  }

  // chimney smoke (soft sprites drifting up)
  {
    const tex = dotTex();
    const puffs = [];
    smokeSources.forEach((src) => {
      for (let i = 0; i < 10; i++) {
        const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: 0x9aa0aa, transparent: true, opacity: 0.0, depthWrite: false }));
        sp.position.copy(src);
        root.add(sp);
        puffs.push({ sp, src, ph: i / 10 });
      }
    });
    upd.push((t) => puffs.forEach((p) => {
      const k = (t * 0.08 + p.ph) % 1;
      p.sp.position.set(p.src.x + k * 3 + Math.sin(t + p.ph * 9) * 0.4, p.src.y + k * 9, p.src.z + k * 1.2);
      p.sp.scale.setScalar(0.8 + k * 4);
      p.sp.material.opacity = Math.sin(k * Math.PI) * 0.22;
    }));
  }
  // gentle snow around the house
  {
    const n = mobile ? 900 : 2600;
    const arr = new Float32Array(n * 3), sp = [];
    for (let i = 0; i < n; i++) { arr.set([(rnd() - 0.5) * 120, rnd() * 40, (rnd() - 0.5) * 120 + 15], i * 3); sp.push(0.6 + rnd() * 0.8); }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(arr, 3));
    const snow = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size: 0.14, map: dotTex(), transparent: true, opacity: 0.85, depthWrite: false }));
    snow.frustumCulled = false;
    root.add(snow);
    upd.push((t, dt) => {
      const p = g.attributes.position;
      for (let i = 0; i < n; i++) {
        let y = p.getY(i) - dt * sp[i];
        if (y < 0) y += 40;
        p.setY(i, y);
        p.setX(i, p.getX(i) + Math.sin(t * 0.7 + i) * dt * 0.3);
      }
      p.needsUpdate = true;
    });
  }

  // ---------- lights into the group (positioned in house space)
  lights.forEach((L) => {
    if (L.userData.follow) { L.userData.follow.updateMatrixWorld(true); const p = new THREE.Vector3(); L.userData.follow.getWorldPosition(p); root.worldToLocal(p); L.position.copy(p).add(V(0, 0.5, 0)); }
    root.add(L);
  });
  if (mobile) lights.forEach((L, i) => { if (L.isPointLight && L.distance < 6) L.visible = false; });

  // ---------- batch everything static
  [yard, neighbors, I, study, bed, tools].forEach((g) => bake(g, keep));
  bake(root, keep);

  return {
    root,
    update: (t, dt) => upd.forEach((f) => f(t, dt)),
    objects: { letter, letterCanvas, letterTex, book, bookMat, bookHalo, ladder, sketch, builds, certFrames, laptop, lid, screenCanvas, screenTex, screen, meDesk, meBed, mailbox, flag, chand, doors, opening, cat },
    anchors: { benchTop, SH },
  };
}
