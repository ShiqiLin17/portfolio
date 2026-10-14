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

/* ---------- Ransom-note cut-out letters ----------
   Each letter becomes its own newspaper clipping with a font, paper and tilt
   picked from a seeded sequence, so the look is the same on every visit. */
let seed = 7;
const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
function ransom(el, label) {
  const text = el.textContent;
  if (label) el.setAttribute("aria-label", text);
  const letter = (c) => {
    const f = Math.floor(rand() * 5);
    const bg = Math.floor(rand() * 8);
    const r = (rand() * 10 - 5).toFixed(1);
    const y = (rand() * 6 - 3).toFixed(1);
    return `<span class="ch f${f} b${bg}" style="--r:${r}deg;--y:${y}px" aria-hidden="true">${c}</span>`;
  };
  // keep each word together so a heading never breaks mid-word
  el.innerHTML = text.split(" ").map((w) => `<span class="word">${[...w].map(letter).join("")}</span>`).join('<span class="gap"> </span>');
}
$$(".split").forEach((w) => ransom(w, false));
// Make the "hi" hiding in "Shiqi" pop: same color, a little bigger, and it waves.
{
  const first = $$(".hero-name .split")[0];
  const letters = first ? $$(".ch", first) : [];
  letters.forEach((c, i) => {
    if (c.textContent === "h" && letters[i + 1] && letters[i + 1].textContent === "i") {
      [c, letters[i + 1]].forEach((x) => {
        x.className = x.className.replace(/\bb\d\b/, "").replace(/\bf\d\b/, "") + " hi f0";
      });
    }
  });
}
$$(".ransom").forEach((h) => ransom(h, true));
const dateline = $("#live-date");
if (dateline) dateline.textContent = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "America/New_York" });
if (!reduceMotion) {
  $$(".split .ch").forEach((ch) => {
    ch.addEventListener("mouseenter", () => {
      ch.classList.add("hop");
      setTimeout(() => ch.classList.remove("hop"), 380);
    });
  });
}



/* ---------- Scroll story: which step is showing ---------- */
const story = $("#build");
const steps = $$(".step", story).sort((a, b) => a.dataset.step - b.dataset.step);
const stepBar = $("#step-bar");
window.storyProgress = 0;
function updateStory() {
  const r = story.getBoundingClientRect();
  const total = r.height - window.innerHeight;
  const p = Math.max(0, Math.min(1, -r.top / total));
  window.storyProgress = p;
  const active = Math.min(steps.length - 1, Math.floor(p * steps.length));
  steps.forEach((s, i) => s.classList.toggle("is-active", i === active));
  story.dataset.step = active;
  stepBar.style.height = (p * 100).toFixed(1) + "%";
  updateCue(active);
}

// A sticky note that keeps telling people there's more inside the sweater.
const cue = $("#scroll-cue");
const cueText = $("#cue-text");
const cueDots = $("#cue-dots");
const cueLines = [
  "keep scrolling · Domi wants that yarn",
  "keep scrolling · 4 more parts inside",
  "keep scrolling · 3 more to go",
  "keep scrolling · 2 more to go",
  "keep scrolling · Domi's rolling it back up",
  "all knitted up! keep going for my projects",
];
let lastCue = -1;
function updateCue(active) {
  if (!cue || active === lastCue) return;
  lastCue = active;
  cueDots.innerHTML = steps.map((_, i) => `<i class="${i <= active ? "on" : ""}"></i>`).join("");
  cueText.textContent = cueLines[active] || cueLines[0];
  cue.classList.toggle("done", active === steps.length - 1);
  cue.classList.remove("bump");
  void cue.offsetWidth;
  cue.classList.add("bump");
}
window.addEventListener("scroll", () => requestAnimationFrame(updateStory), { passive: true });
window.addEventListener("resize", updateStory);
setTimeout(updateStory, 0);

/* ---------- Projects pinboard ---------- */
const cards = $$("#carousel .card");
const dragged = false;

/* ---------- Project details ---------- */
const projects = {
  ftc: {
    color: "#c4dfcd", art: "3371", title: "FTC Team 3371 competition robots", when: "2020–2024 · Team captain, Brooklyn",
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
    color: "#c6dceb", art: "H₂O", title: "Water filtration for schools in Kenya", when: "Sep–Dec 2025 · Engineers Without Borders, BU",
    summary: "As filtration team leader, I led design and preparation of freshwater plumbing filtration systems for schools in Kenya.",
    sections: [
      ["My role", [
        "Applied practical engineering principles to the filtration and plumbing design.",
        "Coordinated team logistics and kept communication clear between engineers and project coordinators.",
      ]],
    ],
  },
  vibewake: {
    color: "#eadcc3", art: "7:00", title: "VibeWake", when: "Startup project at Boston University",
    summary: "A passion project exploring how technology can reshape the way people wake up and start their day.",
    sections: [
      ["The idea", [
        "Combine smart hardware, a companion app and behavioral science into a better morning routine.",
        "Pushes me to think like an engineer and an entrepreneur at the same time.",
      ]],
    ],
  },
  web: {
    color: "#d3e2d0", art: "</>", title: "Websites for Brooklyn businesses", when: "2025–2026 · Freelance and nonprofit work",
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
    color: "#b9d3dd", art: "SxB", title: "SHIQI X BUJI Design", when: "Jan–Mar 2025 · Fashion collaboration",
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
    color: "#efe4c2", art: "Bay", title: "Biology Researcher", when: "Jul – Sep 2023 · Brooklyn College AREAC · Apprenticeship, on-site in Brooklyn",
    summary: "Field research on biological control of the invasive reed Phragmites australis, aiming for real-world environmental solutions.",
    sections: [
      ["What I did", [
        "Conducted field research with aquatic lab equipment to collect samples at Jamaica Bay.",
        "Investigated biological control of invasive species, focusing on Phragmites australis.",
        "Analyzed research data and built detailed Excel charts to track and interpret findings.",
        "Designed and presented a scientific poster of our results at the American Museum of Natural History.",
        "Received a $1K research stipend for outstanding contribution and completing the program.",
        "Earned the Aquatic Research Environmental Assessment Center (AREAC) Program certificate.",
      ]],
      ["The experiment", [
        "Question: can Eastern mud snails (Ilyanassa obsoleta) eat different parts of the invasive reed Phragmites australis, and so help control it?",
        "Fed 36 mud snails in four groups: sea lettuce (Ulva, the control), and Phragmites stems, leaves or roots.",
        "Weighed the snails and their food every morning and evening for four days, and tracked their feces and condition.",
        "Leaf-fed snails showed the best numbers, but the snails' poor condition by the end meant mud snails alone shouldn't be relied on to stop Phragmites.",
      ]],
    ],
    media: [
      { type: "image", src: "media/areac/poster.jpg", alt: "Research poster: Biological Control of Invasive Species, Phragmites australis", caption: "Our poster", fit: true, wide: true },
      { type: "image", src: "media/areac/lab.jpg", alt: "Lab bench with a microscope and the project folder", caption: "The lab at Brooklyn College" },
      { type: "image", src: "media/areac/snails-feeding.jpg", alt: "Mud snails in a dish with Phragmites stems", caption: "Snails on Phragmites stems" },
      { type: "image", src: "media/areac/materials.jpg", alt: "Phragmites roots, stems and leaves, sea lettuce, dishes, snails and pipettes", caption: "Materials" },
      { type: "image", src: "media/areac/title-slide.jpg", alt: "Title slide of the group presentation", caption: "Presentation", fit: true },
      { type: "image", src: "media/areac/chart-snail-weight.jpg", alt: "Line chart of mud snail wet weight on different diets", caption: "Snail weight by diet", fit: true },
      { type: "image", src: "media/areac/chart-food-change.jpg", alt: "Bar chart of percent daily change in food wet weight", caption: "Daily change in food", fit: true },
      { type: "image", src: "media/areac/script.jpg", alt: "Page of the presentation script", caption: "Presentation script", fit: true },
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
    color: "#c4dfcd", art: "BU", title: "Teaching Assistant", when: "Sep 2026 – now · Boston University College of Engineering",
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
    color: "#d3e2d0", art: "</>", title: "Web Developer", when: "Jul – Sep 2026 · Freelance, Brooklyn",
    summary: "Designed and built websites for three local businesses and nonprofits, and moved each domain to GoDaddy.",
    sections: [["Clients", ["Seaway Beauty", "North America Cantonese Arts Foundation", "KXNY International"]]],
  },
  athens: {
    color: "#cfdeea", art: "AL", title: "Fullstack Engineer & Marketing", when: "Jul – Oct 2025 · AthensLabs.ai, Boston",
    summary: "Engineering and go-to-market work at an AI-agent startup building an AI-native learning platform.",
    sections: [["What I did", [
      "Designed full-stack systems for an AI-agent education platform, with resilient backend services and clear UIs.",
      "Prototyped reliability-critical agent features and set up Jenkins CI/CD pipelines with automated testing in Agile sprints.",
      "Worked across teams to align agent capabilities with market needs and support product positioning.",
    ]]],
    links: [{ label: "athenslabs.ai", href: "https://www.athenslabs.ai/" }],
  },
  cultured: {
    color: "#eadcc3", art: "CKC", title: "Frontend Developer", when: "Jun – Sep 2025 · Cultured Kids Cuisine",
    summary: "Modernized the website for a nonprofit that teaches kids through culinary education.",
    sections: [["What I did", [
      "Redesigned responsive frontend pages to match updated brand standards, using Figma, HTML, CSS, JavaScript and Node.js.",
      "Built UI components and checked functionality, load times and responsiveness.",
      "My redesign was chosen in a cross-team A/B review and deployed to production.",
      "Assigned and tracked weekly development tasks with a fellow developer.",
    ]]],
  },
  fortune: {
    color: "#dfe6cf", art: "EHS", title: "EHS Technician Assistant", when: "Jun – Aug 2025 · Fortune Logistics, Avenel NJ",
    summary: "Fixed warehouse air-quality problems flagged by state officials.",
    sections: [["What I did", [
      "Inspected and diagnosed failing air handling and filtration systems.",
      "Replaced HEPA filters, pre-filters and activated carbon units, and balanced ductwork airflow.",
      "Validated indoor air quality after the upgrade, bringing the site into OSHA compliance.",
    ]]],
  },
  suny: {
    color: "#c6dceb", art: "IT", title: "Information Technology Specialist", when: "Jun – Aug 2024 · SJP SUNY ATTAIN · Internship, hybrid in Manhattan",
    summary: "Helped a SUNY Advanced Technology Training and Information Networking (ATTAIN) lab run smoothly, and helped people use it.",
    sections: [["What I did", [
      "Applied skills from SUNY's ATTAIN Lab to support data recording, digital literacy training and collaborative online work.",
      "Assisted with data management and organizing digital resources to make the lab more efficient.",
      "Supported students and lab users with Microsoft Office tools and online platforms.",
      "Diagnosed and fixed workstation hardware, peripheral and connectivity issues, and applied patches and updates under SUNY IT policy.",
      "Built communication and teamwork skills working alongside lab coordinators and program participants.",
    ]], ["Certifications earned", [
      "Microsoft Word Associate",
      "Microsoft Excel Expert",
      "Microsoft Outlook Associate",
    ]]],
  },
  infinity: {
    color: "#b9d3dd", art: "UX", title: "User Experience Design Specialist", when: "Jul – Sep 2023 · Infinity Educational Programs, Inc. · Internship, remote from Brooklyn",
    summary: "Designed presentations and digital content for mental-health awareness initiatives in South Brooklyn.",
    sections: [["What I did", [
      "Designed and developed presentations and digital content supporting mental-health awareness in the South Brooklyn community.",
      "Applied UX/UI design principles so materials were accessible and easy to use for community audiences.",
      "Created wireframes and mockups in Figma, working with teammates to align designs with user needs.",
      "Produced engaging, informative PowerPoint presentations and web layouts tailored to mental-health services.",
      "Contributed visually compelling, mission-aligned digital materials to outreach efforts.",
    ]], ["Topics I designed for", [
      "Dialectical Behavior Therapy (DBT): its core principles, four modules and therapeutic techniques.",
      "PTSD: trauma responses, symptom clusters, and treatment and support.",
      "Fairness in health care and health insurance in the USA.",
    ]], ["Certifications earned", [
      "Sexual Harassment Prevention Training",
      "Hats & Ladders Career Readiness Training",
      "CPR Certification",
    ]]],
    media: [
      { type: "image", src: "media/infinity/dbt-infographic.jpg", fit: true, alt: "Infographic slide on Dialectical Behavior Therapy", caption: "DBT infographic" },
      { type: "image", src: "media/infinity/dbt-definition.jpg", fit: true, alt: "Slide defining Dialectical Behavioral Therapy with an illustration", caption: "DBT, defined" },
      { type: "image", src: "media/infinity/ptsd.jpg", fit: true, alt: "Infographic slide on PTSD", caption: "PTSD infographic" },
      { type: "image", src: "media/infinity/fairness.jpg", fit: true, alt: "Slide on fairness in health care, with an equality vs. equity illustration", caption: "Fairness in health care" },
      { type: "image", src: "media/infinity/health-insurance.jpg", fit: true, alt: "Written reflection on health insurance in the USA", caption: "Health insurance reflection" },
    ],
  },
  cfl: {
    color: "#d3e2d0", art: "CFL", title: "Educational Counselor", when: "Jun – Sep 2022 · Center for Family Life in Sunset Park · Internship, on-site in Brooklyn",
    summary: "Ran a summer program for hundreds of kids in Sunset Park, and helped families and staff understand each other.",
    sections: [["What I did", [
      "Facilitated daily educational and recreational activities for 500+ children, supporting a team of 50+ staff.",
      "Led and supervised full-day field trips three times a week, keeping everyone safe, engaged and on schedule.",
      "Translated Mandarin so staff could communicate with non-English-speaking parents.",
      "Helped keep a safe, inclusive and enriching environment for kids from diverse backgrounds.",
    ]], ["Certifications earned", [
      "Sexual Harassment Prevention Training",
      "Hats & Ladders Career Readiness Training",
      "CPR Certification",
    ]], ["Skills", [
      "Supervisory skills and Chinese (Mandarin) translation.",
    ]]],
  },
  ftc3371: {
    color: "#c4dfcd", art: "3371", title: "Captain, Team 3371", when: "Sep 2020 – Jun 2024 · FIRST Tech Challenge · Apprenticeship, on-site in Brooklyn",
    summary: "Led a FIRST Tech Challenge team through four seasons of designing, building and programming competition robots.",
    sections: [["What I did", [
      "Directed the design, fabrication and optimization of competition-ready robots, integrating mechanical and software systems.",
      "Engineered autonomous navigation and precision control programs for high-stakes matches.",
      "Deployed computer vision with AprilTags, UVC camera systems and powered USB hubs for real-time object detection.",
      "Spearheaded corporate outreach, securing sponsorship from BrioTech to fund team operations.",
    ]], ["Awards", [
      "2023 FIRST Championship, Curie Division.",
      "Team Spirit Award at the NY Tech Valley Regional (2023), finishing 6th of 48 teams.",
    ]]],
  },
  frc333: {
    color: "#c6dceb", art: "333", title: "Business Outreach", when: "Mar 2020 – Jun 2024 · FIRST Robotics Team 333 Megalodons · Apprenticeship, hybrid in Brooklyn",
    summary: "Kept a FIRST Robotics Competition team funded, from sponsors to spending.",
    sections: [["What I did", [
      "Led sponsorship outreach, cultivating partnerships to support a $50K annual budget.",
      "Managed financial planning and resource allocation to maximize team performance and outreach impact.",
    ]], ["Awards", [
      "2023 FIRST Championship, Curie Division.",
      "Team Spirit Award at the NY Tech Valley Regional (2023), finishing 6th of 48 teams.",
    ]], ["Skills", [
      "3D printing and Microsoft Excel.",
    ]]],
  },
};

const dialog = $("#detail");
const detailBody = $("#detail-body");
let lastOpener = null;
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

function mediaHTML(media = [], placeholder) {
  if (!media.length && placeholder) {
    return `<div class="gallery"><div class="slot wide-slot"><span class="slot-icon" aria-hidden="true">▣</span>${esc(placeholder)}</div></div>`;
  }
  if (!media.length) {
    return `<div class="gallery">
      <div class="slot"><span class="slot-icon" aria-hidden="true">▣</span>Photos coming soon</div>
      <div class="slot"><span class="slot-icon" aria-hidden="true">▶</span>Video coming soon</div>
    </div>`;
  }
  return `<div class="gallery">${media.map((m) => {
    if (m.type === "image") return `<figure${m.fit || m.wide ? ` class="${[m.fit && "fit", m.wide && "wide"].filter(Boolean).join(" ")}"` : ""}><img src="${esc(m.src)}" alt="${esc(m.alt || "")}" loading="lazy">${m.caption ? `<figcaption>${esc(m.caption)}</figcaption>` : ""}</figure>`;
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
      ${mediaHTML(p.media, p.placeholder)}
      ${p.sections.map(([h, items]) => `<h3>${esc(h)}</h3><ul class="points">${items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>`).join("")}
    </div>`;
  dialog.showModal();
  dialog.scrollTop = 0;
}
experience.bio = projects.bio;
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


/* ---------- Photos of me ----------
   Drop pictures into media/me/ and list them here, e.g.
   { src: "media/me/robotics-lab.jpg", alt: "Me in the robotics lab" }
   The first photo goes in the About polaroid. Domi's photos live in
   media/domi/ and are revealed at the very end of the page. */
const ME_PHOTOS = [];

const portrait = $("#portrait-slot");
if (portrait && ME_PHOTOS[0]) {
  portrait.outerHTML = `<img src="${esc(ME_PHOTOS[0].src)}" alt="${esc(ME_PHOTOS[0].alt || "Shiqi")}">`;
}
/* ---------- Mailbox → envelope → letter ---------- */
{
  const mail = $("#mail");
  const box = $("#mailbox");
  const env = $("#envelope");
  const letter = $("#letter");
  const hint = $("#mail-hint");
  const reseal = $("#reseal");
  const wait = (ms) => new Promise((r) => setTimeout(r, reduceMotion ? 0 : ms));
  const setState = (st, text) => { mail.dataset.state = st; if (text) hint.textContent = text; };

  async function deliver() {
    if (mail.dataset.state !== "closed") return;
    setState("out", "A letter popped out! Click the envelope to open it.");
    box.setAttribute("aria-label", "Mailbox is open");
    box.disabled = true;
    env.tabIndex = 0;
    await wait(900);
    env.focus({ preventScroll: true });
  }
  async function openLetter() {
    if (mail.dataset.state !== "out") return;
    setState("opening", "Unfolding…");
    env.tabIndex = -1;
    await wait(1100);
    setState("read", "Thanks for stopping by ♡");
    letter.focus({ preventScroll: true });
    await wait(80);
    $("#about").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  }
  function close() {
    setState("closed", "You've got mail! Pull the mailbox door down, or click it.");
    box.disabled = false;
    box.setAttribute("aria-label", "Open the mailbox");
    $("#about").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
    box.focus({ preventScroll: true });
  }

  box.addEventListener("click", deliver);
  env.addEventListener("click", openLetter);
  reseal.addEventListener("click", close);

  // Drag the door down to open it.
  let start = null;
  box.addEventListener("pointerdown", (e) => { start = e.clientY; box.setPointerCapture(e.pointerId); });
  box.addEventListener("pointermove", (e) => {
    if (start === null || mail.dataset.state !== "closed") return;
    const pull = Math.max(0, Math.min(1, (e.clientY - start) / 90));
    mail.style.setProperty("--pull", pull.toFixed(2));
    if (pull >= 1) { start = null; mail.style.removeProperty("--pull"); deliver(); }
  });
  const endDrag = () => { start = null; mail.style.removeProperty("--pull"); };
  box.addEventListener("pointerup", endDrag);
  box.addEventListener("pointercancel", endDrag);
}

/* ---------- The "keep scrolling" note follows the cursor ----------
   It trails a little behind and to the lower right, never catches clicks,
   and only shows while the sweater is on screen. Touch screens keep it docked. */
{
  const garment = $("#garment");
  const note = $("#scroll-cue");
  const fine = window.matchMedia("(pointer: fine)").matches;
  if (garment && note && fine && !reduceMotion) {
    note.classList.add("follow");
    let tx = null, ty = null, x = 0, y = 0, inView = false;
    new IntersectionObserver(([e]) => (inView = e.isIntersecting), { threshold: 0.3 }).observe(garment);
    window.addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse") return;
      tx = e.clientX; ty = e.clientY;
    }, { passive: true });
    (function follow() {
      requestAnimationFrame(follow);
      if (!inView || tx === null) { note.classList.remove("near"); return; }
      const r = garment.getBoundingClientRect();
      const w = note.offsetWidth, h = note.offsetHeight;
      const gx = Math.min(r.width - w - 12, Math.max(12, tx - r.left + 26));
      const gy = Math.min(r.height - h - 12, Math.max(12, ty - r.top + 30));
      x += (gx - x) * 0.12; y += (gy - y) * 0.12;
      note.style.left = x.toFixed(1) + "px";
      note.style.top = y.toFixed(1) + "px";
      note.classList.add("near");
    })();
  }
}


/* ---------- Certificates as embroidered merit badges ----------
   To add a credential link or a scan of the certificate, give an entry
   links: [{ label: "View credential", href: "https://..." }] or
   media: [{ type: "image", src: "media/certs/excel.jpg", alt: "Certificate" }]. */
const CERTS = [
  { group: "Software & data", items: [
    { abbr: "XL", title: "Microsoft Office Specialist: Excel Expert", issuer: "Microsoft · Office 2019", text: "The advanced Excel certification: complex formulas and functions, data analysis, macros, and managing workbooks.", links: [{ label: "Verify on Credly", href: "https://www.credly.com/badges/2e4e28e3-e14c-4e76-a29e-11329fe34c51" }] },
    { abbr: "XL", title: "Microsoft Office Specialist: Excel Associate", issuer: "Microsoft · Office 2019", text: "Core Excel skills: formulas, charts, tables and data organization.", links: [{ label: "Verify on Credly", href: "https://www.credly.com/badges/75a7555f-a91d-48e0-8795-01f05ca62fa5" }] },
    { abbr: "W", title: "Microsoft Office Specialist: Word Associate", issuer: "Microsoft · Office 2019", text: "Creating and formatting professional documents, tables and references in Word.", where: "Earned at the SUNY ATTAIN Lab", links: [{ label: "Verify on Credly", href: "https://www.credly.com/badges/c4f061d1-b7c4-4c88-b663-cb2954bd1518" }] },
    { abbr: "O", title: "Microsoft Office Specialist: Outlook Associate", issuer: "Microsoft", text: "Managing email, calendars, contacts and tasks in Outlook.", where: "Earned at the SUNY ATTAIN Lab" },
    { abbr: "</>", title: "Programming in HTML5 with JavaScript and CSS3", issuer: "Certification", text: "Building web pages and interactive apps with HTML5, JavaScript and CSS3." },
    { abbr: "JS", title: "JavaScript Certificate", issuer: "W3Schools", text: "JavaScript fundamentals: syntax, functions, the DOM and events.", links: [{ label: "Verify on W3Schools", href: "https://certification.w3schools.com/w3certified.asp?id=13880272" }] },
  ]},
  { group: "Engineering & AI", items: [
    { abbr: "ML", title: "Machine Learning Onramp", issuer: "MathWorks · Nov 2024", text: "Hands-on introduction to machine learning in MATLAB: preparing data, training classifiers and evaluating models.", links: [{ label: "View certificate", href: "https://matlabacademy.mathworks.com/progress/share/certificate.html?id=8e68f33d-c88b-4063-b461-c80c3eeb3e12" }] },
    { abbr: "M", title: "MATLAB Onramp", issuer: "MathWorks", text: "MATLAB essentials: variables, matrices, plotting and scripts.", links: [{ label: "View certificate", href: "https://matlabacademy.mathworks.com/progress/share/certificate.html?id=474e8fe8-116e-4012-a99a-b25fba3b173a" }] },
    { abbr: "MX", title: "Mechatronics Level 1", issuer: "NOCTI", text: "A Knowledge-Based Workforce Competency Credential covering mechanical, electrical and control systems.", links: [{ label: "Verify on NOCTI", href: "https://www.noctiskillbadge.org/badge/26717439" }] },
    { abbr: "CTE", title: "Engineering Certificate", issuer: "Career & Technical Education · Midwood High School", text: "Completed the CTE engineering pathway in Midwood's robotics branch." },
  ]},
  { group: "Science & service", items: [
    { abbr: "H₂O", title: "Aquatic Research Environmental Assessment Center (AREAC) Program", issuer: "Brooklyn College", text: "Certificate of achievement from Brooklyn College Now and AREAC for completing the Aquatic Ecology Institute (GSCI 2020), Summer 2023: field research on invasive Phragmites australis at Jamaica Bay, with a poster presented at the American Museum of Natural History.", media: [{ type: "image", src: "media/certs/areac-certificate.jpg", alt: "AREAC certificate of achievement for Shiqi Lin", caption: "Certificate, Summer 2023", fit: true, wide: true }] },
    { abbr: "CPR", title: "CPR Certification", issuer: "Center for Family Life & Infinity Educational Programs · 2022–2023", text: "Certified in cardiopulmonary resuscitation, earned during my internships working with children and community programs." },
    { abbr: "H&L", title: "Hats & Ladders Career Readiness Training", issuer: "Center for Family Life & Infinity Educational Programs · 2022–2023", text: "Career exploration and workplace readiness training, earned during my Educational Counselor and UX design internships." },
    { abbr: "SHP", title: "Sexual Harassment Prevention Training", issuer: "Center for Family Life & Infinity Educational Programs · 2022–2023", text: "Workplace sexual harassment prevention training, earned during my Educational Counselor and UX design internships." },
  ]},
];
const HONORS = [
  { abbr: "★", title: "FIRST Championship", kind: "Honor", issuer: "FIRST · Curie Division · 2023", text: "Competed at the 2023 FIRST Championship in the Curie Division with the Brooklyn robotics teams I helped lead." },
  { abbr: "✦", title: "Think Award", kind: "Award", issuer: "FIRST Tech Challenge · NYC Qualifier", text: "Awarded to FTC Team 3371 for engineering documentation and design process, while ranking 2nd at the qualifier." },
  { abbr: "♥", title: "Team Spirit Award", kind: "Award", issuer: "FIRST Robotics Competition · NY Tech Valley Regional 2023", text: "Awarded to FRC Team 333, which also finished 6th of 48 teams at the regional." },
  { abbr: "$1K", title: "Research Stipend", kind: "Honor", issuer: "Brooklyn College AREAC · 2023", text: "Recognized for outstanding contribution to invasive species field research at Jamaica Bay, with a research poster presented at the American Museum of Natural History.", media: [{ type: "image", src: "media/areac/poster.jpg", alt: "Research poster: Biological Control of Invasive Species, Phragmites australis", caption: "The poster", fit: true, wide: true }] },
];
{
  const tones = ["#c4dfcd", "#c6dceb", "#eadcc3", "#d3e2d0", "#efe4c2", "#b9d3dd"];
  const flat = CERTS.flatMap((g) => g.items);
  const frame = (c, i, honor) => {
    c.color = tones[i % tones.length];
    const kind = c.kind || (/Onramp|Certificate|Program|Training/.test(c.title) ? "Certificate of Completion" : "Certification");
    return `<li><button type="button" class="frame-btn${honor ? " honor" : ""}" data-i="${i}" style="--tone:${c.color}">
      <span class="frame"><span class="cert-doc">
        <span class="cert-kicker">${esc(kind)}</span>
        <span class="cert-to">presented to</span>
        <span class="cert-name">Shiqi Lin</span>
        <span class="cert-for">${esc(c.title)}</span>
        <span class="cert-issuer">${esc(c.issuer)}</span>
        <span class="cert-seal">${esc(c.abbr)}</span>
        ${honor ? '<span class="ribbon" aria-hidden="true"></span>' : ""}
      </span></span>
      ${c.links ? '<span class="cert-verified">✓ verified</span>' : ""}
    </button></li>`;
  };
  const open = (c, opener) => openDetail({
    color: c.color, art: c.abbr, title: c.title, when: c.issuer, summary: c.text,
    links: c.links, media: c.media, placeholder: "Certificate scan coming soon",
    sections: c.where ? [["Where", [c.where]]] : [],
  }, opener);
  const hw = $("#honors-wall"), cw = $("#certs-wall");
  if (hw) {
    hw.innerHTML = HONORS.map((c, i) => frame(c, i + 2, true)).join("");
    $$(".frame-btn", hw).forEach((b) => b.addEventListener("click", (e) => open(HONORS[+b.dataset.i - 2], e.currentTarget)));
  }
  if (cw) {
    cw.innerHTML = flat.map((c, i) => frame(c, i, false)).join("");
    $$(".frame-btn", cw).forEach((b) => b.addEventListener("click", (e) => open(flat[+b.dataset.i], e.currentTarget)));
  }
}