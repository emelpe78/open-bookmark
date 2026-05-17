# AGENTS.md

Leitfaden für AI-Agents am Projekt **Open-Bookmark** — lokaler Bookmark-Manager (Nuxt 4, SQLite, Docker). Details: [`README.md`](README.md), PRD unter `docs/` (lokal, ggf. nicht im Remote-Repo).

## Produkt (MVP)

- Self-hosted, **local-first**, Single-User, **ohne Auth**, **ohne LLM**
- URLs speichern, Metadaten per Server-Fetch (Cheerio), Karten-UI, Suche, Tags, Markdown-Notizen
- Open Source — keine Secrets, keine `.db`-Dateien committen

**Nicht einführen** (ohne explizite Anfrage): Auth, Accounts, Playwright/Crawling, Cron/Worker, externe DB, FTS, Cloud-only.

## Stack & Layout

| Bereich | Pfad (`open-bookmark/`) |
|---------|-------------------------|
| UI | `app/pages/`, `app/components/`, `app/layouts/` |
| Composables | `app/composables/useBookmarks.ts`, `useBookmarkModals.ts` |
| API | `server/api/bookmarks/`, `server/api/tags/` |
| Logik | `server/utils/` (`db`, `bookmarks`, `tags`, `metadata`, `normalizeUrl`, `validation`) |
| Markdown | `lib/markdown.ts` (marked + DOMPurify) |
| Typen | `shared/types/bookmark.ts` |

**Tech:** Nuxt 4, Nuxt UI v4, `@nuxt/icon`, Nitro, `better-sqlite3`, Cheerio, Docker.

**Env:** `APP_PORT=3777`, `DATABASE_PATH` (lokal `./data/bookmarks.db`, Docker `/data/bookmarks.db`).

## UI-Regeln

- **Nuxt UI** (`UCard`, `UButton`, `UInput`, `UTextarea`, `UModal`, `UTabs`, `UBadge`, `UPagination`, `UFormField`) — kein Tailwind-first-Styling
- Theming über `app/app.config.ts` (Primary: green)
- Formulare: volle Breite via `app.config.ts` (`input`/`textarea`/`selectMenu` `w-full`)

## Datenbank

Schema wird in `server/utils/db.ts` bei Start angelegt. Tabellen: `bookmarks`, `tags`, `bookmark_tags`. Duplikate über `normalized_url` (UNIQUE).

`bookmarks`: `id`, `url`, `normalized_url`, `title`, `description`, `image_url`, `site_name`, `notes`, `created_at`, `updated_at`.

Direktes SQL, keine ORM-Abstraktion. Leere Notizen als `null`, nicht `""`.

## URL & Ingestion

1. Validieren → `normalizeUrl` (Hostname lowercase, `utm_*`/`fbclid`/`gclid` entfernen, sinnvolle Trailing-Slashes)
2. Metadaten fetch (Cheerio): title, description, image, site_name
3. Speichern; Tags optional

**Bulk:** ein Endpoint `POST /api/bookmarks` — Body `{ url, … }` oder `{ urls: "a, b, c" }`. Duplikate → `skipped`, Fehler → `failed[]` mit Grund.

## UI-Flows (verbindlich)

### Hinzufügen — nur `BookmarkAddModal`

- Tab **Einzeln:** URL, Tags, Notizen → Speichern schließt Modal
- Tab **Liste:** kommaseparierte URLs (`UTextarea`), kein Notes/Tags → Zusammenfassung, Modal bleibt offen
- Kein eigener Add-Route/Page; Tab-Reset bei jedem Öffnen (Default: Einzeln)

### Bearbeiten — nur `BookmarkEditModal`

- Felder wie Einzeln-Tab; **kein Inline-Edit** auf Karten
- Eigenes Modal, nicht Add-Modal wiederverwenden
- URL nur mitsenden wenn geändert → dann Metadaten neu laden
- `editingId` beim Öffnen fixieren; Speichern explizit, Modal zu bei Erfolg
- Notizen: Default-Vorschau im Edit-Modal (`MarkdownNotesField` mit `default-mode="preview"`)

### Markdown

- Roh-Markdown in DB; Anzeige nur sanitized (`lib/markdown.ts`)
- Editor: `UTextarea` + Tabs Bearbeiten/Vorschau (Add: Default Bearbeiten)
- Karten: gerendertes HTML via `MarkdownContent`

## Liste, Suche, Pagination

- Suche (debounced) über URL, Titel, Beschreibung, Notizen, Tag-Namen — einfaches SQL `LIKE`
- `pageSize` Default **10**, wählbar **10 / 25 / 50 / 100** (`BookmarkListPagination`, oben + unten)
- Paginator sichtbar sobald `total > 0` (auch bei einer Seite)

## API

| Methode | Pfad | Hinweis |
|---------|------|---------|
| GET | `/api/bookmarks` | `search`, `page`, `pageSize`, `tag` |
| POST | `/api/bookmarks` | single oder bulk |
| PATCH | `/api/bookmarks/:id` | `url?`, `notes?`, `tags?` |
| DELETE | `/api/bookmarks/:id` | |
| GET | `/api/tags` | mit Counts |
| POST | `/api/bookmarks/:id/refresh` | Metadaten neu |

Routen unter `server/api/bookmarks/[id]/` (z. B. `index.patch.ts`, `refresh.post.ts`).

## Entwicklung

```bash
cd open-bookmark && npm install && npm run dev   # :3777
npm run typecheck   # nach nuxt prepare
```

Docker vom Repo-Root: `docker compose up --build`, Volume für `/data`.

TypeScript: `open-bookmark/tsconfig.json` + `.nuxt/` (nach `nuxt prepare`). Root-`tsconfig.json` nur für IDE-Workspace.

## Sicherheit & Commits

Niemals committen: `.env`, `*.db`, Keys, Tokens, Nutzerdaten. Nur `.env.example` mit Platzhaltern.

Kleine, fokussierte Diffs; Stack und MVP-Scope nicht erweitern ohne Rücksprache.

## Definition of Done

- Bookmark-Use-Case, SQLite lokal, Nuxt UI, Docker-tauglich
- Keine Secrets, keine out-of-scope Features
- Passt zu bestehenden Modals, API und Normalisierung

**Im Zweifel:** einfach halten, expliziter Code, lokale DX, Scope nicht ausweiten.
