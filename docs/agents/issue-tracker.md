# Issue tracker: Local Markdown

Issues und PRDs liegen als Markdown unter `.scratch/` (ohne externes Git-Hosting oder Remote siehe `setup-matt-pocock-skills`).

## Conventions

- Ein Feature pro Verzeichnis: `.scratch/<feature-slug>/`
- PRD: `.scratch/<feature-slug>/PRD.md`
- Umsetzungs-Issues: `.scratch/<feature-slug>/issues/<NN>-<slug>.md`, nummeriert ab `01`
- Triage-Status als `Status:`-Zeile nahe dem Dateikopf (Rollenstrings siehe `triage-labels.md`)
- Verlauf unter `## Comments` am Dateiende ergänzen

## Wenn eine Skill sagt „publish to the issue tracker“

Neue Datei unter `.scratch/<feature-slug>/` anlegen (Verzeichnis bei Bedarf anlegen).

## Wenn eine Skill sagt „fetch the relevant ticket“

Die referenzierte Datei einlesen; üblicherweise übergibt der Nutzer Pfad oder Nummer direkt.

## Wechsel auf GitHub/GitLab

Diese Datei durch die Vorlage aus `setup-matt-pocock-skills` (`issue-tracker-github.md` bzw. `issue-tracker-gitlab.md`) ersetzen und die Sektion **Agent skills** in `CLAUDE.md`/`AGENTS.md` anpassen.
