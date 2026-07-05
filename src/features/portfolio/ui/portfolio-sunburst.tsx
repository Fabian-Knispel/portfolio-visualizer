import { useEffect, useMemo, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { arc } from 'd3-shape';

import { formatPercentageValue } from '../domain/portfolio-model';
import type { SunburstNodeDatum, SunburstSlice } from './sunburst-model';
import { buildSunburstSlices } from './sunburst-model';

interface PortfolioSunburstProps {
  root: SunburstNodeDatum | null;
  title: string;
  hint: string;
}

interface TooltipState {
  slice: SunburstSlice;
  x: number;
  y: number;
}

const VIEWBOX_SIZE = 720;
const CHART_RADIUS = VIEWBOX_SIZE / 2 - 24;

function canRenderSliceLabel(slice: SunburstSlice): boolean {
  const angleSpan = slice.endAngle - slice.startAngle;
  const radialSpan = slice.outerRadius - slice.innerRadius;

  if (slice.isResidual) {
    return angleSpan >= 0.24 && radialSpan >= 28;
  }

  return angleSpan >= 0.18 && radialSpan >= 24;
}

function getSliceLabel(slice: SunburstSlice): string {
  if (slice.isResidual) {
    return slice.residualKind === 'direct_position' ? 'Direkt' : 'Fehlt';
  }

  return slice.label.length > 14 ? `${slice.label.slice(0, 12)}…` : slice.label;
}

function getResidualHint(slice: SunburstSlice): string {
  if (slice.residualKind === 'direct_position') {
    return 'Dieser Anteil liegt als Direktposition auf dem Parent.';
  }

  return 'Dieser Anteil ist im Parent noch nicht allokiert.';
}

function getResidualParentCaption(slice: SunburstSlice): string {
  return slice.residualKind === 'direct_position' ? 'Direkt am Parent' : 'Fehlt im Parent';
}

export function PortfolioSunburst({ root, title, hint }: PortfolioSunburstProps) {
  const chartRef = useRef<HTMLDivElement | null>(null);
  const [hoveredSlice, setHoveredSlice] = useState<TooltipState | null>(null);

  function getTooltipPosition(event: ReactPointerEvent<SVGPathElement>): { x: number; y: number } {
    const chart = chartRef.current;

    if (chart === null) {
      return { x: 0, y: 0 };
    }

    const bounds = chart.getBoundingClientRect();

    return {
      x: event.clientX - bounds.left + 14,
      y: event.clientY - bounds.top + 14,
    };
  }

  useEffect(() => {
    setHoveredSlice(null);
  }, [root]);

  const slices = useMemo(() => buildSunburstSlices(root, CHART_RADIUS), [root]);

  const arcGenerator = useMemo(
    () =>
      arc<SunburstSlice>()
        .startAngle((slice: SunburstSlice) => slice.startAngle)
        .endAngle((slice: SunburstSlice) => slice.endAngle)
        .innerRadius((slice: SunburstSlice) => slice.innerRadius)
        .outerRadius((slice: SunburstSlice) => slice.outerRadius - 1)
        .padAngle(0.004)
        .padRadius(10),
    []
  );

  const tooltipSlice = hoveredSlice?.slice ?? null;
  const labeledSlices = slices.filter(canRenderSliceLabel);
  const hasMissingAllocationResidual = slices.some((slice) => slice.isResidual && slice.residualKind === 'missing_allocation');
  const hasDirectPositionResidual = slices.some((slice) => slice.isResidual && slice.residualKind === 'direct_position');

  if (root === null || slices.length === 0) {
    return (
      <div className="sunburst-empty-state">
        <p>{hint}</p>
      </div>
    );
  }

  return (
    <div className="sunburst-chart" ref={chartRef}>
      <svg
        aria-label={title}
        className="sunburst-chart__svg"
        viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`}
        role="img"
      >
        <g transform={`translate(${VIEWBOX_SIZE / 2}, ${VIEWBOX_SIZE / 2})`}>
          <circle className="sunburst-chart__center" r={CHART_RADIUS * 0.32} />
          <text className="sunburst-chart__center-label" textAnchor="middle" y="-12">
            {title}
          </text>
          <text className="sunburst-chart__center-value" textAnchor="middle" y="18">
            {formatPercentageValue(1)} Gesamt
          </text>

          {slices.map((slice) => {
            const isActive = tooltipSlice?.path === slice.path;
            const fillLevel = Math.min(slice.depth, 5);
            const segmentClassName = [
              'sunburst-chart__segment',
              slice.isResidual ? 'sunburst-chart__segment--residual' : '',
              isActive ? 'sunburst-chart__segment--active' : '',
            ].filter(Boolean).join(' ');
            const fill = slice.isResidual
              ? slice.residualKind === 'direct_position'
                ? 'var(--sunburst-direct-fill)'
                : 'var(--sunburst-residual-fill)'
              : `var(--sunburst-depth-${fillLevel})`;

            return (
              <path
                key={slice.path}
                className={segmentClassName}
                data-residual-kind={slice.residualKind}
                d={arcGenerator(slice) ?? undefined}
                style={{ fill }}
                onPointerEnter={(event) => {
                  const pointer = getTooltipPosition(event);
                  setHoveredSlice({ slice, ...pointer });
                }}
                onPointerMove={(event) => {
                  const pointer = getTooltipPosition(event);
                  setHoveredSlice({ slice, ...pointer });
                }}
                onPointerLeave={() => setHoveredSlice(null)}
              />
            );
          })}

          {labeledSlices.map((slice) => {
            const [labelX, labelY] = arcGenerator.centroid(slice);

            return (
              <text
                key={`${slice.path}__label`}
                className={[
                  'sunburst-chart__slice-label',
                  slice.isResidual ? 'sunburst-chart__slice-label--residual' : '',
                ].filter(Boolean).join(' ')}
                textAnchor="middle"
                x={labelX}
                y={labelY}
              >
                {getSliceLabel(slice)}
              </text>
            );
          })}
        </g>
      </svg>

      {tooltipSlice === null ? <p className="sunburst-tooltip__hint">Hover auf ein Segment zeigt Label und Prozentwerte.</p> : null}
      {hasMissingAllocationResidual || hasDirectPositionResidual ? (
        <div className="sunburst-chart__legend">
          {hasMissingAllocationResidual ? (
            <p className="sunburst-chart__legend-item">
              <span className="sunburst-chart__legend-mark sunburst-chart__legend-mark--missing" aria-hidden="true" />
              Orange gestrichelt markiert fehlende Allokation im Parent.
            </p>
          ) : null}
          {hasDirectPositionResidual ? (
            <p className="sunburst-chart__legend-item">
              <span className="sunburst-chart__legend-mark sunburst-chart__legend-mark--direct" aria-hidden="true" />
              Blau gestrichelt markiert Direktpositionen auf dem Parent.
            </p>
          ) : null}
        </div>
      ) : null}

      {hoveredSlice !== null ? (
        <div className="sunburst-tooltip sunburst-tooltip--cursor" aria-live="polite" style={{ left: hoveredSlice.x, top: hoveredSlice.y }}>
          <p className="sunburst-tooltip__label">{tooltipSlice?.label}</p>
          {tooltipSlice?.isResidual ? <p className="sunburst-tooltip__status">{getResidualHint(tooltipSlice)}</p> : null}
          <div className="sunburst-tooltip__row">
            <span>Anteil gesamt</span>
            <strong>{formatPercentageValue(tooltipSlice?.pctTotal)}</strong>
          </div>
          <div className="sunburst-tooltip__row">
            <span>{tooltipSlice?.isResidual ? getResidualParentCaption(tooltipSlice) : 'Anteil Parent'}</span>
            <strong>{formatPercentageValue(tooltipSlice?.pctOfParent)}</strong>
          </div>
        </div>
      ) : null}
    </div>
  );
}
