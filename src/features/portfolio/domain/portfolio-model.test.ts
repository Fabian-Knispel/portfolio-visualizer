import { describe, expect, it } from 'vitest';

import {
  appendNodeToTree,
  buildCompareRows,
  buildNodePath,
  computeCompareStatus,
  computeFreenessStatus,
  computePercentageValues,
  computeSollPercentages,
  findNodeByPath,
  formatPercentageValue,
  computeIstNodeValues,
  computeIstPercentages,
  type IstNode,
  type SollNode,
  ROOT_NODE_PATH,
  moveNodeInTree,
  removeNodeFromTree,
  updateNodeInTree,
} from './portfolio-model';

function createStandardIstTree(): IstNode {
  return {
    path: ROOT_NODE_PATH,
    label: 'Portfolio',
    ownValue: 100,
    children: [
      {
        path: 'root/Equity',
        label: 'Equity',
        ownValue: 20,
        children: [
          {
            path: 'root/ETF/Developed',
            label: 'Developed',
            ownValue: 10,
            children: [],
          },
          {
            path: 'root/ETF/Emerging',
            label: 'Emerging',
            ownValue: 10,
            children: [],
          },
        ],
      },
      {
        path: 'root/Bonds',
        label: 'Bonds',
        ownValue: 80,
        children: [],
      },
    ],
  };
}

function createZeroTotalIstTree(): IstNode {
  return {
    path: ROOT_NODE_PATH,
    label: 'Portfolio',
    children: [
      {
        path: 'root/Cash',
        label: 'Cash',
        children: [],
      },
    ],
  };
}

function createSollTree(): SollNode {
  return {
    path: ROOT_NODE_PATH,
    label: 'Portfolio',
    children: [
      {
        path: buildNodePath('Equity'),
        label: 'Equity',
        targetPctOfParent: 60,
        children: [
          {
            path: buildNodePath('Equity', 'USA'),
            label: 'USA',
            targetPctOfParent: 50,
            children: [],
          },
        ],
      },
      {
        path: buildNodePath('Cash'),
        label: 'Cash',
        targetPctOfParent: 40,
        children: [],
      },
    ],
  };
}

function createIstTreeForCompare(): IstNode {
  return {
    path: ROOT_NODE_PATH,
    label: 'Portfolio',
    children: [
      {
        path: buildNodePath('Equity'),
        label: 'Equity',
        ownValue: 700,
        children: [],
      },
      {
        path: buildNodePath('Bonds'),
        label: 'Bonds',
        ownValue: 300,
        children: [],
      },
    ],
  };
}

describe('portfolio percentage computation', () => {
  it('computes total and parent percentages from the shared domain helpers', () => {
    const computed = computeIstPercentages(computeIstNodeValues(createStandardIstTree()));

    expect(computed.nodeValue).toBe(220);
    expect(computed.pctTotal).toBe(1);
    expect(computed.pctOfParent).toBeUndefined();

    const equity = computed.children[0];

    expect(equity.nodeValue).toBe(40);
    expect(equity.pctTotal).toBeCloseTo(40 / 220, 10);
    expect(equity.pctOfParent).toBeCloseTo(40 / 220, 10);

    const usa = equity.children[0];

    expect(usa.nodeValue).toBe(10);
    expect(usa.pctTotal).toBeCloseTo(10 / 220, 10);
    expect(usa.pctOfParent).toBeCloseTo(10 / 40, 10);
  });

  it('computes reusable percentage values for root and child nodes', () => {
    expect(computePercentageValues(220, 220)).toEqual({
      pctTotal: 1,
      pctOfParent: undefined,
    });

    expect(computePercentageValues(40, 220, 220)).toEqual({
      pctTotal: 40 / 220,
      pctOfParent: 40 / 220,
    });
  });

  it('keeps zero totals stable and avoids division by zero', () => {
    const computed = computeIstPercentages(computeIstNodeValues(createZeroTotalIstTree()));

    expect(computed.nodeValue).toBe(0);
    expect(computed.pctTotal).toBe(0);
    expect(computed.pctOfParent).toBeUndefined();

    const cash = computed.children[0];

    expect(cash.nodeValue).toBe(0);
    expect(cash.pctTotal).toBe(0);
    expect(cash.pctOfParent).toBeUndefined();

    expect(computePercentageValues(0, 0, 0)).toEqual({
      pctTotal: 0,
      pctOfParent: undefined,
    });
  });

  it('returns stable percentages when parent value is zero or missing', () => {
    expect(computePercentageValues(30, 120)).toEqual({
      pctTotal: 0.25,
      pctOfParent: undefined,
    });

    expect(computePercentageValues(30, 120, 0)).toEqual({
      pctTotal: 0.25,
      pctOfParent: undefined,
    });
  });

  it('normalizes non-finite own values to zero before aggregating percentages', () => {
    const computed = computeIstPercentages(computeIstNodeValues({
      path: ROOT_NODE_PATH,
      label: 'Portfolio',
      ownValue: Number.NaN,
      children: [
        {
          path: 'root/Invalid',
          label: 'Invalid',
          ownValue: Number.POSITIVE_INFINITY,
          children: [],
        },
        {
          path: 'root/Valid',
          label: 'Valid',
          ownValue: 100,
          children: [],
        },
      ],
    }));

    expect(computed.nodeValue).toBe(100);
    expect(computed.pctTotal).toBe(1);
    expect(computed.children[0].nodeValue).toBe(0);
    expect(computed.children[0].pctTotal).toBe(0);
    expect(computed.children[1].nodeValue).toBe(100);
    expect(computed.children[1].pctTotal).toBe(1);
  });
});

describe('formatPercentageValue', () => {
  it('formats undefined as a dash and rounds to two decimals by default', () => {
    expect(formatPercentageValue(undefined)).toBe('—');
    expect(formatPercentageValue(0.12345)).toBe('12.35 %');
  });

  it('supports custom display precision', () => {
    expect(formatPercentageValue(0.125, 1)).toBe('12.5 %');
  });
});

describe('tree operations', () => {
  it('finds nodes by path and returns null for missing paths', () => {
    const root = createSollTree();

    expect(findNodeByPath(root, buildNodePath('Equity'))?.label).toBe('Equity');
    expect(findNodeByPath(root, buildNodePath('Missing'))).toBeNull();
  });

  it('updates a single node and keeps untouched trees referentially stable on missing paths', () => {
    const root = createSollTree();
    const updated = updateNodeInTree(root, buildNodePath('Cash'), (node) => ({
      ...node,
      targetPctOfParent: 35,
    }));

    expect(findNodeByPath(updated, buildNodePath('Cash'))?.targetPctOfParent).toBe(35);
    expect(findNodeByPath(root, buildNodePath('Cash'))?.targetPctOfParent).toBe(40);

    const unchanged = updateNodeInTree(root, buildNodePath('Missing'), (node) => ({
      ...node,
      label: 'Never reached',
    }));

    expect(unchanged).toBe(root);
  });

  it('removes existing nodes but never removes the technical root', () => {
    const root = createSollTree();
    const withoutUsa = removeNodeFromTree(root, buildNodePath('Equity', 'USA'));

    expect(findNodeByPath(withoutUsa, buildNodePath('Equity', 'USA'))).toBeNull();

    const withoutRoot = removeNodeFromTree(root, ROOT_NODE_PATH);
    expect(withoutRoot).toBe(root);
  });

  it('appends nodes and rejects invalid parent, duplicate path, and cycle-like insertions', () => {
    const root = createSollTree();

    const appended = appendNodeToTree(root, buildNodePath('Equity'), {
      path: buildNodePath('Equity', 'EM'),
      label: 'EM',
      targetPctOfParent: 10,
      children: [],
    });
    expect(findNodeByPath(appended, buildNodePath('Equity', 'EM'))?.label).toBe('EM');

    const missingParent = appendNodeToTree(root, buildNodePath('Missing'), {
      path: buildNodePath('Missing', 'Child'),
      label: 'Child',
      targetPctOfParent: 1,
      children: [],
    });
    expect(missingParent).toBe(root);

    const duplicatePath = appendNodeToTree(root, ROOT_NODE_PATH, {
      path: buildNodePath('Cash'),
      label: 'Duplicate Cash',
      targetPctOfParent: 5,
      children: [],
    });
    expect(duplicatePath).toBe(root);

    const cycleLikeChild: SollNode = {
      path: buildNodePath('Temp'),
      label: 'Temp',
      targetPctOfParent: 5,
      children: [
        {
          path: buildNodePath('Equity', 'USA'),
          label: 'Cycle Reference',
          targetPctOfParent: 5,
          children: [],
        },
      ],
    };
    const cycleRejected = appendNodeToTree(root, buildNodePath('Equity', 'USA'), cycleLikeChild);
    expect(cycleRejected).toBe(root);
  });

  it('moves nodes and rejects invalid move operations including subtree cycles', () => {
    const root = createSollTree();

    const moved = moveNodeInTree(root, buildNodePath('Equity', 'USA'), ROOT_NODE_PATH);
    expect(findNodeByPath(moved, buildNodePath('Equity', 'USA'))).not.toBeNull();
    expect(findNodeByPath(moved, buildNodePath('Equity'))?.children).toHaveLength(0);

    expect(moveNodeInTree(root, ROOT_NODE_PATH, buildNodePath('Cash'))).toBe(root);
    expect(moveNodeInTree(root, buildNodePath('Equity'), buildNodePath('Equity', 'USA'))).toBe(root);
    expect(moveNodeInTree(root, buildNodePath('Missing'), ROOT_NODE_PATH)).toBe(root);
    expect(moveNodeInTree(root, buildNodePath('Cash'), buildNodePath('Missing'))).toBe(root);
  });
});

describe('SOLL percentages and status derivations', () => {
  it('computes effective SOLL percentages for root and children', () => {
    const computed = computeSollPercentages(createSollTree());
    const equity = computed.children[0];
    const usa = equity.children[0];

    expect(computed.pctTotal).toBe(1);
    expect(computed.pctOfParent).toBeUndefined();
    expect(computed.targetPctOfParent).toBeUndefined();
    expect(equity.pctTotal).toBeCloseTo(0.6, 10);
    expect(equity.pctOfParent).toBeCloseTo(0.6, 10);
    expect(equity.targetPct).toBeCloseTo(60, 10);
    expect(usa.pctTotal).toBeCloseTo(0.3, 10);
    expect(usa.pctOfParent).toBeCloseTo(0.5, 10);
    expect(usa.targetPct).toBeCloseTo(30, 10);
  });

  it('supports legacy absolute targetPct values as backward-compatible fallback', () => {
    const computed = computeSollPercentages({
      path: ROOT_NODE_PATH,
      label: 'Portfolio',
      children: [
        {
          path: buildNodePath('Legacy'),
          label: 'Legacy',
          targetPct: 25,
          children: [],
        },
      ],
    });

    const legacy = computed.children[0];

    expect(legacy.pctTotal).toBeCloseTo(0.25, 10);
    expect(legacy.pctOfParent).toBeCloseTo(0.25, 10);
    expect(legacy.targetPctOfParent).toBeCloseTo(25, 10);
  });

  it('keeps freeness child sums stable for raw non-root nodes that only store targetPctOfParent', () => {
    const equity = findNodeByPath(createSollTree(), buildNodePath('Equity'));
    const freeness = equity === null ? null : computeFreenessStatus(equity);

    expect(freeness).toMatchObject({
      path: buildNodePath('Equity'),
      childrenTargetSumPct: 50,
      status: 'free',
    });
  });

  it('derives compare statuses including epsilon-stable equality and missing cases', () => {
    expect(computeCompareStatus('root/A', 0.4, 0.4)).toMatchObject({ status: 'correct' });
    expect(computeCompareStatus('root/A', 0.4, 0.3999999999996)).toMatchObject({ status: 'correct' });
    expect(computeCompareStatus('root/A', 0.4, 0.3)).toMatchObject({ status: 'underweighted' });
    expect(computeCompareStatus('root/A', 0.4, 0.5)).toMatchObject({ status: 'overweighted' });
    expect(computeCompareStatus('root/A', 0.4, 0)).toMatchObject({ status: 'missing_in_ist' });
  });
});

describe('compare rows', () => {
  it('builds deterministic SOLL-vs-IST compare rows including missing nodes in both directions', () => {
    const sollRoot = createSollTree();
    const istRoot = computeIstPercentages(computeIstNodeValues(createIstTreeForCompare()));
    const rows = buildCompareRows(sollRoot, istRoot);

    const equity = rows.find((row) => row.path === buildNodePath('Equity'));
    const cash = rows.find((row) => row.path === buildNodePath('Cash'));
    const bonds = rows.find((row) => row.path === buildNodePath('Bonds'));

    expect(rows[0].path).toBe(ROOT_NODE_PATH);
    expect(rows[0].status).toBe('correct');

    expect(equity).toMatchObject({
      label: 'Equity',
      depth: 1,
      sollTargetPct: 0.6,
      status: 'overweighted',
    });
    expect(equity?.istPct).toBeCloseTo(0.7, 10);

    expect(cash).toMatchObject({
      status: 'missing_in_ist',
      sollTargetPct: 0.4,
      istPct: 0,
    });

    expect(bonds).toMatchObject({
      status: 'extra_in_ist',
      sollTargetPct: 0,
    });
    expect(bonds?.istPct).toBeCloseTo(0.3, 10);
  });
});