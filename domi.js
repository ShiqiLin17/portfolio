// Domi: Shiqi's cream-and-white British longhair, drawn in SVG.
// window.Domi.rig(parentSvgGroup) builds a posable side-view Domi.
// window.Domi.front() returns markup for Domi sitting and facing you.
// It also runs the little Domi who trots along the bottom of the page and
// chases your ball of yarn (the cursor), and the Domi in the hero you can pet.
(function () {
  const NS = "http://www.w3.org/2000/svg";
  const C = { white: "#fffaf3", shade: "#efe5d6", cream: "#f0cb9b", creamDk: "#e0ae76", pink: "#f4aba8", nose: "#ea918d", eye: "#a9b07a", pupil: "#2d3124", line: "#7d6655", whisker: "#d7cdbf" };
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = window.matchMedia("(pointer: fine)").matches;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const r1 = (v) => Math.round(v * 10) / 10;

  // A fluffy outline: an ellipse with little tufts all the way round.
  function fluff(cx, cy, rx, ry, n = 22, a = 0.13, rot = 0) {
    const cr = Math.cos(rot), sr = Math.sin(rot);
    const pt = (t, k) => {
      const x = rx * k * Math.cos(t), y = ry * k * Math.sin(t);
      return [r1(cx + x * cr - y * sr), r1(cy + x * sr + y * cr)];
    };
    let d = "";
    for (let i = 0; i < n; i++) {
      const t = (i / n) * Math.PI * 2, t2 = ((i + 0.5) / n) * Math.PI * 2, t3 = ((i + 1) / n) * Math.PI * 2;
      const p = pt(t, 1), c = pt(t2, 1 + a * (i % 3 === 0 ? 1.4 : 1)), q = pt(t3, 1);
      d += (i ? "" : `M${p[0]} ${p[1]}`) + ` Q${c[0]} ${c[1]} ${q[0]} ${q[1]}`;
    }
    return d + "Z";
  }
  const P = (d, fill, extra = "") => `<path d="${d}" fill="${fill}" ${extra}/>`;

  // ------------------------------------------------------------ side view (faces right)
  const leg = (beans) => `${P("M-12 0 Q-15 22 -12 36 Q-13 45 1 45 Q14 45 12 36 Q15 22 12 0 Z", C.white)}
    <ellipse cx="2" cy="42" rx="14" ry="7" fill="${C.white}"/>
    ${beans ? `<g class="beans"><ellipse cx="2" cy="44" rx="6" ry="4.5" fill="${C.pink}"/><circle cx="-7" cy="38" r="2.6" fill="${C.pink}"/><circle cx="-1" cy="36" r="2.6" fill="${C.pink}"/><circle cx="6" cy="36" r="2.6" fill="${C.pink}"/><circle cx="11" cy="39" r="2.4" fill="${C.pink}"/></g>` : ""}`;
  const SIDE = `
    <ellipse class="d-shadow" cx="0" cy="3" rx="96" ry="9" fill="#2a1d10" opacity=".13"/>
    <g data-p="tail" transform="translate(-74 -74)">
      ${P(fluff(-34, -44, 24, 56, 20, 0.2, -0.6), C.cream)}
      ${P(fluff(-38, -56, 12, 34, 14, 0.2, -0.6), C.creamDk, 'opacity=".35"')}
      ${P(fluff(-58, -86, 13, 14, 12, 0.25), C.white, 'opacity=".75"')}
    </g>
    <g data-p="legBF" transform="translate(-46 -40)"><g data-p="legBFi">${P("M-12 0 Q-15 22 -12 36 Q-13 45 1 45 Q14 45 12 36 Q15 22 12 0 Z", C.shade)}</g></g>
    <g data-p="legFF" transform="translate(44 -40)"><g data-p="legFFi">${P("M-12 0 Q-15 22 -12 36 Q-13 45 1 45 Q14 45 12 36 Q15 22 12 0 Z", C.shade)}</g></g>
    <g data-p="upper">
      <g data-p="body">
        ${P(fluff(0, -62, 84, 46, 30, 0.1), C.white)}
        ${P(fluff(-10, -90, 66, 22, 22, 0.16, -0.05), C.cream)}
        ${P(fluff(-58, -66, 25, 27, 14, 0.18), C.cream)}
        ${P(fluff(10, -74, 22, 14, 12, 0.2, 0.3), C.cream, 'opacity=".85"')}
        ${P(fluff(0, -30, 70, 12, 22, 0.25), C.shade, 'opacity=".55"')}
        ${P(fluff(68, -60, 26, 34, 16, 0.16), C.white)}
      </g>
      <g data-p="legBN" transform="translate(-40 -38)"><g data-p="legBNi">${P(fluff(-2, 8, 24, 22, 14, 0.18), C.white)}${leg(false)}</g></g>
      <g data-p="legFN" transform="translate(58 -42)"><g data-p="legFNi">${leg(true)}</g></g>
      <g data-p="head" transform="translate(86 -92)">
        <g data-p="headi">
          ${P(fluff(8, -4, 46, 40, 24, 0.16), C.white)}
          ${P("M-8 -46 L-1 -84 L20 -56 Z", C.cream)}${P("M-2 -50 L1 -74 L13 -57 Z", C.pink)}
          ${P("M30 -60 L48 -86 L54 -50 Z", C.cream)}${P("M35 -59 L47 -78 L49 -54 Z", C.pink)}
          ${P(fluff(24, -26, 38, 33, 24, 0.12), C.white)}
          ${P(fluff(22, -48, 30, 14, 16, 0.18), C.cream)}
          ${P(fluff(1, -38, 12, 12, 10, 0.2), C.cream, 'opacity=".8"')}
          ${P(fluff(30, -10, 22, 13, 14, 0.18), C.white)}
          <ellipse cx="10" cy="-14" rx="7" ry="4" fill="${C.pink}" opacity=".35"/><ellipse cx="46" cy="-14" rx="6" ry="4" fill="${C.pink}" opacity=".35"/>
          <g data-p="eyes">
            <g data-p="open">
              <ellipse cx="16" cy="-27" rx="7.5" ry="6.6" fill="${C.eye}" stroke="${C.line}" stroke-width="1.4"/>
              <ellipse cx="40" cy="-27" rx="7.5" ry="6.6" fill="${C.eye}" stroke="${C.line}" stroke-width="1.4"/>
              <g data-p="pupils"><ellipse cx="16" cy="-27" rx="2.6" ry="5.4" fill="${C.pupil}"/><ellipse cx="40" cy="-27" rx="2.6" ry="5.4" fill="${C.pupil}"/>
              <circle cx="18" cy="-30" r="1.8" fill="#fff"/><circle cx="42" cy="-30" r="1.8" fill="#fff"/></g>
            </g>
            <g data-p="closed" opacity="0"><path d="M9 -27 Q16 -21 23 -27 M33 -27 Q40 -21 47 -27" stroke="${C.line}" stroke-width="2.2" fill="none" stroke-linecap="round"/></g>
          </g>
          ${P("M24 -18 h8 l-4 5 z", C.nose)}
          <path d="M28 -13 q-3 5 -8 2 M28 -13 q3 5 8 2" stroke="${C.line}" stroke-width="1.6" fill="none" stroke-linecap="round"/>
          <path d="M14 -12 L-14 -16 M14 -9 L-12 -6 M42 -12 L72 -16 M42 -9 L70 -5" stroke="${C.whisker}" stroke-width="1.1"/>
        </g>
      </g>
    </g>`;

  function rig(parent) {
    const g = document.createElementNS(NS, "g");
    g.setAttribute("class", "domi");
    g.innerHTML = SIDE;
    parent.appendChild(g);
    const q = (n) => g.querySelector(`[data-p="${n}"]`);
    const parts = {};
    ["tail", "legBFi", "legFFi", "upper", "legBNi", "legFNi", "head", "headi", "open", "closed", "pupils", "body"].forEach((n) => (parts[n] = q(n)));
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
      const bob = -Math.abs(Math.sin(phase)) * 3 * speed + 15 * crouch + 30 * sleep - 4 * swat;
      const wiggle = crouch * Math.sin(st.t * 22) * 2;
      parts.upper.setAttribute("transform", `translate(${r1(wiggle)} ${r1(bob)}) rotate(${r1(-6 * swat + 4 * crouch)})`);
      const purr = pet > 0.5 && !reduce ? Math.sin(st.t * 40) * 0.6 : 0;
      parts.head.setAttribute("transform", `translate(${r1(86 - 6 * sleep)} ${r1(-92 + 22 * sleep + 6 * crouch + purr)}) rotate(${r1(st.tilt + 10 * pet + 16 * sleep - 10 * swat)})`);
      const wagA = reduce ? 0 : Math.sin(st.t * (2 + 6 * st.wag)) * (6 + 16 * st.wag);
      parts.tail.setAttribute("transform", `translate(-74 ${r1(-74 + 24 * sleep)}) rotate(${r1(wagA + 40 * sleep - 10 * crouch)})`);
      const closed = Math.max(pet, sleep, st.blink);
      parts.open.setAttribute("opacity", closed > 0.5 ? 0 : 1);
      parts.closed.setAttribute("opacity", closed > 0.5 ? 1 : 0);
      parts.pupils.setAttribute("transform", `translate(${r1(clamp(st.lookX, -1, 1) * 2.4)} ${r1(clamp(st.lookY, -1, 1) * 2)})`);
    }
    return { g, st, apply };
  }

  // ------------------------------------------------------------ sitting, facing you
  function front() {
    return `<g class="domi-front">
      <ellipse cx="0" cy="6" rx="92" ry="10" fill="#2a1d10" opacity=".12"/>
      <g class="df-tail">${P(fluff(78, -40, 26, 50, 18, 0.2, 0.5), C.cream)}${P(fluff(92, -78, 13, 14, 12, 0.25), C.white, 'opacity=".7"')}</g>
      ${P(fluff(0, -64, 78, 70, 30, 0.1), C.white)}
      ${P(fluff(-46, -70, 30, 40, 16, 0.16), C.cream)}${P(fluff(48, -74, 28, 36, 16, 0.16), C.cream)}
      ${P(fluff(0, -60, 44, 54, 22, 0.14), C.white)}
      ${P(fluff(-30, -4, 26, 14, 14, 0.18), C.white)}${P(fluff(30, -4, 26, 14, 14, 0.18), C.white)}
      <g class="df-toes"><path d="M-40 -2 v6 M-32 -1 v7 M-24 -2 v6 M24 -2 v6 M32 -1 v7 M40 -2 v6" stroke="${C.shade}" stroke-width="2"/></g>
      <g class="df-head">
        ${P("M-60 -150 L-52 -206 L-18 -168 Z", C.cream)}${P("M-52 -158 L-48 -192 L-28 -170 Z", C.pink)}
        ${P("M60 -150 L52 -206 L18 -168 Z", C.cream)}${P("M52 -158 L48 -192 L28 -170 Z", C.pink)}
        ${P(fluff(0, -126, 74, 56, 30, 0.14), C.white)}
        ${P(fluff(0, -160, 46, 22, 18, 0.18), C.cream)}
        ${P(fluff(-34, -154, 18, 14, 10, 0.2), C.cream, 'opacity=".9"')}${P(fluff(34, -154, 18, 14, 10, 0.2), C.cream, 'opacity=".9"')}
        ${P(fluff(0, -104, 34, 22, 16, 0.16), C.white)}
        <ellipse cx="-38" cy="-108" rx="11" ry="6" fill="${C.pink}" opacity=".35"/><ellipse cx="38" cy="-108" rx="11" ry="6" fill="${C.pink}" opacity=".35"/>
        <g class="df-eyes">
          <g class="df-open">
            <ellipse cx="-24" cy="-128" rx="12" ry="10.5" fill="${C.eye}" stroke="${C.line}" stroke-width="1.8"/>
            <ellipse cx="24" cy="-128" rx="12" ry="10.5" fill="${C.eye}" stroke="${C.line}" stroke-width="1.8"/>
            <g class="df-pupils"><ellipse cx="-24" cy="-128" rx="4.2" ry="8.6" fill="${C.pupil}"/><ellipse cx="24" cy="-128" rx="4.2" ry="8.6" fill="${C.pupil}"/>
            <circle cx="-20" cy="-133" r="3" fill="#fff"/><circle cx="28" cy="-133" r="3" fill="#fff"/></g>
          </g>
          <g class="df-closed"><path d="M-35 -128 Q-24 -119 -13 -128 M13 -128 Q24 -119 35 -128" stroke="${C.line}" stroke-width="3" fill="none" stroke-linecap="round"/></g>
        </g>
        ${P("M-6 -112 h12 l-6 7 z", C.nose)}
        <path d="M0 -105 q-4 7 -11 3 M0 -105 q4 7 11 3" stroke="${C.line}" stroke-width="2" fill="none" stroke-linecap="round"/>
        <path d="M-20 -106 L-64 -112 M-20 -101 L-62 -96 M20 -106 L64 -112 M20 -101 L62 -96" stroke="${C.whisker}" stroke-width="1.4"/>
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
    return `<g class="domi-stand">
      <ellipse cx="0" cy="4" rx="60" ry="7" fill="#2a1d10" opacity=".12"/>
      <g class="ds-tail">${P(fluff(52, -26, 22, 46, 18, 0.2, 1.0), C.cream)}${P(fluff(80, -40, 10, 12, 10, 0.25), C.white, 'opacity=".7"')}</g>
      ${P(fluff(4, -44, 36, 44, 22, 0.12), C.white)}
      ${P(fluff(20, -50, 15, 18, 12, 0.18), C.cream)}
      ${P(fluff(-2, -104, 30, 62, 26, 0.12, -0.15), C.white)}
      ${P(fluff(10, -124, 25, 22, 16, 0.16), C.cream)}${P(fluff(18, -86, 14, 13, 12, 0.2), C.cream)}${P(fluff(-6, -154, 22, 14, 14, 0.18), C.cream)}
      <ellipse cx="-12" cy="-3" rx="15" ry="7" fill="${C.white}"/>
      <g class="ds-arm">${P(fluff(-36, -160, 24, 9, 12, 0.2, -0.45), C.white)}<ellipse cx="-58" cy="-171" rx="10" ry="7" fill="${C.white}"/></g>
      <g class="ds-head">
        ${P("M-52 -196 L-50 -224 L-33 -203 Z", C.cream)}${P("M-48 -199 L-47 -217 L-37 -204 Z", C.pink)}
        ${P("M-20 -205 L-8 -228 L-3 -199 Z", C.cream)}${P("M-16 -205 L-8 -221 L-6 -202 Z", C.pink)}
        ${P(fluff(-28, -184, 29, 26, 20, 0.15), C.white)}
        ${P(fluff(-27, -199, 22, 11, 14, 0.2), C.cream)}
        <ellipse cx="-40" cy="-182" rx="4.6" ry="3.4" fill="${C.eye}" stroke="${C.line}" stroke-width="1"/><ellipse cx="-22" cy="-183" rx="4.6" ry="3.4" fill="${C.eye}" stroke="${C.line}" stroke-width="1"/>
        <circle cx="-41" cy="-180.6" r="1.8" fill="${C.pupil}"/><circle cx="-23" cy="-181.6" r="1.8" fill="${C.pupil}"/>
        ${P("M-35 -173 h6 l-3 4 z", C.nose)}
        <path d="M-44 -171 L-70 -168 M-24 -172 L2 -170" stroke="${C.whisker}" stroke-width="1"/>
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

  window.Domi = { rig, front, stand, sleepy, fluff, C, purr, pop, MEOWS };

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
    const S = () => (innerWidth < 700 ? 0.42 : 0.55);
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
    ["hero-domi", "garment", "reveal"].forEach((id) => {
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
        const hx = st.x + (st.flip ? -1 : 1) * 100 * st.s, hy = innerHeight - H + st.y - 110 * st.s;
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
