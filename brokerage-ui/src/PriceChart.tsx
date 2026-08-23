import type { Quote } from './types.js';

interface PriceChartProps {
  quotes: Quote[];
}

export function PriceChart({ quotes }: PriceChartProps) {
  if (quotes.length < 2) {
    return <div className="chart-empty">価格データを集めています…</div>;
  }
  const width = 720;
  const height = 240;
  const padding = 18;
  const prices = quotes.map((quote) => quote.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = Math.max(1, max - min);
  const points = quotes
    .map((quote, index) => {
      const x = padding + (index / (quotes.length - 1)) * (width - padding * 2);
      const y = padding + ((max - quote.price) / range) * (height - padding * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  const fillPoints = `${padding},${height - padding} ${points} ${width - padding},${height - padding}`;

  return (
    <svg
      className="price-chart"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="価格推移"
    >
      <defs>
        <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5eead4" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#5eead4" stopOpacity="0" />
        </linearGradient>
      </defs>
      <line
        x1={padding}
        y1={height / 2}
        x2={width - padding}
        y2={height / 2}
        className="chart-grid"
      />
      <polygon points={fillPoints} fill="url(#chartFill)" />
      <polyline points={points} className="chart-line" />
      <text x={padding} y={15} className="chart-label">
        {max.toLocaleString('ja-JP')}円
      </text>
      <text x={padding} y={height - 4} className="chart-label">
        {min.toLocaleString('ja-JP')}円
      </text>
    </svg>
  );
}
