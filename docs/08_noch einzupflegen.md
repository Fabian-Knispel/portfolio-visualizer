Entscheidung über Architektur und TechStack:
    Entscheidung	        Status
    Betriebsform	     |   Lokale Web-App mit Build-Step
    Frontend-Framework	 |   React
    Build-Tool	         |   Vite
    Sprache	             |   TypeScript
    Visualisierung	     |   D3.js (für Sunburst)
    Architektur-Stil	 |   Feature-based
    State-Management	 |   Zustand (Software)

    1. Trifftes Technik-Stack
Entscheidung	Begründung
Betriebsform: Lokale Web-App mit Build-Step (kein Single-File)	Klarheit & Wartbarkeit vor Optimierung. Modularer Aufbau besser wartbar als Single-File-Prototyp. Kein Installer nötig, läuft lokal im Browser.
Frontend-Framework: React	Komponenten-Modellierung für Tree/Sunburst, große Community, State lokal oder global nutzbar, gute D3-Integration.
Build-Tool: Vite	Blitzschneller Dev-Server (instant Start + HMR), TypeScript nativ integriert, optimierter Production-Build (Tree-shaking, Minification), 80m+ Weekly NPM Downloads.
Sprache: TypeScript	De-facto-Standard in professioneller Frontend-Entwicklung (87% React-Entwickler nutzen TypeScript). Compile-time Safety, Autocomplete in IDE, bessere Wartbarkeit. +16% Wachstumsrate gegenüber Vorjahr.
Visualisierung: D3.js (für Sunburst)	Bewährt aus Vorgängerprojekt (Single-File-Prototyp), native Sunburst/Tree-Unterstützung, hohe Flexibilität (pixelscharfe Anpassung), keine Framework-Limitation.
2. Infrastruktur
Entscheidung	Begründung
Architektur-Stil: Feature-based (nach Fachbereichen)	SOLL/IST/Compare sind strikt getrennte Domänen. Feature-based hält fachliche Zusammenhänge enger → SOLL/IST/Compare jeweils in einem Verzeichnis. Besser skalierbar für wachsende Apps (React/Vite/TypeScript-Standard).
State-Management: Zustand (externes Paket)	3 große, oft änderende States (SOLL, IST, Compare). Zustand: Selektoren → nur re-render wenn benötigter Teil ändert (Performance gut), Typed mit TypeScript (Auto-Completed State/Actions/Selectors), Multiple Stores möglich (separate Stores für SOLL/IST/Compare), Minimal Boilerplate (kein Reducer + Context nötig).
3. Schlüsselentscheidungen – Warum nicht Alternativen?
Alternative	Warum nicht gewählt?
Layer-based (Schichten: /components, /hooks, /utils, /types)	SOLL/IST/Compare liegen auseinannder → Code verstreut in 4 Verzeichnisse. Weniger skalierbar für große Apps.
JavaScript (ohne TypeScript)	Keine Typ-Sicherheit (Fehler erst beim Start, nicht vorher), kein Autocomplete für Types, Wartbarkeit schlechter bei großen Projekten. TypeScript ist Industriestandard.
Context API (in React enthalten)	Performance-Probleme: Wenn sich State ändert, re-rendert alle Components, die Context nutzen → bei Portfolio-State kritisch. Kein Selektor (kann nicht gezielt nur Teil lesen).
Recharts (React-Native D3-Alternative)	Kein native Sunburst, nur einfache Tree-Maps, weniger Flexibilität (Vordefinierte Chart-Types), bewährt aus Vorgängerprojekt ist D3.
4. Nächste Schritte (Phase 3 fortsetzen)

    MVP-Definition Release 1.0: Welches Minimum macht noch sinnvoll nutzbar? (Anzeige-only vs. Anzeige+Eingabe vs. Anzeige+Eingabe+Drag&Drop)

    Phase 4: Konkrete Dependency-Versionen (Node.js 24.x LTS, React 19, Vite 5, TypeScript 5, Zustand 4, D3 7)

    Phase 5: TypeScript Interfaces für Node, Tree, SOLL/IST, Status

5. Wissensstand Master LLM

    Technik-Stack komplett fest: React + Vite + TypeScript + D3 + Zustand

    Architektur fest: Feature-based (/features/soll, /features/ist, /features/compare)

    State-Management fest: Zustand (separate Stores für SOLL/IST/Compare)

    Nächste Entscheidung: MVP-Boundary für Release 1.0

    Priorität: Klarheit & Wartbarkeit vor Optimierung

    Arbeitsweise: Entscheidung für Entscheidung, mit expliziter Bestätigung vor dem nächsten Schritt