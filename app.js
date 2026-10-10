// The movie: scroll drives a camera and a drone through eight scenes.
// Content lives in data.js; the 3D world is built in world.js.
import { createWorld } from "./world.js";
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

// ---------------------------------------------------------------- the movie
const sections = $$(".scene");
const canvas = $("#world");
const mobile = !finePointer || Math.min(innerWidth, innerHeight) < 700;
let W;
try {
  W = createWorld(canvas, { mobile });
} catch (e) {
  console.warn("3D unavailable, showing the flat version", e);
  document.documentElement.classList.add("flat");
}

// Opening overlays and buttons work with or without 3D.
const openLetter = (opener) => { focusOn("letter"); setTimeout(() => openDialog($("#letterDlg"), opener), reduceMotion ? 0 : 650); };
const openBook = (opener) => { pullBook(); setTimeout(() => openDialog($("#bookDlg"), opener), reduceMotion ? 0 : 700); };
const openTools = (opener) => openDialog($("#toolsDlg"), opener);
const openPhotos = (opener) => { focusOn("laptop"); setTimeout(() => openDialog($("#photosDlg"), opener), reduceMotion ? 0 : 650); };
$("#btn-letter").addEventListener("click", (e) => openLetter(e.currentTarget));
$("#btn-book").addEventListener("click", (e) => openBook(e.currentTarget));
$("#btn-tools").addEventListener("click", (e) => openTools(e.currentTarget));
$("#btn-certs").addEventListener("click", (e) => openDialog($("#certsDlg"), e.currentTarget));
$("#btn-photos").addEventListener("click", (e) => openPhotos(e.currentTarget));
$("#btn-apart").addEventListener("click", () => setApart(true));
$("#btn-build").addEventListener("click", () => setApart(false));

// scene nav
const NAMES = ["Home", "Headlines", "Letter", "Experience", "Workshop", "Honors", "Hobbies", "Contact"];
const READY = [0, 0.8, 0.85, 0.5, 0.45, 0.45, 0.65, 0.6];
$("#scene-nav").innerHTML = NAMES.map((n, i) => `<li><button type="button" data-go="${i}" aria-label="Go to ${n}"><span>${n}</span></button></li>`).join("");
$$("#scene-nav button").forEach((b) => b.addEventListener("click", () => {
  const i = +b.dataset.go, s = sections[i];
  const y = s.offsetTop + (s.offsetHeight - innerHeight) * READY[i];
  window.scrollTo({ top: y, behavior: reduceMotion ? "auto" : "smooth" });
}));
$$("[data-goto]").forEach((a) => a.addEventListener("click", (e) => { e.preventDefault(); $(`#scene-nav [data-go="${a.dataset.goto}"]`).click(); }));

if (!W) {
  // flat fallback: nothing else to drive
  $("#loader").remove();
} else {
  runMovie();
}

function focusOn() {}
function releaseFocus() {}
function pullBook() {}
function setApart() {}

// ================================================================= 3D
function runMovie() {
  const { THREE, camera, renderer, scene, drone, objects: O } = W;
  const V3 = (a) => new THREE.Vector3(a[0], a[1], a[2]);

  // ---------- camera & drone keyframes per scene: [u, camPos, lookAt] / [u, dronePos, yaw]
  const PI = Math.PI;
  const CAM = [
    [[0, [1.6, 2.1, 9.8], [-1.0, 3.2, 4.2]], [1, [1.4, 2.5, 8.6], [-0.7, 3.3, 4.2]]],
    [[0, [1.4, 2.5, 8.6], [-0.7, 3.3, 4.2]], [0.12, [3.8, 3.0, 5.8], [0, 3.4, 4.2]], [0.22, [3.0, 3.7, 1.6], [0, 3.6, 4.4]],
     [0.3, [0, 4.0, 1.0], [0, 4.2, 10]], [0.4, [0, 6.7, 6.0], [0, 7.4, 16]], [0.47, [0, 7.6, 9.8], [0, 8.6, 22]],
     [0.57, [0, 40, 86], [0, 32, 200]], [0.67, [0, 70, 470], [6, 80, 700]], [0.74, [-6, 78, 548], [10, 120, 700]], [1, [-6, 78, 550], [10, 120, 700]]],
    [[0, [10, 4, 44], [4.2, 1.4, 27.5]], [0.1, [8, 3.2, 36], [4.2, 1.6, 27.5]], [0.18, [3.6, 2.8, 31], [0.5, 2.2, 18]],
     [0.28, [0, 2.6, 18.5], [0, 2.3, 8]], [0.34, [0, 2.4, 11.6], [0, 2.4, 2]], [0.41, [0, 2.8, 4.6], [0, 3.6, -3]],
     [0.48, [0, 4.4, -1.6], [0, 6.4, -8]], [0.55, [0, 6.6, -7.3], [-6, 6.6, -8.4]], [0.62, [-4.4, 7.0, -8.1], [-9, 7, -5.5]],
     [0.71, [-9.0, 7.9, 1.6], [-9.1, 6.2, 7]], [0.8, [-8.3, 7.15, 5.05], [-9.0, 5.95, 7.05]], [1, [-8.3, 7.15, 5.05], [-9.0, 5.95, 7.05]]],
    [[0, [-8.3, 7.15, 5.05], [-9.0, 5.95, 7.05]], [0.3, [-9.2, 7.6, 1.4], [-13.4, 7.4, 0.4]], [1, [-9.25, 7.6, 1.35], [-13.4, 7.4, 0.4]]],
    [[0, [-9.25, 7.6, 1.35], [-13.4, 7.4, 0.4]], [0.3, [-10.3, 7.9, -2.7], [-10.3, 6.45, -9.4]], [1, [-10.3, 7.9, -2.8], [-10.3, 6.45, -9.4]]],
    [[0, [-10.3, 7.9, -2.8], [-10.3, 6.45, -9.4]], [0.3, [-13.1, 7.6, -1.4], [-5.2, 7.55, -1.4]], [1, [-13.1, 7.6, -1.4], [-5.2, 7.55, -1.4]]],
    [[0, [-13.1, 7.6, -1.4], [-5.2, 7.55, -1.4]], [0.12, [-6.6, 7.0, -6.6], [0, 7, -8.6]], [0.22, [0, 7.0, -8.4], [6, 7, -8.0]],
     [0.32, [6.4, 7.2, -7.0], [10, 6.5, 0]], [0.45, [8.4, 7.6, -1.8], [10.4, 6.3, 0.6]], [0.56, [11.6, 7.6, 1.6], [10.2, 6.15, 0.5]], [1, [11.6, 7.6, 1.6], [10.2, 6.15, 0.5]]],
    [[0, [11.6, 7.6, 1.6], [10.2, 6.15, 0.5]], [0.15, [9.5, 7.4, 3.5], [9.5, 7.5, 10]], [0.3, [9.5, 7.6, 7.6], [9.5, 7.6, 16]],
     [0.45, [2.5, 5.6, 34], [3.6, 7.2, 16]], [1, [2.5, 5.6, 34.5], [3.6, 7.2, 16]]],
  ];
  const DRONE = [
    [[0, [0, 3.4, 4.2], 0], [1, [0, 3.4, 4.2], 0]],
    [[0, [0, 3.4, 4.2], 0], [0.22, [0, 3.5, 4.0], 0], [0.3, [0, 3.7, 2.6], 0], [0.4, [0, 6.6, 7.6], 0], [0.47, [0, 7.6, 11.6], 0],
     [0.57, [0, 39.4, 90], 0], [0.67, [0, 69, 474], 0], [0.74, [-3.6, 76.4, 553], 0], [1, [-3.6, 76.4, 553], 0]],
    [[0, [4.2, 2.3, 27.5], PI], [0.1, [4.2, 2.1, 27.5], PI], [0.18, [1.5, 2.2, 24], PI], [0.28, [0, 2.2, 13], PI], [0.34, [0, 2.3, 7.5], PI],
     [0.41, [0, 2.8, 0.6], PI], [0.48, [0, 5.2, -5], PI], [0.55, [-2.8, 6.7, -8.6], PI * 1.5], [0.62, [-7.6, 7.1, -7.4], PI * 1.5],
     [0.71, [-8.4, 7.6, 3.8], PI * 2], [0.8, [-10.9, 7.0, 7.9], PI * 2.15], [1, [-10.9, 7.0, 7.9], PI * 2.15]],
    [[0, [-10.9, 7.0, 7.9], PI * 2.15], [0.3, [-11.2, 8.3, 2.2], PI * 1.5], [1, [-11.2, 8.3, 2.2], PI * 1.5]],
    [[0, [-11.2, 8.3, 2.2], PI * 1.5], [0.3, [-7.9, 9.2, -6.6], PI], [1, [-7.9, 9.2, -6.6], PI]],
    [[0, [-7.9, 9.2, -6.6], PI], [0.3, [-7.4, 9.4, 3.2], PI * 0.5], [1, [-7.4, 9.4, 3.2], PI * 0.5]],
    [[0, [-7.4, 9.4, 3.2], PI * 0.5], [0.12, [-3.6, 7.2, -7.6], PI * 0.5], [0.22, [3, 7.1, -8.2], PI * 0.5], [0.32, [8, 7.3, -4], 0],
     [0.45, [9.6, 7.6, -0.6], 0], [0.56, [11.9, 8.1, 1.9], -PI * 0.5], [1, [11.9, 8.1, 1.9], -PI * 0.5]],
    [[0, [11.9, 8.1, 1.9], -PI * 0.5], [0.15, [9.5, 7.5, 6.4], 0], [0.3, [9.5, 7.6, 12], 0], [0.45, [6.2, 8.2, 17.5], 0], [1, [6.2, 8.2, 17.5], 0]],
  ];

  // centripetal Catmull–Rom through the keys of one scene
  function cr(p0, p1, p2, p3, t) {
    const d = (a, b) => Math.max(1e-4, Math.pow(a.distanceTo(b), 0.5));
    const t0 = 0, t1 = d(p0, p1), t2 = t1 + d(p1, p2), t3 = t2 + d(p2, p3);
    const tt = t1 + (t2 - t1) * t;
    const L = (a, b, ta, tb) => a.clone().multiplyScalar((tb - tt) / (tb - ta)).add(b.clone().multiplyScalar((tt - ta) / (tb - ta)));
    const A1 = L(p0, p1, t0, t1), A2 = L(p1, p2, t1, t2), A3 = L(p2, p3, t2, t3);
    const B1 = L(A1, A2, t0, t2), B2 = L(A2, A3, t1, t3);
    return L(B1, B2, t1, t2);
  }
  function sampleVec(keys, u, idx) {
    if (u <= keys[0][0]) return V3(keys[0][idx]);
    for (let i = 0; i < keys.length - 1; i++) {
      const a = keys[i], b = keys[i + 1];
      if (u <= b[0]) {
        const t = (u - a[0]) / (b[0] - a[0] || 1);
        const P1 = V3(a[idx]), P2 = V3(b[idx]);
        if (P1.distanceTo(P2) < 1e-4) return P1;
        const P0 = V3((keys[i - 1] || a)[idx]), P3 = V3((keys[i + 2] || b)[idx]);
        const p0 = P0.distanceTo(P1) < 1e-4 ? P1.clone().multiplyScalar(2).sub(P2) : P0;
        const p3 = P3.distanceTo(P2) < 1e-4 ? P2.clone().multiplyScalar(2).sub(P1) : P3;
        return cr(p0, P1, P2, p3, t);
      }
    }
    return V3(keys[keys.length - 1][idx]);
  }
  function sampleNum(keys, u) {
    if (u <= keys[0][0]) return keys[0][2];
    for (let i = 0; i < keys.length - 1; i++) {
      const a = keys[i], b = keys[i + 1];
      if (u <= b[0]) return lerp(a[2], b[2], ease((u - a[0]) / (b[0] - a[0] || 1)));
    }
    return keys[keys.length - 1][2];
  }

  // ---------- scroll position → scene + local progress
  let sceneI = 0, sceneU = 0;
  function readScroll() {
    const y = window.scrollY;
    let i = 0;
    for (let k = 0; k < sections.length; k++) if (y >= sections[k].offsetTop - 2) i = k;
    const s = sections[i];
    const len = Math.max(1, s.offsetHeight - innerHeight);
    sceneI = i;
    sceneU = clamp01((y - s.offsetTop) / len);
  }
  let smoothS = 0;
  const STILL = new URLSearchParams(location.search).has("still");

  // ---------- textures drawn in 2D
  function drawLetter() {
    const c = O.letterCanvas, g = c.getContext("2d"), w = c.width, h = c.height;
    g.fillStyle = "#fbf6ea"; g.fillRect(0, 0, w, h);
    g.strokeStyle = "rgba(85,124,159,.28)"; g.lineWidth = 2;
    for (let y = 120; y < h - 30; y += 38) { g.beginPath(); g.moveTo(30, y); g.lineTo(w - 30, y); g.stroke(); }
    g.strokeStyle = "rgba(198,70,60,.35)"; g.beginPath(); g.moveTo(70, 0); g.lineTo(70, h); g.stroke();
    g.fillStyle = "#24304a"; g.font = "700 46px Caveat, cursive"; g.fillText("Dear reader,", 90, 105);
    g.font = "34px Caveat, cursive";
    const lines = ["I'm a Computer Engineering student", "at Boston University, passionate", "about AI, robotics, and building", "things that make life easier,", "smarter, or more fun…"];
    lines.forEach((l, i) => g.fillText(l, 90, 152 + i * 38));
    g.strokeStyle = "#24304a"; g.lineWidth = 2.5; g.beginPath(); g.moveTo(330, 334); g.quadraticCurveTo(360, 320, 390, 336); g.stroke();
    g.font = "26px Caveat, cursive"; g.fillStyle = "rgba(79,138,116,.9)"; g.fillText("(click to read the rest ♡)", 120, h - 60);
    O.letterTex.needsUpdate = true;
  }
  function drawScreen() {
    const c = O.screenCanvas, g = c.getContext("2d"), w = c.width, h = c.height;
    g.fillStyle = "#f4f2ee"; g.fillRect(0, 0, w, h);
    g.fillStyle = "#e7e3dc"; g.fillRect(0, 0, 150, h);
    g.fillStyle = "#e9e6e1"; g.fillRect(0, 0, w, 34);
    ["#ff5f57", "#febc2e", "#28c840"].forEach((col, i) => { g.fillStyle = col; g.beginPath(); g.arc(18 + i * 18, 17, 6, 0, 7); g.fill(); });
    g.fillStyle = "#333"; g.font = "600 15px system-ui, sans-serif"; g.fillText("Photos", w / 2 - 22, 22);
    g.font = "13px system-ui, sans-serif"; g.fillStyle = "#555";
    ["Library", "Memories", "Hobbies", "Robotics", "NYC"].forEach((t, i) => g.fillText(t, 18, 64 + i * 26));
    HOBBIES.forEach((hb, i) => {
      const col = i % 4, row = Math.floor(i / 4);
      const x = 166 + col * 116, y = 50 + row * 150;
      g.fillStyle = hb.tone; g.fillRect(x, y, 106, 106);
      g.fillStyle = "rgba(255,255,255,.85)"; g.beginPath(); g.moveTo(x + 45, y + 38); g.lineTo(x + 66, y + 53); g.lineTo(x + 45, y + 68); g.fill();
      g.fillStyle = "#333"; g.font = "12px system-ui, sans-serif"; g.fillText(hb.title, x, y + 124);
    });
    O.screenTex.needsUpdate = true;
  }
  function wrap(g, text, x, y, maxW, lh) {
    const words = text.split(" ");
    let line = "", lines = [];
    words.forEach((w) => { const t = line ? line + " " + w : w; if (g.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t; });
    if (line) lines.push(line);
    lines.forEach((l, i) => g.fillText(l, x, y + i * lh));
    return lines.length;
  }
  function drawCerts() {
    ALL_CERTS.forEach((cert, i) => {
      const f = O.certFrames[i];
      if (!f) return;
      const c = f.userData.canvas, g = c.getContext("2d"), w = c.width, h = c.height;
      g.fillStyle = "#fdfaf2"; g.fillRect(0, 0, w, h);
      g.strokeStyle = cert.honor ? "#b8914a" : "#7aa592"; g.lineWidth = 6; g.strokeRect(14, 14, w - 28, h - 28);
      g.lineWidth = 1.5; g.strokeRect(24, 24, w - 48, h - 48);
      g.textAlign = "center"; g.fillStyle = "#69716b"; g.font = "600 15px 'DM Sans', sans-serif";
      g.fillText(cert.kind.toUpperCase(), w / 2, 58);
      g.font = "italic 15px 'Libre Caslon Text', serif"; g.fillText("presented to", w / 2, 82);
      g.fillStyle = "#3f7a64"; g.font = "700 38px Caveat, cursive"; g.fillText("Shiqi Lin", w / 2, 118);
      g.fillStyle = "#1d2430"; g.font = "700 22px 'Playfair Display', serif";
      const n = wrap(g, cert.title, w / 2, 152, w - 90, 25);
      g.fillStyle = "#69716b"; g.font = "14px 'DM Sans', sans-serif";
      wrap(g, cert.issuer, w / 2, Math.min(h - 46, 152 + n * 25 + 14), w - 140, 17);
      g.fillStyle = cert.honor ? "#c9a35b" : "#9cc7b2";
      g.beginPath(); g.arc(w - 58, h - 58, 24, 0, 7); g.fill();
      g.fillStyle = "#1d2430"; g.font = "700 14px 'Playfair Display', serif"; g.fillText(cert.abbr, w - 58, h - 53);
      if (cert.links) { g.fillStyle = "#3f7a64"; g.font = "700 20px Caveat, cursive"; g.fillText("✓ verified", 72, h - 40); }
      f.userData.tex.needsUpdate = true;
      f.userData.cert = cert;
    });
  }
  const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
  fontsReady.then(() => Promise.all(["700 20px Caveat", "700 20px 'Playfair Display'", "15px 'DM Sans'"].map((f) => document.fonts.load(f).catch(() => {})))).then(() => { drawLetter(); drawScreen(); drawCerts(); });
  drawLetter(); drawScreen(); drawCerts();

  // ---------- interactions in 3D
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const parts = O.builds.flatMap((b) => b.userData.parts);
  const targets = () => {
    if (sceneI === 2 && sceneU > 0.72) return [O.letter];
    if (sceneI === 3 && sceneU > 0.2) return O.book.children;
    if (sceneI === 4 && sceneU > 0.22) return [O.sketch, ...parts];
    if (sceneI === 5 && sceneU > 0.22) return O.certFrames.map((f) => f.userData.face);
    if (sceneI === 6 && sceneU > 0.5) return [O.screen, ...O.laptop.children];
    return [];
  };
  let hovered = null;
  function pick(e) {
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(targets(), false)[0];
    return hit ? hit.object : null;
  }
  const kindOf = (obj) => {
    if (!obj) return null;
    if (obj === O.letter) return "letter";
    if (O.book.children.includes(obj)) return "book";
    if (obj === O.sketch) return "sketch";
    if (obj.userData.build) return "part";
    if (O.certFrames.some((f) => f.userData.face === obj)) return "cert";
    if (obj === O.screen || O.laptop.children.includes(obj)) return "laptop";
    return null;
  };

  // dragging build parts across the bench
  const benchPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -(W.anchors.benchTop + 0.05));
  let drag = null;
  canvas.addEventListener("pointerdown", (e) => {
    const obj = pick(e);
    if (kindOf(obj) === "part") {
      const g = obj.parent;
      drag = { obj, g, x: e.clientX, y: e.clientY, moved: false };
      canvas.setPointerCapture(e.pointerId);
      e.preventDefault();
    } else drag = { obj, x: e.clientX, y: e.clientY, moved: false, click: true };
  });
  canvas.addEventListener("pointermove", (e) => {
    if (drag && drag.g) {
      if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 4) drag.moved = true;
      if (drag.moved) {
        const r = canvas.getBoundingClientRect();
        ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
        ray.setFromCamera(ndc, camera);
        const p = new THREE.Vector3();
        if (ray.ray.intersectPlane(benchPlane, p)) {
          drag.g.worldToLocal(p);
          const tgt = drag.obj.userData;
          tgt.free = true;
          drag.obj.position.x = Math.max(-1.6, Math.min(1.6, p.x));
          drag.obj.position.z = Math.max(-0.6, Math.min(0.75, p.z));
          drag.obj.position.y = (apart ? tgt.apart.y : tgt.home.y) + 0.12;
        }
      }
      return;
    }
    if (drag && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 6) drag.moved = true;
    const obj = pick(e);
    if (hovered !== obj) {
      hovered = obj;
      canvas.style.cursor = obj ? (kindOf(obj) === "part" ? "grab" : "pointer") : "";
    }
  });
  canvas.addEventListener("pointerup", (e) => {
    if (!drag) return;
    const d = drag;
    drag = null;
    if (d.g) {
      if (d.moved) { d.obj.position.y = apart ? d.obj.userData.apart.y : d.obj.userData.home.y; return; }
      const b = BUILDS.find((x) => x.key === d.obj.userData.build);
      openDetail({ ...b, placeholder: "Photos and a video of the real build coming soon" }, canvas);
      return;
    }
    if (d.moved) return;
    const k = kindOf(d.obj);
    if (k === "letter") openLetter(canvas);
    else if (k === "book") openBook(canvas);
    else if (k === "sketch") openTools(canvas);
    else if (k === "laptop") openPhotos(canvas);
    else if (k === "cert") {
      const f = O.certFrames.find((x) => x.userData.face === d.obj);
      openDetail(certDetail(f.userData.cert), canvas);
    }
  });

  // take apart / build
  let apart = false;
  setApart = (on) => {
    apart = on;
    parts.forEach((p) => {
      const ud = p.userData;
      ud.free = false;
      ud.from = p.position.clone();
      ud.fromR = p.rotation.x;
      ud.to = on ? ud.apart.clone() : ud.home.clone();
      ud.toR = on && ud.lay ? Math.PI / 2 : 0;
      ud.t0 = performance.now() + Math.random() * 180;
    });
    $("#btn-apart").setAttribute("aria-pressed", String(on));
    $("#btn-build").setAttribute("aria-pressed", String(!on));
  };

  // camera focus for close-ups
  let focus = null, focusAmt = 0;
  const FOCUS = {
    letter: { pos: [-8.95, 6.85, 6.7], look: [-9.05, 5.95, 7.05] },
    laptop: { pos: [10.72, 6.62, 1.05], look: [10.22, 6.18, 0.58] },
  };
  focusOn = (k) => { focus = FOCUS[k] || null; };
  releaseFocus = () => { focus = null; bookPulled = false; };
  let bookPulled = false;
  pullBook = () => { bookPulled = true; };
  const bookHome = O.book.position.clone();

  // ---------- HUD
  const root = document.documentElement;
  const hint = $("#hint");
  const HINTS = [
    "Scroll to fly",
    "Keep scrolling: follow the drone",
    "Click the letter on the desk",
    "Click the glowing book on the shelf",
    "Drag the builds · click the sketch paper",
    "Click any frame on the wall",
    "Click the laptop",
    "Say hello ↓",
  ];
  function hintText() {
    if (sceneI === 1 && sceneU > 0.74) return "Keep scrolling: back to the house";
    if (sceneI === 2 && sceneU < 0.72) return "Keep scrolling: follow the drone home";
    if (sceneI === 3 && sceneU < 0.2) return "Keep scrolling";
    if (sceneI === 6 && sceneU < 0.5) return "Keep scrolling: to my room";
    if (sceneI === 7 && sceneU < 0.45) return "Keep scrolling";
    return HINTS[sceneI];
  }
  let mx = innerWidth * 0.7, my = innerHeight * 0.6, hx = mx, hy = my, seenMouse = false;
  window.addEventListener("pointermove", (e) => { if (e.pointerType === "mouse") { mx = e.clientX; my = e.clientY; seenMouse = true; } }, { passive: true });
  if (finePointer) hint.classList.add("follow");
  else hint.classList.add("docked");

  // ---------- newspaper slap + contacts hologram
  const paper = $("#paper");
  let slapped = false, shake = 0;
  const holo = $("#holo");

  // ---------- loop
  let lastT = performance.now();
  const tmpPos = new THREE.Vector3(), tmpLook = new THREE.Vector3();
  const camPos = new THREE.Vector3(), camLook = new THREE.Vector3();
  let first = true;
  function resize() { W.resize(innerWidth, innerHeight); }
  window.addEventListener("resize", resize);
  resize();

  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - lastT) / 1000);
    lastT = now;
    const t = now / 1000;
    readScroll();
    const target = sceneI + sceneU;
    smoothS = first || reduceMotion || STILL ? target : lerp(smoothS, target, 1 - Math.pow(0.0015, dt));
    if (Math.abs(target - smoothS) > 1.5) smoothS = target; // big jumps (nav clicks) cut instead of crawling
    const si = Math.min(CAM.length - 1, Math.floor(smoothS + 1e-6));
    const su = clamp01(smoothS - si);
    const portrait = camera.aspect < 0.9;

    // camera path
    tmpPos.copy(sampleVec(CAM[si], su, 1));
    tmpLook.copy(sampleVec(CAM[si], su, 2));
    if (portrait) {
      // pan across wide walls on narrow screens
      if (si === 4) { const k = seg(su, 0.35, 0.95); tmpPos.x = lerp(-12.0, -7.6, k); tmpLook.x = tmpPos.x; tmpPos.z += 0.6; }
      if (si === 5) { const k = seg(su, 0.35, 0.95); tmpPos.z = lerp(-3, 3, k); tmpLook.z = tmpPos.z; tmpPos.x = -11.2; }
      if (si === 3) { tmpPos.x += 0.4; }
      if (si === 0) { tmpLook.x = 0; }
    }
    // close-up focus
    focusAmt = STILL ? (focus ? 1 : 0) : lerp(focusAmt, focus ? 1 : 0, 1 - Math.pow(0.002, dt));
    if (focus || focusAmt > 0.001) {
      const f = focus || FOCUS.letter;
      tmpPos.lerp(V3(f.pos), focus ? focusAmt : 0);
      tmpLook.lerp(V3(f.look), focus ? focusAmt : 0);
    }
    camPos.copy(tmpPos);
    camLook.copy(tmpLook);
    if (shake > 0) { camPos.x += (Math.random() - 0.5) * shake; camPos.y += (Math.random() - 0.5) * shake; shake *= 0.86; if (shake < 0.002) shake = 0; }
    camera.position.copy(camPos);
    camera.lookAt(camLook);

    // drone
    const dp = sampleVec(DRONE[si], su, 1);
    const yaw = sampleNum(DRONE[si], su);
    const prev = drone.position.clone();
    drone.position.copy(dp);
    drone.position.y += reduceMotion ? 0 : Math.sin(t * 2.1) * 0.05;
    drone.rotation.set(0, yaw, 0);
    const vel = dp.clone().sub(prev);
    const loc = vel.applyAxisAngle(new THREE.Vector3(0, 1, 0), -yaw);
    drone.rotation.x = THREE.MathUtils.clamp(loc.z * 2.2, -0.35, 0.35);
    drone.rotation.z = THREE.MathUtils.clamp(-loc.x * 2.2, -0.35, 0.35);
    drone.userData.rotors.forEach((r, i) => (r.rotation.y += (i % 2 ? 1 : -1) * dt * 40));
    drone.userData.led.material.color.setHex(Math.sin(t * 6) > 0 ? 0x7dffb4 : 0x2c6b4c);
    // hide the drone when the camera is basically inside it
    drone.visible = camera.position.distanceTo(drone.position) > 0.45;

    // glow on clickable things
    const pulse = 0.5 + 0.5 * Math.sin(t * 3);
    O.letter.material.emissiveIntensity = sceneI === 2 && sceneU > 0.72 ? 0.12 + pulse * 0.25 : 0;
    O.bookMat.emissiveIntensity = sceneI === 3 && sceneU > 0.2 ? 0.35 + pulse * 0.65 : 0;
    O.bookHalo.visible = sceneI === 3 && sceneU > 0.2 && !bookPulled;
    O.bookHalo.material.opacity = 0.35 + pulse * 0.45;
    O.bookHalo.scale.setScalar(1 + pulse * 0.12);
    O.sketch.material.emissiveIntensity = sceneI === 4 && sceneU > 0.22 ? 0.08 + pulse * 0.18 : 0;
    O.certFrames.forEach((f) => (f.userData.face.material.emissiveIntensity = hovered === f.userData.face ? 0.4 : 0.12));
    // book slides out when pulled
    const bp = bookPulled ? 1 : 0;
    O.book.position.x = lerp(O.book.position.x, bookHome.x + bp * 0.75, 0.12);
    O.book.rotation.y = lerp(O.book.rotation.y, bp * 0.5, 0.12);
    // build parts animate between built and taken-apart
    parts.forEach((p) => {
      const ud = p.userData;
      if (!ud.to || ud.free) return;
      const k = ease(clamp01((now - ud.t0) / 700));
      p.position.lerpVectors(ud.from, ud.to, k);
      p.position.y += Math.sin(k * Math.PI) * 0.35;
      p.rotation.x = lerp(ud.fromR || 0, ud.toR || 0, k);
    });
    // mailbox flag pops when the drone visits
    O.flag.rotation.z = sceneI === 2 && sceneU > 0.08 ? -1.4 : 0;
    // chandelier sway
    O.chand.rotation.y = Math.sin(t * 0.3) * 0.08;

    // HUD state
    root.dataset.scene = sceneI;
    root.style.setProperty("--u", sceneU.toFixed(3));
    sections.forEach((s, i) => s.classList.toggle("active", i === sceneI));
    $$("#scene-nav button").forEach((b, i) => b.classList.toggle("on", i === sceneI));
    // fade between Manhattan and the mansion
    const fade = Math.max(si === 1 ? seg(su, 0.93, 1) : 0, si === 2 ? 1 - seg(su, 0, 0.06) : 0);
    $("#fade").style.opacity = fade.toFixed(3);
    // newspaper
    const wantPaper = sceneI === 1 && sceneU > 0.75 && sceneU < 0.97;
    if (wantPaper && !slapped) { slapped = true; paper.classList.add("in"); if (!reduceMotion) setTimeout(() => (shake = 0.5), 260); }
    if (!wantPaper && slapped) { slapped = false; paper.classList.remove("in"); }
    // interactive cues
    root.classList.toggle("ready", (sceneI === 2 && sceneU > 0.78) || (sceneI === 3 && sceneU > 0.25) || (sceneI === 4 && sceneU > 0.25) || (sceneI === 5 && sceneU > 0.25) || (sceneI === 6 && sceneU > 0.55));
    // contacts hologram + lasers
    const showHolo = sceneI === 7 && sceneU > 0.42;
    holo.classList.toggle("in", showHolo);
    O.lasers.visible = showHolo;
    O.beams.forEach((b) => (b.visible = showHolo));
    if (showHolo) {
      const fwd = new THREE.Vector3(); camera.getWorldDirection(fwd);
      const right = new THREE.Vector3().crossVectors(fwd, camera.up).normalize();
      const up = new THREE.Vector3().crossVectors(right, fwd).normalize();
      const dist = 10;
      const visW = 2 * dist * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect;
      const wR = Math.min(5.6, visW * (portrait ? 0.86 : 0.5));
      const hR = portrait ? wR * 1.2 : wR * 0.8;
      const C = camera.position.clone().add(fwd.clone().multiplyScalar(dist)).add(right.clone().multiplyScalar(portrait ? 0 : -visW * 0.18)).add(up.clone().multiplyScalar(portrait ? -1.1 : -0.3));
      const corners = [[-1, 1], [1, 1], [1, -1], [-1, -1]].map(([a, b]) => C.clone().add(right.clone().multiplyScalar(a * wR / 2)).add(up.clone().multiplyScalar(b * hR / 2)));
      const src = drone.userData.gimbal.getWorldPosition(new THREE.Vector3());
      O.beams.forEach((b, i) => {
        const c = corners[Math.floor(i / 2)];
        const mid = src.clone().add(c).multiplyScalar(0.5);
        const len = src.distanceTo(c);
        b.position.copy(mid);
        b.scale.set(1, len, 1);
        b.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), c.clone().sub(src).normalize());
        b.material.opacity = (0.55 + 0.35 * Math.sin(t * 9 + i)) * (b.userData.glow ? 0.35 : 1);
      });
      const sc = corners.map((c) => c.clone().project(camera));
      const xs = sc.map((p) => (p.x * 0.5 + 0.5) * innerWidth), ys = sc.map((p) => (-p.y * 0.5 + 0.5) * innerHeight);
      const L = Math.min(...xs), T = Math.min(...ys);
      holo.style.left = L + "px"; holo.style.top = T + "px";
      holo.style.width = Math.max(...xs) - L + "px"; holo.style.minHeight = Math.max(...ys) - T + "px";
    }
    // cursor hint
    hint.textContent = hintText();
    if (!hint.classList.contains("follow")) hint.style.visibility = document.querySelector("dialog[open]") ? "hidden" : "";
    if (hint.classList.contains("follow")) {
      hx = lerp(hx, mx + 22, 0.18); hy = lerp(hy, my + 26, 0.18);
      hint.style.transform = `translate(${Math.min(innerWidth - hint.offsetWidth - 10, hx).toFixed(1)}px, ${Math.min(innerHeight - 40, hy).toFixed(1)}px)`;
      hint.style.visibility = seenMouse && !document.querySelector("dialog[open]") ? "" : "hidden";
    }

    renderer.render(scene, camera);
    if (first) { first = false; $("#loader").classList.add("done"); setTimeout(() => $("#loader")?.remove(), 900); }
  }
  requestAnimationFrame(frame);
}
