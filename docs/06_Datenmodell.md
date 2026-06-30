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
}

export interface IstNode extends PortfolioNodeBase<IstNode> {
  ownValue?: number;
}

export interface IstComputedNode extends PortfolioNodeBase<IstComputedNode> {
  ownValue?: number;
  nodeValue: number;
  pctTotal: number;
  pctOfParent?: number;
}
```

### 2.1 Konventionen

- `root` ist der feste technische Root-Pfad.
- `uncategorized` ist der technische IST-Knoten für nicht zuordenbare Werte.
- `targetPct?` und `ownValue?` sind absichtlich optional, damit unvollständige Eingaben importierbar bleiben.
- `pctTotal` und `pctOfParent` sind berechnete Felder, keine Eingabefelder.

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

export function computeFreenessStatus(node: SollNode): FreenessResult | null;

export function computeCompareStatus(
  path: NodePath,
  sollTargetPct: number,
  istPct: number
): CompareResult;
```

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

## Status

✅ Konkretisiert und mit Implementierung abgeglichen