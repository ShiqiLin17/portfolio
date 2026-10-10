// Procedural textures painted on canvases: brick, half-timbered stucco, slate,
// marble, herringbone oak, walnut paneling, wallpaper, rugs, leaded glass and
// paintings of New York.
import { THREE, canvasTex, rnd } from "./util.js";

const cache = {};
const once = (k, f) => cache[k] || (cache[k] = f());

function noise(g, w, h, alpha = 0.05, n = 4000, light = false) {
  for (let i = 0; i < n; i++) {
    g.fillStyle = light ? `rgba(255,255,255,${alpha * rnd()})` : `rgba(0,0,0,${alpha * rnd()})`;
    g.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 2, 1 + rnd() * 2);
  }
}

// Flemish-bond red brick (1 tile = 1.2 m)
export const brick = () => once("brick", () => canvasTex(512, 512, (g, w, h) => {
  g.fillStyle = "#b7aa98"; g.fillRect(0, 0, w, h);
  const bh = 512 / 18, bw = bh * 3.6;
  for (let r = 0; r < 18; r++) {
    let x = r % 2 ? -bw * 0.5 : -bw * 0.15;
    let k = 0;
    while (x < w) {
      const header = (k + r) % 2 === 1;
      const ww = header ? bw * 0.47 : bw;
      const hue = 8 + rnd() * 10, sat = 38 + rnd() * 18, lit = 30 + rnd() * 14 - (header ? 8 : 0);
      g.fillStyle = `hsl(${hue},${sat}%,${lit}%)`;
      g.fillRect(x + 2, r * bh + 2, ww - 4, bh - 4);
      g.fillStyle = "rgba(255,255,255,.05)"; g.fillRect(x + 2, r * bh + 2, ww - 4, 2);
      x += ww; k++;
    }
  }
  noise(g, w, h, 0.12, 9000);
}, [1, 1]));

// Cream stucco with dark oak half-timbering (1 tile = 4 m wide x 5 m tall)
export const timber = () => once("timber", () => canvasTex(512, 640, (g, w, h) => {
  g.fillStyle = "#ece2cc"; g.fillRect(0, 0, w, h);
  noise(g, w, h, 0.06, 8000);
  noise(g, w, h, 0.05, 3000, true);
  const oak = "#3b2a1d";
  g.fillStyle = oak;
  const post = 26;
  [0, w / 2 - post / 2, w - post].forEach((x) => g.fillRect(x, 0, post, h));
  [0, h * 0.42, h - post].forEach((y) => g.fillRect(0, y, w, post));
  g.strokeStyle = oak; g.lineWidth = 22; g.lineCap = "square";
  // curved braces (Tudor)
  g.beginPath(); g.moveTo(post, h * 0.42); g.quadraticCurveTo(w * 0.12, h * 0.12, w / 2 - post, 22); g.stroke();
  g.beginPath(); g.moveTo(w - post, h * 0.42); g.quadraticCurveTo(w * 0.88, h * 0.12, w / 2 + post, 22); g.stroke();
  g.beginPath(); g.moveTo(post, h * 0.95); g.lineTo(w / 2 - post, h * 0.47); g.stroke();
  g.beginPath(); g.moveTo(w - post, h * 0.95); g.lineTo(w / 2 + post, h * 0.47); g.stroke();
  g.fillStyle = "rgba(0,0,0,.25)";
  for (let i = 0; i < 400; i++) g.fillRect(rnd() * w, rnd() * h, 1, 4 + rnd() * 10);
}, [1, 1]));

// Blue-gray slate shingles (1 tile = 2 m)
export const slate = () => once("slate", () => canvasTex(512, 512, (g, w, h) => {
  g.fillStyle = "#2a3038"; g.fillRect(0, 0, w, h);
  const rows = 16, rh = h / rows;
  for (let r = 0; r < rows; r++) {
    let x = r % 2 ? -18 : 0;
    while (x < w) {
      const sw = 28 + rnd() * 16;
      const l = 22 + rnd() * 14;
      g.fillStyle = `hsl(${205 + rnd() * 15},${10 + rnd() * 10}%,${l}%)`;
      g.fillRect(x + 1, r * rh + 1, sw - 2, rh - 1);
      g.fillStyle = "rgba(0,0,0,.35)"; g.fillRect(x + 1, r * rh + rh - 3, sw - 2, 3);
      x += sw;
    }
  }
  noise(g, w, h, 0.1, 5000, true);
}, [1, 1]));

// Limestone ashlar blocks (1 tile = 2 m)
export const limestone = () => once("lime", () => canvasTex(512, 512, (g, w, h) => {
  g.fillStyle = "#d9cfbc"; g.fillRect(0, 0, w, h);
  const rows = 6;
  for (let r = 0; r < rows; r++) {
    let x = r % 2 ? -60 : 0;
    while (x < w) {
      const bw = 110 + rnd() * 70;
      const l = 76 + rnd() * 8;
      g.fillStyle = `hsl(40,${18 + rnd() * 8}%,${l}%)`;
      g.fillRect(x + 2, r * (h / rows) + 2, bw - 4, h / rows - 4);
      x += bw;
    }
  }
  noise(g, w, h, 0.07, 9000);
}, [1, 1]));

// Black and white marble checkerboard with a compass rose (whole foyer = 1 tile)
export const marbleFloor = () => once("marble", () => canvasTex(1024, 1024, (g, w, h) => {
  const n = 12, s = w / n;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const dark = (i + j) % 2;
    g.fillStyle = dark ? "#1e2523" : "#ece7dc";
    g.fillRect(i * s, j * s, s, s);
    g.strokeStyle = dark ? "rgba(255,255,255,.08)" : "rgba(80,70,60,.12)";
    for (let k = 0; k < 4; k++) {
      g.beginPath();
      const x0 = i * s + rnd() * s, y0 = j * s + rnd() * s;
      g.moveTo(x0, y0);
      g.bezierCurveTo(x0 + rnd() * 60 - 30, y0 + rnd() * 60, x0 + rnd() * 80 - 40, y0 + rnd() * 80, x0 + rnd() * 90 - 45, y0 + rnd() * 90);
      g.stroke();
    }
  }
  // compass rose medallion
  const cx = w / 2, cy = h * 0.62, R = s * 2.1;
  g.fillStyle = "#ece7dc"; g.beginPath(); g.arc(cx, cy, R, 0, 7); g.fill();
  g.strokeStyle = "#a8853f"; g.lineWidth = 8; g.beginPath(); g.arc(cx, cy, R - 6, 0, 7); g.stroke();
  g.lineWidth = 3; g.beginPath(); g.arc(cx, cy, R - 20, 0, 7); g.stroke();
  for (let k = 0; k < 16; k++) {
    const a = (k / 16) * Math.PI * 2, long = k % 2 === 0, r = long ? R - 24 : R * 0.55;
    g.fillStyle = k % 4 === 0 ? "#22302b" : long ? "#a8853f" : "#6f8f7f";
    g.beginPath();
    g.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    g.lineTo(cx + Math.cos(a + 0.2) * R * 0.14, cy + Math.sin(a + 0.2) * R * 0.14);
    g.lineTo(cx + Math.cos(a - 0.2) * R * 0.14, cy + Math.sin(a - 0.2) * R * 0.14);
    g.fill();
  }
  g.fillStyle = "#a8853f"; g.beginPath(); g.arc(cx, cy, 14, 0, 7); g.fill();
}));

// Herringbone oak floor (1 tile = 2 m)
export const herringbone = () => once("herring", () => canvasTex(512, 512, (g, w, h) => {
  g.fillStyle = "#6b4a2e"; g.fillRect(0, 0, w, h);
  const pw = 22, pl = 110;
  g.save();
  for (let y = -pl; y < h + pl; y += pw * 2) {
    for (let x = -pl; x < w + pl; x += pw * 2) {
      for (const flip of [0, 1]) {
        g.save();
        g.translate(x + (flip ? pw : 0), y + (flip ? pw : 0));
        g.rotate(flip ? -Math.PI / 4 : Math.PI / 4);
        const l = 34 + rnd() * 14;
        g.fillStyle = `hsl(${28 + rnd() * 6},${42 + rnd() * 10}%,${l}%)`;
        g.fillRect(0, 0, pl, pw - 2);
        g.fillStyle = "rgba(0,0,0,.15)";
        for (let k = 0; k < 3; k++) g.fillRect(rnd() * pl, rnd() * pw, 18 + rnd() * 30, 1);
        g.restore();
      }
    }
  }
  g.restore();
}, [1, 1]));

// Wide oak planks (1 tile = 2 m)
export const oakPlanks = () => once("planks", () => canvasTex(512, 512, (g, w, h) => {
  const ph = h / 8;
  for (let i = 0; i < 8; i++) {
    let x = -rnd() * 300;
    while (x < w) {
      const l = 300 + rnd() * 200;
      g.fillStyle = `hsl(${30 + rnd() * 5},${38 + rnd() * 10}%,${40 + rnd() * 10}%)`;
      g.fillRect(x, i * ph, l, ph);
      g.fillStyle = "rgba(0,0,0,.25)"; g.fillRect(x, i * ph, 2, ph);
      for (let k = 0; k < 6; k++) { g.fillStyle = "rgba(60,30,10,.12)"; g.fillRect(x + rnd() * l, i * ph + rnd() * ph, 40 + rnd() * 80, 1); }
      x += l;
    }
    g.fillStyle = "rgba(0,0,0,.3)"; g.fillRect(0, i * ph, w, 2);
  }
}, [1, 1]));

// Raised-panel walnut wainscoting (1 tile = 1.2 m wide x 1.4 m tall)
export const walnutPanel = () => once("walnut", () => canvasTex(256, 300, (g, w, h) => {
  const base = g.createLinearGradient(0, 0, w, 0);
  base.addColorStop(0, "#3c2616"); base.addColorStop(1, "#4a2f1b");
  g.fillStyle = base; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 60; i++) { g.fillStyle = `rgba(20,10,4,${0.15 * rnd()})`; g.fillRect(0, rnd() * h, w, 1 + rnd() * 2); }
  const m = 28;
  g.fillStyle = "rgba(255,220,180,.07)"; g.fillRect(m, m, w - m * 2, h - m * 2);
  g.strokeStyle = "rgba(0,0,0,.45)"; g.lineWidth = 6; g.strokeRect(m, m, w - m * 2, h - m * 2);
  g.strokeStyle = "rgba(255,210,160,.18)"; g.lineWidth = 3; g.strokeRect(m + 10, m + 10, w - m * 2 - 20, h - m * 2 - 20);
}, [1, 1]));

// Painted wainscoting (light) for foyer and bedroom
export const paintedPanel = (hex) => once("pp" + hex, () => canvasTex(256, 300, (g, w, h) => {
  g.fillStyle = hex; g.fillRect(0, 0, w, h);
  const m = 30;
  g.strokeStyle = "rgba(0,0,0,.16)"; g.lineWidth = 6; g.strokeRect(m, m, w - m * 2, h - m * 2);
  g.strokeStyle = "rgba(255,255,255,.5)"; g.lineWidth = 3; g.strokeRect(m + 9, m + 9, w - m * 2 - 18, h - m * 2 - 18);
}, [1, 1]));

// Damask wallpaper (1 tile = 0.8 m)
export const damask = (bg, fg) => once("dm" + bg + fg, () => canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  g.fillStyle = fg;
  const motif = (cx, cy, s) => {
    g.save(); g.translate(cx, cy); g.scale(s, s);
    g.beginPath();
    g.moveTo(0, -60); g.bezierCurveTo(30, -40, 40, -10, 0, 10); g.bezierCurveTo(-40, -10, -30, -40, 0, -60);
    g.moveTo(0, 10); g.bezierCurveTo(40, 20, 30, 50, 0, 60); g.bezierCurveTo(-30, 50, -40, 20, 0, 10);
    g.fill();
    g.beginPath(); g.arc(-34, 0, 9, 0, 7); g.arc(34, 0, 9, 0, 7); g.fill();
    g.restore();
  };
  motif(w / 2, h / 2, 1); motif(0, 0, 1); motif(w, 0, 1); motif(0, h, 1); motif(w, h, 1);
}, [1, 1]));

// Oriental rug with a medallion (whole rug = 1 tile)
export const rug = (c1, c2, c3) => once("rug" + c1 + c2 + c3, () => canvasTex(512, 768, (g, w, h) => {
  g.fillStyle = c1; g.fillRect(0, 0, w, h);
  g.strokeStyle = c2; g.lineWidth = 26; g.strokeRect(20, 20, w - 40, h - 40);
  g.strokeStyle = c3; g.lineWidth = 8; g.strokeRect(46, 46, w - 92, h - 92);
  for (let i = 0; i < 40; i++) {
    const t = i / 40;
    g.fillStyle = i % 2 ? c3 : c2;
    g.fillRect(24 + t * (w - 48), 26, 8, 14); g.fillRect(24 + t * (w - 48), h - 40, 8, 14);
  }
  g.save(); g.translate(w / 2, h / 2);
  for (let r = 6; r > 0; r--) {
    g.fillStyle = r % 2 ? c2 : c3;
    g.beginPath();
    for (let k = 0; k <= 16; k++) {
      const a = (k / 16) * Math.PI * 2, rr = r * 26 * (k % 2 ? 0.78 : 1);
      g.lineTo(Math.cos(a) * rr * 1.1, Math.sin(a) * rr * 1.5);
    }
    g.fill();
  }
  g.restore();
  for (let i = 0; i < 2400; i++) { g.fillStyle = `rgba(0,0,0,${0.08 * rnd()})`; g.fillRect(rnd() * w, rnd() * h, 2, 2); }
}));

// Diamond-pane leaded glass, warm interior glow behind it
export const leaded = (lit = true) => once("lead" + lit, () => canvasTex(128, 256, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h);
  if (lit) { gr.addColorStop(0, "#ffd9a0"); gr.addColorStop(1, "#e8a65d"); }
  else { gr.addColorStop(0, "#3a4a60"); gr.addColorStop(1, "#1a2230"); }
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.strokeStyle = "rgba(30,24,20,.85)"; g.lineWidth = 3;
  const s = 32;
  for (let k = -h; k < w + h; k += s) {
    g.beginPath(); g.moveTo(k, 0); g.lineTo(k + h * 0.6, h); g.stroke();
    g.beginPath(); g.moveTo(k, 0); g.lineTo(k - h * 0.6, h); g.stroke();
  }
}, [1, 1]));

// A painting of New York (kind: "bridge" | "park" | "skyline" | "taxi")
export function painting(kind) {
  return once("paint" + kind, () => canvasTex(384, 288, (g, w, h) => {
    const sky = g.createLinearGradient(0, 0, 0, h);
    if (kind === "park") { sky.addColorStop(0, "#9fb7c9"); sky.addColorStop(1, "#e8d7b0"); }
    else if (kind === "skyline") { sky.addColorStop(0, "#1b2340"); sky.addColorStop(0.7, "#c56d4a"); sky.addColorStop(1, "#f2b56f"); }
    else if (kind === "taxi") { sky.addColorStop(0, "#28304a"); sky.addColorStop(1, "#6a6f8a"); }
    else { sky.addColorStop(0, "#f2c28d"); sky.addColorStop(1, "#e88b5c"); }
    g.fillStyle = sky; g.fillRect(0, 0, w, h);
    const brush = (n, col, f) => { for (let i = 0; i < n; i++) { g.fillStyle = col(); f(); } };
    if (kind === "bridge") {
      g.fillStyle = "#3b4a5c"; g.fillRect(0, h * 0.72, w, h * 0.28);
      g.fillStyle = "#5b4a3f";
      [w * 0.25, w * 0.75].forEach((x) => {
        g.fillRect(x - 22, h * 0.18, 44, h * 0.6);
        g.fillStyle = "#e88b5c"; g.beginPath(); g.moveTo(x - 12, h * 0.42); g.lineTo(x - 12, h * 0.28); g.quadraticCurveTo(x - 6, h * 0.22, x, h * 0.22); g.quadraticCurveTo(x + 6, h * 0.22, x + 12, h * 0.28); g.lineTo(x + 12, h * 0.42); g.fill();
        g.fillStyle = "#5b4a3f";
      });
      g.strokeStyle = "rgba(40,40,50,.8)"; g.lineWidth = 1.5;
      for (let i = 0; i < 22; i++) { g.beginPath(); g.moveTo(w * 0.25, h * 0.2); g.lineTo(i * w / 21, h * 0.62); g.stroke(); g.beginPath(); g.moveTo(w * 0.75, h * 0.2); g.lineTo(i * w / 21, h * 0.62); g.stroke(); }
      g.fillStyle = "#2b2d33"; g.fillRect(0, h * 0.6, w, 8);
    } else if (kind === "park") {
      g.fillStyle = "#6c8a58"; g.fillRect(0, h * 0.62, w, h);
      brush(160, () => `hsl(${20 + rnd() * 30},${55 + rnd() * 25}%,${40 + rnd() * 20}%)`, () => { g.beginPath(); g.arc(rnd() * w, h * 0.35 + rnd() * h * 0.35, 6 + rnd() * 14, 0, 7); g.fill(); });
      g.fillStyle = "#e8e0cf"; g.beginPath(); g.moveTo(w * 0.2, h); g.quadraticCurveTo(w * 0.5, h * 0.7, w * 0.8, h); g.fill();
      g.fillStyle = "rgba(60,60,80,.6)"; for (let i = 0; i < 8; i++) g.fillRect(rnd() * w, h * 0.05 + rnd() * h * 0.12, 8 + rnd() * 10, 40 + rnd() * 60);
    } else if (kind === "skyline") {
      for (let i = 0; i < 40; i++) {
        const bw = 10 + rnd() * 24, bh = 40 + rnd() * 150, x = rnd() * w;
        g.fillStyle = "#151a2c"; g.fillRect(x, h * 0.82 - bh, bw, bh);
        g.fillStyle = "rgba(255,210,140,.8)"; for (let k = 0; k < bh / 9; k++) if (rnd() < 0.4) g.fillRect(x + 2 + rnd() * (bw - 6), h * 0.82 - bh + k * 9, 3, 3);
      }
      g.fillStyle = "#151a2c"; g.fillRect(w * 0.48, h * 0.82 - 210, 18, 210); g.fillRect(w * 0.48 + 7, h * 0.82 - 250, 4, 40);
      g.fillStyle = "#1f2b45"; g.fillRect(0, h * 0.82, w, h);
      brush(80, () => "rgba(255,200,120,.35)", () => g.fillRect(rnd() * w, h * 0.84 + rnd() * h * 0.15, 20 + rnd() * 40, 2));
    } else {
      g.fillStyle = "#3b3e4a"; g.fillRect(0, h * 0.6, w, h);
      g.fillStyle = "#f2c230"; g.fillRect(w * 0.3, h * 0.55, w * 0.36, h * 0.16); g.fillRect(w * 0.36, h * 0.45, w * 0.22, h * 0.12);
      g.fillStyle = "#111"; [0.37, 0.6].forEach((x) => { g.beginPath(); g.arc(w * x, h * 0.72, 14, 0, 7); g.fill(); });
      brush(60, () => "rgba(255,200,120,.25)", () => g.fillRect(rnd() * w, h * 0.75 + rnd() * h * 0.2, 2, 20 + rnd() * 30));
    }
    // canvas texture strokes
    for (let i = 0; i < 1500; i++) { g.fillStyle = `rgba(255,255,255,${0.05 * rnd()})`; g.fillRect(rnd() * w, rnd() * h, 6, 1); }
  }));
}

// Clock face with real New York time (redrawn each minute)
export function clockFace() {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  const draw = () => {
    const g = c.getContext("2d");
    g.fillStyle = "#f3ead6"; g.beginPath(); g.arc(128, 128, 124, 0, 7); g.fill();
    g.strokeStyle = "#8a6a2a"; g.lineWidth = 8; g.stroke();
    g.fillStyle = "#2b2420"; g.font = "bold 22px Georgia, serif"; g.textAlign = "center"; g.textBaseline = "middle";
    ["XII", "I", "II", "III", "IIII", "V", "VI", "VII", "VIII", "IX", "X", "XI"].forEach((s, i) => {
      const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
      g.fillText(s, 128 + Math.cos(a) * 96, 128 + Math.sin(a) * 96);
    });
    const now = new Date(new Date().toLocaleString("en-US", { timeZone: "America/New_York" }));
    const hr = (now.getHours() % 12) + now.getMinutes() / 60, mn = now.getMinutes();
    const hand = (a, l, wd) => { g.lineWidth = wd; g.lineCap = "round"; g.beginPath(); g.moveTo(128, 128); g.lineTo(128 + Math.cos(a) * l, 128 + Math.sin(a) * l); g.stroke(); };
    g.strokeStyle = "#1a1512";
    hand((hr / 12) * Math.PI * 2 - Math.PI / 2, 56, 7);
    hand((mn / 60) * Math.PI * 2 - Math.PI / 2, 84, 4);
    g.fillStyle = "#8a6a2a"; g.beginPath(); g.arc(128, 128, 8, 0, 7); g.fill();
    g.font = "italic 14px Georgia, serif"; g.fillStyle = "#6b5a40"; g.fillText("New York", 128, 168);
    t.needsUpdate = true;
  };
  draw();
  setInterval(draw, 30000);
  return t;
}

// Sheet of "subway map" style art for the bedroom
export const subwayPoster = () => once("subway", () => canvasTex(300, 420, (g, w, h) => {
  g.fillStyle = "#f6f3ea"; g.fillRect(0, 0, w, h);
  const cols = ["#ee352e", "#00933c", "#b933ad", "#0039a6", "#fccc0a", "#ff6319", "#6cbe45", "#a7a9ac"];
  cols.forEach((c, i) => {
    g.strokeStyle = c; g.lineWidth = 7; g.lineJoin = "round";
    g.beginPath();
    let x = 30 + i * 32, y = 20;
    g.moveTo(x, y);
    for (let k = 0; k < 6; k++) { y += 50 + rnd() * 20; x += (rnd() - 0.5) * 60; g.lineTo(x, y); }
    g.stroke();
  });
  g.fillStyle = "#111"; g.font = "bold 26px Helvetica, Arial, sans-serif"; g.fillText("NEW YORK", 20, h - 40);
  g.font = "14px Helvetica, Arial, sans-serif"; g.fillText("subway lines, by heart", 20, h - 18);
}));

export const banner = (text, bg, fg) => once("bn" + text, () => canvasTex(512, 160, (g, w, h) => {
  g.fillStyle = bg; g.beginPath(); g.moveTo(0, 0); g.lineTo(w, h / 2); g.lineTo(0, h); g.fill();
  g.fillStyle = fg; g.font = "bold 54px Georgia, serif"; g.textBaseline = "middle"; g.fillText(text, 30, h / 2);
}));
