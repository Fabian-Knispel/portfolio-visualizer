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

export interface PortfolioState {
  sollRoot: SollNode | null;
  istRoot: IstNode | null;
  activeViewMode: 'soll' | 'ist' | 'vergleich';
}

const ZERO = 0;

function normalizeNumber(value: number | undefined): number {
  return Number.isFinite(value ?? Number.NaN) ? (value as number) : ZERO;
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
  const pctTotal = totalValue === ZERO ? ZERO : node.nodeValue / totalValue;
  const pctOfParent = parentNodeValue === undefined || parentNodeValue === ZERO ? undefined : node.nodeValue / parentNodeValue;

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

export function computeIstNodeValues(root: IstNode): IstComputedNode {
  return computeIstNodeValuesInternal(root);
}

export function computeIstPercentages(root: IstComputedNode): IstComputedNode {
  return annotateIstPercentages(root, root.nodeValue);
}

export function computeFreenessStatus(node: SollNode): FreenessResult | null {
  if (node.children.length === 0) {
    return null;
  }

  const parentTargetPct = normalizeNumber(node.targetPct);
  const childrenTargetSumPct = node.children.reduce((sum, child) => sum + normalizeNumber(child.targetPct), ZERO);

  let status: FreenessStatus = 'correct';

  if (childrenTargetSumPct < parentTargetPct) {
    status = 'free';
  } else if (childrenTargetSumPct > parentTargetPct) {
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

  if (istPct === ZERO && sollTargetPct > ZERO) {
    status = 'missing_in_ist';
  } else if (istPct < sollTargetPct) {
    status = 'underweighted';
  } else if (istPct > sollTargetPct) {
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

export const exampleSollHierarchy: SollNode = {
  path: ROOT_NODE_PATH,
  label: 'Portfolio',
  children: [
    {
      path: buildNodePath('Equity'),
      label: 'Equity',
      targetPct: 60,
      children: [
        {
          path: buildNodePath('Equity', 'USA'),
          label: 'USA',
          targetPct: 35,
          children: [
            {
              path: buildNodePath('Equity', 'USA', 'Large Cap'),
              label: 'Large Cap',
              targetPct: 20,
              children: [],
            },
            {
              path: buildNodePath('Equity', 'USA', 'Small Cap'),
              label: 'Small Cap',
              targetPct: 15,
              children: [],
            },
          ],
        },
        {
          path: buildNodePath('Equity', 'Europe'),
          label: 'Europe',
          targetPct: 25,
          children: [
            {
              path: buildNodePath('Equity', 'Europe', 'Core'),
              label: 'Core',
              targetPct: 25,
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
      children: [
        {
          path: buildNodePath('Bonds', 'Government'),
          label: 'Government',
          targetPct: 25,
          children: [
            {
              path: buildNodePath('Bonds', 'Government', 'Short Duration'),
              label: 'Short Duration',
              targetPct: 25,
              children: [],
            },
          ],
        },
        {
          path: buildNodePath('Bonds', 'Corporate'),
          label: 'Corporate',
          targetPct: 15,
          children: [
            {
              path: buildNodePath('Bonds', 'Corporate', 'Investment Grade'),
              label: 'Investment Grade',
              targetPct: 15,
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
