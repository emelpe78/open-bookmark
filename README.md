# Open Bookmark

Lokal betriebene Lesezeichen-App mit automatischer Metadaten-Extraktion, Tags, Markdown-Notizen und Kartenansicht.

Technologie: **Nuxt 4**, **Nuxt UI**, **SQLite** (`better-sqlite3`), **Electron** (macOS Desktop). Die Web-App liegt im Ordner [`open-bookmark/`](open-bookmark/).

## Voraussetzungen

- Node.js 22+
- npm
- macOS (für die Desktop-App)

## Open Bookmark Desktop (macOS)

Installierbare App ohne Docker:

```bash
cd desktop
npm install
npm run build:runtime   # baut Nuxt + Extension + Node-Bundle
npm run pack:dir        # erzeugt release/mac-arm64/Open Bookmark.app (unsigned)
```

Entwicklung (Electron lädt die lokale Nitro-Runtime):

```bash
cd open-bookmark && npm run build
cd desktop && npm install && npm run dev
```

Die App startet den Dienst auf **`http://127.0.0.1:3777`** und speichert die Datenbank unter  
`~/Library/Application Support/Open Bookmark/bookmarks.db`.

**Gatekeeper:** Unsigned Builds musst du unter *Systemeinstellungen → Datenschutz & Sicherheit* einmal erlauben.

Details: [`desktop/README.md`](desktop/README.md)

## Lokal entwickeln (Web)

```bash
cd open-bookmark
cp .env.example .env
npm install
npm run dev
```

Die App läuft unter [http://localhost:3777](http://localhost:3777).

**Wichtig:** `npm run dev` immer im Ordner `open-bookmark/` ausführen. Ist Port 3777 belegt, weicht Nuxt auf einen anderen Port aus — dann die URL in der Konsole nutzen oder den anderen Prozess beenden.

### Typecheck

```bash
cd open-bookmark
npm run typecheck
```

## Umgebungsvariablen

| Variable | Standard | Beschreibung |
|----------|----------|--------------|
| `APP_PORT` | `3777` | Port für Dev-Server und Desktop |
| `DATABASE_PATH` | `./data/bookmarks.db` | Pfad zur SQLite-Datei (lokal); Desktop setzt Application Support automatisch |
| `HOST` | `127.0.0.1` (Production) | Bind-Adresse der Nitro-Runtime |

Siehe [`open-bookmark/.env.example`](open-bookmark/.env.example).

## API (Auszug)

| Methode | Pfad | Beschreibung |
|---------|------|--------------|
| `GET` | `/api/bookmarks` | Liste mit `search`, `page`, `pageSize`, `tag` |
| `POST` | `/api/bookmarks` | Einzel (`{ url, notes?, tags? }`) oder Bulk (`{ urls: "a, b" }`) |
| `PATCH` | `/api/bookmarks/:id` | Bookmark bearbeiten |
| `DELETE` | `/api/bookmarks/:id` | Bookmark löschen |
| `GET` | `/api/tags` | Tags mit Anzahl |
| `POST` | `/api/bookmarks/:id/refresh` | Metadaten neu laden |

## Chrome Extension

Die Browser-Extension liegt in [`extension/`](extension/). Sie speichert Seiten per `POST /api/bookmarks` in deiner lokalen Instanz (Desktop oder Dev).

Kurzanleitung: [`extension/README.md`](extension/README.md) (Build, Side-Load, Server-URL `http://localhost:3777`).

In der Desktop-App: Menü **Hilfe → Browser-Erweiterung** oder Route `/extension`.

## Repository-Struktur

```
open-bookmark/          # Nuxt-App (Quellcode, API, SQLite)
extension/              # Chrome Extension (Manifest V3)
desktop/                # Electron-Shell für macOS
docs/                   # PRD, ADRs
README.md               # Diese Datei
```

## Tests

```bash
cd open-bookmark && npm run test && npm run typecheck
cd extension && npm run test && npm run typecheck
cd desktop && npm run typecheck
```
