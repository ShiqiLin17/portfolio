// All of Shiqi's content lives here. Edit text, add links and media in this file.
//
// media: [{ type: "image", src: "media/x.jpg", alt: "..." },
//         { type: "video", src: "media/x.mp4" },
//         { type: "youtube", id: "VIDEO_ID" }]
// links: [{ label: "Visit the site", href: "https://..." }]

export const projects = {
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
    color: "#efe4c2", art: "Bay", title: "Invasive species research at Jamaica Bay", when: "Jul–Sep 2023 · Brooklyn College AREAC program",
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

export const experience = {
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
    color: "#c6dceb", art: "IT", title: "IT Specialist", when: "Jun – Aug 2024 · SUNY ATTAIN Lab, Manhattan",
    summary: "Kept a research and training lab's computers running and helped people use them.",
    sections: [["What I did", [
      "Diagnosed and fixed workstation hardware, peripheral and connectivity issues.",
      "Applied system patches, firmware upgrades and security updates under SUNY IT policy.",
      "Earned Microsoft Office Specialist certifications: Word Associate, Excel Expert and Outlook Associate.",
    ]]],
  },
  infinity: {
    color: "#b9d3dd", art: "UX", title: "UX/UI Design Specialist", when: "Jul – Sep 2023 · Infinity Educational Programs, Brooklyn",
    summary: "Designed digital materials for mental-health awareness programs in South Brooklyn.",
    sections: [["What I did", [
      "Turned user needs into high-fidelity Figma prototypes.",
      "Improved information architecture and user flows for accessibility and ease of use.",
      "Produced presentations and web layouts for community outreach.",
    ]]],
  },
};

export const CERTS = [
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
    { abbr: "H₂O", title: "Aquatic Research Environmental Assessment Center (AREAC) Program", issuer: "Brooklyn College", text: "Completed the summer field research program studying invasive Phragmites australis at Jamaica Bay, with a poster presented at the American Museum of Natural History." },
    { abbr: "CPR", title: "CPR Certification", issuer: "Cardiopulmonary resuscitation", text: "Certified in CPR while working with children and community programs." },
    { abbr: "H&L", title: "Hats & Ladders Career Readiness Training", issuer: "Career readiness", text: "Career exploration and workplace readiness training." },
  ]},
];

export const HONORS = [
  { abbr: "★", title: "FIRST Championship", kind: "Honor", issuer: "FIRST · Curie Division · 2023", text: "Competed at the 2023 FIRST Championship in the Curie Division with the Brooklyn robotics teams I helped lead." },
  { abbr: "✦", title: "Think Award", kind: "Award", issuer: "FIRST Tech Challenge · NYC Qualifier", text: "Awarded to FTC Team 3371 for engineering documentation and design process, while ranking 2nd at the qualifier." },
  { abbr: "♥", title: "Team Spirit Award", kind: "Award", issuer: "FIRST Robotics Competition · NY Tech Valley Regional 2023", text: "Awarded to FRC Team 333, which also finished 6th of 48 teams at the regional." },
  { abbr: "$1K", title: "Research Stipend", kind: "Honor", issuer: "Brooklyn College AREAC · 2023", text: "Recognized for outstanding contribution to invasive species field research at Jamaica Bay, with a research poster presented at the American Museum of Natural History." },
];

// Skills shown on the sketch paper in the workshop.
export const SKILLS = {
  "Code": ["C++", "Python", "Java", "JavaScript", "HTML5 & CSS3", "Node.js", "MATLAB"],
  "Robotics": ["Arduino", "Motor control", "PIDF tuning", "AprilTags", "Sensor integration", "ROS"],
  "CAD & hardware": ["Onshape", "SolidWorks", "Fusion 360", "AutoCAD", "Circuit design", "Hardware debugging"],
  "Tools & design": ["Figma", "Jenkins CI/CD", "GitLab", "VS Code", "CLion", "Agile/Scrum", "Microsoft 365"],
};
export const LANGUAGES = "I speak English and Chinese natively.";

// The 3D builds on the workbench. Placeholder shapes until the real photos arrive.
export const BUILDS = [
  { key: "sorter", title: "Color sorter", when: "Build", color: "#b9d3dd", art: "RGB",
    summary: "A machine that reads each object's color with a sensor and sorts it into the right bin.",
    sections: [["Try it", ["Drag any part around the bench.", "Press Take apart to see every piece, then Build to snap it back together."]]] },
  { key: "crane", title: "Robotic crane", when: "Build", color: "#eadcc3", art: "⤒",
    summary: "A motorized crane with a rotating base, a lifting arm and a hook on a winch.",
    sections: [["Try it", ["Drag any part around the bench.", "Press Take apart to see every piece, then Build to snap it back together."]]] },
  { key: "tempbox", title: "Temperature box", when: "Build", color: "#c4dfcd", art: "°F",
    summary: "An enclosure with a temperature sensor and a live display that keeps conditions inside in range.",
    sections: [["Try it", ["Drag any part around the bench.", "Press Take apart to see every piece, then Build to snap it back together."]]] },
];

// Videos on the laptop (Photos). Add { type: "video", src: "media/hobbies/golf.mp4" } to each.
export const HOBBIES = [
  { title: "Robotics days", sub: "FTC 3371", tone: "#9cc7b2", media: [] },
  { title: "Golf", sub: "On the range", tone: "#b7d6c3", media: [] },
  { title: "Fashion design", sub: "SHIQI X BUJI", tone: "#eadcc3", media: [] },
  { title: "Competitive dance", sub: "Performances", tone: "#c6dceb", media: [] },
  { title: "Photography", sub: "Fujifilm X-S20", tone: "#d8c3a5", media: [] },
  { title: "VR games", sub: "Late-night sessions", tone: "#b9c9e0", media: [] },
  { title: "Polo", sub: "Back on the field", tone: "#c9d7b8", media: [] },
  { title: "New York", sub: "Around the city", tone: "#d6cbbb", media: [] },
];

export const CONTACT = {
  email: "shiqilin17@gmail.com",
  linkedin: "https://www.linkedin.com/in/shiqi017",
  github: "https://github.com/ShiqiLin17",
};

// Photos of Shiqi (put files in media/me/). The first one goes on the letter.
export const ME_PHOTOS = [];
