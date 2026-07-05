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

            return (
              <path
                key={slice.path}
                className={`sunburst-chart__segment ${isActive ? 'sunburst-chart__segment--active' : ''}`}
                d={arcGenerator(slice) ?? undefined}
                style={{ fill: `var(--sunburst-depth-${fillLevel})` }}
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
        </g>
      </svg>

      {tooltipSlice === null ? <p className="sunburst-tooltip__hint">Hover auf ein Segment zeigt Label und Prozentwerte.</p> : null}

      {hoveredSlice !== null ? (
        <div className="sunburst-tooltip sunburst-tooltip--cursor" aria-live="polite" style={{ left: hoveredSlice.x, top: hoveredSlice.y }}>
          <p className="sunburst-tooltip__label">{tooltipSlice?.label}</p>
          <div className="sunburst-tooltip__row">
            <span>Anteil gesamt</span>
            <strong>{formatPercentageValue(tooltipSlice?.pctTotal)}</strong>
          </div>
          <div className="sunburst-tooltip__row">
            <span>Anteil Parent</span>
            <strong>{formatPercentageValue(tooltipSlice?.pctOfParent)}</strong>
          </div>
        </div>
      ) : null}
    </div>
  );
}
