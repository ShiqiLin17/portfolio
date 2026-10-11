// Painting helpers for the storybook: everything is drawn as SVG strings.
// Scenes are 1600 x 900 "story units"; layers extend past the edges for parallax.

export const rng = (seed) => {
  let s = seed >>> 0 || 1;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
};
export const r1 = (v) => Math.round(v * 10) / 10;
export const pick = (rnd, arr) => arr[Math.floor(rnd() * arr.length)];

// ------------------------------------------------------------ palette
export const C = {
  ink: "#231f24",
  night0: "#0e1830",
  night1: "#1f3157",
  night2: "#3d5583",
  dusk: "#8c9cbc",
  peach: "#e7c3a4",
  snow: "#eef3f7",
  snowShade: "#c9d6e2",
  brick: "#94432f",
  stucco: "#efe3cb",
  timber: "#43301f",
  slate: "#3a4659",
  warm: "#ffd893",
  warm2: "#f4b967",
  sage: "#7fa58f",
  sageDk: "#4f7a64",
  navy: "#1d2b4a",
  brass: "#c9a35b",
  walnut: "#5b3b26",
  walnutDk: "#3f2819",
  cream: "#f6efe2",
  hair: "#1b181b",
  skin: "#f0cfb6",
  blush: "#ef9f98",
};
export const BULBS = ["#ffe6a8", "#ff8f7e", "#9fd6ff", "#c4f09a", "#ffc4e8"];

// ------------------------------------------------------------ shared <defs> (patterns + gradients)
function winPattern(id, seed, p, opts = {}) {
  const rnd = rng(seed);
  const { w = 48, h = 40, cols = 6, rows = 4, ww = 4, wh = 6, dark = "#22314f", lit = ["#ffd98f", "#ffe7b5", "#f6c178", "#cfe0ff"] } = opts;
  let s = `<pattern id="${id}" width="${w}" height="${h}" patternUnits="userSpaceOnUse">`;
  const sx = w / cols, sy = h / rows;
  for (let r = 0; r < rows; r++) {
    const rowP = p * (0.5 + rnd());
    for (let c = 0; c < cols; c++) {
      const on = rnd() < rowP;
      s += `<rect x="${r1(c * sx + (sx - ww) / 2)}" y="${r1(r * sy + (sy - wh) / 2)}" width="${ww}" height="${wh}" fill="${on ? pick(rnd, lit) : dark}"${on ? "" : ' opacity=".55"'}/>`;
    }
  }
  return s + "</pattern>";
}

export const DEFS = `<svg class="defs" width="0" height="0" aria-hidden="true" focusable="false"><defs>
<linearGradient id="g-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0c1530"/><stop offset=".45" stop-color="#1f3158"/><stop offset=".78" stop-color="#4a6190"/><stop offset=".93" stop-color="#9a9fb8"/><stop offset="1" stop-color="#d7b9a2"/></linearGradient>
<linearGradient id="g-sky2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#091127"/><stop offset=".55" stop-color="#1a2a4f"/><stop offset=".86" stop-color="#3c517f"/><stop offset="1" stop-color="#8b8fae"/></linearGradient>
<linearGradient id="g-haze" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8b97b6" stop-opacity="0"/><stop offset="1" stop-color="#8b97b6" stop-opacity=".55"/></linearGradient>
<linearGradient id="g-water" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2c3f66"/><stop offset="1" stop-color="#121c33"/></linearGradient>
<linearGradient id="g-snow" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4f8fb"/><stop offset="1" stop-color="#c3d0de"/></linearGradient>
<linearGradient id="g-win" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe9b8"/><stop offset="1" stop-color="#f1b25f"/></linearGradient>
<linearGradient id="g-stucco" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e6d8bd"/><stop offset="1" stop-color="#f3e8d2"/></linearGradient>
<linearGradient id="g-walnut" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6e4930"/><stop offset="1" stop-color="#4a2f1e"/></linearGradient>
<linearGradient id="g-floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6a4a33"/><stop offset="1" stop-color="#3e2a1d"/></linearGradient>
<linearGradient id="g-velvet" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2f5446"/><stop offset=".35" stop-color="#4b7a65"/><stop offset=".55" stop-color="#355f4f"/><stop offset=".8" stop-color="#527f6b"/><stop offset="1" stop-color="#2c4f41"/></linearGradient>
<linearGradient id="g-sheer" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#f6f1e6" stop-opacity=".75"/><stop offset=".5" stop-color="#ffffff" stop-opacity=".45"/><stop offset="1" stop-color="#f6f1e6" stop-opacity=".8"/></linearGradient>
<linearGradient id="g-brass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ead08f"/><stop offset=".5" stop-color="#b98d45"/><stop offset="1" stop-color="#e2c27a"/></linearGradient>
<linearGradient id="g-gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f1d998"/><stop offset=".45" stop-color="#b58a3e"/><stop offset=".7" stop-color="#e8c97f"/><stop offset="1" stop-color="#9c7432"/></linearGradient>
<linearGradient id="g-steel" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#d9dde2"/><stop offset=".5" stop-color="#aeb5bd"/><stop offset="1" stop-color="#e3e6ea"/></linearGradient>
<linearGradient id="g-shade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".35"/></linearGradient>
<radialGradient id="g-pool" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffe2a4" stop-opacity=".5"/><stop offset="1" stop-color="#ffe2a4" stop-opacity="0"/></radialGradient>
<radialGradient id="g-pool2" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff2cf" stop-opacity=".35"/><stop offset="1" stop-color="#fff2cf" stop-opacity="0"/></radialGradient>
<radialGradient id="g-moon" cx=".4" cy=".4" r=".6"><stop offset="0" stop-color="#fffaf0"/><stop offset="1" stop-color="#e6dcc6"/></radialGradient>
<filter id="f-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="7"/></filter>
<pattern id="p-brick" width="28" height="14" patternUnits="userSpaceOnUse"><rect width="28" height="14" fill="#6f3123"/><rect x="1" y="1" width="12" height="5.6" fill="#a04d38"/><rect x="15" y="1" width="12" height="5.6" fill="#93432f"/><rect x="-6" y="8" width="12" height="5" fill="#a85641"/><rect x="8" y="8" width="12" height="5" fill="#8d3f2c"/><rect x="22" y="8" width="12" height="5" fill="#9e4a35"/></pattern>
<pattern id="p-brick2" width="20" height="10" patternUnits="userSpaceOnUse"><rect width="20" height="10" fill="#5e2b20"/><rect x=".8" y=".8" width="8.4" height="3.6" fill="#87412f"/><rect x="10.8" y=".8" width="8.4" height="3.6" fill="#7b3a2a"/><rect x="-4" y="5.6" width="8.4" height="3.6" fill="#8e4734"/><rect x="5.8" y="5.6" width="8.4" height="3.6" fill="#753627"/><rect x="15.8" y="5.6" width="8.4" height="3.6" fill="#87412f"/></pattern>
<pattern id="p-slate" width="24" height="12" patternUnits="userSpaceOnUse"><rect width="24" height="12" fill="#37435a"/><path d="M0 12 Q6 5 12 12 Q18 5 24 12" fill="#414e66"/><path d="M-12 6 Q-6 -1 0 6 Q6 -1 12 6 Q18 -1 24 6 Q30 -1 36 6" fill="none" stroke="#2a3446" stroke-width="1"/></pattern>
<pattern id="p-lead" width="12" height="16" patternUnits="userSpaceOnUse"><path d="M0 0 L12 16 M12 0 L0 16" stroke="#6b5232" stroke-width="1.1" fill="none" opacity=".85"/></pattern>
<pattern id="p-damask" width="70" height="90" patternUnits="userSpaceOnUse"><rect width="70" height="90" fill="#7f9c87"/><g fill="#8eab95"><path d="M35 8 C45 22 52 30 35 46 C18 30 25 22 35 8Z"/><ellipse cx="35" cy="56" rx="5" ry="9"/><path d="M0 53 C10 67 17 75 0 91 C-17 75 -10 67 0 53Z"/><path d="M70 53 C80 67 87 75 70 91 C53 75 60 67 70 53Z"/></g><g fill="#728f7b"><circle cx="35" cy="28" r="3"/><circle cx="0" cy="73" r="3"/><circle cx="70" cy="73" r="3"/></g></pattern>
<pattern id="p-stripe" width="40" height="40" patternUnits="userSpaceOnUse"><rect width="40" height="40" fill="#c7d5de"/><rect width="14" height="40" fill="#d2dee6"/><rect x="18" width="2" height="40" fill="#bccbd5"/></pattern>
<pattern id="p-blue" width="40" height="40" patternUnits="userSpaceOnUse"><rect width="40" height="40" fill="#506883"/><rect width="16" height="40" fill="#577090"/></pattern>
<pattern id="p-peg" width="22" height="22" patternUnits="userSpaceOnUse"><rect width="22" height="22" fill="#c69a63"/><circle cx="11" cy="11" r="2.2" fill="#5d4128"/><circle cx="11.5" cy="11.6" r="2.2" fill="#e2bb84" opacity=".35"/></pattern>
<pattern id="p-grid" width="14" height="14" patternUnits="userSpaceOnUse"><rect width="14" height="14" fill="#f6f2e6"/><path d="M14 0 V14 H0" fill="none" stroke="#9fb7cf" stroke-width=".8"/></pattern>
<pattern id="p-plank" width="240" height="30" patternUnits="userSpaceOnUse"><rect width="240" height="30" fill="#6a4a33"/><rect y="28" width="240" height="2" fill="#3e2a1d"/><rect x="150" width="2" height="30" fill="#3e2a1d"/><path d="M10 10 Q60 6 120 12 T230 9" stroke="#7a5840" stroke-width="2" fill="none"/><path d="M20 20 Q90 24 140 18" stroke="#5a3d29" stroke-width="1.5" fill="none"/></pattern>
<pattern id="p-wains" width="160" height="200" patternUnits="userSpaceOnUse"><rect width="160" height="200" fill="#5d3d28"/><rect x="14" y="16" width="132" height="168" rx="4" fill="#6a4630"/><rect x="22" y="24" width="116" height="152" rx="3" fill="none" stroke="#3f2819" stroke-width="3"/></pattern>
<pattern id="p-wainsW" width="160" height="200" patternUnits="userSpaceOnUse"><rect width="160" height="200" fill="#e6dccb"/><rect x="14" y="16" width="132" height="168" rx="4" fill="#efe7d9"/><rect x="22" y="24" width="116" height="152" rx="3" fill="none" stroke="#cdbfa8" stroke-width="3"/></pattern>
<pattern id="p-quilt" width="60" height="60" patternUnits="userSpaceOnUse"><rect width="60" height="60" fill="#8db39d"/><path d="M0 30 Q15 22 30 30 T60 30" stroke="#a4c6b2" stroke-width="2" fill="none"/><circle cx="30" cy="10" r="3" fill="#f6efe2" opacity=".6"/></pattern>
<pattern id="p-g432" width="10" height="10" patternUnits="userSpaceOnUse"><rect width="10" height="10" fill="#dcd8cf"/><rect x="2" y="2" width="6" height="6" fill="#2a3757"/><rect x="2" y="2" width="6" height="6" fill="#ffd98f" opacity=".0"/></pattern>
${winPattern("p-wa", 11, 0.42)}
${winPattern("p-wb", 23, 0.22)}
${winPattern("p-wc", 37, 0.6, { lit: ["#ffe2a0", "#fff1cf", "#ffd27c"] })}
${winPattern("p-wg", 41, 0.35, { w: 36, h: 44, cols: 6, rows: 4, ww: 4.5, wh: 9, dark: "#1e2c49", lit: ["#dce9ff", "#fff2d6", "#bcd2f0"] })}
${winPattern("p-wq", 53, 0.5, { w: 40, h: 36, cols: 4, rows: 3, ww: 6, wh: 8, dark: "#2a2a3a", lit: ["#ffd98f", "#ffe7b5", "#f6c178"] })}
</defs></svg>`;

// ------------------------------------------------------------ small things
export const stars = (rnd, n, x0, x1, y0, y1) => {
  let s = "";
  for (let i = 0; i < n; i++) {
    const r = rnd() < 0.08 ? 2.2 : 0.8 + rnd() * 1.1;
    s += `<circle cx="${r1(x0 + rnd() * (x1 - x0))}" cy="${r1(y0 + rnd() * (y1 - y0))}" r="${r1(r)}" fill="#fff" opacity="${r1(0.4 + rnd() * 0.6)}"${rnd() < 0.25 ? ` class="twinkle" style="animation-delay:-${r1(rnd() * 4)}s"` : ""}/>`;
  }
  return s;
};
export const moon = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#g-moon)"/><circle cx="${x - r * 0.3}" cy="${y - r * 0.15}" r="${r * 0.16}" fill="#e2d6bd" opacity=".6"/><circle cx="${x + r * 0.25}" cy="${y + r * 0.3}" r="${r * 0.11}" fill="#e2d6bd" opacity=".5"/><circle cx="${x + r * 0.32}" cy="${y - r * 0.32}" r="${r * 0.07}" fill="#e2d6bd" opacity=".5"/>`;
export const cloud = (x, y, w, op = 0.35, col = "#3d5180") => `<g opacity="${op}" fill="${col}"><ellipse cx="${x}" cy="${y}" rx="${w * 0.5}" ry="${w * 0.09}"/><ellipse cx="${x - w * 0.18}" cy="${y - w * 0.06}" rx="${w * 0.2}" ry="${w * 0.09}"/><ellipse cx="${x + w * 0.12}" cy="${y - w * 0.08}" rx="${w * 0.24}" ry="${w * 0.1}"/></g>`;

// a string of holiday bulbs along a polyline
export function lightString(pts, step = 14, r = 3.2, seed = 1, sag = 0) {
  const rnd = rng(seed);
  let s = `<g class="bulbs">`;
  let k = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, ay] = pts[i], [bx, by] = pts[i + 1];
    const len = Math.hypot(bx - ax, by - ay), n = Math.max(1, Math.round(len / step));
    for (let j = 0; j < n; j++) {
      const t = j / n;
      const x = ax + (bx - ax) * t, y = ay + (by - ay) * t + Math.sin(t * Math.PI) * sag;
      s += `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r}" fill="${BULBS[(k++ + Math.floor(rnd() * 2)) % BULBS.length]}"/>`;
    }
  }
  return s + "</g>";
}
// warm fairy lights hanging in scallops
export function fairy(x0, x1, y, drop, n, r = 3) {
  let path = `M${x0} ${y}`;
  const w = (x1 - x0) / n;
  let dots = "";
  for (let i = 0; i < n; i++) {
    const a = x0 + i * w, b = a + w;
    path += ` Q${a + w / 2} ${y + drop * 2} ${b} ${y}`;
    for (let j = 1; j < 6; j++) {
      const t = j / 6, xx = a + w * t, yy = y + drop * 2 * 2 * t * (1 - t);
      dots += `<circle cx="${r1(xx)}" cy="${r1(yy)}" r="${r}" fill="#ffe7b0"/>`;
    }
  }
  return `<path d="${path}" stroke="#3b3b3b" stroke-width="1.2" fill="none"/><g class="fairy">${dots}</g>`;
}

// leaded, lit window with mullions; (x,y) top-left
export function litWindow(x, y, w, h, { arch = false, panes = 2, frame = "#e8dcc4", lit = true, curtain = true } = {}) {
  let s = "";
  const glass = lit ? "url(#g-win)" : "#2a3550";
  if (arch) {
    const r = w / 2;
    s += `<path d="M${x} ${y + h} V${y + r} A${r} ${r * 0.8} 0 0 1 ${x + w} ${y + r} V${y + h} Z" fill="${glass}"/>`;
    s += `<path d="M${x} ${y + h} V${y + r} A${r} ${r * 0.8} 0 0 1 ${x + w} ${y + r} V${y + h} Z" fill="url(#p-lead)"/>`;
    s += `<path d="M${x} ${y + h} V${y + r} A${r} ${r * 0.8} 0 0 1 ${x + w} ${y + r} V${y + h} Z" fill="none" stroke="${frame}" stroke-width="7"/>`;
  } else {
    s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${glass}"/><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#p-lead)"/>`;
    s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="${frame}" stroke-width="7"/>`;
  }
  if (lit && curtain) {
    s += `<path d="M${x + 4} ${y + h * 0.25} Q${x + w * 0.16} ${y + h * 0.6} ${x + 4} ${y + h - 4} Z" fill="#c7604e" opacity=".55"/>`;
    s += `<path d="M${x + w - 4} ${y + h * 0.25} Q${x + w * 0.84} ${y + h * 0.6} ${x + w - 4} ${y + h - 4} Z" fill="#c7604e" opacity=".55"/>`;
  }
  for (let i = 1; i < panes; i++) s += `<rect x="${r1(x + (w * i) / panes - 3)}" y="${y}" width="6" height="${h}" fill="${frame}"/>`;
  s += `<rect x="${x - 8}" y="${y + h}" width="${w + 16}" height="9" fill="#d9ccb2"/>`;
  return s;
}

// ------------------------------------------------------------ the Tudor house (Forest Hills Gardens style)
// origin = bottom center; 600 wide at scale 1
export function tudor({ x = 0, y = 0, s = 1, seed = 1, lights = true, main = false, flip = false } = {}) {
  const rnd = rng(seed);
  const tf = `translate(${x} ${y}) scale(${flip ? -s : s} ${s})`;
  let g = `<g transform="${tf}">`;
  // chimneys behind the roof
  g += `<rect x="-232" y="-540" width="46" height="260" fill="url(#p-brick2)"/><rect x="-238" y="-548" width="58" height="14" fill="#4b2a20"/><rect x="-226" y="-566" width="14" height="20" fill="#7d4a35"/><rect x="-206" y="-562" width="14" height="16" fill="#7d4a35"/>`;
  g += `<rect x="196" y="-500" width="40" height="220" fill="url(#p-brick2)"/><rect x="190" y="-508" width="52" height="12" fill="#4b2a20"/>`;
  if (main) g += `<g class="smoke"><circle cx="-212" cy="-590" r="16"/><circle cx="-200" cy="-630" r="22"/><circle cx="-184" cy="-680" r="28"/></g>`;
  // main roof
  g += `<path d="M-335 -282 L0 -470 L335 -282 Z" fill="url(#p-slate)"/><path d="M-335 -282 L0 -470 L335 -282" fill="none" stroke="#273041" stroke-width="7" stroke-linejoin="round"/>`;
  // snow on the roof
  g += `<path d="M-300 -302 L0 -462 L300 -302 Q260 -300 230 -322 Q190 -305 150 -340 Q90 -320 40 -380 Q0 -360 -60 -400 Q-110 -350 -170 -360 Q-220 -320 -270 -320 Z" fill="#eef3f7" opacity=".92"/>`;
  // ground floor: brick
  g += `<rect x="-300" y="-150" width="600" height="150" fill="url(#p-brick)"/><rect x="-300" y="-150" width="600" height="150" fill="url(#g-shade)" opacity=".35"/>`;
  // upper floor: stucco and timber
  g += `<rect x="-300" y="-290" width="600" height="140" fill="url(#g-stucco)"/>`;
  for (let i = 0; i <= 12; i++) g += `<rect x="${-300 + i * 50 - 4}" y="-290" width="8" height="140" fill="${C.timber}"/>`;
  for (let i = 0; i < 12; i++) if (i % 3 !== 1) g += `<path d="M${-296 + i * 50} ${i % 2 ? -154 : -286} L${-254 + i * 50} ${i % 2 ? -286 : -154}" stroke="${C.timber}" stroke-width="7"/>`;
  g += `<rect x="-306" y="-158" width="612" height="12" fill="${C.timber}"/><rect x="-306" y="-294" width="612" height="10" fill="${C.timber}"/>`;
  // front cross gable (center)
  g += `<path d="M-150 -284 L0 -440 L150 -284 Z" fill="url(#g-stucco)"/>`;
  g += `<path d="M0 -438 V-286 M-75 -362 V-286 M75 -362 V-286 M-120 -300 L0 -400 L120 -300" stroke="${C.timber}" stroke-width="8" fill="none"/>`;
  g += `<path d="M-170 -276 L0 -452 L170 -276" fill="none" stroke="#2c241d" stroke-width="12" stroke-linejoin="round"/>`;
  g += `<path d="M-160 -282 L0 -446 L160 -282 Q130 -290 110 -310 Q70 -300 40 -340 Q0 -330 -40 -350 Q-80 -310 -120 -300 Z" fill="#eef3f7" opacity=".85"/>`;
  g += `<circle cx="0" cy="-392" r="16" fill="#2c241d"/><circle cx="0" cy="-392" r="11" fill="${lights ? "url(#g-win)" : "#2a3550"}"/>`;
  // side gable (right wing)
  g += `<path d="M150 -150 L240 -330 L330 -150 Z" fill="url(#g-stucco)"/><path d="M240 -330 V-150 M195 -240 L285 -240" stroke="${C.timber}" stroke-width="7"/><path d="M140 -142 L240 -340 L340 -142" fill="none" stroke="#2c241d" stroke-width="10" stroke-linejoin="round"/>`;
  // windows
  g += litWindow(-262, -128, 110, 92, { panes: 3 });
  g += litWindow(150, -128, 110, 92, { panes: 3, curtain: rnd() < 0.7 });
  g += litWindow(-250, -268, 84, 92, { panes: 2 });
  g += litWindow(205, -268, 70, 92, { panes: 2 });
  g += `<g class="archwin">${litWindow(-60, -280, 120, 118, { arch: true, panes: 2 })}</g>`;
  g += litWindow(-115, -110, 30, 66, { panes: 1, curtain: false });
  g += litWindow(85, -110, 30, 66, { panes: 1, curtain: false });
  // window boxes with greenery
  [[-262, -160], [-250, -170], [205, -170]].forEach(() => {});
  g += `<rect x="-258" y="-168" width="100" height="14" fill="#3b2a1d"/><path d="M-258 -168 q12 -16 25 0 q12 -16 25 0 q12 -16 25 0 q12 -16 25 0" fill="#3f6b4b"/>`;
  // front door: oak under a Tudor arch with a wreath
  g += `<path d="M-52 0 V-80 Q-52 -122 0 -128 Q52 -122 52 -80 V0 Z" fill="#d8ccb4"/>`;
  g += `<path d="M-40 0 V-78 Q-40 -110 0 -114 Q40 -110 40 -78 V0 Z" fill="#6a4226"/>`;
  for (let i = -30; i <= 30; i += 15) g += `<rect x="${i - 1}" y="-108" width="2" height="108" fill="#4b2d18"/>`;
  g += `<rect x="-40" y="-70" width="80" height="5" fill="#2a2a2a"/><rect x="-40" y="-26" width="80" height="5" fill="#2a2a2a"/><circle cx="26" cy="-48" r="4" fill="${C.brass}"/>`;
  g += `<circle cx="0" cy="-86" r="20" fill="none" stroke="#2f5a3c" stroke-width="10"/><circle cx="0" cy="-86" r="20" fill="none" stroke="#3f7a52" stroke-width="5" stroke-dasharray="3 5"/><path d="M-8 -66 L0 -72 L8 -66 L4 -56 M-4 -56 L0 -70" stroke="#b5352b" stroke-width="5" fill="none"/>`;
  g += `<rect x="-70" y="-4" width="140" height="10" fill="#cfc3ab"/><rect x="-84" y="6" width="168" height="10" fill="#c6b99f"/>`;
  // lanterns by the door
  [-66, 66].forEach((lx) => { g += `<rect x="${lx - 7}" y="-104" width="14" height="22" rx="2" fill="#ffe1a0" stroke="#1d1d1d" stroke-width="3"/><path d="M${lx - 9} -104 L${lx} -114 L${lx + 9} -104" fill="#1d1d1d"/>`; });
  // the eaves and holiday lights
  if (lights) {
    g += lightString([[-335, -282], [0, -470], [335, -282]], 15, 3.4, seed);
    g += lightString([[-170, -276], [0, -452], [170, -276]], 14, 3.2, seed + 1);
    g += lightString([[140, -142], [240, -340], [340, -142]], 14, 3.2, seed + 2);
    g += lightString([[-306, -150], [306, -150]], 16, 3, seed + 3, 6);
    // icicle lights under the main eave
    let ic = "";
    for (let xx = -300; xx <= 300; xx += 12) { const L = 6 + ((xx * 7919) % 13 + 13) % 13; ic += `<path d="M${xx} -284 v${L}" stroke="#eaf6ff" stroke-width="2" stroke-dasharray="2 3"/>`; }
    g += `<g opacity=".9">${ic}</g>`;
  }
  // foundation shrubs with snow
  for (let i = 0; i < 9; i++) {
    const sx = -290 + i * 72 + (rnd() - 0.5) * 10;
    if (Math.abs(sx) < 90) continue;
    g += `<ellipse cx="${r1(sx)}" cy="-8" rx="${r1(30 + rnd() * 10)}" ry="${r1(20 + rnd() * 6)}" fill="#2e5038"/><ellipse cx="${r1(sx - 4)}" cy="-22" rx="${r1(20 + rnd() * 6)}" ry="7" fill="#eef3f7" opacity=".9"/>`;
  }
  return g + "</g>";
}

// ------------------------------------------------------------ trees, lamps, fences
export function pine(x, y, h, rnd, { lights = false, col = "#24432f", snow = true } = {}) {
  let s = `<g>`;
  s += `<rect x="${x - h * 0.03}" y="${y - h * 0.12}" width="${h * 0.06}" height="${h * 0.12}" fill="#3b2a1e"/>`;
  for (let i = 0; i < 4; i++) {
    const top = y - h + i * h * 0.2, bot = y - h * 0.08 - (3 - i) * h * 0.04, w = h * (0.16 + i * 0.09);
    s += `<path d="M${r1(x)} ${r1(top)} L${r1(x + w)} ${r1(bot)} Q${r1(x)} ${r1(bot - h * 0.05)} ${r1(x - w)} ${r1(bot)} Z" fill="${col}"/>`;
    if (snow) s += `<path d="M${r1(x)} ${r1(top)} L${r1(x + w * 0.45)} ${r1(top + (bot - top) * 0.45)} Q${r1(x)} ${r1(top + (bot - top) * 0.3)} ${r1(x - w * 0.45)} ${r1(top + (bot - top) * 0.45)} Z" fill="#eef3f7" opacity=".85"/>`;
  }
  if (lights) {
    let d = `<g class="bulbs">`;
    for (let i = 0; i < 28; i++) {
      const t = 0.12 + rnd() * 0.85, w = h * (0.05 + t * 0.4) * (rnd() * 2 - 1);
      d += `<circle cx="${r1(x + w)}" cy="${r1(y - h + t * h * 0.9)}" r="${r1(h * 0.012 + 1.2)}" fill="${BULBS[i % BULBS.length]}"/>`;
    }
    s += d + `</g><path d="M${x} ${y - h - h * 0.06} l${h * 0.025} ${h * 0.05} l-${h * 0.05} 0 Z" fill="#ffe08a"/>`;
  }
  return s + "</g>";
}
// a bare winter tree with snow on its branches
export function bareTree(x, y, h, rnd, col = "#2a2830", snow = true) {
  let path = "", sn = "";
  const branch = (bx, by, ang, len, w, depth) => {
    const ex = bx + Math.cos(ang) * len, ey = by + Math.sin(ang) * len;
    path += `<path d="M${r1(bx)} ${r1(by)} L${r1(ex)} ${r1(ey)}" stroke="${col}" stroke-width="${r1(w)}" stroke-linecap="round"/>`;
    if (snow && depth > 0 && depth < 4 && Math.cos(ang) !== 0) sn += `<path d="M${r1(bx)} ${r1(by - w * 0.4)} L${r1(ex)} ${r1(ey - w * 0.4)}" stroke="#eef3f7" stroke-width="${r1(Math.max(1, w * 0.4))}" stroke-linecap="round" opacity=".8"/>`;
    if (depth >= 5 || len < 6) return;
    const n = depth < 2 ? 2 : 2 + (rnd() < 0.5 ? 1 : 0);
    for (let i = 0; i < n; i++) branch(ex, ey, ang + (rnd() - 0.5) * 1.2 + (i - (n - 1) / 2) * 0.45, len * (0.62 + rnd() * 0.18), w * 0.62, depth + 1);
  };
  branch(x, y, -Math.PI / 2 + (rnd() - 0.5) * 0.15, h * 0.34, h * 0.05, 0);
  return `<g>${path}${sn}</g>`;
}
// a round leafy tree (gouache blobs)
export function blobTree(x, y, r, rnd, cols = ["#2f5a43", "#3d6d50", "#4b7d5c"]) {
  let s = `<rect x="${x - r * 0.07}" y="${y - r * 0.6}" width="${r * 0.14}" height="${r * 0.6}" fill="#3a2b22"/>`;
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2, d = r * 0.45;
    s += `<circle cx="${r1(x + Math.cos(a) * d)}" cy="${r1(y - r * 1.1 + Math.sin(a) * d * 0.7)}" r="${r1(r * (0.5 + rnd() * 0.15))}" fill="${cols[i % cols.length]}"/>`;
  }
  s += `<circle cx="${x - r * 0.15}" cy="${y - r * 1.35}" r="${r * 0.4}" fill="${cols[2]}"/>`;
  s += `<path d="M${x - r * 0.7} ${y - r * 1.45} Q${x} ${y - r * 1.95} ${x + r * 0.7} ${y - r * 1.45} Q${x} ${y - r * 1.65} ${x - r * 0.7} ${y - r * 1.45} Z" fill="#eef3f7" opacity=".85"/>`;
  return `<g>${s}</g>`;
}
export function lamp(x, y, h = 160, { crook = false } = {}) {
  let s = `<g>`;
  s += `<ellipse cx="${x}" cy="${y + 2}" rx="${h * 0.5}" ry="${h * 0.08}" fill="url(#g-pool)"/>`;
  s += `<rect x="${x - 5}" y="${y - h}" width="10" height="${h}" fill="#1e2b26"/><rect x="${x - 10}" y="${y - 22}" width="20" height="22" fill="#1e2b26"/>`;
  if (crook) {
    s += `<path d="M${x} ${y - h} q0 -30 30 -30 q24 0 24 24" stroke="#1e2b26" stroke-width="7" fill="none"/>`;
    s += `<path d="M${x + 46} ${y - h + 0} h16 l-4 26 h-8 Z" fill="#ffe2a6" stroke="#1e2b26" stroke-width="3"/>`;
  } else {
    s += `<path d="M${x - 14} ${y - h} h28 l6 -34 h-40 Z" fill="#ffe2a6" stroke="#1e2b26" stroke-width="3"/><path d="M${x - 20} ${y - h - 34} h40 l-20 -16 Z" fill="#1e2b26"/>`;
  }
  return s + "</g>";
}
export function ironFence(x0, x1, y, h = 70, gap = 13) {
  let s = `<g fill="#17191d" stroke="#17191d">`;
  s += `<rect x="${x0}" y="${y - h * 0.82}" width="${x1 - x0}" height="5" stroke="none"/><rect x="${x0}" y="${y - h * 0.15}" width="${x1 - x0}" height="5" stroke="none"/>`;
  for (let x = x0; x <= x1; x += gap) s += `<rect x="${x - 1.6}" y="${y - h}" width="3.2" height="${h}" stroke="none"/><path d="M${x - 4} ${y - h + 2} L${x} ${y - h - 9} L${x + 4} ${y - h + 2} Z" stroke="none"/>`;
  return s + "</g>";
}
export function nutcracker(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <rect x="-13" y="-20" width="10" height="20" fill="#111"/><rect x="3" y="-20" width="10" height="20" fill="#111"/>
    <rect x="-16" y="-62" width="32" height="44" rx="4" fill="#c8312c"/><rect x="-16" y="-34" width="32" height="6" fill="#f2e9d8"/>
    <path d="M-16 -62 h32 v6 h-32z" fill="${C.brass}"/><rect x="-22" y="-60" width="7" height="30" rx="3" fill="#c8312c"/><rect x="15" y="-60" width="7" height="30" rx="3" fill="#c8312c"/>
    <circle cx="0" cy="-74" r="12" fill="#f3d7c0"/><path d="M-12 -70 q12 14 24 0 v6 q-12 10 -24 0z" fill="#f4f4f4"/><circle cx="-4" cy="-76" r="1.6" fill="#111"/><circle cx="4" cy="-76" r="1.6" fill="#111"/>
    <rect x="-12" y="-110" width="24" height="28" fill="#111"/><rect x="-14" y="-86" width="28" height="5" fill="${C.brass}"/><path d="M0 -112 l4 -10 l-8 0z" fill="#c8312c"/>
  </g>`;
}
export function reindeer(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})" fill="none" stroke="#f3f7ff" stroke-width="2.4" stroke-linecap="round" class="wire">
    <path d="M-30 0 L-26 -32 M-18 0 L-20 -30 M18 0 L16 -30 M28 0 L26 -32"/><path d="M-30 -32 Q0 -42 30 -34 Q34 -48 40 -58 L48 -60 L44 -52"/><path d="M40 -58 L36 -74 L30 -84 M36 -74 L44 -82 M38 -66 L50 -72"/><path d="M-30 -32 Q-36 -36 -38 -30"/>
  </g>`;
}
export function mailbox(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <rect x="-4" y="-70" width="8" height="70" fill="#2c2420"/>
    <path d="M-30 -70 V-96 Q-30 -112 -12 -112 H12 Q30 -112 30 -96 V-70 Z" fill="#1f3c56"/>
    <rect x="-22" y="-92" width="44" height="12" rx="2" fill="${C.brass}"/><text x="0" y="-82.5" font-size="10" font-family="Georgia, serif" font-weight="700" text-anchor="middle" fill="#1d2430">LIN</text>
    <g class="flag"><rect x="28" y="-110" width="4" height="30" fill="#c0392b"/><rect x="28" y="-112" width="16" height="10" fill="#c0392b"/></g>
    <path d="M-30 -112 Q0 -122 30 -112" stroke="#eef3f7" stroke-width="6" fill="none" stroke-linecap="round"/>
  </g>`;
}

// ------------------------------------------------------------ the Manhattan skyline
function bldg(x, base, w, h, fill, pat, op = 0.85, crown = "") {
  return `<rect x="${r1(x)}" y="${r1(base - h)}" width="${r1(w)}" height="${r1(h)}" fill="${fill}"/><rect x="${r1(x)}" y="${r1(base - h)}" width="${r1(w)}" height="${r1(h)}" fill="url(#${pat})" opacity="${op}"/>${crown}`;
}
const tank = (x, y, s = 1, f = "#2a2530") => `<g fill="${f}"><rect x="${x - 6 * s}" y="${y - 6 * s}" width="${1.5 * s}" height="${6 * s}"/><rect x="${x + 4.5 * s}" y="${y - 6 * s}" width="${1.5 * s}" height="${6 * s}"/><rect x="${x - 6 * s}" y="${y - 16 * s}" width="${12 * s}" height="${10 * s}"/><path d="M${x - 7 * s} ${y - 16 * s} L${x} ${y - 21 * s} L${x + 7 * s} ${y - 16 * s}Z"/></g>`;

export const LM = {
  esb: (x, b, s, f) => {
    const S = (v) => r1(v * s);
    return `<g>${bldg(x - S(56), b, S(112), S(120), f, "p-wa")}${bldg(x - S(42), b - S(120), S(84), S(80), f, "p-wa")}${bldg(x - S(26), b - S(200), S(52), S(140), f, "p-wa")}
      <rect x="${x - S(19)}" y="${b - S(358)}" width="${S(38)}" height="${S(18)}" fill="${f}"/><rect x="${x - S(13)}" y="${b - S(376)}" width="${S(26)}" height="${S(18)}" fill="#e9d38f"/><rect x="${x - S(8)}" y="${b - S(398)}" width="${S(16)}" height="${S(22)}" fill="#f4e2a8"/>
      <path d="M${x - S(5)} ${b - S(398)} Q${x} ${b - S(414)} ${x + S(5)} ${b - S(398)}Z" fill="#c9cfd8"/><rect x="${x - S(1.5)}" y="${b - S(470)}" width="${S(3)}" height="${S(60)}" fill="#c9cfd8"/>
      <rect x="${x - S(19)}" y="${b - S(340)}" width="${S(38)}" height="${S(4)}" fill="#e9d38f"/></g>`;
  },
  chrysler: (x, b, s, f) => {
    const S = (v) => r1(v * s);
    let g = bldg(x - S(26), b, S(52), S(300), f, "p-wa");
    for (let i = 0; i < 6; i++) {
      const r = S(24 - i * 3.6), y = b - S(300) - S(i * 16);
      g += `<path d="M${x - r} ${y} A${r} ${r * 0.9} 0 0 1 ${x + r} ${y} Z" fill="url(#g-steel)"/>`;
      for (let k = -2; k <= 2; k++) g += `<path d="M${r1(x + k * r * 0.36)} ${r1(y - r * 0.15)} l${S(2.5)} ${S(-7)} l${S(2.5)} ${S(7)}Z" fill="#ffe2a0"/>`;
    }
    return g + `<path d="M${x - S(4)} ${b - S(396)} L${x} ${b - S(470)} L${x + S(4)} ${b - S(396)}Z" fill="#dfe3e8"/>`;
  },
  w111: (x, b, s, f) => {
    const S = (v) => r1(v * s);
    return `<g><path d="M${x - S(12)} ${b} V${b - S(440)} H${x - S(5)} V${b - S(424)} H${x + S(1)} V${b - S(400)} H${x + S(6)} V${b - S(368)} H${x + S(12)} V${b}Z" fill="#7d6c5b"/>
      <path d="M${x - S(12)} ${b} V${b - S(440)} H${x - S(5)} V${b - S(424)} H${x + S(1)} V${b - S(400)} H${x + S(6)} V${b - S(368)} H${x + S(12)} V${b}Z" fill="url(#p-wg)" opacity=".7"/></g>`;
  },
  cpt: (x, b, s, f) => {
    const S = (v) => r1(v * s);
    return `<g>${bldg(x - S(22), b, S(44), S(480), "#3a4d70", "p-wg", 0.85)}<rect x="${x - S(22)}" y="${b - S(170)}" width="${S(56)}" height="${S(40)}" fill="#3a4d70"/><rect x="${x - S(22)}" y="${b - S(500)}" width="${S(44)}" height="${S(20)}" fill="#2c3b58"/>
      <path d="M${x - S(22)} ${b - S(480)} h${S(44)}" stroke="#dce6f5" stroke-width="${S(2)}"/></g>`;
  },
  p432: (x, b, s) => {
    const S = (v) => r1(v * s);
    return `<g><rect x="${x - S(15)}" y="${b - S(440)}" width="${S(30)}" height="${S(440)}" fill="url(#p-g432)"/><rect x="${x - S(15)}" y="${b - S(440)}" width="${S(30)}" height="${S(440)}" fill="url(#p-wa)" opacity=".55"/><rect x="${x - S(15)}" y="${b - S(446)}" width="${S(30)}" height="${S(8)}" fill="#cfcabd"/></g>`;
  },
  one57: (x, b, s, f) => {
    const S = (v) => r1(v * s);
    return `<g><path d="M${x - S(26)} ${b} V${b - S(270)} Q${x - S(20)} ${b - S(310)} ${x} ${b - S(318)} Q${x + S(10)} ${b - S(300)} ${x + S(26)} ${b - S(292)} V${b}Z" fill="#344a73"/><path d="M${x - S(26)} ${b} V${b - S(270)} Q${x - S(20)} ${b - S(310)} ${x} ${b - S(318)} Q${x + S(10)} ${b - S(300)} ${x + S(26)} ${b - S(292)} V${b}Z" fill="url(#p-wg)" opacity=".8"/></g>`;
  },
  w53: (x, b, s) => {
    const S = (v) => r1(v * s);
    return `<g><path d="M${x - S(20)} ${b} V${b - S(240)} L${x - S(4)} ${b - S(330)} L${x + S(20)} ${b - S(250)} V${b}Z" fill="#33466b"/><path d="M${x - S(20)} ${b - S(40)} L${x + S(20)} ${b - S(120)} M${x - S(20)} ${b - S(140)} L${x + S(20)} ${b - S(220)} M${x - S(20)} ${b - S(120)} L${x + S(20)} ${b - S(40)} M${x - S(20)} ${b - S(220)} L${x + S(20)} ${b - S(140)}" stroke="#93a8c8" stroke-width="${S(1.5)}" opacity=".7"/></g>`;
  },
  vanderbilt: (x, b, s) => {
    const S = (v) => r1(v * s);
    return `<g><path d="M${x - S(30)} ${b} V${b - S(260)} L${x - S(18)} ${b - S(360)} L${x + S(14)} ${b - S(380)} L${x + S(30)} ${b - S(300)} V${b}Z" fill="#3b4f76"/><path d="M${x - S(30)} ${b} V${b - S(260)} L${x - S(18)} ${b - S(360)} L${x + S(14)} ${b - S(380)} L${x + S(30)} ${b - S(300)} V${b}Z" fill="url(#p-wg)" opacity=".7"/><rect x="${x - S(1.5)}" y="${b - S(440)}" width="${S(3)}" height="${S(70)}" fill="#c9cfd8"/></g>`;
  },
  citi: (x, b, s) => {
    const S = (v) => r1(v * s);
    return `<g><path d="M${x - S(24)} ${b} V${b - S(250)} L${x + S(24)} ${b - S(290)} V${b}Z" fill="#c9cbd0"/><path d="M${x - S(24)} ${b} V${b - S(250)} L${x + S(24)} ${b - S(290)} V${b}Z" fill="url(#p-wb)" opacity=".8"/></g>`;
  },
  wtc: (x, b, s) => {
    const S = (v) => r1(v * s);
    return `<g><path d="M${x - S(30)} ${b} V${b - S(80)} L${x - S(15)} ${b - S(400)} H${x + S(15)} L${x + S(30)} ${b - S(80)} V${b}Z" fill="#7b92b3"/><path d="M${x} ${b - S(80)} L${x} ${b - S(400)} M${x - S(30)} ${b - S(80)} L${x + S(15)} ${b - S(400)} M${x + S(30)} ${b - S(80)} L${x - S(15)} ${b - S(400)}" stroke="#a8bcd6" stroke-width="${S(1.4)}" opacity=".8"/><rect x="${x - S(1.5)}" y="${b - S(520)}" width="${S(3)}" height="${S(120)}" fill="#dfe6ee"/></g>`;
  },
};

// generic Manhattan buildings between x0 and x1, skipping the landmark slots
export function cityBlock(rnd, x0, x1, base, minH, maxH, { fill = ["#2f3f63", "#344668", "#2b3a5c", "#3a4b70"], pats = ["p-wa", "p-wb", "p-wc", "p-wg"], skip = [], towers = 0.25, op = 0.85 } = {}) {
  let s = "";
  let x = x0;
  while (x < x1) {
    const w = 26 + rnd() * 60;
    if (skip.some(([a, b]) => x + w > a && x < b)) { x += w * 0.6; continue; }
    let h = minH + Math.pow(rnd(), 1.6) * (maxH - minH);
    const f = pick(rnd, fill), p = pick(rnd, pats);
    s += bldg(x, base, w, h, f, p, op);
    if (rnd() < towers && h < maxH * 0.6) s += tank(x + w * (0.3 + rnd() * 0.4), base - h, 0.9 + rnd() * 0.5);
    if (rnd() < 0.22) { const w2 = w * (0.5 + rnd() * 0.3); s += bldg(x + (w - w2) / 2, base - h, w2, 20 + rnd() * 50, f, p, op); }
    if (rnd() < 0.12) s += `<rect x="${r1(x + w / 2 - 1)}" y="${r1(base - h - 30)}" width="2" height="30" fill="#8a92a3"/>`;
    x += w + rnd() * 3;
  }
  return s;
}

// The Queensboro Bridge: cantilever truss over the East River
export function queensboro(x0, x1, deck, s = 1, col = "#6c7a90") {
  const span = x1 - x0, towers = [0.18, 0.42, 0.66, 0.88].map((t) => x0 + span * t);
  const chord = (x) => {
    let y = deck - 26 * s;
    towers.forEach((tx) => { y = Math.min(y, deck - 150 * s + Math.abs(x - tx) * 0.9); });
    return Math.min(deck - 26 * s, y);
  };
  let p = `M${x0} ${r1(chord(x0))}`;
  for (let x = x0; x <= x1; x += 8) p += ` L${x} ${r1(chord(x))}`;
  let lat = "";
  const st = 18 * s;
  for (let x = x0; x < x1; x += st) lat += `M${r1(x)} ${deck} L${r1(x + st / 2)} ${r1(chord(x + st / 2))} L${r1(x + st)} ${deck}`;
  let g = `<g><path d="${lat}" stroke="${col}" stroke-width="${r1(2.2 * s)}" fill="none"/><path d="${p}" stroke="${col}" stroke-width="${r1(5 * s)}" fill="none"/>`;
  g += `<rect x="${x0}" y="${deck}" width="${span}" height="${r1(9 * s)}" fill="#3e4757"/>`;
  towers.forEach((tx) => {
    g += `<rect x="${r1(tx - 7 * s)}" y="${r1(deck - 170 * s)}" width="${r1(14 * s)}" height="${r1(170 * s + 150)}" fill="#5a6577"/><path d="M${r1(tx - 9 * s)} ${r1(deck - 170 * s)} L${tx} ${r1(deck - 188 * s)} L${r1(tx + 9 * s)} ${r1(deck - 170 * s)}Z" fill="#5a6577"/>`;
  });
  let lights = "";
  for (let x = x0; x <= x1; x += 22 * s) lights += `<circle cx="${r1(x)}" cy="${r1(chord(x) - 2)}" r="${r1(2.2 * s)}" fill="#ffe6b0"/>`;
  for (let x = x0 + 6; x <= x1; x += 15 * s) lights += `<circle cx="${r1(x)}" cy="${r1(deck + 3)}" r="${r1(1.6 * s)}" fill="#ffd38a"/>`;
  return g + `<g class="bulbs">${lights}</g></g>`;
}

// reflections of city lights on dark water
export function reflections(rnd, x0, x1, y0, y1, n) {
  let s = `<g class="shimmer">`;
  for (let i = 0; i < n; i++) {
    const x = x0 + rnd() * (x1 - x0), y = y0 + rnd() * (y1 - y0), w = 6 + rnd() * 30;
    s += `<rect x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(1.5 + rnd() * 2)}" rx="1" fill="${pick(rnd, ["#ffd98f", "#ffe7b5", "#cfe0ff", "#f6c178"])}" opacity="${r1(0.25 + rnd() * 0.5)}"/>`;
  }
  return s + "</g>";
}

// ------------------------------------------------------------ people and pets
// Shiqi from behind, sitting at her desk, writing
export function shiqiBack(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M-110 120 Q-108 20 -50 0 L50 0 Q108 20 110 120 Z" fill="${C.sage}"/>
    <path d="M-50 0 Q-30 30 -40 120 M50 0 Q30 30 40 120" stroke="${C.sageDk}" stroke-width="3" fill="none" opacity=".5"/>
    <path d="M96 40 Q150 80 196 128 Q206 140 196 146 Q186 150 176 140 Q140 106 90 80 Z" fill="${C.sage}"/>
    <ellipse cx="196" cy="140" rx="15" ry="10" fill="${C.skin}"/><path d="M190 132 L222 112" stroke="#1d1d1d" stroke-width="4" stroke-linecap="round"/>
    <ellipse cx="0" cy="-70" rx="52" ry="58" fill="${C.hair}"/>
    <path d="M-48 -84 Q-68 0 -60 70 Q-56 112 -32 122 Q-12 112 0 124 Q14 112 32 122 Q58 112 60 70 Q68 0 48 -84 Z" fill="${C.hair}"/>
    <path d="M-30 -70 Q-42 20 -30 110 M-12 -66 Q-18 30 -10 116 M10 -66 Q16 30 12 116 M30 -70 Q42 20 32 110" stroke="#3a3540" stroke-width="2.4" fill="none" opacity=".8"/>
    <path d="M-22 -40 Q-26 0 -20 30" stroke="#5a5560" stroke-width="5" fill="none" opacity=".35" stroke-linecap="round"/>
    <ellipse cx="0" cy="-108" rx="34" ry="20" fill="${C.hair}"/><path d="M-26 -112 Q0 -126 26 -112" stroke="#2e2a2e" stroke-width="2.4" fill="none"/>
    <g transform="translate(0 -96)"><rect x="-30" y="-10" width="60" height="20" rx="10" fill="#b0743c"/><circle cx="-14" cy="-2" r="3" fill="#6b3e1d"/><circle cx="6" cy="3" r="4" fill="#6b3e1d"/><circle cx="20" cy="-3" r="2.5" fill="#6b3e1d"/><path d="M-24 10 v10 M-12 10 v12 M0 10 v12 M12 10 v12 M24 10 v10" stroke="#9a6231" stroke-width="5" stroke-linecap="round"/></g>
    <circle cx="-50" cy="-52" r="4" fill="${C.brass}"/>
  </g>`;
}
// Shiqi on her bed with the laptop on her lap, facing us
export function shiqiFront(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M-62 -60 Q-82 40 -66 150 L66 150 Q82 40 62 -60 Z" fill="${C.hair}"/>
    <path d="M-88 230 Q-90 120 -42 100 L42 100 Q90 120 88 230 Z" fill="${C.sage}"/>
    <path d="M-20 100 L0 150 L20 100 Z" fill="${C.cream}"/>
    <rect x="-13" y="60" width="26" height="44" fill="${C.skin}"/>
    <ellipse cx="0" cy="10" rx="46" ry="54" fill="${C.skin}"/>
    <path d="M-48 20 Q-52 -50 0 -54 Q52 -50 48 20 Q44 -20 14 -26 Q0 -10 -16 -26 Q-40 -20 -48 20 Z" fill="${C.hair}"/>
    <path d="M-48 10 Q-58 80 -50 140 L-36 140 Q-44 70 -40 10 Z M48 10 Q58 80 50 140 L36 140 Q44 70 40 10 Z" fill="${C.hair}"/>
    <path d="M-26 18 Q-17 24 -8 18 M8 18 Q17 24 26 18" stroke="#2a2020" stroke-width="3" fill="none" stroke-linecap="round"/>
    <ellipse cx="-28" cy="36" rx="9" ry="5" fill="${C.blush}" opacity=".45"/><ellipse cx="28" cy="36" rx="9" ry="5" fill="${C.blush}" opacity=".45"/>
    <path d="M-7 44 Q0 50 7 44" stroke="#9b4b44" stroke-width="2.6" fill="none" stroke-linecap="round"/>
    <circle cx="-46" cy="30" r="4" fill="${C.brass}"/><circle cx="46" cy="30" r="4" fill="${C.brass}"/>
    <path d="M-120 300 Q-130 230 -60 222 L60 222 Q130 230 120 300 Z" fill="#e9e1d2"/>
    <path d="M-88 200 Q-110 240 -70 262 L-40 250 Z M88 200 Q110 240 70 262 L40 250 Z" fill="${C.sage}"/>
  </g>`;
}
export function laptopBack(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})" class="hot" data-hot="laptop" tabindex="-1">
    <rect x="-80" y="-100" width="160" height="104" rx="8" fill="url(#g-steel)" stroke="#8d949c" stroke-width="2"/>
    <circle cx="-38" cy="-62" r="15" fill="#c8312c"/><path d="M-38 -77 q4 -6 8 -4" stroke="#3f7a52" stroke-width="3" fill="none"/><text x="-38" y="-57" font-size="11" font-weight="700" font-family="DM Sans, sans-serif" text-anchor="middle" fill="#fff">NY</text>
    <rect x="-6" y="-80" width="38" height="24" rx="4" fill="#cc0000"/><text x="13" y="-63" font-size="13" font-weight="900" font-family="Georgia, serif" text-anchor="middle" fill="#fff">BU</text>
    <g transform="translate(46 -34)"><rect x="-12" y="-12" width="24" height="20" rx="5" fill="#9cc7b2"/><circle cx="-5" cy="-3" r="3" fill="#1d2b4a"/><circle cx="5" cy="-3" r="3" fill="#1d2b4a"/><rect x="-1" y="-20" width="2" height="8" fill="#1d2b4a"/></g>
    <text x="-50" y="-22" font-size="12" font-family="Caveat, cursive" fill="#3b4250">3371 ✦</text>
    <rect x="-90" y="2" width="180" height="10" rx="4" fill="#b8bec6"/>
  </g>`;
}
export function cat(x, y, s = 1, col = "#c7b29a") {
  return `<g transform="translate(${x} ${y}) scale(${s})" class="cat">
    <g class="breath"><path d="M-70 0 Q-74 -52 -10 -56 Q50 -58 66 -16 Q70 0 60 0 Z" fill="${col}"/>
    <path d="M-40 -48 q8 10 0 22 M-16 -54 q8 12 0 26 M10 -54 q8 12 0 26" stroke="#a48e76" stroke-width="5" fill="none" stroke-linecap="round"/></g>
    <path d="M60 -4 Q96 -10 82 -30 Q74 -40 64 -32" stroke="${col}" stroke-width="13" fill="none" stroke-linecap="round"/>
    <circle cx="-62" cy="-26" r="25" fill="${col}"/><path d="M-82 -40 L-80 -64 L-64 -48 Z M-56 -48 L-44 -64 L-40 -40 Z" fill="${col}"/><path d="M-79 -44 L-78 -56 L-70 -48Z" fill="#e9b5a8"/>
    <path d="M-74 -24 q5 4 10 0 M-58 -24 q5 4 10 0" stroke="#3a2f2a" stroke-width="2.2" fill="none" stroke-linecap="round"/><circle cx="-61" cy="-16" r="2.4" fill="#d98c86"/>
  </g>`;
}

// ------------------------------------------------------------ the drone ("Byte")
export const DRONE = `<svg class="byte" viewBox="-100 -70 200 130" aria-hidden="true">
  <ellipse cx="0" cy="52" rx="56" ry="6" fill="#000" opacity=".12"/>
  <g class="byte-body">
    <path d="M-70 -14 L-24 -2 M70 -14 L24 -2" stroke="#3a4250" stroke-width="7" stroke-linecap="round"/>
    <g class="rotor"><rect x="-74" y="-26" width="8" height="12" rx="2" fill="#3a4250"/><ellipse class="blade" cx="-70" cy="-27" rx="34" ry="3.6" fill="#3a4250" opacity=".45"/></g>
    <g class="rotor"><rect x="66" y="-26" width="8" height="12" rx="2" fill="#3a4250"/><ellipse class="blade b2" cx="70" cy="-27" rx="34" ry="3.6" fill="#3a4250" opacity=".45"/></g>
    <rect x="-40" y="-20" width="80" height="44" rx="18" fill="#f5f0e6" stroke="#2a3140" stroke-width="3"/>
    <rect x="-40" y="-2" width="80" height="8" fill="${C.sage}"/>
    <circle cx="-14" cy="6" r="9.5" fill="#1d2b4a" stroke="#2a3140" stroke-width="2"/><circle cx="14" cy="6" r="9.5" fill="#1d2b4a" stroke="#2a3140" stroke-width="2"/>
    <circle cx="-11" cy="3" r="3" fill="#fff"/><circle cx="17" cy="3" r="3" fill="#fff"/>
    <path d="M-6 17 Q0 21 6 17" stroke="#2a3140" stroke-width="2.4" fill="none" stroke-linecap="round"/>
    <rect x="-2" y="-34" width="4" height="14" fill="#2a3140"/><circle class="led" cx="0" cy="-36" r="4.5" fill="#7dffb4"/>
    <path d="M-26 24 L-32 40 H-14 M26 24 L32 40 H14" stroke="#3a4250" stroke-width="4" fill="none" stroke-linecap="round"/>
  </g>
</svg>`;

// wrap text for SVG <text> lines
export function wrapLines(str, max) {
  const words = String(str).split(" ");
  const out = [];
  let line = "";
  words.forEach((w) => {
    if ((line + " " + w).trim().length > max && line) { out.push(line); line = w; } else line = (line + " " + w).trim();
  });
  if (line) out.push(line);
  return out;
}
export const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
