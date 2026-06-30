# Architektur

## ✅ Architekturentscheidungen (Stand: 2026-06-24)

## 1. Architektur-Stil

### Entscheidung
**Feature-based Architektur**

### Begründung
- Fachliche Domänen (`SOLL`, `IST`, `Vergleich`) sind klar getrennt und sollen strukturell zusammenhängend implementiert werden.
- Feature-based hält fachliche Logik, UI und Hilfsfunktionen näher beieinander.
- Unterstützt Wartbarkeit und Erweiterbarkeit besser als ein rein layer-basiertes Schema bei wachsender Komplexität.

### Konsequenz für die Struktur (Zielbild)
- Features nach Fachlichkeit schneiden (z. B. `features/soll`, `features/ist`, `features/vergleich`)
- Gemeinsame, wirklich generische Bausteine separat halten (z. B. `shared/`)

---

## 2. Betriebsform / Laufzeitmodell

### Entscheidung
**Lokale Web-App mit Build-Step**

### Begründung
- Kein Installer nötig, lokal ausführbar im Browser.
- Build-Step ermöglicht modulare Struktur, bessere Trennung von Verantwortlichkeiten und sauberen Produktions-Build.
- Priorität liegt auf Klarheit und Wartbarkeit statt „Alles in einer Datei“.

---

## 3. State-Management-Strategie

### Entscheidung
**Globaler App-State mit Zustand (selektorbasiert)**

### Begründung
- Drei zentrale, fachlich relevante State-Bereiche (`SOLL`, `IST`, `Vergleich`) profitieren von zentraler, klar typisierter Verwaltung.
- Selektoren helfen, unnötige Re-Renders zu vermeiden.
- Gute Passung zu TypeScript und zu abgeleiteten Berechnungen (z. B. Status-/Vergleichslogik).

### Architekturelle Leitlinie
- Rohdaten (Eingabezustand) und abgeleitete Daten (Berechnungen/Status) klar trennen.
- Berechnungslogik in reine Funktionen auslagern, nicht in UI-Komponenten mischen.

---

## 4. Visualisierungsarchitektur

### Entscheidung
**D3.js für hierarchische Visualisierungen (insb. Sunburst), eingebettet in React-Komponenten**

### Begründung
- Hohe Flexibilität für hierarchische Darstellungen und Interaktionsdetails.
- Gute Kontrolle über Rendering-Details bei Tree/Sunburst.
- Kompatibel mit dem gewählten React-Komponentenmodell.

### Leitlinie
- React steuert Datenfluss, View-Modus und Lifecycle.
- D3 übernimmt Layout-/Zeichenlogik für die Visualisierungsebene.

---

## 5. Abgrenzung zu Alternativen (kurz)

- **Layer-based als Primärstruktur:** kann fachlich zusammengehörigen Code über viele Ordner verteilen.
- **Context API als primäre State-Lösung:** bei häufigen Updates potenziell gröbere Re-Render-Auswirkungen.
- **Single-File-Ansatz:** schnell für Prototyping, aber schwächer bei Wartbarkeit und Skalierung.

---

## 6. Architekturelle Prinzipien für die Umsetzung

1. **Single Source of Truth pro Domäne** (`SOLL`, `IST`, `Vergleich`)
2. **Deterministische Berechnungen** (pure Functions für Aggregation/Status)
3. **View-Modus als global synchronisierter Zustand** (`soll` / `ist` / `vergleich`)
4. **Trennung von fachlicher Logik und Darstellung**
5. **Diagnostik statt Autokorrektur** im SOLL-Freeness-Kontext

---

## Status
✅ **Entschieden**  
📅 **Datum:** 2026-06-24