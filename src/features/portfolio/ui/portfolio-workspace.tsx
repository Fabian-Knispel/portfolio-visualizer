import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';

import {
  ROOT_NODE_PATH,
  exampleIstHierarchy,
  exampleSollHierarchy,
  type IstNode,
  type NodePath,
  type PortfolioNodeBase,
  type SollNode,
  buildNodePath,
  computeCompareStatus,
  computeFreenessStatus,
  computeIstNodeValues,
  computeIstPercentages,
  formatPercentageValue,
  isRootNodePath,
} from '../domain/portfolio-model';
import { portfolioStore, type PortfolioStoreSnapshot } from '../state/portfolio-store';
import { PortfolioSunburst } from './portfolio-sunburst';
import { buildSunburstDatumForMode, type SunburstMode } from './sunburst-model';

export type ViewMode = 'soll' | 'ist' | 'vergleich';

interface PortfolioWorkspaceProps {
  activeViewMode: ViewMode;
  onActiveViewModeChange(mode: ViewMode): void;
  sunburstMode: SunburstMode;
  onSunburstModeChange(mode: SunburstMode): void;
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

function usePortfolioSnapshot(): PortfolioStoreSnapshot {
  return useSyncExternalStore(
    (onStoreChange) => portfolioStore.subscribe(() => onStoreChange()),
    () => portfolioStore.getState(),
    () => portfolioStore.getState()
  );
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

function formatNumber(value: number | undefined): string {
  return value === undefined ? '' : String(value);
}

function formatRelativePath(path: NodePath): string {
  return path === ROOT_NODE_PATH ? 'root' : path.replace(/^root\//, '');
}

interface TreeNodeRowProps<TNode extends PortfolioNodeBase<TNode>> {
  node: TNode;
  depth: number;
  selectedPath: NodePath;
  onSelect(path: NodePath): void;
}

function TreeNodeRow<TNode extends PortfolioNodeBase<TNode>>({
  node,
  depth,
  selectedPath,
  onSelect,
}: TreeNodeRowProps<TNode>) {
  const isSelected = node.path === selectedPath;

  return (
    <li className="tree-list__item">
      <button
        className={`tree-node ${isSelected ? 'tree-node--selected' : ''}`}
        style={{ marginInlineStart: depth * 16 }}
        onClick={() => onSelect(node.path)}
        type="button"
      >
        <span className="tree-node__label">{node.label}</span>
        <span className="tree-node__path">{formatRelativePath(node.path)}</span>
        <span className="tree-node__count">{node.children.length} Kinder</span>
      </button>
      {node.children.length > 0 ? (
        <ul className="tree-list">
          {node.children.map((child) => (
            <TreeNodeRow key={child.path} node={child} depth={depth + 1} selectedPath={selectedPath} onSelect={onSelect} />
          ))}
        </ul>
      ) : null}
    </li>
  );
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

function SunburstModeTab({
  mode,
  activeMode,
  onChange,
  label,
}: {
  mode: SunburstMode;
  activeMode: SunburstMode;
  onChange(mode: SunburstMode): void;
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
  sunburstMode,
  onSunburstModeChange,
}: PortfolioWorkspaceProps) {
  const snapshot = usePortfolioSnapshot();
  const [selectedPaths, setSelectedPaths] = useState<Record<ViewMode, NodePath>>({
    soll: ROOT_NODE_PATH,
    ist: ROOT_NODE_PATH,
    vergleich: ROOT_NODE_PATH,
  });
  const [draft, setDraft] = useState<EditorDraft>({
    label: '',
    numericValue: '',
    parentPath: ROOT_NODE_PATH,
    childLabel: '',
    childNumericValue: '',
  });

  useEffect(() => {
    if (snapshot.sollRoot === null) {
      portfolioStore.setSollRoot(createSollRoot());
    }

    if (snapshot.istRoot === null) {
      portfolioStore.setIstRoot(createIstRoot());
    }
  }, [snapshot.istRoot, snapshot.sollRoot]);

  const currentRoot = activeViewMode === 'soll' ? snapshot.sollRoot : activeViewMode === 'ist' ? snapshot.istRoot : snapshot.sollRoot;
  const comparisonRoot = snapshot.istRoot;
  const selectedPath = selectedPaths[activeViewMode];
  const selectedNode = findNodeByPath(currentRoot, selectedPath);
  const parentPath = selectedNode === null ? ROOT_NODE_PATH : getParentPath(selectedNode.path);
  const istComputedRoot = useMemo(
    () => (snapshot.istRoot === null ? null : computeIstPercentages(computeIstNodeValues(snapshot.istRoot))),
    [snapshot.istRoot]
  );
  const sunburstRoot = useMemo(
    () => buildSunburstDatumForMode(sunburstMode, snapshot.sollRoot, istComputedRoot),
    [istComputedRoot, snapshot.sollRoot, sunburstMode]
  );
  const currentEntries = collectTreeEntries(currentRoot);
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
        activeViewMode === 'soll' ? formatNumber((selectedNode as SollNode).targetPct) : activeViewMode === 'ist' ? formatNumber((selectedNode as IstNode).ownValue) : '',
      parentPath,
      childLabel: '',
      childNumericValue: '',
    });
  }, [activeViewMode, parentPath, selectedNode]);

  useEffect(() => {
    setDraft((previous) => ({
      ...previous,
      parentPath,
    }));
  }, [parentPath]);

  const selectedCompareNode = selectedNode === null ? null : findNodeByPath(snapshot.sollRoot, selectedNode.path);
  const selectedIstNode = selectedNode === null ? null : findNodeByPath(snapshot.istRoot, selectedNode.path);

  const selectedIstComputedNode =
    activeViewMode !== 'ist' || istComputedRoot === null || selectedNode === null
      ? null
      : findNodeByPath(istComputedRoot, selectedNode.path);
  const selectedIstPercent = selectedIstComputedNode?.pctTotal;

  const compareResult =
    activeViewMode !== 'vergleich' || selectedCompareNode === null || selectedIstPercent === undefined
      ? null
      : computeCompareStatus(selectedCompareNode.path, (selectedCompareNode as SollNode).targetPct ?? 0, selectedIstPercent);

  function updateSelectedPath(path: NodePath): void {
    setSelectedPaths((previous) => ({
      ...previous,
      [activeViewMode]: path,
    }));
  }

  function handleSave(): void {
    if (selectedNode === null || activeViewMode === 'vergleich') {
      return;
    }

    const nextLabel = draft.label.trim().length > 0 ? draft.label.trim() : selectedNode.label;

    if (draft.parentPath !== parentPath && !isRootNodePath(selectedNode.path)) {
      if (activeViewMode === 'soll') {
        portfolioStore.moveSollNode(selectedNode.path, draft.parentPath);
      } else {
        portfolioStore.moveIstNode(selectedNode.path, draft.parentPath);
      }
    }

    if (activeViewMode === 'soll') {
      portfolioStore.updateSollNode(selectedNode.path, (node) => ({
        ...node,
        label: nextLabel,
        targetPct: parseOptionalNumber(draft.numericValue),
      }));
    } else {
      portfolioStore.updateIstNode(selectedNode.path, (node) => ({
        ...node,
        label: nextLabel,
        ownValue: parseOptionalNumber(draft.numericValue),
      }));
    }
  }

  function handleAddChild(): void {
    if (selectedNode === null || activeViewMode === 'vergleich') {
      return;
    }

    const childLabel = draft.childLabel.trim();

    if (childLabel.length === 0) {
      return;
    }

    const childPath = createUniqueChildPath(selectedNode.path, childLabel, selectedNode.children.map((child) => child.path));

    if (activeViewMode === 'soll') {
      portfolioStore.appendSollNode(selectedNode.path, {
        path: childPath,
        label: childLabel,
        targetPct: parseOptionalNumber(draft.childNumericValue),
        children: [],
      });
    } else {
      portfolioStore.appendIstNode(selectedNode.path, {
        path: childPath,
        label: childLabel,
        ownValue: parseOptionalNumber(draft.childNumericValue),
        children: [],
      });
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
          <div className="mode-tabs" role="tablist" aria-label="Sunburst-Modus wählen">
            <SunburstModeTab mode="soll" activeMode={sunburstMode} onChange={onSunburstModeChange} label="Sunburst SOLL" />
            <SunburstModeTab mode="ist" activeMode={sunburstMode} onChange={onSunburstModeChange} label="Sunburst IST" />
          </div>
        </div>
      </header>

      <div className="workspace-body">
        <div className="workspace-main">
          <section className="panel panel--sunburst">
            <div className="panel__header panel__header--stacked">
              <div>
                <p className="panel__eyebrow">Sunburst</p>
                <h2>{sunburstMode.toUpperCase()}</h2>
              </div>
              <p className="panel__hint">Hover zeigt Label und Prozentwerte. Der Schalter oben wechselt ohne Neuladen zwischen SOLL und IST.</p>
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

          <section className="panel panel--tree">
          <div className="panel__header">
            <div>
              <p className="panel__eyebrow">Baumansicht</p>
              <h2>{activeViewMode === 'vergleich' ? 'Vergleich (nur lesbar)' : activeViewMode.toUpperCase()}</h2>
            </div>
            <div className="panel__meta">
              <span>{currentEntries.length} Knoten</span>
              {snapshot.loadError !== null ? <span className="status-badge status-badge--warn">Ladefehler</span> : null}
              {snapshot.saveError !== null ? <span className="status-badge status-badge--warn">Speicherfehler</span> : null}
            </div>
          </div>

          {currentRoot === null ? (
            <div className="empty-state">
              <p>Es ist noch kein Portfolio angelegt.</p>
            </div>
          ) : (
            <ul className="tree-list tree-list--root">
              {currentRoot.children.length === 0 ? (
                <li className="tree-list__empty">Noch keine Kinder angelegt.</li>
              ) : null}
              {currentRoot.children.map((child) => (
                <TreeNodeRow key={child.path} node={child} depth={0} selectedPath={selectedPath} onSelect={updateSelectedPath} />
              ))}
            </ul>
          )}
          </section>
        </div>

        <aside className="panel panel--sidebar">
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
                {isIstMode && selectedIstComputedNode !== null ? (
                  <>
                    <div className="detail-card__row">
                      <span>Node Value</span>
                      <strong>{selectedIstComputedNode.nodeValue}</strong>
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
                {activeViewMode === 'vergleich' ? (
                  <div className="detail-card__row">
                    <span>Vergleich</span>
                    <strong>
                      {compareResult === null
                        ? '—'
                        : `${compareResult.status} · Δ ${compareResult.deltaPctPoints.toFixed(2)} pp · IST ${formatPercentageValue(selectedIstPercent)}`}
                    </strong>
                  </div>
                ) : null}
              </div>

              <div className="form-card">
                <div className="form-card__header">
                  <h3>Bearbeiten</h3>
                  <span>{readOnlyMode ? 'Lesemodus' : activeViewMode.toUpperCase()}</span>
                </div>

                <label className="field">
                  <span>Label</span>
                  <input
                    disabled={readOnlyMode}
                    value={draft.label}
                    onChange={(event) => setDraft((previous) => ({ ...previous, label: event.target.value }))}
                    placeholder="Knotenname"
                  />
                </label>

                <label className="field">
                  <span>{isSollMode ? 'SOLL-Ziel in %' : isIstMode ? 'IST-Wert' : 'Wert'}</span>
                  <input
                    disabled={readOnlyMode}
                    inputMode="decimal"
                    value={draft.numericValue}
                    onChange={(event) => setDraft((previous) => ({ ...previous, numericValue: event.target.value }))}
                    placeholder={isSollMode ? 'z. B. 25' : 'z. B. 1000'}
                  />
                </label>

                <label className="field">
                  <span>Parent</span>
                  <select
                    disabled={readOnlyMode || isRootNodePath(selectedNode.path)}
                    value={draft.parentPath}
                    onChange={(event) => setDraft((previous) => ({ ...previous, parentPath: event.target.value }))}
                  >
                    {isRootNodePath(selectedNode.path) ? (
                      <option value={ROOT_NODE_PATH}>Root (fest)</option>
                    ) : null}
                    {parentOptions.map((entry) => (
                      <option key={entry.path} value={entry.path}>
                        {formatRelativePath(entry.path)}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="form-actions">
                  <button className="button button--primary" disabled={readOnlyMode} onClick={handleSave} type="button">
                    Änderungen speichern
                  </button>
                  <button className="button button--ghost" disabled={readOnlyMode || isRootNodePath(selectedNode.path)} onClick={handleDelete} type="button">
                    Löschen
                  </button>
                </div>
              </div>

              <div className="form-card">
                <div className="form-card__header">
                  <h3>Kind anlegen</h3>
                  <span>unter {formatRelativePath(selectedNode.path)}</span>
                </div>

                <label className="field">
                  <span>Neues Label</span>
                  <input
                    disabled={readOnlyMode}
                    value={draft.childLabel}
                    onChange={(event) => setDraft((previous) => ({ ...previous, childLabel: event.target.value }))}
                    placeholder="z. B. USA"
                  />
                </label>

                <label className="field">
                  <span>{isSollMode ? 'Neues SOLL-Ziel in %' : isIstMode ? 'Neuer IST-Wert' : 'Wert'}</span>
                  <input
                    disabled={readOnlyMode}
                    inputMode="decimal"
                    value={draft.childNumericValue}
                    onChange={(event) => setDraft((previous) => ({ ...previous, childNumericValue: event.target.value }))}
                    placeholder={isSollMode ? 'z. B. 15' : 'z. B. 250'}
                  />
                </label>

                <button className="button button--primary" disabled={readOnlyMode} onClick={handleAddChild} type="button">
                  Kind anlegen
                </button>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}