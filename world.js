// The 3D world: real Manhattan (OpenStreetMap streets and footprints, real
// landmark positions), Central Park, the Queensboro Bridge, and a Forest Hills
// Gardens style Tudor mansion in Queens dressed in Dyker Heights lights.
// city.js builds the city, house.js the house, props.js the drone and people.
import { THREE, S, dotTex } from "./util.js";
import { buildCity, geo } from "./city.js";
import { buildHouse } from "./house.js";
import { makeDrone } from "./props.js";
import { EffectComposer } from "./vendor/post/EffectComposer.js";
import { RenderPass } from "./vendor/post/RenderPass.js";
import { UnrealBloomPass } from "./vendor/post/UnrealBloomPass.js";
import { OutputPass } from "./vendor/post/OutputPass.js";
import { ShaderPass } from "./vendor/post/ShaderPass.js";
import { RoomEnvironment } from "./vendor/post/RoomEnvironment.js";

// Where the house sits in the Manhattan grid frame (a = grid east, n = grid north), meters.
export const HOUSE = { a: 3100, n: 1500 };
// house-local (x, y, z) -> world. The house front (+z) faces Manhattan (world -x).
export const fromLocal = (x, y, z) => [HOUSE.a - z, y, -HOUSE.n + x];
// grid frame (a, y, n) -> world
export const fromFrame = (a, y, n) => [a, y, -n];

export async function createWorld(canvas, { mobile = false, onProgress = () => {} } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !mobile, powerPreference: "high-performance", logarithmicDepthBuffer: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.3 : 1.75));
  renderer.outputColorSpace = S;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b1020);
  const camera = new THREE.PerspectiveCamera(50, 1, 0.03, 40000);
  camera.position.set(0, 2, 10);

  // ---------- blue hour over New York
  const sunDir = new THREE.Vector3(-1, 0.06, 0.32).normalize(); // sunset behind Manhattan, seen from Queens
  const env = {
    sunDir,
    sunCol: new THREE.Color(1.0, 0.56, 0.36).multiplyScalar(0.55),
    amb: new THREE.Color(0.05, 0.056, 0.085),
    skyTop: new THREE.Color(0.035, 0.05, 0.13),
    skyHorizon: new THREE.Color(0.3, 0.2, 0.27),
    horizonGlow: new THREE.Color(1.0, 0.52, 0.26),
  };
  scene.fog = new THREE.FogExp2(0x262a3d, mobile ? 0.00024 : 0.00019);

  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(30000, 48, 24),
    new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, depthTest: false, fog: false,
      uniforms: { uSun: { value: sunDir }, uTop: { value: env.skyTop }, uHor: { value: env.skyHorizon }, uGlow: { value: env.horizonGlow }, uTime: { value: 0 } },
      vertexShader: /* glsl */`varying vec3 vD; void main(){ vD = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position,1.); gl_Position = p.xyww; }`,
      fragmentShader: /* glsl */`
        uniform vec3 uSun; uniform vec3 uTop; uniform vec3 uHor; uniform vec3 uGlow; uniform float uTime;
        varying vec3 vD;
        float h(vec3 p){ return fract(sin(dot(p, vec3(12.9898,78.233,37.719))) * 43758.5453); }
        void main(){
          vec3 d = normalize(vD);
          float el = d.y;
          vec3 c = mix(uHor, uTop, smoothstep(-0.02, 0.42, el));
          float s = max(dot(normalize(vec3(d.x, 0., d.z)), normalize(vec3(uSun.x, 0., uSun.z))), 0.);
          c += uGlow * pow(s, 6.) * (1. - smoothstep(0., 0.28, el)) * 0.85;
          c += vec3(1.,.42,.2) * pow(s, 40.) * (1. - smoothstep(-.01, .06, el)) * 0.9;
          c = mix(c, vec3(.08,.07,.1), smoothstep(0., -.08, el));
          // city glow from below on the clouds-less haze
          c += vec3(.35,.22,.16) * (1. - smoothstep(-0.02, 0.1, el)) * .25;
          // stars
          vec3 g = floor(d * 420.);
          float st = step(.9975, h(g)) * smoothstep(.08, .5, el);
          c += vec3(st) * (.6 + .4 * sin(uTime * 2. + h(g + 1.) * 40.));
          // moon, up over Queens
          vec3 md = normalize(vec3(0.55, 0.42, -0.72));
          float m = dot(d, md);
          c += vec3(1., .96, .86) * smoothstep(.99965, .9998, m) * 1.6;
          c += vec3(.5, .55, .7) * pow(max(m, 0.), 800.) * .5;
          gl_FragColor = vec4(c, 1.);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    })
  );
  sky.renderOrder = -10;
  sky.frustumCulled = false;
  scene.add(sky);

  scene.add(new THREE.HemisphereLight(0x8696c4, 0x2b2420, 0.55));
  const sun = new THREE.DirectionalLight(0xffb48a, 0.75);
  sun.position.copy(sunDir).multiplyScalar(1000);
  scene.add(sun);
  scene.add(sun.target);

  // soft reflections for marble, brass, glass and car paint
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.22;

  // ---------- the city (real data)
  onProgress(0.05, "Downloading Manhattan…");
  const res = await fetch("assets/city.json");
  const total = +res.headers.get("content-length") || 0;
  let text;
  if (res.body && total) {
    const reader = res.body.getReader();
    const chunks = [];
    let got = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      got += value.length;
      onProgress(0.05 + 0.5 * Math.min(1, got / total), "Downloading Manhattan…");
    }
    text = new TextDecoder().decode(await new Blob(chunks).arrayBuffer());
  } else text = await res.text();
  const data = JSON.parse(text);
  onProgress(0.6, "Building 36,000 buildings…");
  await new Promise((r) => setTimeout(r, 0));

  // keep full detail along the flight paths
  const corridor = [[-420, 1250], [-150, 1150], [600, 1150], [1300, 1250], [1800, 1300], [2400, 1400], [100, 720], [650, 250], [1120, -25], [1500, -33], [2200, 26], [2950, 92], [3230, 640], [3100, 1100], [HOUSE.a, HOUSE.n]];
  // the drone's two long flights (grid coords a, y, n), so the city can keep them clear
  const flight = [
    [3089, 7.6, 1500], [3038, 32, 1498], [2700, 110, 1460], [1900, 150, 1320], [1000, 165, 1220], [150, 150, 1170], [-370, 108, 1235], [-414, 96, 1262],
    [-300, 108, 1140], [100, 175, 720], [650, 185, 250], [1120, 120, -25], [1500, 62, -33], [2200, 62, 26], [2950, 64, 92], [3230, 58, 640], [3064, 30, 1170], [3065, 12, 1390], [3068, 4, 1475],
  ];
  const city = buildCity(data, env, { mobile, corridor, flight });
  scene.add(city.root);

  onProgress(0.82, "Hanging the holiday lights…");
  await new Promise((r) => setTimeout(r, 0));
  const house = buildHouse({ mobile });
  const [hx, , hz] = fromLocal(0, 0, 0);
  house.root.position.set(hx, 0, hz);
  house.root.rotation.y = -Math.PI / 2;
  scene.add(house.root);
  house.root.updateMatrixWorld(true);

  // ---------- sky traffic: jets gliding into LaGuardia, helicopters over Midtown and the East River
  const traffic = (() => {
    const [lgaA, lgaN] = geo(40.7769, -73.874);
    const planes = [0, 0.34, 0.67].map((ph) => ({ ph, from: [-5200 + ph * 900, 1300, -5200 + ph * 1400], to: [lgaA, 40, lgaN], period: 110 }));
    const helis = [
      { c: [-150, -900], r: 650, y: 330, w: 0.05, ph: 0 },
      { c: [1150, 600], r: 1400, y: 210, w: 0.035, ph: 2, line: true },
      { c: [-1500, -2600], r: 500, y: 280, w: -0.06, ph: 4 },
    ];
    const n = planes.length + helis.length;
    const mk = (color, size) => {
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(n * 3), 3));
      const pts = new THREE.Points(g, new THREE.PointsMaterial({ color, size, sizeAttenuation: false, map: dotTex(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, toneMapped: false }));
      pts.frustumCulled = false;
      scene.add(pts);
      return pts;
    };
    const land = mk(new THREE.Color(1, 0.97, 0.9).multiplyScalar(2.2), mobile ? 7 : 11);
    const red = mk(new THREE.Color(1, 0.15, 0.1).multiplyScalar(2), mobile ? 4 : 6);
    const green = mk(new THREE.Color(0.2, 1, 0.4).multiplyScalar(2), mobile ? 4 : 6);
    const strobe = mk(new THREE.Color(1, 1, 1).multiplyScalar(3), mobile ? 5 : 8);
    const pos = (p, i, x, y, z) => p.geometry.attributes.position.setXYZ(i, x, y, z);
    return (t) => {
      let i = 0;
      planes.forEach((pl) => {
        const k = ((t / pl.period + pl.ph) % 1);
        const a = pl.from[0] + (pl.to[0] - pl.from[0]) * k, nn = pl.from[2] + (pl.to[2] - pl.from[2]) * k, y = pl.from[1] + (pl.to[1] - pl.from[1]) * k;
        const dx = pl.to[0] - pl.from[0], dn = pl.to[2] - pl.from[2], L = Math.hypot(dx, dn), sx = -dn / L, sn = dx / L;
        pos(land, i, a + (dx / L) * 20, y, -(nn + (dn / L) * 20));
        pos(red, i, a + sx * 18, y, -(nn + sn * 18));
        pos(green, i, a - sx * 18, y, -(nn - sn * 18));
        pos(strobe, i, a, Math.sin(t * 7 + i) > 0.85 ? y + 3 : -999, -nn);
        i++;
      });
      helis.forEach((h) => {
        const a0 = t * h.w + h.ph;
        let a, nn;
        if (h.line) { a = h.c[0] + Math.sin(a0) * 120; nn = h.c[1] + Math.sin(a0 * 0.7) * h.r; }
        else { a = h.c[0] + Math.cos(a0) * h.r; nn = h.c[1] + Math.sin(a0) * h.r; }
        pos(land, i, a, h.y - 2, -nn);
        pos(red, i, a + 4, h.y, -nn);
        pos(green, i, a - 4, h.y, -nn);
        pos(strobe, i, a, Math.sin(t * 5 + i * 2) > 0.8 ? h.y + 1 : -999, -nn);
        i++;
      });
      [land, red, green, strobe].forEach((p) => (p.geometry.attributes.position.needsUpdate = true));
    };
  })();

  // ---------- drone
  const drone = makeDrone();
  scene.add(drone);

  // lasers for the contact scene
  const laserGeo = new THREE.BufferGeometry();
  laserGeo.setAttribute("position", new THREE.Float32BufferAttribute(new Array(24).fill(0), 3));
  const lasers = new THREE.LineSegments(laserGeo, new THREE.LineBasicMaterial({ color: 0x7dffd0, transparent: true, opacity: 0.85, fog: false }));
  lasers.frustumCulled = false;
  lasers.visible = false;
  scene.add(lasers);
  const beams = [];
  for (let i = 0; i < 8; i++) {
    const glow = i % 2 === 1;
    const b = new THREE.Mesh(new THREE.CylinderGeometry(glow ? 0.06 : 0.014, glow ? 0.06 : 0.014, 1, 8, 1, true),
      new THREE.MeshBasicMaterial({ color: glow ? 0x3dffc0 : 0xd8fff0, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, toneMapped: false }));
    b.userData.glow = glow;
    b.visible = false;
    b.frustumCulled = false;
    scene.add(b);
    beams.push(b);
  }

  // ---------- post: bloom on the lights, a touch of vignette and film grain
  let composer = null, bloom = null, grade = null;
  if (!mobile && !/nopost/.test(location.search)) {
    composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: /nomsaa/.test(location.search) ? 0 : 4 }));
    composer.addPass(new RenderPass(scene, camera));
    bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.55, 0.55, 0.92);
    composer.addPass(bloom);
    composer.addPass(new OutputPass());
    grade = new ShaderPass({
      uniforms: { tDiffuse: { value: null }, uTime: { value: 0 } },
      vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }",
      fragmentShader: `uniform sampler2D tDiffuse; uniform float uTime; varying vec2 vUv;
        float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
        void main(){ vec4 c = texture2D(tDiffuse, vUv);
          float v = smoothstep(1.05, .35, length(vUv - .5) * 1.25);
          c.rgb *= mix(.72, 1., v);
          c.rgb += (h(vUv * 900. + uTime) - .5) * .025;
          gl_FragColor = c; }`,
    });
    composer.addPass(grade);
  }

  function resize(w, h) {
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = w / h < 0.9 ? 66 : 50;
    camera.updateProjectionMatrix();
    if (composer) {
      composer.setPixelRatio(renderer.getPixelRatio());
      composer.setSize(w, h);
    }
  }

  function update(t, dt) {
    sky.material.uniforms.uTime.value = t;
    sky.position.copy(camera.position);
    city.update(t, dt);
    traffic(t);
    house.update(t, dt);
    city.facade.forEach((m) => (m.uniforms.uTime.value = t));
    if (grade) grade.uniforms.uTime.value = t % 10;
  }
  function render() {
    if (composer) composer.render();
    else renderer.render(scene, camera);
  }

  onProgress(1, "Ready");
  const O = house.objects;
  return {
    THREE, renderer, scene, camera, drone, resize, update, render, fromLocal, fromFrame,
    houseRoot: house.root,
    objects: { ...O, beams, lasers, laserGeo },
    anchors: { benchTop: house.anchors.benchTop + 0, SH: house.anchors.SH },
  };
}
