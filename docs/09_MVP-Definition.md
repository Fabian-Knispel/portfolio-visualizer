# MVP-Definition: Portfolio-Visualizer Release 1.0

## Zielbild
Manuelle Eingabe von SOLL- und IST-Portfolio als Hierarchie, dargestellt als
Sunburst-Diagramm und als Baumansicht. Anzeige des Anteils jedes Segments am
Gesamtportfolio und am Parent-Knoten, für SOLL und IST. Daten bleiben über
localStorage erhalten.

## Scope – Drin
- Manuelle Eingabe der Portfolio-Hierarchie (beliebige Tiefe)
- Getrennte Pflege von SOLL und IST
- Sunburst-Visualisierung für SOLL und IST (umschaltbar)
- Baumansicht für SOLL und IST (umschaltbar)
- Anzeige: Anteil am Gesamt + Anteil am Parent, pro Segment, beide Modi
- Speicherung via localStorage
- Start via `npm run dev`

## Scope – Draußen (verschoben)
- Datei-Import (CSV/JSON) – Datenmodell aber importfähig anlegen
- Mehrere Portfolios/Profile
- SOLL/IST-Abweichungsvergleich mit Delta-Anzeige
- Drag-and-Drop-Reordering
- JSON-Export als Sicherheitsnetz
- Vereinfachter App-Start (Skript/.exe)
- Backend, Login, Mehrgeräte-Sync

## Erfolgskriterien
Fachlich:
- Vollständige Hierarchie (≥3 Ebenen) für SOLL & IST eingebbar, ohne Absturz/Datenverlust
- Daten bleiben nach Reload erhalten
- Prozentwerte (Gesamt + Parent) rechnerisch korrekt, in Sunburst und Baumansicht konsistent

UX:
- Größenverhältnis eines Segments in <5 Sek. erkennbar (Sunburst und Baumansicht)
- SOLL/IST-Wechsel mit einem Klick
- Wechsel zwischen Sunburst und Baumansicht mit einem Klick
- Eingabe eines neuen Postens in <30 Sek.

## Arbeitspakete
1. Datenmodell finalisieren (importfähig)
2. localStorage-Anbindung
3. Manuelle Eingabe – Grundgerüst
4. Berechnungslogik: Anteile (Gesamt + Parent)
5. Sunburst-Rendering SOLL
6. Sunburst-Rendering IST + Umschalt-Mechanismus SOLL/IST
7. Baumansicht (SOLL + IST), nutzt dieselbe Berechnungslogik aus Paket 4
8. Umschalt-Mechanismus Sunburst ↔ Baumansicht
9. UI-Politur Basisfluss (Eingabe → Speichern → Anzeigen)
10. Manueller Test mit echten Portfolio-Daten

## Risiken & Gegenmaßnahmen
- Datenmodell zu eng → klare Schnittstellen-Struktur von Anfang an
- Zwei Visualisierungen verdoppeln Aufwand → beide nutzen dieselbe Berechnungslogik (Paket 4), nur die Darstellung unterscheidet sich
- Unübersichtliche Sunburst-Segmente → Tooltip statt In-Segment-Text, kein Vollausbau in 1.0
- Scope-Schleichen → diese Definition als Referenz, neue Ideen als "später"-Kandidat parken (siehe unten)
- Eingabe zu mühsam bei realer Größe → früh mit echten Daten testen (ab Paket 3)
- Kein Sicherheitsnetz bei Datenverlust (bewusst akzeptiertes Risiko für 1.0) → bei Bedarf manuell vor größeren Browser-Aufräumaktionen selbst Vorsicht walten lassen

## Später angedachte Features (bewusst nicht in 1.0)
- Datei-Import (CSV/JSON) für SOLL/IST-Eingabe
- SOLL/IST-Abweichungsvergleich mit Delta-Anzeige (z. B. farbliche Kennzeichnung von Über-/Unterallokation)
- JSON-Export als Sicherheitsnetz gegen Datenverlust
- Drag-and-Drop-Reordering im Sunburst
- Mehrere Portfolios/Profile (z. B. für verschiedene Depots oder Szenarien)
- Vereinfachter App-Start ohne Dev-Server (Skript/.exe)
- Mehrgeräte-Sync / Backend-Anbindung

## Ergänzende Festlegungen (verbindlich für 1.0)

- Release 1.0 enthält **keine** SOLL/IST-Abweichungsbewertung (kein Delta, keine Over/Under-Statuslogik).
- Prozentberechnung intern mit voller Präzision; Anzeige auf **2 Nachkommastellen**.
- Für Root-Knoten wird `Anteil am Parent` als **„—“** dargestellt.
- Edge Case `totalValue = 0`:
  - Keine Division durch 0
  - Prozentanzeigen in IST als **0,00 %** (alternativ „—“, falls bevorzugt – bitte einheitlich)
- Sunburst und Baumansicht verwenden dieselbe zentrale Berechnungslogik für Prozentwerte.