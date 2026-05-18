# Open Bookmark Chrome Extension

Manifest-V3-Extension zum Speichern der aktuellen Seite oder eines Links in deiner Open Bookmark-Instanz — inkl. optionaler Tags (`POST /api/bookmarks`, `GET /api/tags` für Vorschläge).

## Voraussetzungen

- Google Chrome oder Chromium
- Laufende Open Bookmark-Instanz (Desktop-App, lokaler Dev-Server oder eigene URL)
- Node.js 22+ (nur für Entwicklung/Build)

## Installation (Side-Load)

```bash
cd extension
npm install
npm run build
```

In Chrome: `chrome://extensions` → **Entwicklermodus** → **Entpackte Erweiterung laden** → Ordner `extension/dist` wählen.

Mit der **Open Bookmark Desktop-App** findest du unter **Browser-Erweiterung** eine Schritt-für-Schritt-Anleitung und kannst den `dist`-Ordner direkt öffnen.

Für Live-Entwicklung:

```bash
npm run dev
```

Danach erneut `extension/dist` laden; Änderungen nach Reload der Extension.

## Server-URL konfigurieren

1. Extension-Icon → **Einstellungen**, oder Rechtsklick auf das Icon → Optionen.
2. **Server-Basis-URL** eintragen, z. B.:
   - Open Bookmark Desktop / lokaler Dev-Server: `http://localhost:3777`
   - Eigene gehostete Instanz: `https://bookmark.example.com`
3. **Speichern** und Host-Zugriff bestätigen, wenn Chrome danach fragt.

Standard beim ersten Start: `http://localhost:3777` (entspricht `http://127.0.0.1:3777` der Desktop-App).

**Hinweis:** Die Open Bookmark-App muss erreichbar sein, bevor du speicherst. Metadaten (Titel, Beschreibung) holt der Server — das kann einige Sekunden dauern.

## Nutzung

- **Popup:** Icon klicken → optional Tags (kommagetrennt, bestehende als Vorschläge) und Notiz → **Speichern**
- **Kontextmenü:** Rechtsklick auf Seite oder Link → Eintrag „… in Open Bookmark speichern“
- **App öffnen:** Im Popup „In Open Bookmark öffnen“
- **Duplikat / Aktualisieren:** Beim Öffnen werden Tags und Notiz einer bereits gespeicherten Seite geladen. Speichern mit geänderten Tags oder Notiz aktualisiert den Bookmark (`PATCH`). Ohne Änderungen erscheint der Duplikat-Hinweis inkl. „Metadaten aktualisieren“
- **Formular:** Zuletzt verwendete Tags und Notiz werden lokal vorausgefüllt (nur dieses Gerät)

## Einstellungen & Verbindung

Nach **Speichern** der Server-URL: automatischer Verbindungstest (`GET /api/tags`) und Aktualisierung des Tag-Vorschlags-Caches (5 Min. TTL). Button **Verbindung testen** jederzeit manuell nutzbar.

## Icons

```bash
npm run icons   # erzeugt public/icons/* aus open-bookmark/public/favicon.ico
```

`npm run build` führt `icons` automatisch aus (`prebuild`).

## Tests & Typecheck

```bash
npm run test
npm run typecheck
```

## Berechtigungen

- `storage` — Server-URL
- `activeTab` / `tabs` — aktuelle Tab-URL im Popup und Kontextmenü
- `contextMenus` — Rechtsklick-Aktionen
- `optional_host_permissions` — Zugriff nur auf die von dir konfigurierte Instanz (`localhost`, `127.0.0.1` oder angeforderte Origin)

Keine Telemetrie, keine eingebauten Secrets.
