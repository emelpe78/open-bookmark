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

Oder manuell:

```bash
docker build -t open-bookmark ./open-bookmark
docker run -p 3777:3777 -v openbookmark_data:/data open-bookmark
```

## Umgebungsvariablen

| Variable | Standard | Beschreibung |
|----------|----------|--------------|
| `APP_PORT` | `3777` | Port für Dev-Server |
| `DATABASE_PATH` | `./data/bookmarks.db` | Pfad zur SQLite-Datei (lokal); im Container `/data/bookmarks.db` |
| `PORT` | `3777` | Port im Production-Container |

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

## Dokumentation

| Pfad | Inhalt |
|------|--------|
| [`docs/PRD_OpenBookmark.md`](docs/PRD_OpenBookmark.md) | Product Requirements Document |
| [`docs/markdown_eingabemoeglichkeiten_spickzettel.md`](docs/markdown_eingabemoeglichkeiten_spickzettel.md) | Markdown-Spickzettel für Notizen |
| [`AGENTS.md`](AGENTS.md) | Leitfaden für AI-Agents und MVP-Regeln |
| [`CONTEXT.md`](CONTEXT.md) | Domänen-Glossar (Projekt-Sprache) |

## Ressourcen (Design & Skills)

- [Matt Pocock's Skills](https://github.com/mattpocock/skills)
- [Get Design](https://getdesign.md/)
- [Frontend Design Skill](https://skills.sh/anthropics/skills/frontend-design)
- [UI/UX Pro Max Skill](https://skills.sh/nextlevelbuilder/ui-ux-pro-max-skill/ui-ux-pro-max)
- [LLM Wiki](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f)

## Repository-Struktur

```
open-bookmark/          # Nuxt-App (Quellcode, package.json)
docs/                   # PRD und weitere Docs
docker-compose.yml      # Container-Setup
AGENTS.md               # Agent-/Contributor-Regeln
```
