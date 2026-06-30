Arbeitsgrundlage: Lies und befolge zuerst die AI‑Anweisungen im Projekt: docs/AI-Instructions/Copilot-Instruction.md und docs/AI-Instructions/Issue-Workflow.prompt.md.
Issue‑Vorgehen: Für jedes Issue: 1) kurz zusammenfassen, 2) gezielte Rückfragen stellen, 3) Mini‑Plan (≤3 Schritte) erstellen, 4) auf Freigabe warten, 5) kleinste sichere Änderung umsetzen.
Code‑Style & Architektur: Feature‑nahe Platzierung der Domain‑Typen; halte dich an bestehende Patterns und die MVP-/Architektur‑Docs (docs/04_Architektur.md, docs/09_MVP-Definition.md).
Datenmodell: Zentrale Implementierung unter src/features/portfolio/domain/portfolio-model.ts und normative Beschreibung in docs/06_Datenmodell.md. Entscheidungen dokumentieren in docs/07_Entscheidungsprotokoll.md.
Änderungen: Mache nur kleine, sichere Änderungen; stage und committe inkrementell; Commit‑Nachrichten auf Deutsch und aussagekräftig (kurzer Satz).
Git‑Workflow:
Prüfen: git status → Diff anschauen → gezielt git add <files> → committen.
Beispiel-Commit-Message (DE):
Dokumentation und Modell: Root‑Pfad 'root' festgelegt, Typen synchronisiert, Beispielhierarchie ergänzt
Push nur auf ausdrückliche Anweisung: git push origin main
Dokumentation: Nach Änderungen die normative Doku aktualisieren und eine kurze Notiz im Entscheidungsprotokoll ergänzen (Datum + kurze Begründung).
Persistente Notizen: Wichtige Konventionen/Entscheidungen speichere ich in repo‑Memory (/memories/repo/) — so sind sie beim nächsten Start verfügbar.
Kommunikation: Immer knapp, präzise und mit expliziten Rückfragen, bevor Code geschrieben wird. Wenn mehrere Lösungen möglich sind, kurz Optionen (2–3) nennen und um Präferenz bitten.

Ich möchte mit dir an diesem Issue arbeiten:
[hier Issue Text einfügen]