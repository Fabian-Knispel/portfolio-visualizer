import { describe, expect, it } from 'vitest';

import { ROOT_NODE_PATH, buildNodePath, computeIstNodeValues, computeIstPercentages, exampleIstHierarchy, exampleSollHierarchy, type SollNode } from '../domain/portfolio-model';
import { buildIstSunburstDatum, buildSollSunburstDatum, buildSunburstDatumForMode, buildSunburstSlices } from './sunburst-model';

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
    expect(largeCap?.size).toBeCloseTo(20, 10);
  });

  it('derives SOLL leaf sizes from parent-relative targets', () => {
    const sollRoot: SollNode = {
      path: ROOT_NODE_PATH,
      label: 'Portfolio',
      targetPctOfParent: 100,
      children: [
        {
          path: buildNodePath('Cash'),
          label: 'Cash',
          targetPctOfParent: 20,
          children: [
            {
              path: buildNodePath('Cash', 'Festgeld'),
              label: 'Festgeld',
              targetPctOfParent: 60,
              children: [],
            },
            {
              path: buildNodePath('Cash', 'Tagesgeld'),
              label: 'Tagesgeld',
              targetPctOfParent: 40,
              children: [],
            },
          ],
        },
        {
          path: buildNodePath('Equity'),
          label: 'Equity',
          targetPctOfParent: 80,
          children: [
            {
              path: buildNodePath('Equity', 'Core'),
              label: 'Core',
              targetPctOfParent: 100,
              children: [],
            },
          ],
        },
      ],
    };

    const root = buildSollSunburstDatum(sollRoot);
    const slices = buildSunburstSlices(root, 200);
    const cash = slices.find((slice) => slice.path === buildNodePath('Cash'));
    const festgeld = slices.find((slice) => slice.path === buildNodePath('Cash', 'Festgeld'));
    const tagesgeld = slices.find((slice) => slice.path === buildNodePath('Cash', 'Tagesgeld'));

    expect(cash?.pctTotal).toBeCloseTo(0.2, 10);
    expect(festgeld?.pctTotal).toBeCloseTo(0.12, 10);
    expect(tagesgeld?.pctTotal).toBeCloseTo(0.08, 10);
  });

  it('keeps parent slices at their own total even when children do not fill them completely', () => {
    const sollRoot: SollNode = {
      path: ROOT_NODE_PATH,
      label: 'Portfolio',
      targetPctOfParent: 100,
      children: [
        {
          path: buildNodePath('Equity'),
          label: 'Equity',
          targetPctOfParent: 40,
          children: [
            {
              path: buildNodePath('Equity', 'Core'),
              label: 'Core',
              targetPctOfParent: 25,
              children: [],
            },
          ],
        },
        {
          path: buildNodePath('Cash'),
          label: 'Cash',
          targetPctOfParent: 60,
          children: [],
        },
      ],
    };

    const root = buildSollSunburstDatum(sollRoot);
    const slices = buildSunburstSlices(root, 200);
    const equity = slices.find((slice) => slice.path === buildNodePath('Equity'));
    const core = slices.find((slice) => slice.path === buildNodePath('Equity', 'Core'));
    const residual = slices.find((slice) => slice.path === `${buildNodePath('Equity')}/__unallocated__`);

    expect(equity?.pctTotal).toBeCloseTo(0.4, 10);
    expect(core?.pctTotal).toBeCloseTo(0.1, 10);
    expect(core?.pctOfParent).toBeCloseTo(0.25, 10);
    expect(residual).toMatchObject({
      label: 'Fehlende Allokation',
      isResidual: true,
    });
    expect(residual?.pctTotal).toBeCloseTo(0.3, 10);
    expect(residual?.pctOfParent).toBeCloseTo(0.75, 10);
  });

  it('selects the correct datum for the active sunburst mode', () => {
    const sollRoot = buildSunburstDatumForMode('soll', exampleSollHierarchy, null);
    const istRoot = buildSunburstDatumForMode('ist', null, computeIstPercentages(computeIstNodeValues(exampleIstHierarchy)));

    expect(sollRoot?.children[0].size).toBe(0);
    expect(istRoot?.children[0].size).toBe(0);
  });

  it('builds a normalized IST tree for hierarchical rendering', () => {
    const root = buildIstSunburstDatum(computeIstPercentages(computeIstNodeValues(exampleIstHierarchy)));

    expect(root).not.toBeNull();
    expect(root?.size).toBe(0);

    const equity = root?.children[0];
    const equityDirect = equity?.children.find((child) => child.path.endsWith('/__direct_position__'));
    const largeCap = equity?.children[0]?.children[0];

    expect(equity?.size).toBe(0);
    expect(equityDirect?.size).toBe(100);
    expect(largeCap?.size).toBe(200);
  });

  it('adds an IST direct-position residual slice for parent own values', () => {
    const root = buildIstSunburstDatum(computeIstPercentages(computeIstNodeValues(exampleIstHierarchy)));
    const slices = buildSunburstSlices(root, 200);
    const equity = slices.find((slice) => slice.path === buildNodePath('Equity'));
    const equityDirect = slices.find((slice) => slice.path === `${buildNodePath('Equity')}/__direct_position__`);

    expect(equity?.pctTotal).toBeCloseTo(1000 / 1900, 10);
    expect(equityDirect).toMatchObject({
      label: 'Direktposition',
      isResidual: true,
      residualKind: 'direct_position',
    });
    expect(equityDirect?.pctTotal).toBeCloseTo(100 / 1900, 10);
    expect(equityDirect?.pctOfParent).toBeCloseTo(0.1, 10);
  });

  it('computes sunburst slices with consistent percentages', () => {
    const root = buildSollSunburstDatum(exampleSollHierarchy);

    const slices = buildSunburstSlices(root, 200);
    const equity = slices.find((slice) => slice.path === 'root/Equity');
    const largeCap = slices.find((slice) => slice.path === 'root/Equity/USA/Large Cap');

    expect(equity?.depth).toBe(1);
    expect(equity?.value).toBeCloseTo(60, 10);
    expect(equity?.pctTotal).toBeCloseTo(0.6, 10);
    expect(equity?.pctOfParent).toBeCloseTo(0.6, 10);

    expect(largeCap?.depth).toBe(3);
    expect(largeCap?.value).toBeCloseTo(20, 10);
    expect(largeCap?.pctTotal).toBeCloseTo(0.2, 10);
    expect(largeCap?.pctOfParent).toBeCloseTo(20 / 35, 10);
  });
});
