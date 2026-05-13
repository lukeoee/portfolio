Portfolio Website mit Projekt-Detailseiten

Start:
1. Ordner entpacken
2. index.html im Browser öffnen

Wichtig:
- Die Startseite ist index.html
- Die Detailseite ist project.html
- Jedes Projekt bekommt automatisch eine Detailseite über project.html?id=PROJEKT-ID

Projekte bearbeiten:
Öffne script.js und bearbeite den Bereich:
const projects = [ ... ];

Wichtige Felder pro Projekt:
- id: eindeutiger Link-Name, z.B. "changeable-hood-mlo"
- title: Projektname
- category: Filter-Kategorie
- description: kurzer Text auf der Startseite
- longDescription: langer Text auf der Detailseite
- tech: Programme / Technologien
- features: Liste der Highlights
- image / gallery: Bilder für die Detailseite
- liveUrl: interne Detailseite, z.B. "project.html?id=changeable-hood-mlo"
- repoUrl: externer Link, z.B. Discord, Tebex oder Showcase

Wenn du ein neues Projekt anlegst:
1. Projekt im projects-Array kopieren
2. id ändern
3. liveUrl passend setzen:
   "project.html?id=DEINE-ID"

Design:
- style.css

Interaktionen / Netzwerk-Hintergrund:
- script.js
