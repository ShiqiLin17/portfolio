// "Pull the yarn": the whole screen is a knitted sweater.
// Domi trots in, bats the loose strand hanging from the top button, then pulls,
// and the two front panels unravel open. The robot parts knitted inside take
// turns in the spotlight while she plays with the growing ball of yarn, then she
// rolls it back, the sweater closes, and she falls asleep.
// Reads window.storyProgress (0..1) from script.js.
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

  // ---------- Domi and the loose strand of yarn (full-screen overlay) ----------
  const sew = document.getElementById("sewing");
  const strand = el("path", { class: "yarn-strand" }, sew);
  const D = window.Domi ? window.Domi.rig(sew) : null;
  const ball = el("g", { class: "yarn-ball" }, sew);
  el("circle", { r: 30, class: "yb" }, ball);
  ["M-26 -10 Q0 -34 26 -12", "M-28 2 Q0 -22 28 0", "M-24 14 Q0 -8 24 14", "M-14 -26 Q8 0 -4 28", "M4 -28 Q22 0 10 28"].forEach((d) => el("path", { d, class: "yb-wrap" }, ball));
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

    // where the loose yarn starts: the top button, then the opening edge of the sweater
    const gr = garment.getBoundingClientRect();
    const br = topBtn.getBoundingClientRect();
    const bx = br.left - gr.left + br.width / 2;
    const by = br.top - gr.top + br.height / 2;
    if (D) {
      const st = D.st;
      const sc = Math.max(0.55, Math.min(1.05, H / 900)) * (W < 700 ? 0.75 : 1);
      const ground = H - 18;
      st.s = sc; st.y = ground; st.flip = true; st.t = time;
      const reach = 112 * sc;             // from her center to her raised paw
      const walkIn = ease(seg(p, 0.02, 0.1));
      const pull = ease(seg(p, 0.13, 0.24));
      const back = ease(seg(p, 0.84, 0.92));
      const restX = W < 700 ? W * 0.74 : W * 0.84;
      let x;
      if (p < 0.13) x = lerp(W + 220 * sc, bx + reach, walkIn);
      else if (p < 0.84) x = lerp(bx + reach, restX, pull);
      else x = lerp(restX, Math.min(restX, W * 0.6), back);
      const vel = (x - (st.x || x));
      st.x = x;
      st.speed = clamp01(Math.abs(vel) * 0.6 + (p > 0.02 && p < 0.1 ? 0.9 : 0) + (p > 0.13 && p < 0.24 ? 0.7 : 0) + (p > 0.84 && p < 0.92 ? 0.7 : 0));
      st.phase += (p > 0.13 && p < 0.24 ? -1 : 1) * 0.22 * st.speed;
      // batting at the dangling strand, then at her growing ball of yarn
      const batting = p > 0.09 && p < 0.14;
      const playing = p > 0.24 && p < 0.84;
      const swing = 0.5 + 0.5 * Math.sin(time * (batting ? 9 : 3.2));
      st.swat = batting ? swing : playing ? Math.max(0, Math.sin(time * 1.6)) ** 6 : 0;
      st.crouch = batting ? 0.5 : playing ? 0.25 : 0;
      st.sleep = ease(seg(p, 0.92, 0.97));
      st.wag = batting || playing ? 0.7 : 0.2;
      st.tilt = batting ? -12 : 0;
      st.lookY = batting ? -1 : 0.3;
      st.blink = (time % 4) < 0.12 ? 1 : 0;
      D.apply();
      const pawX = x - reach, pawY = ground - (batting ? 150 : 70) * sc;
      // the strand
      const edgeX = W * 0.52 - open * W * 0.45, edgeY = H * 0.34;
      const ballR = 30 * sc * clamp01(seg(p, 0.14, 0.4) * (1 - back) + 0.0001);
      const bxp = x - reach - ballR * 0.6 + Math.sin(time * 1.6) * 6 * (playing ? 1 : 0), byp = ground - ballR;
      ball.setAttribute("transform", `translate(${bxp.toFixed(1)} ${byp.toFixed(1)}) rotate(${((bxp * 2) % 360).toFixed(1)}) scale(${(ballR / 30).toFixed(3)})`);
      ball.style.opacity = ballR > 2 ? 1 : 0;
      let d;
      if (p < 0.13) {
        // dangling from the top button, swinging, batted by her paw
        const endY = Math.min(ground - 160 * sc, H * 0.7);
        const sway = Math.sin(time * 2) * 14 + (batting ? (swing - 0.5) * 40 : 0);
        d = `M${bx} ${by} Q${bx + sway * 0.4} ${(by + endY) / 2} ${bx + sway} ${endY}`;
      } else if (p < 0.24) {
        d = `M${edgeX.toFixed(1)} ${edgeY.toFixed(1)} Q${((edgeX + pawX) / 2).toFixed(1)} ${((edgeY + pawY) / 2 + 20 * (1 - pull)).toFixed(1)} ${pawX.toFixed(1)} ${(ground - 120 * sc).toFixed(1)}`;
      } else {
        const sag = 80 + 30 * Math.sin(time);
        d = `M${edgeX.toFixed(1)} ${edgeY.toFixed(1)} Q${((edgeX + bxp) / 2).toFixed(1)} ${(Math.max(edgeY, byp) + sag).toFixed(1)} ${bxp.toFixed(1)} ${byp.toFixed(1)}`;
      }
      strand.setAttribute("d", d);
      strand.style.opacity = p > 0.92 ? 0 : 1;
      if (st.sleep > 0.9 && Math.random() < 0.012 && window.Domi) {
        const r = garment.getBoundingClientRect();
        window.Domi.pop(r.left + x - 60 * sc, r.top + ground - 120 * sc, "z", "zzz");
      }
    }

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
