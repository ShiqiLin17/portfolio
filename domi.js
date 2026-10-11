// Domi: Shiqi's cream-and-white British longhair, drawn in SVG.
// window.Domi.rig(parentSvgGroup) builds a posable side-view Domi.
// window.Domi.front() returns markup for Domi sitting and facing you.
// It also runs the little Domi who trots along the bottom of the page and
// chases your ball of yarn (the cursor), and the Domi in the hero you can pet.
(function () {
  const NS = "http://www.w3.org/2000/svg";
  const C = { white: "#fffaf3", shade: "#efe5d6", cream: "#f0cb9b", creamDk: "#e0ae76", pink: "#f4aba8", nose: "#ea918d", eye: "#c9d79a", pupil: "#2d3124", line: "#7d6655", whisker: "#d7cdbf" };
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = window.matchMedia("(pointer: fine)").matches;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const r1 = (v) => Math.round(v * 10) / 10;

  // A fluffy outline: an ellipse with little tufts all the way round.
  function fluff(cx, cy, rx, ry, n = 22, a = 0.13, rot = 0) {
    // silky, not curly: a smooth outline with only a soft ripple
    n = Math.round(n * 1.6); a = a * 0.22;
    const cr = Math.cos(rot), sr = Math.sin(rot);
    const pt = (t, k) => {
      const x = rx * k * Math.cos(t), y = ry * k * Math.sin(t);
      return [r1(cx + x * cr - y * sr), r1(cy + x * sr + y * cr)];
    };
    let d = "";
    for (let i = 0; i < n; i++) {
      const t = (i / n) * Math.PI * 2, t2 = ((i + 0.5) / n) * Math.PI * 2, t3 = ((i + 1) / n) * Math.PI * 2;
      const p = pt(t, 1), c = pt(t2, 1 + a * (i % 3 === 0 ? 1.6 : 1)), q = pt(t3, 1);
      d += (i ? "" : `M${p[0]} ${p[1]}`) + ` Q${c[0]} ${c[1]} ${q[0]} ${q[1]}`;
    }
    return d + "Z";
  }
  // long fine hairs fanning out from an edge (soft, silky)
  function wisps(cx, cy, rx, ry, n, col, seed = 1, from = 0, to = Math.PI * 2, len = 9) {
    let s = "", k = seed;
    const rnd = () => ((k = (k * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < n; i++) {
      const t = from + (to - from) * (i + rnd() * 0.6) / n;
      const x = cx + Math.cos(t) * rx * 0.97, y = cy + Math.sin(t) * ry * 0.97;
      const L = len * (0.6 + rnd() * 0.8), bend = (rnd() - 0.5) * 6;
      s += `M${r1(x)} ${r1(y)} q${r1(Math.cos(t) * L * 0.5 + bend)} ${r1(Math.sin(t) * L * 0.5)} ${r1(Math.cos(t) * L)} ${r1(Math.sin(t) * L + 2)} `;
    }
    return `<path d="${s}" stroke="${col}" stroke-width=".9" fill="none" stroke-linecap="round" opacity=".7"/>`;
  }
  const P = (d, fill, extra = "") => `<path d="${d}" fill="${fill}" ${extra}/>`;

  // ------------------------------------------------------------ side view (faces right)
  // shared gradients (the same ids in every Domi; the first one wins, they're identical)
  const DEFS = `<defs>
    <radialGradient id="domi-iris" cx=".5" cy=".5" r=".55"><stop offset="0" stop-color="#6f9fd0"/><stop offset=".5" stop-color="#93bce0"/><stop offset=".66" stop-color="#c3d6b4"/><stop offset=".82" stop-color="#dbe39e"/><stop offset="1" stop-color="#b8c46f"/></radialGradient>
    <linearGradient id="domi-white" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fffdf8"/><stop offset="1" stop-color="#f1e7d9"/></linearGradient>
    <linearGradient id="domi-cream" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f5d5aa"/><stop offset="1" stop-color="#e4b27c"/></linearGradient>
    <radialGradient id="domi-patch" cx=".5" cy=".45" r=".55"><stop offset="0" stop-color="#f1c792"/><stop offset=".62" stop-color="#f1ca98" stop-opacity=".95"/><stop offset="1" stop-color="#f4d6ae" stop-opacity="0"/></radialGradient>
    <radialGradient id="domi-cap" cx=".5" cy=".35" r=".6"><stop offset="0" stop-color="#eebd85"/><stop offset=".55" stop-color="#f1c994" stop-opacity=".9"/><stop offset="1" stop-color="#f6dcb8" stop-opacity="0"/></radialGradient>
    <radialGradient id="domi-nose" cx=".4" cy=".3" r=".7"><stop offset="0" stop-color="#f8b6b1"/><stop offset="1" stop-color="#e5867f"/></radialGradient>
  </defs>`;
  const WH = "url(#domi-white)", CR = "url(#domi-cream)", PATCH = "url(#domi-patch)", CAP = "url(#domi-cap)";
  // little fur strokes inside a shape, for texture
  function strands(cx, cy, rx, ry, n, col, seed = 1, w = 1.4) {
    let s = "", k = seed;
    const rnd = () => ((k = (k * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < n; i++) {
      const t = rnd() * Math.PI * 2, rr = 0.55 + rnd() * 0.4;
      const x = cx + Math.cos(t) * rx * rr, y = cy + Math.sin(t) * ry * rr;
      const dx = Math.cos(t) * 3, dy = 9 + rnd() * 6;
      s += `M${r1(x)} ${r1(y)} q${r1(dx)} ${r1(dy * 0.5)} ${r1(dx * 0.4)} ${r1(dy)} `;
    }
    return `<path d="${s}" stroke="${col}" stroke-width="${r1(w * 0.75)}" fill="none" stroke-linecap="round" opacity=".45"/>`;
  }
  // a big shiny kitten eye
  const eye = (x, y, rx, ry) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="url(#domi-iris)" stroke="#9a8572" stroke-width="${r1(rx * 0.07)}"/>
    <path d="M${r1(x - rx * 0.98)} ${r1(y - ry * 0.12)} Q${x} ${r1(y - ry * 1.9)} ${r1(x + rx * 0.98)} ${r1(y - ry * 0.12)}" stroke="#7d6655" stroke-width="${r1(rx * 0.09)}" fill="none" stroke-linecap="round" opacity=".5"/>`;
  const pupil = (x, y, rx, ry) => `<ellipse cx="${x}" cy="${r1(y + ry * 0.05)}" rx="${r1(rx * 0.32)}" ry="${r1(ry * 0.42)}" fill="#2c3036"/>
    <circle cx="${r1(x + rx * 0.26)}" cy="${r1(y - ry * 0.28)}" r="${r1(rx * 0.24)}" fill="#fff" opacity=".95"/><circle cx="${r1(x - rx * 0.28)}" cy="${r1(y + ry * 0.3)}" r="${r1(rx * 0.1)}" fill="#fff" opacity=".7"/>`;
  const earTufts = (x, y, a) => `<path d="M${x} ${y} l${r1(Math.cos(a) * 9)} ${r1(Math.sin(a) * 9)} M${x + 3} ${y + 3} l${r1(Math.cos(a + 0.3) * 8)} ${r1(Math.sin(a + 0.3) * 8)} M${x - 3} ${y + 2} l${r1(Math.cos(a - 0.3) * 7)} ${r1(Math.sin(a - 0.3) * 7)}" stroke="#fffdf8" stroke-width="1" stroke-linecap="round" opacity=".9"/>`;

  // ------------------------------------------------------------ side view of a 5-month-old kitten (faces right): big head, small round body, stubby legs
  const LEG = "M-10 0 Q-12 14 -10 22 Q-11 30 1 30 Q12 30 10 22 Q12 14 10 0 Z";
  const leg = (beans, fill = WH) => `${P(LEG, fill)}
    <ellipse cx="1" cy="27" rx="11.5" ry="6.5" fill="${fill}"/><path d="M-3 25 v4 M2 25 v5 M7 25 v4" stroke="${C.shade}" stroke-width="1.2"/>
    ${beans ? `<g class="beans"><ellipse cx="1" cy="30" rx="5" ry="3.8" fill="${C.pink}"/><circle cx="-6" cy="25" r="2.2" fill="${C.pink}"/><circle cx="-1" cy="23" r="2.2" fill="${C.pink}"/><circle cx="4" cy="23" r="2.2" fill="${C.pink}"/><circle cx="8.5" cy="25.5" r="2" fill="${C.pink}"/></g>` : ""}`;
  const SIDE = `${DEFS}
    <ellipse class="d-shadow" cx="0" cy="3" rx="66" ry="7" fill="#2a1d10" opacity=".13"/>
    <g data-p="tail" transform="translate(-48 -50)">
      ${P(fluff(-20, -30, 22, 42, 18, 0.24, -0.6), CR)}${wisps(-20, -30, 22, 42, 34, "#f0cfa3", 9, 0, 6.28, 10)}
      ${strands(-20, -30, 12, 30, 8, C.creamDk, 3)}
      ${P(fluff(-38, -60, 10, 11, 12, 0.3), C.white, 'opacity=".8"')}
    </g>
    <g data-p="legBF" transform="translate(-28 -26)"><g data-p="legBFi">${P(LEG, C.shade)}<ellipse cx="1" cy="27" rx="11" ry="6" fill="${C.shade}"/></g></g>
    <g data-p="legFF" transform="translate(28 -26)"><g data-p="legFFi">${P(LEG, C.shade)}<ellipse cx="1" cy="27" rx="11" ry="6" fill="${C.shade}"/></g></g>
    <g data-p="upper">
      <g data-p="body">
        ${P(fluff(0, -44, 64, 40, 30, 0.16), WH, 'opacity=".55"')}${wisps(0, -44, 64, 40, 44, "#f3eadc", 12, 0, 6.28, 15)}
        ${P(fluff(0, -42, 58, 35, 28, 0.13), WH)}${wisps(0, -42, 58, 35, 34, "#efe4d4", 3, 0.2, 3.0, 12)}
        ${P(fluff(-8, -62, 40, 15, 20, 0.2, -0.05), PATCH)}
        ${P(fluff(-36, -46, 17, 19, 12, 0.22), PATCH)}
        ${strands(-8, -60, 34, 10, 9, C.creamDk, 7)}
        ${strands(0, -30, 44, 12, 10, "#e3d6c4", 11)}
        ${P(fluff(38, -42, 26, 32, 16, 0.2), WH)}${wisps(38, -42, 26, 32, 22, "#efe4d4", 14, -1.2, 2.4, 12)}
        ${strands(36, -40, 14, 20, 7, "#e3d6c4", 5)}
      </g>
      <g data-p="legBN" transform="translate(-24 -24)"><g data-p="legBNi">${P(fluff(-2, 6, 22, 19, 14, 0.22), WH)}${wisps(-2, 6, 22, 19, 16, "#efe4d4", 15, 0.2, 2.9, 10)}${leg(false)}</g></g>
      <g data-p="head" transform="translate(50 -62)">
        <g data-p="headi">
          ${P("M-12 -50 L-10 -100 L22 -70 Z", CR)}${P("M-6 -56 L-6 -88 L14 -70 Z", C.pink)}${earTufts(-2, -66, -1.9)}
          ${P("M38 -74 L62 -104 L68 -58 Z", CR)}${P("M44 -72 L60 -96 L62 -62 Z", C.pink)}${earTufts(56, -70, -1.4)}
          ${P(fluff(22, -8, 60, 44, 26, 0.18), WH)}${wisps(22, -8, 60, 44, 36, "#efe4d4", 5, 0.1, 3.0, 14)}
          ${P(fluff(26, -34, 48, 42, 28, 0.13), WH)}
          ${P(fluff(24, -60, 40, 20, 18, 0.2), CAP)}
          <path d="M14 -66 q2 8 0 14 M24 -68 q0 8 -1 15 M34 -66 q-2 8 0 14" stroke="${C.creamDk}" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".3"/>
          ${strands(26, -12, 40, 18, 12, "#e3d6c4", 13)}
          ${P(fluff(30, -12, 22, 12, 14, 0.2), WH)}
          <ellipse cx="2" cy="-18" rx="9" ry="5" fill="${C.pink}" opacity=".4"/><ellipse cx="56" cy="-18" rx="8" ry="5" fill="${C.pink}" opacity=".4"/>
          <g data-p="eyes">
            <g data-p="open">${eye(13, -34, 11, 12.5)}${eye(45, -34, 11, 12.5)}
              <g data-p="pupils">${pupil(13, -34, 11, 12.5)}${pupil(45, -34, 11, 12.5)}</g>
            </g>
            <g data-p="closed" opacity="0"><path d="M3 -33 Q13 -25 23 -33 M35 -33 Q45 -25 55 -33" stroke="${C.line}" stroke-width="2.6" fill="none" stroke-linecap="round"/><path d="M4 -31 l-4 3 M54 -31 l4 3" stroke="${C.line}" stroke-width="1.6" stroke-linecap="round"/></g>
          </g>
          <path d="M25 -20 h8 q1 0 0 1.4 l-3.4 3.6 q-0.6 0.6 -1.2 0 l-3.4 -3.6 q-1 -1.4 0 -1.4 z" fill="url(#domi-nose)"/>
          <path d="M29 -14 v2 M29 -12 q-3 4 -7 1.5 M29 -12 q3 4 7 1.5" stroke="${C.line}" stroke-width="1.4" fill="none" stroke-linecap="round"/>
          <path d="M12 -14 L-16 -18 M12 -11 L-15 -8 M13 -8 L-12 1 M46 -14 L76 -18 M46 -11 L75 -8 M45 -8 L72 1" stroke="${C.whisker}" stroke-width=".8" opacity=".8"/>
        </g>
      </g>
      <g data-p="legFN" transform="translate(36 -26)"><g data-p="legFNi">${leg(true)}</g></g>
    </g>`;

  function rig(parent) {
    const g = document.createElementNS(NS, "g");
    g.setAttribute("class", "domi");
    g.innerHTML = SIDE;
    parent.appendChild(g);
    const q = (n) => g.querySelector(`[data-p="${n}"]`);
    const parts = {};
    ["tail", "legBFi", "legFFi", "upper", "legBNi", "legFNi", "head", "headi", "open", "closed", "pupils", "body"].forEach((n) => (parts[n] = q(n)));
    parts.beans = g.querySelector(".beans");
    const st = { x: 0, y: 0, s: 1, flip: false, phase: 0, speed: 0, swat: 0, crouch: 0, pet: 0, sleep: 0, blink: 0, lookX: 0, lookY: 0, tilt: 0, wag: 0, t: 0 };
    function apply() {
      const { phase, speed, swat, crouch, pet, sleep } = st;
      g.setAttribute("transform", `translate(${r1(st.x)} ${r1(st.y)}) scale(${r1(st.flip ? -st.s * 100 : st.s * 100) / 100} ${r1(st.s * 100) / 100})`);
      const sw = (o) => Math.sin(phase + o) * 24 * speed;
      const legK = 1 - 0.35 * crouch - 0.85 * sleep;
      const legT = (deg) => `rotate(${r1(deg)}) scale(1 ${r1(legK * 100) / 100})`;
      parts.legBFi.setAttribute("transform", legT(sw(Math.PI)));
      parts.legFFi.setAttribute("transform", legT(sw(0)));
      parts.legBNi.setAttribute("transform", legT(sw(0)));
      parts.legFNi.setAttribute("transform", `rotate(${r1(sw(Math.PI) * (1 - swat) - 115 * swat)}) scale(1 ${r1(lerp(legK, 1, swat) * 100) / 100})`);
      const bob = -Math.abs(Math.sin(phase)) * 3 * speed + 10 * crouch + 18 * sleep - 4 * swat;
      const wiggle = crouch * Math.sin(st.t * 22) * 2;
      parts.upper.setAttribute("transform", `translate(${r1(wiggle)} ${r1(bob)}) rotate(${r1(-6 * swat + 4 * crouch)})`);
      const purr = pet > 0.5 && !reduce ? Math.sin(st.t * 40) * 0.6 : 0;
      parts.head.setAttribute("transform", `translate(${r1(50 - 4 * sleep)} ${r1(-62 + 14 * sleep + 4 * crouch + purr)}) rotate(${r1(st.tilt + 10 * pet + 16 * sleep - 10 * swat)})`);
      const wagA = reduce ? 0 : Math.sin(st.t * (2 + 6 * st.wag)) * (6 + 16 * st.wag);
      parts.tail.setAttribute("transform", `translate(-48 ${r1(-50 + 16 * sleep)}) rotate(${r1(wagA + 40 * sleep - 10 * crouch)})`);
      if (parts.beans) parts.beans.setAttribute("opacity", swat > 0.3 ? 1 : 0);
      const closed = Math.max(pet, sleep, st.blink);
      parts.open.setAttribute("opacity", closed > 0.5 ? 0 : 1);
      parts.closed.setAttribute("opacity", closed > 0.5 ? 1 : 0);
      parts.pupils.setAttribute("transform", `translate(${r1(clamp(st.lookX, -1, 1) * 2.4)} ${r1(clamp(st.lookY, -1, 1) * 2)})`);
    }
    return { g, st, apply };
  }

  // ------------------------------------------------------------ sitting, facing you
  function front() {
    return `<g class="domi-front">${DEFS}
      <ellipse cx="0" cy="6" rx="70" ry="9" fill="#2a1d10" opacity=".12"/>
      <g class="df-tail">${P(fluff(60, -26, 23, 40, 18, 0.24, 0.9), CR)}${wisps(60, -26, 23, 40, 30, "#f0cfa3", 7, 0, 6.28, 10)}${strands(58, -26, 12, 26, 7, C.creamDk, 2)}${P(fluff(78, -46, 10, 11, 12, 0.28), C.white, 'opacity=".8"')}</g>
      ${P(fluff(0, -44, 68, 56, 30, 0.16), WH, 'opacity=".55"')}${wisps(0, -44, 68, 56, 46, "#f3eadc", 16, 0, 6.28, 16)}
      ${P(fluff(0, -44, 60, 50, 30, 0.12), WH)}${wisps(0, -44, 60, 50, 40, "#efe4d4", 4, 0.3, 2.85, 13)}
      ${P(fluff(-38, -50, 20, 28, 14, 0.2), PATCH)}${P(fluff(40, -52, 18, 26, 14, 0.2), PATCH)}
      ${P(fluff(0, -54, 42, 48, 24, 0.16), WH)}${wisps(0, -54, 42, 48, 30, "#e9dfcf", 18, 0.4, 2.7, 14)}
      ${strands(0, -46, 28, 32, 14, "#e2d5c2", 9)}
      ${P(fluff(-20, -4, 18, 11, 14, 0.22), WH)}${P(fluff(20, -4, 18, 11, 14, 0.22), WH)}
      <path d="M-27 -6 v6 M-20 -5 v7 M-13 -6 v6 M13 -6 v6 M20 -5 v7 M27 -6 v6" stroke="${C.shade}" stroke-width="1.8"/>
      <g class="df-head">
        ${P("M-80 -150 L-76 -226 L-26 -182 Z", CR)}${P("M-70 -160 L-68 -210 L-36 -182 Z", C.pink)}${earTufts(-62, -176, -1.9)}${earTufts(-56, -168, -1.7)}
        ${P("M80 -150 L76 -226 L26 -182 Z", CR)}${P("M70 -160 L68 -210 L36 -182 Z", C.pink)}${earTufts(62, -176, -1.25)}${earTufts(56, -168, -1.45)}
        ${P(fluff(0, -102, 104, 58, 34, 0.16), WH)}${wisps(0, -102, 104, 58, 50, "#efe4d4", 6, -0.3, 3.45, 17)}
        ${P(fluff(0, -128, 86, 72, 34, 0.12), WH)}
        ${P(fluff(0, -172, 66, 32, 22, 0.2), CAP)}
        <path d="M-14 -186 q3 12 0 20 M0 -190 q0 12 -1 21 M14 -186 q-3 12 0 20" stroke="${C.creamDk}" stroke-width="2" fill="none" stroke-linecap="round" opacity=".3"/>
        ${strands(0, -96, 74, 30, 16, "#e3d6c4", 21)}
        ${P(fluff(0, -98, 36, 22, 18, 0.18), WH)}
        <ellipse cx="-50" cy="-104" rx="14" ry="8" fill="${C.pink}" opacity=".4"/><ellipse cx="50" cy="-104" rx="14" ry="8" fill="${C.pink}" opacity=".4"/>
        <g class="df-eyes">
          <g class="df-open">${eye(-32, -128, 21, 23)}${eye(32, -128, 21, 23)}
            <g class="df-pupils">${pupil(-32, -128, 21, 23)}${pupil(32, -128, 21, 23)}</g>
          </g>
          <g class="df-closed"><path d="M-50 -126 Q-32 -112 -14 -126 M14 -126 Q32 -112 50 -126" stroke="${C.line}" stroke-width="3.6" fill="none" stroke-linecap="round"/><path d="M-50 -124 l-6 4 M50 -124 l6 4" stroke="${C.line}" stroke-width="2.4" stroke-linecap="round"/></g>
        </g>
        <path d="M-8 -104 h16 q2 0 0.6 2.4 l-6.4 6.6 q-1.6 1.4 -3 0 l-6.4 -6.6 q-1.4 -2.4 0.6 -2.4 z" fill="url(#domi-nose)"/>
        <path d="M0 -95 v3 M0 -92 q-5 7 -12 3 M0 -92 q5 7 12 3" stroke="${C.line}" stroke-width="2" fill="none" stroke-linecap="round"/>
        <path d="M-26 -98 L-80 -106 M-26 -93 L-80 -88 M-24 -88 L-74 -72 M26 -98 L80 -106 M26 -93 L80 -88 M24 -88 L74 -72" stroke="${C.whisker}" stroke-width="1" opacity=".8"/>
      </g>
    </g>`;
  }

  // ------------------------------------------------------------ a purr, synthesized (only after you've clicked something)
  let audio = null, purrGain = null, armed = false;
  window.addEventListener("pointerdown", () => (armed = true), { once: true });
  function purr(on) {
    if (!armed || reduce) return;
    try {
      if (!audio) {
        audio = new (window.AudioContext || window.webkitAudioContext)();
        const len = audio.sampleRate * 2, buf = audio.createBuffer(1, len, audio.sampleRate), d = buf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * 0.6;
        const src = audio.createBufferSource(); src.buffer = buf; src.loop = true;
        const lp = audio.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 180;
        const am = audio.createGain(); am.gain.value = 0;
        const lfo = audio.createOscillator(); lfo.frequency.value = 24; const lg = audio.createGain(); lg.gain.value = 0.5;
        lfo.connect(lg).connect(am.gain);
        purrGain = audio.createGain(); purrGain.gain.value = 0;
        src.connect(lp).connect(am).connect(purrGain).connect(audio.destination);
        src.start(); lfo.start();
      }
      purrGain.gain.setTargetAtTime(on ? 0.22 : 0, audio.currentTime, 0.15);
    } catch (e) { /* no sound, no problem */ }
  }

  // little floating hearts and words
  function pop(x, y, text, cls = "") {
    const s = document.createElement("span");
    s.className = "domi-pop " + cls;
    s.textContent = text;
    s.style.left = x + "px"; s.style.top = y + "px";
    s.style.setProperty("--dx", (Math.random() * 40 - 20).toFixed(0) + "px");
    document.body.appendChild(s);
    setTimeout(() => s.remove(), 1500);
  }
  const MEOWS = ["mrrp?", "meow!", "mew ♡", "prrrt", "MEOW", "mrow?"];


  // ------------------------------------------------------------ Domi standing up to peek inside something (paws up, back to you)
  function stand() {
    return `<g class="domi-stand">${DEFS}
      <ellipse cx="2" cy="3" rx="40" ry="5" fill="#2a1d10" opacity=".12"/>
      <g class="ds-tail">${P(fluff(40, -14, 18, 31, 16, 0.26, 1.05), CR)}${wisps(40, -14, 18, 31, 24, "#f0cfa3", 20, 0, 6.28, 9)}${strands(38, -14, 9, 18, 6, C.creamDk, 4)}${P(fluff(56, -22, 8, 9, 10, 0.3), C.white, 'opacity=".8"')}</g>
      ${P(fluff(2, -40, 38, 45, 26, 0.16), WH, 'opacity=".55"')}${wisps(2, -40, 38, 45, 34, "#f3eadc", 19, 0, 6.28, 13)}
      ${P(fluff(2, -40, 33, 41, 26, 0.14), WH)}${wisps(2, -40, 33, 41, 28, "#efe4d4", 2, -0.6, 3.6, 11)}
      ${P(fluff(12, -54, 17, 16, 14, 0.22), PATCH)}${P(fluff(17, -30, 11, 10, 12, 0.24), PATCH)}
      ${strands(2, -40, 22, 28, 10, "#e2d5c2", 6)}
      ${P(fluff(-8, -4, 12, 7, 10, 0.24), WH)}${P(fluff(14, -4, 11, 6, 10, 0.24), WH)}
      <g class="ds-arm">
        ${P(fluff(-22, -80, 8, 18, 12, 0.22, 0.6), WH)}${P(fluff(-12, -82, 8, 18, 12, 0.22, 0.45), WH)}
        ${P(fluff(-34, -96, 9, 7, 10, 0.24), WH)}${P(fluff(-22, -100, 9, 7, 10, 0.24), WH)}
        <path d="M-37 -100 v4 M-33 -101 v5 M-25 -104 v4 M-21 -105 v5" stroke="${C.shade}" stroke-width="1"/>
      </g>
      <g class="ds-head">
        ${P("M-48 -132 L-50 -172 L-22 -150 Z", CR)}${P("M-44 -136 L-45 -164 L-28 -150 Z", C.pink)}${earTufts(-40, -146, -1.8)}
        ${P("M8 -150 L22 -176 L28 -136 Z", CR)}${P("M12 -148 L21 -168 L24 -140 Z", C.pink)}${earTufts(20, -150, -1.35)}
        ${P(fluff(-12, -104, 50, 30, 24, 0.18), WH)}${wisps(-12, -104, 50, 30, 30, "#efe4d4", 8, 0, 3.14, 13)}
        ${P(fluff(-12, -120, 40, 36, 26, 0.14), WH)}
        ${P(fluff(-12, -144, 34, 17, 16, 0.22), CAP)}
        <path d="M-20 -150 q2 7 0 12 M-12 -152 q0 8 -1 13 M-4 -150 q-2 7 0 12" stroke="${C.creamDk}" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".3"/>
        ${strands(-12, -106, 34, 14, 10, "#e3d6c4", 8)}
        ${eye(-27, -118, 8.5, 9.5)}${eye(1, -118, 8.5, 9.5)}
        <ellipse cx="-29" cy="-115" rx="2.8" ry="4.2" fill="#2c3036"/><ellipse cx="-1" cy="-115" rx="2.8" ry="4.2" fill="#2c3036"/>
        <circle cx="-26.5" cy="-120" r="2.6" fill="#fff"/><circle cx="1.5" cy="-120" r="2.6" fill="#fff"/><circle cx="-31" cy="-112" r="1.1" fill="#fff"/><circle cx="-3" cy="-112" r="1.1" fill="#fff"/>
        <path d="M-17 -103 h7 q1 0 0.4 1.2 l-3.2 3.2 q-0.6 0.6 -1.2 0 l-3.2 -3.2 q-0.6 -1.2 0.4 -1.2 z" fill="url(#domi-nose)"/>
        <path d="M-13.5 -98.5 q-3 4 -7 1.5 M-13.5 -98.5 q3 4 7 1.5" stroke="${C.line}" stroke-width="1.3" fill="none" stroke-linecap="round"/>
        <ellipse cx="-40" cy="-104" rx="7" ry="4" fill="${C.pink}" opacity=".45"/><ellipse cx="14" cy="-104" rx="7" ry="4" fill="${C.pink}" opacity=".45"/>
        <path d="M-28 -102 L-58 -106 M-28 -99 L-56 -94 M2 -102 L30 -106 M2 -99 L28 -94" stroke="${C.whisker}" stroke-width=".8" opacity=".8"/>
      </g>
    </g>`;
  }

  // ------------------------------------------------------------ Shiqi and Domi asleep, cuddled up under a white blanket
  function sleepy() {
    return `<g class="sleepy-art">
      <rect width="420" height="540" rx="18" fill="#f3efe9"/>
      ${P("M0 0 H330 Q300 70 210 100 Q110 130 40 200 Q20 215 0 220 Z", "#5d534c")}
      ${P("M250 0 H420 V140 Q360 60 250 40 Z", "#e9e6e1")}
      ${P(fluff(70, 300, 90, 110, 26, 0.12), "#fbf9f5")}
      <g>${P("M150 110 Q250 40 360 80 Q430 120 420 300 V540 H340 Q360 420 340 340 Q330 260 300 210 Q250 160 180 180 Z", "#1b1719")}</g>
      <g transform="rotate(-14 290 255)">
        <ellipse cx="290" cy="262" rx="72" ry="92" fill="#f1d1bc"/>
        ${P("M212 236 Q214 150 300 150 Q376 156 372 250 Q352 196 300 192 Q250 188 228 232 Z", "#1b1719")}
        ${P("M214 226 Q206 300 226 330 L214 232 Z", "#1b1719")}
        <path d="M246 252 Q260 262 276 254 M306 250 Q320 260 336 252" stroke="#3a2a28" stroke-width="2.8" fill="none" stroke-linecap="round"/>
        <path d="M248 256 l-4 5 M256 259 l-2 6 M310 254 l-3 6 M318 257 l-1 6" stroke="#3a2a28" stroke-width="1.4"/>
        <path d="M292 262 Q286 290 296 298" stroke="#d6a993" stroke-width="2" fill="none" stroke-linecap="round"/>
        <path d="M276 318 Q292 326 308 316 Q292 330 276 318 Z" fill="#c97d76"/>
        <ellipse cx="248" cy="290" rx="13" ry="7" fill="#efa59c" opacity=".35"/>
      </g>
      ${P("M0 330 Q70 280 150 300 Q210 320 250 400 Q266 440 250 462 Q230 476 214 456 Q186 392 140 372 Q80 352 0 384 Z", "#f0cdb4")}
      <path d="M232 446 q8 -4 14 4 M222 452 q8 -2 12 8" stroke="#d9ae96" stroke-width="2" fill="none"/>
      <g transform="translate(196 292)">
        ${P(fluff(0, 0, 66, 58, 28, 0.16), C.white)}
        ${P("M-48 -30 L-44 -78 L-14 -48 Z", C.cream)}${P("M-42 -36 L-41 -66 L-22 -48 Z", C.pink)}
        ${P(fluff(-6, -34, 42, 18, 18, 0.2), C.cream)}
        ${P(fluff(4, 18, 30, 18, 14, 0.18), C.white)}
        <path d="M-30 -4 Q-20 4 -10 -4 M8 -6 Q18 2 28 -6" stroke="${C.line}" stroke-width="2.6" fill="none" stroke-linecap="round"/>
        ${P("M-4 8 h10 l-5 6 z", C.nose)}
        <path d="M1 14 q-4 5 -9 2 M1 14 q4 5 9 2" stroke="${C.line}" stroke-width="1.6" fill="none"/>
      </g>
      ${P(fluff(150, 470, 120, 70, 26, 0.14), C.white)}
      <g transform="translate(70 470) rotate(-14)">${P(fluff(0, 0, 40, 32, 18, 0.18), C.white)}
        <ellipse cx="2" cy="8" rx="13" ry="10" fill="${C.pink}"/><circle cx="-16" cy="-10" r="6" fill="${C.pink}"/><circle cx="-4" cy="-17" r="6" fill="${C.pink}"/><circle cx="10" cy="-16" r="6" fill="${C.pink}"/><circle cx="20" cy="-6" r="5.5" fill="${C.pink}"/></g>
      ${P(fluff(360, 480, 110, 80, 26, 0.12), "#ffffff")}
      <text x="30" y="70" font-family="Caveat, cursive" font-size="34" fill="#f3efe9" opacity=".9">zzz…</text>
    </g>`;
  }

  window.Domi = { rig, front, stand, sleepy, fluff, strands, C, purr, pop, MEOWS };

  // ------------------------------------------------------------ the hero Domi: pet her, she watches your yarn
  document.addEventListener("DOMContentLoaded", () => {
    const hero = document.getElementById("hero-domi");
    if (hero) {
      hero.innerHTML = `<svg viewBox="-120 -230 240 250" class="domi-svg" role="img" aria-label="Domi, Shiqi's cream and white British longhair cat">${front()}</svg>`;
      const pupils = hero.querySelector(".df-pupils");
      const head = hero.querySelector(".df-head");
      let petting = 0, strokes = 0, lastX = null, lastHeart = 0;
      window.addEventListener("pointermove", (e) => {
        const r = hero.getBoundingClientRect();
        const cx = r.left + r.width / 2, cy = r.top + r.height * 0.35;
        const dx = clamp((e.clientX - cx) / 300, -1, 1), dy = clamp((e.clientY - cy) / 300, -1, 1);
        pupils.setAttribute("transform", `translate(${r1(dx * 5)} ${r1(dy * 3)})`);
        head.style.transform = `rotate(${r1(dx * 6)}deg)`;
      }, { passive: true });
      hero.addEventListener("pointermove", (e) => {
        if (lastX !== null) strokes += Math.abs(e.clientX - lastX);
        lastX = e.clientX;
        if (strokes > 60) {
          hero.classList.add("petted");
          purr(true);
          const now = performance.now();
          if (now - lastHeart > 260) { lastHeart = now; pop(e.clientX, e.clientY - 20, Math.random() < 0.25 ? "prrr" : "♡", "heart"); }
          clearTimeout(petting);
          petting = setTimeout(() => { hero.classList.remove("petted"); purr(false); strokes = 0; }, 900);
        }
      });
      hero.addEventListener("pointerleave", () => { lastX = null; });
      const meow = (e) => {
        const r = hero.getBoundingClientRect();
        pop(r.left + r.width * 0.5, r.top + 10, MEOWS[Math.floor(Math.random() * MEOWS.length)], "bubble");
        hero.classList.remove("hop"); void hero.offsetWidth; hero.classList.add("hop");
      };
      hero.addEventListener("click", meow);
      hero.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); meow(); } });
      // blink now and then
      setInterval(() => { hero.classList.add("blink"); setTimeout(() => hero.classList.remove("blink"), 160); }, 3800);
    }

    const md = document.getElementById("mail-domi");
    if (md) md.innerHTML = stand();
    const sl = document.getElementById("sleepy");
    if (sl) sl.innerHTML = `<svg viewBox="0 0 420 540" role="img" aria-label="Drawing of Shiqi and Domi asleep">${sleepy()}</svg>`;

    // the photos at the end develop like instant film when they scroll into view
    const io = new IntersectionObserver((ens) => ens.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("dev"); io.unobserve(en.target); } }), { threshold: 0.45 });
    document.querySelectorAll(".reveal .polaroid").forEach((p, i) => { p.style.setProperty("--d", i * 0.2 + "s"); io.observe(p); });

    // ------------------------------------------------------------ the little Domi along the bottom of the screen
    const wrap = document.createElement("div");
    wrap.className = "domi-walk";
    wrap.setAttribute("aria-hidden", "true");
    wrap.innerHTML = `<svg class="domi-walk-svg"></svg>`;
    document.body.appendChild(wrap);
    const svg = wrap.querySelector("svg");
    const hit = document.createElementNS(NS, "rect");
    const D = rig(svg);
    D.g.style.pointerEvents = "auto";
    D.g.style.cursor = "pointer";
    let W = innerWidth, H = 170;
    const S = () => (innerWidth < 700 ? 0.5 : 0.64);
    const resize = () => { W = innerWidth; svg.setAttribute("viewBox", `0 0 ${W} ${H}`); svg.setAttribute("width", W); svg.setAttribute("height", H); };
    window.addEventListener("resize", resize); resize();
    const st = D.st;
    st.x = W * 0.15; st.y = H - 6; st.s = S();
    let mx = -1, my = -1, lastMove = 0, vx = 0, petT = 0, swatT = 0, nextBlink = 2, hidden = true, wander = W * 0.3, lastHeart = 0;
    window.addEventListener("pointermove", (e) => { if (e.pointerType === "mouse") { mx = e.clientX; my = e.clientY; lastMove = performance.now(); } }, { passive: true });
    // petting: rub the cursor back and forth over her
    let rub = 0, rx = null;
    D.g.addEventListener("pointermove", (e) => {
      if (rx !== null) rub += Math.abs(e.clientX - rx);
      rx = e.clientX;
      if (rub > 50) {
        petT = 1;
        const now = performance.now();
        if (now - lastHeart > 300) { lastHeart = now; pop(e.clientX, e.clientY - 20, Math.random() < 0.3 ? "prrr" : "♡", "heart"); }
      }
    });
    D.g.addEventListener("pointerleave", () => { rx = null; rub = 0; });
    D.g.addEventListener("click", (e) => { pop(e.clientX, e.clientY - 40, MEOWS[Math.floor(Math.random() * MEOWS.length)], "bubble"); swatT = 0.5; });
    // she hides while the big Domis are on screen (hero, the sweater story, the photo at the end)
    const hideFor = new Set();
    ["top", "garment", "reveal"].forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      new IntersectionObserver(([en]) => { if (en.isIntersecting) hideFor.add(id); else hideFor.delete(id); }, { threshold: 0.15 }).observe(el);
    });
    let last = performance.now(), purring = false;
    function tick(now) {
      requestAnimationFrame(tick);
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      st.t += dt;
      const want = hideFor.size === 0 && !document.querySelector("dialog[open]") && !wrap.classList.contains("off");
      if (want === hidden) { hidden = !want; wrap.classList.toggle("gone", hidden); }
      if (hidden) { if (purring) { purr(false); purring = false; } return; }
      st.s = S();
      const idle = (now - lastMove) / 1000;
      // where to go: toward the yarn ball, or wander, or nap
      let target = st.x;
      const chasing = fine && mx >= 0 && idle < 4;
      if (chasing) target = mx - (st.flip ? -40 : 40) * st.s;
      else if (idle > 14 || !fine) { if (Math.abs(wander - st.x) < 10 && Math.random() < 0.004) wander = 60 + Math.random() * (W - 120); target = fine ? st.x : wander; }
      const dx = target - st.x;
      const sp = Math.abs(dx) > 14 ? clamp(Math.abs(dx) * 3, 0, 380) : 0;
      vx = lerp(vx, Math.sign(dx) * sp, 0.08);
      st.x = clamp(st.x + vx * dt, 40, W - 40);
      if (Math.abs(vx) > 8) st.flip = vx < 0;
      st.speed = clamp(Math.abs(vx) / 220, 0, 1);
      st.phase += dt * (6 + 10 * st.speed) * (st.speed > 0.02 ? 1 : 0);
      // yarn ball close and low? crouch and swat at it
      const near = chasing && Math.abs(mx - st.x) < 110 && my > innerHeight - 260;
      st.crouch = lerp(st.crouch, near && st.speed < 0.3 ? 1 : 0, 0.1);
      if (near && my > innerHeight - 170) swatT = Math.max(swatT, 0.35);
      swatT = Math.max(0, swatT - dt);
      st.swat = lerp(st.swat, swatT > 0 ? 1 : 0, 0.3);
      petT = Math.max(0, petT - dt * 0.8);
      st.pet = lerp(st.pet, petT > 0.2 ? 1 : 0, 0.15);
      if ((st.pet > 0.5) !== purring) { purring = st.pet > 0.5; purr(purring); }
      st.sleep = lerp(st.sleep, fine && idle > 14 && st.speed < 0.05 && st.pet < 0.2 ? 1 : 0, 0.03);
      st.wag = chasing ? clamp(st.speed + st.crouch, 0, 1) : 0.1;
      // look at the yarn ball
      if (fine && mx >= 0) {
        const hx = st.x + (st.flip ? -1 : 1) * 76 * st.s, hy = innerHeight - H + st.y - 96 * st.s;
        st.lookX = ((mx - hx) / 200) * (st.flip ? -1 : 1);
        st.lookY = (my - hy) / 200;
        st.tilt = clamp(-(my - hy) / 30, -14, 6) * (1 - st.sleep);
      }
      nextBlink -= dt;
      st.blink = nextBlink < 0.14 && nextBlink > 0 ? 1 : 0;
      if (nextBlink < 0) nextBlink = 2 + Math.random() * 4;
      if (st.sleep > 0.9 && Math.random() < dt * 0.4) pop(st.x + (st.flip ? -50 : 50) * st.s, innerHeight - 90 * st.s - 40, "z", "zzz");
      D.apply();
    }
    requestAnimationFrame(tick);

    // the little "let Domi roam" toggle
    const tog = document.getElementById("domi-toggle");
    if (tog) tog.addEventListener("click", () => {
      const off = wrap.classList.toggle("off");
      tog.setAttribute("aria-pressed", String(!off));
      tog.querySelector("span").textContent = off ? "Call Domi back" : "Domi is roaming";
    });
  });
})();
