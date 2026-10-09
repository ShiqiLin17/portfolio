// "Under the seams": the whole screen is a shirt.
// A needle threads the top button, the two front panels fray and swing open,
// the robot parts sewn inside take turns in the spotlight, and the shirt is
// stitched shut again. Reads window.storyProgress (0..1) from script.js.
(function () {
  const garment = document.getElementById("garment");
  if (!garment) return;
  const NS = "http://www.w3.org/2000/svg";
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const el = (tag, attrs, parent) => {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    parent.appendChild(n);
    return n;
  };
  const clamp01 = (t) => Math.max(0, Math.min(1, t));
  const seg = (p, a, b) => clamp01((p - a) / (b - a));
  const ease = (t) => t * t * (3 - 2 * t);
  const lerp = (a, b, t) => a + (b - a) * t;

  function gearPath(teeth, rOut, rIn, rHole) {
    let d = "";
    const step = (Math.PI * 2) / teeth;
    for (let i = 0; i < teeth; i++) {
      const a = i * step;
      [[rIn, a], [rOut, a + step * 0.18], [rOut, a + step * 0.48], [rIn, a + step * 0.66]].forEach(([r, t], j) => {
        d += (i === 0 && j === 0 ? "M" : "L") + (r * Math.cos(t)).toFixed(2) + " " + (r * Math.sin(t)).toFixed(2) + " ";
      });
    }
    return d + `Z M${rHole} 0 A${rHole} ${rHole} 0 1 0 ${-rHole} 0 A${rHole} ${rHole} 0 1 0 ${rHole} 0 Z`;
  }

  // ---------- the parts sewn inside ----------
  const art = document.getElementById("part-art");
  const parts = {};
  const group = (name) => (parts[name] = el("g", { class: "pg pg-" + name }, art));

  // heart
  const heart = group("heart");
  const beat = el("g", {}, heart);
  el("rect", { x: -26, y: -86, width: 16, height: 36, rx: 4, class: "tube" }, beat);
  el("rect", { x: 8, y: -94, width: 16, height: 44, rx: 4, class: "tube" }, beat);
  el("path", { d: "M0 62 C -84 10, -96 -54, -46 -70 C -16 -80, 0 -56, 0 -42 C 0 -56, 16 -80, 46 -70 C 96 -54, 84 10, 0 62 Z", class: "heart" }, beat);
  el("path", { d: "M-50 -42 C -62 -20, -54 4, -30 24", class: "shine" }, beat);
  [[-54, -50], [54, -50], [-62, -8], [62, -8], [-34, 30], [34, 30], [0, 52]].forEach(([x, y]) => el("circle", { cx: x, cy: y, r: 4, class: "rivet" }, beat));
  const heartGear = el("path", { d: gearPath(10, 24, 18, 6), class: "brass", "fill-rule": "evenodd" }, beat);

  // brain (microcontroller)
  const brain = group("brain");
  for (let i = 0; i < 7; i++) {
    const o = -54 + i * 18;
    el("rect", { x: o - 4, y: -86, width: 8, height: 18, class: "pin" }, brain);
    el("rect", { x: o - 4, y: 68, width: 8, height: 18, class: "pin" }, brain);
    el("rect", { x: -86, y: o - 4, width: 18, height: 8, class: "pin" }, brain);
    el("rect", { x: 68, y: o - 4, width: 18, height: 8, class: "pin" }, brain);
  }
  const chip = el("rect", { x: -70, y: -70, width: 140, height: 140, rx: 8, class: "chip" }, brain);
  el("circle", { cx: -50, cy: -50, r: 6, class: "chip-dot" }, brain);
  const chipText = el("text", { x: 0, y: 10, "text-anchor": "middle", class: "chip-label" }, brain);
  chipText.textContent = "MCU";
  const traces = el("g", { class: "chip-traces" }, brain);
  for (let i = 0; i < 4; i++) el("path", { d: `M-40 ${-20 + i * 14} H40`, class: "trace" }, traces);

  // eyes (camera)
  const eye = group("eye");
  el("rect", { x: -76, y: -76, width: 152, height: 152, rx: 14, class: "cam-board" }, eye);
  [[-58, -58], [58, -58], [-58, 58], [58, 58]].forEach(([x, y]) => el("circle", { cx: x, cy: y, r: 6, class: "rivet" }, eye));
  el("circle", { r: 54, class: "cam-ring" }, eye);
  const iris = el("g", {}, eye);
  for (let i = 0; i < 8; i++) el("path", { d: "M0 0 L40 -10 L34 16 Z", class: "iris", transform: `rotate(${i * 45})` }, iris);
  el("circle", { r: 14, class: "pupil" }, eye);
  el("circle", { cx: -16, cy: -18, r: 7, class: "glint" }, eye);

  // muscle (gears + piston)
  const muscle = group("muscle");
  const g1 = el("path", { d: gearPath(14, 62, 50, 14), class: "brass", "fill-rule": "evenodd" }, muscle);
  const g2 = el("path", { d: gearPath(9, 40, 31, 9), class: "steel", "fill-rule": "evenodd" }, muscle);
  el("rect", { x: 58, y: -96, width: 40, height: 74, rx: 4, class: "cylinder" }, muscle);
  const piston = el("g", {}, muscle);
  el("rect", { x: 72, y: -40, width: 12, height: 70, class: "rod" }, piston);
  el("rect", { x: 61, y: -50, width: 34, height: 16, rx: 3, class: "piston-head" }, piston);

  const order = [null, "heart", "brain", "eye", "muscle"];
  const tags = [null, "the heart ♡", "the brain", "the eyes", "the muscle"];
  const tagEl = document.getElementById("part-tag");

  // ---------- frayed threads along each opening edge ----------
  const frays = [...garment.querySelectorAll(".fray")].map((svg, side) => {
    const lines = [];
    for (let i = 0; i < 26; i++) {
      const y = 20 + i * 37 + (i % 3) * 7;
      const len = 18 + ((i * 37) % 30);
      const dir = side === 0 ? 1 : -1;
      const x0 = side === 0 ? 0 : 60;
      const d = `M${x0} ${y} q ${dir * len * 0.5} ${8 + (i % 4) * 3} ${dir * len} ${2 + (i % 5) * 4} t ${dir * len * 0.6} ${6 + (i % 3) * 5}`;
      const path = el("path", { d, class: "fray-thread" + (i % 4 === 0 ? " alt" : "") }, svg);
      lines.push(path);
    }
    return lines;
  });
  frays.flat().forEach((p) => {
    const L = p.getTotalLength ? p.getTotalLength() : 60;
    p.style.strokeDasharray = L;
    p.dataset.len = L;
  });

  // ---------- needle, thread and seam (full-screen overlay) ----------
  const sew = document.getElementById("sewing");
  const seam = el("path", { class: "seam" }, sew);
  const stitchA = el("line", { class: "thread stitch" }, sew);
  const stitchB = el("line", { class: "thread stitch" }, sew);
  const tail = el("path", { class: "thread" }, sew);
  const needle = el("g", { class: "needle" }, sew);
  el("path", { d: "M0 0 L-96 -4 Q-108 0 -96 4 Z", class: "needle-body" }, needle);
  el("ellipse", { cx: -94, cy: 0, rx: 7, ry: 1.6, class: "needle-eye" }, needle);
  el("path", { d: "M-8 -1.2 L-78 -2.8", class: "needle-shine" }, needle);
  const EYE = 94;

  const panelL = document.getElementById("panel-l");
  const topBtn = panelL.querySelector(".btn");

  let W = 0, H = 0;
  function resize() {
    W = garment.clientWidth; H = garment.clientHeight;
    sew.setAttribute("viewBox", `0 0 ${W} ${H}`);
  }
  window.addEventListener("resize", resize);
  resize();

  const H4 = [[-6, -6], [6, 6], [6, -6], [-6, 6]];
  let smooth = 0;
  let visible = true;
  new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(garment);
  const t0 = performance.now();

  function frame(now) {
    requestAnimationFrame(frame);
    if (!visible) return;
    const time = (now - t0) / 1000;
    smooth += ((window.storyProgress || 0) - smooth) * (reduceMotion ? 1 : 0.12);
    const p = smooth;

    // open from the heart step, close for the final step
    const open = ease(seg(p, 0.13, 0.24)) * (1 - ease(seg(p, 0.84, 0.92)));
    garment.style.setProperty("--open", open.toFixed(4));
    // threads unravel as it opens, then get pulled back in
    const fray = clamp01(open * 1.3);
    frays.flat().forEach((path, i) => {
      const L = +path.dataset.len;
      const f = clamp01(fray * 1.4 - (i % 7) * 0.06);
      path.style.strokeDashoffset = (L * (1 - f)).toFixed(1);
      if (!reduceMotion) path.setAttribute("transform", `rotate(${Math.sin(time * 1.6 + i) * 3 * f} 0 ${20 + (i % 26) * 37})`);
    });

    // top button position on screen
    const gr = garment.getBoundingClientRect();
    const br = topBtn.getBoundingClientRect();
    const bx = br.left - gr.left + br.width / 2;
    const by = br.top - gr.top + br.height / 2;
    const hole = (k) => [bx + H4[k][0], by + H4[k][1]];
    const route = [[W + 80, -80], [W * 0.78, H * 0.1], hole(0), hole(1), hole(2), hole(3), [bx + 150, by + 30]];

    const stitchT = ease(seg(p, 0.02, 0.13)) * (route.length - 1);
    const sewT = ease(seg(p, 0.86, 0.985));
    let tip, dir;
    if (sewT > 0) {
      const y = lerp(by, H * 0.96, sewT);
      const bob = Math.sin(sewT * 46) * 10;
      tip = [bx + bob, y];
      dir = [Math.cos(sewT * 46) * 0.7, 1];
      seam.setAttribute("d", `M${bx} ${by} L${bx} ${y}`);
      seam.style.opacity = 1;
    } else {
      seam.style.opacity = 0;
      if (stitchT >= route.length - 1.001) {
        const drift = seg(p, 0.13, 0.86);
        const end = route[route.length - 1];
        tip = [end[0] + drift * 60 + Math.sin(time * 1.4) * 6, end[1] - drift * 40 + Math.cos(time * 1.1) * 6];
        dir = [1, -0.7];
      } else {
        const i = Math.floor(stitchT);
        const f = stitchT - i;
        const a = route[i], b = route[i + 1];
        tip = [lerp(a[0], b[0], f), lerp(a[1], b[1], f)];
        dir = [b[0] - a[0], b[1] - a[1]];
      }
    }
    const ang = Math.atan2(dir[1], dir[0]);
    needle.setAttribute("transform", `translate(${tip[0].toFixed(1)} ${tip[1].toFixed(1)}) rotate(${(ang * 180 / Math.PI).toFixed(1)})`);
    const eyePt = [tip[0] - Math.cos(ang) * EYE, tip[1] - Math.sin(ang) * EYE];

    // the X on the button face
    [[stitchA, 2, 3], [stitchB, 4, 5]].forEach(([line, k0, k1]) => {
      const a = route[k0], b = route[k1];
      const f = clamp01(stitchT - k0);
      line.setAttribute("x1", a[0]); line.setAttribute("y1", a[1]);
      line.setAttribute("x2", lerp(a[0], b[0], f)); line.setAttribute("y2", lerp(a[1], b[1], f));
      line.style.opacity = f > 0 ? 1 : 0;
    });

    let anchor;
    if (sewT > 0) anchor = [bx, by];
    else if (stitchT >= 5) anchor = route[5];
    else if (stitchT >= 2) anchor = route[Math.floor(stitchT)];
    else anchor = [W + 160, -160];
    const mx = (anchor[0] + eyePt[0]) / 2, my = (anchor[1] + eyePt[1]) / 2 + 40;
    tail.setAttribute("d", `M${anchor[0].toFixed(1)} ${anchor[1].toFixed(1)} Q${mx.toFixed(1)} ${my.toFixed(1)} ${eyePt[0].toFixed(1)} ${eyePt[1].toFixed(1)}`);

    // which part is in the spotlight
    const active = Math.min(5, Math.floor((window.storyProgress || 0) * 6));
    const showing = Math.max(1, Math.min(4, active));
    for (let k = 1; k <= 4; k++) parts[order[k]].classList.toggle("on", k === showing);
    if (tagEl.dataset.k !== String(showing)) { tagEl.textContent = tags[showing]; tagEl.dataset.k = showing; }

    const bpm = 80;
    const ph = ((time * bpm) / 60) % 1;
    const pulse = Math.exp(-Math.pow((ph - 0.08) / 0.05, 2)) * 0.1 + Math.exp(-Math.pow((ph - 0.3) / 0.05, 2)) * 0.06;
    beat.setAttribute("transform", `scale(${(1 + pulse).toFixed(3)})`);
    heartGear.setAttribute("transform", `rotate(${(time * 80) % 360})`);
    chip.classList.toggle("thinking", showing === 2);
    iris.setAttribute("transform", `scale(${(0.8 + 0.25 * Math.sin(time * 2)).toFixed(3)}) rotate(${(time * 30) % 360})`);
    const spin = p * 900 + time * 40;
    g1.setAttribute("transform", `translate(-30 30) rotate(${spin.toFixed(1)})`);
    g2.setAttribute("transform", `translate(56 62) rotate(${(-spin * 1.55 + 18).toFixed(1)})`);
    piston.setAttribute("transform", `translate(0 ${(Math.sin((spin * Math.PI) / 180) * 18).toFixed(1)})`);
  }
  requestAnimationFrame(frame);
})();
