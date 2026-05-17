# Domain Docs

Wie Engineering-Skills die Domain-Dokumentation dieses Repos nutzen sollen.

## Vor dem Explore lesen

- **`CONTEXT.md`** im Repo-Root, oder
- **`CONTEXT-MAP.md`**, falls vorhanden — verweist auf Kontext-spezifische `CONTEXT.md`-Dateien.
- **`docs/adr/`** — relevante ADRs für den Bearbeitungsbereich. Bei Multi-Context zusätzlich `src/<context>/docs/adr/`.

Wenn eine Datei fehlt, **still fortfahren**; keine leeren Skeletons vor dem ersten echten Eintrag durch Skills erzeugen (`/grill-with-docs` füllt bei Bedarf).

## Layout

**Single-context** (dieses Repo):

```
/
├── CONTEXT.md
├── docs/adr/
└── open-bookmark/   ← Nuxt-App
```

## Vokabular

Ausgaben (Issues, Refactor-Vorschläge, Tests), die Domainbegriffe nennen, sollen **`CONTEXT.md`-Terme** verwenden — keine synonymen Umbenennungen, die das Glossar explizit vermeidet.

## ADR-Konflikte

Konflikt mit bestehendem ADR explizit benennen, nicht überspringen (_„Widerspricht ADR-xxxx — …"_).
