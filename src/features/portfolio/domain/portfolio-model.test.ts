import { describe, expect, it } from 'vitest';

import {
  computePercentageValues,
  formatPercentageValue,
  computeIstNodeValues,
  computeIstPercentages,
  type IstNode,
  ROOT_NODE_PATH,
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
            path: 'root/Equity/USA',
            label: 'USA',
            ownValue: 10,
            children: [],
          },
          {
            path: 'root/Equity/Europa',
            label: 'Europa',
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