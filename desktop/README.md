# Open Bookmark Desktop (Electron)

Native macOS-Hülle für die Nuxt-/Nitro-App. Beim Start wird die Production-Runtime als **Child Process** auf `127.0.0.1:3777` gestartet; das Fenster lädt dieselbe URL.

## Entwicklung

```bash
# 1. Nuxt-Build (einmalig oder nach App-Änderungen)
cd ../open-bookmark && npm run build

# 2. Extension-Build (für Ordner „extension/dist“ in der UI)
cd ../extension && npm run build

# 3. Electron
cd ../desktop
npm install
npm run dev
```

## Production-Build

```bash
npm run build:runtime   # open-bookmark + extension + Node-Binary
npm run pack            # .app + .dmg unter release/
npm run pack:dir        # nur .app (schneller zum Testen)
```

## App-Icon

Quelle: [`../docs/favicon.png`](../docs/favicon.png). Erzeugen:

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
| Datenbank | `~/Library/Application Support/Open Bookmark/bookmarks.db` |
| Extension (Side-Load) | `../extension/dist` (Dev) bzw. `Resources/extension-dist` (Packaged) |
| Logs | `~/Library/Application Support/Open Bookmark/logs/runtime.log` |

## Release-Checkliste (intern)

1. `npm run build:runtime` — Nuxt, Extension, Node-Bundle aktuell
2. `npm run pack` oder `npm run pack:dir` — Artefakt unter `release/`
3. Smoke-Test auf sauberem Mac: App starten, Bookmark anlegen, Neustart, `/extension` öffnen
4. Extension Side-Load aus `extension/dist`, URL `http://localhost:3777`, Popup + Kontextmenü testen
5. Port-Konflikt: zweite Instanz / `npm run dev` → verständliche Fehlermeldung
6. Optional: Signierung + Notarisierung (`CSC_LINK`, `APPLE_ID`, `mac.notarize` in electron-builder)

## Signierung (optional)

Für Verteilung außerhalb des Teams: Apple Developer ID, `CSC_LINK` / `APPLE_ID` für `electron-builder` Notarisierung. Ohne Zertifikat: lokaler Test mit `pack:dir` und Gatekeeper-Ausnahme.

## Fehlerbehebung

- **Port 3777 belegt:** anderen Dev-Server oder zweite Instanz beenden.
- **Nitro-Build fehlt:** `cd open-bookmark && npm run build`.
- **Runtime-Log:** Application Support → Open Bookmark → `logs/runtime.log`.
