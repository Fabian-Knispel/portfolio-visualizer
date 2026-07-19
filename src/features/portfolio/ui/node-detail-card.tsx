import {
  ROOT_NODE_PATH,
  type IstComputedNode,
  type IstNode,
  type NodePath,
  type PortfolioNodeBase,
  type PortfolioTab,
  type SollComputedNode,
  type SollNode,
  computeFreenessStatus,
  formatPercentageValue,
  isRootNodePath,
} from '../domain/portfolio-model';

interface NodeDetailCardProps {
  selectedNode: SollNode | IstNode | null;
  activeViewMode: PortfolioTab;
  sollComputedRoot: SollComputedNode | null;
  istComputedRoot: IstComputedNode | null;
  selectedIstComputedNode: IstComputedNode | null;
  selectedSollFreeness: ReturnType<typeof computeFreenessStatus>;
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

function formatRelativePath(path: NodePath): string {
  return path === ROOT_NODE_PATH ? 'root' : path.replace(/^root\//, '');
}

function trimTrailingZeros(numStr: string): string {
  return numStr.replace(/(\.[0-9]*?)0+$/, '$1').replace(/\.$/, '');
}

function formatStoredPercent(value: number | undefined): string {
  return value === undefined ? '—' : `${trimTrailingZeros(value.toFixed(2))} %`;
}

export function NodeDetailCard({
  selectedNode,
  activeViewMode,
  sollComputedRoot,
  selectedIstComputedNode,
  selectedSollFreeness,
}: NodeDetailCardProps) {
  if (selectedNode === null) {
    return (
      <div className="empty-state">
        <p>Wähle links einen Knoten aus.</p>
      </div>
    );
  }

  const isSollMode = activeViewMode === 'soll';
  const isIstMode = activeViewMode === 'ist';
  const parentPath = getParentPath(selectedNode.path);
  const selectedSollComputedNode = findNodeByPath(sollComputedRoot, selectedNode.path);

  return (
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
  );
}
