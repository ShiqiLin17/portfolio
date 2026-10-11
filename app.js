// The storybook: scroll opens a book, steps into its painted pages, and back out.
// Content lives in data.js; the paintings are in scenes.js and art.js.
import { SCENES, NARRATION } from "./scenes.js";
import { DEFS, DRONE } from "./art.js";
import { projects, experience, CERTS, HONORS, SKILLS, LANGUAGES, BUILDS, HOBBIES, CONTACT, ME_PHOTOS } from "./data.js";

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = window.matchMedia("(pointer: fine)").matches;
const clamp01 = (t) => Math.max(0, Math.min(1, t));
const seg = (u, a, b) => clamp01((u - a) / (b - a));
const ease = (t) => t * t * (3 - 2 * t);
const lerp = (a, b, t) => a + (b - a) * t;

// ---------------------------------------------------------------- dialogs
const dialogs = $$("dialog");
let lastOpener = null;
// Opening a modal can make some browsers jump the page; keep the scroll (and the movie) where it was.
let savedY = 0;
function openDialog(d, opener) {
  lastOpener = opener || document.activeElement;
  savedY = window.scrollY;
  d.showModal();
  d.scrollTop = 0;
  if (window.scrollY !== savedY) window.scrollTo(0, savedY);
  requestAnimationFrame(() => { if (window.scrollY !== savedY) window.scrollTo(0, savedY); });
}
dialogs.forEach((d) => {
  d.addEventListener("click", (e) => { if (e.target === d) d.close(); });
  $$("[data-close]", d).forEach((b) => b.addEventListener("click", () => d.close()));
  d.addEventListener("close", () => {
    releaseFocus();
    if (lastOpener && lastOpener.focus) lastOpener.focus({ preventScroll: true });
    if (window.scrollY !== savedY) window.scrollTo(0, savedY);
  });
});

function mediaHTML(media = [], placeholder) {
  if (!media.length) {
    if (placeholder) return `<div class="gallery"><div class="slot wide">${esc(placeholder)}</div></div>`;
    return `<div class="gallery"><div class="slot">Photos coming soon</div><div class="slot">Video coming soon</div></div>`;
  }
  return `<div class="gallery">${media.map((m) => {
    if (m.type === "image") return `<figure><img src="${esc(m.src)}" alt="${esc(m.alt || "")}" loading="lazy">${m.caption ? `<figcaption>${esc(m.caption)}</figcaption>` : ""}</figure>`;
    if (m.type === "video") return `<figure><video src="${esc(m.src)}" controls playsinline preload="metadata"></video>${m.caption ? `<figcaption>${esc(m.caption)}</figcaption>` : ""}</figure>`;
    if (m.type === "youtube") return `<figure class="wide"><iframe src="https://www.youtube-nocookie.com/embed/${esc(m.id)}" title="${esc(m.caption || "Video")}" allow="encrypted-media; picture-in-picture" allowfullscreen loading="lazy"></iframe></figure>`;
    return "";
  }).join("")}</div>`;
}
const linksHTML = (links = []) => links.length
  ? `<p class="links">${links.map((l) => `<a href="${esc(l.href)}" target="_blank" rel="noopener">${esc(l.label)}</a>`).join("")}</p>`
  : "";
function openDetail(p, opener) {
  if (!p) return;
  $("#detail-body").innerHTML = `
    <div class="detail-art" style="--tone:${esc(p.color || "#c4dfcd")}">${esc(p.art || "")}</div>
    <div class="detail-content">
      <p class="kicker">${esc(p.when || "")}</p>
      <h2 id="detail-title">${esc(p.title)}</h2>
      <p>${esc(p.summary || "")}</p>
      ${linksHTML(p.links)}
      ${mediaHTML(p.media, p.placeholder)}
      ${(p.sections || []).map(([h, items]) => `<h3>${esc(h)}</h3><ul>${items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>`).join("")}
    </div>`;
  openDialog($("#detail"), opener);
}

// ---------------------------------------------------------------- static content
// Newspaper date
$("#paper-date").textContent = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "America/New_York" });
$$("[data-mail]").forEach((a) => (a.href = "mailto:" + CONTACT.email + "?subject=" + encodeURIComponent("Let's work together")));
$$("[data-linkedin]").forEach((a) => (a.href = CONTACT.linkedin));
$$("[data-github]").forEach((a) => (a.href = CONTACT.github));

// Letter photo
if (ME_PHOTOS[0]) $("#letter-photo").innerHTML = `<img src="${esc(ME_PHOTOS[0].src)}" alt="${esc(ME_PHOTOS[0].alt || "Shiqi")}">`;

// Toolbox (sketch paper)
{
  const cats = Object.keys(SKILLS);
  $("#tool-filters").innerHTML = ["All", ...cats].map((c, i) => `<button type="button" class="chip-filter${i ? "" : " on"}" data-f="${esc(c)}" aria-pressed="${i ? "false" : "true"}">${esc(c)}</button>`).join("");
  $("#tool-chips").innerHTML = cats.map((c) => SKILLS[c].map((s) => `<li data-cat="${esc(c)}">${esc(s)}</li>`).join("")).join("");
  $("#tool-langs").textContent = LANGUAGES;
  $$("#tool-filters button").forEach((b) => b.addEventListener("click", () => {
    $$("#tool-filters button").forEach((x) => { x.classList.toggle("on", x === b); x.setAttribute("aria-pressed", String(x === b)); });
    $$("#tool-chips li").forEach((li) => li.classList.toggle("dim", b.dataset.f !== "All" && li.dataset.cat !== b.dataset.f));
  }));
}

// Project files in the workshop
$("#project-files").innerHTML = Object.entries(projects).map(([k, p]) => `<li><button type="button" data-p="${k}"><span class="tab" style="--tone:${esc(p.color)}"></span>${esc(p.title)}</button></li>`).join("");
$$("#project-files button").forEach((b) => b.addEventListener("click", (e) => openDetail(projects[b.dataset.p], e.currentTarget)));

// Certificates list (accessible list + mobile)
const ALL_CERTS = [
  ...HONORS.map((h) => ({ ...h, kind: h.kind || "Honor", honor: true })),
  ...CERTS.flatMap((g) => g.items.map((c) => ({ ...c, kind: /Onramp|Certificate|Program|Training/.test(c.title) ? "Certificate of Completion" : "Certification" }))),
];
const certDetail = (c) => ({
  color: c.honor ? "#e6d3a8" : "#c4dfcd", art: c.abbr, title: c.title, when: c.issuer, summary: c.text,
  links: c.links, media: c.media, placeholder: "Certificate scan coming soon",
  sections: c.where ? [["Where", [c.where]]] : [],
});
$("#cert-list").innerHTML = ALL_CERTS.map((c, i) => `<li><button type="button" data-c="${i}"><span class="seal${c.honor ? " gold" : ""}">${esc(c.abbr)}</span><span><b>${esc(c.title)}</b><small>${esc(c.issuer)}${c.links ? " · verified" : ""}</small></span></button></li>`).join("");
$$("#cert-list button").forEach((b) => b.addEventListener("click", (e) => { $("#certsDlg").close(); openDetail(certDetail(ALL_CERTS[+b.dataset.c]), e.currentTarget); }));

// ---------------------------------------------------------------- experience book
const EXP = Object.values(experience);
let page = 0; // 0 = cover/contents, then 1..EXP.length
function pageHTML(i, side) {
  if (i === 0) {
    if (side === "L") return `<div class="cover-in"><p class="kicker">volume one</p><h3>Experience</h3><p class="script">by Shiqi Lin</p><p class="small">Flip through the pages, or pick a chapter.</p></div>`;
    return `<div class="toc"><h4>Contents</h4><ol>${EXP.map((e, k) => `<li><button type="button" data-go="${k + 1}"><span>${esc(e.title)}</span><i>${esc(e.when.split("·")[1] || "")}</i><b>${k + 1}</b></button></li>`).join("")}</ol></div>`;
  }
  const e = EXP[i - 1];
  const media = e.media || [];
  if (side === "L") {
    const photos = media.filter((m) => m.type === "image");
    const vids = media.filter((m) => m.type !== "image");
    return `<div class="pg-photos">
      ${photos.length ? photos.slice(0, 3).map((m, k) => `<figure class="ph ph${k}"><img src="${esc(m.src)}" alt="${esc(m.alt || "")}" loading="lazy"></figure>`).join("")
        : `<figure class="ph ph0"><span>photo coming soon</span></figure><figure class="ph ph1"><span>photo</span></figure><figure class="ph ph2"><span>photo</span></figure>`}
      <button type="button" class="vid-btn" data-vid="${i - 1}">▶ ${vids.length ? "Watch the video" : "Video coming soon"}</button>
      <p class="pg-no">${i * 2}</p></div>`;
  }
  return `<div class="pg-text"><p class="kicker">${esc(e.when)}</p><h3>${esc(e.title)}</h3><p>${esc(e.summary)}</p>
    ${(e.sections || []).map(([h, items]) => `<h4>${esc(h)}</h4><ul>${items.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>`).join("")}
    ${linksHTML(e.links)}<p class="pg-no">${i * 2 + 1}</p></div>`;
}
function renderBook() {
  $("#page-L").innerHTML = pageHTML(page, "L");
  $("#page-R").innerHTML = pageHTML(page, "R");
  $("#book-count").textContent = page === 0 ? "Contents" : `${page} of ${EXP.length}`;
  $("#book-prev").disabled = page === 0;
  $("#book-next").disabled = page === EXP.length;
  $$("#page-R [data-go]").forEach((b) => b.addEventListener("click", () => flipTo(+b.dataset.go)));
  $$("#page-L [data-vid]").forEach((b) => b.addEventListener("click", (ev) => {
    const e = EXP[+b.dataset.vid];
    openDetail({ ...e, placeholder: "Video coming soon", sections: [] }, ev.currentTarget);
  }));
}
let flipping = false;
function flipTo(n) {
  if (flipping || n === page || n < 0 || n > EXP.length) return;
  const fwd = n > page;
  const leaf = $("#leaf");
  if (reduceMotion) { page = n; renderBook(); return; }
  flipping = true;
  leaf.className = "leaf " + (fwd ? "fwd" : "back");
  $(".leaf-front", leaf).innerHTML = fwd ? pageHTML(page, "R") : pageHTML(page, "L");
  $(".leaf-back", leaf).innerHTML = fwd ? pageHTML(n, "L") : pageHTML(n, "R");
  // reveal the destination underneath
  if (fwd) $("#page-R").innerHTML = pageHTML(n, "R"); else $("#page-L").innerHTML = pageHTML(n, "L");
  requestAnimationFrame(() => leaf.classList.add("go"));
  setTimeout(() => { page = n; renderBook(); leaf.className = "leaf"; flipping = false; }, 760);
}
$("#book-prev").addEventListener("click", () => flipTo(page - 1));
$("#book-next").addEventListener("click", () => flipTo(page + 1));
$("#bookDlg").addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight") flipTo(page + 1);
  if (e.key === "ArrowLeft") flipTo(page - 1);
});
renderBook();

// ---------------------------------------------------------------- laptop photos
function renderPhotos() {
  $("#ph-grid").innerHTML = HOBBIES.map((h, i) => {
    const img = (h.media || []).find((m) => m.type === "image" || m.poster);
    return `<li><button type="button" data-h="${i}" style="--tone:${esc(h.tone)}">
      ${img ? `<img src="${esc(img.poster || img.src)}" alt="">` : `<span class="ph-art">${esc(h.title[0])}</span>`}
      <span class="ph-play" aria-hidden="true">▶</span>
      <span class="ph-cap"><b>${esc(h.title)}</b><small>${esc(h.sub)}</small></span></button></li>`;
  }).join("");
  $$("#ph-grid button").forEach((b) => b.addEventListener("click", () => showVideo(+b.dataset.h)));
}
function showVideo(i) {
  const h = HOBBIES[i];
  const v = (h.media || []).find((m) => m.type === "video" || m.type === "youtube");
  $("#ph-viewer").hidden = false;
  $("#ph-library").hidden = true;
  $("#ph-viewer-title").textContent = h.title;
  $("#ph-stage").innerHTML = v
    ? (v.type === "youtube" ? `<iframe src="https://www.youtube-nocookie.com/embed/${esc(v.id)}" title="${esc(h.title)}" allow="encrypted-media; picture-in-picture" allowfullscreen></iframe>` : `<video src="${esc(v.src)}" controls playsinline autoplay></video>`)
    : `<div class="ph-empty" style="--tone:${esc(h.tone)}"><span>▶</span><p>${esc(h.title)} video coming soon</p></div>`;
  $("#ph-back").focus();
}
$("#ph-back").addEventListener("click", () => { $("#ph-viewer").hidden = true; $("#ph-library").hidden = false; $("#ph-stage").innerHTML = ""; });
renderPhotos();

// copy email
$$("[data-copy]").forEach((b) => b.addEventListener("click", async () => {
  try { await navigator.clipboard.writeText(CONTACT.email); b.textContent = "Copied ✓"; }
  catch (e) { b.textContent = CONTACT.email; }
  setTimeout(() => (b.textContent = "Copy email"), 2200);
}));

// ---------------------------------------------------------------- the storybook
const sections = $$(".scene");
const mobileish = !finePointer || Math.min(innerWidth, innerHeight) < 700;
const STILL = new URLSearchParams(location.search).has("still");

// narration text on each chapter card
$$(".scene").forEach((sec, i) => { const n = $(".narr", sec); if (n) n.textContent = NARRATION[i]; });

// buttons that work everywhere
const openLetter = (opener) => openDialog($("#letterDlg"), opener);
const openBook = (opener) => { $(".expbook")?.classList.add("pulled"); setTimeout(() => openDialog($("#bookDlg"), opener), reduceMotion ? 0 : 450); };
const openTools = (opener) => openDialog($("#toolsDlg"), opener);
const openPhotos = (opener) => openDialog($("#photosDlg"), opener);
$("#btn-letter").addEventListener("click", (e) => openLetter(e.currentTarget));
$("#btn-book").addEventListener("click", (e) => openBook(e.currentTarget));
$("#btn-tools").addEventListener("click", (e) => openTools(e.currentTarget));
$("#btn-certs").addEventListener("click", (e) => openDialog($("#certsDlg"), e.currentTarget));
$("#btn-photos").addEventListener("click", (e) => openPhotos(e.currentTarget));
$("#btn-apart").addEventListener("click", () => setApart(true));
$("#btn-build").addEventListener("click", () => setApart(false));
function releaseFocus() { $(".expbook")?.classList.remove("pulled"); }

// chapter nav
const NAMES = ["Once upon a time", "Byte flies to the city", "A letter", "The experience book", "The workshop", "Honors", "Off the clock", "The end"];
const READY = [0.5, 0.86, 0.9, 0.6, 0.5, 0.5, 0.7, 0.45];
$("#scene-nav").innerHTML = NAMES.map((n, i) => `<li><button type="button" data-go="${i}" aria-label="Go to ${n}"><span>${n}</span></button></li>`).join("");
$$("#scene-nav button").forEach((b) => b.addEventListener("click", () => {
  const i = +b.dataset.go, s = sections[i];
  const y = i === 0 && b.closest("[data-goto]") ? 0 : s.offsetTop + (s.offsetHeight - innerHeight) * READY[i];
  window.scrollTo({ top: y, behavior: reduceMotion ? "auto" : "smooth" });
}));
$$("[data-goto]").forEach((a) => a.addEventListener("click", (e) => {
  e.preventDefault();
  const i = +a.dataset.goto;
  if (i === 0) window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  else $(`#scene-nav [data-go="${i}"]`).click();
}));

// take apart / build (the painted parts fly off the bench)
function setApart(on) {
  $$("#world .part").forEach((p, k) => {
    const { ax, ay, ar } = p.dataset;
    p.style.transitionDelay = on ? `${(k % 5) * 40}ms` : "0ms";
    p.style.transform = on ? `translate(${ax * 0.55}px, ${ay * 0.35}px) rotate(${ar * 0.7}deg)` : "";
  });
  $("#btn-apart").setAttribute("aria-pressed", String(on));
  $("#btn-build").setAttribute("aria-pressed", String(!on));
}

// ---------------------------------------------------------------- narrator voice
let narrating = false, spokenFor = -1;
const synth = window.speechSynthesis;
function pickVoice() {
  const vs = synth ? synth.getVoices() : [];
  const pref = ["Samantha", "Google US English", "Microsoft Aria", "Microsoft Jenny", "Karen", "Moira", "Serena", "Ava"];
  for (const p of pref) { const v = vs.find((x) => x.name.includes(p)); if (v) return v; }
  return vs.find((x) => /^en/i.test(x.lang)) || null;
}
function speak(i) {
  if (!synth || !narrating) return;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(NARRATION[i]);
  const v = pickVoice();
  if (v) u.voice = v;
  u.rate = 0.92; u.pitch = 1.05;
  synth.speak(u);
  spokenFor = i;
}
if (!synth) $("#narrate").hidden = true;
$("#narrate").addEventListener("click", (e) => {
  narrating = !narrating;
  e.currentTarget.setAttribute("aria-pressed", String(narrating));
  if (narrating) speak(curSec); else synth.cancel();
});
let curSec = 0;

// ---------------------------------------------------------------- build the book and the world
const cam = $("#cam"), bookEl = $("#book"), win = $("#window"), world = $("#world"), cover = $("#cover");
world.insertAdjacentHTML("beforeend", DEFS);
$("#byte").innerHTML = DRONE;
const scenes = SCENES.map((make, i) => {
  const sc = make();
  const root = document.createElement("div");
  root.className = "sc";
  root.style.display = "none";
  root.innerHTML = sc.layers.map((l) => {
    const [x0, y0, w, h] = l.box;
    return `<svg class="layer" viewBox="${x0} ${y0} ${w} ${h}" width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">${l.inner}</svg>`;
  }).join("");
  world.appendChild(root);
  sc.root = root;
  sc.els = [...root.children].map((el, k) => ({ el, d: sc.layers[k].d, x0: sc.layers[k].box[0], y0: sc.layers[k].box[1] }));
  sc.shown = false;
  return sc;
});

// paper grain, painted once
{
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d"), img = g.createImageData(256, 256);
  for (let i = 0; i < img.data.length; i += 4) { const v = 170 + Math.random() * 85; img.data[i] = v; img.data[i + 1] = v * 0.97; img.data[i + 2] = v * 0.9; img.data[i + 3] = 255; }
  g.putImageData(img, 0, 0);
  $("#window .grain").style.backgroundImage = `url(${c.toDataURL()})`;
}

// clicks inside the paintings
world.addEventListener("click", (e) => {
  const hot = e.target.closest("[data-hot]");
  if (!hot) return;
  const [kind, arg] = hot.dataset.hot.split(":");
  if (kind === "letter") openLetter(document.activeElement);
  else if (kind === "book") openBook(document.activeElement);
  else if (kind === "sketch") openTools(document.activeElement);
  else if (kind === "laptop") openPhotos(document.activeElement);
  else if (kind === "build") { const b = BUILDS.find((x) => x.key === arg); openDetail({ ...b, placeholder: "Photos and a video of the real build coming soon" }); }
  else if (kind === "cert") openDetail(certDetail(ALL_CERTS[+arg]));
});

// ---------------------------------------------------------------- geometry
let VW = innerWidth, VH = innerHeight, G = {};
function layout() {
  VW = innerWidth; VH = innerHeight;
  const W = VW, H = VH, portrait = W / H < 1.05;
  const m = Math.round(Math.min(W, H) * 0.05), b = Math.round(m * 0.55);
  const P = portrait ? W + 2 * m : W / 2 + m, Ph = H + 2 * m;
  const wx = portrait ? m : -W / 2;
  G = { W, H, m, b, P, Ph, wx, portrait };
  const px = (el, x, y, w, h) => Object.assign(el.style, { left: x + "px", top: y + "px", width: w + "px", height: h + "px" });
  px($("#book .board.l"), -P - b, -b, P + b, Ph + 2 * b);
  px($("#book .board.r"), 0, -b, P + b, Ph + 2 * b);
  px($("#book .pg.l"), -P, 0, P, Ph);
  px($("#book .pg.r"), 0, 0, P, Ph);
  px(win, wx, m, W, H);
  px(cover, 0, -b, P + b, Ph + 2 * b);
  bookEl.style.setProperty("--P", P + "px");
  win.style.setProperty("--W", W + "px");
}
const BOOK = {
  closed: () => ({ cx: (G.P + G.b) / 2, cy: G.Ph / 2, s: Math.min((0.8 * VW) / (G.P + 2 * G.b), (0.74 * VH) / (G.Ph + 2 * G.b)) }),
  open: () => G.portrait
    ? { cx: G.P / 2, cy: G.Ph / 2, s: Math.min((0.9 * VW) / (G.P + G.b), (0.78 * VH) / (G.Ph + 2 * G.b)) }
    : { cx: 0, cy: G.Ph / 2, s: Math.min((0.9 * VW) / (2 * G.P + 2 * G.b), (0.8 * VH) / (G.Ph + 2 * G.b)) },
  dive: () => ({ cx: G.wx + G.W / 2, cy: G.m + G.H / 2, s: 1 }),
  end: () => { const c = BOOK.closed(); return { cx: c.cx, cy: c.cy + (G.Ph + 2 * G.b) * 0.2, s: c.s * 0.72 }; },
};
const smooth = (t) => { t = clamp01(t); return t * t * t * (t * (t * 6 - 15) + 10); };
const camMix = (a, b, k) => ({ cx: lerp(a.cx, b.cx, k), cy: lerp(a.cy, b.cy, k), s: a.s * Math.pow(b.s / a.s, k) });

// ---------------------------------------------------------------- scroll → story time
function readScroll() {
  const y = window.scrollY;
  let i = 0;
  for (let k = 0; k < sections.length; k++) if (y >= sections[k].offsetTop - 2) i = k;
  const s = sections[i];
  return i + clamp01((y - s.offsetTop) / Math.max(1, s.offsetHeight - innerHeight));
}
const T = 0.14; // share of each chapter spent on the transition into it
function storyState(s) {
  const sec = Math.min(7, Math.floor(s + 1e-6)), u = clamp01(s - sec);
  // the book camera and cover angle
  let bc, ang = -180;
  if (sec === 0) {
    const k1 = smooth(seg(u, 0.05, 0.3));
    ang = -180 * k1;
    if (u < 0.3) bc = camMix(BOOK.closed(), BOOK.open(), k1);
    else if (u < 0.5) bc = BOOK.open();
    else bc = camMix(BOOK.open(), BOOK.dive(), smooth(seg(u, 0.5, 0.88)));
  } else if (sec === 7 && u > 0.62) {
    if (u < 0.84) bc = camMix(BOOK.dive(), BOOK.open(), smooth(seg(u, 0.62, 0.84)));
    else { const k = smooth(seg(u, 0.84, 0.97)); bc = camMix(BOOK.open(), BOOK.end(), k); ang = -180 * (1 - k); }
  } else bc = BOOK.dive();
  // which painted scenes are showing
  let shots;
  if (sec === 0) shots = [{ i: 0, t: seg(u, 0.5, 1), o: 1, w: 1, dz: 1 }];
  else if (u < T) {
    const k = smooth(u / T);
    // a storybook iris: the next picture opens in a circle around Byte
    shots = [{ i: sec - 1, t: 1, o: 1, w: 1 - k, dz: 1 + 0.35 * k }, { i: sec, t: 0, o: 1, w: k, dz: 1.12 - 0.12 * k, iris: k }];
  } else shots = [{ i: sec, t: clamp01((u - T) / ((sec === 7 ? 0.62 : 1) - T)), o: 1, w: 1, dz: 1 }];
  return { sec, u, bc, ang, shots };
}

// ---------------------------------------------------------------- the frame loop
const root = document.documentElement;
const hint = $("#hint");
let mx = innerWidth * 0.7, my = innerHeight * 0.6, hx = mx, hy = my, seenMouse = false;
window.addEventListener("pointermove", (e) => { if (e.pointerType === "mouse") { mx = e.clientX; my = e.clientY; seenMouse = true; } }, { passive: true });
if (finePointer) hint.classList.add("follow"); else hint.classList.add("docked");
const HINTS = ["Scroll to open the book", "Keep scrolling: fly with Byte", "Click the letter on the desk", "Click the wiggling book", "Click a build or the sketch paper", "Click any frame", "Click the laptop", "Keep scrolling"];
function hintText(sec, u) {
  if (sec === 0) return u < 0.3 ? "Scroll to open the book" : "Keep scrolling: step into the story";
  if (sec === 1 && u > 0.8) return "Keep scrolling: home again";
  if (u < T + 0.04) return "Keep scrolling";
  if (sec === 7) return u > 0.9 ? "The End ♡" : "Keep scrolling";
  return HINTS[sec];
}
const iris = $("#iris");
const paper = $("#paper"), holo = $("#holo"), lasers = $("#lasers"), byte = $("#byte"), snow = $(".snow");
let slapped = false, smoothS = 0, first = true, last = performance.now();
let byteX = 0, byteY = 0, byteTilt = 0, rasterS = 1, stableFrames = 0, lastBs = 0;

function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  const time = now / 1000;
  const target = readScroll();
  smoothS = first || reduceMotion || STILL ? target : lerp(smoothS, target, 1 - Math.pow(0.008, dt));
  if (Math.abs(target - smoothS) > 1.2) smoothS = target;
  const st = storyState(smoothS);
  const { sec, u, bc, ang } = st;

  // book camera + cover
  cam.style.transform = `translate(${VW / 2}px, ${VH / 2}px) scale(${bc.s}) translate(${-bc.cx}px, ${-bc.cy}px)`;
  cover.style.transform = `rotateY(${ang}deg)`;
  cover.style.zIndex = ang < -90 ? -1 : 5;
  const leftVisible = ang < -90;
  bookEl.classList.toggle("closed", !leftVisible);
  ["#book .board.l", "#book .pg.l"].forEach((q) => ($(q).style.visibility = leftVisible ? "" : "hidden"));
  win.style.clipPath = !leftVisible && !G.portrait ? `inset(0 0 0 ${-G.wx}px)` : "none";
  // re-raster the paintings sharply once the book camera settles
  if (Math.abs(bc.s - lastBs) < 1e-4) stableFrames++; else stableFrames = 0;
  lastBs = bc.s;
  if (stableFrames === 6 && Math.abs(bc.s - rasterS) / rasterS > 0.04) { world.classList.add("rr"); rasterS = bc.s; requestAnimationFrame(() => world.classList.remove("rr")); }

  // the painted scenes
  const W = G.W, H = G.H, k0 = Math.max(W / 1600, H / 1250);
  const want = new Set(st.shots.map((x) => x.i));
  if (st.shots.length === 1) iris.style.display = "none";
  scenes.forEach((sc, i) => { const on = want.has(i); if (on !== sc.shown) { sc.root.style.display = on ? "" : "none"; sc.shown = on; } });
  let bx = 0, by = 0, bs = 0, bw = 0, snowy = 0;
  st.shots.forEach((shot) => {
    const sc = scenes[shot.i];
    const c = sc.cam(shot.t, G.portrait);
    sc.root.style.opacity = shot.o.toFixed(3);
    sc.root.style.zIndex = shot.iris !== undefined ? 2 : 1;
    if (shot.iris !== undefined) {
      const r = Math.max(1, shot.iris * Math.hypot(W, H) * 1.05);
      sc.root.style.clipPath = `circle(${r.toFixed(1)}px at ${byteX.toFixed(1)}px ${byteY.toFixed(1)}px)`;
      Object.assign(iris.style, { display: shot.iris < 0.99 ? "block" : "none", width: 2 * r + "px", height: 2 * r + "px", transform: `translate(${(byteX - r).toFixed(1)}px, ${(byteY - r).toFixed(1)}px)` });
    } else sc.root.style.clipPath = "";
    sc.els.forEach(({ el, d, x0, y0 }) => {
      const zl = (1 + (c.z - 1) * d) * (1 + (shot.dz - 1) * Math.min(1.2, d));
      const cx = 800 + (c.x - 800) * d, cy = 450 + (c.y - 450) * d;
      el.style.transform = `translate(${(W / 2).toFixed(1)}px, ${(H / 2).toFixed(1)}px) scale(${(k0 * zl).toFixed(5)}) translate(${(x0 - cx).toFixed(2)}px, ${(y0 - cy).toFixed(2)}px)`;
    });
    if (sc.tick) sc.tick(sc.root, shot.t, time);
    const dr = sc.drone(shot.t, G.portrait);
    const z1 = c.z * shot.dz;
    bx += (W / 2 + k0 * z1 * (dr.x - c.x)) * shot.w;
    by += (H / 2 + k0 * z1 * (dr.y - c.y)) * shot.w;
    bs += k0 * z1 * dr.s * shot.w;
    bw += shot.w;
    if (sc.snow) snowy += shot.w;
  });
  snow.classList.toggle("on", snowy > 0.5);
  bx /= bw; by /= bw; bs /= bw;
  const vx = (bx - byteX) / Math.max(dt, 1e-3);
  byteTilt = lerp(byteTilt, clamp01(Math.abs(vx) / 900) * Math.sign(vx) * 14, 0.1);
  byteX = bx; byteY = by;
  const bob = reduceMotion ? 0 : Math.sin(time * 2.2) * 6 * bs;
  byte.style.transform = `translate(${(bx - 100).toFixed(1)}px, ${(by - 65 + bob).toFixed(1)}px) scale(${bs.toFixed(4)}) rotate(${byteTilt.toFixed(2)}deg)`;

  // story text on the page
  $("#pagetext").style.opacity = sec === 0 ? (seg(u, 0.24, 0.32) * (1 - seg(u, 0.5, 0.58))).toFixed(3) : 0;
  $("#endtext").style.opacity = sec === 7 ? (seg(u, 0.7, 0.78) * (1 - seg(u, 0.86, 0.9))).toFixed(3) : 0;
  $("#cue").classList.toggle("show", sec === 0 && u < 0.08);

  // HUD
  if (sec !== curSec) { curSec = sec; if (narrating) speak(sec); }
  root.dataset.scene = sec;
  sections.forEach((s, i) => s.classList.toggle("active", i === sec));
  $$("#scene-nav button").forEach((b, i) => b.classList.toggle("on", i === sec));
  const showCard = sec >= 1 && u > T + 0.04 && (sec !== 1 || u < 0.8) && (sec !== 7 || u < 0.4);
  $$(".act").forEach((a) => a.classList.toggle("show", showCard && a.closest(".scene") === sections[sec]));
  $("#fin").classList.toggle("show", sec === 7 && u > 0.9);
  // newspaper
  const wantPaper = sec === 1 && u > 0.84 && u < 0.985;
  if (wantPaper && !slapped) { slapped = true; paper.classList.add("in"); }
  if (!wantPaper && slapped) { slapped = false; paper.classList.remove("in"); }
  // hologram and lasers from Byte
  const showHolo = sec === 7 && u > 0.42 && u < 0.62;
  holo.classList.toggle("in", showHolo);
  if (showHolo) {
    const scr = (x, y) => [VW / 2 + bc.s * (G.wx + x - bc.cx), VH / 2 + bc.s * (G.m + y - bc.cy)];
    const [sx, sy] = scr(bx, by + 6 * bs);
    const hw = G.portrait ? Math.min(VW - 32, 420) : Math.min(520, VW * 0.4), hh = G.portrait ? 340 : 360;
    const hl = G.portrait ? (VW - hw) / 2 : Math.min(VW - hw - 70, sx + VW * 0.12), ht = G.portrait ? Math.max(70, sy - hh - 70) : Math.max(70, VH * 0.5 - hh / 2 - 40);
    Object.assign(holo.style, { left: hl + "px", top: ht + "px", width: hw + "px", minHeight: hh + "px" });
    const cs = [[hl, ht], [hl + hw, ht], [hl + hw, ht + hh], [hl, ht + hh]];
    const pulse = 0.5 + 0.5 * Math.sin(time * 6);
    lasers.innerHTML = `<polygon points="${sx},${sy} ${cs[0]} ${cs[3]}" fill="#7dffd0" opacity="${(0.06 + 0.04 * pulse).toFixed(3)}"/><polygon points="${sx},${sy} ${cs[0]} ${cs[1]}" fill="#7dffd0" opacity=".05"/>` +
      cs.map((p) => `<line x1="${sx}" y1="${sy}" x2="${p[0]}" y2="${p[1]}" stroke="#a8ffe0" stroke-width="1.4" opacity=".85"/>`).join("");
  } else if (lasers.innerHTML) lasers.innerHTML = "";

  // cursor hint
  hint.textContent = hintText(sec, u);
  const dlgOpen = !!document.querySelector("dialog[open]");
  if (hint.classList.contains("follow")) {
    hx = lerp(hx, mx + 22, 0.18); hy = lerp(hy, my + 26, 0.18);
    hint.style.transform = `translate(${Math.min(innerWidth - hint.offsetWidth - 10, hx).toFixed(1)}px, ${Math.min(innerHeight - 40, hy).toFixed(1)}px)`;
    hint.style.visibility = seenMouse && !dlgOpen ? "" : "hidden";
  } else hint.style.visibility = dlgOpen ? "hidden" : "";
  first = false;
}
layout();
window.addEventListener("resize", layout);
requestAnimationFrame(frame);
if (STILL) window.__story = { storyState, scenes };
