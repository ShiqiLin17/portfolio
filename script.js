const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

document.getElementById("year").textContent = new Date().getFullYear();

/* ---------- Power switch (theme) ---------- */
const power = $("#power");
function currentTheme() {
  const set = document.documentElement.dataset.theme;
  if (set) return set;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}
function syncPower() {
  const lightsOn = currentTheme() === "light";
  power.setAttribute("aria-pressed", String(lightsOn));
  power.setAttribute("aria-label", lightsOn ? "Turn lights off (dark mode)" : "Turn lights on (light mode)");
  document.dispatchEvent(new CustomEvent("themechange", { detail: currentTheme() }));
}
power.addEventListener("click", () => {
  const next = currentTheme() === "light" ? "dark" : "light";
  document.documentElement.dataset.theme = next;
  try { localStorage.setItem("theme", next); } catch (e) {}
  syncPower();
});
syncPower();

/* ---------- Name letters that hop when you hover ---------- */
$$(".split").forEach((word) => {
  word.innerHTML = [...word.textContent].map((c) => `<span class="ch">${c}</span>`).join("");
});
if (!reduceMotion) {
  $$(".split .ch").forEach((ch) => {
    ch.addEventListener("mouseenter", () => {
      ch.style.transform = `translateY(-0.12em) rotate(${(Math.random() * 16 - 8).toFixed(1)}deg)`;
      setTimeout(() => (ch.style.transform = ""), 380);
    });
  });
}

/* ---------- Live readout: Boston time + weather ---------- */
function tick() {
  const t = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/New_York" });
  $("#live-time").textContent = t.replace(/\s?[AP]M/, "");
  $("#live-time").title = t;
}
tick();
setInterval(tick, 15000);

const skyWords = (code) => {
  if (code === 0) return "Clear sky";
  if (code <= 2) return "Partly cloudy";
  if (code === 3) return "Overcast";
  if (code <= 48) return "Foggy";
  if (code <= 57) return "Drizzle";
  if (code <= 67) return "Rain";
  if (code <= 77) return "Snow";
  if (code <= 82) return "Showers";
  return "Thunderstorms";
};
fetch("https://api.open-meteo.com/v1/forecast?latitude=42.35&longitude=-71.1&current=temperature_2m,weather_code,wind_speed_10m&temperature_unit=fahrenheit&wind_speed_unit=mph")
  .then((r) => (r.ok ? r.json() : Promise.reject()))
  .then((d) => {
    const c = d.current;
    $("#live-temp").textContent = Math.round(c.temperature_2m) + "°";
    $("#live-sky").textContent = skyWords(c.weather_code);
    $("#live-wind").textContent = Math.round(c.wind_speed_10m);
    windSpeed = c.wind_speed_10m;
  })
  .catch(() => {
    $("#live-sky").textContent = "Weather offline";
  });

/* Oscilloscope: the wave speeds up with wind, and your cursor changes its frequency. */
let windSpeed = 6;
let probe = 0.5;
const scope = $(".scope");
const scopeLine = $("#scope-line");
scope.addEventListener("pointermove", (e) => {
  const r = scope.getBoundingClientRect();
  probe = (e.clientX - r.left) / r.width;
});
scope.addEventListener("pointerleave", () => (probe = 0.5));
let phase = 0;
let freq = 2;
function drawScope() {
  freq += ((1 + probe * 6) - freq) * 0.08;
  phase += 0.04 + windSpeed / 300;
  let d = "M0 35";
  for (let x = 0; x <= 300; x += 4) {
    const y = 35 + Math.sin((x / 300) * Math.PI * 2 * freq + phase) * 22 * Math.sin((x / 300) * Math.PI);
    d += ` L${x} ${y.toFixed(1)}`;
  }
  scopeLine.setAttribute("d", d);
  if (!reduceMotion) requestAnimationFrame(drawScope);
}
drawScope();

/* ---------- Scroll story: which step is showing ---------- */
const story = $("#build");
const steps = $$(".step", story);
const stepBar = $("#step-bar");
window.storyProgress = 0;
function updateStory() {
  const r = story.getBoundingClientRect();
  const total = r.height - window.innerHeight;
  const p = Math.max(0, Math.min(1, -r.top / total));
  window.storyProgress = p;
  const active = Math.min(steps.length - 1, Math.floor(p * steps.length));
  steps.forEach((s, i) => s.classList.toggle("is-active", i === active));
  stepBar.style.height = (p * 100).toFixed(1) + "%";
}
window.addEventListener("scroll", () => requestAnimationFrame(updateStory), { passive: true });
window.addEventListener("resize", updateStory);
updateStory();

/* ---------- Projects carousel ---------- */
const carousel = $("#carousel");
const cards = $$(".card", carousel);
const prev = $("#proj-prev");
const next = $("#proj-next");
$("#proj-total").textContent = cards.length;

function currentIndex() {
  const left = carousel.scrollLeft;
  let best = 0;
  cards.forEach((c, i) => {
    if (Math.abs(c.offsetLeft - carousel.offsetLeft - left) < Math.abs(cards[best].offsetLeft - carousel.offsetLeft - left)) best = i;
  });
  return best;
}
function updateCounter() {
  const i = currentIndex();
  const atEnd = carousel.scrollLeft + carousel.clientWidth >= carousel.scrollWidth - 4;
  $("#proj-current").textContent = atEnd ? cards.length : i + 1;
  prev.disabled = carousel.scrollLeft < 4;
  next.disabled = atEnd;
}
function goTo(i) {
  const c = cards[Math.max(0, Math.min(cards.length - 1, i))];
  carousel.scrollTo({ left: c.offsetLeft - carousel.offsetLeft, behavior: reduceMotion ? "auto" : "smooth" });
}
prev.addEventListener("click", () => goTo(currentIndex() - 1));
next.addEventListener("click", () => goTo(currentIndex() + 1));
carousel.addEventListener("scroll", () => requestAnimationFrame(updateCounter), { passive: true });
carousel.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight") { e.preventDefault(); goTo(currentIndex() + 1); }
  if (e.key === "ArrowLeft") { e.preventDefault(); goTo(currentIndex() - 1); }
});
updateCounter();

// Mouse drag (touch already swipes natively).
let dragStart = null;
let dragged = false;
carousel.addEventListener("pointerdown", (e) => {
  if (e.pointerType !== "mouse") return;
  dragStart = { x: e.clientX, left: carousel.scrollLeft };
  dragged = false;
});
window.addEventListener("pointermove", (e) => {
  if (!dragStart) return;
  const dx = e.clientX - dragStart.x;
  if (Math.abs(dx) > 5) { dragged = true; carousel.classList.add("is-dragging"); }
  carousel.scrollLeft = dragStart.left - dx;
});
window.addEventListener("pointerup", () => {
  if (!dragStart) return;
  dragStart = null;
  if (dragged) {
    carousel.classList.remove("is-dragging");
    goTo(currentIndex());
  }
});

/* ---------- Project details ---------- */
const projects = {
  ftc: {
    color: "#1d5c43", art: "3371", title: "FTC Team 3371 competition robots", when: "2020–2024 · Team captain, Brooklyn",
    summary: "Four seasons leading the design, fabrication and programming of competition robots, plus the business side that kept the team funded.",
    sections: [
      ["What I built", [
        "Autonomous OpModes in C++ that used AprilTag vision with color and ultrasonic sensors to localize the robot on the field.",
        "PIDF motor control for precise, repeatable movement in autonomous.",
        "TeleOp control combining live UVC camera feeds, IMU sensors and motor encoders.",
        "Camera and vision hardware setup with powered USB hubs for real-time detection.",
      ]],
      ["Leading the team", [
        "Captained FTC Team 3371 and ran business outreach for FRC Team 333, the Megalodons.",
        "Secured sponsorship from BrioTech and helped manage a $50K+ annual budget.",
      ]],
      ["Results", [
        "Competed at the 2023 FIRST Championship, Curie Division.",
        "Think Award and 2nd place at an FTC NYC qualifier.",
        "Team Spirit Award and 6th of 48 at the FRC New York Tech Valley Regional.",
      ]],
    ],
  },
  ewb: {
    color: "#2b6c8f", art: "H₂O", title: "Water filtration for schools in Kenya", when: "Sep–Dec 2025 · Engineers Without Borders, BU",
    summary: "As filtration team leader, I led design and preparation of freshwater plumbing filtration systems for schools in Kenya.",
    sections: [
      ["My role", [
        "Applied practical engineering principles to the filtration and plumbing design.",
        "Coordinated team logistics and kept communication clear between engineers and project coordinators.",
      ]],
    ],
  },
  vibewake: {
    color: "#c4682f", art: "7:00", title: "VibeWake", when: "Startup project at Boston University",
    summary: "A passion project exploring how technology can reshape the way people wake up and start their day.",
    sections: [
      ["The idea", [
        "Combine smart hardware, a companion app and behavioral science into a better morning routine.",
        "Pushes me to think like an engineer and an entrepreneur at the same time.",
      ]],
    ],
  },
  web: {
    color: "#3d3f8f", art: "</>", title: "Websites for Brooklyn businesses", when: "2025–2026 · Freelance and nonprofit work",
    summary: "Designing and building websites for local businesses and nonprofits, from Figma mockups to live domains.",
    sections: [
      ["Clients", [
        "Seaway Beauty: designed and built the site, and migrated the domain to GoDaddy.",
        "North America Cantonese Arts Foundation: new website and domain migration.",
        "KXNY International: new website and domain migration.",
        "Cultured Kids Cuisine: redesigned the responsive frontend for a youth culinary-education nonprofit. My design was chosen in A/B review and shipped.",
      ]],
      ["Stack", ["HTML5, CSS3, JavaScript, Node.js, Figma, and DNS and domain management."]],
    ],
  },
  buji: {
    color: "#9c3d5a", art: "SxB", title: "SHIQI X BUJI Design", when: "Jan–Mar 2025 · Fashion collaboration",
    summary: "A college side hustle: an original clothing line launched with BUJI Design and sold to customers worldwide.",
    sections: [
      ["What I did", [
        "Created original designs published on the partner brand's website.",
        "Signed and managed a formal contract with the brand.",
        "Promoted the line through social media marketing.",
      ]],
    ],
  },
  bio: {
    color: "#5a7a2b", art: "Bay", title: "Invasive species research at Jamaica Bay", when: "Jul–Sep 2023 · Brooklyn College AREAC program",
    summary: "Field research on biological control of the invasive reed Phragmites australis.",
    sections: [
      ["The work", [
        "Collected samples at Jamaica Bay with aquatic field equipment.",
        "Analyzed data and built charts in Excel to interpret findings.",
        "Designed and presented a research poster at the American Museum of Natural History.",
        "Earned a $1K research stipend.",
      ]],
    ],
  },
};

/* ---------- Experience details ----------
   Same shape as projects. For photos, videos and links, fill in:
     media: [{ type: "image", src: "media/x.jpg", alt: "..." },
             { type: "video", src: "media/x.mp4" },
             { type: "youtube", id: "VIDEO_ID" }]
     links: [{ label: "Visit the site", href: "https://..." }]
   Empty lists show "coming soon" placeholders. */
const experience = {
  "bu-ta": {
    color: "#1d5c43", art: "BU", title: "Teaching Assistant", when: "Sep 2026 – now · Boston University College of Engineering",
    summary: "Helping first-year engineering students take a project from problem statement to working prototype.",
    sections: [["What I do", [
      "Mentor student teams through the full design process: problem statements, requirements, morphological charts, concept and detailed design, prototyping and testing.",
      "Lead hands-on labs on Arduino programming, MOSFET switching circuits, power supplies, and servo and stepper motor control.",
      "Help students choose sensors and actuators and develop circuit diagrams, power budgets and code flowcharts.",
      "Support Onshape CAD instruction and coordinate fabrication sessions at BU's Engineering Product Innovation Center (EPIC).",
      "Coordinate with faculty and TAs across sections on kits, materials and assessments.",
    ]]],
  },
  freelance: {
    color: "#3d3f8f", art: "</>", title: "Web Developer", when: "Jul – Sep 2026 · Freelance, Brooklyn",
    summary: "Designed and built websites for three local businesses and nonprofits, and moved each domain to GoDaddy.",
    sections: [["Clients", ["Seaway Beauty", "North America Cantonese Arts Foundation", "KXNY International"]]],
  },
  athens: {
    color: "#2b2f4a", art: "AL", title: "Fullstack Engineer & Marketing", when: "Jul – Oct 2025 · AthensLabs.ai, Boston",
    summary: "Engineering and go-to-market work at an AI-agent startup building an AI-native learning platform.",
    sections: [["What I did", [
      "Designed full-stack systems for an AI-agent education platform, with resilient backend services and clear UIs.",
      "Prototyped reliability-critical agent features and set up Jenkins CI/CD pipelines with automated testing in Agile sprints.",
      "Worked across teams to align agent capabilities with market needs and support product positioning.",
    ]]],
    links: [{ label: "athenslabs.ai", href: "https://www.athenslabs.ai/" }],
  },
  cultured: {
    color: "#c4682f", art: "CKC", title: "Frontend Developer", when: "Jun – Sep 2025 · Cultured Kids Cuisine",
    summary: "Modernized the website for a nonprofit that teaches kids through culinary education.",
    sections: [["What I did", [
      "Redesigned responsive frontend pages to match updated brand standards, using Figma, HTML, CSS, JavaScript and Node.js.",
      "Built UI components and checked functionality, load times and responsiveness.",
      "My redesign was chosen in a cross-team A/B review and deployed to production.",
      "Assigned and tracked weekly development tasks with a fellow developer.",
    ]]],
  },
  fortune: {
    color: "#4a5a52", art: "EHS", title: "EHS Technician Assistant", when: "Jun – Aug 2025 · Fortune Logistics, Avenel NJ",
    summary: "Fixed warehouse air-quality problems flagged by state officials.",
    sections: [["What I did", [
      "Inspected and diagnosed failing air handling and filtration systems.",
      "Replaced HEPA filters, pre-filters and activated carbon units, and balanced ductwork airflow.",
      "Validated indoor air quality after the upgrade, bringing the site into OSHA compliance.",
    ]]],
  },
  suny: {
    color: "#2b6c8f", art: "IT", title: "IT Specialist", when: "Jun – Aug 2024 · SUNY ATTAIN Lab, Manhattan",
    summary: "Kept a research and training lab's computers running and helped people use them.",
    sections: [["What I did", [
      "Diagnosed and fixed workstation hardware, peripheral and connectivity issues.",
      "Applied system patches, firmware upgrades and security updates under SUNY IT policy.",
      "Earned Microsoft Office Specialist certifications: Word Associate, Excel Expert and Outlook Associate.",
    ]]],
  },
  infinity: {
    color: "#9c3d5a", art: "UX", title: "UX/UI Design Specialist", when: "Jul – Sep 2023 · Infinity Educational Programs, Brooklyn",
    summary: "Designed digital materials for mental-health awareness programs in South Brooklyn.",
    sections: [["What I did", [
      "Turned user needs into high-fidelity Figma prototypes.",
      "Improved information architecture and user flows for accessibility and ease of use.",
      "Produced presentations and web layouts for community outreach.",
    ]]],
  },
};

const dialog = $("#detail");
const detailBody = $("#detail-body");
let lastOpener = null;
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

function mediaHTML(media = []) {
  if (!media.length) {
    return `<div class="gallery">
      <div class="slot"><span class="slot-icon" aria-hidden="true">▣</span>Photos coming soon</div>
      <div class="slot"><span class="slot-icon" aria-hidden="true">▶</span>Video coming soon</div>
    </div>`;
  }
  return `<div class="gallery">${media.map((m) => {
    if (m.type === "image") return `<figure><img src="${esc(m.src)}" alt="${esc(m.alt || "")}" loading="lazy">${m.caption ? `<figcaption>${esc(m.caption)}</figcaption>` : ""}</figure>`;
    if (m.type === "video") return `<figure><video src="${esc(m.src)}" controls playsinline preload="metadata"></video>${m.caption ? `<figcaption>${esc(m.caption)}</figcaption>` : ""}</figure>`;
    if (m.type === "youtube") return `<figure class="wide"><iframe src="https://www.youtube-nocookie.com/embed/${esc(m.id)}" title="${esc(m.caption || "Video")}" allow="encrypted-media; picture-in-picture" allowfullscreen loading="lazy"></iframe></figure>`;
    return "";
  }).join("")}</div>`;
}
function linksHTML(links = []) {
  if (!links.length) return `<p class="links"><span class="link-slot">Links coming soon</span></p>`;
  return `<p class="links">${links.map((l) => `<a href="${esc(l.href)}" target="_blank" rel="noopener">${esc(l.label)}</a>`).join("")}</p>`;
}

function openDetail(p, opener) {
  if (!p) return;
  lastOpener = opener;
  detailBody.innerHTML = `
    <div class="detail-art" style="background:${p.color}">${esc(p.art)}</div>
    <div class="detail-content">
      <p class="when">${esc(p.when)}</p>
      <h2 id="detail-title">${esc(p.title)}</h2>
      <p>${esc(p.summary)}</p>
      ${linksHTML(p.links)}
      ${mediaHTML(p.media)}
      ${p.sections.map(([h, items]) => `<h3>${esc(h)}</h3><ul class="points">${items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>`).join("")}
    </div>`;
  dialog.showModal();
  dialog.scrollTop = 0;
}
const openProject = (key, opener) => openDetail(projects[key], opener);
cards.forEach((card) => {
  $(".open", card).addEventListener("click", (e) => openProject(card.dataset.project, e.currentTarget));
  $(".card-art", card).addEventListener("click", () => { if (!dragged) openProject(card.dataset.project, $(".open", card)); });
});
$$("#timeline li[data-exp]").forEach((li) => {
  $(".open", li).addEventListener("click", (e) => openDetail(experience[li.dataset.exp], e.currentTarget));
});
$("#detail-close").addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (e) => { if (e.target === dialog) dialog.close(); });
dialog.addEventListener("close", () => lastOpener && lastOpener.focus());

/* ---------- Timeline trace fills as you scroll ---------- */
const timeline = $("#timeline");
const items = $$("li", timeline);
function updateTimeline() {
  const r = timeline.getBoundingClientRect();
  const mark = window.innerHeight * 0.6;
  const pct = Math.max(0, Math.min(1, (mark - r.top) / r.height));
  timeline.style.setProperty("--fill", (pct * 100).toFixed(1) + "%");
  items.forEach((li) => li.classList.toggle("is-lit", li.getBoundingClientRect().top < mark));
}
window.addEventListener("scroll", () => requestAnimationFrame(updateTimeline), { passive: true });
updateTimeline();

/* ---------- Skills filter ---------- */
const chips = $$("#chips li");
$$(".filter").forEach((btn) => {
  btn.addEventListener("click", () => {
    $$(".filter").forEach((b) => { b.classList.toggle("is-on", b === btn); b.setAttribute("aria-pressed", String(b === btn)); });
    const f = btn.dataset.filter;
    chips.forEach((c) => {
      c.classList.toggle("is-dim", f !== "all" && c.dataset.cat !== f);
      c.classList.toggle("is-match", f !== "all" && c.dataset.cat === f);
    });
  });
});

/* ---------- Copy email ---------- */
const toast = $("#toast");
$("#copy-email").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText("shiqilin17@gmail.com");
    toast.textContent = "Email copied to your clipboard.";
  } catch (e) {
    toast.textContent = "Couldn't copy automatically. The address is shiqilin17@gmail.com.";
  }
  clearTimeout(toast._t);
  toast._t = setTimeout(() => (toast.textContent = ""), 3000);
});
