import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, JSX } from 'react';

import {
  ROOT_NODE_PATH,
  exampleIstHierarchy,
  exampleSollHierarchy,
  type IstComputedNode,
  type IstNode,
  type NodePath,
  type PortfolioNodeBase,
  type SollNode,
  buildCompareRows,
  buildNodePath,
  computeCompareStatus,
  computeFreenessStatus,
  computeIstNodeValues,
  computeIstPercentages,
  computeSollPercentages,
  formatPercentageValue,
  isRootNodePath,
} from '../domain/portfolio-model';
import { portfolioStore, type PortfolioStoreSnapshot, usePortfolioStoreSnapshot } from '../state/portfolio-store';
import { PortfolioSunburst } from './portfolio-sunburst';
import { buildSunburstDatumForMode, type SunburstMode } from './sunburst-model';

export type ViewMode = 'soll' | 'ist' | 'vergleich';
type SollValueInputMode = 'parent' | 'absolute';

interface PortfolioWorkspaceProps {
  activeViewMode: ViewMode;
  onActiveViewModeChange(mode: ViewMode): void;
}

interface EditorDraft {
  label: string;
  numericValue: string;
  parentPath: NodePath;
  childLabel: string;
  childNumericValue: string;
}

interface TreeNodeEntry {
  path: NodePath;
  label: string;
  depth: number;
  childrenCount: number;
}

type TreeStatus =
  | 'correct'
  | 'free'
  | 'overallocated'
  | 'underweighted'
  | 'overweighted'
  | 'missing_in_ist'
  | 'extra_in_ist';

interface TreePresentation {
  status?: TreeStatus;
  primaryValue: string;
  secondaryValue?: string;
  direction: 'up' | 'down' | 'flat';
  showBadge: boolean;
}

interface NumericValidationResult {
  parsedValue: number | undefined;
  error: string | null;
}

function createSollRoot(): SollNode {
  return exampleSollHierarchy;
}

function createIstRoot(): IstNode {
  return exampleIstHierarchy;
}

function findNodeByPath<TNode extends PortfolioNodeBase<TNode>>(root: TNode | null, path: NodePath): TNode | null {
  if (root === null) {
    return null;
  }

  if (root.path === path) {
    return root;
  }

  for (const child of root.children) {
    const match = findNodeByPath(child, path);

    if (match !== null) {
      return match;
    }
  }

  return null;
}

function collectTreeEntries<TNode extends PortfolioNodeBase<TNode>>(root: TNode | null, depth = 0): TreeNodeEntry[] {
  if (root === null) {
    return [];
  }

  return [
    {
      path: root.path,
      label: root.label,
      depth,
      childrenCount: root.children.length,
    },
    ...root.children.flatMap((child) => collectTreeEntries(child, depth + 1)),
  ];
}

function getParentPath(path: NodePath): NodePath {
  if (isRootNodePath(path)) {
    return ROOT_NODE_PATH;
  }

  const segments = path.split('/');

  if (segments.length <= 2) {
    return ROOT_NODE_PATH;
  }

  return segments.slice(0, -1).join('/');
}

function buildChildPath(parentPath: NodePath, childLabel: string): NodePath {
  const trimmedLabel = childLabel.trim();

  if (isRootNodePath(parentPath)) {
    return buildNodePath(trimmedLabel);
  }

  const tail = trimmedLabel.length > 0 ? trimmedLabel : 'Neuer Knoten';

  return `${parentPath}/${tail}`;
}

function getPathTail(path: NodePath): string {
  const segments = path.split('/');
  return segments[segments.length - 1] ?? path;
}

function buildMovedNodePath(newParentPath: NodePath, oldNodePath: NodePath): NodePath {
  const nodeTail = getPathTail(oldNodePath);

  return isRootNodePath(newParentPath) ? buildNodePath(nodeTail) : `${newParentPath}/${nodeTail}`;
}

function createUniqueChildPath(parentPath: NodePath, childLabel: string, siblingPaths: string[]): NodePath {
  const baseLabel = childLabel.trim().length > 0 ? childLabel.trim() : 'Neuer Knoten';
  let candidateLabel = baseLabel;
  let candidatePath = buildChildPath(parentPath, candidateLabel);
  let index = 2;

  while (siblingPaths.includes(candidatePath)) {
    candidateLabel = `${baseLabel} ${index}`;
    candidatePath = buildChildPath(parentPath, candidateLabel);
    index += 1;
  }

  return candidatePath;
}

function isInsideSubtree(candidatePath: NodePath, subtreePath: NodePath): boolean {
  return candidatePath === subtreePath || candidatePath.startsWith(`${subtreePath}/`);
}

function parseOptionalNumber(value: string): number | undefined {
  const trimmedValue = value.trim();

  if (trimmedValue.length === 0) {
    return undefined;
  }

  const parsedValue = Number(trimmedValue);

  return Number.isFinite(parsedValue) ? parsedValue : undefined;
}

function validateNumericInput(value: string, mode: 'soll' | 'ist', fieldLabel: string): NumericValidationResult {
  const parsedValue = parseOptionalNumber(value);

  if (value.trim().length === 0) {
    return {
      parsedValue: undefined,
      error: null,
    };
  }

  if (parsedValue === undefined) {
    return {
      parsedValue: undefined,
      error: `${fieldLabel}: Bitte eine gueltige Zahl eingeben.`,
    };
  }

  if (mode === 'soll' && (parsedValue < 0 || parsedValue > 100)) {
    return {
      parsedValue,
      error: `${fieldLabel}: Prozentwerte muessen zwischen 0 und 100 liegen.`,
    };
  }

  if (mode === 'ist' && parsedValue < 0) {
    return {
      parsedValue,
      error: `${fieldLabel}: Werte duerfen nicht negativ sein.`,
    };
  }

  return {
    parsedValue,
    error: null,
  };
}

function formatNumber(value: number | undefined): string {
  return value === undefined ? '' : String(value);
}

function formatRelativePath(path: NodePath): string {
  return path === ROOT_NODE_PATH ? 'root' : path.replace(/^root\//, '');
}

function trimTrailingZeros(numStr: string): string {
  return numStr.replace(/(\.[0-9]*?)0+$/, '$1').replace(/\.$/, '');
}

function formatStoredPercent(value: number | undefined): string {
  return value === undefined ? '—' : `${trimTrailingZeros(value.toFixed(2))} %`;
}

function formatRatioPercent(value: number | undefined): string {
  return value === undefined ? '—' : `${trimTrailingZeros((value * 100).toFixed(2))} %`;
}

function getNumericInputError(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;
  return Number.isFinite(Number(trimmed)) ? null : 'Ungültige Zahl';
}

function formatCompareStatus(status: string): string {
  const labels: Record<string, string> = {
    correct: '✓ Korrekt',
    underweighted: '↓ Untergewichtet',
    overweighted: '↑ Übergewichtet',
    missing_in_ist: '— Fehlt im IST',
    extra_in_ist: '— Extra im IST',
  };
  return labels[status] ?? status;
}

function ViewModeTab({
  mode,
  activeMode,
  onChange,
  label,
}: {
  mode: ViewMode;
  activeMode: ViewMode;
  onChange(mode: ViewMode): void;
  label: string;
}) {
  return (
    <button
      className={`mode-tab ${mode === activeMode ? 'mode-tab--active' : ''}`}
      onClick={() => onChange(mode)}
      type="button"
    >
      {label}
    </button>
  );
}

export function PortfolioWorkspace({
  activeViewMode,
  onActiveViewModeChange,
}: PortfolioWorkspaceProps) {
  const snapshot = usePortfolioStoreSnapshot();
  const childInputRef = useRef<HTMLInputElement | null>(null);
  const [sunburstMode, setSunburstMode] = useState<SunburstMode>('soll');
  const [collapsedTreeNodes, setCollapsedTreeNodes] = useState<Record<NodePath, boolean>>({});
  const [selectedPaths, setSelectedPaths] = useState<Record<ViewMode, NodePath>>({
    soll: ROOT_NODE_PATH,
    ist: ROOT_NODE_PATH,
    vergleich: ROOT_NODE_PATH,
  });
  const [sollValueInputMode, setSollValueInputMode] = useState<SollValueInputMode>('parent');
  const [draft, setDraft] = useState<EditorDraft>({
    label: '',
    numericValue: '',
    parentPath: ROOT_NODE_PATH,
    childLabel: '',
    childNumericValue: '',
  });
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    if (snapshot.sollRoot === null) {
      portfolioStore.setSollRoot(createSollRoot());
    }

    if (snapshot.istRoot === null) {
      portfolioStore.setIstRoot(createIstRoot());
    }
  }, [snapshot.istRoot, snapshot.sollRoot]);

  useEffect(() => {
    if (activeViewMode === 'soll' || activeViewMode === 'ist') {
      setSunburstMode(activeViewMode);
    }
  }, [activeViewMode]);

  const currentRoot = activeViewMode === 'soll' ? snapshot.sollRoot : activeViewMode === 'ist' ? snapshot.istRoot : snapshot.sollRoot;
  const selectedPath = selectedPaths[activeViewMode];
  const selectedNode = findNodeByPath(currentRoot, selectedPath);
  const parentPath = selectedNode === null ? ROOT_NODE_PATH : getParentPath(selectedNode.path);
  const istComputedRoot = useMemo(
    () => (snapshot.istRoot === null ? null : computeIstPercentages(computeIstNodeValues(snapshot.istRoot))),
    [snapshot.istRoot]
  );
  const sollComputedRoot = useMemo(
    () => (snapshot.sollRoot === null ? null : computeSollPercentages(snapshot.sollRoot)),
    [snapshot.sollRoot]
  );

  const sunburstRoot = useMemo(
    () => buildSunburstDatumForMode(sunburstMode, snapshot.sollRoot, istComputedRoot),
    [istComputedRoot, snapshot.sollRoot, sunburstMode]
  );

  const compareRows = useMemo(
    () => buildCompareRows(snapshot.sollRoot, istComputedRoot),
    [istComputedRoot, snapshot.sollRoot]
  );

  const currentEntries = useMemo(() => collectTreeEntries(currentRoot), [currentRoot]);
  const expandableEntries = useMemo(() => currentEntries.filter((entry) => entry.childrenCount > 0), [currentEntries]);
  const areAllTreeNodesCollapsed =
    expandableEntries.length > 0 && expandableEntries.every((entry) => collapsedTreeNodes[entry.path] === true);

  const parentOptions = useMemo(
    () =>
      currentEntries.filter((entry) => {
        if (selectedNode === null) {
          return true;
        }

        return !isInsideSubtree(entry.path, selectedNode.path);
      }),
    [currentEntries, selectedNode]
  );

  useEffect(() => {
    if (currentRoot === null) {
      return;
    }

    const nextSelectedNode = findNodeByPath(currentRoot, selectedPath) ?? currentRoot;

    if (nextSelectedNode.path !== selectedPath) {
      setSelectedPaths((previous) => ({
        ...previous,
        [activeViewMode]: nextSelectedNode.path,
      }));
    }
  }, [activeViewMode, currentRoot, selectedPath]);

  useEffect(() => {
    if (activeViewMode !== 'soll' || selectedNode === null) {
      return;
    }

    const selectedSollNode = selectedNode as SollNode;

    setSollValueInputMode(selectedSollNode.lastEditedTargetField === 'targetPct' ? 'absolute' : 'parent');
  }, [activeViewMode, selectedNode]);

  useEffect(() => {
    if (selectedNode === null) {
      setDraft({
        label: '',
        numericValue: '',
        parentPath: ROOT_NODE_PATH,
        childLabel: '',
        childNumericValue: '',
      });
      return;
    }

    setDraft({
      label: selectedNode.label,
      numericValue:
        activeViewMode === 'soll'
          ? formatNumber(
            sollValueInputMode === 'absolute'
              ? findNodeByPath(sollComputedRoot, selectedNode.path)?.targetPct
              : findNodeByPath(sollComputedRoot, selectedNode.path)?.targetPctOfParent
          )
          : activeViewMode === 'ist'
            ? formatNumber((selectedNode as IstNode).ownValue)
            : '',
      parentPath,
      childLabel: '',
      childNumericValue: '',
    });
  }, [activeViewMode, parentPath, selectedNode, sollComputedRoot, sollValueInputMode]);

  useEffect(() => {
    setDraft((previous) => ({
      ...previous,
      parentPath,
    }));
  }, [parentPath]);

  useEffect(() => {
    if (savedAt === null) return;
    const timer = setTimeout(() => setSavedAt(null), 1500);
    return () => clearTimeout(timer);
  }, [savedAt]);

  const selectedCompareNode = selectedNode === null ? null : findNodeByPath(sollComputedRoot, selectedNode.path);
  const selectedIstComputedNode =
    istComputedRoot === null || selectedNode === null
      ? null
      : findNodeByPath(istComputedRoot, selectedNode.path);
  const selectedIstPercent = selectedIstComputedNode?.pctTotal ?? 0;
  const selectedSollComputedNode = selectedNode === null ? null : findNodeByPath(sollComputedRoot, selectedNode.path);
  const selectedSollFreeness = activeViewMode === 'soll' && selectedNode !== null
    ? computeFreenessStatus(selectedNode as SollNode)
    : null;

  const compareResult =
    activeViewMode !== 'vergleich' || selectedCompareNode === null
      ? null
      : computeCompareStatus(selectedCompareNode.path, selectedCompareNode.pctTotal, selectedIstPercent);

  function updateSelectedPath(path: NodePath): void {
    setSelectedPaths((previous) => ({
      ...previous,
      [activeViewMode]: path,
    }));
  }

  function toggleTreeCollapseAll(): void {
    if (areAllTreeNodesCollapsed) {
      setCollapsedTreeNodes({});
      return;
    }

    setCollapsedTreeNodes(
      Object.fromEntries(expandableEntries.map((entry) => [entry.path, true])) as Record<NodePath, boolean>
    );
  }

  function toggleTreeNodeCollapse(path: NodePath): void {
    setCollapsedTreeNodes((previous) => ({
      ...previous,
      [path]: !previous[path],
    }));
  }

  function getTreeNodePresentation(node: SollNode | IstNode): TreePresentation {
    if (activeViewMode === 'soll') {
      const sollNode = node as SollNode;

      const computedSollNode = sollComputedRoot === null ? null : findNodeByPath(sollComputedRoot, node.path);

      if (sollNode.children.length > 0) {
        const freeness = computeFreenessStatus(sollNode);

        return {
          status: freeness?.status,
          primaryValue: formatStoredPercent(computedSollNode?.targetPctOfParent),
          secondaryValue: formatRatioPercent(computedSollNode?.pctTotal),
          direction: freeness?.status === 'overallocated' ? 'up' : freeness?.status === 'free' ? 'down' : 'flat',
          showBadge: freeness?.status === 'correct',
        };
      }

      return {
        primaryValue: formatStoredPercent(computedSollNode?.targetPctOfParent),
        secondaryValue: formatRatioPercent(computedSollNode?.pctTotal),
        direction: 'flat',
        showBadge: false,
      };
    }

    if (activeViewMode === 'ist') {
      const istNode = istComputedRoot === null ? null : findNodeByPath(istComputedRoot, node.path);

      return {
        primaryValue: formatRatioPercent(istNode?.pctTotal),
        secondaryValue: formatRatioPercent(istNode?.pctOfParent),
        direction: 'flat',
        showBadge: false,
      };
    }

    const sollNode = node as SollNode;
    const computedSollNode = sollComputedRoot === null ? null : findNodeByPath(sollComputedRoot, node.path);
    const istNode = istComputedRoot === null ? null : findNodeByPath(istComputedRoot, node.path);
    const compare = computeCompareStatus(sollNode.path, computedSollNode?.pctTotal ?? 0, istNode?.pctTotal ?? 0);

    return {
      status: compare.status,
      primaryValue: formatRatioPercent(istNode?.pctTotal),
      secondaryValue: formatRatioPercent(computedSollNode?.pctTotal),
      direction:
        compare.status === 'overweighted'
          ? 'up'
          : compare.status === 'underweighted' || compare.status === 'missing_in_ist'
            ? 'down'
            : 'flat',
      showBadge: compare.status === 'correct',
    };
  }

  function renderTreeNode(node: SollNode | IstNode, depth: number): JSX.Element {
    const isSelected = node.path === selectedPath;
    const isExpandable = node.children.length > 0;
    const isCollapsed = collapsedTreeNodes[node.path] === true;
    const presentation = getTreeNodePresentation(node);
    const indent = Math.min(depth * 14, 56);
    const treeNodeStyle = {
      ['--tree-indent' as string]: `${indent}px`,
    } as CSSProperties;

    return (
      <li key={node.path} className="tree-list__item">
        <div
          className={`tree-node ${isSelected ? 'tree-node--selected' : ''}`}
          data-status={presentation.status}
          style={treeNodeStyle}
        >
          <button
            aria-label={isCollapsed ? 'Knoten aufklappen' : 'Knoten einklappen'}
            className="tree-node__toggle"
            disabled={!isExpandable}
            onClick={() => toggleTreeNodeCollapse(node.path)}
            type="button"
          >
            {isExpandable ? (isCollapsed ? '▸' : '▾') : '•'}
          </button>

          <button className="tree-node__select" onClick={() => updateSelectedPath(node.path)} type="button">
            <span className="tree-node__label" title={node.label}>
              {node.label}
            </span>
          </button>

          <div className="tree-node__meta">
            <span className="tree-node__metric">
              {presentation.primaryValue}
              {presentation.secondaryValue !== undefined ? (
                <span className="tree-node__reference"> ({presentation.secondaryValue})</span>
              ) : null}
            </span>
            <span className="tree-node__direction" aria-hidden="true">
              {presentation.direction === 'up' ? '↑' : presentation.direction === 'down' ? '↓' : '→'}
            </span>
            {presentation.showBadge ? <span className="tree-node__badge">✓</span> : null}
          </div>
        </div>

        {isExpandable && !isCollapsed ? (
          <ul className="tree-list">{node.children.map((child) => renderTreeNode(child as SollNode | IstNode, depth + 1))}</ul>
        ) : null}
      </li>
    );
  }

  function handleSave(): void {
    if (selectedNode === null || activeViewMode === 'vergleich') {
      return;
    }

    if (editValueValidation.error !== null) {
      return;
    }

    const nextLabel = draft.label.trim().length > 0 ? draft.label.trim() : selectedNode.label;
    let nextSnapshot: PortfolioStoreSnapshot = snapshot;
    let nextPath = selectedNode.path;

    if (draft.parentPath !== parentPath && !isRootNodePath(selectedNode.path)) {
      const movedNodePath = buildMovedNodePath(draft.parentPath, selectedNode.path);

      if (activeViewMode === 'soll') {
        nextSnapshot = portfolioStore.moveSollNode(selectedNode.path, draft.parentPath);
      } else {
        nextSnapshot = portfolioStore.moveIstNode(selectedNode.path, draft.parentPath);
      }

      const movedExists = findNodeByPath(
        activeViewMode === 'soll' ? nextSnapshot.sollRoot : nextSnapshot.istRoot,
        movedNodePath
      ) !== null;

      nextPath = movedExists ? movedNodePath : selectedNode.path;
    }

    if (activeViewMode === 'soll') {
      const isRoot = isRootNodePath(nextPath);

      nextSnapshot = portfolioStore.updateSollNode(nextPath, (node) => ({
        ...node,
        label: nextLabel,
        targetPctOfParent: isRoot
          ? undefined
          : sollValueInputMode === 'parent'
            ? editValueValidation.parsedValue
            : node.targetPctOfParent,
        targetPct: isRoot
          ? node.targetPct
          : sollValueInputMode === 'absolute'
            ? editValueValidation.parsedValue
            : node.targetPct,
        lastEditedTargetField: isRoot
          ? node.lastEditedTargetField
          : sollValueInputMode === 'absolute'
            ? 'targetPct'
            : 'targetPctOfParent',
      }));
    } else {
      nextSnapshot = portfolioStore.updateIstNode(nextPath, (node) => ({
        ...node,
        label: nextLabel,
        ownValue: editValueValidation.parsedValue,
      }));
    }

    updateSelectedPath(nextPath);

    if (nextSnapshot.saveError === null) {
      setSavedAt(Date.now());
    }
  }

  function handleAddChild(): void {
    if (selectedNode === null || activeViewMode === 'vergleich') {
      return;
    }

    if (childValueValidation.error !== null) {
      return;
    }

    const childLabel = draft.childLabel.trim();

    if (childLabel.length === 0) {
      childInputRef.current?.focus();
      return;
    }

    const childPath = createUniqueChildPath(selectedNode.path, childLabel, selectedNode.children.map((child) => child.path));
    let nextSnapshot: PortfolioStoreSnapshot;

    if (activeViewMode === 'soll') {
      const parentAbsoluteTargetPct = selectedSollComputedNode?.targetPct;
      const childTargetPctOfParent =
        sollValueInputMode === 'absolute'
          ? parentAbsoluteTargetPct === undefined || parentAbsoluteTargetPct === 0
            ? undefined
            : ((childValueValidation.parsedValue ?? 0) / parentAbsoluteTargetPct) * 100
          : childValueValidation.parsedValue;

      nextSnapshot = portfolioStore.appendSollNode(selectedNode.path, {
        path: childPath,
        label: childLabel,
        targetPctOfParent: childTargetPctOfParent,
        targetPct: sollValueInputMode === 'absolute' ? childValueValidation.parsedValue : undefined,
        lastEditedTargetField: sollValueInputMode === 'absolute' ? 'targetPct' : 'targetPctOfParent',
        children: [],
      });
    } else {
      nextSnapshot = portfolioStore.appendIstNode(selectedNode.path, {
        path: childPath,
        label: childLabel,
        ownValue: childValueValidation.parsedValue,
        children: [],
      });
    }

    if (nextSnapshot.saveError === null) {
      setSavedAt(Date.now());
    }

    setDraft((previous) => ({
      ...previous,
      childLabel: '',
      childNumericValue: '',
    }));

    updateSelectedPath(childPath);
  }

  function handleDelete(): void {
    if (selectedNode === null || activeViewMode === 'vergleich' || isRootNodePath(selectedNode.path)) {
      return;
    }

    const nextSelection = getParentPath(selectedNode.path);

    if (activeViewMode === 'soll') {
      portfolioStore.removeSollNode(selectedNode.path);
    } else {
      portfolioStore.removeIstNode(selectedNode.path);
    }

    updateSelectedPath(nextSelection);
  }

  const readOnlyMode = activeViewMode === 'vergleich';
  const isIstMode = activeViewMode === 'ist';
  const isSollMode = activeViewMode === 'soll';
  const isSollAbsoluteMode = isSollMode && sollValueInputMode === 'absolute';
  const isRootSollSelection = isSollMode && selectedNode !== null && isRootNodePath(selectedNode.path);
  const editValueValidation =
    isSollMode || isIstMode
      ? validateNumericInput(
        draft.numericValue,
        isSollMode ? 'soll' : 'ist',
        isSollMode
          ? isSollAbsoluteMode
            ? 'Anteil gesamt'
            : 'Anteil am Parent'
          : 'IST-Gesamtwert'
      )
      : { parsedValue: undefined, error: null };
  const childValueValidation =
    isSollMode || isIstMode
      ? validateNumericInput(
        draft.childNumericValue,
        isSollMode ? 'soll' : 'ist',
        isSollMode
          ? isSollAbsoluteMode
            ? 'Neuer Anteil gesamt'
            : 'Neuer Anteil am Parent'
          : 'Neuer IST-Gesamtwert'
      )
      : { parsedValue: undefined, error: null };
  const saveSucceeded = savedAt !== null && snapshot.saveError === null;
  const treePanelTitle = activeViewMode === 'vergleich' ? 'VERGLEICH-PORTFOLIO' : `${activeViewMode.toUpperCase()}-PORTFOLIO`;
  const sunburstCollapseLabel = areAllTreeNodesCollapsed ? 'Alle ausklappen' : 'Alle einklappen';

  return (
    <div className="workspace-shell">
      <header className="workspace-header">
        <div>
          <p className="workspace-kicker">Portfolio Visualizer</p>
          <h1>Seitenbereich für die manuelle Hierarchiepflege</h1>
        </div>
        <div className="workspace-header__controls">
          <div className="mode-tabs" role="tablist" aria-label="Ansicht wählen">
            <ViewModeTab mode="soll" activeMode={activeViewMode} onChange={onActiveViewModeChange} label="SOLL" />
            <ViewModeTab mode="ist" activeMode={activeViewMode} onChange={onActiveViewModeChange} label="IST" />
            <ViewModeTab mode="vergleich" activeMode={activeViewMode} onChange={onActiveViewModeChange} label="Vergleich" />
          </div>
        </div>
      </header>

      <div className={`workspace-body${activeViewMode === 'vergleich' ? ' workspace-body--vergleich' : ''}`}>
        {activeViewMode === 'vergleich' ? (
          <>
            <section className="panel panel--tree">
              <div className="panel__header">
                <div>
                  <p className="panel__eyebrow">Baumansicht</p>
                  <h2>SOLL-PORTFOLIO</h2>
                </div>
              </div>
              {snapshot.sollRoot === null ? (
                <div className="empty-state"><p>Noch kein SOLL-Portfolio.</p></div>
              ) : (
                <ul className="tree-list tree-list--root">
                  {snapshot.sollRoot.children.length === 0 ? <li className="tree-list__empty">Noch keine Kinder.</li> : null}
                  {snapshot.sollRoot.children.map((child) => renderTreeNode(child as SollNode, 0))}
                </ul>
              )}
            </section>
            <section className="panel panel--tree">
              <div className="panel__header">
                <div>
                  <p className="panel__eyebrow">Baumansicht</p>
                  <h2>IST-PORTFOLIO</h2>
                </div>
              </div>
              {snapshot.istRoot === null ? (
                <div className="empty-state"><p>Noch kein IST-Portfolio.</p></div>
              ) : (
                <ul className="tree-list tree-list--root">
                  {snapshot.istRoot.children.length === 0 ? <li className="tree-list__empty">Noch keine Kinder.</li> : null}
                  {snapshot.istRoot.children.map((child) => renderTreeNode(child as IstNode, 0))}
                </ul>
              )}
            </section>
          </>
        ) : (
          <section className="panel panel--tree">
            <div className="panel__header">
              <div>
                <p className="panel__eyebrow">Baumansicht</p>
                <h2>{treePanelTitle}</h2>
              </div>
              <div className="panel__header-actions">
                <button className="button button--primary" disabled={readOnlyMode || selectedNode === null} onClick={handleAddChild} type="button">
                  + Hinzufügen
                </button>
              </div>
            </div>

            {currentRoot === null ? (
              <div className="empty-state">
                <p>Es ist noch kein Portfolio angelegt.</p>
              </div>
            ) : (
              <ul className="tree-list tree-list--root">
                {currentRoot.children.length === 0 ? <li className="tree-list__empty">Noch keine Kinder angelegt.</li> : null}
                {currentRoot.children.map((child) => renderTreeNode(child as SollNode | IstNode, 0))}
              </ul>
            )}
          </section>
        )}

        {activeViewMode === 'vergleich' ? (
          <section className="panel panel--sunburst">
            <div className="panel__header">
              <div>
                <p className="panel__eyebrow">Analyse</p>
                <h2>SOLL VS. IST VERGLEICH</h2>
              </div>
            </div>
            <div className="compare-table-container">
              <table className="compare-table">
                <thead>
                  <tr>
                    <th>Struktur / Knoten</th>
                    <th className="text-right">Soll gesamt</th>
                    <th className="text-right">Soll / Parent</th>
                    <th className="text-right">Ist gesamt</th>
                    <th className="text-right">Ist / Parent</th>
                    <th className="text-right">Delta (pp)</th>
                  </tr>
                </thead>
                <tbody>
                  {compareRows.map((row) => {
                    const indent = Math.min(row.depth * 16, 64);
                    const deltaPrefix = row.deltaPctPoints >= 0 ? '+' : '';
                    const deltaText = `${deltaPrefix}${trimTrailingZeros((row.deltaPctPoints * 100).toFixed(2))} pp`;

                    return (
                      <tr key={row.path}>
                        <td>
                          <div className="compare-table__cell--label">
                            <span className="compare-table__indent" style={{ width: `${indent}px` }} />
                            <span className="compare-table__status-dot" data-status={row.status} title={formatCompareStatus(row.status)} />
                            <span>{row.label}</span>
                            <span className="compare-table__status-text">({formatCompareStatus(row.status)})</span>
                          </div>
                        </td>
                        <td className="text-right">{formatRatioPercent(row.sollTargetPct)}</td>
                        <td className="text-right">{formatStoredPercent(row.sollPctOfParent)}</td>
                        <td className="text-right">{formatRatioPercent(row.istPct)}</td>
                        <td className="text-right">{formatRatioPercent(row.istPctOfParent)}</td>
                        <td className="text-right">
                          <span className="compare-table__delta" data-status={row.status}>
                            {row.status === 'missing_in_ist' ? '— Fehlt' : row.status === 'extra_in_ist' ? '+ Extra' : deltaText}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        ) : (
          <section className="panel panel--sunburst">
            <div className="panel__header">
              <div>
                <p className="panel__eyebrow">Sunburst</p>
                <h2>SUNBURST</h2>
              </div>
              <div className="panel__header-actions">
                <button className="button button--ghost" disabled={currentRoot === null} onClick={toggleTreeCollapseAll} type="button">
                  {sunburstCollapseLabel}
                </button>
              </div>
            </div>

            <PortfolioSunburst
              root={sunburstRoot}
              title={sunburstMode.toUpperCase()}
              hint={
                sunburstMode === 'soll'
                  ? 'Für die Sunburst-Ansicht sind noch keine SOLL-Daten vorhanden.'
                  : 'Für die Sunburst-Ansicht sind noch keine IST-Daten vorhanden.'
              }
            />
          </section>
        )}

        {activeViewMode !== 'vergleich' ? <aside className="panel panel--sidebar">
          <div className="panel__header panel__header--stacked">
            <div>
              <p className="panel__eyebrow">Seitenbereich</p>
              <h2>{selectedNode?.label ?? 'Kein Knoten ausgewählt'}</h2>
            </div>
            <p className="panel__hint">
              {readOnlyMode
                ? 'Vergleich ist bewusst lesbar. Bearbeitung erfolgt in SOLL oder IST.'
                : 'Label, Wert und Parent werden hier gepflegt.'}
            </p>
            {!readOnlyMode && snapshot.saveError !== null ? <p className="panel__error" role="alert">{snapshot.saveError}</p> : null}
            {snapshot.loadError !== null ? <p className="panel__error" role="alert">{snapshot.loadError}</p> : null}
            {!readOnlyMode && saveSucceeded ? <p className="panel__success">Gespeichert ✓</p> : null}
          </div>

          {selectedNode === null ? (
            <div className="empty-state">
              <p>Wähle links einen Knoten aus.</p>
            </div>
          ) : (
            <div className="sidebar-stack">
              <div className="detail-card">
                <div className="detail-card__row">
                  <span>Pfad</span>
                  <strong>{formatRelativePath(selectedNode.path)}</strong>
                </div>
                <div className="detail-card__row">
                  <span>Parent</span>
                  <strong>{isRootNodePath(selectedNode.path) ? 'fest' : formatRelativePath(parentPath)}</strong>
                </div>
                <div className="detail-card__row">
                  <span>Unterknoten</span>
                  <strong>{selectedNode.children.length}</strong>
                </div>
                {isSollMode ? (
                  <div className="detail-card__row">
                    <span>Freeness</span>
                    <strong>{selectedNode.children.length > 0 ? computeFreenessStatus(selectedNode as SollNode)?.status ?? 'correct' : '—'}</strong>
                  </div>
                ) : null}
                {isSollMode ? (
                  <>
                    <div className="detail-card__row">
                      <span>Anteil am Parent</span>
                      <strong>{isRootNodePath(selectedNode.path) ? '100 % (Root)' : formatStoredPercent(selectedSollComputedNode?.targetPctOfParent)}</strong>
                    </div>
                    <div className="detail-card__row">
                      <span>Anteil gesamt</span>
                      <strong>{formatPercentageValue(selectedSollComputedNode?.pctTotal)}</strong>
                    </div>
                    {selectedNode.children.length > 0 ? (
                      <div className="detail-card__row">
                        <span>Summe Kinder (% vom Parent)</span>
                        <strong>{formatStoredPercent(selectedSollFreeness?.childrenTargetSumPct)}</strong>
                      </div>
                    ) : null}
                  </>
                ) : null}
                {isIstMode && selectedIstComputedNode !== null ? (
                  <>
                    <div className="detail-card__row">
                      <span>Gesamtwert (berechnet)</span>
                      <strong>{selectedIstComputedNode.nodeValue}</strong>
                    </div>
                    <div className="detail-card__row">
                      <span>Direkt gehalten (abgeleitet)</span>
                      <strong>{selectedIstComputedNode.directValue}</strong>
                    </div>
                    <div className="detail-card__row">
                      <span>Anteil gesamt</span>
                      <strong>{formatPercentageValue(selectedIstComputedNode.pctTotal)}</strong>
                    </div>
                    <div className="detail-card__row">
                      <span>Anteil Parent</span>
                      <strong>{formatPercentageValue(selectedIstComputedNode.pctOfParent)}</strong>
                    </div>
                  </>
                ) : null}
                {isSollMode && selectedSollFreeness !== null && selectedSollFreeness.status !== 'correct' ? (
                  <p className="field__error" role="alert">
                    Die Kinder von diesem Parent summieren sich auf {formatStoredPercent(selectedSollFreeness.childrenTargetSumPct)} statt 100 %.
                  </p>
                ) : null}
              </div>

              <form
                className="form-card"
                onSubmit={(event) => {
                  event.preventDefault();
                  handleSave();
                }}
              >
                <div className="form-card__header">
                  <h3>Bearbeiten</h3>
                  <span>{readOnlyMode ? 'Lesemodus' : activeViewMode.toUpperCase()}</span>
                </div>

                <label className="field">
                  <span>Label</span>
                  <input
                    disabled={readOnlyMode || selectedNode === null || isRootNodePath(selectedNode.path)}
                    value={draft.label}
                    onChange={(event) => setDraft((previous) => ({ ...previous, label: event.target.value }))}
                    onKeyDown={(event) => { if (event.key === 'Enter') handleSave(); }}
                    placeholder="Knotenname"
                  />
                </label>

                <label className="field">
                  <span>{isSollMode ? 'Eingabemodus' : 'Modus'}</span>
                  <select
                    disabled={readOnlyMode || !isSollMode || isRootSollSelection}
                    value={sollValueInputMode}
                    onChange={(event) => setSollValueInputMode(event.target.value as SollValueInputMode)}
                  >
                    <option value="parent">% vom Parent</option>
                    <option value="absolute">% gesamt (absolut)</option>
                  </select>
                </label>

                <label className="field">
                  <span>
                    {isSollMode
                      ? isSollAbsoluteMode
                        ? 'Anteil gesamt in %'
                        : 'Anteil am Parent in %'
                      : isIstMode
                        ? 'IST-Gesamtwert'
                        : 'Wert'}
                  </span>
                  <input
                    className={editValueValidation.error !== null ? 'field__input--error' : undefined}
                    disabled={readOnlyMode || isRootSollSelection}
                    inputMode="decimal"
                    value={draft.numericValue}
                    aria-invalid={editValueValidation.error !== null}
                    aria-describedby={editValueValidation.error !== null ? 'edit-numeric-error' : undefined}
                    onChange={(event) => setDraft((previous) => ({ ...previous, numericValue: event.target.value }))}
                    onKeyDown={(event) => { if (event.key === 'Enter') handleSave(); }}
                    placeholder={
                      isSollMode
                        ? isRootSollSelection
                          ? 'Root = 100 % (fix)'
                          : isSollAbsoluteMode
                            ? 'z. B. 20'
                            : 'z. B. 40'
                        : 'z. B. 1000 (inkl. Kinder)'
                    }
                  />
                </label>
                {editValueValidation.error !== null ? <p className="field__error" id="edit-numeric-error" role="alert">{editValueValidation.error}</p> : null}

                <label className="field">
                  <span>Parent</span>
                  <select
                    disabled={readOnlyMode || isRootNodePath(selectedNode.path)}
                    value={draft.parentPath}
                    onChange={(event) => setDraft((previous) => ({ ...previous, parentPath: event.target.value }))}
                  >
                    {isRootNodePath(selectedNode.path) ? <option value={ROOT_NODE_PATH}>Root (fest)</option> : null}
                    {parentOptions.map((entry) => (
                      <option key={entry.path} value={entry.path}>
                        {formatRelativePath(entry.path)}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="form-actions">
                  <button
                    className={`button button--primary ${saveSucceeded ? 'button--saved' : ''}`}
                    disabled={readOnlyMode || editValueValidation.error !== null}
                    type="submit"
                  >
                    {saveSucceeded ? 'Gespeichert ✓' : 'Änderungen speichern'}
                  </button>
                  <button
                    className="button button--ghost"
                    disabled={readOnlyMode || isRootNodePath(selectedNode.path)}
                    onClick={handleDelete}
                    type="button"
                  >
                    Löschen
                  </button>
                </div>
              </form>

              <form
                className="form-card"
                onSubmit={(event) => {
                  event.preventDefault();
                  handleAddChild();
                }}
              >
                <div className="form-card__header">
                  <h3>Kind anlegen</h3>
                  <span>unter {formatRelativePath(selectedNode.path)}</span>
                </div>

                <label className="field">
                  <span>Neues Label</span>
                  <input
                    ref={childInputRef}
                    disabled={readOnlyMode}
                    value={draft.childLabel}
                    onChange={(event) => setDraft((previous) => ({ ...previous, childLabel: event.target.value }))}
                    onKeyDown={(event) => { if (event.key === 'Enter') handleAddChild(); }}
                    placeholder="z. B. USA"
                  />
                </label>

                <label className="field">
                  <span>
                    {isSollMode
                      ? isSollAbsoluteMode
                        ? 'Neuer Anteil gesamt in %'
                        : 'Neuer Anteil am Parent in %'
                      : isIstMode
                        ? 'Neuer IST-Wert'
                        : 'Wert'}
                  </span>
                  <input
                    className={childValueValidation.error !== null ? 'field__input--error' : undefined}
                    disabled={readOnlyMode}
                    inputMode="decimal"
                    value={draft.childNumericValue}
                    aria-invalid={childValueValidation.error !== null}
                    aria-describedby={childValueValidation.error !== null ? 'child-numeric-error' : undefined}
                    onChange={(event) => setDraft((previous) => ({ ...previous, childNumericValue: event.target.value }))}
                    onKeyDown={(event) => { if (event.key === 'Enter') handleAddChild(); }}
                    placeholder={isSollMode ? (isSollAbsoluteMode ? 'z. B. 12' : 'z. B. 40') : 'z. B. 250'}
                  />
                </label>
                {childValueValidation.error !== null ? <p className="field__error" id="child-numeric-error" role="alert">{childValueValidation.error}</p> : null}

                <button
                  className="button button--primary"
                  disabled={readOnlyMode || draft.childLabel.trim().length === 0 || childValueValidation.error !== null}
                  type="submit"
                >
                  Kind anlegen
                </button>
              </form>
            </div>
          )}
        </aside> : null}
      </div>
    </div>
  );
}
