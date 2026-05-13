const isMobileDevice =
  window.matchMedia("(max-width: 850px), (hover: none), (pointer: coarse)").matches;

if (isMobileDevice) {
  document.documentElement.classList.add("mobile-device");
}

let targetX = window.innerWidth / 2;
let targetY = window.innerHeight / 3;
let currentX = targetX;
let currentY = targetY;
let targetHue = 265;
let currentHue = targetHue;


const canvas = document.querySelector("#networkCanvas");
const ctx = canvas.getContext("2d");
const pointer = { x: window.innerWidth / 2, y: window.innerHeight / 3, active: false };
let points = [];
let links = [];
let pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

function resizeNetwork() {
  pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(window.innerWidth * pixelRatio);
  canvas.height = Math.floor(window.innerHeight * pixelRatio);
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  createNetwork();
}

function createNetwork() {
  const spacing = window.innerWidth < 700 ? 86 : 105;
  const cols = Math.ceil(window.innerWidth / spacing) + 2;
  const rows = Math.ceil(window.innerHeight / spacing) + 2;
  points = [];
  links = [];

  for (let y = -1; y < rows; y++) {
    for (let x = -1; x < cols; x++) {
      const jitterX = (Math.random() - 0.5) * 34;
      const jitterY = (Math.random() - 0.5) * 34;
      points.push({
        x: x * spacing + jitterX,
        y: y * spacing + jitterY,
        baseX: x * spacing + jitterX,
        baseY: y * spacing + jitterY,
        vx: 0,
        vy: 0,
        broken: false,
        brokenAt: 0,
        energy: 0
      });
    }
  }

  const index = (x, y) => y * cols + x;
  const maxLineLength = window.innerWidth < 700 ? 120 : 155;

  for (let y = 0; y < rows - 1; y++) {
    for (let x = 0; x < cols - 1; x++) {
      const a = index(x, y);

      const candidates = [
        index(x + 1, y),
        index(x, y + 1),
        index(x + 1, y + 1),
        index(x - 1, y + 1)
      ];

      candidates.forEach(b => {
        if (!points[b]) return;

        const dx = points[a].x - points[b].x;
        const dy = points[a].y - points[b].y;
        const dist = Math.hypot(dx, dy);

        if (dist < maxLineLength && Math.random() > 0.22) {
          links.push({
            a,
            b,
            broken: false,
            brokenAt: 0,
            strength: Math.random() * 0.32 + 0.26
          });
        }
      });
    }
  }
}

function breakNetworkNearCursor() {
  const now = performance.now();
  const radius = 165;
  const breakRadius = 118;

  for (const point of points) {
    const dx = point.x - pointer.x;
    const dy = point.y - pointer.y;
    const dist = Math.hypot(dx, dy);

    if (dist < radius) {
      const force = (1 - dist / radius) * 8.5;
      const angle = Math.atan2(dy, dx) || Math.random() * Math.PI * 2;
      point.vx += Math.cos(angle) * force;
      point.vy += Math.sin(angle) * force;
      point.broken = true;
      point.brokenAt = now;
      point.energy = Math.min(1, point.energy + 0.08);
    }
  }

  for (const link of links) {
    if (link.broken) continue;
    const a = points[link.a];
    const b = points[link.b];
    const midX = (a.x + b.x) / 2;
    const midY = (a.y + b.y) / 2;
    const dist = Math.hypot(midX - pointer.x, midY - pointer.y);
    if (dist < breakRadius) {
      link.broken = true;
      link.brokenAt = now;
    }
  }
}

function drawNetwork() {
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  const hue = currentHue || 265;

  if (!isMobileDevice && pointer.active) breakNetworkNearCursor();

  const now = performance.now();
  const rebuildDelay = 10000;

  for (const link of links) {
    if (link.broken && now - link.brokenAt > rebuildDelay) {
      link.broken = false;
      link.brokenAt = 0;
    }
  }

  for (const point of points) {
    if (point.broken && now - point.brokenAt > rebuildDelay) {
      point.broken = false;
      point.brokenAt = 0;
    }
    point.x += point.vx;
    point.y += point.vy;
    point.vx *= 0.925;
    point.vy *= 0.925;

    if (!point.broken) {
      point.x += (point.baseX - point.x) * 0.015;
      point.y += (point.baseY - point.y) * 0.015;
    }

    point.energy *= 0.965;
  }

  ctx.lineCap = "round";
  for (const link of links) {
    if (link.broken) continue;
    const a = points[link.a];
    const b = points[link.b];
    const midX = (a.x + b.x) / 2;
    const midY = (a.y + b.y) / 2;
    const dist = Math.hypot(midX - pointer.x, midY - pointer.y);
    const glow = Math.max(0, 1 - dist / 360);
    const alpha = 0.22 + glow * 0.62;

    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.lineWidth = 1.6 + glow * 2;
    ctx.strokeStyle = `hsla(${hue + glow * 45}, 95%, ${62 + glow * 16}%, ${alpha * link.strength})`;
    ctx.stroke();
  }

  for (const point of points) {
    const dist = Math.hypot(point.x - pointer.x, point.y - pointer.y);
    const glow = Math.max(point.energy, Math.max(0, 1 - dist / 240));
    const size = 1.2 + glow * 2.8;
    ctx.beginPath();
    ctx.arc(point.x, point.y, size, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${hue + glow * 55}, 100%, ${66 + glow * 18}%, ${0.26 + glow * 0.68})`;
    ctx.fill();
  }

  requestAnimationFrame(drawNetwork);
}

window.addEventListener("resize", resizeNetwork);
if (!isMobileDevice) window.addEventListener("pointerdown", () => { pointer.active = true; });
if (!isMobileDevice) window.addEventListener("pointerup", () => { pointer.active = false; });

function setCursorTarget(event) {
  targetX = event.clientX;
  targetY = event.clientY;
  pointer.x = event.clientX;
  pointer.y = event.clientY;
  pointer.active = true;
  const xRatio = targetX / Math.max(window.innerWidth, 1);
  const yRatio = targetY / Math.max(window.innerHeight, 1);
  targetHue = Math.round(210 + xRatio * 120 + yRatio * 35);
}

if (!isMobileDevice) window.addEventListener("pointermove", setCursorTarget);

function animateCursorBackground() {
  currentX += (targetX - currentX) * 0.13;
  currentY += (targetY - currentY) * 0.13;
  currentHue += (targetHue - currentHue) * 0.08;

  document.documentElement.style.setProperty("--mx", `${currentX}px`);
  document.documentElement.style.setProperty("--my", `${currentY}px`);
  document.documentElement.style.setProperty("--hue", `${currentHue}`);

  requestAnimationFrame(animateCursorBackground);
}
animateCursorBackground();
resizeNetwork();
drawNetwork();

function attachInteractiveGlow() {
  if (isMobileDevice) return;
  document.querySelectorAll(".project-card, .hero-card, .skills-grid span").forEach(element => {
    element.addEventListener("pointermove", event => {
      const rect = element.getBoundingClientRect();
      const localX = event.clientX - rect.left;
      const localY = event.clientY - rect.top;
      const rotateY = ((localX / rect.width) - 0.5) * 8;
      const rotateX = -((localY / rect.height) - 0.5) * 8;

      element.style.setProperty("--local-x", `${localX}px`);
      element.style.setProperty("--local-y", `${localY}px`);

      if (element.classList.contains("project-card") || element.classList.contains("hero-card")) {
        element.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px)`;
      }
    });

    element.addEventListener("pointerleave", () => {
      element.style.transform = "";
      element.style.setProperty("--local-x", "50%");
      element.style.setProperty("--local-y", "50%");
    });
  });
}

const projects = [
  {
    id: "changeable-hood-mlo",
    title: "Changeable Hood Mlo",
    status: "Coming soon",
    category: "MLO",
    year: "2026",
    description: "Eine „Changeable Colour Hood“ an der Grove Street mit vollständig begehbaren Gebäuden, individuell anpassbaren Farbvarianten sowie regelmäßigen Updates und Erweiterungen.",
    longDescription: "Hier kannst du später eine ausführliche Projektbeschreibung eintragen. Erkläre, was das Projekt besonders macht, welche Bereiche verändert wurden, welche Features enthalten sind und für wen das Mapping gedacht ist.",
    tech: ["3ds Max", "Codewalker", "YTYP Creator", "OpenIV", "Paint.NET", "Photoshop"],
    features: ["Begehbare Gebäude", "Anpassbare Farben", "Interior & Exterior", "Optimiert für FiveM"],
    beforeAfter: [
      {
        before: "images/coming-soon_before.png",
        after: "images/coming-soon_after.png"
      },
      {
        before: "images/coming-soon_before.png",
        after: "images/coming-soon_after.png"
      },
      {
        before: "images/coming-soon_before.png",
        after: "images/coming-soon_after.png"
      }
    ],
    image: "images/coming-soon_before.png",
    gallery: ["images/coming-soon_after.png",
              "images/coming-soon_before.png",
              "images/coming-soon_after.png"
    ],
    liveUrl: "project.html?id=changeable-hood-mlo",
    repoUrl: "#",
    primaryButton: "Projekt ansehen",
    secondaryButton: "Kontakt",
    featured: true
  },
  {
    id: "extended-christmas-map",
    title: "Extended Christmas Map",
    status: "Coming soon",
    category: "Exterior",
    year: "2025",
    description: "Komplette GTA V Weihnachtsmap mit anpassbaren LEDs, eigenem Weihnachtsbaum, verschneiten Details und vereisten Wasserflächen.",
    longDescription: "Eine vollständig überarbeitete Weihnachtsmap für die gesamte GTA V Map mit individuell anpassbaren LED-Beleuchtungen, einem eigenen Weihnachtsbaum sowie detaillierten Winter-Verfeinerungen wie schneebedeckten Ampeln und Straßenschildern, vereisten Wasserflächen und vielen weiteren atmosphärischen Features.",
    tech: ["3ds Max", "Codewalker", "YTYP Creator", "OpenIV", "Paint.NET"],
    features: ["Über gesamte GTAV Map", "Anpassbare Farben", "Vereiste Flächen", "Optimiert für FiveM"],
    beforeAfter: [
      {
        before: "images/coming-soon_before.png",
        after: "images/coming-soon_after.png"
      },
      {
        before: "images/coming-soon_before.png",
        after: "images/coming-soon_after.png"
      },
      {
        before: "images/coming-soon_before.png",
        after: "images/coming-soon_after.png"
      }
    ],
    image: "images/coming-soon_before.png",
    gallery: ["images/coming-soon_after.png",
              "images/coming-soon_before.png",
              "images/coming-soon_after.png"
    ],
    liveUrl: "project.html?id=extended-christmas-map",
    repoUrl: "#",
    primaryButton: "Projekt ansehen",
    secondaryButton: "Externer Link",
    featured: true
  },
  {
    id: "mapfix-optimierung",
    title: "Mapfix & Optimierung",
    status: "Available",
    category: "Optimizing",
    year: "2020",
    description: "Umfangreiche Mapfixes seit 2020, inklusive Behebung von Map Überschneidungen, Locked Maps, FPS Drops, Crashes sowie Collision, Occlusion und Audio Occlusion Bugs.",
    longDescription: "Seit 2020 wurden zahlreiche Mapfixes und Optimierungen durchgeführt, um Stabilität, Performance und Spielerlebnis nachhaltig zu verbessern. Dazu gehören die Behebung von Map Überschneidungen, Fixes für Locked Maps sowie Optimierungen gegen FPS Drops und Crashes. Zusätzlich wurden verschiedenste Collision, Occlusion und Audio Occlusion Bugs überarbeitet und behoben, um eine deutlich sauberere und stabilere Spielerfahrung zu gewährleisten.",
    tech: ["3ds Max", "Codewalker", "Audio Occlusion Tool", "OpenIV", "Paint.NET", "Photoshop", "YTYP Creator"],
    features: ["FPS Optimizing", "Crash fixes", "Occlusion fixes", "Audio Occlusion fixes"],
    beforeAfter: [
      {
        before: "images/coming-soon_before.png",
        after: "images/coming-soon_after.png"
      },
      {
        before: "images/coming-soon_before.png",
        after: "images/coming-soon_after.png"
      },
      {
        before: "images/coming-soon_before.png",
        after: "images/coming-soon_after.png"
      }
    ],
    image: "images/coming-soon_before.png",
    gallery: ["images/coming-soon_after.png",
              "images/coming-soon_before.png",
              "images/coming-soon_after.png"
    ],
    liveUrl: "project.html?id=mapfix-optimierung",
    repoUrl: "#",
    primaryButton: "Projekt ansehen",
    secondaryButton: "Externer Link",
    featured: false
  },
  {
    id: "big-burgershot",
    title: "Big Burgershot",
    status: "Released",
    category: "Custom",
    year: "2024",
    description: "Neuer zweistöckiger Burgershot mit Verkaufs- und Essbereich im Erdgeschoss, Partyraum im Obergeschoss sowie eigenem Parkplatz und öffentlichem Sommerbereich. Zusätzlich wurde der gesamte Pier Bereich überarbeitet, bereinigt und modernisiert.",
    longDescription: "Ein komplett neuer zweistöckiger Burgershot mit modern gestaltetem Verkaufs- und Essbereich im Erdgeschoss sowie einem separaten Partyraum im Obergeschoss. Ergänzt wird die Location durch einen individuell angepassten Parkplatz und einen öffentlichen Sommerbereich für zusätzliche Atmosphäre. Darüber hinaus wurde der gesamte Bereich am Pier vollständig aufgeräumt, von alten Elementen bereinigt und durch neue, optimierte Inhalte ersetzt.",
    tech: ["3ds Max", "Codewalker", "YTYP Creator", "OpenIV", "Paint.NET", "Photoshop"],
    features: ["Überarbeiteter Pier", "Customized Burgershot", "2-Stöckig"],
    beforeAfter: [
      {
        before: "images/coming-soon_before.png",
        after: "images/coming-soon_after.png"
      },
      {
        before: "images/coming-soon_before.png",
        after: "images/coming-soon_after.png"
      },
      {
        before: "images/coming-soon_before.png",
        after: "images/coming-soon_after.png"
      }
    ],
    image: "images/coming-soon_before.png",
    gallery: ["images/coming-soon_after.png",
              "images/coming-soon_before.png",
              "images/coming-soon_after.png"
    ],
    liveUrl: "project.html?id=big-burgershot",
    repoUrl: "#",
    primaryButton: "Projekt ansehen",
    secondaryButton: "Externer Link",
    featured: false
  },
  {
    id: "custom-properties",
    title: "Custom Properties",
    status: "Released",
    category: "Props",
    year: "2021",
    description: "Hochwertige Custom Props mit individuellen Designs, optimierter Performance und detailreicher Gestaltung für eine einzigartige Nutzung",
    longDescription: "Eine große Auswahl an hochwertigen Custom Props, die speziell für ein detailliertes und immersives Spielerlebnis entwickelt wurden. Alle Assets sind individuell angepasst, performanceoptimiert und fügen sich nahtlos in das Gesamtbild der Map ein. Durch einzigartige Designs, präzise Platzierungen und moderne Details entsteht eine deutlich realistischere und atmosphärischere Spielwelt.",
    tech: ["3ds Max", "OpenIV", "YTYP Creator"],
    features: ["Optimized Props for Emotes"],
    beforeAfter: [
      {
        before: "images/coming-soon_before.png",
        after: "images/coming-soon_after.png"
      },
      {
        before: "images/coming-soon_before.png",
        after: "images/coming-soon_after.png"
      },
      {
        before: "images/coming-soon_before.png",
        after: "images/coming-soon_after.png"
      }
    ],
    image: "images/coming-soon_before.png",
    gallery: ["images/coming-soon_after.png",
              "images/coming-soon_before.png",
              "images/coming-soon_after.png"
    ],
    liveUrl: "project.html?id=custom-properties",
    repoUrl: "#",
    primaryButton: "Projekt ansehen",
    secondaryButton: "Externer Link",
    featured: false
  }
];

const grid = document.querySelector("#projectGrid");
const filters = document.querySelector("#filters");
const searchInput = document.querySelector("#searchInput");
const emptyState = document.querySelector("#emptyState");
let activeCategory = "Alle";

const categories = ["Alle", ...new Set(projects.map(project => project.category))];

if (document.querySelector("#year")) document.querySelector("#year").textContent = new Date().getFullYear();

if (document.querySelector(".nav-toggle")) {
  document.querySelector(".nav-toggle").addEventListener("click", () => {
    document.querySelector(".nav-links").classList.toggle("open");
  });
}

document.querySelectorAll(".nav-links a").forEach(link => {
  link.addEventListener("click", () => document.querySelector(".nav-links").classList.remove("open"));
});

function renderFilters() {
  filters.innerHTML = categories.map(category => `
    <button class="filter-btn ${category === activeCategory ? "active" : ""}" data-category="${category}">${category}</button>
  `).join("");

  document.querySelectorAll(".filter-btn").forEach(button => {
    button.addEventListener("click", () => {
      activeCategory = button.dataset.category;
      renderFilters();
      renderProjects();
    });
  });
}

function renderProjects() {
  const query = searchInput.value.trim().toLowerCase();
  const filtered = projects.filter(project => {
    const matchesCategory = activeCategory === "Alle" || project.category === activeCategory;
    const text = `${project.title} ${project.description} ${project.tech.join(" ")}`.toLowerCase();
    return matchesCategory && text.includes(query);
  });

  emptyState.style.display = filtered.length ? "none" : "block";
  grid.innerHTML = filtered.map(project => `
    <article class="project-card reveal visible">
      <div class="project-meta">
        <span class="badge">${project.category}</span>
        <span class="badge">${project.year}</span>
        ${project.featured ? '<span class="badge featured">Featured</span>' : ''}
      </div>
      <h3>${project.title}</h3>
      <p>${project.description}</p>
      <div class="tech">
        ${project.tech.map(item => `<span>${item}</span>`).join("")}
      </div>
      <div class="project-links">
        <a href="${project.liveUrl}">${project.primaryButton || "Projekt ansehen"}</a>
        ${project.repoUrl && project.repoUrl !== "#" ? `<a href="${project.repoUrl}" target="_blank" rel="noreferrer">${project.secondaryButton || "Mehr Infos"}</a>` : ""}
      </div>
    </article>
  `).join("");
  attachInteractiveGlow();
}

if (searchInput) searchInput.addEventListener("input", renderProjects);

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add("visible");
  });
}, { threshold: 0.15 });

document.querySelectorAll(".reveal").forEach(element => observer.observe(element));

if (grid && filters && searchInput && emptyState) {
  renderFilters();
  renderProjects();
}
attachInteractiveGlow();
