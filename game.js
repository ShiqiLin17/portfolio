// Feed Domi: a kibble fountain sprays kibble, and you catch it in Domi's bowl.
// The score is painted on the cans on Domi's shelf. Golden fish treats are worth 5.
// Mouse, touch (drag) or the arrow keys move the bowl. Rounds last 30 seconds.
(function () {
  const canvas = document.getElementById("kb-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const stage = canvas.parentElement;
  const overlay = document.getElementById("kb-overlay");
  const startBtn = document.getElementById("kb-start");
  const bestEl = document.getElementById("kb-best");
  const domiBox = document.getElementById("kb-domi");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const ROUND = 30;
  let W = 0, H = 0, dpr = 1;
  let best = 0;
  try { best = +localStorage.getItem("domi-kibble-best") || 0; } catch (e) {}

  // Domi watches the kibble from the corner
  if (domiBox && window.Domi) domiBox.innerHTML = `<svg viewBox="-120 -230 240 250" aria-hidden="true">${window.Domi.front()}</svg>`;
  const pupils = domiBox && domiBox.querySelector(".df-pupils");

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = stage.clientWidth; H = stage.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    canvas.style.width = W + "px"; canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    bowl.y = H - 40;
    bowl.x = Math.min(Math.max(bowl.x || W / 2, 50), W - 50);
    bowl.tx = bowl.x;
  }

  // ------------------------------------------------------------ state
  const bowl = { x: 0, y: 0, tx: 0, w: 92 };
  let kibble = [], floor = [], pile = [], pops = [];
  let score = 0, playing = false, t = 0, spawnAcc = 0, timeLeft = ROUND, lastTs = 0, shake = 0;
  const COLORS = ["#8a5a35", "#9b6a40", "#7a4c2c", "#a8774a"];

  function spawn() {
    const gold = Math.random() < 0.07;
    const sx = W * 0.3, sy = (H - 70) * 0.62 - 44;
    kibble.push({
      x: sx + (Math.random() - 0.5) * 8, y: sy,
      vx: (Math.random() - 0.35) * (W / 80), vy: -(4.5 + Math.random() * 4.5),
      r: gold ? 9 : 5 + Math.random() * 2.2, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3,
      kind: gold ? "fish" : ["round", "tri", "fishy", "round"][Math.floor(Math.random() * 4)],
      col: COLORS[Math.floor(Math.random() * COLORS.length)],
    });
  }

  // ------------------------------------------------------------ drawing
  function rr(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h); }
  function drawKibble(k, x = k.x, y = k.y) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(k.rot);
    if (k.kind === "fish") {
      ctx.fillStyle = "#f2c14e"; ctx.strokeStyle = "#b8862a"; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.ellipse(0, 0, k.r * 1.3, k.r * 0.75, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-k.r * 1.1, 0); ctx.lineTo(-k.r * 2, -k.r * 0.8); ctx.lineTo(-k.r * 2, k.r * 0.8); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#5a3b12"; ctx.beginPath(); ctx.arc(k.r * 0.6, -k.r * 0.15, 1.6, 0, 7); ctx.fill();
    } else {
      ctx.fillStyle = k.col;
      if (k.kind === "tri") { ctx.beginPath(); ctx.moveTo(0, -k.r); ctx.lineTo(k.r, k.r * 0.8); ctx.lineTo(-k.r, k.r * 0.8); ctx.closePath(); ctx.fill(); }
      else if (k.kind === "fishy") { ctx.beginPath(); ctx.ellipse(0, 0, k.r * 1.2, k.r * 0.7, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.moveTo(-k.r, 0); ctx.lineTo(-k.r * 1.7, -k.r * 0.6); ctx.lineTo(-k.r * 1.7, k.r * 0.6); ctx.fill(); }
      else { ctx.beginPath(); ctx.arc(0, 0, k.r, 0, 7); ctx.fill(); ctx.fillStyle = "rgba(0,0,0,.25)"; ctx.beginPath(); ctx.arc(0, 0, k.r * 0.32, 0, 7); ctx.fill(); }
      ctx.fillStyle = "rgba(255,255,255,.22)"; ctx.beginPath(); ctx.arc(-k.r * 0.3, -k.r * 0.35, k.r * 0.3, 0, 7); ctx.fill();
    }
    ctx.restore();
  }

  // ------------------------------------------------------------ Domi's corner, drawn from the real photo:
  // white wall and a night window on the left, a navy wall on the right, the bamboo shelf with her
  // treat tubs, kibble bag, vitamins, stacked cans and food bags, the Domi mat, and her talking buttons.
  let litButton = -1, litT = 0;
  function tin(x, y, w, h, body, lid) {
    ctx.fillStyle = body; rr(x, y, w, h, 2); ctx.fill();
    ctx.fillStyle = lid; ctx.fillRect(x, y, w, Math.max(2, h * 0.18));
    ctx.fillStyle = "rgba(255,255,255,.55)"; ctx.fillRect(x + w * 0.2, y + h * 0.4, w * 0.6, h * 0.22);
  }
  function drawScene() {
    const floorY = H - 70;
    // walls
    ctx.fillStyle = "#f5f2ec"; ctx.fillRect(0, 0, W, floorY);
    ctx.fillStyle = "#1f2c55"; ctx.fillRect(W * 0.86, 0, W * 0.14, floorY);
    ctx.fillStyle = "#e9e4da"; ctx.fillRect(0, floorY - 10, W, 10);
    // the window at night
    const wx = 10, wy = 18, ww = W * 0.3, wh = floorY * 0.5;
    ctx.fillStyle = "#d9d6d0"; ctx.fillRect(wx - 6, wy - 6, ww + 12, wh + 18);
    ctx.fillStyle = "#1b1d24"; ctx.fillRect(wx, wy, ww, wh);
    const sky = ctx.createLinearGradient(0, wy, 0, wy + wh); sky.addColorStop(0, "#232a3c"); sky.addColorStop(1, "#11141b");
    ctx.fillStyle = sky; ctx.fillRect(wx + 4, wy + 4, ww - 8, wh - 8);
    ctx.fillStyle = "#2c2f3a"; ctx.fillRect(wx + 4, wy + wh * 0.5, ww * 0.55, wh * 0.5 - 4);
    ctx.fillStyle = "#ffd98f"; [[0.12, 0.6], [0.3, 0.6], [0.12, 0.75], [0.42, 0.78]].forEach(([u, v]) => ctx.fillRect(wx + ww * u, wy + wh * v, 6, 8));
    ctx.fillStyle = "#e9e7e2"; ctx.beginPath(); ctx.ellipse(wx + ww * 0.7, wy + wh * 0.88, 12, 5, 0, 0, 7); ctx.fill();
    ctx.fillStyle = "#ff6a5a"; ctx.beginPath(); ctx.arc(wx + ww * 0.82, wy + wh * 0.7, 2.4, 0, 7); ctx.fill();
    // the bamboo shelf
    const sx0 = W * 0.52, sx1 = W * 0.96, top = 18, bot = floorY;
    const bamboo = "#d6a15a", bambooDk = "#b88343";
    const levels = 5, lh = (bot - top) / levels;
    // back slats on the sides
    [sx0, sx1 - 14].forEach((x) => {
      ctx.fillStyle = bamboo; ctx.fillRect(x, top, 6, bot - top); ctx.fillRect(x + 10, top, 4, bot - top);
      for (let y = top + 12; y < bot; y += 26) { ctx.fillStyle = bambooDk; ctx.fillRect(x, y, 14, 3); }
    });
    for (let i = 0; i <= levels; i++) {
      const y = top + i * lh;
      ctx.fillStyle = bamboo; ctx.fillRect(sx0, y, sx1 - sx0, 7);
      ctx.fillStyle = bambooDk; ctx.fillRect(sx0, y + 7, sx1 - sx0, 2);
    }
    const iw = sx1 - sx0 - 28, ix = sx0 + 16;
    // shelf 1: two tubs of treat sticks with green labels
    for (let k = 0; k < 2; k++) {
      const x = ix + 4 + k * iw * 0.5, y = top + lh * 1 - lh * 0.8, w = iw * 0.42, h = lh * 0.8;
      ctx.fillStyle = "rgba(235,240,240,.9)"; rr(x, y, w, h, 4); ctx.fill();
      ctx.fillStyle = "#cfd8d6"; for (let s = 0; s < 7; s++) ctx.fillRect(x + 4 + s * (w - 8) / 7, y + 4, 3, h - 8);
      ctx.fillStyle = "#b8e07a"; ctx.fillRect(x + w * 0.15, y + h * 0.35, w * 0.7, h * 0.45);
      ctx.fillStyle = "#3f8a3a"; ctx.beginPath(); ctx.ellipse(x + w * 0.66, y + h * 0.62, w * 0.1, h * 0.14, 0, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.arc(x + w * 0.66, y + h * 0.45, w * 0.07, 0, 7); ctx.fill();
      ctx.fillStyle = "#e8eef0"; ctx.fillRect(x - 2, y - 4, w + 4, 6);
    }
    // shelf 2: the zip bag of kibble
    {
      const x = ix + iw * 0.28, y = top + lh * 2 - lh * 0.62, w = iw * 0.68, h = lh * 0.62;
      ctx.fillStyle = "rgba(220,225,230,.85)"; rr(x, y, w, h, 8); ctx.fill();
      ctx.fillStyle = "#6e4a2a"; for (let s = 0; s < 70; s++) { const px = x + 6 + ((s * 37) % 100) / 100 * (w - 12), py = y + h * 0.3 + ((s * 53) % 100) / 100 * h * 0.62; ctx.beginPath(); ctx.arc(px, py, 2.2, 0, 7); ctx.fill(); }
      ctx.fillStyle = "#3d6fc9"; ctx.fillRect(x, y + 3, w, 3);
    }
    // shelf 3: fish oil and vitamins
    {
      const y = top + lh * 3;
      ctx.fillStyle = "#f4f4f2"; rr(ix + iw * 0.45, y - lh * 0.62, iw * 0.16, lh * 0.62, 4); ctx.fill();
      ctx.fillStyle = "#c9353a"; ctx.fillRect(ix + iw * 0.45, y - lh * 0.3, iw * 0.16, lh * 0.12);
      ctx.fillStyle = "#e9eef5"; ctx.fillRect(ix + iw * 0.66, y - lh * 0.56, iw * 0.14, lh * 0.56);
      ctx.fillStyle = "#4f86c6"; ctx.fillRect(ix + iw * 0.66, y - lh * 0.56, iw * 0.14, lh * 0.12);
      ctx.fillStyle = "#e8792f"; [0, 1, 2].forEach((s) => { ctx.save(); ctx.translate(ix + iw * 0.12 + s * 6, y - 6); ctx.rotate(-0.2); ctx.fillRect(0, 0, iw * 0.26, 4); ctx.restore(); });
    }
    // shelf 4: Domi's canned food, and the score on the paper beside it
    {
      const y = top + lh * 4, cw = Math.max(13, iw * 0.085), ch = cw * 0.62;
      const tins = [["#d9cdea", "#c9a35b"], ["#cfe3f0", "#b7bcc2"], ["#f2efe9", "#c9a35b"]];
      const extra = Math.min(16, Math.floor(score / 10));
      const cols = 5;
      for (let c = 0; c < cols; c++) {
        const stack = 3 + ((c * 7) % 3) + Math.floor((extra + (cols - c)) / cols);
        for (let r = 0; r < Math.min(stack, Math.floor((lh - 12) / ch)); r++) {
          const [b, l] = tins[(c + r) % 3];
          tin(ix + c * (cw + 2), y - ch * (r + 1), cw, ch - 1, b, l);
        }
      }
      // the score sheet (like the sticker sheet on her shelf)
      const px = ix + iw * 0.6, pw = iw * 0.4, ph = lh * 0.72;
      ctx.save(); ctx.translate(px + pw / 2, y - ph / 2 - 2); ctx.rotate(-0.06);
      ctx.fillStyle = "#fffdf8"; ctx.shadowColor = "rgba(0,0,0,.15)"; ctx.shadowBlur = 4; rr(-pw / 2, -ph / 2, pw, ph, 3); ctx.fill(); ctx.shadowBlur = 0;
      ctx.fillStyle = "#2d3531"; ctx.textAlign = "center";
      ctx.font = `700 ${Math.round(ph * 0.22)}px Caveat, cursive`; ctx.fillText("kibble", 0, -ph * 0.18);
      ctx.font = `700 ${Math.round(ph * 0.46)}px Caveat, cursive`; ctx.fillStyle = "#c6604e"; ctx.fillText(String(score), 0, ph * 0.28);
      ctx.font = `700 ${Math.round(ph * 0.16)}px Caveat, cursive`; ctx.fillStyle = "#6b6f74"; ctx.fillText("best " + best, 0, ph * 0.46);
      ctx.restore();
    }
    // shelf 5 (floor level): yellow food bags and a blue bag
    {
      const y = bot, h = lh * 0.86;
      for (let k = 0; k < 4; k++) { ctx.fillStyle = k % 2 ? "#f4e58a" : "#f8ec9f"; rr(ix + k * iw * 0.11, y - h, iw * 0.13, h, 3); ctx.fill(); }
      ctx.fillStyle = "#e9eef5"; rr(ix + iw * 0.56, y - h * 1.05, iw * 0.4, h * 1.05, 6); ctx.fill();
      ctx.fillStyle = "#3d6fc9"; ctx.fillRect(ix + iw * 0.56, y - h * 0.5, iw * 0.4, h * 0.36);
      ctx.fillStyle = "#f2a7c4"; ctx.beginPath(); ctx.arc(ix + iw * 0.66, y - h * 0.82, h * 0.12, 0, 7); ctx.fill();
    }
    // the kibble fountain: a little feeder robot (Shiqi built it, obviously)
    const fx = W * 0.3, fy = floorY * 0.62;
    ctx.fillStyle = "#f6efe2"; ctx.strokeStyle = "#2d3531"; ctx.lineWidth = 2.5;
    rr(fx - 34, fy - 30, 68, 46, 12); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#9cc7b2"; ctx.fillRect(fx - 34, fy - 2, 68, 8);
    ctx.fillStyle = "#2d3531"; ctx.beginPath(); ctx.arc(fx - 12, fy - 13, 5, 0, 7); ctx.arc(fx + 12, fy - 13, 5, 0, 7); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(fx - 10, fy - 15, 1.6, 0, 7); ctx.arc(fx + 14, fy - 15, 1.6, 0, 7); ctx.fill();
    ctx.fillStyle = "#c9cfd4"; rr(fx - 10, fy - 44, 20, 14, 3); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = "#2d3531"; ctx.beginPath(); ctx.moveTo(fx, fy + 16); ctx.lineTo(fx, floorY - 10); ctx.stroke();
    ctx.fillStyle = "#2d3531"; ctx.font = "700 10px 'Special Elite', monospace"; ctx.textAlign = "center"; ctx.fillText("KIBBLE-O-MATIC", fx, fy + 30);
    // wood floor, the Domi mat, the talking buttons
    ctx.fillStyle = "#b9824f"; ctx.fillRect(0, floorY, W, H - floorY);
    ctx.fillStyle = "rgba(60,30,10,.12)"; for (let y = floorY + 14; y < H; y += 16) ctx.fillRect(0, y, W, 2);
    for (let y = floorY, k = 0; y < H; y += 16, k++) for (let x = (k % 2) * 70; x < W; x += 140) ctx.fillRect(x, y, 2, 16);
    ctx.fillStyle = "#efe4d0"; rr(8, floorY + 8, W * 0.46, H - floorY - 14, 8); ctx.fill();
    ctx.fillStyle = "#8a7460"; ctx.font = "700 13px 'DM Sans', sans-serif"; ctx.textAlign = "left"; ctx.fillText("Domi 豆米", W * 0.3, H - 14);
    ctx.fillStyle = "#8a7460"; [[W * 0.27, H - 22], [W * 0.43, H - 30]].forEach(([x, y]) => { ctx.beginPath(); ctx.arc(x, y, 3, 0, 7); ctx.fill(); [[-4, -5], [0, -7], [4, -5]].forEach(([a, b]) => { ctx.beginPath(); ctx.arc(x + a, y + b, 1.4, 0, 7); ctx.fill(); }); });
    const bcols = [["#f4d33a", "#f7e86a"], ["#9b7bd0", "#c5b2ec"], ["#2f6bd0", "#7ea8ef"], ["#4fb85a", "#97de8e"]];
    bcols.forEach(([mat, top2], k) => {
      const x = W * 0.58 + k * W * 0.1, y = floorY + 30;
      ctx.fillStyle = mat; rr(x - 22, y - 12, 44, 32, 6); ctx.fill();
      const lit = litButton === k && litT > 0;
      ctx.fillStyle = "#1f1f1f"; ctx.beginPath(); ctx.ellipse(x, y + 4, 16, 8, 0, 0, 7); ctx.fill();
      ctx.fillStyle = lit ? "#fff7c2" : top2; ctx.beginPath(); ctx.ellipse(x, y - (lit ? 0 : 2), 13, 6.5, 0, 0, 7); ctx.fill();
    });
  }

  function drawBowl() {
    // a steel bowl in a little bamboo stand, like the one in Domi's corner
    const { x, y, w } = bowl;
    ctx.fillStyle = "#c58b45"; ctx.fillRect(x - w / 2 - 6, y + 8, 6, 26); ctx.fillRect(x + w / 2, y + 8, 6, 26);
    pile.forEach((p) => drawKibble(p, x + p.dx, y - 6 + p.dy));
    const steel = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
    steel.addColorStop(0, "#aeb6bd"); steel.addColorStop(0.35, "#eef1f3"); steel.addColorStop(0.6, "#c4cbd1"); steel.addColorStop(1, "#8f989f");
    ctx.fillStyle = steel; ctx.strokeStyle = "#7d868d"; ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(x - w / 2, y - 8);
    ctx.quadraticCurveTo(x - w / 2 + 4, y + 18, x - w / 3, y + 20);
    ctx.lineTo(x + w / 3, y + 20);
    ctx.quadraticCurveTo(x + w / 2 - 4, y + 18, x + w / 2, y - 8);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(x, y - 8, w / 2, 6, 0, 0, Math.PI); ctx.stroke();
    ctx.fillStyle = "#d6a15a"; ctx.fillRect(x - w / 2 - 8, y + 2, w + 16, 8);
    ctx.fillStyle = "#b88343"; ctx.fillRect(x - w / 2 - 8, y + 8, w + 16, 2);
    ctx.fillStyle = "#7a5a33"; ctx.font = "700 12px Caveat, cursive"; ctx.textAlign = "center"; ctx.fillText("Domi", x, y + 23);
  }

  function frame(ts) {
    requestAnimationFrame(frame);
    if (!visible && !playing) return;
    const dt = Math.min(0.05, (ts - (lastTs || ts)) / 1000); lastTs = ts;
    const k = dt * 60;
    t += dt;
    if (playing) {
      timeLeft -= dt;
      if (timeLeft <= 0) end();
      spawnAcc += dt * (5 + (ROUND - timeLeft) * 0.35);
      while (spawnAcc > 1) { spawn(); spawnAcc -= 1; }
    } else if (!reduce && Math.random() < dt * 1.5) spawn(); // a gentle trickle while waiting
    bowl.x += (bowl.tx - bowl.x) * Math.min(1, 0.35 * k);
    // physics
    const g = 0.22;
    for (let i = kibble.length - 1; i >= 0; i--) {
      const q = kibble[i];
      const py = q.y;
      q.vy += g * k; q.x += q.vx * k; q.y += q.vy * k; q.rot += q.vr * k;
      if (q.x < q.r || q.x > W - q.r) { q.vx *= -0.7; q.x = Math.max(q.r, Math.min(W - q.r, q.x)); }
      const rim = bowl.y - 8;
      if (q.vy > 0 && py <= rim && q.y >= rim && Math.abs(q.x - bowl.x) < bowl.w / 2 - 4) {
        kibble.splice(i, 1);
        if (playing) {
          const pts = q.kind === "fish" ? 5 : 1;
          score += pts;
          pops.push({ x: q.x, y: rim - 10, text: pts > 1 ? "+5 ♡" : "+1", life: 1 });
          if (pts > 1) { shake = 1; litButton = Math.floor(Math.random() * 4); litT = 0.6; if (window.Domi && Math.random() < 0.6) { const r = canvas.getBoundingClientRect(); window.Domi.pop(r.left + W * 0.15, r.top + H - 120, "mrrp!", "bubble"); } }
        }
        if (pile.length < 70) {
          const n = pile.length, layer = Math.floor(n / 9);
          pile.push({ ...q, dx: (Math.random() - 0.5) * (bowl.w * 0.7 - layer * 6), dy: -layer * 4 - Math.random() * 3 });
        }
        continue;
      }
      if (q.y > H - 16 - q.r) {
        kibble.splice(i, 1);
        if (floor.length > 60) floor.shift();
        floor.push({ ...q, y: H - 16 - q.r * 0.6, life: 1 });
      }
    }
    floor.forEach((f) => (f.life -= dt * 0.25));
    floor = floor.filter((f) => f.life > 0);
    litT -= dt;
    pops.forEach((p) => { p.life -= dt * 1.4; p.y -= 30 * dt; });
    pops = pops.filter((p) => p.life > 0);

    ctx.save();
    if (shake > 0) { ctx.translate((Math.random() - 0.5) * 4 * shake, 0); shake = Math.max(0, shake - dt * 4); }
    drawScene();
    floor.forEach((f) => { ctx.globalAlpha = Math.min(1, f.life * 2); drawKibble(f); });
    ctx.globalAlpha = 1;
    kibble.forEach((q) => drawKibble(q));
    drawBowl();
    pops.forEach((p) => { ctx.globalAlpha = Math.max(0, p.life); ctx.fillStyle = "#c6604e"; ctx.font = "700 20px Caveat, cursive"; ctx.textAlign = "center"; ctx.fillText(p.text, p.x, p.y); });
    ctx.globalAlpha = 1;
    // timer
    if (playing) {
      ctx.fillStyle = "#2d3531"; ctx.font = "700 22px Caveat, cursive"; ctx.textAlign = "left";
      ctx.fillText(`0:${String(Math.max(0, Math.ceil(timeLeft))).padStart(2, "0")}`, 14, 30);
    }
    ctx.restore();
    // Domi watches the lowest falling kibble
    if (pupils) {
      let tgt = null;
      kibble.forEach((q) => { if (!tgt || q.y > tgt.y) tgt = q; });
      const r = domiBox.getBoundingClientRect(), c = canvas.getBoundingClientRect();
      const ex = r.left - c.left + r.width / 2, ey = r.top - c.top + r.height * 0.4;
      const dx = tgt ? Math.max(-1, Math.min(1, (tgt.x - ex) / 150)) : 0, dy = tgt ? Math.max(-1, Math.min(1, (tgt.y - ey) / 150)) : 0;
      pupils.setAttribute("transform", `translate(${(dx * 6).toFixed(1)} ${(dy * 4).toFixed(1)})`);
    }
  }

  // ------------------------------------------------------------ controls
  const moveTo = (clientX) => { const r = canvas.getBoundingClientRect(); bowl.tx = Math.max(bowl.w / 2, Math.min(W - bowl.w / 2, clientX - r.left)); };
  stage.addEventListener("pointermove", (e) => moveTo(e.clientX));
  stage.addEventListener("pointerdown", (e) => { moveTo(e.clientX); if (playing && e.pointerType !== "mouse") stage.setPointerCapture(e.pointerId); });
  stage.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") { bowl.tx = Math.max(bowl.w / 2, bowl.tx - 40); e.preventDefault(); }
    if (e.key === "ArrowRight") { bowl.tx = Math.min(W - bowl.w / 2, bowl.tx + 40); e.preventDefault(); }
  });

  function start() {
    score = 0; timeLeft = ROUND; pile = []; kibble = []; floor = []; playing = true;
    overlay.hidden = true;
    stage.classList.add("playing");
    stage.focus({ preventScroll: true });
  }
  function end() {
    playing = false;
    stage.classList.remove("playing");
    const isBest = score > best;
    if (isBest) { best = score; try { localStorage.setItem("domi-kibble-best", String(best)); } catch (e) {} }
    overlay.querySelector(".kb-title").textContent = isBest && score > 0 ? `New best: ${score}!` : `Domi got ${score} kibble`;
    overlay.querySelector(".kb-text").textContent = score > 60 ? "She's so full she's purring. You're hired (by Domi)." : score > 25 ? "Happy kitten! Think you can fill it up more?" : "Domi is still a little hungry…";
    startBtn.textContent = "Play again ▶";
    showBest();
    overlay.hidden = false;
  }
  function showBest() { if (bestEl) bestEl.textContent = best ? `your best: ${best}` : ""; }
  startBtn.addEventListener("click", start);
  showBest();

  let visible = true;
  new IntersectionObserver(([en]) => (visible = en.isIntersecting)).observe(stage);
  window.addEventListener("resize", resize);
  resize();
  requestAnimationFrame(frame);
})();
