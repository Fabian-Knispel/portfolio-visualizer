import type { CompareRow } from '../domain/portfolio-model';

interface CompareTableProps {
  compareRows: CompareRow[];
}

function trimTrailingZeros(numStr: string): string {
  return numStr.replace(/(\.[0-9]*?)0+$/, '$1').replace(/\.$/, '');
}

function formatStoredPercent(value: number | undefined): string {
  return value === undefined ? '—' : `${trimTrailingZeros(value.toFixed(2))} %`;
}

function formatRatioPercent(value: number | undefined): string {
  return value === undefined ? '—' : `${trimTrailingZeros((value * 100).toFixed(2))} %`;
}

function formatCompareStatus(status: string): string {
  const labels: Record<string, string> = {
    correct: '✓ Korrekt',
    underweighted: '↓ Untergewichtet',
    overweighted: '↑ Übergewichtet',
    missing_in_ist: '— Fehlt im IST',
    extra_in_ist: '— Extra im IST',
  };

  return labels[status] ?? status;
}

export function CompareTable({ compareRows }: CompareTableProps) {
  return (
    <div className="compare-table-container">
      <table className="compare-table">
        <thead>
          <tr>
            <th>Struktur / Knoten</th>
            <th className="text-right">Anteil gesamt Soll</th>
            <th className="text-right">Anteil Parent Soll</th>
            <th className="text-right">Anteil gesamt Ist</th>
            <th className="text-right">Anteil Parent Ist</th>
            <th className="text-right">Abweichung (pp)</th>
          </tr>
        </thead>
        <tbody>
          {compareRows.map((row) => {
            const indent = Math.min(row.depth * 16, 64);
            const deltaPrefix = row.deltaPctPoints >= 0 ? '+' : '';
            const deltaText = `${deltaPrefix}${trimTrailingZeros((row.deltaPctPoints * 100).toFixed(2))} pp`;

            return (
              <tr key={row.path}>
                <td>
                  <div className="compare-table__cell--label">
                    <span className="compare-table__indent" style={{ width: `${indent}px` }} />
                    <span className="compare-table__status-dot" data-status={row.status} title={formatCompareStatus(row.status)} />
                    <span>{row.label}</span>
                    <span className="compare-table__status-text">({formatCompareStatus(row.status)})</span>
                  </div>
                </td>
                <td className="text-right">{formatRatioPercent(row.sollTargetPct)}</td>
                <td className="text-right">{formatStoredPercent(row.sollPctOfParent)}</td>
                <td className="text-right">{formatRatioPercent(row.istPct)}</td>
                <td className="text-right">{formatRatioPercent(row.istPctOfParent)}</td>
                <td className="text-right">
                  <span className="compare-table__delta" data-status={row.status}>
                    {row.status === 'missing_in_ist' ? '— Fehlt' : row.status === 'extra_in_ist' ? '+ Extra' : deltaText}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
