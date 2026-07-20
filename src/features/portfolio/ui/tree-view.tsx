import type { CSSProperties, JSX } from 'react';

import {
  type IstComputedNode,
  type IstNode,
  type NodePath,
  type PortfolioNodeBase,
  type PortfolioTab,
  type SollComputedNode,
  type SollNode,
  computeCompareStatus,
  computeFreenessStatus,
} from '../domain/portfolio-model';

export interface TreeNodeEntry {
  path: NodePath;
  label: string;
  depth: number;
  childrenCount: number;
}

interface TreePresentation {
  status?:
    | 'correct'
    | 'free'
    | 'overallocated'
    | 'underweighted'
    | 'overweighted'
    | 'missing_in_ist'
    | 'extra_in_ist';
  primaryValue: string;
  secondaryValue?: string;
  direction: 'up' | 'down' | 'flat';
  showBadge: boolean;
}

export interface TreeViewProps {
  root: SollNode | IstNode | null;
  activeViewMode: PortfolioTab;
  selectedPath: NodePath;
  onSelectPath(path: NodePath): void;
  collapsedNodes: Record<NodePath, boolean>;
  onToggleCollapse(path: NodePath): void;
  onToggleCollapseAll(): void;
  sollComputedRoot: SollComputedNode | null;
  istComputedRoot: IstComputedNode | null;
  areAllCollapsed: boolean;
  readOnly: boolean;
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

function trimTrailingZeros(numStr: string): string {
  return numStr.replace(/(\.[0-9]*?)0+$/, '$1').replace(/\.$/, '');
}

function formatStoredPercent(value: number | undefined): string {
  return value === undefined ? '—' : `${trimTrailingZeros(value.toFixed(2))} %`;
}

function formatRatioPercent(value: number | undefined): string {
  return value === undefined ? '—' : `${trimTrailingZeros((value * 100).toFixed(2))} %`;
}

function getTreeNodePresentation(
  node: SollNode | IstNode,
  activeViewMode: PortfolioTab,
  sollComputedRoot: SollComputedNode | null,
  istComputedRoot: IstComputedNode | null
): TreePresentation {
  if (activeViewMode === 'soll') {
    const sollNode = node as SollNode;
    const computedSollNode = findNodeByPath(sollComputedRoot, node.path);

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
    const istNode = findNodeByPath(istComputedRoot, node.path);

    return {
      primaryValue: formatRatioPercent(istNode?.pctTotal),
      secondaryValue: formatRatioPercent(istNode?.pctOfParent),
      direction: 'flat',
      showBadge: false,
    };
  }

  const computedSollNode = findNodeByPath(sollComputedRoot, node.path);
  const istNode = findNodeByPath(istComputedRoot, node.path);
  const compare = computeCompareStatus(node.path, computedSollNode?.pctTotal ?? 0, istNode?.pctTotal ?? 0);

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

export function collectTreeEntries<TNode extends PortfolioNodeBase<TNode>>(root: TNode | null, depth = 0): TreeNodeEntry[] {
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

export function toggleTreeCollapseAll(
  collapsedNodes: Record<NodePath, boolean>,
  expandableEntries: TreeNodeEntry[],
  areAllCollapsed: boolean
): Record<NodePath, boolean> {
  if (areAllCollapsed) {
    return {};
  }

  return {
    ...collapsedNodes,
    ...Object.fromEntries(expandableEntries.map((entry) => [entry.path, true])) as Record<NodePath, boolean>,
  };
}

export function toggleTreeNodeCollapse(
  collapsedNodes: Record<NodePath, boolean>,
  path: NodePath
): Record<NodePath, boolean> {
  return {
    ...collapsedNodes,
    [path]: !collapsedNodes[path],
  };
}

function renderTreeNode(
  node: SollNode | IstNode,
  depth: number,
  selectedPath: NodePath,
  onSelectPath: (path: NodePath) => void,
  collapsedNodes: Record<NodePath, boolean>,
  onToggleCollapse: (path: NodePath) => void,
  activeViewMode: PortfolioTab,
  sollComputedRoot: SollComputedNode | null,
  istComputedRoot: IstComputedNode | null
): JSX.Element {
  const isSelected = node.path === selectedPath;
  const isExpandable = node.children.length > 0;
  const isCollapsed = collapsedNodes[node.path] === true;
  const presentation = getTreeNodePresentation(node, activeViewMode, sollComputedRoot, istComputedRoot);
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
          onClick={() => onToggleCollapse(node.path)}
          type="button"
        >
          {isExpandable ? (isCollapsed ? '▸' : '▾') : '•'}
        </button>

        <button className="tree-node__select" onClick={() => onSelectPath(node.path)} type="button">
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
        <ul className="tree-list">
          {node.children.map((child) =>
            renderTreeNode(
              child as SollNode | IstNode,
              depth + 1,
              selectedPath,
              onSelectPath,
              collapsedNodes,
              onToggleCollapse,
              activeViewMode,
              sollComputedRoot,
              istComputedRoot
            )
          )}
        </ul>
      ) : null}
    </li>
  );
}

export function TreeView({
  root,
  activeViewMode,
  selectedPath,
  onSelectPath,
  collapsedNodes,
  onToggleCollapse,
  onToggleCollapseAll,
  sollComputedRoot,
  istComputedRoot,
  areAllCollapsed,
}: TreeViewProps) {
  const collapseLabel = areAllCollapsed ? 'Alle ausklappen' : 'Alle einklappen';

  if (root === null) {
    return (
      <div className="empty-state">
        <p>Es ist noch kein Portfolio angelegt.</p>
      </div>
    );
  }

  return (
    <>
      <div className="panel__header-actions">
        <button className="button button--ghost" onClick={onToggleCollapseAll} type="button">
          {collapseLabel}
        </button>
      </div>
      <ul className="tree-list tree-list--root">
        {root.children.length === 0 ? <li className="tree-list__empty">Noch keine Kinder angelegt.</li> : null}
        {root.children.map((child) =>
          renderTreeNode(
            child as SollNode | IstNode,
            0,
            selectedPath,
            onSelectPath,
            collapsedNodes,
            onToggleCollapse,
            activeViewMode,
            sollComputedRoot,
            istComputedRoot
          )
        )}
      </ul>
    </>
  );
}
