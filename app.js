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
const READY = [0, 0.88, 0.85, 0.5, 0.45, 0.45, 0.65, 0.6];
$("#scene-nav").innerHTML = NAMES.map((n, i) => `<li><button type="button" data-go="${i}" aria-label="Go to ${n}"><span>${n}</span></button></li>`).join("");
$$("#scene-nav button").forEach((b) => b.addEventListener("click", () => {
  const i = +b.dataset.go, s = sections[i];
  const y = s.offsetTop + (s.offsetHeight - innerHeight) * READY[i];
  window.scrollTo({ top: y, behavior: reduceMotion ? "auto" : "smooth" });
}));
$$("[data-goto]").forEach((a) => a.addEventListener("click", (e) => { e.preventDefault(); $(`#scene-nav [data-go="${a.dataset.goto}"]`).click(); }));

function focusOn() {}
function releaseFocus() {}
function pullBook() {}
function setApart() {}

let W;
(async () => {
  try {
    const { createWorld } = await import("./world.js");
    W = await createWorld(canvas, {
      mobile,
      onProgress: (p, msg) => { $("#loader-bar") && ($("#loader-bar").style.width = Math.round(p * 100) + "%"); $("#loader-msg") && ($("#loader-msg").textContent = msg); },
    });
  } catch (e) {
    console.warn("3D unavailable, showing the flat version", e);
    document.documentElement.classList.add("flat");
    $("#loader")?.remove();
    return;
  }
  if (new URLSearchParams(location.search).has("still")) window.__W = W;
  runMovie();
})();

// ================================================================= 3D
function runMovie() {
  const { THREE, camera, drone, objects: O, fromLocal, fromFrame } = W;
  const PI = Math.PI;
  drone.rotation.order = "YXZ";

  // ---------- one continuous path for the whole movie.
  // Global time s = scene index + progress in that scene. Every track is a C1 Hermite spline in s,
  // so the camera never jerks between scenes; it only comes to rest where you're meant to click.
  // L = house-local coords (x right, y up, z out the front door), F = Manhattan grid (a east, y, n north).
  const L = (x, y, z) => fromLocal(x, y, z);
  const F = (a, y, n) => fromFrame(a, y, n);
  const toward = [380, 30, 660]; // house-local direction toward Midtown
  const CAM = [
    // 0 · the foyer
    [0.0, L(1.6, 2.1, 9.4), L(-1.0, 3.2, 4.2)],
    [0.95, L(1.3, 2.5, 8.4), L(-0.6, 3.3, 4.2)],
    // 1 · orbit the drone, become the drone, out the arched window, over the East River to Central Park
    [1.12, L(3.8, 3.0, 5.8), L(0, 3.4, 4.2)],
    [1.22, L(3.0, 3.7, 1.6), L(0, 3.6, 4.4)],
    [1.3, L(0.2, 3.95, 1.0), L(0, 4.4, 10)],
    [1.37, L(0.8, 4.7, 3.9), L(1.2, 6.3, 14)],
    [1.76, F(-400, 100, 1250), F(-385, 140, -140)],
    [1.81, F(-416.4, 97.2, 1265.6), F(-382, 150, -140)],
    [1.99, F(-417.6, 97.7, 1267.6), F(-382, 152, -140)],
    // 2 · back home over the Queensboro Bridge, mailbox, front door, up the stairs, to the desk
    [2.03, F(-405, 100, 1262), F(-250, 95, 1100)],
    [2.4, L(25, 5.5, 34.6), L(4, 2, 30)],
    [2.44, L(10, 4, 42), L(4.2, 1.5, 27.5)],
    [2.48, L(8, 3.2, 36), L(1.6, 1.7, 26)],
    [2.52, L(3.6, 2.8, 31), L(0.5, 2.2, 18)],
    [2.555, L(0, 2.6, 18.5), L(0, 2.3, 8)],
    [2.59, L(0, 2.4, 11.6), L(0, 2.6, 2)],
    [2.63, L(0, 2.8, 4.6), L(0, 3.8, -3)],
    [2.665, L(0, 4.4, -1.6), L(0, 6.4, -8)],
    [2.7, L(0, 6.6, -7.3), L(-6, 6.6, -8.4)],
    [2.745, L(-4.4, 7.0, -8.1), L(-9, 7, -5.5)],
    [2.79, L(-9.0, 7.9, 1.6), L(-9.1, 6.2, 7)],
    [2.84, L(-8.3, 7.15, 5.05), L(-9.0, 5.95, 7.05)],
    [3.0, L(-8.3, 7.15, 5.05), L(-9.0, 5.95, 7.05)],
    // 3 · the library
    [3.14, L(-9.0, 7.5, 3.2), L(-12, 7.0, 2.4)],
    [3.3, L(-9.2, 7.6, 1.4), L(-13.4, 7.4, 0.4)],
    [4.0, L(-9.25, 7.6, 1.35), L(-13.4, 7.4, 0.4)],
    // 4 · the workshop corner
    [4.3, L(-10.3, 7.9, -2.7), L(-10.3, 6.45, -9.4)],
    [5.0, L(-10.3, 7.9, -2.8), L(-10.3, 6.45, -9.4)],
    // 5 · the wall of frames
    [5.3, L(-11.0, 7.6, -1.2), L(-5.2, 7.5, -1.2)],
    [6.0, L(-10.9, 7.6, -0.8), L(-5.2, 7.5, -0.8)],
    // 6 · across the landing to the bedroom
    [6.12, L(-6.6, 7.0, -6.6), L(0, 7, -8.6)],
    [6.22, L(0, 7.0, -8.4), L(6, 7, -8.0)],
    [6.32, L(6.4, 7.2, -7.0), L(10, 6.5, 0)],
    [6.45, L(9.0, 7.7, -1.2), L(12.0, 6.3, 0.6)],
    [6.56, L(13.0, 7.75, 2.2), L(11.5, 6.0, 0.3)],
    [7.0, L(13.0, 7.75, 2.2), L(11.5, 6.0, 0.3)],
    // 7 · out the bedroom window; the skyline behind the hologram
    [7.15, L(9.5, 7.4, 3.5), L(9.5, 7.5, 10)],
    [7.3, L(9.5, 7.6, 7.6), L(9.5, 7.8, 16)],
    [7.4, L(9.3, 9.2, 12.0), L(9, 12, 30)],
    [7.55, L(8, 21, 15), L(...toward)],
    [8.0, L(8, 21.3, 15.4), L(...toward)],
  ];
  const DRONE = [
    [0.0, L(0, 3.4, 4.2), -PI / 2],
    [0.95, L(0, 3.45, 4.2), -PI / 2 + 0.25],
    [1.12, L(0, 3.45, 4.1), -PI / 2 + 0.1],
    [1.22, L(0, 3.5, 4.0), -PI / 2],
    [1.3, L(0, 3.75, 2.6), -PI / 2],
    [1.37, L(0.9, 5.0, 5.4), -PI / 2],
    [1.43, L(1.25, 7.4, 9.4), -PI / 2],
    [1.47, L(1.3, 10, 16), -PI / 2],
    [1.51, L(2, 32, 62), -PI / 2],
    [1.56, F(2700, 110, 1460), -PI / 2],
    [1.61, F(1900, 150, 1320), -PI / 2],
    [1.655, F(1000, 165, 1220), -PI / 2],
    [1.7, F(150, 150, 1170), -PI / 2],
    [1.745, F(-370, 108, 1235), -0.4],
    [1.79, F(-414, 96, 1262), 0],
    [1.99, F(-415, 96.6, 1263.5), 0],
    [2.04, F(-300, 108, 1140), PI * 0.6],
    [2.09, F(100, 175, 720), PI * 0.62],
    [2.135, F(650, 185, 250), PI * 0.62],
    [2.175, F(1120, 120, -25), PI * 0.56],
    [2.21, F(1500, 62, -33), PI * 0.53],
    [2.25, F(2200, 62, 26), PI * 0.53],
    [2.29, F(2950, 64, 92), PI * 0.6],
    [2.33, F(3230, 58, 640), PI],
    [2.365, L(330, 30, 36), PI / 2 + PI / 2],
    [2.39, L(110, 12, 35), PI],
    [2.415, L(25, 4, 32), PI],
    [2.44, L(4.2, 2.3, 27.5), PI / 2],
    [2.46, L(4.2, 2.1, 27.5), PI / 2],
    [2.48, L(1.5, 2.2, 24), PI / 2],
    [2.52, L(0, 2.2, 13), PI / 2],
    [2.555, L(0, 2.3, 7.5), PI / 2],
    [2.59, L(0, 2.8, 0.6), PI / 2],
    [2.63, L(0, 5.2, -5), PI / 2],
    [2.665, L(-2.8, 6.7, -8.6), PI],
    [2.7, L(-7.6, 7.1, -7.4), PI],
    [2.745, L(-8.4, 7.6, 3.8), PI * 1.5],
    [2.79, L(-10.9, 7.0, 7.9), PI * 1.65],
    [3.0, L(-10.9, 7.0, 7.9), PI * 1.65],
    [3.3, L(-11.2, 8.3, 2.2), PI],
    [4.0, L(-11.2, 8.3, 2.2), PI],
    [4.3, L(-7.9, 9.2, -6.6), PI / 2],
    [5.0, L(-7.9, 9.2, -6.6), PI / 2],
    [5.3, L(-7.4, 9.4, 3.2), 0],
    [5.95, L(-7.4, 9.4, 3.2), 0],
    [6.06, L(-6.4, 7.6, -8.0), PI / 4],
    [6.13, L(-3.6, 7.2, -8.2), 0],
    [6.22, L(3, 7.1, -8.2), 0],
    [6.32, L(8, 7.3, -4), -PI / 2],
    [6.45, L(9.6, 7.6, -0.6), -PI / 2],
    [6.56, L(10.6, 8.3, 2.6), -PI],
    [7.0, L(10.6, 8.3, 2.6), -PI],
    [7.15, L(9.5, 7.5, 6.4), -PI / 2],
    [7.28, L(9.5, 7.7, 11.6), -PI / 2],
    [7.4, L(9.8, 12, 16.5), -PI / 2 + 0.3],
    [7.55, L(10.25, 19.75, 18.9), -PI / 2 + 0.52],
    [8.0, L(10.25, 19.8, 18.95), -PI / 2 + 0.52],
  ];
  // yaws are world headings (0 = grid south; the house's front door faces -PI/2).
  // Unwrap so the drone always turns the short way.
  for (let i = 1; i < DRONE.length; i++) {
    let y = DRONE[i][2];
    while (y - DRONE[i - 1][2] > PI) y -= 2 * PI;
    while (y - DRONE[i - 1][2] < -PI) y += 2 * PI;
    DRONE[i][2] = y;
  }

  function hermiteTrack(keys) {
    // keys: [[s, number[]], ...]
    const n = keys.length, dim = keys[0][1].length;
    const s = keys.map((k) => k[0]), v = keys.map((k) => k[1]);
    const m = keys.map(() => new Array(dim).fill(0));
    const len = (a, b) => Math.sqrt(a.reduce((acc, x, i) => acc + (x - b[i]) ** 2, 0));
    for (let i = 1; i < n - 1; i++) {
      const ds = s[i + 1] - s[i - 1];
      for (let d = 0; d < dim; d++) m[i][d] = (v[i + 1][d] - v[i - 1][d]) / ds;
      // keep it from overshooting: cap the speed by what each neighboring segment can carry
      const mag = Math.sqrt(m[i].reduce((a, x) => a + x * x, 0));
      if (mag > 0) {
        const cap = Math.min(2.4 * len(v[i], v[i - 1]) / (s[i] - s[i - 1]), 2.4 * len(v[i + 1], v[i]) / (s[i + 1] - s[i]));
        if (mag > cap) m[i] = m[i].map((x) => (x * cap) / mag);
      }
    }
    const out = new Array(dim);
    return (t) => {
      if (t <= s[0]) return v[0].slice();
      if (t >= s[n - 1]) return v[n - 1].slice();
      let i = 0;
      while (i < n - 2 && t > s[i + 1]) i++;
      const h = s[i + 1] - s[i], u = (t - s[i]) / h, u2 = u * u, u3 = u2 * u;
      const h00 = 2 * u3 - 3 * u2 + 1, h10 = u3 - 2 * u2 + u, h01 = -2 * u3 + 3 * u2, h11 = u3 - u2;
      for (let d = 0; d < dim; d++) out[d] = h00 * v[i][d] + h10 * h * m[i][d] + h01 * v[i + 1][d] + h11 * h * m[i + 1][d];
      return out.slice();
    };
  }
  const camPosT = hermiteTrack(CAM.map((k) => [k[0], k[1]]));
  const camLookT = hermiteTrack(CAM.map((k) => [k[0], k[2]]));
  const dronePosT = hermiteTrack(DRONE.map((k) => [k[0], k[1]]));
  const droneYawT = hermiteTrack(DRONE.map((k) => [k[0], [k[2]]]));
  const V3 = (a) => new THREE.Vector3(a[0], a[1], a[2]);
  const smooth01 = (t) => { t = clamp01(t); return t * t * t * (t * (t * 6 - 15) + 10); };
  const band = (s, a0, a1, b0, b1) => smooth01((s - a0) / (a1 - a0)) * (1 - smooth01((s - b0) / (b1 - b0)));
  function droneDir(s) {
    const a = V3(dronePosT(s - 0.004)), b = V3(dronePosT(s + 0.004));
    const d = b.sub(a);
    return d.lengthSq() < 1e-8 ? null : d.normalize();
  }
  const wrapPI = (x) => Math.atan2(Math.sin(x), Math.cos(x));

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
    if (sceneI === 2 && sceneU > 0.78) return [O.letter];
    if (sceneI === 3 && sceneU > 0.2) return O.book.children.length ? O.book.children : [O.book];
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
    const hit = ray.intersectObjects(targets(), true)[0];
    return hit ? hit.object : null;
  }
  const isIn = (obj, root) => { for (let p = obj; p; p = p.parent) if (p === root) return true; return false; };
  const kindOf = (obj) => {
    if (!obj) return null;
    if (obj === O.letter) return "letter";
    if (isIn(obj, O.book)) return "book";
    if (obj === O.sketch) return "sketch";
    if (obj.userData.build) return "part";
    if (O.certFrames.some((f) => f.userData.face === obj)) return "cert";
    if (obj === O.screen || isIn(obj, O.laptop)) return "laptop";
    return null;
  };

  // dragging build parts across the bench
  const benchPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -(W.anchors.benchTop + 0.05));
  let drag = null;
  canvas.addEventListener("pointerdown", (e) => {
    const obj = pick(e);
    if (kindOf(obj) === "part") {
      drag = { obj, g: obj.parent, x: e.clientX, y: e.clientY, moved: false };
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
  canvas.addEventListener("pointerup", () => {
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

  // camera focus for close-ups (house-local, converted to world)
  let focus = null, focusAmt = 0;
  const FOCUS = {
    letter: { pos: L(-8.95, 6.85, 6.7), look: L(-9.05, 5.95, 7.05) },
    laptop: { pos: L(12.75, 6.95, 1.15), look: L(11.95, 6.15, 0.6) },
  };
  focusOn = (k) => { focus = FOCUS[k] || null; };
  releaseFocus = () => { focus = null; bookPulled = false; };
  let bookPulled = false;
  pullBook = () => { bookPulled = true; };
  const bookHome = O.book.position.clone();
  const ladderHome = O.ladder.position.clone();

  // ---------- HUD
  const root = document.documentElement;
  const hint = $("#hint");
  const HINTS = [
    "Scroll to fly",
    "Keep scrolling: fly with the drone",
    "Click the letter on the desk",
    "Click the glowing book on the shelf",
    "Drag the builds · click the sketch paper",
    "Click any frame on the wall",
    "Click the laptop",
    "Say hello ↓",
  ];
  function hintText() {
    if (sceneI === 1 && sceneU > 0.8) return "Keep scrolling: fly home over the bridge";
    if (sceneI === 2 && sceneU < 0.78) return "Keep scrolling: follow the drone home";
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
  const camPos = new THREE.Vector3(), camLook = new THREE.Vector3();
  const prevDrone = new THREE.Vector3();
  let first = true;
  function resize() { W.resize(innerWidth, innerHeight); }
  window.addEventListener("resize", resize);
  resize();
  const houseInv = new THREE.Matrix4().copy(W.houseRoot.matrixWorld).invert();
  const toHouse = (v) => v.clone().applyMatrix4(houseInv);
  const fromHouse = (v) => v.clone().applyMatrix4(W.houseRoot.matrixWorld);
  const UP = new THREE.Vector3(0, 1, 0);
  let lastDir = new THREE.Vector3(-1, 0, 0);

  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - lastT) / 1000);
    lastT = now;
    const t = now / 1000;
    readScroll();
    const target = sceneI + sceneU;
    // the movie glides after the scroll instead of snapping to it
    smoothS = first || reduceMotion || STILL ? target : lerp(smoothS, target, 1 - Math.pow(0.012, dt));
    if (Math.abs(target - smoothS) > 1.2) smoothS = target; // nav jumps cut instead of crawling
    const s = smoothS;
    const portrait = camera.aspect < 0.9;

    // drone on its path, heading where it's going during the long flights
    const dp = V3(dronePosT(s));
    let yaw = droneYawT(s)[0];
    const dir = droneDir(s);
    if (dir && Math.hypot(dir.x, dir.z) > 0.2) lastDir.copy(dir);
    const fly = Math.max(band(s, 1.45, 1.5, 1.76, 1.8), band(s, 2.0, 2.05, 2.37, 2.42));
    if (fly > 0 && dir) {
      const vy = Math.atan2(lastDir.x, lastDir.z);
      yaw = yaw + wrapPI(vy - yaw) * fly;
    }

    // camera: the scripted path, blended into the drone's own camera (scene 1) and a chase cam (scene 2)
    camPos.copy(V3(camPosT(s)));
    camLook.copy(V3(camLookT(s)));
    const pov = band(s, 1.33, 1.39, 1.75, 1.81);
    if (pov > 0) {
      const d = lastDir.clone();
      d.y = THREE.MathUtils.clamp(d.y, -0.3, 0.12); d.normalize(); // keep the horizon in view while climbing
      const p = dp.clone().addScaledVector(d, 0.3).add(new THREE.Vector3(0, 0.08, 0));
      const lk = dp.clone().addScaledVector(d, 120).add(new THREE.Vector3(0, -Math.min(40, Math.max(0, dp.y - 20) * 0.35), 0));
      camPos.lerp(p, pov);
      camLook.lerp(lk, pov);
    }
    const chase = band(s, 2.0, 2.05, 2.36, 2.41);
    if (chase > 0) {
      const d = lastDir.clone(); d.y *= 0.3; d.normalize();
      const p = dp.clone().addScaledVector(d, -7.5).add(new THREE.Vector3(0, 2.2, 0));
      const lk = dp.clone().addScaledVector(d, 16);
      camPos.lerp(p, chase);
      camLook.lerp(lk, chase);
    }
    if (portrait) {
      // pan across the wide walls on narrow screens
      const si = Math.floor(s), su = s - si;
      if (si === 4 || si === 5 || si === 3) {
        const lp = toHouse(camPos), ll = toHouse(camLook);
        if (si === 4) { const k = seg(su, 0.35, 0.95); lp.x = lerp(-12.0, -8.4, k); ll.x = lp.x; lp.z += 0.6; }
        if (si === 5) { const k = seg(su, 0.35, 0.95); lp.z = lerp(-3, 3, k); ll.z = lp.z; lp.x = -10.4; }
        if (si === 3) lp.x += 0.4;
        camPos.copy(fromHouse(lp)); camLook.copy(fromHouse(ll));
      }
    }
    // close-up focus
    focusAmt = STILL ? (focus ? 1 : 0) : lerp(focusAmt, focus ? 1 : 0, 1 - Math.pow(0.002, dt));
    if (focus && focusAmt > 0.001) {
      camPos.lerp(V3(focus.pos), focusAmt);
      camLook.lerp(V3(focus.look), focusAmt);
    }
    if (shake > 0) { camPos.x += (Math.random() - 0.5) * shake; camPos.y += (Math.random() - 0.5) * shake; shake *= 0.86; if (shake < 0.002) shake = 0; }
    camera.position.copy(camPos);
    camera.up.copy(UP);
    camera.lookAt(camLook);
    // a gentle bank while the drone camera turns
    if (pov > 0.5) camera.rotateZ(THREE.MathUtils.clamp(wrapPI(droneYawT(s + 0.01)[0] - droneYawT(s)[0]) * -2, -0.12, 0.12) * pov);

    // drone pose: hover bob, tilt into the direction of travel
    const hover = reduceMotion ? 0 : Math.sin(t * 2.1) * 0.04 * (1 - fly);
    drone.position.copy(dp).add(new THREE.Vector3(0, hover, 0));
    const vel = dp.clone().sub(prevDrone);
    prevDrone.copy(dp);
    const sp = Math.min(1, vel.length() / Math.max(dt, 1e-3) / 40);
    const loc = vel.clone().applyAxisAngle(UP, -yaw).normalize();
    drone.rotation.y = yaw;
    drone.rotation.x = lerp(drone.rotation.x, THREE.MathUtils.clamp(loc.z * sp * 0.4, -0.35, 0.35) || 0, 0.15);
    drone.rotation.z = lerp(drone.rotation.z, THREE.MathUtils.clamp(-loc.x * sp * 0.4, -0.35, 0.35) || 0, 0.15);
    drone.userData.rotors.forEach((r, i) => (r.rotation.y += (i % 2 ? 1 : -1) * dt * 40));
    drone.userData.led.material.color.setHex(Math.sin(t * 6) > 0 ? 0x7dffb4 : 0x2c6b4c);
    drone.visible = camera.position.distanceTo(drone.position) > 0.6;

    // the house reacts to the drone: windows swing open, the front doors open, the mailbox flag goes up
    const swing = (o, k) => o && o.leaves.forEach((h) => (h.rotation.y = (h.userData.left ? -1 : 1) * 1.25 * smooth01(k)));
    swing(O.opening.arch, seg(s, 1.33, 1.41) * (1 - seg(s, 1.56, 1.62)));
    swing(O.opening.bedroom, seg(s, 7.08, 7.2));
    swing(O.opening.study, 0.25 + 0.03 * Math.sin(t * 0.7)); // a crack of fresh air
    const doorK = smooth01(seg(s, 2.47, 2.53)) * (1 - smooth01(seg(s, 2.66, 2.72)));
    O.doors.forEach((d, i) => (d.rotation.y = (i === 0 ? 1 : -1) * 1.45 * doorK));
    O.flag.rotation.x = s > 2.43 ? 0 : Math.PI / 2;
    // the rolling library ladder slides over to the experience book
    O.ladder.position.z = lerp(ladderHome.z, O.book.position.z - 0.9, smooth01(seg(s, 3.04, 3.3)));

    // glow on clickable things
    const pulse = 0.5 + 0.5 * Math.sin(t * 3);
    O.letter.material.emissiveIntensity = sceneI === 2 && sceneU > 0.78 ? 0.12 + pulse * 0.25 : 0;
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
    // build parts animate between built and taken apart
    parts.forEach((p) => {
      const ud = p.userData;
      if (!ud.to || ud.free) return;
      const k = ease(clamp01((now - ud.t0) / 700));
      p.position.lerpVectors(ud.from, ud.to, k);
      p.position.y += Math.sin(k * Math.PI) * 0.35;
      p.rotation.x = lerp(ud.fromR || 0, ud.toR || 0, k);
    });
    if (O.chand) O.chand.rotation.y = Math.sin(t * 0.3) * 0.08;

    // HUD state
    root.dataset.scene = sceneI;
    root.style.setProperty("--u", sceneU.toFixed(3));
    sections.forEach((sct, i) => sct.classList.toggle("active", i === sceneI));
    $$("#scene-nav button").forEach((b, i) => b.classList.toggle("on", i === sceneI));
    // newspaper
    const wantPaper = sceneI === 1 && sceneU > 0.83 && sceneU < 0.985;
    if (wantPaper && !slapped) { slapped = true; paper.classList.add("in"); if (!reduceMotion) setTimeout(() => (shake = 0.5), 260); }
    if (!wantPaper && slapped) { slapped = false; paper.classList.remove("in"); }
    // interactive cues
    root.classList.toggle("ready", (sceneI === 2 && sceneU > 0.8) || (sceneI === 3 && sceneU > 0.25) || (sceneI === 4 && sceneU > 0.25) || (sceneI === 5 && sceneU > 0.25) || (sceneI === 6 && sceneU > 0.55));
    // contacts hologram + lasers
    const showHolo = sceneI === 7 && sceneU > 0.42;
    holo.classList.toggle("in", showHolo);
    O.beams.forEach((b) => (b.visible = showHolo));
    if (showHolo) {
      camera.updateMatrixWorld();
      const fwd = new THREE.Vector3(); camera.getWorldDirection(fwd);
      const right = new THREE.Vector3().crossVectors(fwd, camera.up).normalize();
      const up = new THREE.Vector3().crossVectors(right, fwd).normalize();
      const dist = 10;
      const visW = 2 * dist * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect;
      const wR = Math.min(5.6, visW * (portrait ? 0.86 : 0.5));
      const hR = portrait ? wR * 1.2 : wR * 0.8;
      const C = camera.position.clone().add(fwd.clone().multiplyScalar(dist)).add(right.clone().multiplyScalar(portrait ? 0 : -visW * 0.18)).add(up.clone().multiplyScalar(portrait ? -1.1 : -0.3));
      const corners = [[-1, 1], [1, 1], [1, -1], [-1, -1]].map(([a, b]) => C.clone().add(right.clone().multiplyScalar(a * wR / 2)).add(up.clone().multiplyScalar(b * hR / 2)));
      drone.updateMatrixWorld(true);
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
      const Lx = Math.min(...xs), T = Math.min(...ys);
      holo.style.left = Lx + "px"; holo.style.top = T + "px";
      holo.style.width = Math.max(...xs) - Lx + "px"; holo.style.minHeight = Math.max(...ys) - T + "px";
    }
    // cursor hint
    hint.textContent = hintText();
    if (!hint.classList.contains("follow")) hint.style.visibility = document.querySelector("dialog[open]") ? "hidden" : "";
    if (hint.classList.contains("follow")) {
      hx = lerp(hx, mx + 22, 0.18); hy = lerp(hy, my + 26, 0.18);
      hint.style.transform = `translate(${Math.min(innerWidth - hint.offsetWidth - 10, hx).toFixed(1)}px, ${Math.min(innerHeight - 40, hy).toFixed(1)}px)`;
      hint.style.visibility = seenMouse && !document.querySelector("dialog[open]") ? "" : "hidden";
    }

    W.update(t, dt);
    W.render();
    if (first) { first = false; $("#loader").classList.add("done"); setTimeout(() => $("#loader")?.remove(), 900); }
  }
  requestAnimationFrame(frame);
}
