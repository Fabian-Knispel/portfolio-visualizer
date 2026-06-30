# Datenmodell

✅ Konkretisierung (Stand: nach Tech-Stack-/Architektur-Entscheidungen)

Die Modellierung bleibt fachlich strikt zwischen SOLL und IST getrennt.
Die unten definierten Typen und Signaturen sind auf den beschlossenen Stack (React + TypeScript + Zustand + D3) ausgelegt.
1. Modellprinzipien
1.1 Knotenidentität

    Ein Knoten ist über seinen vollständigen Pfad eindeutig identifiziert.
    IDs sind stabil und dienen als Join-Basis zwischen SOLL und IST.

1.2 SOLL/IST-Trennung

    SOLL und IST werden getrennt erfasst und verarbeitet.
    Vergleichslogik entsteht erst in dedizierten Ableitungsfunktionen.

1.3 SOLL-Freeness als Diagnose

    Keine harte Eingabeblockade, keine automatische Korrektur.
    Freeness bewertet Strukturqualität (correct / free / overallocated) diagnostisch.
2. TypeScript-Datentypen (Vorschlag für Start)

export type NodePath = string; // z.B. "root/Equity/USA"

export interface PortfolioNodeBase {
  path: NodePath;
  label: string;
  children: PortfolioNodeBase[];
}

export interface SollNode extends PortfolioNodeBase {
  targetPct?: number; // lokale Zielannotation, optional
}

export interface IstNode extends PortfolioNodeBase {
  ownValue?: number;   // direkt zugeordneter Wert
}

export interface IstComputedNode extends IstNode {
  nodeValue: number;     // ownValue + Summe(children.nodeValue)
  pct: number;           // nodeValue / totalValue
  pctOfParent?: number;  // nodeValue / parent.nodeValue (nur Anzeige)

Begründung

    path als Primäridentität passt zur bereits definierten Fachregel.
    Optionale Felder (targetPct?, ownValue?) erlauben unvollständige Eingaben ohne künstliche Defaults.
    IstComputedNode trennt Rohdaten von berechneten Feldern (klarere Datenflüsse, bessere Testbarkeit).

    3. Status-Typen (final konsolidiert)
ts

export type FreenessStatus = 'correct' | 'free' | 'overallocated';

export type CompareStatus =
  | 'correct'
  | 'underweighted'
  | 'overweighted'
  | 'missing_in_ist';

Begründung

    Entspricht der finalen Bewertungsdarstellung aus docs/03_Bewertungsdarstellung.md.
    Vermeidet Synonym-Dopplungen wie extra_in_ist vs missing_in_soll im Implementierungskern.

4. Vergleichs- und Berechnungsobjekte
ts

export interface CompareResult {
  path: NodePath;
  sollTargetPct: number; // 0 falls nicht gesetzt/fehlend
  istPct: number;        // 0 falls nicht vorhanden
  deltaPctPoints: number; // istPct - sollTargetPct (in Prozentpunkten)
  status: CompareStatus;
}

export interface FreenessResult {
  path: NodePath;
  parentTargetPct: number;    // lokaler Parent-SOLL
  childrenTargetSumPct: number;
  status: FreenessStatus;
}

Begründung

    Explizite Result-Typen entkoppeln Fachlogik von UI-Komponenten.
    deltaPctPoints als dedizierter Wert reduziert Mehrdeutigkeiten in Tooltip/Legende.

5. Funktions-Signaturen (fachlogisch)
ts

export function computeIstNodeValues(root: IstNode): IstComputedNode;
export function computeIstPercentages(root: IstComputedNode): IstComputedNode;

export function computeFreenessStatus(node: SollNode): FreenessResult | null;
// null für Blätter (kein Freeness-Kontext)

export function computeCompareStatus(
  path: NodePath,
  sollTargetPct: number,
  istPct: number
): CompareResult;

Begründung

    Kleine, getrennte Funktionen sind einfacher testbar und besser mit Zustand-Selektoren kombinierbar.
    null bei Blättern bildet die UX-Regel („Freeness nur bei Knoten mit Kindern“) sauber ab.

6. State-Schnitt (Zustand-kompatibel, Vorschlag)
ts

export interface PortfolioState {
  sollRoot: SollNode | null;
  istRoot: IstNode | null;
  activeViewMode: 'soll' | 'ist' | 'vergleich';
}

Begründung

    activeViewMode ist gemäß UX-Spezifikation global synchronisiert (Tree + Sunburst).
    SOLL/IST als getrennte Root-States halten Domänengrenzen klar.

7. Offene Modellierungsdetails (für nächste Iteration)

    Rundungsregeln für Prozentdarstellung (UI vs intern)
    Verhalten bei totalValue = 0 (Edge Case)
    Behandlung von Negativwerten (falls durch Eingabe möglich)
    Konvention für technisch erzeugte Knoten (uncategorized) im Pfadraum

Status

✅ Konkretisiert (Startpunkt für Implementierung)