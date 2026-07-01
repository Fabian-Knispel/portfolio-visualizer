import { hierarchy, partition } from 'd3';
import type { HierarchyRectangularNode } from 'd3';

import type { IstComputedNode, SollNode } from '../domain/portfolio-model';

export interface SunburstNodeDatum {
  path: string;
  label: string;
  size: number;
  children: SunburstNodeDatum[];
}

export interface SunburstSlice {
  path: string;
  label: string;
  depth: number;
  value: number;
  pctTotal: number;
  pctOfParent?: number;
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

  function transformNode(node: SollNode): SunburstNodeDatum {
    const children = node.children.map(transformNode);

    return {
      path: node.path,
      label: node.label,
      size: children.length === 0 ? normalizeSize(node.targetPct) : 0,
      children,
    };
  }

  return transformNode(root);
}

export function buildIstSunburstDatum(root: IstComputedNode | null): SunburstNodeDatum | null {
  if (root === null) {
    return null;
  }

  function transformNode(node: IstComputedNode): SunburstNodeDatum {
    return {
      path: node.path,
      label: node.label,
      size: normalizeSize(node.ownValue),
      children: node.children.map(transformNode),
    };
  }

  return transformNode(root);
}

export function buildSunburstSlices(root: SunburstNodeDatum | null, radius: number): SunburstSlice[] {
  if (root === null) {
    return [];
  }

  const layoutRoot = createLayoutRoot(root, radius);
  const totalValue = layoutRoot.value ?? 0;

  return layoutRoot
    .descendants()
    .slice(1)
    .map((node) => {
      const value = node.value ?? 0;
      const parentValue = node.parent?.value ?? 0;

      return {
        path: node.data.path,
        label: node.data.label,
        depth: node.depth,
        value,
        pctTotal: totalValue === 0 ? 0 : value / totalValue,
        pctOfParent: node.parent === null || parentValue === 0 ? undefined : value / parentValue,
        startAngle: node.x0,
        endAngle: node.x1,
        innerRadius: node.y0,
        outerRadius: node.y1,
        branchPath: buildBranchPath(node),
      };
    });
}
