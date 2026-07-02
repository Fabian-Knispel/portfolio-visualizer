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

export interface SollComputedNode extends PortfolioNodeBase<SollComputedNode> {
  targetPct?: number;
  targetPctOfParent?: number;
  pctTotal: number;
  pctOfParent?: number;
}

export type PortfolioTab = 'soll' | 'ist' | 'vergleich';

export type FreenessStatus = 'correct' | 'free' | 'overallocated';

export type CompareStatus = 'correct' | 'underweighted' | 'overweighted' | 'missing_in_ist' | 'extra_in_ist';

export interface CompareResult {
  path: NodePath;
  sollTargetPct: number;
  istPct: number;
  deltaPctPoints: number;
  status: CompareStatus;
}

export interface CompareRow extends CompareResult {
  label: string;
  depth: number;
}

export interface FreenessResult {
  path: NodePath;
  parentTargetPct: number;
  childrenTargetSumPct: number;
  status: FreenessStatus;
}

export type TreeNodeUpdater<TNode extends PortfolioNodeBase<TNode>> = (node: TNode) => TNode;

export interface PortfolioState {
  sollRoot: SollNode | null;
  istRoot: IstNode | null;
  activeViewMode: PortfolioTab;
}

const ZERO = 0;
const HUNDRED = 100;
const EPSILON = 1e-9;
export const DEFAULT_PERCENTAGE_DIGITS = 2 as const;

function normalizeNumber(value: number | undefined): number {
  return Number.isFinite(value ?? Number.NaN) ? (value as number) : ZERO;
}

function computePercentageValue(numerator: number, denominator: number): number {
  return denominator === ZERO ? ZERO : numerator / denominator;
}

function areNumbersEqual(left: number, right: number): boolean {
  return Math.abs(left - right) <= EPSILON;
}

function toRatioPercentage(value: number | undefined): number {
  return normalizeNumber(value) / HUNDRED;
}

function hasFiniteNumber(value: number | undefined): value is number {
  return Number.isFinite(value ?? Number.NaN);
}

function computeAbsoluteTargetPct(node: SollNode, parentAbsoluteTargetPct?: number): number {
  if (isRootNodePath(node.path)) {
    return HUNDRED;
  }

  if (hasFiniteNumber(node.targetPctOfParent) && hasFiniteNumber(parentAbsoluteTargetPct)) {
    return parentAbsoluteTargetPct * (node.targetPctOfParent / HUNDRED);
  }

  return normalizeNumber(node.targetPct);
}

function computeTargetPctOfParent(node: SollNode, parentAbsoluteTargetPct?: number): number | undefined {
  if (isRootNodePath(node.path) || !hasFiniteNumber(parentAbsoluteTargetPct) || parentAbsoluteTargetPct === ZERO) {
    return undefined;
  }

  if (hasFiniteNumber(node.targetPctOfParent)) {
    return node.targetPctOfParent;
  }

  if (!hasFiniteNumber(node.targetPct)) {
    return undefined;
  }

  return (node.targetPct / parentAbsoluteTargetPct) * HUNDRED;
}

export interface ComputedPercentageValues {
  pctTotal: number;
  pctOfParent?: number;
}

export function computePercentageValues(
  nodeValue: number,
  totalValue: number,
  parentNodeValue?: number
): ComputedPercentageValues {
  const pctTotal = computePercentageValue(nodeValue, totalValue);
  const pctOfParent = parentNodeValue === undefined || parentNodeValue === ZERO
    ? undefined
    : computePercentageValue(nodeValue, parentNodeValue);

  return {
    pctTotal,
    pctOfParent,
  };
}

export function formatPercentageValue(value: number | undefined, digits: number = DEFAULT_PERCENTAGE_DIGITS): string {
  if (value === undefined) {
    return '—';
  }

  return `${(value * 100).toFixed(digits)} %`;
}

function computeIstNodeValuesInternal(node: IstNode): IstComputedNode {
  const computedChildren = node.children.map(computeIstNodeValuesInternal);
  const childrenNodeValue = computedChildren.reduce((sum, child) => sum + child.nodeValue, ZERO);
  const nodeValue = normalizeNumber(node.ownValue) + childrenNodeValue;

  return {
    ...node,
    children: computedChildren,
    ownValue: node.ownValue,
    nodeValue,
    pctTotal: ZERO,
    pctOfParent: undefined,
  };
}

function annotateIstPercentages(node: IstComputedNode, totalValue: number, parentNodeValue?: number): IstComputedNode {
  const { pctTotal, pctOfParent } = computePercentageValues(node.nodeValue, totalValue, parentNodeValue);

  return {
    ...node,
    pctTotal,
    pctOfParent,
    children: node.children.map((child) => annotateIstPercentages(child, totalValue, node.nodeValue)),
  };
}

export function buildNodePath(...segments: string[]): NodePath {
  const cleanedSegments = segments.map((segment) => segment.trim()).filter(Boolean);

  if (cleanedSegments.length === 0) {
    return ROOT_NODE_PATH;
  }

  return [ROOT_NODE_PATH, ...cleanedSegments].join('/');
}

export function isRootNodePath(path: NodePath): boolean {
  return path === ROOT_NODE_PATH;
}

function findNodeInTree<TNode extends PortfolioNodeBase<TNode>>(root: TNode, path: NodePath): TNode | null {
  if (root.path === path) {
    return root;
  }

  for (const child of root.children) {
    const foundNode = findNodeInTree(child, path);

    if (foundNode !== null) {
      return foundNode;
    }
  }

  return null;
}

function isPathInsideSubtree(rootPath: NodePath, candidatePath: NodePath): boolean {
  return candidatePath === rootPath || candidatePath.startsWith(`${rootPath}/`);
}

function collectNodePaths<TNode extends PortfolioNodeBase<TNode>>(node: TNode): Set<NodePath> {
  const paths = new Set<NodePath>();

  function visit(currentNode: TNode): void {
    paths.add(currentNode.path);
    currentNode.children.forEach(visit);
  }

  visit(node);

  return paths;
}

export function findNodeByPath<TNode extends PortfolioNodeBase<TNode>>(root: TNode, path: NodePath): TNode | null {
  return findNodeInTree(root, path);
}

function updateNodeInTreeInternal<TNode extends PortfolioNodeBase<TNode>>(
  root: TNode,
  path: NodePath,
  updater: TreeNodeUpdater<TNode>
): { nextNode: TNode; changed: boolean } {
  if (root.path === path) {
    return {
      nextNode: updater(root),
      changed: true,
    };
  }

  let hasChanged = false;
  const nextChildren = root.children.map((child) => {
    const result = updateNodeInTreeInternal(child, path, updater);

    if (result.changed) {
      hasChanged = true;
    }

    return result.nextNode;
  });

  if (!hasChanged) {
    return {
      nextNode: root,
      changed: false,
    };
  }

  return {
    nextNode: {
      ...root,
      children: nextChildren,
    },
    changed: true,
  };
}

export function updateNodeInTree<TNode extends PortfolioNodeBase<TNode>>(
  root: TNode,
  path: NodePath,
  updater: TreeNodeUpdater<TNode>
): TNode {
  return updateNodeInTreeInternal(root, path, updater).nextNode;
}

function removeNodeInTreeInternal<TNode extends PortfolioNodeBase<TNode>>(
  root: TNode,
  path: NodePath
): { nextNode: TNode | null; changed: boolean } {
  if (root.path === path) {
    return {
      nextNode: isRootNodePath(path) ? root : null,
      changed: !isRootNodePath(path),
    };
  }

  let hasChanged = false;
  const nextChildren: TNode[] = [];

  root.children.forEach((child) => {
    const result = removeNodeInTreeInternal(child, path);

    if (result.changed) {
      hasChanged = true;
    }

    if (result.nextNode !== null) {
      nextChildren.push(result.nextNode);
    }
  });

  if (!hasChanged) {
    return {
      nextNode: root,
      changed: false,
    };
  }

  return {
    nextNode: {
      ...root,
      children: nextChildren,
    },
    changed: true,
  };
}

export function removeNodeFromTree<TNode extends PortfolioNodeBase<TNode>>(root: TNode, path: NodePath): TNode {
  return removeNodeInTreeInternal(root, path).nextNode ?? root;
}

function appendNodeToTreeInternal<TNode extends PortfolioNodeBase<TNode>>(
  root: TNode,
  parentPath: NodePath,
  childNode: TNode
): { nextNode: TNode; changed: boolean } {
  if (root.path === parentPath) {
    return {
      nextNode: {
        ...root,
        children: [...root.children, childNode],
      },
      changed: true,
    };
  }

  let hasChanged = false;
  const nextChildren = root.children.map((child) => {
    const result = appendNodeToTreeInternal(child, parentPath, childNode);

    if (result.changed) {
      hasChanged = true;
    }

    return result.nextNode;
  });

  if (!hasChanged) {
    return {
      nextNode: root,
      changed: false,
    };
  }

  return {
    nextNode: {
      ...root,
      children: nextChildren,
    },
    changed: true,
  };
}

export function appendNodeToTree<TNode extends PortfolioNodeBase<TNode>>(
  root: TNode,
  parentPath: NodePath,
  childNode: TNode
): TNode {
  const parentNode = findNodeInTree(root, parentPath);

  if (parentNode === null) {
    return root;
  }

  if (findNodeInTree(root, childNode.path) !== null) {
    return root;
  }

  const childSubtreePaths = collectNodePaths(childNode);

  if (childSubtreePaths.has(parentPath)) {
    return root;
  }

  return appendNodeToTreeInternal(root, parentPath, childNode).nextNode;
}

export function moveNodeInTree<TNode extends PortfolioNodeBase<TNode>>(
  root: TNode,
  path: NodePath,
  newParentPath: NodePath
): TNode {
  if (isRootNodePath(path) || path === newParentPath || isPathInsideSubtree(path, newParentPath)) {
    return root;
  }

  const nodeToMove = findNodeInTree(root, path);

  if (nodeToMove === null || findNodeInTree(root, newParentPath) === null) {
    return root;
  }

  const treeWithoutNode = removeNodeFromTree(root, path);

  return appendNodeToTree(treeWithoutNode, newParentPath, nodeToMove);
}

export function computeIstNodeValues(root: IstNode): IstComputedNode {
  return computeIstNodeValuesInternal(root);
}

export function computeIstPercentages(root: IstComputedNode): IstComputedNode {
  return annotateIstPercentages(root, root.nodeValue);
}

export function computeSollPercentages(root: SollNode): SollComputedNode {
  function annotate(node: SollNode, parentAbsoluteTargetPct?: number): SollComputedNode {
    const absoluteTargetPct = computeAbsoluteTargetPct(node, parentAbsoluteTargetPct);
    const pctTotal = toRatioPercentage(absoluteTargetPct);
    const targetPctOfParent = computeTargetPctOfParent(node, parentAbsoluteTargetPct);
    const pctOfParent = targetPctOfParent === undefined ? undefined : toRatioPercentage(targetPctOfParent);

    return {
      ...node,
      targetPct: absoluteTargetPct,
      targetPctOfParent,
      pctTotal,
      pctOfParent,
      children: node.children.map((child) => annotate(child, absoluteTargetPct)),
    };
  }

  return annotate(root);
}

export function computeFreenessStatus(node: SollNode): FreenessResult | null {
  if (node.children.length === 0) {
    return null;
  }

  const parentTargetPct = HUNDRED;
  const parentAbsoluteTargetPct = isRootNodePath(node.path) ? HUNDRED : normalizeNumber(node.targetPct);
  const childrenTargetSumPct = node.children.reduce((sum, child) => {
    const childPctOfParent = computeTargetPctOfParent(child, parentAbsoluteTargetPct);

    return sum + normalizeNumber(childPctOfParent);
  }, ZERO);

  let status: FreenessStatus = 'correct';

  if (childrenTargetSumPct < parentTargetPct && !areNumbersEqual(childrenTargetSumPct, parentTargetPct)) {
    status = 'free';
  } else if (childrenTargetSumPct > parentTargetPct && !areNumbersEqual(childrenTargetSumPct, parentTargetPct)) {
    status = 'overallocated';
  }

  return {
    path: node.path,
    parentTargetPct,
    childrenTargetSumPct,
    status,
  };
}

export function computeCompareStatus(path: NodePath, sollTargetPct: number, istPct: number): CompareResult {
  let status: CompareStatus = 'correct';

  if (areNumbersEqual(istPct, ZERO) && sollTargetPct > ZERO && !areNumbersEqual(sollTargetPct, ZERO)) {
    status = 'missing_in_ist';
  } else if (istPct < sollTargetPct && !areNumbersEqual(istPct, sollTargetPct)) {
    status = 'underweighted';
  } else if (istPct > sollTargetPct && !areNumbersEqual(istPct, sollTargetPct)) {
    status = 'overweighted';
  }

  return {
    path,
    sollTargetPct,
    istPct,
    deltaPctPoints: istPct - sollTargetPct,
    status,
  };
}

interface FlatTreeEntry<TNode extends PortfolioNodeBase<TNode>> {
  node: TNode;
  depth: number;
}

function flattenTree<TNode extends PortfolioNodeBase<TNode>>(root: TNode): FlatTreeEntry<TNode>[] {
  const entries: FlatTreeEntry<TNode>[] = [];

  function walk(node: TNode, depth: number): void {
    entries.push({ node, depth });
    node.children.forEach((child) => walk(child, depth + 1));
  }

  walk(root, 0);

  return entries;
}

export function buildCompareRows(sollRoot: SollNode | null, istRoot: IstComputedNode | null): CompareRow[] {
  const computedSollRoot = sollRoot === null ? null : computeSollPercentages(sollRoot);
  const sollEntries = computedSollRoot === null ? [] : flattenTree(computedSollRoot);
  const istEntries = istRoot === null ? [] : flattenTree(istRoot);

  const sollMap = new Map<NodePath, FlatTreeEntry<SollComputedNode>>();
  const istMap = new Map<NodePath, FlatTreeEntry<IstComputedNode>>();

  sollEntries.forEach((entry) => {
    sollMap.set(entry.node.path, entry);
  });

  istEntries.forEach((entry) => {
    istMap.set(entry.node.path, entry);
  });

  const orderedPaths: NodePath[] = [
    ...sollEntries.map((entry) => entry.node.path),
    ...istEntries
      .map((entry) => entry.node.path)
      .filter((path) => !sollMap.has(path)),
  ];

  return orderedPaths.map((path) => {
    const sollEntry = sollMap.get(path);
    const istEntry = istMap.get(path);
    const label = sollEntry?.node.label ?? istEntry?.node.label ?? path;
    const depth = sollEntry?.depth ?? istEntry?.depth ?? 0;

    if (sollEntry === undefined && istEntry !== undefined) {
      const istPct = istEntry.node.pctTotal;

      return {
        path,
        label,
        depth,
        sollTargetPct: ZERO,
        istPct,
        deltaPctPoints: istPct,
        status: 'extra_in_ist',
      };
    }

    const sollTargetPct = sollEntry?.node.pctTotal ?? ZERO;
    const istPct = istEntry?.node.pctTotal ?? ZERO;
    const compare = computeCompareStatus(path, sollTargetPct, istPct);

    return {
      ...compare,
      label,
      depth,
    };
  });
}

export const exampleSollHierarchy: SollNode = {
  path: ROOT_NODE_PATH,
  label: 'Portfolio',
  targetPctOfParent: HUNDRED,
  children: [
    {
      path: buildNodePath('Equity'),
      label: 'Equity',
      targetPct: 60,
      targetPctOfParent: 60,
      children: [
        {
          path: buildNodePath('Equity', 'USA'),
          label: 'USA',
          targetPct: 35,
          targetPctOfParent: 58.3333333333,
          children: [
            {
              path: buildNodePath('Equity', 'USA', 'Large Cap'),
              label: 'Large Cap',
              targetPct: 20,
              targetPctOfParent: 57.1428571429,
              children: [],
            },
            {
              path: buildNodePath('Equity', 'USA', 'Small Cap'),
              label: 'Small Cap',
              targetPct: 15,
              targetPctOfParent: 42.8571428571,
              children: [],
            },
          ],
        },
        {
          path: buildNodePath('Equity', 'Europe'),
          label: 'Europe',
          targetPct: 25,
          targetPctOfParent: 41.6666666667,
          children: [
            {
              path: buildNodePath('Equity', 'Europe', 'Core'),
              label: 'Core',
              targetPct: 25,
              targetPctOfParent: 100,
              children: [],
            },
          ],
        },
      ],
    },
    {
      path: buildNodePath('Bonds'),
      label: 'Bonds',
      targetPct: 40,
      targetPctOfParent: 40,
      children: [
        {
          path: buildNodePath('Bonds', 'Government'),
          label: 'Government',
          targetPct: 25,
          targetPctOfParent: 62.5,
          children: [
            {
              path: buildNodePath('Bonds', 'Government', 'Short Duration'),
              label: 'Short Duration',
              targetPct: 25,
              targetPctOfParent: 100,
              children: [],
            },
          ],
        },
        {
          path: buildNodePath('Bonds', 'Corporate'),
          label: 'Corporate',
          targetPct: 15,
          targetPctOfParent: 37.5,
          children: [
            {
              path: buildNodePath('Bonds', 'Corporate', 'Investment Grade'),
              label: 'Investment Grade',
              targetPct: 15,
              targetPctOfParent: 100,
              children: [],
            },
          ],
        },
      ],
    },
  ],
};

export const exampleIstHierarchy: IstNode = {
  path: ROOT_NODE_PATH,
  label: 'Portfolio',
  children: [
    {
      path: buildNodePath('Equity'),
      label: 'Equity',
      ownValue: 100,
      children: [
        {
          path: buildNodePath('Equity', 'USA'),
          label: 'USA',
          ownValue: 300,
          children: [
            {
              path: buildNodePath('Equity', 'USA', 'Large Cap'),
              label: 'Large Cap',
              ownValue: 200,
              children: [],
            },
            {
              path: buildNodePath('Equity', 'USA', 'Small Cap'),
              label: 'Small Cap',
              ownValue: 100,
              children: [],
            },
          ],
        },
        {
          path: buildNodePath('Equity', 'Europe'),
          label: 'Europe',
          ownValue: 200,
          children: [
            {
              path: buildNodePath('Equity', 'Europe', 'Core'),
              label: 'Core',
              ownValue: 100,
              children: [],
            },
          ],
        },
      ],
    },
    {
      path: buildNodePath('Bonds'),
      label: 'Bonds',
      ownValue: 300,
      children: [
        {
          path: buildNodePath('Bonds', 'Government'),
          label: 'Government',
          ownValue: 200,
          children: [
            {
              path: buildNodePath('Bonds', 'Government', 'Short Duration'),
              label: 'Short Duration',
              ownValue: 200,
              children: [],
            },
          ],
        },
        {
          path: buildNodePath('Bonds', 'Corporate'),
          label: 'Corporate',
          ownValue: 100,
          children: [
            {
              path: buildNodePath('Bonds', 'Corporate', 'Investment Grade'),
              label: 'Investment Grade',
              ownValue: 100,
              children: [],
            },
          ],
        },
      ],
    },
  ],
};
