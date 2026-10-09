// A sewing needle replaces the mouse pointer and trails a strand of yarn.
// Clicking leaves a small cross-stitch that fades away.
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

  // Needle tip sits on the pointer, pointing up and to the left like an arrow cursor.
  const ANG = Math.PI * 1.25;
  const NEEDLE = 34;

  function step() {
    requestAnimationFrame(step);
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
      ctx.strokeStyle = yarn;
      ctx.lineWidth = 2.6;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(-6, -6); ctx.lineTo(6, 6);
      ctx.moveTo(6, -6); ctx.lineTo(-6, 6);
      ctx.stroke();
      ctx.restore();
    }
    if (!shown) return;

    const wob = hovering ? Math.sin(now / 90) * 0.18 : 0;
    const a = ANG + wob;
    // the eye sits behind the tip, opposite the pointing direction
    const eye = { x: mouse.x - Math.cos(a) * NEEDLE, y: mouse.y - Math.sin(a) * NEEDLE };

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

    // needle
    ctx.save();
    ctx.translate(mouse.x, mouse.y);
    ctx.rotate(a);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-NEEDLE, -2.2);
    ctx.quadraticCurveTo(-NEEDLE - 6, 0, -NEEDLE, 2.2);
    ctx.closePath();
    ctx.fillStyle = steel; ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,.35)"; ctx.lineWidth = 0.8; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(-NEEDLE + 1, 0, 3.4, 0.9, 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0,0,0,.55)"; ctx.fill();
    ctx.restore();
  }
  requestAnimationFrame(step);
})();
