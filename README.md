# Open Bookmark

Lokal betriebene Lesezeichen-App mit automatischer Metadaten-Extraktion, Tags, Markdown-Notizen und Kartenansicht.

Technologie: **Nuxt 4**, **Nuxt UI**, **SQLite** (`better-sqlite3`), **Electron** (macOS Desktop). Die Web-App liegt im Ordner [`open-bookmark/`](open-bookmark/).

## Inhalt

- [Voraussetzungen](#voraussetzungen)
- [Open Bookmark Desktop (macOS)](#open-bookmark-desktop-macos)
- [Lokal entwickeln (Web)](#lokal-entwickeln-web)
  - [Typecheck](#typecheck)
- [Umgebungsvariablen](#umgebungsvariablen)
- [API](#api)
  - [Übersicht](#übersicht)
  - [Fehlerantworten](#fehlerantworten)
  - [Datenmodelle](#datenmodelle)
  - [Bookmarks](#bookmarks)
  - [Tags](#tags)
  - [Listen](#listen)
  - [Beispiel (curl)](#beispiel-bookmark-speichern-extension--curl)
- [Chrome Extension](#chrome-extension)
- [Repository-Struktur](#repository-struktur)
- [Tests](#tests)

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

Für **`npm run dev`** und den gebauten Nitro-Server (`npm run build` → Child unter `open-bookmark/.output/server/`): Datei `open-bookmark/.env` aus [`.env.example`](open-bookmark/.env.example) anlegen.

| Variable | Standard | Gilt für | Beschreibung |
|----------|----------|----------|--------------|
| `APP_PORT` | `3777` | Dev, Nitro (Prod.) | Port des Nuxt-Dev-Servers bzw. von Nitro (`runtimeConfig.public.appPort`) |
| `PORT` | — | Dev, Nitro (Prod.) | Fallback, wenn `APP_PORT` nicht gesetzt ist |
| `DATABASE_PATH` | `./data/bookmarks.db` | Dev, Nitro (Prod.) | SQLite-Datei; relativ zum Arbeitsverzeichnis `open-bookmark/` oder absolut |
| `HOST` | `127.0.0.1` | nur Nitro (Prod.) | Bind-Adresse beim Start von `.output/server/index.mjs` (nicht im Dev-Modus) |
| `OPEN_BOOKMARK_DESKTOP` | — | Nitro (Prod.) | Wird von der Desktop-App auf `1` gesetzt (`runtimeConfig.public.isDesktop`) |

**Desktop-App (Electron):** Keine `.env` nötig. Beim Start setzt Electron die Runtime-Umgebung fest:

| Einstellung | Wert |
|-------------|------|
| Port | `3777` (MVP, nicht konfigurierbar) |
| `HOST` | `127.0.0.1` |
| `DATABASE_PATH` | `~/Library/Application Support/Open Bookmark/bookmarks.db` |
| `OPEN_BOOKMARK_DESKTOP` | `1` |

Optional nur bei **`cd desktop && npm run dev`**: `NODE` — Pfad zur Node-Binary, falls `node` nicht im PATH liegt (Packaged Builds nutzen ein gebündeltes Node unter `Resources/node/`).

Die Chrome Extension konfiguriert die Server-URL in ihren eigenen Einstellungen (Standard: `http://localhost:3777`), nicht über diese Variablen.

## API

HTTP-JSON-API der Nuxt/Nitro-Runtime. Basis-URL in Dev und Desktop:

- **Dev:** `http://localhost:3777`
- **Desktop:** `http://127.0.0.1:3777`

`POST` und `PATCH` erwarten `Content-Type: application/json`. Es gibt **keine Authentifizierung** (local-first, Single-User). In Production bindet Nitro nur an **Loopback** (`127.0.0.1`).

### Übersicht

| Methode | Pfad | Beschreibung |
|---------|------|--------------|
| `GET` | `/api/bookmarks` | Bookmarks listen (Suche, Pagination, Filter) |
| `GET` | `/api/bookmarks/revision` | Aggregat für Cache/Invalidierung |
| `POST` | `/api/bookmarks` | Bookmark anlegen (einzeln oder Bulk) |
| `PATCH` | `/api/bookmarks/:id` | Bookmark bearbeiten |
| `DELETE` | `/api/bookmarks/:id` | Bookmark löschen |
| `POST` | `/api/bookmarks/:id/refresh` | Metadaten der Seite neu laden |
| `GET` | `/api/tags` | Tags mit Bookmark-Anzahl |
| `POST` | `/api/tags` | Tag anlegen |
| `PATCH` | `/api/tags/:id` | Tag umbenennen |
| `DELETE` | `/api/tags/:id` | Tag löschen |
| `GET` | `/api/lists` | Listen (Zusammenfassung) |
| `POST` | `/api/lists` | Liste anlegen |
| `GET` | `/api/lists/:id` | Liste inkl. Bookmarks |
| `PATCH` | `/api/lists/:id` | Liste bearbeiten |
| `DELETE` | `/api/lists/:id` | Liste löschen |

Route-Parameter `:id` sind positive Ganzzahlen.

### Fehlerantworten

Validierungsfehler und Domain-Fehler werden als H3-Fehler zurückgegeben (JSON-Body, u. a. `statusCode`, `statusMessage`). Die `statusMessage` ist für Nutzer gedacht (meist Deutsch).

| HTTP | Bedeutung (Auswahl) |
|------|---------------------|
| `400` | Ungültige Query/Body/ID, leere Pflichtfelder, ungültige URL |
| `404` | Bookmark, Tag oder Liste nicht gefunden |
| `409` | URL, Tag- oder Listenname bereits vergeben |
| `500` | Bookmark nach Schreibvorgang nicht ladbar (`LOAD_FAILED`) |

Domain-Codes (intern) und zugehörige Meldungen:

| Code | HTTP | Meldung (Standard) |
|------|------|-------------------|
| `NOT_FOUND` | 404 | Bookmark nicht gefunden. |
| `DUPLICATE_URL` | 409 | Ein Bookmark mit dieser URL existiert bereits. |
| `INVALID_URL` | 400 | Ungültige URL. |
| `LOAD_FAILED` | 500 | Bookmark konnte nicht geladen werden. |
| `EMPTY_TAG_NAME` | 400 | Tag-Name darf nicht leer sein. |
| `TAG_NOT_FOUND` | 404 | Tag nicht gefunden. |
| `EMPTY_LIST_NAME` | 400 | Listenname darf nicht leer sein. |
| `DUPLICATE_TAG_NAME` | 409 | Ein Tag mit diesem Namen existiert bereits. |
| `LIST_NOT_FOUND` | 404 | Liste nicht gefunden. |
| `DUPLICATE_LIST_NAME` | 409 | Eine Liste mit diesem Namen existiert bereits. |

### Datenmodelle

**Bookmark** (in Listen und Detailantworten):

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `id` | number | Primärschlüssel |
| `url` | string | Gespeicherte URL (normalisiert) |
| `normalized_url` | string | Dedup-Schlüssel (Tracking-Parameter entfernt, Host kleingeschrieben) |
| `title` | string \| null | Seitentitel (Metadaten) |
| `description` | string \| null | Beschreibung (Metadaten) |
| `image_url` | string \| null | Vorschaubild (Metadaten) |
| `site_name` | string \| null | Site-Name (Metadaten) |
| `notes` | string \| null | Markdown-Notizen; leer → `null` |
| `created_at` | string | ISO-Zeitstempel |
| `updated_at` | string | ISO-Zeitstempel |
| `tags` | string[] | Tag-Namen (normalisiert, siehe unten) |
| `lists` | string[] | Namen der Listen, denen der Bookmark zugeordnet ist |

**TagWithCount:** `{ id, name, count }` — `count` = Anzahl Bookmarks mit diesem Tag.

**BookmarkListSummary:** `{ id, name, count, created_at, updated_at }`.

**BookmarkListDetail:** `{ id, name, created_at, updated_at, bookmarks: BookmarkListEntry[] }` — Einträge: `{ id, url, title, site_name }`.

**Tag-Normalisierung:** Kleinbuchstaben, Leerzeichen/Unterstriche → Bindestriche, dedupliziert. Im Request können Tags als **Array** oder **kommagetrennter String** übergeben werden.

**Listen-Namen:** Getrimmt, mehrfache Leerzeichen zu einem Leerzeichen (Groß/Klein bleibt erhalten).

**URLs:** Nur `http:`/`https:`; fehlendes Schema wird zu `https://` ergänzt. Duplikate werden über `normalized_url` erkannt.

---

### Bookmarks

#### `GET /api/bookmarks`

Paginierte Liste mit optionaler Suche und Filtern.

**Query-Parameter**

| Parameter | Typ | Standard | Beschreibung |
|-----------|-----|----------|--------------|
| `search` | string | — | Sucht in URL, Titel, Beschreibung, Notizen und Tag-Namen (`LIKE`) |
| `page` | number | `1` | Seite (≥ 1) |
| `pageSize` | number | `10` | Einträge pro Seite (1–100) |
| `tag` | string | — | Nur Bookmarks mit diesem Tag (Name, case-insensitive) |
| `list` | string | — | Nur Bookmarks in dieser Liste (Name, case-insensitive) |

**Antwort** `200`

```json
{
  "items": [ /* Bookmark[] */ ],
  "total": 42,
  "page": 1,
  "pageSize": 10
}
```

**Beispiel:** `GET /api/bookmarks?search=nuxt&tag=docs&page=1&pageSize=25`

---

#### `GET /api/bookmarks/revision`

Leichtgewichtiges Aggregat für Polling/Cache-Invalidierung (z. B. Extension oder UI).

**Antwort** `200`

```json
{
  "total": 42,
  "latestUpdatedAt": "2026-05-18T12:00:00.000Z"
}
```

`latestUpdatedAt` ist `null`, wenn keine Bookmarks existieren.

---

#### `POST /api/bookmarks`

Legt einen oder mehrere Bookmarks an. Beim Anlegen werden **Metadaten** der Zielseite per HTTP-Fetch extrahiert (Cheerio).

**Body (einzeln)** — genau eines von `url` oder `urls` ist Pflicht:

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `url` | string | Eine URL |
| `urls` | string | Mehrere URLs, **kommagetrennt** (Bulk-Import) |
| `notes` | string \| null | Optionale Markdown-Notizen |
| `tags` | string[] \| string | Optionale Tags |

**Antwort einzeln** `201`

```json
{ "bookmark": { /* Bookmark */ } }
```

**Fehler einzeln:** `409` bei Duplikat-URL, `400` bei ungültiger URL.

**Body (Bulk)** — Feld `urls` statt `url`:

```json
{ "urls": "https://a.example, https://b.example" }
```

**Antwort Bulk** `200`

```json
{
  "created": 1,
  "skipped": 1,
  "failed": [{ "url": "not-a-url", "reason": "Ungültige URL." }]
}
```

- **created:** neu angelegt  
- **skipped:** bereits vorhanden (gleiche `normalized_url`)  
- **failed:** URL ungültig oder anderer Fehler pro Eintrag  

Bulk legt **keine** Tags/Notizen pro URL an.

---

#### `PATCH /api/bookmarks/:id`

Teilupdate eines Bookmarks.

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `url` | string | Neue URL → Metadaten werden neu geladen |
| `notes` | string \| null | Notizen ersetzen; `null` oder leer → gespeichert als `null` |
| `tags` | string[] \| string | Tag-Set **ersetzen** (nicht mergen); leer → alle Tags entfernen |

**Antwort** `200`

```json
{ "bookmark": { /* Bookmark */ } }
```

---

#### `DELETE /api/bookmarks/:id`

**Antwort** `204` ohne Body bei Erfolg. `404`, wenn die ID nicht existiert.

---

#### `POST /api/bookmarks/:id/refresh`

Lädt Metadaten (`title`, `description`, `image_url`, `site_name`) für die bestehende URL erneut von der Seite.

**Antwort** `200`

```json
{ "bookmark": { /* Bookmark */ } }
```

---

### Tags

#### `GET /api/tags`

**Antwort** `200`

```json
{
  "tags": [
    { "id": 1, "name": "docs", "count": 5 }
  ]
}
```

Wird von Clients oft als **Health-Check** genutzt (Server erreichbar?).

---

#### `POST /api/tags`

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `name` | string | Tag-Name (Pflicht, wird normalisiert) |

**Antwort** `200`

```json
{ "tag": { "id": 1, "name": "docs", "count": 0 } }
```

`409` bei doppeltem Namen.

---

#### `PATCH /api/tags/:id`

Body wie `POST /api/tags` (`name`).

**Antwort** `200` — `{ "tag": TagWithCount }`. Bestehende Bookmark-Zuordnungen bleiben erhalten (Name in DB aktualisiert).

---

#### `DELETE /api/tags/:id`

Entfernt den Tag und alle `bookmark_tags`-Verknüpfungen.

**Antwort** `200`

```json
{ "ok": true }
```

---

### Listen

Listen gruppieren Bookmarks (Many-to-many). Namen sind pro Installation eindeutig.

#### `GET /api/lists`

**Antwort** `200`

```json
{
  "lists": [
    { "id": 1, "name": "Reading List", "count": 3, "created_at": "…", "updated_at": "…" }
  ]
}
```

---

#### `POST /api/lists`

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `name` | string | Listenname (Pflicht) |
| `bookmarkIds` | number[] | Optionale Bookmark-IDs (Standard: `[]`) |

**Antwort** `200`

```json
{ "list": { /* BookmarkListSummary */ } }
```

`409` bei doppeltem Listenname. Ungültige Bookmark-IDs werden still ignoriert (nur existierende IDs verknüpft).

---

#### `GET /api/lists/:id`

**Antwort** `200`

```json
{ "list": { /* BookmarkListDetail */ } }
```

---

#### `PATCH /api/lists/:id`

Mindestens eines der Felder ist erforderlich:

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `name` | string | Listenname ändern |
| `bookmarkIds` | number[] | **Ersetzt** die Bookmark-Menge der Liste |
| `addBookmarkIds` | number[] | Bookmarks **hinzufügen** (ohne bestehende zu entfernen) |

`bookmarkIds` und `addBookmarkIds` können kombiniert werden (`bookmarkIds` zuerst, dann Hinzufügen).

**Antwort** `200`

```json
{ "list": { /* BookmarkListDetail */ } }
```

---

#### `DELETE /api/lists/:id`

Löscht die Liste; Bookmarks bleiben erhalten.

**Antwort** `200`

```json
{ "ok": true }
```

---

### Beispiel: Bookmark speichern (Extension / curl)

```bash
curl -s -X POST http://localhost:3777/api/bookmarks \
  -H 'Content-Type: application/json' \
  -d '{"url":"https://example.com","tags":["read-later"],"notes":"## Notiz"}'
```

```bash
curl -s 'http://localhost:3777/api/bookmarks?search=example&pageSize=25'
```

## Chrome Extension

Die Browser-Extension liegt in [`extension/`](extension/). Sie speichert Seiten per `POST /api/bookmarks` in deiner lokalen Instanz (Desktop oder Dev).

Kurzanleitung: [`extension/README.md`](extension/README.md) (Build, Side-Load, Server-URL `http://localhost:3777`).

In der Desktop-App: Menü **Hilfe → Browser-Erweiterung** oder Route `/extension`.

## Repository-Struktur

```
open-bookmark/          # Nuxt-App (Quellcode, API, SQLite)
extension/              # Chrome Extension (Manifest V3)
desktop/                # Electron-Shell für macOS
README.md               # Diese Datei
```

## Tests

```bash
cd open-bookmark && npm run test && npm run typecheck
cd extension && npm run test && npm run typecheck
cd desktop && npm run typecheck
```
