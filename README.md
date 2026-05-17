# Open-Bookmark

Lokal betriebene Lesezeichen-App mit automatischer Metadaten-Extraktion, Tags, Markdown-Notizen und Kartenansicht.

Technologie: **Nuxt 4**, **Nuxt UI**, **SQLite** (`better-sqlite3`), **Docker**. Die Anwendung liegt im Ordner [`open-bookmark/`](open-bookmark/).

## Voraussetzungen

- Node.js 22+
- npm

## Lokal starten

```bash
cd open-bookmark
cp .env.example .env
npm install
npm run dev
```

Die App läuft unter [http://localhost:3777](http://localhost:3777).

**Wichtig:** `npm run dev` immer im Ordner `open-bookmark/` ausführen (nicht im Repository-Root). Ist Port 3777 belegt, weicht Nuxt auf 3000 aus — dann die URL in der Konsole nutzen oder den anderen Prozess beenden.

### Typecheck

```bash
cd open-bookmark
npm run typecheck
```

## Docker

Vom Repository-Root:

```bash
docker compose up --build
```

Die App läuft unter [http://localhost:3778](http://localhost:3778) (Dev weiterhin auf Port 3777).

Oder manuell:

```bash
docker build -t open-bookmark ./open-bookmark
docker run -p 3778:3778 -v openbookmark_data:/data open-bookmark
```

## Umgebungsvariablen

| Variable | Standard | Beschreibung |
|----------|----------|--------------|
| `APP_PORT` | `3777` | Port für Dev-Server |
| `DATABASE_PATH` | `./data/bookmarks.db` | Pfad zur SQLite-Datei (lokal); im Container `/data/bookmarks.db` |
| `PORT` | `3778` (Docker) / `3777` (Dev) | Port im Production-Container bzw. Dev-Server |

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

## Repository-Struktur

```
open-bookmark/          # Nuxt-App (Quellcode, package.json, Dockerfile)
docker-compose.yml      # Container-Setup
README.md               # Diese Datei
```
