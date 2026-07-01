import { describe, expect, it } from 'vitest';

import {
  ROOT_NODE_PATH,
  buildNodePath,
  computeCompareStatus,
  computeIstNodeValues,
  computeIstPercentages,
  type IstNode,
  type SollNode,
} from '../domain/portfolio-model';
import { buildSunburstDatumForMode, buildSunburstSlices } from '../ui/sunburst-model';
import { createPortfolioStore } from './portfolio-store';

class MemoryStorage {
  private readonly map = new Map<string, string>();

  getItem(key: string): string | null {
    return this.map.has(key) ? this.map.get(key) ?? null : null;
  }

  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }
}

function createSollRoot(): SollNode {
  return {
    path: ROOT_NODE_PATH,
    label: 'Portfolio',
    children: [
      {
        path: buildNodePath('Equity'),
        label: 'Equity',
        targetPct: 60,
        children: [],
      },
      {
        path: buildNodePath('Cash'),
        label: 'Cash',
        targetPct: 40,
        children: [],
      },
    ],
  };
}

function createIstRoot(): IstNode {
  return {
    path: ROOT_NODE_PATH,
    label: 'Portfolio',
    children: [
      {
        path: buildNodePath('Equity'),
        label: 'Equity',
        ownValue: 600,
        children: [],
      },
      {
        path: buildNodePath('Cash'),
        label: 'Cash',
        ownValue: 400,
        children: [],
      },
    ],
  };
}

describe('portfolio store smoke flow', () => {
  it('supports input -> save -> reload -> visual/compare derivations', () => {
    const storage = new MemoryStorage();
    const store = createPortfolioStore(undefined, storage);

    store.setSollRoot(createSollRoot());
    store.setIstRoot(createIstRoot());

    store.updateSollNode(buildNodePath('Equity'), (node) => ({
      ...node,
      targetPct: 55,
    }));
    store.updateIstNode(buildNodePath('Cash'), (node) => ({
      ...node,
      ownValue: 450,
    }));

    store.appendSollNode(ROOT_NODE_PATH, {
      path: buildNodePath('Bonds'),
      label: 'Bonds',
      targetPct: 5,
      children: [],
    });
    store.appendIstNode(ROOT_NODE_PATH, {
      path: buildNodePath('Bonds'),
      label: 'Bonds',
      ownValue: 50,
      children: [],
    });

    const saveSnapshot = store.saveNow();
    expect(saveSnapshot.saveError).toBeNull();

    const reloadedStore = createPortfolioStore(undefined, storage);
    const reloadedState = reloadedStore.getState();

    expect(reloadedState.sollRoot?.children.map((node) => node.label)).toEqual(['Equity', 'Cash', 'Bonds']);
    expect(reloadedState.istRoot?.children.map((node) => node.label)).toEqual(['Equity', 'Cash', 'Bonds']);

    const istComputedRoot = computeIstPercentages(computeIstNodeValues(reloadedState.istRoot as IstNode));
    const sollSunburst = buildSunburstDatumForMode('soll', reloadedState.sollRoot, istComputedRoot);
    const istSunburst = buildSunburstDatumForMode('ist', reloadedState.sollRoot, istComputedRoot);

    expect(sollSunburst).not.toBeNull();
    expect(istSunburst).not.toBeNull();
    expect(buildSunburstSlices(sollSunburst, 200).length).toBeGreaterThan(0);
    expect(buildSunburstSlices(istSunburst, 200).length).toBeGreaterThan(0);

    const equityIst = istComputedRoot.children.find((node) => node.path === buildNodePath('Equity'));
    const compare = computeCompareStatus(buildNodePath('Equity'), 0.55, equityIst?.pctTotal ?? 0);

    expect(compare.status).toBe('underweighted');
    expect(compare.deltaPctPoints).toBeLessThan(0);
  });
});
