import { describe, expect, it } from 'vitest';

import { exampleSollHierarchy } from '../domain/portfolio-model';
import { buildSollSunburstDatum, buildSunburstSlices } from './sunburst-model';

describe('sunburst model', () => {
  it('builds a normalized SOLL tree for hierarchical rendering', () => {
    const root = buildSollSunburstDatum(exampleSollHierarchy);

    expect(root).not.toBeNull();
    expect(root?.size).toBe(0);

    const equity = root?.children[0];
    const usa = equity?.children[0];
    const largeCap = usa?.children[0];

    expect(equity?.size).toBe(0);
    expect(usa?.size).toBe(0);
    expect(largeCap?.size).toBe(20);
  });

  it('computes sunburst slices with consistent percentages', () => {
    const root = buildSollSunburstDatum(exampleSollHierarchy);

    const slices = buildSunburstSlices(root, 200);
    const equity = slices.find((slice) => slice.path === 'root/Equity');
    const largeCap = slices.find((slice) => slice.path === 'root/Equity/USA/Large Cap');

    expect(equity).toMatchObject({
      depth: 1,
      value: 60,
    });
    expect(equity?.pctTotal).toBeCloseTo(0.6, 10);
    expect(equity?.pctOfParent).toBeCloseTo(0.6, 10);

    expect(largeCap).toMatchObject({
      depth: 3,
      value: 20,
    });
    expect(largeCap?.pctTotal).toBeCloseTo(0.2, 10);
    expect(largeCap?.pctOfParent).toBeCloseTo(20 / 35, 10);
  });
});
