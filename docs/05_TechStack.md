# Tech-Stack

## Entschiedener Tech-Stack (Stand: 2026-06-24)

## 1. Betriebsform

### Entscheidung
**Lokale Web-App mit Build-Step** (kein Single-File-Prototyp)

### Begründung
- Klarheit & Wartbarkeit vor kurzfristiger Optimierung
- Modularer Aufbau ist langfristig robuster als ein monolithischer Single-File-Ansatz
- Kein Installer nötig, trotzdem saubere Build-/Deploy-Struktur

---

## 2. Frontend-Framework

### Entscheidung
**React**

### Begründung
- Passendes Komponentenmodell für Tree- und Sunburst-Visualisierung
- Große Community und stabile Ökosystem-Unterstützung
- Gute Integration mit D3 für kontrollierte, datengetriebene Visualisierung

---

## 3. Build-Tool

### Entscheidung
**Vite**

### Begründung
- Sehr schneller Dev-Server mit HMR
- TypeScript-Integration ohne hohen Konfigurationsaufwand
- Solider Production-Build (u.a. Tree-Shaking/Minification)

---

## 4. Sprache

### Entscheidung
**TypeScript**

### Begründung
- Typsicherheit für ein fachlich anspruchsvolles, baumbasiertes Datenmodell
- Früheres Finden von Fehlern (Compile-Time statt Laufzeit)
- Bessere Wartbarkeit und Refactor-Sicherheit bei wachsender Codebasis

---

## 5. Visualisierung

### Entscheidung
**D3.js** (insbesondere für Sunburst)

### Begründung
- Hohe Flexibilität für maßgeschneiderte Interaktions- und Darstellungslogik
- Gute Eignung für hierarchische Layouts (Tree/Sunburst)
- Bewährter Ansatz aus dem bisherigen Vorwissen/Prototyping-Kontext

---

## 6. State-Management (technisch stacknah)

### Entscheidung
**Zustand**

### Begründung
- Schlankes API-Design für klaren globalen App-State
- Selektor-basierte Zugriffe reduzieren unnötige Re-Renders
- Gute TypeScript-Unterstützung für sichere Store-Modelle

---

## 7. Warum nicht Alternativen? (Kurzbegründung)

- **JavaScript ohne TypeScript:** geringere Typsicherheit, höheres Fehlerrisiko bei komplexem Modell
- **Context API als Primärlösung:** kann bei häufigen State-Änderungen gröberes Re-Render-Verhalten erzeugen
- **Recharts statt D3:** weniger flexibel für stark angepasste Sunburst-/Hierarchie-Darstellungen
- **Single-File-Betriebsform:** schnell für Prototypen, aber schlechter für Wartbarkeit/Skalierung

---

## Status
✅ **Entschieden**  
📅 **Datum:** 2026-06-24  