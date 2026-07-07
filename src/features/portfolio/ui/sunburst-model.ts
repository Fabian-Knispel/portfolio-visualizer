import { hierarchy, partition } from 'd3-hierarchy';
import type { HierarchyRectangularNode } from 'd3-hierarchy';

import { computeSollPercentages } from '../domain/portfolio-model';
import type { IstComputedNode, SollComputedNode, SollNode } from '../domain/portfolio-model';

export type SunburstMode = 'soll' | 'ist';

export interface SunburstNodeDatum {
  path: string;
  label: string;
  size: number;
  children: SunburstNodeDatum[];
  pctTotalOverride?: number;
  pctOfParentOverride?: number;
  isResidual?: boolean;
  residualKind?: 'missing_allocation' | 'direct_position';
}

export interface SunburstSlice {
  path: string;
  label: string;
  depth: number;
  value: number;
  pctTotal: number;
  pctOfParent?: number;
  isResidual: boolean;
  residualKind?: 'missing_allocation' | 'direct_position';
  startAngle: number;
  endAngle: number;
  innerRadius: number;
  outerRadius: number;
  branchPath: string;
}

function normalizeSize(value: number | undefined): number {
  return Number.isFinite(value ?? Number.NaN) && (value ?? 0) > 0 ? (value as number) : 0;
}

function buildBranchPath<TNode extends { path: string }>(node: HierarchyRectangularNode<TNode>): string {
  const branchAncestor = node.ancestors().find((ancestor) => ancestor.depth === 1);

  return branchAncestor?.data.path ?? node.data.path;
}

function createLayoutRoot(root: SunburstNodeDatum, radius: number): HierarchyRectangularNode<SunburstNodeDatum> {
  const layoutRoot = hierarchy(root).sum((node) => node.size);

  return partition<SunburstNodeDatum>().size([Math.PI * 2, radius])(layoutRoot);
}

export function buildSollSunburstDatum(root: SollNode | null): SunburstNodeDatum | null {
  if (root === null) {
    return null;
  }

  const computedRoot = computeSollPercentages(root);

  function transformNode(node: SollComputedNode): SunburstNodeDatum {
    const children = node.children.map(transformNode);
    const nodeSize = normalizeSize(node.pctTotal * 100);
    const childrenSize = node.children.reduce((sum, child) => sum + normalizeSize(child.pctTotal * 100), 0);
    const residualSize = normalizeSize(nodeSize - childrenSize);

    if (node.children.length > 0 && residualSize > 0) {
      children.push({
        path: `${node.path}/__unallocated__`,
        label: 'Fehlende Allokation',
        size: residualSize,
        pctTotalOverride: residualSize / 100,
        pctOfParentOverride: nodeSize === 0 ? undefined : residualSize / nodeSize,
        children: [],
        isResidual: true,
        residualKind: 'missing_allocation',
      });
    }

    return {
      path: node.path,
      label: node.label,
      size: node.children.length === 0 ? nodeSize : 0,
      pctTotalOverride: node.pctTotal,
      pctOfParentOverride: node.pctOfParent,
      children,
    };
  }

  return transformNode(computedRoot);
}

export function buildIstSunburstDatum(root: IstComputedNode | null): SunburstNodeDatum | null {
  if (root === null) {
    return null;
  }

  function transformNode(node: IstComputedNode): SunburstNodeDatum {
    const children = node.children.map(transformNode);
    const ownSize = normalizeSize(node.ownValue);

    if (node.children.length > 0 && ownSize > 0) {
      children.push({
        path: `${node.path}/__direct_position__`,
        label: 'Direktposition',
        size: ownSize,
        children: [],
        isResidual: true,
        residualKind: 'direct_position',
      });
    }

    return {
      path: node.path,
      label: node.label,
      size: node.children.length === 0 ? ownSize : 0,
      children,
    };
  }

  return transformNode(root);
}

export function buildSunburstDatumForMode(
  mode: SunburstMode,
  sollRoot: SollNode | null,
  istRoot: IstComputedNode | null
): SunburstNodeDatum | null {
  return mode === 'soll' ? buildSollSunburstDatum(sollRoot) : buildIstSunburstDatum(istRoot);
}

export function buildSunburstSlices(root: SunburstNodeDatum | null, radius: number): SunburstSlice[] {
  if (root === null) {
    return [];
  }

  const layoutRoot = createLayoutRoot(root, radius);
  const totalValue = layoutRoot.value ?? 0;

  return layoutRoot
    .descendants()
    .filter((node) => node.depth > 0)
    .map((node) => {
      const value = node.value ?? 0;
      const parentValue = node.parent?.value ?? 0;

      return {
        path: node.data.path,
        label: node.data.label,
        depth: node.depth,
        value,
        pctTotal: node.data.pctTotalOverride ?? (totalValue === 0 ? 0 : value / totalValue),
        pctOfParent:
          node.data.pctOfParentOverride
          ?? (node.parent === null || parentValue === 0 ? undefined : value / parentValue),
        isResidual: node.data.isResidual === true,
        residualKind: node.data.residualKind,
        startAngle: node.x0,
        endAngle: node.x1,
        innerRadius: node.y0,
        outerRadius: node.y1,
        branchPath: buildBranchPath(node),
      };
    });
}
