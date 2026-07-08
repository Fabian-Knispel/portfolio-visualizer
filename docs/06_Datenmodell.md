# Datenmodell

✅ Konkretisiert (Stand: 2026-06-30)

Das zentrale Modell liegt feature-nah unter [src/features/portfolio/domain/portfolio-model.ts](../src/features/portfolio/domain/portfolio-model.ts).
Es bildet SOLL und IST strikt getrennt ab, verwendet einen festen Root-Pfad `root` und hält berechnete Felder explizit von Rohdaten getrennt.

## 1. Modellprinzipien

### 1.1 Knotenidentität

Ein Knoten ist über seinen vollständigen Pfad eindeutig identifiziert.
Der Pfad ist stabil und dient als Join-Basis zwischen SOLL und IST.

### 1.2 SOLL/IST-Trennung

SOLL und IST werden getrennt erfasst und verarbeitet.
Vergleichslogik entsteht erst in dedizierten Ableitungsfunktionen.

### 1.3 SOLL-Freeness als Diagnose

Keine harte Eingabeblockade, keine automatische Korrektur.
Freeness bewertet Strukturqualität (`correct` / `free` / `overallocated`) diagnostisch.

## 2. Zentrale Typen

```ts
export type NodePath = string;

export const ROOT_NODE_PATH = 'root' as const;
export const UNCATEGORIZED_NODE_LABEL = 'uncategorized' as const;
export const UNCATEGORIZED_NODE_PATH = `${ROOT_NODE_PATH}/${UNCATEGORIZED_NODE_LABEL}` as const;

export interface PortfolioNodeBase<TChild> {
  path: NodePath;
  label: string;
  children: TChild[];
}

export interface SollNode extends PortfolioNodeBase<SollNode> {
  targetPct?: number;
  targetPctOfParent?: number;
  lastEditedTargetField?: 'targetPct' | 'targetPctOfParent';
}

export interface IstNode extends PortfolioNodeBase<IstNode> {
  ownValue?: number;
}

export interface IstComputedNode extends PortfolioNodeBase<IstComputedNode> {
  ownValue?: number;
  directValue: number;
  nodeValue: number;
  pctTotal: number;
  pctOfParent?: number;
}
```

### 2.1 Konventionen

- `root` ist der feste technische Root-Pfad.
- `uncategorized` ist der technische IST-Knoten für nicht zuordenbare Werte.
- `targetPct?` und `ownValue?` sind absichtlich optional, damit unvollständige Eingaben importierbar bleiben.
- Im IST wird `ownValue` als eingegebener Gesamtwert eines Knotens interpretiert (inklusive Kinder).
- Der direkt gehaltene IST-Anteil wird berechnet: `directValue = max(ownValue - Summe(child.nodeValue), 0)`.
- Der berechnete Knotenwert bleibt konsistent zu den Kindern: `nodeValue = max(ownValue, Summe(child.nodeValue))`.
- `targetPctOfParent?` ist das primäre SOLL-Eingabefeld für Nicht-Root-Knoten.
- `targetPct?` bleibt als rückwärtskompatibles, absolutes Fallback erhalten.
- `lastEditedTargetField?` steuert, welches SOLL-Feld als Autoritaet fuer die Ableitung genutzt wird.
- Der SOLL-Editor erlaubt die Eingabe je Nicht-Root-Knoten in zwei Modi: `% vom Parent` oder `% gesamt (absolut)`.
- Der Root-Knoten speichert keinen `targetPctOfParent` und wird nur in der UI als fix `100 %` dargestellt.
- `pctTotal` und `pctOfParent` sind berechnete Felder, keine Eingabefelder.
- Prozentwerte werden intern mit voller Präzision berechnet und in der UI mit 2 Nachkommastellen angezeigt.
- Für den Root-Knoten wird `pctOfParent` als `—` dargestellt.
- Für den SOLL-Root gilt fachlich immer 100% Gesamtanteil; `targetPctOfParent` wird dort nicht als Eingabe genutzt.
- Bei `totalValue = 0` entsteht kein Division-durch-0-Fall; `pctTotal` bleibt `0` und die Anzeige ist `0,00 %`.
- Sunburst und Baumansicht nutzen dieselbe zentrale Berechnungslogik für Prozentwerte.
- Die Sunburst-Ansicht kann SOLL und IST über denselben Umschaltpfad darstellen; die Transformationsschicht bleibt getrennt vom Rendering.
- Die Sunburst-Ansicht nutzt eine feature-nahe Transformationsschicht, die SOLL-Daten in ein reines Layout-Datum überführt; dieselbe Schicht kann später für IST wiederverwendet werden.
- Hover in der Sunburst zeigt nur Label und Prozentwerte, ohne Schreiboperationen oder Selektion auszulösen.

## 3. Status- und Result-Typen

```ts
export type FreenessStatus = 'correct' | 'free' | 'overallocated';

export type CompareStatus = 'correct' | 'underweighted' | 'overweighted' | 'missing_in_ist';

export interface CompareResult {
  path: NodePath;
  sollTargetPct: number;
  istPct: number;
  deltaPctPoints: number;
  status: CompareStatus;
}

export interface FreenessResult {
  path: NodePath;
  parentTargetPct: number;
  childrenTargetSumPct: number;
  status: FreenessStatus;
}
```

## 4. Funktions-Signaturen

```ts
export function buildNodePath(...segments: string[]): NodePath;
export function isRootNodePath(path: NodePath): boolean;

export function computeIstNodeValues(root: IstNode): IstComputedNode;
export function computeIstPercentages(root: IstComputedNode): IstComputedNode;
export function computeSollPercentages(root: SollNode): SollComputedNode;

export function computeFreenessStatus(node: SollNode): FreenessResult | null;

export function computeCompareStatus(
  path: NodePath,
  sollTargetPct: number,
  istPct: number
): CompareResult;

export function moveNodeInTree<TNode extends PortfolioNodeBase<TNode>>(
  root: TNode,
  path: NodePath,
  newParentPath: NodePath
): TNode;
```

### 4.1 SOLL-Ableitungsregel (Parent -> Absolut)

- Für Nicht-Root-Knoten gilt: `absoluteTarget = parentAbsoluteTarget * targetPctOfParent / 100`.
- Root hat immer `absoluteTarget = 100`.
- Falls `targetPctOfParent` fehlt, wird `targetPct` (falls vorhanden) als Legacy-Fallback verwendet.

## 5. Beispieldaten

Die Datei [src/features/portfolio/domain/portfolio-model.ts](../src/features/portfolio/domain/portfolio-model.ts) enthält eine Beispielhierarchie für SOLL und IST mit mindestens 3 Ebenen.

Beispielpfade:

- `root`
- `root/Equity`
- `root/Equity/USA`
- `root/Equity/USA/Large Cap`
- `root/Bonds/Government/Short Duration`

## 6. Selbsttest

Beim Selbsttest wird die Beispielhierarchie auf drei Punkte geprüft:

1. Alle Beispielknoten haben einen vollständigen Pfad ab `root`.
2. Die IST-Hierarchie kann mit `computeIstNodeValues` und `computeIstPercentages` berechnet werden.
3. Die SOLL-Hierarchie liefert für interne Knoten einen Freeness-Status und für Blätter `null`.

## 7. Offene Modellierungsdetails

- Rundungsregeln für Prozentdarstellung in der UI.
- Verhalten bei `totalValue = 0`.
- Behandlung von Negativwerten, falls Eingaben sie zulassen.

## 8. Persistenz

Die fachliche Persistenz speichert ausschließlich die beiden Wurzeln `sollRoot` und `istRoot`.
UI-Zustand wird nicht gespeichert, sondern beim Laden aus den fachlichen Daten neu abgeleitet.

### 8.1 Laden

- Fehlende oder leere Storage-Einträge führen zu einem leeren Initialzustand.
- Ungültige oder kaputte Storage-Einträge werden ignoriert und ebenfalls auf den Initialzustand zurückgeführt.
- Das Laden darf nie einen Crash auslösen.

### 8.2 Speichern

- Jede fachliche Änderung wird unmittelbar nach der Änderung persistiert.
- Speichern betrifft nur SOLL und IST, nicht die UI.
- Schlägt das Speichern fehl, wird ein Fehlertext an die aufrufende Schicht zurückgegeben und kann dort angezeigt werden.

### 8.3 Store-Verhalten

- Der Portfolio-Store lädt beim Erzeugen oder Importieren seinen Initialzustand aus der Persistenz.
- Fachliche Mutationen (`SOLL` und `IST`) wie Hinzufügen, Entfernen oder Aktualisieren lösen unmittelbar einen erneuten Speicherlauf aus.
- Eine abgeleitete UI-Schicht darf nur auf den Store reagieren; sie speichert selbst keine eigenen Kopien der fachlichen Daten.
- Pfadbasierte Tree-Operationen dürfen nur auf `sollRoot` bzw. `istRoot` angewendet werden und müssen die Hierarchie strukturell unverändert lassen, außer an der explizit adressierten Stelle.
- Pfadbasierte Tree-Operationen umfassen `add`, `update`, `move` und `remove`; beim `move` bleibt die Knotenidentität erhalten, der Parent-Wechsel wird nur strukturell abgebildet.
- Der technische Root-Knoten ist fest und nicht löschbar; seine Beschriftung darf geändert werden.

## Status

✅ Konkretisiert und mit Implementierung abgeglichen