// New York: real Manhattan streets, Central Park paths, shoreline and lower
// Manhattan footprints (OpenStreetMap / NYC data, preprocessed into
// assets/city.json), a procedural lit-window facade shader for every
// building, hand-built landmarks at their real locations, the East River,
// Roosevelt Island, the Queensboro Bridge, the tram, Queens, the 7 train,
// and yellow cabs.
//
// World frame: x = grid-east (m), z = -grid-north (m). Origin: 5th Ave & 59th St.
import { THREE, std, glow, basic, mesh, box, cyl, sph, group, V, trs, instanced, rnd, reseed, range, canvasTex, dotTex, bake } from "./util.js";
import { mergeGeometries } from "./vendor/BufferGeometryUtils.js";

const LAT0 = 40.76445, LNG0 = -73.97305, TH = (29 * Math.PI) / 180;
const KX = Math.cos((LAT0 * Math.PI) / 180) * 111320, KY = 110540;
export function geo(lat, lng) {
  const e = (lng - LNG0) * KX, nn = (lat - LAT0) * KY;
  const a = e * Math.cos(TH) - nn * Math.sin(TH), n = e * Math.sin(TH) + nn * Math.cos(TH);
  return [a, n];
}
const W = (a, n) => [a, -n]; // frame -> world xz

// ------------------------------------------------------------ facade shader
export function facadeMaterial(env, instancedMode) {
  const uniforms = {
    ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog),
    uSunDir: { value: env.sunDir }, uSunCol: { value: env.sunCol }, uAmb: { value: env.amb },
    uSkyA: { value: env.skyTop }, uSkyB: { value: env.skyHorizon }, uLit: { value: 1 }, uTime: { value: 0 },
  };
  const m = new THREE.ShaderMaterial({
    uniforms, fog: true, lights: false,
    defines: instancedMode ? { INST: 1 } : {},
    vertexShader: /* glsl */`
      #include <common>
      #include <fog_pars_vertex>
      #include <logdepthbuf_pars_vertex>
      attribute vec4 aInfo;
      varying vec3 vN; varying vec3 vW; varying vec2 vF; varying vec4 vInfo; varying float vTop;
      void main(){
        #ifdef INST
          mat4 im = instanceMatrix;
        #else
          mat4 im = mat4(1.0);
        #endif
        vec4 wp = modelMatrix * im * vec4(position, 1.0);
        vec3 nl = normal;
        #ifdef INST
          vec3 sc = vec3(length(im[0].xyz), length(im[1].xyz), length(im[2].xyz));
          vec3 lp = position * sc;
          float horiz = abs(nl.x) > 0.5 ? lp.z : lp.x;
          vF = vec2(horiz + aInfo.y * 37.0, lp.y);
          vTop = sc.y;
        #else
          vec3 wn0 = normalize(mat3(modelMatrix) * nl);
          float horiz = abs(wn0.x) > abs(wn0.z) ? wp.z : wp.x;
          vF = vec2(horiz, wp.y);
          vTop = aInfo.z;
        #endif
        vN = normalize(mat3(modelMatrix) * mat3(im) * nl);
        vW = wp.xyz; vInfo = aInfo;
        vec4 mvPosition = viewMatrix * wp;
        gl_Position = projectionMatrix * mvPosition;
        #include <logdepthbuf_vertex>
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      #include <common>
      #include <fog_pars_fragment>
      #include <logdepthbuf_pars_fragment>
      uniform vec3 uSunDir; uniform vec3 uSunCol; uniform vec3 uAmb; uniform vec3 uSkyA; uniform vec3 uSkyB; uniform float uLit;
      varying vec3 vN; varying vec3 vW; varying vec2 vF; varying vec4 vInfo; varying float vTop;
      float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      void main(){
        #include <logdepthbuf_fragment>
        int style = int(vInfo.x + 0.5);
        float seed = vInfo.y;
        vec3 wall = vec3(.40,.22,.16); float bay = 3.4; float flo = 3.3;
        vec2 w0 = vec2(.3,.3); vec2 w1 = vec2(.7,.86); float litP = .30; float cornice = 1.0; float store = 1.0;
        if (style == 1) { wall = vec3(.62,.57,.48); bay = 3.2; flo = 3.4; litP = .34; }
        else if (style == 2) { wall = vec3(.10,.13,.17); bay = 1.55; flo = 3.9; w0 = vec2(.06,.16); w1 = vec2(.94,.98); litP = .26; cornice = 0.0; store = 0.0; }
        else if (style == 3) { wall = vec3(.30,.18,.12); bay = 2.5; flo = 3.7; w0 = vec2(.26,.22); w1 = vec2(.74,.86); litP = .38; store = 0.0; }
        else if (style == 4) { wall = vec3(.66,.63,.57); bay = 3.0; flo = 3.0; w0 = vec2(.18,.3); w1 = vec2(.82,.82); litP = .3; }
        else if (style == 5) { wall = vec3(.50,.31,.20); bay = 3.0; flo = 3.2; litP = .36; }
        else if (style == 6) { wall = vec3(.08,.10,.14); bay = 1.8; flo = 3.4; w0 = vec2(.05,.12); w1 = vec2(.95,.98); litP = .24; cornice = 0.0; store = 0.0; }
        else if (style == 7) { wall = vec3(.62,.48,.36); bay = 1.4; flo = 3.6; w0 = vec2(.22,.06); w1 = vec2(.78,.94); litP = .30; cornice = 0.0; store = 0.0; }
        else if (style == 8) { wall = vec3(.80,.79,.76); bay = 5.0; flo = 4.7; w0 = vec2(.16,.18); w1 = vec2(.84,.86); litP = .33; cornice = 0.0; store = 0.0; }
        else if (style == 9) { wall = vec3(.66,.62,.54); bay = 2.0; flo = 3.8; w0 = vec2(.3,.14); w1 = vec2(.7,.92); litP = .34; cornice = 0.0; store = 0.0; }
        vec3 n = normalize(vN);
        float roof = step(0.6, n.y);
        vec2 cell = vF / vec2(bay, flo);
        vec2 id = floor(cell); vec2 f = fract(cell);
        float inWin = step(w0.x, f.x) * step(f.x, w1.x) * step(w0.y, f.y) * step(f.y, w1.y) * (1.0 - roof);
        float corn = cornice * smoothstep(1.5, 0.7, vTop - vF.y) * (1.0 - roof);
        float rr = h21(id + seed * 91.7);
        float floorLit = h21(vec2(id.y, seed * 3.3));
        float p = litP * uLit * (0.55 + floorLit * 0.9);
        float lit = step(rr, p) * inWin * (1.0 - corn);
        float r2 = h21(id * 1.7 + seed);
        vec3 lc = r2 < .58 ? vec3(1.0, .74, .42) : (r2 < .86 ? vec3(1.0, .88, .66) : vec3(.62, .76, 1.0));
        if (style == 2 || style == 6 || style == 8) lc = (r2 < .5 ? vec3(.92, .95, 1.0) : vec3(1.0, .86, .62)) * .72;
        vec3 base = wall * (0.82 + 0.36 * h21(vec2(seed, seed * 3.1)));
        float diff = max(dot(n, uSunDir), 0.0);
        vec3 col = base * (uAmb + uSunCol * diff);
        vec3 Vv = normalize(cameraPosition - vW);
        float fres = pow(1.0 - max(dot(Vv, n), 0.0), 3.0);
        vec3 rf = reflect(-Vv, n);
        vec3 skyRef = mix(uSkyB, uSkyA, clamp(rf.y * 2.0, 0.0, 1.0));
        vec3 glassC = mix(vec3(.02, .025, .04), skyRef * .55, .1 + .45 * fres);
        col = mix(col, glassC, inWin);
        col = mix(col, lc * (1.05 + .6 * r2), lit);
        // shop windows on the ground floor
        float sf = store * step(vF.y, 4.3) * step(0.5, vF.y) * step(.08, f.x) * step(f.x, .92) * (1.0 - roof);
        col = mix(col, vec3(1.0, .80, .52) * 1.5, sf * step(.3, h21(vec2(id.x, seed))));
        // cornice and spandrels
        col = mix(col, base * 1.3 * (uAmb + uSunCol * diff) + vec3(.02), corn);
        if (style == 2 || style == 6) col = mix(col, vec3(.05,.06,.08), (1.0 - step(.12, f.y)) * (1.0 - roof) * .8);
        // far away the window grid shrinks below a pixel: fade to its average so it doesn't shimmer
        vec2 fw = fwidth(cell);
        float aa = smoothstep(.35, .95, max(fw.x, fw.y)) * (1.0 - roof);
        float cov = (w1.x - w0.x) * (w1.y - w0.y);
        float litAvg = cov * litP * uLit;
        vec3 wallC = base * (uAmb + uSunCol * diff);
        vec3 avgC = wallC * (1.0 - cov) + glassC * (cov - litAvg) + lc * .9 * litAvg;
        col = mix(col, avgC, aa);
        // roofs
        col = mix(col, vec3(.06, .06, .07) + uAmb * .05, roof);
        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        #include <fog_fragment>
      }`,
  });
  return m;
}

// geometry with a constant aInfo attribute (for non-instanced buildings)
function withInfo(geom, style, seed, top, extra = 0) {
  const g = geom.index ? geom.toNonIndexed() : geom;
  const n = g.attributes.position.count;
  const arr = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) arr.set([style, seed, top, extra], i * 4);
  g.setAttribute("aInfo", new THREE.BufferAttribute(arr, 4));
  ["uv"].forEach((k) => g.deleteAttribute(k));
  return g;
}
const tierBox = (w, h, d, x, y, z, style, seed, ry = 0) => {
  const g = new THREE.BoxGeometry(w, h, d);
  if (ry) g.rotateY(ry);
  g.translate(x, y + h / 2, z);
  return withInfo(g, style, seed, y + h);
};

// ------------------------------------------------------------ water
function waterMaterial(env) {
  const uniforms = {
    ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog),
    uTime: { value: 0 }, uSkyA: { value: env.skyTop }, uSkyB: { value: env.skyHorizon }, uGlow: { value: env.horizonGlow },
  };
  return new THREE.ShaderMaterial({
    uniforms, fog: true, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      #include <common>
      #include <fog_pars_vertex>
      #include <logdepthbuf_pars_vertex>
      varying vec3 vW;
      void main(){ vec4 wp = modelMatrix * vec4(position,1.); vW = wp.xyz; vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
        #include <logdepthbuf_vertex>
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      #include <common>
      #include <fog_pars_fragment>
      #include <logdepthbuf_pars_fragment>
      uniform float uTime; uniform vec3 uSkyA; uniform vec3 uSkyB; uniform vec3 uGlow;
      varying vec3 vW;
      float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
      float n2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f); return mix(mix(h(i),h(i+vec2(1,0)),f.x), mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x), f.y); }
      void main(){
        #include <logdepthbuf_fragment>
        vec2 p = vW.xz * .045;
        float t = uTime * .35;
        vec2 d = vec2(n2(p + t) - .5, n2(p * 1.7 - t + 9.) - .5) + .5 * vec2(n2(p * 4. + t * 2.) - .5, n2(p * 4.3 - t * 1.6) - .5);
        vec3 nrm = normalize(vec3(d.x * .5, 1., d.y * .5));
        vec3 V = normalize(cameraPosition - vW);
        float fres = .08 + .92 * pow(1. - max(dot(V, nrm), 0.), 4.);
        vec3 r = reflect(-V, nrm);
        vec3 sky = mix(uSkyB, uSkyA, clamp(r.y * 2.5, 0., 1.));
        // warm streaks of city lights reflected on the river
        float streak = pow(n2(vec2(vW.x * .02, vW.z * .6) + d * 3.), 6.) * 1.6;
        vec3 col = mix(vec3(.02, .035, .06), sky, .22 + .7 * fres) + uGlow * streak * (.35 + .65 * fres);
        gl_FragColor = vec4(col, 1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        #include <fog_fragment>
      }`,
  });
}

// ------------------------------------------------------------ helpers
function polyShape(pts) {
  const s = new THREE.Shape();
  pts.forEach(([a, n], i) => (i ? s.lineTo(a, n) : s.moveTo(a, n)));
  return s;
}
// flat shape on the ground (frame coords -> world xz)
function groundShape(pts, mat, y, holes = []) {
  const sh = polyShape(pts);
  holes.forEach((h) => { const p = new THREE.Path(); h.forEach(([a, n], i) => (i ? p.lineTo(a, n) : p.moveTo(a, n))); sh.holes.push(p); });
  const g = new THREE.ShapeGeometry(sh);
  g.rotateX(-Math.PI / 2); // (a, n, 0) -> (a, 0, -n)
  const m = new THREE.Mesh(g, mat);
  m.position.y = y;
  return m;
}
// ribbon along a polyline (frame coords)
function ribbons(lines, width, y) {
  const pos = [];
  for (const L of lines) {
    for (let k = 0; k + 3 < L.length; k += 2) {
      const ax = L[k], an = -L[k + 1], bx = L[k + 2], bn = -L[k + 3];
      const dx = bx - ax, dz = bn - an, len = Math.hypot(dx, dz) || 1;
      const px = (-dz / len) * width / 2, pz = (dx / len) * width / 2;
      pos.push(ax + px, y, an + pz, bx + px, y, bn + pz, bx - px, y, bn - pz, ax + px, y, an + pz, bx - px, y, bn - pz, ax - px, y, an - pz);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}
function sampleLines(lines, every, offset, jitter = 0) {
  const pts = [];
  for (const L of lines) {
    let carry = rnd() * every;
    for (let k = 0; k + 3 < L.length; k += 2) {
      const ax = L[k], an = L[k + 1], bx = L[k + 2], bn = L[k + 3];
      const len = Math.hypot(bx - ax, bn - an);
      const ux = (bx - ax) / (len || 1), un = (bn - an) / (len || 1);
      let s = carry;
      while (s < len) {
        const side = pts.length % 2 ? 1 : -1;
        pts.push([ax + ux * s - un * offset * side + (rnd() - 0.5) * jitter, an + un * s + ux * offset * side]);
        s += every;
      }
      carry = s - len;
    }
  }
  return pts;
}
function pointsLayer(pts, y, color, size, opacity = 1) {
  const arr = new Float32Array(pts.length * 3);
  pts.forEach(([a, n], i) => arr.set([a, typeof y === "function" ? y(i) : y, -n], i * 3));
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(arr, 3));
  const m = new THREE.PointsMaterial({ color, size, map: dotTex(), transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true, toneMapped: false });
  const p = new THREE.Points(g, m);
  p.frustumCulled = false;
  return p;
}

// ------------------------------------------------------------ the city
export function buildCity(data, env, { mobile = false, corridor = [], flight = [] } = {}) {
  reseed(424242);
  const root = new THREE.Group();
  const upd = [];
  const shoreE = (n) => interp(data.shoreE, n);
  const shoreW = (n) => interp(data.shoreW, n);
  const shoreQ = (n) => shoreE(n) + 650;
  function interp(tab, n) {
    if (n <= tab[0][0]) return tab[0][1];
    for (let i = 0; i < tab.length - 1; i++) if (n <= tab[i + 1][0]) { const t = (n - tab[i][0]) / (tab[i + 1][0] - tab[i][0]); return tab[i][1] + (tab[i + 1][1] - tab[i][1]) * t; }
    return tab[tab.length - 1][1];
  }

  // ---------- water everywhere, land on top
  const water = new THREE.Mesh(new THREE.PlaneGeometry(40000, 40000), waterMaterial(env));
  water.rotation.x = -Math.PI / 2;
  water.position.y = -1.2; // well under every ground plane
  root.add(water);
  upd.push((t) => (water.material.uniforms.uTime.value = t));

  const DS = THREE.DoubleSide;
  const asphalt = std(0x24252a, { roughness: 0.9, side: DS, emissive: 0x120e0a, emissiveIntensity: 1 });
  const landMat = std(0x303036, { roughness: 1, side: DS, emissive: 0x0b0907, emissiveIntensity: 1 });
  const manhattan = groundShape(data.land, landMat, 0.6);
  root.add(manhattan);
  root.add(groundShape(data.ri, std(0x2e3432, { roughness: 1, side: DS, emissive: 0x0b0907, emissiveIntensity: 1 }), 0.6));
  // Queens / Brooklyn
  const q = [];
  for (let n = -9000; n <= 9000; n += 250) q.push([shoreQ(n), n]);
  q.push([12000, 9000], [12000, -9000]);
  // leave a hole where the hand-built Forest Hills Gardens neighborhood sits
  const [hA, hN] = corridor.length ? corridor[corridor.length - 1] : [3100, 1500];
  const hole = Array.from({ length: 48 }, (_, i) => [hA + Math.cos(-i / 48 * Math.PI * 2) * 428, hN + Math.sin(-i / 48 * Math.PI * 2) * 428]);
  root.add(groundShape(q, std(0x2f3033, { roughness: 1, side: DS, emissive: 0x0b0907, emissiveIntensity: 1 }), 0.6, [hole]));
  // New Jersey
  const nj = [];
  for (let n = -9000; n <= 9000; n += 250) nj.push([shoreW(n) - 1300, n]);
  nj.push([-14000, 9000], [-14000, -9000]);
  root.add(groundShape(nj.reverse(), std(0x202124, { roughness: 1, side: DS }), 0.6));
  // bulkhead edges: a thin lit promenade along the shore
  const promE = [], promW = [];
  for (let n = -6000; n <= 6000; n += 18) { promE.push([shoreE(n) - 6, n]); promW.push([shoreW(n) + 6, n]); }
  root.add(pointsLayer(promE.filter((_, i) => i % 2), 4, 0xffe2b0, 5, 0.9));
  root.add(pointsLayer(promW.filter((_, i) => i % 2), 4, 0xffe2b0, 5, 0.9));

  // ---------- streets
  const R = data.roads;
  root.add(new THREE.Mesh(ribbons(R.major, 12, 0.75), asphalt));
  root.add(new THREE.Mesh(ribbons(R.hwy, 18, 0.8), std(0x18191c, { roughness: 1, side: DS })));
  // streetlights: warm along avenues/streets, white LED on highways
  const lampPts = sampleLines(R.major, 30, 7.5);
  const lamps = pointsLayer(mobile ? lampPts.filter((_, i) => i % 2) : lampPts, 9, 0xffc98a, 10, 0.85);
  root.add(lamps);
  root.add(pointsLayer(sampleLines(R.hwy, 26, 9), 10, 0xe8f0ff, 9, 0.8));
  // traffic-ish red/white streaks on the FDR and West Side Highway
  root.add(pointsLayer(sampleLines(R.hwy, 9, 3, 2), 1.5, 0xff5a4a, 4, 0.75));
  root.add(pointsLayer(sampleLines(R.hwy, 11, -3, 2), 1.5, 0xfff1d6, 4, 0.8));

  // ---------- Central Park
  const P = data.park; // [a0, a1, n0, n1]
  const parkTex = canvasTex(256, 1024, (g, w, h) => {
    g.fillStyle = "#2c3f27"; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 9000; i++) { g.fillStyle = `rgba(${20 + rnd() * 40},${50 + rnd() * 40},${20 + rnd() * 20},${0.25 * rnd()})`; g.fillRect(rnd() * w, rnd() * h, 2 + rnd() * 3, 2 + rnd() * 3); }
    // lawns
    data.lawns.forEach(([nm, la, ln, ra, rn]) => {
      const x = ((la - P[0]) / (P[1] - P[0])) * w, y = h - ((ln - P[2]) / (P[3] - P[2])) * h;
      g.fillStyle = "#4a6a3a"; g.beginPath(); g.ellipse(x, y, (ra / (P[1] - P[0])) * w, (rn / (P[3] - P[2])) * h, 0, 0, 7); g.fill();
    });
    // rock outcrops (Manhattan schist)
    for (let i = 0; i < 60; i++) { g.fillStyle = "rgba(90,90,95,.6)"; g.beginPath(); g.ellipse(rnd() * w, rnd() * h, 2 + rnd() * 5, 1 + rnd() * 3, rnd() * 3, 0, 7); g.fill(); }
  });
  const parkG = new THREE.PlaneGeometry(P[1] - P[0], P[3] - P[2]);
  parkG.rotateX(-Math.PI / 2);
  const park = new THREE.Mesh(parkG, std(0xffffff, { map: parkTex, roughness: 1 }));
  park.position.set((P[0] + P[1]) / 2, 0.7, -(P[2] + P[3]) / 2);
  root.add(park);
  // stone wall along the park perimeter
  const wallMat = std(0x6d6a63, { roughness: 1 });
  [[P[0], P[2], P[1], P[2]], [P[0], P[3], P[1], P[3]], [P[0], P[2], P[0], P[3]], [P[1], P[2], P[1], P[3]]].forEach(([a0, n0, a1, n1]) => {
    box(Math.abs(a1 - a0) + 1.2, 1.1, Math.abs(n1 - n0) + 1.2, wallMat, (a0 + a1) / 2, 1.2, -(n0 + n1) / 2, root);
  });
  root.add(new THREE.Mesh(ribbons(R.drive, 8, 0.85), asphalt));
  root.add(new THREE.Mesh(ribbons(R.path, 3, 0.86), std(0x8d877b, { roughness: 1, side: DS })));
  // park lamps (the classic NYC "Central Park" lampposts)
  root.add(pointsLayer(sampleLines(R.path, 32, 2.2), 4.2, 0xfff0cf, 6, 0.95));
  root.add(pointsLayer(sampleLines(R.drive, 30, 5.5), 5, 0xfff0cf, 7, 0.95));
  // water bodies
  const wm = waterMaterial(env);
  upd.push((t) => (wm.uniforms.uTime.value = t));
  Object.entries(data.water).forEach(([k, poly]) => {
    if (!Array.isArray(poly)) return;
    root.add(groundShape(poly, wm, 0.92));
  });
  {
    const res = [];
    for (let i = 0; i < 64; i++) { const a = (i / 64) * Math.PI * 2; res.push([-415 + Math.cos(a) * 330, 2470 + Math.sin(a) * 400]); }
    root.add(groundShape(res, wm, 0.92));
    // running-track lamps around the Reservoir
    const rl = [];
    for (let i = 0; i < 90; i++) { const a = (i / 90) * Math.PI * 2; rl.push([-415 + Math.cos(a) * 345, 2470 + Math.sin(a) * 415]); }
    root.add(pointsLayer(rl, 3.5, 0xfff0cf, 6, 0.9));
    // a fountain jet in the middle
    const jet = mesh(new THREE.ConeGeometry(2, 22, 10, 1, true), new THREE.MeshBasicMaterial({ color: 0xcfe8ff, transparent: true, opacity: 0.35, depthWrite: false }), -415, 11, -2470, root);
  }
  // trees: October in Central Park (mostly green, turning gold, orange and red)
  {
    const T = data.trees, ST = data.streetTrees;
    const geoT = new THREE.IcosahedronGeometry(1, 0);
    geoT.translate(0, 0.9, 0);
    const mat = std(0xffffff, { flatShading: true, roughness: 0.95 });
    const palette = [0x3d5a32, 0x4a6b36, 0x557a3c, 0x36522c, 0xb88a2c, 0xc77a2a, 0xa64b22, 0x8e7a2c];
    const weights = [0.18, 0.18, 0.14, 0.12, 0.14, 0.11, 0.06, 0.07];
    const pickCol = () => { let r = rnd(), k = 0; while (r > weights[k] && k < weights.length - 1) { r -= weights[k]; k++; } return palette[k]; };
    const take = (arr, stride, keep) => { const out = []; for (let i = 0; i < arr.length; i += stride) if (rnd() < keep) out.push(arr.slice(i, i + stride)); return out; };
    const park = take(T, 3, mobile ? 0.45 : 1);
    const street = take(ST, 3, mobile ? 0.25 : 0.7);
    const all = [...park.map((t) => [...t, 1]), ...street.map((t) => [...t, 0])];
    const im = new THREE.InstancedMesh(geoT, mat, all.length);
    const c = new THREE.Color();
    all.forEach(([a, n, s, isPark], i) => {
      const sx = s * range(0.85, 1.15), sy = s * range(0.85, 1.25);
      im.setMatrixAt(i, trs(a, 0.7 + s * 0.35, -n, rnd() * 6, sx, sy, s * range(0.85, 1.15)));
      im.setColorAt(i, c.setHex(isPark ? pickCol() : palette[Math.floor(rnd() * 4)]).multiplyScalar(range(0.75, 1.05)));
    });
    root.add(im);
  }

  // ---------- buildings (instanced boxes with the facade shader)
  const fm = facadeMaterial(env, true);
  const fmS = facadeMaterial(env, false);
  upd.push(() => {});
  const inCorr = (a, n, r) => corridor.some(([ca, cn]) => (a - ca) ** 2 + (n - cn) ** 2 < r * r);
  const list = [];
  const B = data.bldg;
  for (let i = 0; i < B.length; i += 6) {
    const a = B[i], n = B[i + 1], w = B[i + 2], d = B[i + 3], h = B[i + 4], st = B[i + 5];
    if (h < 26 && !inCorr(a, n, mobile ? 1300 : 2200) && rnd() < (mobile ? 0.6 : 0.35)) continue;
    list.push([a, n, w, d, h, st % 10, Math.floor(st / 10), 0]);
  }
  const F = data.fill;
  for (let i = 0; i < F.length; i += 7) {
    if (mobile && rnd() < 0.5) continue;
    list.push([F[i], F[i + 1], F[i + 2], F[i + 3], F[i + 4], F[i + 5] % 10, Math.floor(F[i + 5] / 10), F[i + 6]]);
  }
  // Queens: Long Island City, Astoria and Sunnyside, on a grid turned from Manhattan's
  const houseA = corridor.length ? corridor[corridor.length - 1][0] : 3100, houseN = corridor.length ? corridor[corridor.length - 1][1] : 1500;
  {
    const rot = (18 * Math.PI) / 180, ca = Math.cos(rot), sa = Math.sin(rot);
    for (let gx = -40; gx < 40; gx++) for (let gy = -45; gy < 45; gy++) {
      const bx = gx * 95, by = gy * 210;
      const a0 = 2200 + bx * ca - by * sa, n0 = 800 + bx * sa + by * ca;
      if (a0 < shoreQ(n0) + 30 || a0 > 6200 || n0 < -2600 || n0 > 4800) continue;
      const dh = Math.hypot(a0 - houseA, n0 - houseN);
      if (dh < 420) continue; // Forest Hills Gardens around the house is built by hand
      if (mobile && dh > 2400 && rnd() < 0.6) continue;
      const nearRiver = a0 < shoreQ(n0) + 500;
      for (let k = 0; k < 7; k++) {
        const along = -88 + k * 27 + rnd() * 4;
        for (const side of [-1, 1]) {
          if (rnd() < 0.15) continue;
          const lx = side * 24, ly = along;
          const a = a0 + lx * ca - ly * sa, n = n0 + lx * sa + ly * ca;
          let h = 9 + rnd() * 8, st = rnd() < 0.7 ? 5 : 0, w = 16 + rnd() * 3, d = 24 + rnd() * 3;
          if (rnd() < 0.08) { h = 18 + rnd() * 10; st = 4; }
          if (nearRiver && n0 < 900 && rnd() < 0.18) { h = 70 + rnd() * 140; st = rnd() < 0.5 ? 6 : 2; w = 30; d = 30; }
          list.push([a, n, w, d, h, st, rnd() < 0.2 && st !== 6 ? 1 : 0, 18]);
        }
      }
    }
  }
  // New Jersey waterfront: Hoboken, Jersey City, Weehawken
  for (let i = 0; i < (mobile ? 500 : 1400); i++) {
    const n = -7000 + rnd() * 12000, a = shoreW(n) - 1330 - rnd() * 1800;
    const jc = n < -4500 && a > shoreW(n) - 2000;
    const h = jc && rnd() < 0.5 ? 60 + rnd() * 160 : 10 + rnd() * 25;
    list.push([a, n, 18 + rnd() * 20, 18 + rnd() * 20, h, h > 60 ? 2 : 5, 0, rnd() * 90]);
  }
  {
    // keep the drone's flight path clear: trim any building that would poke into it
    const segs = [];
    for (let k = 0; k < flight.length - 1; k++) segs.push([flight[k], flight[k + 1]]);
    if (segs.length) list.forEach((b) => {
      const [a, n, w, d, h] = b;
      const r = Math.max(w, d) * 0.6 + 45;
      for (const [p, q] of segs) {
        const da = q[0] - p[0], dn = q[2] - p[2], L2 = da * da + dn * dn || 1;
        const t = Math.max(0, Math.min(1, ((a - p[0]) * da + (n - p[2]) * dn) / L2));
        const ca = p[0] + da * t, cn = p[2] + dn * t, cy = p[1] + (q[1] - p[1]) * t;
        if ((a - ca) ** 2 + (n - cn) ** 2 < r * r && b[4] > cy - 22) b[4] = Math.max(8, cy - 22);
      }
    });
    const geoB = new THREE.BoxGeometry(1, 1, 1);
    geoB.translate(0, 0.5, 0);
    geoB.deleteAttribute("uv");
    const im = new THREE.InstancedMesh(geoB, fm, list.length);
    const info = new Float32Array(list.length * 4);
    const wtPos = [];
    list.forEach(([a, n, w, d, h, st, wt, rotDeg], i) => {
      im.setMatrixAt(i, trs(a, 0.6, -n, ((rotDeg || 0) * Math.PI) / 180, w, h, d));
      info.set([st, rnd() * 100, h, 0], i * 4);
      if (wt && (inCorr(a, n, 1600) || rnd() < 0.3)) wtPos.push([a + (rnd() - 0.5) * w * 0.5, h + 0.6, n + (rnd() - 0.5) * d * 0.5]);
    });
    geoB.setAttribute("aInfo", new THREE.InstancedBufferAttribute(info, 4));
    im.frustumCulled = false;
    root.add(im);
    // the water towers on prewar roofs
    const tank = mergeGeometries([
      new THREE.CylinderGeometry(1.6, 1.6, 3.4, 7).translate(0, 3.9, 0),
      new THREE.ConeGeometry(1.75, 1.3, 7, 1, true).translate(0, 6.25, 0),
      new THREE.BoxGeometry(2.4, 2.3, 0.16).translate(0, 1.15, 0),
      new THREE.BoxGeometry(0.16, 2.3, 2.4).translate(0, 1.15, 0),
    ].map((g) => { g.deleteAttribute("uv"); return g.index ? g.toNonIndexed() : g; }));
    const tanks = instanced(tank, std(0x4a3a2c, { roughness: 0.95 }), wtPos.map(([a, y, n]) => trs(a, y, -n, rnd() * 3, 1, 1, 1)));
    root.add(tanks);
  }
  // real lower Manhattan footprints
  {
    const geos = [];
    data.down.forEach((b, j) => {
      const h = b[0], pts = [];
      for (let k = 1; k < b.length; k += 2) pts.push(new THREE.Vector2(b[k], b[k + 1]));
      if (pts.length < 3) return;
      const shape = new THREE.Shape(pts);
      const g = new THREE.ExtrudeGeometry(shape, { depth: h, bevelEnabled: false });
      g.rotateX(-Math.PI / 2); // (a, n, z) -> (a, z, -n)
      g.translate(0, 0.6, 0);
      const style = h > 120 ? 2 : h > 50 ? (j % 3 ? 1 : 2) : 0;
      geos.push(withInfo(g, style, j * 1.37, h));
    });
    const merged = mergeGeometries(geos, false);
    if (merged) root.add(new THREE.Mesh(merged, fmS));
  }

  // ---------- landmarks
  const LM = data.landmarks;
  const lm = (k) => LM[k];
  const lgeos = [];
  const deco = new THREE.Group();
  root.add(deco);
  const at = (k, f) => { const v = LM[k]; if (v) f(v[0], -v[1], v[2]); };
  const S = (st) => st; // style ids
  const steelGlass = 2, lime = 1, brickS = 0;
  const gold = glow(0xffcf7a, 2.2), white = glow(0xf4f1e8, 2.6), red = glow(0xff3b2a, 3);
  const crownLight = (x, y, z, w, h, d, m = gold) => box(w, h, d, m, x, y, z, deco);
  // Central Park Tower (472 m)
  at("cpt", (x, z, h) => {
    lgeos.push(tierBox(52, 300, 30, x, 0.6, z, steelGlass, 11.1), tierBox(44, 172, 26, x - 3, 300.6, z, steelGlass, 11.3));
    crownLight(x - 3, h - 2, z, 44.5, 3, 26.5, white);
  });
  // 111 West 57th: the slender, feathered terracotta tower (435 m)
  at("w111", (x, z, h) => {
    const W0 = 18, D0 = 60;
    lgeos.push(tierBox(W0, 150, D0, x, 0.6, z, 7, 21.1));
    const steps = 24;
    for (let i = 0; i < steps; i++) {
      const t = i / steps, y = 150 + t * (h - 150), hh = (h - 150) / steps;
      const d = D0 * (1 - Math.pow(t, 1.35) * 0.93);
      lgeos.push(tierBox(W0, hh * 0.99, d, x, y + 0.6, z - (D0 - d) / 2, 7, 21.1));
    }
    crownLight(x, h - 6, z - D0 / 2 + 3, 18.4, 0.6, 6, gold);
  });
  // One57: blue glass with a cascading roof (306 m)
  at("one57", (x, z, h) => {
    [[0, 200, 54], [200, 50, 44], [250, 30, 32], [280, 26, 22]].forEach(([y, hh, d], i) => lgeos.push(tierBox(34, hh, d, x, y + 0.6, z - (54 - d) / 2, 2, 31 + i)));
  });
  // 220 Central Park South: limestone with a lantern top (290 m)
  at("cps220", (x, z, h) => {
    lgeos.push(tierBox(34, 230, 34, x, 0.6, z, lime, 41), tierBox(26, 45, 26, x, 230.6, z, lime, 41), tierBox(16, 15, 16, x, 275.6, z, lime, 41));
    crownLight(x, h - 8, z, 16.4, 2, 16.4, gold);
  });
  // 432 Park Avenue: the white square grid (426 m)
  at("park432", (x, z, h) => { lgeos.push(tierBox(28.5, h, 28.5, x, 0.6, z, 8, 51)); crownLight(x, h + 0.2, z, 28, 0.6, 28, white); });
  // 53W53: tapered spire
  at("w53", (x, z, h) => {
    const g = new THREE.CylinderGeometry(1.5, 32, h, 4, 1);
    g.rotateY(Math.PI / 4); g.scale(1, 1, 0.65); g.translate(x, h / 2 + 0.6, z);
    lgeos.push(withInfo(g, steelGlass, 61, h));
  });
  // The Plaza Hotel: white French Renaissance, green copper mansard and flags
  at("plaza", (x, z, h) => {
    lgeos.push(tierBox(62, 62, 75, x, 0.6, z, 4, 71));
    const roof = box(62, 12, 75, std(0x5f8f7c, { roughness: 0.6, metalness: 0.3 }), x, 68.6, z, deco);
    roof.geometry = new THREE.CylinderGeometry(0.5, 1, 1, 4, 1); roof.scale.set(62 * 0.72, 12, 75 * 0.72); roof.rotation.y = Math.PI / 4;
    [-20, 0, 20].forEach((dz) => { cyl(0.2, 0.2, 10, std(0xcccccc), x + 31, 80, z + dz, deco); box(0.05, 2.2, 3.4, std(0xb03a2e), x + 31, 83.5, z + dz + 1.7, deco); });
    crownLight(x, 60, z, 62.4, 0.8, 75.4, gold);
  });
  // The Pierre and the Sherry-Netherland on Fifth Avenue
  {
    const [pa, pn] = geo(40.7653, -73.9718), [sa, sn] = geo(40.7641, -73.9727);
    lgeos.push(tierBox(40, 120, 40, pa, 0.6, -pn, lime, 81), tierBox(24, 30, 24, pa, 120.6, -pn, lime, 81));
    const pr = cyl(0.5, 17, 18, std(0x5f8f7c, { roughness: 0.6, metalness: 0.3 }), pa, 159.6, -pn, deco, 4); pr.rotation.y = Math.PI / 4;
    lgeos.push(tierBox(30, 120, 30, sa, 0.6, -sn, lime, 83), tierBox(18, 30, 18, sa, 120.6, -sn, lime, 83));
    cyl(0.3, 6, 22, std(0xd8cdb6), sa, 161.6, -sn, deco, 8);
  }
  // Empire State Building (381 m + mast)
  at("esb", (x, z) => {
    lgeos.push(tierBox(130, 25, 60, x, 0.6, z, 9, 91), tierBox(95, 60, 55, x, 25.6, z, 9, 91), tierBox(72, 235, 46, x, 85.6, z, 9, 91), tierBox(50, 18, 32, x, 320.6, z, 9, 91), tierBox(30, 18, 22, x, 338.6, z, 9, 91));
    crownLight(x, 330, z, 50.6, 16, 32.6, glow(0xffd88a, 2.2));
    crownLight(x, 347, z, 30.6, 16, 22.6, glow(0xfff1d0, 2.4));
    cyl(9, 11, 20, glow(0xffd88a, 1.6), x, 366, z, deco, 8);
    cyl(2, 4, 26, std(0xcfd2d6, { metalness: 0.6 }), x, 389, z, deco, 8);
    cyl(0.4, 1.2, 60, std(0x9aa0a6, { metalness: 0.6 }), x, 432, z, deco, 6);
    sph(1.5, red, x, 462, z, deco);
  });
  // Chrysler Building: the terraced Art Deco crown (319 m)
  at("chrysler", (x, z) => {
    lgeos.push(tierBox(60, 60, 60, x, 0.6, z, 9, 101), tierBox(42, 180, 42, x, 60.6, z, 9, 101));
    const crownTex = canvasTex(256, 256, (g, w, h) => {
      g.fillStyle = "#b9bfc6"; g.fillRect(0, 0, w, h);
      g.fillStyle = "#fff2c9";
      for (let r = 0; r < 4; r++) for (let k = 0; k < 6; k++) { const x0 = k * 44 + 6, y0 = r * 64 + 10; g.beginPath(); g.moveTo(x0, y0 + 40); g.lineTo(x0 + 16, y0); g.lineTo(x0 + 32, y0 + 40); g.fill(); }
    });
    const cm = new THREE.MeshStandardMaterial({ color: 0xc9ced4, metalness: 0.85, roughness: 0.25, emissive: 0xfff0c4, emissiveMap: crownTex, emissiveIntensity: 1.8, map: crownTex });
    for (let i = 0; i < 7; i++) {
      const r0 = 20 - i * 2.6, r1 = 20 - (i + 1) * 2.6;
      const c = cyl(r1, r0, 10, cm, x, 240.6 + i * 10 + 5, z, deco, 4);
      c.rotation.y = Math.PI / 4;
    }
    cyl(0.2, 2.2, 40, std(0xd8dde2, { metalness: 0.9, roughness: 0.2 }), x, 330, z, deco, 6);
  });
  // One Vanderbilt: tapering glass with a slanted crown (427 m)
  at("vanderbilt", (x, z, h) => {
    const g = new THREE.CylinderGeometry(15, 32, h - 30, 4, 1); g.rotateY(Math.PI / 4); g.translate(x, (h - 30) / 2 + 0.6, z);
    lgeos.push(withInfo(g, steelGlass, 111, h - 30));
    cyl(0.4, 8, 30, glow(0xe6f0ff, 1.6), x, h - 15, z, deco, 4);
  });
  // 30 Rockefeller Plaza, MetLife, Citigroup (slanted top), Bank of America, NY Times, Hearst, Time Warner, Hudson Yards
  at("rock30", (x, z, h) => { lgeos.push(tierBox(30, 160, 95, x, 0.6, z, 9, 121), tierBox(30, 60, 70, x, 160.6, z, 9, 121), tierBox(30, 39, 45, x, 220.6, z, 9, 121)); crownLight(x, h, z, 30.4, 1.4, 45.4, gold); });
  at("metlife", (x, z, h) => { lgeos.push(tierBox(95, h, 45, x, 0.6, z, 4, 131)); });
  at("citigroup", (x, z, h) => {
    lgeos.push(tierBox(48, h - 40, 48, x, 0.6, z, steelGlass, 141));
    const wedge = new THREE.BufferGeometry();
    const y0 = h - 39.4, y1 = h + 0.6, hw = 24;
    const v = [[-hw, y0, -hw], [hw, y0, -hw], [hw, y0, hw], [-hw, y0, hw], [hw, y1, -hw], [hw, y1, hw]];
    const idx = [0, 2, 1, 0, 3, 2, 1, 2, 5, 1, 5, 4, 0, 4, 5, 0, 5, 3, 0, 1, 4, 3, 5, 2];
    wedge.setAttribute("position", new THREE.Float32BufferAttribute(idx.flatMap((i) => [v[i][0] + x, v[i][1], v[i][2] + z]), 3));
    wedge.computeVertexNormals();
    deco.add(new THREE.Mesh(wedge, std(0xbfc4ca, { metalness: 0.5, roughness: 0.4, emissive: 0x334455, emissiveIntensity: 0.3 })));
  });
  at("bankam", (x, z, h) => { lgeos.push(tierBox(48, 290, 38, x, 0.6, z, steelGlass, 151)); cyl(0.5, 6, 76, glow(0xeaf4ff, 1.4), x, 328, z, deco, 6); });
  at("nyt", (x, z, h) => { lgeos.push(tierBox(45, 228, 45, x, 0.6, z, steelGlass, 161)); cyl(0.6, 0.9, 91, glow(0xeaf4ff, 1.2), x, 273, z, deco, 6); });
  at("hearst", (x, z, h) => lgeos.push(tierBox(48, 30, 48, x, 0.6, z, lime, 171), tierBox(48, h - 30, 48, x, 30.6, z, steelGlass, 172)));
  at("twc", (x, z, h) => { lgeos.push(tierBox(120, 45, 60, x, 0.6, z, steelGlass, 181)); [-22, 22].forEach((dx) => lgeos.push(tierBox(36, h - 45, 30, x + dx, 45.6, z, steelGlass, 182))); });
  at("hy30", (x, z, h) => {
    lgeos.push(tierBox(55, h, 55, x, 0.6, z, steelGlass, 191));
    const edge = box(30, 3, 16, std(0x9aa3ad, { metalness: 0.7, roughness: 0.3 }), x - 40, 334, z, deco);
    edge.rotation.z = 0.05;
    lgeos.push(tierBox(40, 300, 40, x + 90, 0.6, z + 60, steelGlass, 192), tierBox(45, 280, 45, x + 40, 0.6, z - 120, steelGlass, 193));
  });
  // St. Patrick's Cathedral
  at("stpat", (x, z) => {
    lgeos.push(tierBox(40, 34, 100, x, 0.6, z, lime, 201));
    [-12, 12].forEach((dx) => { lgeos.push(tierBox(10, 60, 10, x + dx, 0.6, z + 45, lime, 202)); cyl(0.3, 6, 41, std(0xd9cfbc), x + dx, 81, z + 45, deco, 8); });
    crownLight(x, 34.6, z, 40.4, 0.6, 100.4, gold);
  });
  // Flatiron
  at("flatiron", (x, z, h) => {
    const s = new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(60, -14), new THREE.Vector2(60, 14)]);
    const g = new THREE.ExtrudeGeometry(s, { depth: h, bevelEnabled: false });
    g.rotateX(-Math.PI / 2); g.rotateY(Math.PI / 2 + 0.2); g.translate(x, 0.6, z);
    lgeos.push(withInfo(g, lime, 211, h));
  });
  // Central Park West icons: the Dakota, the San Remo, the Beresford
  at("dakota", (x, z, h) => { lgeos.push(tierBox(60, h, 60, x, 0.6, z, 3, 221)); const r = cyl(1, 40, 14, std(0x5f6f63, { roughness: 0.7 }), x, h + 7.6, z, deco, 4); r.rotation.y = Math.PI / 4; });
  at("sanremo", (x, z) => {
    lgeos.push(tierBox(70, 68, 55, x, 0.6, z, lime, 231));
    [-18, 18].forEach((dz) => {
      lgeos.push(tierBox(16, 40, 16, x - 10, 68.6, z + dz, lime, 232), tierBox(12, 8, 12, x - 10, 108.6, z + dz, lime, 232));
      cyl(4, 5, 6, std(0xd9cfbc), x - 10, 119.6, z + dz, deco, 8);
      crownLight(x - 10, 117, z + dz, 10, 3, 10, gold);
    });
  });
  at("beresford", (x, z) => {
    lgeos.push(tierBox(70, 60, 70, x, 0.6, z, lime, 241));
    [[-25, -25], [-25, 25], [25, 25]].forEach(([dx, dz]) => { lgeos.push(tierBox(13, 12, 13, x + dx, 60.6, z + dz, lime, 242)); crownLight(x + dx, 75, z + dz, 9, 3, 9, gold); });
  });
  // The Met (Beaux-Arts on Fifth) and the Guggenheim's white spiral
  at("met", (x, z) => {
    lgeos.push(tierBox(120, 28, 300, x - 60, 0.6, z, lime, 251));
    for (let k = 0; k < 8; k++) cyl(1.2, 1.2, 20, std(0xe7dfcf), x + 2, 10.6, z - 35 + k * 10, deco, 10);
    crownLight(x + 1, 6, z, 1, 10, 80, glow(0xffe0b0, 1.4));
  });
  at("guggenheim", (x, z) => {
    const gm = std(0xf1ede4, { roughness: 0.6 });
    for (let i = 0; i < 5; i++) { const r = 18 + i * 2.6; cyl(r, r - 1.6, 5.2, gm, x + 8, 3.2 + i * 5.4, z, deco, 40); box(0.2, 0.8, 2 * r * 0.9, glow(0xffe8c0, 1.4), x + 8 + r - 0.5, 2 + i * 5.4, z, deco); }
    lgeos.push(tierBox(25, 30, 30, x - 20, 0.6, z, 4, 261));
  });
  // One World Trade Center (541 m) and the Woolworth Building
  at("wtc1", (x, z, h) => {
    const g = new THREE.CylinderGeometry(33, 46, 417, 4, 1); g.rotateY(Math.PI / 4); g.translate(x, 208.5 + 0.6, z);
    lgeos.push(withInfo(g, steelGlass, 271, 417));
    cyl(0.6, 2.4, 124, glow(0xeaf4ff, 1.8), x, 479, z, deco, 6);
  });
  at("woolworth", (x, z, h) => { lgeos.push(tierBox(60, 100, 60, x, 0.6, z, lime, 281), tierBox(30, 110, 30, x, 100.6, z, lime, 282)); cyl(0.5, 12, 30, std(0x6f8f7f), x, 225, z, deco, 4); crownLight(x, 205, z, 30.4, 8, 30.4, gold); });
  // aviation lights on the supertalls
  {
    const tall = ["cpt", "w111", "one57", "park432", "w53", "vanderbilt", "esb", "chrysler", "hy30", "wtc1", "bankam", "nyt", "cps220"];
    const pts = tall.filter((k) => LM[k]).map((k) => [LM[k][0], LM[k][1]]);
    const ys = tall.filter((k) => LM[k]).map((k) => LM[k][2] + 4);
    const av = pointsLayer(pts, (i) => ys[i], 0xff2a1a, 22, 1);
    deco.add(av);
    upd.push((t) => (av.material.opacity = Math.sin(t * 2.2) > 0.3 ? 1 : 0.08));
  }
  const lmMesh = new THREE.Mesh(mergeGeometries(lgeos, false), fmS);
  root.add(lmMesh);

  // ---------- Central Park landmarks
  const stone = std(0x9b968b, { roughness: 0.9 });
  const cream = std(0xe9e1cd, { roughness: 0.6 });
  // Bethesda Terrace and Fountain with the Angel of the Waters
  at("bethesda", (x, z) => {
    const g = group(x, 0, z, deco);
    box(70, 1.2, 40, stone, 0, 1.2, 8, g);
    cyl(12, 12, 1.4, stone, 0, 1.5, 0, g, 40);
    cyl(11.2, 11.2, 0.3, new THREE.MeshStandardMaterial({ color: 0x29475c, roughness: 0.1, metalness: 0.5 }), 0, 2.2, 0, g, 40);
    cyl(1.6, 3.2, 5, stone, 0, 4.5, 0, g, 16);
    cyl(4.5, 2.2, 1, stone, 0, 6.8, 0, g, 16);
    cyl(0.8, 1.2, 4, std(0x7c8c74, { metalness: 0.5, roughness: 0.4 }), 0, 9.3, 0, g, 10);
    const wing = box(5, 2.2, 0.2, std(0x7c8c74, { metalness: 0.5, roughness: 0.4 }), 0, 11.6, -0.3, g);
    wing.rotation.x = -0.3;
    sph(0.8, std(0x7c8c74, { metalness: 0.5 }), 0, 12.2, 0, g);
    const ring = []; for (let i = 0; i < 30; i++) { const a = (i / 30) * Math.PI * 2; ring.push([x + Math.cos(a) * 12.5, -z - Math.sin(a) * 12.5]); }
    deco.add(pointsLayer(ring, 3, 0xfff0cf, 3.5, 0.9));
    // arcade under the terrace
    for (let k = -4; k <= 4; k++) { cyl(0.6, 0.6, 5, cream, k * 4.2, 3.7, 26, g, 10); }
    box(40, 1.4, 4, cream, 0, 6.6, 26, g);
  });
  // Bow Bridge (cast iron, 1862)
  if (LM.bow) {
    const [a0, n0, a1, n1] = LM.bow;
    const x0 = a0, z0 = -n0, x1 = a1, z1 = -n1;
    const len = Math.hypot(x1 - x0, z1 - z0) + 14, ang = Math.atan2(z1 - z0, x1 - x0);
    const g = group((x0 + x1) / 2, 0, (z0 + z1) / 2, deco, -ang);
    const curve = (t) => 3.2 + Math.sin(t * Math.PI) * 1.4;
    for (let i = 0; i < 24; i++) {
      const t = i / 23, xx = -len / 2 + t * len;
      box(len / 23 + 0.05, 0.3, 4.2, cream, xx, curve(t), 0, g);
      if (i % 2 === 0) [-2, 2].forEach((s) => { box(0.12, 1.1, 0.12, cream, xx, curve(t) + 0.7, s, g); });
    }
    [-2, 2].forEach((s) => { for (let i = 0; i < 23; i++) { const t = (i + 0.5) / 23; box(len / 23 + 0.05, 0.12, 0.12, cream, -len / 2 + t * len, curve(t) + 1.25, s, g); } });
    for (let i = 0; i < 12; i++) { const t = (i + 0.5) / 12; box(0.15, 1.6, 4, cream, -len / 2 + t * len, curve(t) - 0.9, 0, g); }
    // planter urns with tiny lights
    [[-len / 2, -2], [-len / 2, 2], [len / 2, -2], [len / 2, 2]].forEach(([xx, s]) => { cyl(0.6, 0.4, 1, cream, xx, 4.2, s, g, 10); sph(0.5, std(0x3d5a32), xx, 5, s, g); });
  }
  // Belvedere Castle on Vista Rock
  at("belvedere", (x, z) => {
    const g = group(x, 0, z, deco);
    const rock = sph(16, std(0x5b5a57, { flatShading: true, roughness: 1 }), 0, -4, 0, g, 6);
    rock.scale.set(1.4, 0.9, 1);
    box(18, 9, 12, stone, 0, 14, 0, g);
    cyl(4, 4, 18, stone, 7, 18, -3, g, 8);
    for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; box(1, 1.2, 1, stone, 7 + Math.cos(a) * 4, 27.6, -3 + Math.sin(a) * 4, g); }
    cyl(0.1, 0.1, 6, std(0xdddddd), 7, 30, -3, g, 6);
    box(0.05, 1.4, 2.2, std(0x2f5d8a), 7, 32, -1.9, g);
    box(18.2, 1, 12.2, glow(0xffe2b0, 1.3), 0, 9.6, 0, g);
  });
  // Gapstow Bridge over The Pond
  at("gapstow", (x, z) => {
    const g = group(x, 0, z, deco, 0.5);
    for (let i = 0; i < 16; i++) { const t = i / 15; box(2.2, 0.8, 5, stone, -16 + t * 32, 2.2 + Math.sin(t * Math.PI) * 3.4, 0, g); }
  });
  // Wollman Rink with skaters going round under the lights
  let skaters;
  at("wollman", (x, z) => {
    const g = group(x, 0, z, deco, 0.3);
    const ice = mesh(new THREE.CircleGeometry(1, 48), std(0xdbe9f5, { roughness: 0.15, metalness: 0.1, emissive: 0x9fb8cf, emissiveIntensity: 0.55 }), 0, 1.1, 0, g);
    ice.rotation.x = -Math.PI / 2; ice.scale.set(38, 24, 1);
    const ringPts = []; for (let i = 0; i < 40; i++) { const a = (i / 40) * Math.PI * 2; ringPts.push([Math.cos(a) * 40, Math.sin(a) * 26]); }
    ringPts.forEach(([px, pz]) => box(0.5, 1.1, 0.5, std(0xe0e0e0), px, 1.6, pz, g));
    [[-40, 0], [40, 0], [0, 28], [0, -28]].forEach(([px, pz]) => { cyl(0.3, 0.4, 18, std(0x30343a), px, 9, pz, g, 6); box(3, 1, 1.4, glow(0xf4f8ff, 3), px, 18.4, pz, g); });
    const sk = new THREE.InstancedMesh(new THREE.CapsuleGeometry(0.3, 1.1, 3, 6), std(0xffffff), mobile ? 40 : 90);
    const c = new THREE.Color();
    const sd = [];
    for (let i = 0; i < sk.count; i++) { sd.push([rnd(), 0.4 + rnd() * 0.5, 0.05 + rnd() * 0.1]); sk.setColorAt(i, c.setHSL(rnd(), 0.5, 0.45)); }
    g.add(sk);
    skaters = { sk, sd };
    upd.push((t) => {
      for (let i = 0; i < sk.count; i++) {
        const [ph, r, sp] = sd[i];
        const a = ph * Math.PI * 2 + t * sp * 2;
        sk.setMatrixAt(i, trs(Math.cos(a) * 36 * r, 2, Math.sin(a) * 22 * r, -a));
      }
      sk.instanceMatrix.needsUpdate = true;
    });
  });

  // ---------- Roosevelt Island: towers, the lighthouse, Cornell Tech
  {
    const ri = [];
    for (let i = 0; i < 34; i++) {
      const t = 0.06 + rnd() * 0.88, n = -880 + t * 3125, a = 1650 + t * 255 + (rnd() - 0.5) * 90;
      ri.push(tierBox(18 + rnd() * 18, 14 + rnd() * (t < 0.25 ? 90 : 45), 18 + rnd() * 18, a, 0.6, -n, rnd() < 0.3 ? 2 : 4, 300 + i));
    }
    root.add(new THREE.Mesh(mergeGeometries(ri, false), fmS));
    const lh = group(1905, 0, -2235, deco);
    cyl(1.6, 2.4, 15, stone, 0, 7.5, 0, lh, 8);
    sph(1.4, glow(0xfff1c0, 3), 0, 16, 0, lh);
  }

  // ---------- Queensboro Bridge (1909): steel cantilever trusses, lit
  let tram;
  {
    const [ma, mn] = LM.qbb_m, [qa, qn] = LM.qbb_q;
    const dx = qa - ma, dn = qn - mn, L = Math.hypot(dx, dn), ux = dx / L, un = dn / L;
    const P = (s) => [ma + ux * s, mn + un * s]; // frame coords at distance s along the bridge
    const deckY = 40;
    const sOf = (a) => (a - ma) / ux;
    const towers = [shoreE(0) + 10, 1640, 1800, shoreQ(0) - 10].map(sOf);
    const g = new THREE.Group();
    root.add(g);
    const steel = std(0x6f7a80, { metalness: 0.65, roughness: 0.45 });
    const truss = [];
    const member = (s0, y0, s1, y1, off) => {
      const [a0, n0] = P(s0), [a1, n1] = P(s1);
      const x0 = a0 - un * off, z0 = -(n0 + ux * off), x1 = a1 - un * off, z1 = -(n1 + ux * off);
      const len = Math.hypot(x1 - x0, y1 - y0, z1 - z0);
      const m = new THREE.Matrix4().lookAt(V(x0, y0, z0), V(x1, y1, z1), V(0, 1, 0));
      m.multiply(new THREE.Matrix4().makeScale(0.9, 0.9, len));
      m.setPosition((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
      truss.push(m);
    };
    const topY = (s) => {
      let y = deckY + 6;
      for (let i = 0; i < towers.length; i++) y = Math.max(y, deckY + 62 - Math.abs(s - towers[i]) * 0.38);
      return Math.max(deckY + 10, y);
    };
    const s0 = sOf(shoreE(0) - 260), s1 = sOf(shoreQ(0) + 260);
    const lightPts = [];
    for (const off of [-14, 14]) {
      for (let s = s0; s < s1; s += 18) {
        const sN = Math.min(s1, s + 18);
        member(s, deckY, sN, deckY, off);
        member(s, topY(s), sN, topY(sN), off);
        member(s, deckY, s, topY(s), off);
        member(s, deckY, sN, topY(sN), off);
        const [la, ln] = P(s);
        lightPts.push([la - un * off, ln + ux * off]);
      }
    }
    towers.forEach((s) => {
      for (const off of [-14, 14]) {
        const [ta, tn] = P(s);
        box(5, deckY + 70, 5, std(0x5c6a70, { metalness: 0.5, roughness: 0.5 }), ta - un * off, (deckY + 70) / 2, -(tn + ux * off), g);
        cyl(0.2, 2.2, 8, steel, ta - un * off, deckY + 74, -(tn + ux * off), g, 4);
      }
      const [ta, tn] = P(s);
      box(10, 20, 36, std(0x6b665e), ta, 10, -tn, g).rotation.y = -Math.atan2(-dn, dx);
    });
    g.add(instanced(new THREE.BoxGeometry(1, 1, 1), steel, truss));
    // deck
    const deckLen = s1 - s0, [cx, cn] = P((s0 + s1) / 2);
    const deck = box(deckLen, 3, 28, std(0x2a2c30), cx, deckY - 1, -cn, g);
    deck.rotation.y = -Math.atan2(-dn, dx);
    // the bridge's lights: along the top chords and the deck
    const topLights = [];
    for (const off of [-14.5, 14.5]) for (let s = s0; s < s1; s += 8) { const [la, ln] = P(s); topLights.push([la - un * off, ln + ux * off, topY(s) + 0.8]); }
    const tl = pointsLayer(topLights.map((p) => [p[0], p[1]]), (i) => topLights[i][2], 0xfff2d0, 7, 1);
    g.add(tl);
    g.add(pointsLayer(lightPts, deckY + 2, 0xffc98a, 6, 0.9));
    // car lights crossing
    const cars = pointsLayer(Array.from({ length: 80 }, () => [0, 0]), deckY + 1, 0xff6a50, 5, 0.9);
    const carsW = pointsLayer(Array.from({ length: 80 }, () => [0, 0]), deckY + 1, 0xfff4e0, 5, 0.95);
    g.add(cars, carsW);
    const cp = cars.geometry.attributes.position, cw = carsW.geometry.attributes.position;
    const cs = Array.from({ length: 80 }, () => [rnd(), rnd() * 6 - 3]);
    upd.push((t) => {
      for (let i = 0; i < 80; i++) {
        const [ph, o] = cs[i];
        const s = s0 + (((ph + t * 0.012) % 1) * deckLen), [a, n] = P(s);
        cp.setXYZ(i, a - un * (o - 5), deckY + 1, -(n + ux * (o - 5)));
        const s2 = s0 + (((ph - t * 0.012 + 10) % 1) * deckLen), [a2, n2] = P(s2);
        cw.setXYZ(i, a2 - un * (o + 5), deckY + 1, -(n2 + ux * (o + 5)));
      }
      cp.needsUpdate = cw.needsUpdate = true;
    });

    // Roosevelt Island Tramway (the red cabin over the East River)
    const [ta, tn] = LM.tram_m;
    const tb = [1735, 79];
    const tg = new THREE.Group();
    root.add(tg);
    [[ta + 140, tn], [tb[0] - 20, tb[1]]].forEach(([a, n]) => { box(4, 76, 4, std(0x4f5a60, { metalness: 0.5 }), a, 38, -n, tg); box(14, 4, 4, std(0x4f5a60, { metalness: 0.5 }), a, 76, -n, tg); });
    const cab = box(10, 4.5, 4.5, std(0xc0392b, { roughness: 0.4, metalness: 0.2, emissive: 0x4a0d08, emissiveIntensity: 0.5 }), ta, 60, -tn, tg);
    box(9, 1.6, 4.6, glow(0xfff0d0, 1.4), 0, 0.4, 0, cab);
    const cable = new THREE.Line(new THREE.BufferGeometry().setFromPoints([V(ta, 77, -tn), V(ta + 140, 77, -tn), V(tb[0] - 20, 77, -tb[1]), V(tb[0], 30, -tb[1])]), new THREE.LineBasicMaterial({ color: 0x8a9095 }));
    tg.add(cable);
    tram = cab;
    upd.push((t) => {
      const k = 0.5 - 0.5 * Math.cos(t * 0.09);
      const a = ta + 140 + (tb[0] - 20 - ta - 140) * k, n = tn + (tb[1] - tn) * k;
      cab.position.set(a, 72 - Math.sin(k * Math.PI) * 6, -n);
    });
  }

  // ---------- the 7 train on its elevated line through Queens
  {
    const line = [];
    const pts = [];
    for (let n = -1600; n <= 3600; n += 15) pts.push([shoreQ(n) + 1420 + Math.sin(n / 900) * 120, n]);
    const steel = std(0x4b5258, { metalness: 0.5, roughness: 0.6 });
    const cols = [], girders = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const [a0, n0] = pts[i], [a1, n1] = pts[i + 1];
      const len = Math.hypot(a1 - a0, n1 - n0), ang = Math.atan2(-(n1 - n0), a1 - a0);
      girders.push(trs((a0 + a1) / 2, 12, -(n0 + n1) / 2, -ang + Math.PI / 2, 9, 1.4, len + 0.2));
      if (i % 2 === 0) [-3.5, 3.5].forEach((o) => cols.push(trs(a0 + o, 6, -n0, 0, 0.8, 12, 0.8)));
    }
    root.add(instanced(new THREE.BoxGeometry(1, 1, 1), steel, [...cols, ...girders]));
    const lp = pts.filter((_, i) => i % 3 === 0);
    root.add(pointsLayer(lp, 13.5, 0xb6d4ff, 4, 0.7));
    // the train: 11 silver cars with purple stripe and lit windows
    const car = new THREE.Group();
    const body = std(0xb9bec4, { metalness: 0.7, roughness: 0.35 });
    const cars = [];
    for (let k = 0; k < 11; k++) {
      const c = group(0, 0, 0, root);
      box(3, 3.4, 15.5, body, 0, 15.2, 0, c);
      box(3.05, 0.4, 15.6, std(0x8a3fa0), 0, 14.2, 0, c);
      box(3.08, 1, 14, glow(0xfff3d6, 1.8), 0, 15.8, 0, c);
      cars.push(c);
    }
    const total = pts.length - 1;
    const at7 = (u) => {
      const f = ((u % 1) + 1) % 1 * total, i = Math.floor(f), t = f - i;
      const [a0, n0] = pts[i], [a1, n1] = pts[Math.min(i + 1, total)];
      return [a0 + (a1 - a0) * t, n0 + (n1 - n0) * t, Math.atan2(a1 - a0, -(n1 - n0))];
    };
    upd.push((t) => {
      const u0 = (t * 0.006) % 1;
      cars.forEach((c, k) => { const [a, n, ang] = at7(u0 - k * (16 / (total * 15))); c.position.set(a, 0, -n); c.rotation.y = ang; });
    });
  }

  // ---------- yellow cabs and traffic on the real avenues
  {
    const lanes = data.lanes;
    const nCab = mobile ? 320 : 900;
    const cabGeo = (bodyCol) => {
      const parts = [
        [new THREE.BoxGeometry(4.6, 1.0, 1.9), bodyCol, 0, 0.7, 0],
        [new THREE.BoxGeometry(2.4, 0.7, 1.7), bodyCol, -0.2, 1.5, 0],
        [new THREE.BoxGeometry(0.1, 0.25, 1.6), [3, 2.9, 2.6], 2.31, 0.75, 0],
        [new THREE.BoxGeometry(0.1, 0.25, 1.6), [3, 0.15, 0.1], -2.31, 0.75, 0],
        [new THREE.BoxGeometry(0.6, 0.25, 0.25), [2.4, 2.2, 1.6], -0.2, 2.0, 0],
      ];
      const geos = parts.map(([g, c, x, y, z]) => {
        g.translate(x, y, z);
        const n = g.attributes.position.count, col = new Float32Array(n * 3);
        for (let i = 0; i < n; i++) col.set(c, i * 3);
        g.setAttribute("color", new THREE.BufferAttribute(col, 3));
        g.deleteAttribute("uv");
        return g;
      });
      return mergeGeometries(geos, false);
    };
    const cabs = new THREE.InstancedMesh(cabGeo([0.95, 0.68, 0.05]), new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false }), nCab);
    cabs.frustumCulled = false;
    root.add(cabs);
    const st = [];
    for (let i = 0; i < nCab; i++) {
      const avenue = rnd() < 0.78;
      if (avenue) {
        const L = lanes[Math.floor(rnd() * lanes.length)];
        const dir = L[3] || (rnd() < 0.5 ? 1 : -1);
        st.push({ ax: true, c: L[0] + (rnd() - 0.5) * 8, n0: L[1], n1: L[2], dir, u: rnd(), sp: 9 + rnd() * 6 });
      } else {
        const n = data.crosstown[Math.floor(rnd() * data.crosstown.length)];
        const dir = rnd() < 0.5 ? 1 : -1;
        st.push({ ax: false, c: n + (rnd() - 0.5) * 6, n0: shoreW(n) + 60, n1: shoreE(n) - 60, dir, u: rnd(), sp: 7 + rnd() * 5 });
      }
    }
    upd.push((t, dt) => {
      for (let i = 0; i < nCab; i++) {
        const s = st[i];
        const len = s.n1 - s.n0;
        s.u = (s.u + (dt * s.sp * s.dir) / len + 1) % 1;
        const v = s.n0 + s.u * len;
        if (s.ax) cabs.setMatrixAt(i, trs(s.c, 0.8, -v, s.dir > 0 ? Math.PI / 2 : -Math.PI / 2));
        else cabs.setMatrixAt(i, trs(v, 0.8, -s.c, s.dir > 0 ? 0 : Math.PI));
      }
      cabs.instanceMatrix.needsUpdate = true;
    });
  }

  // pigeons over the park (a small flock that wheels around)
  {
    const nb = 40;
    const birdGeo = new THREE.BufferGeometry();
    birdGeo.setAttribute("position", new THREE.Float32BufferAttribute([0, 0, 0.4, -1, 0, -0.2, 0, 0, -0.3, 0, 0, 0.4, 0, 0, -0.3, 1, 0, -0.2], 3));
    birdGeo.computeVertexNormals();
    const birds = new THREE.InstancedMesh(birdGeo, new THREE.MeshBasicMaterial({ color: 0x2a2c33, side: THREE.DoubleSide }), nb);
    root.add(birds);
    const bd = Array.from({ length: nb }, () => [rnd() * 6.28, 20 + rnd() * 25, 60 + rnd() * 30, rnd()]);
    upd.push((t) => {
      bd.forEach(([ph, r, y, k], i) => {
        const a = ph + t * 0.25;
        const flap = Math.sin(t * 12 + k * 20) * 0.6;
        birds.setMatrixAt(i, trs(-430 + Math.cos(a) * r * 2.2, y + Math.sin(t + k * 5) * 3, -1150 + Math.sin(a) * r, -a, 1.4, 1.4, 1.4, 0, flap));
      });
      birds.instanceMatrix.needsUpdate = true;
    });
  }

  const update = (t, dt) => upd.forEach((f) => f(t, dt));
  return { root, update, facade: [fm, fmS], shoreE, shoreQ };
}
