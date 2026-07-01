import { describe, expect, it } from 'vitest';

import { ROOT_NODE_PATH, buildNodePath, type SollNode } from './portfolio-model';
import {
  PORTFOLIO_STORAGE_KEY,
  loadPortfolioStorageState,
  type PortfolioStorageEnvelope,
  type StorageLike,
} from './portfolio-storage';

class CountingStorage implements StorageLike {
  private readonly map = new Map<string, string>();

  public writes = 0;

  getItem(key: string): string | null {
    return this.map.has(key) ? this.map.get(key) ?? null : null;
  }

  setItem(key: string, value: string): void {
    this.writes += 1;
    this.map.set(key, value);
  }

  seed(key: string, value: string): void {
    this.map.set(key, value);
  }
}

function createEnvelope(sollRoot: SollNode): PortfolioStorageEnvelope {
  return {
    version: 1,
    state: {
      sollRoot,
      istRoot: null,
    },
  };
}

describe('portfolio storage migration', () => {
  it('migrates legacy targetPct values once and persists targetPctOfParent', () => {
    const storage = new CountingStorage();

    storage.seed(
      PORTFOLIO_STORAGE_KEY,
      JSON.stringify(createEnvelope({
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
                targetPct: 30,
                children: [],
              },
            ],
          },
          {
            path: buildNodePath('Cash'),
            label: 'Cash',
            targetPct: 40,
            children: [],
          },
        ],
      }))
    );

    const firstLoad = loadPortfolioStorageState(storage);

    expect(firstLoad.error).toBeNull();
    expect(firstLoad.state.sollRoot?.children[0].targetPctOfParent).toBeCloseTo(60, 10);
    expect(firstLoad.state.sollRoot?.children[0].children[0].targetPctOfParent).toBeCloseTo(50, 10);
    expect(firstLoad.state.sollRoot?.children[1].targetPctOfParent).toBeCloseTo(40, 10);
    expect(storage.writes).toBe(1);

    const secondLoad = loadPortfolioStorageState(storage);

    expect(secondLoad.error).toBeNull();
    expect(storage.writes).toBe(1);
  });

  it('does not rewrite storage when targetPctOfParent is already present', () => {
    const storage = new CountingStorage();

    storage.seed(
      PORTFOLIO_STORAGE_KEY,
      JSON.stringify(createEnvelope({
        path: ROOT_NODE_PATH,
        label: 'Portfolio',
        children: [
          {
            path: buildNodePath('Equity'),
            label: 'Equity',
            targetPctOfParent: 60,
            children: [],
          },
          {
            path: buildNodePath('Cash'),
            label: 'Cash',
            targetPctOfParent: 40,
            children: [],
          },
        ],
      }))
    );

    const loaded = loadPortfolioStorageState(storage);

    expect(loaded.error).toBeNull();
    expect(storage.writes).toBe(0);
  });

  it('migrates legacy subtrees when parent targetPct is missing but children have absolute targets', () => {
    const storage = new CountingStorage();

    storage.seed(
      PORTFOLIO_STORAGE_KEY,
      JSON.stringify(createEnvelope({
        path: ROOT_NODE_PATH,
        label: 'Portfolio',
        children: [
          {
            path: buildNodePath('Alternatives'),
            label: 'Alternatives',
            children: [
              {
                path: buildNodePath('Alternatives', 'Gold'),
                label: 'Gold',
                targetPct: 15,
                children: [],
              },
              {
                path: buildNodePath('Alternatives', 'Crypto'),
                label: 'Crypto',
                targetPct: 5,
                children: [],
              },
            ],
          },
          {
            path: buildNodePath('Cash'),
            label: 'Cash',
            targetPct: 80,
            children: [],
          },
        ],
      }))
    );

    const loaded = loadPortfolioStorageState(storage);
    const alternatives = loaded.state.sollRoot?.children[0];
    const gold = alternatives?.children[0];
    const crypto = alternatives?.children[1];

    expect(loaded.error).toBeNull();
    expect(alternatives?.targetPctOfParent).toBeCloseTo(20, 10);
    expect(gold?.targetPctOfParent).toBeCloseTo(75, 10);
    expect(crypto?.targetPctOfParent).toBeCloseTo(25, 10);
    expect(storage.writes).toBe(1);
  });
});
