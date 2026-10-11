// A little ball of yarn replaces the mouse pointer and trails a loose strand
// (Domi chases it). Clicking leaves a paw print that fades away.
// Only on devices with a mouse, and never when reduced motion is requested.
(function () {
  const fine = window.matchMedia("(pointer: fine)").matches;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!fine || reduce) return;

  const canvas = document.createElement("canvas");
  canvas.className = "needle-layer";
  canvas.setAttribute("aria-hidden", "true");
  document.body.appendChild(canvas);
  document.documentElement.classList.add("has-needle");
  const ctx = canvas.getContext("2d");

  // Pop-up dialogs sit in the browser's top layer, above this canvas, so the
  // needle would be hidden behind them. While one is open, use the normal pointer.
  let paused = false;
  const syncDialogs = () => {
    paused = !!document.querySelector("dialog[open]");
    document.documentElement.classList.toggle("has-needle", !paused);
    canvas.style.display = paused ? "none" : "";
  };
  new MutationObserver(syncDialogs).observe(document.body, { subtree: true, attributes: true, attributeFilter: ["open"] });

  let w = 0, h = 0, dpr = 1;
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth; h = window.innerHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener("resize", resize);
  resize();

  const N = 26, LEN = 9;
  let mouse = { x: w * 0.7, y: h * 0.3 };
  let shown = false;
  const pts = Array.from({ length: N }, (_, i) => ({ x: mouse.x + i * 2, y: mouse.y + i * LEN, px: mouse.x + i * 2, py: mouse.y + i * LEN }));
  const stitches = [];
  let hovering = false;

  window.addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse") return;
    mouse.x = e.clientX; mouse.y = e.clientY;
    if (!shown) { shown = true; pts.forEach((p) => { p.x = p.px = mouse.x; p.y = p.py = mouse.y; }); }
    const t = e.target;
    hovering = !!(t.closest && t.closest("a, button, [role=tab], .card-art, summary, input, label"));
  });
  document.addEventListener("pointerleave", () => (shown = false));
  window.addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "mouse") return;
    stitches.push({ x: e.clientX, y: e.clientY, born: performance.now(), rot: Math.random() * 0.6 - 0.3 });
    if (stitches.length > 30) stitches.shift();
  });


  function step() {
    requestAnimationFrame(step);
    if (paused) return;
    ctx.clearRect(0, 0, w, h);
    const styles = getComputedStyle(document.documentElement);
    const yarn = styles.getPropertyValue("--yarn").trim() || "#c63a2f";
    const steel = styles.getPropertyValue("--steel").trim() || "#9aa3ab";
    const now = performance.now();

    // fading cross-stitches
    for (const s of stitches) {
      const age = (now - s.born) / 1600;
      if (age > 1) continue;
      ctx.save();
      ctx.globalAlpha = 1 - age;
      ctx.translate(s.x, s.y);
      ctx.rotate(s.rot);
      ctx.fillStyle = "#f2a7a4";
      ctx.beginPath(); ctx.ellipse(0, 3, 6, 5, 0, 0, Math.PI * 2); ctx.fill();
      [[-7, -4], [-2.5, -8], [2.5, -8], [7, -4]].forEach(([x, y]) => { ctx.beginPath(); ctx.arc(x, y, 2.3, 0, Math.PI * 2); ctx.fill(); });
      ctx.restore();
    }
    if (!shown) return;

    const R = hovering ? 11 : 9;
    const spin = now / 400;
    const eye = { x: mouse.x + R * 0.4, y: mouse.y + R * 0.8 };

    // verlet rope
    pts[0].x = eye.x; pts[0].y = eye.y;
    for (let i = 1; i < N; i++) {
      const p = pts[i];
      const vx = (p.x - p.px) * 0.96, vy = (p.y - p.py) * 0.96;
      p.px = p.x; p.py = p.y;
      p.x += vx; p.y += vy + 0.45;
    }
    for (let k = 0; k < 4; k++) {
      for (let i = 1; i < N; i++) {
        const a1 = pts[i - 1], b = pts[i];
        const dx = b.x - a1.x, dy = b.y - a1.y;
        const d = Math.hypot(dx, dy) || 0.001;
        const diff = (d - LEN) / d;
        if (i === 1) { b.x -= dx * diff; b.y -= dy * diff; }
        else { a1.x += dx * diff * 0.5; a1.y += dy * diff * 0.5; b.x -= dx * diff * 0.5; b.y -= dy * diff * 0.5; }
      }
      pts[0].x = eye.x; pts[0].y = eye.y;
    }

    // yarn: a thick strand with a twisted highlight
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < N - 1; i++) {
      const mx = (pts[i].x + pts[i + 1].x) / 2, my = (pts[i].y + pts[i + 1].y) / 2;
      ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
    }
    ctx.strokeStyle = yarn; ctx.lineWidth = 3.4; ctx.stroke();
    ctx.setLineDash([2, 5]); ctx.strokeStyle = "rgba(255,255,255,.35)"; ctx.lineWidth = 1.4; ctx.stroke();
    ctx.setLineDash([]);

    // the ball of yarn
    ctx.save();
    ctx.translate(mouse.x + R * 0.2, mouse.y + R * 0.2);
    ctx.rotate(spin);
    ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2);
    ctx.fillStyle = yarn; ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,.45)"; ctx.lineWidth = 1.2;
    for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.ellipse(0, 0, R * 0.95, R * (0.25 + Math.abs(k) * 0.15), k * 0.6, 0, Math.PI); ctx.stroke(); }
    ctx.strokeStyle = "rgba(0,0,0,.25)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }
  requestAnimationFrame(step);
})();
