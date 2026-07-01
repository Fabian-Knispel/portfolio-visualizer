import { useEffect, useMemo, useState } from 'react';
import { arc, scaleOrdinal, schemeTableau10 } from 'd3';

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
}

const VIEWBOX_SIZE = 720;
const CHART_RADIUS = VIEWBOX_SIZE / 2 - 24;

export function PortfolioSunburst({ root, title, hint }: PortfolioSunburstProps) {
  const [hoveredSlice, setHoveredSlice] = useState<TooltipState | null>(null);

  useEffect(() => {
    setHoveredSlice(null);
  }, [root]);

  const slices = useMemo(() => buildSunburstSlices(root, CHART_RADIUS), [root]);
  const colorScale = useMemo(
    () => scaleOrdinal(schemeTableau10).domain(Array.from(new Set(slices.map((slice) => slice.branchPath)))),
    [slices]
  );

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
    <div className="sunburst-chart">
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

            return (
              <path
                key={slice.path}
                className={`sunburst-chart__segment ${isActive ? 'sunburst-chart__segment--active' : ''}`}
                d={arcGenerator(slice) ?? undefined}
                fill={colorScale(slice.branchPath)}
                onPointerEnter={() => setHoveredSlice({ slice })}
                onPointerLeave={() => setHoveredSlice(null)}
              />
            );
          })}
        </g>
      </svg>

      <div className="sunburst-tooltip" aria-live="polite">
        {tooltipSlice === null ? (
          <p className="sunburst-tooltip__hint">Hover auf ein Segment zeigt Label und Prozentwerte.</p>
        ) : (
          <>
            <p className="sunburst-tooltip__label">{tooltipSlice.label}</p>
            <div className="sunburst-tooltip__row">
              <span>Anteil gesamt</span>
              <strong>{formatPercentageValue(tooltipSlice.pctTotal)}</strong>
            </div>
            <div className="sunburst-tooltip__row">
              <span>Anteil Parent</span>
              <strong>{formatPercentageValue(tooltipSlice.pctOfParent)}</strong>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
