# Product Requirements Document: Open-Bookmark

## 1. Überblick
**Produktname:** Open-Bookmark
**Arbeitstitel:** Smart Visual Bookmarks
**Produktart:** Lokal betriebene Web-App / Docker-Container
**Ziel:** Eine erweiterte Lesezeichen-App, die Metadaten von URLs extrahiert, diese in einer Kartenansicht visualisiert und durch Markdown-Notizen sowie Tags ergänzt.

## 2. Produktvision
Open-Bookmark ist eine datenschutzfreundliche Alternative zu Cloud-Diensten wie Pocket oder Raindrop. Die App richtet sich an Nutzer, die ihre Link-Sammlungen lokal verwalten, verschlagworten und dokumentieren möchten. Das Projekt ist für die Veröffentlichung als Open-Source-Software auf GitHub optimiert.

## 3. Kernfunktionen (MVP)

### 3.1 URL-Management
- **Hinzufügen:** Eingabe einer URL löst einen serverseitigen Fetch aus.
- **Metadaten-Extraktion:** Automatisches Auslesen von:
  - Seitentitel (`<title>` oder `og:title`)
  - Beschreibung (`meta description` oder `og:description`)
  - Vorschaubild (`og:image`)
  - Website-Name (`og:site_name`)
- **Normalisierung:** URLs werden bereinigt (Entfernung von UTM-Parametern, einheitliche Trailing-Slashes), um Duplikate zu vermeiden.


### 3.2 Bulk-Import via kommaseparierter Liste
- Beim Anlegen einer URL kann der Nutzer alternativ eine **kommaseparierte Liste von URLs** eingeben.
- Die App erkennt automatisch, ob es sich um eine einzelne URL oder eine Liste handelt.
- Jede URL in der Liste wird einzeln validiert, normalisiert und als eigenständiges Bookmark angelegt.
- Bereits vorhandene URLs (anhand `normalized_url`) werden übersprungen, nicht dupliziert.
- Nach dem Import erhält der Nutzer eine Zusammenfassung:
  - Anzahl erfolgreich angelegter Bookmarks
  - Anzahl übersprungener Duplikate
  - Anzahl fehlgeschlagener URLs (z.B. nicht erreichbar)

### 3.3 UI & Organisation
- **Visual Card Grid:** Darstellung der Links als Karten mit Vorschaubild, Titel und Domain-Anzeige.
- **Pagination:** Unterstützung für große Sammlungen durch serverseitige Paginierung.
- **Tagging-System:** Flexible Zuweisung von Schlagworten für jedes Lesezeichen.
- **Markdown-Editor:** Ein Feld für ausführliche Notizen zu jedem Lesezeichen, das Markdown unterstützt.

### 3.4 Suche & Filter
- Volltextsuche über Titel, Beschreibung, URL und Notizen.
- Filterung nach Tags.


### 3.5 URL-Anlegen via Modal
Neue Bookmarks werden ausschließlich über ein **Modal** angelegt, das über einen zentralen „Hinzufügen"-Button geöffnet wird.

Das Modal enthält zwei **Tabs**:

#### Tab 1: Einzeln
- Ein einzelnes URL-Eingabefeld.
- Optionale Felder: Notizen (Markdown), Tags.
- Nach dem Speichern: Metadaten werden automatisch im Hintergrund geladen.

#### Tab 2: Liste
- Ein mehrzeiliges Textfeld oder ein einzelnes Eingabefeld für eine kommaseparierte Liste von URLs.
- Keine weiteren Felder (Notizen/Tags können nach dem Import pro Bookmark bearbeitet werden).
- Nach dem Speichern: Jede URL wird einzeln verarbeitet.
- Ergebnis-Zusammenfassung wird direkt im Modal angezeigt (angelegt / übersprungen / fehlgeschlagen).

#### Allgemeine Modal-Regeln
- Das Modal schließt sich nach erfolgreichem Einzelimport automatisch.
- Bei einem Listen-Import bleibt das Modal offen, bis der Nutzer die Zusammenfassung bestätigt.
- Validierungsfehler (z.B. ungültige URL) werden inline im Modal angezeigt.
- Nuxt UI Komponenten: `UModal`, `UTabs`, `UInput`, `UTextarea`, `UButton`, `UBadge`.


### 3.6 URL bearbeiten via Modal
Bestehende Bookmarks werden ausschließlich über ein **Edit-Modal** bearbeitet.

- Das Edit-Modal öffnet sich über einen „Bearbeiten"-Button in der Bookmark-Karte oder Detailansicht.
- Das Modal enthält dieselben Felder wie Tab „Einzeln" beim Anlegen: URL, Notizen (Markdown), Tags.
- Die URL selbst kann bearbeitet werden. Nach einer URL-Änderung werden die Metadaten automatisch neu geladen.
- Änderungen werden erst nach explizitem Speichern übernommen.
- Das Modal schließt sich nach erfolgreichem Speichern automatisch.
- Validierungsfehler werden inline angezeigt.
- Nuxt UI Komponenten: `UModal`, `UInput`, `UTextarea`, `UButton`, `UBadge`, `UForm`.

### 3.7 Markdown-Editor für Notizen
Notizen werden als Markdown gespeichert und in der App kontextabhängig dargestellt.

#### Beim Anlegen (Modal Tab „Einzeln") und beim Bearbeiten (Edit-Modal)
- Es erscheint eine **Textarea** für Markdown-Eingabe.
- Oberhalb der Textarea befinden sich zwei Tabs oder Toggle-Buttons: **„Bearbeiten"** und **„Vorschau"**.
- Im **Bearbeiten-Modus**: einfache Textarea, kein WYSIWYG.
- Im **Vorschau-Modus**: gerendertes HTML aus dem Markdown-Inhalt, read-only.
- Der Nutzer kann jederzeit zwischen beiden Modi wechseln, ohne Daten zu verlieren.
- Standard-Modus beim Öffnen: **Bearbeiten**.

#### Beim Öffnen / Anzeigen eines Bookmarks
- Notizen werden standardmäßig als **formatierter Text** (gerendertes Markdown) angezeigt.
- Der Nutzer kann über einen „Bearbeiten"-Button in den Edit-Modus wechseln, der das Edit-Modal öffnet.
- Kein Inline-Editing auf der Detailansicht.

#### Technische Anforderungen
- Markdown-Rendering via `@nuxtjs/mdc` oder `marked` + `DOMPurify` (XSS-Schutz verpflichtend).
- Gespeichert wird immer der rohe Markdown-Text, nie das gerenderte HTML.
- Leere Notizen werden als `null` gespeichert, nicht als leerer String.

## 4. Technisches Design

### 4.1 Tech-Stack
- **Frontend/Backend:** Nuxt 4 (Nitro Engine)
- **UI-Komponenten:** Nuxt UI (basiert auf Headless UI + Tailwind CSS intern, wird aber als Komponentenbibliothek genutzt – kein direktes Tailwind-Authoring im Projekt)
- **Icons:** Nuxt Icon (via `@nuxt/icon`, nutzt Iconify-Bibliotheken wie `heroicons`, `lucide`, `mdi` etc.)
- **Datenbank:** SQLite (`better-sqlite3`)
- **HTML-Parsing:** Cheerio (leichtgewichtig, kein Headless-Browser nötig)
- **Containerisierung:** Docker & Docker Compose

### 4.2 Nuxt UI Designprinzipien
- Alle UI-Elemente werden ausschließlich über Nuxt UI Komponenten gebaut:
  - `UCard` für Bookmark-Karten
  - `UInput`, `UButton`, `UModal`, `UBadge` für Formulare und Interaktionen
  - `UPagination` für die Seitennavigation
  - `UCommandPalette` oder `UInput` mit Debounce für die Suche
  - `USelectMenu` für Tag-Filter
- Eigene Styles werden nur über Nuxt UI Tokens (CSS-Variablen / `app.config.ts`) angepasst.
- Kein direktes Schreiben von Tailwind-Klassen im Template-Code.

### 4.3 Datenbankschema
Die Datenbank wird beim ersten Start automatisch initialisiert (Schema-Migration).
- **bookmarks:** id, url, normalized_url, title, description, image_url, site_name, notes (Markdown), created_at, updated_at
- **tags:** id, name (unique)
- **bookmark_tags:** bookmark_id, tag_id

### 4.4 Daten-Persistenz & Git-Strategie
- Die SQLite-Datenbankdatei wird **nicht** ins Repository eingecheckt (`.gitignore`).
- Ein `DATABASE_PATH` in der `.env` steuert den Speicherort.
- Im Docker-Setup wird ein persistentes Volume (z.B. `/data`) verwendet.
- Ein Init-Skript prüft beim App-Start: `CREATE TABLE IF NOT EXISTS ...`

## 5. API-Design

### GET `/api/bookmarks`
Query-Parameter: `search`, `page`, `pageSize`, `tag`

### POST `/api/bookmarks`
Body: `{ url, notes? }`
Server führt Metadaten-Extraktion durch und speichert das Ergebnis.

### PATCH `/api/bookmarks/:id`
Body: `{ title?, description?, notes?, tags? }`

### DELETE `/api/bookmarks/:id`

### GET `/api/tags`
Gibt alle vorhandenen Tags zurück.

### POST `/api/bookmarks/:id/refresh`
Löst eine erneute Metadaten-Extraktion für eine bestehende URL aus.

## 6. Deployment (Docker)
Die App wird über ein `Dockerfile` bereitgestellt, das:
1. Den Nuxt-Build durchführt.
2. Einen Lightweight Node.js Server startet.
3. Die SQLite-Datenbank in einem gemounteten Volume verwaltet.
4. Port 3777 (Standard) nach außen freigibt.

Typischer Start:
```bash
docker run -p 3777:3777 -v openbookmark_data:/data open-bookmark
```

## 7. Roadmap
- **Phase 1 (MVP):** URL-Extraktion, Cards, Tags, Markdown-Notes, SQLite-Auto-Init, Docker.
- **Phase 2:** Massen-Import (HTML/CSV), Dark-Mode via Nuxt UI Color Mode, Image-Caching (lokales Speichern der Vorschaubilder).
- **Phase 3:** Volltextsuche via SQLite FTS5, Browser-Extension-Support (API-Endpoint).

## 8. Rechtliches / Open Source
- **Lizenz:** MIT (geplant)
- **Verantwortung:** Scraping erfolgt user-initiiert. Die App respektiert Standard-Header, nutzt aber keine Umgehungstechniken für geschützte Inhalte.

## 9. Open Source & Sicherheit
Da das Repository von `private` auf `public` umgestellt werden soll, gelten folgende Sicherheitsregeln:
- **Gitignore:** Die Datei `.env` sowie die SQLite-Datenbankdatei (`*.db`) müssen zwingend in der `.gitignore` stehen.
- **Konfigurations-Vorlagen:** Im Repository wird eine `.env.example` bereitgestellt, die alle notwendigen Variablen ohne sensible Werte enthält.
- **Geheimnisse:** Es dürfen keine API-Keys, Passwörter oder private Pfade in den Code-Commits landen.
- **Historie:** Vor der Veröffentlichung wird die Commit-Historie auf versehentlich eingecheckte sensible Daten geprüft.
