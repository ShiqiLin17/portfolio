// The eight painted scenes of the storybook. Each scene is a stack of layers at
// different depths (d): 0 = far away (barely moves), 1 = the story plane, >1 = foreground.
// cam(t, portrait) says where the camera looks; drone(t) says where Byte flies.
import {
  rng, r1, C, stars, moon, cloud, tudor, pine, bareTree, blobTree, lamp, ironFence, nutcracker, reindeer, mailbox,
  LM, cityBlock, queensboro, reflections, shiqiBack, shiqiFront, laptopBack, cat, litWindow, fairy, lightString, wrapLines, esc,
} from "./art.js";
import { CERTS, HONORS } from "./data.js";

const L = (d, inner, box = [-500, -300, 2600, 1500]) => ({ d, inner, box });
const lerp = (a, b, t) => a + (b - a) * t;
const ease = (t) => t * t * (3 - 2 * t);
const clamp = (t) => Math.max(0, Math.min(1, t));
const path = (keys, t) => {
  // piecewise smooth path through [t, value] keys
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [ta, a] = keys[i], [tb, b] = keys[i + 1];
    if (t <= tb) return lerp(a, b, ease((t - ta) / (tb - ta)));
  }
  return keys[keys.length - 1][1];
};

// ------------------------------------------------------------ ground helpers
const snowGround = (y, x0 = -500, x1 = 2100, seed = 3) => {
  const rnd = rng(seed);
  let d = `M${x0} ${y}`;
  for (let x = x0; x <= x1; x += 80) d += ` Q${x + 40} ${r1(y - 8 - rnd() * 14)} ${x + 80} ${r1(y + (rnd() - 0.5) * 6)}`;
  return `<path d="${d} V1300 H${x0} Z" fill="url(#g-snow)"/>`;
};

// ============================================================ 0 · the house in Queens
function sceneHouse() {
  const rnd = rng(7);
  const sky = `<rect x="-500" y="-300" width="2600" height="1200" fill="url(#g-sky)"/>${stars(rnd, 170, -500, 2100, -300, 420)}${moon(1290, 130, 46)}${cloud(400, 170, 420, 0.25)}${cloud(1500, 250, 360, 0.22)}`;
  const far = `${cityBlock(rng(4), -300, 1900, 600, 40, 150, { fill: ["#3a4a72", "#40527b", "#36466c"], op: 0.6 })}${LM.esb(760, 600, 0.42, "#40527b")}${LM.chrysler(900, 600, 0.38, "#40527b")}${LM.p432(560, 600, 0.42)}${LM.w111(480, 600, 0.42)}${LM.cpt(420, 600, 0.42)}${LM.wtc(1260, 600, 0.36)}<rect x="-500" y="440" width="2600" height="170" fill="url(#g-haze)"/>`;
  let mid = `<rect x="-500" y="600" width="2600" height="700" fill="#cfdae6"/>`;
  mid += tudor({ x: -120, y: 690, s: 0.5, seed: 11, lights: true });
  mid += tudor({ x: 1700, y: 690, s: 0.52, seed: 12, lights: true, flip: true });
  mid += tudor({ x: 300, y: 670, s: 0.34, seed: 13, lights: true });
  mid += tudor({ x: 1320, y: 670, s: 0.34, seed: 14, lights: true, flip: true });
  for (let i = 0; i < 9; i++) mid += bareTree(-300 + i * 260 + rnd() * 60, 700, 260 + rnd() * 80, rnd, "#2b2b36");
  mid += snowGround(690, -500, 2100, 9);
  let house = tudor({ x: 800, y: 760, s: 1.02, seed: 21, lights: true, main: true });
  house = `<g class="house">${house}</g>`;
  // the yard: path, lamps, tree, nutcrackers, reindeer, mailbox
  let yard = snowGround(760, -500, 2100, 5);
  yard += `<path d="M740 900 L770 768 H830 L860 900 Z" fill="#b9b1a4"/><path d="M752 900 L776 772 M848 900 L824 772" stroke="#9b9283" stroke-width="3"/>`;
  yard += pine(1180, 770, 230, rnd, { lights: true });
  yard += pine(420, 770, 150, rnd, { lights: true });
  yard += nutcracker(712, 772, 1.05) + nutcracker(888, 772, 1.05);
  yard += reindeer(1020, 800, 1.2) + reindeer(1110, 820, 1.0);
  yard += lamp(260, 840, 190, { crook: true }) + lamp(1420, 840, 190, { crook: true });
  yard += mailbox(560, 846, 1.2);
  const fg = `${ironFence(-500, 2100, 905, 90, 15)}<rect x="-500" y="905" width="2600" height="400" fill="#dfe7ef"/>${bareTree(-120, 980, 620, rng(31), "#1c1b22")}${bareTree(1760, 980, 560, rng(32), "#1c1b22")}`;
  return {
    id: "house",
    layers: [L(0.04, sky), L(0.16, far), L(0.45, mid), L(0.8, house + yard), L(1.25, fg)],
    cam: (t, p) => ({ x: p ? path([[0, 800], [1, 800]], t) : 800, y: lerp(470, 430, t), z: lerp(1.0, 1.22, ease(t)) }),
    drone: (t) => ({ x: 800, y: lerp(530, 510, t), s: lerp(0.32, 0.42, t), vis: 1 }),
    snow: true,
  };
}

// ============================================================ 1 · over the East River to Central Park
function sceneFlight() {
  const rnd = rng(17);
  const sky = `<rect x="-1400" y="-300" width="4800" height="1200" fill="url(#g-sky)"/>${stars(rnd, 260, -1400, 3400, -300, 380)}${moon(1500, 120, 40)}${cloud(-400, 160, 600, 0.22)}${cloud(1100, 220, 480, 0.2)}${cloud(2400, 150, 560, 0.2)}`;
  // far: the whole skyline (Billionaires' Row on the left, Midtown, Downtown far right)
  const r2 = rng(5);
  let far = cityBlock(r2, -900, 2600, 600, 60, 210, { skip: [[300, 360], [400, 440], [470, 500], [540, 580], [640, 690], [990, 1050], [1140, 1180], [1240, 1280], [1340, 1390], [1500, 1550], [2100, 2160]] });
  far += LM.cpt(420, 600, 0.95) + LM.w111(485, 600, 0.95) + LM.one57(330, 600, 0.9, "") + LM.p432(560, 600, 0.95) + LM.w53(665, 600, 0.9);
  far += LM.esb(1020, 600, 0.95, "#33466b") + LM.chrysler(1160, 600, 0.9, "#33466b") + LM.vanderbilt(1260, 600, 0.95) + LM.citi(1365, 600, 0.95) + LM.wtc(2130, 600, 0.75);
  far += `<rect x="-1400" y="430" width="4800" height="180" fill="url(#g-haze)" opacity=".7"/>`;
  // mid: Upper East Side, the East River, the Queensboro Bridge
  let mid = cityBlock(rng(8), -900, 900, 680, 40, 130, { fill: ["#2b3858", "#303f62", "#283554"], pats: ["p-wa", "p-wb", "p-wc"], towers: 0.5, op: 0.9 });
  mid += `<rect x="880" y="660" width="2600" height="640" fill="url(#g-water)"/>${reflections(rng(9), 900, 3300, 670, 900, 160)}`;
  mid += `<rect x="-900" y="680" width="1790" height="620" fill="#20283a"/>`;
  mid += queensboro(860, 2700, 610, 1.15);
  // Roosevelt Island tram, a little red cabin on its wire
  mid += `<path d="M900 470 L1700 560" stroke="#7d8696" stroke-width="2"/><g class="tram"><rect x="1240" y="514" width="40" height="22" rx="5" fill="#c8312c"/><rect x="1245" y="518" width="30" height="8" fill="#ffe2a6"/><path d="M1260 514 v-10" stroke="#555" stroke-width="2"/></g>`;
  // near: Queens rooftops (right) and Central Park in snow (left)
  const r3 = rng(21);
  let near = "";
  // Central Park: snowy meadow, the Lake, Bow Bridge, Wollman Rink, lamps, bare trees and pines
  near += `<path d="M-1300 640 Q-600 610 0 650 T1000 660 L1060 1300 H-1300 Z" fill="url(#g-snow)"/>`;
  near += `<path d="M-520 760 Q-300 720 -60 750 Q120 770 160 800 Q20 840 -260 836 Q-480 826 -520 760 Z" fill="#334a6c"/>${reflections(rng(4), -500, 140, 760, 830, 40)}`;
  near += `<path d="M-330 790 Q-250 735 -170 790" stroke="#efe9dc" stroke-width="10" fill="none"/><path d="M-330 790 Q-250 735 -170 790" stroke="#bfb5a1" stroke-width="3" fill="none" transform="translate(0 -12)"/>`;
  for (let k = 0; k < 9; k++) near += `<rect x="${-322 + k * 18}" y="${r1(780 - Math.sin((k / 8) * Math.PI) * 46)}" width="2" height="12" fill="#bfb5a1"/>`;
  near += `<ellipse cx="420" cy="860" rx="190" ry="42" fill="#d7e7f3" stroke="#a7b8c8" stroke-width="4"/><g class="skaters">`;
  for (let k = 0; k < 7; k++) near += `<g class="skater" style="animation-delay:-${k * 1.7}s"><rect x="${300 + k * 34}" y="842" width="9" height="14" rx="3" fill="${["#c8312c", "#1f3c56", "#7fa58f", "#c9a35b"][k % 4]}"/><circle cx="${304.5 + k * 34}" cy="837" r="4.5" fill="#f0cfb6"/></g>`;
  near += `</g>`;
  for (let i = 0; i < 26; i++) {
    const x = -1250 + i * 90 + r3() * 40;
    if (x > -560 && x < 200 && i % 3) continue;
    near += r3() < 0.55 ? bareTree(x, 700 + r3() * 40, 220 + r3() * 120, r3, "#262530") : pine(x, 710 + r3() * 40, 140 + r3() * 90, r3, { lights: false });
  }
  near += lamp(-80, 820, 120) + lamp(620, 820, 120) + lamp(-700, 820, 120);
  // Queens: rowhouses with water towers and holiday lights
  let qx = 1780;
  while (qx < 3400) {
    const w = 70 + r3() * 70, h = 60 + r3() * 90;
    near += `<rect x="${r1(qx)}" y="${r1(760 - h)}" width="${r1(w)}" height="${r1(h + 600)}" fill="url(#p-brick2)"/><rect x="${r1(qx)}" y="${r1(760 - h)}" width="${r1(w)}" height="${r1(h + 600)}" fill="url(#p-wq)" opacity=".85"/><rect x="${r1(qx - 2)}" y="${r1(760 - h - 6)}" width="${r1(w + 4)}" height="8" fill="#eef3f7"/>`;
    if (r3() < 0.4) near += lightString([[qx, 760 - h + 4], [qx + w, 760 - h + 4]], 10, 2.4, Math.floor(qx), 5);
    if (r3() < 0.3) near += `<g transform="translate(${r1(qx + w / 2)} ${r1(760 - h)}) scale(2.2)"><rect x="-6" y="-6" width="1.5" height="6" fill="#2a2530"/><rect x="4.5" y="-6" width="1.5" height="6" fill="#2a2530"/><rect x="-6" y="-16" width="12" height="10" fill="#4a3a2e"/><path d="M-7 -16 L0 -21 L7 -16Z" fill="#4a3a2e"/></g>`;
    qx += w + 4;
  }
  // foreground: snowy park branches (left) and a Queens rooftop parapet with a water tower (right)
  let fg = `${bareTree(-900, 1100, 760, rng(41), "#17161c")}${bareTree(300, 1150, 640, rng(42), "#17161c")}`;
  fg += `<rect x="2200" y="860" width="1400" height="500" fill="#2b2023"/><rect x="2200" y="848" width="1400" height="18" fill="#eef3f7"/><g transform="translate(2560 860) scale(6)"><rect x="-6" y="-8" width="1.6" height="8" fill="#1d1a1e"/><rect x="4.4" y="-8" width="1.6" height="8" fill="#1d1a1e"/><rect x="-7" y="-22" width="14" height="14" fill="#3f3027"/><path d="M-8 -22 L0 -28 L8 -22Z" fill="#3f3027"/><path d="M-8 -22 L0 -28 L8 -22" fill="none" stroke="#eef3f7" stroke-width=".8"/></g>`;
  return {
    id: "flight",
    layers: [L(0.04, sky, [-1400, -300, 4800, 1500]), L(0.25, far, [-1400, -300, 4800, 1500]), L(0.5, mid, [-1400, -300, 4800, 1600]), L(0.85, near, [-1400, -300, 4800, 1600]), L(1.3, fg, [-1400, -300, 5200, 1700])],
    cam: (t) => ({ x: path([[0, 2300], [0.82, 380], [1, 360]], t), y: path([[0, 470], [0.5, 430], [1, 440]], t), z: path([[0, 1.0], [0.82, 1.0], [1, 1.08]], t) }),
    drone: (t) => {
      const c = path([[0, 2300], [0.82, 380], [1, 360]], t);
      return { x: c + path([[0, -60], [0.15, -160], [0.8, -120], [1, 120]], t), y: path([[0, 420], [0.3, 360], [0.7, 390], [1, 400]], t), s: path([[0, 0.8], [0.4, 0.72], [1, 0.75]], t), vis: 1 };
    },
  };
}

// ============================================================ 2 · the study: a letter on the desk
function sceneStudy() {
  const rnd = rng(27);
  const out = `<rect x="700" y="0" width="900" height="700" fill="url(#g-sky2)"/>${stars(rnd, 60, 700, 1600, 0, 360)}${moon(1280, 150, 26)}${cityBlock(rng(6), 700, 1650, 560, 60, 260, { op: 0.9 })}${LM.esb(1150, 560, 0.7, "#33466b")}${LM.chrysler(1290, 560, 0.62, "#33466b")}<rect x="700" y="420" width="900" height="150" fill="url(#g-haze)" opacity=".6"/><rect x="700" y="560" width="900" height="200" fill="#1b2438"/>`;
  // wall with a window (hole), wainscot, curtains, a painting, sconces
  let wall = `<path fill-rule="evenodd" d="M-500 -300 H2100 V1300 H-500 Z M960 110 H1400 V540 H960 Z" fill="url(#p-damask)"/>`;
  wall += `<rect x="-500" y="600" width="2600" height="700" fill="url(#p-wains)"/><rect x="-500" y="590" width="2600" height="16" fill="${C.walnutDk}"/>`;
  wall += `<rect x="948" y="98" width="464" height="454" fill="none" stroke="#f1e8d6" stroke-width="16"/><rect x="1176" y="110" width="8" height="430" fill="#f1e8d6"/><rect x="960" y="320" width="440" height="8" fill="#f1e8d6"/><rect x="930" y="548" width="500" height="22" fill="#e7dcc6"/>`;
  wall += `<path d="M880 60 Q900 300 860 620 L960 620 Q990 330 960 60 Z" fill="url(#g-velvet)"/><path d="M1480 60 Q1460 300 1500 620 L1400 620 Q1370 330 1400 60 Z" fill="url(#g-velvet)"/><rect x="850" y="48" width="680" height="16" rx="8" fill="url(#g-brass)"/>`;
  wall += `<g transform="translate(250 170)"><rect x="-6" y="-6" width="292" height="212" fill="url(#g-gold)"/><rect width="280" height="200" fill="#2b3c5e"/><path d="M0 150 Q140 120 280 150 V200 H0Z" fill="#1d2a44"/><path d="M20 150 L60 60 L100 150 M180 150 L220 60 L260 150" stroke="#b9a98c" stroke-width="6" fill="none"/><path d="M60 60 Q140 140 220 60" stroke="#b9a98c" stroke-width="2" fill="none"/><path d="M0 155 H280" stroke="#d8c8a8" stroke-width="4"/><text x="140" y="190" font-family="Caveat, cursive" font-size="18" fill="#e7cf98" text-anchor="middle">Brooklyn Bridge</text></g>`;
  wall += `<g transform="translate(150 470)"><rect x="-2" y="0" width="4" height="40" fill="${C.brass}"/><path d="M-22 -30 h44 l-10 30 h-24z" fill="#f2e4c4"/></g><g transform="translate(640 470)"><rect x="-2" y="0" width="4" height="40" fill="${C.brass}"/><path d="M-22 -30 h44 l-10 30 h-24z" fill="#f2e4c4"/></g>`;
  // the desk and everything on it
  let desk = `<path d="M180 640 H1460 L1560 760 H80 Z" fill="url(#g-walnut)"/><rect x="80" y="760" width="1480" height="30" fill="${C.walnutDk}"/><rect x="120" y="790" width="1400" height="500" fill="#4a2f1e"/>`;
  for (let i = 0; i < 3; i++) desk += `<rect x="${200 + i * 440}" y="820" width="380" height="110" rx="4" fill="#57382a" stroke="#3a2416" stroke-width="4"/><rect x="${370 + i * 440}" y="866" width="40" height="10" rx="5" fill="url(#g-brass)"/>`;
  desk += `<ellipse cx="1240" cy="690" rx="260" ry="70" fill="url(#g-pool)"/>`;
  desk += `<g transform="translate(1240 690)"><ellipse cx="0" cy="0" rx="40" ry="10" fill="url(#g-brass)"/><rect x="-4" y="-120" width="8" height="120" fill="url(#g-brass)"/><path d="M-80 -120 Q0 -170 80 -120 Z" fill="#2f6b4f"/><path d="M-80 -120 Q0 -110 80 -120" stroke="#e9d38f" stroke-width="4" fill="none"/><rect x="18" y="-110" width="3" height="40" fill="url(#g-brass)"/></g>`;
  desk += `<g class="hot letter" data-hot="letter" tabindex="-1"><path d="M760 660 L960 648 L990 742 L770 756 Z" fill="#fbf6ea" stroke="#d9cfba" stroke-width="2"/>`;
  for (let i = 0; i < 6; i++) desk += `<path d="M${790 + i * 1} ${672 + i * 13} L${940 + i * 7} ${664 + i * 13}" stroke="#7b8fb0" stroke-width="2" opacity=".55"/>`;
  desk += `<text x="800" y="680" font-family="Caveat, cursive" font-size="20" fill="#24304a" transform="rotate(-3 800 680)">Dear reader,</text></g>`;
  desk += `<path d="M1000 720 L1080 690" stroke="#1d1d1d" stroke-width="6" stroke-linecap="round"/><path d="M1080 690 L1090 686" stroke="${C.brass}" stroke-width="6" stroke-linecap="round"/>`;
  desk += `<g transform="translate(560 650)"><rect x="-60" y="-24" width="120" height="24" fill="#2f5a4c"/><rect x="-54" y="-46" width="108" height="22" fill="#7a2f2a"/><rect x="-62" y="-66" width="124" height="20" fill="#c9a35b"/><text x="0" y="-52" font-size="11" font-family="Georgia" text-anchor="middle" fill="#1d1d1d">C++ PRIMER</text></g>`;
  desk += `<g transform="translate(400 646)"><rect x="-26" y="-34" width="52" height="34" rx="6" fill="#9cc7b2" stroke="#2a3140" stroke-width="3"/><circle cx="-10" cy="-18" r="6" fill="#1d2b4a"/><circle cx="10" cy="-18" r="6" fill="#1d2b4a"/><rect x="-3" y="-50" width="6" height="16" fill="#2a3140"/><circle cx="0" cy="-52" r="5" fill="#c8312c"/><rect x="-34" y="-6" width="68" height="10" rx="5" fill="#2a3140"/><text x="0" y="22" font-size="13" font-family="Caveat" text-anchor="middle" fill="#e7cf98">3371</text></g>`;
  desk += `<g transform="translate(1420 650)"><path d="M-24 0 L-20 -40 H20 L24 0Z" fill="#f6efe2"/><path d="M20 -32 q16 0 16 14 q0 12 -16 12" stroke="#f6efe2" stroke-width="6" fill="none"/><g class="steam"><path d="M-8 -48 q-8 -14 0 -26 q8 -12 0 -24" stroke="#fff" stroke-width="3" fill="none" opacity=".5"/><path d="M8 -48 q-8 -14 0 -26" stroke="#fff" stroke-width="3" fill="none" opacity=".4"/></g></g>`;
  desk += `<g transform="translate(1080 640)"><path d="M-20 0 L-24 -36 H24 L20 0Z" fill="#c26e4a"/><path d="M0 -36 Q-30 -70 -18 -90 M0 -36 Q8 -80 30 -88 M0 -36 Q-4 -70 6 -100" stroke="#3f6b4b" stroke-width="10" fill="none" stroke-linecap="round"/></g>`;
  desk += cat(1380, 690, 0.8, "#b8a690");
  // Shiqi, from behind, in a tufted chair
  let her = shiqiBack(560, 560, 1.05);
  her += `<path d="M400 1300 V700 Q400 620 470 614 H650 Q720 620 720 700 V1300 Z" fill="#6b2f2a"/><path d="M400 700 Q400 620 470 614 H650 Q720 620 720 700" fill="none" stroke="#4a1f1c" stroke-width="10"/>`;
  for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) her += `<circle cx="${450 + i * 72}" cy="${680 + j * 70}" r="5" fill="#3e1916"/>`;
  her += `<path d="M450 640 Q560 620 670 640" stroke="#7f3a33" stroke-width="5" fill="none" opacity=".6"/>`;
  const fg = `<g transform="translate(1660 -40)"><path d="M0 0 Q-60 160 -20 360" stroke="#2d4a36" stroke-width="5" fill="none"/>${Array.from({ length: 12 }, (_, i) => `<ellipse cx="${r1(-30 - Math.sin(i) * 30)}" cy="${30 + i * 28}" rx="26" ry="13" fill="${i % 2 ? "#3f6b4b" : "#4f7d5a"}" transform="rotate(${i % 2 ? 30 : -30} ${r1(-30 - Math.sin(i) * 30)} ${30 + i * 28})"/>`).join("")}</g>`;
  return {
    id: "study",
    layers: [L(0.12, out), L(0.7, wall), L(1.0, desk), L(1.15, her), L(1.35, fg)],
    cam: (t, p) => ({ x: p ? path([[0, 1100], [0.5, 900], [1, 880]], t) : lerp(800, 860, t), y: lerp(470, 560, ease(t)), z: lerp(1.0, 1.28, ease(t)) }),
    drone: (t) => ({ x: path([[0, 1300], [1, 1120]], t), y: path([[0, 260], [1, 330]], t), s: 0.42, vis: 1 }),
  };
}

// ============================================================ 3 · the library: the experience book
function sceneLibrary() {
  const rnd = rng(37);
  const cols = ["#2f5a4c", "#7a2f2a", "#1f3c56", "#c9a35b", "#556b8a", "#8a5a3c", "#e6dcc6", "#3f6b4b", "#9b4d3a", "#2b3a5c", "#b98d45", "#6d7f5c"];
  let shelves = `<rect x="-500" y="-300" width="2600" height="1600" fill="#3b2619"/>`;
  const rows = [70, 280, 490, 700];
  rows.forEach((y, ri) => {
    shelves += `<rect x="-500" y="${y + 170}" width="2600" height="24" fill="url(#g-walnut)"/><rect x="-500" y="${y + 194}" width="2600" height="8" fill="#2a1a10"/>`;
    let x = -480;
    while (x < 2080) {
      if (ri === 2 && x > 880 && x < 1010) { x = 1010; continue; }
      if (rnd() < 0.06) {
        // a little object between the books
        const k = Math.floor(rnd() * 4);
        if (k === 0) shelves += `<g transform="translate(${x + 40} ${y + 170})"><circle cx="0" cy="-46" r="34" fill="#557c9f"/><path d="M-20 -70 q20 10 10 30 q-10 14 10 30" fill="#7fa58f"/><path d="M-36 -46 a36 36 0 0 0 72 0" stroke="${C.brass}" stroke-width="3" fill="none"/><rect x="-3" y="-12" width="6" height="12" fill="${C.brass}"/><rect x="-18" y="0" width="36" height="5" fill="${C.brass}" transform="translate(0 -5)"/></g>`;
        if (k === 1) shelves += `<g transform="translate(${x + 30} ${y + 170})"><path d="M-18 0 L-14 -40 H14 L18 0Z" fill="#e6dcc6"/><path d="M0 -40 Q-26 -70 -14 -84 M0 -40 Q10 -76 26 -80" stroke="#3f6b4b" stroke-width="9" fill="none" stroke-linecap="round"/></g>`;
        if (k === 2) shelves += `<g transform="translate(${x + 30} ${y + 170})"><rect x="-14" y="-12" width="28" height="12" fill="#2a2a2a"/><path d="M-8 -12 V-40 H8 V-12" fill="url(#g-gold)"/><path d="M-20 -60 Q-20 -40 0 -40 Q20 -40 20 -60 Z" fill="url(#g-gold)"/><text x="0" y="-48" font-size="9" text-anchor="middle" fill="#5b3b26" font-weight="700">FTC</text></g>`;
        if (k === 3) shelves += `<g transform="translate(${x + 34} ${y + 170})"><rect x="-26" y="-64" width="52" height="64" fill="url(#g-gold)"/><rect x="-20" y="-58" width="40" height="52" fill="#c6dceb"/><circle cx="0" cy="-38" r="9" fill="#f0cfb6"/><path d="M-12 -6 Q0 -30 12 -6Z" fill="${C.sage}"/><path d="M-10 -40 Q0 -54 10 -40 V-24 H-10Z" fill="${C.hair}" opacity=".9"/></g>`;
        x += 74;
        continue;
      }
      const w = 16 + rnd() * 22, h = 110 + rnd() * 56, c = cols[Math.floor(rnd() * cols.length)];
      const lean = rnd() < 0.05 ? -8 : 0;
      shelves += `<g transform="rotate(${lean} ${r1(x)} ${y + 170})"><rect x="${r1(x)}" y="${r1(y + 170 - h)}" width="${r1(w)}" height="${r1(h)}" fill="${c}"/><rect x="${r1(x)}" y="${r1(y + 170 - h + 14)}" width="${r1(w)}" height="4" fill="#e3c27f" opacity=".75"/><rect x="${r1(x)}" y="${r1(y + 170 - 24)}" width="${r1(w)}" height="4" fill="#e3c27f" opacity=".6"/><rect x="${r1(x + w - 3)}" y="${r1(y + 170 - h)}" width="3" height="${r1(h)}" fill="#000" opacity=".18"/></g>`;
      x += w + (rnd() < 0.1 ? 6 : 1);
    }
  });
  for (let x = -480; x < 2100; x += 520) shelves += `<rect x="${x}" y="-300" width="30" height="1600" fill="url(#g-walnut)"/>`;
  shelves += `<rect x="-500" y="30" width="2600" height="10" fill="url(#g-brass)"/>`;
  // the experience book, pulled out a little, wiggling
  const book = `<g class="hot expbook" data-hot="book" tabindex="-1"><g class="wiggle">
    <path d="M890 666 L960 640 L960 450 L890 470 Z" fill="#244a3d"/>
    <rect x="890" y="470" width="62" height="196" fill="${C.sageDk}" stroke="#1f3a30" stroke-width="2"/>
    <rect x="890" y="486" width="62" height="6" fill="url(#g-gold)"/><rect x="890" y="644" width="62" height="6" fill="url(#g-gold)"/>
    <text x="921" y="568" font-family="Cinzel Decorative, Georgia, serif" font-size="15" font-weight="700" fill="#f1d998" text-anchor="middle" transform="rotate(-90 921 568)">EXPERIENCE</text>
    <path d="M940 666 L940 712 L948 702 L956 712 L956 660" fill="#c8312c"/>
    <path d="M962 452 l10 -10 l4 12z" fill="#f1d998"/></g></g>`;
  // rolling ladder on its brass rail
  const ladder = `<g class="ladder"><path d="M0 26 L-130 900 M90 26 L-40 900" stroke="#6e4930" stroke-width="16" stroke-linecap="round"/>${Array.from({ length: 11 }, (_, i) => `<path d="M${r1(-6 - i * 11.6)} ${110 + i * 76} H${r1(84 - i * 11.6)}" stroke="#7d5638" stroke-width="10"/>`).join("")}<circle cx="0" cy="34" r="12" fill="url(#g-brass)"/><circle cx="90" cy="34" r="12" fill="url(#g-brass)"/><circle cx="-130" cy="900" r="14" fill="#2a2a2a"/><circle cx="-40" cy="900" r="14" fill="#2a2a2a"/></g>`;
  const fg = `<path d="M-500 1300 V860 Q-460 780 -340 790 Q-250 800 -240 880 V1300 Z" fill="#6b2f2a"/><path d="M-340 790 Q-250 800 -240 880" stroke="#4a1f1c" stroke-width="10" fill="none"/><g transform="translate(1900 900)"><rect x="-8" y="-420" width="16" height="420" fill="url(#g-brass)"/><path d="M-90 -420 L-60 -520 H60 L90 -420Z" fill="#f2e4c4"/><ellipse cx="0" cy="-300" rx="200" ry="120" fill="url(#g-pool2)"/></g>`;
  return {
    id: "library",
    layers: [L(0.85, shelves + book), L(1.05, ladder), L(1.3, fg)],
    cam: (t, p) => ({ x: p ? path([[0, 500], [1, 930]], t) : path([[0, 620], [1, 880]], t), y: path([[0, 520], [1, 520]], t), z: path([[0, 1.0], [1, 1.14]], t) }),
    drone: (t) => ({ x: path([[0, 560], [1, 1080]], t), y: path([[0, 200], [1, 330]], t), s: 0.42, vis: 1 }),
    tick(root, t) {
      const lad = root.querySelector(".ladder");
      if (lad) lad.setAttribute("transform", `translate(${r1(path([[0, 120], [0.75, 820], [1, 830]], t))} 0)`);
    },
  };
}

// ============================================================ 4 · the workshop
function sceneWorkshop() {
  let wall = `<rect x="-500" y="-300" width="2600" height="1000" fill="url(#p-peg)"/><rect x="-500" y="-300" width="2600" height="1000" fill="url(#g-shade)" opacity=".4"/>`;
  wall += `<rect x="-500" y="140" width="2600" height="16" fill="url(#g-walnut)"/>`;
  // tools hanging on the pegboard
  const tools = [
    (x) => `<path d="M${x} 230 v120" stroke="#8a949e" stroke-width="10" stroke-linecap="round"/><path d="M${x - 18} 222 a18 18 0 1 1 36 0 l-10 0 a8 8 0 0 0 -16 0 z" fill="#8a949e"/>`,
    (x) => `<rect x="${x - 6}" y="230" width="12" height="70" rx="5" fill="#c8312c"/><rect x="${x - 2}" y="300" width="4" height="60" fill="#c9cfd8"/>`,
    (x) => `<rect x="${x - 6}" y="230" width="12" height="70" rx="5" fill="#f2c14e"/><rect x="${x - 2}" y="300" width="4" height="50" fill="#c9cfd8"/>`,
    (x) => `<path d="M${x - 10} 230 L${x + 10} 330 M${x + 10} 230 L${x - 10} 330" stroke="#c9cfd8" stroke-width="7"/><path d="M${x - 10} 330 l-6 50 M${x + 10} 330 l6 50" stroke="#2f6bd0" stroke-width="12" stroke-linecap="round"/>`,
    (x) => `<rect x="${x - 4}" y="230" width="8" height="100" fill="#6e4930"/><rect x="${x - 28}" y="224" width="56" height="22" rx="3" fill="#5a6577"/>`,
    (x) => `<path d="M${x - 50} 250 h140 v40 l-140 10 z" fill="#c9cfd8"/><rect x="${x + 90}" y="246" width="34" height="50" rx="10" fill="#7a2f2a"/>`,
    (x) => `<circle cx="${x}" cy="270" r="36" fill="none" stroke="#c8312c" stroke-width="12"/><circle cx="${x}" cy="270" r="20" fill="#5d4128"/>`,
    (x) => `<rect x="${x - 4}" y="230" width="8" height="120" fill="#c9cfd8"/><rect x="${x - 4}" y="230" width="44" height="10" fill="#c9cfd8"/><rect x="${x - 4}" y="270" width="30" height="8" fill="#c9cfd8"/>`,
  ];
  [80, 170, 210, 260, 340, 430, 600, 760, 860].forEach((x, i) => (wall += tools[i % tools.length](x)));
  // parts bins and an oscilloscope on the shelf
  for (let i = 0; i < 8; i++) wall += `<g transform="translate(${-200 + i * 90} 140)"><path d="M0 0 V-50 H70 V-30 L60 0Z" fill="${["#2f6bd0", "#c8312c", "#f2c14e", "#3f7a52"][i % 4]}"/><rect x="8" y="-40" width="34" height="14" fill="#f6efe2"/></g>`;
  wall += `<g transform="translate(560 140)"><rect x="0" y="-110" width="170" height="110" rx="8" fill="#3a4250"/><rect x="12" y="-98" width="110" height="78" fill="#0f2a22"/><path class="scope" d="" stroke="#7dffb4" stroke-width="2.5" fill="none"/><circle cx="146" cy="-80" r="9" fill="#c9cfd8"/><circle cx="146" cy="-50" r="9" fill="#c9cfd8"/><circle cx="146" cy="-22" r="6" fill="#c8312c"/></g>`;
  // a 3D printer printing
  wall += `<g transform="translate(1560 140)"><rect x="-90" y="-200" width="180" height="200" fill="#e6e6e6" stroke="#5a6577" stroke-width="5"/><rect x="-80" y="-186" width="160" height="10" fill="#5a6577"/><g class="nozzle"><rect x="-14" y="-176" width="28" height="22" fill="#2a2a2a"/><path d="M-4 -154 h8 l-4 8z" fill="#2a2a2a"/></g><rect x="-60" y="-24" width="120" height="8" fill="#5a6577"/><path d="M-30 -24 v-30 h60 v30" fill="#f2c14e"/><g class="printed"><rect x="-30" y="-74" width="60" height="20" fill="#f2c14e"/></g></g>`;
  // sketch paper pinned to the wall (opens the toolbox)
  wall += `<g class="hot sketch" data-hot="sketch" tabindex="-1" transform="rotate(3 1180 340)"><rect x="1060" y="200" width="250" height="300" fill="url(#p-grid)" stroke="#c8bfa8" stroke-width="2"/><circle cx="1185" cy="212" r="7" fill="#c8312c"/><text x="1080" y="246" font-family="Caveat, cursive" font-size="30" font-weight="700" fill="#1f3c56">my toolbox</text><path d="M1090 300 h80 v60 h-80z M1130 300 v-30 l40 -10 M1110 380 l30 50 l40 -40 M1200 290 a30 30 0 1 1 0.1 0" stroke="#2f5f9e" stroke-width="3" fill="none"/><text x="1090" y="470" font-family="Caveat, cursive" font-size="22" fill="#1f3c56">C++ · Python · SolidWorks…</text></g>`;
  wall += `<rect x="-500" y="640" width="2600" height="700" fill="#2c211a"/>`;
  // the bench and the three builds (each part flies apart on "Take apart")
  let bench = `<rect x="-500" y="640" width="2600" height="40" fill="url(#g-walnut)"/><rect x="-500" y="680" width="2600" height="16" fill="${C.walnutDk}"/><rect x="40" y="696" width="40" height="600" fill="#3f2819"/><rect x="1520" y="696" width="40" height="600" fill="#3f2819"/>`;
  bench += `<ellipse cx="800" cy="650" rx="640" ry="40" fill="url(#g-pool2)"/>`;
  const part = (b, ax, ay, ar, inner) => `<g class="part" data-ax="${ax}" data-ay="${ay}" data-ar="${ar}">${inner}</g>`;
  // color sorter
  bench += `<g class="hot build" data-hot="build:sorter" tabindex="-1" transform="translate(400 640)"><rect x="-100" y="-210" width="230" height="210" fill="transparent"/>
    ${part("s", -90, 0, -8, `<rect x="-80" y="-60" width="160" height="60" rx="6" fill="#3a4250"/><rect x="-60" y="-48" width="60" height="24" fill="#1d2b4a"/><text x="-30" y="-31" font-size="12" fill="#7dffb4" text-anchor="middle" font-family="monospace">RGB</text>`)}
    ${part("s", 0, -150, 14, `<path d="M-50 -200 H50 L14 -140 H-14 Z" fill="#c6dceb" stroke="#557c9f" stroke-width="3"/><circle cx="-20" cy="-185" r="8" fill="#c8312c"/><circle cx="2" cy="-180" r="8" fill="#3f7a52"/><circle cx="22" cy="-188" r="8" fill="#2f6bd0"/><circle cx="8" cy="-196" r="8" fill="#f2c14e"/>`)}
    ${part("s", 60, -80, 30, `<rect x="-8" y="-140" width="16" height="80" fill="#c9cfd8"/><circle cx="0" cy="-100" r="22" fill="none" stroke="#5a6577" stroke-width="6"/>`)}
    ${part("s", 120, 10, 0, `<rect x="40" y="-30" width="22" height="30" rx="3" fill="#c8312c" opacity=".85"/><rect x="66" y="-30" width="22" height="30" rx="3" fill="#3f7a52" opacity=".85"/><rect x="92" y="-30" width="22" height="30" rx="3" fill="#2f6bd0" opacity=".85"/>`)}
  </g>`;
  // robotic crane
  bench += `<g class="hot build" data-hot="build:crane" tabindex="-1" transform="translate(800 640)"><rect x="-100" y="-320" width="300" height="320" fill="transparent"/>
    ${part("c", 0, 10, 0, `<rect x="-70" y="-24" width="140" height="24" rx="4" fill="#3a4250"/><circle cx="-46" cy="-12" r="6" fill="#f2c14e"/>`)}
    ${part("c", -110, -40, -12, `<path d="M-14 -24 V-300 M14 -24 V-300 ${Array.from({ length: 11 }, (_, i) => `M-14 ${-24 - i * 25} L14 ${-49 - i * 25}`).join(" ")}" stroke="#f2c14e" stroke-width="5" fill="none"/>`)}
    ${part("c", 110, -120, 10, `<path d="M-60 -300 H190 M-60 -280 H170 ${Array.from({ length: 10 }, (_, i) => `M${-60 + i * 25} -280 L${-35 + i * 25} -300`).join(" ")}" stroke="#f2c14e" stroke-width="5" fill="none"/><rect x="-90" y="-310" width="34" height="34" fill="#5a6577"/>`)}
    ${part("c", 170, 40, 20, `<path d="M160 -280 V-150" stroke="#2a2a2a" stroke-width="2"/><path d="M152 -150 q8 14 16 0" stroke="#5a6577" stroke-width="5" fill="none"/><rect x="146" y="-136" width="28" height="28" fill="#c26e4a"/>`)}
  </g>`;
  // temperature box
  bench += `<g class="hot build" data-hot="build:tempbox" tabindex="-1" transform="translate(1210 640)"><rect x="-90" y="-130" width="250" height="130" fill="transparent"/>
    ${part("t", 0, 20, 0, `<rect x="-80" y="-110" width="160" height="110" rx="8" fill="#c4dfcd" stroke="#4f7a64" stroke-width="4" opacity=".95"/>`)}
    ${part("t", -60, -110, -10, `<rect x="-60" y="-100" width="80" height="54" fill="#1f6b4f"/><path d="M-50 -90 h60 M-50 -80 h40 M-50 -70 h56" stroke="#e9d38f" stroke-width="2"/><rect x="-20" y="-62" width="16" height="10" fill="#2a2a2a"/>`)}
    ${part("t", 70, -120, 8, `<rect x="0" y="-104" width="70" height="40" rx="4" fill="#1d2b4a"/><text x="35" y="-78" font-size="16" fill="#7dffb4" text-anchor="middle" font-family="monospace" class="temp">72.4°F</text>`)}
    ${part("t", 140, 0, 30, `<path d="M80 -40 Q140 -40 150 -2" stroke="#2a2a2a" stroke-width="4" fill="none"/><rect x="146" y="-6" width="8" height="10" fill="#c9cfd8"/>`)}
    ${part("t", 0, -190, -6, `<rect x="-86" y="-122" width="172" height="14" rx="6" fill="#9cc7b2" stroke="#4f7a64" stroke-width="3"/>`)}
  </g>`;
  const fg = `<g transform="translate(-60 900)"><rect x="-90" y="-180" width="180" height="40" fill="#5a6577"/><rect x="-20" y="-140" width="40" height="140" fill="#3a4250"/><rect x="-110" y="-200" width="60" height="30" fill="#5a6577"/><rect x="50" y="-200" width="60" height="30" fill="#5a6577"/></g><g transform="translate(1700 860)"><rect x="-90" y="-60" width="180" height="60" rx="6" fill="#c8312c"/><circle cx="-50" cy="-30" r="12" fill="#2a2a2a"/><text x="20" y="-24" font-size="18" fill="#fff" font-family="monospace">350°</text><path d="M60 -60 Q120 -160 40 -200 L0 -230" stroke="#2a2a2a" stroke-width="6" fill="none"/><path d="M0 -230 L-40 -250" stroke="#c9cfd8" stroke-width="10" stroke-linecap="round"/></g>`;
  return {
    id: "workshop",
    layers: [L(0.75, wall), L(1.0, bench), L(1.3, fg)],
    cam: (t, p) => ({ x: p ? path([[0, 400], [0.5, 800], [1, 1220]], t) : lerp(760, 840, t), y: lerp(400, 420, t), z: lerp(1.0, 1.06, t) }),
    drone: (t) => ({ x: path([[0, 1360], [1, 1430]], t), y: path([[0, 360], [1, 420]], t), s: 0.4, vis: 1 }),
    tick(root, t, time) {
      const sc = root.querySelector(".scope");
      if (sc) {
        let d = "M12 -59";
        for (let i = 0; i <= 55; i++) d += ` L${12 + i * 2} ${r1(-59 + Math.sin(i * 0.45 + time * 5) * 22 * Math.sin(time * 0.7 + i * 0.05))}`;
        sc.setAttribute("d", d);
      }
      const nz = root.querySelector(".nozzle");
      if (nz) nz.setAttribute("transform", `translate(${r1(Math.sin(time * 2) * 40)} 0)`);
      const tp = root.querySelector(".temp");
      if (tp) tp.textContent = (72 + Math.sin(time * 0.3) * 0.8).toFixed(1) + "°F";
    },
  };
}

// ============================================================ 5 · the wall of frames
export function certList() {
  return [
    ...HONORS.map((h) => ({ ...h, kind: h.kind || "Honor", honor: true })),
    ...CERTS.flatMap((g) => g.items.map((c) => ({ ...c, kind: /Onramp|Certificate|Program|Training/.test(c.title) ? "Certificate of Completion" : "Certification" }))),
  ];
}
function sceneHonors() {
  const all = certList();
  let wall = `<rect x="-500" y="-300" width="2600" height="1000" fill="url(#p-blue)"/><rect x="-500" y="640" width="2600" height="700" fill="url(#p-wainsW)"/><rect x="-500" y="628" width="2600" height="16" fill="#d9ccb2"/>`;
  wall += `<rect x="-500" y="-60" width="2600" height="14" fill="#d9ccb2"/>`;
  const frame = (c, i, x, y, w, h) => {
    const gold = c.honor;
    const lines = wrapLines(c.title, gold ? 22 : 20).slice(0, 3);
    let g = `<g class="hot frame" data-hot="cert:${i}" tabindex="-1">`;
    g += `<rect x="${x - 4}" y="${y + 8}" width="${w + 8}" height="${h + 8}" fill="#000" opacity=".25"/>`;
    g += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${gold ? "url(#g-gold)" : "#3b2a1f"}"/>`;
    g += `<rect x="${x + (gold ? 14 : 9)}" y="${y + (gold ? 14 : 9)}" width="${w - (gold ? 28 : 18)}" height="${h - (gold ? 28 : 18)}" fill="#fbf7ee"/>`;
    g += `<rect x="${x + (gold ? 22 : 15)}" y="${y + (gold ? 22 : 15)}" width="${w - (gold ? 44 : 30)}" height="${h - (gold ? 44 : 30)}" fill="none" stroke="${gold ? "#b8914a" : "#7aa592"}" stroke-width="2"/>`;
    const cx = x + w / 2;
    g += `<text x="${cx}" y="${y + (gold ? 46 : 34)}" font-family="DM Sans, sans-serif" font-size="${gold ? 9 : 7.5}" letter-spacing="1.2" fill="#69716b" text-anchor="middle">${esc(c.kind.toUpperCase())}</text>`;
    g += `<text x="${cx}" y="${y + (gold ? 66 : 50)}" font-family="Caveat, cursive" font-size="${gold ? 20 : 15}" fill="#3f7a64" text-anchor="middle">Shiqi Lin</text>`;
    lines.forEach((l, k) => (g += `<text x="${cx}" y="${y + (gold ? 92 : 70) + k * (gold ? 17 : 13)}" font-family="Playfair Display, Georgia, serif" font-weight="700" font-size="${gold ? 14 : 11}" fill="#1d2430" text-anchor="middle">${esc(l)}</text>`));
    g += `<circle cx="${x + w - (gold ? 40 : 30)}" cy="${y + h - (gold ? 40 : 30)}" r="${gold ? 14 : 10}" fill="${gold ? "#c9a35b" : "#9cc7b2"}"/>`;
    if (c.links) g += `<text x="${x + (gold ? 30 : 22)}" y="${y + h - (gold ? 30 : 22)}" font-family="Caveat, cursive" font-size="${gold ? 14 : 12}" fill="#3f7a64">✓ verified</text>`;
    return g + "</g>";
  };
  const honors = all.filter((c) => c.honor), certs = all.filter((c) => !c.honor);
  honors.forEach((c, k) => {
    const x = 130 + k * 340;
    wall += `<rect x="${x + 70}" y="38" width="140" height="10" rx="5" fill="url(#g-brass)"/><path d="M${x + 60} 48 h160 l40 220 h-240z" fill="#fff2cf" opacity=".12"/>`;
    wall += frame(c, all.indexOf(c), x, 70, 280, 220);
  });
  certs.forEach((c, k) => {
    const row = k < 7 ? 0 : 1, col = row ? k - 7 : k;
    const x = row ? 60 + col * 220 + 100 : 40 + col * 218, y = row ? 480 : 322;
    wall += frame(c, all.indexOf(c), x, y, 190, 140);
  });
  // pennants
  wall += `<g transform="translate(-260 40) rotate(8)"><path d="M0 0 L220 40 L0 80 Z" fill="#cc0000"/><text x="70" y="52" font-family="Georgia" font-weight="900" font-size="34" fill="#fff">BU</text></g>`;
  wall += `<g transform="translate(1660 40) rotate(-8)"><path d="M220 0 L0 40 L220 80 Z" fill="#1d2b4a"/><text x="110" y="52" font-family="DM Sans" font-weight="700" font-size="22" fill="#f2c14e" text-anchor="middle">FTC 3371</text></g>`;
  let floor = `<g transform="translate(800 880)"><rect x="-300" y="-110" width="600" height="60" rx="26" fill="${C.sageDk}"/><rect x="-310" y="-60" width="620" height="22" fill="#3f2819"/><rect x="-290" y="-40" width="18" height="60" fill="#3f2819"/><rect x="272" y="-40" width="18" height="60" fill="#3f2819"/></g>`;
  floor += `<g transform="translate(1500 900)"><path d="M-50 0 L-40 -90 H40 L50 0Z" fill="#e6dcc6"/>${Array.from({ length: 9 }, (_, i) => `<ellipse cx="${r1(Math.cos(i) * 60)}" cy="${-150 - i * 30}" rx="40" ry="24" fill="${i % 2 ? "#3f6b4b" : "#557d5c"}" transform="rotate(${i * 37} ${r1(Math.cos(i) * 60)} ${-150 - i * 30})"/>`).join("")}<rect x="-3" y="-420" width="6" height="330" fill="#3a2b22"/></g>`;
  return {
    id: "honors",
    layers: [L(0.85, wall), L(1.12, floor)],
    cam: (t, p) => ({ x: p ? path([[0, 230], [0.5, 800], [1, 1360]], t) : path([[0, 700], [1, 880]], t), y: p ? 420 : 400, z: p ? 1.05 : lerp(1.0, 1.04, t) }),
    drone: (t) => ({ x: path([[0, 1400], [1, 1480]], t), y: path([[0, 680], [1, 660]], t), s: 0.36, vis: 1 }),
  };
}

// ============================================================ 6 · the bedroom
function sceneBedroom() {
  const rnd = rng(61);
  let out = `<rect x="800" y="40" width="800" height="560" fill="url(#g-sky2)"/>${stars(rnd, 50, 800, 1600, 40, 300)}${tudor({ x: 1180, y: 520, s: 0.4, seed: 71, lights: true })}${pine(1000, 520, 110, rnd, { lights: true })}<rect x="800" y="510" width="800" height="120" fill="#e9eff5"/>`;
  out += `<g class="snowfall-static">${Array.from({ length: 40 }, () => `<circle cx="${r1(800 + rnd() * 800)}" cy="${r1(40 + rnd() * 500)}" r="${r1(1.2 + rnd() * 2)}" fill="#fff" opacity=".8"/>`).join("")}</g>`;
  let room = `<path fill-rule="evenodd" d="M-500 -300 H2100 V1300 H-500 Z M1000 130 H1380 V480 H1000 Z" fill="url(#p-stripe)"/>`;
  room += `<rect x="988" y="118" width="404" height="374" fill="none" stroke="#fbf7ee" stroke-width="16"/><rect x="1186" y="130" width="8" height="350" fill="#fbf7ee"/><rect x="970" y="488" width="440" height="20" fill="#efe6d6"/>`;
  room += `<path d="M930 90 Q960 300 920 560 L1010 560 Q1030 300 1004 90Z" fill="url(#g-sheer)"/><path d="M1450 90 Q1420 300 1460 560 L1370 560 Q1350 300 1376 90Z" fill="url(#g-sheer)"/><rect x="900" y="80" width="580" height="10" rx="5" fill="url(#g-brass)"/>`;
  room += fairy(-200, 1900, 60, 22, 14, 3.2);
  // polaroid string
  room += `<path d="M80 230 Q330 270 600 230" stroke="#8a7a68" stroke-width="2" fill="none"/>`;
  ["#9cc7b2", "#c6dceb", "#eadcc3", "#d6cbbb", "#b9d3dd"].forEach((col, i) => {
    const x = 100 + i * 100, y = 238 + Math.sin(((i + 0.5) / 5) * Math.PI) * 30;
    room += `<g transform="rotate(${i % 2 ? 5 : -4} ${x + 35} ${y})"><rect x="${x}" y="${r1(y)}" width="70" height="84" fill="#fff"/><rect x="${x + 6}" y="${r1(y + 6)}" width="58" height="56" fill="${col}"/><rect x="${x + 30}" y="${r1(y - 6)}" width="10" height="14" fill="#c9a35b"/></g>`;
  });
  room += `<g transform="translate(740 160)"><path d="M0 0 V120 M20 0 V100" stroke="#f2b6c0" stroke-width="3"/><path d="M-14 120 Q-16 160 4 166 Q16 150 10 118 Z" fill="#f4c7c3"/><path d="M8 100 Q6 140 26 146 Q38 130 32 98 Z" fill="#f4c7c3"/></g>`;
  room += `<rect x="-500" y="560" width="2600" height="20" fill="#efe6d6"/><rect x="-500" y="580" width="2600" height="800" fill="url(#p-plank)"/>`;
  room += `<ellipse cx="800" cy="900" rx="760" ry="150" fill="#d9cdb7"/><ellipse cx="800" cy="900" rx="700" ry="125" fill="none" stroke="#7fa58f" stroke-width="10"/>`;
  // dresser + record player, dress form, golf bag
  room += `<g transform="translate(140 600)"><rect x="-150" y="-140" width="300" height="200" fill="#f1ebe0" stroke="#cfc3ad" stroke-width="3"/><rect x="-140" y="-80" width="280" height="4" fill="#cfc3ad"/><rect x="-140" y="-20" width="280" height="4" fill="#cfc3ad"/><rect x="-110" y="-200" width="200" height="60" rx="6" fill="#8a5a3c"/><g class="vinyl" style="transform-origin:-30px -172px"><circle cx="-30" cy="-172" r="40" fill="#141414"/><circle cx="-30" cy="-172" r="12" fill="#c8312c"/><circle cx="-30" cy="-172" r="28" fill="none" stroke="#2a2a2a" stroke-width="2"/></g><path d="M60 -190 L20 -168" stroke="#c9cfd8" stroke-width="4"/></g>`;
  room += `<g transform="translate(1560 820)"><rect x="-4" y="-120" width="8" height="120" fill="#3a2b22"/><path d="M-50 -380 Q-60 -300 -40 -240 Q-70 -170 -60 -120 H60 Q70 -170 40 -240 Q60 -300 50 -380 Q0 -400 -50 -380Z" fill="#eadcc3"/><path d="M-40 -240 Q0 -250 40 -240 L60 -120 H-60Z" fill="#7fa58f"/><path d="M-20 -380 Q0 -360 20 -380" stroke="#c9a35b" stroke-width="3" fill="none"/></g>`;
  room += `<g transform="translate(1740 820) rotate(-8)"><rect x="-40" y="-300" width="80" height="300" rx="20" fill="#1d2b4a"/><path d="M-20 -300 v-60 M0 -300 v-80 M20 -300 v-50" stroke="#c9cfd8" stroke-width="7" stroke-linecap="round"/><circle cx="-20" cy="-366" r="10" fill="#2a2a2a"/><circle cx="0" cy="-386" r="10" fill="#2a2a2a"/><circle cx="20" cy="-356" r="10" fill="#2a2a2a"/></g>`;
  // bed, Shiqi, laptop, cat
  let bed = `<rect x="320" y="380" width="960" height="260" rx="40" fill="#e9e1d2"/>`;
  for (let i = 0; i < 9; i++) bed += `<rect x="${360 + i * 102}" y="400" width="80" height="220" rx="38" fill="#efe8db" stroke="#d9cdb7" stroke-width="3"/>`;
  bed += `<rect x="280" y="600" width="1040" height="220" rx="24" fill="#f6f1e6"/><path d="M260 650 Q800 610 1340 650 L1360 860 Q800 900 240 860 Z" fill="url(#p-quilt)"/><path d="M260 650 Q800 610 1340 650" stroke="#6f957f" stroke-width="5" fill="none"/>`;
  bed += `<rect x="400" y="560" width="180" height="90" rx="40" fill="#f6efe2"/><rect x="1020" y="560" width="180" height="90" rx="40" fill="#f6efe2"/><rect x="480" y="580" width="110" height="70" rx="30" fill="#9cc7b2"/>`;
  bed += shiqiFront(800, 470, 1.12);
  bed += laptopBack(800, 742, 1.15);
  bed += cat(1120, 720, 0.9, "#c7b29a");
  const fg = `<g transform="translate(1720 1000)"><rect x="-200" y="-260" width="400" height="300" fill="#f1ebe0" stroke="#cfc3ad" stroke-width="3"/><rect x="-10" y="-420" width="20" height="160" fill="url(#g-brass)"/><path d="M-90 -420 L-60 -500 H60 L90 -420Z" fill="#f2e4c4"/><rect x="-120" y="-300" width="80" height="40" fill="#1d2b4a"/></g><g transform="translate(-180 1080)">${Array.from({ length: 9 }, (_, i) => `<ellipse cx="${r1(Math.cos(i * 1.3) * 90)}" cy="${-140 - i * 34}" rx="60" ry="26" fill="${i % 2 ? "#3f6b4b" : "#557d5c"}" transform="rotate(${i * 41 - 30} ${r1(Math.cos(i * 1.3) * 90)} ${-140 - i * 34})"/>`).join("")}<path d="M-70 0 L-56 -140 H56 L70 0Z" fill="#c26e4a"/></g>`;
  return {
    id: "bedroom",
    layers: [L(0.15, out), L(0.7, room), L(1.0, bed), L(1.35, fg)],
    cam: (t, p) => ({ x: p ? path([[0, 760], [1, 800]], t) : 800, y: lerp(470, 560, ease(t)), z: lerp(1.0, 1.25, ease(t)) }),
    drone: (t) => ({ x: path([[0, 1180], [1, 1080]], t), y: path([[0, 300], [1, 380]], t), s: 0.4, vis: 1 }),
  };
}

// ============================================================ 7 · the rooftop: a message across the sky
function sceneRoof() {
  const rnd = rng(81);
  const sky = `<rect x="-500" y="-300" width="2600" height="1200" fill="url(#g-sky2)"/>${stars(rnd, 220, -500, 2100, -300, 460)}${moon(300, 120, 54)}${cloud(1200, 120, 500, 0.2)}`;
  let far = cityBlock(rng(91), -400, 2000, 600, 80, 260, { skip: [[560, 620], [700, 760], [860, 900], [1000, 1060], [1180, 1240], [1400, 1460]] });
  far += LM.cpt(590, 600, 1.0) + LM.w111(650, 600, 1.0) + LM.p432(730, 600, 1.0) + LM.esb(880, 600, 1.05, "#33466b") + LM.chrysler(1030, 600, 1.0, "#33466b") + LM.vanderbilt(1210, 600, 1.0) + LM.wtc(1430, 600, 0.8);
  far += `<rect x="-500" y="460" width="2600" height="150" fill="url(#g-haze)" opacity=".7"/><rect x="-500" y="600" width="2600" height="200" fill="url(#g-water)"/>${reflections(rng(92), -400, 2000, 610, 780, 160)}`;
  far += queensboro(1300, 2300, 560, 0.8);
  let mid = `<rect x="-500" y="740" width="2600" height="600" fill="#cfdae6"/>`;
  for (let i = 0; i < 8; i++) mid += tudor({ x: -300 + i * 330, y: 800 + (i % 2) * 20, s: 0.3 + (i % 3) * 0.04, seed: 100 + i, lights: rnd() < 0.8, flip: i % 2 === 1 });
  for (let i = 0; i < 10; i++) mid += pine(-400 + i * 260 + rnd() * 80, 820, 90 + rnd() * 60, rnd, { lights: rnd() < 0.5 });
  const roof = `<path d="M-500 1300 L-500 760 L520 940 L560 1300 Z" fill="url(#p-slate)"/><path d="M-500 760 L520 940" stroke="#273041" stroke-width="12"/><path d="M-500 740 L520 922 L520 944 L-500 770 Z" fill="#eef3f7"/>${lightString([[-500, 770], [520, 948]], 18, 4.2, 5)}<g transform="translate(120 880)"><rect x="-50" y="-260" width="100" height="270" fill="url(#p-brick)"/><rect x="-60" y="-276" width="120" height="22" fill="#4b2a20"/><rect x="-60" y="-286" width="120" height="14" rx="6" fill="#eef3f7"/><rect x="-36" y="-306" width="22" height="30" fill="#7d4a35"/><rect x="8" y="-300" width="22" height="24" fill="#7d4a35"/><g class="smoke"><circle cx="-24" cy="-330" r="18"/><circle cx="-10" cy="-372" r="24"/><circle cx="8" cy="-420" r="30"/></g></g>`;
  return {
    id: "roof",
    layers: [L(0.04, sky), L(0.3, far), L(0.6, mid), L(1.0, roof)],
    cam: (t, p) => ({ x: p ? path([[0, 600], [1, 520]], t) : path([[0, 860], [1, 800]], t), y: lerp(470, 440, t), z: lerp(1.04, 1.0, t) }),
    drone: (t, p) => ({ x: p ? 520 : path([[0, 560], [1, 520]], t), y: p ? 560 : path([[0, 480], [1, 470]], t), s: p ? 0.8 : 1.0, vis: 1 }),
    snow: true,
  };
}

export const SCENES = [sceneHouse, sceneFlight, sceneStudy, sceneLibrary, sceneWorkshop, sceneHonors, sceneBedroom, sceneRoof];

// The narrator's lines, one per chapter
export const NARRATION = [
  "Once upon a time, in a Tudor house on a snowy street in Queens, there lived a girl named Shiqi, who loved to build things that move, think and light up. Her best friend was a little drone named Byte.",
  "Every evening, Byte slipped out the arched window and flew across the East River, over the bridge and the rooftops, all the way to Central Park, to bring home the news. Tonight, the news was all about Shiqi.",
  "Back home, up the creaky stairs, Shiqi sat at her desk writing a letter to someone she hadn't met yet. It was you.",
  "On the tallest shelf sat her favorite book. It wasn't a fairy tale. It held every job and adventure she'd ever had.",
  "In the corner, among wrenches and wires, was her workshop, where color sorters, cranes and clever little boxes came to life.",
  "On the wall hung proof of every challenge she had taken on, each one framed in gold.",
  "And when the work was done, Shiqi curled up with her laptop and her cat to watch her favorite memories: golf, dance, fashion, and photos of New York.",
  "One clear night, Byte flew up to the roof and beamed a message across the city sky. The next chapter, it said, is yours to write.",
];
