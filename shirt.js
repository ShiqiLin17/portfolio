// "Under the seams": a needle threads the shirt's top button, the shirt opens,
// and the robot parts sewn inside come to life as you scroll.
// Reads window.storyProgress (0..1), which script.js keeps up to date.
(function () {
  const svg = document.getElementById("shirt");
  if (!svg) return;
  const NS = "http://www.w3.org/2000/svg";
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const el = (tag, attrs = {}, parent = svg) => {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    parent.appendChild(n);
    return n;
  };

  // ---------- defs ----------
  const defs = el("defs");
  const weave = el("pattern", { id: "weave", width: 7, height: 7, patternUnits: "userSpaceOnUse", patternTransform: "rotate(35)" }, defs);
  el("line", { x1: 0, y1: 0, x2: 0, y2: 7, class: "weave-line" }, weave);
  const gingham = el("pattern", { id: "gingham", width: 16, height: 16, patternUnits: "userSpaceOnUse" }, defs);
  el("rect", { x: 0, y: 0, width: 8, height: 16, class: "gingham-a" }, gingham);
  el("rect", { x: 0, y: 0, width: 16, height: 8, class: "gingham-a" }, gingham);
  const liningClip = el("clipPath", { id: "lining-clip" }, defs);
  const LINING = "M140 112 L205 90 Q250 124 295 90 L360 112 L360 500 Q250 514 140 500 Z";
  el("path", { d: LINING }, liningClip);
  const seamClip = el("clipPath", { id: "seam-clip" }, defs);
  const seamRect = el("rect", { x: 230, y: 130, width: 40, height: 0 }, seamClip);

  // ---------- helpers ----------
  function gearPath(teeth, rOut, rIn, rHole) {
    let d = "";
    const step = (Math.PI * 2) / teeth;
    for (let i = 0; i < teeth; i++) {
      const a = i * step;
      const pts = [
        [rIn, a], [rOut, a + step * 0.18], [rOut, a + step * 0.48], [rIn, a + step * 0.66],
      ];
      pts.forEach(([r, t], j) => {
        d += (i === 0 && j === 0 ? "M" : "L") + (r * Math.cos(t)).toFixed(2) + " " + (r * Math.sin(t)).toFixed(2) + " ";
      });
    }
    d += "Z ";
    // centre hole (drawn as a separate subpath; evenodd punches it out)
    d += `M${rHole} 0 A${rHole} ${rHole} 0 1 0 ${-rHole} 0 A${rHole} ${rHole} 0 1 0 ${rHole} 0 Z`;
    return d;
  }
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp01 = (t) => Math.max(0, Math.min(1, t));
  const seg = (p, a, b) => clamp01((p - a) / (b - a));
  const ease = (t) => t * t * (3 - 2 * t);

  // ---------- layers ----------
  el("ellipse", { cx: 250, cy: 520, rx: 170, ry: 14, class: "shirt-shadow" });

  // Back of the shirt and sleeves
  const BACK = "M205 86 L128 106 L36 228 L86 262 L140 208 L142 502 Q250 518 358 502 L360 208 L414 262 L464 228 L372 106 L295 86 Q250 122 205 86 Z";
  el("path", { d: BACK, class: "fabric back" });
  el("path", { d: BACK, fill: "url(#weave)" });
  el("path", { d: "M36 228 L86 262", class: "stitch" });
  el("path", { d: "M464 228 L414 262", class: "stitch" });
  el("path", { d: "M128 106 L140 208", class: "stitch faint" });
  el("path", { d: "M372 106 L360 208", class: "stitch faint" });

  // Inside: gingham lining with the robot parts
  const inside = el("g", { "clip-path": "url(#lining-clip)" });
  el("path", { d: LINING, class: "lining" }, inside);
  el("path", { d: LINING, fill: "url(#gingham)" }, inside);

  // Wires (yarn) connecting the parts
  const wires = el("g", { class: "wires" }, inside);
  el("path", { d: "M300 232 C 300 260, 262 262, 256 282" }, wires);
  el("path", { d: "M200 232 C 180 280, 196 340, 212 372" }, wires);
  el("path", { d: "M330 230 C 350 280, 345 330, 332 378" }, wires);
  el("path", { d: "M232 196 C 250 190, 256 190, 268 192" }, wires);

  // The heart: a mechanical heart that beats
  const heart = el("g", { class: "part", transform: "translate(198 196)" }, inside);
  const heartBeat = el("g", {}, heart);
  el("rect", { x: -14, y: -44, width: 9, height: 20, rx: 2, class: "tube" }, heartBeat);
  el("rect", { x: 4, y: -48, width: 9, height: 24, rx: 2, class: "tube" }, heartBeat);
  el("path", { d: "M0 30 C -40 4, -46 -26, -22 -34 C -8 -39, 0 -27, 0 -20 C 0 -27, 8 -39, 22 -34 C 46 -26, 40 4, 0 30 Z", class: "heart" }, heartBeat);
  el("path", { d: "M-24 -20 C -30 -10, -26 2, -14 12", class: "heart-shine" }, heartBeat);
  [[-26, -24], [26, -24], [-30, -4], [30, -4], [-16, 14], [16, 14], [0, 26]].forEach(([x, y]) => el("circle", { cx: x, cy: y, r: 2, class: "rivet" }, heartBeat));
  const heartGear = el("path", { d: gearPath(8, 11, 8, 3), class: "heart-gear", "fill-rule": "evenodd", transform: "translate(0 -4)" }, heartBeat);
  const heartGlow = el("circle", { r: 46, class: "glow" }, heart);

  // The brain: a microcontroller
  const brain = el("g", { class: "part", transform: "translate(302 190)" }, inside);
  for (let i = 0; i < 6; i++) {
    const o = -25 + i * 10;
    el("rect", { x: o - 2, y: -42, width: 4, height: 9, class: "pin" }, brain);
    el("rect", { x: o - 2, y: 33, width: 4, height: 9, class: "pin" }, brain);
    el("rect", { x: -42, y: o - 2, width: 9, height: 4, class: "pin" }, brain);
    el("rect", { x: 33, y: o - 2, width: 9, height: 4, class: "pin" }, brain);
  }
  const chip = el("rect", { x: -34, y: -34, width: 68, height: 68, rx: 4, class: "chip" }, brain);
  el("circle", { cx: -24, cy: -24, r: 3, class: "chip-dot" }, brain);
  const chipText = el("text", { x: 0, y: 6, class: "chip-label", "text-anchor": "middle" }, brain);
  chipText.textContent = "MCU";
  const chipGlow = el("rect", { x: -40, y: -40, width: 80, height: 80, rx: 8, class: "glow" }, brain);

  // The eyes: a camera module
  const eye = el("g", { class: "part", transform: "translate(250 308)" }, inside);
  el("rect", { x: -28, y: -28, width: 56, height: 56, rx: 6, class: "cam-board" }, eye);
  el("circle", { r: 20, class: "cam-ring" }, eye);
  const iris = el("g", {}, eye);
  for (let i = 0; i < 6; i++) {
    el("path", { d: "M0 0 L14 -4 L12 6 Z", class: "iris", transform: `rotate(${i * 60})` }, iris);
  }
  el("circle", { r: 5, class: "pupil" }, eye);
  el("circle", { cx: -6, cy: -7, r: 3, class: "glint" }, eye);
  const eyeGlow = el("circle", { r: 34, class: "glow" }, eye);

  // The muscle: two gears and a piston
  const muscle = el("g", { class: "part" }, inside);
  const g1 = el("path", { d: gearPath(12, 40, 32, 9), class: "gear", "fill-rule": "evenodd" }, muscle);
  const g2 = el("path", { d: gearPath(8, 27, 20, 6), class: "gear gear-2", "fill-rule": "evenodd" }, muscle);
  const piston = el("g", {}, muscle);
  el("rect", { x: 316, y: 380, width: 30, height: 56, rx: 3, class: "cylinder" }, muscle);
  const rod = el("rect", { x: 327, y: 400, width: 8, height: 60, class: "rod" }, piston);
  const head = el("rect", { x: 319, y: 392, width: 24, height: 12, rx: 2, class: "piston-head" }, piston);
  const muscleGlow = el("circle", { cx: 245, cy: 420, r: 78, class: "glow" }, muscle);

  // Handwritten notes that point at each part
  const notes = el("g", { class: "notes" });
  const mkNote = (x, y, text, arrow) => {
    const g = el("g", { class: "scribble-note" }, notes);
    const t = el("text", { x, y }, g);
    t.textContent = text;
    el("path", { d: arrow, class: "note-arrow" }, g);
    return g;
  };
  const noteHeart = mkNote(18, 150, "the heart ♥", "M60 160 C 100 168, 130 176, 150 186 M141 180 L150 186 L141 192");
  const noteBrain = mkNote(378, 150, "the brain!", "M384 160 C 370 172, 360 180, 346 186 M354 178 L346 186 L356 190");
  const noteEye = mkNote(380, 300, "eyes", "M378 310 C 340 318, 310 314, 286 310 M294 304 L286 310 L295 316");
  const noteMuscle = mkNote(28, 440, "muscle", "M70 446 C 110 452, 150 440, 180 430 M171 427 L180 430 L174 438");

  // Front panels (they swing open)
  const PANEL_L = "M205 86 L140 106 L140 500 Q200 510 262 510 L262 120 Q230 114 205 86 Z";
  const PANEL_R = "M295 86 L360 106 L360 500 Q300 510 250 510 L250 120 Q270 114 295 86 Z";
  const right = el("g", { class: "panel" });
  el("path", { d: PANEL_R, class: "fabric front" }, right);
  el("path", { d: PANEL_R, fill: "url(#weave)" }, right);
  el("path", { d: "M354 112 L354 494", class: "stitch faint" }, right);
  const left = el("g", { class: "panel" });
  el("path", { d: PANEL_L, class: "fabric front" }, left);
  el("path", { d: PANEL_L, fill: "url(#weave)" }, left);
  el("path", { d: "M252 124 L252 504", class: "stitch" }, left);
  el("path", { d: "M146 112 L146 494", class: "stitch faint" }, left);
  // pocket
  el("path", { d: "M165 170 L222 170 L222 228 Q193 238 165 228 Z", class: "pocket" }, left);
  el("path", { d: "M169 176 L218 176 L218 224 Q193 233 169 224 Z", class: "stitch" }, left);
  el("rect", { x: 172, y: 160, width: 6, height: 26, rx: 2, class: "pen" }, left);
  el("rect", { x: 182, y: 156, width: 5, height: 22, rx: 2, class: "pen pen-2" }, left);

  // Running stitch sewn down the placket at the end
  const seam = el("path", { d: "M250 136 L250 496", class: "seam", "clip-path": "url(#seam-clip)" });

  // Buttons ride on the left panel's edge
  const BTN_Y = [168, 250, 332, 414];
  const buttons = BTN_Y.map((y) => {
    const g = el("g", { class: "button" });
    el("circle", { r: 13, class: "btn-face" }, g);
    el("circle", { r: 9, class: "btn-rim" }, g);
    [[-3.5, -3.5], [3.5, -3.5], [-3.5, 3.5], [3.5, 3.5]].forEach(([x, y2]) => el("circle", { cx: x, cy: y2, r: 1.8, class: "btn-hole" }, g));
    return { g, y };
  });

  // Collar sits on top
  el("path", { d: "M205 86 Q226 112 250 126 L226 146 L188 100 Z", class: "fabric collar" });
  el("path", { d: "M295 86 Q274 112 250 126 L274 146 L312 100 Z", class: "fabric collar" });
  el("path", { d: "M196 102 L228 140", class: "stitch faint" });
  el("path", { d: "M304 102 L272 140", class: "stitch faint" });

  // Sewn-in label at the end
  const tag = el("g", { class: "maker-tag", transform: "translate(250 470)" });
  el("rect", { x: -58, y: -16, width: 116, height: 30, rx: 2, class: "tag-bg" }, tag);
  el("rect", { x: -54, y: -12, width: 108, height: 22, rx: 1, class: "stitch tag-stitch" }, tag);
  const tagText = el("text", { x: 0, y: 5, "text-anchor": "middle", class: "tag-text" }, tag);
  tagText.textContent = "made by Shiqi";

  // Thread and needle on top of everything
  const threadFront = el("g", { class: "thread-stitches" });
  const threadTail = el("path", { class: "thread" });
  const needle = el("g", { class: "needle" });
  el("path", { d: "M0 0 L-74 -3.2 Q-84 0 -74 3.2 Z", class: "needle-body" }, needle);
  el("ellipse", { cx: -73, cy: 0, rx: 5, ry: 1.2, class: "needle-eye" }, needle);
  el("path", { d: "M-6 -1 L-60 -2.4", class: "needle-shine" }, needle);

  // ---------- needle choreography for the first stitch ----------
  const H = [[-3.5, -3.5], [3.5, 3.5], [3.5, -3.5], [-3.5, 3.5]];
  const route = [
    { abs: [560, -40] },
    { abs: [360, 80] },
    { btn: H[0] },
    { btn: H[1], front: true },
    { btn: H[2] },
    { btn: H[3], front: true },
    { abs: [420, 110] },
  ];
  const stitchLines = [3, 5].map(() => el("line", { class: "thread thread-stitch" }, threadFront));

  let smooth = 0;
  let visible = true;
  new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(svg);
  const t0 = performance.now();

  function frame(now) {
    requestAnimationFrame(frame);
    if (!visible) return;
    const target = window.storyProgress || 0;
    smooth += (target - smooth) * (reduceMotion ? 1 : 0.1);
    const p = smooth;
    const time = (now - t0) / 1000;

    // Panels: open during brain step, stay open, close during the final step.
    const open = ease(seg(p, 0.12, 0.24)) * (1 - ease(seg(p, 0.84, 0.93)));
    const sL = 1 - 0.78 * open;
    const sR = 1 - 0.78 * open;
    left.setAttribute("transform", `translate(140 0) scale(${sL} 1) translate(-140 0)`);
    right.setAttribute("transform", `translate(360 0) scale(${sR} 1) translate(-360 0)`);
    const bx = 140 + (250 - 140) * sL;
    buttons.forEach((b) => b.g.setAttribute("transform", `translate(${bx} ${b.y})`));
    const topBtn = [bx, BTN_Y[0]];

    // Resolve route points
    const pt = (r) => (r.abs ? r.abs : [topBtn[0] + r.btn[0], topBtn[1] + r.btn[1]]);

    // Needle along the route during step 0, then away; in the last step it sews down the placket.
    let tip, dir;
    const stitchT = ease(seg(p, 0.02, 0.15)) * (route.length - 1);
    const sewT = ease(seg(p, 0.87, 0.98));
    if (sewT > 0) {
      const y = lerp(136, 496, sewT);
      const bob = Math.sin(sewT * 40) * 7;
      tip = [250 + bob, y];
      dir = [Math.sin(sewT * 40 + 1.2) * 0.6, 1];
      seamRect.setAttribute("height", Math.max(0, y - 130));
    } else {
      seamRect.setAttribute("height", 0);
      const i = Math.min(route.length - 2, Math.floor(stitchT));
      const f = stitchT - i;
      const a = pt(route[i]);
      const b = pt(route[i + 1]);
      tip = [lerp(a[0], b[0], f), lerp(a[1], b[1], f)];
      dir = [b[0] - a[0], b[1] - a[1]];
      // after the stitch, drift and hover
      if (stitchT >= route.length - 1.001) {
        const drift = seg(p, 0.15, 0.87);
        const end = pt(route[route.length - 1]);
        tip = [end[0] + drift * 30 + Math.sin(time * 1.5) * 4, end[1] - drift * 60 + Math.cos(time * 1.2) * 4];
        dir = [1, -0.8];
      }
    }
    const ang = Math.atan2(dir[1], dir[0]);
    needle.setAttribute("transform", `translate(${tip[0].toFixed(1)} ${tip[1].toFixed(1)}) rotate(${(ang * 180 / Math.PI).toFixed(1)})`);
    const eyePt = [tip[0] - Math.cos(ang) * 73, tip[1] - Math.sin(ang) * 73];

    // Visible stitches on the button face
    [3, 5].forEach((k, j) => {
      const line = stitchLines[j];
      const a = pt(route[k - 1]);
      const b = pt(route[k]);
      const f = clamp01(stitchT - (k - 1));
      line.setAttribute("x1", a[0]); line.setAttribute("y1", a[1]);
      line.setAttribute("x2", lerp(a[0], b[0], f)); line.setAttribute("y2", lerp(a[1], b[1], f));
      line.style.opacity = f > 0 ? 1 : 0;
    });

    // Loose thread trailing from the last anchor to the needle's eye
    let anchor;
    if (sewT > 0) anchor = [250, 136];
    else if (stitchT >= 5) anchor = pt(route[5]);
    else if (stitchT >= 2) anchor = pt(route[Math.floor(stitchT)]);
    else anchor = [620, -60];
    const mx = (anchor[0] + eyePt[0]) / 2;
    const my = (anchor[1] + eyePt[1]) / 2 + 26;
    threadTail.setAttribute("d", `M${anchor[0].toFixed(1)} ${anchor[1].toFixed(1)} Q${mx.toFixed(1)} ${my.toFixed(1)} ${eyePt[0].toFixed(1)} ${eyePt[1].toFixed(1)}`);

    // Which part is in focus
    const active = Math.min(5, Math.floor(p * 6));
    const focus = (g, on) => g.classList.toggle("is-on", on);
    focus(heartGlow, active === 1);
    focus(chipGlow, active === 2);
    focus(eyeGlow, active === 3);
    focus(muscleGlow, active === 4);
    noteHeart.classList.toggle("show", active === 1 && open > 0.8);
    noteBrain.classList.toggle("show", active === 2 && open > 0.8);
    noteEye.classList.toggle("show", active === 3 && open > 0.8);
    noteMuscle.classList.toggle("show", active === 4 && open > 0.8);

    // Heart: a lub-dub beat, quicker when it's the focus
    const bpm = active === 1 ? 96 : 64;
    const ph = ((time * bpm) / 60) % 1;
    const beat = Math.exp(-Math.pow((ph - 0.08) / 0.05, 2)) * 0.12 + Math.exp(-Math.pow((ph - 0.3) / 0.05, 2)) * 0.07;
    heartBeat.setAttribute("transform", `scale(${(1 + beat).toFixed(3)})`);
    heartGear.setAttribute("transform", `translate(0 -4) rotate(${(time * 90) % 360})`);

    // Brain: chip pulses when on
    chip.classList.toggle("thinking", active === 2);

    // Eyes: iris opens and closes
    const irisAmt = active === 3 ? 0.6 + 0.4 * Math.sin(time * 2.2) : 0.35;
    iris.setAttribute("transform", `scale(${0.65 + irisAmt * 0.45}) rotate(${(time * (active === 3 ? 40 : 6)) % 360})`);

    // Muscle: gears driven by scroll plus a little idle spin, piston strokes
    const spin = p * 900 + (active === 4 ? time * 60 : time * 6);
    g1.setAttribute("transform", `translate(215 420) rotate(${spin.toFixed(1)})`);
    g2.setAttribute("transform", `translate(279 440) rotate(${(-spin * 1.5 + 22).toFixed(1)})`);
    const stroke = Math.sin((spin * Math.PI) / 180) * 14;
    piston.setAttribute("transform", `translate(0 ${stroke.toFixed(1)})`);

    // Maker tag appears once it's sewn shut
    tag.style.opacity = seg(p, 0.93, 0.99).toFixed(2);
  }
  requestAnimationFrame(frame);
})();
