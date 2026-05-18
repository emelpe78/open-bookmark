# Open Bookmark Desktop (Electron)

Native macOS-Hülle für die Nuxt-/Nitro-App. Beim Start wird die Production-Runtime als **Child Process** auf `127.0.0.1:3777` gestartet; das Fenster lädt dieselbe URL.

## Entwicklung

```bash
# 1. Nuxt-Build (einmalig oder nach App-Änderungen)
cd ../open-bookmark && npm run build

# 2. Extension-Build (für Ordner „extension/dist“ in der UI)
cd ../extension && npm run build

# 3. Electron (startet „Open Bookmark.app“, nicht „Electron“ im Dock)
cd ../desktop
npm install
npm run dev
```

`npm run dev` legt bei Bedarf `node_modules/electron/dist/Open Bookmark.app` an und startet diese Kopie — so heißt die App im Dock **Open Bookmark**. Nicht `electron .` manuell aufrufen.

## Production-Build

```bash
npm run build:runtime   # open-bookmark + extension + Node-Binary
npm run pack            # .app (dir) → ad-hoc sign → .dmg unter release/
npm run pack:dir        # nur .app (schneller zum Testen)
```

## App-Icon

Quelle: lokal [`../docs/favicon.png`](../docs/favicon.png) (gitignored) oder die committed `resources/icon.png`. Erzeugen:

```bash
npm run icons   # → resources/icon.png, resources/icon.icns
```

`pack` / `build:runtime` führen das automatisch aus.

**Hinweis:** Das native macOS-„Über“-Fenster ignoriert in der Electron-Entwicklung Custom-Icons. Open Bookmark nutzt stattdessen ein **eigenes, zentriertes About-Fenster** (`resources/about.html` + `icon.png`). Das Dock-Icon wird aus `resources/icon.png` per `dock.setIcon()` gesetzt. Menü: **Open Bookmark → Über Open Bookmark**.

## Name & Version

- Anzeigename in der macOS-Menüleiste: **Open Bookmark**
- Version für Releases und About-Dialog: Feld `version` in [`package.json`](package.json) (wird von electron-builder in die `.app` übernommen)
- Nach `npm install` im Ordner `desktop/` wird für lokale Entwicklung die Electron-`Info.plist` auf macOS angepasst (`postinstall`)

## Architektur

| Komponente | Pfad / Verhalten |
|------------|------------------|
| Main | `src/main.ts` — Fenster, IPC, Lifecycle |
| Preload | `src/preload.ts` — `window.openBookmarkDesktop` |
| Runtime | `../open-bookmark/.output/server/index.mjs` |
| Datenbank (Standard) | `~/Library/Application Support/Open Bookmark/bookmarks.db` |
| Datenbank (optional) | Anderer Pfad über Einstellungen → Allgemein → Datenbank; gespeichert in `preferences.json` im App-Datenordner |
| Extension (Side-Load) | `../extension/dist` (Dev) bzw. `Resources/extension-dist` (Packaged) |
| Logs | `~/Library/Application Support/Open Bookmark/logs/runtime.log` |

## Release-Checkliste (intern)

1. `npm run build:runtime` — Nuxt, Extension, Node-Bundle aktuell
2. `npm run pack` oder `npm run pack:dir` — Artefakt unter `release/`
3. Smoke-Test auf sauberem Mac: App starten, Bookmark anlegen, Neustart, `/extension` öffnen
4. Extension Side-Load aus `extension/dist`, URL `http://localhost:3777`, Popup + Kontextmenü testen
5. Port-Konflikt: zweite Instanz / `npm run dev` → verständliche Fehlermeldung
6. Optional: Signierung + Notarisierung (`CSC_LINK`, `APPLE_ID`, `mac.notarize` in electron-builder)

## Release-Builds (Developer)

Version **1.0.0** und folgende Releases werden als **Developer Builds** verteilt (`npm run pack` = ad-hoc signiertes DMG). Nach dem Browser-Download kann macOS fälschlich „ist beschädigt“ anzeigen — dann `xattr -cr "/Applications/Open Bookmark.app"` oder Rechtsklick → **Öffnen** (siehe [README.md](../README.md#open-bookmark-desktop-macos)).

Code-Signing und Notarisierung (Apple Developer ID, `CSC_LINK`, `APPLE_ID`) sind bewusst **nach 1.0.0** geplant — siehe [CHANGELOG.md](../CHANGELOG.md).

## Signierung (geplant)

Für breitere Verteilung: Apple Developer ID und `electron-builder`-Notarisierung konfigurieren. Bis dahin: `pack:dir` / Release-DMG mit Gatekeeper-Ausnahme.

## Datenbank & Backup

- **Eine produktive Datenbank:** Die Desktop-App nutzt ausschließlich `~/Library/Application Support/Open Bookmark/bookmarks.db` (oder einen per Einstellungen gewählten Pfad in `preferences.json`). `npm run dev` im Ordner `open-bookmark/` verwendet **immer** `./data/bookmarks.db` — getrennt von der Desktop-DB.
- **Nicht gleichzeitig:** `npm run dev` und die Desktop-App dürfen Port 3777 nicht teilen. Läuft der Dev-Server, schlägt der Desktop-Start mit einer klaren Meldung fehl.
- **Speicherort ändern:** Nur in der Desktop-App (Einstellungen → Allgemein → „Pfad ändern“). Ordnerdialog, Kopie inkl. WAL/SHM, Nitro-Neustart, Pfad in `preferences.json`.
- **Backup:** SQL-Datei über `GET /api/database/backup`.
- **SQL-Import:** Ersetzt die gesamte Datenbank (Einstellungen oder `POST /api/database/import`).
- **HTML-Import:** Chrome-`bookmarks.html` unter Einstellungen → Datenbank (fügt URLs hinzu, `POST /api/bookmarks/import-html`).
- **Rollback:** `preferences.json` im App-Datenordner anpassen oder löschen.

## Fehlerbehebung

- **Port 3777 belegt:** `npm run dev` in `open-bookmark/` beenden, dann Desktop neu starten (Dev und Desktop teilen sich nicht dieselbe DB).
- **Nitro-Build fehlt:** `cd open-bookmark && npm run build`.
- **Runtime-Log:** Application Support → Open Bookmark → `logs/runtime.log`.
